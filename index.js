require("dotenv").config();

const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios");
const {MongoClient}=require("mongodb");
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;

const BOT="iKON-BOT",OWNER="Aphecks iKon Klerk";
const PREFIX=String(process.env.PREFIX||"!").trim()||"!";
const PORT=Number(process.env.PORT||10000),APPSTATE_RAW=String(process.env.APPSTATE||"").trim();
const MONGO_URI=String(process.env.MONGO_URI||"").trim(),MONGO_DB=String(process.env.MONGO_DB||"ikonbot").trim();
const RENDER_URL=process.env.RENDER_URL||process.env.RENDER_EXTERNAL_URL||"";
const ADMINS=new Set(String(process.env.ADMIN_IDS||process.env.ADMIN_ID||"").split(",").map(x=>x.trim()).filter(Boolean));

const app=express();app.use(express.json());
const DATA=path.join(__dirname,"data"),FILE=path.join(DATA,"state.json");
if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});

const DEFAULT={settings:{botEnabled:true,maintenance:false,reactions:true,replies:true,reactCooldown:2500,pokemonInterval:1200000},users:{},groups:{},pending:{},battles:{},cooldowns:{},pokemon:null,logs:[]};
let S=DEFAULT,mongo=null,db=null,users=null,groups=null;

try{
 if(fs.existsSync(FILE)){const x=JSON.parse(fs.readFileSync(FILE,"utf8"));S={...DEFAULT,...x,settings:{...DEFAULT.settings,...(x.settings||{})}}}
}catch(e){console.log("⚠️ State:",e.message)}

function save(){try{fs.writeFileSync(FILE,JSON.stringify(S,null,2))}catch(e){console.log("⚠️ Save:",e.message)}}

async function mongoConnect(){
 if(!MONGO_URI){console.log("🍃 MongoDB: LOCAL MODE");return}
 try{
  mongo=new MongoClient(MONGO_URI,{serverSelectionTimeoutMS:15000,connectTimeoutMS:15000});
  await mongo.connect();db=mongo.db(MONGO_DB);users=db.collection("users");groups=db.collection("groups");
  await users.createIndex({uid:1},{unique:true});await groups.createIndex({threadID:1},{unique:true});
  console.log("🍃 MongoDB CONNECTED");
 }catch(e){console.log("❌ MongoDB:",e.message);mongo=db=users=groups=null}
}

async function getUser(uid){
 uid=String(uid);
 let u=S.users[uid]||{uid,balance:0,bank:0,savings:0,vault:0,coins:0,xp:0,level:1,prestige:0,inventory:{},pets:[],stats:{},battles:{}};
 if(users)try{const x=await users.findOne({uid});if(x){delete x._id;u={...u,...x}}}catch(e){}
 u.uid=uid;u.inventory=u.inventory||{};u.pets=u.pets||[];u.stats=u.stats||{};u.battles=u.battles||{};
 S.users[uid]=u;return u;
}

async function saveUser(u){
 if(!u||!u.uid)return;S.users[String(u.uid)]=u;if(!users)return;
 try{const x={...u};delete x._id;await users.updateOne({uid:String(u.uid)},{$set:x},{upsert:true})}catch(e){}
}

async function saveGroup(g){
 if(!g||!g.threadID)return;S.groups[String(g.threadID)]=g;if(!groups)return;
 try{const x={...g};delete x._id;await groups.updateOne({threadID:String(g.threadID)},{$set:x},{upsert:true})}catch(e){}
}

async function syncGroup(api,id){
 id=String(id);
 try{
  const info=await new Promise((resolve,reject)=>api.getThreadInfo(id,(err,data)=>err?reject(err):resolve(data)));
  const old=S.groups[id]||{},g={...old,threadID:id,name:info.threadName||old.name||"Unnamed GC",members:Array.isArray(info.participantIDs)?info.participantIDs.length:(old.members||0),status:"ACTIVE",approved:old.approved===true,updatedAt:Date.now()};
  await saveGroup(g);return g;
 }catch(e){return S.groups[id]||{threadID:id,name:"Unknown",members:0,status:"UNKNOWN",approved:false}}
}

