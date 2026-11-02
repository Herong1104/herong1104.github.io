(() => {
  document.querySelectorAll('[data-geometry-reader]').forEach(reader => {
    const image = reader.querySelector('img');
    const select = reader.querySelector('select');
    const previous = reader.querySelector('[data-geometry-prev]');
    const next = reader.querySelector('[data-geometry-next]');
    const output = reader.querySelector('[data-geometry-status]');
    const error = reader.querySelector('[data-geometry-error]');
    const retry = reader.querySelector('[data-geometry-retry]');
    const count = Number(reader.dataset.pageCount);
    const assetBase = reader.dataset.assetBase;
    const titleEn = reader.dataset.titleEn;
    const titleZh = reader.dataset.titleZh;
    let page = 1;

    const source = () => assetBase + '/page-' + String(page).padStart(2, '0') + '.webp';
    function update() {
      const zh = document.documentElement.lang.startsWith('zh');
      const title = zh ? titleZh : titleEn;
      if (image.getAttribute('src') !== source()) {
        error.hidden = true;
        reader.setAttribute('aria-busy', 'true');
        image.src = source();
      }
      select.value = String(page);
      select.setAttribute('aria-label', zh ? '选择页码' : 'Select a page');
      previous.disabled = page === 1;
      next.disabled = page === count;
      image.alt = zh ? title + '，第 ' + page + ' 页' : title + ', page ' + page;
      output.textContent = zh ? '第 ' + page + ' 页 / 共 ' + count + ' 页' : 'Page ' + page + ' / ' + count;
      reader.setAttribute('aria-label', zh ? '数学讲义阅读器' : 'Learning notes reader');
      document.title = title + ' | Herong Bai';
    }
    function show(value) {
      page = Math.max(1, Math.min(count, Math.trunc(Number(value)) || 1));
      update();
    }
    previous.addEventListener('click', () => show(page - 1));
    next.addEventListener('click', () => show(page + 1));
    select.addEventListener('change', () => show(select.value));
    retry.addEventListener('click', () => {
      error.hidden = true;
      reader.setAttribute('aria-busy', 'true');
      image.src = source();
    });
    image.addEventListener('load', () => {
      reader.removeAttribute('aria-busy');
      error.hidden = true;
    });
    image.addEventListener('error', () => {
      reader.removeAttribute('aria-busy');
      error.hidden = false;
    });
    document.addEventListener('languagechange', update);
    update();
  });
})();
