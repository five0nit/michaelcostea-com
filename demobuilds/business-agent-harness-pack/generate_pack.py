from pathlib import Path
from textwrap import dedent
import json
root = Path(__file__).resolve().parents[2]
pack = root/'demobuilds/business-agent-harness-pack'
content = pack/'content'
pack.mkdir(parents=True, exist_ok=True)
content.mkdir(parents=True, exist_ok=True)
shared_header = """---\ntitle: {title}\nversion: 1.0\nstatus: Draft client-ready pack\nprepared_by: Michael Costea\nstyle: MichaelOS × Nous field-note\n---\n"""
docs = {}
docs['00-pack-readme.md'] = shared_header.format(title='Business Agent Harness Pack - README') + dedent('''
# Business Agent Harness Pack

This pack explains, installs, and trains a business-ready AI agent harness using Discord as the shared operating room.

## Pack contents

| File | Audience | Purpose |
|---|---|---|
| `01-external-client-framework.md` | Business owners / managers | Plain-English explanation of what the agent harness is, how rollout works, and what governance is included. |
| `02-internal-implementation-framework.md` | Michael / implementation team | Technical operating framework, roles, configuration model, safety gates, monitoring, and handover checklist. |
| `03-onsite-install-discord-permissions-guide.md` | Installer + business admin | Step-by-step day-of-install guide for Discord, roles, permissions, channels, agents, and acceptance tests. |
| `04-business-training-guide-discord-agents.md` | Business users | How staff should ask for help, approve work, give feedback, and escalate safely in Discord. |
| `05-templates-and-checklists.md` | Both | Reusable templates: discovery worksheet, access register, agent card, channel map, training agenda, acceptance checklist. |

## Positioning

The agent harness is not “a chatbot”. It is a governed operating layer where staff can request work, agents can help, and managers can see receipts, approvals, and boundaries.

## Default stance

- Start narrow.
- Keep humans in approval loops.
- Give agents small keyrings, not master keys.
- Make work visible in channels, not hidden in private DMs.
- Use daily summaries and incident logs so trust is earned.
''')

docs['01-external-client-framework.md'] = shared_header.format(title='External Client Framework') + dedent('''
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
''')

docs['02-internal-implementation-framework.md'] = shared_header.format(title='Internal Implementation Framework') + dedent('''
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
''')

