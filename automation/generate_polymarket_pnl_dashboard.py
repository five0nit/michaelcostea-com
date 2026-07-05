#!/usr/bin/env python3
from __future__ import annotations
import glob
import json
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path('/home/fiv30nit/.openclaw/workspace/workspaces/michaelcostea-com')
OUT_DIR = ROOT / 'ops' / 'pnl-console'
DATA_PATH = OUT_DIR / 'trades.json'
STATUS_CMD = ['python3', '/home/fiv30nit/.hermes/scripts/polymarket_auto_trade_btc64.py', '--status-only']
ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc'
ARBITRUM_CHAIN_ID = 42161
ARBITRUM_TEST_WALLET = '0x22469cBd6035749cfE49c35AafCED9AA4816ead5'
ETH_USD_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

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

def rpc_call(url: str, method: str, params: list[Any] | None = None, timeout: int = 20) -> Any:
    payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'michaelcostea-pnl-console/1.0'},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode('utf-8'))
    if 'error' in body:
        raise RuntimeError(f"{method}: {body['error']}")
    return body['result']

def arbitrum_wallet_status(address: str) -> dict[str, Any]:
    try:
        chain_id = int(rpc_call(ARBITRUM_RPC, 'eth_chainId'), 16)
        balance_wei = int(rpc_call(ARBITRUM_RPC, 'eth_getBalance', [address, 'latest']), 16)
        block_number = int(rpc_call(ARBITRUM_RPC, 'eth_blockNumber'), 16)
        return {
            'chain_id': chain_id,
            'rpc_ok': chain_id == ARBITRUM_CHAIN_ID,
            'block_number': block_number,
            'native_balance_eth': round(balance_wei / 1e18, 18),
            'native_balance_wei': balance_wei,
        }
    except Exception as e:
        return {'rpc_ok': False, 'error': f'{type(e).__name__}: {str(e)[:240]}'}

def eth_usd_price() -> dict[str, Any]:
    try:
        req = urllib.request.Request(ETH_USD_PRICE_URL, headers={'User-Agent': 'michaelcostea-pnl-console/1.0'})
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode('utf-8'))
        price = safe_float((body.get('ethereum') or {}).get('usd'))
        if price <= 0:
            raise ValueError('missing ethereum.usd price')
        return {'price_usd': price, 'source': 'coingecko ethereum/usd'}
    except Exception as e:
        return {'price_usd': None, 'source': 'unavailable', 'error': f'{type(e).__name__}: {str(e)[:240]}'}

def usd_label(value: float | None) -> str:
    return f"${value:,.2f}" if isinstance(value, (int, float)) else '—'

def build_wallets(live: dict[str, Any], eth_price: dict[str, Any]) -> list[dict[str, Any]]:
    wallet1 = live.get('deposit_wallet')
    wallet1_usd = safe_float(live.get('conditional_balance'))
    wallet2_status = arbitrum_wallet_status(ARBITRUM_TEST_WALLET)
    eth_usd = eth_price.get('price_usd')
    wallet2_eth = safe_float(wallet2_status.get('native_balance_eth'))
    wallet2_usd = round(wallet2_eth * eth_usd, 2) if isinstance(eth_usd, (int, float)) else None
    return [
        {
            'label': 'Wallet 1',
            'name': 'Polymarket deposit wallet',
            'network': 'Polygon / Polymarket',
            'address': wallet1,
            'address_masked': mask(wallet1),
            'role': 'Prediction-market bankroll + order tracking',
            'status': live.get('mode') or 'unknown',
            'balance_label': f"conditional {wallet1_usd:.6f}",
            'usd_value': round(wallet1_usd, 2),
            'usd_label': usd_label(round(wallet1_usd, 2)),
            'notes': 'Existing Polymarket test wallet. No private keys exposed.',
        },
        {
            'label': 'Wallet 2',
            'name': 'Arbitrum microcap pilot wallet',
            'network': 'Arbitrum One',
            'address': ARBITRUM_TEST_WALLET,
            'address_masked': mask(ARBITRUM_TEST_WALLET),
            'role': 'Tiny ETH/WETH/USDC live swap pilot',
            'status': 'funded' if wallet2_status.get('native_balance_wei', 0) > 0 else 'unfunded',
            'balance_label': f"{wallet2_eth:.18f} ETH" if wallet2_status.get('rpc_ok') else 'RPC unavailable',
            'usd_value': wallet2_usd,
            'usd_label': usd_label(wallet2_usd),
            'price_source': eth_price,
            'rpc': wallet2_status,
            'notes': 'Bot currently disarmed; used for tiny Arbitrum test swaps only.',
        },
    ]

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
    live_has_position = safe_float(live.get('reconciled_size')) >= 0.001
    live_mode_terminal = str(live.get('mode') or '').lower() in {'closed', 'dust', 'sold_or_dust', 'inert_after_end'}
    # Only fall back to stale local artifacts when the live status call failed or still shows an active/pending state.
    # If live CLOB status says closed/no orders/no position, do not resurrect old watcher/bid artifacts.
    if not open_orders and not (live_mode_terminal and not live_has_position) and live.get('error'):
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
    eth_price = eth_usd_price()
    tracked_wallets = build_wallets(live, eth_price)
    tracked_wallets_usd = round(sum(w.get('usd_value') or 0 for w in tracked_wallets), 2)
    snapshot = {
        'schema_version': 1,
        'generated_utc': now,
        'source': 'local Polymarket artifacts + status-only bot command',
        'privacy': 'Unlinked static dashboard; no private keys/secrets; public wallet addresses only.',
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
            'tracked_wallets_usd': tracked_wallets_usd,
            'tracked_wallets_usd_label': usd_label(tracked_wallets_usd),
            'eth_usd_price': eth_price,
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
        'tracked_wallets': tracked_wallets,
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
