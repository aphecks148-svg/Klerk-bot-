require("dotenv").config();
const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios");
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;
const BOT="iKON-BOT",OWNER="Aphecks iKon Klerk";
const PREFIX=String(process.env.PREFIX||"!").trim()||"!";
const PORT=Number(process.env.PORT||10000);
const APPSTATE_RAW=String(process.env.APPSTATE||"").trim();
const RENDER_URL=process.env.RENDER_URL||process.env.RENDER_EXTERNAL_URL||"";
const ADMINS=new Set(String(process.env.ADMIN_IDS||process.env.ADMIN_ID||"").split(",").map(x=>x.trim()).filter(Boolean));
console.log(`👑 ADMINS: ${[...ADMINS].join(", ")||"NONE"}`);
const app=express();app.use(express.json());
const DATA=path.join(__dirname,"data"),FILE=path.join(DATA,"state.json");
if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
const DEFAULT={settings:{botEnabled:true,maintenance:false,reactions:true,replies:true,reactCooldown:1500,pokemonInterval:1200000},users:{},groups:{},pending:{},battles:{},cooldowns:{},pokemon:null,logs:[]};
let S=JSON.parse(JSON.stringify(DEFAULT));
try{if(fs.existsSync(FILE)){const x=JSON.parse(fs.readFileSync(FILE,"utf8"));S={...DEFAULT,...x,settings:{...DEFAULT.settings,...(x.settings||{})},pending:x.pending||{},groups:x.groups||{},users:x.users||{}};S.settings.botEnabled=true;S.settings.replies=true;S.settings.maintenance=false;S.settings.reactions=true;}}catch(e){}
function save(){try{fs.writeFileSync(FILE,JSON.stringify(S,null,2))}catch(e){}}
function getUser(uid){uid=String(uid);let u=S.users[uid]||{uid,balance:1000,bank:0,vault:0,xp:0,level:1,inventory:{},pets:[],stats:{},battles:{}};u.uid=uid;u.inventory=u.inventory||{};u.pets=u.pets||[];S.users[uid]=u;return u;}
function saveUser(u){if(u?.uid)S.users[String(u.uid)]=u;}
async function syncGroup(api,id){id=String(id);try{const info=await new Promise((res,rej)=>api.getThreadInfo(id,(err,data)=>err?rej(err):res(data)));const old=S.groups[id]||S.pending[id]||{};const members=info.participantIDs||[];const hasAdmin=members.some(m=>ADMINS.has(String(m)));const g={...old,threadID:id,name:info.threadName||old.name||"Unnamed",members:members.length||old.members||0,status:"ACTIVE",approved:old.approved===true||hasAdmin,updatedAt:Date.now()};if(g.approved){S.groups[id]=g;delete S.pending[id];}else if(!S.groups[id]){S.pending[id]={...g,pendingAt:Date.now()};}save();return g;}catch(e){return S.groups[id]||S.pending[id]||{threadID:id,name:"Unknown",members:0,status:"UNKNOWN",approved:false}}}
const registry=new Map(),aliases=new Map(),dupes=[];
function register(c,file="system"){if(!c||!c.name||typeof c.run!=="function")return;const name=String(c.name).toLowerCase().trim();if(!name)return;if(registry.has(name)){dupes.push(name);return}registry.set(name,{...c,name,module:file});for(const a of (c.aliases||[])){const x=String(a).toLowerCase().trim();if(!x||x===name||registry.has(x)||aliases.has(x))continue;aliases.set(x,name)}}
function getCommand(n){n=String(n||"").toLowerCase().trim();return registry.get(n)||registry.get(aliases.get(n))}
function loadCommands(){const dir=path.join(__dirname,"commands");if(!fs.existsSync(dir)){console.log("❌ commands/ missing");return}const files=[];for(let i=1;i<=8;i++){const f=`cmds_${i}.js`;if(fs.existsSync(path.join(dir,f)))files.push(f);}const extra=fs.readdirSync(dir).filter(x=>/^cmds_\d+\.js$/i.test(x)&&!files.includes(x)).sort();const all=[...files,...extra];console.log(`🔍 Found: ${all.join(", ")}`);for(const file of all){try{delete require.cache[require.resolve(path.join(dir,file))];const m=require(path.join(dir,file));const list=Array.isArray(m)?m:m.commands?Array.isArray(m.commands)?m.commands:Object.values(m.commands):Object.values(m||{});let c=0;list.forEach(x=>{const b=registry.size;register(x,file);if(registry.size>b)c++});console.log(`📦 ${file} -> ${c} | total ${registry.size}`)}catch(e){console.log(`❌ ${file}: ${e.message}`)}}console.log(`📚 FINAL: ${registry.size} cmds | Dupes: ${dupes.length}`)}
const REACTIONS=["👍","❤️","😂","🔥","👏","😍","💯","⚡","🎉","🐉","💰","🏆","👑","🚀","✨"],random=a=>a[Math.floor(Math.random()*a.length)],reactCD=new Map(),spam=new Map(),cmdCD=new Map();
function box(t,b,f=`🤖 ${BOT}`){return [`╭━━━〔 ${t} 〕━━━╮`,"",b,"",`╰━━━〔 ${f} 〕━━━╯`].join("\n")}
function send(api,e,text){if(!S.settings.replies||text==null)return;try{api.sendMessage(String(text),e.threadID,(err)=>{if(err)console.log("SEND FAIL",err)},e.messageID)}catch(x){try{api.sendMessage(String(text),e.threadID)}catch(y){}}}
function react(api,e){if(!S.settings.reactions||typeof api.setMessageReaction!=="function")return;const k=String(e.threadID),now=Date.now();if(now-(reactCD.get(k)||0)<S.settings.reactCooldown)return;reactCD.set(k,now);try{api.setMessageReaction(random(REACTIONS),e.messageID,()=>{},true)}catch(x){}}
function parse(b){let s=String(b||"").trim();if(!s.startsWith(PREFIX))return null;s=s.slice(PREFIX.length).trim().replace(/\s+/g," ");if(!s)return null;const p=s.split(" "),name=(p.shift()||"").toLowerCase();return{name,args:p,raw:s};}
function isAdmin(uid){return ADMINS.has(String(uid))}
function allowed(uid,tid){const k=`${tid}:${uid}`,now=Date.now(),a=(spam.get(k)||[]).filter(x=>now-x<8000);a.push(now);spam.set(k,a);return a.length<=10;}
function menu(n=0){n=Number(n)||0;const titles=["🤖 MAIN MENU","🐾 PET LABS","💰 FINANCE","💀 CRIME","🎮 ARCADE","🛡️ ADMIN","⭐ PROGRESSION","⚔️ WAR-ZONE","🤖 AI"];const title=titles[n>=1&&n<=8?n:0];const list=n>=1&&n<=8?[...registry.values()].filter(x=>x.module===`cmds_${n}.js`):[...registry.values()].filter(x=>x.module!=="system").slice(0,200);return ["━━━━━━━━━━━━",` ${title}`,"━━━━━━━━━━━━",`⚡ ${registry.size} cmds | 👥 ${Object.keys(S.groups).length} | ⏳ ${Object.keys(S.pending).length}`,"",...list.map(x=>`✨ ${PREFIX}${x.name}`),"","━━━━━━━━━━━━",`${PREFIX}menu 1-8 | ${PREFIX}help | ${PREFIX}pending`].join("\n");}
register({name:"menu",aliases:["commands"],description:"Menu",run:c=>menu(c.args[0]||0)});
register({name:"uid",description:"UID",run:c=>box("🆔 UID",`🔐 ${c.uid}`)});
register({name:"ping",description:"Ping",run:()=>box("🏓 PONG",`🟢 ONLINE\n📚 ${registry.size} cmds\n⏱️ ${Math.floor(process.uptime())}s`)});
register({name:"status",description:"Status",run:()=>box("📊 STATUS",`🟢 ONLINE\n📚 ${registry.size}\n👥 ${Object.keys(S.groups).length}\n⏳ ${Object.keys(S.pending).length}\n👑 ${[...ADMINS].join(",")}`)});
register({name:"help",description:"Help",run:c=>{const x=getCommand(c.args[0]);if(!x)return menu();return box(`📖 ${PREFIX}${x.name}`,`${x.description||""}\n${x.syntax||PREFIX+x.name}`)}});
register({name:"search",description:"Search",run:c=>{const q=c.args.join(" ").toLowerCase().trim();if(!q)return box("🔎 SEARCH",`${PREFIX}search <word>`);const r=[...registry.values()].filter(x=>`${x.name} ${x.description||""}`.toLowerCase().includes(q)).slice(0,30);if(!r.length)return box("🔎","Nothing");return box("🔎 RESULTS",r.map(x=>`✨ ${PREFIX}${x.name}`).join("\n"))}});
register({name:"me",description:"Profile",run:c=>{const u=c.user;return box("👤 PROFILE",`🆔 ${c.uid}\n💰 $${Number(u.balance||0).toLocaleString()}\n⭐ Lvl ${u.level||1}`)}});
register({name:"pending",aliases:["pendinglist"],permission:"admin",description:"Pending",run:()=>{const p=Object.values(S.pending);if(!p.length)return box("⏳ PENDING","✅ No pending");return box("⏳ PENDING",p.map(g=>`${g.name}\n🆔 ${g.threadID}\n✅!approve_gc ${g.threadID}`).join("\n\n"))}});
register({name:"approve_gc",aliases:["approve"],permission:"admin",description:"Approve",run:async c=>{const id=String(c.args[0]||c.threadID).trim();const target=S.pending[id]||S.groups[id];if(!target)return box("❌","Not found "+id);target.approved=true;S.groups[id]={...target,approved:true,status:"ACTIVE"};delete S.pending[id];save();try{c.api.sendMessage(box("✅ APPROVED",`🎉 ${BOT} active! ${PREFIX}menu`),id)}catch(e){}return box("✅ APPROVED",`👥 ${target.name}\n🆔 ${id}`)}});
register({name:"reject_gc",aliases:["reject"],permission:"admin",description:"Reject",run:c=>{const id=String(c.args[0]||"").trim();if(!id)return box("❌",`${PREFIX}reject_gc <id>`);delete S.pending[id];delete S.groups[id];save();return box("❌ REJECTED",id)}});
register({name:"approve_all",permission:"admin",description:"Approve all",run:c=>{const ids=Object.keys(S.pending);if(!ids.length)return box("⏳","No pending");for(const id of ids){S.groups[id]={...S.pending[id],approved:true};delete S.pending[id];try{c.api.sendMessage(box("✅ APPROVED",`${BOT} ON! ${PREFIX}menu`),id)}catch(e){}}save();return box("✅ ALL","Approved "+ids.length)}});
register({name:"bot",permission:"admin",description:"Bot toggle",run:c=>{const a=String(c.args[0]||"").toLowerCase();if(a==="on"){S.settings.botEnabled=true;S.settings.replies=true;save();return box("🤖","🟢 ON")}if(a==="off"){S.settings.botEnabled=false;save();return box("🤖","🔴 OFF admin bypass")}return box("🤖 BOT",`Enabled:${S.settings.botEnabled}\nPending:${Object.keys(S.pending).length}`)}});
async function execute(api,e){
 const p=parse(e.body);if(!p)return;const uid=String(e.senderID||""),tid=String(e.threadID||"");if(!uid||!tid)return;
 const adminUser=isAdmin(uid);
 console.log(`📩 ${p.name} from ${uid} admin=${adminUser} pending=${!!S.pending[tid]} group=${tid}`);
 const group=await syncGroup(api,tid);
 const isPending=S.pending[tid]&&!S.groups[tid];
 if(isPending&&!adminUser){console.log(`⏸️ Blocked pending GC ${tid} from ${uid}`);return;}
 react(api,e);
 const c=getCommand(p.name);if(!c){console.log(`❓ Unknown ${p.name}`);return send(api,e,box("❓ UNKNOWN",`No ${PREFIX}${p.name}\n📚 ${PREFIX}menu`));}
 const user=getUser(uid);
 const ctx={api,event:e,uid,threadID:tid,user,group,args:p.args,raw:p.raw,PREFIX,prefix:PREFIX,state:S,isAdmin:adminUser,send:x=>send(api,e,x),reply:x=>send(api,e,x),react:()=>react(api,e),axios,save};
 if(!S.settings.botEnabled&&!adminUser)return send(api,e,box("🔴 OFF","Disabled"));
 if(c.permission==="admin"&&!adminUser)return send(api,e,box("🔐 DENIED","Admin only"));
 const key=`${tid}:${uid}:${c.name}`,now=Date.now(),last=cmdCD.get(key)||0,cd=Number(c.cooldown||0);
 if(cd&&!adminUser&&now-last<cd)return send(api,e,box("⏳ CD",`Wait ${Math.ceil((cd-(now-last))/1000)}s`));
 cmdCD.set(key,now);
 try{const result=await c.run(ctx);if(result!=null&&result!=="")send(api,e,result);saveUser(user);save();}catch(err){console.log(`❌ [${c.name}]`,err.message);send(api,e,box("💥 ERROR",err.message))}}
