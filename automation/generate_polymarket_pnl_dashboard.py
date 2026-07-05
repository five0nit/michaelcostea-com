#!/usr/bin/env python3
from __future__ import annotations
import glob
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path('/home/fiv30nit/.openclaw/workspace/workspaces/michaelcostea-com')
OUT_DIR = ROOT / 'ops' / 'pnl-console'
DATA_PATH = OUT_DIR / 'trades.json'
STATUS_CMD = ['python3', '/home/fiv30nit/.hermes/scripts/polymarket_auto_trade_btc64.py', '--status-only']

REALIZED = {
    'id': 'btc64-jul5-tp-001',
    'market': 'BTC above $64,000 on Jul 5 — YES',
    'instrument': 'Polymarket conditional token',
    'side': 'BUY→SELL',
    'status': 'closed_profit',
    'entry_size': 6.140349,
    'exit_size': 6.14,
    'dust': 0.000349,
    'entry_price': 0.171,
    'exit_price': 0.205,
    'cost_basis_pusd': 1.049999,
    'net_proceeds_pusd': 1.258700,
    'net_profit_pusd': 0.208701,
    'roi_pct': 19.88,
    'opened_utc': '2026-07-04T20:36:00Z',
    'closed_utc': '2026-07-04T21:25:00Z',
    'notes': 'First live deposit-wallet path test. TP matched; only unsellable dust remains.',
}

def safe_float(x: Any, default: float = 0.0) -> float:
    try:
        return float(x)
    except Exception:
        return default

def mask(s: str | None, left: int = 6, right: int = 4) -> str | None:
    if not s:
        return s
    s = str(s)
    return s if len(s) <= left + right + 3 else f'{s[:left]}…{s[-right:]}'

def get_live_status() -> dict[str, Any]:
    try:
        p = subprocess.run(STATUS_CMD, text=True, capture_output=True, timeout=180, check=True)
        return json.loads(p.stdout)
    except Exception as e:
        return {'error': type(e).__name__, 'message': str(e)[:500]}

def latest_bid_artifact() -> dict[str, Any]:
    paths = glob.glob('/home/fiv30nit/polymarket_btc64_jul5_reentry_bid_*.json')
    if not paths:
        return {}
    latest = max(paths, key=lambda p: Path(p).stat().st_mtime)
    try:
        d = json.loads(Path(latest).read_text())
        d['_artifact'] = latest
        return d
    except Exception as e:
        return {'_artifact': latest, 'error': str(e)[:300]}

def latest_watcher_state() -> dict[str, Any]:
    p = Path('/home/fiv30nit/polymarket_btc64_reentry_watch_state.json')
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text())
    except Exception as e:
        return {'error': str(e)[:300]}

def build_snapshot() -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    live = get_live_status()
    bid_art = latest_bid_artifact()
    watcher = latest_watcher_state()
    open_orders = live.get('open_orders') or []
    if not open_orders:
        watch_order = watcher.get('order')
        if isinstance(watch_order, dict) and str(watch_order.get('status', '')).upper() in {'LIVE', 'OPEN'}:
            open_orders = [watch_order]
        elif isinstance(bid_art.get('open_orders'), list):
            open_orders = bid_art.get('open_orders') or []
    current_orders = []
    for o in open_orders:
        price = safe_float(o.get('price'))
        original = safe_float(o.get('original_size'))
        matched = safe_float(o.get('size_matched'))
        remaining = max(0.0, original - matched)
        current_orders.append({
            'id': o.get('id'),
            'id_masked': mask(o.get('id'), 10, 8),
            'market': live.get('market'),
            'side': o.get('side'),
            'status': o.get('status'),
            'price': price,
            'original_size': original,
            'size_matched': matched,
            'remaining_size': remaining,
            'max_cost_pusd': round(price * original, 6) if str(o.get('side')).upper() == 'BUY' else None,
            'asset_id': o.get('asset_id'),
            'asset_id_masked': mask(o.get('asset_id'), 10, 8),
            'created_at': o.get('created_at'),
            'plan': {
                'take_profit_price': 0.160,
                'stop_bid_lte': 0.050,
                'spot_stop_btc_below': 62900,
                'cancel_if_unfilled_after_utc': '2026-07-05T06:00:00Z',
                'time_stop_utc': '2026-07-05T13:00:00Z',
            },
        })
    realized_profit = REALIZED['net_profit_pusd']
    reserved = sum(o.get('max_cost_pusd') or 0 for o in current_orders if str(o.get('side')).upper() == 'BUY')
    snapshot = {
        'schema_version': 1,
        'generated_utc': now,
        'source': 'local Polymarket artifacts + status-only bot command',
        'privacy': 'Unlinked static dashboard; no private keys/secrets; public-chain identifiers are masked in the UI.',
        'summary': {
            'realized_profit_pusd': round(realized_profit, 6),
            'realized_roi_pct': REALIZED['roi_pct'],
            'closed_trades': 1,
            'open_orders': len(current_orders),
            'open_positions': 0 if live.get('reconciled_size', 0) < 0.001 else 1,
            'pending_order_max_cost_pusd': round(reserved, 6),
            'last_btc_spot': live.get('btc_spot'),
            'last_market_bid': (live.get('book') or {}).get('bid'),
            'last_market_ask': (live.get('book') or {}).get('ask'),
            'deposit_wallet_masked': mask(live.get('deposit_wallet')),
        },
        'current_state': {
            'bot_mode': live.get('mode'),
            'reconciled_size': live.get('reconciled_size'),
            'conditional_balance': live.get('conditional_balance'),
            'auto_entry_enabled': live.get('auto_entry_enabled'),
            'halt_file_present': live.get('halt_file_present'),
            'book': live.get('book'),
            'btc_spot': live.get('btc_spot'),
        },
        'current_orders': current_orders,
        'past_trades': [REALIZED],
        'artifacts': {
            'latest_bid_artifact': bid_art.get('_artifact'),
            'scanner_latest': max(glob.glob('/home/fiv30nit/polymarket_crypto_guardrail_scan_*.json'), key=lambda p: Path(p).stat().st_mtime) if glob.glob('/home/fiv30nit/polymarket_crypto_guardrail_scan_*.json') else None,
            'state_note': '/home/fiv30nit/memory/2026-07-04.md',
        },
    }
    return snapshot

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    snapshot = build_snapshot()
    DATA_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
    print(json.dumps({'wrote': str(DATA_PATH), 'summary': snapshot['summary']}, indent=2))

if __name__ == '__main__':
    main()
