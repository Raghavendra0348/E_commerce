const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const cloudinary = require("../src/config/cloudinary");

const directory = path.join(__dirname, "../downloads/home-inspiration");
const reportPath = path.join(directory, "upload-report.json");
const outputPath = path.join(__dirname, "../../Frontend/src/data/home-inspiration.json");
const apply = process.argv.includes("--apply");

async function fetchWithTimeout(url) {
    const hostname = new URL(url).hostname;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            if (attempt === 3) throw new Error(`Request to ${hostname} failed after three attempts: ${error.message}`, { cause: error });
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
}

async function main() {
    const sources = JSON.parse(await fs.readFile(path.join(directory, "sources.json"), "utf8"));
    if (sources.length !== 15 || new Set(sources.map(item => item.key)).size !== 15) throw new Error("Expected 15 unique photos.");
    if (!apply) {
        console.table(sources.map(({ key, search }) => ({ key, search })));
        console.log("Use --apply to download and upload the 15 photos.");
        return;
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new Error("Cloudinary credentials are not configured.");
    let report = [];
    try { report = JSON.parse(await fs.readFile(reportPath, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
    for (const item of sources) {
        if (!/^[a-z-]+$/.test(item.key) || !/^photo-[\d]+-[a-f\d]+$/.test(item.photo)) throw new Error("Invalid source entry.");
        const catalogue = await (await fetchWithTimeout(`http://localhost:5000/api/products?limit=1&search=${encodeURIComponent(item.search)}`)).json();
        if (!catalogue.data?.length) throw new Error(`No existing catalogue matches for ${item.key}`);
        if (report.some(saved => saved.key === item.key && saved.photo === item.photo)) continue;
        const downloadUrl = `https://images.unsplash.com/${item.photo}?auto=format&fit=max&w=1000&q=85&fm=jpg`;
        const response = await fetchWithTimeout(downloadUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 1000 || buffer.length > 12 * 1024 * 1024 || buffer[0] !== 255 || buffer[1] !== 216) throw new Error(`Invalid JPEG for ${item.key}`);
        const filename = `${item.key}.jpg`;
        const filePath = path.join(directory, filename);
        await fs.writeFile(filePath, buffer);
        const uploaded = await cloudinary.uploader.upload(filePath, {
            public_id: `ecommerce/home/inspiration/${item.key}`,
            resource_type: "image", overwrite: false,
        });
        if (!uploaded.secure_url?.startsWith("https://res.cloudinary.com/")) throw new Error(`Missing upload URL for ${item.key}`);
        report.push({ ...item, filename, downloadUrl, sha256: crypto.createHash("sha256").update(buffer).digest("hex"), url: uploaded.secure_url, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height, usage: "Editorial shopping illustration; not an exact SKU photograph", uploadedAt: new Date().toISOString() });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
        console.log(`Uploaded ${item.key}: ${uploaded.width}x${uploaded.height}`);
    }
    const assets = sources.map(item => {
        const saved = report.find(entry => entry.key === item.key && entry.photo === item.photo);
        if (!saved) throw new Error(`Upload missing for ${item.key}`);
        return { key: item.key, label: item.label, search: item.search, url: saved.url, sourceUrl: item.sourceUrl };
    });
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(assets, null, 2) + "\n");
    console.log(`Connected ${assets.length} Cloudinary photos to the frontend asset manifest.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
