# Our Agentic Stack with Hermes — ELI6 facilitator guide

Tone rule: explain it like the audience is smart, but brand new to our setup. Use simple pictures in words: robots, desks, phones, notebooks, whiteboards, guardrails. Avoid private bot handles, Telegram IDs, machine names, tokens, paths, or account details.

## BOOT — Our AI agent setup, explained simply

Think of each agent like a helpful robot worker with its own phone, desk, and job — but no private names or IDs on the slide.

- Hermes is now our main robot workshop
- Telegram is the remote control in our pocket
- OpenClaw still helps with Tony-style specialist lanes, office view, and older control-plane parts

Real-life example: This deck was made by asking Hermes in Telegram. Hermes checked project files, made slides, exported files, and reported back.

## AGENDA — What we will cover in 1 hour

- 1. What an agent is, in plain words
- 2. Why Hermes is our main framework now
- 3. What runs on our private local setup — without exposing personal IDs
- 4. How bot seats map across local and remote workstations
- 5. How the agents remember and share work
- 6. How we set this up safely for a business with many users

Real-life example: The goal is not to show private account details. The goal is to show the safe pattern.

## DEF — Chatbot vs agent

**Chatbot**: You ask a question, It gives an answer, It usually cannot do much else, It may forget the bigger job

**Agent**: You give it a job, It can use tools, It checks its own work, It sends back proof

Real-life example: Chatbot: “write slides.” Agent: finds the theme, builds slides, exports PDF/PPTX, checks pages, and tells you what changed.

## HERMES — Hermes is our main agent framework now

- Hermes is where almost all day-to-day agent use now happens
- It runs our Telegram-reachable agent profiles
- It has tools for files, terminal, browser, web, schedules, messages, memory, and skills
- It keeps reusable instructions as skills so we do not teach it the same thing every time
- It gives us profiles, so each bot can have its own memory, config, and Telegram identity
- For clients, the recommended starting point is Hermes-first

Real-life example: Most current work — this deck, website edits, reports, cron jobs, file checks, and Telegram DM tasks — now goes through Hermes.

## HERMES-FIRST — OpenClaw used to be the busy road; Hermes is now the highway

**Earlier setup**: OpenClaw carried lots of experiments, A specialist OpenClaw lane was very active, Agent Office and swarm ideas were OpenClaw-heavy, Great for proving what was possible

**Current setup**: Hermes carries almost all normal work, Hermes profiles are the main work lanes, OpenClaw still matters for specialist lanes, Agent Office, relay, and visuals, Client setups should be Hermes-first, not OpenClaw-first

Real-life example: OpenClaw is still part of the machine room. But if someone asks “what should we copy for a client?”, the answer is: start with Hermes.

## PRIVATE-SETUP — Our private setup, with personal details removed

- One local workstation runs the main agent stack
- A private workspace holds repos, logs, skills, and shared notes
- Hermes profiles give each bot its own safe lane
- A specialist OpenClaw lane still supports office visualisation and relay experiments
- Shared files let agents leave notes for each other
- No Telegram IDs, private chat IDs, tokens, or personal account details belong in this client-facing deck

Real-life example: In a client session we explain the pattern, not the private coordinates. We say “primary Hermes bot”, not the real bot handle or private chat ID.

## SERVICES — The background helpers that keep things awake

| Service type | What it means like I’m 6 | Why it matters |
|---|---|---|
| Primary Hermes gateway | Main robot phone is switched on | Main bot can answer messages |
| Secondary Hermes gateway | Helper robot phone is switched on | Extra worker lane |
| Coordinator Hermes gateway | Coordinator robot phone is switched on | Overnight or broader task lane |
| Specialist OpenClaw gateway | Specialist robot phone is switched on | Visual office / specialist swarm lane |
| Relay service | A message courier between bots | Helps when chat pings are not enough |
| Ops console | A control room screen | Helps see/control runtime status |

Real-life example: A service saying “running” is like a light being on. We still check logs and real messages to prove the bot is truly answering.

## LOCAL-ROSTER — Local agent seats, generic names

| Seat | Runtime | Generic bot name | Simple job |
|---|---|---|---|
| Local A | OpenClaw | Specialist Bot | Second-pass executor / visual-office specialist |
| Local B | Hermes | Primary Hermes Bot | Main Telegram-facing assistant |
| Local C | Hermes | Worker Hermes Bot | Extra helper for docs/tests/reports |
| Local D | Hermes | Coordinator Hermes Bot | Coordinator / overnight helper |

