const pageWindowRoutes = {
  readerWindow: 'home',
  aboutWindow: 'about',
  resourcesWindow: 'resources',
  resumeWindow: 'resume',
  buildWindow: 'what-i-build',
  projectsWindow: 'projects',
  agentsWindow: 'ai-agents',
  newRepoWindow: 'new-repo',
  vicRebateApiWindow: 'vic-rebate-api',
  brief2shipExplainerWindow: 'brief2ship-explainer',
  aiHelpWindow: 'ai-help',
  agenticFrameworkDeckWindow: 'agentic-framework-session',
  agenticKnowledgebaseWindow: 'agentic-knowledgebase',
  intakeWindow: 'ai-intake',
  contactWindow: 'contact',
};
const routeAliases = {
  '': 'home',
  home: 'home',
  about: 'about',
  resources: 'resources',
  tools: 'resources',
  products: 'resources',
  resume: 'resume',
  build: 'what-i-build',
  'what-i-build': 'what-i-build',
  projects: 'projects',
  'ai-agents': 'ai-agents',
  agents: 'ai-agents',
  'new-repo': 'new-repo',
  newrepo: 'new-repo',
  repo: 'new-repo',
  repro: 'new-repo',
  'vic-rebate-api': 'vic-rebate-api',
  'rebate-api': 'vic-rebate-api',
  rebatesignal: 'vic-rebate-api',
  'rebate-signal': 'vic-rebate-api',
  vicrebateapi: 'vic-rebate-api',
  veecapi: 'vic-rebate-api',
  'brief2ship-explainer': 'brief2ship-explainer',
  brief2ship: 'brief2ship-explainer',
  'brief2ship-context': 'brief2ship-explainer',
  'ai-help': 'ai-help',
  aihelp: 'ai-help',
  'agentic-framework-session': 'agentic-framework-session',
  agenticframework: 'agentic-framework-session',
  'agentic-deck': 'agentic-framework-session',
  'hermes-deck': 'agentic-framework-session',
  'agentic-knowledgebase': 'agentic-knowledgebase',
  knowledgebase: 'agentic-knowledgebase',
  'ai-knowledgebase': 'agentic-knowledgebase',
  'ai-intake': 'ai-intake',
  intake: 'ai-intake',
  aiintake: 'ai-intake',
  contact: 'contact',
};
const routeWindowLookup = Object.fromEntries(Object.entries(pageWindowRoutes).map(([id, route]) => [route, id]));
let syncingPageRoute = false;
let pageRoutesReady = false;
let zTop = 20;
const prefsKey = "michaelos_prefs_v1";
const iconSprite = 'assets/icons/michaelos-sprite.svg';
const maximizeGeometryProperties = ['position','left','top','right','bottom','width','height','max-width','max-height','transform','margin'];
let prefs = { animations:true, singleMobile:true, theme:"default", bootSpeed:1250, premiumUI:true, uiSound:false };
const windowFocusReturn = new Map();

function osIcon(name, className=''){
  return `<svg class="os-icon ${className}" aria-hidden="true"><use href="${iconSprite}#icon-${name}"></use></svg>`;
}

function motionAllowed(){
  return !!(prefs.animations && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.body.classList.contains('no-anim'));
}

function validMotionRect(rect){
  return !!(rect && Number.isFinite(rect.left) && Number.isFinite(rect.top) && rect.width > 0 && rect.height > 0);
}

function animateWindowOutline(fromRect, toRect, duration=170){
  if(!motionAllowed() || !validMotionRect(fromRect) || !validMotionRect(toRect) || !document.body.animate) return Promise.resolve();
  const outline = document.createElement('div');
  outline.className = 'os-motion-outline';
  document.body.appendChild(outline);
  const keyframe = (rect, opacity=1) => ({
    left:`${Math.round(rect.left)}px`,
    top:`${Math.round(rect.top)}px`,
    width:`${Math.max(2,Math.round(rect.width))}px`,
    height:`${Math.max(2,Math.round(rect.height))}px`,
    opacity,
  });
  const animation = outline.animate([
    keyframe(fromRect,.72),
    keyframe(toRect,1),
  ], { duration, easing:'steps(5,end)', fill:'forwards' });
  return animation.finished.catch(()=>{}).finally(()=>outline.remove());
}

function rectOf(element){
  return element?.getBoundingClientRect?.() || null;
}

function statusForWindow(win, verb='Opening'){
  const title = win?.querySelector('.win-title span')?.textContent?.replace(/^[^A-Za-z0-9]+/,'').trim() || 'window';
  return `${verb} ${title}…`;
}

function setSystemStatus(message='Ready. System status: Useful AI.', resetAfter=0){
  const status = document.getElementById('systemStatusText');
  if(!status) return;
  status.textContent = message;
  clearTimeout(setSystemStatus._timer);
  if(resetAfter > 0) setSystemStatus._timer = setTimeout(()=>{ status.textContent = 'Ready. System status: Useful AI.'; }, resetAfter);
}

