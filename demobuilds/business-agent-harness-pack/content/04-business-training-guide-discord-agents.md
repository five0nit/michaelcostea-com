---
title: Business Training Guide - Using Agents in Discord
version: 1.0
status: Draft client-ready pack
prepared_by: Michael Costea
style: MichaelOS × Nous field-note × Hyperframes
---

# Training Guide: How Staff Should Work With Agents in Discord

## The simple idea

Agents are helpers inside Discord. They can draft, research, summarize, check, organize, and report. They are not managers and they are not allowed to quietly take risky actions without approval.

Use them like a trained assistant:

- tell them the job,
- give them the context,
- say what good output looks like,
- check the answer,
- approve only when needed.

## Where to ask for help

| Need | Use this channel |
|---|---|
| General AI help | `#agent-helpdesk` |
| Manager approval | `#approvals` |
| Daily updates | `#daily-briefings` |
| Longer reports | `#agent-reports` |
| Problems or wrong answers | `#incident-log` |
| Department-specific work | `#sales-agent`, `#ops-agent`, `#marketing-agent`, etc. |

## How to write a good request

Use this format:

```text
@AgentName
Goal: what you want done
Context: what the agent needs to know
Output: format you want back
Deadline: when you need it
Limits: what not to do
```

Example:

```text
@Research Agent
Goal: Find 5 local competitors offering emergency plumbing services.
Context: We operate in Melbourne's south-east and want public website examples only.
Output: Table with business name, website, services, pricing signals, and notes.
Deadline: Today 3pm.
Limits: Do not contact anyone. Do not use private data.
```

## Good request examples

### Drafting

```text
@Admin Agent
Goal: Draft a polite follow-up email to a customer who has not replied to our quote.
Context: Quote was sent 5 days ago. We want friendly, not pushy.
Output: 2 versions: short SMS-style and full email.
Limits: Draft only. Do not send.
```

### Summarising

```text
@Reporting Agent
Goal: Summarise the uploaded operations notes.
Output: 5 bullet executive summary, blockers, and next actions.
Limits: If anything is unclear, ask before assuming.
```

### Checking

```text
@Coordinator Agent
Goal: Check this SOP draft for missing steps.
Context: It is for new admin staff.
Output: List gaps, risky assumptions, and recommended edits.
```

### Research

```text
@Research Agent
Goal: Compare three scheduling tools for a 12-person service business.
Output: Table with pricing, key features, limitations, and recommended choice.
Limits: Use public sources and include links.
```

## What agents should not do without approval

Agents must not independently:

- email customers,
- post publicly,
- change pricing,
- delete files,
- edit financial, HR, payroll, or legal records,
- invite new users,
- change Discord permissions,
- spend money,
- export customer data,
- make promises to clients or suppliers.

If you want an agent to do something sensitive, use `#approvals`.

## How approvals work

Approvals need to be specific.

Use this format:

```text
APPROVED: [agent/action] for [scope] until [time/window]. Approved by [name].
```

Good approval:

```text
APPROVED: Admin Agent may draft a follow-up email for Quote #1042 and post it here for review today. Approved by Sarah.
```

Bad approval:

```text
Yeah that's fine.
```

Why bad? It does not say what is approved, for how long, or who approved it.

## How to review an agent answer

Before using an answer, check:

- does it match the request,
- did it invent anything,
- are sources included where needed,
- is the tone suitable for customers/staff,
- does it need manager approval,
- did it follow the stated limits.

If something is wrong, correct it directly:

```text
That is too formal. Rewrite in a warmer tone and keep it under 120 words.
```

or:

```text
You assumed we offer same-day delivery. Remove that and ask me if timing is needed.
```

## How to report problems

Use `#incident-log` if:

- an agent gives unsafe advice,
- an agent can see something it should not,
- an agent refuses a request that should be allowed,
- an agent repeats wrong information,
- a user accidentally shares sensitive data,
- the bot is offline or behaving oddly.

Incident report template:

```text
Issue:
Channel:
Agent:
What happened:
What should have happened:
Urgency:
Screenshot/link if available:
```

## Staff do and don’t list

### Do

- Use clear goals.
- Give enough context.
- Ask for drafts, tables, summaries, and checklists.
- Keep sensitive work in the right channel.
- Ask the agent to explain uncertainty.
- Tag a manager for approvals.
- Report problems early.

### Don’t

- Paste passwords, credit card details, or private HR/medical data.
- Ask agents to bypass permissions.
- Treat outputs as automatically correct.
- Tell agents to contact customers unless the workflow allows it.
- Use private DMs for business-critical agent work unless approved.
- Change roles/permissions without the maintainer.

## First training exercises

During staff training, complete these exercises:

1. Ask the Coordinator Agent what it can help with.
2. Ask the Research Agent for a public-source competitor summary.
3. Ask the Admin Agent to draft an internal email.
4. Ask Reporting Agent to summarize a short note.
5. Try a request that should require approval.
6. Practice writing a correct approval message.
7. Report a mock issue in `#incident-log`.

## Quick reference card

```text
Good prompt = Goal + Context + Output + Deadline + Limits
Sensitive action = ask in #approvals
Problem = report in #incident-log
External action = draft first, approve second
Trust = receipts, sources, and human review
```
