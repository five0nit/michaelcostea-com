#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE = path.resolve(ROOT, '..', '..');
const PLANNER = path.join(WORKSPACE, 'automation/weekend-melbourne-autoplanner/scripts/weekend_planner.py');
const OUT_JSON = path.join(WORKSPACE, 'automation/weekend-melbourne-autoplanner/output/latest_plan.json');
const QUOTES_DIR = path.join(WORKSPACE, 'web/michaelcostea-site/data');
const QUOTES_PATH = path.join(QUOTES_DIR, 'quotes.json');

function corsHeaders(){
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-api-key',
  };
}

function send(res, code, obj){
  res.writeHead(code, {'content-type':'application/json', ...corsHeaders()});
  res.end(JSON.stringify(obj));
}
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p, data){ fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }

function loadQuotes(){
  try {
    if (!fs.existsSync(QUOTES_PATH)) return [];
    const arr = readJson(QUOTES_PATH);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveQuotes(arr){
  fs.mkdirSync(QUOTES_DIR, { recursive: true });
  writeJson(QUOTES_PATH, arr.slice(0, 500));
}

function buildArgs(body={}){
  const a = [PLANNER];
  a.push('--scope', body.scope || 'day');
  a.push('--region', body.region || 'au-nz');
  if (body.currentLocation) a.push('--current-location', String(body.currentLocation));
  if (typeof body.budgetAud === 'number' && !Number.isNaN(body.budgetAud)) a.push('--budget-aud', String(body.budgetAud));
  if (body.restOfToday) a.push('--rest-of-today');
  if (body.kidsMode) a.push('--kids-mode');
  if (body.pushGoogle) a.push('--push-google');
  if (body.date) { a.push('--date', String(body.date)); }
  return a;
}

const API_KEY = process.env.PLANNER_API_KEY || '';
const HOST = process.env.PLANNER_API_HOST || '127.0.0.1';
const PORT = Number(process.env.PLANNER_API_PORT || 8787);

const rateMap = new Map();
function rateLimited(ip){
  const now = Date.now();
  const item = rateMap.get(ip) || { n: 0, t: now };
  if (now - item.t > 60_000) { item.n = 0; item.t = now; }
  item.n += 1;
  rateMap.set(ip, item);
  return item.n > 120;
}

const server = http.createServer((req,res)=>{
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  const ip = req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) return send(res,429,{ok:false,error:'rate limit'});
  if (API_KEY) {
    const got = req.headers['x-api-key'];
    if (got !== API_KEY) return send(res,401,{ok:false,error:'unauthorized'});
  }

  if(pathname === '/api/planner/latest' && req.method === 'GET'){
    try {
      const events = fs.existsSync(OUT_JSON) ? readJson(OUT_JSON) : [];
      return send(res,200,{ok:true,events});
    } catch (e){ return send(res,500,{ok:false,error:String(e)}); }
  }

  if(pathname === '/api/planner/run' && req.method === 'POST'){
    let raw='';
    req.on('data',d=>raw+=d);
    req.on('end',()=>{
      let body={};
      try{ body = raw ? JSON.parse(raw) : {}; }catch(e){ return send(res,400,{ok:false,error:'invalid json'}); }
      const args = buildArgs(body);
      const p = spawn('python3', args, { cwd: WORKSPACE });
      let out='',err='';
      p.stdout.on('data',d=>out+=d);
      p.stderr.on('data',d=>err+=d);
      p.on('close', code=>{
        if(code !== 0) return send(res,500,{ok:false,error:'planner failed',stderr:err,stdout:out,args});
        try {
          const events = fs.existsSync(OUT_JSON) ? readJson(OUT_JSON) : [];
          return send(res,200,{ok:true,args,stdout:out,events});
        } catch (e){ return send(res,500,{ok:false,error:String(e),stdout:out}); }
      });
    });
    return;
  }

  if(pathname === '/api/ozquotes/latest' && req.method === 'GET'){
    const quotes = loadQuotes();
    return send(res,200,{ok:true,quote:quotes[0] || null,count:quotes.length});
  }

  if(pathname === '/api/ozquotes/list' && req.method === 'GET'){
    const quotes = loadQuotes();
    return send(res,200,{ok:true,quotes, count:quotes.length});
  }

  if(pathname === '/api/ozquotes/save' && req.method === 'POST'){
    let raw='';
    req.on('data',d=>raw+=d);
    req.on('end',()=>{
      let body={};
      try{ body = raw ? JSON.parse(raw) : {}; }catch(e){ return send(res,400,{ok:false,error:'invalid json'}); }
      const quote = {
        ...body,
        id: body.id || `q_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      const quotes = loadQuotes();
      const next = [quote, ...quotes.filter(q => q.id !== quote.id)];
      saveQuotes(next);
      return send(res,200,{ok:true,quote, count:next.length});
    });
    return;
  }

  send(res,404,{ok:false,error:'not found'});
});

server.listen(PORT, HOST, ()=>{
  console.log(`Planner API running on http://${HOST}:${PORT}`);
  console.log('Endpoints: GET /api/planner/latest, POST /api/planner/run, GET /api/ozquotes/latest, GET /api/ozquotes/list, POST /api/ozquotes/save');
  console.log(`API key required: ${API_KEY ? 'yes' : 'no'}`);
});
