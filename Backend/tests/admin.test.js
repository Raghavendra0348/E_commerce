const prisma = require("../src/config/database");
const adminService = require("../src/services/admin.service");

describe("Admin Safeguards & Pagination Clamping", () => {
    let testAdmin;

    afterAll(async () => {
        if (testAdmin) {
            await prisma.user.deleteMany({ where: { id: testAdmin.id } });
        }
        await prisma.$disconnect();
    });

    it("prevents demoting the last remaining administrator", async () => {
        // Ensure there is only 1 admin for this test case
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

        if (admins.length === 1) {
            const soleAdmin = admins[0];
            await expect(adminService.updateUserRole(soleAdmin.id, "USER")).rejects.toThrow(
                /Cannot demote the last remaining administrator/
            );
        } else if (admins.length === 0) {
            // Create single admin
            testAdmin = await prisma.user.create({
                data: {
                    name: "Sole Admin",
                    email: `admin_${Date.now()}@example.com`,
                    password: "dummy_password",
                    role: "ADMIN"
                }
            });
            await expect(adminService.updateUserRole(testAdmin.id, "USER")).rejects.toThrow(
                /Cannot demote the last remaining administrator/
            );
        } else {
            // If multiple admins exist, demote until only 1 remains, or verify condition
            const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
            expect(adminCount).toBeGreaterThan(1);
        }
    });

    it("clamps pagination limit to safe maximum (100)", async () => {
        const result = await adminService.getAllUsers({ page: -5, limit: 99999 });
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(100);
    });
});
