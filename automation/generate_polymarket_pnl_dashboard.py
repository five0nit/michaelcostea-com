#!/usr/bin/env python3
from __future__ import annotations
import glob, json, subprocess, urllib.request, os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path('/home/fiv30nit/.openclaw/workspace/workspaces/michaelcostea-com')
OUT_DIR = ROOT / 'ops' / 'pnl-console'
DATA_PATH = OUT_DIR / 'trades.json'
LEDGER = Path('/home/fiv30nit/polymarket_trades_ledger.jsonl')
BTC64_STATUS_CMD = ['python3', '/home/fiv30nit/.hermes/scripts/polymarket_auto_trade_btc64.py', '--status-only']
MANAGER_STATUS_CMD = ['python3', '/home/fiv30nit/.hermes/scripts/polymarket_position_manager.py', '--status-only']
BTC64_STATE = Path('/home/fiv30nit/polymarket_auto_trade_btc64_state.json')
GATE_REPORT = Path('/home/fiv30nit/polymarket_auto_entry_last_report.json')
INTENTS = Path('/home/fiv30nit/polymarket_entry_intents.json')
GENERIC_LIVE = Path('/home/fiv30nit/polymarket_position_manager.LIVE')
GENERIC_HALT = Path('/home/fiv30nit/polymarket_position_manager.HALT')
GENERIC_ENTRY_HALT = Path('/home/fiv30nit/polymarket_position_manager.ENTRY_HALT')
ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc'
ARBITRUM_CHAIN_ID = 42161
ARBITRUM_TEST_WALLET = '0x22469cBd6035749cfE49c35AafCED9AA4816ead5'
CRYPTO_AUTOPSY_DIR = Path('/home/fiv30nit/.openclaw/workspace/workspaces/microcap-autotrader/runs/autopsy')
ETH_USD_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

def safe_float(x: Any, default: float = 0.0) -> float:
    try: return float(x)
    except Exception: return default

def safe_float_none(x: Any) -> float | None:
    try: return float(x)
    except Exception: return None

def mask(s: str | None, left: int = 6, right: int = 4) -> str | None:
    if not s: return s
    s = str(s)
    return s if len(s) <= left + right + 3 else f'{s[:left]}…{s[-right:]}'

def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text()) if path.exists() else default
    except Exception as e:
        return {'error': f'{type(e).__name__}: {str(e)[:240]}'}

def run_json(cmd: list[str], timeout: int = 90) -> dict[str, Any]:
    try:
        p = subprocess.run(cmd, text=True, capture_output=True, timeout=timeout, check=True)
        return json.loads(p.stdout)
    except Exception as e:
        return {'error': type(e).__name__, 'message': str(e)[:500]}

def rpc_call(url: str, method: str, params: list[Any] | None = None, timeout: int = 20) -> Any:
    payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []}).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json', 'User-Agent': 'michaelcostea-pnl-console/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode('utf-8'))
    if 'error' in body: raise RuntimeError(f"{method}: {body['error']}")
    return body['result']

def arbitrum_wallet_status(address: str) -> dict[str, Any]:
    try:
        chain_id = int(rpc_call(ARBITRUM_RPC, 'eth_chainId'), 16)
        balance_wei = int(rpc_call(ARBITRUM_RPC, 'eth_getBalance', [address, 'latest']), 16)
        block_number = int(rpc_call(ARBITRUM_RPC, 'eth_blockNumber'), 16)
        return {'chain_id': chain_id, 'rpc_ok': chain_id == ARBITRUM_CHAIN_ID, 'block_number': block_number, 'native_balance_eth': round(balance_wei / 1e18, 18), 'native_balance_wei': balance_wei}
    except Exception as e:
        return {'rpc_ok': False, 'error': f'{type(e).__name__}: {str(e)[:240]}'}

def eth_usd_price() -> dict[str, Any]:
    try:
        req = urllib.request.Request(ETH_USD_PRICE_URL, headers={'User-Agent': 'michaelcostea-pnl-console/1.0'})
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode('utf-8'))
        price = safe_float((body.get('ethereum') or {}).get('usd'))
        if price <= 0: raise ValueError('missing ethereum.usd price')
        return {'price_usd': price, 'source': 'coingecko ethereum/usd'}
    except Exception as e:
        return {'price_usd': None, 'source': 'unavailable', 'error': f'{type(e).__name__}: {str(e)[:240]}'}

