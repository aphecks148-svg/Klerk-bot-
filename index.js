require("dotenv").config();
const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios");
const {MongoClient}=require("mongodb"),FCA=require("ws3-fca");
const login=typeof FCA==="function"?FCA:FCA.login;

const BOT="iKON-BOT",OWNER="Aphecks iKon Klerk",PREFIX=process.env.PREFIX||"!";
const PORT=+(process.env.PORT||10000),APPSTATE=process.env.APPSTATE||"";
const MONGO_URI=process.env.MONGO_URI||"",MONGO_DB=process.env.MONGO_DB||"ikonbot";
const RENDER_URL=process.env.RENDER_URL||process.env.RENDER_EXTERNAL_URL||"";
const ADMINS=new Set(String(process.env.ADMIN_IDS||process.env.ADMIN_ID||"").split(",").map(x=>x.trim()).filter(Boolean));

const app=express();app.use(express.json());
const DATA=path.join(__dirname,"data"),FILE=path.join(DATA,"state.json");
if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
let S={settings:{botEnabled:true,maintenance:false,reactions:true,replies:true,reactCooldown:2500,pokemonInterval:1200000},users:{},groups:{},pending:{},pokemon:null,logs:[]};
try{if(fs.existsSync(FILE))S={...S,...JSON.parse(fs.readFileSync(FILE,"utf8"))}}catch(e){console.log("State:",e.message)}
const save=()=>{try{fs.writeFileSync(FILE,JSON.stringify(S,null,2))}catch(e){}};

let mongo,db,users,groups;
async function mongoConnect(){if(!MONGO_URI)return console.log("🍃 MongoDB: LOCAL MODE");try{mongo=new MongoClient(MONGO_URI);await mongo.connect();db=mongo.db(MONGO_DB);users=db.collection("users");groups=db.collection("groups");await users.createIndex({uid:1},{unique:true});await groups.createIndex({threadID:1},{unique:true});console.log("🍃 MongoDB CONNECTED")}catch(e){console.log("MongoDB:",e.message)}}

async function getUser(uid){uid=String(uid);let u=S.users[uid]||{uid,balance:0,bank:0,savings:0,vault:0,coins:0,xp:0,level:1,prestige:0,inventory:{},pets:[],stats:{}};if(users)try{let x=await users.findOne({uid});if(x){delete x._id;u={...u,...x}}}catch(e){}S.users[uid]=u;return u}
async function saveUser(u){S.users[u.uid]=u;if(!users)return;try{let x={...u};delete x._id;await users.updateOne({uid:u.uid},{$set:x},{upsert:true})}catch(e){}}
async function saveGroup(g){S.groups[g.threadID]=g;if(groups)try{let x={...g};delete x._id;await groups.updateOne({threadID:g.threadID},{$set:x},{upsert:true})}catch(e){}}
async function syncGroup(api,id){try{let x=await api.getThreadInfo(id),g={...(S.groups[id]||{}),threadID:id,name:x.threadName||"Unnamed",members:x.participantIDs?.length||0,status:"ACTIVE",approved:S.groups[id]?.approved??false};await saveGroup(g);return g}catch(e){return S.groups[id]||{threadID:id,name:"Unknown",approved:false}}}

const registry=new Map(),dupes=[];
function register(c,file){if(!c||!c.name||typeof c.run!=="function")return;for(const n of [c.name,...(c.aliases||[])]){let k=String(n).toLowerCase().trim();if(registry.has(k)){dupes.push(k);continue}registry.set(k,{...c,name:k,module:file})}}
function loadCommands(){const d=path.join(__dirname,"commands");if(!fs.existsSync(d))return;fs.readdirSync(d).filter(x=>/^cmds_[1-8]\.js$/i.test(x)).sort().forEach(f=>{try{let m=require(path.join(d,f));let a=Array.isArray(m)?m:m.commands||Object.values(m);a.filter(x=>x&&x.name).forEach(x=>register(x,f));console.log("📦",f)}catch(e){console.log("❌",f,e.message)}});console.log("📚 Commands:",registry.size,"Duplicates ignored:",dupes.length)}
loadCommands();