function updateSoundToggle(){
  const button = document.getElementById('soundToggle');
  if(!button) return;
  const on = !!prefs.uiSound;
  button.setAttribute('aria-pressed', String(on));
  button.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  button.title = on ? 'Sound on' : 'Sound off';
  button.innerHTML = `${osIcon(on ? 'sound-on' : 'sound-off','tray-sound-icon')}<span class="sr-only">Sound ${on ? 'on' : 'off'}</span>`;
}

function updateMotionMenuLabel(){
  const label = document.querySelector('[data-motion-label]');
  if(label) label.textContent = `Motion effects: ${prefs.animations ? 'On' : 'Off'}`;
}

function hydrateDeferredMedia(container){
  if(!container) return;
  container.querySelectorAll('img[data-src]').forEach((image) => {
    if(!image.getAttribute('src')) image.setAttribute('src', image.dataset.src);
  });
  container.querySelectorAll('iframe[data-src]').forEach((frame) => {
    if(!frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.src);
  });
}

function syncActiveWindowAccessibility(activeWindow){
  const mobile = isMobileMode();
  const lockBackground = !!(mobile && activeWindow && activeWindow.id !== 'readerWindow' && activeWindow.classList.contains('open'));
  const desktopIcons = document.querySelector('.desktop-icons');
  if(desktopIcons) desktopIcons.toggleAttribute('inert', lockBackground);

  document.querySelectorAll('.win-window').forEach((win) => {
    const isActive = win === activeWindow && win.classList.contains('open');
    win.toggleAttribute('inert', lockBackground && !isActive);
    win.setAttribute('aria-hidden', String(!win.classList.contains('open')));
  });
}

function focusActiveWindow(win){
  if(!win) return;
  if(!win.hasAttribute('tabindex')) win.setAttribute('tabindex', '-1');
  requestAnimationFrame(() => {
    try { win.focus({ preventScroll: true }); } catch { win.focus(); }
  });
}

function initSkipLink(){
  const skipLink = document.querySelector('.skip-link');
  if(!skipLink) return;
  skipLink.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.getElementById(activePrimaryWindowId()) || document.getElementById('readerWindow');
    focusActiveWindow(target);
  });
}

