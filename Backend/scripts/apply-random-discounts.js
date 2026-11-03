/* Preview: node scripts/apply-random-discounts.js
 * Apply:   node scripts/apply-random-discounts.js --apply
 * Existing discounts are preserved on repeat runs.
 */
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");
const prisma = require("../src/config/database");
const { productPricing } = require("../src/utils/pricing.utils");

async function main() {
    const products = await prisma.product.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true, price: true, originalPrice: true, discountPercent: true }
    });
    const changes = products.filter(product => product.discountPercent === 0).map(product => ({
        before: product,
        after: productPricing({ discountPercent: randomInt(10, 51) }, product)
    }));
    if (!process.argv.includes("--apply")) {
        console.log(JSON.stringify({ mode: "preview", eligible: changes.length, sample: changes.slice(0, 4) }, null, 2));
        return;
    }
    if (!changes.length) {
        console.log("No products without discounts; existing discounts preserved.");
        return;
    }
    const backupDirectory = path.join(__dirname, "../prisma/pricing-backups");
    fs.mkdirSync(backupDirectory, { recursive: true });
    const backupPath = path.join(backupDirectory, `${new Date().toISOString().replace(/[:.]/g, "-")}-random-discounts.json`);
    const report = { createdAt: new Date().toISOString(), status: "prepared", changes };
    fs.writeFileSync(backupPath, JSON.stringify(report, null, 2));
    await prisma.$transaction(async tx => {
        for (const { before, after } of changes) {
            const result = await tx.product.updateMany({
                where: { id: before.id, price: before.price, originalPrice: before.originalPrice, discountPercent: before.discountPercent },
                data: after
            });
            if (result.count !== 1) throw new Error(`Product ${before.id} changed during update; no discounts applied.`);
        }
    }, { timeout: 30000 });
    report.status = "applied";
    fs.writeFileSync(backupPath, JSON.stringify(report, null, 2));
    const saved = await prisma.product.findMany({
        where: { id: { in: changes.map(change => change.before.id) } },
        select: { id: true, price: true, originalPrice: true, discountPercent: true }
    });
    const expected = new Map(changes.map(change => [change.before.id, change.after]));
    for (const product of saved) {
        const pricing = expected.get(product.id);
        if (Number(product.price) !== pricing.price || Number(product.originalPrice) !== pricing.originalPrice || product.discountPercent !== pricing.discountPercent) {
            throw new Error(`Verification failed for product ${product.id}. Backup: ${backupPath}`);
        }
    }
    console.log(JSON.stringify({ updated: saved.length, minDiscount: Math.min(...saved.map(p => p.discountPercent)), maxDiscount: Math.max(...saved.map(p => p.discountPercent)), verified: true, backupPath }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
