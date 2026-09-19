const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv");dotenv.config();
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;
const app=express(),PORT=+(process.env.PORT||1000),PREFIX=process.env.PREFIX||"!",BOT_NAME=process.env.BOT_NAME||"iKON-BOT",OWNER=process.env.OWNER||"APHECKS IKON KLERK",ADMIN_ID=String(process.env.ADMIN_ID||""),APPSTATE=process.env.APPSTATE||"";
const commands=new Map(),aliases=new Map(),cooldowns=new Map(),groupCache=new Map(),pending=new Map();
const CONFIG={botEnabled:true,maintenance:false,replies:true,reactions:true,autoReact:true,reactCooldown:2500,maxGroups:10,welcome:true};
const REACTIONS=["👍","😂","🔥","❤️","💰","🐾","⚔️","👑","💀","😎"];

app.get("/",(_,r)=>r.json({status:"ACTIVE",bot:BOT_NAME,owner:OWNER,prefix:PREFIX,commands:commands.size,groups:groupCache.size}));
app.get("/health",(_,r)=>r.json({status:"OK",bot:BOT_NAME,commands:commands.size,groups:groupCache.size,uptime:Math.floor(process.uptime())}));
app.listen(PORT,()=>console.log(`🌐 ${BOT_NAME} :${PORT}`));

const CATS={
1:["💎 IKONVAULT","💰 MONEY • BANK • JOBS • BUSINESS • FINANCE"],
2:["🔥 SHADOWSTREET","🚗 GTA • CRIME • POLICE • HEISTS"],
3:["🐉 BEASTREALM","🐾 PETS • EVOLUTION • BREEDING • BATTLES"],
4:["⚔️ WARFORGE","🗡️ COMBAT • PVP • BOSSES • RAIDS"],
5:["🌿 WILDCORE","🌾 FARMING • MINING • FISHING • HUNTING"],
6:["💠 TITANMART","🛒 SHOP • ITEMS • CRAFTING • INVENTORY"],
7:["👑 OVERLORD","🛡️ ADMIN • GROUPS • SECURITY • SYSTEM"],
8:["🎭 NEXUS","🎰 CASINO • AI • POKÉMON • SOCIAL"]
};

