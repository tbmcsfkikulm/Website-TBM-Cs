export const REPO = 'tbmcsfkikulm/Website-TBM-Cs';
export const FILE = 'tbmcs-standalone/content/site.json';
export const MAX_BYTES = 900 * 1024;
const PREFIX = '/repos/' + REPO;
function checkBranch(branch) {
  if(!/^content\/ruang-kelola-[a-z0-9-]+$/.test(branch))throw Error('Penyimpanan hanya diizinkan ke branch konten Ruang Kelola.');
  return branch;
}
export class ApiError extends Error {
  constructor(status) {
    super(({401:'Sesi GitHub berakhir. Login kembali.',403:'Akses ditolak atau batas API tercapai. Periksa izin repository dan organisasi.',404:'Konten atau branch tidak ditemukan.',409:'Konten telah berubah. Unduh salinan Anda, lalu muat ulang sebelum menyimpan.',422:'Permintaan ditolak. Branch atau Pull Request mungkin sudah ada.'})[status] || 'GitHub belum dapat dihubungi. Periksa koneksi lalu muat ulang; jangan menganggap penyimpanan berhasil.');
    this.status = status;
  }
}
export function encode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function decode(value) {
  return new TextDecoder('utf-8', {fatal:true}).decode(Uint8Array.from(atob(value.replace(/\s/g,'')), c=>c.charCodeAt(0)));
}
export function validate(data) {
  if (data?.version !== 1 || !data.settings || !['posts','pages','rentals'].every(k=>Array.isArray(data[k]))) throw Error('Struktur konten tidak kompatibel.');
  for (const key of ['title','description','hero_title','hero_intro','rental_phone','rental_contact']) {
    if (typeof data.settings[key] !== 'string' || !data.settings[key].trim()) throw Error('Pengaturan wajib diisi: '+key);
  }
  if (!/^[1-9][0-9]{7,14}$/.test(data.settings.rental_phone)) throw Error('WhatsApp harus memakai kode negara tanpa +, contoh 628123456789.');
  for (const kind of ['posts','pages']) {
    const slugs = new Set();
    for (const item of data[kind]) {
      if (typeof item.title !== 'string' || !item.title.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug) || !['draft','published'].includes(item.status) || typeof item.body !== 'string') throw Error('Judul, slug unik, status, dan isi wajib valid.');
      slugs.add(item.slug);
      if(item.body_html!==undefined&&typeof item.body_html!=='string')throw Error('HTML artikel harus berupa teks.');
      if (kind === 'posts' && (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || '') || !item.category?.trim())) throw Error('Tanggal dan kategori artikel wajib diisi.');
      if (item.cover && !/^(https:\/\/|\/uploads\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(item.cover)) throw Error('Cover harus gambar HTTPS, /uploads/, atau gambar unggahan.');
    }
  }
  for (const item of data.rentals) {
    if (!['name','unit','category'].every(k=>typeof item[k]==='string' && item[k].trim()) || !Number.isInteger(item.price) || item.price < 0 || typeof item.available !== 'boolean') throw Error('Nama alat, kategori, satuan, tarif bulat, dan ketersediaan wajib valid.');
  }
  if (new TextEncoder().encode(JSON.stringify(data,null,2)+'\n').length > MAX_BYTES) throw Error('Konten melebihi 900 KB. Kurangi ukuran/jumlah gambar tertanam atau gunakan URL cover HTTPS.');
  return data;
}
export function createClient(token, fetcher=fetch) {
  async function request(path, method='GET', body) {
    // Fixed origin and repository. Credentials never follow redirects.
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),25000);
    try {
      const response = await fetcher('https://api.github.com'+path, {
        method, redirect:'error', signal:controller.signal,
        headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},
        ...(body?{body:JSON.stringify(body)}:{})
      });
      if (!response.ok) throw new ApiError(response.status);
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0);
    } finally {clearTimeout(timer);}
  }
  return {
    async identify() {
      const user=await request('/user');
      const repo=await request(PREFIX);
      if (!repo.permissions?.push) throw new ApiError(403);
      return user.login;
    },
    head:()=>request(PREFIX+'/git/ref/heads/main'),
    async read(ref) {
      const file=await request(PREFIX+'/contents/'+FILE+'?ref='+encodeURIComponent(ref));
      if (file.encoding !== 'base64') throw Error('Konten terlalu besar atau format tidak didukung.');
      return {data:validate(JSON.parse(decode(file.content))),sha:file.sha};
    },
    createBranch:(branch,sha)=>request(PREFIX+'/git/refs','POST',{ref:'refs/heads/'+checkBranch(branch),sha}),
    save:(branch,sha,data)=>request(PREFIX+'/contents/'+FILE,'PUT',{message:'content: perbarui dari Ruang Kelola',branch:checkBranch(branch),sha,content:encode(JSON.stringify(validate(data),null,2)+'\n')}),
    pull:number=>request(PREFIX+'/pulls/'+number),
    createPull:branch=>request(PREFIX+'/pulls','POST',{title:'Publikasi konten dari Ruang Kelola',head:checkBranch(branch),base:'main',body:'Perubahan konten disimpan melalui Ruang Kelola. Tinjau isi dan deployment preview sebelum melakukan merge. Artikel berstatus draft tetap disaring oleh build.'})
  };
}
