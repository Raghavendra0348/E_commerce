const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const { generateSlug } = require('../src/utils/slug.utils');
const prisma = new PrismaClient();
const target = 13;
const catalog = {
'electronics': [
['Wi-Fi Smart Plug 16A',899,'Control connected appliances with scheduled switching and a Wi-Fi connection.'],
['Digital Alarm Clock with LED Display',649,'Bedside clock with a clear LED display, adjustable brightness and alarm settings.'],
['Portable Mini Projector',6999,'Compact projector with HDMI input for movies and presentations in dim rooms.'],
['Universal Travel Adapter',1299,'Multi-region travel adapter with USB charging ports for personal electronics.'],
['Rechargeable Emergency Lantern',799,'Portable LED lantern with a carry handle and rechargeable battery.'],
['Digital Kitchen Timer',349,'Compact countdown timer with a magnetic back and audible alerts.'],
['Indoor Wi-Fi Security Camera',2199,'Indoor camera with live viewing, motion alerts and a tabletop mounting base.'],
['Wireless Doorbell Kit',599,'Doorbell receiver and push button with selectable chimes for home entrances.'],
['Rechargeable AA Battery Pack',999,'Four rechargeable AA batteries supplied with a compatible charging unit.'],
['HDMI Cable 2 Metres',399,'Two-metre HDMI cable for connecting compatible displays and media devices.'],
['Digital Multimeter',749,'Handheld meter for checking voltage, resistance and electrical continuity.'],
['Motion Sensor Night Light',449,'Battery-powered light for cupboards and hallways with motion-triggered illumination.'],
],
'computers-accessories': [
['27-inch IPS Monitor',12999,'Full HD IPS desktop display with HDMI input and an adjustable tilt stand.'],
['External Hard Drive 2TB',6499,'Portable USB hard drive with 2TB capacity for backups and file storage.'],
],
'mobiles-accessories': [
['Foldable Mobile Phone Stand',299,'Adjustable folding stand for hands-free video calls and desk viewing.'],
['Magnetic Car Charger 15W',1499,'Vent-mounted wireless charging holder for compatible phones and magnetic cases.'],
['USB-C to USB-C Cable 2 Metres',399,'Two-metre charging and data cable with reinforced connectors.'],
['Waterproof Phone Pouch',249,'Clear sealed phone pouch with neck strap for splash protection during travel.'],
['Mobile Screen Cleaning Kit',199,'Microfibre cloth and cleaning accessories for phone screens and cases.'],
['3-in-1 Retractable Charging Cable',549,'Compact retractable cable with multiple connectors for everyday charging.'],
],
'fashion': [
['Linen Blend Casual Shirt',1199,'Breathable button-front shirt with a regular fit for everyday casual wear.'],
['Cotton Polo T-Shirt',699,'Short-sleeve cotton polo with a ribbed collar and two-button placket.'],
['Slim Fit Chino Trousers',1399,'Stretch cotton chinos with front pockets and a tapered everyday fit.'],
['Floral Printed Kurta',899,'Lightweight printed kurta with three-quarter sleeves for casual occasions.'],
['Straight Fit Cotton Palazzo',649,'Comfortable straight-leg palazzo trousers with an elasticated waist.'],
['Denim Casual Jacket',1799,'Button-front denim jacket with chest pockets and a regular fit.'],
['Lightweight Hooded Sweatshirt',1299,'Soft hooded sweatshirt with a front kangaroo pocket and ribbed cuffs.'],
['Canvas Slip-On Sneakers',999,'Everyday canvas shoes with slip-on construction and flexible soles.'],
['Woven Leather Belt',599,'Adjustable woven belt with a metal buckle for casual outfits.'],
['Cotton Printed Scarf',399,'Soft printed scarf for lightweight layering and everyday styling.'],
],
'home-kitchen': [
['Bamboo Chopping Board',599,'Durable bamboo food preparation board with a hanging hole.'],
['Silicone Cooking Utensil Set',799,'Heat-resistant cooking tools with comfortable handles for everyday meal preparation.'],
['Stainless Steel Cutlery Set',999,'Coordinated spoons, forks and knives for a six-person dining table.'],
['Glass Spice Jar Set',699,'Six clear spice jars with lids and a compact countertop storage rack.'],
],
'books': [
['Python Programming Starter Guide',499,'Introductory programming guide covering variables, loops, functions and practical exercises.'],
['SQL Practice Workbook',449,'Hands-on workbook covering database queries, joins and aggregation exercises.'],
['Web Design Basics',599,'Beginner reference covering HTML structure, CSS layouts and responsive design.'],
['Everyday Indian Cooking',699,'Recipe collection with home-style meals, pantry guides and preparation tips.'],
['World History Illustrated',899,'Illustrated overview of world civilizations, major events and historical timelines.'],
['Mindful Habits Journal',349,'Guided journal with daily reflection prompts and habit tracking pages.'],
['Nature Discovery for Children',399,'Illustrated introduction to plants, animals and outdoor observation for young readers.'],
['Practical Personal Budgeting',449,'Accessible workbook for tracking expenses, setting savings goals and planning a budget.'],
],
'beauty-personal-care': [
['Gentle Foaming Face Wash 150ml',299,'Daily rinse-off face wash with a light foaming texture for personal skincare routines.'],
['Hydrating Body Wash 250ml',349,'Liquid body cleanser with a fresh fragrance for daily shower use.'],
['Nourishing Hair Conditioner 200ml',299,'Rinse-out conditioner that helps detangle hair and improve manageability.'],
['Daily Care Shampoo 250ml',329,'Everyday shampoo for cleansing hair and scalp as part of a regular care routine.'],
['Lip Balm Duo',199,'Two portable lip balms with a smooth finish for everyday moisture care.'],
['Manicure Grooming Kit',499,'Compact nail care kit with clippers, a nail file and storage case.'],
['Makeup Brush Set',699,'Assorted face and eye makeup brushes supplied with a travel pouch.'],
['Wide Tooth Detangling Comb',149,'Wide-tooth comb with a comfortable handle for gentle hair detangling.'],
['Hand Cream Set 3 Pack',399,'Three travel-size hand creams for convenient everyday moisturising.'],
],
'sports-fitness': [
['Resistance Band Set',799,'Five exercise bands with handles and a carry pouch for variable-resistance workouts.'],
['Foam Roller 33cm',649,'Textured foam roller for stretching and warm-up routines.'],
['Cricket Tennis Ball Pack',299,'Pack of six tennis-style cricket balls for recreational play.'],
['Football Size 5',899,'Standard size-five recreational football for practice and casual matches.'],
['Table Tennis Bat Set',699,'Two table tennis bats and three balls for beginner practice.'],
['Adjustable Hand Grip Trainer',349,'Handheld grip trainer with adjustable resistance for progressive exercise.'],
['Push-Up Bar Pair',499,'Two stable push-up handles with non-slip grips for floor workouts.'],
['Swimming Goggles',449,'Adjustable swim goggles with a flexible strap and protective storage pouch.'],
],
 'toys-games': [
['Wooden Shape Sorting Box',599,'Colourful wooden sorting toy with matching shapes for supervised play.'],
['Die-Cast Vehicle Set',499,'Set of miniature metal-bodied toy vehicles for imaginative play.'],
['Kids Art and Craft Kit',799,'Assorted paper, colours and craft accessories for creative activities.'],
['Magnetic Drawing Board',449,'Reusable drawing board with a stylus and sliding eraser.'],
['Junior Chess Set',599,'Foldable chess board with a full set of pieces for learning and practice.'],
['Animal Figurine Collection',699,'Assorted animal figures for imaginative scenes and storytelling.'],
['Soft Plush Teddy Bear',649,'Soft fabric teddy bear with stitched details for cuddles and play.'],
['Domino Tile Set',349,'Classic domino tiles supplied in a storage box for family games.'],
['Kids Science Experiment Kit',999,'Beginner science activities with materials and instructions for adult-supervised experiments.'],
],
'home-appliances': [
['Two-Slice Pop-Up Toaster',1499,'Countertop toaster with adjustable browning and a removable crumb tray.'],
['Electric Rice Cooker 1.8L',2199,'Rice cooker with a removable cooking pot and keep-warm setting.'],
['Dry Iron 1000W',899,'Lightweight electric iron with temperature control for everyday garment care.'],
['Handheld Garment Steamer',1799,'Portable fabric steamer with a refillable water tank for garment refreshing.'],
['Compact Vacuum Cleaner',3499,'Home vacuum cleaner with reusable dust collection and basic cleaning attachments.'],
['Induction Cooktop 1800W',2499,'Countertop induction hob with power settings for compatible cookware.'],
['Hand Blender 250W',1199,'Immersion blender for soups and sauces with an easy-grip handle.'],
['Electric Sandwich Maker',1599,'Compact sandwich maker with non-stick plates and a locking handle.'],
['Personal Air Cooler',2999,'Small-room evaporative cooler with adjustable fan settings and a refillable tank.'],
],
'furniture': [
['Foldable Laptop Table',1299,'Portable folding table with a flat surface for working or reading.'],
['Two-Tier Bedside Table',2499,'Compact bedside table with an open storage shelf for daily essentials.'],
['Four-Shelf Shoe Rack',1799,'Freestanding shoe organiser with four open shelves for entryway storage.'],
['Upholstered Dining Chair',3499,'Padded dining chair with a fabric seat and sturdy support legs.'],
['Compact Coffee Table',3999,'Low-profile living room table with a lower shelf for books and accessories.'],
['Wall Mounted Display Shelf',1499,'Set of wall shelves with mounting hardware for small decorative items.'],
['Multipurpose Storage Cabinet',5999,'Freestanding cabinet with doors and internal shelving for household storage.'],
['Fabric Storage Ottoman',1999,'Padded footrest with an internal compartment for lightweight household items.'],
['Adjustable Bar Stool',4499,'Height-adjustable stool with a footrest for counter-height seating.'],
['Folding Balcony Chair',2299,'Foldable outdoor-style chair for covered balconies and compact seating areas.'],
],
'automotive': [
['Car Microfibre Wash Mitt',299,'Soft wash mitt for hand-washing vehicle body panels with suitable car shampoo.'],
['Portable Tyre Inflator',2499,'Compact vehicle-powered tyre inflator with a pressure display and storage pouch.'],
['Car Sunshade Pair',499,'Foldable window sunshades for reducing direct sunlight inside parked vehicles.'],
['Car Boot Organiser',899,'Foldable boot organiser with divided compartments for everyday vehicle storage.'],
['Motorcycle Rain Cover',699,'Lightweight motorcycle cover with an elasticated hem for outdoor storage.'],
['Car Seat Gap Organiser',399,'Slim organiser for keeping small items within reach beside a car seat.'],
['Vehicle Dashboard Duster',249,'Soft dashboard duster for dry cleaning interior vehicle surfaces.'],
['Car Air Freshener Vent Clip',199,'Compact vent-mounted fragrance accessory for vehicle interiors.'],
['Motorcycle Chain Cleaning Brush',299,'Multi-sided brush for cleaning motorcycle chains during routine maintenance.'],
['Car Emergency Tool Kit',1499,'Portable kit with basic hand tools, gloves and a storage case.'],
],
'office-products': [
['A4 Printer Paper 500 Sheets',349,'Ream of A4 plain paper for everyday printing and photocopying.'],
['Desktop Stapler with Staples',249,'Office stapler with a starter supply of staples for routine paperwork.'],
['Sticky Notes Colour Pack',199,'Assorted sticky note pads for reminders and temporary page markers.'],
['Lever Arch File Set',599,'Set of document files with lever mechanisms and spine labels.'],
['Whiteboard 60 x 45cm',899,'Wall-mountable dry-erase board for notes, planning and presentations.'],
['Whiteboard Marker Pack',249,'Assorted dry-erase markers for use on compatible whiteboard surfaces.'],
['Scientific Calculator',999,'Non-programmable calculator for arithmetic, trigonometry and scientific calculations.'],
['Paper Shredder Compact',3499,'Compact paper shredder with a removable waste bin for home-office use.'],
['Metal Bookend Pair',399,'Two metal bookends for supporting books and files on a shelf.'],
['Document Tray Three Tier',699,'Stacked desktop trays for organising incoming papers and active documents.'],
],
'bags-luggage': [
['Water Resistant Daypack 20L',1299,'Compact daypack with padded shoulder straps and zipped everyday storage.'],
['Weekender Travel Tote',999,'Spacious zip-top tote with shoulder straps for short trips and daily use.'],
['Crossbody Sling Bag',699,'Small crossbody bag with an adjustable strap and internal storage pockets.'],
['Packing Cube Set',799,'Zipped travel organisers in assorted sizes for clothing and small essentials.'],
['Laptop Messenger Bag 14-inch',1499,'Shoulder bag with a padded compartment for laptops up to 14 inches.'],
['Foldable Shopping Tote',249,'Reusable shopping tote that folds into a small storage pouch.'],
['Travel Toiletry Bag',499,'Zipped wash bag with compartments for travel-size personal care items.'],
['Soft Shell Check-In Suitcase',3999,'Wheeled travel suitcase with telescopic handle and internal packing straps.'],
['Waist Pack with Adjustable Belt',599,'Compact waist bag with zipped compartments for walking and travel.'],
],
'audio': [
['True Wireless Earbuds',1799,'Wireless in-ear earbuds with a charging case and touch playback controls.'],
['Compact TV Soundbar',3999,'Slim stereo soundbar with wired input and Bluetooth connectivity.'],
['Portable FM Radio',899,'Portable radio with FM tuning, a speaker and a telescopic antenna.'],
['USB Desktop Speakers',999,'Pair of compact USB-powered desktop speakers with volume control.'],
['Clip-On Lavalier Microphone',649,'Wired clip-on microphone for recording voice on compatible devices.'],
['Wired Over-Ear Headphones',1199,'Over-ear headphones with a wired audio connection and padded ear cushions.'],
['Bluetooth Neckband Earphones',1299,'Wireless neckband earphones with in-line controls for everyday listening.'],
['Portable Karaoke Speaker',2999,'Rechargeable speaker with a handheld microphone for home karaoke sessions.'],
],
'gaming': [
['RGB Gaming Keyboard',2499,'Wired keyboard with illuminated keys and dedicated gaming-oriented controls.'],
['Programmable Gaming Mouse',1499,'Wired mouse with adjustable sensitivity and configurable buttons.'],
['Racing Steering Wheel Controller',7999,'USB steering wheel and pedal set for compatible racing games.'],
['Controller Charging Dock',1299,'Dual controller charging stand for supported rechargeable game controllers.'],
['RGB Headset Stand',999,'Desk headset stand with decorative lighting and cable organisation.'],
['Handheld Console Carry Case',899,'Protective travel case with internal storage for compatible handheld consoles.'],
['Game Controller Grip Covers',349,'Textured controller grip covers for compatible thumbsticks and handles.'],
['Gaming Laptop Cooling Pad',1799,'Ventilated laptop stand with powered cooling fans for compatible laptops.'],
['Arcade Fight Stick USB',4499,'USB arcade-style joystick and button controller for compatible games.'],
['Gaming Desk Mat XXL',799,'Extended desk mat with a stitched edge for keyboard and mouse placement.'],
],
'wearables': [
['Round Dial Bluetooth Watch',2499,'Round-screen watch with phone notifications and everyday activity tracking.'],
['Kids Digital Watch',599,'Lightweight digital wristwatch with a clear time display and adjustable strap.'],
['Classic Metal Strap Watch',1999,'Analog wristwatch with a metal bracelet and a simple everyday dial.'],
['Minimal Leather Strap Watch',1499,'Slim analog watch with a leather-style strap and classic hour markers.'],
['Pedometer Activity Tracker',799,'Compact wearable step counter for basic daily activity tracking.'],
['GPS Running Watch',6999,'Sports watch with GPS route recording and training activity modes.'],
['Silicone Watch Strap 22mm',299,'Replacement silicone strap for watches that use standard 22mm fittings.'],
['Woven Watch Strap 20mm',399,'Adjustable woven replacement strap for compatible 20mm watch fittings.'],
['Watch Storage Case',899,'Protective storage case with padded compartments for wristwatches.'],
],
};
function csv(value) { const s = String(value); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
async function main() {
  const apply = process.argv.includes('--apply');
  const result = await prisma.$transaction(async tx => {
    const categories = await tx.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { id: 'asc' } });
    const slugs = new Set((await tx.product.findMany({ select: { slug: true } })).map(p => p.slug));
    const additions = [];
    for (const category of categories) {
      let needed = Math.max(0, target - category._count.products);
      for (const [name, price, description] of catalog[category.slug] || []) {
        if (!needed) break;
        const slug = generateSlug(name);
        if (slugs.has(slug)) continue;
        slugs.add(slug);
        additions.push({ name, slug, description, price, stock: 15 + (additions.length % 8) * 5, categoryId: category.id, categorySlug: category.slug });
        needed--;
      }
      if (needed) throw new Error(`Insufficient candidates for ${category.slug}: need ${needed} more`);
    }
    if (apply) {
      for (const { categorySlug, ...data } of additions) await tx.product.create({ data });
      const counts = await tx.category.findMany({ select: { slug: true, _count: { select: { products: true } } } });
      if (counts.some(c => c._count.products < target)) throw new Error('Category target verification failed');
    }
    return { additions, categories: categories.map(c => ({ category: c.name, before: c._count.products, after: Math.max(target, c._count.products) })) };
  }, { isolationLevel: 'Serializable', timeout: 30000 });
  // Sync only these catalog entries to the CSV. Never invoke the full user/order importer.
  if (apply) {
    const dir = path.join(__dirname, '../prisma/ecommerce_seed_dataset/ecommerce_seed_dataset');
    const file = path.join(dir, 'products.csv');
    let contents = fs.readFileSync(file, 'utf8');
    const existing = new Set(contents.trim().split(/\r?\n/).slice(1).map(line => line.split(',')[0]));
    const persisted = await prisma.product.findMany({ where: { slug: { in: Object.values(catalog).flat().map(([name]) => generateSlug(name)) } }, include: { category: true } });
    for (const p of persisted) {
      if (existing.has(p.slug)) continue;
      if (!contents.endsWith('\n')) contents += '\n';
      contents += [p.slug, p.name, p.description, p.price.toFixed(2), p.stock, p.category.slug].map(csv).join(',') + '\n';
      existing.add(p.slug);
    }
    fs.writeFileSync(file, contents);
    const manifestPath = path.join(dir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.products = manifest.files['products.csv'] = contents.trim().split(/\r?\n/).length - 1;
    manifest.categories = manifest.files['categories.csv'] = fs.readFileSync(path.join(dir, 'categories.csv'), 'utf8').trim().split(/\r?\n/).length - 1;
    manifest.total_csv_data_rows = Object.values(manifest.files).reduce((sum, count) => sum + count, 0);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(JSON.stringify({ applied: apply, added: result.additions.length, imagesAdded: 0, categories: result.categories }, null, 2));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
