function initScene(){}

function initDesktopWindows(){
  document.querySelectorAll('.desk-icon').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open');
      const win = document.getElementById(id);
      if (win) win.classList.add('open');
    });
  });

  document.querySelectorAll('.win-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close');
      const win = document.getElementById(id);
      if (win) win.classList.remove('open');
    });
  });
}

function initTray(){
  const clockEl = document.getElementById('trayClock');
  const dateEl = document.getElementById('trayDate');
  const battEl = document.getElementById('trayBattery');

  const updateClock = () => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (clockEl) clockEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
  };
  updateClock();
  setInterval(updateClock, 1000);

  if (navigator.getBattery && battEl) {
    navigator.getBattery().then((b) => {
      const paint = () => {
        const pct = Math.round((b.level || 0) * 100);
        const charging = b.charging ? '⚡' : '🔋';
        battEl.textContent = `${charging} ${pct}%`;
      };
      paint();
      b.addEventListener('levelchange', paint);
      b.addEventListener('chargingchange', paint);
    }).catch(() => {
      battEl.textContent = '🔋 N/A';
    });
  } else if (battEl) {
    battEl.textContent = '🔋 N/A';
  }
}

function initStartMenu(projects){
  const btn = document.getElementById('startBtn');
  const menu = document.getElementById('startMenu');
  const items = document.getElementById('startItems');
  if(!btn || !menu || !items) return;

  const systemItems = `
    <a class="start-item" role="menuitem" href="#" data-open-window="readerWindow"><span>📘 Read Me</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="appsWindow"><span>🗂️ Programs</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="aboutWindow"><span>💾 About</span><small>open</small></a>
  `;
  const appItems = projects.map(p => `
    <a class="start-item" role="menuitem" href="${p.url}">
      <span>${p.name}</span>
      <small>${p.status}</small>
    </a>
  `).join('');
  items.innerHTML = systemItems + appItems;

  const closeMenu = () => {
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-hidden','true');
  };
  const openMenu = () => {
    menu.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-hidden','false');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if(menu.classList.contains('open')) closeMenu(); else openMenu();
  });

  document.addEventListener('click', (e) => {
    if(!menu.contains(e.target) && e.target !== btn) closeMenu();
  });

  menu.addEventListener('click', (e) => {
    const link = e.target.closest('.start-item');
    if(!link) return;
    const openId = link.getAttribute('data-open-window');
    if(openId){
      e.preventDefault();
      const win = document.getElementById(openId);
      if(win) win.classList.add('open');
    }
    closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeMenu();
  });
}

async function boot(){
  const res = await fetch('./apps.json');
  const data = await res.json();

  document.getElementById('name').textContent = data.owner || 'Michael Costea';
  document.getElementById('headline').textContent = data.bio?.headline || '';
  document.getElementById('summary').textContent = data.bio?.summary || '';

  const projects = data.projects || [];
  const statApps = document.getElementById('statApps');
  if (statApps) statApps.textContent = String(projects.length || 0);

  const apps = document.getElementById('apps');
  projects.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    const isPrivate = p.status === 'private';
    const cta = isPrivate
      ? `<a class="btn" href="${p.url}">Request access</a>`
      : `<a class="btn" href="${p.url}">Open app</a>`;

    const badgeText = p.status === 'live' ? 'Production' : (p.status === 'beta' ? 'Beta' : 'Private');

    card.innerHTML = `
      <div class="row">
        <h3>${p.name}</h3>
        <span class="badge ${p.status}">${badgeText}</span>
      </div>
      <p class="desc">${p.description || ''}</p>
      <div class="row">
        <small class="muted">${p.slug || 'project'}</small>
        ${cta}
      </div>
    `;
    apps.appendChild(card);
  });

  initStartMenu(projects);
  initDesktopWindows();
  initTray();
  initScene();
}
boot();
