const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const root = path.resolve(__dirname, "../..");
const envModule = path.join(root, "Backend/src/config/env.js");

describe("Production signing secret configuration", () => {
    const base = {
        ...process.env, NODE_ENV: "production", DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        JWT_SECRET: "test-only-access-signing-key-32-characters", JWT_REFRESH_SECRET: "test-only-refresh-signing-key-32-characters",
        RAZORPAY_KEY_ID: "rzp_test_fixture", RAZORPAY_KEY_SECRET: "test-only-payment-secret", RAZORPAY_WEBHOOK_SECRET: "test-only-webhook-secret",
        CLOUDINARY_CLOUD_NAME: "", CLOUDINARY_API_KEY: "", CLOUDINARY_API_SECRET: ""
    };
    const validateEnv = changes => spawnSync(process.execPath, ["-e", `require(${JSON.stringify(envModule)})`], { cwd: root, env: { ...base, ...changes }, encoding: "utf8" });
    it("rejects the previous public Compose defaults", () => {
        const result = validateEnv({ JWT_SECRET: "super_secure_jwt_secret_for_production_auth_key", JWT_REFRESH_SECRET: "super_secure_refresh_secret_production_key" });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("unique random production secret");
    });
    it("rejects empty, short and identical production signing keys", () => {
        for (const changes of [{ JWT_SECRET: "" }, { JWT_SECRET: "short-secret-1234" }, { JWT_REFRESH_SECRET: base.JWT_SECRET }]) {
            expect(validateEnv(changes).status).toBe(1);
        }
    });
    it("accepts distinct sufficiently long explicitly supplied keys", () => {
        expect(validateEnv({}).status).toBe(0);
    });
    it("requires Compose secrets and excludes backend environment files from runtime copies", () => {
        const compose = fs.readFileSync(path.join(root, "docker-compose.yml"), "utf8");
        expect(compose).toMatch(/JWT_SECRET:\s*\$\{JWT_SECRET:\?/);
        expect(compose).toMatch(/JWT_REFRESH_SECRET:\s*\$\{JWT_REFRESH_SECRET:\?/);
        expect(compose).toContain("RAZORPAY_WEBHOOK_SECRET:");
        const dockerfile = fs.readFileSync(path.join(root, "Backend/Dockerfile"), "utf8");
        expect(dockerfile).not.toMatch(/^COPY\s+\.\s+\./m);
        expect(dockerfile).toMatch(/^COPY src /m);
        for (const project of ["Backend", "Frontend"]) {
            const ignore = fs.readFileSync(path.join(root, project, ".dockerignore"), "utf8");
            expect(ignore.split(/\r?\n/)).toEqual(expect.arrayContaining([".env", ".env.*", "node_modules"]));
        }
    });
});
