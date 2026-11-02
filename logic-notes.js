(() => {
  const reader = document.querySelector('[data-logic-reader]');
  if (!reader) return;
  const image = reader.querySelector('img');
  const select = reader.querySelector('select');
  const previous = reader.querySelector('[data-logic-prev]');
  const next = reader.querySelector('[data-logic-next]');
  const output = reader.querySelector('[data-logic-status]');
  const error = reader.querySelector('[data-logic-error]');
  const retry = reader.querySelector('[data-logic-retry]');
  const topics = reader.querySelector('.notes-topics');
  const count = Number(reader.dataset.pageCount);
  let page = 1;
  const chinese = () => document.documentElement.lang.startsWith('zh');
  const source = () => 'assets/research/logic-notes/page-' + String(page).padStart(2, '0') + '.webp';
  function update() {
    const zh = chinese();
    if (image.getAttribute('src') !== source()) {
      error.hidden = true;
      reader.setAttribute('aria-busy', 'true');
      image.src = source();
    }
    select.value = String(page);
    select.setAttribute('aria-label', zh ? '选择页码' : 'Select a page');
    previous.disabled = page === 1;
    next.disabled = page === count;
    image.alt = zh ? '逻辑、不等式与部分函数讲义，第 ' + page + ' 页' : 'Logic, inequalities and functions notes, page ' + page;
    output.textContent = zh ? '第 ' + page + ' 页 / 共 ' + count + ' 页' : 'Page ' + page + ' / ' + count;
    topics.setAttribute('aria-label', zh ? '讲义主题' : 'Topics');
    reader.setAttribute('aria-label', zh ? '数学讲义阅读器' : 'Learning notes reader');
    document.title = (zh ? '逻辑、不等式与部分函数' : 'Logic, Inequalities & Functions') + ' | Herong Bai';
  }
  function show(value) {
    page = Math.max(1, Math.min(count, Number(value) || 1));
    update();
  }
  previous.addEventListener('click', () => show(page - 1));
  next.addEventListener('click', () => show(page + 1));
  select.addEventListener('change', () => show(select.value));
  reader.querySelectorAll('[data-logic-page]').forEach(button => button.addEventListener('click', () => show(button.dataset.logicPage)));
  retry.addEventListener('click', () => {
    error.hidden = true;
    reader.setAttribute('aria-busy', 'true');
    image.src = source();
  });
  image.addEventListener('load', () => { reader.removeAttribute('aria-busy'); error.hidden = true; });
  image.addEventListener('error', () => { reader.removeAttribute('aria-busy'); error.hidden = false; });
  document.addEventListener('languagechange', update);
  update();
})();
