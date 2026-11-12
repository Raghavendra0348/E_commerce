const { spawnSync } = require("child_process");

function start({ run = spawnSync, boot = () => require("./server") } = {}) {
    const result = run(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], {
        stdio: "inherit", env: process.env
    });
    if (result.error || result.status !== 0) throw new Error("Database migrations failed; the API was not started", { cause: result.error });
    return boot();
}

if (require.main === module) {
    try { start(); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { start };
