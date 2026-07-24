from __future__ import annotations

import importlib.util
import json
import sqlite3
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "automation" / "sync_paper_arena_pnl_dashboard.py"
spec = importlib.util.spec_from_file_location("paper_arena_pnl_sync", MODULE_PATH)
assert spec is not None and spec.loader is not None
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


def build_database(path: Path) -> None:
    with sqlite3.connect(path) as connection:
        connection.executescript(
            """
            create table profiles(profile_id text primary key, display_name text, claimed integer, updated_at real);
            create table arena_wallets(
              wallet_id text primary key, profile_id text, active integer, initial_lamports integer,
              wallet_lamports integer, realized_pnl_lamports integer, closed_trades integer,
              wins integer, losses integer, open_positions integer, updated_at real, wallet_json text
            );
            create table manual_trades(
              trade_id text primary key, profile_id text, wallet_id text, position_id text, mint text,
              decision_ts real, exit_ts real, input_lamports integer, gross_out_lamports integer,
              net_out_lamports integer, pnl_lamports integer, pnl_bps integer, reason text, record_json text
            );
            create table open_positions(
              position_key text primary key, profile_id text, wallet_id text, position_id text, mint text,
              decision_ts real, input_lamports integer, entry_market_cap_sol real, entry_haircut_bps integer,
              exact_pnl_lamports integer, updated_at real, record_json text
            );
            insert into profiles values('profile-private-a','Mike',1,100);
            insert into arena_wallets values('wallet-a','profile-private-a',1,1000000000,950000000,-50000000,2,1,1,1,100,'{}');
            insert into manual_trades values('trade-a','profile-private-a','wallet-a','position-a','mint-private-a',10,20,50000000,51000000,50500000,500000,100,'manual_sell','{}');
            insert into open_positions values('position-b','profile-private-a','wallet-a','position-b','mint-private-b',30,50000000,12.5,80,1000,100,'{}');
            """
        )


def test_fingerprint_ignores_background_marks_and_profile_display_names(tmp_path):
    database = tmp_path / "arena.sqlite"
    build_database(database)
    before = sync.arena_fingerprint(database)
    with sqlite3.connect(database) as connection:
        connection.execute("update profiles set display_name='Private Rename',updated_at=999")
        connection.execute("update arena_wallets set updated_at=999,wallet_json='changed mark json'")
        connection.execute("update open_positions set exact_pnl_lamports=999999,updated_at=999,record_json='changed mark json'")
    assert sync.arena_fingerprint(database) == before


def test_fingerprint_changes_for_public_dashboard_state(tmp_path):
    database = tmp_path / "arena.sqlite"
    build_database(database)
    baseline = sync.arena_fingerprint(database)
    with sqlite3.connect(database) as connection:
        connection.execute("update arena_wallets set wallet_lamports=951000000,realized_pnl_lamports=-49000000")
    assert sync.arena_fingerprint(database) != baseline


def test_saved_fingerprint_produces_noop_until_trade_state_changes(tmp_path):
    database = tmp_path / "arena.sqlite"
    state_path = tmp_path / "sync-state.json"
    build_database(database)
    fingerprint = sync.arena_fingerprint(database)
    sync.save_sync_state(state_path, {"fingerprint": fingerprint, "published_commit": "abc123"})
    assert sync.needs_sync(database, state_path) is False
    with sqlite3.connect(database) as connection:
        connection.execute(
            "insert into manual_trades values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ("trade-b", "profile-private-a", "wallet-a", "position-b", "mint-private-b", 30, 45, 50000000, 52000000, 51500000, 1500000, 300, "manual_sell", "{}"),
        )
    assert sync.needs_sync(database, state_path) is True


def test_state_file_contains_hash_only_not_private_identifiers(tmp_path):
    database = tmp_path / "arena.sqlite"
    state_path = tmp_path / "sync-state.json"
    build_database(database)
    sync.save_sync_state(state_path, {"fingerprint": sync.arena_fingerprint(database)})
    serialized = state_path.read_text()
    assert "profile-private" not in serialized
    assert "mint-private" not in serialized
    assert len(json.loads(serialized)["fingerprint"]) == 64
