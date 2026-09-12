# Bounded unattended work

## Required job contract
Before scheduling, fill in the actual values:
- Owner: one coordinator.
- Allowed project/workdir: explicit local directory.
- Task: one bounded result.
- Allowed file changes: explicit scope.
- Prohibited actions: no unapproved external messages, deployments, purchases, account changes, deletions or gateway restarts.
- Budget: time, iterations and spend limit where the runtime/provider supports it.
- Stop conditions: completion, repeated failure, human gate or exhausted budget.
- Verification: exact acceptance checks.
- Receipt path: a project-local report.
- Delivery: local only until tested; then an explicitly verified destination.

## Before enabling
- Run the task once manually and inspect its result.
- Verify the gateway/scheduler is actually running and the computer will remain awake.
- Check for an existing job with the same goal. Do not clone it into several profiles.
- Confirm timezone, job ID, next run, enabled state and delivery target.
- Use a real lock for overlapping scheduled commands. Separate worktrees isolate code edits but not external side effects.
- Keep high-memory jobs outside the messaging gateway's process group using an appropriate supervisor.

## After a run
Record outcome, changed files, checks, error text if any and next action. A successful cron tick is not proof that the underlying task succeeded.
