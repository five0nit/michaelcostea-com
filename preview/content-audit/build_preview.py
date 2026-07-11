#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "index.html"
OUTPUT = Path(__file__).resolve().parent / "index.html"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise RuntimeError(f"{label}: expected one match, found {text.count(old)}")
    return text.replace(old, new, 1)


def sub_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return updated


html = SOURCE.read_text(encoding="utf-8")
html = replace_once(html, "<head>", '<head>\n  <base href="../../">', "base tag")
html = replace_once(
    html,
    "  <title>Michael Costea — Get More Out of AI</title>",
    "  <title>Michael Costea — Content & Resume Preview</title>\n  <meta name=\"robots\" content=\"noindex,nofollow\" />",
    "preview title",
)
html = replace_once(
    html,
    '  <link rel="canonical" href="https://michaelcostea.com/" />',
    '  <link rel="canonical" href="https://michaelcostea.com/preview/content-audit/" />',
    "preview canonical",
)
html = replace_once(
    html,
    '  <link rel="stylesheet" href="assets/css/hyperframes-live.css?v=20260711-private-style-labels" />',
    '  <link rel="stylesheet" href="assets/css/hyperframes-live.css?v=20260711-private-style-labels" />\n  <link rel="stylesheet" href="preview/content-audit/preview.css?v=20260711-hireability-pass-4" />',
    "preview stylesheet",
)
html = replace_once(
    html,
    '<body class="public-preview ux-preview-page hyperframes-live">',
    '<body class="public-preview ux-preview-page hyperframes-live content-audit-preview">\n  <div class="preview-ribbon" role="status">CONTENT + RESUME PREVIEW · ROOT SITE UNCHANGED</div>',
    "preview body class",
)

