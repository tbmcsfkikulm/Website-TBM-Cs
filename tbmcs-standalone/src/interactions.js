//
  (function(){
    var body=document.body;
    var menuButton=document.getElementById('menuButton');
    var nav=document.getElementById('primary-navigation');
    var submenuButtons=document.querySelectorAll('.submenu-button');

    if(menuButton&&nav){
      menuButton.addEventListener('click',function(){
        var open=body.classList.toggle('nav-open');
        menuButton.setAttribute('aria-expanded',open?'true':'false');
        var header=document.querySelector('.site-header');
        if(open&&window.innerWidth<=800&&header)nav.style.top=Math.max(10,Math.round(header.getBoundingClientRect().bottom+10))+'px';
      });
      nav.addEventListener('click',function(event){
        if(event.target.closest('a')&&window.innerWidth<=800){
          body.classList.remove('nav-open');
          menuButton.setAttribute('aria-expanded','false');
        }
      });
    }

    submenuButtons.forEach(function(button){
      button.addEventListener('click',function(){
        var parent=button.parentElement;
        var open=parent.classList.toggle('is-open');
        button.setAttribute('aria-expanded',open?'true':'false');
      });
    });

    function setupQuickSearch(){
      var toggle=document.getElementById('searchToggle');
      var dialog=document.getElementById('quickSearch');
      var input=document.getElementById('quickSearchInput');
      if(!toggle||!dialog)return;
      var closeButtons=dialog.querySelectorAll('[data-search-close]');
      var hideTimer=null,focusTimer=null,frame=null,previousFocus=null;
      function setOpen(open){
        window.clearTimeout(hideTimer);window.clearTimeout(focusTimer);window.cancelAnimationFrame(frame);
        toggle.setAttribute('aria-expanded',open?'true':'false');
        body.classList.toggle('search-open',open);
        if(open){
          if(dialog.hidden)previousFocus=document.activeElement;
          body.classList.remove('nav-open');
          if(menuButton)menuButton.setAttribute('aria-expanded','false');
          var header=document.querySelector('.site-header');
          dialog.hidden=false;
          frame=window.requestAnimationFrame(function(){dialog.classList.add('is-open');});
          focusTimer=window.setTimeout(function(){if(input&&!dialog.hidden)input.focus();},80);
        }else{
          dialog.classList.remove('is-open');
          hideTimer=window.setTimeout(function(){dialog.hidden=true;},180);
          (previousFocus&&previousFocus.isConnected?previousFocus:toggle).focus();
        }
      }
      toggle.addEventListener('click',function(){setOpen(toggle.getAttribute('aria-expanded')!=='true');});
      dialog.addEventListener('keydown',function(event){
        if(event.key!=='Tab')return;
        var items=Array.from(dialog.querySelectorAll('button,input,a[href],[tabindex="0"]')).filter(function(el){return !el.disabled&&el.getClientRects().length;});
        var first=items[0],last=items[items.length-1];
        if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
      });
      closeButtons.forEach(function(button){button.addEventListener('click',function(){setOpen(false);});});
    }

    
    function setupThemeSwitch(){
      var button=document.getElementById('themeSwitch');
      if(!button)return;
      function update(){
        var dark=document.documentElement.getAttribute('data-theme')==='dark';
        button.setAttribute('aria-pressed',dark?'true':'false');
        button.setAttribute('aria-label',dark?'Aktifkan mode terang':'Aktifkan mode gelap');
        var label=document.getElementById('themeSwitchText');
        if(label)label.textContent=dark?'Mode terang':'Mode gelap';
        var themeMeta=document.querySelector('meta[name="theme-color"]');
        if(themeMeta)themeMeta.content=dark?'#0a1912':'#062f1b';
        var scheme=document.querySelector('meta[name="color-scheme"]');if(scheme)scheme.content=dark?'dark':'light';
      }
      button.addEventListener('click',function(){
        var dark=document.documentElement.getAttribute('data-theme')==='dark';
        if(dark)document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme','dark');
        try{localStorage.setItem('tbmcs-theme',dark?'light':'dark');}catch(e){}
        update();
      });
      update();
    }

    
    function setupDonationNotice(){
      var overlay=document.getElementById('donationNotice');if(!overlay)return;
      var posterSource=overlay.querySelector('.donation-poster img'),posterCopy=document.querySelector('[data-tbm-campaign-poster]');if(posterSource&&posterCopy)posterCopy.src=posterSource.src;
      var dialog=overlay.querySelector('.donation-dialog'),closeButton=overlay.querySelector('#donationClose');
      var original=overlay.querySelector('.donation-layout'),report=overlay.querySelector('#tbmDonationReportPanel');
      var banner=document.getElementById('tbmDonationCenter'),status=document.getElementById('tbmDonationStatus');
      var bannerButton=document.getElementById('tbmDonationBannerButton');
      var triggers=document.querySelectorAll('[data-tbm-donation-open]');
      var previousFocus=null,blocked=[],timer=null;
      var campaign=overlay.getAttribute('data-campaign-id')||'umum',key='tbmcs-donation-seen-'+campaign;
      function dateValue(value){return value?Date.parse(value):NaN;}
      function phase(){
        var start=overlay.getAttribute('data-starts-at'),end=dateValue(overlay.getAttribute('data-ends-at'));
        if(overlay.getAttribute('data-enabled')!=='true')return 'inactive';
        if(!Number.isFinite(end)||(start&&!Number.isFinite(dateValue(start))))return 'invalid';
        if(start&&dateValue(start)>end)return 'invalid';
        if(start&&Date.now()<dateValue(start))return 'upcoming';
        return Date.now()>end?'ended':'active';
      }
      function dateText(value){
        var date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
        return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date)+' WITA';
      }
      function reportUrl(){
        var value=(overlay.getAttribute('data-report-url')||'').trim();if(!value)return '';
        try{var url=new URL(value,location.href);return url.protocol==='https:'?url.href:'';}catch(e){return '';}
      }
      function sync(){
        var state=phase(),active=state==='active',start=overlay.getAttribute('data-starts-at'),end=overlay.getAttribute('data-ends-at');
        var period=(start?'Periode: '+dateText(start)+' — ':'Sampai ')+dateText(end);
        document.querySelectorAll('[data-tbm-donation-period]').forEach(function(el){el.textContent=period;});
        var text=active?'Donasi karhutla sedang dibuka.':state==='ended'?'Penggalangan telah selesai. Lihat informasi penyaluran.':state==='upcoming'?'Kampanye akan dibuka pada '+dateText(start)+'.':state==='inactive'?'Tidak ada penggalangan aktif untuk kampanye ini.':'Informasi periode kampanye sedang diperbarui.';
        if(status)status.textContent=text;
        if(bannerButton)bannerButton.textContent=active?'Lihat cara donasi':'Lihat status & laporan';
        original.hidden=!active;report.hidden=active;
        var bannerPoster=document.querySelector('#tbmDonationCenter .tbm-donation-banner-poster');if(bannerPoster)bannerPoster.hidden=!active;
        report.querySelector('[data-tbm-report-state]').textContent=active?'':text;
        var url=reportUrl(),link=report.querySelector('[data-tbm-report-link]'),note=report.querySelector('[data-tbm-report-note]');
        link.hidden=!url;if(url)link.href=url;else link.removeAttribute('href');
        note.textContent=url?'Baca laporan yang telah dipublikasikan melalui tautan berikut.':state==='active'||state==='upcoming'?'Laporan penyaluran akan ditautkan di sini setelah tersedia.':'Laporan penyaluran belum ditautkan. Hubungi TBM-Cs untuk menanyakan informasi yang tersedia.';
        if(!overlay.hidden){dialog.setAttribute('aria-labelledby',active?'donationTitle':'tbmDonationReportTitle');dialog.setAttribute('aria-describedby',active?'donationText':'tbmDonationReportDescription');}
        return state;
      }
      function close(){
        if(overlay.hidden)return;
        overlay.hidden=true;body.classList.remove('donation-open');
        blocked.forEach(function(item){item.el.inert=item.was;});blocked=[];
        if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
      }
      function open(invoker){
        var state=sync();window.clearTimeout(timer);
        if(!overlay.hidden)return;
        var search=document.getElementById('quickSearch');
        if(search&&!search.hidden){var searchClose=search.querySelector('[data-search-close]');if(searchClose)searchClose.click();}
        previousFocus=invoker||document.activeElement;
        body.classList.remove('nav-open');if(menuButton)menuButton.setAttribute('aria-expanded','false');
        overlay.hidden=false;body.classList.add('donation-open');
        dialog.setAttribute('aria-labelledby',state==='active'?'donationTitle':'tbmDonationReportTitle');
        dialog.setAttribute('aria-describedby',state==='active'?'donationText':'tbmDonationReportDescription');
        Array.from(body.children).forEach(function(el){if(el===overlay||el.contains(overlay)||el.tagName==='SCRIPT')return;blocked.push({el:el,was:el.inert});el.inert=true;});
        if(state==='active')try{sessionStorage.setItem(key,'1');}catch(e){}
        closeButton.focus({preventScroll:true});
      }
      triggers.forEach(function(button){if(!button.classList.contains('tbm-donation-banner-poster'))button.hidden=false;button.addEventListener('click',function(){open(button);});});
      closeButton.addEventListener('click',close);
      overlay.addEventListener('click',function(event){if(event.target===overlay)close();});
      var confirm=overlay.querySelector('.donation-action');if(confirm)confirm.addEventListener('click',close);
      overlay.addEventListener('keydown',function(event){
        if(overlay.hidden)return;
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();event.stopPropagation();return;}
        if(event.key!=='Tab')return;
        var list=Array.from(dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')).filter(function(el){return !el.closest('[hidden]')&&el.getClientRects().length;});
        var first=list[0],last=list[list.length-1];if(!first){event.preventDefault();return;}
        if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
      });
      sync();window.setInterval(sync,30000);
      document.addEventListener('visibilitychange',function(){if(!document.hidden)sync();});
      var seen=false;try{seen=sessionStorage.getItem(key)==='1';}catch(e){}
      if(body.classList.contains('home-view')&&phase()==='active'&&(overlay.getAttribute('data-repeat-on-refresh')==='true'||!seen)){
        timer=window.setTimeout(function(){if(phase()==='active'&&!body.classList.contains('search-open')&&!body.classList.contains('nav-open'))open();},1500);
      }
    }

    
    function setupSimpleRental(){
      var page=document.getElementById('rentalPage'),form=document.getElementById('tbmRentalForm');
      if(!page||!form)return;
      var tool=form.querySelector('[name="tool"]'),quantity=form.querySelector('[name="quantity"]'),date=form.querySelector('[name="date"]');
      var unit=form.querySelector('#tbmRentalUnit'),feedback=form.querySelector('#tbmRentalFeedback'),button=form.querySelector('[type="submit"]');
      page.querySelectorAll('.rental-item').forEach(function(card){
        var title=card.querySelector('h3'),price=card.querySelector('.rental-price'),small=price&&price.querySelector('small');if(!title)return;
        var option=document.createElement('option');option.value=title.textContent.trim();option.textContent=option.value+(price?' — '+price.textContent.trim():'');
        option.dataset.unit=small?small.textContent.replace(/^\s*\/\s*/,'').trim():'unit';tool.appendChild(option);
      });
      function today(){
        var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
        function part(type){return parts.find(function(p){return p.type===type;}).value;}
        return part('year')+'-'+part('month')+'-'+part('day');
      }
      function update(){
        var option=tool.options[tool.selectedIndex],text=option&&option.dataset.unit;
        unit.textContent=text?'Satuan: '+text+'. Masukkan jumlah sesuai satuan pada katalog.':'Pilih alat untuk melihat satuannya.';
      }
      tool.addEventListener('change',update);date.min=today();date.addEventListener('focus',function(){date.min=today();});
      form.addEventListener('input',function(){date.setCustomValidity('');feedback.textContent='';});
      form.addEventListener('submit',function(event){
        event.preventDefault();date.min=today();date.setCustomValidity('');
        if(!form.reportValidity())return;
        if(date.value<today()){date.setCustomValidity('Pilih tanggal hari ini atau sesudahnya.');date.reportValidity();return;}
        var option=tool.options[tool.selectedIndex],units=option.dataset.unit||'unit';
        if(/^\d+\s/.test(units))units='paket ('+units+')';
        var identity=form.querySelector('[name="identity"]').value.trim();
        var message='Halo Kak Siti Melati, saya ingin mengajukan penyewaan alat TBM-Cs.\n\nAlat: '+tool.value+'\nJumlah: '+quantity.value+' '+units+'\nTanggal pemakaian: '+date.value+' (WITA)'+(identity?'\nNama/instansi: '+identity:'')+'\n\nMohon konfirmasi ketersediaan, durasi sewa, tarif akhir, dan SOP. Terima kasih.';
        window.open('https://wa.me/6282275457472?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
        feedback.textContent='Pesan telah disiapkan. Periksa isinya, lalu tekan Kirim di WhatsApp.';
      });
      form.hidden=false;button.disabled=false;update();
    }

    
    function setupBackToTop(){
      var button=document.getElementById('backToTop');
      if(!button)return;
      function update(){button.classList.toggle('is-visible',window.scrollY>600);}
      window.addEventListener('scroll',update,{passive:true});update();
      button.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
    }

    
    function setupSmartHeader(){
      var header=document.querySelector('.site-header');
      if(!header)return;
      var lastY=window.scrollY;var ticking=false;
      function update(){
        var currentY=Math.max(0,window.scrollY);
        header.classList.toggle('is-scrolled',currentY>14);
        header.classList.toggle('is-compact',currentY>80);
        
        lastY=currentY;ticking=false;
        if(window.innerWidth>800&&body.classList.contains('nav-open')){body.classList.remove('nav-open');if(menuButton)menuButton.setAttribute('aria-expanded','false');if(nav)nav.style.top='';}
        if(nav&&body.classList.contains('nav-open')&&window.innerWidth<=800)nav.style.top=Math.max(10,Math.round(header.getBoundingClientRect().bottom+10))+'px';
      }
      function requestUpdate(){if(!ticking){window.requestAnimationFrame(update);ticking=true;}}
      window.addEventListener('scroll',requestUpdate,{passive:true});window.addEventListener('resize',requestUpdate);update();
    }

    
 setupQuickSearch();setupThemeSwitch();setupDonationNotice();setupSimpleRental();setupBackToTop();setupSmartHeader();
})();