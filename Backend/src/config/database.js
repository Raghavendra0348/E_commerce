require("./loadEnv");
const { PrismaClient } = require("@prisma/client");

// Allow a suspended Neon compute time to wake up on the first request.
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    const url = new URL(databaseUrl);
    if (url.hostname.endsWith(".neon.tech") && !url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "15");
        databaseUrl = url.toString();
    }
}
const prisma = new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);

module.exports = prisma;
