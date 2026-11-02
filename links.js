(() => {
  const directory = document.querySelector('.links-directory');
  if (!directory) return;
  const search = directory.querySelector('#directory-search');
  const form = directory.querySelector('.directory-search');
  const reset = directory.querySelector('[data-directory-reset]');
  const filters = Array.from(directory.querySelectorAll('[data-directory-filter]'));
  const rows = Array.from(directory.querySelectorAll('[data-directory-row]'));
  const groups = Array.from(directory.querySelectorAll('[data-directory-group]'));
  const count = directory.querySelector('[data-directory-count]');
  const empty = directory.querySelector('[data-directory-empty]');
  const filterGroup = directory.querySelector('.directory-filters');
  let selected = 'all';
  const normalize = text => String(text || '').normalize('NFKC').toLocaleLowerCase();
  const index = new Map(rows.map(row => [row, normalize(row.dataset.directorySearch)]));
  const chinese = () => document.documentElement.lang.startsWith('zh');
  function update() {
    const zh = chinese();
    const tokens = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let matches = 0;
    rows.forEach(row => {
      const categoryMatch = selected === 'all' || row.dataset.directoryCategory === selected;
      const textMatch = tokens.every(token => index.get(row).includes(token));
      const visible = categoryMatch && textMatch;
      row.hidden = !visible;
      if (visible) matches += 1;
    });
    groups.forEach(group => {
      const visibleCount = Array.from(group.querySelectorAll('[data-directory-row]')).filter(row => !row.hidden).length;
      group.hidden = visibleCount === 0;
      group.querySelector('[data-directory-group-count]').textContent = zh ? visibleCount + ' 条来源' : visibleCount + (visibleCount === 1 ? ' source' : ' sources');
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.directoryFilter === selected)));
    count.textContent = zh ? '显示 ' + matches + ' / ' + rows.length + ' 条来源' : matches + ' of ' + rows.length + ' sources';
    empty.hidden = matches !== 0;
    search.placeholder = zh ? '标题、媒体名称、年份…' : 'Title, publisher, year…';
    filterGroup.setAttribute('aria-label', zh ? '按主题筛选来源' : 'Filter sources by topic');
    document.title = (zh ? '报道与资料索引' : 'Links & Archives') + ' | Herong Bai';
  }
  form.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', update);
  search.addEventListener('search', update);
  reset.addEventListener('click', () => {
    search.value = '';
    selected = 'all';
    update();
    search.focus();
  });
  filters.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.directoryFilter;
    update();
  }));
  document.addEventListener('languagechange', update);
  update();
})();
