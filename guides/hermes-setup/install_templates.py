#!/usr/bin/env python3
"""Install only the public SOUL and starter skills. No network or dependencies."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import hashlib
import os
from pathlib import Path
import shutil
import sys
import tempfile


BRIEF2SHIP_HASHES = {'SKILL.md': '53f97c2ae83bf15aea6d8cef97426de2be134824dcb07f8c7cd34ff01988d448', 'references/cli-shell-feature-topic-case.md': '2b1286b6e7b0877aa1ccc8841db22fe40e0eaf2f1bf6856b88e87192e4dd1692', 'references/curated-discovery-and-agent-entropy-gate.md': 'ccc7445b659ef7b658bb4204b914edc3bc195d289cbc21dd4bd47e497d6696bb', 'references/curated-list-discovery.md': 'a9fb8e05575c54ef9787b87bb8991b21a636033703dba1967da8b6799d5e9f90', 'references/delivery-and-research.md': '469bcbca493a546f2255ee1d63f5ede1a33585c70bcc75d81c2506608586a15e', 'references/historical-data-source-repo-first.md': '2fe951d99db76232847dd322cab1b435cc3ca74079aa8d947e79dbfaf2ac91ba', 'references/talking-avatar-case-study.md': '166751d1f998bad4a258ebd9c67d804b1d3a195effd34e123925afdd759edeaa', 'LICENSE': 'ad3f23dba85a0b479676dfb6a5ca0bbfeed7ef5284a1958ce237231b25574ed9'}

def checked_path(path: Path) -> Path:
    """Reject symlinks rather than silently following them into another profile."""
    path = Path(os.path.abspath(path.expanduser()))
    for part in [path, *path.parents]:
        if part.is_symlink():
            raise ValueError(f"Refusing symlink path: {part}")
    return path


def collect(root: Path, home: Path) -> list[tuple[Path, Path]]:
    pairs = [(root / "templates" / "SOUL.md", home / "SOUL.md")]
    sources = sorted((root / "skills").glob("*/SKILL.md"))
    expected = {'generalist-workflow', 'brief2ship', 'verify-before-done',
                'evidence-led-research', 'project-handoff', 'public-content-check',
                'bounded-autonomy', 'plainspoken-output'}
    if {p.parent.name for p in sources} != expected:
        raise ValueError("Starter skill set is incomplete or changed. Extract the entire original ZIP first.")
    for source in sources:
        if source.parent.name != 'brief2ship':
            pairs.append((source, home / "skills" / source.parent.name / "SKILL.md"))
    upstream = root / 'skills/brief2ship'
    actual = {p.relative_to(upstream).as_posix() for p in upstream.rglob('*') if p.is_file()}
    if actual != set(BRIEF2SHIP_HASHES):
        raise ValueError('Brief2Ship bundle is incomplete or changed. Extract the entire original ZIP first.')
    for relative, digest in sorted(BRIEF2SHIP_HASHES.items()):
        source = checked_path(upstream / relative)
        if hashlib.sha256(source.read_bytes()).hexdigest() != digest:
            raise ValueError(f'Brief2Ship upstream byte mismatch: {relative}')
        pairs.append((source, home / 'skills/brief2ship' / relative))
    for source, target in pairs:
        checked_path(source)
        checked_path(target)
        if not source.is_file():
            raise ValueError(f"Missing source file: {source}")
        if target.exists() and not target.is_file():
            raise ValueError(f"Destination is not a regular file: {target}")
    return pairs


def atomic_write(target: Path, data: bytes) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".starter-", dir=target.parent)
    temp = Path(name)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, target)
    finally:
        temp.unlink(missing_ok=True)


def run(root: Path, home: Path, apply: bool) -> dict:
    home = checked_path(home)
    if not home.is_dir():
        raise ValueError("Profile directory does not exist. Create the Hermes profile first.")
    if not (home / "config.yaml").is_file():
        raise ValueError("No config.yaml in target. Resolve the profile with `hermes -p NAME config path`.")
    pairs = collect(root, home)
    changed = [(s, t) for s, t in pairs if not t.exists() or s.read_bytes() != t.read_bytes()]
    result = {
        "mode": "apply" if apply else "dry-run",
        "profile_home": str(home),
        "managed_files": len(pairs),
        "changes": [str(t.relative_to(home)) for _, t in changed],
        "untouched": ["config.yaml", ".env", "auth.json", "memories", "sessions", "cron", "gateways", "project files"],
    }
    if not apply or not changed:
        result["verified"] = not changed
        return result
    backup_parent = checked_path(home / "backups")
    backup_parent.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = Path(tempfile.mkdtemp(prefix=f"generalist-starter-{stamp}-", dir=backup_parent))
    existed = []
    new_files = []
    for _, target in changed:
        relative = target.relative_to(home)
        if target.exists():
            dest = backup / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, dest)
            existed.append(str(relative))
        else:
            new_files.append(str(relative))
    (backup / "manifest.json").write_text(json.dumps({"replaced": existed, "new_files": new_files}, indent=2) + "\n")
    installed = []
    try:
        for source, target in changed:
            atomic_write(target, source.read_bytes())
            installed.append(target)
        if not all(s.read_bytes() == t.read_bytes() for s, t in pairs):
            raise RuntimeError("Post-install byte verification failed")
    except Exception:
        for target in reversed(installed):
            relative = target.relative_to(home)
            saved = backup / relative
            if saved.is_file():
                shutil.copy2(saved, target)
            else:
                target.unlink(missing_ok=True)
        raise
    result.update({"backup": str(backup), "verified": True})
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile-home", required=True, type=Path,
                        help="Exact existing profile directory from `hermes -p NAME config path`")
    parser.add_argument("--apply", action="store_true", help="Apply after reviewing dry-run; back up changed files first")
    args = parser.parse_args()
    try:
        print(json.dumps(run(Path(__file__).resolve().parent, args.profile_home, args.apply), indent=2))
        return 0
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