function trackAnalyticsEvent(eventName, params = {}){
  if(typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

function trackVirtualPageView(route){
  const normalized = routeAliases[route] || 'home';
  trackAnalyticsEvent('page_view', {
    page_title: `${document.title} — ${normalized}`,
    page_location: window.location.href,
    page_path: normalized === 'home' ? window.location.pathname : `${window.location.pathname}#${normalized}`
  });
}

function initAnalyticsTracking(){
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if(!link) return;

    const href = link.getAttribute('href') || '';
    const linkText = (link.textContent || link.getAttribute('aria-label') || '').trim().slice(0, 100);

    if(href.startsWith('mailto:')){
      trackAnalyticsEvent('generate_lead', {
        method: 'email_link',
        link_text: linkText
      });
      return;
    }

    const url = new URL(href, window.location.href);
    const isDownload = link.hasAttribute('download') || /\.(?:pdf|pptx?|docx?|xlsx?|zip)(?:$|[?#])/i.test(url.pathname);
    if(isDownload){
      trackAnalyticsEvent('select_content', {
        content_type: 'download',
        item_id: url.pathname.split('/').pop() || url.pathname,
        link_url: url.href
      });
      return;
    }

    if(/^https?:$/i.test(url.protocol) && url.origin !== window.location.origin){
      trackAnalyticsEvent('outbound_click', {
        link_domain: url.hostname,
        link_text: linkText,
        link_url: url.href
      });
    }
  }, { passive: true });
}

async function runBootScreen({force=false}={}){
  const boot = document.getElementById('bootScreen');
  const bios = document.getElementById('biosScreen');
  const biosText = document.getElementById('biosText');
  const biosHint = document.getElementById('biosHint');
  const bootSkip = document.getElementById('bootSkip');
  if(!boot || !biosText){ document.body.classList.add('booted'); return; }

  if(!force){
    boot.classList.add('hidden');
    boot.setAttribute('aria-hidden','true');
    document.body.classList.add('booted');
    return;
  }

  const previousFocus = document.activeElement;
  boot.classList.remove('hidden','exiting');
  boot.setAttribute('aria-hidden','false');
  bios.style.display = '';
  biosText.textContent = '';
  if(biosHint) biosHint.textContent = 'Press any key or click to skip';
  document.body.classList.add('booting');

  let interrupted = false;
  const onInterrupt = (event) => {
    if(event?.type === 'keydown' && ['Tab','Shift','Control','Alt','Meta'].includes(event.key)) return;
    interrupted = true;
  };
  boot.addEventListener('pointerdown', onInterrupt);
  document.addEventListener('keydown', onInterrupt);

  const lines = [
    'MICHAEL OS 89 BIOS v1.0',
    'Memory Test ................. 32768K OK',
    'Operator profile ............ MICHAEL COSTEA',
    'AI enablement layer ......... READY',
    'Business systems ............ READY',
    'Human review gates .......... ENABLED',
    'Window manager .............. ONLINE',
    'Loading career evidence ..... OK',
    'Loading case studies ........ OK',
    'Boot from MICHAELOS ........ Success'
  ];

  const totalDuration = Math.min(1500,Math.max(700,Number(prefs.bootSpeed||1250)));
  const perLine = Math.max(60,Math.floor(totalDuration / lines.length));
  for(const line of lines){
    if(interrupted) break;
    biosText.textContent += line + '\n';
    await new Promise(resolve=>setTimeout(resolve,perLine));
  }

  if(!interrupted){
    if(biosHint) biosHint.textContent = 'MICHAEL OS ready';
    await new Promise(resolve=>setTimeout(resolve,100));
  }

  boot.classList.add('exiting');
  await new Promise(resolve=>setTimeout(resolve,220));
  boot.classList.add('hidden');
  boot.classList.remove('exiting');
  boot.setAttribute('aria-hidden','true');
  document.body.classList.remove('booting');
  document.body.classList.add('booted');
  boot.removeEventListener('pointerdown',onInterrupt);
  document.removeEventListener('keydown',onInterrupt);
  setSystemStatus('MICHAEL OS boot complete.',900);
  if(previousFocus?.isConnected) requestAnimationFrame(()=>previousFocus.focus());
}

function restartMichaelOS(){
  return runBootScreen({force:true});
}
window.restartMichaelOS = restartMichaelOS;

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
  syncActiveWindowAccessibility(win);
  refreshTaskbar();
  if(win.classList.contains('open')) syncPageRouteFromWindows();
}

function syncImmersiveMode(){
  const bw = document.getElementById('browserWindow');
  const immersive = !!(isMobileMode() && bw && bw.classList.contains('open') && bw.classList.contains('maximized') && !bw.classList.contains('minimized'));
  document.body.classList.toggle('immersive-app', immersive);
}

function cacheWindowDefaultStyles(){
  document.querySelectorAll('.win-window').forEach(win => {
    if (win.dataset.defaultStyle === undefined) {
      win.dataset.defaultStyle = win.getAttribute('style') || '';
    }
  });
}

function restoreWindowDefaultStyle(win){
  if(!win) return;
  const defaultStyle = win.dataset.defaultStyle;
  if (defaultStyle === undefined) return;
  if (defaultStyle.trim()) {
    win.setAttribute('style', defaultStyle);
  } else {
    win.removeAttribute('style');
  }
}

function restoreWindowScroll(win, reset=false){
  const body = win?.querySelector('.win-body');
  if(!body) return;
  body.style.pointerEvents = '';
  body.style.overflow = '';
  body.style.overflowY = '';
  body.style.touchAction = '';
  if(reset){
    body.scrollTop = 0;
    requestAnimationFrame(() => { body.scrollTop = 0; });
  }
}

function normalizePageRoute(hash = window.location.hash){
  const raw = String(hash || '').replace(/^#/, '').trim().toLowerCase();
  return routeAliases[raw] || 'home';
}

function activePrimaryWindowId(){
  const openWindows = Array.from(document.querySelectorAll('.win-window.open'));
  if(!openWindows.length) return 'readerWindow';
  const ranked = openWindows
    .filter((win) => pageWindowRoutes[win.id])
    .sort((a, b) => (Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0)));
  return ranked[0]?.id || 'readerWindow';
}

function updatePageRoute(route){
  const normalized = routeAliases[route] || 'home';
  const nextHash = normalized === 'home' ? '' : `#${normalized}`;
  if(window.location.hash === nextHash) return;
  syncingPageRoute = true;
  if(nextHash){
    window.location.hash = nextHash;
  }else if(window.history?.replaceState){
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }else{
    window.location.hash = '';
  }
  trackVirtualPageView(normalized);
  setTimeout(() => { syncingPageRoute = false; }, 0);
}

function syncPageRouteFromWindows(){
  if(!pageRoutesReady) return;
  const activeId = activePrimaryWindowId();
  updatePageRoute(pageWindowRoutes[activeId] || 'home');
}

function applyPageRouteFromLocation(){
  const route = normalizePageRoute();
  const targetId = routeWindowLookup[route] || 'readerWindow';
  if(targetId === 'readerWindow'){
    openWindow('readerWindow');
    return;
  }
  openWindow(targetId);
}

function openWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  const wasOpen = win.classList.contains('open');
  const opener = document.activeElement;
  const openerRect = rectOf(opener);
  if(opener && !['BODY', 'HTML'].includes(opener.tagName) && !win.contains(opener)) windowFocusReturn.set(id, opener);

  if (isMobileMode()) {
    document.querySelectorAll('.win-window.open').forEach(w => {
      if (w.id !== id) w.classList.remove('open');
    });
  }

  hydrateDeferredMedia(win);
  win.classList.remove('minimized');
  win.classList.add('open');
  restoreWindowScroll(win, !wasOpen);
  if(!wasOpen && !win.classList.contains('maximized') && win.dataset.userMoved !== '1' && win.dataset.userSized !== '1') centerWindow(win);
  bringFront(win);
  syncActiveWindowAccessibility(win);
  focusActiveWindow(win);
  syncImmersiveMode();
  if(!wasOpen){
    animateWindowOutline(openerRect,rectOf(win));
    setSystemStatus(statusForWindow(win),650);
    uiBeep('open');
  }
}

function closeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  const fromRect = rectOf(win);
  const focusReturn = windowFocusReturn.get(id);
  const fallbackTarget = document.querySelector(`[data-focus="${id}"]`) || document.getElementById('startBtn');
  const targetRect = rectOf(focusReturn) || rectOf(fallbackTarget);
  windowFocusReturn.delete(id);

  if(id === 'browserWindow'){
    const frame = document.getElementById('appFrame');
    try{ frame?.contentWindow?.postMessage({type:'mikenet-close'}, '*'); }catch{}
    setTimeout(()=>{ if(frame) frame.src = 'about:blank'; }, 20);
  }
  if(id === 'caseStudyWindow'){
    const frame = document.getElementById('caseStudyFrame');
    setTimeout(()=>{ if(frame) frame.removeAttribute('src'); }, 180);
  }

  win.classList.remove('open','minimized','maximized','active');
  win.setAttribute('aria-hidden', 'true');
  restoreWindowDefaultStyle(win);
  delete win.dataset.restoreInlineStyle;
  delete win.dataset.prevLeft;
  delete win.dataset.prevTop;
  delete win.dataset.prevWidth;
  delete win.dataset.prevHeight;
  delete win.dataset.prevRight;
  delete win.dataset.prevBottom;

  const hasOpenWindow = !!document.querySelector('.win-window.open');
  let nextWindow = hasOpenWindow ? document.getElementById(activePrimaryWindowId()) : null;
  if(isMobileMode() && !hasOpenWindow && id !== 'readerWindow'){
    openWindow('readerWindow');
    nextWindow = document.getElementById('readerWindow');
  }
  syncActiveWindowAccessibility(nextWindow);
  syncImmersiveMode();
  refreshTaskbar();
  syncPageRouteFromWindows();
  animateWindowOutline(fromRect,targetRect,150);
  setSystemStatus(statusForWindow(win,'Closed'),550);
  uiBeep('close');
  if(focusReturn?.isConnected){
    requestAnimationFrame(() => focusReturn.focus());
  }else if(isMobileMode() && !nextWindow){
    const desktopTarget = document.querySelector('.desktop-icons .desk-icon:not([disabled])');
    requestAnimationFrame(() => desktopTarget?.focus());
  }
}

function minimizeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  const fromRect = rectOf(win);
  win.classList.remove('open','active');
  win.classList.add('minimized');
  syncImmersiveMode();
  refreshTaskbar();
  const taskButton = document.querySelector(`.task-btn[data-focus="${id}"]`);
  animateWindowOutline(fromRect,rectOf(taskButton),150);
  setSystemStatus(statusForWindow(win,'Minimized'),550);
  uiBeep('minimize');
  syncPageRouteFromWindows();
}

