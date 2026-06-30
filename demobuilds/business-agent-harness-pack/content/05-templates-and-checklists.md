---
title: Templates & Checklists
version: 1.0
status: Draft client-ready pack
prepared_by: Michael Costea
style: MichaelOS × Nous field-note × Hyperframes
---

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
