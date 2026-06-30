#!/usr/bin/env python3
"""Refresh Agentic Framework deck visuals with unique Mike × Nous diagrams and rebuild PDF/PPTX."""
from __future__ import annotations

import html
import os
import re
import shutil
import subprocess
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parents[1]
HTML = ROOT / "index.html"
DOWNLOADS = SITE / "assets" / "downloads"
PDF = DOWNLOADS / "hermes-agentic-framework-session-michaelos-nous-style.pdf"
PPTX = DOWNLOADS / "hermes-agentic-framework-session-michaelos-nous-style.pptx"
SHOTS = ROOT / "dist" / "unique-slide-png"

SLIDES = [
    (1, "boot-map", "BOOT MAP", ["Telegram", "Hermes", "Skills", "Receipts"], "pocket remote → agent workshop → proof"),
    (2, "agenda-rail", "AGENDA RAIL", ["What", "Why", "Where", "How", "Safe"], "one-hour track, no mystery bag"),
    (3, "bot-vs-agent", "BOT VS AGENT", ["Answers", "Tools", "Proof", "Memory"], "execution is the line"),
    (4, "hermes-stack", "HERMES STACK", ["Profile", "Tools", "Skills", "Cron", "Memory"], "separate lanes, shared operating recipe"),
    (5, "migration-highway", "MIGRATION", ["OpenClaw", "Bridge", "Hermes", "Live work"], "busy road becomes highway"),
    (6, "private-vault", "PRIVATE SETUP", ["Workspace", "Profiles", "Logs", "No IDs"], "client-safe version hides private handles"),
    (7, "service-panel", "SERVICES", ["Gateway", "Worker", "Coordinator", "Relay", "Console"], "background helpers stay boring and visible"),
    (8, "local-desks", "LOCAL SEATS", ["Local A", "Local B", "Local C", "Local D"], "one machine, named jobs"),
    (9, "remote-mesh", "REMOTE SEATS", ["Remote A", "Remote B", "Remote C", "Monitor", "Mini PC", "Specialist"], "distributed seats, generic names"),
    (10, "group-relay", "GROUP ORDER", ["Primary", "Specialist", "Relay", "Final"], "visible chat plus durable delivery"),
    (11, "discord-ops-room", "DISCORD OPS", ["Teams", "Threads", "Approvals", "Logs"], "shared operating room"),
    (12, "channel-map", "CHANNEL MAP", ["start", "requests", "approvals", "build-log", "alerts"], "channels are workflow shelves"),
    (13, "team-visibility", "TEAM VISIBILITY", ["Public answer", "Correction", "Receipt", "Learning"], "private comms become team memory"),
    (14, "memory-ledger", "MEMORY LEDGER", ["team-sync", "ByteRover", "Obsidian", "Hermes", "Skills"], "notebook on the left, proof on the right"),
    (15, "repo-pipeline", "REPO PIPELINE", ["Read rules", "Patch", "Test", "Screenshot", "Report"], "style guide before random changes"),
    (16, "swarm-handoff", "SWARM HANDOFF", ["Primary", "Backup", "Tony", "Verify", "Final"], "handoff loop with receipts"),
    (17, "monitor-radar", "MONITOR RADAR", ["Heartbeat", "Errors", "Costs", "Alerts"], "quiet when healthy"),
    (18, "business-workspace", "BUSINESS SETUP", ["Company", "Ops", "Sales", "Admin", "IT"], "small roles before broad actions"),
    (19, "user-org", "USER MAP", ["Leadership", "Ops", "Sales", "Finance", "IT"], "one business, many safe lanes"),
    (20, "keyring-gates", "KEYRINGS", ["Role", "Tools", "Data", "Approval", "Audit"], "no robot gets every key"),
    (21, "client-dashboard", "CLIENT MONITOR", ["Alive", "Run", "Error", "Usage", "Digest"], "health board, not chatter"),
    (22, "daily-report", "DAILY REPORT", ["Done", "Blocked", "Risk", "Evidence", "Next"], "client sees receipts, not vibes"),
    (23, "rollout-stairs", "ROLLOUT", ["Map", "Watch", "Draft", "Tiny act", "Schedule"], "small steps first"),
    (24, "guard-rails", "GUARDRAILS", ["No public send", "No delete", "No secrets", "Proof"], "rules are visible bumpers"),
    (25, "demo-terminal", "SAFE DEMO", ["> roster", "> shared state", "> proof", "> no secrets"], "demo prompts stay inside the fence"),
    (26, "takeaway-orbit", "TAKEAWAY", ["Small", "Helpful", "Named", "Approved", "Logged"], "not one giant robot"),
]


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def rect(x, y, w, h, label, sub="", cls=""):
    sub_text = f'<text class="small" x="{x+w/2}" y="{y+52}">{esc(sub)}</text>' if sub else ""
    return f'<g class="node {cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/><text x="{x+w/2}" y="{y+30}">{esc(label)}</text>{sub_text}</g>'