home_content = '''        <aside class="welcome-sidebar" aria-label="Primary navigation">
          <div class="profile-portrait" aria-hidden="true"><img src="assets/profile-michael-pixel.jpg?v=20260621-profile-crop" alt="Pixel portrait of Michael Costea" width="400" height="400" fetchpriority="high" /></div>
          <button class="btn big-nav" type="button" data-open="projectsWindow" onclick="openWindow('projectsWindow')">PROJECTS</button>
          <button class="btn big-nav" type="button" data-open="resumeWindow" onclick="openWindow('resumeWindow')">RESUME</button>
          <button class="btn big-nav" type="button" data-open="buildWindow" onclick="openWindow('buildWindow')">WHAT I BUILD</button>
          <button class="btn big-nav agentic-nav" type="button" data-open="agentsWindow" onclick="openWindow('agentsWindow')">AGENTIC SYSTEMS</button>
          <button class="btn big-nav ai-cta-nav" type="button" data-open="aiHelpWindow" onclick="openWindow('aiHelpWindow')">AI HELP</button>
          <button class="btn big-nav" type="button" data-open="contactWindow" onclick="openWindow('contactWindow')">CONTACT</button>
        </aside>
        <section class="welcome-copy">
          <div class="mini-heading welcome-mini lift-heading"><h1><span class="desktop-headline">I BUILD AGENT SYSTEMS THAT SURVIVE REAL WORK</span><span class="mobile-headline">AGENT SYSTEMS FOR REAL WORK</span></h1></div>
          <div class="terminal-line">CONTROL PLANE → MEMORY → TELEMETRY → GOVERNANCE [LIVE]</div>

          <p class="brand-promise mini-callout"><span><b><span class="desktop-promise">I turn scattered AI agents into visible, permissioned operating systems a real team can understand, trust and run.</span><span class="mobile-promise">Visible, permissioned agent systems for real teams.</span></b></span></p>
          <p>I’m Michael Costea, currently <strong class="accent">Head of Tech, AI & Systems</strong> at All Electric Homes. I sit between business operations, product direction and hands-on technical delivery.</p>
          <p>My strongest work starts where demos stop: agents need durable context, bounded tools, scheduled execution, failure reporting, human approval and an operator surface that shows what actually happened.</p>

          <div class="role-fit-strip"><b>BEST FIT</b><span>AGENTIC SYSTEMS LEAD</span><span>AI OPERATIONS LEAD</span><span>TECHNICAL PRODUCT LEAD</span></div>

          <div class="proof-strip evidence-strip agent-proof-strip" aria-label="Selected agent-system proof">
            <span><b>25 agents</b><small>daily multi-machine environment</small></span>
            <span><b>441 tests</b><small>Agent Office passing</small></span>
            <span><b>6 transports</b><small>AgentMesh control plane</small></span>
            <span><b>6-part harness</b><small>deployment + governance pack</small></span>
          </div>

          <section class="hire-proof-section" aria-label="Selected agent systems">
            <header class="hire-proof-header"><span class="resource-badge">SELECTED SYSTEMS</span><div><h2>Three builds. Problem, architecture, proof.</h2><p>Each case includes the operating problem, system architecture, a decision I made and evidence you can inspect.</p></div></header>

            <article class="agent-case-study agentmesh-case">
              <div class="case-visual"><img src="assets/project-showcase/agentmesh-control-kit.webp?v=20260701-showcase" alt="AgentMesh local multi-agent control plane diagram" loading="lazy" /></div>
              <div class="case-copy"><span class="case-number">01 · LOCAL CONTROL PLANE</span><h3>AgentMesh</h3><p class="case-problem"><b>Problem:</b> local agents existed as separate CLIs, sessions and configs. No common discovery, transport registry, shared handoff store or safe bootstrap path.</p><p><b>Built:</b> an installable Python CLI that discovers Hermes, OpenClaw, Claude Code and Codex; registers six local transport types; creates append-only project, handoff, message and activity stores; and gates config edits, services and restarts behind approval.</p><p class="case-decision"><b>Design judgement:</b> JSONL and local-first transport were deliberate. Inspectable state and low lock-in mattered more than a clever distributed backend.</p><div class="case-proof"><span>v0.1.0-alpha tagged</span><span>18 tests passing</span><span>wheel + fresh-venv smoke</span></div><div class="case-actions"><a class="ui-btn btn" href="assets/project-showcase/agentmesh-control-kit.webp" target="_blank" rel="noopener">Open Architecture</a><button class="ui-btn btn secondary" type="button" data-open="agentsWindow" onclick="openWindow('agentsWindow')">See Running Stack</button></div></div>
            </article>

            <article class="agent-case-study office-case">
              <div class="case-visual"><img src="assets/project-showcase/telegram-office.webp?v=20260701-showcase" alt="Telegram Agent Office operator interface" loading="lazy" /></div>
              <div class="case-copy"><span class="case-number">02 · OPERATOR SURFACE</span><h3>Telegram Agent Office</h3><p class="case-problem"><b>Problem:</b> agent activity was buried across Telegram threads, gateway logs and remote machines. Busy-looking bots could not be treated as proof of work.</p><p><b>Built:</b> a browser-first office that normalises Telegram webhooks, Hermes gateway logs and remote telemetry into roster state, lifecycle events, room routing, attention queues, context health and operator-visible receipts.</p><p class="case-decision"><b>Design judgement:</b> rejected fake central telemetry. A remote lane only counts when its owning machine emits a real sample with a dedupe fingerprint and readback proof.</p><div class="case-proof"><span>441 tests / 51 files</span><span>TypeScript clean</span><span>public repo · auth-protected runtime</span></div><div class="case-actions"><a class="ui-btn btn" href="https://github.com/five0nit/telegram-office" target="_blank" rel="noopener">Open Repo</a><a class="ui-btn btn secondary" href="assets/project-showcase/telegram-office.webp" target="_blank" rel="noopener">Open Interface</a></div></div>
            </article>

            <article class="agent-case-study harness-case">
              <div class="case-visual"><img src="assets/project-showcase/agentic-framework.webp?v=20260701-showcase" alt="Business Agent Harness and Agentic Framework materials" loading="lazy" /></div>
              <div class="case-copy"><span class="case-number">03 · BUSINESS DEPLOYMENT MODEL</span><h3>Business Agent Harness</h3><p class="case-problem"><b>Problem:</b> “give the bot access” is not an implementation plan. Businesses need owners, channels, permissions, approval language, incident paths, training and a disable procedure.</p><p><b>Built:</b> a six-part implementation pack for a Discord operating room: agent cards, channel taxonomy, six permission classes, approval phrases with expiry, acceptance tests, incident logging, access review and staff handover.</p><p class="case-decision"><b>Design judgement:</b> agents start read/draft-first with small keyrings. Send, publish, admin and destructive work remain human-controlled until the workflow earns more authority.</p><div class="case-proof"><span>6 implementation documents</span><span>10 acceptance checks</span><span>client training + handover</span></div><div class="case-actions"><a class="ui-btn btn" href="assets/downloads/business-agent-harness-pack/business-agent-harness-pack.zip" download>Download Pack</a><button class="ui-btn btn secondary" type="button" data-open="agenticFrameworkDeckWindow" onclick="openWindow('agenticFrameworkDeckWindow')">Open Framework Deck</button></div></div>
            </article>
          </section>

          <section class="first-90-days" aria-label="First 90 days ownership plan"><div><span class="resource-badge">WHAT I WOULD OWN</span><h2>First 90 days</h2></div><ol><li><b>Map</b><span>Find the repeated work, source systems, failure cost and actual owner.</span></li><li><b>Ship</b><span>Put one bounded agent lane into use with clear success and refusal tests.</span></li><li><b>Instrument</b><span>Add receipts, health, spend, context and exception visibility before scaling.</span></li><li><b>Transfer</b><span>Train staff, document disable/recovery and make the operating owner explicit.</span></li></ol></section>

          <div class="hero-action-panel" aria-label="Primary portfolio actions">
            <button class="ui-btn btn hero-image-cta primary-hero-cta" type="button" data-open="projectsWindow" onclick="openWindow('projectsWindow')"><img src="assets/minime-pack/build_workflow_engineer.png" alt="" aria-hidden="true" loading="lazy" width="331" height="284" />See Projects</button>
            <button class="ui-btn btn hero-image-cta" type="button" data-open="resumeWindow" onclick="openWindow('resumeWindow')"><img src="assets/minime-pack/guide_documents.png" alt="" aria-hidden="true" loading="lazy" width="289" height="333" />Read Resume</button>
            <button class="ui-btn btn hero-image-cta" type="button" data-open="contactWindow" onclick="openWindow('contactWindow')"><img src="assets/minime-pack/contact_approval.png" alt="" aria-hidden="true" loading="lazy" width="338" height="378" />Contact Michael</button>
          </div>

          <section class="welcome-resource-cta compact-resource" aria-label="Featured field guide">
            <span class="resource-badge">FIELD GUIDE</span>
            <div><b>Agentic Framework Session</b><small>A practical guide to team agents, shared context, permissions and review.</small></div>
            <button class="ui-btn btn" type="button" data-open="agenticFrameworkDeckWindow" onclick="openWindow('agenticFrameworkDeckWindow')">Preview</button>
          </section>

          <div class="spec-grid" aria-label="Current role and working principle">
            <div><b>CURRENT ROLE</b><span>HEAD OF TECH, AI & SYSTEMS · ALL ELECTRIC HOMES</span></div>
            <button class="welcome-agent-cta" type="button" data-open="projectsWindow" onclick="openWindow('projectsWindow')"><b>WORKING PRINCIPLE</b><span>Proof before promises · people stay in control</span></button>
          </div>
        </section>'''

