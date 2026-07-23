#!/usr/bin/env python3
from __future__ import annotations

import csv
import glob
import json
import re
import sqlite3
import subprocess
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path('/home/fiv30nit/.openclaw/workspace/workspaces/michaelcostea-com')
OUT_DIR = ROOT / 'ops' / 'pnl-console'
DATA_PATH = OUT_DIR / 'trades.json'
HOME = Path('/home/fiv30nit')
WORKSPACE = HOME / '.openclaw' / 'workspace'
MICROCAP = WORKSPACE / 'workspaces' / 'microcap-autotrader'
PAPER_GOBLIN = WORKSPACE / 'automation' / 'paper-goblin'

POLYMARKET_LEDGER = HOME / 'polymarket_trades_ledger.jsonl'
POLYMARKET_PAPER_LEDGER = HOME / 'polymarket_paper_ledger_3h_100.csv'
POLYMARKET_BACKTEST_14D = HOME / 'polymarket_backtest_similar_14d_20260702T235057Z.json'
POLYMARKET_GATE_REPLAY = HOME / 'polymarket_gate_replay_backtest_latest.json'
POLYMARKET_POLITICS_BACKTEST = HOME / 'polymarket_politics_price_backtest_latest.json'
POLYMARKET_CALIBRATION = HOME / 'polymarket_calibration_summary.json'
POLYMARKET_MANAGER_STATE = HOME / 'polymarket_positions_state.json'
POLYMARKET_POLITICS_STATE = HOME / 'polymarket_politics_live_learner_state.json'
POLYMARKET_BTC_STATE = HOME / 'polymarket_auto_trade_btc64_state.json'
POLYMARKET_GATE_REPORT = HOME / 'polymarket_auto_entry_last_report.json'
POLYMARKET_INTENTS = HOME / 'polymarket_entry_intents.json'
GENERIC_LIVE = HOME / 'polymarket_position_manager.LIVE'
GENERIC_HALT = HOME / 'polymarket_position_manager.HALT'
GENERIC_ENTRY_HALT = HOME / 'polymarket_position_manager.ENTRY_HALT'
BTC64_STATUS_CMD = ['python3', str(HOME / '.hermes/scripts/polymarket_auto_trade_btc64.py'), '--status-only']
MANAGER_STATUS_CMD = ['python3', str(HOME / '.hermes/scripts/polymarket_position_manager.py'), '--status-only']

TRADE_DATA_DB = MICROCAP / 'state/trade-data/trade_data.sqlite'
LEAGUE_DB = MICROCAP / 'state/paper-data-edge/flow-breadth-strategy-defense.db'
OUTCOME_DB = MICROCAP / 'state/outcome-labeler/pumpfun-outcomes.db'
HISTORICAL_DB = MICROCAP / 'state/historical-library/pumpfun-90d-candidate-features-chunked/pumpfun_90d_candidates.sqlite'
V4_GATE = MICROCAP / 'reports/pumpfun-signals/executable-shadow-gate-latest.json'
V5_GATE = MICROCAP / 'reports/pumpfun-signals/executable-shadow-v5-gate-latest.json'
HISTORY_PORTFOLIO = MICROCAP / 'reports/pumpfun-signals/history-derived-portfolio-latest.json'
EDGE_OPTIMIZER = MICROCAP / 'reports/pumpfun-signals/edge-optimizer-latest.json'
ANTI_PANIC = MICROCAP / 'reports/pumpfun-signals/anti-panic-ablation-latest.json'
PAPER_GOBLIN_LEDGER = PAPER_GOBLIN / 'state/ledger.json'
CRYPTO_AUTOPSY_DIR = MICROCAP / 'runs/autopsy'

ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc'
SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
ARBITRUM_WALLET = '0x22469cBd6035749cfE49c35AafCED9AA4816ead5'
SOLANA_WALLET = '4hmns3tVCdBygLnizG2C4cEhGxEamkeSmaZeyveSaCka'
PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd'


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def safe_float_none(value: Any) -> float | None:
    try:
        return float(value)
    except Exception:
        return None


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text()) if path.exists() else default
    except Exception:
        return default


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.exists():
        return rows
    for line in path.read_text(errors='replace').splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            if isinstance(item, dict):
                rows.append(item)
        except Exception:
            continue
    return rows


def run_json(cmd: list[str], timeout: int = 90) -> dict[str, Any]:
    try:
        proc = subprocess.run(cmd, text=True, capture_output=True, timeout=timeout, check=True)
        payload = json.loads(proc.stdout)
        return payload if isinstance(payload, dict) else {}
    except Exception as exc:
        return {'error': type(exc).__name__, 'message': str(exc)[:240]}


def slug(value: Any) -> str:
    text = re.sub(r'[^a-z0-9]+', '-', str(value or '').lower()).strip('-')
    return text or 'unknown'


def mask(value: Any, left: int = 7, right: int = 5) -> str | None:
    if value is None:
        return None
    text = str(value)
    if len(text) <= left + right + 3:
        return text
    return f'{text[:left]}…{text[-right:]}'


def iso_ts(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat().replace('+00:00', 'Z')
        except Exception:
            return None
    text = str(value).strip()
    if not text:
        return None
    if re.fullmatch(r'\d{8}T\d{6}Z', text):
        try:
            return datetime.strptime(text, '%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')
        except Exception:
            pass
    return text


def sqlite_rows(path: Path, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        conn = sqlite3.connect(f'file:{path}?mode=ro', uri=True)
        conn.row_factory = sqlite3.Row
        rows = [dict(row) for row in conn.execute(query, params)]
        conn.close()
        return rows
    except Exception:
        return []


def rpc_json(url: str, method: str, params: list[Any] | None = None, timeout: int = 20) -> Any:
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []}).encode()
    request = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', 'User-Agent': 'michaelcostea-pnl-console/2.0'})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode('utf-8'))
    if payload.get('error'):
        raise RuntimeError(str(payload['error']))
    return payload.get('result')


def live_prices() -> dict[str, Any]:
    try:
        request = urllib.request.Request(PRICE_URL, headers={'User-Agent': 'michaelcostea-pnl-console/2.0'})
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode('utf-8'))
        return {
            'eth_usd': safe_float_none((payload.get('ethereum') or {}).get('usd')),
            'sol_usd': safe_float_none((payload.get('solana') or {}).get('usd')),
            'source': 'CoinGecko public spot snapshot',
        }
    except Exception as exc:
        return {'eth_usd': None, 'sol_usd': None, 'source': 'unavailable', 'error': type(exc).__name__}


def evm_balance(address: str) -> dict[str, Any]:
    try:
        chain_id = int(rpc_json(ARBITRUM_RPC, 'eth_chainId'), 16)
        wei = int(rpc_json(ARBITRUM_RPC, 'eth_getBalance', [address, 'latest']), 16)
        return {'ok': chain_id == 42161, 'chain_id': chain_id, 'native_balance': wei / 1e18, 'atomic_balance': wei}
    except Exception as exc:
        return {'ok': False, 'error': type(exc).__name__}


def solana_balance(address: str) -> dict[str, Any]:
    try:
        result = rpc_json(SOLANA_RPC, 'getBalance', [address, {'commitment': 'confirmed'}]) or {}
        lamports = safe_int(result.get('value'))
        return {'ok': True, 'native_balance': lamports / 1e9, 'atomic_balance': lamports, 'slot': (result.get('context') or {}).get('slot')}
    except Exception as exc:
        return {'ok': False, 'error': type(exc).__name__}


def base_strategy(strategy_id: str, name: str, venue: str, family: str, lifecycle: str, evidence: str, truth: str, modes: list[str] | None = None) -> dict[str, Any]:
    return {
        'id': strategy_id,
        'name': name,
        'venue': venue,
        'family': family,
        'lifecycle': lifecycle,
        'evidence_class': evidence,
        'result_status': 'no-results',
        'modes': modes or [],
        'variants': [],
        'metrics': {},
        'primary_value': None,
        'primary_unit': None,
        'truth_note': truth,
    }


