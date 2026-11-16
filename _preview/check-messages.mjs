import { createHmac, createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import pg from 'pg';
process.loadEnvFile('.env');
const origin = 'http://192.168.1.12:3000';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, options: '-c default_transaction_read_only=on' });
await client.connect();
const fingerprint = async () => {
  const data = await client.query(`SELECT 'message' AS kind, row_to_json(m)::text AS data FROM "Message" m UNION ALL SELECT 'reply' AS kind, row_to_json(r)::text AS data FROM "MessageReply" r ORDER BY kind, data`);
  return createHash('sha256').update(JSON.stringify(data.rows)).digest('hex');
};
const before = await fingerprint();
const { rows: [user] } = await client.query('SELECT id, name, email, role FROM "User" WHERE role = $1 AND "isBlocked" = false ORDER BY "createdAt" LIMIT 1', ['ADMIN']);
if (!user) throw new Error('Aucun administrateur existant disponible');
const payload = Buffer.from(JSON.stringify({userId:user.id,name:user.name,email:user.email,role:user.role,expiresAt:Math.floor(Date.now()/1000)+900})).toString('base64url');
const token = `${payload}.${createHmac('sha256',process.env.AUTH_SECRET).update(payload).digest('base64url')}`;
const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
const ws = new WebSocket(targets.find(t => t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let sequence=0;
const pending=new Map();
const nonGet=[];
const errors=[];
ws.onmessage=({data})=>{
  const message=JSON.parse(data);
  if(message.id){ const p=pending.get(message.id); if(p){pending.delete(message.id); message.error?p.reject(new Error(message.error.message)):p.resolve(message.result);} }
  if(message.method==='Network.requestWillBeSent'&&!['GET','HEAD','OPTIONS'].includes(message.params.request.method)) nonGet.push(message.params.request.method);
  if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if(message.method==='Page.frameNavigated' && !message.params.frame.parentId) console.log('Navigation:', new URL(message.params.frame.url).pathname);
  if(message.method==='Runtime.consoleAPICalled') { const text=message.params.args.filter(a=>a.type==='string').map(a=>a.value).join(' '); if (/HMR|Fast Refresh|hydration|reload/i.test(text)) console.log(text.slice(0,300)); }
};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);return result.result.value;};
const wait=async expression=>{
  for(let i=0;i<600;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}
  throw new Error('Page non prête');
};
const screenshot=async name=>{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`_preview/${name}.png`,Buffer.from(shot.data,'base64'));};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:false});
await send('Network.setCookie',{name:'datasys_admin_session',value:token,url:origin,path:'/espace-admin',httpOnly:true,sameSite:'Lax'});
const mode=process.argv[2]||'before';
try {
  for(const [width,height] of mode==='before'?[[1280,1000],[390,844]]:[[320,700],[390,844],[600,900],[800,600],[1280,1000]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=800});
    await send('Emulation.setTouchEmulationEnabled',{enabled:width<=800});
    await send('Page.navigate',{url:origin+'/espace-admin/messages'});
    await wait(`document.readyState === 'complete' && !!document.querySelector('.gmail-settings-panel') && !!document.querySelector('.messages-panel') && !!document.querySelector('.message-selection-all input') && Object.keys(document.querySelector('.message-selection-all input')).some(k=>k.startsWith('__reactProps'))`);
    await evaluate(`document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`);
    console.log(JSON.stringify({mode,width,stats:await evaluate(`({cards:document.querySelectorAll('.message-card').length,replies:document.querySelectorAll('.message-conversation-outgoing').length,unread:document.querySelectorAll('.message-card:not(.is-read)').length,overflow:document.documentElement.scrollWidth>innerWidth,gmailOpen:document.querySelector('.gmail-settings-panel').open})`)}));
    await screenshot(`messages-${mode}-${width}`);
    if(mode==='after'){
      await evaluate(`document.querySelector('.message-thread')?.setAttribute('open','');document.querySelector('.message-reply')?.setAttribute('open','');document.querySelector('.message-card')?.scrollIntoView({block:'start'})`);
      await screenshot(`messages-detail-${width}`);
      console.log(JSON.stringify({width,detailOverflow:await evaluate(`document.documentElement.scrollWidth>innerWidth`)}));
    }
  }
  console.log(JSON.stringify({unchanged:before===await fingerprint(),nonGet,errors}));
} finally { await send('Network.clearBrowserCookies');ws.close();await client.end(); }
