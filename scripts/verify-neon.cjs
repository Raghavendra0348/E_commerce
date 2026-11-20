// Runs the built storefront, API, and real database; removes its own test account.
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { randomUUID } = require("node:crypto");
require("../Backend/src/config/loadEnv");
const prisma = require("../Backend/src/config/database");
const app = require("../Backend/src/app");

async function main() {
    const host = new URL(process.env.DATABASE_URL).hostname;
    assert(host.endsWith(".neon.tech"), "Expected a Neon database");
    console.log(`Database: ${host} (credentials hidden)`);
    const email = `neon-smoke-${randomUUID()}@example.com`;
    const password = `Smoke9-${randomUUID()}`;
    const api = await new Promise(resolve => {
        const server = app.listen(0, "127.0.0.1", () => resolve(server));
    });
    let frontend;
    try {
        const vite = await import(pathToFileURL(path.resolve(__dirname, "../Frontend/node_modules/vite/dist/node/index.js")));
        frontend = await vite.preview({
            root: path.resolve(__dirname, "../Frontend"),
            configFile: false,
            preview: {
                host: "127.0.0.1", port: 0,
                proxy: { "/api": `http://127.0.0.1:${api.address().port}` },
            },
        });
        const origin = `http://127.0.0.1:${frontend.httpServer.address().port}`;
        async function request(route, method = "GET", body, token) {
            const response = await fetch(`${origin}${route}`, {
                method,
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                ...(body ? { body: JSON.stringify(body) } : {}),
            });
            assert(response.ok, `${method} ${route}: HTTP ${response.status}`);
            return response.json();
        }
        const html = await fetch(origin);
        assert(html.ok && (await html.text()).includes('id="root"'));
        console.log("PASS built storefront HTTP 200");
        const health = await request("/api/health/ready");
        assert.equal(health.database.status, "connected");
        console.log("PASS storefront proxy -> API -> Neon readiness HTTP 200");
        await request("/api/products?limit=1");
        console.log(`PASS catalog query HTTP 200 (${await prisma.product.count()} products)`);
        await request("/api/auth/register", "POST", { name: "Neon Smoke", email, password });
        assert(await prisma.user.findUnique({ where: { email } }));
        console.log("PASS registration persisted in Neon");
        const login = await request("/api/auth/login", "POST", { email, password });
        const token = login.data.accessToken;
        assert(token);
        const profile = await request("/api/auth/profile", "GET", null, token);
        assert.equal(profile.data.email, email);
        await request("/api/auth/profile", "PUT", { name: "Neon Verified" }, token);
        const updated = await request("/api/auth/profile", "GET", null, token);
        assert.equal(updated.data.name, "Neon Verified");
        console.log("PASS login, authenticated profile update and persisted readback");
    } finally {
        await prisma.user.deleteMany({ where: { email } });
        console.log("PASS temporary test account cleaned up");
        if (frontend) await new Promise(resolve => frontend.httpServer.close(resolve));
        await new Promise(resolve => api.close(resolve));
        await prisma.$disconnect();
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