def seed_strategies() -> dict[str, dict[str, Any]]:
    definitions = [
        ('polymarket-sports-ranked-plays', 'Sports Ranked Plays', 'Polymarket', 'sports probability ranking', 'tested', 'research-signal', 'Candidate ranking only; generated plays are not fills or profit.'),
        ('polymarket-sports-100-bankroll', '$100 Sports Paper Bankroll', 'Polymarket', 'sports bankroll simulation', 'tested', 'paper-settlement', 'Two resolved paper positions; settlement-backed paper result, not live wallet PNL.'),
        ('polymarket-sports-similar-14d', 'Similar-Market Sports 14D Backtest', 'Polymarket', 'sports historical replay', 'tested', 'historical-backtest', 'Small nine-bet retrospective sample; positive result is not live execution evidence.'),
        ('polymarket-top5-edge', 'Top-5 Edge Ranking', 'Polymarket', 'manual edge analysis', 'tested', 'research-signal', 'Five ranked opportunities; no fills and no realized PNL.'),
        ('polymarket-btc64-live', 'BTC64 Fixed-Market Autonomous Trader', 'Polymarket', 'fixed-market event trading', 'retired', 'wallet-executed', 'Wallet-observed realized PNL. One win and one stop loss; strategy retired after event expiry.'),
        ('polymarket-generic-fair-maker', 'Generic Fair-Value Maker', 'Polymarket', 'maker fair-value execution', 'tested', 'wallet-executed', 'Live maker orders were placed and revalidated, but no generic-manager fill reached realized PNL.'),
        ('polymarket-policy-v2-preview', 'Generic Maker Policy V2', 'Polymarket', 'maker gate policy', 'built', 'research-signal', 'Built as a preview/gate policy. No separately attributable executed trade result.'),
        ('polymarket-maker-old-3c-depth', 'Maker Old 3¢ Depth', 'Polymarket', 'saved-book gate replay', 'tested', 'mark-to-market-backtest', 'Intraday saved-book mark-to-market only; maker fill and final settlement not guaranteed.'),
        ('polymarket-diagnostic-ask-edge', 'Diagnostic Ask-Edge Floor', 'Polymarket', 'saved-book gate replay', 'tested', 'mark-to-market-backtest', 'Diagnostic replay lost on average; not execution evidence.'),
        ('polymarket-politics-momentum-yes', 'Politics Momentum YES', 'Polymarket', 'politics/news momentum', 'tested', 'mark-to-market-backtest', 'Price-history mark-to-market only; failed live-readiness criteria.'),
        ('polymarket-politics-momentum-no', 'Politics Momentum NO', 'Polymarket', 'politics/news momentum', 'tested', 'mark-to-market-backtest', 'Only two signals. Positive marks are too concentrated for promotion.'),
        ('polymarket-politics-reversion-yes', 'Politics Reversion YES', 'Polymarket', 'politics/news mean reversion', 'tested', 'mark-to-market-backtest', 'Price-history mark-to-market only; failed live-readiness criteria.'),
        ('polymarket-politics-live-learner', 'Politics Tiny Live Learner', 'Polymarket', 'politics live learner', 'paused', 'wallet-executed', 'Live learner ran with no positions and no realized results.'),
        ('polymarket-calibration-ledger', 'Polymarket Calibration Ledger', 'Polymarket', 'forecast calibration', 'tested', 'calibration', 'No resolved calibration rows yet.'),
        ('solana-launch-survivor', 'Launch Survivor Momentum', 'Solana', 'launch momentum', 'built', 'code-only', 'Strategy implementation exists; no canonical result ledger is attributable to this class.'),
        ('solana-pumpfun-genesis', 'Pump.fun Genesis', 'Solana', 'new-launch state machine', 'built', 'code-only', 'Strategy and monitor exist; sample collector data is not wallet PNL.'),
        ('solana-pumpfun-liqmo', 'Pump.fun LiqMo', 'Solana', 'liquidity momentum', 'tested', 'historical-backtest', 'Oracle-ledger and historical replays are modelled, not wallet execution.'),
        ('solana-degen-paper-live', 'Pump.fun Degen Paper Live', 'Solana', 'fast degen paper wallet', 'tested', 'paper-wallet', 'Fake wallet result. Central ledger is negative after modeled drag.'),
        ('solana-degen-baseline', 'Baseline Degen Live Simulation', 'Solana', 'baseline degen paper variant', 'tested', 'paper-wallet', 'Initial fake live-data simulation baseline; no signing or live orders.'),
        ('solana-orb-breakout', 'Opening-Range Breakout', 'Solana', 'opening range breakout', 'tested', 'paper-wallet', 'Five fake trials; result negative and not promotable.'),
        ('solana-static-runner-milk-best', 'Static Runner Milk', 'Solana', 'runner harvesting', 'tested', 'paper-wallet', 'Five fake trials; one positive trial, negative aggregate.'),
        ('solana-time-bias-loose-trail', 'Time-Bias Loose Trail', 'Solana', 'time-biased trailing exit', 'tested', 'paper-wallet', 'Five fake trials; one positive trial, negative aggregate.'),
        ('solana-fast-dense-no-dump-proxy', 'Fast Dense No-Dump Proxy', 'Solana', 'fast dense continuation', 'tested-live', 'wallet-executed', 'Live wallet-delta records are negative. Proxy net bps never overrides wallet loss.'),
        ('solana-second-chance-moon-watch', 'Second-Chance Moon Watch', 'Solana', 'moon-watch connector', 'tested-live', 'wallet-executed', 'Connector produced ready/reject/result events; wallet result remains negative overall.'),
        ('solana-flow-dominance-runner-v1', 'Flow Dominance Runner V1', 'Solana', 'buyer-flow dominance', 'tested', 'paper-wallet', 'Fake league wallet result is negative.'),
        ('solana-flow-quality-proxy', 'Flow Quality Proxy', 'Solana', 'flow quality', 'tested', 'paper-wallet', 'Fake league wallet result is negative.'),
        ('solana-broad-flow-proxy', 'Broad Flow Proxy', 'Solana', 'broad flow', 'tested', 'paper-wallet', 'Fake league wallet result is negative.'),
        ('solana-whale-few-proxy-scalp', 'Whale-Few Proxy Scalp', 'Solana', 'concentrated-flow scalp', 'tested', 'paper-wallet', 'Fake league wallet result is negative.'),
        ('solana-early-moon-social-confirm-v1', 'Early Moon Social Confirm V1', 'Solana', 'social-confirmed early moon', 'tested', 'paper-wallet', 'Fake league wallet result is negative.'),
        ('solana-winner-clean-social', 'Winner Clean Social', 'Solana', 'winner-derived clean social', 'tested', 'paper-wallet', 'No closed trades in recorded winner-lane generations; inactivity is not validation.'),
        ('solana-winner-low-social-momentum', 'Winner Low-Social Momentum', 'Solana', 'winner-derived momentum', 'tested', 'paper-wallet', 'No closed trades in recorded winner-lane generations; inactivity is not validation.'),
        ('solana-winner-whale-burst', 'Winner Whale Burst', 'Solana', 'winner-derived whale burst', 'tested', 'paper-wallet', 'No closed trades in recorded winner-lane generations; inactivity is not validation.'),
        ('solana-exploration-clean-probe', 'Exploration Clean Probe', 'Solana', 'controlled exploration', 'tested', 'paper-wallet', 'Exploration-only lane; excluded from promotion fitness without sample breadth.'),
        ('solana-executable-shadow-v4', 'Executable Momentum Confirmation V4', 'Solana', 'exact-quote confirmation', 'superseded', 'exact-quote-shadow', 'One winning exact-quote close, but concentration and breadth gates failed.'),
        ('solana-executable-shadow-v5', 'Executable Momentum Multiwatch V5', 'Solana', 'exact-quote confirmation', 'tested', 'exact-quote-shadow', 'Current generation wallet is negative; promotion gate failed.'),
        ('solana-exact-controlled-continuation-v2', 'Controlled Continuation V2 Exact Shadow', 'Solana', 'exact-quote continuation', 'tested', 'exact-quote-shadow', 'Exact-quote shadow result only; no signing or orders.'),
        ('solana-exact-flow-ignition-v3', 'Flow Ignition V3 Exact Shadow', 'Solana', 'exact-quote ignition', 'tested', 'exact-quote-shadow', 'Exact-quote shadow history across mixed sessions; no live promotion.'),
        ('solana-exact-flow-ignition-v5', 'Flow Ignition V5 Exact Shadow', 'Solana', 'exact-quote ignition', 'tested', 'exact-quote-shadow', 'Exact-quote shadow history; current V5 generation gate remains failed.'),
        ('solana-exact-panic-reclaim-v3', 'Panic Reclaim V3 Exact Shadow', 'Solana', 'exact-quote reclaim', 'tested', 'exact-quote-shadow', 'Watch evidence only; no recorded exact-quote close.'),
        ('solana-exact-panic-reclaim-v5', 'Panic Reclaim V5 Exact Shadow', 'Solana', 'exact-quote reclaim', 'tested', 'exact-quote-shadow', 'Exact-quote shadow history; no live promotion.'),
        ('solana-edge-optimizer', 'Deterministic Edge Optimizer', 'Solana', 'walk-forward rule optimizer', 'tested', 'proxy-backtest', 'Candidate rules remain discovery-only; horizon exit quotes are absent.'),
        ('solana-history-flow-ignition-v5', 'History-Derived Flow Ignition V5', 'Solana', 'history-derived causal portfolio', 'tested', 'proxy-backtest', 'Retrospective proxy-positive result; not executable wallet profit.'),
        ('solana-history-panic-reclaim-v5', 'History-Derived Panic Reclaim V5', 'Solana', 'history-derived causal portfolio', 'tested', 'proxy-backtest', 'Retrospective proxy-positive result; not executable wallet profit.'),
        ('arbitrum-weth-usdc-canary', 'Arbitrum WETH/USDC Canary', 'Arbitrum', 'DEX route canary', 'retired', 'wallet-executed', 'Two live round trips proved plumbing; gas delta is not comparable to USD strategy PNL.'),
        ('arbitrum-dexscreener-shadow', 'Arbitrum DexScreener Wallet Shadow', 'Arbitrum', 'DEX pair shadow', 'tested', 'paper-wallet', 'Shadow-wallet evidence only; no signing.'),
        ('hyperliquid-momentum-funding', 'Hyperliquid Momentum + Funding', 'Hyperliquid', 'perpetual momentum/funding', 'built', 'code-only', 'Strategy class exists; no canonical result ledger found.'),
    ]
    return {item[0]: base_strategy(*item) for item in definitions}