const registry=new Map(),aliases=new Map(),dupes=[];
function register(c,file="system"){
 if(!c||!c.name||typeof c.run!=="function")return;
 const name=String(c.name).toLowerCase().trim();
 if(registry.has(name)){dupes.push(name);return}
 registry.set(name,{...c,name,module:file});
 for(const a of(Array.isArray(c.aliases)?c.aliases:[])){const x=String(a).toLowerCase().trim();if(!x||x===name||registry.has(x)||aliases.has(x))continue;aliases.set(x,name)}
}

function getCommand(name){name=String(name||"").toLowerCase().trim();return registry.get(name)||registry.get(aliases.get(name))}

function loadCommands(){
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){console.log("❌ commands/ directory missing");return}
 const files=fs.readdirSync(dir).filter(x=>/^cmds_[1-8]\.js$/i.test(x)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
 for(const file of files){
  try{
   const m=require(path.join(dir,file));
   const list=Array.isArray(m)?m:Array.isArray(m.commands)?m.commands:m.commands&&typeof m.commands==="object"?Object.values(m.commands):Object.values(m||{});
   list.forEach(x=>register(x,file));console.log(`📦 ${file} loaded`);
  }catch(e){console.log(`❌ ${file}: ${e.message}`)}
 }
 console.log(`📚 Commands: ${registry.size} | Duplicates ignored: ${dupes.length}`);
}

const REACTIONS=["👍","❤️","😂","🔥","👏","😍","😎","💯","⚡","🎉","🐉","🐾","💰","🏆","👑","🚀","✨","🤖","😈","💎"];
const FUNNY=["😂 Bro... even the bot is confused.","🤣 That command walked in without an appointment.","😎 Easy there, boss. One command at a time.","💀 The server felt that one.","🐾 Even the pets are watching this.","🤖 Beep boop... human detected.","💰 Your wallet is asking for mercy.","😭 My circuits weren't ready for that.","😈 Interesting choice... very interesting.","🗿 The bot has no words.","🚀 Command received. Brain loading...","🔥 That's actually kinda crazy."];
const SUCCESS=["✅ Done! Clean work.","🔥 Completed successfully!","💯 Mission accomplished.","✨ Finished! iKON-BOT handled it.","🚀 Done and dusted.","👑 As requested, boss.","😎 Easy work."];
const random=a=>a[Math.floor(Math.random()*a.length)],reactCD=new Map(),spam=new Map(),cmdCD=new Map();

function box(title,body,footer=`🤖 ${BOT}`){return[`╭━━━〔 ${title} 〕━━━╮`,"",body,"",`╰━━━〔 ${footer} 〕━━━╯`].join("\n")}

function send(api,e,text){
 if(!S.settings.replies||text===undefined||text===null)return;
 try{api.sendMessage(String(text),e.threadID,()=>{},e.messageID)}catch(x){try{api.sendMessage(String(text),e.threadID,()=>{})}catch(y){}}
}

function react(api,e){
 if(!S.settings.reactions||typeof api.setMessageReaction!=="function")return;
 const k=String(e.threadID),now=Date.now();if(now-(reactCD.get(k)||0)<S.settings.reactCooldown)return;
 reactCD.set(k,now);try{api.setMessageReaction(random(REACTIONS),e.messageID,()=>{},true)}catch(x){}
}

function parse(body){
 let s=String(body||"").trim();if(!s.startsWith(PREFIX))return null;
 s=s.slice(PREFIX.length).trim().replace(/\s+/g," ");if(!s)return null;
 const p=s.split(" "),name=(p.shift()||"").toLowerCase();return{name,args:p,raw:s};
}

function isAdmin(uid){return ADMINS.has(String(uid))}
function allowed(uid,tid){
 const k=`${tid}:${uid}`,now=Date.now(),a=(spam.get(k)||[]).filter(x=>now-x<10000);a.push(now);spam.set(k,a);return a.length<=8;
}

const MENU_TITLES=["🤖 iKON-BOT — MAIN MENU","🐾 PET LABS","💰 FINANCE","💀 CRIME","🎮 ARCADE","🛡️ ADMIN","⭐ PROGRESSION","⚔️ WAR-ZONE","🤖 AI SYSTEMS"];

