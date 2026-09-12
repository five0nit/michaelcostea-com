# Verification report

Checked 2026-09-12 on the author's Linux/WSL installation.

## Checks actually performed

- **27 offline tests passed.** Covers installer/pack behaviour (dry-run, exact-byte installation, unchanged credentials/configuration/memory, backups, repeat-install no-op, rollback on an injected write failure, incomplete-pack rejection, symlink rejection, skill metadata and local guide links) plus four content regressions for the review corrections below. Content regressions are not live service tests.
- **17 configuration command executions passed (16 unique commands)** using the installed Hermes CLI and an isolated temporary `HERMES_HOME`. Confirmed the placeholder provider setting survived, the final approval mode was `manual`, the final turn limit was 90, and `terminal.cwd` resolved to the intended temporary project path. No model request was made.
- **All eight starter skills discovered** by the installed Hermes CLI after installation into that isolated home. Discovery does not claim an LLM executed every skill.
- **YAML references parsed**, including approval mode `"off"` as a string rather than a YAML boolean.
- **43 Bash blocks passed syntax parsing** without executing their installation, authentication, service or scheduling actions.
- **23 numbered chapters checked**; the portable template generator reproduces 36 shipped files byte-for-byte.
- **Desktop 1440×1000 and mobile 390×844 browser checks passed.** No page-width overflow, broken internal anchors, page exceptions or external asset requests. Long code blocks scroll within their own containers. Desktop opening and mobile installation screenshots were visually inspected. The temporary headless browser was closed.
- **26 unique linked source URLs returned HTTP 200**, without a detected not-found title, during link checking. Availability can change after this check.
- **Final allowlisted archive checked after extraction:** exact member bytes, local HTML links, privacy patterns, skill inventory and a repeat of all 27 offline tests. Private detailed receipts and screenshot paths stay outside the public pack.

## Brief2Ship correction

The pack now includes the unmodified public Brief2Ship skill, its six references and MIT LICENSE from the pinned upstream commit in `references/Brief2Ship-UPSTREAM.md`. The matching CLI is a separate reader-side install. The private installed skill was not exported. Tests cover missing/modified upstream references and exact-byte installation of all 16 managed files.

## Revised edition: review corrections

- Pin `terminal.cwd` before gateway startup; check `pwd` and the intended `AGENTS.md` again in a fresh service-backed Telegram session.
- Distinguish profile state separation from shared root OAuth and OS-user CLI authentication; verify the real account before account-sensitive work.
- Explain installation-wide update and automatic gateway restart scope before the update command, with approval covering every affected profile.
- Show post-execution `cron list --all`, supported `cron runs` with version fallback, and the profile-specific local response directory.

These corrections were checked against official profiles/updating/cron documentation and installed source/CLI help. CLI/config, content and rendering checks were rerun. The Telegram/service/scheduler acceptance steps themselves remain reader-side checks; no live gateway was changed for this revision.

## Privacy review

The package was assembled separately from the active profile. Checked filenames and text for live state files, personal home-directory paths, known private account identifiers and credential patterns. Compared against locally available credential values without printing them. Public documentation URLs and the previously published SOUL reference are intentional. A pattern scan is supporting evidence, not a guarantee against every possible contextual disclosure.

## Not performed for this guide

- A fresh Windows/WSL/Linux/macOS OS or Hermes installation.
- A fresh Brief2Ship CLI installation from the pinned source snapshot.
- New model-provider login or a provider inference request.
- Telegram bot creation, gateway restart/service installation, scheduled execution or external message delivery.
- Authenticated Windows desktop/browser setup, voice generation or transcription.
- Public website deployment, Git commit or social publication.

The inspected CLI reports Hermes Agent v0.21.1 (2026.9.7); its local source includes changes. This is a tested public starter pack, not certification of a fresh reader's entire environment. Follow the guide's reader-side checkpoints for the remaining end-to-end setup.

Background research tasks that timed out are not counted as passed reviews. Final checks above were run directly.
