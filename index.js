require("dotenv").config();
const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios");
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:(FCA.login||FCA);
const BOT="iKON-BOT",OWNER="Aphecks iKon Klerk",PREFIX=String(process.env.PREFIX||"!"),PORT=+process.env.PORT||10000,APP=process.env.APPSTATE||"",GKEY=process.env.GEMINI_API_KEY||"";
const ADMINS=new Set(String(process.env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean)),app=express();app.use(express.json({limit:"2mb"}));

/* STORAGE */
const DIR=path.join(__dirname,"data"),FILE=path.join(DIR,"state.json");
if(!fs.existsSync(DIR))fs.mkdirSync(DIR,{recursive:true});
const DEF={settings:{botEnabled:true,maintenance:false,replies:true,reactions:true,autoReact:"👍",prefix:PREFIX},users:{},groups:{},pending:{},battles:{},cooldowns:{},spam:{},logs:[],events:{},commandStats:{}};
let S=DEF;
try{if(fs.existsSync(FILE)){const r=JSON.parse(fs.readFileSync(FILE,"utf8"));S={...DEF,...r,settings:{...DEF.settings,...(r.settings||{})}}}}catch(e){console.log("⚠️ STATE:",e.message)}
const now=()=>Date.now(),save=()=>{try{fs.writeFileSync(FILE,JSON.stringify(S,null,2))}catch(e){}},fmt=n=>Number(n||0).toLocaleString("en-US");

/* USERS / GROUPS */
function user(id,name){
 id=String(id);if(!S.users[id])S.users[id]={uid:id,name:name||"Player",balance:0,bank:0,savings:0,vault:0,credit:500,xp:0,level:1,prestige:0,inventory:[],items:{},pets:[],skills:[],achievements:[],titles:[],stats:{commands:0,wins:0,losses:0,battles:0,messages:0}};
 const u=S.users[id];u.name=name||u.name||"Player";u.balance=+u.balance||0;u.bank=+u.bank||0;u.savings=+u.savings||0;u.vault=+u.vault||0;u.credit=+u.credit||500;u.xp=+u.xp||0;u.level=Math.max(1,+u.level||1);u.pets=Array.isArray(u.pets)?u.pets:[];u.items=u.items||{};u.inventory=Array.isArray(u.inventory)?u.inventory:[];u.stats=u.stats||{};u.stats.commands=+u.stats.commands||0;u.stats.messages=+u.stats.messages||0;return u;
}
function group(id,name){
 id=String(id);if(!S.groups[id])S.groups[id]={threadID:id,name:name||"Unknown Group",enabled:true,pending:true,approved:false,members:0};
 const g=S.groups[id];g.name=name||g.name||"Unknown Group";return g;
}

/* COMMAND REGISTRY */
const commands=new Map(),aliases=new Map();let duplicates=0;
function register(c,src){
 if(!c?.name||typeof c.run!=="function")return;
 const n=c.name.trim().toLowerCase();if(commands.has(n)){duplicates++;console.log(`⚠️ DUPLICATE: ${n}`);return}
 c.name=n;c.aliases=(c.aliases||[]).map(x=>String(x).toLowerCase());c.category=c.category||"Other";c.purpose=c.purpose||c.description||"Community command";c.cooldown=+c.cooldown||0;c.permission=c.permission||"user";
 commands.set(n,c);for(const a of c.aliases)if(a&&a!==n&&!commands.has(a)&&!aliases.has(a))aliases.set(a,n);
}
const find=n=>commands.get(String(n||"").toLowerCase())||commands.get(aliases.get(String(n||"").toLowerCase())||"");

function loadCommands(){
 const d=path.join(__dirname,"commands");if(!fs.existsSync(d))return console.log("❌ commands/ missing");
 fs.readdirSync(d).filter(f=>/^cmds_\d+\.js$/i.test(f)).sort((a,b)=>+a.match(/\d+/)-+b.match(/\d+/)).forEach(f=>{
  try{const p=path.join(d,f);delete require.cache[require.resolve(p)];const x=require(p),a=Array.isArray(x)?x:Object.values(x||{});a.forEach(c=>register(c,f));console.log(`📦 ${f} loaded`)}catch(e){console.log(`❌ ${f}: ${e.message}`)}
 });
 console.log(`📚 Commands: ${commands.size} | Duplicates ignored: ${duplicates}`);
}

