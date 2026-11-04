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
  const titles = {
    Home:['Pianist','钢琴演奏者'], Music:['Music','音乐'], Community:['Community','公益'],
    Research:['Research & Inquiry','研究与探索'], About:['Biography','个人介绍'],
    Contact:['Contact','联系'], Press:['Press & Media','新闻与媒体'], CV:['CV','CV'],
    Etudes:['BMC Etudes Project','BMC Etudes Project'],
    MusicMath:['Mathematics & Music','数学与音乐'], Aviation:['Aviation Research','航空研究'],
    Economics:['Economics & Public Policy','经济学与公共政策'],
    MathEducation:['Mathematics & Education','数学与教育']
  };
  const suffix = titles[document.body.dataset.page]?.[next === 'en' ? 0 : 1];
  document.title = 'Herong Bai' + (suffix ? ` — ${suffix}` : '');
  document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach(element => {
    element.alt = next === 'en' ? element.dataset.altEn : element.dataset.altZh;
  });
  document.dispatchEvent(new Event('languagechange'));
  try { localStorage.setItem('herong-language', next); } catch {}
}
document.getElementById('language').addEventListener('click', () => setLanguage(language === 'en' ? 'zh' : 'en'));
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('print-cv')?.addEventListener('click', () => window.print());
// Both inline stories and the performance dialog share one active video.
function pauseOtherSiteVideos(activeVideo) {
  document.querySelectorAll('video').forEach(other => {
    if (other !== activeVideo) other.pause();
  });
}
document.addEventListener('play', event => {
  if (event.target?.tagName === 'VIDEO' && !event.target.paused) pauseOtherSiteVideos(event.target);
}, true);
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
    catalogue:['The recording list could not be loaded. Please retry.','视频列表暂未加载成功，请重试。'],
    slow:['Still loading… You can keep waiting, retry or open the recording directly.','仍在加载……你可以继续等待、重试或直接打开视频。'],
    catalogueSlow:['The recording list is taking longer than expected. You can keep waiting or retry.','视频列表加载较慢，你可以继续等待或重试。']
  };
  let selected;
  let state = 'ready';
  let requestId = 0;
  let playId = 0;
  let recordings;
  let pendingCatalogue;
  let catalogueController;
  let catalogueId = 0;
  let waitingTimer;
  let lastOpener;
  let removeMediaListeners = () => {};
  function updateUI() {
    const langIndex = language === 'en' ? 0 : 1;
    status.textContent = messages[state]?.[langIndex] || '';
    play.textContent = language === 'en' ? 'Play recording' : '播放视频';
    play.setAttribute('aria-label', play.textContent);
    if (selected) title.textContent = `${selected.composer} — ${language === 'en' ? selected.title : selected.zh} · ${language === 'en' ? selected.detail : selected.detailzh}`;
  }
  function setState(next) { state = next; updateUI(); }
  function current(id) { return id === requestId && dialog.open; }
  function clearWaiting() { clearTimeout(waitingTimer); }
  function beginAttempt() {
    requestId += 1;
    playId += 1;
    clearWaiting();
    removeMediaListeners();
    removeMediaListeners = () => {};
    video.pause();
    return requestId;
  }
  function waitNotice(id, kind = 'slow') {
    clearWaiting();
    waitingTimer = setTimeout(() => {
      if (!current(id) || !['loading','buffering','slow','catalogueSlow'].includes(state)) return;
      setState(kind);
      retry.hidden = false;
      // A slow connection is not a decoding failure; leave the request running.
    }, 10000);
  }
  function showFailure(kind = 'failed', id = requestId) {
    if (!current(id)) return;
    clearWaiting();
    setState(kind);
    error.hidden = false;
    retry.hidden = false;
    play.hidden = true;
  }
  function loadCatalogue(force = false) {
    if (recordings) return Promise.resolve(recordings);
    if (force) {
      catalogueId += 1;
      catalogueController?.abort();
      pendingCatalogue = undefined;
    }
    if (pendingCatalogue) return pendingCatalogue;
    const loadId = ++catalogueId;
    catalogueController = new AbortController();
    pendingCatalogue = fetch('recordings.json?v=20261028-publish', {cache:'no-cache', signal:catalogueController.signal})
      .then(response => { if (!response.ok) throw new Error('Recording list unavailable'); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid recording list');
        if (loadId === catalogueId) recordings = data;
        return data;
      })
      .finally(() => {
        if (loadId === catalogueId) { pendingCatalogue = undefined; catalogueController = undefined; }
      });
    return pendingCatalogue;
  }
  // Load the small catalogue in advance; video data is requested only after selection.
  loadCatalogue().catch(() => {});
  function attemptPlay() {
    const id = requestId;
    const attempt = ++playId;
    if (!current(id) || !selected) return;
    play.hidden = true;
    pauseOtherSiteVideos(video);
    setState('loading');
    waitNotice(id);
    let result;
    try { result = video.play(); }
    catch (failure) { handlePlayFailure(failure, id, attempt); return; }
    result?.catch(failure => handlePlayFailure(failure, id, attempt));
  }
  function handlePlayFailure(failure, id, attempt) {
    if (!current(id) || attempt !== playId || failure.name === 'AbortError') return;
    if (failure.name === 'NotAllowedError') {
      clearWaiting();
      error.hidden = true;
      play.hidden = false;
      setState('ready');
    } else showFailure(video.error?.code === 3 ? 'decode' : 'failed', id);
  }
  function bindMediaEvents(id) {
    const listeners = [];
    const on = (type, handler) => {
      const guarded = () => { if (current(id)) handler(); };
      video.addEventListener(type, guarded);
      listeners.push([type, guarded]);
    };
    on('loadedmetadata', () => {
      if (video.readyState >= 1 && video.paused && state !== 'failed' && state !== 'decode') {
        clearWaiting(); error.hidden = true; retry.hidden = true; play.hidden = false; setState('ready');
      }
    });
    on('playing', () => {
      if (video.paused || video.readyState < 2) return;
      clearWaiting(); error.hidden = true; retry.hidden = true; play.hidden = true; setState('playing');
      pauseOtherSiteVideos(video);
    });
    on('pause', () => {
      if (!video.paused) return;
      clearWaiting(); playId += 1;
      if (!video.ended && !['failed','decode'].includes(state)) {
        setState(video.readyState >= 2 ? 'paused' : 'ready');
        if (video.readyState < 2) play.hidden = false;
      }
    });
    on('waiting', () => {
      if (video.paused) return;
      setState('buffering'); waitNotice(id);
    });
    on('stalled', () => {
      if (!video.paused && video.readyState < 3) { setState('buffering'); retry.hidden = false; waitNotice(id); }
    });
    on('error', () => { if (video.error) showFailure(video.error.code === 3 ? 'decode' : 'failed', id); });
    removeMediaListeners = () => listeners.forEach(([type, handler]) => video.removeEventListener(type, handler));
  }
  function setRecording(recording, playFromGesture, id) {
    if (!current(id)) return;
    selected = recording;
    const url = local && recording.localSrc ? recording.localSrc : recording.src;
    if (!url) { showFailure('failed', id); return; }
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
    source.addEventListener('error', () => showFailure('failed', id));
    video.append(source);
    bindMediaEvents(id);
    setState('loading');
    waitNotice(id);
    video.load();
    if (playFromGesture) attemptPlay();
    else { play.hidden = false; }
  }
  function selectRecording(recordingId, playFromGesture, id) {
    if (!current(id)) return;
    const item = recordings?.find(recording => recording.id === recordingId);
    if (item) setRecording(item, playFromGesture, id);
    else { selected = undefined; showFailure('catalogue', id); }
  }
  function awaitCatalogue(id, force = false) {
    setState('loading'); waitNotice(id, 'catalogueSlow');
    loadCatalogue(force).then(() => {
      if (current(id)) selectRecording(lastOpener.dataset.recording, false, id);
    }).catch(() => { if (current(id)) showFailure('catalogue', id); });
  }
  document.querySelectorAll('[data-recording]').forEach(button => {
    button.addEventListener('click', () => {
      const id = beginAttempt();
      pauseOtherSiteVideos(video);
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
        selectRecording(button.dataset.recording, true, id);
      } else awaitCatalogue(id);
    });
  });
  play.addEventListener('click', attemptPlay);
  retry.addEventListener('click', () => {
    const id = beginAttempt();
    error.hidden = true; retry.hidden = true;
    if (selected) setRecording(selected, true, id);
    else awaitCatalogue(id, true);
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    beginAttempt();
    video.removeAttribute('src'); video.replaceChildren(); video.load();
    selected = undefined;
    lastOpener?.focus();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.addEventListener('languagechange', updateUI);
}
const pressFilters = document.querySelectorAll('[data-filter]');
if (pressFilters.length) {
  let category = 'all';
  function filterPress() {
    let count = 0;
    document.querySelectorAll('.press-list .press-entry').forEach(entry => {
      entry.hidden = category !== 'all' && entry.dataset.category !== category;
      if (!entry.hidden) count += 1;
    });
    pressFilters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    document.getElementById('press-count').textContent = language === 'en' ? `${count} archive entries` : `${count} 项媒体档案`;
  }
  pressFilters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filterPress();
  }));
  document.addEventListener('languagechange', filterPress);
}
setLanguage(language);