const reactions=["👍","❤️","😂","🔥","👏","😍","😎","💯","⚡","🎉","🐉","🐾","💰","🏆","👑","🚀","✨","🤖","😈","💎"];
const reactCD=new Map(),spam=new Map(),cmdCD=new Map();
function react(api,e){if(!S.settings.reactions||!api.setMessageReaction)return;let k=e.threadID,n=Date.now();if(n-(reactCD.get(k)||0)<S.settings.reactCooldown)return;reactCD.set(k,n);try{api.setMessageReaction(reactions[Math.floor(Math.random()*reactions.length)],e.messageID,()=>{},true)}catch(x){}}
function send(api,e,t){if(!S.settings.replies)return;try{api.sendMessage(String(t),e.threadID,()=>{},e.messageID)}catch(x){try{api.sendMessage(String(t),e.threadID)}catch(y){}}}
function parse(s){s=String(s||"").trim();if(!s.startsWith(PREFIX))return null;s=s.slice(PREFIX.length).trim().replace(/\s+/g," ");let p=s.split(" ");return{name:(p.shift()||"menu").toLowerCase(),args:p,raw:s}}
function admin(id){return ADMINS.has(String(id))}
function allowed(id,t){let k=t+":"+id,n=Date.now(),a=(spam.get(k)||[]).filter(x=>n-x<10000);a.push(n);spam.set(k,a);return a.length<=8}

function menu(n){let a=n?[...registry.values()].filter(c=>c.module===`cmds_${n}.js`):[...registry.values()].slice(0,150);let title=n?["","🐾 PET LABS","💰 FINANCE","💀 CRIME","🎮 ARCADE","🛡️ ADMIN","⭐ PROGRESSION","⚔️ WAR-ZONE","🤖 AI SYSTEMS"][n]:"🤖 iKON-BOT — MAIN MENU";return `━━━━━━━━━━━━━━━━━━━━\n${title}\n━━━━━━━━━━━━━━━━━━━━\n`+a.map(c=>`${PREFIX}${c.name}${c.description?" — "+c.description:""}`).join("\n")+`\n\n━━━━━━━━━━━━━━━━━━━━\n${PREFIX}menu 1-8\n${PREFIX}help <command>\n${PREFIX}search <word>\n${PREFIX}uid\n${PREFIX}me\n${PREFIX}status\n🤖 ${BOT}\n👑 ${OWNER}`}

register({name:"menu",aliases:["helpme"],run:c=>menu(+c.args[0]||0)},"system");
register({name:"uid",aliases:["myuid"],run:c=>`🆔 ${c.uid}`},"system");
register({name:"ping",run:()=>`🏓 Pong! ${BOT} is online.`},"system");
register({name:"status",run:()=>`🤖 ${BOT}\n🟢 ONLINE\n📚 Commands: ${registry.size}\n👥 Groups: ${Object.keys(S.groups).length}\n🍃 MongoDB: ${db?"CONNECTED":"LOCAL"}`},"system");
register({name:"help",run:c=>{let x=registry.get(c.args[0]?.toLowerCase());return x?`📖 ${PREFIX}${x.name}\n📝 ${x.description||"No description"}\n⌨️ ${x.syntax||PREFIX+x.name}\n🔐 ${x.permission||"everyone"}\n⏱️ ${x.cooldown||0}ms`:menu()}}, "system");
register({name:"search",run:c=>{let q=c.args.join(" ").toLowerCase();return[...registry.values()].filter(x=>(x.name+" "+(x.description||"")).toLowerCase().includes(q)).slice(0,50).map(x=>`• ${PREFIX}${x.name} — ${x.description||""}`).join("\n")||"❌ Nothing found."}},"system");
register({name:"me",run:c=>{let u=c.user;return`👤 PROFILE\n💰 $${u.balance||0}\n🏦 $${u.bank||0}\n💎 $${u.vault||0}\n⭐ Level ${u.level||1}\n✨ XP ${u.xp||0}\n🐾 Pets ${(u.pets||[]).length}`}},"system");