let reconnectAttempts=0,isConnecting=false,stopListener=null,heartbeat=null,lastRestart=0;
function getAppState(){if(!APPSTATE_RAW){console.log("❌ APPSTATE EMPTY");return null}let data=APPSTATE_RAW;try{data=JSON.parse(data)}catch(e){try{data=JSON.parse(decodeURIComponent(data))}catch(e2){return null}}if(!Array.isArray(data)||!data.length)return null;console.log(`🍪 APPSTATE ${data.length}`);return data;}
function connectMessenger(){
 if(isConnecting)return;isConnecting=true;
 const appState=getAppState();if(!appState){isConnecting=false;return}
 console.log(`🔐 Login #${reconnectAttempts+1}`);
 try{
  login({appState},(err,api)=>{
   isConnecting=false;
   if(err){console.log("❌ Login:",err.error||err.message);const d=Math.min(10000*Math.pow(1.5,reconnectAttempts),120000);reconnectAttempts++;setTimeout(connectMessenger,d);return;}
   reconnectAttempts=0;global.API_INSTANCE=api;api.setOptions({listenEvents:true,updatePresence:true,selfListen:false,autoMarkRead:false,autoMarkDelivery:false,forceLogin:true});
   console.log(`🤖 CONNECTED ${api.getCurrentUserID()}`);S.settings.botEnabled=true;S.settings.replies=true;save();
   const startListener=()=>{
    if(stopListener)try{stopListener()}catch(e){}
    if(heartbeat)clearInterval(heartbeat);
    console.log("🎧 MQTT ON");
    stopListener=api.listenMqtt(async(err,e)=>{
     if(err){console.log("⚠️ MQTT:",err.error||err.message);if(String(err.error||err.message).includes("Not logged in")||String(err.error||err.message).includes("Connection")){if(stopListener)try{stopListener()}catch(x){}if(heartbeat)clearInterval(heartbeat);setTimeout(connectMessenger,5000);}return;}
     try{
      if(e.logMessageType==="log:subscribe"&&e.threadID){
       const id=String(e.threadID),g=await syncGroup(api,id);
       if(!g.approved&&!S.groups[id]){
        S.pending[id]={...g,approved:false,pendingAt:Date.now()};save();
        console.log(`⏳ NEW PENDING ${g.name} ${id}`);
        for(const adminID of ADMINS)try{api.sendMessage([`⏳ NEW GC PENDING`,`👥 ${g.name}`,`🆔 ${id}`,`👤 ${g.members}`,``, `✅ ${PREFIX}approve_gc ${id}`].join("\n"),adminID)}catch(x){}
       }
      }
      if(e.type==="message"&&e.body){
       if(e.senderID===api.getCurrentUserID())return;
       await execute(api,e);
      }
     }catch(x){console.log("EVENT",x.message)}
    });
    heartbeat=setInterval(()=>{try{if(!global.API_INSTANCE){clearInterval(heartbeat);connectMessenger();return;}api.getCurrentUserID();}catch(ex){clearInterval(heartbeat);connectMessenger();}},60000);
   };
   startListener();
   setInterval(()=>{const now=Date.now();if(now-lastRestart>25*60*1000){lastRestart=now;console.log("🔄 Refresh");startListener();}},5*60*1000);
  });
 }catch(e){isConnecting=false;console.log("Login ex",e.message);setTimeout(connectMessenger,15000);}
}
app.get("/",(req,res)=>res.json({bot:BOT,status:"ACTIVE",commands:registry.size,groups:Object.keys(S.groups).length,pending:Object.keys(S.pending).length,admins:[...ADMINS]}));
app.get("/health",(req,res)=>res.json({ok:true,commands:registry.size,messenger:Boolean(global.API_INSTANCE)}));
app.listen(PORT,()=>console.log(`🌐 ${BOT} :${PORT}`));
setInterval(save,30000);
setInterval(()=>{const url=RENDER_URL||`http://127.0.0.1:${PORT}/health`;axios.get(url,{timeout:10000}).catch(()=>{})},240000);
process.on("unhandledRejection",e=>console.log("UNHANDLED",e?.message));
process.on("uncaughtException",e=>console.log("EXCEPTION",e.stack||e.message));
function start(){console.log("━━━━━━━━━━━━");console.log(`🤖 ${BOT}`);console.log(`👑 ${OWNER}`);console.log(`⚡ ${PREFIX}`);console.log("━━━━━━━━━━━━");loadCommands();connectMessenger();}
start();