const UI={
menu:()=>`🔥━━━━━━━━━━━━━━━━━━━━🔥
       👑 ${BOT_NAME} 👑
🔥━━━━━━━━━━━━━━━━━━━━🔥

🌐 WELCOME TO THE IKONVERSE

👑 OWNER
${OWNER}

⚡ PREFIX: ${PREFIX}
🟢 STATUS: ONLINE
🧩 COMMANDS: ${commands.size}

━━━━━━━━━━━━━━━━━━━━━━

📚 MAIN CATEGORIES

💎 ${PREFIX}menu 1
💰 IKONVAULT
🏦 Money • Bank • Jobs • Business

🔥 ${PREFIX}menu 2
🚗 SHADOWSTREET
💀 GTA • Crime • Police • Heists

🐉 ${PREFIX}menu 3
🐾 BEASTREALM
🥚 Pets • Evolution • Breeding

⚔️ ${PREFIX}menu 4
🔥 WARFORGE
🗡️ PvP • Bosses • Raids

🌿 ${PREFIX}menu 5
🌾 WILDCORE
⛏️ Farming • Mining • Fishing

💠 ${PREFIX}menu 6
🛒 TITANMART
⚒️ Shop • Crafting • Items

👑 ${PREFIX}menu 7
🛡️ OVERLORD
🔐 Admin • Security • Groups

🎭 ${PREFIX}menu 8
🎰 NEXUS
🤖 AI • Casino • Pokémon • Social

━━━━━━━━━━━━━━━━━━━━━━

⚡ QUICK COMMANDS

📖 ${PREFIX}help <command>
👤 ${PREFIX}uid
📊 ${PREFIX}status
🏓 ${PREFIX}ping

━━━━━━━━━━━━━━━━━━━━━━

😂 Explore the IKONVERSE...
🔥 but don't destroy the economy!`,

category:(n,list)=>`${CATS[n][0]}
━━━━━━━━━━━━━━━━━━━━━━
${CATS[n][1]}

${list||"📭 No commands loaded."}

━━━━━━━━━━━━━━━━━━━━━━
📖 ${PREFIX}help <command>
🏠 ${PREFIX}menu

👑 ${BOT_NAME}`,

unknown:c=>`❓ UNKNOWN COMMAND

━━━━━━━━━━━━━━━━━━━━━━

😂 Bro... what is
${PREFIX}${c}?

🔎 Try:

📖 ${PREFIX}help ${c}
📚 ${PREFIX}menu

💀 Maybe that command
escaped the IKONVERSE.`,

cooldown:(c,t)=>`⏳ EASY THERE, CHAMP 😂

━━━━━━━━━━━━━━━━━━━━━━

🔥 ${PREFIX}${c}
is cooling down.

⏱️ REMAINING

${t}

━━━━━━━━━━━━━━━━━━━━━━

💡 While waiting:

💰 ${PREFIX}work
🎮 ${PREFIX}games
🐾 ${PREFIX}pets`,

denied:()=>`🚫 ACCESS DENIED

━━━━━━━━━━━━━━━━━━━━━━

🛡️ ADMIN CLEARANCE REQUIRED

😂 Nice try though...

👑 ${BOT_NAME}`,

error:()=>`💥 SYSTEM ERROR

━━━━━━━━━━━━━━━━━━━━━━

😵 Something went wrong.

🔄 Try again.

👑 CONTACT:

${OWNER}`,

ping:x=>`🏓 PONG!

━━━━━━━━━━━━━━━━━━━━━━

⚡ RESPONSE: ${x}ms
🟢 BOT: ONLINE
📡 CONNECTION: ACTIVE
🧩 COMMANDS: ${commands.size}

🔥 ${BOT_NAME} IS ALIVE!`,

welcome:n=>`🎉 NEW MEMBER DETECTED!

━━━━━━━━━━━━━━━━━━━━━━

👋 WELCOME ${n}!

🌐 You just entered:

🔥 THE IKONVERSE

━━━━━━━━━━━━━━━━━━━━━━

📖 ${PREFIX}menu
💰 ${PREFIX}daily
👤 ${PREFIX}profile
🐾 ${PREFIX}pets
🎮 ${PREFIX}games

😂 Have fun...

🔥 and don't start a war yet!`,

battle:t=>`⚔️ BATTLE TURN ${t}

━━━━━━━━━━━━━━━━━━━━━━

🐉 YOU

❤️ HP 720/1000
███████░░░

👹 ENEMY

❤️ HP 540/1000
█████░░░░░

━━━━━━━━━━━━━━━━━━━━━━

⚔️ ${PREFIX}attack
🛡️ ${PREFIX}defend
💨 ${PREFIX}dodge
🔥 ${PREFIX}skill
💥 ${PREFIX}ultimate
🏃 ${PREFIX}flee

⏳ MAKE YOUR MOVE!

😂 WHO'S GETTING COOKED? 🔥`,

request:(a,b,t)=>`💌 ${String(t).toUpperCase()} REQUEST

━━━━━━━━━━━━━━━━━━━━━━

👤 FROM: ${a}
🎯 TO: ${b}

📨 A special request
has been sent.

━━━━━━━━━━━━━━━━━━━━━━

✅ ACCEPT
❌ DECLINE

⏳ EXPIRES IN 10 MINUTES

😂 Choose wisely...`,

accepted:t=>`✅ REQUEST ACCEPTED!

━━━━━━━━━━━━━━━━━━━━━━

📨 ${String(t).toUpperCase()}

🔥 NEXT STAGE ACTIVATED!

⚔️ LET THE CHAOS BEGIN 😂🔥`,

declined:t=>`❌ REQUEST DECLINED

━━━━━━━━━━━━━━━━━━━━━━

📨 ${String(t).toUpperCase()}

😂 Bro said:

"not today."

💀 REQUEST CANCELLED.`,

offline:()=>`🔴 BOT OFFLINE

━━━━━━━━━━━━━━━━━━━━━━

🛠️ MAINTENANCE MODE

⏳ Try again later.

👑 ${BOT_NAME}`,

money:()=>`💰 CASH DROP!

━━━━━━━━━━━━━━━━━━━━━━

AYOOO 😭🔥

💵 +$6,000,000
⭐ +250 XP
🔥 STREAK INCREASED

📊 WALLET

█████████░

😂 Don't spend it all
in 4 seconds bro.`
};

const send=(api,e,t)=>new Promise(resolve=>{if(!CONFIG.replies)return resolve();try{api.sendMessage(String(t),e.threadID,err=>{if(err){console.error("❌ SEND:",err);try{api.sendMessage(String(t),e.threadID,()=>{})}catch{}}resolve()},e.messageID)}catch(err){console.error("❌ SEND:",err);try{api.sendMessage(String(t),e.threadID,()=>{})}catch{}resolve()}});
const react=(api,e,x)=>{try{api.setMessageReaction(x,e.messageID,()=>{},true)}catch{}};
const isAdmin=e=>ADMIN_ID&&String(e.senderID)===ADMIN_ID;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const remaining=k=>{const x=(cooldowns.get(k)||0)-Date.now();if(x<=0)return null;const s=Math.ceil(x/1000),m=Math.floor(s/60);return`${m?m+"m ":""}${s%60}s`};
const findCommand=n=>{n=String(n||"").toLowerCase();return commands.get(n)||commands.get(aliases.get(n))};

