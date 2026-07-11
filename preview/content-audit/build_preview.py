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
    '  <link rel="stylesheet" href="assets/css/hyperframes-live.css?v=20260711-private-style-labels" />\n  <link rel="stylesheet" href="preview/content-audit/preview.css?v=20260711-content-pass-2" />',
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
          <button class="btn big-nav ai-cta-nav" type="button" data-open="aiHelpWindow" onclick="openWindow('aiHelpWindow')">AI HELP</button>
          <button class="btn big-nav" type="button" data-open="contactWindow" onclick="openWindow('contactWindow')">CONTACT</button>
        </aside>
        <section class="welcome-copy">
          <div class="mini-heading welcome-mini lift-heading"><h1><span class="desktop-headline">FROM FRONTLINE OPERATIONS TO AI SYSTEMS</span><span class="mobile-headline">OPS TO AI SYSTEMS</span></h1></div>
          <div class="terminal-line">ELECTRICIAN → SALES → OPERATIONS → SYSTEMS [LIVE]</div>

          <p class="brand-promise mini-callout"><span><b><span class="desktop-promise">I build and improve the systems behind real service businesses — websites, lead flows, internal tools and AI workflows that staff can actually use.</span><span class="mobile-promise">Real operations. Useful systems. AI people can use.</span></b></span></p>
          <p>I’m Michael Costea, currently <strong class="accent">Head of Tech, AI & Systems</strong> at All Electric Homes. I came into technology through frontline work: customer operations, running a small business, electrical delivery, sales and marketing.</p>
          <p>That background keeps my work grounded. I care less about impressive demos and more about whether a system saves time, makes ownership clear and works on a busy Monday morning.</p>

          <div class="proof-strip evidence-strip" aria-label="Selected career evidence">
            <span><b>352 stores</b><small>retail support operations</small></span>
            <span><b>5,000+ staff</b><small>knowledge systems</small></span>
            <span><b>500k visits</b><small>monthly knowledge traffic</small></span>
            <span><b>Licensed electrician</b><small>field-to-systems context</small></span>
          </div>

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
            <p><strong>Head of Tech, AI & Systems</strong> · Business systems, automation and operations</p>
            <p>Melbourne, Victoria, Australia · <a href="mailto:costea.michael@gmail.com">costea.michael@gmail.com</a> · <a href="https://www.linkedin.com/in/michaelcostea" target="_blank" rel="noopener">LinkedIn</a></p>
          </header>

          <section class="resume-summary">
            <h3>Profile</h3>
            <p>I came into technology through frontline operations: customer support, process management, running a small business, electrical work, sales and marketing. Today I own and improve the websites, lead systems, internal tools and AI workflows used across a multi-brand energy-services group.</p>
            <p>My strength is joining business context with hands-on delivery. I map how work really moves, remove avoidable admin, build the useful part and keep people involved where judgement or customer trust matters.</p>
          </section>

          <section class="selected-evidence" aria-label="Selected evidence">
            <h3>Selected Evidence</h3>
            <div class="evidence-grid">
              <article><b>352</b><span>retail stores supported through Optus operations</span></article>
              <article><b>5,000+</b><span>employees served by maintained knowledge systems</span></article>
              <article><b>500,000</b><span>monthly knowledge-base visits</span></article>
              <article><b>74%</b><span>increase in work outputs over 12 months</span></article>
            </div>
          </section>

          <section>
            <h3>What I Own Now</h3>
            <ul class="ownership-list">
              <li>Multi-brand websites, domains, hosting, analytics and lead-capture paths.</li>
              <li>Lead routing, qualification, follow-up and customer-journey tooling.</li>
              <li>Internal dashboards, workflow automations and practical AI-assisted processes.</li>
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

current_role = '''              <article class="mini-content-card current-role-card"><h4>Head of Tech, AI & Systems — All Electric Homes</h4><p><b>Feb 2026 - Present · Melbourne · On-site</b></p><figure class="mini-card-figure"><img src="assets/minime-pack/experience_aeh.png" alt="Pixel mini Michael working across technology and operations" loading="lazy" /></figure><p>Own technology and systems work across a multi-brand electrical and energy-services group. Current work spans digital infrastructure, websites, lead handling, internal tools, reporting and carefully reviewed AI-assisted workflows.</p><p><b>Operating focus:</b> clearer ownership, less duplicate admin, faster handoffs and systems that staff can understand and maintain.</p></article>
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
              <div class="mini-content-card"><b>Automation With Review Gates</b><figure class="mini-card-figure"><img src="assets/minime-pack/resume_agentic.png" alt="Pixel mini Michael representing reviewed automation" loading="lazy" /></figure><span>Automate repeated work while keeping approvals, audit trails and escalation points visible.</span></div>
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
