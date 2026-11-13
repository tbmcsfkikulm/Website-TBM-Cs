/* Local mocked GitHub/OAuth tests. No real credentials or network mutations. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');const path=require('node:path');const assert=require('node:assert/strict');
const root=__dirname;
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_CHROMIUM_PATH||chromium.executablePath(),args:['--no-sandbox']});
 try{
  const context=await browser.newContext();const errors=[];const mutations=[];
  const original=JSON.parse(await fs.readFile(path.join(root,'content/site.json'),'utf8'));
  original.preservedExtra='keep';let remote=structuredClone(original),saved=null,conflict=false,mainChanged=false,branchName='',sha='a'.repeat(40);
  await context.route('https://tbmcs.web.id/**',async route=>{
   const url=new URL(route.request().url());const relative=url.pathname.replace(/^\/ruang-kelola\//,'')||'index.html';
   if(!['index.html','style.css','api.mjs','auth.mjs','app.mjs','rich-content.js','rich-editor.mjs','images.mjs'].includes(relative)){await route.fulfill({status:404,body:'Not found'});return;}
   await route.fulfill({contentType:MIME[path.extname(relative)],body:await fs.readFile(path.join(root,'dist/ruang-kelola',relative))});
  });
  await context.route('https://auth.tbmcs.web.id/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><p>Mock login</p><script>window.addEventListener('message',e=>{if(e.origin==='https://tbmcs.web.id'&&e.data==='authorizing:github'){window.opener.postMessage('authorization:github:success:'+JSON.stringify({token:'mock-token-only',provider:'github'}),e.origin);window.close();}});window.opener.postMessage('authorizing:github','https://tbmcs.web.id');</script>`}));
  await context.route('https://api.github.com/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname,method=req.method();const fulfill=(x,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(x)});
   if(method==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'}});
   assert.equal(req.headers().authorization,'Bearer mock-token-only');
   if(method!=='GET')mutations.push({p,method,body:req.postDataJSON()});
   if(p==='/user')return fulfill({login:'faisal-test'});
   if(p.endsWith('/Website-TBM-Cs'))return fulfill({permissions:{push:true}});
   if(p.endsWith('/git/ref/heads/main'))return fulfill({object:{sha:'b'.repeat(40)}});
   if(p.endsWith('/git/refs')){branchName=req.postDataJSON().ref.slice(11);return fulfill({},201);}
   if(p.includes('/contents/')){
    if(method==='PUT'){
     if(conflict)return fulfill({message:'conflict'},409);
     const body=req.postDataJSON();assert.notEqual(body.branch,'main');assert.equal(body.sha,sha);
     saved=JSON.parse(Buffer.from(body.content,'base64').toString());remote=structuredClone(saved);sha='c'.repeat(40);
     return fulfill({content:{sha}},200);
    }
    const ref=url.searchParams.get('ref');const isMain=ref==='main'||ref==='b'.repeat(40);
    return fulfill({encoding:'base64',sha:isMain?(mainChanged?'d'.repeat(40):'a'.repeat(40)):sha,content:Buffer.from(JSON.stringify(isMain?original:remote)).toString('base64')});
   }
   if(p.endsWith('/pulls'))return fulfill({number:12},201);
   if(p.endsWith('/pulls/12'))return fulfill({state:'open',merged:false});
   throw Error('Unhandled mock '+method+' '+p);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://tbmcs.web.id/ruang-kelola/');
  await page.getByRole('button',{name:'Masuk dengan GitHub'}).click();
  await page.locator('#workspace').waitFor({state:'visible'});
  assert.equal(await page.locator('#identity').textContent(),'Terhubung sebagai faisal-test');
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]){
   await page.setViewportSize({width,height});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+' overflow');
   await page.screenshot({path:path.join(root,'..','qa-'+name+'.png'),fullPage:true});
  }
  await page.locator('#add').click();
  await page.locator('[name=title]').fill('Catatan belajar TBM-Cs');await page.locator('[name=slug]').fill('catatan-belajar');await page.locator('[name=category]').fill('Edukasi');await page.locator('.rich-surface').fill('Paragraf pertama.\n\n## Pelajaran\n\nIsi berikutnya.');
  // Compression uses browser canvas, not a mocked function.
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2400;c.height=1600;const x=c.getContext('2d');x.fillStyle='#0b5634';x.fillRect(0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];});
  await page.locator('#coverFile').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.waitForFunction(()=>document.querySelector('#formFeedback').textContent.includes('diperkecil'));
  await page.getByRole('button',{name:'Terapkan perubahan'}).click();
  await page.locator('#search').fill('tidak-cocok');assert.match(await page.locator('#list').textContent(),/Belum ada yang cocok/);
  await page.locator('#search').fill('belajar');assert.match(await page.locator('#list').textContent(),/Catatan belajar/);
  await page.locator('#statusFilter').selectOption('published');assert.match(await page.locator('#list').textContent(),/Belum ada yang cocok/);
  await page.locator('#statusFilter').selectOption('draft');
  await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#saveState').textContent.includes('tersimpan di branch'));
  assert.equal(saved.posts[0].status,'draft');assert.equal(saved.preservedExtra,'keep');assert.ok(saved.posts[0].cover.startsWith('data:image/webp;base64,'));
  assert.ok(Buffer.from(saved.posts[0].cover.split(',')[1],'base64').length<=180*1024);assert.match(branchName,/^content\/ruang-kelola-/);
  page.on('dialog',d=>d.accept());
  // A main change must prevent PR creation, even when a saved workspace exists.
  mainChanged=true;await page.locator('#publish').click();await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('main berubah'));
  assert.equal(mutations.filter(x=>x.p.endsWith('/pulls')).length,0);
  mainChanged=false;await page.locator('#publish').click();await page.locator('#reviewLink').waitFor({state:'visible'});assert.equal(await page.locator('#reviewLink').getAttribute('href'),'https://github.com/tbmcsfkikulm/Website-TBM-Cs/pull/12');
  // Edit after saved state; a 409 leaves local changes intact and dirty.
  await page.locator('[data-tab=settings]').click();await page.getByRole('button',{name:'Edit',exact:true}).click();await page.locator('[name=title]').fill('TBM-Cs — revisi lokal');await page.getByRole('button',{name:'Terapkan perubahan'}).click();
  conflict=true;await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('telah berubah'));
  assert.equal(await page.locator('#save').isEnabled(),true);assert.match(await page.locator('#list').textContent(),/revisi lokal/);
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>/token/i.test(k))),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(sessionStorage).includes('mock-token-only')),false);
  assert.deepEqual(errors,[]);
  await context.close();console.log('PASS: OAuth popup, responsive 1440/768/390, CRUD, search/filter, WebP compression, branch-only save, unknown fields, conflict retention, main-change publication guard, PR creation, no persisted token.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
