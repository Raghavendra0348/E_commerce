const prisma = require("../src/config/database");
const authService = require("../src/services/auth.service");

describe("Auth Hardening & Token Security", () => {
    const testEmail = `authtest_${Date.now()}@example.com`;
    const password = "Password@123";
    let userId;
    let initialRefreshToken;

    afterAll(async () => {
        if (userId) {
            await prisma.refreshToken.deleteMany({ where: { userId } });
            await prisma.user.deleteMany({ where: { id: userId } });
        }
        await prisma.$disconnect();
    });

    it("registers user and stores SHA-256 hashed refresh token in database", async () => {
        const result = await authService.register(
            { name: "Auth Tester", email: testEmail, password, phone: "9876543210" },
            { userAgent: "Vitest/1.0", ipAddress: "127.0.0.1" }
        );

        expect(result.user).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        userId = result.user.id;
        initialRefreshToken = result.refreshToken;

        // Verify that raw token is NOT in database, but the SHA-256 hash IS
        const rawTokenInDb = await prisma.refreshToken.findUnique({
            where: { token: initialRefreshToken }
        });
        expect(rawTokenInDb).toBeNull();

        const hashed = authService.hashToken(initialRefreshToken);
        const hashedTokenInDb = await prisma.refreshToken.findUnique({
            where: { token: hashed }
        });
        expect(hashedTokenInDb).not.toBeNull();
        expect(hashedTokenInDb.userId).toBe(userId);
        expect(hashedTokenInDb.revokedAt).toBeNull();
    });

    it("refreshes session and rotates token atomically", async () => {
        const refreshed = await authService.refreshSession(initialRefreshToken, {
            userAgent: "Vitest/1.0",
            ipAddress: "127.0.0.1"
        });

        expect(refreshed.accessToken).toBeDefined();
        expect(refreshed.refreshToken).toBeDefined();
        expect(refreshed.refreshToken).not.toBe(initialRefreshToken);

        // Verify old token is now revoked
        const oldHashed = authService.hashToken(initialRefreshToken);
        const oldRecord = await prisma.refreshToken.findUnique({ where: { token: oldHashed } });
        expect(oldRecord.revokedAt).not.toBeNull();

        // Verify new token exists and is active
        const newHashed = authService.hashToken(refreshed.refreshToken);
        const newRecord = await prisma.refreshToken.findUnique({ where: { token: newHashed } });
        expect(newRecord.revokedAt).toBeNull();
    });

    it("detects token reuse and revokes all active sessions for that user", async () => {
        // Attempt to reuse the already rotated initialRefreshToken
        await expect(authService.refreshSession(initialRefreshToken)).rejects.toThrow(
            /Suspicious token reuse detected/
        );

        // Verify ALL active tokens for this user (including the rotated one) are now revoked
        const activeTokens = await prisma.refreshToken.findMany({
            where: { userId, revokedAt: null }
        });
        expect(activeTokens.length).toBe(0);
    });

    it("revokes all existing sessions when user changes password", async () => {
        // Log in to get an active token
        const loginRes = await authService.login({ email: testEmail, password });
        const activeHashed = authService.hashToken(loginRes.refreshToken);
        const activeBefore = await prisma.refreshToken.findUnique({ where: { token: activeHashed } });
        expect(activeBefore.revokedAt).toBeNull();

        // Change password
        const newPassword = "NewPassword@456";
        await authService.changePassword(userId, password, newPassword);

        // Verify previous active token was revoked
        const activeAfter = await prisma.refreshToken.findUnique({ where: { token: activeHashed } });
        expect(activeAfter.revokedAt).not.toBeNull();
    });
});
