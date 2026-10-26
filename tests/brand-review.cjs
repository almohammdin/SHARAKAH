const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright'),sharp=require('sharp');
const root=process.cwd(),out=path.join(root,'tests/.brand-output');fs.mkdirSync(out,{recursive:true});fs.mkdirSync('assets/brand',{recursive:true});
function emit(file,bytes){const b=bytes.toString('base64');console.log('FILE_BEGIN '+file);for(let i=0;i<b.length;i+=4000)console.log('FILE_CHUNK '+b.slice(i,i+4000));console.log('FILE_END '+file)}
setTimeout(()=>{console.error('REVIEW_WATCHDOG');process.exit(1)},60000).unref();
(async()=>{
 const get=async u=>{const r=await fetch(u);if(!r.ok)throw Error(u+': '+r.status);return Buffer.from(await r.arrayBuffer())};
 const base='https://almohammdin.github.io/hatta-brand-guide/assets/';
 const logo=await sharp(await get(base+'hatta-logo.webp')).extract({left:134,top:149,width:746,height:269}).png().toBuffer();
 const sig=await sharp(await get(base+'naif-signature.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<sig.data.length;i+=4){sig.data[i]=6;sig.data[i+1]=31;sig.data[i+2]=86}
 const navySig=await sharp(sig.data,{raw:sig.info}).png().toBuffer();
 fs.writeFileSync('assets/brand/hatta-logo.png',logo);fs.writeFileSync('assets/brand/naif-navy.png',navySig);
 fs.writeFileSync('hatta-export-assets.js','window.SharakahBrandAssets={hattaPng:'+JSON.stringify(logo.toString('base64'))+'};\n');
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!fs.existsSync(f)){res.writeHead(404);res.end();return}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.footer-social-row a').count(),4);assert.equal((await page.locator('footer').innerText()).match(/@almohammdin/g).length,1);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});await page.locator('#accountLock').scrollIntoViewIfNeeded();const v=await page.locator('.version-chip').boundingBox(),l=await page.locator('#accountLock').boundingBox();assert(l&&v);assert(l.x+l.width<=v.x||v.x+v.width<=l.x||l.y+l.height<=v.y||v.y+v.height<=l.y,'lock overlaps version at '+width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width)}
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
 emit('tests/.brand-output/desktop.png',fs.readFileSync(path.join(out,'desktop.png')));
 console.log('QA_STAGE account');
 await page.locator('#accountLock').click();assert(await page.locator('#accountDialog').isVisible());await page.locator('#accountClose').click();
 console.log('QA_STAGE tool');
 await page.evaluate(()=>{G.startTool();G.loadExample('fnb');G.go(2)});await page.evaluate(()=>document.fonts.ready);
 assert.match(await page.locator('.card-head').first().evaluate(e=>getComputedStyle(e).fontFeatureSettings),/^"salt"(?: 1)?$/);
 console.log('QA_STAGE fonts');
 const fonts=await page.evaluate(()=>({body:document.fonts.check('16px "Thmanyah Sans"'),title:document.fonts.check('700 32px "Thmanyah Serif Display"'),english:document.fonts.check('600 16px "El Messiri"')}));assert(Object.values(fonts).every(Boolean),JSON.stringify(fonts));
 console.log('QA_STAGE mobile');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('QA_STAGE result');
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{G.go(4);G.buildExportLayout()});await page.evaluate(()=>document.fonts.ready);
 const resultNode=page.locator('#exportResultsLayout>div');await resultNode.evaluate(e=>{e.style.position='fixed';e.style.left='0';e.style.top='0';e.style.zIndex='9999';e.style.visibility='visible'});await page.setViewportSize({width:1080,height:1350});await resultNode.screenshot({path:path.join(out,'result.png')});
 console.log('QA_STAGE pdf');
 await page.evaluate(()=>{document.querySelector('#exportResultsLayout').innerHTML='';G.go(5)});await page.pdf({path:path.join(out,'draft.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 console.log('QA_STAGE word');
 const docBytes=await page.evaluate(async()=>Array.from(new Uint8Array(await SharakahDocx.build(document.querySelector('#agrBox').textContent).arrayBuffer())));const word=Buffer.from(docBytes);fs.writeFileSync(path.join(out,'draft.docx'),word);assert(word.includes(Buffer.from('word/media/hatta-logo.png')));assert(word.includes(Buffer.from('Thmanyah Sans')));
 console.log('QA_STAGE og');
 const og=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await og.goto(origin);await og.setContent('<!doctype html><html dir="rtl" lang="ar"><head><link rel="stylesheet" href="'+origin+'/hatta-theme.css"><style>*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#fbfaf7;color:#061f56;padding:70px 84px;display:flex;flex-direction:column;justify-content:space-between;border-top:12px solid #b47a2d}.top{display:flex;align-items:center;justify-content:space-between}.sharakah{width:590px;height:auto}.hatta{width:220px;height:auto}.desc{font:500 54px/1.5 "Thmanyah Sans";font-feature-settings:"salt" 1;max-width:870px}.bottom{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e6d2ae;padding-top:24px}.signature{width:112px}.handle{font:400 23px "El Messiri";direction:ltr}</style></head><body><div class="top"><img class="sharakah" src="'+origin+'/sharakah-logo.svg"><img class="hatta" src="'+origin+'/assets/brand/hatta-logo.png"></div><div class="desc">مرشد لنقاط اتفاق الشركاء</div><div class="bottom"><img class="signature" src="'+origin+'/assets/brand/naif-navy.png"><span class="handle">@almohammdin</span></div></body></html>');
 await og.evaluate(()=>document.fonts.ready);await og.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
 await og.screenshot({path:'preview-hatta.png'});
 console.log('BRAND_CHECKS '+JSON.stringify({fonts,errors,footer:'4 icons, 1 handle; lock separate at 320/390/768/1440',docx:'logo and fonts present'}));assert.deepEqual(errors,[]);
 for(const file of ['assets/brand/hatta-logo.png','assets/brand/naif-navy.png','hatta-export-assets.js','preview-hatta.png','tests/.brand-output/desktop.png','tests/.brand-output/mobile.png','tests/.brand-output/result.png'])emit(file,fs.readFileSync(file));
 console.log('QA_STAGE complete');
 await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1)});
