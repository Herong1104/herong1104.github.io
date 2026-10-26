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
  document.title = next === 'en' ? 'Herong — Music & Computing' : 'Herong — 音乐与计算机';
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
document.getElementById('year').textContent = new Date().getFullYear();
setLanguage(language);
