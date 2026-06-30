const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const pack = __dirname;
const contentDir = path.join(pack, 'content');
const outDir = path.join(pack, 'dist');
const downloadsDir = path.join(root, 'assets/downloads/business-agent-harness-pack');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(downloadsDir, { recursive: true });

const docs = [
  ['00-pack-readme.md', 'Business Agent Harness Pack'],
  ['01-external-client-framework.md', 'External Client Framework'],
  ['02-internal-implementation-framework.md', 'Internal Implementation Framework'],
  ['03-onsite-install-discord-permissions-guide.md', 'On-site Install Guide'],
  ['04-business-training-guide-discord-agents.md', 'Business Training Guide'],
  ['05-templates-and-checklists.md', 'Templates & Checklists'],
];

function esc(s){return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function inline(s){
  return esc(s)
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
}
function parseTable(lines, i){
  const rows=[];
  while(i<lines.length && /^\s*\|.*\|\s*$/.test(lines[i])){ rows.push(lines[i]); i++; }
  const clean = rows.filter((r,idx)=>idx!==1 || !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(r));
  const htmlRows = clean.map((r,idx)=>{
    const cells = r.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>inline(c.trim()));
    const tag = idx===0 ? 'th' : 'td';
    return '<tr>'+cells.map(c=>`<${tag}>${c}</${tag}>`).join('')+'</tr>';
  }).join('\n');
  return [`<div class="table-wrap"><table>${htmlRows}</table></div>`, i];
}
function mdToHtml(md){
  md = md.replace(/^---[\s\S]*?---\s*/, '');
  const lines = md.split(/\r?\n/);
  let out=[], i=0, list=null;
  function closeList(){ if(list){ out.push(`</${list}>`); list=null; } }
  while(i<lines.length){
    const line=lines[i];
    if(!line.trim()){ closeList(); i++; continue; }
    if(line.startsWith('```')){
      closeList(); const lang=line.slice(3).trim(); i++; const code=[];
      while(i<lines.length && !lines[i].startsWith('```')){code.push(lines[i]); i++;}
      i++; out.push(`<pre><code class="language-${esc(lang)}">${esc(code.join('\n'))}</code></pre>`); continue;
    }
    if(/^\s*\|.*\|\s*$/.test(line) && i+1<lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1])){
      closeList(); const [html, ni]=parseTable(lines,i); out.push(html); i=ni; continue;
    }
    const h=line.match(/^(#{1,4})\s+(.*)$/);
    if(h){ closeList(); const level=h[1].length; out.push(`<h${level}>${inline(h[2])}</h${level}>`); i++; continue; }
    const cb=line.match(/^[-*]\s+\[([ x])]\s+(.*)$/i);
    if(cb){ if(list!=='ul'){ closeList(); out.push('<ul class="checklist">'); list='ul'; } out.push(`<li class="${cb[1].toLowerCase()==='x'?'done':''}">${inline(cb[2])}</li>`); i++; continue; }
    const ul=line.match(/^[-*]\s+(.*)$/);
    if(ul){ if(list!=='ul'){ closeList(); out.push('<ul>'); list='ul'; } out.push(`<li>${inline(ul[1])}</li>`); i++; continue; }
    const ol=line.match(/^\d+\.\s+(.*)$/);
    if(ol){ if(list!=='ol'){ closeList(); out.push('<ol>'); list='ol'; } out.push(`<li>${inline(ol[1])}</li>`); i++; continue; }
    closeList();
    const para=[line.trim()]; i++;
    while(i<lines.length && lines[i].trim() && !/^(#{1,4})\s+/.test(lines[i]) && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i]) && !lines[i].startsWith('```')){ para.push(lines[i].trim()); i++; }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  closeList();
  return out.join('\n');
}

const css = `
:root{--blue:#073a68;--blue2:#0c5d9f;--paper:#f5ead7;--paper2:#fff7e8;--ink:#070707;--muted:#544b40;--cyan:#33e8ff;--teal:#00a6a6;--green:#23d160;--amber:#fff4c2;--win:#c0c0c0;--navy:#000080;}
*{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at 12% 10%,rgba(51,232,255,.18),transparent 24%),linear-gradient(135deg,var(--blue),var(--blue2));font:15px/1.55 Arial,Helvetica,sans-serif;color:var(--ink);} 
.shell{max-width:1120px;margin:22px auto;padding:0 16px 48px}.window{background:var(--win);border:2px solid #fff;border-right-color:#404040;border-bottom-color:#404040;box-shadow:8px 10px 0 rgba(0,0,0,.78),18px 20px 0 rgba(0,166,166,.24)}
.title{background:linear-gradient(90deg,var(--navy),#1084d0);color:#fff;font:900 13px/1 Tahoma,sans-serif;text-transform:uppercase;letter-spacing:.04em;padding:9px 12px;border-bottom:2px solid #000;display:flex;justify-content:space-between;gap:12px}.tag{background:#111;color:#fff;border:1px solid var(--cyan);padding:4px 7px;font:900 10px/1 monospace;}
.paper{position:relative;background:var(--paper);border:4px solid #111;margin:8px;padding:28px 34px 38px;overflow:hidden}.paper:before{content:"";position:absolute;inset:0;background:radial-gradient(#111 .65px,transparent .9px);background-size:7px 7px;opacity:.05;pointer-events:none}.paper>*{position:relative;z-index:1}
.hyper{position:relative;background:var(--paper2);border:3px solid #111;box-shadow:5px 5px 0 #111,11px 11px 0 rgba(0,166,166,.28);outline:2px solid rgba(51,232,255,.18);outline-offset:6px;padding:20px;margin:18px 0 24px}.hyper:before{content:"BUSINESS AGENT HARNESS";display:inline-block;background:#111;color:#fff;border:1px solid var(--cyan);padding:5px 7px;margin:0 0 12px;font:900 10px/1 monospace;letter-spacing:.08em}
h1{font:900 42px/.95 Arial Black,Arial,sans-serif;letter-spacing:-.05em;text-transform:uppercase;color:var(--navy);margin:0 0 16px}h2{font:900 25px/1.1 Arial,sans-serif;color:var(--navy);margin:30px 0 10px;border-top:3px solid #111;padding-top:13px}h3{font:900 18px/1.2 Arial,sans-serif;color:#800000;margin:20px 0 8px}h4{font:900 15px/1.2 Arial,sans-serif;margin:16px 0 6px}p{margin:0 0 11px}ul,ol{margin:8px 0 14px 22px;padding:0}li{margin:4px 0}code{background:#111;color:#fff;padding:2px 4px;font:12px/1.2 Consolas,monospace}pre{background:#111;color:#fff;border:3px solid #000;box-shadow:4px 4px 0 var(--teal);padding:13px;overflow:auto;white-space:pre-wrap}pre code{padding:0;background:transparent}.table-wrap{overflow:auto;margin:12px 0 18px;border:3px solid #111;box-shadow:4px 4px 0 var(--teal);background:#fff}table{border-collapse:collapse;width:100%;min-width:660px}th{background:var(--navy);color:#fff;text-align:left}th,td{border:1px solid #111;padding:8px 9px;vertical-align:top}tr:nth-child(even) td{background:#fffaf0}.toc{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.toc a{display:block;background:var(--paper2);border:3px solid #111;box-shadow:4px 4px 0 #111,9px 9px 0 rgba(0,166,166,.24);padding:14px;text-decoration:none;color:#111;font-weight:900;min-height:92px}.toc a span{display:block;font:900 16px/1.35 Arial,Helvetica,sans-serif;margin-bottom:8px}.toc a small{display:block;font:700 11px/1.35 Consolas,monospace;color:#3d3429;overflow-wrap:anywhere}.meta{font:900 11px/1.5 monospace;text-transform:uppercase;color:#fff;background:#111;display:inline-block;padding:6px 8px;margin:0 0 12px}.footer{margin-top:28px;font:12px/1.4 monospace;border-top:3px solid #111;padding-top:10px;color:var(--muted)}
@media print{body{background:white}.shell{max-width:none;margin:0;padding:0}.window{box-shadow:none;border:0}.title{print-color-adjust:exact;-webkit-print-color-adjust:exact}.paper{margin:0;border:0;padding:20mm}.hyper{break-inside:avoid}.table-wrap{break-inside:avoid}h2,h3{break-after:avoid}}`;
fs.writeFileSync(path.join(outDir,'pack.css'), css);

function pageHtml(file, title){
  const md=fs.readFileSync(path.join(contentDir,file),'utf8');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="pack.css"></head><body><main class="shell"><section class="window"><div class="title"><span>${esc(title)}</span><span>MICHAELOS × NOUS × HYPERFRAMES</span></div><article class="paper"><div class="meta">Client-ready framework pack · v1.0</div><div class="hyper">${mdToHtml(md)}</div><div class="footer">Prepared by Michael Costea · michaelcostea.com · Business Agent Harness Pack</div></article></section></main></body></html>`;
}

const links=[];
for(const [file,title] of docs){
  const base=file.replace(/\.md$/,'');
  fs.writeFileSync(path.join(outDir,base+'.html'), pageHtml(file,title));
  links.push(`<a href="${base}.html"><span>${esc(title)}</span><small>${esc(file)}</small></a>`);
}
const index = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Business Agent Harness Pack</title><link rel="stylesheet" href="pack.css"></head><body><main class="shell"><section class="window"><div class="title"><span>Business Agent Harness Pack</span><span>MICHAELOS × NOUS × HYPERFRAMES</span></div><article class="paper"><div class="meta">Framework · install · training · templates</div><div class="hyper"><h1>Business Agent Harness Pack</h1><p>A complete internal and external documentation pack for installing a governed Discord-based business agent harness.</p><div class="toc">${links.join('\n')}</div></div><div class="footer">Prepared by Michael Costea · michaelcostea.com</div></article></section></main></body></html>`;
fs.writeFileSync(path.join(outDir,'index.html'), index);

(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  for(const [file,title] of docs){
    const base=file.replace(/\.md$/,'');
    const htmlPath = path.join(outDir,base+'.html');
    const pdfPath = path.join(outDir,base+'.pdf');
    await page.goto('file://'+htmlPath, {waitUntil:'load'});
    await page.pdf({path:pdfPath, format:'A4', printBackground:true, margin:{top:'10mm',right:'8mm',bottom:'10mm',left:'8mm'}});
    fs.copyFileSync(pdfPath, path.join(downloadsDir, base+'.pdf'));
  }
  await page.goto('file://'+path.join(outDir,'index.html'), {waitUntil:'load'});
  await page.screenshot({path:path.join(outDir,'pack-preview.png'), fullPage:false});
  await browser.close();
  console.log(JSON.stringify({outDir, downloadsDir, docs:docs.length}, null, 2));
})();
