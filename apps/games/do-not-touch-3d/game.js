import * as THREE from 'https://esm.sh/three@0.164.1';
import { GLTFLoader } from 'https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87d6ff);
scene.fog = new THREE.Fog(0x87d6ff, 28, 80);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 16, 16);

const hemi = new THREE.HemisphereLight(0xdff6ff, 0x2f5934, 1.05);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.25);
sun.position.set(18, 26, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const fill = new THREE.DirectionalLight(0xa6d6ff, 0.45);
fill.position.set(-12, 10, -8);
scene.add(fill);

const zonePill = document.getElementById('zonePill');
const objectivePill = document.getElementById('objectivePill');
const foundPill = document.getElementById('foundPill');
const entriesPill = document.getElementById('entriesPill');
const dialogue = document.getElementById('dialogue');
const dialogueTitle = document.getElementById('dialogueTitle');
const dialogueBody = document.getElementById('dialogueBody');
const dialogueClose = document.getElementById('dialogueClose');
const journal = document.getElementById('journal');
const journalClose = document.getElementById('journalClose');
const journalNav = document.getElementById('journalNav');
const journalEntries = document.getElementById('journalEntries');
const journalEmpty = document.getElementById('journalEmpty');
const intro = document.getElementById('intro');
const startBtn = document.getElementById('startBtn');
const touchHud = document.getElementById('touchHud');
const joyWrap = document.getElementById('joyWrap');
const joyKnob = document.getElementById('joyKnob');
const mobileInteract = document.getElementById('mobileInteract');
const touchJournal = document.getElementById('touchJournal');
const questTitle = document.getElementById('questTitle');
const questDesc = document.getElementById('questDesc');
const questSteps = document.getElementById('questSteps');

const state = {
  ready: false,
  started: false,
  dialogueOpen: false,
  journalOpen: false,
  unlocked: new Set(),
  foundClues: new Set(),
  talkedTo: new Set(),
  activeFilter: 'all',
  activeQuestIndex: 0,
  pendingBuilderUnlock: false
};

const TILE = 2;
const mapSize = 18;
const walls = new Set();
const npcMeshes = [];
const clueMeshes = [];
const worldObjects = [];
const keys = {};
let interactionCooldown = 0;
const isMobile = window.matchMedia('(max-width: 720px)').matches;
const joystick = { active: false, x: 0, y: 0 };
const tapMoveTarget = new THREE.Vector3();
let hasTapMoveTarget = false;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const gltfLoader = new GLTFLoader();

const player = new THREE.Group();
scene.add(player);
const playerVisualRoot = new THREE.Group();
player.add(playerVisualRoot);

const playerBody = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.55, 1.0, 8, 16),
  new THREE.MeshStandardMaterial({ color: 0x3b6cff, roughness: 0.5 })
);
playerBody.castShadow = true;
playerBody.position.y = 1.1;
const playerHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.46, 24, 20),
  new THREE.MeshStandardMaterial({ color: 0xffddb5, roughness: 0.62 })
);
playerHead.castShadow = true;
playerHead.position.set(0, 2.1, 0.02);
const capTop = new THREE.Mesh(
  new THREE.CylinderGeometry(0.46, 0.42, 0.26, 24),
  new THREE.MeshStandardMaterial({ color: 0xd94f63, roughness: 0.42 })
);
capTop.castShadow = true;
capTop.position.set(0, 2.55, 0.02);
const capBrim = new THREE.Mesh(
  new THREE.BoxGeometry(0.72, 0.06, 0.36),
  new THREE.MeshStandardMaterial({ color: 0xbf3d51, roughness: 0.45 })
);
capBrim.castShadow = true;
capBrim.position.set(0, 2.42, 0.36);
const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshStandardMaterial({ color: 0x111111 }));
eyeL.position.set(-0.14, 2.1, 0.42);
const eyeR = eyeL.clone();
eyeR.position.x = 0.05;
const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.7, 6, 10), new THREE.MeshStandardMaterial({ color: 0xffddb5, roughness: 0.65 }));
armL.position.set(-0.62, 1.25, 0);
const armR = armL.clone();
armR.position.x = 0.62;
const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.85, 6, 10), new THREE.MeshStandardMaterial({ color: 0x1e3058, roughness: 0.7 }));
legL.position.set(-0.18, 0.28, 0);
const legR = legL.clone();
legR.position.x = 0.18;
playerVisualRoot.add(playerBody, playerHead, capTop, capBrim, eyeL, eyeR, armL, armR, legL, legR);