LEAGUE_IDS = {
    'flow_dominance_runner_v1': 'solana-flow-dominance-runner-v1',
    'flow_quality_proxy': 'solana-flow-quality-proxy',
    'fast_dense_no_dump_proxy': 'solana-fast-dense-no-dump-proxy',
    'broad_flow_proxy': 'solana-broad-flow-proxy',
    'whale_few_proxy_scalp': 'solana-whale-few-proxy-scalp',
    'early_moon_social_confirm_v1': 'solana-early-moon-social-confirm-v1',
    'winner_clean_social': 'solana-winner-clean-social',
    'winner_low_social_momentum': 'solana-winner-low-social-momentum',
    'winner_whale_burst': 'solana-winner-whale-burst',
    'exploration_clean_probe': 'solana-exploration-clean-probe',
}

EXACT_IDS = {
    'controlled_continuation_v2': 'solana-exact-controlled-continuation-v2',
    'flow_ignition_v3': 'solana-exact-flow-ignition-v3',
    'flow_ignition_v5': 'solana-exact-flow-ignition-v5',
    'panic_reclaim_v3': 'solana-exact-panic-reclaim-v3',
    'panic_reclaim_v5': 'solana-exact-panic-reclaim-v5',
}


def set_result(strategy: dict[str, Any], metrics: dict[str, Any], primary: float | None, unit: str | None, status: str, variants: list[str] | None = None) -> None:
    strategy['metrics'].update({key: value for key, value in metrics.items() if value is not None})
    strategy['primary_value'] = primary
    strategy['primary_unit'] = unit
    strategy['result_status'] = status
    if variants:
        strategy['variants'] = sorted(set(strategy.get('variants', [])) | {str(value) for value in variants if value})


def paper_goblin_rows() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    ledger = load_json(PAPER_GOBLIN_LEDGER, {})
    closed = ledger.get('closed_positions') if isinstance(ledger, dict) else []
    if not isinstance(closed, list):
        closed = []
    realized = sum(safe_float(row.get('realized_pnl_usd')) for row in closed)
    return {
        'mode': 'paper-only-live-data',
        'balance_usd': safe_float_none(ledger.get('balance_usd')) if isinstance(ledger, dict) else None,
        'equity_usd': safe_float_none(ledger.get('equity_usd')) if isinstance(ledger, dict) else None,
        'closed_trades': len(closed),
        'realized_pnl_usd': round(realized, 6),
        'winning_trades': sum(safe_float(row.get('realized_pnl_usd')) > 0 for row in closed),
        'losing_trades': sum(safe_float(row.get('realized_pnl_usd')) < 0 for row in closed),
    }, closed


def arbitrum_canaries() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not CRYPTO_AUTOPSY_DIR.exists():
        return rows
    for path in sorted(CRYPTO_AUTOPSY_DIR.glob('apt-*.json')):
        record = load_json(path, {})
        if record.get('action') != 'autonomous_cycle_summary':
            continue
        quote = record.get('quote') or {}
        before = ((record.get('pnl_snapshot') or {}).get('before') or {})
        after = ((record.get('pnl_snapshot') or {}).get('after') or {})
        if not quote.get('cycle'):
            continue
        delta_eth = (safe_float(after.get('eth')) - safe_float(before.get('eth'))) / 1e18
        rows.append({
            'id': f"arbitrum-canary-{quote.get('cycle')}-{slug(record.get('timestamp_utc'))}",
            'timestamp': iso_ts(record.get('timestamp_utc')),
            'strategy_id': 'arbitrum-weth-usdc-canary',
            'venue': 'Arbitrum',
            'mode': 'live-wallet',
            'evidence_class': 'wallet-executed',
            'source_family': 'autonomous canary autopsy',
            'market': 'WETH/USDC 0.05% route',
            'symbol': 'WETH/USDC',
            'status': quote.get('exit_reason') or 'closed',
            'pnl_eth': round(delta_eth, 18),
            'pnl_usd': None,
            'pnl_lamports': None,
            'net_bps': None,
            'truth': 'Live route canary; ETH wallet delta includes gas and roundtrip cost.',
        })
    return rows