Real-life example: This is safer than listing real bot usernames. The audience learns the shape of the system without getting private account details.

## REMOTE-ROSTER — Remote agent seats, generic names

| Seat | Machine type | Runtime | Generic bot name | Simple job |
|---|---|---|---|---|
| Remote A | Business workstation | OpenClaw | Remote Specialist Bot | Dispatch / specialist lane |
| Remote B | Business workstation | Hermes | Remote Support Bot | Support or admin lane |
| Remote C | Business workstation | Hermes | Remote Build Bot | Build / delivery lane |
| Remote D | Monitoring workstation | Monitor | Remote Monitor Bot | Watches another work machine |
| Remote E | Small server / mini PC | Hermes | Relay Bot | Relay or background helper |
| Remote F | Small server / mini PC | OpenClaw | Monitor Specialist Bot | Specialist monitoring lane |

Real-life example: The office list is like a seating chart. It tells us which helper belongs to which type of machine, without showing real bot handles or private machine names.

## GROUP — Public group behaviour, explained safely

- Normal order: primary assistant first → specialist second → primary assistant final
- Group messages are great for humans to see
- But bot-to-bot mentions are not always reliable as transport
- So we use a relay and shared logs when a message must definitely reach another bot
- The rule is: visible chat for people, durable relay/logs for machines
- Client version should use named roles, not personal bot handles

Real-life example: If the primary assistant visibly hands a task to the specialist bot, the group sees the handoff, and the relay can also wake the specialist for real.

## VISIBILITY — How the agents remember what happened

- Team-sync is the shared notebook for bots: project changes, handoffs, messages, and activity
- ByteRover-style memory is the compact map: it helps agents find the right context without reading everything
- Obsidian is the human-readable library: dashboards, daily notes, swarm views, and memory mirrors
- Hermes memory stores stable preferences and setup facts across chats
- Skills store repeatable recipes, like “how to check Hermes health”
- The simple idea: write important things down so the next bot does not start from zero

Real-life example: Before taking over work, a bot can read team-sync, ByteRover/context-tree, and Obsidian views. That is like reading the classroom whiteboard before joining the group project.

## EXAMPLE-WEB — Real example: website or product work

- 1. Request arrives in Telegram
- 2. Agent opens the repo and checks the project rules
- 3. Agent checks for predefined style guidelines defined by the project
- 4. Agent makes a small safe change
- 5. Agent verifies with test, screenshot, browser, API, or PDF output
- 6. Agent reports changed files and proof

Real-life example: For a website project, the agent should check the project’s style guide first instead of inventing a random new style.

## EXAMPLE-SWARM — Real example: multi-agent work

- 1. Primary assistant explains the first plan
- 2. Specialist bot does the second-pass work or challenge
- 3. Primary assistant checks the result
- 4. Shared logs record what happened
- 5. If chat handoff is weak, relay wakes the right bot
- 6. Final answer includes evidence, not just “done”

Real-life example: We learned that “a bot wrote a reply” is not the same as “the group saw the reply.” We check delivery separately.

## EXAMPLE-MON — Real example: monitoring agents

- 1. A monitor watches a machine or workflow
- 2. Quiet is okay when everything is healthy
- 3. It alerts chat only when something needs attention
- 4. It includes evidence: status, error, log line, or timestamp
- 5. It does not restart important things unless approved
- 6. It keeps a report trail

Real-life example: A monitor bot is like a smoke alarm. Its job is not to chat all day; its job is to alert when something needs attention.

## CLIENT-OVERVIEW — Conservative setup for a business: big picture

- Use one company workspace, not one giant all-powerful bot
- Create separate agent profiles for departments or workflows
- Connect agents to a business chat platform through approved channels
- Start with watching and reporting before allowing actions
- Every action needs scope, owner, approval rule, and proof
- Keep logs, monitoring, and escalation from day one

Real-life example: For a business, the safe first win is: “watch the workflow, summarise what changed, and ask before doing anything risky.”

## CLIENT-USERS — Multiple users in one business

