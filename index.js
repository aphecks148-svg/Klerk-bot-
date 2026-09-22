require("dotenv").config();
const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios");
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:(FCA.login||FCA);
const BOT_NAME="iKON-BOT",OWNER_NAME="Aphecks iKon Klerk",PREFIX=String(process.env.PREFIX||"!"),PORT=+process.env.PORT||1000,APPSTATE_RAW=process.env.APPSTATE||"",GEMINI_API_KEY=process.env.GEMINI_API_KEY||"";
const ADMINS=new Set(String(process.env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean)),app=express();
app.use(express.json({limit:"2mb"}));

const DIR=path.join(__dirname,"data"),FILE=path.join(DIR,"state.json");if(!fs.existsSync(DIR))fs.mkdirSync(DIR,{recursive:true});
const DEFAULT={settings:{botEnabled:true,maintenance:false,replies:true,reactions:true,autoReact:"👍",reactCooldown:2500,prefix:PREFIX},users:{},groups:{},pending:{},battles:{},cooldowns:{},spam:{},logs:[],events:{},commandStats:{}};
let S=DEFAULT;
try{if(fs.existsSync(FILE)){const r=JSON.parse(fs.readFileSync(FILE,"utf8"));S={...DEFAULT,...r,settings:{...DEFAULT.settings,...(r.settings||{})}}}}catch(e){console.log("⚠️ State error:",e.message)}
const now=()=>Date.now(),save=()=>{try{fs.writeFileSync(FILE,JSON.stringify(S,null,2))}catch(e){}},money=n=>Number(n||0).toLocaleString("en-US");

function user(id,name){
 id=String(id);if(!S.users[id])S.users[id]={uid:id,name:name||"Player",balance:0,bank:0,savings:0,vault:0,credit:500,xp:0,level:1,prestige:0,inventory:[],items:{},pets:[],skills:[],achievements:[],titles:[],stats:{commands:0,wins:0,losses:0,battles:0,messages:0}};
 const u=S.users[id];u.name=name||u.name||"Player";u.balance=+u.balance||0;u.bank=+u.bank||0;u.savings=+u.savings||0;u.vault=+u.vault||0;u.credit=+u.credit||500;u.xp=+u.xp||0;u.level=Math.max(1,+u.level||1);u.pets=Array.isArray(u.pets)?u.pets:[];u.items=u.items||{};u.inventory=Array.isArray(u.inventory)?u.inventory:[];u.stats=u.stats||{};u.stats.commands=+u.stats.commands||0;u.stats.messages=+u.stats.messages||0;return u;
}
function group(id,name){
 id=String(id);if(!S.groups[id])S.groups[id]={threadID:id,name:name||"Unknown Group",enabled:true,pending:true,approved:false,members:0};
 const g=S.groups[id];g.name=name||g.name||"Unknown Group";return g;
}

/* COMMAND REGISTRY */
const registry=new Map(),aliases=new Map();let duplicates=0;
function register(c,src){
 if(!c?.name||typeof c.run!=="function")return;
 const n=c.name.trim().toLowerCase();if(registry.has(n)){duplicates++;return}
 c.name=n;c.aliases=(c.aliases||[]).map(x=>String(x).toLowerCase());c.category=c.category||"Other";c.purpose=c.purpose||c.description||"Community command";c.cooldown=+c.cooldown||0;c.permission=c.permission||"user";
 registry.set(n,c);for(const a of c.aliases)if(a&&!registry.has(a)&&!aliases.has(a))aliases.set(a,n);
}
const resolve=n=>registry.get(String(n||"").toLowerCase())||registry.get(aliases.get(String(n||"").toLowerCase())||"");

function load(){
 const d=path.join(__dirname,"commands");if(!fs.existsSync(d))return;
 fs.readdirSync(d).filter(f=>/^cmds_\d+\.js$/i.test(f)).sort((a,b)=>+a.match(/\d+/)-+b.match(/\d+/)).forEach(f=>{try{const p=path.join(d,f);delete require.cache[require.resolve(p)];const x=require(p),a=Array.isArray(x)?x:Object.values(x||{});a.forEach(c=>register(c,f));console.log(`📦 ${f} loaded`)}catch(e){console.log(`❌ ${f}:`,e.message)}});
 console.log(`📚 Commands: ${registry.size} | Duplicates: ${duplicates}`);
}

