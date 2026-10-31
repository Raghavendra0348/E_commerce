require('dotenv').config({path:require('node:path').join(__dirname,'../.env'),quiet:true});
const fs=require('node:fs/promises');const path=require('node:path');const crypto=require('node:crypto');const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
const root=path.resolve(__dirname,'../downloads'),target=path.join(root,'products');const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function verify(){const collection=JSON.parse(await fs.readFile(path.join(target,'index.json'),'utf8'));let files=0;for(const p of collection.products){const manifest=JSON.parse(await fs.readFile(path.join(target,p.slug,'manifest.json'),'utf8'));for(const i of manifest.images){const b=await fs.readFile(path.join(target,p.slug,i.filename));if(hash(b)!==i.sha256)throw Error('Checksum mismatch: '+p.slug+'/'+i.filename);files++;}}if(files!==collection.imageCount)throw Error('Image count mismatch');console.log(JSON.stringify({verifiedImages:files,productFolders:collection.products.length}));}
async function main(){
if(process.argv.includes('--verify'))return verify();
try { await fs.access(path.join(target,'index.json')); return verify(); } catch(e) { if(e.code!=='ENOENT')throw e; }
const existing=await fs.readdir(root,{withFileTypes:true});
const metadata=path.join(target,'_metadata');await fs.mkdir(metadata,{recursive:true});
const products=await db.product.findMany({select:{id:true,name:true,slug:true,images:true},orderBy:{id:'asc'}});const rows=[];const reports=[];
for(const e of existing.filter(e=>e.isFile()&&e.name.endsWith('report.json'))){const data=JSON.parse(await fs.readFile(path.join(root,e.name),'utf8'));reports.push({name:e.name,data});}
const uploads=reports.flatMap(r=>r.data.files||[]);
for(const e of existing.filter(e=>e.isDirectory()&&e.name!=='products')){
const source=path.join(root,e.name);let manifest;try{manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));}catch(err){if(err.code==='ENOENT')continue;throw err;}
for(const p of manifest.products||[]){const product=products.find(x=>x.id===p.id);if(!product)throw Error('Missing product '+p.id);for(const image of p.images||[]){let file=manifest.source==='DummyJSON'?path.join(source,`${p.id}-${p.slug}`,image.filename):path.resolve(source,image.file);if(!file.startsWith(source+path.sep))throw Error('Unsafe source path');const bytes=await fs.readFile(file);if(hash(bytes)!==image.sha256)throw Error('Source checksum mismatch');const record=uploads.find(u=>u.sha256===image.sha256&&u.productId===p.id&&u.status==='linked');rows.push({product,image,sourceFile:path.relative(root,file),bytes,record,provider:manifest.source==='DummyJSON'?'DummyJSON':'Image search reference'});}}
}
// Recover files moved between batches by matching the upload report checksum.
const known=new Set(rows.map(r=>path.resolve(root,r.sourceFile)));
async function findUnlisted(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(file===target)continue;if(e.isDirectory()){await findUnlisted(file);continue;}if(!/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file)||known.has(file))continue;const bytes=await fs.readFile(file);const digest=hash(bytes);const record=uploads.find(u=>u.sha256===digest&&u.status==='linked');if(!record)throw Error('Unmapped image: '+file);const product=products.find(p=>p.id===record.productId);if(!product)throw Error('Unmapped image product');const association=product.images.find(i=>i.url===record.url);rows.push({product,image:{sha256:digest,sourceUrl:association?.sourceUrl,sourceTitle:association?.altText},sourceFile:path.relative(root,file),bytes,record,provider:association?.sourceName||'Reference image'});}}
await findUnlisted(root);
if(rows.length!==221)throw Error('Expected 221 local images; found '+rows.length);
const mapping={};const grouped=new Map();for(const row of rows){if(!grouped.has(row.product.id))grouped.set(row.product.id,[]);grouped.get(row.product.id).push(row);}
const index={imageCount:rows.length,products:[],cloudinaryChanged:false,databaseChanged:false};
for(const [id,items] of [...grouped].sort((a,b)=>a[0]-b[0])){
const p=items[0].product,dir=path.join(target,p.slug);await fs.mkdir(dir,{recursive:true});const images=[];const seen=new Map();
for(const row of items){const digest=hash(row.bytes);let filename=seen.get(digest);if(!filename){const ext=path.extname(row.sourceFile).toLowerCase();filename=`${String(images.length+1).padStart(2,'0')}-${digest.slice(0,16)}${ext}`;await fs.writeFile(path.join(dir,filename),row.bytes,{flag:'wx'});seen.set(digest,filename);images.push({filename,provider:row.provider,providerId:digest.slice(0,24),sourceUrl:row.image.sourceUrl||row.image.imageUrl,description:row.image.sourceTitle||p.name,mimeType:ext==='.webp'?'image/webp':ext==='.png'?'image/png':'image/jpeg',bytes:row.bytes.length,sha256:digest,status:row.record?'saved':'downloaded',cloudinaryUrl:row.record?.url,cloudinaryPublicId:row.record?.publicId,referenceImage:true,originalFiles:[row.sourceFile]});}else images.find(i=>i.filename===filename).originalFiles.push(row.sourceFile);
mapping[row.sourceFile]=path.relative(root,path.join(dir,filename));}
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({version:1,productId:id,productSlug:p.slug,productName:p.name,images},null,2));index.products.push({id,slug:p.slug,name:p.name,imageCount:images.length});
}
index.imageCount=index.products.reduce((n,p)=>n+p.imageCount,0);await fs.writeFile(path.join(target,'index.json'),JSON.stringify(index,null,2));
const reportDir=path.join(metadata,'upload-reports');await fs.mkdir(reportDir,{recursive:true});
for(const r of reports){for(const item of r.data.files||[]){if(mapping[item.file]){item.originalFile=item.file;item.file=mapping[item.file];}}await fs.writeFile(path.join(reportDir,r.name),JSON.stringify(r.data,null,2));}
const searchLinks=path.join(root,'product_photo_search_links.txt');try{await fs.copyFile(searchLinks,path.join(metadata,'product_photo_search_links.txt'));}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.writeFile(path.join(metadata,'file-mapping.json'),JSON.stringify(mapping,null,2));
await fs.writeFile(path.join(target,'README.md'),'# Product image library\n\nAll local product photos are grouped by database product slug. Each product folder contains numbered images and a manifest with checksums, source links, product IDs and Cloudinary URLs.\n\n- index.json: product/image inventory.\n- _metadata/upload-reports/: preserved Cloudinary results and original image association backups.\n- _metadata/file-mapping.json: old to new local paths.\n- _metadata/product_photo_search_links.txt: original search list.\n\nUpload pending files: from Backend, run npm run images:upload. Verify the library: node scripts/organize-product-images.js --verify.\n\nPhotos are demo references; brands and variants may differ. This organization does not modify Cloudinary assets or the database.\n');
await verify();
const candidates=existing.filter(e=>e.name!=='products').map(e=>path.join(root,e.name));
await fs.writeFile(path.join(metadata,'cleanup-plan.json'),JSON.stringify({verified:true,imageCount:index.imageCount,productFolders:index.products.length,remove:candidates},null,2));
console.log('Verified copies ready. Cleanup plan: '+path.join(metadata,'cleanup-plan.json'));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.$disconnect());