| User group | Agent access | Good first use | Approval rule |
|---|---|---|---|
| Leadership | Summary bot | Daily/weekly business digest | Human approves public/client-facing changes |
| Operations | Workflow bot | Exceptions, job status, handoffs | Manager approves process changes |
| Sales/support | Drafting bot | Draft replies, triage, CRM notes | Human sends customer messages at first |
| Finance/admin | Document bot | Invoice/report extraction and checks | Human approves payments or accounting changes |
| IT/admin | Monitor bot | Health, uptime, auth warnings | Admin approves restarts/credential changes |

Real-life example: Many users do not mean everyone gets the same robot. Each team gets the smallest safe helper for their job.

## CLIENT-PERMISSIONS — Business permissions: give each robot only the keys it needs

- Role-based access: each user and bot gets a clear role
- Tool allowlist: only approved tools are enabled for that bot
- Data boundaries: one department’s bot should not casually read everything
- Approval gates: emails, deletes, deploys, payments, and credential changes wait for humans
- Audit trail: every important action records who, what, when, and proof
- Break-glass path: a human admin can pause or disable a bot quickly

Real-life example: A finance helper should not have the same keys as a website helper. Small keyrings are safer than one master key.

## CLIENT-MONITOR — Monitoring for business agents

- 1. Heartbeat: is the bot alive?
- 2. Job status: did today’s scheduled work run?
- 3. Error alerts: did an API, login, or workflow fail?
- 4. Cost/token watch: is usage suddenly too high?
- 5. Safety alerts: did the bot try a blocked action?
- 6. Daily digest: what happened, what is blocked, what needs approval?

Real-life example: Monitoring is the adult in the room. It watches the robots, records receipts, and tells humans when something looks wrong.

## CLIENT-REPORTING — What a client should see each day

| Report item | Plain-English question it answers | Example |
|---|---|---|
| Health | Are the bots awake? | All green except Support Draft Bot paused |
| Work done | What changed today? | 12 tickets triaged, 3 draft replies prepared |
| Blocked items | What needs a human? | 2 refunds need manager approval |
| Risks | What looks unsafe or unusual? | Login token expires soon |
| Evidence | How do we know? | Links to logs, screenshots, files, or IDs |
| Next step | What should happen now? | Approve, reject, or ask agent to revise |

Real-life example: A good agent report should feel like a clean handover note from a reliable assistant, not a wall of machine noise.

## CLIENT-ROLLOUT — Client rollout ladder: small steps first

- Stage 0 · Map users, data, tools, and risks
- Stage 1 · Watch and summarise only
- Stage 2 · Draft for humans to approve
- Stage 3 · Do tiny approved actions
- Stage 4 · Scheduled work with monitoring and rollback

Real-life example: For a support team: first summarise tickets, then draft replies, then label safe tickets, then automate only boring low-risk tasks.

## GUARD — Safety rules in kid-simple words

- Do not give every robot every key
- Do not let robots send public messages without permission
- Do not let robots delete things without permission
- Do not hide mistakes — report blockers clearly
- Do not trust “I did it” without proof
- Keep personal, work, and client bots separated

Real-life example: For clients, we copy the safe pattern, not a full-power personal machine setup.

## DEMO — Safe demo prompts for the session

- Show the generic agent roster without secrets
- Explain which bots are local and which are remote
- Read shared state and tell me what is active
- Draft a safe client Telegram-agent setup
- Check a repo and follow its style guide
- Make a work receipt with proof and changed files

Real-life example: A safe demo uses local files and service status. It does not expose tokens or touch a client production system.

## CLOSE — The simple takeaway

- Hermes is the main framework we use now
- Chat is the pocket remote control
- Each bot needs a clear job, clear tools, and clear limits
- Shared memory/logs stop agents from getting lost
- For clients: start small, watch first, act later

Real-life example: If a 6-year-old version had to remember one thing: do not build one giant robot with every key. Build small helpful robots with named jobs and a grown-up approval button.


## Required corrections captured

- Removed the old office-roster slide.
- Removed the old real-profile slide.
- Removed private Telegram IDs and real bot handles from the client-facing slide content.
- Replaced real machine names with generic machine/seat names.
- Included the missing monitor-agent concept as `Remote Monitor Bot` for another work machine, without exposing the real handle.
- Expanded the conservative external-client setup into multiple business slides: overview, multi-user access, permissions, monitoring, daily reporting, and rollout.
- Visibility section explains team-sync, ByteRover-style context, Obsidian, Hermes memory, and skills.
- Website example says: check for predefined style guidelines defined by the project.
