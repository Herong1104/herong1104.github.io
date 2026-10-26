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
  const page = document.body.dataset.page;
  document.title = page === 'About' ? `Herong Bai — ${next === 'en' ? 'Biography' : '个人介绍'}` : page === 'CV' ? 'Herong Bai — CV' : 'Herong Bai';
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
  const error = document.getElementById('video-error');
  const direct = document.getElementById('video-direct');
  let selected;
  let recordingsPromise = fetch('recordings.json?v=20261026-editorial').then(response => {
    if (!response.ok) throw new Error('Recordings unavailable');
    return response.json();
  });
  function updateTitle() {
    if (selected) title.textContent = `${selected.composer} — ${language === 'en' ? selected.title : selected.zh} · ${language === 'en' ? selected.detail : selected.detailzh}`;
  }
  document.addEventListener('languagechange', updateTitle);
  document.querySelectorAll('[data-recording]').forEach(button => {
    button.addEventListener('click', async () => {
      error.hidden = true;
      try {
        const recordings = await recordingsPromise;
        selected = recordings.find(item => item.id === button.dataset.recording);
        if (!selected) return;
        updateTitle();
        const local = ['localhost','127.0.0.1'].includes(location.hostname);
        const url = local ? `media-uploads/${selected.id}.mp4` : selected.src;
        video.poster = `video-${selected.id}.jpg`;
        video.src = url;
        direct.href = url;
        dialog.showModal();
        video.play().catch(() => {});
      } catch {
        error.hidden = false;
        title.textContent = language === 'en' ? 'Recording unavailable' : '视频暂未加载';
        direct.removeAttribute('href');
        dialog.showModal();
      }
    });
  });
  video.addEventListener('error', () => { if (dialog.open) error.hidden = false; });
  document.getElementById('close-video').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.load(); selected = undefined; });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
setLanguage(language);
