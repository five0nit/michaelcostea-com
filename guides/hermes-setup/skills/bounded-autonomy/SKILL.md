---
name: bounded-autonomy
description: "Use for unattended work. Bound scope and verify scheduling."
version: 1.0.0
---

# Bounded autonomy

Read the project's OVERNIGHT_AUTONOMY.md first. Require one concrete task, owner, workdir, allowed actions, budget, stop conditions, receipt path and delivery target.

Start with one coordinator. Use separate bounded lanes only when they materially help. Check existing jobs to avoid duplicates. Run the task once manually before scheduling.

Use the installed scheduler for durable jobs. A child delegate is not durable across parent interruption. Verify the job's ID, schedule, timezone, next run, enabled state and destination through readback.

Use a real lock for commands that can overlap. Do not claim a lock, supervisor or mailbox exists unless tested. Keep heavy local model generation separate from the messaging gateway's process group.

Pause at missing authority, repeated failure, exhausted budget or a human authentication/payment gate. Do not turn a local task into unapproved outbound work.

Inspect the output receipt after the first run. Scheduler health and task success are separate checks.
