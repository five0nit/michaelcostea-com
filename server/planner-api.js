#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE = path.resolve(ROOT, '..', '..');
const PLANNER = path.join(WORKSPACE, 'automation/weekend-melbourne-autoplanner/scripts/weekend_planner.py');
const OUT_JSON = path.join(WORKSPACE, 'automation/weekend-melbourne-autoplanner/output/latest_plan.json');

function send(res, code, obj){
  res.writeHead(code, {'content-type':'application/json'});
  res.end(JSON.stringify(obj));
}
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }

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

const server = http.createServer((req,res)=>{
  if(req.url === '/api/planner/latest' && req.method === 'GET'){
    try {
      const events = fs.existsSync(OUT_JSON) ? readJson(OUT_JSON) : [];
      return send(res,200,{ok:true,events});
    } catch (e){ return send(res,500,{ok:false,error:String(e)}); }
  }

  if(req.url === '/api/planner/run' && req.method === 'POST'){
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

  send(res,404,{ok:false,error:'not found'});
});

server.listen(8787, ()=>{
  console.log('Planner API running on http://127.0.0.1:8787');
  console.log('Endpoints: GET /api/planner/latest, POST /api/planner/run');
});
