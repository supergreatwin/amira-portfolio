
/* No video file is requested until the visitor explicitly selects playback. */
(()=>{
 const dialog=document.getElementById('special-player');if(!dialog)return;
 const video=dialog.querySelector('video'),label=document.getElementById('special-player-title');
 const close=()=>{video.pause();video.removeAttribute('src');video.load();dialog.close();};
 for(const btn of document.querySelectorAll('[data-video-src]')){
   btn.addEventListener('click',()=>{
     const path=btn.getAttribute('data-video-src');
     if(!/^((\.\.\/)?assets\/)portrait-(feature|opening|future|conversation|river)\.mp4$/.test(path))return;
     label.textContent=btn.getAttribute('data-video-title')||'أيام مع أميرة';
     video.src=path;dialog.showModal();
   });
 }
 dialog.querySelector('[data-video-close]').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
 dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load()});
})();
