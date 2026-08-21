export const DEFAULT_MODEL = Object.freeze({
  seats: 320,
  weeklyWorkflows: 850,
  minutesSaved: 11,
  qualityPassRate: 88,
  activeRate: 42,
  hourlyRate: 85,
  champions: 14,
});

export const DEFAULT_READINESS = Object.freeze({
  peopleReadiness: 68,
  processReadiness: 61,
  dataReadiness: 54,
  governanceReadiness: 73,
  platformReadiness: 78,
});

export const READINESS_LABELS = Object.freeze({
  peopleReadiness: {
    label: 'People and sponsorship',
    action: 'Confirm executive sponsorship, manager expectations and a champion route before broad activation.',
  },
  processReadiness: {
    label: 'Process clarity',
    action: 'Observe the current workflow, decision points and rework before designing Copilot assistance.',
  },
  dataReadiness: {
    label: 'Knowledge and data',
    action: 'Start with approved sources, ownership and retrieval quality before scaling scenarios.',
  },
  governanceReadiness: {
    label: 'Governance and review',
    action: 'Name allowed use, human approval and exception handling before the first supervised case.',
  },
  platformReadiness: {
    label: 'Platform and access',
    action: 'Resolve licences, access, configuration and support ownership before promising adoption outcomes.',
  },
});

export const SCENARIOS = Object.freeze([
  {
    id: 'service-exception',
    title: 'Service exception brief',
    group: 'Operations',
    summary: 'Turn approved case notes and knowledge into a structured draft for a human service lead to verify and act on.',
    impact: 5,
    readiness: 4,
    risk: 2,
    success: 'Handling time, first-pass quality, escalation rate and supervisor edits.',
    discover: 'Observe the current service-exception workflow and its approval path.',
  },
  {
    id: 'proposal-assembly',
    title: 'Proposal assembly coach',
    group: 'Commercial',
    summary: 'Help account teams structure first drafts from approved service, capability and client-context sources.',
    impact: 5,
    readiness: 3,
    risk: 3,
    success: 'Draft cycle time, unsupported-claim rejection, edit distance and win-team reuse.',
    discover: 'Map proposal assembly from discovery notes through commercial and legal review.',
  },
  {
    id: 'project-status',
    title: 'Project status synthesis',
    group: 'Operations',
    summary: 'Create a decision-ready status brief from approved delivery artefacts while keeping owners and exceptions visible.',
    impact: 4,
    readiness: 5,
    risk: 2,
    success: 'Preparation time, missing-risk catches, leader edits and action completion.',
    discover: 'Compare the current project-status preparation path across delivery teams.',
  },
  {
    id: 'knowledge-capture',
    title: 'Expert knowledge capture',
    group: 'Knowledge',
    summary: 'Convert expert walkthroughs into reviewed, reusable knowledge without treating an AI draft as authorised truth.',
    impact: 4,
    readiness: 4,
    risk: 2,
    success: 'Approved articles, retrieval success, stale-content flags and repeat-question deflection.',
    discover: 'Identify one high-friction knowledge domain, its experts and approval owner.',
  },
  {
    id: 'manager-coach',
    title: 'Manager meeting coach',
    group: 'People',
    summary: 'Help managers prepare agendas, decision prompts and follow-up drafts from non-sensitive approved context.',
    impact: 3,
    readiness: 5,
    risk: 2,
    success: 'Preparation time, action clarity, manager reuse and rejected-sensitive-input rate.',
    discover: 'Observe a repeatable manager meeting workflow and define excluded sensitive inputs.',
  },
  {
    id: 'research-brief',
    title: 'Client research brief',
    group: 'Commercial',
    summary: 'Synthesize cited public sources into a reviewable brief while separating facts, assumptions and open questions.',
    impact: 4,
    readiness: 4,
    risk: 3,
    success: 'Source coverage, factual corrections, analyst time and briefing reuse.',
    discover: 'Baseline how account teams source, verify and update client research today.',
  },
]);