function toggleMaximizeWindow(id){
  const win = document.getElementById(id);
  if(!win) return;
  updateTaskbarMetrics();
  const fromRect = rectOf(win);
  const restoring = win.classList.contains('maximized');
  if(restoring){
    const restoreStyle = win.dataset.restoreInlineStyle;
    if(restoreStyle?.trim()) win.setAttribute('style',restoreStyle);
    else win.removeAttribute('style');
    delete win.dataset.restoreInlineStyle;
    win.classList.remove('maximized');
  }else{
    win.dataset.restoreInlineStyle = win.getAttribute('style') || '';
    maximizeGeometryProperties.forEach(property=>win.style.removeProperty(property));
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
  updateTaskbarMetrics();
  animateWindowOutline(fromRect,rectOf(win),150);
  setSystemStatus(statusForWindow(win,isMax ? 'Maximized' : 'Restored'),550);
  uiBeep(isMax ? 'maximize' : 'restore');
}


function launchInMikeNet(url, title='Program'){
  // Immersive experiences should take over the full site, not run in iframe windows.
  if((url||'').includes('do-not-touch.html') || (url||'').includes('do-not-touch-3d/index.html')){
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

function initCaseStudyLaunches(){
  document.querySelectorAll('#projectsWindow .featured-hiring-case a.ui-btn[href]').forEach((link)=>{
    if(link.dataset.caseWindowReady === '1') return;
    link.dataset.caseWindowReady = '1';
    link.dataset.caseWindow = '1';
    link.addEventListener('click',(event)=>{
      if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute('href');
      if(!href) return;
      event.preventDefault();
      const title = link.closest('.featured-hiring-case')?.querySelector('h3')?.textContent?.trim() || 'Case study';
      const frame = document.getElementById('caseStudyFrame');
      const frameTitle = document.getElementById('caseStudyTitle');
      if(!frame || !frameTitle) return;
      frame.src = href;
      frameTitle.textContent = `Case Study - ${title}`;
      frame.title = `${title} case study`;
      openWindow('caseStudyWindow');
      setSystemStatus(`Opening case: ${title}…`,750);
    });
  });
}

function initDesktopWindows(){
  cacheWindowDefaultStyles();
  const launchDesktopIcon = (btn) => {
    const id = btn.getAttribute('data-open');
    const appUrl = btn.getAttribute('data-app');
    const textFile = btn.getAttribute('data-text-file');
    const appTitle = btn.getAttribute('data-title') || 'Program';
    if(textFile){
      launchInMikeNet(`./apps/text.html?file=${encodeURIComponent(textFile)}`, appTitle);
      return;
    }
    if(appUrl){
      launchInMikeNet(appUrl, appTitle);
      return;
    }
    if(id) openWindow(id);
  };

  document.querySelectorAll('.desk-icon').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const desktopPointer = !isMobileMode() && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if(desktopPointer && event.detail > 0){
        document.querySelectorAll('.desk-icon.os-selected').forEach(icon=>icon.classList.remove('os-selected'));
        btn.classList.add('os-selected');
        setSystemStatus(`${btn.textContent.trim()} selected. Double-click to open.`,1200);
        uiBeep('tap');
        return;
      }
      launchDesktopIcon(btn);
    });
    btn.addEventListener('dblclick', (event) => {
      event.preventDefault();
      launchDesktopIcon(btn);
    });
  });
  document.addEventListener('pointerdown', (event)=>{
    if(!event.target.closest('.desk-icon')) document.querySelectorAll('.desk-icon.os-selected').forEach(icon=>icon.classList.remove('os-selected'));
  }, {passive:true});

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
    if(!win.querySelector('.win-resize-grip')){
      const grip = document.createElement('span');
      grip.className = 'win-resize-grip';
      grip.setAttribute('aria-hidden','true');
      win.appendChild(grip);
    }
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
  initResizeWindows();
}

function setImportantStyle(el, prop, value){
  if(!el) return;
  el.style.setProperty(prop, value, 'important');
}

function unlockWindowForManualLayout(win){
  if(!win || isMobileMode()) return;
  const rect = win.getBoundingClientRect();
  setImportantStyle(win, 'left', `${Math.round(rect.left)}px`);
  setImportantStyle(win, 'top', `${Math.round(rect.top)}px`);
  setImportantStyle(win, 'right', 'auto');
  setImportantStyle(win, 'bottom', 'auto');
  setImportantStyle(win, 'transform', 'none');
  setImportantStyle(win, 'max-width', 'none');
}

