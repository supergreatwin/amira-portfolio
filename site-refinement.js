/* Shared classic enhancements. No third-party form iframe is loaded before user action. */
(()=>{
function initForms(){
 const buttons=[...document.querySelectorAll('[data-tally-form]')];if(!buttons.length)return;
 const d=document.createElement('dialog');d.className='amira-tally-dialog';d.setAttribute('aria-label','Open Studio form');
 d.innerHTML='<div class="amira-tally-top"><strong>Amira Abdelfadil</strong><button type="button" aria-label="Close form">×</button></div><iframe title="Submission form" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
 const css=document.createElement('style');css.textContent='.amira-tally-dialog{position:fixed;inset:0;margin:auto;width:min(700px,calc(100vw - 24px));height:min(80dvh,750px);padding:0;background:#f8f4ec;color:#292420;border:1px solid #784a50;box-shadow:0 24px 65px #0006}.amira-tally-dialog::backdrop{background:#000a}.amira-tally-top{padding:13px 18px;display:flex;align-items:center;justify-content:space-between}.amira-tally-top button{font-size:23px;border:0;background:none;cursor:pointer}.amira-tally-dialog iframe{height:calc(100% - 55px);width:100%;border:0}';
 document.head.append(css);document.body.append(d);
 const frame=d.querySelector('iframe');d.querySelector('button').addEventListener('click',()=>d.close());
 d.addEventListener('close',()=>frame.removeAttribute('src'));
 buttons.forEach(button=>button.addEventListener('click',()=>{
 frame.src='https://tally.so/embed/'+button.dataset.tallyForm+'?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
 d.showModal();
 }));
}
function initAnnouncement(){
 if(!/\/(ar\/)?collaborations(\.html)?\/?$/.test(location.pathname))return;
 const ar=/\/ar\//.test(location.pathname);
 const d=document.createElement('dialog');d.className='amira-collaboration-notice';d.dir=ar?'rtl':'ltr';d.lang=ar?'ar':'en';
 const title=ar?'حكايات قيد التحضير.':'Something’s in the making.';
 const label=ar?'قريبًا · تعاونات جديدة':'UPCOMING / COLLABORATIONS';
 const lead=ar?'تعاونان مرتقبان مع أميرة عبد الفضيل.':'Two upcoming collaborations with Amira Abdel-Fadil.';
 const status=ar?'تعاون مرتقب':'Upcoming collaboration',close=ar?'إغلاق':'Close';
 d.innerHTML='<div class="notice-head"><strong>'+(ar?'أميرة عبد الفضيل':'amira abdelfadil')+'</strong><button type="button" aria-label="'+close+'">×</button></div><div class="notice-film"><small>SCENE 01 · IN PRODUCTION</small><h2>'+title+'</h2></div><div class="notice-body"><p class="notice-label">'+label+'</p><p class="notice-lead">'+lead+'</p><div class="notice-entry"><span>01</span><div><h3>Nausicaa Emotional Alchemy</h3><p>'+status+'</p></div></div><div class="notice-entry"><span>02</span><div><h3>'+(ar?'اليونيسف (UNICEF)':'UNICEF')+'</h3><p>'+status+'</p></div></div><button class="notice-close" type="button">'+close+'</button></div>';
 const st=document.createElement('style');st.textContent='.amira-collaboration-notice{position:fixed;inset:0;margin:auto;padding:0;width:min(620px,calc(100vw - 24px));max-height:90dvh;overflow:auto;background:#f8f4ec;color:#292420;border:1px solid #a98b90;box-shadow:0 25px 70px #0007;border-radius:3px}.amira-collaboration-notice::backdrop{background:#0009}.notice-head{display:flex;align-items:center;justify-content:space-between;padding:16px 24px}.notice-head strong{font-size:20px;letter-spacing:-.07em}.notice-head button{height:40px;width:40px;border:1px solid #cdb7b7;background:transparent;font-size:25px;cursor:pointer}.notice-film{background:#754651;color:#fff;padding:25px 28px}.notice-film small{font-size:11px;letter-spacing:.16em}.notice-film h2{margin:10px 0 0;font-size:clamp(32px,5vw,53px);line-height:1.1;font-weight:600;font-style:italic}.notice-body{padding:22px 28px}.notice-label{font-size:12px;letter-spacing:.13em;color:#784a50;font-weight:750}.notice-lead{margin:9px 0 22px;color:#665b54}.notice-entry{display:grid;grid-template-columns:35px 1fr;gap:12px;padding:16px 0;border-top:1px solid #d5c8c6}.notice-entry>span{font-size:13px;color:#784a50}.notice-entry h3{font-size:22px;line-height:1.2;margin:0}.notice-entry p{margin:5px 0;color:#665b54;font-size:13px}.notice-close{padding:12px 20px;background:#784a50;color:#fff;border:1px solid #784a50;cursor:pointer}';
 document.head.append(st);document.body.append(d);
 const closeIt=()=>d.close();
 d.querySelector('.notice-head button').addEventListener('click',closeIt);
 d.querySelector('.notice-close').addEventListener('click',closeIt);
 const timeout=setTimeout(()=>{if(d.open)d.close()},12*60*1000);
 d.addEventListener('close',()=>clearTimeout(timeout));
 if(document.readyState==='complete')d.showModal();else window.addEventListener('load',()=>d.showModal(),{once:true});
}
function initUnifiedMenus(){
  document.querySelectorAll('details.amira-more-menu').forEach(menu=>{
    const toggle=menu.querySelector('summary');
    menu.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&menu.open){menu.open=false;toggle.focus();}
    });
    menu.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;}));
    document.addEventListener('pointerdown',event=>{
      if(menu.open&&!menu.contains(event.target))menu.open=false;
    });
  });
}
const start=()=>{initForms();initAnnouncement();initUnifiedMenus();document.querySelectorAll('.footer-base a[href="#top"]').forEach(a=>a.remove())};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
