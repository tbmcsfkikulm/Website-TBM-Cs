// Verify the actual browser export handler using Node, without browser automation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/dist/admin.html','utf8');
const template=html.match(/<script id="site-template" type="application\/json">([\s\S]*?)<\/script>/)[1];
const code=html.slice(html.indexOf("$('#exportHTML').onclick="),html.indexOf("$('#importFile').onchange="));
const data=JSON.parse(fs.readFileSync(__dirname+'/content/site.json','utf8'));
data.posts=[{title:'Draft secret marker',slug:'draft',status:'draft',body:'private-test'},{title:'Published <title>',slug:'published',status:'published',body:'</script><script>danger</script>'}];
let output;const button={};const ctx={data,JSON,Error,validate:x=>x,$:s=>s==='#exportHTML'?button:{textContent:template},esc:s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])),download:(name,text)=>{output=text},alert:e=>{throw Error(e)}};
vm.runInNewContext(code,ctx);button.onclick();assert.ok(output.startsWith('<!DOCTYPE html>'));assert.ok(!output.includes('Draft secret marker'));assert.ok(!output.includes('</script><script>danger</script>'));assert.ok(!output.includes('@@DATA@@'));assert.ok(!output.includes('@@TITLE@@'));const publicData=JSON.parse(output.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.equal(publicData.posts.length,1);assert.equal(publicData.posts[0].title,'Published <title>');console.log('Export HTML: valid document, public data only, content escaped, placeholders resolved.');