def premium_backdrop(n: int, slug: str, title: str, labels: list[str]) -> str:
    """High-detail art-direction layer so each diagram feels like a designed artifact, not a wireframe."""
    accent = ["#000080", "#008080", "#d23232", "#111111", "#b88900"][(n - 1) % 5]
    alt = ["#fff4c2", "#e8f7ff", "#f1dfbf", "#d8f3dc", "#ffe1e1"][(n + 1) % 5]
    stripes = ''.join(f'<line class="micro-line" x1="{28+i*26}" y1="318" x2="{42+i*26}" y2="338"/>' for i in range(22))
    ticks = ''.join(f'<rect class="tick" x="{38+i*31}" y="48" width="18" height="5"/>' for i in range(17))
    lab = esc(slug.replace('-', ' / ').upper())
    return f'''
<defs>
  <pattern id="dots-{n}" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1.1" fill="#111" opacity=".18"/></pattern>
  <pattern id="hatch-{n}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 8 L8 -2 M2 10 L10 2" stroke="#000080" stroke-width="1" opacity=".18"/></pattern>
  <filter id="hardShadow-{n}" x="-8%" y="-8%" width="120%" height="120%"><feDropShadow dx="5" dy="5" stdDeviation="0" flood-color="#050505" flood-opacity="1"/></filter>
</defs>
<rect class="paper-bg" x="10" y="10" width="600" height="340"/>
<rect class="tone-field" x="22" y="48" width="576" height="274" fill="url(#dots-{n})"/>
<path class="blueprint" d="M32 96 H590 M32 148 H590 M32 200 H590 M32 252 H590 M104 56 V316 M210 56 V316 M316 56 V316 M422 56 V316 M528 56 V316"/>
<rect class="accent-slab" x="36" y="58" width="156" height="42" fill="{accent}"/>
<text class="slab-text" x="48" y="84">{esc(title)}</text>
<rect class="cream-slab" x="410" y="50" width="154" height="54" fill="{alt}"/>
<text class="micro-label" x="487" y="73">MIKE × NOUS</text><text class="micro-label" x="487" y="91">FIELD ARTIFACT {n:02d}</text>
<rect class="side-rail" x="34" y="116" width="34" height="184"/>
<text class="vertical-code" transform="translate(56 286) rotate(-90)">{lab}</text>
<path class="corner-cut" d="M572 284 L594 284 L594 306 L548 306 Z" fill="{accent}"/>
{ticks}{stripes}
'''


def premium_foreground(n: int, slug: str, labels: list[str]) -> str:
    """Small proof/interface details layered above the main diagram for production polish."""
    status = ''.join(f'<g class="status-dot"><circle cx="{474+i*26}" cy="300" r="7"/><text class="tiny" x="{474+i*26}" y="322">{i+1}</text></g>' for i in range(min(4, len(labels))))
    tapes = [
        '<path class="tape" d="M84 42 L162 36 L166 56 L88 62 Z"/>',
        '<path class="tape" d="M450 316 L552 306 L556 326 L454 336 Z"/>',
    ]
    return f'''
<g class="proof-chip"><rect x="78" y="304" width="230" height="30"/><text x="193" y="324">PROOF-FIRST / NO SECRETS / HUMAN GATE</text></g>
{status}
{''.join(tapes)}
<path class="zine" d="M26 36 H182 M438 324 H592 M34 324 L76 290 M542 34 L586 78"/>
'''