/* UI */
function box(t,b){return`━━━━━━━━━━━━━━━━━━━━\n${t}\n━━━━━━━━━━━━━━━━━━━━\n${b}\n━━━━━━━━━━━━━━━━━━━━\n🤖 ${BOT_NAME}\n👑 ${OWNER_NAME}\n⚡ Prefix: ${PREFIX}\n━━━━━━━━━━━━━━━━━━━━`}
function menu(){
 const f=[...registry.values()].filter(x=>x.featured).slice(0,150),l=[
 "🌟━━━━━━━━━━━━━━━━━━━━🌟","       🤖 iKON-BOT","     COMMUNITY HUB","🌟━━━━━━━━━━━━━━━━━━━━🌟","","🔥 Yo bro, welcome to the world!","💰 Build your empire","🐾 Raise legendary pets","⚔️ Battle players & bosses","🎰 Test your luck","🔥 Run missions & crimes","🧠 Talk with AI","","📚━━ COMMAND CATEGORIES ━━📚","",
 "🐾 PET LABS","   ✦ Pets • Breeding • Care • Battles","",
 "💰 FINANCE","   ✦ Money • Bank • Business • Stocks","",
 "🔥 CRIME","   ✦ GTA • Heists • Robbery • Gangs","",
 "🎮 ARCADE","   ✦ Casino • Games • Events • Social","",
 "🛡️ ADMIN","   ✦ Moderation • Settings • Controls","",
 "⭐ PROGRESSION","   ✦ Levels • Jobs • Missions • Guilds","",
 "⚔️ WAR-ZONE","   ✦ Bosses • PvP • Dungeon • Raid","",
 "🧠 AI SYSTEMS","   ✦ AI • Tools • Translation • Creative","",
 "━━━━━━━━━━━━━━━━━━━━","⭐ FEATURED COMMANDS","━━━━━━━━━━━━━━━━━━━━",""
 ];
 f.forEach(c=>l.push(`✨ ${PREFIX}${c.name}`));
 l.push("","━━━━━━━━━━━━━━━━━━━━","💡 QUICK HELP","━━━━━━━━━━━━━━━━━━━━",`📖 ${PREFIX}help <command>`,`🔎 ${PREFIX}search <word>`,`📂 ${PREFIX}category <name>`,`🆔 ${PREFIX}uid`,`👤 ${PREFIX}me`,`💰 ${PREFIX}bal`,`📊 ${PREFIX}status`,"","😂 Hint: Try something... I might surprise you.","🚀 Let's build your empire!","🔥 Stay active. Stay dangerous.","","━━━━━━━━━━━━━━━━━━━━",`🤖 ${BOT_NAME}`,`👑 ${OWNER_NAME}`,"━━━━━━━━━━━━━━━━━━━━");
 return l.join("\n");
}

/* PARSER */
function parse(body){
 const t=String(body||"").trim();if(!t)return;
 const e=PREFIX.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),m=t.match(new RegExp("^"+e+"\\s*(\\S+)?(?:\\s+([\\s\\S]*))?$","i"));if(!m)return;
 const a=String(m[2]||"").trim();return{name:String(m[1]||"menu").toLowerCase(),args:a?a.split(/\s+/):[],argText:a,raw:t};
}

/* PERMISSIONS */
const admin=id=>ADMINS.has(String(id));
function groupAdmin(api,tid,uid){return new Promise(r=>{try{api.getThreadInfo(tid,(e,i)=>{if(e||!i)return r(false);r((i.adminIDs||[]).some(x=>String(typeof x==="string"?x:x.id||x.userID)===String(uid)))})}catch(e){r(false)}})}
async function permission(api,c,x){if(admin(x.uid)||c.permission==="user")return true;if(["admin","owner","staff"].includes(String(c.permission).toLowerCase()))return groupAdmin(api,x.threadID,x.uid);return true}