def usd_label(value: float | None) -> str:
    return f"${value:,.2f}" if isinstance(value, (int, float)) else '—'

def read_ledger() -> list[dict[str, Any]]:
    trades=[]
    if not LEDGER.exists(): return trades
    for line in LEDGER.read_text().splitlines():
        if not line.strip(): continue
        try: trades.append(json.loads(line))
        except Exception: pass
    return trades

def read_arbitrum_autonomous_trades() -> list[dict[str, Any]]:
    trades: list[dict[str, Any]] = []
    if not CRYPTO_AUTOPSY_DIR.exists():
        return trades
    for path in sorted(CRYPTO_AUTOPSY_DIR.glob('apt-*.json')):
        rec = load_json(path, {})
        if rec.get('action') != 'autonomous_cycle_summary':
            continue
        quote = rec.get('quote') or {}
        pnl = rec.get('pnl_snapshot') or {}
        before = pnl.get('before') or {}
        after = pnl.get('after') or {}
        cycle = quote.get('cycle')
        if not cycle:
            continue
        before_eth = safe_float(before.get('eth')) / 1e18
        after_eth = safe_float(after.get('eth')) / 1e18
        delta_eth = after_eth - before_eth
        trades.append({
            'id': f"arb-weth-usdc-auto-{quote.get('cycle')}-{str(rec.get('timestamp_utc',''))}",
            'market': 'Arbitrum WETH/USDC autonomous canary',
            'instrument': 'Uniswap V3 WETH/USDC 0.05% pool',
            'side': 'AUTO_BUY→AUTO_SELL',
            'status': 'closed_flat_tokens',
            'entry_size': round(safe_float(quote.get('amount_wei')) / 1e18, 18),
            'exit_size': round(safe_float(quote.get('exit_quote_weth_wei')) / 1e18, 18),
            'entry_price': round(safe_float(quote.get('quote_usd')), 6),
            'exit_price': round(safe_float(quote.get('exit_quote_weth_wei')) / 1e18, 18),
            'cost_basis_pusd': round(safe_float(quote.get('quote_usd')), 6),
            'net_profit_pusd': None,
            'roi_pct': None,
            'opened_utc': rec.get('timestamp_utc'),
            'closed_utc': rec.get('timestamp_utc'),
            'exit_reason': quote.get('exit_reason') or 'auto_exit',
            'network': 'Arbitrum One',
            'wallet': ARBITRUM_TEST_WALLET,
            'gas_delta_eth': round(delta_eth, 18),
            'autopsy': str(path),
            'notes': 'Live autonomous canary: exact approvals, auto exit, final WETH/USDC zero; ETH delta includes gas + pool roundtrip cost.'
        })
    return trades

def build_wallets(live: dict[str, Any], btc_state: dict[str, Any], eth_price: dict[str, Any]) -> list[dict[str, Any]]:
    wallet1 = live.get('deposit_wallet')
    cash_pusd = safe_float_none(btc_state.get('last_deposit_pusd'))
    cond = safe_float(live.get('conditional_balance'))
    bid = safe_float((live.get('book') or {}).get('bid'))
    conditional_mark = round(cond * bid, 6)
    wallet2_status = arbitrum_wallet_status(ARBITRUM_TEST_WALLET)
    eth_usd = eth_price.get('price_usd')
    wallet2_eth = safe_float(wallet2_status.get('native_balance_eth'))
    wallet2_usd = round(wallet2_eth * eth_usd, 2) if isinstance(eth_usd, (int, float)) else None
    return [
        {'label':'Wallet 1','name':'Polymarket deposit wallet','network':'Polygon / Polymarket','address':wallet1,'address_masked':mask(wallet1),'role':'Prediction-market bankroll + order tracking','status':live.get('mode') or 'unknown','balance_label':f"cash {cash_pusd:.6f} pUSD + conditional {cond:.6f} shares" if isinstance(cash_pusd,float) else f"conditional {cond:.6f} shares",'usd_value':round((cash_pusd or 0) + conditional_mark, 2),'usd_label':usd_label(round((cash_pusd or 0) + conditional_mark,2)),'cash_pusd':cash_pusd,'conditional_shares':cond,'conditional_mark_pusd':conditional_mark,'notes':'No private keys exposed.'},
        {'label':'Wallet 2','name':'Arbitrum microcap pilot wallet','network':'Arbitrum One','address':ARBITRUM_TEST_WALLET,'address_masked':mask(ARBITRUM_TEST_WALLET),'role':'Tiny ETH/WETH/USDC live swap pilot','status':'funded' if wallet2_status.get('native_balance_wei',0)>0 else 'unfunded','balance_label':f"{wallet2_eth:.18f} ETH" if wallet2_status.get('rpc_ok') else 'RPC unavailable','usd_value':wallet2_usd,'usd_label':usd_label(wallet2_usd),'price_source':eth_price,'rpc':wallet2_status,'notes':'Bot currently disarmed; used for tiny Arbitrum test swaps only.'},
    ]