const playerState = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  targetYaw: 0
};

const resumeData = await fetch('./data/resume-sections.json').then(r => r.json());
const worldData = await fetch('./data/world-zones.json').then(r => r.json());
const questData = await fetch('./data/quests.json').then(r => r.json());
const assetManifest = await fetch('./data/assets.json').then(r => r.json()).catch(() => ({ player:{placeholder:true}, npcs:[], props:[] }));
state.ready = true;

zonePill.textContent = `Zone: ${worldData.zone.name}`;
objectivePill.textContent = `Objective: ${worldData.zone.objective}`;

buildWorld();
playerState.position.set(worldData.spawn.x * TILE, 0, worldData.spawn.z * TILE);
updatePlayerTransform(0);
refreshHUD();
renderJournal();
renderQuestPanel();
if (isMobile) {
  touchHud?.classList.remove('hidden');
  mobileInteract?.classList.remove('hidden');
}
loadAssetHooks();
applyGuidedVisibility();

function buildWorld() {
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(mapSize * TILE * 2.2, 1, mapSize * TILE * 2.2),
    new THREE.MeshStandardMaterial({ color: 0x69c06a, roughness: 0.96 })
  );
  ground.receiveShadow = true;
  ground.position.y = -0.5;
  scene.add(ground);
  worldObjects.push(ground);

  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xe4d39b, roughness: 0.96 });
  for (let i = -mapSize; i <= mapSize; i++) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(TILE, 0.06, TILE), pathMaterial);
    tile.position.set(i * TILE, 0.02, 0);
    tile.receiveShadow = true;
    scene.add(tile);
    worldObjects.push(tile);
  }
  for (let i = -8; i <= 8; i++) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(TILE, 0.06, TILE), pathMaterial);
    tile.position.set(0, 0.02, i * TILE);
    tile.receiveShadow = true;
    scene.add(tile);
    worldObjects.push(tile);
  }

  const workshopLane = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.08, 4),
    new THREE.MeshStandardMaterial({ color: 0xc6b07a, roughness: 0.95 })
  );
  workshopLane.position.set(24, 0.03, -18);
  workshopLane.receiveShadow = true;
  scene.add(workshopLane);
  worldObjects.push(workshopLane);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0x45a8ef, roughness: 0.18, metalness: 0.05 })
  );
  water.position.set(-18, -0.18, 10);
  scene.add(water);
  worldObjects.push(water);

  const housePositions = [
    { x: -10, z: -8, color: 0xffd36b },
    { x: 10, z: 8, color: 0xff9fb0 },
    { x: 0, z: -14, color: 0xb6a0ff },
    { x: 14, z: -10, color: 0x8ed0ff }
  ];
  housePositions.forEach((h, idx) => {
    const house = createHouse(h.x * TILE, h.z * TILE, h.color, idx);
    scene.add(house);
    worldObjects.push(house);
  });

  const workshopBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0x5b4710, roughness: 0.55 })
  );
  workshopBeacon.position.set(28, 1.15, -20);
  workshopBeacon.castShadow = true;
  scene.add(workshopBeacon);

  worldData.blockedPaths.forEach(({ x, z }) => {
    walls.add(`${x},${z}`);
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({ color: 0x7c8b92, roughness: 0.92 })
    );
    rock.position.set(x * TILE, 0.8, z * TILE);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
    worldObjects.push(rock);
  });

  for (let x = -mapSize; x <= mapSize; x += 2) {
    addTree(x * TILE, -mapSize * TILE - 2);
    addTree(x * TILE, mapSize * TILE + 2);
  }
  for (let z = -mapSize; z <= mapSize; z += 2) {
    addTree(-mapSize * TILE - 2, z * TILE);
    addTree(mapSize * TILE + 2, z * TILE);
  }

  worldData.npcs.forEach((npc, idx) => {
    const mesh = createNPC(npc, idx);
    npcMeshes.push({ ...npc, mesh });
    scene.add(mesh);
  });

  worldData.clues.forEach((clue, idx) => {
    const mesh = createClue(clue, idx);
    clueMeshes.push({ ...clue, mesh });
    scene.add(mesh);
  });
}