function menu(n=0){
 n=Number(n)||0;const title=MENU_TITLES[n>=1&&n<=8?n:0];
 const list=n>=1&&n<=8?[...registry.values()].filter(x=>x.module===`cmds_${n}.js`):[...registry.values()].filter(x=>x.module!=="system").slice(0,150);
 const lines=list.map(x=>`✨ ${PREFIX}${x.name}${x.description?` — ${x.description}`:""}`);
 return["━━━━━━━━━━━━━━━━━━━━",`        ${title}`,"━━━━━━━━━━━━━━━━━━━━","",n?"":"👋 Welcome to the iKON community!",n?"":`⚡ ${registry.size} commands ready`,n?"":"💰 Economy • 🐾 Pets • ⚔️ War • 🤖 AI","",...lines,"","━━━━━━━━━━━━━━━━━━━━",`📚 ${PREFIX}menu 1-8`,`📖 ${PREFIX}help <command>`,`🔎 ${PREFIX}search <word>`,`🆔 ${PREFIX}uid`,`👤 ${PREFIX}me`,`📊 ${PREFIX}status`,"",`🤖 ${BOT}`,`👑 ${OWNER}`,"━━━━━━━━━━━━━━━━━━━━"].join("\n");
}

register({name:"menu",aliases:["commands","cmds","helpme"],description:"Open the bot menu",run:c=>menu(c.args[0]||0)});
register({name:"uid",aliases:["myuid"],description:"Show your Facebook UID",run:c=>box("🆔 YOUR UID",`👤 User ID\n\n🔐 ${c.uid}\n\n${random(SUCCESS)}`)});
register({name:"ping",description:"Check bot response",run:()=>box("🏓 PONG",`🟢 ${BOT} is online!\n\n⚡ Fast response\n🔥 Systems active\n\n${random(FUNNY)}`)});
register({name:"status",description:"Show bot status",run:()=>box("📊 BOT STATUS",["🟢 ONLINE",`📚 Commands: ${registry.size}`,`👥 Groups: ${Object.keys(S.groups).length}`,`👤 Users: ${Object.keys(S.users).length}`,`🍃 MongoDB: ${db?"CONNECTED":"LOCAL"}`,`⏱️ Uptime: ${Math.floor(process.uptime())}s`].join("\n")))});

register({name:"help",description:"Show command information",run:c=>{
 const x=getCommand(c.args[0]);if(!x)return menu();
 return box(`📖 ${PREFIX}${x.name}`,[`📝 ${x.description||"No description"}`,`⌨️ ${x.syntax||PREFIX+x.name}`,`🔐 ${x.permission||"Everyone"}`,`⏱️ ${x.cooldown||0}ms`,`📂 ${x.module||"system"}`,"","💡 Tip: use the command exactly as shown."].join("\n"));
}});

register({name:"search",description:"Search commands",run:c=>{
 const q=c.args.join(" ").toLowerCase().trim();
 if(!q)return box("🔎 SEARCH",`Usage:\n${PREFIX}search <word>\n\nExample:\n${PREFIX}search pet`);
 const r=[...registry.values()].filter(x=>`${x.name} ${x.description||""}`.toLowerCase().includes(q)).slice(0,50);
 if(!r.length)return box("🔎 SEARCH",`❌ Nothing found for "${q}".\n\n${random(FUNNY)}`);
 return box("🔎 SEARCH RESULTS",r.map(x=>`✨ ${PREFIX}${x.name} — ${x.description||"Command"}`).join("\n"));
}});

register({name:"me",description:"Show your profile",run:c=>{
 const u=c.user;
 return box("👤 YOUR PROFILE",[ `🆔 ${c.uid}`,"",`💰 Cash: $${Number(u.balance||0).toLocaleString()}`,`🏦 Bank: $${Number(u.bank||0).toLocaleString()}`,`💎 Vault: $${Number(u.vault||0).toLocaleString()}`,"",`⭐ Level: ${u.level||1}`,`✨ XP: ${u.xp||0}`,`🐾 Pets: ${(u.pets||[]).length}`,"",random(SUCCESS)].join("\n"));
}});