def cron_status() -> list[dict[str, Any]]:
    """Expose current live Hermes cron state for Polymarket jobs.

    Keep this static-dashboard safe: names, schedules, enabled/state, and script names only.
    No prompts, credentials, stdout, or private env details.
    """
    jobs_path = Path('/home/fiv30nit/.hermes/cron/jobs.json')
    data = load_json(jobs_path, {'jobs': []})
    jobs = data.get('jobs') if isinstance(data, dict) else []
    if not isinstance(jobs, list):
        jobs = []
    wanted = ('polymarket', 'multi-venue trading')
    rows: list[dict[str, Any]] = []
    for j in jobs:
        name = str(j.get('name') or '')
        script = j.get('script')
        haystack = f"{name} {script or ''}".lower()
        if not any(term in haystack for term in wanted):
            continue
        schedule = j.get('schedule') or {}
        rows.append({
            'job_id': j.get('id'),
            'name': name,
            'schedule': j.get('schedule_display') or schedule.get('display'),
            'script': Path(script).name if script else None,
            'no_agent': bool(j.get('no_agent')),
            'enabled': bool(j.get('enabled')),
            'state': j.get('state'),
            'last_run_at': j.get('last_run_at'),
            'last_status': j.get('last_status'),
            'next_run_at': j.get('next_run_at'),
        })
    rows.sort(key=lambda r: (not r.get('enabled'), str(r.get('name') or '')))
    return rows

