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
    try:
        p=subprocess.run(['python3','-m','json.tool'], input='{}', text=True, capture_output=True, timeout=1)
    except Exception: pass
    # Cron DB path is internal to Hermes; expose static known job ids from last verified setup.
    return [
        {'job_id':'2d97cede33e8','name':'Polymarket modeled auto-entry gate live','schedule':'every 5m','script':'polymarket_auto_entry_gate.py','no_agent':True},
        {'job_id':'e465ec9b12de','name':'Polymarket generic position manager live small-bets','schedule':'every 1m','script':'polymarket_position_manager.py','no_agent':True},
        {'job_id':'1ddc1171828b','name':'Polymarket BTC64 autonomous trader legacy/closed','schedule':'every 1m','script':'polymarket_auto_trade_btc64.py','no_agent':True},
    ]

def build_snapshot() -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    live = run_json(BTC64_STATUS_CMD)
    manager = run_json(MANAGER_STATUS_CMD)
    btc_state = load_json(BTC64_STATE,{})
    gate = load_json(GATE_REPORT,{})
    intents = load_json(INTENTS, {'intents':[]})
    trades = read_ledger()
    realized = round(sum(safe_float(t.get('net_profit_pusd')) for t in trades), 6)
    wins = sum(1 for t in trades if safe_float(t.get('net_profit_pusd')) > 0)
    losses = sum(1 for t in trades if safe_float(t.get('net_profit_pusd')) < 0)
    open_orders = live.get('open_orders') if isinstance(live.get('open_orders'), list) else []
    generic_positions = (manager.get('positions') or {}) if isinstance(manager.get('positions'), dict) else {}
    current_positions = []
    if safe_float(live.get('reconciled_size')) >= 0.001:
        current_positions.append({'source':'btc64_legacy','market':live.get('market'),'size':live.get('reconciled_size'),'state':live.get('mode'),'book':live.get('book')})
    for p in generic_positions.values():
        if p.get('state') in {'ENTRY_OPEN','ACTIVE','HOLD_FLOOR'}:
            current_positions.append({'source':'generic_manager', **p})
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
            'winning_trades': wins,
            'losing_trades': losses,
            'open_orders': len(open_orders),
            'open_positions': len(current_positions),
            'pending_order_max_cost_pusd': round(sum(safe_float(o.get('price'))*safe_float(o.get('original_size')) for o in open_orders if str(o.get('side')).upper()=='BUY'),6),
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
            'intents_count': len(intents.get('intents') or []),
            'crons': cron_status(),
        },
        'current_state': {'bot_mode': live.get('mode'),'reconciled_size': live.get('reconciled_size'),'conditional_balance': live.get('conditional_balance'),'book': live.get('book'),'btc_spot': live.get('btc_spot')},
        'tracked_wallets': tracked_wallets,
        'current_orders': open_orders,
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
