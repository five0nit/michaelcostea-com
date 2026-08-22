import { allSources, sourceById } from './corpus.js';
import { composeAnswer, corpusStats } from './engine.js';

const MEMORY_KEY = 'gnostobot-memory-v1';
const MAX_MEMORY_TURNS = 40;

const elements = {
  sourceList: document.querySelector('#source-list'),
  sourceFilter: document.querySelector('#source-filter'),
  sourceShelf: document.querySelector('#source-shelf'),
  sourcesToggle: document.querySelector('#sources-toggle'),
  transcript: document.querySelector('#transcript'),
  chamber: document.querySelector('.chamber'),
  form: document.querySelector('#question-form'),
  question: document.querySelector('#question'),
  charCount: document.querySelector('#char-count'),
  askButton: document.querySelector('.ask-button'),
  sourceDialog: document.querySelector('#source-dialog'),
  sourceDialogLayer: document.querySelector('#source-dialog-layer'),
  sourceDialogTitle: document.querySelector('#source-dialog-title'),
  sourceDialogBody: document.querySelector('#source-dialog-body'),
  memoryDialog: document.querySelector('#memory-dialog'),
  memoryOpen: document.querySelector('#memory-open'),
  memoryCount: document.querySelector('#memory-count'),
  memorySummary: document.querySelector('#memory-summary'),
  memoryList: document.querySelector('#memory-list'),
  memoryClear: document.querySelector('#memory-clear'),
  networkStatus: document.querySelector('#network-status')
};

let memory = loadMemory();
let busy = false;

function loadMemory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item && typeof item.query === 'string' && ['grounded', 'commentary-only', 'boundary'].includes(item.status)
    ).slice(-MAX_MEMORY_TURNS);
  } catch {
    return [];
  }
}

function saveMemory() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory.slice(-MAX_MEMORY_TURNS)));
  updateMemoryCount();
}

