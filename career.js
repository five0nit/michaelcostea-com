(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-button');
  const nav = document.getElementById('site-nav');

  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    nav.dataset.open = 'false';
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      nav.dataset.open = String(open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
  }

  const dialog = document.getElementById('os-dialog');
  const frame = dialog?.querySelector('iframe');
  const closeButton = dialog?.querySelector('[data-close-os]');
  let restoreFocus = null;

  function openMichaelOS(trigger) {
    if (!dialog || !frame) return;
    restoreFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    if (!frame.getAttribute('src')) {
      const base = frame.dataset.src || '../../';
      const route = trigger?.dataset?.osRoute || '';
      frame.setAttribute('src', `${base}${route}`);
    }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    closeButton?.focus();
  }

  function closeMichaelOS() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.querySelectorAll('[data-open-os]').forEach((trigger) => {
    trigger.addEventListener('click', () => openMichaelOS(trigger));
  });

  closeButton?.addEventListener('click', closeMichaelOS);

  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) closeMichaelOS();
  });

  dialog?.addEventListener('close', () => {
    if (restoreFocus instanceof HTMLElement && restoreFocus.isConnected) restoreFocus.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const projectSearch = document.getElementById('project-search');
  const projectCards = [...document.querySelectorAll('.detailed-archive .project-archive-card')];
  const emptyState = document.querySelector('.filter-empty');

  if (projectSearch && projectCards.length) {
    projectSearch.addEventListener('input', () => {
      const query = projectSearch.value.trim().toLowerCase();
      let visible = 0;
      projectCards.forEach((card) => {
        const match = !query || card.textContent.toLowerCase().includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (emptyState) emptyState.hidden = visible !== 0;
    });
  }
})();
