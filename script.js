let zTop = 20;
const prefsKey = "michaelos_prefs_v1";
let prefs = { animations:true, singleMobile:true, theme:"default", bootSpeed:3450, premiumUI:true, uiSound:true };

async function runBootScreen(){
  const boot = document.getElementById('bootScreen');
  const biosText = document.getElementById('biosText');
  const biosHint = document.getElementById('biosHint');
  const bsod = document.getElementById('bsodScreen');
  const bsodCountdown = document.getElementById('bsodCountdown');
  if(!boot || !biosText){ document.body.classList.add('booted'); return; }

  document.body.classList.add('booting');

  let interrupted = false;
  const onInterrupt = () => { interrupted = true; };
  boot.addEventListener('pointerdown', onInterrupt, { once: true });
  boot.addEventListener('touchstart', onInterrupt, { once: true, passive: true });

  const lines = [
    'Award Modular BIOS v4.51PG, An Energy Star Ally',
    'Copyright (C) 1984-98, Award Software, Inc.',
    '',
    'M I C H A E L O S   1 9 8 9',
    '',
    'AMD-K6(tm)-2/500 CPU Found',
    'Memory Test : 32768K OK',
    '',
    'Award Plug and Play BIOS Extension v1.0A',
    'Copyright (C) 1998, Award Software, Inc.',
    '',
    'Detecting IDE Primary Master ... KINGSTON SA400S37',
    'Detecting IDE Primary Slave  ... None',
    'Detecting IDE Secondary Master... None',
    'Detecting IDE Secondary Slave ... None',
    '',
    'USB Controller ............... OK',
    'Keyboard Controller .......... OK',
    '',
    'Verifying DMI Pool Data ........ Success',
    'Boot from HDD0 ...'
  ];

  const totalDuration = Number(prefs.bootSpeed||3450);
  const perLine = Math.max(45, Math.floor(totalDuration / lines.length));

  for (let i=0;i<lines.length;i++){
    if (interrupted) break;
    biosText.textContent += lines[i] + '\n';
    if (biosText.textContent.length > 2200) {
      biosText.textContent = biosText.textContent.slice(-2200);
    }
    await new Promise(r => setTimeout(r, perLine));
  }

  if (interrupted) {
    const bios = document.getElementById('biosScreen');
    if (bios) bios.style.display = 'none';
    if (bsod) bsod.classList.add('show');
    let sec = 5;
    const tick = setInterval(() => {
      sec -= 1;
      if (bsodCountdown) bsodCountdown.textContent = `Reloading in ${sec}...`;
      if (sec <= 0) {
        clearInterval(tick);
        location.reload();
      }
    }, 1000);
    return;
  }

  if (biosHint) biosHint.textContent = 'Press F1 to continue, DEL to enter SETUP';
  await new Promise(r => setTimeout(r, 260));

  boot.classList.add('exiting');
  await new Promise(r => setTimeout(r, 520));
  boot.classList.add('hidden');
  document.body.classList.remove('booting');
  document.body.classList.add('booted');
}

function updateTaskbarMetrics(){
  const taskbar = document.querySelector('.taskbar');
  const h = taskbar ? Math.ceil(taskbar.getBoundingClientRect().height) : 46;
  document.documentElement.style.setProperty('--taskbar-h', `${Math.max(38, h)}px`);
  return Math.max(38, h);
}

function isMobileMode(){
  return window.matchMedia('(max-width: 820px), (orientation: portrait) and (max-width: 1100px), (hover: none) and (pointer: coarse)').matches;
}

function clearMobileWindowInlineStyles(win){
  if(!win || !isMobileMode()) return;
  win.style.left = '';
  win.style.right = '';
  win.style.top = '';
  win.style.width = '';
  win.style.height = '';
}

function applyLayoutMode(){
  updateTaskbarMetrics();
  document.body.classList.toggle('mobile-mode', isMobileMode());
  if (isMobileMode()) document.querySelectorAll('.win-window').forEach(clearMobileWindowInlineStyles);
}

function clampWindowToViewport(win){
  if (isMobileMode()) { clearMobileWindowInlineStyles(win); return; }
  const taskbarH = updateTaskbarMetrics();
  const rect = win.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - taskbarH - rect.height - 8);
  const left = Math.min(Math.max(8, rect.left), maxLeft);
  const top = Math.min(Math.max(8, rect.top), maxTop);
  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
}

function centerWindow(win){
  if(!win) return;
  if (isMobileMode()) { clearMobileWindowInlineStyles(win); return; }
  const taskbarH = updateTaskbarMetrics();
  const rect = win.getBoundingClientRect();
  const left = Math.max(8, Math.round((window.innerWidth - rect.width) / 2));
  const top = Math.max(8, Math.round((window.innerHeight - taskbarH - rect.height) / 2));
  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
  clampWindowToViewport(win);
}

function bringFront(win){
  if(!win) return;
  zTop += 1;
  document.querySelectorAll('.win-window').forEach(w => w.classList.remove('active'));
  win.style.zIndex = String(zTop);
  win.classList.add('active');
  refreshTaskbar();
}

function syncImmersiveMode(){
  const bw = document.getElementById('browserWindow');
  const immersive = !!(isMobileMode() && bw && bw.classList.contains('open') && bw.classList.contains('maximized') && !bw.classList.contains('minimized'));
  document.body.classList.toggle('immersive-app', immersive);
}

function openWindow(id){
  const win = document.getElementById(id);
  if(!win) return;

  if (isMobileMode()) {
    document.querySelectorAll('.win-window.open').forEach(w => {
      if (w.id !== id) w.classList.remove('open');
    });
  }

  win.classList.remove('minimized');
  win.classList.add('open');
  if(!win.classList.contains('maximized')) centerWindow(win);
  bringFront(win);
  if(id === 'otisGameWindow') {
    if (isMobileMode()) win.classList.add('maximized');
    setTimeout(() => document.getElementById('otisGameCanvas')?.focus({preventScroll:true}), 40);
  }
  syncImmersiveMode();
  uiBeep('open');
}

function closeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;

  if(id === 'browserWindow'){
    const frame = document.getElementById('appFrame');
    try{ frame?.contentWindow?.postMessage({type:'mikenet-close'}, '*'); }catch{}
    setTimeout(()=>{ if(frame) frame.src = 'about:blank'; }, 20);
  }

  win.classList.remove('open','minimized','maximized','active');
  ['left','top','width','height','right','bottom'].forEach(k=> win.style[k]='');
  delete win.dataset.prevLeft;
  delete win.dataset.prevTop;
  delete win.dataset.prevWidth;
  delete win.dataset.prevHeight;
  delete win.dataset.prevRight;
  delete win.dataset.prevBottom;
  syncImmersiveMode();
  refreshTaskbar();
}

function minimizeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  win.classList.remove('open','active');
  win.classList.add('minimized');
  syncImmersiveMode();
  refreshTaskbar();
}

function toggleMaximizeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  if(win.classList.contains('maximized')){
    win.classList.remove('maximized');
    if(win.dataset.prevLeft!==undefined) win.style.left = win.dataset.prevLeft;
    if(win.dataset.prevTop!==undefined) win.style.top = win.dataset.prevTop;
    if(win.dataset.prevWidth!==undefined) win.style.width = win.dataset.prevWidth;
    if(win.dataset.prevHeight!==undefined) win.style.height = win.dataset.prevHeight;
    win.style.right = win.dataset.prevRight || '';
    win.style.bottom = win.dataset.prevBottom || '';
  }else{
    win.dataset.prevLeft = win.style.left || '';
    win.dataset.prevTop = win.style.top || '';
    win.dataset.prevWidth = win.style.width || '';
    win.dataset.prevHeight = win.style.height || '';
    win.dataset.prevRight = win.style.right || '';
    win.dataset.prevBottom = win.style.bottom || '';
    win.classList.add('maximized');
  }
  win.classList.remove('minimized');
  win.classList.add('open');
  bringFront(win);
  const isMax = win.classList.contains('maximized');
  syncImmersiveMode();
  const maxBtn = win.querySelector('.win-max');
  if(maxBtn){
    maxBtn.setAttribute('aria-pressed', String(isMax));
    maxBtn.setAttribute('title', isMax ? 'Restore' : 'Maximize');
    maxBtn.setAttribute('aria-label', isMax ? 'Restore' : 'Maximize');
    maxBtn.classList.toggle('is-restore', isMax);
  }
  refreshTaskbar();
}


function launchInMikeNet(url, title='Program'){
  // Immersive experiences should take over the full site, not run in iframe windows.
  if((url||'').includes('do-not-touch.html') || (url||'').includes('do-not-touch-3d/index.html') || (url||'').includes('otis-and-friends-v3d.html')){
    try{
      if(window.top && window.top !== window.self){ window.top.location.href = url; }
      else { window.location.href = url; }
      return;
    }catch{}
  }

  const frame = document.getElementById('appFrame');
  const head = document.getElementById('browserTitle');
  const addr = document.getElementById('mikenetAddr');
  if(frame) frame.src = url;
  if(head) head.textContent = `MikeNet — ${title}`;
  if(addr) addr.value = url;
  openWindow('browserWindow');
}

function initDesktopWindows(){
  document.querySelectorAll('.desk-icon').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open');
      const appUrl = btn.getAttribute('data-app');
      const textFile = btn.getAttribute('data-text-file');
      const appTitle = btn.getAttribute('data-title') || 'Program';
      if(textFile){
        const url = `./apps/text.html?file=${encodeURIComponent(textFile)}`;
        launchInMikeNet(url, appTitle);
        return;
      }
      if(appUrl){
        launchInMikeNet(appUrl, appTitle);
        return;
      }
      if (id) openWindow(id);
    });
  });

  // Buttons inside the initial Welcome window also use data-open.
  // They are not .desk-icon elements, so wire them explicitly.
  document.querySelectorAll('button[data-open]:not(.desk-icon)').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open');
      if (id) openWindow(id);
    });
  });

  document.querySelectorAll('.win-window').forEach((win)=>{
    const titleBar = win.querySelector('.win-title');
    const closeBtn = titleBar?.querySelector('.win-close');
    if(!titleBar || !closeBtn || titleBar.querySelector('.win-controls')) return;
    const controls = document.createElement('div');
    controls.className = 'win-controls';
    controls.innerHTML = `<button class="win-btn win-min" title="Minimize" aria-label="Minimize" data-minimize="${win.id}"></button><button class="win-btn win-max" title="Maximize" aria-label="Maximize" data-maximize="${win.id}" aria-pressed="false"></button>`;
    controls.appendChild(closeBtn);
    titleBar.appendChild(controls);
    titleBar.addEventListener('dblclick', (e)=>{ if(!e.target.closest('button')) toggleMaximizeWindow(win.id); });
  });

  document.querySelectorAll('.win-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close');
      if (id) closeWindow(id);
    });
  });
  document.querySelectorAll('.win-min').forEach((btn)=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-minimize');
      if(id) minimizeWindow(id);
    });
  });
  document.querySelectorAll('.win-max').forEach((btn)=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-maximize');
      if(id) toggleMaximizeWindow(id);
    });
  });

  document.querySelectorAll('.win-window').forEach(win => {
    win.addEventListener('pointerdown', () => bringFront(win));
  });

  initDrag();
}

function initDrag(){
  document.querySelectorAll('.win-window').forEach(win => {
    const bar = win.querySelector('.win-title');
    if(!bar) return;
    let dragging=false, ox=0, oy=0, pid=null;

    const onMove = (clientX, clientY) => {
      if(!dragging) return;
      const rect = win.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - rect.width - 8);
      const maxY = Math.max(8, window.innerHeight - 38 - rect.height - 8);
      const left = Math.min(Math.max(8, clientX - ox), maxX);
      const top = Math.min(Math.max(8, clientY - oy), maxY);
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    };

    const stopDrag = () => {
      dragging=false;
      document.body.style.userSelect='';
      if(pid!==null){
        try{ bar.releasePointerCapture(pid); }catch{}
      }
      pid=null;
    };

    bar.addEventListener('pointerdown', (e) => {
      if(e.target.closest('button')) return;
      if(e.button !== undefined && e.button !== 0) return;
      dragging=true;
      bringFront(win);
      const rect = win.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      document.body.style.userSelect='none';
      pid=e.pointerId;
      try{ bar.setPointerCapture(pid); }catch{}
      e.preventDefault();
    });

    bar.addEventListener('pointermove', (e)=> onMove(e.clientX, e.clientY));
    bar.addEventListener('pointerup', stopDrag);
    bar.addEventListener('pointercancel', stopDrag);
  });
}