async function execute(api,e){
 const p=parse(e.body);if(!p)return;
 const uid=String(e.senderID||""),tid=String(e.threadID||"");if(!uid||!tid)return;
 react(api,e);
 const c=getCommand(p.name);
 if(!c)return send(api,e,box("❓ UNKNOWN COMMAND",[ `❌ I don't know ${PREFIX}${p.name}.`,"",`📚 Try ${PREFIX}menu`,`🔎 Try ${PREFIX}search ${p.name}`,"",random(FUNNY)].join("\n")));
 const adminUser=isAdmin(uid),group=await syncGroup(api,tid),user=await getUser(uid);
 const ctx={api,event:e,uid,threadID:tid,user,group,args:p.args,raw:p.raw,PREFIX,prefix:PREFIX,state:S,isAdmin:adminUser,send:x=>send(api,e,x),reply:x=>send(api,e,x),react:()=>react(api,e),gemini:askGemini,axios,save};
 if(!S.settings.botEnabled&&!adminUser)return send(api,e,box("🔴 BOT OFFLINE","The bot is currently disabled.\n\n🛠️ Please try again later."));
 if(S.settings.maintenance&&!adminUser)return send(api,e,box("🛠️ MAINTENANCE","Systems are being upgraded.\n\n🔧 Please try again soon."));
 if(!allowed(uid,tid)&&!adminUser)return send(api,e,box("🐌 SLOW DOWN",`🚫 Too many commands.\n\n${random(FUNNY)}`));
 if(c.permission==="admin"&&!adminUser)return send(api,e,box("🔐 ACCESS DENIED","⛔ This command is for administrators only."));
 if(typeof c.requirements==="function")try{if(await c.requirements(ctx)===false)return}catch(err){console.log("Requirement:",err.message);return send(api,e,box("⚠️ REQUIREMENTS","❌ You don't meet the requirements for this command."))}
 const key=`${tid}:${uid}:${c.name}`,now=Date.now(),last=cmdCD.get(key)||0,cd=Number(c.cooldown||0);
 if(cd&&!adminUser&&now-last<cd)return send(api,e,box("⏳ COOLDOWN",`⌛ Wait ${Math.ceil((cd-(now-last))/1000)}s.\n\n${random(FUNNY)}`));
 cmdCD.set(key,now);
 try{
  const result=await c.run(ctx);if(result!==undefined&&result!==null&&result!=="")send(api,e,result);
  await saveUser(user);await saveGroup(group);
  S.logs.push({uid,threadID:tid,command:c.name,time:now});if(S.logs.length>1000)S.logs=S.logs.slice(-1000);save();
 }catch(err){
  console.log(`❌ COMMAND ERROR [${c.name}]`,err.stack||err.message);
  send(api,e,box("💥 COMMAND ERROR",["❌ Something went wrong.","","🛠️ The error was logged.","🔄 Try again in a moment.","",random(FUNNY)].join("\n")));
 }
}

async function askGemini(prompt){
 const key=String(process.env.GEMINI_API_KEY||"").trim();if(!key)return"❌ Gemini API key missing.";
 try{
  const model=process.env.GEMINI_MODEL||"gemini-2.0-flash",url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const r=await axios.post(url,{contents:[{parts:[{text:String(prompt)}]}]},{timeout:30000});
  return r.data?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"❌ No AI response.";
 }catch(e){console.log("Gemini:",e.message);return"❌ AI service error."}
}

async function pokemon(){
 const api=global.API_INSTANCE;if(!api)return;
 const gs=Object.values(S.groups).filter(g=>g.status==="ACTIVE");if(!gs.length)return;
 const name=random(["Pikachu","Charmander","Squirtle","Bulbasaur","Eevee","Mew","Mewtwo","Lucario","Gengar","Dragonite","Rayquaza","Greninja"]),id=`PK${Date.now()}`;
 S.pokemon={name,id,spawnedAt:Date.now(),claimed:false};save();
 for(const g of gs)try{api.sendMessage(["⚡✨ WILD POKÉMON SPAWNED! ✨⚡","",`🐾 ${name}`,`🆔 ${id}`,"",`🎯 ${PREFIX}catch ${id}`,"","🏃 First trainer gets it!"].join("\n"),g.threadID,()=>{})}catch(e){}
}

app.get("/",(req,res)=>res.json({bot:BOT,owner:OWNER,status:"ACTIVE",commands:registry.size,uptime:process.uptime()}));
app.get("/health",(req,res)=>res.json({ok:true,bot:BOT,commands:registry.size,mongodb:Boolean(db),messenger:Boolean(global.API_INSTANCE),uptime:process.uptime()}));
app.listen(PORT,()=>console.log(`🌐 ${BOT} running on ${PORT}`));

