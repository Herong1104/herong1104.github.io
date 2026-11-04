(() => {
  const blocks = Array.from(document.querySelectorAll('[data-story-video]'));
  const states = {
    loading:['Loading video…','正在加载视频……'],
    ready:['Ready. Use the video controls to play.','视频已准备好，可使用播放器开始播放。'],
    playing:['',''], paused:['Paused.','已暂停。'],
    waiting:['Buffering…','正在缓冲……'],
    failed:['Unable to play here. Retry or open the video directly.','暂时无法在本页播放，请重试或直接打开视频。'],
    decode:['This browser cannot decode this original recording. Try another browser or the direct link.','当前浏览器未能解码原视频，可尝试其他浏览器或直接链接。'],
    slow:['Still loading… You can keep waiting, retry or open the video directly.','仍在加载……你可以继续等待、重试或直接打开视频。']
  };
  function langIndex(){return document.documentElement.lang.startsWith('zh')?1:0;}
  function pauseOthers(video){
    if(typeof pauseOtherSiteVideos==='function') pauseOtherSiteVideos(video);
    else document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});
  }
  blocks.forEach(block=>{
    const video=block.querySelector('video');
    const launch=block.querySelector('.story-media-launch');
    const retry=block.querySelector('.story-media-retry');
    const status=block.querySelector('.story-media-status');
    const direct=block.querySelector('.story-media-direct');
    let state='playing', timer, attemptId=0, playId=0;
    let removeMediaListeners=()=>{};
    function refresh(){
      const n=langIndex();
      status.textContent=states[state]?.[n]||'';
      video.setAttribute('aria-label',n?video.dataset.labelZh:video.dataset.labelEn);
      launch.setAttribute('aria-label',(n?'播放：':'Play: ')+(n?video.dataset.labelZh:video.dataset.labelEn));
    }
    function setState(next){state=next;block.dataset.playbackState=next;refresh();}
    function current(id){return id===attemptId;}
    function waitNotice(id){
      clearTimeout(timer);
      timer=setTimeout(()=>{
        if(current(id)&&['loading','waiting','slow'].includes(state)){
          retry.hidden=false;setState('slow');
        }
      },10000);
    }
    function failure(next='failed',id=attemptId){
      if(!current(id))return;
      clearTimeout(timer);retry.hidden=false;launch.hidden=true;setState(next);
    }
    function bindMediaEvents(id){
      const listeners=[];
      const on=(type,handler)=>{
        const guarded=()=>{if(current(id))handler();};
        video.addEventListener(type,guarded);listeners.push([type,guarded]);
      };
      on('playing',()=>{if(video.paused||video.readyState<2)return;clearTimeout(timer);retry.hidden=true;setState('playing');pauseOthers(video);});
      on('pause',()=>{
        if(!video.paused)return;
        clearTimeout(timer);playId+=1;
        if(!video.ended&&!['failed','decode'].includes(state))setState(video.readyState>=2?'paused':'ready');
      });
      on('ended',()=>{clearTimeout(timer);setState('ready');});
      on('loadedmetadata',()=>{if(video.readyState>=1&&video.paused&&!video.error){clearTimeout(timer);setState('ready');}});
      on('waiting',()=>{if(!video.paused){setState('waiting');waitNotice(id);}});
      on('stalled',()=>{if(!video.paused&&video.readyState<3){setState('waiting');retry.hidden=false;waitNotice(id);}});
      on('error',()=>{if(video.error)failure(video.error.code===3?'decode':'failed',id);});
      removeMediaListeners=()=>listeners.forEach(([type,handler])=>video.removeEventListener(type,handler));
    }
    function start(reset=false){
      const id=++attemptId, playAttempt=++playId;
      clearTimeout(timer);removeMediaListeners();video.pause();
      retry.hidden=true;launch.hidden=true;video.setAttribute('controls','');setState('loading');
      if(reset)video.removeAttribute('src');
      bindMediaEvents(id);
      if(!video.getAttribute('src')){video.src=video.dataset.source;video.preload='metadata';video.load();}
      direct.href=video.dataset.source;
      pauseOthers(video);waitNotice(id);
      try { video.play()?.catch(error=>{
        if(!current(id)||playAttempt!==playId||error.name==='AbortError')return;
        if(error.name==='NotAllowedError'){clearTimeout(timer);setState('ready');return;}
        failure(video.error?.code===3?'decode':'failed',id);
      });}catch(error){failure(video.error?.code===3?'decode':'failed',id);}
    }
    launch.addEventListener('click',()=>start());
    retry.addEventListener('click',()=>start(true));
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