function loadCommands(){
 commands.clear();aliases.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){console.error("❌ commands directory missing");return}
 const files=fs.readdirSync(dir).filter(f=>/^cmds_\d+\.js$/i.test(f)).sort((a,b)=>+a.match(/\d+/)[0]-+b.match(/\d+/)[0]);
 for(const file of files){
  try{
   const full=path.join(dir,file);delete require.cache[require.resolve(full)];
   const mod=require(full);
   const list=Array.isArray(mod)?mod:Array.isArray(mod.commands)?mod.commands:mod.default?(Array.isArray(mod.default)?mod.default:[mod.default]):Object.values(mod);
   for(const c of list){
    if(!c||typeof c!=="object"||!c.name)continue;
    const name=String(c.name).toLowerCase().trim();
    if(commands.has(name)){console.log(`⚠️ DUPLICATE COMMAND IGNORED: ${name} (${file})`);continue}
    c.name=name;c.file=file;commands.set(name,c);
    for(const a of Array.isArray(c.aliases)?c.aliases:[]){
     const x=String(a).toLowerCase().trim();
     if(!x||x===name||commands.has(x)||aliases.has(x)){if(x&&x!==name)console.log(`⚠️ DUPLICATE ALIAS IGNORED: ${x}`);continue}
     aliases.set(x,name);
    }
   }
   console.log(`📦 ${file} loaded`);
  }catch(err){console.error(`❌ ${file}:`,err.message)}
 }
 console.log(`🔥 ${BOT_NAME}: ${commands.size} commands loaded`);
}

async function mainMenu(api,e){return send(api,e,UI.menu())}

async function categoryMenu(api,e,n){
 n=+n;
 if(!CATS[n])return send(api,e,`❌ INVALID CATEGORY\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nChoose 1-8.\n\n📚 ${PREFIX}menu`);
 const list=[];
 for(const [name,c] of commands){if(+(c.category||c.cat||0)===n)list.push(`${PREFIX}${name}${c.description?` — ${c.description}`:""}`)}
 return send(api,e,UI.category(n,list.length?list.join("\n\n"):"📭 No commands loaded."));
}

async function helpCommand(api,e,name){
 if(!name)return send(api,e,`📖 COMMAND HELP\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nUsage:\n${PREFIX}help <command>\n\nExample:\n${PREFIX}help daily\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n💡 Try ${PREFIX}menu`);
 const c=findCommand(name);
 if(!c)return send(api,e,UI.unknown(name));
 return send(api,e,`📖 COMMAND INFO\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n⚡ COMMAND\n${PREFIX}${c.name}\n\n📝 DESCRIPTION\n${c.description||"No description available."}\n\n🏷️ CATEGORY\n${CATS[+(c.category||c.cat||0)]?.[0]||"🎭 NEXUS"}\n\n${c.aliases?.length?`🔗 ALIASES\n${c.aliases.map(x=>PREFIX+x).join(" • ")}\n\n`:""}💡 USAGE\n${c.usage||PREFIX+c.name}\n\n🔥 ${BOT_NAME}`);
}

function addPending(type,from,to,data={}){const id=`${type}:${from}:${to}:${Date.now()}`;pending.set(id,{id,type,from,to,expires:Date.now()+600000,...data});return id}
function findPending(type,user){for(const p of pending.values()){if(p.type===type&&(p.from===user||p.to===user)){if(p.expires>Date.now())return p;pending.delete(p.id)}}return null}