function getAppState(){
 if(!APPSTATE_RAW){console.log("❌ APPSTATE IS EMPTY");console.log("👉 Render → Environment → APPSTATE");return null}
 let data=APPSTATE_RAW;
 try{data=JSON.parse(data)}catch(e){try{data=JSON.parse(decodeURIComponent(data))}catch(e2){console.log("❌ APPSTATE IS NOT VALID JSON");console.log("👉 APPSTATE must be Messenger cookie JSON");return null}}
 if(!Array.isArray(data)||!data.length){console.log("❌ APPSTATE MUST BE A NON-EMPTY ARRAY");return null}
 if(!data.some(x=>x&&typeof x==="object"&&(x.name||x.key)&&x.value!==undefined)){console.log("❌ APPSTATE HAS NO VALID COOKIES");return null}
 console.log(`🍪 APPSTATE loaded: ${data.length} cookies`);return data;
}

let reconnectTimer=null;
function reconnect(){if(reconnectTimer)return;reconnectTimer=setTimeout(()=>{reconnectTimer=null;console.log("🔄 Reconnecting Messenger...");connectMessenger()},30000)}

function connectMessenger(){
 const appState=getAppState();if(!appState){console.log("🛑 Messenger login stopped.");return}
 if(typeof login!=="function"){console.log("❌ ws3-fca login unavailable.");return}
 console.log("🔐 Connecting to Messenger...");
 try{
  login({appState},(err,api)=>{
   if(err){console.log("❌ Messenger login:",err.error||err.message||err);console.log("⚠️ Check Render APPSTATE.");reconnect();return}
   global.API_INSTANCE=api;
   api.setOptions({listenEvents:true,updatePresence:true,selfListen:false,autoMarkRead:false,autoMarkDelivery:false,forceLogin:true});
   console.log(`🤖 ${BOT} Messenger connected.`);
   api.listenMqtt(async(err,e)=>{
    if(err){console.log("⚠️ Messenger listener:",err.error||err.message||err);reconnect();return}
    try{
     if(e.logMessageType==="log:subscribe"&&e.threadID){
      const id=String(e.threadID),g=await syncGroup(api,id);
      if(!g.approved){
       S.pending[id]={...g,approved:false,pendingAt:S.pending[id]?.pendingAt||Date.now()};save();
       for(const adminID of ADMINS)try{api.sendMessage(["━━━━━━━━━━━━━━━━━━━━","⏳ NEW GROUP DETECTED","━━━━━━━━━━━━━━━━━━━━","",`👥 ${g.name}`,`🆔 ${id}`,`👤 Members: ${g.members}`,"",`✅ ${PREFIX}approve_gc ${id}`,`❌ ${PREFIX}reject_gc ${id}`,"━━━━━━━━━━━━━━━━━━━━"].join("\n"),adminID,()=>{})}catch(x){}
      }
     }
     if(e.type==="message"&&e.body)await execute(api,e);
    }catch(x){console.log("❌ EVENT:",x.stack||x.message)}
   });
  });
 }catch(e){console.log("❌ Messenger:",e.message);reconnect()}
}

setInterval(save,60000);
setInterval(pokemon,Number(S.settings.pokemonInterval||1200000));
setTimeout(pokemon,30000);
setInterval(()=>{const url=RENDER_URL||`http://127.0.0.1:${PORT}/health`;axios.get(url,{timeout:10000}).catch(()=>{})},300000);

process.on("unhandledRejection",e=>console.log("❌ UNHANDLED:",e));
process.on("uncaughtException",e=>console.log("❌ EXCEPTION:",e.stack||e.message));

async function shutdown(){
 console.log("🛑 Shutting down...");save();
 try{if(mongo)await mongo.close()}catch(e){}
 process.exit(0);
}
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);

async function start(){
 console.log("━━━━━━━━━━━━━━━━━━━━");
 console.log(`🤖 ${BOT}`);
 console.log(`👑 ${OWNER}`);
 console.log(`⚡ Prefix: ${PREFIX}`);
 console.log("━━━━━━━━━━━━━━━━━━━━");
 loadCommands();
 await mongoConnect();
 connectMessenger();
}
start();
