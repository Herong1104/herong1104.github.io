(() => {
  const blocks = Array.from(document.querySelectorAll('[data-story-video]'));
  const states = {
    loading:['Loading video…','正在加载视频……'],
    ready:['Ready. Use the video controls to play.','视频已准备好，可使用播放器开始播放。'],
    playing:['',''], paused:['Paused.','已暂停。'],
    waiting:['Buffering…','正在缓冲……'],
    failed:['Unable to play here. Retry or open the video directly.','暂时无法在本页播放，请重试或直接打开视频。'],
    decode:['This browser cannot decode this original recording. Try another browser or the direct link.','当前浏览器未能解码原视频，可尝试其他浏览器或直接链接。']
  };
  function langIndex(){return document.documentElement.lang.startsWith('zh')?1:0;}
  blocks.forEach(block=>{
    const video=block.querySelector('video');
    const launch=block.querySelector('.story-media-launch');
    const retry=block.querySelector('.story-media-retry');
    const status=block.querySelector('.story-media-status');
    const direct=block.querySelector('.story-media-direct');
    let state='playing', timer;
    function refresh(){
      const n=langIndex();
      status.textContent=states[state]?.[n]||'';
      video.setAttribute('aria-label',n?video.dataset.labelZh:video.dataset.labelEn);
      launch.setAttribute('aria-label',(n?'播放：':'Play: ')+(n?video.dataset.labelZh:video.dataset.labelEn));
    }
    function setState(next){state=next;block.dataset.playbackState=next;refresh();}
    function failure(next='failed'){clearTimeout(timer);retry.hidden=false;launch.hidden=true;setState(next);}
    function start(){
      clearTimeout(timer);retry.hidden=true;launch.hidden=true;video.setAttribute('controls','');setState('loading');
      if(!video.getAttribute('src')){video.src=video.dataset.source;video.preload='metadata';video.load();}
      direct.href=video.dataset.source;
      try { video.play()?.catch(error=>{
        if(error.name==='AbortError')return;
        if(error.name==='NotAllowedError'){setState('ready');return;}
        failure(video.error?.code===3||error.name==='NotSupportedError'?'decode':'failed');
      });}catch(error){failure();}
    }
    launch.addEventListener('click',start);
    retry.addEventListener('click',()=>{video.removeAttribute('src');video.load();start();});
    video.addEventListener('playing',()=>{clearTimeout(timer);retry.hidden=true;setState('playing');blocks.forEach(other=>{if(other!==block)other.querySelector('video').pause();});});
    video.addEventListener('pause',()=>{if(video.readyState>=2&&!video.ended)setState('paused');});
    video.addEventListener('ended',()=>setState('ready'));
    video.addEventListener('loadedmetadata',()=>{if(video.paused&&!video.error)setState('ready');});
    video.addEventListener('waiting',()=>{setState('waiting');clearTimeout(timer);timer=setTimeout(()=>{if(state==='waiting')retry.hidden=false;},10000);});
    video.addEventListener('stalled',()=>{if(video.readyState<3){setState('waiting');retry.hidden=false;}});
    video.addEventListener('error',()=>failure(video.error?.code===3?'decode':'failed'));
    document.addEventListener('languagechange',refresh);
    refresh();
  });
  if(document.body.dataset.page==='School'){
    const title=()=>{document.title='Herong Bai — '+(langIndex()?'校园生活':'School Life');};
    document.addEventListener('languagechange',title);title();
  }
  if(document.body.dataset.page==='SchoolEvent'){const title=()=>{document.title='Herong Bai — '+(langIndex()?'11月9日活动':'9 November Programme');};document.addEventListener('languagechange',title);title();}
  const reader=document.querySelector('[data-notes-reader]');
  if(reader){
    const image=reader.querySelector('img'), select=reader.querySelector('select');
    const prev=reader.querySelector('[data-notes-prev]'), next=reader.querySelector('[data-notes-next]');
    const output=reader.querySelector('[data-notes-status]');
    const count=Number(reader.dataset.pageCount);let page=1;
    function show(p){
      page=Math.max(1,Math.min(count,p));
      image.src='assets/research/learning-notes/analytic-geometry-page-'+String(page).padStart(2,'0')+'.webp';
      reader.querySelector('[data-notes-fullsize]').href=image.src;
      select.value=String(page);prev.disabled=page===1;next.disabled=page===count;
      const zh=langIndex();image.alt=zh?'解析几何讲义，第'+page+'页':'Analytic geometry notes, page '+page;
      output.textContent=zh?'第 '+page+' 页 / 共 '+count+' 页':'Page '+page+' / '+count;
      select.setAttribute('aria-label',zh?'选择页码':'Select a page');
    }
    prev.addEventListener('click',()=>show(page-1));next.addEventListener('click',()=>show(page+1));
    select.addEventListener('change',()=>show(Number(select.value)));
    reader.querySelectorAll('[data-notes-page]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.notesPage))));
    document.addEventListener('languagechange',()=>show(page));show(1);
    const title=()=>{document.title='Herong Bai — '+(langIndex()?'解析几何讲义':'Analytic Geometry Notes');};
    document.addEventListener('languagechange',title);title();
  }
})();
