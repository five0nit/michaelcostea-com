(() => {
  'use strict';

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const progress = document.querySelector('.scroll-progress span');

  const setMenu = (open) => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  const updateScrollState = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
  };

  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });

  const revealItems = [...document.querySelectorAll('.reveal')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
    window.setTimeout(() => revealItems.slice(0, 4).forEach((item) => item.classList.add('is-visible')), 650);
  }

  const cases = [
    {
      sector: 'Government',
      specialism: 'Data science + GIS',
      kicker: 'A highly specific team build.',
      title: 'Eight specialist hires. Six weeks. One critical capability established.',
      body: 'A government organisation needed an eight-person Data Science team with GIS expertise. Integr8 Talent used established networks, trusted referrals and industry events to identify and engage the right people.',
      outcome: 'The complete team was filled within six weeks, allowing the organisation to establish the capability quickly.',
      count: '08',
      countLabel: 'HIRES'
    },
    {
      sector: 'Not-for-profit',
      specialism: 'Software engineering',
      kicker: 'A stalled accessibility initiative.',
      title: 'Months of searching became a clearer brief—and the right engineers.',
      body: 'A not-for-profit needed Software Engineers to improve its website and deliver a critical accessibility initiative. Direct recruitment had not found the required capability and deadlines were approaching.',
      outcome: 'The search strategy and capability brief were reset, connecting the organisation with engineers able to move the accessibility work forward.',
      count: 'A11Y',
      countLabel: 'DELIVERY'
    },
    {
      sector: 'ASX-listed retail',
      specialism: 'Technology + digital',
      kicker: 'Digital acceleration at enterprise scale.',
      title: 'Multiple teams built while customer expectations were moving fast.',
      body: 'During a critical period of digital acceleration, leading e-commerce and bricks-and-mortar retailers needed scarce technology and digital specialists at speed.',
      outcome: 'New teams strengthened digital capability, increased delivery capacity and helped the organisations keep pace with evolving customer expectations.',
      count: 'ASX',
      countLabel: 'SCALE'
    },
    {
      sector: 'Financial services',
      specialism: 'Data governance',
      kicker: 'Hiring with wider business impact.',
      title: 'Data governance capability that went beyond the original role brief.',
      body: 'Integr8 Talent built multiple data governance teams for financial services organisations, strengthening data quality, controls and risk capability.',
      outcome: 'Later feedback linked placed professionals to identifying and preventing multiple instances of financial crime—impact well beyond the initial hires.',
      count: 'RISK',
      countLabel: 'IMPACT'
    }
  ];

  const ledger = document.querySelector('[data-case-ledger]');
  const panel = ledger?.querySelector('#case-panel');
  const tabs = [...(ledger?.querySelectorAll('[role="tab"]') || [])];
  const fields = panel ? {
    sector: panel.querySelector('[data-case-sector]'),
    specialism: panel.querySelector('[data-case-specialism]'),
    kicker: panel.querySelector('[data-case-kicker]'),
    title: panel.querySelector('[data-case-title]'),
    body: panel.querySelector('[data-case-body]'),
    outcome: panel.querySelector('[data-case-outcome]'),
    count: panel.querySelector('[data-case-count]'),
    countLabel: panel.querySelector('.case-panel__count small')
  } : null;

  const showCase = (index, focus = false) => {
    if (!panel || !fields || !cases[index]) return;
    const item = cases[index];
    panel.classList.remove('is-changing');
    void panel.offsetWidth;
    panel.classList.add('is-changing');
    Object.entries(fields).forEach(([key, node]) => {
      if (node) node.textContent = item[key];
    });
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
      if (active) {
        panel.setAttribute('aria-labelledby', tab.id);
        if (focus) tab.focus();
      }
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showCase(index));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let target = index;
      if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      else target = (index - 1 + tabs.length) % tabs.length;
      showCase(target, true);
    });
  });
})();