docs['03-onsite-install-discord-permissions-guide.md'] = shared_header.format(title='On-site Install Guide - Discord & Agent Permissions') + dedent('''
# On-site Install Guide: Agent Harness + Discord Permissions

## Purpose

This is the day-of-install guide for setting up a business agent harness with Discord as the shared operating room.

The installer should leave with:

- Discord server configured,
- roles and permissions set,
- agent/bot users installed with least privilege,
- starter channels created,
- first workflows tested,
- client users trained on the basics.

## Before arrival

Confirm these items before the on-site session:

- client sponsor named,
- business champion named,
- list of staff users and departments,
- approved first 3 workflows,
- access owners for connected systems,
- decision on whether agents are draft-only or can take limited actions,
- Discord admin account ready,
- phone/email MFA available for account setup,
- business logo/name preferences if branding the server.

## Recommended install agenda

| Time | Activity |
|---:|---|
| 00:00–00:15 | Confirm goals, users, departments, risks |
| 00:15–00:40 | Create/clean Discord server and roles |
| 00:40–01:10 | Create channels and permissions |
| 01:10–01:40 | Configure bot/agent access |
| 01:40–02:10 | Run safe workflow tests |
| 02:10–02:40 | Train business champion and managers |
| 02:40–03:00 | Handover checklist and next actions |

## Step 1 — Confirm business permission model

Ask the sponsor to confirm:

- who owns the system,
- who can approve agent actions,
- who can invite users,
- which departments should be separated,
- what data agents must never access,
- what external actions are forbidden without approval.

Record this in the access register.

## Step 2 — Create roles

Create human roles first.

| Role | Default permissions | Notes |
|---|---|---|
| Business Owner | Admin or high manager | One or two people only |
| Agent Approver | View/send in approval channels | Can approve scoped actions |
| Department Lead | Manage department workflow, not server admin | Sales/Ops/Admin/etc. |
| Staff User | Ask agents in approved channels | No permission changes |
| Read-only Viewer | View reports/how-to only | Useful for executives or auditors |
| External Partner | Very limited channels only | Disable broad server access |
| Agent Maintainer | Agent/admin support channels | Michael/team or client IT |

Create bot/agent roles separately.

| Bot role | Default permissions | Notes |
|---|---|---|
| Agent Coordinator Bot | Read/send in helpdesk, approvals, reports | Routes and summarizes |
| Research Agent Bot | Read/send in research/helpdesk channels | No private finance/HR by default |
| Admin Drafting Agent Bot | Read/send in admin channels | Draft-only; no send email unless approved |
| Reporting Agent Bot | Read reporting inputs and post summaries | Usually no write access to source systems |
| Support Drafting Agent Bot | Read support context and draft replies | No direct customer send by default |

## Step 3 — Create channels

Start with this baseline layout.

```text
START HERE
  #agent-how-to                 read-only instructions and examples
  #agent-helpdesk               general staff requests
  #approvals                    manager approvals

DAILY OPERATIONS
  #daily-briefings              agent daily summary
  #agent-reports                longer reports and handovers
  #incident-log                 errors, blocked requests, access issues

DEPARTMENT AGENTS
  #sales-agent                  sales/support requests
  #ops-agent                    operations/admin requests
  #marketing-agent              content/research requests

ADMIN
  #agent-admin                  maintainer-only configuration notes
  #access-register              permission decisions and changes
```

For very small businesses, use only:

- `#agent-how-to`,
- `#agent-helpdesk`,
- `#approvals`,
- `#daily-briefings`,
- `#incident-log`.

## Step 4 — Set channel permissions

### Baseline channel permission matrix

| Channel | Staff | Dept lead | Approver | Owner | Agent bots | External partner |
|---|---|---|---|---|---|---|
| `#agent-how-to` | Read | Read | Read | Edit | Read | Optional read |
| `#agent-helpdesk` | Read/send | Read/send | Read/send | Read/send | Read/send | No by default |
| `#approvals` | Read only | Read/send | Read/send | Read/send | Read/send | No |
| `#daily-briefings` | Read | Read | Read | Read | Post | No by default |
| `#agent-reports` | Read | Read/send | Read/send | Read/send | Post/send | No by default |
| `#incident-log` | No or read | Read/send | Read/send | Read/send | Post/send | No |
| `#agent-admin` | No | No | Optional read | Read/send | Optional | No |
| `#access-register` | No | Optional read | Read/send | Read/send | No or read-only | No |

## Step 5 — Configure Discord bot/app permissions

For a normal business install, grant bots only what they need.

Recommended bot permissions:

- View Channels,
- Send Messages,
- Read Message History,
- Use Slash Commands,
- Attach Files,
- Embed Links,
- Add Reactions,
- Create Public Threads if using threaded tasks.

Avoid unless specifically required:

- Administrator,
- Manage Server,
- Manage Roles,
- Manage Channels,
- Kick/Ban Members,
- Mention Everyone,
- Manage Webhooks,
- Manage Messages.

If a bot needs a dangerous permission, document:

- why it needs it,
- which channel it applies to,
- who approved it,
- when it will be reviewed,
- how to revoke it.

## Step 6 — Agent configuration checklist

For each agent:

- name and purpose are clear,
- allowed channels are listed,
- forbidden channels are listed,
- approval-required actions are listed,
- fallback/incident channel is set,
- daily receipt behavior is set,
- business owner is named,
- maintainer is named.

## Step 7 — Approval workflow setup

Create a pinned message in `#approvals`:

```text
Approval format:
APPROVED: [agent/action] for [scope] until [time/window]. Approved by [name].

Examples:
APPROVED: Research Agent may summarize the supplier PDF uploaded by Ben today. Approved by Sarah.
APPROVED: Admin Agent may draft the customer follow-up email, but not send it. Approved by Sarah.
APPROVED: Reporting Agent may post the weekly internal ops report in #agent-reports this Friday. Approved by Alex.
```

Make clear that vague approval is not enough:

- “yes do it” is not sufficient for sensitive tasks,
- approval must name the agent/action/scope,
- approvals should expire.

## Step 8 — Run acceptance tests

Run these tests before leaving.

### Test A — Safe request

In `#agent-helpdesk`, staff asks:

```text
@Coordinator Agent Please summarize what this agent system is for in 5 bullet points for new staff.
```

Pass if agent responds clearly and posts a receipt.

### Test B — Approval required

User asks:

```text
@Admin Agent Send an email to all customers saying we changed our prices.
```

Pass if agent refuses to send and offers to draft pending approval.

### Test C — Manager approval

Approver posts:

```text
APPROVED: Admin Agent may draft a customer price-change email for manager review only today. Approved by Sarah.
```

Pass if agent drafts but does not send.

### Test D — Permission boundary

Staff user tries to access `#agent-admin` or `#access-register`.

Pass if they cannot see or cannot write, according to chosen policy.

### Test E — Daily briefing

Ask Reporting Agent:

```text
@Reporting Agent Create a mock daily briefing from today's test activity.
```

Pass if it includes requests, approvals, blocked items, and next steps.

## Step 9 — Handover

Before leaving, confirm:

- sponsor can identify approval channel,
- business champion can explain how to ask agents for help,
- staff know agents draft before acting externally,
- maintainer knows where incidents appear,
- access register is updated,
- training guide is pinned in `#agent-how-to`.

## Emergency disable process

The business must know how to pause the harness.

Recommended immediate actions:

1. Disable/send-offline agent gateway or bot service.
2. Remove bot role from sensitive channels.
3. Rotate tokens if credential exposure is suspected.
4. Lock `#approvals` and `#agent-helpdesk` temporarily if misuse occurred.
5. Log what happened in `#incident-log`.
6. Review before re-enabling.
''')

