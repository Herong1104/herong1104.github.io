(() => {
  const reader = document.querySelector('[data-port-reader]');
  if (!reader) return;
  const image = reader.querySelector('img');
  const select = reader.querySelector('select');
  const previous = reader.querySelector('[data-port-prev]');
  const next = reader.querySelector('[data-port-next]');
  const status = reader.querySelector('[data-port-status]');
  const fullSize = reader.querySelector('[data-port-fullsize]');
  const error = reader.querySelector('[data-port-error]');
  const back = document.querySelector('[data-port-back]');
  const count = Number(reader.dataset.pageCount);
  let current = 1;
  const isChinese = () => document.documentElement.lang.startsWith('zh');
  function update() {
    const zh = isChinese();
    const source = 'assets/research/port-manuscript/page-' + String(current).padStart(2, '0') + '.webp';
    if (image.getAttribute('src') !== source) {
      error.hidden = true;
      reader.setAttribute('aria-busy', 'true');
      image.src = source;
    }
    fullSize.href = source;
    fullSize.setAttribute('aria-label', zh ? '放大阅读第 ' + current + ' 页' : 'View page ' + current + ' at full size');
    image.alt = zh ? '港口经济学原稿，第 ' + current + ' 页' : 'Port economics manuscript, page ' + current;
    select.value = String(current);
    select.setAttribute('aria-label', zh ? '选择页码' : 'Select a page');
    previous.disabled = current === 1;
    next.disabled = current === count;
    status.textContent = zh ? '第 ' + current + ' 页 / 共 ' + count + ' 页' : 'Page ' + current + ' / ' + count;
    reader.setAttribute('aria-label', zh ? '完整原稿阅读器' : 'Complete manuscript reader');
    back.href = 'research-economics.html#port-automation-' + (zh ? 'zh' : 'en');
    document.title = (zh ? '港口经济学原稿' : 'The Automation Paradox') + ' | Herong Bai';
  }
  function show(page) {
    current = Math.max(1, Math.min(count, page));
    update();
  }
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  select.addEventListener('change', () => show(Number(select.value)));
  image.addEventListener('load', () => { reader.removeAttribute('aria-busy'); error.hidden = true; });
  image.addEventListener('error', () => { reader.removeAttribute('aria-busy'); error.hidden = false; });
  document.addEventListener('languagechange', update);
  update();
})();
