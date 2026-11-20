import { defineConfig } from "prisma/config";
import "./src/config/loadEnv";

export default defineConfig({
    engine: "classic",
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    datasource: {
        // Migrations need a direct connection; local Postgres can use its normal URL.
        url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
    },
});