function initTray(){
  const clockEl = document.getElementById('trayClock');
  const dateEl = document.getElementById('trayDate');
  const battEl = document.getElementById('trayBattery');
  const updateClock = () => {
    const now = new Date();
    if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  updateClock();
  setInterval(updateClock, 1000);

  if (navigator.getBattery && battEl) {
    navigator.getBattery().then((b) => {
      const paint = () => {
        const pct = Math.round((b.level || 0) * 100);
        battEl.textContent = `${b.charging ? '⚡' : '🔋'} ${pct}%`;
      };
      paint();
      b.addEventListener('levelchange', paint);
      b.addEventListener('chargingchange', paint);
    }).catch(() => battEl.textContent = '🔋 N/A');
  } else if (battEl) battEl.textContent = '🔋 N/A';
}

function refreshTaskbar(){
  const wrap = document.getElementById('taskButtons');
  if(!wrap) return;
  const windows = Array.from(document.querySelectorAll('.win-window.open, .win-window.minimized')).filter((w,i,a)=>a.indexOf(w)===i);
  wrap.innerHTML = windows.map(w => {
    const title = w.querySelector('.win-title span')?.textContent || w.id;
    const active = (w.classList.contains('active') && w.classList.contains('open')) ? 'active' : '';
    const minimized = w.classList.contains('minimized') ? 'minimized' : '';
    return `<button class="task-btn ${active} ${minimized}" data-focus="${w.id}">${title}</button>`;
  }).join('');

  wrap.querySelectorAll('.task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-focus');
      const win = document.getElementById(id);
      if(!win) return;
      if(win.classList.contains('minimized')){
        win.classList.remove('minimized');
        win.classList.add('open');
        bringFront(win);
      } else if(win.classList.contains('active') && win.classList.contains('open')){
        minimizeWindow(id);
      } else {
        win.classList.add('open');
        win.classList.remove('minimized');
        bringFront(win);
      }
      refreshTaskbar();
    });
  });
}

function initStartMenu(projects){
  const btn = document.getElementById('startBtn');
  const menu = document.getElementById('startMenu');
  const items = document.getElementById('startItems');
  if(!btn || !menu || !items) return;

  // Public-release mode: keep navigation flat and reliable. No cascading app menus
  // until each webapp is refit and explicitly released.
  items.innerHTML = `
    <a class="start-item" role="menuitem" href="#" data-open-window="aboutWindow"><span><b class="si">🖥️</b>My Computer</span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="resumeWindow"><span><b class="si">📄</b>Resume</span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="projectsWindow"><span><b class="si">📁</b>Projects</span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="agentsWindow"><span><b class="si">🤖</b>AI Agents</span></a>
    <a class="start-item start-cta" role="menuitem" href="#" data-open-window="aiHelpWindow"><span><b class="si">🎓</b>AI Help</span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="otisGameWindow"><span><b class="si">🎮</b>Otis & Sully</span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="appsWindow"><span><b class="si">🗂️</b>Programs</span><small>hidden</small></a>
    <div class="start-sep"></div>
    <a class="start-item" role="menuitem" href="mailto:costra.michael@gmail.com"><span><b class="si">✉️</b>Email</span></a>
    <a class="start-item" role="menuitem" href="https://www.linkedin.com/in/michaelcostea" target="_blank" rel="noopener"><span><b class="si">🔗</b>LinkedIn</span></a>
    <div class="start-sep"></div>
    <a class="start-item" role="menuitem" href="#" data-open-window="recycleWindow"><span><b class="si">🗑️</b>Recycle Bin</span></a>
  `;

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

  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.contains('open') ? closeMenu() : openMenu(); });
  document.addEventListener('click', (e) => { if(!menu.contains(e.target) && e.target !== btn) closeMenu(); });
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('.start-item');
    if(!link) return;
    const openId = link.getAttribute('data-open-window');
    if(openId){ e.preventDefault(); openWindow(openId); closeMenu(); return; }
    closeMenu();
  });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMenu(); });
}



