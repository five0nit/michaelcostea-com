(() => {
  'use strict';

  const canvas = document.getElementById('data-field');
  const context = canvas?.getContext('2d', { alpha: false });
  if (!canvas || !context) {
    document.body.dataset.animationError = 'canvas-unavailable';
    return;
  }

  const phaseItems = [...document.querySelectorAll('[data-phase]')];
  const phaseSummary = document.getElementById('phase-summary');
  const phaseIndex = document.getElementById('phase-index');
  const progressFill = document.getElementById('progress-fill');
  const outputTitle = document.getElementById('output-title');
  const outputCopy = document.getElementById('output-copy');
  const receiptValue = document.getElementById('receipt-value');
  const proofState = document.getElementById('proof-state');
  const controlState = document.getElementById('control-state');
  const systemState = document.getElementById('system-state');
  const statusMessage = document.getElementById('status-message');
  const cycleCount = document.getElementById('cycle-count');
  const nodeCount = document.getElementById('node-count');
  const pauseButton = document.getElementById('pause-button');
  const replayButton = document.getElementById('replay-button');
  const sourcesButton = document.getElementById('sources-button');
  const sourcesDialog = document.getElementById('sources-dialog');
  const taskbarClock = document.getElementById('taskbar-clock');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qaMode = new URLSearchParams(window.location.search).has('qa');

  const phaseDuration = qaMode ? 700 : 3200;
  const totalDuration = phaseDuration * 5;
  const colors = ['#36d9ff', '#12bfa7', '#79ed6f', '#ffe14a', '#f4efdf'];
  const phases = [
    {
      name: 'BOOT',
      summary: 'Load the real business problem. Ignore the theatre.',
      title: 'BUSINESS SIGNAL ACQUIRED',
      copy: 'The sequence starts with the bottleneck, not the model.',
      receipt: 'OPEN',
      proof: 'PENDING',
      status: 'BOOT SEQUENCE ACTIVE',
      system: 'SIGNAL ACQUIRED',
    },
    {
      name: 'MAP',
      summary: 'Expose systems, constraints, risk, and who keeps control.',
      title: 'CONSTRAINT MAP LOCKED',
      copy: 'Architecture begins where responsibility and evidence meet.',
      receipt: 'SCOPED',
      proof: 'MAPPED',
      status: 'SYSTEM MAP ASSEMBLING',
      system: 'TOPOLOGY MAPPED',
    },
    {
      name: 'ORCHESTRATE',
      summary: 'Route bounded work through agents, tools, and human gates.',
      title: 'AGENT SWARM GOVERNED',
      copy: 'Autonomy expands only inside explicit control boundaries.',
      receipt: 'RUNNING',
      proof: 'TRACING',
      status: 'ORCHESTRATION ONLINE',
      system: 'SWARM GOVERNED',
    },
    {
      name: 'PROVE',
      summary: 'Test the system. Keep receipts. Measure the real outcome.',
      title: 'EVIDENCE PACK COMPLETE',
      copy: 'Execution is not proof. Verified behavior and outcomes are.',
      receipt: 'VERIFIED',
      proof: 'PASS',
      status: 'PROOF RECEIPTS VERIFIED',
      system: 'EVIDENCE VERIFIED',
    },
    {
      name: 'SHIP',
      summary: 'Ship operator-owned capability. Keep the human in command.',
      title: 'OPERATOR CORE ONLINE',
      copy: 'The final product is control, capability, and compounding leverage.',
      receipt: 'SHIPPED',
      proof: 'LIVE',
      status: 'OPERATOR CAPABILITY READY',
      system: 'SYSTEM NOMINAL',
    },
  ];

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let particles = [];
  let pulses = [];
  let startTime = performance.now();
  let pausedAt = 0;
  let paused = false;
  let frameRequest = 0;
  let currentPhase = -1;
  let completedCycles = 0;
  let pointer = { x: 0, y: 0, active: false };
  let renderedFrames = 0;

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function pointOnM(index, count) {
    const t = index / Math.max(1, count - 1);
    let x;
    let y;
    if (t < 0.25) {
      const p = t / 0.25;
      x = -1;
      y = 1 - p * 2;
    } else if (t < 0.5) {
      const p = (t - 0.25) / 0.25;
      x = -1 + p;
      y = -1 + p * 1.15;
    } else if (t < 0.75) {
      const p = (t - 0.5) / 0.25;
      x = p;
      y = 0.15 - p * 1.15;
    } else {
      const p = (t - 0.75) / 0.25;
      x = 1;
      y = -1 + p * 2;
    }
    return { x, y };
  }

  function buildParticles() {
    const random = seededRandom(1989 + Math.round(width) * 3 + Math.round(height));
    const count = width < 520 ? 88 : Math.min(188, Math.round((width * height) / 3900));
    particles = Array.from({ length: count }, (_, index) => {
      const target = pointOnM(index, count);
      const angle = random() * Math.PI * 2;
      const radius = (0.17 + random() * 0.46) * Math.min(width, height);
      return {
        angle,
        radius,
        speed: (0.11 + random() * 0.38) * (random() > 0.5 ? 1 : -1),
        depth: 0.25 + random() * 0.75,
        size: random() > 0.86 ? 3 : random() > 0.52 ? 2 : 1,
        color: colors[Math.floor(random() * colors.length)],
        phaseOffset: random() * Math.PI * 2,
        targetX: target.x,
        targetY: target.y,
        previousX: width / 2,
        previousY: height / 2,
      };
    });
    nodeCount.textContent = String(count).padStart(3, '0');
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildParticles();
    draw(reduceMotion ? phaseDuration * 3.65 : Math.max(0, performance.now() - startTime));
  }

  function easeInOut(value) {
    const t = Math.max(0, Math.min(1, value));
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function phaseBlend(localProgress) {
    const enter = easeInOut(Math.min(1, localProgress * 3));
    const exit = easeInOut(Math.min(1, Math.max(0, (1 - localProgress) * 4)));
    return Math.min(enter, exit);
  }

  function updateInterface(phase, cycleProgress) {
    if (phase !== currentPhase) {
      currentPhase = phase;
      const data = phases[phase];
      document.body.className = document.body.className.replace(/\bphase-\d\b/g, '').trim();
      document.body.classList.add(`phase-${phase}`);
      phaseSummary.textContent = data.summary;
      outputTitle.textContent = data.title;
      outputCopy.textContent = data.copy;
      receiptValue.textContent = data.receipt;
      proofState.textContent = data.proof;
      statusMessage.textContent = paused ? 'SEQUENCE PAUSED BY OPERATOR' : data.status;
      systemState.textContent = paused ? 'OPERATOR PAUSE' : data.system;
      controlState.textContent = phase < 2 ? 'HUMAN' : phase < 4 ? 'GATED' : 'OWNED';
      phaseIndex.textContent = `${String(phase + 1).padStart(2, '0')}/05`;
      phaseItems.forEach((item, index) => {
        item.classList.toggle('active', index === phase);
        const button = item.querySelector('button');
        if (index === phase) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    }
    progressFill.style.width = `${Math.min(100, Math.max(0, cycleProgress * 100)).toFixed(2)}%`;
    cycleCount.textContent = String(completedCycles + 1).padStart(3, '0');
  }

  function drawBackground() {
    context.fillStyle = '#02040b';
    context.fillRect(0, 0, width, height);

    const gradient = context.createRadialGradient(width * 0.73, height * 0.51, 0, width * 0.73, height * 0.51, Math.min(width, height) * 0.48);
    gradient.addColorStop(0, 'rgba(24, 132, 156, .18)');
    gradient.addColorStop(0.42, 'rgba(6, 48, 73, .1)');
    gradient.addColorStop(1, 'rgba(2, 4, 11, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function drawPulse(pulse, now) {
    const progress = (now - pulse.started) / 800;
    if (progress >= 1) return false;
    const radius = 12 + progress * Math.min(width, height) * 0.32;
    context.save();
    context.globalAlpha = (1 - progress) * 0.7;
    context.strokeStyle = progress < 0.5 ? '#ffe14a' : '#36d9ff';
    context.lineWidth = progress < 0.3 ? 3 : 1;
    context.setLineDash([6, 4]);
    context.strokeRect(
      Math.round(pulse.x - radius),
      Math.round(pulse.y - radius),
      Math.round(radius * 2),
      Math.round(radius * 2),
    );
    context.restore();
    return true;
  }

  function draw(elapsed) {
    const cycleElapsed = ((elapsed % totalDuration) + totalDuration) % totalDuration;
    const cycleProgress = cycleElapsed / totalDuration;
    const phase = Math.min(4, Math.floor(cycleElapsed / phaseDuration));
    const localProgress = (cycleElapsed - phase * phaseDuration) / phaseDuration;
    updateInterface(phase, cycleProgress);
    drawBackground();

    const centerX = width * 0.73;
    const centerY = height * 0.51;
    const timeSeconds = elapsed / 1000;
    const mBlend = phase === 3 ? phaseBlend(localProgress) : phase === 4 ? Math.max(0, 1 - localProgress * 1.7) : 0;
    const mapBlend = phase === 1 ? phaseBlend(localProgress) : 0;
    const swarmBoost = phase === 2 ? 1.75 : 1;
    const shippingExpand = phase === 4 ? 1 + easeInOut(localProgress) * 0.48 : 1;
    const pointerInfluence = pointer.active ? 0.085 : 0;
    const pointerX = pointer.active ? pointer.x : centerX;
    const pointerY = pointer.active ? pointer.y : centerY;

    context.save();
    context.globalCompositeOperation = 'lighter';

    particles.forEach((particle, index) => {
      const angle = particle.angle + timeSeconds * particle.speed * swarmBoost;
      const breathing = 1 + Math.sin(timeSeconds * 1.2 + particle.phaseOffset) * 0.035;
      let radius = particle.radius * breathing * shippingExpand;
      if (phase === 0) radius *= 1.18 - easeInOut(localProgress) * 0.2;
      if (phase === 1) radius *= 0.82 + Math.sin(index * 0.7) * 0.05;
      if (phase === 2) radius *= 0.72 + particle.depth * 0.26;

      let x = centerX + Math.cos(angle) * radius * (0.9 + particle.depth * 0.18);
      let y = centerY + Math.sin(angle) * radius * (0.52 + particle.depth * 0.18);

      if (mapBlend > 0) {
        const lane = (index % 7) / 6 - 0.5;
        const targetX = centerX + lane * width * 0.42;
        const targetY = centerY + (Math.floor(index / 7) % 9 - 4) * 22;
        x += (targetX - x) * mapBlend * 0.68;
        y += (targetY - y) * mapBlend * 0.68;
      }

      if (mBlend > 0) {
        const scale = Math.min(width, height) * 0.22;
        const targetX = centerX + particle.targetX * scale;
        const targetY = centerY + particle.targetY * scale;
        x += (targetX - x) * mBlend;
        y += (targetY - y) * mBlend;
      }

      x += (pointerX - centerX) * pointerInfluence * particle.depth;
      y += (pointerY - centerY) * pointerInfluence * particle.depth;
      x = Math.round(x / 2) * 2;
      y = Math.round(y / 2) * 2;

      const alpha = 0.2 + particle.depth * 0.7;
      const size = Math.max(1, Math.round(particle.size * particle.depth));
      context.globalAlpha = alpha * 0.34;
      context.strokeStyle = particle.color;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(particle.previousX, particle.previousY);
      context.lineTo(x, y);
      context.stroke();

      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.fillRect(x - size / 2, y - size / 2, size + (phase === 2 ? 2 : 0), size);

      if (index % 17 === 0) {
        context.globalAlpha = alpha * 0.45;
        context.strokeRect(x - 5, y - 5, 10, 10);
      }

      particle.previousX = x;
      particle.previousY = y;
    });
    context.restore();

    pulses = pulses.filter((pulse) => drawPulse(pulse, performance.now()));
    renderedFrames += 1;
    window.__MEMORY_GRAVITY_STATE__ = {
      ready: true,
      phase,
      phaseName: phases[phase].name,
      paused,
      reducedMotion: reduceMotion,
      renderedFrames,
      particleCount: particles.length,
      pulseCount: pulses.length,
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  function frame(now) {
    if (paused || reduceMotion) return;
    const elapsed = now - startTime;
    const nextCycle = Math.floor(elapsed / totalDuration);
    if (nextCycle > completedCycles) completedCycles = nextCycle;
    draw(elapsed);
    frameRequest = requestAnimationFrame(frame);
  }

  function replay() {
    cancelAnimationFrame(frameRequest);
    startTime = performance.now();
    completedCycles = 0;
    paused = false;
    pausedAt = 0;
    document.body.classList.remove('is-paused');
    pauseButton.setAttribute('aria-pressed', 'false');
    pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
    currentPhase = -1;
    if (reduceMotion) draw(phaseDuration * 3.65);
    else frameRequest = requestAnimationFrame(frame);
  }

  function togglePause() {
    if (reduceMotion) return;
    paused = !paused;
    document.body.classList.toggle('is-paused', paused);
    pauseButton.setAttribute('aria-pressed', String(paused));
    if (paused) {
      pausedAt = performance.now();
      cancelAnimationFrame(frameRequest);
      pauseButton.innerHTML = '<span aria-hidden="true">▶</span> Resume';
      systemState.textContent = 'OPERATOR PAUSE';
      statusMessage.textContent = 'SEQUENCE PAUSED BY OPERATOR';
      window.__MEMORY_GRAVITY_STATE__.paused = true;
    } else {
      startTime += performance.now() - pausedAt;
      pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
      currentPhase = -1;
      frameRequest = requestAnimationFrame(frame);
    }
  }

  function jumpToPhase(index) {
    const target = Math.min(4, Math.max(0, Number(index) || 0));
    cancelAnimationFrame(frameRequest);
    startTime = performance.now() - target * phaseDuration - phaseDuration * 0.18;
    completedCycles = 0;
    paused = false;
    document.body.classList.remove('is-paused');
    pauseButton.setAttribute('aria-pressed', 'false');
    pauseButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
    currentPhase = -1;
    draw(target * phaseDuration + phaseDuration * 0.18);
    if (!reduceMotion) frameRequest = requestAnimationFrame(frame);
  }

  function pulseAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pulses.push({ x: clientX - rect.left, y: clientY - rect.top, started: performance.now() });
    document.body.classList.remove('field-pulse');
    void document.body.offsetWidth;
    document.body.classList.add('field-pulse');
    window.setTimeout(() => document.body.classList.remove('field-pulse'), 460);
    if (paused || reduceMotion) draw(paused ? pausedAt - startTime : phaseDuration * 3.65);
  }

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });
  canvas.addEventListener('pointerdown', (event) => pulseAt(event.clientX, event.clientY));

  phaseItems.forEach((item) => item.querySelector('button')?.addEventListener('click', () => jumpToPhase(item.dataset.phase)));
  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => jumpToPhase(button.dataset.jump)));
  replayButton.addEventListener('click', replay);
  pauseButton.addEventListener('click', togglePause);
  sourcesButton.addEventListener('click', () => sourcesDialog.showModal());

  function updateClock() {
    taskbarClock.textContent = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  }
  updateClock();
  window.setInterval(updateClock, 30_000);

  window.addEventListener('resize', resize, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  resize();
  if (reduceMotion) {
    document.body.dataset.reducedMotion = 'true';
    pauseButton.disabled = true;
    pauseButton.innerHTML = '<span aria-hidden="true">■</span> Reduced';
    statusMessage.textContent = 'REDUCED MOTION · STATIC PROOF STATE';
    draw(phaseDuration * 3.65);
  } else {
    frameRequest = requestAnimationFrame(frame);
  }

  window.__MEMORY_GRAVITY_READY__ = true;
  window.__memoryGravity = { replay, togglePause, jumpToPhase, pulseAt: (x, y) => pulseAt(x, y) };
})();
