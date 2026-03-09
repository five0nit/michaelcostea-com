let zTop = 20;
const prefsKey = "michaelos_prefs_v1";
let prefs = { animations:true, singleMobile:true, theme:"default", bootSpeed:3450 };

async function runBootScreen(){
  const boot = document.getElementById('bootScreen');
  const biosText = document.getElementById('biosText');
  const biosHint = document.getElementById('biosHint');
  const bsod = document.getElementById('bsodScreen');
  const bsodCountdown = document.getElementById('bsodCountdown');
  if(!boot || !biosText) return;

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

function isMobileMode(){
  return window.matchMedia('(max-width: 820px)').matches;
}

function applyLayoutMode(){
  document.body.classList.toggle('mobile-mode', isMobileMode());
}

function clampWindowToViewport(win){
  const taskbarH = 38;
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
  const taskbarH = 38;
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

function openWindow(id){
  const win = document.getElementById(id);
  if(!win) return;

  if (isMobileMode() && prefs.singleMobile) {
    document.querySelectorAll('.win-window.open').forEach(w => {
      if (w.id !== id) w.classList.remove('open');
    });
  }

  win.classList.add('open');
  centerWindow(win);
  bringFront(win);
}

function closeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;

  if(id === 'browserWindow'){
    const frame = document.getElementById('appFrame');
    try{ frame?.contentWindow?.postMessage({type:'mikenet-close'}, '*'); }catch{}
    setTimeout(()=>{ if(frame) frame.src = 'about:blank'; }, 20);
  }

  win.classList.remove('open');
  refreshTaskbar();
}


function launchInMikeNet(url, title='Program'){
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

  document.querySelectorAll('.win-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close');
      if (id) closeWindow(id);
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
      if(e.target.closest('.win-close')) return;
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
  const windows = Array.from(document.querySelectorAll('.win-window.open'));
  wrap.innerHTML = windows.map(w => {
    const title = w.querySelector('.win-title span')?.textContent || w.id;
    const active = w.classList.contains('active') ? 'active' : '';
    return `<button class="task-btn ${active}" data-focus="${w.id}">${title}</button>`;
  }).join('');

  wrap.querySelectorAll('.task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-focus');
      const win = document.getElementById(id);
      if(!win) return;
      if(win.classList.contains('active')){
        win.classList.remove('open');
      } else {
        win.classList.add('open');
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

  const systemItems = `
    <a class="start-item" role="menuitem" href="#" data-open-window="readerWindow"><span>📘 Read Me</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="appsWindow"><span>🗂️ Programs</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="aboutWindow"><span>💾 About</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="aboutWindow" data-open-settings="1"><span>⚙️ Control Panel</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="dialupWindow"><span>📞 Dial-Up Networking</span><small>open</small></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="recycleWindow"><span>🗑️ Recycle Bin</span><small>open</small></a>
  `;
  const appItems = projects.map(p => `
    <a class="start-item" role="menuitem" href="#" data-launch-app="${p.url}" data-app-title="${p.name}">
      <span>${p.name}</span>
      <small>${p.status}</small>
    </a>
  `).join('');
  items.innerHTML = systemItems + appItems;

  const closeMenu = () => { menu.classList.remove('open'); btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); };
  const openMenu = () => { menu.classList.add('open'); btn.classList.add('open'); btn.setAttribute('aria-expanded','true'); menu.setAttribute('aria-hidden','false'); };

  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.contains('open') ? closeMenu() : openMenu(); });
  document.addEventListener('click', (e) => { if(!menu.contains(e.target) && e.target !== btn) closeMenu(); });

  menu.addEventListener('click', (e) => {
    const link = e.target.closest('.start-item');
    if(!link) return;
    const openId = link.getAttribute('data-open-window');
    const launchApp = link.getAttribute('data-launch-app');
    const openSettings = link.getAttribute('data-open-settings');
    if(openId){ e.preventDefault(); openWindow(openId); if(openSettings){ const d=document.querySelector('#aboutWindow details'); if(d) d.open=true; }}
    if(launchApp){
      e.preventDefault();
      launchInMikeNet(launchApp, link.getAttribute('data-app-title') || 'Program');
    }
    closeMenu();
  });

  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMenu(); });
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
  return 'readme';
}

function applyThemeIcons(theme){
  const themed = ['mario','spiderman'];
  document.querySelectorAll('.desk-icon').forEach(btn=>{
    btn.style.backgroundImage='';
    btn.style.backgroundSize='';
    btn.style.backgroundRepeat='';
    btn.style.backgroundPosition='';
  });
  if(!themed.includes(theme)) return;
  document.querySelectorAll('.desk-icon').forEach(btn=>{
    const key=themeIconKey(btn);
    btn.style.backgroundImage = `url('./assets/icons/${theme}/${key}.png')`;
    btn.style.backgroundSize = '32px 32px';
    btn.style.backgroundRepeat = 'no-repeat';
    btn.style.backgroundPosition = 'center 8px';
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
function applyPrefs(){
  document.body.classList.toggle('no-anim', !prefs.animations);
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
  if(theme){ theme.value = prefs.theme || 'default'; }
  if(applyBtn && theme){ applyBtn.addEventListener('click',()=>{ prefs.theme = theme.value; savePrefs(); applyPrefs(); showToast('Theme applied: '+theme.value); }); }
  if(bootSel){ bootSel.value = String(prefs.bootSpeed||3450); bootSel.addEventListener('change',()=>{ prefs.bootSpeed = Number(bootSel.value||3450); savePrefs(); showToast('Boot speed updated'); }); }
}

async function boot(){
  loadPrefs();
  applyPrefs();
  await runBootScreen();
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
    const badgeText = p.status === 'live' ? 'Production' : (p.status === 'beta' ? 'Beta' : 'Private');
    card.innerHTML = `
      <div class="row"><h3>${p.name}</h3><span class="badge ${p.status}">${badgeText}</span></div>
      <p class="desc">${p.description || ''}</p>
      <div class="row"><small class="muted">${p.slug || 'project'}</small><a class="btn" href="#" data-launch-inline="${p.url}" data-app-title="${p.name}">Open</a></div>
    `;
    apps.appendChild(card);
  });

  apps.querySelectorAll('[data-launch-inline]').forEach(a => {
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

  applyLayoutMode();

  if (isMobileMode() && prefs.singleMobile) {
    document.querySelectorAll('.win-window').forEach(w => w.classList.remove('open'));
    document.getElementById('readerWindow')?.classList.add('open');
  }

  document.querySelectorAll('.win-window.open').forEach(centerWindow);
  refreshTaskbar();
  bringFront(document.getElementById('readerWindow'));

  window.addEventListener('resize', () => {
    const wasMobile = document.body.classList.contains('mobile-mode');
    applyLayoutMode();
    const nowMobile = isMobileMode();

    if (!wasMobile && nowMobile && prefs.singleMobile) {
      document.querySelectorAll('.win-window').forEach(w => w.classList.remove('open'));
      document.getElementById('readerWindow')?.classList.add('open');
      centerWindow(document.getElementById('readerWindow'));
    }

    document.querySelectorAll('.win-window.open').forEach(clampWindowToViewport);
  });
}
boot();