def diagram(n: int, slug: str, title: str, labels: list[str], note: str) -> str:
    # All diagrams share a Mike × Nous visual grammar: hard black lines, paper fill, blue title chips,
    # slight zine marks. Geometry changes per slide so no visual loops repeat.
    if n == 7:
        body = ''.join(rect(70, 50+i*48, 240, 36, lab, "ON") + f'<rect x="345" y="{58+i*48}" width="170" height="18"/><text class="small" x="430" y="{72+i*48}">healthy</text>' for i, lab in enumerate(labels)) + '<path class="wire" d="M330 46 V300"/><text class="small" x="310" y="326">service panel / boring uptime</text>'
    elif n == 8:
        body = ''.join(f'<g><rect x="{70+i*125}" y="92" width="82" height="128"/><rect x="{86+i*125}" y="220" width="50" height="18"/><rect x="{60+i*125}" y="238" width="102" height="22"/><text x="{111+i*125}" y="72">{esc(lab)}</text><text class="small" x="{111+i*125}" y="292">local desk</text></g>' for i,lab in enumerate(labels[:4])) + '<path class="wire" d="M111 260 H486"/>'
    elif n == 9:
        pts=[(110,88),(310,64),(500,108),(160,238),(350,248),(520,260)]
        body=''.join(f'<circle cx="{x}" cy="{y}" r="42"/><text class="small" x="{x}" y="{y+5}">{esc(labels[i][:9])}</text>' for i,(x,y) in enumerate(pts)) + '<path class="wire" d="M110 88 L310 64 L500 108 L520 260 L350 248 L160 238 Z M310 64 L350 248 M110 88 L520 260"/>'
    elif n == 10:
        body = rect(55,70,130,60,labels[0],"first") + rect(245,70,130,60,labels[1],"second") + rect(435,70,130,60,labels[2],"durable") + rect(245,230,130,60,labels[3],"answer") + '<path class="thick" d="M185 100 H245 M375 100 H435 M500 130 V260 H375 M245 260 H185 V130"/><circle cx="310" cy="174" r="38"/><text class="small" x="310" y="178">order</text>'
    elif n == 11:
        body = '<rect x="76" y="60" width="468" height="240"/><rect x="76" y="60" width="110" height="240"/><text x="131" y="95">ROOMS</text>' + ''.join(f'<text class="small" x="131" y="{135+i*34}">#{esc(l.lower()[:10])}</text>' for i,l in enumerate(labels)) + '<rect x="220" y="92" width="280" height="50"/><rect x="220" y="164" width="220" height="50"/><rect x="220" y="236" width="250" height="36"/><text class="small" x="360" y="123">threaded work receipt</text><text class="small" x="330" y="195">approval lane</text><text class="small" x="345" y="260">build log</text>'
    elif n == 12:
        body = '<rect x="70" y="48" width="480" height="264"/><rect x="70" y="48" width="170" height="264"/><text x="155" y="78">SERVER</text>' + ''.join(f'<rect x="92" y="{102+i*36}" width="124" height="24"/><text class="small" x="154" y="{119+i*36}">#{esc(l[:11])}</text>' for i,l in enumerate(labels)) + '<rect x="270" y="92" width="230" height="60"/><rect x="270" y="174" width="230" height="92"/><text class="small" x="385" y="127">one job per thread</text><text class="small" x="385" y="218">receipts stay searchable</text>'
    elif n == 13:
        pts=[(310,80),(462,178),(372,286),(204,286),(158,178)]
        body=''.join(f'<circle cx="{x}" cy="{y}" r="42"/><text class="small" x="{x}" y="{y+5}">{esc((labels+["Team"])[i][:10])}</text>' for i,(x,y) in enumerate(pts)) + '<path class="thick fillnone" d="M310 122 C420 122 450 212 372 244 M342 270 C268 318 178 266 188 178 M200 150 C230 74 282 58 310 80"/><text x="310" y="185">TEAM</text>'
    elif n == 16:
        body = ''.join(f'<rect x="58" y="{58+i*52}" width="130" height="36"/><text class="small" x="123" y="{82+i*52}">{esc(lab)}</text><line class="wire" x1="205" y1="{76+i*52}" x2="548" y2="{76+i*52}"/>' for i,lab in enumerate(labels)) + '<path class="thick" d="M250 76 C330 128 400 112 470 180 S520 252 548 284"/>'
    elif n == 18:
        body = '<rect x="92" y="70" width="436" height="230"/><line x1="92" y1="150" x2="528" y2="150"/><line x1="92" y1="226" x2="528" y2="226"/><line x1="238" y1="70" x2="238" y2="300"/><line x1="382" y1="70" x2="382" y2="300"/>' + ''.join(f'<text class="small" x="{164+(i%3)*144}" y="{116+(i//3)*76}">{esc(lab)}</text>' for i,lab in enumerate(labels))
    elif n == 19:
        body = rect(230,48,160,50,labels[0],"summary") + ''.join(rect(55+i*125,160,100,48,lab,"lane") for i,lab in enumerate(labels[1:5])) + '<path class="wire" d="M310 98 V132 H105 V160 M310 132 H230 V160 M310 132 H355 V160 M310 132 H480 V160"/><rect x="120" y="260" width="380" height="32"/><text class="small" x="310" y="282">shared rules / separated data</text>'
    elif n == 20:
        body = '<circle cx="310" cy="164" r="58"/><rect x="252" y="164" width="116" height="84"/><text x="310" y="214">LOCK</text>' + ''.join(f'<g><circle cx="{90+i*105}" cy="82" r="22"/><rect x="{82+i*105}" y="104" width="16" height="78"/><text class="small" x="{90+i*105}" y="204">{esc(lab[:8])}</text></g>' for i,lab in enumerate(labels))
    elif n == 21:
        body = '<rect x="64" y="56" width="492" height="248"/><rect x="64" y="56" width="492" height="42"/><text x="152" y="84">HEALTH</text>' + ''.join(f'<rect x="{96+(i%3)*150}" y="{126+(i//3)*70}" width="112" height="42"/><text class="small" x="{152+(i%3)*150}" y="{153+(i//3)*70}">{esc(lab)}</text>' for i,lab in enumerate(labels)) + '<path class="wire" d="M96 252 H524"/>'
    elif n == 22:
        body = ''.join(f'<g><rect x="{54+i*108}" y="72" width="88" height="188"/><text class="small" x="{98+i*108}" y="106">{esc(lab)}</text><line x1="{70+i*108}" y1="132" x2="{126+i*108}" y2="132"/><line x1="{70+i*108}" y1="160" x2="{126+i*108}" y2="160"/><line x1="{70+i*108}" y1="188" x2="{126+i*108}" y2="188"/></g>' for i,lab in enumerate(labels))
    elif n == 23:
        body = ''.join(f'<rect x="{62+i*100}" y="{260-i*36}" width="86" height="36"/><text class="small" x="{105+i*100}" y="{284-i*36}">{esc(lab[:9])}</text>' for i,lab in enumerate(labels)) + '<path class="thick" d="M62 308 H570"/><path class="wire" d="M105 260 V224 H205 V188 H305 V152 H405 V116 H505"/>'
    elif n == 24:
        body = '<path class="thick" d="M88 292 L532 84"/><path class="wire" d="M88 250 L532 42 M118 318 L562 110"/>' + ''.join(f'<rect x="{80+i*122}" y="{70+i%2*72}" width="92" height="48"/><text class="small" x="{126+i*122}" y="{99+i%2*72}">{esc(lab[:11])}</text>' for i,lab in enumerate(labels)) + '<text x="310" y="270">HUMAN GATE</text>'
    elif n == 1:
        body = '<path class="wire" d="M120 92 H490 V266 H120 Z M120 92 L490 266 M490 92 L120 266"/>' + ''.join([
            rect(44, 54, 152, 68, labels[0], "remote"), rect(424, 54, 152, 68, labels[1], "profiles"),
            rect(424, 232, 152, 68, labels[2], "tools"), rect(44, 232, 152, 68, labels[3], "logs")]) + '<circle cx="310" cy="177" r="52"/><text x="310" y="183">CONTROL</text>'
    elif n in (2, 23):
        steps = ''.join(rect(50+i*105, 262-i*34, 82, 48, lab[:9], "", "step") for i, lab in enumerate(labels))
        body = '<path class="thick" d="M48 310 L585 118"/><path class="wire" d="M55 80 H575"/>' + steps
    elif n == 3:
        body = rect(38, 72, 210, 220, "CHATBOT", "answers") + rect(372, 72, 210, 220, "AGENT", "does") + '<path class="thick" d="M278 180 H342"/><path class="thick fillnone" d="M330 166 L346 180 L330 194"/><text class="small" x="143" y="166">no tools</text><text class="small" x="143" y="205">weak receipts</text><text class="small" x="477" y="166">tools</text><text class="small" x="477" y="205">proof</text>'
    elif n == 4:
        body = ''.join(rect(230, 40+i*56, 160, 44, lab, "") for i, lab in enumerate(labels)) + ''.join(f'<path class="wire" d="M310 {84+i*56} V{96+i*56}"/>' for i in range(4)) + '<rect x="170" y="24" width="280" height="312" class="outline"/><text class="small" x="310" y="334">profile lane boundary</text>'
    elif n == 5:
        body = '<path class="wire" d="M45 245 C165 145 235 310 355 188 S508 82 580 156"/><path class="thick" d="M55 282 C176 205 250 306 360 218 S505 126 570 178"/>' + rect(42, 40, 150, 62, labels[0], "experiments") + rect(238, 244, 132, 58, labels[1], "handoff") + rect(430, 56, 150, 62, labels[2], "main lane")
    elif n in (6, 20, 24):
        body = '<rect x="110" y="92" width="400" height="205"/><path class="thick fillnone" d="M205 92 V66 C205 22 415 22 415 66 V92"/>' + ''.join(rect(134+i*72, 162+(i%2)*54, 64, 42, lab[:7], "") for i, lab in enumerate(labels[:5]))
    elif n in (7, 8, 9, 11, 12, 18, 19):
        coords=[(42,52),(230,52),(418,52),(42,150),(230,150),(418,150),(136,248),(324,248)]
        body=''.join(rect(x,y,154,58,labels[i%len(labels)],"", "tile") for i,(x,y) in enumerate(coords[:max(5,min(len(labels)+2,8))]))
        body += '<path class="wire" d="M119 110 V150 M307 110 V150 M495 110 V150 M119 208 L213 248 M307 208 V248 M495 208 L401 248"/>'
    elif n in (10, 13, 16):
        body = ''.join(rect(x,y,142,62,lab,"") for (x,y),lab in zip([(52,62),(426,62),(426,238),(52,238),(239,150)], labels+['Receipt'])) + '<path class="wire" d="M194 93 H426 M497 124 V238 M426 269 H194 M123 238 V124 M194 269 L239 181 M381 181 L426 269"/>'
    elif n == 14:
        rows=''.join(f'<line x1="72" y1="{92+i*46}" x2="548" y2="{92+i*46}"/>' for i in range(5))
        body=f'<rect x="72" y="54" width="476" height="258"/>{rows}<line x1="252" y1="54" x2="252" y2="312"/>' + ''.join(f'<text class="small" x="162" y="{82+i*46}">{esc(l)}</text><text class="small" x="400" y="{82+i*46}">proof link</text>' for i,l in enumerate(labels[:5]))
    elif n == 15:
        body=''.join(rect(36+i*114, 96+(i%2)*78, 96, 52, lab, "") for i,lab in enumerate(labels)) + '<path class="wire" d="M132 122 H150 V200 H264 V122 H378 V200 H492"/><rect x="72" y="276" width="476" height="34"/><text class="small" x="310" y="299">changed files · screenshot · test output</text>'
    elif n in (17, 21):
        body='<circle cx="310" cy="180" r="126"/><circle cx="310" cy="180" r="82"/><circle cx="310" cy="180" r="34"/><path class="thick fillnone" d="M310 180 L310 54 M310 180 L421 235"/>' + ''.join(f'<text class="small" x="{120+i*96}" y="330">{esc(lab[:10])}</text>' for i,lab in enumerate(labels[:5]))
    elif n == 22:
        body=''.join(rect(54, 58+i*52, 160, 38, lab, "") + f'<line class="wire" x1="230" y1="{77+i*52}" x2="548" y2="{77+i*52}"/>' for i,lab in enumerate(labels))
    elif n == 25:
        body='<rect x="58" y="52" width="504" height="260"/><rect x="58" y="52" width="504" height="42"/><text x="116" y="80">SAFE_DEMO.EXE</text>' + ''.join(f'<text class="prompt" x="92" y="{136+i*43}">{esc(l)}</text>' for i,l in enumerate(labels))
    else:
        pts=[(310,72),(466,132),(430,270),(190,270),(154,132)]
        body=''.join(f'<circle cx="{x}" cy="{y}" r="42"/><text class="small" x="{x}" y="{y+5}">{esc(labels[i])}</text>' for i,(x,y) in enumerate(pts)) + '<path class="wire" d="M310 72 L466 132 L430 270 L190 270 L154 132 Z"/><circle cx="310" cy="180" r="54"/><text x="310" y="185">HUMAN</text>'
    backdrop = premium_backdrop(n, slug, title, labels)
    foreground = premium_foreground(n, slug, labels)
    return f'<div class="diagram-card unique-diagram {slug}"><svg viewBox="0 0 620 360" class="sys-svg premium-svg" role="img" aria-label="{esc(title)}">{backdrop}<g class="main-mark" filter="url(#hardShadow-{n})">{body}</g>{foreground}<text class="diagram-note" x="310" y="346">{esc(note)}</text></svg></div>'


