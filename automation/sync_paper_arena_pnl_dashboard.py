#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HOME = Path.home()
WORKSPACE = HOME / ".openclaw" / "workspace"
SOURCE_REPO = WORKSPACE / "workspaces" / "michaelcostea-com"
DEFAULT_DATABASE = WORKSPACE / "workspaces" / "microcap-autotrader" / "state" / "manual-paper-arena.sqlite"
DEFAULT_CLONE = HOME / ".cache" / "paper-arena-pnl-sync" / "repo"
DEFAULT_STATE = HOME / ".local" / "state" / "paper-arena-pnl-sync" / "state.json"
DEFAULT_LOCK = HOME / ".local" / "state" / "paper-arena-pnl-sync" / "sync.lock"
DEFAULT_REMOTE = "https://github.com/five0nit/michaelcostea-com.git"
DEFAULT_BRANCH = "main"

FINGERPRINT_QUERIES = (
    (
        "profiles",
        "select profile_id,claimed from profiles order by profile_id",
    ),
    (
        "wallets",
        """
        select wallet_id,profile_id,active,initial_lamports,wallet_lamports,
               realized_pnl_lamports,closed_trades,wins,losses,open_positions
        from arena_wallets order by profile_id,wallet_id
        """,
    ),
    (
        "trades",
        """
        select trade_id,profile_id,wallet_id,position_id,mint,decision_ts,exit_ts,
               input_lamports,gross_out_lamports,net_out_lamports,pnl_lamports,pnl_bps,reason
        from manual_trades order by trade_id
        """,
    ),
    (
        "positions",
        """
        select position_key,profile_id,wallet_id,position_id,mint,decision_ts,
               input_lamports,entry_market_cap_sol,entry_haircut_bps
        from open_positions order by position_key
        """,
    ),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def arena_fingerprint(database: Path) -> str:
    database = Path(database)
    if not database.exists():
        raise FileNotFoundError(f"Paper Arena database not found: {database}")
    payload: dict[str, list[list[Any]]] = {}
    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True, timeout=10)
    try:
        connection.execute("pragma query_only=on")
        for label, query in FINGERPRINT_QUERIES:
            payload[label] = [list(row) for row in connection.execute(query)]
    finally:
        connection.close()
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def load_sync_state(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(Path(path).read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def save_sync_state(path: Path, state: dict[str, Any]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(path.parent, 0o700)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    os.chmod(temporary, 0o600)
    temporary.replace(path)
    os.chmod(path, 0o600)


def needs_sync(database: Path, state_path: Path, *, force: bool = False) -> bool:
    if force:
        return True
    return load_sync_state(state_path).get("fingerprint") != arena_fingerprint(database)


def run(command: list[str], *, cwd: Path | None = None, timeout: int = 300) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, capture_output=True, timeout=timeout, check=True)


def git(repo: Path, *arguments: str, timeout: int = 300) -> str:
    return run(["git", "-C", str(repo), *arguments], timeout=timeout).stdout.strip()


def ensure_clone(clone: Path, remote: str, branch: str) -> None:
    clone = Path(clone)
    if not (clone / ".git").exists():
        clone.parent.mkdir(parents=True, exist_ok=True)
        run(["git", "clone", "--branch", branch, "--single-branch", remote, str(clone)], timeout=300)
    git(clone, "remote", "set-url", "origin", remote)
    git(clone, "fetch", "--prune", "origin", branch, timeout=300)
    git(clone, "checkout", "-B", "paper-arena-auto-sync", f"origin/{branch}")
    git(clone, "reset", "--hard", f"origin/{branch}")
    git(clone, "clean", "-fd")


def configure_commit_identity(clone: Path, source_repo: Path) -> None:
    for key, fallback in (("user.name", "Paper Arena Sync"), ("user.email", "paper-arena-sync@users.noreply.github.com")):
        value = ""
        try:
            value = git(source_repo, "config", "--get", key)
        except subprocess.CalledProcessError:
            pass
        git(clone, "config", key, value or fallback)


def sync_once(
    *,
    database: Path,
    clone: Path,
    state_path: Path,
    remote: str,
    branch: str,
    force: bool = False,
    push: bool = True,
) -> dict[str, Any]:
    fingerprint = arena_fingerprint(database)
    previous = load_sync_state(state_path)
    if not force and previous.get("fingerprint") == fingerprint:
        return {
            "status": "unchanged",
            "fingerprint": fingerprint,
            "published_commit": previous.get("published_commit"),
            "checked_utc": utc_now(),
        }

    ensure_clone(clone, remote, branch)
    configure_commit_identity(clone, SOURCE_REPO)
    generator = clone / "automation" / "generate_polymarket_pnl_dashboard.py"
    regression = clone / "tests" / "pnl-console-regression.cjs"
    if not generator.exists() or not regression.exists():
        raise RuntimeError("sync clone is missing dashboard generator or regression test")

    run([sys.executable, str(generator)], cwd=clone, timeout=300)
    run(["node", str(regression)], cwd=clone, timeout=180)
    changed = git(clone, "status", "--porcelain", "--", "ops/pnl-console/trades.json")
    if not changed:
        published_commit = git(clone, "rev-parse", "HEAD")
        state = {
            "fingerprint": fingerprint,
            "published_commit": published_commit,
            "published_utc": utc_now(),
            "status": "no-data-diff",
        }
        save_sync_state(state_path, state)
        return state

    git(clone, "add", "--", "ops/pnl-console/trades.json")
    staged = git(clone, "diff", "--cached", "--name-only")
    if staged.splitlines() != ["ops/pnl-console/trades.json"]:
        raise RuntimeError(f"refusing unexpected staged paths: {staged}")
    git(clone, "commit", "-m", "data: sync Paper Arena PNL snapshot")
    published_commit = git(clone, "rev-parse", "HEAD")
    if push:
        git(clone, "push", "origin", f"HEAD:{branch}", timeout=300)
    state = {
        "fingerprint": fingerprint,
        "published_commit": published_commit,
        "published_utc": utc_now(),
        "status": "published" if push else "committed-local-only",
    }
    save_sync_state(state_path, state)
    return state


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish anonymized Paper Arena state to the static PNL Console when relevant ledger state changes.")
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--clone", type=Path, default=DEFAULT_CLONE)
    parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    parser.add_argument("--lock", type=Path, default=DEFAULT_LOCK)
    parser.add_argument("--remote", default=DEFAULT_REMOTE)
    parser.add_argument("--branch", default=DEFAULT_BRANCH)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Check the fingerprint only; do not clone, generate, commit, or push.")
    parser.add_argument("--no-push", action="store_true", help="Generate and commit in the isolated clone without pushing.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.lock.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with args.lock.open("a+", encoding="utf-8") as lock_handle:
        os.chmod(args.lock, 0o600)
        try:
            fcntl.flock(lock_handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print(json.dumps({"status": "locked", "message": "another Paper Arena PNL sync is running"}))
            return 0
        if args.dry_run:
            fingerprint = arena_fingerprint(args.database)
            result = {
                "status": "would-sync" if needs_sync(args.database, args.state, force=args.force) else "unchanged",
                "fingerprint": fingerprint,
                "saved_fingerprint": load_sync_state(args.state).get("fingerprint"),
            }
        else:
            result = sync_once(
                database=args.database,
                clone=args.clone,
                state_path=args.state,
                remote=args.remote,
                branch=args.branch,
                force=args.force,
                push=not args.no_push,
            )
        print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
