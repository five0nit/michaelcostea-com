# Project operating instructions

## Scope
This file applies to this project. Read README.md first. Discover the actual stack and commands; do not guess them from this template.

## Before editing
- Inspect git status and existing changes. Preserve unrelated work.
- Read docs/STATUS.md, docs/DECISIONS.md and docs/HANDOFF.md when present.
- Confirm the requested result and how it will be verified.
- For a new implementation base, load brief2ship and run bounded CLI discovery before writing code or installing dependencies. Follow its scoped exceptions for tiny edits or an already chosen canonical base.

## Working rules
- Make the smallest complete change. No unrelated rewrites.
- Use the repository's actual package manager and lockfile.
- Never commit .env, auth files, cookies, session exports or customer records.
- Keep generated output and runtime state out of source control unless explicitly required.
- No public deployment, message sending or live service restart unless authorised for this task.
- Use separate worktrees or explicit file ownership for parallel changes. A Markdown note is not a lock.

## Completion
- Exercise the changed behaviour, including at least one meaningful error path where applicable.
- Report exact commands and real results. Mark unrun checks as not run.
- Re-read externally changed state using the exact returned ID or URL.
- Update docs/STATUS.md and docs/HANDOFF.md with enough context for another agent to continue.
- Keep secrets and machine-specific paths out of publishable evidence.
