#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ops/pnl-console/index.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'ops/pnl-console/trades.json'), 'utf8'));
const must = (condition, message) => { if (!condition) throw new Error(message); };

must(data.schema_version >= 4, `expected schema v4+, got ${data.schema_version}`);
must(data.truth_summary?.overall_status === 'FAIL', 'wallet truth must remain FAIL while Solana wallet evidence is negative');
must(data.truth_summary?.wallet_profitable === false, 'wallet_profitable must be false');
must(data.truth_summary?.solana_live_delta_lamports < 0, 'Solana live wallet delta must preserve the recorded loss');
must(data.truth_summary?.solana_legacy_fake_wallet_pnl_usd < 0, 'legacy fake wallet PNL must preserve the recorded loss');
must(data.truth_summary?.proxy_evidence_status, 'proxy evidence status missing');

must(Array.isArray(data.strategies) && data.strategies.length >= 25, `expected comprehensive strategy catalog, got ${data.strategies?.length}`);
const ids = new Set(data.strategies.map(row => row.id));
for (const id of [
  'polymarket-sports-100-bankroll',
  'polymarket-btc64-live',
  'polymarket-maker-old-3c-depth',
  'polymarket-politics-momentum-yes',
  'solana-pumpfun-liqmo',
  'solana-flow-dominance-runner-v1',
  'solana-executable-shadow-v5',
  'solana-history-flow-ignition-v5',
  'solana-history-panic-reclaim-v5',
  'solana-degen-paper-live',
]) must(ids.has(id), `missing strategy ${id}`);

for (const row of data.strategies) {
  must(row.id && row.name && row.venue && row.family, `invalid strategy identity ${JSON.stringify(row)}`);
  must(row.lifecycle && row.evidence_class && row.result_status, `strategy metadata incomplete: ${row.id}`);
  must(row.metrics && typeof row.metrics === 'object', `strategy metrics missing: ${row.id}`);
  must(row.truth_note, `truth note missing: ${row.id}`);
}

must(Array.isArray(data.result_log) && data.result_log.length >= 1300, `expected all normalized result rows, got ${data.result_log?.length}`);
must(Array.isArray(data.test_runs) && data.test_runs.length >= 700, `expected comprehensive test runs, got ${data.test_runs?.length}`);
for (const row of data.result_log) {
  must(row.id && row.strategy_id && row.venue && row.mode && row.evidence_class, `invalid result row ${JSON.stringify(row)}`);
  must('timestamp' in row && row.source_family, `result provenance missing: ${row.id}`);
}

must(data.visualizations?.equity_series?.polymarket_live_usd?.length >= 2, 'Polymarket equity series missing');
must(data.visualizations?.equity_series?.solana_live_sol?.length >= 2, 'Solana live equity series missing');
must(data.visualizations?.equity_series?.solana_fake_usd?.length >= 100, 'Solana fake equity series missing');
must(data.visualizations?.strategy_performance?.length >= 10, 'strategy performance visualization data missing');
must(data.visualizations?.evidence_funnel?.length >= 4, 'evidence funnel missing');
must(data.visualizations?.activity_by_day?.length >= 2, 'activity timeline missing');

must(data.data_coverage?.raw_snapshots >= 1_000_000, 'raw snapshot coverage missing');
must(data.data_coverage?.route_probes >= 1_000, 'route-probe coverage missing');
must(data.data_coverage?.strategy_count === data.strategies.length, 'strategy count drift');
must(data.data_coverage?.result_count === data.result_log.length, 'result count drift');

for (const marker of [
  'id="venue-filter"',
  'id="evidence-filter"',
  'id="strategy-search"',
  'id="strategy-grid"',
  'id="result-table-body"',
  'id="wallet-equity-chart"',
  'id="strategy-pnl-chart"',
  'id="evidence-funnel-chart"',
  'id="activity-chart"',
  'data-console-version="20260723-strategy-atlas-v1"',
]) must(html.includes(marker), `HTML missing ${marker}`);

const serialized = JSON.stringify(data).toLowerCase();
for (const forbidden of ['.secrets/', 'private_key', 'seed phrase', 'mnemonic', 'secret_key']) {
  must(!serialized.includes(forbidden), `public data leaks forbidden marker: ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  strategies: data.strategies.length,
  results: data.result_log.length,
  testRuns: data.test_runs.length,
  generated: data.generated_utc,
}, null, 2));