html = sub_once(
    html,
    r'        <aside class="welcome-sidebar"[\s\S]*?        </section>\n      </div>\n      <div class="status-bar">',
    home_content + '\n      </div>\n      <div class="status-bar">',
    "homepage content",
)
html = replace_once(
    html,
    '<div class="status-bar"><span>Ready. System status: Useful AI.</span><span>AI: LIVE</span><span>OPS: ONLINE</span></div>',
    '<div class="status-bar"><span>Career path: operations → field delivery → business systems</span><span>MELBOURNE</span><span>AVAILABLE ONLINE</span></div>',
    "homepage status bar",
)

resume_intro = '''          <header class="doc-header evidence-led-header">
            <div class="mini-heading doc-header-mini lift-heading"><h2>Michael Costea</h2></div>
            <p><strong>Head of Tech, AI & Systems</strong> · Agentic systems, AI operations and technical product</p>
            <p>Melbourne, Victoria, Australia · <a href="mailto:costea.michael@gmail.com">costea.michael@gmail.com</a> · <a href="https://www.linkedin.com/in/michaelcostea" target="_blank" rel="noopener">LinkedIn</a></p>
          </header>

          <section class="resume-summary hire-summary">
            <h3>Profile</h3>
            <p>I build the operating layer around AI agents: role and task boundaries, local control planes, shared memory, tool permissions, scheduled execution, telemetry, watchdogs, approval gates and operator-facing receipts.</p>
            <p>My background is business operations, electrical field delivery, sales, marketing and systems ownership. That lets me choose a useful workflow, understand the cost of failure, ship the technical system and own adoption with the people who must use it.</p>
            <p class="target-role-line"><b>Best fit:</b> Agentic Systems Lead · AI Operations Lead · Technical Product Lead</p>
          </section>

          <section class="resume-case-section">
            <h3>Selected Agentic Work</h3>
            <article class="resume-case"><div class="resume-case-title"><span>01</span><div><h4>AgentMesh — local multi-agent control plane</h4><small>PRODUCT SCOPE · ARCHITECTURE · SAFETY MODEL · RELEASE GATES</small></div></div><p><b>Problem:</b> Hermes, OpenClaw, Claude Code and Codex agents were isolated across CLIs, configs and sessions.</p><p><b>System:</b> Python CLI for machine discovery, agent/transport registries, six local transports, append-only shared state, relay/mailbox dispatch and approval-gated config/service changes.</p><p><b>Proof:</b> v0.1.0-alpha tag · 18 passing tests · wheel build · fresh-virtualenv install smoke · <a href="assets/project-showcase/agentmesh-control-kit.webp" target="_blank" rel="noopener">architecture diagram</a> · security, bootstrap and install documentation.</p></article>
            <article class="resume-case"><div class="resume-case-title"><span>02</span><div><h4>Telegram Agent Office — agent observability surface</h4><small>PRODUCT DIRECTION · TELEMETRY TRUTH · OPERATOR UX · QA</small></div></div><p><b>Problem:</b> Telegram, gateway and remote-machine activity was fragmented and easy to misread as progress.</p><p><b>System:</b> Next.js/React/Phaser operator interface for webhook ingress, gateway lifecycle events, roster state, room routing, context health, attention queues and remote telemetry.</p><p><b>Proof:</b> <a href="https://github.com/five0nit/telegram-office" target="_blank" rel="noopener">public GitHub repo</a> · auth-protected deployment · 441 tests passing across 51 files · TypeScript clean · remote samples deduped and accepted only from the machine that owns the lane.</p></article>
            <article class="resume-case"><div class="resume-case-title"><span>03</span><div><h4>Business Agent Harness — governed rollout model</h4><small>IMPLEMENTATION MODEL · PERMISSIONS · TRAINING · HANDOVER</small></div></div><p><b>Problem:</b> businesses could install bots without defining ownership, safe authority, incident paths or staff adoption.</p><p><b>System:</b> six-part Discord deployment pack covering agent cards, channel taxonomy, six permission classes, expiring approvals, acceptance tests, daily/weekly operations, incident response and disable/handover procedures.</p><p><b>Proof:</b> <a href="assets/downloads/business-agent-harness-pack/business-agent-harness-pack.zip" download>downloadable implementation pack</a> · framework deck · ten pre-handover acceptance checks · explicit refusal, receipt and private-channel tests.</p></article>
          </section>

          <section class="resume-agentic-practice">
            <h3>Agentic Engineering Scope</h3>
            <div class="resume-agentic-grid">
              <article><b>Orchestration</b><span>Coordinator, specialist and reviewer roles; queues; task contracts; handoffs; completion receipts.</span></article>
              <article><b>Tool boundaries</b><span>Profile-specific tools, least privilege, read/draft-first access, expiry and scoped escalation.</span></article>
              <article><b>Memory</b><span>Durable project state, mailboxes, source receipts, context compaction and human-readable projections.</span></article>
              <article><b>Autonomy</b><span>Schedules, overnight lanes, lock-safe runners, retries, watchdogs and failure notifications.</span></article>
              <article><b>Observability</b><span>Logs, lifecycle events, health, spend/context signals, dashboards, alerts and rollback evidence.</span></article>
              <article><b>Governance</b><span>Approval language, refusal tests, audit trails and fail-closed public, financial or destructive actions.</span></article>
            </div>
          </section>

          <section class="selected-evidence" aria-label="Selected career evidence">
            <h3>Operating Evidence</h3>
            <div class="evidence-grid">
              <article><b>25</b><span>visible agents in the current multi-machine environment</span></article>
              <article><b>352</b><span>retail stores supported through Optus operations</span></article>
              <article><b>5,000+</b><span>employees served by maintained knowledge systems</span></article>
              <article><b>500,000</b><span>monthly knowledge-base visits</span></article>
            </div>
          </section>

          <section>
            <h3>What I Own Now</h3>
            <ul class="ownership-list">
              <li>Multi-brand websites, domains, hosting, analytics and lead-capture paths.</li>
              <li>Lead routing, qualification, follow-up and customer-journey tooling.</li>
              <li>Internal dashboards, workflow automations and practical AI-assisted processes.</li>
              <li>Local agent infrastructure: role separation, shared memory, schedules, watchdogs, operator channels and review gates.</li>
              <li>System boundaries and handoffs across marketing, sales, admin, finance and field operations.</li>
              <li>Training, documentation and review points so staff can use new systems confidently.</li>
            </ul>
          </section>

          <section>
              <h3>Experience</h3>'''