/* REPLY */
function send(api,text,tid,mid){return new Promise(r=>{try{api.sendMessage(String(text),tid,e=>r(!e),mid)}catch(e){r(false)}})}
function react(api,e){try{if(S.settings.reactions&&api.setMessageReaction)api.setMessageReaction(S.settings.autoReact||"👍",e.messageID,()=>{},true)}catch(x){}}

/* AI */
async function ai(prompt){
 if(!GEMINI_API_KEY)return"🧠 AI is currently offline because GEMINI_API_KEY is not configured.";
 try{const u="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+encodeURIComponent(GEMINI_API_KEY),r=await axios.post(u,{contents:[{parts:[{text:`You are iKON-BOT. Be friendly, useful and concise.\n${prompt}`}]}]},{timeout:30000});return r.data?.candidates?.[0]?.content?.parts?.[0]?.text||"🧠 No response generated."}catch(e){return"🧠 AI temporarily unavailable."}
}

/* SYSTEM COMMANDS */
[
 {name:"menu",aliases:["commands","cmds"],category:"System",featured:true,purpose:"Open the main menu",run:async()=>({text:menu()})},
 {name:"help",aliases:["h"],category:"System",featured:true,purpose:"Show command information",run:async c=>{const x=resolve(c.args[0]);return{text:x?box(`📖 ${PREFIX}${x.name}`,`💡 ${x.purpose}\n📂 ${x.category}\n⚡ Cooldown: ${x.cooldown||0}s\n🔐 Permission: ${x.permission}\n📝 ${PREFIX}${x.name}${x.usage?" "+x.usage:""}`):menu()}}},
 {name:"search",category:"System",featured:true,purpose:"Search commands",run:async c=>{const q=c.args.join(" ").toLowerCase();const f=[...registry.values()].filter(x=>x.name.includes(q)||x.purpose.toLowerCase().includes(q)).slice(0,40);return{text:box(`🔎 SEARCH: ${q}`,f.length?f.map(x=>`✨ ${PREFIX}${x.name} — ${x.purpose}`).join("\n"):"❌ Nothing found.")}}},
 {name:"category",aliases:["cat"],category:"System",featured:true,purpose:"Show category commands",run:async c=>{const q=c.args.join(" ").toLowerCase(),f=[...registry.values()].filter(x=>String(x.category).toLowerCase()===q);return{text:f.length?box(`📂 ${q.toUpperCase()}`,f.map(x=>`✨ ${PREFIX}${x.name} — ${x.purpose}`).join("\n")):box("📂 CATEGORIES","🐾 PET LABS\n💰 FINANCE\n🔥 CRIME\n🎮 ARCADE\n🛡️ ADMIN\n⭐ PROGRESSION\n⚔️ WAR-ZONE\n🧠 AI SYSTEMS")}}},
 {name:"uid",aliases:["myuid","id"],category:"System",featured:true,purpose:"Show Messenger UID",run:async c=>({text:box("🆔 YOUR UID",`👤 ${c.user.name}\n🪪 ${c.uid}`)})},
 {name:"me",aliases:["profile"],category:"System",featured:true,purpose:"Show player profile",run:async c=>({text:box("👤 PLAYER PROFILE",`👤 ${c.user.name}\n🪪 ${c.uid}\n⭐ Level: ${c.user.level}\n✨ XP: ${c.user.xp}\n💰 Wallet: $${money(c.user.balance)}\n🏦 Bank: $${money(c.user.bank)}\n🐾 Pets: ${c.user.pets.length}\n👑 Prestige: ${c.user.prestige}\n🏆 Rank: ${c.user.rank||"Rookie"}`)})},
 {name:"bal",aliases:["balance","b","money"],category:"Finance",featured:true,purpose:"Show financial balances",run:async c=>({text:box("💰 FINANCIAL STATUS",`💵 Wallet: $${money(c.user.balance)}\n🏦 Bank: $${money(c.user.bank)}\n💎 Savings: $${money(c.user.savings)}\n🔐 Vault: $${money(c.user.vault)}\n💳 Credit: ${c.user.credit}\n\n🔥 Keep building your empire!`)})},
 {name:"ping",aliases:["pong"],category:"System",featured:true,purpose:"Check bot response",run:async()=>({text:box("🏓 PONG!","🟢 iKON-BOT is alive!\n⚡ Messenger connection active.\n🚀 Ready for commands!")})},
 {name:"status",aliases:["health"],category:"System",featured:true,purpose:"Show bot status",run:async()=>({text:box("📊 BOT STATUS",`🟢 ONLINE\n📚 Commands: ${registry.size}\n👥 Groups: ${Object.keys(S.groups).length}\n👤 Users: ${Object.keys(S.users).length}\n💾 Storage: LOCAL\n🤖 Messenger: ${apiGlobal?"CONNECTED":"WAITING"}\n⏱️ Uptime: ${Math.floor(process.uptime())}s`)})},
 {name:"keepalive",aliases:["alive"],category:"System",purpose:"Check bot uptime",run:async()=>({text:`💚 ${BOT_NAME} is awake!\n🔥 Still running.\n⏱️ ${Math.floor(process.uptime())} seconds.`})}
].forEach(c=>register(c,"index.js"));

/* EXECUTION */
async function execute(api,e,p){
 const uid=String(e.senderID||"");if(!uid)return;
 const u=user(uid,"Player"),tid=String(e.threadID||""),g=group(tid,e.threadName||"Unknown Group"),c=resolve(p.name);
 if(!c)return send(api,box("❓ UNKNOWN COMMAND",`I don't know ${PREFIX}${p.name}.\n\n🔎 Try ${PREFIX}search ${p.name}\n📖 Try ${PREFIX}help\n📋 Try ${PREFIX}menu`),tid,e.messageID);
 const a=admin(uid);
 if(!a&&!S.settings.botEnabled)return send(api,box("🔴 BOT OFFLINE","The bot is currently disabled by an administrator."),tid,e.messageID);
 if(!a&&S.settings.maintenance)return send(api,box("🛠️ MAINTENANCE","iKON-BOT is being updated right now.\nPlease try again shortly."),tid,e.messageID);
 if(!a&&g.enabled===false)return send(api,box("🔒 BOT DISABLED HERE","An administrator has disabled iKON-BOT in this group."),tid,e.messageID);
 if(!await permission(api,c,{uid,threadID:tid,user:u,group:g}))return send(api,box("🔐 ACCESS DENIED","You don't have permission to use this command."),tid,e.messageID);
 const key=`${uid}:${c.name}`,left=(S.cooldowns[key]||0)+(c.cooldown||0)*1000-now();
 if(!a&&left>0)return send(api,`⏳ Hold up bro 😎\n\n⚡ ${PREFIX}${c.name} is cooling down.\n🕐 Try again in ${Math.ceil(left/1000)}s.`,tid,e.messageID);
 try{
  u.stats.commands++;const r=await c.run({api,event:e,uid,threadID:tid,user:u,group:g,args:p.args,argText:p.argText,raw:p.raw,prefix:PREFIX,command:c,state:S,battles:S.battles,users:S.users,groups:S.groups,registry,aliases,admin:a,botUID,gemini:ai,askGemini:ai,send:t=>send(api,t,tid,e.messageID)});
  if(r?.money)u.balance+=+r.money;if(r?.xp){u.xp+=+r.xp;while(u.xp>=u.level*1000){u.xp-=u.level*1000;u.level++}}
  if(r?.text)await send(api,r.text,tid,e.messageID);if(!a&&c.cooldown)S.cooldowns[key]=now();S.commandStats[c.name]=(S.commandStats[c.name]||0)+1;save();
 }catch(x){console.log(`❌ ${c.name}:`,x.stack||x.message);send(api,box("💥 COMMAND ERROR",`Something went wrong with ${PREFIX}${c.name}.\n\n🔄 Try again.\n🤖 iKON-BOT is still online.`),tid,e.messageID)}
}

/* GROUP INFO */
function threadInfo(api,id){return new Promise(r=>{try{api.getThreadInfo(id,(e,i)=>r(e?null:i))}catch(e){r(null)}})}
async function detect(api,e){
 if(!e.threadID)return;const id=String(e.threadID);let g=S.groups[id];
 if(!g){const i=await threadInfo(api,id);g=group(id,i?.threadName||"Unknown Group");g.members=i?.participantIDs?.length||0;g.adminIDs=i?.adminIDs||[];g.pending=true;S.pending[id]={threadID:id,name:g.name,createdAt:now()};save();console.log(`🆕 NEW GC: ${g.name} (${id})`);if(ADMINS.size)for(const a of ADMINS)send(api,`🆕 NEW GROUP DETECTED\n\n🏠 ${g.name}\n🆔 ${id}\n👥 ${g.members}\n\n📌 Added to pending list.\n🔐 Admin commands remain available.`,a)}
}

/* MESSENGER EVENTS */
async function eventHandler(api,e){
 try{
  console.log(`📨 EVENT ${e?.type||"?"} | ${e?.threadID||"?"}`);
  if(!e||e.type!=="message"||(botUID&&String(e.senderID)===String(botUID)))return;
  const body=e.body||e.message?.body;if(!body)return;
  const u=user(e.senderID);u.stats.messages++;
  try{api.getUserInfo?.([String(e.senderID)],(x,d)=>{if(!x&&d?.[e.senderID]?.name){u.name=d[e.senderID].name;save()}})}catch(x){}
  console.log(`💬 MESSAGE: ${String(body).slice(0,150)}`);
  const p=parse(body);if(!p)return;
  console.log(`🧩 PARSED: ${PREFIX}${p.name}`);
  await detect(api,e);react(api,e);await execute(api,e,p);
 }catch(x){console.log("❌ EVENT:",x.stack||x.message||x)}
}

/* LOGIN */
let apiGlobal=null,botUID=null;
function start(){
 if(!APPSTATE_RAW){console.log("❌ APPSTATE missing.");return}
 let state;try{state=JSON.parse(APPSTATE_RAW)}catch(e){console.log("❌ APPSTATE JSON error:",e.message);return}
 console.log(`🍪 APPSTATE loaded: ${Array.isArray(state)?state.length:0} cookies`);
 console.log("🔐 Connecting to Messenger...");
 login({appState:state,listenEvents:true,selfListen:false,updatePresence:false,forceLogin:false,autoMarkRead:false,autoMarkDelivery:false,online:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("❌ LOGIN:",err.stack||err.message);return setTimeout(start,15000)}
  apiGlobal=api;try{botUID=String(api.getCurrentUserID?.()||"")}catch(e){}
  console.log("🤖 iKON-BOT Messenger connected.");
  console.log(`🆔 Bot UID: ${botUID||"unknown"}`);
  if(!api.listenMqtt)return console.log("❌ listenMqtt unavailable.");
  api.listenMqtt(async(err,e)=>{if(err)return console.log("❌ MQTT:",err.message||err);await eventHandler(api,e)});
  console.log("👂 Messenger message listener ACTIVE.");
  console.log("💬 Waiting for Messenger messages...");
 });
}

