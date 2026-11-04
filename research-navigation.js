(() => {
  const links = document.querySelectorAll('[data-research-href-en][data-research-href-zh]');
  const targets = ['wind-data', 'drone-proposal'];
  function update() {
    const lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
    links.forEach(link => { link.href = link.getAttribute('data-research-href-' + lang); });
    document.querySelectorAll('[data-research-updates]').forEach(nav => {
      nav.setAttribute('aria-label', lang === 'zh' ? '航空科研更新' : 'Aviation research updates');
    });
    const match = location.hash.match(/^#(wind-data|drone-proposal)-(en|zh)$/);
    if (match && targets.includes(match[1]) && match[2] !== lang) {
      const target = document.getElementById(match[1] + '-' + lang);
      if (target) {
        history.replaceState(null, '', '#' + target.id);
        requestAnimationFrame(() => target.scrollIntoView({block: 'start', behavior: 'instant'}));
      }
    }
  }
  document.addEventListener('languagechange', update);
  update();
})();
