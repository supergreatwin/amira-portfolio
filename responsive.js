
/* Working interactions; publication, CMS and mailing are handled by the existing services. */
(()=>{
  const dialog=document.querySelector('#rs-newsletter-dialog');
  const triggers=[...document.querySelectorAll('[data-newsletter-open]')];
  if(dialog&&typeof dialog.showModal==='function'){
    for(const button of triggers)button.addEventListener('click',()=>{
      if(!dialog.open)dialog.showModal();
      dialog.querySelector('.rs-dialog-close')?.focus();
    });
    dialog.querySelector('[data-newsletter-close]')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  }else{
    for(const button of triggers)button.addEventListener('click',()=>{location.href='notes.html#newsletter'});
  }
  const menu=document.querySelector('.mobile-menu');
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.open=false));
})();