function initDrag(){
  document.querySelectorAll('.win-window').forEach(win => {
    const bar = win.querySelector('.win-title');
    if(!bar) return;
    let dragging=false, ox=0, oy=0, pid=null;

    const onMove = (clientX, clientY) => {
      if(!dragging) return;
      const rect = win.getBoundingClientRect();
      const taskbarH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-h')) || 46;
      const minX = Math.min(8, window.innerWidth - rect.width - 80);
      const maxX = Math.max(8, window.innerWidth - 80);
      const minY = 0;
      const maxY = Math.max(0, window.innerHeight - taskbarH - 28);
      const left = Math.min(Math.max(minX, clientX - ox), maxX);
      const top = Math.min(Math.max(minY, clientY - oy), maxY);
      setImportantStyle(win, 'left', `${left}px`);
      setImportantStyle(win, 'top', `${top}px`);
      setImportantStyle(win, 'right', 'auto');
      setImportantStyle(win, 'bottom', 'auto');
      setImportantStyle(win, 'transform', 'none');
      win.dataset.userMoved = '1';
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
      unlockWindowForManualLayout(win);
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

function initResizeWindows(){
  document.querySelectorAll('.win-window').forEach(win => {
    const grip = win.querySelector('.win-resize-grip');
    if(!grip || grip.dataset.resizeReady === '1') return;
    grip.dataset.resizeReady = '1';
    let resizing=false, startX=0, startY=0, startW=0, startH=0, pid=null;

    const stopResize = () => {
      resizing=false;
      document.body.style.userSelect='';
      if(pid!==null){ try{ grip.releasePointerCapture(pid); }catch{} }
      pid=null;
    };

    grip.addEventListener('pointerdown', (e) => {
      if(isMobileMode() || win.classList.contains('maximized')) return;
      if(e.button !== undefined && e.button !== 0) return;
      const rect = win.getBoundingClientRect();
      unlockWindowForManualLayout(win);
      const unlockedRect = win.getBoundingClientRect();
      resizing=true;
      startX=e.clientX;
      startY=e.clientY;
      startW=unlockedRect.width;
      startH=unlockedRect.height;
      bringFront(win);
      win.classList.add('user-sized');
      win.dataset.userSized = '1';
      document.body.style.userSelect='none';
      pid=e.pointerId;
      try{ grip.setPointerCapture(pid); }catch{}
      e.preventDefault();
    });

    grip.addEventListener('pointermove', (e) => {
      if(!resizing) return;
      const rect = win.getBoundingClientRect();
      const taskbarH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-h')) || 46;
      const minW = Math.min(320, Math.max(260, window.innerWidth - 24));
      const minH = 220;
      const maxW = Math.max(minW, window.innerWidth - rect.left - 8);
      const maxH = Math.max(minH, window.innerHeight - taskbarH - rect.top - 8);
      const nextW = Math.min(Math.max(minW, startW + (e.clientX - startX)), maxW);
      const nextH = Math.min(Math.max(minH, startH + (e.clientY - startY)), maxH);
      setImportantStyle(win, 'width', `${Math.round(nextW)}px`);
      setImportantStyle(win, 'height', `${Math.round(nextH)}px`);
      setImportantStyle(win, 'max-width', 'none');
      setImportantStyle(win, 'right', 'auto');
      setImportantStyle(win, 'bottom', 'auto');
    });

    grip.addEventListener('pointerup', stopResize);
    grip.addEventListener('pointercancel', stopResize);
  });
}

function initTray(){
  const clockEl = document.getElementById('trayClock');
  const dateEl = document.getElementById('trayDate');
  const battEl = document.getElementById('trayBattery');
  const soundToggle = document.getElementById('soundToggle');
  const updateClock = () => {
    const now = new Date();
    if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  updateClock();
  setInterval(updateClock, 1000);
  updateSoundToggle();
  soundToggle?.addEventListener('click', (event)=>{
    event.stopPropagation();
    prefs.uiSound = !prefs.uiSound;
    savePrefs();
    updateSoundToggle();
    setSystemStatus(`Sound ${prefs.uiSound ? 'on' : 'off'}.`,750);
    if(prefs.uiSound) uiBeep('tap');
  });

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
      const buttonRect = rectOf(btn);
      if(win.classList.contains('minimized')){
        win.classList.remove('minimized');
        win.classList.add('open');
        bringFront(win);
        animateWindowOutline(buttonRect,rectOf(win),150);
        setSystemStatus(statusForWindow(win,'Restored'),550);
        uiBeep('restore');
      } else if(win.classList.contains('active') && win.classList.contains('open')){
        minimizeWindow(id);
      } else {
        win.classList.add('open');
        win.classList.remove('minimized');
        bringFront(win);
        setSystemStatus(statusForWindow(win,'Focused'),450);
        uiBeep('tap');
      }
      refreshTaskbar();
    });
  });
}

function initProjectArchiveMotion(){
  document.querySelectorAll('.project-archive-shell').forEach((details)=>{
    if(details.dataset.motionReady === '1') return;
    details.dataset.motionReady = '1';
    const summary = details.querySelector(':scope > summary');
    const content = details.querySelector(':scope > .project-archive-content');
    if(!summary || !content) return;
    details.addEventListener('toggle',()=>{
      if(!details.open) return;
      setSystemStatus('Loading project archive…',700);
      uiBeep('tap');
      if(!motionAllowed() || !content.animate) return;
      content.animate([
        { clipPath:'inset(0 0 100% 0)', opacity:.55 },
        { clipPath:'inset(0 0 0 0)', opacity:1 },
      ], { duration:200, easing:'steps(6,end)' });
    });
    summary.addEventListener('click',(event)=>{
      if(!details.open || !motionAllowed() || !content.animate) return;
      event.preventDefault();
      if(details.dataset.closing === '1') return;
      details.dataset.closing = '1';
      const animation = content.animate([
        { clipPath:'inset(0 0 0 0)', opacity:1 },
        { clipPath:'inset(0 0 100% 0)', opacity:.5 },
      ], { duration:150, easing:'steps(5,end)' });
      animation.finished.catch(()=>{}).finally(()=>{
        details.open = false;
        delete details.dataset.closing;
        setSystemStatus('Project archive closed.',550);
      });
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
    <a class="start-item" role="menuitem" href="#" data-open-window="aboutWindow"><span>${osIcon('computer')}<b class="start-item-label">My Computer</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="resumeWindow"><span>${osIcon('document')}<b class="start-item-label">Resume</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="buildWindow"><span>${osIcon('puzzle')}<b class="start-item-label">What I Build</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="projectsWindow"><span>${osIcon('folder')}<b class="start-item-label">Projects</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="resourcesWindow"><span>${osIcon('toolbox')}<b class="start-item-label">Tools &amp; Resources</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="agentsWindow"><span>${osIcon('robot')}<b class="start-item-label">AI Agents</b></span></a>
    <a class="start-item start-cta" role="menuitem" href="#" data-open-window="aiHelpWindow"><span>${osIcon('education')}<b class="start-item-label">AI Help</b></span></a>
    <a class="start-item start-cta" role="menuitem" href="#" data-open-window="agenticKnowledgebaseWindow"><span>${osIcon('document')}<b class="start-item-label">AI Knowledgebase</b></span></a>
    <a class="start-item start-cta" role="menuitem" href="#" data-open-window="intakeWindow"><span>${osIcon('intake')}<b class="start-item-label">AI Intake</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="appsWindow"><span>${osIcon('folder')}<b class="start-item-label">Programs</b></span><small>hidden</small></a>
    <div class="start-sep"></div>
    <a class="start-item" role="menuitem" href="mailto:costea.michael@gmail.com"><span>${osIcon('mail')}<b class="start-item-label">Email</b></span></a>
    <a class="start-item" role="menuitem" href="https://www.linkedin.com/in/michaelcostea" target="_blank" rel="noopener"><span>${osIcon('link')}<b class="start-item-label">LinkedIn</b></span></a>
    <div class="start-sep"></div>
    <a class="start-item" role="menuitem" href="#" data-action="toggle-motion"><span>${osIcon('motion')}<b class="start-item-label" data-motion-label>Motion effects: ${prefs.animations ? 'On' : 'Off'}</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-action="restart-os"><span>${osIcon('restart')}<b class="start-item-label">Restart MICHAEL OS</b></span></a>
    <a class="start-item" role="menuitem" href="#" data-open-window="recycleWindow"><span>${osIcon('recycle')}<b class="start-item-label">Recycle Bin</b></span></a>
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

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = !menu.classList.contains('open');
    opening ? openMenu() : closeMenu();
    setSystemStatus(opening ? 'Start menu opened.' : 'Start menu closed.',450);
    uiBeep('menu');
  });
  document.addEventListener('click', (e) => { if(!menu.contains(e.target) && e.target !== btn) closeMenu(); });
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('.start-item');
    if(!link) return;
    const openId = link.getAttribute('data-open-window');
    const action = link.getAttribute('data-action');
    if(openId){ e.preventDefault(); openWindow(openId); closeMenu(); return; }
    if(action === 'toggle-motion'){
      e.preventDefault();
      prefs.animations = !prefs.animations;
      savePrefs();
      applyPrefs();
      updateMotionMenuLabel();
      setSystemStatus(`Motion effects ${prefs.animations ? 'on' : 'off'}.`,850);
      return;
    }
    if(action === 'restart-os'){
      e.preventDefault();
      closeMenu();
      setTimeout(()=>restartMichaelOS(),80);
      return;
    }
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
    root.querySelectorAll('[data-prereq-product][data-prereq-os]').forEach(panel => {
      const on = panel.getAttribute('data-prereq-product') === state.product && panel.getAttribute('data-prereq-os') === state.os;
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
  if(label.includes('minesweeper')) return 'minesweeper';
  if(label.includes('solitaire')) return 'solitaire';
  if(label.includes('sky slope') || label.includes('ski')) return 'skifree';
  return 'readme';
}

function themedIconDataUrl(theme,key){
  const appGlyphs = {
    readme:'📘', settings:'🛠️', planner:'🗓️', cards:'🪪', ozquotes:'💡', paint:'🎨', text:'📝', chat:'💬', programs:'🗂️', recycle:'🗑️', ifexe:'⚙️', doom:'👹', hackerexe:'👾', donottouch:'🐇', minesweeper:'💣', solitaire:'🃏', skifree:'⛷️'
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
  if(!navigator.userActivation?.hasBeenActive) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator();
    const g=audioCtx.createGain();
    o.type='square';
    const frequencies = { open:740, close:300, minimize:420, maximize:620, restore:660, menu:560, alert:260, tap:520 };
    o.frequency.setValueAtTime(frequencies[kind] || frequencies.tap,audioCtx.currentTime);
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
  document.body.classList.add('os-motion-ready');
  document.body.classList.toggle('no-anim', !prefs.animations);
  document.body.classList.toggle('premium-ui', !!prefs.premiumUI);
  setLoreTheme(prefs.theme || 'default');
  updateSoundToggle();
  updateMotionMenuLabel();
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
    skifree:'./apps/games/skifree.html'
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



function initClientIntakeForm(){
  const form = document.getElementById('aiIntakeForm');
  const sendBtn = document.querySelector('[data-intake-email]');
  if(!form || !sendBtn || form.dataset.intakeReady === '1') return;
  form.dataset.intakeReady = '1';

  const labels = {
    business: 'Business / name',
    contact: 'Best contact',
    website: 'Website / social',
    industry: 'Industry',
    keeps_up: 'What keeps you up at night?',
    magic_wand: 'What would you make easier tomorrow?',
    repeated_work: 'Repeated work',
    missed_opportunities: 'Missed opportunities',
    tools: 'Core tools used today',
    devices: 'Devices / operating systems',
    integration_wish: 'Systems that should talk to each other',
    safe_drafts: 'What an assistant could safely draft or prepare',
    boundaries: 'What AI should never do without approval',
    pilot_win: 'What would make a small pilot a clear win'
  };

  sendBtn.addEventListener('click', () => {
    const data = new FormData(form);
    const lines = ['AI & Automation Opportunity Intake', ''];
    Object.entries(labels).forEach(([key, label]) => {
      const value = String(data.get(key) || '').trim();
      if(value) lines.push(`${label}:\n${value}\n`);
    });
    lines.push('Privacy reminder: no passwords, API keys, private customer records, payment details, or sensitive employee information were requested.');
    const subjectBusiness = String(data.get('business') || '').trim();
    const subject = subjectBusiness ? `AI intake notes - ${subjectBusiness}` : 'AI intake notes';
    const body = encodeURIComponent(lines.join('\n'));
    trackAnalyticsEvent('generate_lead', {
      method: 'ai_intake_email',
      form_id: 'aiIntakeForm'
    });
    window.location.href = `mailto:costea.michael@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  });
}

async function initIntroDeckPreview(){
  const slide = document.getElementById('introDeckSlide');
  const counter = document.getElementById('introDeckCounter');
  const prev = document.querySelector('[data-intro-deck-prev]');
  const next = document.querySelector('[data-intro-deck-next]');
  if(!slide || !counter || !prev || !next) return;
  const total = 19;
  let current = 1;
  const update = () => {
    const num = String(current).padStart(2, '0');
    slide.src = `assets/decks/intro-to-ai/slide-${num}.png?v=20260506-hd1`;
    slide.alt = `Intro to AI slide ${current} of ${total}`;
    counter.textContent = `Slide ${current}/${total}`;
    prev.disabled = current === 1;
    next.disabled = current === total;
  };
  prev.addEventListener('click', () => { current = Math.max(1, current - 1); update(); });
  next.addEventListener('click', () => { current = Math.min(total, current + 1); update(); });
  document.querySelectorAll('[data-open="introDeckWindow"]').forEach((btn) => {
    btn.addEventListener('click', () => { current = 1; window.setTimeout(update, 0); });
  });
}

async function initAgenticFrameworkDeckPreview(){
  const slide = document.getElementById('agenticDeckSlide');
  const fullOverlay = document.getElementById('agenticDeckFullscreen');
  if(!slide) return;
  const update = () => {
    const src = 'assets/decks/hermes-agentic-framework-session/slide-01.png?v=20260701-presentation-preview-hd';
    slide.src = src;
    slide.alt = 'Agentic framework session presentation preview slide';
  };
  if(fullOverlay) fullOverlay.remove();
  document.querySelectorAll('[data-open="agenticFrameworkDeckWindow"]').forEach((btn) => {
    btn.addEventListener('click', () => { window.setTimeout(update, 0); });
  });
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
        <div class="row"><small class="muted">${p.slug || 'project'}</small><a class="btn ui-btn icon-terminal" href="#" data-launch-inline="${p.url}" data-app-title="${p.name}">Open</a></div>
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
  initCaseStudyLaunches();
  initProjectArchiveMotion();
  initSkipLink();
  initTray();
  initEasterEggs();
  initLoreEggs();
  initSettingsPanel();
  initGuideTabs();
  initIntroDeckPreview();
  initAgenticFrameworkDeckPreview();
  initClientIntakeForm();
  initQuirkyStartActions();
  initAnalyticsTracking();

  document.addEventListener('click', (e)=>{
    const genericControl = e.target.closest('.btn,.start-item');
    if(!genericControl) return;
    if(genericControl.matches('[data-open],[data-open-window],[data-action],[data-case-window]')) return;
    uiBeep('tap');
  }, {passive:true});

  applyLayoutMode();

  if (isMobileMode() && prefs.singleMobile) {
    document.querySelectorAll('.win-window').forEach(w => w.classList.remove('open'));
    document.getElementById('readerWindow')?.classList.add('open');
  }

  document.querySelectorAll('.win-window.open').forEach(centerWindow);
  refreshTaskbar();
  bringFront(document.getElementById('readerWindow'));
  pageRoutesReady = true;
  window.addEventListener('hashchange', () => {
    if(syncingPageRoute) return;
    applyPageRouteFromLocation();
  });
  applyPageRouteFromLocation();

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