function createHouse(x, z, color, variant = 0) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 3.2, 4.8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 })
  );
  base.castShadow = true;
  base.receiveShadow = true;
  base.position.y = 1.6;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.8, 2.4, 4),
    new THREE.MeshStandardMaterial({ color: variant % 2 === 0 ? 0xd8564f : 0x4451b8, roughness: 0.7 })
  );
  roof.castShadow = true;
  roof.position.y = 4.3;
  roof.rotation.y = Math.PI * 0.25;
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.8, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x694026, roughness: 0.8 })
  );
  door.position.set(0, 1.05, 2.42);
  group.add(base, roof, door);
  group.position.set(x, 0, z);
  return group;
}

function addTree(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a4a2c, roughness: 0.9 })
  );
  trunk.castShadow = true;
  trunk.position.y = 0.8;
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x33a152, roughness: 0.95 })
  );
  leaves.castShadow = true;
  leaves.position.y = 2.1;
  tree.add(trunk, leaves);
  tree.position.set(x, 0, z);
  scene.add(tree);
  worldObjects.push(tree);
}

function createNPC(npc, idx) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.48, 0.8, 8, 16),
    new THREE.MeshStandardMaterial({ color: [0xff9c6b, 0x7b9cff, 0x7ef0be, 0xffd66c, 0x89d0ff][idx % 5], roughness: 0.58 })
  );
  body.castShadow = true;
  body.position.y = 0.92;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xffe0c0, roughness: 0.62 })
  );
  head.castShadow = true;
  head.position.y = 1.9;
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    new THREE.MeshStandardMaterial({ color: 0xfff1a6, emissive: 0x775e0a, roughness: 0.35 })
  );
  marker.position.y = 2.9;
  group.add(body, head, marker);
  group.position.set(npc.x * TILE, 0, npc.z * TILE);
  return group;
}

function createClue(clue, idx) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0x79e4ff : 0xffe07a, emissive: idx % 2 === 0 ? 0x1b4b67 : 0x6a5414, roughness: 0.2, metalness: 0.08 })
  );
  core.castShadow = true;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.05, 10, 26),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x28465f, roughness: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(core, ring);
  group.position.set(clue.x * TILE, 1.2, clue.z * TILE);
  return group;
}

function loadAssetHooks() {
  const playerModel = assetManifest?.player?.plannedModel;
  if (playerModel) {
    gltfLoader.load(playerModel.replace('.glb', '.gltf'), gltf => applyImportedModel(playerVisualRoot, gltf.scene, 1.6), undefined, () => {});
  }

  npcMeshes.forEach(npc => {
    const entry = (assetManifest.npcs || []).find(v => v.id === npc.id);
    if (!entry?.plannedModel) return;
    gltfLoader.load(entry.plannedModel.replace('.glb', '.gltf'), gltf => applyImportedModel(npc.mesh, gltf.scene, 1.35), undefined, () => {});
  });
}

