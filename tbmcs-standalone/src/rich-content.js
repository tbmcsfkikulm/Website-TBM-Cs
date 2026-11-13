/* Restricted article HTML, shared by the editor and public reader. */
(() => {
 const allowed=new Set('p div br strong b em i u s h2 h3 h4 blockquote ul ol li a figure figcaption img span hr pre code'.split(' '));
 const drop=new Set('script style iframe object embed svg math form input button textarea select link meta base template noscript title head'.split(' '));
 const classes=new Set(['photo-grid','grid-2','grid-3','font-serif','font-sans','font-mono']);
 const image=s=>/^(https:\/\/[^\s]+|\/uploads\/[\w./-]+|data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+)$/.test(s||'');
 const link=s=>/^(https?:\/\/[^\s]+|mailto:[^\s]+|#[\w/-]+|\/(?!\/)[^\s]*)$/.test(s||'');
 function sanitize(value){
  const source=document.createElement('template');source.innerHTML=String(value||'');
  const result=document.createElement('div');
  function walk(node,parent,depth=0){
   if(depth>60)return;
   if(node.nodeType===3){parent.append(document.createTextNode(node.textContent));return;}
   if(node.nodeType!==1)return;
   let tag=node.localName;if(drop.has(tag))return;
   if(tag==='h1')tag='h2';if(tag==='font')tag='span';
   if(!allowed.has(tag)){for(const child of node.childNodes)walk(child,parent,depth+1);return;}
   if(tag==='img'&&!image(node.getAttribute('src')))return;
   const out=document.createElement(tag);
   const tokens=(node.getAttribute('class')||'').split(/\s+/).filter(x=>classes.has(x));
   const font=(node.getAttribute('face')||node.style?.fontFamily||'').toLowerCase();
   if(/georgia|times/.test(font))tokens.push('font-serif');else if(/arial|sans-serif/.test(font))tokens.push('font-sans');else if(/courier|monospace/.test(font))tokens.push('font-mono');
   if(tokens.length)out.className=[...new Set(tokens)].join(' ');
   if(tag==='a'&&link(node.getAttribute('href'))){out.setAttribute('href',node.getAttribute('href'));out.setAttribute('rel','noopener noreferrer');}
   if(tag==='img'){out.setAttribute('src',node.getAttribute('src'));out.setAttribute('alt',node.getAttribute('alt')||'');out.setAttribute('loading','lazy');out.setAttribute('decoding','async');out.setAttribute('referrerpolicy','no-referrer');}
   parent.append(out);for(const child of node.childNodes)walk(child,out,depth+1);
  }
  for(const child of source.content.childNodes)walk(child,result);return result.innerHTML;
 }
 function plain(html){const t=document.createElement('template');t.innerHTML=sanitize(html);for(const e of t.content.querySelectorAll('p,div,h2,h3,h4,li,figure,blockquote,br'))e.append(document.createTextNode('\n'));return t.content.textContent.trim();}
 function fromText(text){const e=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));return String(text||'').split(/\n\s*\n/).filter(Boolean).map(p=>/^###? /.test(p)?'<h2>'+e(p.replace(/^###? /,''))+'</h2>':'<p>'+e(p).replace(/\n/g,'<br>')+'</p>').join('');}
 // A legacy editor may update body while retaining an old body_html field.
 // Never let stale rich markup hide the newer plain-text edit.
 function content(item){
  const clean=sanitize(item.body_html),normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  return clean&&normalize(plain(clean))===normalize(item.body)?clean:fromText(item.body);
 }
 globalThis.TBMContent={sanitize,plain,fromText,content,image,link};
})();
