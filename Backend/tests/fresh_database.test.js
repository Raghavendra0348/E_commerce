const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ quiet: true });

describe("Fresh database schema deployment", () => {
    it("applies the complete migration chain to an empty isolated schema", async () => {
        const schema = `startup_test_${crypto.randomUUID().replaceAll("-", "")}`;
        const connection = new URL(process.env.DATABASE_URL);
        connection.searchParams.set("schema", schema);
        if (!/^startup_test_[a-f0-9]{32}$/.test(schema)) throw new Error("Invalid temporary schema name");
        const client = new PrismaClient({ datasourceUrl: connection.toString() });
        try {
            execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], {
                env: { ...process.env, DATABASE_URL: connection.toString() }, stdio: "pipe", timeout: 15000
            });
            expect(await client.user.count()).toBe(0);
            expect(await client.refundAttempt.count()).toBe(0);
            const applied = await client.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL');
            expect(applied[0].count).toBeGreaterThanOrEqual(10);
        } finally {
            // The identifier is generated here, and only the temporary schema is removed.
            await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
            await client.$disconnect();
        }
    });
});