html = sub_once(
    html,
    r'          <header class="doc-header">[\s\S]*?          <section>\n              <h3>Experience</h3>',
    resume_intro,
    "resume introduction",
)

current_role = '''              <article class="mini-content-card current-role-card"><h4>Head of Tech, AI & Systems — All Electric Homes</h4><p><b>Feb 2026 - Present · Melbourne · On-site</b></p><figure class="mini-card-figure"><img src="assets/minime-pack/experience_aeh.png" alt="Pixel mini Michael working across technology and operations" loading="lazy" /></figure><p>Own technology and systems work across a multi-brand electrical and energy-services group. Current work spans digital infrastructure, websites, lead handling, internal tools, reporting and agentic workflows with scoped tools, shared context, visible receipts and human review.</p><p><b>Operating focus:</b> clearer ownership, less duplicate admin, faster handoffs and systems that staff can understand and maintain.</p></article>
              <article class="mini-content-card"><h4>Business Development & Marketing Manager — Want A Heat Pump / Want A Sparky / All Electric Homes</h4>'''
html = sub_once(
    html,
    r'              <article class="mini-content-card"><h4>Head of Tech, AI & Systems — All Electric Homes</h4>[\s\S]*?              <article class="mini-content-card"><h4>Business Development & Marketing Manager — Want A Heat Pump / Want A Sparky / All Electric Homes</h4>',
    current_role,
    "current role card",
)