/* UI */
function box(t,b){return`━━━━━━━━━━━━━━━━━━━━\n${t}\n━━━━━━━━━━━━━━━━━━━━\n${b}\n━━━━━━━━━━━━━━━━━━━━\n🤖 ${BOT}\n👑 ${OWNER}\n⚡ Prefix: ${PREFIX}\n━━━━━━━━━━━━━━━━━━━━`}
function menu(){
 const f=[...commands.values()].filter(x=>x.featured).slice(0,150),a=[
 "🌟━━━━━━━━━━━━━━━━━━━━🌟","        🤖 iKON-BOT","      COMMUNITY HUB","🌟━━━━━━━━━━━━━━━━━━━━🌟","","🔥 Yo bro, welcome to the world!","💰 Build your empire","🐾 Raise legendary pets","⚔️ Battle players & bosses","🎰 Test your luck","🔥 Run missions & crimes","🧠 Ask the AI anything","","📚━━━ COMMAND CATEGORIES ━━━📚","",
 "🐾 PET LABS","   ✦ Pets • Breeding • Care • Battles","",
 "💰 FINANCE","   ✦ Money • Bank • Business • Stocks • Crypto","",
 "🔥 CRIME","   ✦ GTA • Heists • Robbery • Gangs • Wanted","",
 "🎮 ARCADE","   ✦ Casino • Games • Events • Social","",
 "🛡️ ADMIN","   ✦ Moderation • Settings • Logs • Controls","",
 "⭐ PROGRESSION","   ✦ Levels • Jobs • Missions • Guilds","",
 "⚔️ WAR-ZONE","   ✦ Bosses • PvP • Dungeon • Raid","",
 "🧠 AI SYSTEMS","   ✦ AI • Tools • Translation • Creative","",
 "━━━━━━━━━━━━━━━━━━━━","⭐ FEATURED COMMANDS","━━━━━━━━━━━━━━━━━━━━",""
 ];
 f.forEach(x=>a.push(`✨ ${PREFIX}${x.name}`));
 a.push("","━━━━━━━━━━━━━━━━━━━━","💡 QUICK HELP","━━━━━━━━━━━━━━━━━━━━",`📖 ${PREFIX}help <command>`,`🔎 ${PREFIX}search <word>`,`📂 ${PREFIX}category <name>`,`🆔 ${PREFIX}uid`,`👤 ${PREFIX}me`,`💰 ${PREFIX}bal`,`📊 ${PREFIX}status`,"","😂 Hint: Try something... I might surprise you.","🚀 Let's build your empire!","🔥 Stay active. Stay dangerous.","","━━━━━━━━━━━━━━━━━━━━",`🤖 ${BOT}`,`👑 ${OWNER}`,"⚡ Prefix: "+PREFIX,"━━━━━━━━━━━━━━━━━━━━");
 return a.join("\n");
}

/* PARSER */
function parse(body){
 const t=String(body||"").replace(/\u200B/g,"").trim();if(!t)return null;
 const e=PREFIX.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),m=t.match(new RegExp("^"+e+"\\s*(\\S+)?(?:\\s+([\\s\\S]*))?$","i"));if(!m)return null;
 const q=String(m[2]||"").trim();return{name:String(m[1]||"menu").toLowerCase(),args:q?q.split(/\s+/):[],argText:q,raw:t};
}

/* PERMISSIONS */
const isAdmin=id=>ADMINS.has(String(id));
function groupAdmin(api,tid,uid){return new Promise(r=>{try{api.getThreadInfo(tid,(e,i)=>{if(e||!i)return r(false);r((i.adminIDs||[]).some(x=>String(typeof x==="string"?x:x.id||x.userID)===String(uid)))})}catch(e){r(false)}})}
async function allowed(api,c,x){if(isAdmin(x.uid)||c.permission==="user")return true;if(["admin","owner","staff"].includes(String(c.permission).toLowerCase()))return groupAdmin(api,x.threadID,x.uid);return true}

/* MESSENGER */
function send(api,text,tid,mid){return new Promise(r=>{try{api.sendMessage(String(text||""),tid,e=>{if(e)console.log("❌ SEND:",e.message||e);r(!e)},mid)}catch(e){console.log("❌ SEND:",e.message);r(false)}})}
function react(api,e){try{if(S.settings.reactions&&api.setMessageReaction)api.setMessageReaction(S.settings.autoReact||"👍",e.messageID,()=>{},true)}catch(x){}}

