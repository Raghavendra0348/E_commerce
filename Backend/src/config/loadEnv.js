const path = require("node:path");
const dotenv = require("dotenv");

// Explicit hosting variables win, followed by Neon's root env and backend defaults.
const root = path.resolve(__dirname, "../../..");
for (const file of [".env.local", ".env", "Backend/.env"]) {
    dotenv.config({ path: path.join(root, file) });
}
