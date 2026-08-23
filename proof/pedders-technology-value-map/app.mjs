export const DEFAULT_READINESS = Object.freeze({
  architectureReadiness: 64,
  continuityReadiness: 58,
  dataReadiness: 54,
  serviceReadiness: 67,
  adoptionReadiness: 72,
});

export const READINESS = Object.freeze({
  architectureReadiness: {
    label: 'Architecture and lifecycle ownership',
    action: 'Name every critical platform, business owner, technical owner, lifecycle state, dependency and next decision.',
    weight: 0.22,
  },
  continuityReadiness: {
    label: 'Security, continuity and recovery evidence',
    action: 'Choose one critical service and prove access control, incident ownership, backup, recovery path, failover and latest test result.',
    weight: 0.23,
  },
  dataReadiness: {
    label: 'Data ownership, quality and lineage',
    action: 'Trace one high-value information path end-to-end: source, owner, transformation, quality check, consumer and exception route.',
    weight: 0.20,
  },
  serviceReadiness: {
    label: 'Service visibility and operational measures',
    action: 'Define the few business-facing service levels, incident measures and support signals that operators and executives both trust.',
    weight: 0.18,
  },
  adoptionReadiness: {
    label: 'Change ownership and frontline adoption',
    action: 'Confirm sponsors, manager expectations, training, feedback, support ownership and evidence that the new pattern is independently used.',
    weight: 0.17,
  },
});

export const OPPORTUNITIES = Object.freeze([
  {
    id: 'booking-exception',
    title: 'Booking-to-workshop exception brief',
    group: 'Operations',
    summary: 'Create a human-reviewed brief when digital booking details, vehicle context or store capacity need clarification before workshop action.',
    impact: 5,
    readiness: 4,
    risk: 3,
    measure: 'Exception cycle time, customer re-contact, store edits, first-pass completeness and resolved handoffs.',
    discover: 'Trace booking-to-workshop exceptions and the current approval path.',
  },
  {
    id: 'parts-quality',
    title: 'Parts and fitment data exception detection',
    group: 'Data',
    summary: 'Flag likely catalogue, vehicle-fitment or content inconsistencies for a data owner instead of allowing silent downstream rework.',
    impact: 5,
    readiness: 3,
    risk: 3,
    measure: 'Verified defects, repeat-defect rate, false positives, resolution time and avoided downstream rework.',
    discover: 'Sample one vehicle-to-part journey and map every source, transform, validation and exception owner.',
  },
  {
    id: 'network-brief',
    title: 'Network performance decision brief',
    group: 'Data',
    summary: 'Combine approved service, booking, customer and operational measures into a cited brief that keeps company-owned and franchise context visible.',
    impact: 4,
    readiness: 3,
    risk: 2,
    measure: 'Source coverage, corrections, decision lead time, action completion and store-level confidence.',
    discover: 'Compare one existing network report with the decision, denominator and follow-up evidence leaders actually need.',
  },
  {
    id: 'knowledge-assist',
    title: 'Frontline knowledge and parts-lookup assistant',
    group: 'Operations',
    summary: 'Help staff find approved product, process and troubleshooting information while preserving source links, access rules and expert escalation.',
    impact: 4,
    readiness: 4,
    risk: 3,
    measure: 'Retrieval success, handling time, unsupported-answer rejection, escalation rate and knowledge-owner updates.',
    discover: 'Identify one repeat-question domain, its approved sources, content owner and unsafe-answer boundary.',
  },
  {
    id: 'service-draft',
    title: 'Customer service communication draft',
    group: 'Customer',
    summary: 'Draft clear customer updates from approved case facts for store or service staff to verify, edit and send through existing channels.',
    impact: 4,
    readiness: 3,
    risk: 4,
    measure: 'Response time, edit distance, unsupported claims, escalations, customer follow-up and send approval rate.',
    discover: 'Review one repeatable customer-update workflow and define facts, prohibited promises and the human send authority.',
  },
  {
    id: 'continuity-evidence',
    title: 'Continuity and control evidence assistant',
    group: 'Risk',
    summary: 'Assemble review packs from approved policies, test results, incidents and owners without treating a generated summary as control evidence.',
    impact: 4,
    readiness: 3,
    risk: 3,
    measure: 'Evidence completeness, stale-control catches, owner corrections, overdue actions and audit preparation time.',
    discover: 'Choose one critical service and reconcile its policy, owner, latest recovery test, incidents and open actions.',
  },
]);

const integer = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });

export function calculateReadiness(values = {}) {
  const data = { ...DEFAULT_READINESS, ...values };
  const entries = Object.entries(READINESS);
  const score = Math.round(entries.reduce((sum, [key, config]) => sum + Number(data[key]) * config.weight, 0));
  const constraint = entries.reduce((lowest, current) => Number(data[current[0]]) < Number(data[lowest[0]]) ? current : lowest);
  return { score, constraintKey: constraint[0], constraintValue: Number(data[constraint[0]]) };
}

export function scoreOpportunity(item) {
  return Number((item.impact * 0.42 + item.readiness * 0.33 + (6 - item.risk) * 0.25).toFixed(2));
}

export function classifyOpportunity(item) {
  const score = scoreOpportunity(item);
  if (score >= 4.1 && item.risk <= 3) return 'prove first';
  if (score >= 3.7) return 'investigate';
  return 'hold';
}

function readNumber(id) {
  return Number(document.getElementById(id)?.value ?? 0);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderReadiness() {
  const values = {
    architectureReadiness: readNumber('architecture-readiness'),
    continuityReadiness: readNumber('continuity-readiness'),
    dataReadiness: readNumber('data-readiness'),
    serviceReadiness: readNumber('service-readiness'),
    adoptionReadiness: readNumber('adoption-readiness'),
  };
  for (const [key, value] of Object.entries(values)) {
    const outputId = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-output';
    setText(outputId, integer.format(value));
  }
  const result = calculateReadiness(values);
  const constraint = READINESS[result.constraintKey];
  setText('constraint-name', constraint.label);
  setText('constraint-action', constraint.action);
  setText('readiness-status', `Synthetic score ${result.score}/100. Lowest input ${result.constraintValue}/100.`);
  const score = document.getElementById('readiness-score');
  if (score) {
    score.innerHTML = `<span>${result.score}</span><small>/ 100</small>`;
    score.setAttribute('aria-label', `Synthetic readiness score ${result.score} out of 100`);
    score.dataset.band = result.score >= 75 ? 'strong' : result.score >= 55 ? 'developing' : 'fragile';
  }
}

function opportunityCard(item, selectedId) {
  const selected = item.id === selectedId;
  const score = scoreOpportunity(item);
  return `
    <button class="opportunity-card${selected ? ' is-selected' : ''}" type="button" data-opportunity-id="${item.id}" aria-pressed="${selected}">
      <span>
        <span class="eyebrow">${item.group} · ${classifyOpportunity(item)}</span>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <p><strong>Measure:</strong> ${item.measure}</p>
        <span class="opportunity-meta" aria-label="Opportunity scoring inputs">
          <span>Impact ${item.impact}/5</span>
          <span>Ready ${item.readiness}/5</span>
          <span>Risk ${item.risk}/5</span>
        </span>
      </span>
      <span class="opportunity-score" aria-label="Synthetic priority score ${score} out of 5"><strong>${score}</strong><small>priority</small></span>
    </button>`;
}

let selectedOpportunityId = OPPORTUNITIES[0].id;
let activeFilter = 'All';

function renderOpportunities() {
  const grid = document.getElementById('opportunity-grid');
  if (!grid) return;
  const visible = OPPORTUNITIES
    .filter(item => activeFilter === 'All' || item.group === activeFilter)
    .sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a));
  grid.innerHTML = visible.map(item => opportunityCard(item, selectedOpportunityId)).join('');
  grid.querySelectorAll('[data-opportunity-id]').forEach(button => {
    button.addEventListener('click', () => selectOpportunity(button.dataset.opportunityId));
  });
}

function selectOpportunity(id) {
  const item = OPPORTUNITIES.find(candidate => candidate.id === id);
  if (!item) return;
  selectedOpportunityId = id;
  setText('selected-opportunity-copy', `Selected hypothesis: ${item.title}.`);
  setText('discover-workflow', item.discover);
  renderOpportunities();
}

function resetReadiness() {
  const map = {
    architectureReadiness: 'architecture-readiness',
    continuityReadiness: 'continuity-readiness',
    dataReadiness: 'data-readiness',
    serviceReadiness: 'service-readiness',
    adoptionReadiness: 'adoption-readiness',
  };
  for (const [key, id] of Object.entries(map)) document.getElementById(id).value = DEFAULT_READINESS[key];
  renderReadiness();
}

function initialise() {
  document.querySelectorAll('#readiness-form input[type="range"]').forEach(input => input.addEventListener('input', renderReadiness));
  document.getElementById('reset-button')?.addEventListener('click', resetReadiness);
  document.getElementById('print-button')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderOpportunities();
    });
  });
  renderReadiness();
  renderOpportunities();
}

if (typeof document !== 'undefined') initialise();