capabilities = '''          <section class="capabilities-section">
            <div class="mini-heading compact-mini lean-heading"><h3>Core Capabilities</h3></div>
            <div class="doc-grid capability-grid concise-capabilities">
              <div class="mini-content-card"><b>Business Systems Ownership</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_architecture.png" alt="Pixel mini Michael representing business systems ownership" loading="lazy" /></figure><span>Map ownership, handoffs and source-of-truth data across sales, admin, finance, field delivery and reporting.</span></div>
              <div class="mini-content-card"><b>Lead & Customer Journey Operations</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_leads.png" alt="Pixel mini Michael representing lead and customer journey operations" loading="lazy" /></figure><span>Improve capture, routing, qualification, follow-up, customer communication and job-completion visibility.</span></div>
              <div class="mini-content-card"><b>Multi-Agent Orchestration</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_agentic.png" alt="Pixel mini Michael representing multi-agent orchestration" loading="lazy" /></figure><span>Design coordinator and specialist roles, memory, schedules, watchdogs, handoffs, permissions and review gates as one operating system.</span></div>
              <div class="mini-content-card"><b>Digital Infrastructure</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_infra.png" alt="Pixel mini Michael representing digital infrastructure" loading="lazy" /></figure><span>Own websites, domains, hosting, analytics, conversion paths, landing pages and internal web tools.</span></div>
              <div class="mini-content-card"><b>Knowledge & Process Design</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_knowledge.png" alt="Pixel mini Michael representing knowledge and process design" loading="lazy" /></figure><span>Turn repeated questions and fragmented procedures into usable documentation, training and operating routines.</span></div>
              <div class="mini-content-card"><b>Field & Commercial Context</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_field.png" alt="Pixel mini Michael representing field and commercial context" loading="lazy" /></figure><span>Bring electrical, sales, service-business and customer-facing experience into technical decisions.</span></div>
            </div>
          </section>'''
html = sub_once(
    html,
    r'          <section>\n            <div class="mini-heading compact-mini lean-heading"><h3>Core Capabilities — AI, Systems & CTO-Track Execution</h3></div>[\s\S]*?          </section>\n        </article>',
    capabilities + '\n        </article>',
    "resume capabilities",
)

OUTPUT.write_text(html, encoding="utf-8")
print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
