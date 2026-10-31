const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moves = {
  'wireless-bluetooth-headphones': ['electronics', 'audio'],
  'portable-bluetooth-speaker': ['electronics', 'audio'],
  '20000mah-power-bank': ['electronics', 'mobiles-accessories'],
  'usb-c-fast-charger': ['electronics', 'mobiles-accessories'],
  'usb-c-hub-7-in-1': ['electronics', 'computers-accessories'],
  'webcam-full-hd': ['electronics', 'computers-accessories'],
  'wireless-mouse': ['electronics', 'computers-accessories'],
  'analog-wrist-watch': ['fashion', 'wearables'],
  'everyday-backpack': ['fashion', 'bags-luggage'],
};
const merges = { laptops: 'computers-accessories', 'grocery-essentials': 'home-kitchen' };
async function main() {
  const apply = process.argv.includes('--apply');
  const result = await prisma.$transaction(async tx => {
    const categories = await tx.category.findMany({ orderBy: { id: 'asc' } });
    const products = await tx.product.findMany({ select: { id: true, slug: true, categoryId: true }, orderBy: { id: 'asc' } });
    const byId = new Map(categories.map(c => [c.id, c]));
    const bySlug = new Map(categories.map(c => [c.slug, c]));
    const changes = [];
    for (const product of products) {
      const source = byId.get(product.categoryId).slug;
      const rule = moves[product.slug];
      const target = merges[source] || (rule && rule[0] === source ? rule[1] : null);
      if (!target) continue;
      const category = bySlug.get(target);
      if (!category) throw new Error(`Missing target category: ${target}`);
      changes.push({ ...product, from: source, to: target, targetId: category.id });
    }
    const removed = categories.filter(c => merges[c.slug]);
    const report = { applied: apply, changes, removed, before: { categories, products } };
    if (apply && (changes.length || removed.length)) {
      const reportPath = path.join(__dirname, '../prisma', `category-cleanup-backup-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { flag: 'wx' });
      for (const change of changes) {
        const updated = await tx.product.updateMany({ where: { id: change.id, categoryId: change.categoryId }, data: { categoryId: change.targetId } });
        if (updated.count !== 1) throw new Error(`Product changed during cleanup: ${change.slug}`);
      }
      for (const category of removed) {
        if (await tx.product.count({ where: { categoryId: category.id } })) throw new Error(`Category is not empty: ${category.slug}`);
        await tx.category.delete({ where: { id: category.id } });
      }
      if (await tx.product.count() !== products.length) throw new Error('Product count changed');
      report.backupPath = reportPath;
    }
    return report;
  }, { isolationLevel: 'Serializable', timeout: 20000 });
  console.log(JSON.stringify({ applied: result.applied, changes: result.changes, removed: result.removed.map(c => c.name), backupPath: result.backupPath }, null, 2));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