/* GEMINI */
async function askAI(prompt){
 if(!GKEY)return"🧠 AI is offline. Add GEMINI_API_KEY to Render.";
 try{const u="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+encodeURIComponent(GKEY),r=await axios.post(u,{contents:[{parts:[{text:`You are iKON-BOT. Be friendly, useful and concise.\n${prompt}`}]}]},{timeout:30000});return r.data?.candidates?.[0]?.content?.parts?.[0]?.text||"🧠 No response generated."}catch(e){console.log("❌ GEMINI:",e.message);return"🧠 AI temporarily unavailable."}
}

/* CORE COMMANDS */
[
 {name:"menu",aliases:["commands","cmds"],category:"System",featured:true,purpose:"Open main menu",run:async()=>({text:menu()})},
 {name:"help",aliases:["h"],category:"System",featured:true,purpose:"Show command information",run:async c=>{const x=find(c.args[0]);return{text:x?box(`📖 ${PREFIX}${x.name}`,`💡 ${x.purpose}\n📂 ${x.category}\n⚡ Cooldown: ${x.cooldown||0}s\n🔐 Permission: ${x.permission}\n📝 Usage: ${PREFIX}${x.name}${x.usage?" "+x.usage:""}`):box("❓ COMMAND NOT FOUND",`Try ${PREFIX}search ${c.args[0]||"pet"}`)}}},
 {name:"search",aliases:["findcmd"],category:"System",featured:true,purpose:"Search commands",run:async c=>{const q=c.args.join(" ").toLowerCase(),f=[...commands.values()].filter(x=>x.name.includes(q)||x.purpose.toLowerCase().includes(q)).slice(0,50);return{text:box("🔎 SEARCH",f.length?f.map(x=>`✨ ${PREFIX}${x.name} — ${x.purpose}`).join("\n"):`❌ Nothing found for "${q}".`)}}},
 {name:"category",aliases:["cat"],category:"System",featured:true,purpose:"Show category commands",run:async c=>{const q=c.args.join(" ").toLowerCase(),f=[...commands.values()].filter(x=>String(x.category).toLowerCase()===q);return{text:f.length?box(`📂 ${q.toUpperCase()}`,f.map(x=>`✨ ${PREFIX}${x.name} — ${x.purpose}`).join("\n")):box("📂 CATEGORIES","🐾 PET LABS\n💰 FINANCE\n🔥 CRIME\n🎮 ARCADE\n🛡️ ADMIN\n⭐ PROGRESSION\n⚔️ WAR-ZONE\n🧠 AI SYSTEMS")}}},
 {name:"uid",aliases:["myuid","id"],category:"System",featured:true,purpose:"Show Messenger UID",run:async c=>({text:box("🆔 YOUR UID",`👤 ${c.user.name}\n🪪 ${c.uid}`)})},
 {name:"me",aliases:["profile"],category:"System",featured:true,purpose:"Show profile",run:async c=>({text:box("👤 PLAYER PROFILE",`👤 ${c.user.name}\n🪪 ${c.uid}\n⭐ Level: ${c.user.level}\n✨ XP: ${c.user.xp}\n💰 Wallet: $${fmt(c.user.balance)}\n🏦 Bank: $${fmt(c.user.bank)}\n🐾 Pets: ${c.user.pets.length}\n👑 Prestige: ${c.user.prestige||0}\n🏆 Rank: ${c.user.rank||"Rookie"}`)})},
 {name:"bal",aliases:["balance","b","money","wallet"],category:"Finance",featured:true,purpose:"Show balances",run:async c=>({text:box("💰 FINANCIAL STATUS",`💵 Wallet: $${fmt(c.user.balance)}\n🏦 Bank: $${fmt(c.user.bank)}\n💎 Savings: $${fmt(c.user.savings)}\n🔐 Vault: $${fmt(c.user.vault)}\n💳 Credit: ${c.user.credit}\n\n🔥 Keep building your empire!`)})},
 {name:"ping",aliases:["pong"],category:"System",featured:true,purpose:"Check bot response",run:async()=>({text:box("🏓 PONG!","🟢 iKON-BOT is alive!\n📡 Messenger listener active.\n🚀 Ready for commands!")})},
 {name:"status",aliases:["health"],category:"System",featured:true,purpose:"Show bot status",run:async()=>({text:box("📊 BOT STATUS",`🟢 ONLINE\n📚 Commands: ${commands.size}\n👥 Groups: ${Object.keys(S.groups).length}\n👤 Users: ${Object.keys(S.users).length}\n💾 Storage: LOCAL\n🤖 Messenger: ${apiGlobal?"CONNECTED":"WAITING"}\n⏱️ Uptime: ${Math.floor(process.uptime())}s`)})},
 {name:"keepalive",aliases:["alive"],category:"System",purpose:"Check uptime",run:async()=>({text:`💚 ${BOT} is awake!\n🔥 Still running.\n⏱️ ${Math.floor(process.uptime())} seconds.`})}
].forEach(c=>register(c,"index.js"));

/* EXECUTION */
async function execute(api,e,p){
 const uid=String(e.senderID||"");if(!uid)return;
 const u=user(uid),tid=String(e.threadID||""),g=group(tid,e.threadName||"Unknown Group"),c=find(p.name),a=isAdmin(uid);
 if(!c)return send(api,box("❓ UNKNOWN COMMAND",`I don't know ${PREFIX}${p.name}.\n\n🔎 ${PREFIX}search ${p.name}\n📖 ${PREFIX}help\n📋 ${PREFIX}menu`),tid,e.messageID);
 if(!a&&!S.settings.botEnabled)return send(api,box("🔴 BOT OFFLINE","The bot is currently disabled."),tid,e.messageID);
 if(!a&&S.settings.maintenance)return send(api,box("🛠️ MAINTENANCE","Please try again shortly."),tid,e.messageID);
 if(!a&&g.enabled===false)return send(api,box("🔒 BOT DISABLED HERE","An administrator disabled the bot here."),tid,e.messageID);
 if(!await allowed(api,c,{uid,threadID:tid,user:u,group:g}))return send(api,box("🔐 ACCESS DENIED","You don't have permission to use this command."),tid,e.messageID);
 const key=`${uid}:${c.name}`,left=(S.cooldowns[key]||0)+(c.cooldown||0)*1000-now();
 if(!a&&left>0)return send(api,`⏳ Hold up bro 😎\n\n⚡ ${PREFIX}${c.name} is cooling down.\n🕐 Try again in ${Math.ceil(left/1000)}s.`,tid,e.messageID);
 try{
  u.stats.commands++;
  const r=await c.run({api,event:e,uid,threadID:tid,user:u,group:g,args:p.args,argText:p.argText,raw:p.raw,prefix:PREFIX,command:c,state:S,battles:S.battles,users:S.users,groups:S.groups,registry:commands,aliases,admin:a,botUID,gemini:askAI,askGemini:askAI,send:t=>send(api,t,tid,e.messageID)});
  if(r?.money)u.balance+=+r.money;
  if(r?.xp){u.xp+=+r.xp;while(u.xp>=u.level*1000){u.xp-=u.level*1000;u.level++}}
  if(r?.text)await send(api,r.text,tid,e.messageID);
  if(!a&&c.cooldown)S.cooldowns[key]=now();
  S.commandStats[c.name]=(S.commandStats[c.name]||0)+1;save();
 }catch(x){console.log(`❌ COMMAND ${c.name}:`,x.stack||x.message||x);send(api,box("💥 COMMAND ERROR",`⚙️ ${PREFIX}${c.name}\n🔄 Try again.\n🤖 ${BOT} is still online.`),tid,e.messageID)}
}

/* GROUP DETECTION */
function thread(api,id){return new Promise(r=>{try{api.getThreadInfo(id,(e,i)=>r(e?null:i))}catch(x){r(null)}})}
async function detect(api,e){
 if(!e.threadID)return;const id=String(e.threadID);if(S.groups[id])return;
 const i=await thread(api,id),g=group(id,i?.threadName||i?.name||"Unknown Group");
 g.members=i?.participantIDs?.length||0;g.adminIDs=i?.adminIDs||[];g.pending=true;S.pending[id]={threadID:id,name:g.name,members:g.members,createdAt:now()};save();
 console.log(`🆕 NEW GC: ${g.name} (${id})`);
 for(const a of ADMINS)send(api,`🆕 NEW GROUP DETECTED\n\n🏠 ${g.name}\n🆔 ${id}\n👥 ${g.members}\n\n📌 Added to pending GC list.\n🔐 Admin commands remain available.`,a);
}

/* EVENT HANDLER */
async function handle(api,e){
 try{
  if(!e)return;
  console.log(`📨 EVENT: ${e.type||"?"} | THREAD:${e.threadID||"?"} | FROM:${e.senderID||"?"}`);
  if(e.type!=="message")return;
  if(botUID&&String(e.senderID)===String(botUID))return;
  const body=e.body||e.message?.body||"";if(!body)return;
  const u=user(e.senderID);u.stats.messages++;
  try{api.getUserInfo?.([String(e.senderID)],(x,d)=>{if(!x&&d?.[e.senderID]?.name){u.name=d[e.senderID].name;save()}})}catch(x){}
  console.log(`💬 BODY: ${String(body).slice(0,200)}`);
  const p=parse(body);if(!p)return;
  console.log(`🧩 PARSED: ${PREFIX}${p.name} ${p.args.join(" ")}`);
  await detect(api,e);react(api,e);await execute(api,e,p);
 }catch(x){console.log("❌ EVENT HANDLER:",x.stack||x.message||x)}
}

/* LOGIN + MQTT */
let apiGlobal=null,botUID=null;
function startMessenger(){
 if(!APP){console.log("❌ APPSTATE missing.");return}
 let state;try{state=JSON.parse(APP)}catch(e){console.log("❌ APPSTATE JSON:",e.message);return}
 console.log(`🍪 APPSTATE loaded: ${Array.isArray(state)?state.length:0} cookies`);
 console.log("🔐 Connecting to Messenger...");
 login({appState:state,online:true,selfListen:false,updatePresence:false,forceLogin:false,autoMarkRead:false,autoMarkDelivery:false,logLevel:"silent"},(err,api)=>{
  if(err){console.log("❌ LOGIN:",err.stack||err.message||err);return setTimeout(startMessenger,15000)}
  apiGlobal=api;try{botUID=String(api.getCurrentUserID?.()||"")}catch(e){}
  console.log("🤖 iKON-BOT Messenger connected.");
  console.log(`🆔 Bot UID: ${botUID||"unknown"}`);
  try{api.setOptions({listenEvents:true,selfListen:false,updatePresence:false,online:true})}catch(e){console.log("⚠️ OPTIONS:",e.message)}
  if(typeof api.listenMqtt!=="function")return console.log("❌ listenMqtt unavailable.");
  api.listenMqtt(async(err,e)=>{
   if(err){console.log("❌ MQTT ERROR:",err.stack||err.message||err);return}
   console.log(`📨 MQTT EVENT: ${e?.type||"UNKNOWN"}`);
   if(e)await handle(api,e);
  });
  console.log("👂 MQTT LISTENER ACTIVE.");
  console.log("💬 Waiting for Messenger messages...");
 });
}

/* SERVER */
app.get("/",(q,r)=>r.json({status:"ACTIVE",bot:BOT,prefix:PREFIX,commands:commands.size,messenger:!!apiGlobal,storage:"LOCAL",uptime:Math.floor(process.uptime())}));
app.get("/health",(q,r)=>r.json({ok:true,bot:BOT,messenger:!!apiGlobal,commands:commands.size,storage:"LOCAL",uptime:Math.floor(process.uptime())}));
app.get("/menu",(q,r)=>r.type("text").send(menu()));
setInterval(save,30000);

console.log("━━━━━━━━━━━━━━━━━━━━");
console.log(`🤖 ${BOT}`);
console.log(`👑 ${OWNER}`);
console.log(`⚡ Prefix: ${PREFIX}`);
console.log("💾 Storage: LOCAL STATE");
console.log("━━━━━━━━━━━━━━━━━━━━");
loadCommands();
app.listen(PORT,"0.0.0.0",()=>console.log(`🌐 ${BOT} running on ${PORT}`));
startMessenger();
process.on("SIGINT",()=>{save();process.exit(0)});
process.on("SIGTERM",()=>{save();process.exit(0)});
process.on("uncaughtException",e=>console.log("💥 UNCAUGHT:",e.stack||e.message));
process.on("unhandledRejection",e=>console.log("💥 REJECTION:",e?.stack||e?.message));
