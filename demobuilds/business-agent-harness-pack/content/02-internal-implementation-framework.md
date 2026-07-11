---
title: Internal Implementation Framework
version: 1.0
status: Draft client-ready pack
prepared_by: Michael Costea
style: MichaelOS × Nous field-note
---

# Internal Implementation Framework

## Implementation objective

Build a repeatable business agent harness that can be installed for different clients without rebuilding governance from scratch.

The framework must support:

- client-facing explanation,
- internal technical setup,
- Discord server/channel/role configuration,
- agent roster and permission model,
- approval gates,
- monitoring and receipts,
- training and handover.

## Reference architecture

```text
Business users
  ↓ requests / approvals
Discord server operating room
  ↓ channel permissions + bot roles
Agent gateway / harness layer
  ↓ policies, memory, receipts, escalation rules
Specialist agents
  ↓ read/draft/report/check actions
Business tools and documents
```

## Harness components

| Component | Required | Notes |
|---|---:|---|
| Discord server | Yes | Shared room for requests, approvals, and receipts |
| Discord bot/app | Yes | One bot identity per environment or per agent lane, depending on setup |
| Agent gateway | Yes | Routes messages from Discord to agent profiles and back |
| Agent profiles | Yes | Separate instructions, tool access, and memory boundaries |
| Memory / handoff store | Yes | Stores summaries, decisions, project state, receipts |
| Approval policy | Yes | Defines what requires human sign-off |
| Monitoring/reporting | Yes | Daily digest, errors, blocked actions, uptime/status |
| Business tool connectors | Optional | Only after safe-room phase is stable |

## Internal role map

| Role | Person | Responsibility |
|---|---|---|
| Project owner | Michael / client sponsor | Commercial scope, final go/no-go |
| Harness implementer | Technical lead | Server, agents, gateway, docs, tests |
| Business champion | Client-side operator | Staff training, use-case triage |
| Access owner | Client IT/admin | Approves tool access and permissions |
| Agent maintainer | Michael/team | Monitors failures, improves prompts/tools |
| Department lead | Client manager | Approves department-specific actions |

## Agent profile template

Every business agent should have an agent card:

```yaml
agent_name: Reporting Agent
business_owner: Operations Manager
purpose: Summarise daily operational activity and draft weekly reports
allowed_channels:
  - daily-briefings
  - agent-reports
allowed_tools:
  - read approved reporting folder
  - summarise uploaded CSV/PDF/DOCX
  - draft reports
approval_required_for:
  - publishing reports externally
  - emailing reports to customers
  - changing dashboard formulas
forbidden:
  - payroll access
  - deleting files
  - changing user permissions
receipt_required: true
fallback: tag @Agent Maintainer in #incident-log
```

## Channel taxonomy

| Channel type | Naming pattern | Purpose |
|---|---|---|
| Helpdesk | `#agent-helpdesk` | General requests and triage |
| Approval | `#approvals` | Human sign-off before sensitive actions |
| Department | `#sales-agent`, `#ops-agent` | Department-specific workflows |
| Reporting | `#daily-briefings`, `#agent-reports` | Summaries, handovers, metrics |
| Support | `#incident-log`, `#agent-admin` | Errors, access issues, maintenance |
| Read-only library | `#agent-how-to`, `#templates` | Staff guidance and prompt examples |

## Permission classes

| Class | Meaning | Example |
|---|---|---|
| View | Can read channel/file/tool data | Research agent sees public supplier docs |
| Draft | Can propose text or changes | Admin agent drafts email but cannot send |
| Comment | Can add notes or labels | Reporting agent comments on task status |
| Write | Can edit approved records | Only after workflow is tested |
| Send/publish | Can communicate externally | Usually human approval required |
| Admin | Can change users, roles, config | Humans only by default |

## Approval gates

Use a standard approval phrase in Discord:

```text
APPROVED: [agent/action] for [scope] until [time/window]. Approved by [name].
```

Example:

```text
APPROVED: Reporting Agent may generate the weekly operations report from the June dashboard and post a draft in #agent-reports today only. Approved by Sarah.
```

Agents should refuse or escalate if approval is missing, ambiguous, stale, or out of scope.

## Standard business workflows

### 1. Research and summary

- User asks in `#agent-helpdesk`.
- Coordinator routes to Research Agent.
- Research Agent replies with sources and confidence.
- If external contact is needed, agent drafts only and asks for approval.

### 2. Customer response drafting

- Staff paste customer context into approved channel.
- Support Drafting Agent writes a suggested response.
- Staff edits/sends manually unless explicit send authority exists.
- Agent records theme in daily summary.

### 3. Daily operations briefing

- Reporting Agent reviews approved logs or uploads.
- Posts a concise daily briefing.
- Flags blockers, overdue approvals, and repeated issues.
- Does not change source systems unless separately approved.

### 4. Document/SOP drafting

- User requests SOP from known facts.
- Admin Agent drafts in channel or approved docs area.
- Department lead reviews and marks approved.
- Final copy is stored in the business library.

## Internal acceptance tests

Before handover, verify:

- staff user can ask in `#agent-helpdesk`,
- non-manager cannot approve sensitive action,
- manager can approve in `#approvals`,
- agent refuses a forbidden request,
- agent posts a receipt after completing a safe request,
- daily briefing can be generated,
- incident can be logged,
- agent cannot see private channels it should not access,
- all bot tokens/secrets are stored outside client-visible docs,
- disaster fallback / disable process is documented.

## Monitoring and operations

Daily:

- check `#incident-log`,
- check failed tasks,
- review daily briefing quality,
- identify repeated request types.

Weekly:

- tune agent prompts,
- remove unused channels,
- update templates,
- review access register,
- check approval logs,
- confirm staff questions are decreasing.

Monthly:

- review ROI metrics,
- rotate/review credentials where applicable,
- test disable/revoke path,
- assess whether any agent should gain or lose permissions.

## Internal risk register

| Risk | Control |
|---|---|
| Agent gets too much access | Small keyrings, channel-specific bot roles, read/draft-first policy |
| Staff over-trust outputs | Training, confidence labels, source links, review gates |
| Private data leaks into broad channels | Channel map, department permissions, redaction rules |
| Approval ambiguity | Standard approval phrase and expiry window |
| Silent failure | Incident channel, daily status, watchdog/reporting |
| Client asks for unsafe automation | Refuse, propose draft-only or approval-gated alternative |

## Handover standard

Do not consider the install complete until:

- the client sponsor has seen the approval workflow,
- at least one staff member has completed a practice request,
- an agent has refused an unsafe request correctly,
- the business champion knows where to report issues,
- the access register is complete,
- the training guide is delivered.
