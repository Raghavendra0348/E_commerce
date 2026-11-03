import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { stripVTControlCharacters } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const windows = process.platform === "win32";
const children = new Set();
let stopping = false;

function pipeLogs(stream, name, output) {
  const label = `[${name.toLowerCase()}]`;
  const color = name === "Frontend" ? "\u001b[36m" : "\u001b[35m";
  const supportsColor = output.isTTY || (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== "0");
  const prefix = supportsColor && !Object.hasOwn(process.env, "NO_COLOR") && process.env.FORCE_COLOR !== "0"
    ? `${color}${label}\u001b[0m`
    : label;
  // Read complete lines so split chunks and multiline QR output stay readable.
  const lines = createInterface({ input: stream, crlfDelay: Infinity, terminal: false });
  lines.on("line", line => {
    const plain = stripVTControlCharacters(line);
    // QR rows share foreground/background state across lines. Keep their ANSI
    // output intact instead of inserting a label that would reset those colors.
    const qrOrBlank = !plain.trim() || /^[\s█▀▄]+$/u.test(plain);
    output.write(qrOrBlank ? `${line}\n` : `${prefix} ${line}\n`);
  });
}

function stopChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  if (windows) {
    // Kill only the process tree started here, including nodemon's Node child.
    return new Promise(done => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("error", () => { child.kill(); done(); });
      killer.once("close", done);
    });
  }
  return new Promise(done => {
    const timeout = setTimeout(() => {
      try { process.kill(-child.pid, "SIGKILL"); } catch { /* Already stopped. */ }
      done();
    }, 5000);
    child.once("exit", () => { clearTimeout(timeout); done(); });
    try { process.kill(-child.pid, "SIGTERM"); }
    catch { clearTimeout(timeout); done(); }
  });
}

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  console.log("\n[dev] Stopping frontend and backend...");
  await Promise.all([...children].map(stopChild));
  process.exit(code);
}

function start(name, folder, executable, args) {
  const child = spawn(process.execPath, [executable, ...args], {
    cwd: resolve(root, folder),
    stdio: ["inherit", "pipe", "pipe"],
    windowsHide: true,
    detached: !windows,
  });
  children.add(child);
  pipeLogs(child.stdout, name, process.stdout);
  pipeLogs(child.stderr, name, process.stderr);
  child.once("error", error => {
    console.error(`[dev] Could not start ${name}: ${error.message}`);
    void stop(1);
  });
  child.once("exit", (code, signal) => {
    if (stopping) return;
    console.log(`[dev] ${name} stopped (${signal || `exit ${code}`}).`);
    void stop(code === 0 ? 0 : 1);
  });
}

const backend = resolve(root, "Backend/node_modules/nodemon/bin/nodemon.js");
const frontend = resolve(root, "Frontend/node_modules/vite/bin/vite.js");
for (const [folder, executable] of [["Backend", backend], ["Frontend", frontend]]) {
  if (!existsSync(executable)) {
    console.error(`[dev] Missing ${folder} dependencies. Run: npm install --prefix ${folder}`);
    process.exit(1);
  }
}

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
console.log("[dev] Starting backend and frontend. The storefront will open in your default browser.");
console.log("[dev] Press Ctrl+C once to stop both servers.\n");
start("Backend", "Backend", backend, ["src/server.js"]);
// Vite opens the resolved URL after listening, including any fallback port.
start("Frontend", "Frontend", frontend, ["--open", "--clearScreen", "false", ...process.argv.slice(2)]);
