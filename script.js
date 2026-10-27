let language = 'en';
try { language = localStorage.getItem('herong-language') === 'zh' ? 'zh' : 'en'; } catch {}
function setLanguage(next) {
  language = next;
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(element => {
    const parts = element.dataset[next].split('<br>');
    element.replaceChildren();
    parts.forEach((part, index) => {
      if (index) element.append(document.createElement('br'));
      element.append(document.createTextNode(part));
    });
  });
  const toggle = document.getElementById('language');
  toggle.innerHTML = next === 'en' ? 'EN <span>/ 中文</span>' : '中文 <span>/ EN</span>';
  toggle.setAttribute('aria-label', next === 'en' ? 'Switch to Chinese' : '切换到英文');
  const suffix = {About:next === 'en' ? 'Biography' : '个人介绍', CV:'CV', Etudes:'BMC Etudes Project'}[document.body.dataset.page];
  document.title = 'Herong Bai' + (suffix ? ` — ${suffix}` : '');
  document.dispatchEvent(new Event('languagechange'));
  try { localStorage.setItem('herong-language', next); } catch {}
}
document.getElementById('language').addEventListener('click', () => setLanguage(language === 'en' ? 'zh' : 'en'));
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('print-cv')?.addEventListener('click', () => window.print());
const dialog = document.getElementById('video-dialog');
if (dialog) {
  const video = document.getElementById('performance-video');
  const title = document.getElementById('video-title');
  const status = document.getElementById('video-status');
  const error = document.getElementById('video-error');
  const direct = document.getElementById('video-direct');
  const retry = document.getElementById('retry-video');
  const play = document.getElementById('video-play');
  const close = document.getElementById('close-video');
  const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const messages = {
    loading:['Loading recording…','正在加载视频……'],
    ready:['Ready. Tap Play to begin.','视频已准备好，点击播放即可。'],
    playing:['',''],
    paused:['Paused.','已暂停。'],
    buffering:['Buffering… If this continues, retry or open the recording directly.','正在缓冲……如持续等待，可重试或直接打开视频。'],
    failed:['The recording could not be loaded. Retry or use the direct link.','视频暂未加载成功，请重试或使用直接链接。'],
    decode:['This browser could not decode the recording. Try the direct link or another browser.','当前浏览器未能解码视频，可尝试直接打开或换用其他浏览器。'],
    catalogue:['The recording list could not be loaded. Please retry.','视频列表暂未加载成功，请重试。']
  };
  let selected;
  let state = 'ready';
  let requestId = 0;
  let recordings;
  let pendingCatalogue;
  let waitingTimer;
  let lastOpener;
  function updateUI() {
    const langIndex = language === 'en' ? 0 : 1;
    status.textContent = messages[state]?.[langIndex] || '';
    play.textContent = language === 'en' ? 'Play recording' : '播放视频';
    play.setAttribute('aria-label', play.textContent);
    if (selected) title.textContent = `${selected.composer} — ${language === 'en' ? selected.title : selected.zh} · ${language === 'en' ? selected.detail : selected.detailzh}`;
  }
  function setState(next) { state = next; updateUI(); }
  function showFailure(kind = 'failed') {
    if (!dialog.open) return;
    clearTimeout(waitingTimer);
    setState(kind);
    error.hidden = false;
    retry.hidden = false;
    play.hidden = true;
  }
  function loadCatalogue() {
    if (recordings) return Promise.resolve(recordings);
    if (pendingCatalogue) return pendingCatalogue;
    pendingCatalogue = fetch('recordings.json?v=20261027-review', {cache:'no-cache'})
      .then(response => { if (!response.ok) throw new Error('Recording list unavailable'); return response.json(); })
      .then(data => { if (!Array.isArray(data)) throw new Error('Invalid recording list'); recordings = data; return data; })
      .finally(() => { pendingCatalogue = undefined; });
    return pendingCatalogue;
  }
  // Load the small catalogue in advance; video data is requested only after selection.
  loadCatalogue().catch(() => {});
  function attemptPlay() {
    const id = requestId;
    play.hidden = true;
    let result;
    try { result = video.play(); }
    catch (failure) { handlePlayFailure(failure, id); return; }
    result?.catch(failure => handlePlayFailure(failure, id));
  }
  function handlePlayFailure(failure, id) {
    if (id !== requestId || !dialog.open || failure.name === 'AbortError') return;
    if (failure.name === 'NotAllowedError') {
      error.hidden = true;
      play.hidden = false;
      setState('ready');
    } else showFailure('failed');
  }
  function setRecording(recording, playFromGesture) {
    selected = recording;
    const url = local && recording.localSrc ? recording.localSrc : recording.src;
    if (!url) { showFailure(); return; }
    error.hidden = true;
    retry.hidden = true;
    play.hidden = true;
    direct.hidden = false;
    direct.href = url;
    video.poster = recording.poster || `video-${recording.id}.jpg`;
    video.preload = 'metadata';
    video.playsInline = true;
    video.removeAttribute('src');
    video.replaceChildren();
    const source = document.createElement('source');
    source.type = 'video/mp4';
    source.src = url;
    const sourceRequest = requestId;
    source.addEventListener('error', () => { if (sourceRequest === requestId) showFailure(); });
    video.append(source);
    setState('loading');
    video.load();
    if (playFromGesture) attemptPlay();
    else { play.hidden = false; }
  }
  function selectRecording(id, playFromGesture) {
    const item = recordings?.find(recording => recording.id === id);
    if (item) setRecording(item, playFromGesture);
    else { selected = undefined; showFailure('catalogue'); }
  }
  document.querySelectorAll('[data-recording]').forEach(button => {
    button.addEventListener('click', () => {
      requestId += 1;
      const id = requestId;
      lastOpener = button;
      selected = undefined;
      title.textContent = button.getAttribute('aria-label')?.replace(/^Play /,'') || 'Recording';
      error.hidden = true;
      retry.hidden = true;
      play.hidden = true;
      direct.hidden = true;
      dialog.showModal();
      close.focus();
      if (recordings) {
        // Keep play() in the original user action for iOS/Safari.
        selectRecording(button.dataset.recording, true);
      } else {
        setState('loading');
        loadCatalogue().then(() => {
          if (id !== requestId || !dialog.open) return;
          // An explicit Play button retains a genuine user action after async loading.
          selectRecording(button.dataset.recording, false);
        }).catch(() => { if (id === requestId) showFailure('catalogue'); });
      }
    });
  });
  play.addEventListener('click', attemptPlay);
  retry.addEventListener('click', () => {
    if (selected) setRecording(selected, true);
    else {
      const id = requestId;
      setState('loading'); error.hidden = true; retry.hidden = true;
      loadCatalogue().then(() => {
        if (id === requestId && dialog.open) selectRecording(lastOpener.dataset.recording, false);
      }).catch(() => { if (id === requestId) showFailure('catalogue'); });
    }
  });
  video.addEventListener('loadedmetadata', () => {
    if (dialog.open && video.paused && state !== 'failed' && state !== 'decode') { play.hidden = false; setState('ready'); }
  });
  video.addEventListener('playing', () => {
    clearTimeout(waitingTimer); error.hidden = true; retry.hidden = true; play.hidden = true; setState('playing');
  });
  video.addEventListener('pause', () => { if (dialog.open && video.readyState >= 2 && !video.ended) setState('paused'); });
  video.addEventListener('waiting', () => {
    if (!dialog.open) return;
    setState('buffering');
    clearTimeout(waitingTimer);
    waitingTimer = setTimeout(() => { if (dialog.open && state === 'buffering') retry.hidden = false; }, 8000);
  });
  video.addEventListener('stalled', () => { if (dialog.open && video.readyState < 3) { setState('buffering'); retry.hidden = false; } });
  video.addEventListener('error', () => { if (dialog.open) showFailure(video.error?.code === 3 ? 'decode' : 'failed'); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    requestId += 1;
    clearTimeout(waitingTimer);
    video.pause(); video.removeAttribute('src'); video.replaceChildren(); video.load();
    selected = undefined;
    lastOpener?.focus();
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.addEventListener('languagechange', updateUI);
}
setLanguage(language);
