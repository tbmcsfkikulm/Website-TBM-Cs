import {compress} from './images.mjs';
import {mountEditor} from './rich-editor.mjs';
import {createClient,validate,REPO,FILE} from './api.mjs';
import {login} from './auth.mjs';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let client=null,data=null,sha='',baseFileSha='',baseCommit='',branch='',branchCreated=false,pull=null;
let tab='posts',editing=-1,dirty=false,busy=false,formDirty=false,processingImage=false;
let richEditor=null;
const RESUME_KEY='tbmcs-ruang-kelola-branch-v1';
const labels={posts:'Artikel',pages:'Halaman',rentals:'Penyewaan',media:'Media',settings:'Pengaturan',guide:'Cara menggunakan'};
function feedback(message,error=false){$('#feedback').textContent=message;$('#feedback').classList.toggle('error',error);}
function remember(){try{sessionStorage.setItem(RESUME_KEY,JSON.stringify({branch,baseFileSha,pull}));}catch{}}
function forget(){try{sessionStorage.removeItem(RESUME_KEY);}catch{}}
function resume(){try{const x=JSON.parse(sessionStorage.getItem(RESUME_KEY));return /^content\/ruang-kelola-[a-z0-9-]+$/.test(x?.branch)&&/^[a-f0-9]{40}$/.test(x?.baseFileSha)?x:null;}catch{return null;}}
function setBusy(value){busy=value;updateState();}
function updateState(){
  $('#save').disabled=busy||!dirty||!data;
  $('#publish').disabled=busy||dirty||!branchCreated||!!pull;
  $('#reload').disabled=busy;$('#logout').disabled=busy;$('#backup').disabled=!data||busy;
  $('#import').disabled=busy||!data;
  $('#add').disabled=busy;$('#list').inert=busy;$('#login').disabled=busy;
  $('#saveState').textContent=busy?'Sedang menghubungi GitHub…':dirty?'Ada perubahan yang belum disimpan ke GitHub.':branchCreated?'Perubahan tersimpan di branch konten. Website publik belum berubah.':'Konten terbaru dimuat. Belum ada perubahan.';
  $('#branchInfo').textContent=branchCreated?'Branch: '+branch:'Sumber: main · workspace baru dibuat saat penyimpanan pertama.';
  $('#reviewLink').hidden=!pull;$('#reviewLink').href=pull?'https://github.com/'+REPO+'/pull/'+pull:'#';
  $('#branchLink').hidden=!branchCreated;$('#branchLink').href=branchCreated?'https://github.com/'+REPO+'/tree/'+branch:'#';
}
async function load(){
  const head=await client.head();baseCommit=head.object.sha;
  const main=await client.read(baseCommit);
  let incoming=main;const saved=resume();
  branch='content/ruang-kelola-'+Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint8Array(4)),x=>x.toString(16).padStart(2,'0')).join('');
  baseFileSha=main.sha;branchCreated=false;pull=null;
  if(saved){
    let reopen=true;
    if(saved.pull){const pr=await client.pull(saved.pull);if(pr.merged||pr.state==='closed'){forget();reopen=false;}}
    if(reopen){
      try {incoming=await client.read(saved.branch);branch=saved.branch;baseFileSha=saved.baseFileSha;branchCreated=true;pull=saved.pull;}
      catch(error){if(error.status!==404)throw error;forget();}
    }
  }
  data=incoming.data;sha=incoming.sha;dirty=false;render();
}
$('#login').onclick=async()=>{
  setBusy(true);feedback('Menunggu login GitHub…');
  try {
    // The token lives only in this closure/client in memory. Never persisted.
    client=createClient(await login());
    const account=await client.identify();await load();
    $('#identity').textContent='Terhubung sebagai '+account;
    $('#loginPanel').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;
    feedback('Terhubung. Silakan kelola konten Anda.');
  }catch(error){client=null;data=null;feedback(error.message,true);}
  finally{setBusy(false);}
};
$('#logout').onclick=()=>{
  if(dirty&&!confirm('Perubahan belum tersimpan akan hilang. Unduh salinan dahulu bila diperlukan. Tetap keluar?'))return;
  client=null;data=null;dirty=false;sha='';pull=null;branchCreated=false;
  $('#workspace').hidden=true;$('#loginPanel').hidden=false;$('#logout').hidden=true;
  $('#list').replaceChildren();$('#identity').textContent='';feedback('Sesi dashboard berakhir.');updateState();
};
$('#reload').onclick=async()=>{
  if(dirty&&!confirm('Muat ulang akan membuang perubahan yang belum disimpan. Unduh salinan JSON dahulu. Lanjutkan?'))return;
  setBusy(true);try{await load();feedback('Konten dimuat ulang dari GitHub.');}catch(e){feedback(e.message,true);}finally{setBusy(false);}
};
$('#save').onclick=async()=>{
  if(busy||!dirty)return;
  setBusy(true);
  try {
    validate(data);
    if(!branchCreated){await client.createBranch(branch,baseCommit);branchCreated=true;remember();}
    const result=await client.save(branch,sha,data);
    sha=result.content.sha;dirty=false;remember();feedback('Tersimpan ke GitHub. Ajukan publikasi setelah konten siap ditinjau.');
  }catch(error){feedback(error.message+' Salinan lokal tetap tersedia melalui Unduh salinan JSON.',true);}
  finally{setBusy(false);}
};
$('#publish').onclick=async()=>{
  if(busy||dirty||!branchCreated||pull)return;
  if(!confirm('Buat Pull Request untuk meninjau konten ini? Website publik baru berubah setelah Pull Request di-merge.'))return;
  setBusy(true);
  try{
    const main=await client.read('main');
    if(main.sha!==baseFileSha)throw Error('Konten main berubah sejak workspace dimulai. Unduh salinan dan tinjau perbedaan branch di GitHub sebelum publikasi. Dashboard tidak akan menimpa perubahan tersebut.');
    const result=await client.createPull(branch);pull=result.number;remember();feedback('Pull Request dibuat. Buka tautan peninjauan sebelum menyetujui publikasi.');
  }catch(error){feedback(error.message,true);}finally{setBusy(false);}
};
function download(){
  if(!data)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='tbmcs-site-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  feedback('Unduhan salinan diminta. File ini mencakup draft; simpan di tempat yang sesuai.');
}
$('#backup').onclick=download;
$('#import').onchange=async event=>{
  const file=event.target.files[0];if(!file||busy||!data)return;
  try{
    if(file.size>900*1024)throw Error('Salinan JSON maksimal 900 KB.');
    const incoming=validate(JSON.parse(await file.text()));
    if(!confirm('Ganti isi workspace dengan salinan ini? Konten baru dikirim setelah Simpan ke GitHub.'))return;
    data=incoming;changed();
  }catch(error){feedback(error.message,true);}finally{event.target.value='';}
};
function changed(){dirty=true;render();feedback('Perubahan diterapkan di dashboard. Tekan Simpan ke GitHub untuk menyimpannya.');}
function safeImage(url){return /^(https:\/\/|\/uploads\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(url||'')?url:'';}
function render(){
  if(!data)return;
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('#stats').innerHTML='<div class="stat"><strong>'+data.posts.filter(x=>x.status==='published').length+'</strong>Artikel terbit</div><div class="stat"><strong>'+data.posts.filter(x=>x.status==='draft').length+'</strong>Draft artikel</div><div class="stat"><strong>'+data.rentals.length+'</strong>Alat di katalog</div>';
  $('#viewTitle').textContent=labels[tab];$('#viewSubtitle').textContent=({posts:'Cerita yang layak dibagikan.',pages:'Profil dan informasi organisasi.',rentals:'Tarif dan ketersediaan alat.',media:'Cover artikel yang sudah ada dalam konten.',settings:'Identitas dan kontak website.',guide:'Dari gagasan menjadi cerita yang terbit.'})[tab];
  $('#add').hidden=['settings','guide','media'].includes(tab);$('#add').textContent='+ '+({posts:'Artikel',pages:'Halaman',rentals:'Alat'})[tab]+' baru';
  $('#filters').hidden=!['posts','pages','rentals'].includes(tab);$('#statusFilter').parentElement.hidden=tab==='rentals';
  if(tab==='guide'){
    $('#list').innerHTML='<div class="guide"><h2>Dari editor ke website.</h2><ol><li>Tambahkan artikel, halaman, atau alat. Tombol <b>Terapkan perubahan</b> memperbarui workspace di tab ini.</li><li>Pilih <b>draft</b> agar artikel tidak muncul pada website. Draft di repository publik tetap dapat dibaca melalui GitHub.</li><li>Klik <b>Simpan ke GitHub</b>. Konten disimpan ke branch terpisah, bukan main.</li><li>Klik <b>Ajukan publikasi</b> untuk membuat Pull Request. Tinjau perubahan dan preview di GitHub/Cloudflare. Setelah disetujui dan di-merge, Cloudflare membangun ulang website.</li><li>Status simpan berarti commit GitHub berhasil, bukan deployment selesai. Periksa Cloudflare untuk status deployment.</li><li>Unggah cover dari editor artikel. Gambar dikecilkan menjadi WebP maksimal 1.280 px dan 180 KB; gunakan URL HTTPS untuk galeri besar. Format GIF unggahan belum didukung.</li><li>Gunakan <b>Mode sederhana</b> untuk bold, italic, font, tautan, dan foto/grid di tengah tulisan. <b>Mode HTML</b> dan <b>Impor HTML</b> memakai format artikel yang sama; script dan CSS bebas dibuang. Maksimal 6 foto per sisipan, dan total konten 900 KB. Impor HTML mengganti isi artikel yang sedang diedit.</li><li>Login ulang setelah reload. Tab yang sama dapat melanjutkan branch tersimpan. Perubahan yang belum dikirim hilang saat tab ditutup; unduh salinan JSON sebelum meninggalkan halaman.</li><li>Jika terjadi konflik, dashboard tidak menimpa versi lain. Unduh salinan lalu tinjau perubahan melalui GitHub atau Decap.</li></ol></div>';
  }else if(tab==='settings'){
    $('#list').innerHTML='<div class="row"><div><strong>'+esc(data.settings.title)+'</strong><p>'+esc(data.settings.description)+'</p></div><button data-edit="0">Edit</button></div>';
  }else if(tab==='media'){
    const images=data.posts.map((x,i)=>({...x,index:i})).filter(x=>safeImage(x.cover));
    $('#list').innerHTML=images.length?'<div class="media-grid">'+images.map(x=>'<article class="media-card"><img src="'+esc(safeImage(x.cover))+'" alt="'+esc(x.cover_alt||'')+'" loading="lazy" referrerpolicy="no-referrer"><div><strong>'+esc(x.title)+'</strong><p>Cover artikel · '+esc(x.status)+'</p><button data-post="'+x.index+'">Edit artikel</button></div></article>').join('')+'</div>':'<div class="empty"><h2>Ruang untuk gambar.</h2><p>Tambahkan cover dari editor artikel. Cover yang sudah digunakan akan tampil di sini.</p></div>';
  }else{
    const q=$('#search').value.toLocaleLowerCase('id');const status=$('#statusFilter').value;
    const rows=data[tab].map((x,i)=>({x,i})).filter(({x})=>(tab==='rentals'||status==='all'||x.status===status)&&[x.title,x.name,x.slug,x.category].some(v=>String(v||'').toLocaleLowerCase('id').includes(q)));
    $('#list').innerHTML=rows.map(({x,i})=>'<article class="row"><div><strong>'+esc(x.title||x.name)+'</strong><p>'+esc(tab==='rentals'?'Rp'+x.price.toLocaleString('id-ID')+' / '+x.unit:(x.category?x.category+' · ':'')+x.slug)+'</p><span class="tag">'+esc(tab==='rentals'?(x.available?'Tersedia':'Belum tersedia'):x.status==='draft'?'Draft':'Published')+'</span></div><button data-edit="'+i+'">Edit<span class="sr-only"> '+esc(x.title||x.name)+'</span></button></article>').join('')||'<div class="empty"><h2>'+(!data[tab].length?'Mulai dari satu cerita.':'Belum ada yang cocok.')+'</h2><p>'+(!data[tab].length?'Tambahkan konten pertama Anda.':'Coba kata pencarian atau status lain.')+'</p></div>';
  }
  updateState();
}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;$('#search').value='';$('#statusFilter').value='all';render();});
$('#search').oninput=render;$('#statusFilter').onchange=render;
$('#list').onclick=e=>{if(busy)return;const post=e.target.closest('[data-post]');if(post){tab='posts';render();edit(Number(post.dataset.post));return;}const b=e.target.closest('[data-edit]');if(b)edit(Number(b.dataset.edit));};
function field(key,label,value,kind='text',required=false,wide=false){
  let control;
  if(kind==='textarea')control='<textarea name="'+key+'"'+(required?' required':'')+'>'+esc(value)+'</textarea>';
  else if(kind==='status')control='<select name="status"><option value="draft"'+(value==='draft'?' selected':'')+'>Draft — belum ditampilkan</option><option value="published"'+(value==='published'?' selected':'')+'>Published — siap ditampilkan</option></select>';
  else if(kind==='boolean')control='<select name="'+key+'"><option value="true"'+(value===true?' selected':'')+'>Tersedia</option><option value="false"'+(value===false?' selected':'')+'>Belum tersedia</option></select>';
  else control='<input name="'+key+'" type="'+kind+'" value="'+esc(value)+'"'+(required?' required':'')+(kind==='number'?' min="0" step="1"':'')+(key==='slug'?' pattern="[a-z0-9]+(-[a-z0-9]+)*"':'')+'>';
  return '<label'+(wide?' class="wide"':'')+'>'+esc(label)+control+'</label>';
}
function edit(index){
  editing=index;formDirty=false;$('#formFeedback').textContent='';
  const x=tab==='settings'?data.settings:(data[tab][index]||{status:'draft',body:'',date:new Date().toISOString().slice(0,10),available:true,price:0});
  $('#editorTitle').textContent=(index<0?'Tambah ':'Edit ')+({posts:'artikel',pages:'halaman',rentals:'alat',settings:'pengaturan'})[tab];
  let out='';
  if(tab==='settings'){
    for(const [key,label] of Object.entries({title:'Nama website',description:'Deskripsi website',hero_title:'Judul beranda',hero_intro:'Pengantar beranda',rental_phone:'WhatsApp logistik (contoh: 628123456789)',rental_contact:'Nama kontak logistik'}))out+=field(key,label,x[key],'text',true,true);
  }else if(tab==='rentals'){
    out=field('name','Nama alat',x.name,'text',true)+field('category','Kategori',x.category,'text',true)+field('price','Tarif (Rp)',x.price,'number',true)+field('unit','Satuan (contoh: set)',x.unit,'text',true)+field('available','Ketersediaan',x.available,'boolean');
  }else{
    out=field('title','Judul',x.title,'text',true,true)+field('slug','Slug URL — huruf kecil dan tanda -',x.slug,'text',true)+field('status','Status',x.status,'status');
    if(tab==='posts')out+=field('date','Tanggal',x.date,'date',true)+field('category','Bidang / kategori',x.category,'text',true)+field('excerpt','Ringkasan',x.excerpt,'textarea',false,true)+field('cover','URL cover atau gambar unggahan',x.cover,'text',false,true)+'<label class="wide">Unggah gambar<input id="coverFile" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPEG, WebP maksimal 10 MB. Dikecilkan otomatis; gambar tertanam di konten.</small></label>'+field('cover_alt','Deskripsi gambar',x.cover_alt,'text',false,true);
    out+=field('body','Isi — paragraf terpisah dan ## untuk subjudul',x.body,'textarea',false,true);
    if(index>=0)out+='<p class="wide muted">Mengubah slug akan mengubah URL konten. Pertahankan slug untuk tautan yang sudah dibagikan.</p>';
  }
  $('#fields').innerHTML=out;$('#delete').hidden=index<0||tab==='settings';richEditor=null;if(['posts','pages'].includes(tab))richEditor=mountEditor($('#editForm').elements.body,x,()=>{formDirty=true;},compress);$('#editor').showModal();
}
$('#add').onclick=()=>edit(-1);
function closeEditor(){if(processingImage||richEditor?.busy)return;if(formDirty&&!confirm('Buang perubahan formulir yang belum diterapkan?'))return;$('#editor').close();formDirty=false;}
$('#cancel').onclick=closeEditor;$('#editor').addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
$('#fields').addEventListener('input',()=>{formDirty=true;});
$('#delete').onclick=()=>{if(processingImage||richEditor?.busy)return;if(confirm('Hapus item ini dari workspace? Penghapusan dikirim setelah Simpan ke GitHub.')){data[tab].splice(editing,1);formDirty=false;$('#editor').close();changed();}};
$('#editForm').onsubmit=e=>{
  e.preventDefault();if(processingImage){$('#formFeedback').textContent='Tunggu pemrosesan cover selesai.';return;}const x=Object.fromEntries(new FormData(e.target));
  // File inputs are transport-only, never inserted into site.json.
  for(const [key,value] of Object.entries(x))if(value instanceof File)delete x[key];
  if(tab==='rentals'){x.price=Number(x.price);x.available=x.available==='true';}
  if(richEditor){try{Object.assign(x,richEditor.read());}catch(error){$('#formFeedback').textContent=error.message;return;}}
  const next=structuredClone(data);
  if(tab==='settings')next.settings={...data.settings,...x};else if(editing<0)next[tab].push(x);else next[tab][editing]={...next[tab][editing],...x};
  try{validate(next);data=next;formDirty=false;$('#editor').close();changed();}catch(error){$('#formFeedback').textContent=error.message;}
};
$('#fields').addEventListener('change',async e=>{
  if(e.target.id!=='coverFile'||!e.target.files[0])return;
  if(processingImage)return;processingImage=true;
  const file=e.target.files[0],form=$('#editForm'),submit=form.querySelector('[type="submit"]');submit.disabled=true;$('#cancel').disabled=true;$('#delete').disabled=true;
  try{const image=await compress(file);form.elements.cover.value=image;formDirty=true;$('#formFeedback').textContent='Cover diperkecil dan siap diterapkan.';}
  catch(error){$('#formFeedback').textContent=error.message;}
  finally{processingImage=false;submit.disabled=false;$('#cancel').disabled=false;$('#delete').disabled=false;}
});
window.addEventListener('beforeunload',e=>{if(dirty||formDirty||busy){e.preventDefault();e.returnValue='';}});
updateState();
