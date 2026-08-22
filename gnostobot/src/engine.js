import { commentaryPassages, commentarySources, passages, sources, sourceById } from './corpus.js';

const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'did',
  'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is',
  'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'should', 'so', 'than', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'us', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your'
]);

const CONCEPTS = {
  gnosis: ['knowledge', 'know', 'self', 'awakening', 'remember', 'insight'],
  god: ['source', 'father', 'invisible', 'monad', 'divine', 'light'],
  world: ['creation', 'ruler', 'archon', 'yaldabaoth', 'demiurge', 'matter'],
  evil: ['ruler', 'archon', 'ignorance', 'deception', 'error', 'passion'],
  freedom: ['awakening', 'ascent', 'knowledge', 'chains', 'rest', 'rescue'],
  fear: ['terror', 'fog', 'nightmare', 'ignorance', 'anxiety', 'error'],
  soul: ['ascent', 'powers', 'mind', 'spirit', 'rest', 'root'],
  death: ['resurrection', 'alive', 'transformation', 'garment'],
  afterlife: ['resurrection', 'ascent', 'treasuries', 'soul', 'rest'],
  wisdom: ['sophia', 'discernment', 'forethought', 'barbelo', 'insight'],
  mistake: ['error', 'sophia', 'false light', 'repentance', 'deception'],
  forgive: ['repentance', 'turning', 'mercy', 'restoration'],
  change: ['transformation', 'resurrection', 'practice', 'garment', 'turning'],
  truth: ['knowledge', 'reality', 'names', 'seeing', 'revelation'],
  identity: ['self knowledge', 'image', 'within', 'root', 'light'],
  purpose: ['root', 'return', 'light', 'fullness', 'rest'],
  life: ['light', 'living', 'awakening', 'resurrection', 'root'],
  meditation: ['silence', 'mind', 'seeing', 'attention', 'rest'],
  practice: ['baptism', 'seal', 'discipline', 'turning', 'attention'],
  love: ['union', 'bridal chamber', 'good', 'unity', 'restore'],
  conflict: ['division', 'two', 'one', 'unity', 'powers'],
  money: ['goods', 'sell', 'ethics', 'mystery'],
  simulation: ['world', 'ruler', 'image', 'reality', 'deception'],
  kingdom: ['inside', 'outside', 'within', 'one', 'light']
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stem(token) {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

export function tokenize(value) {
  return normalize(value)
    .split(' ')
    .filter((token) => token && !STOP_WORDS.has(token))
    .map(stem);
}

function expandedTerms(query) {
  const normalized = normalize(query);
  const terms = new Set(tokenize(query));
  for (const [concept, related] of Object.entries(CONCEPTS)) {
    if (normalized.includes(concept) || terms.has(stem(concept))) {
      terms.add(stem(concept));
      related.flatMap(tokenize).forEach((term) => terms.add(term));
    }
  }
  return [...terms];
}

function passageHaystack(passage) {
  const source = sourceById[passage.sourceId];
  return normalize([
    passage.summary,
    passage.counsel,
    passage.context,
    passage.locator,
    passage.keywords.join(' '),
    source.title,
    source.author,
    source.tradition,
    source.description,
    source.relation
  ].join(' '));
}

export function scorePassage(query, passage) {
  const normalizedQuery = normalize(query);
  const terms = expandedTerms(query);
  const haystack = passageHaystack(passage);
  const hayTerms = new Set(tokenize(haystack));
  let score = 0;

  for (const term of terms) {
    if (hayTerms.has(term)) score += term.length > 5 ? 2.1 : 1.4;
  }

  for (const keyword of passage.keywords) {
    const normalizedKeyword = normalize(keyword);
    if (normalizedKeyword.length > 3 && normalizedQuery.includes(normalizedKeyword)) score += 5;
  }

  const source = sourceById[passage.sourceId];
  if (normalizedQuery.includes(normalize(source.title))) score += 8;
  if (normalizedQuery.includes(source.id)) score += 4;

  return Number(score.toFixed(2));
}

function queryCollection(query, collection, options = {}) {
  const limit = Math.max(1, Math.min(options.limit ?? 3, 5));
  const scored = collection
    .map((passage) => ({ passage, score: scorePassage(query, passage) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id));

  if (!scored.length || scored[0].score < 3.5) return [];

  const selected = [];
  const perSource = new Map();
  for (const result of scored) {
    const count = perSource.get(result.passage.sourceId) ?? 0;
    if (count >= 2) continue;
    selected.push(result);
    perSource.set(result.passage.sourceId, count + 1);
    if (selected.length === limit) break;
  }
  return selected;
}

export function queryCorpus(query, options = {}) {
  return queryCollection(query, passages, options);
}

export function queryCommentary(query, options = {}) {
  return queryCollection(query, commentaryPassages, { ...options, limit: options.limit ?? 2 });
}

const PRELUDES = {
  gnosis: 'The texts treat true knowledge as recognition that exposes false authority and restores memory of the divine source.',
  fear: 'The old pages treat fear as fog before they treat it as an enemy.',
  world: 'The codices answer by separating visible rule from ultimate source.',
  resurrection: 'These witnesses speak of resurrection as present change as well as promised completion.',
  sophia: 'Sophia’s story makes discernment—not mere brightness—the test of wisdom.',
  self: 'The sayings turn the question inward without making the outer world irrelevant.',
  default: 'The strongest surviving evidence converges on these source-grounded points.'
};

function choosePrelude(query, results) {
  const text = normalize(query);
  if (/fear|anxiety|terror|afraid/.test(text)) return PRELUDES.fear;
  if (/world|creator|demiurge|archon|yaldabaoth|simulation/.test(text)) return PRELUDES.world;
  if (/resurrection|death|afterlife/.test(text)) return PRELUDES.resurrection;
  if (/sophia|wisdom|mistake|false light/.test(text)) return PRELUDES.sophia;
  if (/self|inside|within|identity|kingdom/.test(text)) return PRELUDES.self;
  if (/gnosis|knowledge|know|truth|false/.test(text)) return PRELUDES.gnosis;
  const topSource = results[0]?.passage.sourceId;
  if (topSource === 'truth') return PRELUDES.fear;
  return PRELUDES.default;
}

export function composeAnswer(query, options = {}) {
  const results = queryCorpus(query, options);
  const commentaryResults = queryCommentary(query, { ...options, limit: options.commentaryLimit ?? 2 });
  const commentary = {
    label: 'Historical Kindle library — interpretation, never manuscript authority',
    passages: commentaryResults.map(({ passage, score }, index) => ({
      ...passage,
      score,
      citationNumber: index + 1,
      source: sourceById[passage.sourceId]
    })),
    citations: commentaryResults.map(({ passage }, index) => ({
      number: index + 1,
      locator: passage.locator,
      source: sourceById[passage.sourceId]
    }))
  };

  if (!results.length && !commentaryResults.length) {
    return {
      status: 'boundary',
      prelude: 'The admitted manuscripts do not speak clearly enough to answer that.',
      guidance: 'Reframe around gnosis, the inner light, Sophia, the rulers, fear, resurrection, the soul’s ascent, names, unity, or spiritual practice.',
      citations: [],
      commentary
    };
  }

  if (!results.length) {
    return {
      status: 'commentary-only',
      prelude: 'The manuscript witnesses do not answer this directly. The later Kindle library does, but only as historical interpretation.',
      guidance: 'Read these notes as later comparison—not revelation, codex evidence, or proof of ancient origin.',
      passages: [],
      citations: [],
      commentary
    };
  }

  return {
    status: 'grounded',
    prelude: choosePrelude(query, results),
    passages: results.map(({ passage, score }, index) => ({
      ...passage,
      score,
      citationNumber: index + 1,
      source: sourceById[passage.sourceId]
    })),
    citations: results.map(({ passage }, index) => ({
      number: index + 1,
      locator: passage.locator,
      source: sourceById[passage.sourceId]
    })),
    commentary
  };
}

export function corpusStats() {
  return {
    primarySources: sources.length,
    primaryPassages: passages.length,
    commentarySources: commentarySources.length,
    commentaryPassages: commentaryPassages.length,
    latestWitnessYear: Math.max(...sources.map((source) => source.latestManuscriptYear))
  };
}