def build_snapshot() -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    live = run_json(BTC64_STATUS_CMD)
    manager = run_json(MANAGER_STATUS_CMD)
    btc_state = load_json(BTC64_STATE,{})
    gate = load_json(GATE_REPORT,{})
    intents = load_json(INTENTS, {'intents':[]})
    polymarket_trades = read_ledger()
    crypto_trades = read_arbitrum_autonomous_trades()
    trades = polymarket_trades + crypto_trades
    realized = round(sum(safe_float(t.get('net_profit_pusd')) for t in polymarket_trades), 6)
    wins = sum(1 for t in polymarket_trades if safe_float(t.get('net_profit_pusd')) > 0)
    losses = sum(1 for t in polymarket_trades if safe_float(t.get('net_profit_pusd')) < 0)
    open_orders = live.get('open_orders')
    if not isinstance(open_orders, list):
        open_orders = []
    generic_positions = (manager.get('positions') or {}) if isinstance(manager.get('positions'), dict) else {}
    current_positions = []
    generic_open_orders = []
    if safe_float(live.get('reconciled_size')) >= 0.001:
        current_positions.append({'source':'btc64_legacy','market':live.get('market'),'size':live.get('reconciled_size'),'state':live.get('mode'),'book':live.get('book')})
    for p in generic_positions.values():
        if p.get('state') in {'ENTRY_OPEN','ACTIVE','HOLD_FLOOR'}:
            current_positions.append({'source':'generic_manager', **p})
        if p.get('state') == 'ENTRY_OPEN':
            entry = p.get('entry') or {}
            generic_open_orders.append({
                'source': 'generic_manager',
                'status': p.get('state'),
                'side': f"BUY {p.get('outcome') or 'YES'}",
                'market': p.get('question'),
                'price': safe_float_none(entry.get('limit_price')),
                'original_size': safe_float_none(entry.get('size')),
                'size_matched': safe_float(entry.get('filled_size')),
                'max_cost_pusd': safe_float_none(entry.get('cost_cap_pusd')),
                'plan': {'take_profit_price': None, 'stop_bid_lte': None, 'cancel_if_unfilled_after_utc': entry.get('ttl_expires_utc')},
                'id': entry.get('order_id'),
                'id_masked': mask(entry.get('order_id'), 10, 8),
                'placed_utc': entry.get('placed_utc'),
            })
    current_orders = open_orders + generic_open_orders
    eth_price = eth_usd_price()
    tracked_wallets = build_wallets(live, btc_state, eth_price)
    tracked_wallets_usd = round(sum(w.get('usd_value') or 0 for w in tracked_wallets), 2)
    top = (gate.get('top_candidates') or [{}])[0]
    snapshot = {
        'schema_version': 2,
        'generated_utc': now,
        'source': 'ledger + local Polymarket status-only commands + gate reports',
        'privacy': 'Unlinked static dashboard; no private keys/secrets; public wallet addresses only.',
        'summary': {
            'realized_profit_pusd': realized,
            'realized_pnl_all_time_pusd': realized,
            'closed_trades': len(trades),
            'polymarket_closed_trades': len(polymarket_trades),
            'crypto_closed_canaries': len(crypto_trades),
            'winning_trades': wins,
            'losing_trades': losses,
            'open_orders': len(current_orders),
            'open_positions': len(current_positions),
            'pending_order_max_cost_pusd': round(sum(safe_float(o.get('max_cost_pusd')) or (safe_float(o.get('price'))*safe_float(o.get('original_size'))) for o in current_orders if str(o.get('side')).upper().startswith('BUY')),6),
            'last_btc_spot': live.get('btc_spot'),
            'last_market_bid': (live.get('book') or {}).get('bid'),
            'last_market_ask': (live.get('book') or {}).get('ask'),
            'deposit_wallet_masked': mask(live.get('deposit_wallet')),
            'polymarket_cash_pusd': btc_state.get('last_deposit_pusd'),
            'tracked_wallets_usd': tracked_wallets_usd,
            'tracked_wallets_usd_label': usd_label(tracked_wallets_usd),
            'eth_usd_price': eth_price,
        },
        'automation': {
            'generic_live_enabled': GENERIC_LIVE.exists(),
            'generic_halt_present': GENERIC_HALT.exists(),
            'generic_entry_halt_present': GENERIC_ENTRY_HALT.exists(),
            'manager_active_count': manager.get('active_count'),
            'manager_exposure_cost': manager.get('exposure_cost'),
            'gate_last_action': gate.get('action'),
            'gate_candidate_count': gate.get('candidate_count'),
            'gate_passing_count': gate.get('passing_count'),
            'gate_intents_written': gate.get('intents_written'),
            'gate_top_blocked_market': top.get('question'),
            'gate_top_block_reasons': (top.get('gate') or {}).get('reasons'),
            'policy_v2': gate.get('policy_v2'),
            'policy_v2_preview_candidates': ((gate.get('policy_v2') or {}).get('v2_only') or [])[:5],
            'intents_count': len(intents.get('intents') or []),
            'crons': cron_status(),
        },
        'current_state': {'bot_mode': live.get('mode'),'reconciled_size': live.get('reconciled_size'),'conditional_balance': live.get('conditional_balance'),'book': live.get('book'),'btc_spot': live.get('btc_spot'),'auto_entry_enabled': GENERIC_LIVE.exists() and not GENERIC_ENTRY_HALT.exists()},
        'tracked_wallets': tracked_wallets,
        'current_orders': current_orders,
        'current_positions': current_positions,
        'past_trades': trades,
        'artifacts': {'ledger': str(LEDGER), 'scanner_latest': max(glob.glob('/home/fiv30nit/polymarket_crypto_guardrail_scan_*.json'), key=lambda p: Path(p).stat().st_mtime) if glob.glob('/home/fiv30nit/polymarket_crypto_guardrail_scan_*.json') else None, 'gate_report': str(GATE_REPORT), 'manager_state': '/home/fiv30nit/polymarket_positions_state.json'},
    }
    return snapshot

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    snapshot = build_snapshot()
    DATA_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
    print(json.dumps({'wrote': str(DATA_PATH), 'summary': snapshot['summary'], 'automation': snapshot['automation']}, indent=2))

if __name__ == '__main__': main()
