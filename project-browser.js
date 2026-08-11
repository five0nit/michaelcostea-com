(() => {
  'use strict';

  document.querySelectorAll('[data-project-browser]').forEach((browser) => {
    const cards = [...browser.querySelectorAll('[data-project-category]')];
    const search = browser.querySelector('.project-browser-search');
    const filters = [...browser.querySelectorAll('[data-project-filter]')];
    const count = browser.querySelector('.project-browser-count');
    const empty = browser.querySelector('.filter-empty');
    let activeFilter = 'all';

    if (!cards.length) return;

    const applyFilter = () => {
      const query = String(search?.value || '').trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const categoryMatch = activeFilter === 'all' || card.dataset.projectCategory === activeFilter;
        const queryMatch = !query || card.textContent.toLowerCase().includes(query);
        const match = categoryMatch && queryMatch;
        card.hidden = !match;
        if (!match) card.querySelectorAll('.app-store-details[open]').forEach((details) => { details.open = false; });
        if (match) visible += 1;
      });

      filters.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.projectFilter === activeFilter));
      });
      if (count) count.textContent = `${visible} project${visible === 1 ? '' : 's'}`;
      if (empty) empty.hidden = visible !== 0;
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.projectFilter || 'all';
        applyFilter();
      });
    });
    search?.addEventListener('input', applyFilter);
    applyFilter();
  });
})();