async function execute(api,e){let p=parse(e.body);if(!p)return;react(api,e);let c=registry.get(p.name);if(!c)return;let uid=String(e.senderID||""),tid=String(e.threadID);let g=await syncGroup(api,tid),u=await getUser(uid),ctx={api,event:e,uid,threadID:tid,user:u,group:g,args:p.args,raw:p.raw,PREFIX,send:x=>send(api,e,x),react:()=>react(api,e),gemini:askGemini};if(!admin(uid)&&S.settings.maintenance)return send(api,e,"🛠️ Maintenance mode.");if(!admin(uid)&&!allowed(uid,tid))return send(api,e,"🚫 Too many commands. Slow down.");if(c.permission==="admin"&&!admin(uid))return send(api,e,"⛔ Admin only.");let key=tid+":"+uid+":"+c.name,n=Date.now(),last=cmdCD.get(key)||0;if(c.cooldown&&!admin(uid)&&n-last<c.cooldown)return send(api,e,`⏳ Wait ${Math.ceil((c.cooldown-n+last)/1000)}s.`);cmdCD.set(key,n);try{let r=await c.run(ctx);if(r!=null)send(api,e,r);await saveUser(u);await saveGroup(g);S.logs.push({uid,tid,command:c.name,time:n});if(S.logs.length>1000)S.logs.shift();save()}catch(x){console.log("CMD ERROR",c.name,x);send(api,e,"❌ Command error: "+x.message)}}

async function askGemini(prompt){let key=process.env.GEMINI_API_KEY;if(!key)return"❌ Gemini API key missing.";try{let model=process.env.GEMINI_MODEL||"gemini-2.0-flash",u=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,r=await axios.post(u,{contents:[{parts:[{text:String(prompt)}]}]},{timeout:30000});return r.data?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"❌ No AI response."}catch(e){return"❌ AI error: "+e.message}}

async function pokemon(){let gs=Object.values(S.groups).filter(g=>g.approved!==false);if(!gs.length||!global.API_INSTANCE)return;let names=["Pikachu","Charmander","Squirtle","Bulbasaur","Eevee","Mew","Mewtwo","Lucario","Gengar","Dragonite","Rayquaza","Greninja"],p=names[Math.floor(Math.random()*names.length)],id="PK"+Date.now();S.pokemon={name:p,id,spawnedAt:Date.now(),claimed:false};save();for(const g of gs)try{global.API_INSTANCE.sendMessage(`⚡✨ WILD POKÉMON SPAWNED! ✨⚡\n🐾 ${p}\n🆔 ${id}\n🎯 ${PREFIX}catch ${id}`,g.threadID,()=>{})}catch(e){}}

app.listen(PORT,()=>console.log(`🌐 ${BOT} running on ${PORT}`));
app.get("/health",(q,s)=>s.json({ok:true,bot:BOT,commands:registry.size,mongodb:!!db,uptime:process.uptime()}));
setInterval(save,60000);setInterval(pokemon,1200000);setTimeout(pokemon,30000);
setInterval(()=>{let u=RENDER_URL||`http://127.0.0.1:${PORT}/health`;axios.get(u).catch(()=>{})},300000);

async function start(){await mongoConnect();if(!APPSTATE)return console.log("❌ APPSTATE missing.");try{login(JSON.parse(APPSTATE),(err,api)=>{if(err)return console.log("❌ Login:",err);global.API_INSTANCE=api;api.setOptions({listenEvents:true,updatePresence:true,selfListen:false,autoMarkRead:false,forceLogin:true});console.log(`🤖 ${BOT} Messenger connected.`);api.listenMqtt(async(err,e)=>{if(err)return console.log("Listen:",err);try{if(e.logMessageType==="log:subscribe"){let g=await syncGroup(api,e.threadID);if(!S.groups[e.threadID]?.approved){S.pending[e.threadID]={...g,approved:false,pendingAt:Date.now()};save();for(const a of ADMINS)api.sendMessage(`⏳ NEW GC\n👥 ${g.name}\n🆔 ${e.threadID}\nUse ${PREFIX}approve_gc ${e.threadID}`,a,()=>{})}}if(e.type==="message"&&e.body)await execute(api,e)}catch(x){console.log("EVENT:",x.message)}})})}catch(e){console.log("Startup:",e.message)}}
process.on("unhandledRejection",e=>console.log("REJECTION:",e));process.on("uncaughtException",e=>console.log("EXCEPTION:",e));process.on("SIGTERM",async()=>{save();if(mongo)await mongo.close();process.exit(0)});start();
