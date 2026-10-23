(() => {
  const tabs = [...document.querySelectorAll('[data-workspace]')];
  function select(name, focus = false) {
    if (!tabs.some(tab => tab.dataset.workspace === name)) name = 'combinations';
    for (const tab of tabs) {
      const active = tab.dataset.workspace === name;
      const panel = document.getElementById('workspace-' + tab.dataset.workspace);
      if (!active && !panel.hidden) {
        for (const button of panel.querySelectorAll('.transport .primary')) {
          if (button.textContent.trim() === 'Pause') button.click();
        }
      }
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
      if (active && focus) tab.focus();
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { location.hash = tab.dataset.workspace; select(tab.dataset.workspace); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      location.hash = tabs[next].dataset.workspace;
      select(tabs[next].dataset.workspace, true);
    });
  });
  addEventListener('hashchange', () => select(location.hash.slice(1)));
  select(location.hash.slice(1));
})();