function updateMemoryCount() {
  elements.memoryCount.textContent = String(memory.length);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function sourceMonogram(source) {
  return source.title
    .split(/\s+/)
    .filter((part) => !['of', 'on', 'the'].includes(part.toLowerCase()))
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

function compactManuscriptDate(value) {
  return value
    .replace('mid-4th century CE', '4th c.')
    .replace('4th–5th centuries CE', '4–5th c.')
    .replace('3rd–5th centuries CE', '3–5th c.')
    .replace('c. 5th–6th century CE', '5–6th c.')
    .replace('c. 4th century CE', '4th c.');
}

function renderSources(filter = '') {
  const normalized = filter.trim().toLowerCase();
  elements.sourceList.replaceChildren();
  const matches = allSources.filter((source) => [
    source.title,
    source.siglum,
    source.author,
    source.tradition,
    source.witness,
    source.kindleTitle
  ].join(' ').toLowerCase().includes(normalized));

  for (const layer of ['primary', 'commentary']) {
    const group = matches.filter((source) => source.layer === layer);
    if (!group.length) continue;
    const heading = createElement(
      'h3',
      `source-group-title ${layer}`,
      layer === 'primary' ? `Primary witnesses · ${group.length}` : `Historical Kindle library · ${group.length}`
    );
    elements.sourceList.append(heading);

    for (const source of group) {
      const button = createElement('button', `source-card ${source.layer}`);
      button.type = 'button';
      button.dataset.sourceId = source.id;
      button.dataset.sourceLayer = source.layer;
      button.setAttribute('aria-label', `Open ${source.title} source details`);

      const monogram = createElement('span', 'source-monogram', sourceMonogram(source));
      const text = createElement('span');
      text.append(
        createElement('strong', '', source.title),
        createElement('small', '', source.layer === 'primary' ? source.siglum : source.author)
      );
      const dateLabel = source.layer === 'primary'
        ? compactManuscriptDate(source.manuscriptDate)
        : String(source.publicationYear);
      const date = createElement('span', 'source-date', dateLabel);
      button.append(monogram, text, date);
      button.addEventListener('click', () => openSource(source.id));
      elements.sourceList.append(button);
    }
  }

  if (!matches.length) {
    elements.sourceList.append(createElement('p', 'memory-empty', 'No source or library record matches.'));
  }
}

function metadataCell(label, value) {
  const cell = createElement('div', 'metadata-cell');
  cell.append(createElement('small', '', label), createElement('strong', '', value));
  return cell;
}

function openSource(sourceId) {
  const source = sourceById[sourceId];
  if (!source) return;
  elements.sourceDialogTitle.textContent = source.title;
  elements.sourceDialogLayer.textContent = source.layer === 'primary'
    ? 'PRIMARY MANUSCRIPT WITNESS'
    : 'HISTORICAL KINDLE COMMENTARY';
  elements.sourceDialogBody.replaceChildren();

  const metadata = createElement('div', 'source-metadata');
  if (source.layer === 'primary') {
    metadata.append(
      metadataCell('Witness', source.siglum),
      metadataCell('Manuscript', source.manuscriptDate),
      metadataCell('Composition', source.compositionDate),
      metadataCell('Tradition', source.tradition)
    );
  } else {
    metadata.append(
      metadataCell('Author / translator', source.author),
      metadataCell('Edition', source.publication),
      metadataCell('Layer', 'Historical commentary'),
      metadataCell('Kindle status', source.kindleStatus)
    );
  }

  const description = createElement('p', 'source-description', source.description);
  const provenance = createElement(
    'p',
    'source-provenance',
    source.layer === 'primary' ? source.provenance : source.relation
  );
  const caveat = createElement('p', `source-caveat ${source.layer}`, source.caveat);
  const link = createElement('a', 'source-link', `Open access layer: ${source.accessLabel} ↗`);
  link.href = source.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  elements.sourceDialogBody.append(metadata, description, provenance, caveat, link);
  elements.sourceDialog.showModal();
  closeMobileShelf();
}

function welcome() {
  const stats = corpusStats();
  const card = createElement('div', 'welcome-card');
  const strong = createElement('strong', '', 'The shelf is sealed. ');
  card.append(
    strong,
    document.createTextNode(`${stats.primarySources} manuscript witnesses and ${stats.primaryPassages} primary passages author answers. ${stats.commentarySources} Kindle records and ${stats.commentaryPassages} historical notes can compare—but never overrule—the codices.`)
  );
  return card;
}

function citationChip(citation) {
  const chip = createElement(
    'button',
    `citation-chip ${citation.source.layer}`,
    `[${citation.number}] ${citation.source.title} · ${citation.locator}`
  );
  chip.type = 'button';
  chip.dataset.sourceId = citation.source.id;
  chip.addEventListener('click', () => openSource(citation.source.id));
  return chip;
}

function renderAnswer(answer) {
  const card = createElement('article', `answer-card ${answer.status}`);
  card.dataset.answerStatus = answer.status;
  card.tabIndex = -1;
  const labels = {
    grounded: ['Answer', 'PRIMARY SOURCES'],
    'commentary-only': ['Answer', 'HISTORICAL COMMENTARY'],
    boundary: ['No sourced answer', 'OUTSIDE CORPUS']
  };
  const [title, status] = labels[answer.status];
  const heading = createElement('header', 'answer-heading');
  const headingText = createElement('div');
  headingText.append(createElement('h2', '', title), createElement('span', 'answer-status', status));
  heading.append(createElement('span', 'answer-mark', 'G'), headingText);
  card.append(heading);
  card.append(createElement('p', 'answer-opening', answer.prelude));

  if (answer.status === 'boundary') {
    card.append(createElement('p', 'boundary-guidance', answer.guidance));
    return card;
  }

  if (answer.status === 'grounded') {
    const voices = createElement('div', 'voice-list');
    for (const passage of answer.passages) {
      const voice = createElement('section', 'source-voice');
      voice.dataset.passageId = passage.id;
      const number = createElement('span', 'citation-number', String(passage.citationNumber));
      const body = createElement('div');
      body.append(
        createElement('p', 'voice-source', `${passage.source.title} · ${passage.locator}`),
        createElement('p', 'summary', passage.summary),
        createElement('p', 'counsel', passage.counsel)
      );
      voice.append(number, body);
      voices.append(voice);
    }
    card.append(createElement('h3', 'answer-section-label', 'Source evidence'), voices);

    const citations = createElement('div', 'citation-strip');
    citations.setAttribute('aria-label', 'Primary manuscript citations');
    answer.citations.forEach((citation) => citations.append(citationChip(citation)));
    card.append(citations);
  } else {
    card.append(createElement('p', 'boundary-guidance', answer.guidance));
  }

  if (answer.commentary?.passages.length) {
    const panel = createElement('details', 'commentary-panel');
    panel.open = answer.status === 'commentary-only';
    panel.append(createElement('summary', 'commentary-heading', answer.commentary.label));
    const notes = createElement('div', 'commentary-list');
    for (const passage of answer.commentary.passages) {
      const note = createElement('article', 'commentary-note');
      note.dataset.passageId = passage.id;
      note.append(
        createElement('strong', '', passage.source.title),
        createElement('p', '', passage.summary),
        createElement('small', '', passage.context)
      );
      notes.append(note);
    }
    panel.append(notes);
    const commentaryCitations = createElement('div', 'citation-strip commentary-citations');
    commentaryCitations.setAttribute('aria-label', 'Historical commentary citations');
    answer.commentary.citations.forEach((citation) => commentaryCitations.append(citationChip(citation)));
    panel.append(commentaryCitations);
    card.append(panel);
  }
  return card;
}

function createTurn(query, open = true) {
  const turn = createElement('details', 'turn');
  turn.open = open;
  const question = createElement('summary', 'turn-question');
  question.append(
    createElement('span', 'turn-label', 'YOU ASKED'),
    createElement('span', 'turn-question-text', query)
  );
  turn.append(question);
  return turn;
}

function renderTurn(record, open = false) {
  const turn = createTurn(record.query, open);
  turn.dataset.turnId = record.id;
  const answer = composeAnswer(record.query);
  turn.append(renderAnswer(answer));
  elements.transcript.append(turn);
  return turn;
}

function scrollTurnToAnswer(turn, behavior = 'smooth') {
  requestAnimationFrame(() => {
    if (window.matchMedia('(max-width: 780px)').matches) {
      turn.scrollIntoView({ behavior, block: 'start' });
    } else {
      elements.transcript.scrollTo({ top: turn.offsetTop - elements.transcript.offsetTop, behavior });
    }
    turn.querySelector('.answer-card')?.focus({ preventScroll: true });
  });
}

function updateConversationState() {
  elements.chamber.classList.toggle('has-turns', memory.length > 0);
}

function renderHistory() {
  elements.transcript.replaceChildren();
  if (!memory.length) {
    elements.transcript.append(welcome());
    updateConversationState();
    return;
  }
  memory.forEach((record, index) => renderTurn(record, index === memory.length - 1));
  updateConversationState();
  scrollTurnToAnswer(elements.transcript.lastElementChild, 'auto');
}

function thinkingIndicator() {
  const indicator = createElement('div', 'thinking');
  indicator.setAttribute('aria-label', 'Consulting primary witnesses and historical library');
  indicator.append(createElement('i'), createElement('i'), createElement('i'));
  return indicator;
}

async function ask(query) {
  if (busy) return;
  const cleanQuery = query.trim().slice(0, 320);
  if (!cleanQuery) return;

  busy = true;
  elements.askButton.disabled = true;
  elements.transcript.setAttribute('aria-busy', 'true');

  const welcomeCard = elements.transcript.querySelector('.welcome-card');
  if (welcomeCard) welcomeCard.remove();

  elements.transcript.querySelectorAll('.turn[open]').forEach((previous) => { previous.open = false; });
  elements.chamber.classList.add('has-turns');

  const turn = createTurn(cleanQuery);
  const indicator = thinkingIndicator();
  turn.append(indicator);
  elements.transcript.append(turn);
  elements.transcript.scrollTop = elements.transcript.scrollHeight;

  await new Promise((resolve) => setTimeout(resolve, 240));
  const answer = composeAnswer(cleanQuery);
  indicator.replaceWith(renderAnswer(answer));
  scrollTurnToAnswer(turn);

  const record = {
    id: globalThis.crypto?.randomUUID?.() ?? `turn-${Date.now()}`,
    query: cleanQuery,
    status: answer.status,
    passageIds: [
      ...(answer.passages || []).map((passage) => passage.id),
      ...(answer.commentary?.passages || []).map((passage) => passage.id)
    ],
    sourceIds: [...new Set([
      ...(answer.passages || []).map((passage) => passage.sourceId),
      ...(answer.commentary?.passages || []).map((passage) => passage.sourceId)
    ])]
  };
  turn.dataset.turnId = record.id;
  memory.push(record);
  saveMemory();

  elements.question.value = '';
  resizeQuestion();
  elements.transcript.setAttribute('aria-busy', 'false');
  elements.askButton.disabled = false;
  busy = false;
}

function resizeQuestion() {
  elements.question.style.height = 'auto';
  elements.question.style.height = `${Math.min(elements.question.scrollHeight, 120)}px`;
  elements.charCount.textContent = `${elements.question.value.length} / 320`;
}

function renderMemoryDialog() {
  const sourceIds = new Set(memory.flatMap((item) => item.sourceIds || []));
  const grounded = memory.filter((item) => item.status === 'grounded').length;
  const commentaryOnly = memory.filter((item) => item.status === 'commentary-only').length;
  elements.memorySummary.replaceChildren();

  const stats = [
    [memory.length, 'turns'],
    [grounded, 'grounded'],
    [commentaryOnly, 'library-only'],
    [sourceIds.size, 'sources opened']
  ];
  for (const [value, label] of stats) {
    const stat = createElement('div', 'memory-stat');
    stat.append(createElement('strong', '', String(value)), createElement('small', '', label));
    elements.memorySummary.append(stat);
  }

  elements.memoryList.replaceChildren();
  if (!memory.length) {
    elements.memoryList.append(createElement('p', 'memory-empty', 'No local thread yet.'));
  } else {
    [...memory].reverse().forEach((item) => {
      const sourceNames = (item.sourceIds || [])
        .map((sourceId) => sourceById[sourceId]?.title)
        .filter(Boolean)
        .join(' · ');
      const row = createElement('div', 'memory-item');
      row.append(
        createElement('p', '', item.query),
        createElement('small', '', sourceNames || 'Boundary held — no source admitted')
      );
      elements.memoryList.append(row);
    });
  }
}

function closeMobileShelf() {
  elements.sourceShelf.classList.remove('open');
  elements.sourcesToggle?.setAttribute('aria-expanded', 'false');
}

function updateNetworkStatus() {
  elements.networkStatus.lastChild.textContent = navigator.onLine ? ' Local corpus' : ' Offline ready';
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  ask(elements.question.value);
});

elements.question.addEventListener('input', resizeQuestion);
elements.question.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    elements.form.requestSubmit();
  }
});

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    elements.question.value = button.dataset.prompt;
    resizeQuestion();
    elements.form.requestSubmit();
  });
});

elements.sourceFilter.addEventListener('input', () => renderSources(elements.sourceFilter.value));
elements.sourcesToggle?.addEventListener('click', () => {
  const open = elements.sourceShelf.classList.toggle('open');
  elements.sourcesToggle.setAttribute('aria-expanded', String(open));
});

elements.memoryOpen.addEventListener('click', () => {
  renderMemoryDialog();
  elements.memoryDialog.showModal();
});

elements.memoryClear.addEventListener('click', () => {
  memory = [];
  localStorage.removeItem(MEMORY_KEY);
  updateMemoryCount();
  renderHistory();
  renderMemoryDialog();
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog')?.close());
});

document.addEventListener('click', (event) => {
  if (window.innerWidth > 780 || !elements.sourceShelf.classList.contains('open')) return;
  if (elements.sourceShelf.contains(event.target) || elements.sourcesToggle?.contains(event.target)) return;
  closeMobileShelf();
});

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

renderSources();
renderHistory();
updateMemoryCount();
updateNetworkStatus();
resizeQuestion();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error.message);
    });
  });
}
