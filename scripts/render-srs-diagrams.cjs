const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');
const runtime = 'C:/Users/arell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const req = createRequire(path.join(runtime, 'playwright/package.json'));
const { chromium } = req('playwright');

(async () => {
  const directory = path.resolve('Docs/SRS_FIGURES');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 1600 }, deviceScaleFactor: 2 });
    await page.setContent('<html><body style="margin:0;background:white"></body></html>');
    await page.addScriptTag({ path: path.resolve('output/srs-tooling/node_modules/mermaid/dist/mermaid.min.js') });
    await page.evaluate(() => mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base',
      fontFamily: 'Times New Roman',
      themeVariables: { fontFamily: 'Times New Roman', fontSize: '19px', primaryColor: '#ffffff',
        primaryTextColor: '#111111', primaryBorderColor: '#555555', lineColor: '#555555',
        secondaryColor: '#f0f0f0', tertiaryColor: '#ffffff', clusterBkg: '#ffffff', clusterBorder: '#888888' },
      flowchart: { htmlLabels: false, curve: 'linear', nodeSpacing: 18, rankSpacing: 12, padding: 10 },
      er: { useMaxWidth: false, fontSize: 20, minEntityWidth: 120, minEntityHeight: 50 },
      state: { useMaxWidth: false }
    }));
    const files = (await fs.readdir(directory)).filter(f => f.endsWith('.mmd')).sort();
    const results=[];
    for (let i=0;i<files.length;i++) {
      const source=await fs.readFile(path.join(directory,files[i]),'utf8');
      const svg=await page.evaluate(async ({source,i}) => {
        await mermaid.parse(source);
        return (await mermaid.render(`srsFigure${i}`,source)).svg;
      },{source,i});
      await fs.writeFile(path.join(directory,files[i].replace('.mmd','.svg')),svg);
      await page.evaluate(svg => {
        let target=document.getElementById('preview');
        if(!target){target=document.createElement('div'); target.id='preview'; document.body.append(target);}
        target.innerHTML=svg;
        const image=target.querySelector('svg');
        const box=image.viewBox.baseVal;
        image.style.maxWidth='none'; image.setAttribute('width',String(box.width)); image.setAttribute('height',String(box.height));
      },svg);
      const target=page.locator('#preview svg');
      const bounds=await target.boundingBox();
      await target.screenshot({path:path.join(directory,files[i].replace('.mmd','.png'))});
      results.push({file:files[i],width:bounds.width,height:bounds.height});
    }
    await fs.writeFile(path.resolve('output/srs-diagram-validation.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