const integer = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });
const money = Object.freeze({
  format(value) {
    return `A$${integer.format(value)}`;
  },
});

export function calculateModel(values) {
  const model = { ...DEFAULT_MODEL, ...values };
  const successfulRuns = model.weeklyWorkflows * (model.qualityPassRate / 100);
  const weeklyHours = successfulRuns * model.minutesSaved / 60;
  const weeklyValue = weeklyHours * model.hourlyRate;
  const activePeople = model.seats * (model.activeRate / 100);
  const recommendedChampions = Math.max(4, Math.ceil(model.seats / 25));
  const championGap = Math.max(0, recommendedChampions - model.champions);
  const learningCohorts = Math.max(1, Math.ceil(model.seats / 50));
  const facilitatedClinics = Math.max(1, Math.ceil(recommendedChampions / 8));
  return {
    successfulRuns,
    weeklyHours,
    weeklyValue,
    activePeople,
    recommendedChampions,
    championGap,
    learningCohorts,
    facilitatedClinics,
  };
}

export function scoreScenario(scenario) {
  return Number((scenario.impact * 0.45 + scenario.readiness * 0.35 + (6 - scenario.risk) * 0.2).toFixed(2));
}

export function calculateReadiness(values) {
  const readiness = { ...DEFAULT_READINESS, ...values };
  const entries = Object.entries(readiness);
  const score = Math.round(entries.reduce((sum, [, value]) => sum + Number(value), 0) / entries.length);
  const constraint = entries.reduce((lowest, entry) => Number(entry[1]) < Number(lowest[1]) ? entry : lowest);
  return { score, constraintKey: constraint[0], constraintValue: Number(constraint[1]) };
}