async function handleMessage(api,e){
 if(e.type!=="message"&&e.type!=="message_reply")return;
 if(!e.body)return;
 const body=String(e.body).trim();if(!body)return;
 if(CONFIG.autoReact)react(api,e,pick(REACTIONS));
 if(!CONFIG.botEnabled)return;
 if(CONFIG.maintenance&&!isAdmin(e))return send(api,e,UI.offline());

 const upper=body.toUpperCase();
 if(["ACCEPT","DECLINE","JOIN","REJECT"].includes(upper)){
  const p=findPending("battle",e.senderID)||findPending("co",e.senderID)||findPending("heist",e.senderID);
  if(p){pending.delete(p.id);return send(api,e,upper==="ACCEPT"||upper==="JOIN"?UI.accepted(p.type):UI.declined(p.type))}
 }

 if(!body.startsWith(PREFIX))return;
 const input=body.slice(PREFIX.length).trim();if(!input)return mainMenu(api,e);
 const parts=input.split(/\s+/),name=parts.shift().toLowerCase(),args=parts;

 if(name==="menu"||name==="commands")return args[0]?categoryMenu(api,e,args[0]):mainMenu(api,e);
 if(name==="help")return helpCommand(api,e,args.join(" "));
 if(name==="ping"){const t=Date.now();return send(api,e,UI.ping(Date.now()-t))}
 if(name==="uid"||name==="myuid")return send(api,e,`👤 USER ID\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🆔 ${e.senderID}\n\n📌 THREAD\n${e.threadID}\n\n🔥 ${BOT_NAME}`);
 if(name==="status")return send(api,e,`📊 ${BOT_NAME} STATUS\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🟢 BOT: ONLINE\n📡 CONNECTION: ACTIVE\n🧩 COMMANDS: ${commands.size}\n👥 GROUPS: ${groupCache.size}/${CONFIG.maxGroups}\n⏱️ UPTIME: ${Math.floor(process.uptime())}s\n\n👑 OWNER\n${OWNER}`);

 const command=findCommand(name);
 if(!command)return send(api,e,UI.unknown(name));

 const permission=command.permission||command.role||"user";
 if((permission==="admin"||command.adminOnly===true)&&!isAdmin(e))return send(api,e,UI.denied());

 const cd=+(command.cooldown||0);
 if(cd){
  const key=`cmd:${e.threadID}:${e.senderID}:${command.name}`,x=remaining(key);
  if(x)return send(api,e,UI.cooldown(command.name,x));
  cooldowns.set(key,Date.now()+cd*1000);
 }

 const context={
  api,event:e,args,body,prefix:PREFIX,command:command.name,BOT_NAME,OWNER,ADMIN_ID,CONFIG,commands,aliases,cooldowns,pending,groupCache,
  isAdmin:()=>isAdmin(e),getTarget:()=>Object.keys(e.mentions||{})[0]||e.senderID,
  send:t=>send(api,e,t),reply:t=>send(api,e,t),react:x=>react(api,e,x),
  pick,addPending,findPending,UI
 };

 try{
  if(typeof command.execute!=="function")return send(api,e,`⚠️ COMMAND NOT READY\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n${PREFIX}${command.name}\n\n🛠️ Missing execute handler.\n\n📁 ${command.file}`);
  const result=await command.execute(context);
  if(typeof result==="string"&&result.trim())await send(api,e,result);
 }catch(err){console.error(`❌ COMMAND ERROR [${command.name}]`,err);await send(api,e,UI.error())}
}

async function refreshThread(api,e){
 try{
  const info=await api.getThreadInfo(e.threadID);
  groupCache.set(e.threadID,{id:e.threadID,name:info.threadName||"Unnamed",updated:Date.now()});
  while(groupCache.size>CONFIG.maxGroups)groupCache.delete(groupCache.keys().next().value);
 }catch{}
}

function startBot(){
 console.log("🚀 Starting Messenger login...");
 if(!APPSTATE){console.error("❌ APPSTATE is missing!");return}
 let state;
 try{state=JSON.parse(APPSTATE)}catch(err){console.error("❌ APPSTATE JSON ERROR:",err.message);return}
 console.log(`🔐 APPSTATE loaded (${Array.isArray(state)?state.length:"object"} entries)`);
 if(typeof login!=="function"){console.error("❌ ws3-fca login function unavailable");return}
 login({appState:state},async(err,api)=>{
  if(err){console.error("❌ LOGIN ERROR:",err);return}
  console.log(`🔥 ${BOT_NAME} CONNECTED`);
  console.log(`👑 OWNER: ${OWNER}`);
  try{api.setOptions({listenEvents:true,selfListen:false,forceLogin:true,autoMarkRead:false,autoMarkDelivery:false})}catch(err){console.error("⚠️ setOptions:",err)}
  api.listenMqtt(async(err,event)=>{
   if(err){console.error("❌ MQTT ERROR:",err);return}
   try{
    if(event.type==="message"||event.type==="message_reply"){await refreshThread(api,event);await handleMessage(api,event)}
    else if(event.type==="event"&&event.logMessageType==="log:subscribe"){try{const info=await api.getThreadInfo(event.threadID);await send(api,event,UI.welcome(info.threadName||"Legend"))}catch{}}
   }catch(x){console.error("❌ EVENT ERROR:",x)}
  });
 });
}

process.on("uncaughtException",e=>console.error("💥 UNCAUGHT:",e));
process.on("unhandledRejection",e=>console.error("💥 UNHANDLED:",e));

loadCommands();
startBot();