def build_snapshot() -> dict[str, Any]:
    generated = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    previous = load_json(DATA_PATH, {})
    strategies = seed_strategies()
    result_log: list[dict[str, Any]] = []
    test_runs: list[dict[str, Any]] = []

    # Polymarket wallet and status truth.
    live = run_json(BTC64_STATUS_CMD)
    manager_live = run_json(MANAGER_STATUS_CMD)
    if live.get('error'):
        live = (previous.get('runtime') or {}).get('polymarket_status') or {}
    btc_state = load_json(POLYMARKET_BTC_STATE, {})
    pm_trades = load_jsonl(POLYMARKET_LEDGER)
    pm_pnl = round(sum(safe_float(row.get('net_profit_pusd')) for row in pm_trades), 6)
    pm_wins = sum(safe_float(row.get('net_profit_pusd')) > 0 for row in pm_trades)
    pm_losses = sum(safe_float(row.get('net_profit_pusd')) < 0 for row in pm_trades)
    set_result(strategies['polymarket-btc64-live'], {'trades': len(pm_trades), 'wins': pm_wins, 'losses': pm_losses, 'pnl_usd': pm_pnl, 'win_rate': round(pm_wins / len(pm_trades), 4) if pm_trades else None}, pm_pnl, 'USD', 'positive' if pm_pnl > 0 else 'negative')
    pm_equity = [{'timestamp': pm_trades[0].get('opened_utc') if pm_trades else generated, 'value': 0.0}]
    cumulative = 0.0
    for index, row in enumerate(sorted(pm_trades, key=lambda item: str(item.get('closed_utc') or ''))):
        cumulative += safe_float(row.get('net_profit_pusd'))
        pm_equity.append({'timestamp': iso_ts(row.get('closed_utc')), 'value': round(cumulative, 6)})
        result_log.append({
            'id': str(row.get('id') or f'pm-live-{index}'), 'timestamp': iso_ts(row.get('closed_utc')), 'strategy_id': 'polymarket-btc64-live',
            'venue': 'Polymarket', 'mode': 'live-wallet', 'evidence_class': 'wallet-executed', 'source_family': 'deposit-wallet trade ledger',
            'market': row.get('market'), 'symbol': 'BTC event', 'status': row.get('status'), 'pnl_usd': safe_float_none(row.get('net_profit_pusd')),
            'pnl_lamports': None, 'net_bps': safe_float(row.get('roi_pct')) * 100 if row.get('roi_pct') is not None else None,
            'truth': 'Observed deposit-wallet delta.',
        })

    # Sports paper settlement and replay evidence.
    paper_rows: list[dict[str, Any]] = []
    if POLYMARKET_PAPER_LEDGER.exists():
        with POLYMARKET_PAPER_LEDGER.open(newline='') as handle:
            paper_rows = list(csv.DictReader(handle))
    paper_pnl = round(sum(safe_float(row.get('paper_pnl')) for row in paper_rows), 6)
    paper_wins = sum(str(row.get('paper_status')).upper().endswith('WIN') for row in paper_rows)
    set_result(strategies['polymarket-sports-100-bankroll'], {'trades': len(paper_rows), 'wins': paper_wins, 'losses': len(paper_rows) - paper_wins, 'pnl_usd': paper_pnl, 'roi_pct': round(paper_pnl, 4)}, paper_pnl, 'USD', 'positive' if paper_pnl > 0 else 'negative')
    for index, row in enumerate(paper_rows):
        result_log.append({'id': f'pm-paper-{index}-{slug(row.get("paper_id"))}', 'timestamp': iso_ts(row.get('updated_utc')), 'strategy_id': 'polymarket-sports-100-bankroll', 'venue': 'Polymarket', 'mode': 'paper-settlement', 'evidence_class': 'paper-settlement', 'source_family': '3h $100 paper ledger', 'market': row.get('question'), 'symbol': row.get('matchup'), 'status': row.get('paper_status'), 'pnl_usd': safe_float_none(row.get('paper_pnl')), 'pnl_lamports': None, 'net_bps': safe_float(row.get('paper_pnl')) * 100, 'truth': 'Resolved paper position; no live order.'})
    test_runs.append({'id': 'pm-paper-100-run', 'timestamp': iso_ts(paper_rows[-1].get('updated_utc')) if paper_rows else None, 'strategy_id': 'polymarket-sports-100-bankroll', 'venue': 'Polymarket', 'mode': 'paper-settlement', 'status': 'completed', 'trades': len(paper_rows), 'pnl_usd': paper_pnl, 'pnl_lamports': None, 'source_family': '3h $100 paper ledger'})

    sports_14d = load_json(POLYMARKET_BACKTEST_14D, {})
    daily_split = (((sports_14d.get('summary') or {}).get('daily_100_bankroll_split')) or {})
    set_result(strategies['polymarket-sports-similar-14d'], {'trades': (sports_14d.get('summary') or {}).get('qualifying_settled_bets'), 'days': daily_split.get('days'), 'pnl_usd': daily_split.get('pnl'), 'roi_pct': safe_float(daily_split.get('roi')) * 100 if daily_split.get('roi') is not None else None}, safe_float_none(daily_split.get('pnl')), 'USD', 'positive' if safe_float(daily_split.get('pnl')) > 0 else 'negative')
    test_runs.append({'id': 'pm-sports-14d', 'timestamp': '2026-07-02T23:50:57Z', 'strategy_id': 'polymarket-sports-similar-14d', 'venue': 'Polymarket', 'mode': 'historical-backtest', 'status': 'completed', 'trades': (sports_14d.get('summary') or {}).get('qualifying_settled_bets'), 'pnl_usd': daily_split.get('pnl'), 'pnl_lamports': None, 'source_family': 'similar-market 14d replay'})

    plays_files = sorted(HOME.glob('polymarket_plays_*.json'), key=lambda path: path.stat().st_mtime)
    latest_plays = load_json(plays_files[-1], {}) if plays_files else {}
    set_result(strategies['polymarket-sports-ranked-plays'], {'runs': len(plays_files), 'latest_candidates': len(latest_plays.get('all_candidates') or []), 'latest_ranked': len(latest_plays.get('rows') or [])}, None, None, 'coverage-only')
    edge_files = sorted(HOME.glob('polymarket_top5_edge_analysis_*.json'), key=lambda path: path.stat().st_mtime)
    edge = load_json(edge_files[-1], {}) if edge_files else {}
    set_result(strategies['polymarket-top5-edge'], {'runs': len(edge_files), 'candidates': len(edge.get('rows') or [])}, None, None, 'coverage-only')

    gate_replay = load_json(POLYMARKET_GATE_REPLAY, {})
    for key, strategy_id in [('maker_old_3c_depth', 'polymarket-maker-old-3c-depth'), ('diagnostic_ask_edge_floor', 'polymarket-diagnostic-ask-edge')]:
        metric = (gate_replay.get('summary') or {}).get(key) or {}
        avg_30m = safe_float_none(metric.get('avg_pnl_30m'))
        set_result(strategies[strategy_id], {'signals': metric.get('signals'), 'unique_tokens': metric.get('unique_tokens'), 'avg_move_30m': avg_30m, 'win_rate_30m': metric.get('win_rate_30m'), 'touch_limit_rate_90m': metric.get('touch_limit_rate_90m')}, avg_30m, 'price move', 'positive' if safe_float(avg_30m) > 0 else 'negative')
        test_runs.append({'id': f'pm-gate-replay-{key}', 'timestamp': iso_ts(gate_replay.get('created_utc')), 'strategy_id': strategy_id, 'venue': 'Polymarket', 'mode': 'mark-to-market-backtest', 'status': 'completed', 'trades': metric.get('signals'), 'pnl_usd': None, 'pnl_lamports': None, 'source_family': 'saved CLOB replay'})

    politics = load_json(POLYMARKET_POLITICS_BACKTEST, {})
    for key, strategy_id in [('momentum_yes', 'polymarket-politics-momentum-yes'), ('momentum_no', 'polymarket-politics-momentum-no'), ('reversion_yes', 'polymarket-politics-reversion-yes')]:
        metric = (politics.get('summary') or {}).get(key) or {}
        avg_24h = safe_float_none(metric.get('avg_pnl_24h'))
        set_result(strategies[strategy_id], {'signals': metric.get('signals'), 'markets': metric.get('unique_markets'), 'avg_move_24h': avg_24h, 'avg_move_72h': metric.get('avg_pnl_72h'), 'win_rate_24h': metric.get('win_rate_24h')}, avg_24h, 'price move', 'positive' if safe_float(avg_24h) > 0 else 'negative')
        test_runs.append({'id': f'pm-politics-{key}', 'timestamp': iso_ts(politics.get('created_utc')), 'strategy_id': strategy_id, 'venue': 'Polymarket', 'mode': 'mark-to-market-backtest', 'status': 'completed', 'trades': metric.get('signals'), 'pnl_usd': None, 'pnl_lamports': None, 'source_family': 'politics price-history replay'})

    manager_state = load_json(POLYMARKET_MANAGER_STATE, {})
    manager_positions = list((manager_state.get('positions') or {}).values()) if isinstance(manager_state, dict) else []
    placed = sum(1 for row in manager_positions for event in (row.get('history') or []) if event.get('event') == 'entry_order_placed')
    filled = sum(safe_float((row.get('entry') or {}).get('filled_size')) > 0 for row in manager_positions)
    set_result(strategies['polymarket-generic-fair-maker'], {'positions_tracked': len(manager_positions), 'orders_placed': placed, 'filled_positions': filled, 'realized_trades': 0}, None, None, 'no-fill')
    set_result(strategies['polymarket-policy-v2-preview'], {'gate_candidates': (load_json(POLYMARKET_GATE_REPORT, {}) or {}).get('candidate_count'), 'intents': len((load_json(POLYMARKET_INTENTS, {}) or {}).get('intents') or [])}, None, None, 'coverage-only')
    politics_state = load_json(POLYMARKET_POLITICS_STATE, {})
    set_result(strategies['polymarket-politics-live-learner'], {'positions': len((politics_state.get('positions') or {})), 'stats_rows': len((politics_state.get('stats') or {}))}, None, None, 'no-trades')
    calibration = load_json(POLYMARKET_CALIBRATION, {})
    set_result(strategies['polymarket-calibration-ledger'], {'resolved_rows': calibration.get('resolved_count', 0)}, None, None, 'coverage-only')

    # Solana strategy league: all generations, lanes and fake closes.
    league_groups = sqlite_rows(LEAGUE_DB, """select strategy,count(*) lane_runs,sum(closed) closed,round(sum(pnl_usd),6) pnl_usd,avg(win_rate) avg_win_rate,min(generation) first_generation,max(generation) last_generation,min(ts) first_ts,max(ts) last_ts from lane_runs group by strategy order by strategy""")
    for row in league_groups:
        name = str(row.get('strategy') or 'unknown')
        strategy_id = LEAGUE_IDS.get(name)
        if not strategy_id:
            strategy_id = f'solana-league-{slug(name)}'
            strategies[strategy_id] = base_strategy(strategy_id, name.replace('_', ' ').title(), 'Solana', 'autonomous strategy league', 'tested', 'paper-wallet', 'Fake strategy-league evidence; no signing or real orders.')
            LEAGUE_IDS[name] = strategy_id
        pnl = safe_float_none(row.get('pnl_usd'))
        set_result(strategies[strategy_id], {'lane_runs': row.get('lane_runs'), 'trades': row.get('closed'), 'pnl_usd': pnl, 'avg_win_rate': row.get('avg_win_rate'), 'first_generation': row.get('first_generation'), 'last_generation': row.get('last_generation')}, pnl, 'USD', 'positive' if safe_float(pnl) > 0 else ('negative' if safe_float(pnl) < 0 else 'no-trades'))

    lane_runs = sqlite_rows(LEAGUE_DB, 'select id,generation,ts,lane_id,strategy,origin,run_id,signals,closed,pnl_usd,final_equity_usd,avg_net_bps,win_rate,score from lane_runs order by ts,id')
    for row in lane_runs:
        strategy_id = LEAGUE_IDS.get(str(row.get('strategy')), f"solana-league-{slug(row.get('strategy'))}")
        test_runs.append({'id': f"league-{row.get('id')}", 'timestamp': iso_ts(row.get('ts')), 'strategy_id': strategy_id, 'venue': 'Solana', 'mode': 'paper-league', 'status': 'completed', 'trades': row.get('closed'), 'signals': row.get('signals'), 'pnl_usd': safe_float_none(row.get('pnl_usd')), 'pnl_lamports': None, 'generation': row.get('generation'), 'variant': row.get('lane_id'), 'source_family': 'flow-breadth strategy league'})

    league_sells = sqlite_rows(LEAGUE_DB, """select id,generation,ts,lane_id,strategy,run_id,mint,symbol,name,hold_s,net_bps,pnl_usd,reason,notional from trade_events where event='FAKE_SELL' order by ts,id""")
    fake_equity = [{'timestamp': iso_ts(league_sells[0].get('ts')) if league_sells else generated, 'value': 0.0}]
    fake_cumulative = 0.0
    for row in league_sells:
        strategy_id = LEAGUE_IDS.get(str(row.get('strategy')), f"solana-league-{slug(row.get('strategy'))}")
        pnl = safe_float_none(row.get('pnl_usd'))
        fake_cumulative += pnl or 0
        fake_equity.append({'timestamp': iso_ts(row.get('ts')), 'value': round(fake_cumulative, 6)})
        result_log.append({'id': f"league-sell-{row.get('id')}", 'timestamp': iso_ts(row.get('ts')), 'strategy_id': strategy_id, 'venue': 'Solana', 'mode': 'paper-league', 'evidence_class': 'paper-wallet', 'source_family': 'flow-breadth strategy league', 'market': row.get('name') or row.get('symbol') or mask(row.get('mint')), 'symbol': row.get('symbol'), 'status': row.get('reason') or 'closed', 'pnl_usd': pnl, 'pnl_lamports': None, 'net_bps': safe_float_none(row.get('net_bps')), 'truth': 'Fake wallet close; fees modeled, no signing.', 'generation': row.get('generation')})

    # Central trade-data DB: paper degen, live wallet attempts/results, connector results.
    strategy_runs = sqlite_rows(TRADE_DATA_DB, 'select run_id,created_ts,updated_ts,mode,strategy,variant,status from strategy_runs order by created_ts,run_id')
    central_strategy_variants: defaultdict[str, set[str]] = defaultdict(set)
    for row in strategy_runs:
        name = str(row.get('strategy') or 'unknown')
        if name == 'pumpfun_degen_paper_live':
            strategy_id = 'solana-degen-paper-live'
        elif name in {'live_fast_dense_trade_once', 'fast_dense_no_dump_proxy'}:
            strategy_id = 'solana-fast-dense-no-dump-proxy'
        else:
            strategy_id = f'solana-runtime-{slug(name)}'
            if strategy_id not in strategies:
                strategies[strategy_id] = base_strategy(strategy_id, name.replace('_', ' ').title(), 'Solana', 'runtime strategy', 'tested', 'wallet-executed' if str(row.get('mode')).startswith('live') else 'paper-wallet', 'Runtime/test evidence; inspect result status and wallet delta.')
        central_strategy_variants[strategy_id].add(str(row.get('variant') or 'default'))
        test_runs.append({'id': f"trade-db-{slug(row.get('run_id'))}", 'timestamp': iso_ts(row.get('created_ts')), 'strategy_id': strategy_id, 'venue': 'Solana', 'mode': row.get('mode'), 'status': row.get('status'), 'trades': None, 'pnl_usd': None, 'pnl_lamports': None, 'variant': row.get('variant'), 'source_family': 'central trade-data DB'})
    for strategy_id, variants in central_strategy_variants.items():
        strategies[strategy_id]['variants'] = sorted(variants)

    central_results = sqlite_rows(TRADE_DATA_DB, """select event_id,run_id,ts,mode,event_type,mint,symbol,strategy,variant,outcome_json,pnl_usd,pnl_lamports,net_bps,wallet_delta_lamports from trade_events where event_type in ('FAKE_SELL','LIVE_TRADE_RESULT','SECOND_CHANCE_LIVE_RESULT') order by ts,event_id""")
    sol_live_equity = [{'timestamp': iso_ts(central_results[0].get('ts')) if central_results else generated, 'value': 0.0}]
    live_cumulative_lamports = 0
    fake_degen_pnl = 0.0
    fake_degen_sells = 0
    live_result_count = 0
    live_nonzero = 0
    for row in central_results:
        event_type = str(row.get('event_type'))
        if event_type == 'FAKE_SELL':
            strategy_id = 'solana-degen-paper-live'
            evidence = 'paper-wallet'
            fake_degen_pnl += safe_float(row.get('pnl_usd'))
            fake_degen_sells += 1
        elif event_type == 'SECOND_CHANCE_LIVE_RESULT':
            strategy_id = 'solana-second-chance-moon-watch'
            evidence = 'wallet-executed'
            live_result_count += 1
        else:
            strategy_id = 'solana-fast-dense-no-dump-proxy'
            evidence = 'wallet-executed'
            live_result_count += 1
        delta = safe_int(row.get('wallet_delta_lamports')) if row.get('wallet_delta_lamports') is not None else None
        if delta:
            live_nonzero += 1
            live_cumulative_lamports += delta
            sol_live_equity.append({'timestamp': iso_ts(row.get('ts')), 'value': round(live_cumulative_lamports / 1e9, 9)})
        try:
            outcome = json.loads(row.get('outcome_json') or '{}')
        except Exception:
            outcome = {}
        status = outcome.get('status') or outcome.get('exit_reason') or event_type.lower()
        result_log.append({'id': f"central-{slug(row.get('event_id'))}", 'timestamp': iso_ts(row.get('ts')), 'strategy_id': strategy_id, 'venue': 'Solana', 'mode': row.get('mode'), 'evidence_class': evidence, 'source_family': 'central trade-data DB', 'market': row.get('symbol') or mask(row.get('mint')) or row.get('variant'), 'symbol': row.get('symbol'), 'status': status, 'pnl_usd': safe_float_none(row.get('pnl_usd')), 'pnl_lamports': delta if evidence == 'wallet-executed' else safe_int(row.get('pnl_lamports')) if row.get('pnl_lamports') is not None else None, 'net_bps': safe_float_none(row.get('net_bps')), 'truth': 'Wallet delta is authoritative.' if evidence == 'wallet-executed' else 'Fake wallet close; no signing.', 'variant': row.get('variant')})
    set_result(strategies['solana-degen-paper-live'], {'trades': fake_degen_sells, 'pnl_usd': round(fake_degen_pnl, 6)}, round(fake_degen_pnl, 6), 'USD', 'negative' if fake_degen_pnl < 0 else 'positive')
    set_result(strategies['solana-fast-dense-no-dump-proxy'], {'runtime_results': live_result_count, 'nonzero_wallet_deltas': live_nonzero, 'wallet_delta_lamports': live_cumulative_lamports, 'wallet_delta_sol': round(live_cumulative_lamports / 1e9, 9)}, round(live_cumulative_lamports / 1e9, 9), 'SOL', 'negative' if live_cumulative_lamports < 0 else 'positive', sorted(central_strategy_variants.get('solana-fast-dense-no-dump-proxy', set())))

    # Every named paper-degen trial variant becomes visible and every trial becomes a test-run row.
    trial_summary_files = sorted((MICROCAP / 'state/paper-degen/trials').glob('*/summary.json'))
    variant_latest: dict[str, dict[str, Any]] = {}
    known_trial_ids = {'baseline_live_sim': 'solana-degen-baseline', 'static_runner_milk_best': 'solana-static-runner-milk-best', 'time_bias_loose_trail': 'solana-time-bias-loose-trail'}
    for path in trial_summary_files:
        data = load_json(path, {})
        label = str(data.get('variant') or data.get('config') or re.sub(r'^\d{8}T\d{6}Z-(?:auto-)?', '', path.parent.name))
        if re.fullmatch(r'\d{8}T\d{6}Z', label):
            label = 'baseline_live_sim'
        strategy_id = known_trial_ids.get(label)
        if 'orb' in label.lower():
            strategy_id = 'solana-orb-breakout'
        if not strategy_id:
            strategy_id = f'solana-degen-variant-{slug(label)}'
            if strategy_id not in strategies:
                strategies[strategy_id] = base_strategy(strategy_id, label.replace('_', ' ').title(), 'Solana', 'degen paper variant', 'tested', 'paper-wallet', 'Fake degen trial variant; no signing or live orders.')
        variant_latest[strategy_id] = data
        for trial in data.get('trials') or []:
            test_runs.append({'id': f"degen-trial-{slug(path.parent.name)}-{trial.get('trial')}", 'timestamp': datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat().replace('+00:00', 'Z'), 'strategy_id': strategy_id, 'venue': 'Solana', 'mode': 'paper-wallet-trial', 'status': trial.get('halt_reason') or 'completed', 'trades': trial.get('closed_trades'), 'pnl_usd': trial.get('pnl_usd_marked'), 'pnl_lamports': None, 'variant': label, 'source_family': 'paper-degen trial summary'})
    for strategy_id, data in variant_latest.items():
        avg_pnl = safe_float_none(data.get('avg_pnl_usd'))
        set_result(strategies[strategy_id], {'trials': data.get('trial_count'), 'positive_trials': data.get('positive_trials'), 'trades': data.get('closed_total'), 'avg_pnl_usd': avg_pnl, 'median_pnl_usd': data.get('median_pnl_usd'), 'win_rate': data.get('win_rate_total')}, avg_pnl, 'USD avg/trial', 'positive' if safe_float(avg_pnl) > 0 else ('negative' if safe_float(avg_pnl) < 0 else 'no-trades'), [str(data.get('variant') or data.get('config') or '')])

    # Exact-quote outcome DB: sessions, watches, and every close.
    session_rows = sqlite_rows(OUTCOME_DB, 'select session_id,started_at,ended_at,status from sessions order by started_at,session_id')
    for row in session_rows:
        test_runs.append({'id': f"outcome-{slug(row.get('session_id'))}", 'timestamp': iso_ts(row.get('started_at')), 'strategy_id': 'solana-executable-shadow-v5', 'venue': 'Solana', 'mode': 'exact-quote-shadow-session', 'status': row.get('status'), 'trades': None, 'pnl_usd': None, 'pnl_lamports': None, 'source_family': 'outcome-labeler session DB'})
    exact_groups = sqlite_rows(OUTCOME_DB, 'select strategy,count(*) trades,sum(pnl_lamports) pnl_lamports,avg(pnl_bps) avg_pnl_bps,min(decision_ts) first_ts,max(exit_ts) last_ts from executable_shadow_trades group by strategy')
    watch_groups = sqlite_rows(OUTCOME_DB, 'select strategy,count(*) watches,sum(case when outcome=\'confirmed_entry\' then 1 else 0 end) confirmations from executable_shadow_watches group by strategy')
    watch_by_name = {str(row.get('strategy')): row for row in watch_groups}
    for row in exact_groups:
        name = str(row.get('strategy'))
        strategy_id = EXACT_IDS.get(name)
        if not strategy_id:
            strategy_id = f'solana-exact-{slug(name)}'
            strategies[strategy_id] = base_strategy(strategy_id, name.replace('_', ' ').title(), 'Solana', 'exact-quote shadow', 'tested', 'exact-quote-shadow', 'Exact-quote shadow only; no signing or orders.')
            EXACT_IDS[name] = strategy_id
        pnl_lamports = safe_int(row.get('pnl_lamports'))
        watches = watch_by_name.get(name) or {}
        set_result(strategies[strategy_id], {'trades': row.get('trades'), 'watches': watches.get('watches'), 'confirmations': watches.get('confirmations'), 'pnl_lamports': pnl_lamports, 'pnl_sol': round(pnl_lamports / 1e9, 9), 'avg_pnl_bps': row.get('avg_pnl_bps')}, round(pnl_lamports / 1e9, 9), 'SOL', 'positive' if pnl_lamports > 0 else 'negative')
    for name, watches in watch_by_name.items():
        if name in EXACT_IDS and not strategies[EXACT_IDS[name]]['metrics']:
            set_result(strategies[EXACT_IDS[name]], {'trades': 0, 'watches': watches.get('watches'), 'confirmations': watches.get('confirmations'), 'pnl_lamports': 0}, 0.0, 'SOL', 'no-trades')

    exact_trades = sqlite_rows(OUTCOME_DB, 'select session_id,mint,decision_ts,exit_ts,strategy,horizon_s,pnl_lamports,pnl_bps,reason from executable_shadow_trades order by decision_ts,mint')
    for index, row in enumerate(exact_trades):
        strategy_id = EXACT_IDS.get(str(row.get('strategy')), f"solana-exact-{slug(row.get('strategy'))}")
        result_log.append({'id': f"exact-{index}-{slug(row.get('session_id'))}-{slug(mask(row.get('mint')))}", 'timestamp': iso_ts(row.get('exit_ts')), 'strategy_id': strategy_id, 'venue': 'Solana', 'mode': 'exact-quote-shadow', 'evidence_class': 'exact-quote-shadow', 'source_family': 'outcome-labeler exact trade DB', 'market': mask(row.get('mint')), 'symbol': None, 'status': row.get('reason'), 'pnl_usd': None, 'pnl_lamports': safe_int(row.get('pnl_lamports')), 'net_bps': safe_float_none(row.get('pnl_bps')), 'truth': 'Fresh quoted shadow close; no signing or orders.'})

    v4 = load_json(V4_GATE, {})
    v4_pnl = safe_int(v4.get('wallet_realized_pnl_lamports'))
    set_result(strategies['solana-executable-shadow-v4'], {'sessions': v4.get('independent_sessions'), 'zero_trade_sessions': v4.get('zero_trade_sessions'), 'trades': v4.get('closed_trades'), 'wins': v4.get('wins'), 'losses': v4.get('losses'), 'wallet_pnl_lamports': v4_pnl, 'wallet_pnl_pct': v4.get('wallet_realized_pnl_pct'), 'promotion_candidate': v4.get('promotion_candidate')}, round(v4_pnl / 1e9, 9), 'SOL', 'positive-but-blocked' if v4_pnl > 0 else 'negative')
    v5 = load_json(V5_GATE, {})
    v5_pnl = safe_int(v5.get('wallet_realized_pnl_lamports'))
    set_result(strategies['solana-executable-shadow-v5'], {'sessions': v5.get('independent_sessions'), 'zero_trade_sessions': v5.get('zero_trade_sessions'), 'trades': v5.get('closed_trades'), 'wins': v5.get('wins'), 'losses': v5.get('losses'), 'watches': v5.get('shadow_watches'), 'confirmations': v5.get('shadow_confirmations'), 'wallet_pnl_lamports': v5_pnl, 'wallet_pnl_pct': v5.get('wallet_realized_pnl_pct'), 'promotion_candidate': v5.get('promotion_candidate')}, round(v5_pnl / 1e9, 9), 'SOL', 'negative' if v5_pnl < 0 else 'positive-but-blocked')

    history = load_json(HISTORY_PORTFOLIO, {})
    for key, strategy_id in [('flow_ignition_v5', 'solana-history-flow-ignition-v5'), ('panic_reclaim_v5', 'solana-history-panic-reclaim-v5')]:
        record = (history.get('strategies') or {}).get(key) or {}
        test_metric = record.get('test') or {}
        set_result(strategies[strategy_id], {'horizon_s': record.get('horizon_s'), 'test_trades': test_metric.get('trades'), 'test_wins': test_metric.get('wins'), 'test_losses': test_metric.get('losses'), 'test_pnl_bps': test_metric.get('pnl_bps'), 'validation_pnl_bps': (record.get('validation') or {}).get('pnl_bps')}, safe_float_none(test_metric.get('pnl_bps')), 'proxy bps', 'hypothesis-only')
    optimizer = load_json(EDGE_OPTIMIZER, {})
    champion = (optimizer.get('champions') or [{}])[0] if isinstance(optimizer.get('champions'), list) else {}
    set_result(strategies['solana-edge-optimizer'], {'candidates_evaluated': optimizer.get('candidates_evaluated'), 'decisions': optimizer.get('decisions'), 'persistent_winner_decisions': optimizer.get('persistent_winner_decisions'), 'persistent_winner_mints': optimizer.get('persistent_winner_mints'), 'test_trades': champion.get('test_trades'), 'test_pnl_bps': champion.get('test_pnl_bps'), 'promoted': champion.get('promoted')}, safe_float_none(champion.get('test_pnl_bps')), 'proxy bps', 'hypothesis-only')

    # LiqMo and historical fast-dense replay summaries.
    liqmo_files = sorted((MICROCAP / 'runs/backtests').glob('liqmo-*.json'), key=lambda path: path.stat().st_mtime)
    if liqmo_files:
        liqmo = load_json(liqmo_files[-1], {})
        variants = liqmo.get('variants') or []
        best = max(variants, key=lambda row: safe_float(row.get('net_bps_total')), default={})
        set_result(strategies['solana-pumpfun-liqmo'], {'samples': liqmo.get('sample_count'), 'mints': liqmo.get('mint_count'), 'variants_tested': len(variants), 'trades': best.get('trades'), 'net_bps_total': best.get('net_bps_total'), 'avg_bps': best.get('avg_bps')}, safe_float_none(best.get('net_bps_total')), 'model bps', 'negative' if safe_float(best.get('net_bps_total')) < 0 else 'positive')
        for path in liqmo_files:
            data = load_json(path, {})
            for variant in data.get('variants') or []:
                test_runs.append({'id': f"liqmo-{slug(path.stem)}-{slug((variant.get('params') or {}).get('name'))}", 'timestamp': datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat().replace('+00:00', 'Z'), 'strategy_id': 'solana-pumpfun-liqmo', 'venue': 'Solana', 'mode': data.get('mode'), 'status': 'completed', 'trades': variant.get('trades'), 'pnl_usd': None, 'pnl_lamports': variant.get('net_lamports_total'), 'variant': (variant.get('params') or {}).get('name'), 'source_family': 'LiqMo backtest'})

    # Arbitrum canaries and shadow summaries.
    arb_rows = arbitrum_canaries()
    result_log.extend(arb_rows)
    arb_delta = round(sum(safe_float(row.get('pnl_eth')) for row in arb_rows), 18)
    set_result(strategies['arbitrum-weth-usdc-canary'], {'trades': len(arb_rows), 'wallet_delta_eth': arb_delta}, arb_delta, 'ETH', 'negative' if arb_delta < 0 else 'positive')
    arb_shadow = load_json(MICROCAP / 'state/arbitrum-dexscreener-wallet-shadow/latest-summary.json', {})
    set_result(strategies['arbitrum-dexscreener-shadow'], {'sessions': arb_shadow.get('session_count') or arb_shadow.get('sessions'), 'trades': arb_shadow.get('closed_trades') or arb_shadow.get('trades'), 'pnl_usd': arb_shadow.get('pnl_usd')}, safe_float_none(arb_shadow.get('pnl_usd')), 'USD', 'negative' if safe_float(arb_shadow.get('pnl_usd')) < 0 else ('positive' if safe_float(arb_shadow.get('pnl_usd')) > 0 else 'no-trades'))

    # Code-only strategy visibility.
    set_result(strategies['solana-launch-survivor'], {'code_files': 1}, None, None, 'built-not-tested')
    set_result(strategies['solana-pumpfun-genesis'], {'sample_rows': sum(1 for _ in (MICROCAP / 'state/pumpfun-genesis/samples.jsonl').open(errors='ignore')) if (MICROCAP / 'state/pumpfun-genesis/samples.jsonl').exists() else 0}, None, None, 'coverage-only')
    set_result(strategies['hyperliquid-momentum-funding'], {'code_files': 1}, None, None, 'built-not-tested')

    # Wallet balances: public addresses only.
    prices = live_prices()
    arb_balance = evm_balance(ARBITRUM_WALLET)
    sol_balance = solana_balance(SOLANA_WALLET)
    pm_address = live.get('deposit_wallet') or next((row.get('address') for row in (previous.get('tracked_wallets') or []) if row.get('network') == 'Polygon / Polymarket'), None)
    pm_cash = safe_float_none(btc_state.get('last_deposit_pusd'))
    pm_conditional = safe_float(live.get('conditional_balance'))
    pm_bid = safe_float((live.get('book') or {}).get('bid'))
    pm_value = round((pm_cash or 0) + (pm_conditional * pm_bid), 2)
    arb_native = safe_float_none(arb_balance.get('native_balance'))
    sol_native = safe_float_none(sol_balance.get('native_balance'))
    wallets = [
        {'label': 'Wallet 1', 'name': 'Polymarket deposit wallet', 'network': 'Polygon / Polymarket', 'address': pm_address, 'address_masked': mask(pm_address), 'role': 'Prediction-market bankroll and execution', 'status': live.get('mode') or 'unknown', 'native_balance': pm_value, 'native_unit': 'pUSD marked', 'usd_value': pm_value, 'readback_ok': not bool(live.get('error'))},
        {'label': 'Wallet 2', 'name': 'Arbitrum canary wallet', 'network': 'Arbitrum One', 'address': ARBITRUM_WALLET, 'address_masked': mask(ARBITRUM_WALLET), 'role': 'Tiny DEX route canaries', 'status': 'funded' if safe_float(arb_native) > 0 else 'unfunded', 'native_balance': arb_native, 'native_unit': 'ETH', 'usd_value': round(arb_native * prices['eth_usd'], 2) if arb_native is not None and prices.get('eth_usd') else None, 'readback_ok': arb_balance.get('ok')},
        {'label': 'Wallet 3', 'name': 'Solana microcap test wallet', 'network': 'Solana Mainnet', 'address': SOLANA_WALLET, 'address_masked': mask(SOLANA_WALLET), 'role': 'Capped live microcap tests and recovery', 'status': 'funded' if safe_float(sol_native) > 0 else 'unfunded', 'native_balance': sol_native, 'native_unit': 'SOL', 'usd_value': round(sol_native * prices['sol_usd'], 2) if sol_native is not None and prices.get('sol_usd') else None, 'readback_ok': sol_balance.get('ok')},
    ]

    # Coverage and visualization projections.
    raw_snapshots = (sqlite_rows(OUTCOME_DB, 'select count(*) n from snapshots') or [{'n': 0}])[0]['n']
    route_probes = (sqlite_rows(OUTCOME_DB, 'select count(*) n from route_probes') or [{'n': 0}])[0]['n']
    exact_watches = (sqlite_rows(OUTCOME_DB, 'select count(*) n from executable_shadow_watches') or [{'n': 0}])[0]['n']
    exact_trade_count = len(exact_trades)
    historical_tokens = (sqlite_rows(HISTORICAL_DB, 'select count(*) n from candidates') or [{'n': 0}])[0]['n']

    strategies_list = sorted(strategies.values(), key=lambda row: (row['venue'], row['name']))
    performance = []
    for row in strategies_list:
        if isinstance(row.get('primary_value'), (int, float)):
            performance.append({'strategy_id': row['id'], 'name': row['name'], 'venue': row['venue'], 'evidence_class': row['evidence_class'], 'value': row['primary_value'], 'unit': row['primary_unit'], 'result_status': row['result_status']})

    activity = Counter()
    for row in test_runs:
        timestamp = iso_ts(row.get('timestamp'))
        if timestamp and re.match(r'^\d{4}-\d{2}-\d{2}', timestamp):
            activity[timestamp[:10]] += 1
    activity_by_day = [{'date': key, 'runs': value} for key, value in sorted(activity.items())]

    result_log.sort(key=lambda row: str(row.get('timestamp') or ''), reverse=True)
    test_runs.sort(key=lambda row: str(row.get('timestamp') or ''), reverse=True)
    promotion_ready = sum(bool(row.get('metrics', {}).get('promotion_candidate')) for row in strategies_list)
    evidence_counts = Counter(row['evidence_class'] for row in strategies_list)

    truth_summary = {
        'overall_status': 'FAIL',
        'wallet_profitable': False,
        'polymarket_live_pnl_usd': pm_pnl,
        'solana_live_delta_lamports': live_cumulative_lamports,
        'solana_live_delta_sol': round(live_cumulative_lamports / 1e9, 9),
        'solana_legacy_fake_wallet_pnl_usd': round(fake_cumulative, 6),
        'solana_current_exact_quote_pnl_lamports': v5_pnl,
        'solana_current_exact_quote_pnl_sol': round(v5_pnl / 1e9, 9),
        'proxy_evidence_status': 'HYPOTHESIS_ONLY_NOT_WALLET_PROFIT',
        'promotion_ready_count': promotion_ready,
        'plain_verdict': 'Polymarket live is slightly positive. Solana live wallet and current exact-quote wallet are negative. No strategy is promotion-ready.',
    }

    return {
        'schema_version': 4,
        'generated_utc': generated,
        'privacy': 'Unlinked/noindex static snapshot. Public wallet addresses only. No secrets, key material, raw signed transactions, or local secret paths.',
        'truth_summary': truth_summary,
        'summary': {
            'strategy_count': len(strategies_list),
            'tested_strategy_count': sum(row['lifecycle'] != 'built' for row in strategies_list),
            'built_only_strategy_count': sum(row['lifecycle'] == 'built' for row in strategies_list),
            'result_count': len(result_log),
            'test_run_count': len(test_runs),
            'venue_count': len({row['venue'] for row in strategies_list}),
            'wallet_count': len(wallets),
            'tracked_wallets_usd': round(sum(safe_float(row.get('usd_value')) for row in wallets), 2),
            'evidence_counts': dict(sorted(evidence_counts.items())),
        },
        'data_coverage': {
            'strategy_count': len(strategies_list),
            'result_count': len(result_log),
            'test_run_count': len(test_runs),
            'raw_snapshots': raw_snapshots,
            'route_probes': route_probes,
            'exact_quote_watches': exact_watches,
            'exact_quote_trades': exact_trade_count,
            'historical_token_rows': historical_tokens,
            'strategy_league_generations': len({row.get('generation') for row in lane_runs if row.get('generation') is not None}),
            'polymarket_saved_scans': len(glob.glob('/home/fiv30nit/polymarket_crypto_guardrail_scan_*.json')),
            'paper_degen_trial_summaries': len(trial_summary_files),
        },
        'visualizations': {
            'equity_series': {'polymarket_live_usd': pm_equity, 'solana_live_sol': sol_live_equity, 'solana_fake_usd': fake_equity},
            'strategy_performance': performance,
            'evidence_funnel': [
                {'label': 'Market snapshots', 'value': raw_snapshots},
                {'label': 'Executable route probes', 'value': route_probes},
                {'label': 'Confirmation watches', 'value': exact_watches},
                {'label': 'Exact-quote closes', 'value': exact_trade_count},
            ],
            'activity_by_day': activity_by_day,
        },
        'strategies': strategies_list,
        'test_runs': test_runs,
        'result_log': result_log,
        'tracked_wallets': wallets,
        'prices': prices,
        'paper_goblin_solana': paper_goblin_rows()[0],
        'current_orders': live.get('open_orders') if isinstance(live.get('open_orders'), list) else [],
        'current_positions': [row for row in (manager_live.get('positions') or {}).values() if isinstance(row, dict) and row.get('state') in {'ENTRY_OPEN', 'ACTIVE', 'HOLD_FLOOR'}] if isinstance(manager_live.get('positions'), dict) else [],
        'runtime': {
            'polymarket_status': {key: live.get(key) for key in ['mode', 'market', 'btc_spot', 'reconciled_size', 'conditional_balance', 'open_orders_count']},
            'auto_entry_enabled': GENERIC_LIVE.exists() and not GENERIC_ENTRY_HALT.exists(),
            'generic_live_file': GENERIC_LIVE.exists(),
            'generic_halt_file': GENERIC_HALT.exists(),
            'generic_entry_halt_file': GENERIC_ENTRY_HALT.exists(),
            'manager_active_count': manager_live.get('active_count'),
            'manager_exposure_cost': manager_live.get('exposure_cost'),
        },
        'source_register': [
            {'name': 'Polymarket live ledger', 'records': len(pm_trades), 'classification': 'wallet truth'},
            {'name': 'Polymarket sports paper ledger', 'records': len(paper_rows), 'classification': 'paper settlement'},
            {'name': 'Polymarket saved-book and politics replays', 'records': len((gate_replay.get('summary') or {})) + len((politics.get('summary') or {})), 'classification': 'mark-to-market replay'},
            {'name': 'Solana strategy league DB', 'records': len(league_sells), 'classification': 'fake wallet'},
            {'name': 'Solana central trade-data DB', 'records': len(central_results), 'classification': 'paper/live result records'},
            {'name': 'Solana outcome-labeler DB', 'records': len(exact_trades), 'classification': 'exact-quote shadow'},
            {'name': 'Solana test-run registry', 'records': len(test_runs), 'classification': 'run evidence'},
        ],
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    snapshot = build_snapshot()
    DATA_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
    print(json.dumps({'wrote': str(DATA_PATH), 'schema_version': snapshot['schema_version'], 'summary': snapshot['summary'], 'truth_summary': snapshot['truth_summary'], 'data_coverage': snapshot['data_coverage']}, indent=2))


if __name__ == '__main__':
    main()
