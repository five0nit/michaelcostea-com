---
title: External Client Framework
version: 1.0
status: Draft client-ready pack
prepared_by: Michael Costea
style: MichaelOS × Nous field-note
---

# Business Agent Harness Framework

## Executive summary

A Business Agent Harness gives a company a safe way to use AI agents inside normal work.

Instead of staff privately experimenting with random AI tools, the business gets a shared operating room where:

- staff ask for help in approved Discord channels,
- agents respond within defined permissions,
- managers can see what happened,
- approvals are visible before risky actions,
- daily summaries and receipts create accountability.

The goal is not to replace staff. The goal is to remove bottlenecks, reduce repetitive admin, and give people a reliable support layer for research, drafting, checking, reporting, and operational follow-up.

## What the harness includes

| Layer | What it does | Client benefit |
|---|---|---|
| Discord operating room | Shared channels for requests, approvals, reports, and support | Everyone can see the work instead of losing context in private chats |
| Agent roster | Named agents with defined jobs and limits | Staff know which agent to ask and what it can safely do |
| Permission model | Role-based access for users and bots | Agents only see and do what they need |
| Human approval gates | Clear rules before external, financial, customer, or destructive actions | Control stays with the business |
| Memory and receipts | Summaries, task logs, decision records, and handovers | The system improves without becoming a black box |
| Monitoring | Daily reports, error channels, and escalation paths | Problems are visible early |

## Example business setup

For most small and mid-sized businesses, start with five channels:

| Channel | Purpose | Who can use it |
|---|---|---|
| `#agent-helpdesk` | General staff requests | All approved staff |
| `#approvals` | Manager sign-off before sensitive actions | Managers + agents |
| `#daily-briefings` | Daily summary of what happened | Staff read, agents post |
| `#agent-reports` | Longer reports, audits, and handovers | Managers + operators |
| `#incident-log` | Errors, blocked actions, security concerns | Managers + maintainer |

Then add department channels only when needed, such as `#sales-agent`, `#ops-agent`, `#admin-agent`, or `#marketing-agent`.

## Example agent roster

| Agent | Best for | Should not do without approval |
|---|---|---|
| Coordinator Agent | Routes requests, summarizes work, checks status | Make public commitments or change permissions |
| Research Agent | Competitor research, supplier lookup, source summaries | Contact vendors, scrape private data, cite weak sources as fact |
| Admin Agent | Draft emails, SOPs, forms, checklists | Send email, delete records, access payroll/HR without explicit scope |
| Reporting Agent | Daily/weekly reports, metrics summaries | Change dashboards or publish metrics externally |
| Customer Support Drafting Agent | Draft replies and classify themes | Send final customer responses unless approved |

## Permission philosophy: small keyrings

A safe business agent should have the smallest set of keys needed for its job.

Good permission design:

- read-only before write access,
- one department before whole company access,
- draft-only before send/publish authority,
- manager approval before customer, payment, legal, HR, or public actions,
- separate owner/admin permissions from day-to-day user permissions.

## Rollout phases

| Phase | Duration | Goal | Success sign |
|---|---:|---|---|
| 0. Discovery | Before install | Map teams, tools, risks, and use cases | Clear first 3 workflows chosen |
| 1. Safe room | Day 1 | Discord server, roles, channels, agents, approvals | Staff can ask and receive safe help |
| 2. Assisted workflows | Week 1–2 | Agents draft, research, summarize, report | Managers see useful receipts |
| 3. Limited tool access | Week 2–4 | Carefully connect business tools | No blind automation; approvals work |
| 4. Operating rhythm | Month 2+ | Daily summaries, weekly tuning, training | Staff trust the system and use it naturally |

## What actions require approval

Always require a named human approval before an agent:

- sends emails or customer replies,
- posts publicly,
- changes website/live systems,
- modifies financial, legal, HR, or payroll records,
- invites users or changes permissions,
- deletes data,
- buys software or spends money,
- exports customer data,
- contacts external suppliers/customers.

## Client responsibilities

The business must provide:

- one business owner or executive sponsor,
- one operational champion,
- list of users and departments,
- approved first workflows,
- access owner for each business system,
- permission decisions before tools are connected,
- staff availability for training.

## Deliverables from the installation

By the end of the install, the client should have:

- a configured Discord server,
- staff roles and manager roles,
- agent/bot roles and channels,
- an approval workflow,
- example prompts and request templates,
- daily briefing/report channels,
- a first agent roster,
- acceptance test results,
- training guide for staff.

## Success metrics

Track early value with simple indicators:

- requests handled per week,
- staff time saved on repetitive drafting/research/admin,
- number of tasks requiring manager approval,
- number of blocked unsafe requests,
- average response time,
- top recurring request types,
- unresolved incidents or access blockers.

## Plain-English safety promise

Agents can help the business move faster, but they should not become invisible employees with unlimited access. The harness keeps AI work visible, reviewable, and permissioned.
