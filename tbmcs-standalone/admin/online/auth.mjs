export const AUTH_ORIGIN = 'https://auth.tbmcs.web.id';
const ALLOWED = new Set(['https://tbmcs.web.id','https://website-tbm-cs.pages.dev']);
export function login() {
  if (!ALLOWED.has(location.origin)) return Promise.reject(Error('Login tersedia di tbmcs.web.id atau website-tbm-cs.pages.dev. Host preview belum diizinkan oleh Worker.'));
  return new Promise((resolve,reject)=>{
    let popup, timer, poll, finished=false;
    const done=(error,token)=>{
      if(finished)return;finished=true;
      window.removeEventListener('message',receive);clearTimeout(timer);clearInterval(poll);
      if(popup&&!popup.closed)popup.close();
      error?reject(error):resolve(token);
    };
    const receive=event=>{
      if(event.origin!==AUTH_ORIGIN||event.source!==popup||typeof event.data!=='string')return;
      if(event.data==='authorizing:github') {popup.postMessage('authorizing:github',AUTH_ORIGIN);return;}
      const prefix='authorization:github:success:';
      if(event.data.startsWith(prefix)) {
        try {
          const result=JSON.parse(event.data.slice(prefix.length));
          if(result.provider!=='github'||typeof result.token!=='string'||!result.token.trim())throw Error();
          done(null,result.token);
        } catch {done(Error('Respons login tidak valid. Ulangi dari dashboard.'));}
      } else if(event.data.startsWith('authorization:github:error:'))done(Error('GitHub menolak login. Ulangi dari dashboard.'));
    };
    window.addEventListener('message',receive);
    popup=window.open(AUTH_ORIGIN+'/auth?provider=github&site_id='+encodeURIComponent(location.origin),'tbmcs-ruang-kelola-login','popup,width=650,height=720');
    if(!popup){done(Error('Popup diblokir. Izinkan popup untuk website ini lalu coba lagi.'));return;}
    timer=setTimeout(()=>done(Error('Login melewati batas waktu. Tutup popup dan ulangi login.')),180000);
    poll=setInterval(()=>{if(popup.closed)done(Error('Jendela login ditutup. Silakan coba kembali.'));},1000);
  });
}
