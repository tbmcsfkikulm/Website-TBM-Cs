#!/usr/bin/env python3
"""Build standalone HTML using Python 3 standard library only."""
from pathlib import Path
import json,re,shutil,html,base64,mimetypes
ROOT=Path(__file__).resolve().parent

def validate(d):
 if d.get('version')!=1:raise ValueError('Versi konten harus 1.')
 if not isinstance(d.get('settings'),dict):raise ValueError('Pengaturan tidak valid.')
 for k in ('title','description','hero_title','hero_intro','rental_phone','rental_contact'):
  if not isinstance(d['settings'].get(k),str) or not d['settings'][k].strip():raise ValueError('Pengaturan wajib: '+k)
 if not re.fullmatch(r'[1-9][0-9]{7,14}',d['settings']['rental_phone']):raise ValueError('Nomor WhatsApp harus format internasional tanpa +.')
 for kind in ('posts','pages'):
  if not isinstance(d.get(kind),list):raise ValueError(kind+' harus berupa daftar.')
  slugs=set()
  for item in d[kind]:
   slug=item.get('slug','')
   if not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',slug) or slug in slugs:raise ValueError('Slug tidak valid atau ganda: '+slug)
   slugs.add(slug)
   if item.get('status') not in ('draft','published'):raise ValueError('Status harus draft/published.')
   if not item.get('title','').strip():raise ValueError('Judul wajib diisi.')
   if not isinstance(item.get('body',''),str):raise ValueError('Isi harus teks.')
   cover=item.get('cover','')
   if cover and not re.match(r'^(https://|/uploads/|data:image/(png|jpeg|webp|gif);base64,)',cover):raise ValueError('URL cover tidak didukung.')
 if not isinstance(d.get('rentals'),list):raise ValueError('rentals harus daftar.')
 for x in d['rentals']:
  if not isinstance(x.get('price'),(int,float)) or x['price']<0:raise ValueError('Tarif tidak valid.')
  if not all(isinstance(x.get(k),str) and x[k].strip() for k in ('name','unit','category')):raise ValueError('Nama, satuan, dan kategori alat wajib diisi.')
  if not isinstance(x.get('available'),bool):raise ValueError('Ketersediaan alat harus boolean.')
 return d

def public_data(d):
 d=json.loads(json.dumps(d))
 for kind in ('posts','pages'):
  d[kind]=[x for x in d[kind] if x['status']=='published']
  for x in d[kind]:
   cover=x.get('cover','')
   if cover.startswith('/uploads/'):
    path=(ROOT/'public'/cover.lstrip('/')).resolve();base=(ROOT/'public/uploads').resolve()
    if not path.is_relative_to(base) or not path.is_file():raise ValueError('Cover tidak ditemukan: '+cover)
    mime=mimetypes.guess_type(path.name)[0]
    if mime not in ('image/png','image/jpeg','image/webp','image/gif'):raise ValueError('Format cover tidak didukung.')
    x['cover']='data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
 return d

def serial(d):return json.dumps(d,ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
def template():
 src=ROOT/'src';css=(src/'original-style.css').read_text()+'\n'+(src/'standalone.css').read_text()
 interactions=(src/'interactions.js').read_text().replace("page.querySelectorAll('.rental-item')","page.querySelectorAll('.rental-item:not([data-unavailable])')")
 # The selected functions use the configured rental contact, without hardcoding credentials.
 interactions=interactions.replace("'https://wa.me/6282275457472?text='","'https://wa.me/'+JSON.parse(document.getElementById('site-data').textContent).settings.rental_phone+'?text='")
 interactions=interactions.replace("'Halo Kak Siti Melati, saya ingin mengajukan", "'Halo '+JSON.parse(document.getElementById('site-data').textContent).settings.rental_contact+', saya ingin mengajukan")
 return '<!DOCTYPE html>\n<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#062f1b"><meta name="color-scheme" content="light dark"><title>@@TITLE@@</title><meta name="description" content="@@DESCRIPTION@@"><script>try{document.documentElement.dataset.theme=localStorage.getItem("tbmcs-theme")||"light"}catch(e){}</script><style>'+css+'</style></head><body class="home-view"><noscript><p class="noscript-note">Aktifkan JavaScript untuk navigasi halaman, pencarian, dan formulir. Kontak organisasi tetap tersedia pada beranda.</p></noscript>'+(src/'shell.html').read_text()+'<script id="site-data" type="application/json">@@DATA@@</script><script>'+(src/'app.js').read_text()+'</script><script>'+interactions+'</script><script>'+(src/'logo.js').read_text()+'</script></body></html>'
def render(d):return template().replace('@@TITLE@@',html.escape(d['settings']['title'])).replace('@@DESCRIPTION@@',html.escape(d['settings']['description'],quote=True)).replace('@@DATA@@',serial(public_data(d)))
def main():
 d=validate(json.loads((ROOT/'content/site.json').read_text()));dist=ROOT/'dist';dist.mkdir(exist_ok=True)
 (dist/'index.html').write_text(render(d))
 admin=(ROOT/'admin/editor.html').read_text().replace('@@SEED@@',serial(public_data(d))).replace('@@TEMPLATE@@',serial(template()))
 (dist/'admin.html').write_text(admin);(dist/'admin').mkdir(exist_ok=True)
 for name in ('index.html','config.yml'):
  if (ROOT/'admin'/name).exists():shutil.copy2(ROOT/'admin'/name,dist/'admin'/name)
 (dist/'_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/admin*\n  X-Robots-Tag: noindex, nofollow\n')
 # Fallback supports old /p/ links; content itself uses portable hash URLs.
 (dist/'404.html').write_text(render(d))
 print('Build OK:',len(d['posts']),'artikel sumber;',len(public_data(d)['posts']),'publik;',len(d['rentals']),'alat. Output: dist/')
if __name__=='__main__':main()
