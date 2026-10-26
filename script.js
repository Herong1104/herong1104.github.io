let language = 'en';
try { language = localStorage.getItem('herong-language') === 'zh' ? 'zh' : 'en'; } catch {}
let updateSlideshowLabels = () => {};
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
  document.querySelectorAll('[data-alt-en]').forEach(element => {
    element.alt = element.getAttribute(`data-alt-${next}`);
  });
  const toggle = document.getElementById('language');
  toggle.innerHTML = next === 'en' ? 'EN <span>/ 中文</span>' : '中文 <span>/ EN</span>';
  toggle.setAttribute('aria-label', next === 'en' ? 'Switch to Chinese' : '切换到英文');
  const about = document.body.dataset.page === 'About';
  document.title = `Herong Bai — ${about ? (next === 'en' ? 'About' : '关于') : (next === 'en' ? 'Music & Mathematics' : '音乐与数学')}`;
  updateSlideshowLabels();
  try { localStorage.setItem('herong-language', next); } catch {}
}
document.getElementById('language').addEventListener('click', () => setLanguage(language === 'en' ? 'zh' : 'en'));
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-category]').forEach(item => {
      item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
    });
  });
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
});
const slides = [...document.querySelectorAll('[data-slide-image]')];
if (slides.length) {
  const hero = document.querySelector('.hero');
  const dots = [...document.querySelectorAll('[data-slide]')];
  const pause = document.getElementById('slideshow-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-pressed', String(i === current));
    });
  }
  function stop() { clearInterval(timer); }
  function start() {
    stop();
    if (!paused && !document.hidden) timer = setInterval(() => showSlide(current + 1), 7000);
  }
  updateSlideshowLabels = () => {
    pause.textContent = paused ? '▷' : 'Ⅱ';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', language === 'en' ? (paused ? 'Play slideshow' : 'Pause slideshow') : (paused ? '播放轮播' : '暂停轮播'));
    dots.forEach((dot, i) => dot.setAttribute('aria-label', language === 'en' ? `Show photograph ${i + 1}` : `显示第 ${i + 1} 张照片`));
    document.querySelectorAll('[data-direction]').forEach(button => button.setAttribute('aria-label', language === 'en' ? (button.dataset.direction === '1' ? 'Next photograph' : 'Previous photograph') : (button.dataset.direction === '1' ? '下一张照片' : '上一张照片')));
  };
  function manualSlide(index) {
    paused = true;
    stop();
    showSlide(index);
    updateSlideshowLabels();
  }
  dots.forEach(dot => dot.addEventListener('click', () => manualSlide(Number(dot.dataset.slide))));
  document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => manualSlide(current + Number(button.dataset.direction))));
  pause.addEventListener('click', () => { paused = !paused; updateSlideshowLabels(); start(); });
  hero.addEventListener('focusin', event => { if (event.target !== pause) { paused = true; stop(); updateSlideshowLabels(); } });
  hero.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      manualSlide(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  document.addEventListener('visibilitychange', start);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) paused = true; updateSlideshowLabels(); start(); });
  showSlide(0);
  start();
}
document.getElementById('year').textContent = new Date().getFullYear();
setLanguage(language);