function applyImportedModel(target, importedScene, scale = 1) {
  const clone = importedScene.clone(true);
  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  clone.scale.setScalar(scale / maxDim);
  const centered = new THREE.Box3().setFromObject(clone).getCenter(new THREE.Vector3());
  clone.position.sub(centered);
  clone.position.y += 0.8;
  clone.traverse(node => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  target.add(clone);
}

function getGuidedStep() {
  if (!state.talkedTo.has('npc-guide')) return { kind: 'npc', id: 'npc-guide', objective: 'Talk to Guide Byte to begin the guided resume path.' };
  if (!state.unlocked.has('summary')) return { kind: 'clue', id: 'shard-summary', objective: 'Collect the Profile Shard to unlock the first resume section.' };
  if (!state.unlocked.has('experience-electrical')) return { kind: 'npc', id: 'npc-electric', objective: 'Talk to the Field Mentor to unlock field experience.' };
  if (!state.pendingBuilderUnlock && !state.foundClues.has('shard-projects') && !state.unlocked.has('projects-automation')) return { kind: 'clue', id: 'shard-projects', objective: 'Collect the Builder Shard on the workshop route.' };
  if ((state.pendingBuilderUnlock || state.foundClues.has('shard-projects')) && !state.unlocked.has('projects-automation')) return { kind: 'npc', id: 'npc-workshop-terminal', objective: 'Bring the Builder Shard to the Workshop Terminal.' };
  if (!state.unlocked.has('operations-leadership')) return { kind: 'npc', id: 'npc-archivist', objective: 'Talk to the Archive Keeper to complete the guided resume journey.' };
  return { kind: 'done', id: 'complete', objective: 'Resume path complete. Open the journal to review the full guided unlock sequence.' };
}

function applyGuidedVisibility() {
  const step = getGuidedStep();
  objectivePill.textContent = `Objective: ${step.objective}`;

  npcMeshes.forEach(npc => {
    const visible = step.kind === 'done' || npc.id === step.id;
    npc.mesh.visible = visible;
  });

  clueMeshes.forEach(clue => {
    const visible = !state.foundClues.has(clue.id) && clue.id === step.id;
    clue.mesh.visible = visible;
  });
}

function refreshHUD() {
  foundPill.textContent = `Clues: ${state.foundClues.size} / ${worldData.clues.length}`;
  entriesPill.textContent = `Resume Entries: ${state.unlocked.size}`;
  if (mobileInteract) mobileInteract.textContent = nearestInteractable() ? 'Interact' : 'Follow Objective';
}

function questCompleted(quest) {
  if (quest.id === 'qt-01') return state.talkedTo.has('npc-guide');
  return (quest.unlocks || []).every(id => state.unlocked.has(id));
}

function renderQuestPanel() {
  const quests = questData.quests || [];
  const nextIndex = quests.findIndex(q => !questCompleted(q));
  state.activeQuestIndex = nextIndex === -1 ? Math.max(quests.length - 1, 0) : nextIndex;
  const quest = quests[state.activeQuestIndex];
  if (!quest) return;
  questTitle.textContent = quest.title;
  questDesc.textContent = quest.description;
  questSteps.innerHTML = '';
  (quest.steps || []).forEach((step, idx) => {
    const li = document.createElement('li');
    li.textContent = step;
    const completed = (quest.id === 'qt-01')
      ? (idx === 0 ? state.talkedTo.has('npc-guide') : false)
      : idx < (quest.unlocks || []).filter(id => state.unlocked.has(id)).length;
    if (completed) li.classList.add('done');
    questSteps.appendChild(li);
  });
}

function unlockEntries(ids = [], options = {}) {
  let changed = false;
  ids.forEach(id => {
    if (!state.unlocked.has(id)) {
      state.unlocked.add(id);
      changed = true;
    }
  });
  if (changed) {
    refreshHUD();
    renderJournal();
    renderQuestPanel();
    applyGuidedVisibility();
    if (options.openJournal !== false) toggleJournal(true);
  }
}

function openDialogue(title, message) {
  state.dialogueOpen = true;
  dialogueTitle.textContent = title;
  dialogueBody.textContent = message;
  dialogue.classList.remove('hidden');
}

function closeDialogue() {
  state.dialogueOpen = false;
  dialogue.classList.add('hidden');
}

dialogueClose.addEventListener('click', closeDialogue);
journalClose.addEventListener('click', () => toggleJournal(false));

function toggleJournal(force) {
  state.journalOpen = typeof force === 'boolean' ? force : !state.journalOpen;
  journal.classList.toggle('hidden', !state.journalOpen);
}

function renderJournal() {
  const entries = resumeData.resumeSections
    .filter(entry => state.unlocked.has(entry.id))
    .sort((a, b) => a.order - b.order);

  const sections = ['all', ...new Set(entries.map(entry => entry.type))];
  journalNav.innerHTML = '';
  sections.forEach(section => {
    const btn = document.createElement('button');
    btn.textContent = section === 'all' ? 'All Unlocked' : formatLabel(section);
    btn.classList.toggle('active', state.activeFilter === section);
    btn.addEventListener('click', () => {
      state.activeFilter = section;
      renderJournal();
    });
    journalNav.appendChild(btn);
  });

  const filtered = entries.filter(entry => state.activeFilter === 'all' || entry.type === state.activeFilter);
  journalEntries.innerHTML = '';
  journalEmpty.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-meta">
        <span class="entry-chip">${formatLabel(entry.type)}</span>
        <span class="entry-chip">${formatZone(entry.zone)}</span>
        ${entry.future ? '<span class="entry-chip">Expandable</span>' : ''}
      </div>
      <h3>${entry.title}</h3>
      <p>${entry.summary}</p>
      <div class="entry-details">${entry.details}</div>
    `;
    journalEntries.appendChild(card);
  });
}

function formatLabel(value) {
  return value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatZone(zoneId) {
  const zone = resumeData.zones.find(z => z.id === zoneId);
  return zone ? zone.name : formatLabel(zoneId);
}

function nearestInteractable() {
  const step = getGuidedStep();
  const playerFlat = new THREE.Vector2(player.position.x, player.position.z);

  if (step.kind === 'npc') {
    const npc = npcMeshes.find(v => v.id === step.id);
    if (!npc || !npc.mesh.visible) return null;
    const dist = playerFlat.distanceTo(new THREE.Vector2(npc.mesh.position.x, npc.mesh.position.z));
    return dist < 3.2 ? { kind: 'npc', data: npc } : null;
  }

  if (step.kind === 'clue') {
    const clue = clueMeshes.find(v => v.id === step.id);
    if (!clue || !clue.mesh.visible) return null;
    const dist = playerFlat.distanceTo(new THREE.Vector2(clue.mesh.position.x, clue.mesh.position.z));
    return dist < 2.7 ? { kind: 'clue', data: clue } : null;
  }

  return null;
}

function interact() {
  const step = getGuidedStep();
  const target = nearestInteractable();
  if (!target) {
    openDialogue('Next Step', step.objective);
    return;
  }

  if (target.kind === 'clue') {
    state.foundClues.add(target.data.id);
    target.data.mesh.visible = false;
    if (target.data.id === 'shard-projects') state.pendingBuilderUnlock = true;
    unlockEntries(target.data.unlocks || []);
    openDialogue(target.data.label, `${target.data.message}\n\nResume journal updated.`);
    return;
  }

  if (target.kind === 'npc') {
    const firstTalk = !state.talkedTo.has(target.data.id);
    state.talkedTo.add(target.data.id);
    let unlocks = [...(target.data.unlocks || [])];
    if (target.data.id === 'npc-workshop-terminal' && state.pendingBuilderUnlock) {
      unlocks.push('projects-automation');
      state.pendingBuilderUnlock = false;
    }
    unlockEntries(unlocks);
    const suffix = firstTalk && unlocks.length
      ? '\n\nNew resume entry recovered.'
      : '';
    openDialogue(target.data.name, `${target.data.dialogue}${suffix}`);
    renderQuestPanel();
    applyGuidedVisibility();
  }
}

function updatePlayerTransform(time) {
  player.position.copy(playerState.position);
  const speed = Math.hypot(playerState.velocity.x, playerState.velocity.z);
  const walk = Math.sin(time * 10) * Math.min(0.45, speed * 0.18);
  armL.rotation.x = walk;
  armR.rotation.x = -walk;
  legL.rotation.x = -walk * 1.4;
  legR.rotation.x = walk * 1.4;
  playerBody.position.y = 1.1 + Math.abs(walk) * 0.04;
  player.rotation.y += (playerState.targetYaw - player.rotation.y) * 0.18;
}

function cellBlocked(x, z) {
  return walls.has(`${Math.round(x / TILE)},${Math.round(z / TILE)}`);
}

function setTapMoveTargetFromPointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(worldObjects, true);
  if (!hits.length) return;
  tapMoveTarget.copy(hits[0].point);
  tapMoveTarget.y = 0;
  hasTapMoveTarget = true;
}

function movePlayer(dt) {
  if (!state.started || state.dialogueOpen || state.journalOpen) return;

  const dir = new THREE.Vector3();
  if (keys['w'] || keys['arrowup']) dir.z -= 1;
  if (keys['s'] || keys['arrowdown']) dir.z += 1;
  if (keys['a'] || keys['arrowleft']) dir.x -= 1;
  if (keys['d'] || keys['arrowright']) dir.x += 1;
  if (Math.abs(joystick.x) > 0.08 || Math.abs(joystick.y) > 0.08) {
    dir.x += joystick.x;
    dir.z += joystick.y;
    hasTapMoveTarget = false;
  } else if (hasTapMoveTarget) {
    const toTarget = new THREE.Vector3().subVectors(tapMoveTarget, playerState.position);
    toTarget.y = 0;
    if (toTarget.length() < 0.65) {
      hasTapMoveTarget = false;
    } else {
      toTarget.normalize();
      dir.copy(toTarget);
    }
  }

  const moving = dir.lengthSq() > 0;
  if (moving) {
    dir.normalize();
    const speed = 7.2;
    playerState.velocity.x = dir.x * speed;
    playerState.velocity.z = dir.z * speed;
    playerState.targetYaw = Math.atan2(playerState.velocity.x, playerState.velocity.z);
  } else {
    playerState.velocity.x *= 0.74;
    playerState.velocity.z *= 0.74;
  }

  const nextX = playerState.position.x + playerState.velocity.x * dt;
  const nextZ = playerState.position.z + playerState.velocity.z * dt;
  const clamp = mapSize * TILE - 2;

  if (!cellBlocked(nextX, playerState.position.z)) playerState.position.x = THREE.MathUtils.clamp(nextX, -clamp, clamp);
  if (!cellBlocked(playerState.position.x, nextZ)) playerState.position.z = THREE.MathUtils.clamp(nextZ, -clamp, clamp);
}

function animateWorld(time) {
  npcMeshes.forEach((npc, idx) => {
    if (!npc.mesh.visible) return;
    npc.mesh.position.y = Math.sin(time * 2 + idx) * 0.08;
    npc.mesh.children[2].rotation.y += 0.02;
  });

  clueMeshes.forEach((clue, idx) => {
    if (!clue.mesh.visible) return;
    clue.mesh.position.y = 1.2 + Math.sin(time * 3 + idx) * 0.18;
    clue.mesh.rotation.y += 0.03;
    clue.mesh.children[1].rotation.z += 0.025;
  });
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  interactionCooldown = Math.max(0, interactionCooldown - dt);
  movePlayer(dt);
  updatePlayerTransform(elapsed);
  animateWorld(elapsed);
  refreshHUD();

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 16 - camera.position.z) * 0.08;
  camera.position.y += (15 - camera.position.y) * 0.08;
  camera.lookAt(player.position.x, 1.6, player.position.z);

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.toLowerCase() === 'j' && state.started && !state.dialogueOpen) {
    toggleJournal();
  }

  if ((event.key === ' ' || event.key === 'Enter') && state.started) {
    event.preventDefault();
    if (state.dialogueOpen) {
      closeDialogue();
      return;
    }
    if (!state.journalOpen && interactionCooldown <= 0) {
      interactionCooldown = 0.25;
      interact();
    }
  }

  if (event.key === 'Escape') {
    if (state.dialogueOpen) closeDialogue();
    else if (state.journalOpen) toggleJournal(false);
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

function resetJoystick() {
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  if (joyKnob) {
    joyKnob.style.left = '50px';
    joyKnob.style.top = '50px';
  }
}

function updateJoystickFromEvent(event) {
  if (!joyWrap || !joyKnob) return;
  const rect = joyWrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = (event.clientX - cx) / ((rect.width / 2) - 28);
  let dy = (event.clientY - cy) / ((rect.height / 2) - 28);
  const mag = Math.hypot(dx, dy) || 1;
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }
  joystick.x = dx;
  joystick.y = dy;
  joystick.active = true;
  joyKnob.style.left = `${50 + dx * 34}px`;
  joyKnob.style.top = `${50 + dy * 34}px`;
}

if (joyWrap) {
  joyWrap.addEventListener('pointerdown', event => {
    joyWrap.setPointerCapture(event.pointerId);
    updateJoystickFromEvent(event);
  });
  joyWrap.addEventListener('pointermove', event => {
    if (joystick.active) updateJoystickFromEvent(event);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
    joyWrap.addEventListener(type, resetJoystick);
  });
}

canvas.addEventListener('pointerdown', event => {
  if (!isMobile || !state.started || state.dialogueOpen || state.journalOpen) return;
  setTapMoveTargetFromPointer(event.clientX, event.clientY);
});

mobileInteract?.addEventListener('click', () => {
  if (!state.started) return;
  if (state.dialogueOpen) closeDialogue();
  else interact();
});

touchJournal?.addEventListener('click', () => {
  if (state.started && !state.dialogueOpen) toggleJournal();
});

startBtn.addEventListener('click', () => {
  state.started = true;
  intro.classList.add('hidden');
  applyGuidedVisibility();
  openDialogue('Guide Byte', 'Welcome in. This experience is now guided step by step. I’ll only reveal the next required resume fragment so the journey stays simple.');
});