function initGuideTabs(){
  const root = document.getElementById('hermesGuideWindow');
  if(!root || root.dataset.guideTabsReady === '1') return;
  root.dataset.guideTabsReady = '1';
  const labels = {
    product: { hermes: 'Hermes Agent', openclaw: 'OpenClaw' },
    os: { mac: 'Mac', windows: 'Windows', linux: 'Linux' }
  };
  const state = { product: 'hermes', os: 'mac' };
  const paint = () => {
    root.querySelectorAll('[data-guide-product]').forEach(btn => {
      const active = btn.getAttribute('data-guide-product') === state.product;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    root.querySelectorAll('[data-guide-os]').forEach(btn => {
      const active = btn.getAttribute('data-guide-os') === state.os;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    root.querySelectorAll('.guide-panel').forEach(panel => {
      const on = panel.getAttribute('data-panel-product') === state.product && panel.getAttribute('data-panel-os') === state.os;
      panel.classList.toggle('active', on);
      panel.hidden = !on;
    });
    root.querySelectorAll('[data-checklist-product]').forEach(panel => {
      const on = panel.getAttribute('data-checklist-product') === state.product;
      panel.classList.toggle('active', on);
      panel.hidden = !on;
    });
    const status = root.querySelector('[data-guide-selection-status]');
    if(status){
      status.innerHTML = `<b>Showing now:</b> ${labels.product[state.product] || state.product} on ${labels.os[state.os] || state.os}. Only this computer path is visible below.`;
    }
  };
  window.setGuideTab = (kind, value) => {
    if(kind === 'product' && labels.product[value]) state.product = value;
    if(kind === 'os' && labels.os[value]) state.os = value;
    paint();
  };
  root.addEventListener('click', (e) => {
    const productBtn = e.target.closest('[data-guide-product]');
    if(productBtn && root.contains(productBtn)){
      e.preventDefault();
      window.setGuideTab('product', productBtn.getAttribute('data-guide-product') || 'hermes');
      return;
    }
    const osBtn = e.target.closest('[data-guide-os]');
    if(osBtn && root.contains(osBtn)){
      e.preventDefault();
      window.setGuideTab('os', osBtn.getAttribute('data-guide-os') || 'mac');
    }
  }, true);
  paint();
}

initGuideTabs();
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initGuideTabs, { once: true });
}

function themeIconKey(btn){
  const label=(btn.querySelector('span')?.textContent||'').toLowerCase();
  if(label.includes('read me')) return 'readme';
  if(label.includes('system info')) return 'settings';
  if(label.includes('planner')) return 'planner';
  if(label.includes('card')) return 'cards';
  if(label.includes('ozquotes')) return 'ozquotes';
  if(label.includes('paint')) return 'paint';
  if(label.includes('.text')) return 'text';
  if(label.includes('live chat')) return 'chat';
  if(label.includes('programs')) return 'programs';
  if(label.includes('recycle')) return 'recycle';
  if(label.includes('if.exe')) return 'ifexe';
  if(label.includes('doom')) return 'doom';
  if(label.includes('hacker.exe')) return 'hackerexe';
  if(label.includes('do not touch')) return 'donottouch';
  if(label.includes('otis')) return 'otis';
  if(label.includes('minesweeper')) return 'minesweeper';
  if(label.includes('solitaire')) return 'solitaire';
  if(label.includes('sky slope') || label.includes('ski')) return 'skifree';
  return 'readme';
}

function themedIconDataUrl(theme,key){
  const appGlyphs = {
    readme:'📘', settings:'🛠️', planner:'🗓️', cards:'🪪', ozquotes:'💡', paint:'🎨', text:'📝', chat:'💬', programs:'🗂️', recycle:'🗑️', ifexe:'⚙️', doom:'👹', hackerexe:'👾', donottouch:'🐇', otis:'🧢', minesweeper:'💣', solitaire:'🃏', skifree:'⛷️'
  };
  const themeGlyphs = { matrix:'🕶️', tmnt:'🐢', element:'🛸', hacker:'💻', catdog:'🐾', spiderman:'🕷️', mario:'🍄' };
  const palettes = {
    matrix:['#00160a','#00351a','#39ff14'],
    tmnt:['#12210b','#21421b','#7fe26c'],
    element:['#130f28','#2f235e','#f6a84e'],
    hacker:['#070e16','#11253a','#7df2ff'],
    catdog:['#26170d','#473225','#ffbf66'],
    spiderman:['#150916','#2a1339','#5bb1ff'],
    mario:['#1a1b45','#2e4db3','#ffdf5a']
  };
  const [c1,c2,border] = palettes[theme] || ['#1f1f1f','#3a3a3a','#cfcfcf'];
  const app = appGlyphs[key] || '📦';
  const badge = themeGlyphs[theme] || '✨';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>
    <rect x='6' y='6' width='52' height='52' fill='url(#g)' stroke='${border}' stroke-width='2' rx='6'/>
    <text x='32' y='38' text-anchor='middle' font-size='24'>${app}</text>
    <circle cx='50' cy='14' r='9' fill='rgba(0,0,0,.45)' stroke='${border}' stroke-width='1'/>
    <text x='50' y='18' text-anchor='middle' font-size='10'>${badge}</text>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function applyThemeIcons(theme){
  const themed = ['matrix','tmnt','element','hacker','catdog','spiderman','mario'];
  document.querySelectorAll('.desk-icon').forEach(btn=>{
    btn.style.backgroundImage='';
    btn.style.backgroundSize='';
    btn.style.backgroundRepeat='';
    btn.style.backgroundPosition='';
  });
  if(!themed.includes(theme)) return;
  document.querySelectorAll('.desk-icon').forEach(btn=>{
    const key=themeIconKey(btn);
    btn.style.backgroundImage = themedIconDataUrl(theme,key);
    btn.style.backgroundSize = '34px 34px';
    btn.style.backgroundRepeat = 'no-repeat';
    btn.style.backgroundPosition = 'center 6px';
  });
}

function setLoreTheme(theme){
  const themes = ['matrix','tmnt','element','hacker','catdog','spiderman','mario'];
  themes.forEach(t => document.body.classList.remove(`lore-${t}`));

  const loreNote = document.getElementById('loreNote');
  const notes = {
    matrix: 'Neon Intrusion Layer: follow the white rabbit through dial-up static.',
    tmnt: 'Sewer Shell Network: dojo pings active, pizza timer set to 11.',
    element: 'Element Protocol: four keys aligned, fifth channel standing by.',
    hacker: 'Cyber Deck: BBS alias routing through dark fiber nodes.',
    catdog: 'Dual Mode Kernel: one body, two render engines.',
    spiderman: 'City Swing Protocol: web-lines, skyline leaps, responsibility checks.',
    mario: 'Mushroom Kingdom Kernel: pipes, power-ups, and side-scrolling momentum.'
  };

  if(theme && theme !== 'default'){
    document.body.classList.add(`lore-${theme}`);
    if(loreNote) loreNote.textContent = notes[theme] || '';
  } else {
    if(loreNote) loreNote.textContent = '';
  }
  applyThemeIcons(theme||'default');
}

function initLoreDock(){
  // legacy no-op (themes now in settings)
}

function initEasterEggs(){
  // legacy hook retained for compatibility
}

function initLoreEggs(){
  // CatDog mode
  const catdogBtn = document.getElementById('catdogToggle');
  if(catdogBtn){
    catdogBtn.addEventListener('click', ()=>{
      const active = document.body.classList.contains('lore-catdog');
      setLoreTheme(active ? 'default' : 'catdog');
      showToast(active ? 'CatDog mode disabled.' : 'CatDog mode enabled: one body, two modes.');
    });
  }

  // BBS handle generator
  const bbsBtn = document.getElementById('bbsHandleBtn');
  const bbsOut = document.getElementById('bbsHandleOut');
  const words = ['NEON','OOZE','VECTOR','TURTLE','PIXEL','GLITCH','MULTI'];
  if(bbsBtn && bbsOut){
    bbsBtn.addEventListener('click', ()=>{
      const handle = `${words[Math.floor(Math.random()*words.length)]}_${words[Math.floor(Math.random()*words.length)]}_${Math.floor(10+Math.random()*89)}`;
      bbsOut.textContent = handle;
      showToast(`Handle assigned: ${handle}`);
    });
  }

  // Recycle bin -> sewer
  const recycle = document.getElementById('recycleBin');
  const recycleLabel = document.getElementById('recycleLabel');
  if(recycle && recycleLabel){
    recycle.addEventListener('dblclick', ()=>{
      recycleLabel.textContent = 'SEWER BIN';
      showToast('Access hatch open. Mind the ooze.');
    });
  }

  // Dial-up matrix handshake (hold)
  const dialBtn = document.getElementById('dialupConnect');
  if(dialBtn){
    let t;
    const start=()=>{ t=setTimeout(()=>{ document.body.classList.add('matrix-flash'); showToast('Handshake negotiated. Welcome, operator.'); setTimeout(()=>document.body.classList.remove('matrix-flash'), 2200); },1500); };
    const stop=()=>{ clearTimeout(t); };
    dialBtn.addEventListener('mousedown',start); dialBtn.addEventListener('touchstart',start,{passive:true});
    dialBtn.addEventListener('mouseup',stop); dialBtn.addEventListener('mouseleave',stop); dialBtn.addEventListener('touchend',stop);
    dialBtn.addEventListener('click',()=>showToast('Dialing... krrrrshhhhh-beeeep-krchhh'));
  }

  // Command triggers (Multipass + Cowabunga)
  let buf='';
  window.addEventListener('keydown', (e)=>{
    if(e.key.length===1) buf=(buf+e.key.toUpperCase()).slice(-24);
    if(buf.includes('MULTIPASS')){ openWindow('elementWindow'); showToast('Credential accepted. Transit tier: MULTIPASS.'); buf=''; }
    if(buf.includes('COWABUNGA')){ openWindow('dojoWindow'); showToast('Shell protocol loaded. Training mode on.'); buf=''; }
  });
}


function loadPrefs(){
  try{ const p = JSON.parse(localStorage.getItem(prefsKey)||'null'); if(p) prefs = {...prefs, ...p}; }catch{}
}
function savePrefs(){
  localStorage.setItem(prefsKey, JSON.stringify(prefs));
}
let audioCtx;
function uiBeep(kind='tap'){
  if(!prefs.uiSound) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator();
    const g=audioCtx.createGain();
    o.type='square';
    const f = kind==='open' ? 740 : kind==='alert' ? 260 : 520;
    o.frequency.setValueAtTime(f,audioCtx.currentTime);
    g.gain.setValueAtTime(0.0001,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.04,audioCtx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.07);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+0.08);
  }catch{}
}

function showToast(msg){
  const t = document.getElementById('easterToast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  uiBeep('alert');
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(()=> t.classList.remove('show'), 1800);
}

function applyPrefs(){
  document.body.classList.toggle('no-anim', !prefs.animations);
  document.body.classList.toggle('premium-ui', !!prefs.premiumUI);
  setLoreTheme(prefs.theme || 'default');
}

function initSettingsPanel(){
  const anim = document.getElementById('setAnimations');
  const single = document.getElementById('setSingleMobile');
  const theme = document.getElementById('themeSelect');
  const applyBtn = document.getElementById('applyThemeBtn');
  const bootSel = document.getElementById('bootSpeedSelect');

  if(anim){ anim.checked = !!prefs.animations; anim.addEventListener('change',()=>{ prefs.animations = anim.checked; savePrefs(); applyPrefs(); }); }
  if(single){ single.checked = !!prefs.singleMobile; single.addEventListener('change',()=>{ prefs.singleMobile = single.checked; savePrefs(); }); }
  if(theme){
    theme.value = prefs.theme || 'default';
    theme.addEventListener('change',()=>{ prefs.theme = theme.value; savePrefs(); applyPrefs(); showToast('Theme applied: '+theme.value); });
  }
  if(applyBtn && theme){ applyBtn.addEventListener('click',()=>{ prefs.theme = theme.value; savePrefs(); applyPrefs(); showToast('Theme applied: '+theme.value); }); }
  if(bootSel){ bootSel.value = String(prefs.bootSpeed||3450); bootSel.addEventListener('change',()=>{ prefs.bootSpeed = Number(bootSel.value||3450); savePrefs(); showToast('Boot speed updated'); }); }
}

function initQuirkyStartActions(){
  const loreKey = 'm89_lore_state_v1';
  const loreState = JSON.parse(localStorage.getItem(loreKey)||'{"tokens":[],"rank":"Visitor"}');
  const saveLore = ()=> localStorage.setItem(loreKey, JSON.stringify(loreState));

  const launchMap = {
    planner:'./apps/planner.html',
    cards:'./apps/cards.html',
    ozquotes:'./apps/ozquotes.html',
    paint:'./apps/paint.html',
    text:'./apps/text.html',
    chat:'./apps/chat.html',
    'if.exe':'./apps/if-exe.html',
    ifexe:'./apps/if-exe.html',
    doom:'./apps/doom.html',
    hacker:'./apps/hacker-exe.html',
    minesweeper:'./apps/games/minesweeper.html',
    solitaire:'./apps/games/solitaire.html',
    'sky slope':'./apps/games/skifree.html',
    skifree:'./apps/games/skifree.html',
    otis:'./apps/games/otis-and-friends-v3d.html',
    'otis and his friends':'./apps/games/otis-and-friends-v3d.html'
  };

  const renderBlackCell = ()=>{
    const rankEl=document.getElementById('blackcellRank');
    const logEl=document.getElementById('blackcellLog');
    if(rankEl) rankEl.textContent = `// Rank: ${loreState.rank}`;
    if(!logEl) return;
    const logs=[
      '[ARCHIVE] 1989-06-01 :: M89 kernel branch initialized.',
      '[OPLOG]   1995-09-15 :: City net anomaly tagged as "Hackers-class event".',
      '[OPLOG]   2001-06-08 :: Swordfish doctrine imported into Black Cell training stack.',
      `[TOKEN]   matrix=${loreState.tokens.includes('matrix')?'acquired':'missing'} | cowabunga=${loreState.tokens.includes('cowabunga')?'acquired':'missing'} | multipass=${loreState.tokens.includes('multipass')?'acquired':'missing'}`,
      '[INTEL]   Objective: maintain plausible deniability while routing all noise through honey nodes.',
      '[INTEL]   Next step: run command unlock_blackcell if token set is complete.'
    ];
    logEl.textContent = logs.join('\n');
  };

  const commandEggs = {
    winver: ()=> openWindow('aboutWindow'),
    matrix: ()=> { prefs.theme='matrix'; savePrefs(); applyPrefs(); showToast('Neon Intrusion Layer enabled.'); },
    cowabunga: ()=> { prefs.theme='tmnt'; savePrefs(); applyPrefs(); openWindow('dojoWindow'); showToast('Shell protocol online.'); },
    multipass: ()=> { prefs.theme='element'; savePrefs(); applyPrefs(); openWindow('elementWindow'); showToast('Credential accepted. MULTIPASS.'); },
    hacktheplanet: ()=> { launchInMikeNet('./apps/hacker-exe.html','HACKER.EXE'); showToast('Global terminal uplink granted.'); },
    thetruthisoutthere: ()=> { prefs.theme='hacker'; savePrefs(); applyPrefs(); showToast('Black Cell archive decrypted.'); },
    m89_rank: ()=> { showToast(`Rank: ${loreState.rank} • Tokens: ${loreState.tokens.join(', ')||'none'}`); },
    blackcell: ()=> {
      if(loreState.rank!=='Operator'){ showToast('ACCESS DENIED // Operator rank required'); return; }
      renderBlackCell();
      openWindow('blackcellWindow');
    },
    unlock_blackcell: ()=> {
      const needed=['matrix','cowabunga','multipass'];
      const ok=needed.every(t=>loreState.tokens.includes(t));
      if(ok){ loreState.rank='Operator'; saveLore(); showToast('BLACK CELL UNLOCKED // Rank promoted: Operator'); }
      else showToast('Missing tokens: '+needed.filter(t=>!loreState.tokens.includes(t)).join(', '));
    }
  };
  document.querySelectorAll('[data-app-quick]').forEach(el=>{
    el.addEventListener('click',(e)=>{
      e.preventDefault();
      launchInMikeNet(el.getAttribute('data-app-quick'), el.getAttribute('data-title-quick')||'Program');
      closeWindow('favoritesWindow');
      closeWindow('documentsWindow');
    });
  });

  const surprise = document.getElementById('favoriteSurprise');
  if(surprise){
    surprise.addEventListener('click',()=>{
      const picks=['./apps/doom.html','./apps/hacker-exe.html','./apps/games/skifree.html','./apps/if-exe.html'];
      const pick=picks[Math.floor(Math.random()*picks.length)];
      launchInMikeNet(pick,'Surprise');
      showToast('Lucky launch engaged ✨');
      closeWindow('favoritesWindow');
    });
  }

  const runGo = document.getElementById('runGo');
  const runInput = document.getElementById('runInput');
  const findGo = document.getElementById('findGo');
  const findInput = document.getElementById('findInput');

  const runCmd = (raw)=>{
    const q=(raw||'').trim().toLowerCase();
    if(!q) return;

    if(commandEggs[q]){
      commandEggs[q]();
      ['matrix','cowabunga','multipass'].forEach(t=>{ if(q===t && !loreState.tokens.includes(t)) loreState.tokens.push(t); });
      if(loreState.tokens.length>=2 && loreState.rank==='Visitor') loreState.rank='Initiate';
      saveLore();
      closeWindow('runWindow');
      closeWindow('findWindow');
      return;
    }

    const direct = launchMap[q] || Object.entries(launchMap).find(([k])=>q.includes(k))?.[1];
    if(direct){ launchInMikeNet(direct, q); closeWindow('runWindow'); closeWindow('findWindow'); return; }
    if(q.includes('help')){ openWindow('helpWindow'); closeWindow('runWindow'); closeWindow('findWindow'); return; }
    if(q.includes('shutdown')){ openWindow('shutdownWindow'); closeWindow('runWindow'); closeWindow('findWindow'); return; }
    if(q.includes('rank')||q.includes('lore')){ showToast(`Rank: ${loreState.rank} • Tokens: ${loreState.tokens.join(', ')||'none'}`); return; }
    showToast(`No match for: ${raw}`);
  };

  if(runGo && runInput) runGo.addEventListener('click',()=>runCmd(runInput.value));
  if(findGo && findInput) findGo.addEventListener('click',()=>runCmd(findInput.value));
  if(runInput) runInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') runCmd(runInput.value); });
  if(findInput) findInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') runCmd(findInput.value); });

  const bcRefresh=document.getElementById('blackcellRefresh');
  if(bcRefresh) bcRefresh.addEventListener('click', renderBlackCell);
}


function initOtisGame(){
  const canvas = document.getElementById('otisGameCanvas');
  const hud = document.getElementById('otisGameHud');
  if(!canvas || canvas.dataset.ready === '1') return;
  canvas.dataset.ready = '1';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const keys = new Set();
  const world = {
    gravity: 0.55,
    platforms: [
      {x:0,y:392,w:720,h:28},{x:58,y:326,w:260,h:16},{x:390,y:326,w:270,h:16},
      {x:0,y:262,w:230,h:16},{x:300,y:262,w:330,h:16},{x:86,y:198,w:280,h:16},
      {x:444,y:198,w:240,h:16},{x:20,y:134,w:260,h:16},{x:365,y:134,w:250,h:16},
      {x:160,y:72,w:390,h:16}
    ],
    ladders: [{x:250,y:262,w:34,h:130},{x:638,y:198,w:34,h:130},{x:42,y:134,w:34,h:130},{x:318,y:72,w:34,h:130}],
    treats: [{x:90,y:300},{x:500,y:300},{x:120,y:236},{x:456,y:236},{x:210,y:172},{x:580,y:172},{x:116,y:108},{x:450,y:108},{x:520,y:48}],
    cracked: [{x:558,y:310,w:34,h:16,alive:true},{x:178,y:182,w:34,h:16,alive:true}],
    gate: {x:506,y:28,w:38,h:44}
  };
  const heroes = [
    {name:'Otis',color:'#ffb02e',hat:'#7c3aed',x:42,y:350,vx:0,vy:0,w:20,h:28,onGround:false,climbing:false,score:0,jump:-10.6,speed:3.0},
    {name:'Sully',color:'#67e8f9',hat:'#0f766e',x:70,y:350,vx:0,vy:0,w:24,h:30,onGround:false,climbing:false,score:0,jump:-8.8,speed:2.35}
  ];
  let active = 0, lives = 3, won = false, lost = false, tick = 0;
  const barrels = [];
  function reset(){
    heroes[0].x=42; heroes[0].y=350; heroes[0].vx=0; heroes[0].vy=0; heroes[0].score=0;
    heroes[1].x=70; heroes[1].y=350; heroes[1].vx=0; heroes[1].vy=0; heroes[1].score=0;
    active=0; lives=3; won=false; lost=false; tick=0; barrels.length=0;
    world.treats.forEach(t=>t.got=false); world.cracked.forEach(c=>c.alive=true);
    canvas.focus({preventScroll:true});
  }
  function rects(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
  function nearLadder(p){ return world.ladders.find(l => p.x+p.w>l.x && p.x<l.x+l.w && p.y+p.h>l.y && p.y<l.y+l.h); }
  function solidPlatforms(){ return world.platforms.concat(world.cracked.filter(c=>c.alive)); }
  function respawnHit(){
    lives -= 1;
    if(lives <= 0){ lost = true; return; }
    heroes.forEach((p,i)=>{ p.x=42+i*28; p.y=350; p.vx=0; p.vy=0; p.climbing=false; });
    barrels.length=0;
  }
  function updatePlayer(p, isActive){
    const left = keys.has('ArrowLeft') || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    const up = keys.has('ArrowUp') || keys.has('KeyW');
    const down = keys.has('ArrowDown') || keys.has('KeyS');
    const ladder = nearLadder(p);
    if(isActive){
      p.vx = (right-left) * p.speed;
      if(ladder && (up || down)){ p.climbing = true; p.x += ((ladder.x + ladder.w/2) - (p.x+p.w/2))*0.18; p.vy = (down-up)*2.4; }
      else if(!ladder) p.climbing = false;
      if((keys.has('Space') || keys.has('KeyW') || keys.has('ArrowUp')) && p.onGround && !p.climbing){ p.vy = p.jump; p.onGround=false; }
    } else {
      const lead = heroes[active];
      const dx = lead.x - p.x;
      p.vx = Math.abs(dx) > 44 ? Math.sign(dx) * p.speed * 0.72 : 0;
      if(lead.y < p.y-36 && p.onGround) p.vy = p.jump * 0.82;
      p.climbing = false;
    }
    if(!p.climbing) p.vy += world.gravity;
    else p.onGround=false;
    p.x += p.vx; p.y += p.vy;
    p.x = Math.max(0, Math.min(W-p.w, p.x));
    p.onGround = false;
    for(const plat of solidPlatforms()){
      if(rects(p, plat) && p.vy >= 0 && p.y+p.h-p.vy <= plat.y+4){
        p.y = plat.y-p.h; p.vy=0; p.onGround=true; p.climbing=false;
        if(plat.alive && p.name==='Sully' && Math.abs(p.vx)>.1 && plat.w===34){ plat.alive=false; }
      }
    }
    if(p.y > H + 80) respawnHit();
  }
  function updateBarrels(){
    if(tick % 115 === 0 && barrels.length < 6) barrels.push({x:170,y:50,w:18,h:18,vx:2.1 + Math.random()*0.7,vy:0});
    for(const b of barrels){
      b.vy += 0.36; b.x += b.vx; b.y += b.vy;
      for(const plat of solidPlatforms()){
        if(rects(b, plat) && b.vy >= 0 && b.y+b.h-b.vy <= plat.y+5){ b.y=plat.y-b.h; b.vy=0; if(b.x<12 || b.x+b.w>W-12 || Math.random()<0.012) b.vx*=-1; }
      }
      if(b.x < 0 || b.x+b.w > W) b.vx *= -1;
      for(const p of heroes){ if(rects(p,b)){ respawnHit(); break; } }
    }
    for(let i=barrels.length-1;i>=0;i--) if(barrels[i].y>H+40) barrels.splice(i,1);
  }
  function updateCollectibles(){
    for(const t of world.treats){
      if(t.got) continue;
      const box = {x:t.x-7,y:t.y-7,w:14,h:14};
      for(const p of heroes){ if(rects(p,box)){ t.got=true; p.score+=1; break; } }
    }
    const allGot = world.treats.every(t=>t.got);
    const gate = world.gate;
    if(allGot && heroes.some(p=>rects(p, gate))) won = true;
  }
  function drawPixelMan(p,isActive){
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(p.x+3,p.y+p.h, p.w, 3);
    ctx.fillStyle=p.color; ctx.fillRect(p.x+3,p.y+8,p.w-6,p.h-8);
    ctx.fillStyle='#ffe0bd'; ctx.fillRect(p.x+5,p.y+1,p.w-10,10);
    ctx.fillStyle=p.hat; ctx.fillRect(p.x+3,p.y,p.w-6,4);
    ctx.fillStyle='#111'; ctx.fillRect(p.x+8,p.y+5,3,3); ctx.fillRect(p.x+p.w-10,p.y+5,3,3);
    ctx.fillStyle='#203040'; ctx.fillRect(p.x+4,p.y+p.h-6,6,6); ctx.fillRect(p.x+p.w-10,p.y+p.h-6,6,6);
    if(isActive){ ctx.strokeStyle='#fff200'; ctx.lineWidth=2; ctx.strokeRect(p.x-3,p.y-4,p.w+6,p.h+7); }
  }
  function draw(){
    ctx.fillStyle='#79c8ff'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#b9ecff'; for(let i=0;i<7;i++){ ctx.fillRect((i*130+tick*.15)%W,30+i*20,44,8); }
    ctx.fillStyle='#263238'; ctx.fillRect(0,388,W,32);
    ctx.fillStyle='#7b3f00'; for(const l of world.ladders){ ctx.fillRect(l.x,l.y,l.w,l.h); ctx.fillStyle='#f6c46b'; for(let y=l.y+8;y<l.y+l.h;y+=18) ctx.fillRect(l.x+3,y,l.w-6,4); ctx.fillStyle='#7b3f00'; ctx.fillRect(l.x+4,l.y,5,l.h); ctx.fillRect(l.x+l.w-9,l.y,5,l.h); }
    for(const p of world.platforms){ ctx.fillStyle='#6b3b1f'; ctx.fillRect(p.x,p.y,p.w,p.h); ctx.fillStyle='#c87938'; ctx.fillRect(p.x,p.y,p.w,4); }
    for(const c of world.cracked.filter(c=>c.alive)){ ctx.fillStyle='#8b5a2b'; ctx.fillRect(c.x,c.y,c.w,c.h); ctx.strokeStyle='#1b0b00'; ctx.beginPath(); ctx.moveTo(c.x+6,c.y+2); ctx.lineTo(c.x+18,c.y+13); ctx.lineTo(c.x+27,c.y+4); ctx.stroke(); }
    for(const t of world.treats){ if(t.got) continue; ctx.fillStyle='#fff176'; ctx.fillRect(t.x-5,t.y-5,10,10); ctx.fillStyle='#ff8f00'; ctx.fillRect(t.x-2,t.y-2,4,4); }
    const g=world.gate; ctx.fillStyle=world.treats.every(t=>t.got)?'#39ff14':'#555'; ctx.fillRect(g.x,g.y,g.w,g.h); ctx.fillStyle='#000'; ctx.fillRect(g.x+8,g.y+12,g.w-16,g.h-12);
    for(const b of barrels){ ctx.fillStyle='#8d3b12'; ctx.fillRect(b.x,b.y,b.w,b.h); ctx.fillStyle='#f97316'; ctx.fillRect(b.x+2,b.y+5,b.w-4,3); ctx.fillRect(b.x+2,b.y+11,b.w-4,3); }
    heroes.forEach((p,i)=>drawPixelMan(p,i===active));
    if(won || lost){ ctx.fillStyle='rgba(0,0,0,.72)'; ctx.fillRect(92,142,536,118); ctx.fillStyle=won?'#39ff14':'#ff5c5c'; ctx.font='bold 28px Courier New'; ctx.textAlign='center'; ctx.fillText(won?'LEVEL CLEAR!':'GAME OVER', W/2, 190); ctx.fillStyle='#fff'; ctx.font='bold 15px Courier New'; ctx.fillText('Press R to restart', W/2, 222); ctx.textAlign='left'; }
  }
  function loop(){
    tick++;
    if(!won && !lost){ updatePlayer(heroes[active], true); updatePlayer(heroes[1-active], false); updateBarrels(); updateCollectibles(); }
    draw();
    const total = heroes[0].score + heroes[1].score;
    if(hud) {
      const gateOpen = world.treats.every(t=>t.got);
      hud.textContent = isMobileMode()
        ? `${heroes[active].name} | treats ${total}/${world.treats.length} | lives ${lives} | ${gateOpen ? 'Gate open!' : 'Get treats → gate'}`
        : `${heroes[active].name} active | treats ${total}/${world.treats.length} | lives ${lives} | ${gateOpen ? 'Gate open: reach the green door!' : 'Collect all treats to open the gate.'}`;
    }
    requestAnimationFrame(loop);
  }
  const isGameOpen = () => document.getElementById('otisGameWindow')?.classList.contains('open');
  const pressGameKey = (code) => {
    if(!isGameOpen()) return;
    keys.add(code);
    if(code === 'Space' || code === 'ArrowUp') setTimeout(() => keys.delete(code), 170);
  };
  const releaseGameKey = (code) => keys.delete(code);
  window.addEventListener('keydown', (e)=>{
    if(!isGameOpen()) return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Tab'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if(!e.repeat && (e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='Tab')) active = 1-active;
    if(e.code==='KeyR') reset();
  });
  window.addEventListener('keyup', (e)=> keys.delete(e.code));
  document.querySelectorAll('[data-game-key],[data-game-action]').forEach((btn) => {
    const key = btn.getAttribute('data-game-key');
    const action = btn.getAttribute('data-game-action');
    const down = (e) => {
      if(!isGameOpen()) return;
      e.preventDefault();
      btn.classList.add('is-pressed');
      if(key) pressGameKey(key);
      if(action === 'swap') active = 1-active;
      if(action === 'restart') reset();
    };
    const up = (e) => {
      if(e) e.preventDefault();
      btn.classList.remove('is-pressed');
      if(key) releaseGameKey(key);
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('contextmenu', (e)=>e.preventDefault());
  });
  reset(); loop();
}

async function boot(){
  loadPrefs();
  applyPrefs();
  await runBootScreen();

  const appFrame = document.getElementById('appFrame');
  if(appFrame){
    appFrame.addEventListener('load', ()=>{
      try{
        const u = new URL(appFrame.src, location.href);
        const p = (u.pathname||'').toLowerCase();
        if(p.endsWith('/index.html') || p === '/' || p === '/index'){
          closeWindow('browserWindow');
          showToast('Back to MichaelOS hub');
        }
      }catch{}
    });
  }
  const res = await fetch('./apps.json');
  const data = await res.json();

  const nameEl = document.getElementById('name');
  const headlineEl = document.getElementById('headline');
  const summaryEl = document.getElementById('summary');
  if(nameEl) nameEl.textContent = data.owner || 'Michael Costea';
  if(headlineEl) headlineEl.textContent = data.bio?.headline || '';
  if(summaryEl) summaryEl.textContent = data.bio?.summary || '';

  const allProjects = data.projects || [];
  const projects = allProjects.filter(p => p.released === true);
  const statApps = document.getElementById('statApps');
  if (statApps) statApps.textContent = String(projects.length || 0);

  const apps = document.getElementById('apps');
  const grouped = {
    webapps: projects.filter(p => (p.category||'webapps') === 'webapps'),
    games: projects.filter(p => p.category === 'games')
  };
  const categoryTitle = { webapps: 'Web Apps', games: 'Games' };

  if(apps && !projects.length){
    apps.innerHTML = '<div class="release-hold"><b>Applications hidden until release.</b><br />Public demos are being rebuilt to match MICHAEL OS 89 before they return.</div>';
    apps.hidden = false;
  }

  Object.entries(grouped).forEach(([cat,list]) => {
    if(!apps || !list.length) return;
    const head = document.createElement('h3');
    head.className = 'programs-group-title';
    head.textContent = categoryTitle[cat] || cat;
    apps.appendChild(head);

    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      const badgeText = p.status === 'live' ? 'Production' : (p.status === 'beta' ? 'Beta' : 'Private');
      const primaryTag = p.primary ? '<span class="badge beta" style="margin-left:6px">Primary</span>' : '';
      card.innerHTML = `
        <div class="row"><h3>${p.name}</h3><span><span class="badge ${p.status}">${badgeText}</span>${primaryTag}</span></div>
        <p class="desc">${p.description || ''}</p>
        <div class="row"><small class="muted">${p.slug || 'project'}</small><a class="btn" href="#" data-launch-inline="${p.url}" data-app-title="${p.name}">Open</a></div>
      `;
      apps.appendChild(card);
    });
  });

  if(apps) apps.querySelectorAll('[data-launch-inline]').forEach(a => {
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      launchInMikeNet(a.getAttribute('data-launch-inline'), a.getAttribute('data-app-title') || 'Program');
    });
  });

  initStartMenu(projects);
  initDesktopWindows();
  initTray();
  initEasterEggs();
  initLoreEggs();
  initSettingsPanel();
  initGuideTabs();
  initOtisGame();
  initQuirkyStartActions();

  document.addEventListener('click', (e)=>{
    if(e.target.closest('.btn,.start-item,.desk-icon,.task-btn,.win-btn,.win-close')) uiBeep('tap');
  }, {passive:true});

  applyLayoutMode();

  if (isMobileMode() && prefs.singleMobile) {
    document.querySelectorAll('.win-window').forEach(w => w.classList.remove('open'));
    document.getElementById('readerWindow')?.classList.add('open');
  }

  document.querySelectorAll('.win-window.open').forEach(centerWindow);
  refreshTaskbar();
  bringFront(document.getElementById('readerWindow'));

  if (isMobileMode()) {
    const rw = document.getElementById('readerWindow');
    if (rw) {
      rw.classList.add('open');
      rw.style.left = '';
      rw.style.right = '';
      rw.style.top = '';
      rw.style.width = '';
      rw.style.height = '';
    }
  }

  window.addEventListener('resize', () => {
    const wasMobile = document.body.classList.contains('mobile-mode');
    applyLayoutMode();
    const nowMobile = isMobileMode();

    if (!wasMobile && nowMobile) {
      document.querySelectorAll('.win-window').forEach(w => w.classList.remove('open'));
      document.getElementById('readerWindow')?.classList.add('open');
      centerWindow(document.getElementById('readerWindow'));
    }

    document.querySelectorAll('.win-window.open').forEach(clampWindowToViewport);
    syncImmersiveMode();
  });
}
boot();
