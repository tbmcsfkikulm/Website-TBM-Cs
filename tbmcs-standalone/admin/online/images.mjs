export async function compress(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Pilih PNG, JPEG, atau WebP maksimal 10 MB.');
  const bitmap=await createImageBitmap(file);
  try{
    if(bitmap.width*bitmap.height>40_000_000)throw Error('Resolusi gambar terlalu besar. Pilih gambar di bawah 40 megapiksel.');
    const canvas=document.createElement('canvas');const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.82,.65,.45,.25]){
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
      if(blob?.type==='image/webp'&&blob.size<=180*1024)return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Gambar gagal dibaca.'));reader.readAsDataURL(blob);});
    }
    throw Error('Gambar belum dapat dikecilkan di bawah 180 KB. Gunakan gambar yang lebih sederhana atau URL HTTPS.');
  }finally{bitmap.close();}
}
