function initScene(){
  const items = Array.from(document.querySelectorAll('.mini-window b'));
  if(!items.length) return;
  const states = ['online','rendering','queued','ready','syncing','live'];
  let t = 0;
  setInterval(() => {
    t++;
    items.forEach((el, i) => {
      if ((t + i) % 3 === 0) {
        el.textContent = states[(Math.floor(Math.random()*states.length))];
      }
    });
  }, 1800);

  const scene = document.querySelector('.retro-scene');
  if (scene) {
    scene.addEventListener('mousemove', (e) => {
      const rect = scene.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      scene.style.transform = `perspective(700px) rotateX(${(-y/3).toFixed(2)}deg) rotateY(${(x/3).toFixed(2)}deg)`;
    });
    scene.addEventListener('mouseleave', () => {
      scene.style.transform = 'none';
    });
  }
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

  initScene();
}
boot();