function readNumber(id) {
  const element = document.getElementById(id);
  return Number(element?.value ?? 0);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderModel() {
  const values = {
    seats: readNumber('seats'),
    weeklyWorkflows: readNumber('weekly-workflows'),
    minutesSaved: readNumber('minutes-saved'),
    qualityPassRate: readNumber('quality-rate'),
    activeRate: readNumber('active-rate'),
    hourlyRate: readNumber('hourly-rate'),
    champions: readNumber('champions'),
  };
  const result = calculateModel(values);

  setText('seats-output', integer.format(values.seats));
  setText('weekly-workflows-output', integer.format(values.weeklyWorkflows));
  setText('minutes-saved-output', `${integer.format(values.minutesSaved)} min`);
  setText('quality-rate-output', `${integer.format(values.qualityPassRate)}%`);
  setText('active-rate-output', `${integer.format(values.activeRate)}%`);
  setText('hourly-rate-output', money.format(values.hourlyRate));
  setText('champions-output', integer.format(values.champions));
  setText('successful-runs', integer.format(result.successfulRuns));
  setText('weekly-hours', `${integer.format(result.weeklyHours)} h`);
  setText('weekly-value', money.format(result.weeklyValue));
  setText('active-people', integer.format(result.activePeople));
  setText('recommended-champions', integer.format(result.recommendedChampions));
  setText('champion-gap', integer.format(result.championGap));
  setText('champion-gap-copy', result.championGap === 0 ? 'capacity covered' : 'additional champions suggested');
  setText('learning-cohorts', integer.format(result.learningCohorts));
  setText('facilitated-clinics', integer.format(result.facilitatedClinics));
  setText('model-status', `Model updated: ${integer.format(result.weeklyHours)} illustrative weekly capacity hours.`);
}

function renderReadiness() {
  const values = {
    peopleReadiness: readNumber('people-readiness'),
    processReadiness: readNumber('process-readiness'),
    dataReadiness: readNumber('data-readiness'),
    governanceReadiness: readNumber('governance-readiness'),
    platformReadiness: readNumber('platform-readiness'),
  };
  for (const [key, value] of Object.entries(values)) {
    const outputId = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-output';
    setText(outputId, integer.format(value));
  }
  const result = calculateReadiness(values);
  const constraint = READINESS_LABELS[result.constraintKey];
  setText('constraint-name', constraint.label);
  setText('constraint-action', constraint.action);
  const ring = document.getElementById('readiness-score');
  if (ring) {
    ring.innerHTML = `<span>${result.score}</span><small>/ 100</small>`;
    ring.setAttribute('aria-label', `Overall readiness score ${result.score} out of 100`);
    ring.style.borderColor = result.score >= 75 ? '#5b8300' : result.score >= 55 ? '#3157ff' : '#ff6b35';
  }
}

function scenarioCard(scenario, selectedId) {
  const score = scoreScenario(scenario);
  const selected = scenario.id === selectedId;
  return `
    <button class="scenario-card${selected ? ' is-selected' : ''}" type="button" data-scenario-id="${scenario.id}" aria-pressed="${selected}">
      <span>
        <span class="eyebrow">${scenario.group}</span>
        <h3>${scenario.title}</h3>
        <p>${scenario.summary}</p>
        <p><strong>Measure:</strong> ${scenario.success}</p>
        <span class="scenario-meta" aria-label="Scenario scoring inputs">
          <span>Impact ${scenario.impact}/5</span>
          <span>Ready ${scenario.readiness}/5</span>
          <span>Risk ${scenario.risk}/5</span>
        </span>
      </span>
      <span class="scenario-score" aria-label="Priority score ${score} out of 5"><strong>${score}</strong><small>priority</small></span>
    </button>`;
}

let selectedScenarioId = SCENARIOS[0].id;
let activeFilter = 'All';

function renderScenarios() {
  const grid = document.getElementById('scenario-grid');
  if (!grid) return;
  const visible = SCENARIOS
    .filter(item => activeFilter === 'All' || item.group === activeFilter)
    .sort((a, b) => scoreScenario(b) - scoreScenario(a));
  grid.innerHTML = visible.map(item => scenarioCard(item, selectedScenarioId)).join('');
  grid.querySelectorAll('[data-scenario-id]').forEach(button => {
    button.addEventListener('click', () => selectScenario(button.dataset.scenarioId));
  });
}

function selectScenario(id) {
  const scenario = SCENARIOS.find(item => item.id === id);
  if (!scenario) return;
  selectedScenarioId = id;
  setText('selected-scenario-copy', `Pilot focus: ${scenario.title}.`);
  setText('discover-workflow', scenario.discover);
  renderScenarios();
}

function resetModel() {
  const map = {
    seats: 'seats',
    weeklyWorkflows: 'weekly-workflows',
    minutesSaved: 'minutes-saved',
    qualityPassRate: 'quality-rate',
    activeRate: 'active-rate',
    hourlyRate: 'hourly-rate',
    champions: 'champions',
  };
  for (const [key, id] of Object.entries(map)) document.getElementById(id).value = DEFAULT_MODEL[key];
  const readinessMap = {
    peopleReadiness: 'people-readiness',
    processReadiness: 'process-readiness',
    dataReadiness: 'data-readiness',
    governanceReadiness: 'governance-readiness',
    platformReadiness: 'platform-readiness',
  };
  for (const [key, id] of Object.entries(readinessMap)) document.getElementById(id).value = DEFAULT_READINESS[key];
  renderModel();
  renderReadiness();
}

function initialise() {
  document.querySelectorAll('#model-form input[type="range"]').forEach(input => input.addEventListener('input', renderModel));
  document.querySelectorAll('.readiness-bars input[type="range"]').forEach(input => input.addEventListener('input', renderReadiness));
  document.getElementById('reset-button')?.addEventListener('click', resetModel);
  document.getElementById('print-button')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderScenarios();
    });
  });
  renderModel();
  renderReadiness();
  renderScenarios();
}

if (typeof document !== 'undefined') initialise();