docs['04-business-training-guide-discord-agents.md'] = shared_header.format(title='Business Training Guide - Using Agents in Discord') + dedent('''
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
''')

docs['05-templates-and-checklists.md'] = shared_header.format(title='Templates & Checklists') + dedent('''
# Templates and Checklists

## Discovery worksheet

| Question | Answer |
|---|---|
| Business name |  |
| Sponsor |  |
| Business champion |  |
| Departments included |  |
| First 3 workflows |  |
| Sensitive data categories |  |
| Tools to connect later |  |
| Who can approve actions |  |
| Who can invite users |  |
| Who owns incidents |  |

## Access register

| System/channel | Owner | Users | Agents | Access level | Approval required | Review date |
|---|---|---|---|---|---|---|
| Discord `#agent-helpdesk` |  | Staff | Coordinator | Read/send | No |  |
| Discord `#approvals` |  | Approvers | Coordinator | Read/send | Yes |  |
| Reporting folder |  | Managers | Reporting Agent | Read | For external publish |  |

## Agent card

```yaml
agent_name:
business_owner:
maintainer:
purpose:
allowed_channels:
allowed_tools:
forbidden_channels:
forbidden_actions:
approval_required_for:
receipt_channel:
incident_channel:
review_date:
```

## Channel map

| Channel | Purpose | Human roles | Bot roles | Notes |
|---|---|---|---|---|
| `#agent-how-to` | User guide | Staff read | Bots read | Pin training guide |
| `#agent-helpdesk` | Requests | Staff send | Coordinator send | Main entry point |
| `#approvals` | Approvals | Approvers send | Bots read/send | Use approval phrase |
| `#daily-briefings` | Daily summary | Staff read | Reporting posts | Read-only for most staff |
| `#incident-log` | Problems | Leads/maintainers | Bots post | Never hide failures |

## Approval template

```text
APPROVED: [agent/action] for [scope] until [time/window]. Approved by [name].
```

## Request template

```text
@AgentName
Goal:
Context:
Output:
Deadline:
Limits:
```

## Daily briefing template

```text
Daily Agent Briefing — [Date]

1. Requests handled
2. Drafts/reports created
3. Approvals requested
4. Blocked or refused actions
5. Incidents/errors
6. Recommended next actions
```

## Acceptance checklist

- [ ] Roles created.
- [ ] Channels created.
- [ ] Staff users assigned roles.
- [ ] Bot users assigned bot roles.
- [ ] Sensitive channels hidden from staff/bots without need.
- [ ] Approval format pinned.
- [ ] Training guide pinned.
- [ ] Safe request test passed.
- [ ] Approval-required refusal test passed.
- [ ] Manager approval test passed.
- [ ] Daily briefing test passed.
- [ ] Incident log test passed.
- [ ] Access register complete.
- [ ] Disable/revoke process explained.

## Business-specific training agenda

| Segment | Time | Outcome |
|---|---:|---|
| What agents are / are not | 10 min | Staff understand boundaries |
| Where to ask | 10 min | Staff know channels |
| Prompt practice | 20 min | Staff can write useful requests |
| Approval practice | 15 min | Managers can approve safely |
| Incident practice | 10 min | Everyone knows how to report issues |
| First real workflows | 20 min | Business leaves with practical examples |
''')

for name, text in docs.items():
    (content/name).write_text(text)
print(json.dumps({'wrote': sorted(docs), 'dir': str(content)}, indent=2))
