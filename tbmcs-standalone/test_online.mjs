import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createClient,encode,decode,validate,ApiError} from './admin/online/api.mjs';
const sample=JSON.parse(await readFile(new URL('./content/site.json',import.meta.url),'utf8'));
test('UTF-8 round-trip and schema rejects unsafe content',()=>{
  assert.equal(decode(encode('Cerita Faisal — belajar 🩺')),'Cerita Faisal — belajar 🩺');
  const data=structuredClone(sample);data.custom={keep:true};assert.equal(validate(data).custom.keep,true);
  data.posts.push({title:'Contoh',slug:'contoh',status:'draft',date:'2026-11-08',category:'Cerita',body:'Isi',cover:'javascript:alert(1)'});
  assert.throws(()=>validate(data),/Cover/);data.posts[0].cover='';assert.equal(validate(data).posts[0].status,'draft');
  data.posts.push({...data.posts[0]});assert.throws(()=>validate(data),/slug/);
});
test('writes preserve expected SHA and explicitly use content branch',async()=>{
  let observed;
  const client=createClient('test-only',async(url,options)=>{
    observed={url,options};return new Response(JSON.stringify({content:{sha:'next'}}));
  });
  await client.save('content/ruang-kelola-test','prior',sample);
  const body=JSON.parse(observed.options.body);
  assert.equal(body.sha,'prior');assert.equal(body.branch,'content/ruang-kelola-test');
  assert.equal(observed.options.redirect,'error');assert.equal(observed.options.method,'PUT');
  assert.deepEqual(JSON.parse(decode(body.content)),sample);
  assert.equal(observed.url,'https://api.github.com/repos/tbmcsfkikulm/Website-TBM-Cs/contents/tbmcs-standalone/content/site.json');
});
test('API errors do not echo credentials or response bodies',async()=>{
  for(const status of [401,403,404,409,422,500]){
    const client=createClient('never-print-token',async()=>new Response('private-response-marker',{status}));
    await assert.rejects(client.read('main'),e=>e instanceof ApiError&&e.status===status&&!/marker|never-print/.test(e.message));
  }
});
test('network/timeout is never reported as successful save',async()=>{
  const client=createClient('test-only',async()=>{throw Error('private-details');});
  await assert.rejects(client.save('content/ruang-kelola-test','prior',sample),e=>e.status===0&&!e.message.includes('private-details'));
});
test('client rejects direct production writes before making a request',()=>{
  let calls=0;const client=createClient('test-only',async()=>{calls++;});
  assert.throws(()=>client.save('main','prior',sample),/branch konten/);
  assert.throws(()=>client.createBranch('main','prior'),/branch konten/);
  assert.throws(()=>client.createPull('main'),/branch konten/);assert.equal(calls,0);
});
test('OAuth accepts only exact popup source, auth origin and provider',async()=>{
  const {login}=await import('./admin/online/auth.mjs');
  const listeners=new Map();const messages=[];
  const popup={closed:false,close(){this.closed=true;},postMessage(...args){messages.push(args);}};
  globalThis.location={origin:'https://tbmcs.web.id'};
  globalThis.window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),open:()=>popup};
  const pending=login();let resolved=false;pending.then(()=>resolved=true);
  const send=(origin,source,data)=>listeners.get('message')?.({origin,source,data});
  const success='authorization:github:success:'+JSON.stringify({provider:'github',token:'mock-only'});
  send('https://evil.invalid',popup,success);send('https://auth.tbmcs.web.id',{},success);
  await Promise.resolve();assert.equal(resolved,false);
  send('https://auth.tbmcs.web.id',popup,'authorizing:github');assert.deepEqual(messages,[['authorizing:github','https://auth.tbmcs.web.id']]);
  send('https://auth.tbmcs.web.id',popup,success);assert.equal(await pending,'mock-only');assert.equal(listeners.size,0);assert.equal(popup.closed,true);
  globalThis.location.origin='https://untrusted.invalid';await assert.rejects(login(),/Host preview/);
  delete globalThis.window;delete globalThis.location;
});

test('optional rich HTML preserves legacy schema and rejects invalid types/oversize data',()=>{
 const d=structuredClone(sample),item=d.pages[0];item.body_html='<p>Contoh</p>';
 assert.equal(validate(d).pages[0].body_html,'<p>Contoh</p>');
 item.body_html={};assert.throws(()=>validate(d),/HTML artikel/);
 item.body_html='a'.repeat(901*1024);assert.throws(()=>validate(d),/900 KB/);
 delete item.body_html;assert.equal(validate(d),d);
});
test('image uploads reject unsupported type and excessive bytes before decoding',async()=>{
 const {compress}=await import('./admin/online/images.mjs');
 await assert.rejects(compress({type:'image/svg+xml',size:100}),/PNG, JPEG/);
 await assert.rejects(compress({type:'image/png',size:11*1024*1024}),/10 MB/);
});