/* SERVER */
app.get("/",(q,r)=>r.json({status:"ACTIVE",bot:BOT_NAME,prefix:PREFIX,commands:registry.size,messenger:!!apiGlobal,storage:"LOCAL",uptime:Math.floor(process.uptime())}));
app.get("/health",(q,r)=>r.json({ok:true,bot:BOT_NAME,commands:registry.size,messenger:!!apiGlobal,storage:"LOCAL",uptime:Math.floor(process.uptime())}));
app.get("/menu",(q,r)=>r.type("text").send(menu()));
setInterval(save,30000);

console.log("━━━━━━━━━━━━━━━━━━━━");
console.log(`🤖 ${BOT_NAME}`);
console.log(`👑 ${OWNER_NAME}`);
console.log(`⚡ Prefix: ${PREFIX}`);
console.log("💾 Storage: LOCAL STATE");
console.log("━━━━━━━━━━━━━━━━━━━━");
load();
app.listen(PORT,"0.0.0.0",()=>console.log(`🌐 ${BOT_NAME} running on ${PORT}`));
start();

process.on("SIGINT",()=>{save();process.exit(0)});
process.on("SIGTERM",()=>{save();process.exit(0)});
process.on("uncaughtException",e=>console.log("💥 UNCAUGHT:",e.stack||e.message));
process.on("unhandledRejection",e=>console.log("💥 REJECTION:",e?.stack||e?.message));
