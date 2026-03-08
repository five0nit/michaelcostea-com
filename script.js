async function boot(){
  const res = await fetch('./apps.json');
  const data = await res.json();

  document.getElementById('name').textContent = data.owner || 'Michael Costea';
  document.getElementById('headline').textContent = data.bio?.headline || '';
  document.getElementById('summary').textContent = data.bio?.summary || '';

  const apps = document.getElementById('apps');
  (data.projects || []).forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    const isPrivate = p.status === 'private';
    const cta = isPrivate
      ? `<a class="btn" href="${p.url}">Request access</a>`
      : `<a class="btn" href="${p.url}">Open app</a>`;

    card.innerHTML = `
      <div class="row">
        <h3>${p.name}</h3>
        <span class="badge ${p.status}">${p.status}</span>
      </div>
      <p class="desc">${p.description || ''}</p>
      <div class="row">${cta}</div>
    `;
    apps.appendChild(card);
  });
}
boot();