def patch_html() -> None:
    src = HTML.read_text()
    if "unique-deck-refresh-20260630" not in src:
        extra_css = """
/* unique-deck-refresh-20260630: latest Mike × Nous deck treatment */
.unique-diagram{background:#fff7e8;border:4px solid #050505;box-shadow:5px 5px 0 #050505;position:relative;overflow:hidden}
.unique-diagram::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(#111 .72px,transparent .8px);background-size:7px 7px;opacity:.055;mix-blend-mode:multiply}.sys-svg .paper-bg{fill:#f5ead7;stroke:#050505;stroke-width:0}.sys-svg .zine{stroke:#000080;stroke-width:4;fill:none}.sys-svg .diagram-title{font:900 18px 'IBM Plex Mono',monospace;fill:#000080;letter-spacing:.08em}.sys-svg .diagram-note{font:900 12px 'IBM Plex Mono',monospace;fill:#090909;text-anchor:middle;letter-spacing:.02em}.sys-svg rect,.sys-svg circle{fill:#fff7e8;stroke:#090909;stroke-width:4}.sys-svg .node rect{fill:#f1dfbf}.sys-svg .step rect,.sys-svg .tile rect{fill:#fff4c2}.sys-svg .wire,.sys-svg line{stroke:#090909;stroke-width:3;fill:none}.sys-svg .thick{stroke:#000080;stroke-width:7;fill:none}.sys-svg text{font:900 18px 'IBM Plex Mono',monospace;fill:#090909;text-anchor:middle}.sys-svg .small{font-size:12px}.sys-svg .prompt{font:900 18px 'IBM Plex Mono',monospace;text-anchor:start;fill:#000080}.sys-svg .outline{fill:none;stroke:#000080;stroke-width:5}.mast h1{letter-spacing:-.055em}.stamp span{font-family:'IBM Plex Mono',monospace}.receipt{font-family:'IBM Plex Mono',monospace}.receipt div:nth-child(2){font-weight:900;color:#000080}.tag{box-shadow:3px 3px 0 #090909}
"""
        src = src.replace("</style>", extra_css + "</style>")
    if "premium-deck-refresh-20260630c" not in src:
        premium_css = """
/* premium-deck-refresh-20260630c: stronger generated-art quality pass */
.unique-diagram{box-shadow:7px 7px 0 #050505, inset 0 0 0 3px rgba(255,255,255,.55)!important;background:#f5ead7!important}.mast{grid-template-columns:minmax(0,1fr) 330px!important;gap:20px!important;padding:16px 26px 12px!important;align-items:end!important}.kicker{font-size:10px!important;line-height:1.2!important;max-width:760px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}h1{font-size:clamp(36px,3.35vw,52px)!important;line-height:.92!important;letter-spacing:-.055em!important;text-wrap:balance!important;max-width:760px!important}.stamp{max-width:330px!important;padding:8px 10px!important;transform:rotate(.7deg)!important}.stamp b{font-size:14px!important;line-height:1.05!important}.stamp span{font-size:9px!important;line-height:1.22!important}.bodygrid{grid-template-columns:.72fr 1.28fr!important;gap:18px!important;padding:16px 26px 12px!important;overflow:hidden!important}.bodygrid>aside{min-width:0!important;min-height:0!important;display:grid!important;grid-template-rows:minmax(0,1fr) auto!important;gap:7px!important}.panel{padding:12px!important;overflow:hidden!important}.label{font-size:9px!important;padding:4px 7px!important}.panel h2{font-size:24px!important;line-height:.96!important;margin:9px 0 8px!important}.panel ul{padding-left:18px!important;margin-top:4px!important}.panel li{font-size:13.8px!important;line-height:1.13!important;margin:3px 0!important}.diagram-card{padding:8px!important;min-height:0!important;height:100%!important;display:block!important}.sys-svg{height:100%!important;min-height:300px!important;max-height:346px!important}.receipt{margin-top:0!important;gap:6px!important}.receipt div{padding:6px 7px!important;font-size:8.5px!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.footer{padding:8px 26px 9px!important;gap:12px!important}.footer strong{font-size:12px!important}.footer span{font-size:8.5px!important;line-height:1.2!important}.tag{font-size:9px!important;padding:5px 8px!important}.premium-svg .paper-bg{fill:#f5ead7!important;stroke:#050505!important;stroke-width:4!important}.premium-svg .tone-field{stroke:#050505!important;stroke-width:2!important;opacity:.64!important}.premium-svg .blueprint{stroke:#000080!important;stroke-width:1.2!important;opacity:.16!important;fill:none!important}.premium-svg .accent-slab,.premium-svg .cream-slab,.premium-svg .side-rail,.premium-svg .proof-chip rect{stroke:#050505!important;stroke-width:3!important;filter:url(#hardShadow-1)}.premium-svg .slab-text{font:900 15px 'IBM Plex Mono',monospace!important;fill:#fff!important;text-anchor:start!important;letter-spacing:.06em!important}.premium-svg .micro-label,.premium-svg .tiny{font:900 9px 'IBM Plex Mono',monospace!important;fill:#050505!important;letter-spacing:.08em!important}.premium-svg .vertical-code{font:900 11px 'IBM Plex Mono',monospace!important;fill:#fff!important;text-anchor:middle!important;letter-spacing:.12em!important}.premium-svg .tick{fill:#050505!important;stroke:none!important}.premium-svg .micro-line{stroke:#d23232!important;stroke-width:2!important;opacity:.42!important}.premium-svg .corner-cut{stroke:#050505!important;stroke-width:3!important}.premium-svg .main-mark rect,.premium-svg .main-mark circle{stroke:#050505!important;stroke-width:4!important;vector-effect:non-scaling-stroke}.premium-svg .main-mark .node rect{fill:#fff7e8!important}.premium-svg .main-mark .step rect,.premium-svg .main-mark .tile rect{fill:#fff4c2!important}.premium-svg .main-mark text{paint-order:stroke;stroke:#fff7e8;stroke-width:3px;stroke-linejoin:round}.premium-svg .proof-chip text{font:900 10px 'IBM Plex Mono',monospace!important;fill:#fff!important;stroke:none!important;letter-spacing:.04em!important}.premium-svg .proof-chip rect{fill:#050505!important}.premium-svg .status-dot circle{fill:#23d160!important;stroke:#050505!important;stroke-width:3!important}.premium-svg .tape{fill:rgba(255,244,194,.86)!important;stroke:#050505!important;stroke-width:2!important;opacity:.9!important}.premium-svg .diagram-note{font:900 11px 'IBM Plex Mono',monospace!important;fill:#050505!important;paint-order:stroke;stroke:#f5ead7;stroke-width:4px;letter-spacing:.02em}.premium-svg .zine{stroke:#000080!important;stroke-width:4!important;fill:none!important}.diagram-card.unique-diagram::before{content:"";position:absolute;left:12px;right:12px;top:12px;height:10px;background:repeating-linear-gradient(90deg,#050505 0 12px,#fff4c2 12px 22px,#000080 22px 34px);z-index:1;opacity:.92}.diagram-card.unique-diagram::after{opacity:.075!important;background:radial-gradient(#111 .85px,transparent .95px)!important;background-size:6px 6px!important}
"""
        src = src.replace("</style>", premium_css + "</style>")
    for n, slug, title, labels, note in SLIDES:
        pattern = re.compile(rf'(<section class="slide" id="slide-{n}" data-diagram=")([^"]+)(".*?<aside>)(<div class="diagram-card[^>]*">.*?</svg></div>)(<div class="receipt">)', re.S)
        svg = diagram(n, slug, title, labels, note)
        src, count = pattern.subn(lambda m: m.group(1)+slug+m.group(3)+svg+m.group(5), src, count=1)
        if count != 1:
            raise RuntimeError(f"could not patch slide {n}")
    src = src.replace("style: MC × Nous", "style: latest Mike × Nous guide")
    src = src.replace("MichaelOS desktop shell outside. Nous-style field-note artifact inside.", "MichaelOS shell outside. Latest Mike × Nous field-note artifact inside.")
    HTML.write_text(src)


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("$", " ".join(map(str, cmd)))
    subprocess.run(cmd, cwd=cwd or ROOT, check=True)


