(() => {
'use strict';
const data=JSON.parse(document.getElementById('site-data').textContent);
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const publicItems=xs=>(xs||[]).filter(x=>x.status==='published');
const posts=publicItems(data.posts).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
const safeImage=s=>/^(data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s]+|\/uploads\/[\w./-]+)$/.test(s||'')?s:'';
const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
function richText(s){return String(s||'').split(/\n\s*\n/).filter(Boolean).map(p=>/^###? /.test(p)?'<h2>'+esc(p.replace(/^###? /,''))+'</h2>':'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');}
function card(p){let cover=safeImage(p.cover);return '<article class="standalone-card">'+(cover?'<img src="'+esc(cover)+'" alt="'+esc(p.cover_alt||p.title)+'" loading="lazy">':'')+'<div><span class="section-kicker">'+esc(p.category||'Kabar TBM-Cs')+'</span><h2><a href="#article/'+encodeURIComponent(p.slug)+'">'+esc(p.title)+'</a></h2><p>'+esc(p.excerpt||(p.body||'').slice(0,155))+'</p><small>'+esc(p.date||'')+' · '+Math.max(1,Math.ceil((p.body||'').split(/\s+/).length/200))+' menit baca</small></div></article>';}
const empty='<div class="empty-state"><h2>Ruang cerita kami.</h2><p>Belum ada artikel yang diterbitkan. Kabar kegiatan dan catatan pengabdian akan hadir di sini.</p><a href="#contact">Hubungi TBM-Cs →</a></div>';
$('#homeArticles').innerHTML=posts.slice(0,3).map(card).join('')||empty;
document.title=data.settings.title;
const h=$('#beranda h1');if(h)h.textContent=data.settings.hero_title;
const intro=$('#beranda .hero-lead');if(intro)intro.textContent=data.settings.hero_intro;
// Rental prices are driven by the same data as the admin dashboard.
$('.rental-catalog-grid').innerHTML=data.rentals.map(x=>'<article class="rental-item"'+(!x.available?' data-unavailable="true"':'')+'><span class="rental-item-icon" aria-hidden="true"></span><div class="rental-item-body"><span class="rental-item-tag">'+esc(x.category)+'</span><h3>'+esc(x.name)+'</h3><span class="rental-price">'+esc(money(x.price))+' <small>/ '+esc(x.unit)+'</small></span>'+(!x.available?'<p>Belum tersedia</p>':'')+'</div></article>').join('');

for(const rentalRoot of [$('#rentalPage'),$('.home-rental-promo')]){
const walker=document.createTreeWalker(rentalRoot,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))node.textContent=node.textContent.replaceAll('Siti Melati',data.settings.rental_contact).replaceAll('0822-7545-7472','+'+data.settings.rental_phone);
rentalRoot.querySelectorAll('a[href]').forEach(a=>{a.href=a.href.replaceAll('6282275457472',data.settings.rental_phone).replaceAll('Siti%20Melati',encodeURIComponent(data.settings.rental_contact));});

}
const availableRentals=data.rentals.filter(x=>x.available);
$('.home-rental-tools').innerHTML=availableRentals.slice(0,4).map(x=>'<span>'+esc(x.name)+'</span>').join('')+(availableRentals.length>4?'<span>+'+(availableRentals.length-4)+' alat lainnya</span>':'');
$('.home-rental-preview ul').innerHTML=availableRentals.slice(0,3).map(x=>'<li><span>'+esc(x.name)+'</span><strong>'+esc(money(x.price))+'</strong></li>').join('')||'<li>Konfirmasikan ketersediaan alat kepada narahubung.</li>';
const categories=[...new Set(posts.map(x=>x.category).filter(Boolean))];
$('#articleSearch select').innerHTML+=[...new Set([...categories,'Medis Praktis','Pengabdian Masyarakat','Alam Bebas','Hubungan Masyarakat','Litbang IT','Logistik'])].map(x=>'<option>'+esc(x)+'</option>').join('');
function search(){const f=$('#articleSearch'),q=f.elements.q.value.trim().toLocaleLowerCase('id'),c=f.elements.category.value;const results=posts.filter(x=>(!c||x.category===c)&&(!q||(x.title+' '+(x.body||'')+' '+(x.excerpt||'')).toLocaleLowerCase('id').includes(q)));$('#allArticles').innerHTML=results.map(card).join('')||(posts.length?'<div class="empty-state"><h2>Belum ada yang cocok.</h2><p>Coba kata kunci lain atau pilih semua bidang.</p></div>':empty);$('#searchCount').textContent=results.length+' artikel';}
$('#articleSearch').addEventListener('submit',e=>{e.preventDefault();search();});$('#articleSearch select').addEventListener('change',search);$('#articleSearch input').addEventListener('input',search);
const views=['homeView','rentalPage','contactPage','logo-downloads','articlesView','detailView','notFoundPage'];
function show(id,kind){views.forEach(x=>$('#'+x).hidden=x!==id);document.body.classList.remove('home-view','index-view','single-view','rental-view','contact-view','error-view');if(kind)document.body.classList.add(kind);document.body.classList.remove('nav-open');$('#menuButton').setAttribute('aria-expanded','false');document.querySelectorAll('.has-submenu').forEach(x=>x.classList.remove('is-open'));document.querySelectorAll('.submenu-button').forEach(x=>x.setAttribute('aria-expanded','false'));}
function route(){let raw;try{raw=decodeURIComponent(location.hash.slice(1)||'home');}catch{raw='missing';}const [path,params='']=raw.split('?');const [type,slug]=path.split('/');if(type==='main-content'){$('#main-content').focus();return;}let view='homeView';document.title=data.settings.title;
 if(['home','beranda','sorotan','bidang','latestHighlight','main-content'].includes(type)){show('homeView','home-view');const target=$('#'+(type==='latestHighlight'?'latestArticles':type));if(target)setTimeout(()=>target.scrollIntoView(),10);}
 else if(type==='articles'){view='articlesView';show(view);const query=new URLSearchParams(params);$('#articleSearch').elements.q.value=query.get('q')||'';$('#articleSearch').elements.category.value=query.get('category')||'';search();}
 else if(type==='rental'||type==='daftar-alat'){view='rentalPage';show(view,'rental-view');if(type==='daftar-alat')setTimeout(()=>$('#daftar-alat').scrollIntoView(),10);}
 else if(type==='contact'){view='contactPage';show(view,'contact-view');}
 else if(type==='logo'||type==='tbmLogoPng'){view='logo-downloads';show(view);}
 else if(type==='article'||type==='page'){
 const item=(type==='article'?posts:publicItems(data.pages)).find(x=>x.slug===slug);
 if(!item){view='notFoundPage';show(view,'error-view');}else{view='detailView';show(view,'single-view');let cover=safeImage(item.cover);$('#detailView').innerHTML='<a class="detail-back" href="'+(type==='article'?'#articles':'#home')+'">← '+(type==='article'?'Semua artikel':'Beranda')+'</a><header><span class="section-kicker">'+esc(item.category||'TBM-Cs FKIK ULM')+'</span><h1>'+esc(item.title)+'</h1>'+(type==='article'?'<p>'+esc(item.date||'')+' · '+Math.max(1,Math.ceil((item.body||'').split(/\s+/).length/200))+' menit baca</p>':'')+'</header>'+(cover?'<img class="detail-cover" src="'+esc(cover)+'" alt="'+esc(item.cover_alt||item.title)+'">':'')+'<div class="detail-body">'+(richText(item.body)||'<p>Informasi pada halaman ini belum diterbitkan.</p><p><a href="#contact">Tanyakan informasi kepada TBM-Cs →</a></p>')+'</div>'+(type==='article'&&posts.length>1?'<aside><h2>Baca juga</h2><div class="article-grid">'+posts.filter(x=>x.slug!==slug).slice(0,2).map(card).join('')+'</div></aside>':'');document.title=item.title+' | '+data.settings.title;}
 }else{view='notFoundPage';show(view,'error-view');}
 document.querySelectorAll('#primary-navigation a').forEach(a=>{const active=a.hash==='#'+type;a.classList.toggle('is-active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(!['sorotan','bidang','latestHighlight','daftar-alat','main-content'].includes(type))window.scrollTo(0,0);
 if(location.hash&&view!=='homeView'){const el=$('#'+view);el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}
}
window.addEventListener('hashchange',route);
window.addEventListener('scroll',()=>{const bar=$('#readingProgress'),article=$('#detailView'),max=article.offsetHeight-innerHeight;const progress=article.hidden?0:Math.max(0,Math.min(100,(scrollY-article.offsetTop)/Math.max(1,max)*100));bar.style.setProperty('--reading-progress',progress+'%');bar.style.transform='scaleX('+progress/100+')';bar.setAttribute('aria-valuenow',Math.round(progress));},{passive:true});

$('#quickSearch form').addEventListener('submit',e=>{e.preventDefault();const q=$('#quickSearchInput').value;$('#quickSearch [data-search-close]').click();location.hash='articles?q='+encodeURIComponent(q);if(location.hash==='')route();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#quickSearch').hidden)$('#quickSearch [data-search-close]').click();document.body.classList.remove('nav-open');$('#menuButton').setAttribute('aria-expanded','false');document.querySelectorAll('.has-submenu').forEach(x=>x.classList.remove('is-open'));} });
// Preserve deep links commonly used inside this template when hosted with a fallback.
if(!location.hash&&location.pathname.includes('/p/')){let slug=location.pathname.split('/p/')[1].replace(/\.html\/?$/,'');location.hash=({'penyewaan-alat-tbm-cs':'rental','kolaborasi-kontak':'contact','blog-page':'logo'})[slug]||'page/'+slug;}
route();
})();
