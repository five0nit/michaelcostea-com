---
name: project-handoff
description: "Use for shared work or handoffs. Leave durable project state."
version: 1.0.0
---

# Project handoff

Before work, read README.md, AGENTS.md and existing docs/STATUS.md, docs/DECISIONS.md and docs/HANDOFF.md. Inspect git status. If no notes exist, create only what the task needs.

For parallel work, name the owner, allowed files/worktree, output and acceptance check. Never assume a text status note prevents concurrent writes; use actual workspace isolation or locking.

After meaningful work, update STATUS and HANDOFF with the goal, files changed, branch/worktree, real checks and results, unrun checks, blockers and next action. Log important alternatives and reasons in DECISIONS.

Save stable procedures to skills, not global memory. Save temporary project state here, not in the user's biography. Sanitize separately before public sharing.

This is a portable Markdown coordination pattern. It does not claim the private team-sync scripts or an automatic mailbox are installed.