def render_assets() -> None:
    SHOTS.mkdir(parents=True, exist_ok=True)
    chromium = shutil.which("chromium") or shutil.which("chromium-browser") or shutil.which("google-chrome") or "/snap/bin/chromium"
    file_url = HTML.resolve().as_uri()
    run([chromium, "--headless", "--no-sandbox", "--disable-gpu", "--run-all-compositor-stages-before-draw", f"--print-to-pdf={PDF}", "--print-to-pdf-no-header", file_url])
    for n, *_ in SLIDES:
        out = SHOTS / f"slide-{n:02d}.png"
        run([chromium, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1600,900", f"--screenshot={out}", f"{file_url}#slide-{n}"])


def write_xml(z: zipfile.ZipFile, name: str, content: str) -> None:
    z.writestr(name, content.encode("utf-8"))


def build_pptx() -> None:
    # Full-bleed screenshot-only PowerPoint, compatible with Keynote/PowerPoint/LibreOffice.
    cx, cy = 12192000, 6858000  # 13.333 x 7.5 in
    with zipfile.ZipFile(PPTX, "w", compression=zipfile.ZIP_DEFLATED) as z:
        write_xml(z, "[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' + ''.join(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' for i in range(1,27)) + '</Types>')
        write_xml(z, "_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>')
        write_xml(z, "ppt/presentation.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>' + ''.join(f'<p:sldId id="{256+i}" r:id="rId{i+1}"/>' for i in range(1,27)) + f'</p:sldIdLst><p:sldSz cx="{cx}" cy="{cy}" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>')
        write_xml(z, "ppt/_rels/presentation.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' + ''.join(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>' for i in range(1,27)) + '</Relationships>')
        write_xml(z, "ppt/slideMasters/slideMaster1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>')
        write_xml(z, "ppt/slideMasters/_rels/slideMaster1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>')
        write_xml(z, "ppt/slideLayouts/slideLayout1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld></p:sldLayout>')
        write_xml(z, "ppt/slideLayouts/_rels/slideLayout1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>')
        for i in range(1,27):
            img = SHOTS / f"slide-{i:02d}.png"
            # normalize to exact 1600x900 if chromium oddities appear
            im = Image.open(img)
            if im.size != (1600,900):
                im = im.resize((1600,900))
                im.save(img)
            z.write(img, f"ppt/media/image{i}.png")
            slide_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:pic><p:nvPicPr><p:cNvPr id="2" name="Slide {i}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'''
            write_xml(z, f"ppt/slides/slide{i}.xml", slide_xml)
            write_xml(z, f"ppt/slides/_rels/slide{i}.xml.rels", f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{i}.png"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>')


def verify() -> None:
    html_text = HTML.read_text()
    data = re.findall(r'<section class="slide" id="slide-(\d+)" data-diagram="([^"]+)"', html_text)
    if len(data) != 26:
        raise RuntimeError(f"expected 26 slides, got {len(data)}")
    slugs = [slug for _, slug in data]
    if len(set(slugs)) != 26:
        raise RuntimeError("diagram slugs are not unique")
    if html_text.count('unique-diagram') < 26:
        raise RuntimeError("unique diagram cards missing")
    with zipfile.ZipFile(PPTX) as z:
        slide_count = len([n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)])
        image_count = len([n for n in z.namelist() if re.match(r'ppt/media/image\d+\.png$', n)])
    print(f"verified: {len(data)} HTML slides, {len(set(slugs))} unique diagram slugs, PPTX slides={slide_count}, images={image_count}, PDF bytes={PDF.stat().st_size}")


def main() -> None:
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    patch_html()
    render_assets()
    build_pptx()
    verify()

if __name__ == "__main__":
    main()
