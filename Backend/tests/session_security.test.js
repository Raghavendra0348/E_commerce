const crypto = require("crypto");
const request = require("supertest");
const prisma = require("../src/config/database");
const app = require("../src/app");
const auth = require("../src/services/auth.service");
const admin = require("../src/services/admin.service");
const { generateAccessToken } = require("../src/utils/jwt.utils");

describe("Current-role authorisation and immediate session revocation", () => {
    const ids = [];
    async function account(role = "USER") {
        const result = await auth.register({ name: "Session regression", email: `session-regression-${crypto.randomUUID()}@example.com`, password: "Password@123" });
        ids.push(result.user.id);
        if (role === "ADMIN") await prisma.user.update({ where: { id: result.user.id }, data: { role } });
        return { ...result, accessToken: generateAccessToken(result.user.id, role) };
    }
    afterAll(async () => {
        await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
        await prisma.$disconnect();
    });
    it("rejects an administrator's existing token immediately after demotion", async () => {
        const user = await account("ADMIN");
        await account("ADMIN"); // Never rely on or modify existing administrators.
        await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${user.accessToken}`).expect(200);
        await admin.updateUserRole(user.user.id, "USER");
        await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${user.accessToken}`).expect(401);
        await expect(auth.refreshSession(user.refreshToken)).rejects.toThrow(/revoked/);
    });
    it("uses the database role even when the signed token still claims ADMIN", async () => {
        const user = await account("ADMIN");
        await prisma.user.update({ where: { id: user.user.id }, data: { role: "USER" } });
        await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${user.accessToken}`).expect(403);
    });
    it("invalidates access and refresh tokens immediately on logout-all", async () => {
        const user = await account();
        await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${user.accessToken}`).expect(200);
        await auth.logoutAll(user.user.id);
        await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${user.accessToken}`).expect(401);
        await expect(auth.refreshSession(user.refreshToken)).rejects.toThrow();
    });
    it("invalidates old access tokens after a password change and permits a new login", async () => {
        const user = await account();
        await auth.changePassword(user.user.id, "Password@123", "ChangedPassword@456");
        await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${user.accessToken}`).expect(401);
        const next = await auth.login({ email: user.user.email, password: "ChangedPassword@456" });
        await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${next.accessToken}`).expect(200);
    });
    it("rejects tokens for deleted users", async () => {
        const user = await account();
        await prisma.user.delete({ where: { id: user.user.id } });
        await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${user.accessToken}`).expect(401);
    });
});
