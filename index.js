// ============================================================
// 🤖 iKON-BOT | COMPACT MAIN ENGINE
// 👑 OWNER: APHECKS IKON KLERK
// ============================================================

const fs=require("fs");
const path=require("path");
const express=require("express");
const axios=require("axios");
require("dotenv").config();

let FCA,canvas=null;
try{FCA=require("ws3-fca");}catch(e){console.error("❌ ws3-fca:",e.message);process.exit(1);}
try{canvas=require("canvas");}catch(e){console.log("⚠️ Canvas fallback mode");}

const login=typeof FCA==="function"?FCA:FCA.login;
const app=express();
app.use(express.json());

const PORT=Number(process.env.PORT||1000);
const PREFIX=process.env.PREFIX||"!";
const ADMIN_ID=String(process.env.ADMIN_ID||"");
const BOT_NAME="iKON-BOT";
const OWNER="APHECKS IKON KLERK";

const CONFIG={
 botEnabled:true,maintenance:false,replies:true,reactions:true,
 autoReact:true,reactCooldown:2500,prefix:PREFIX,maxGroups:10,
 welcome:true,goodbye:true,gemini:true,canvas:!!canvas
};

const REACTS=["👍","😂","🔥","❤️","💰","🐾","⚔️","👑"];
const cooldowns=new Map(),groupCache=new Map(),commands=new Map(),aliases=new Map(),pending=new Map();

const CATEGORIES={
 1:["💎 IKONVAULT","💰 Economy • Jobs • Business • Finance"],
 2:["🔥 SHADOWSTREET","🚗 GTA • Crime • Police • Heists"],
 3:["🐉 BEASTREALM","🐾 Pets • Evolution • Breeding • Battles"],
 4:["⚔️ WARFORGE","🗡️ Combat • PvP • Bosses • Raids"],
 5:["🌿 WILDCORE","🌾 Farming • Mining • Fishing • Hunting"],
 6:["💠 TITANMART","🛒 Shop • Items • Crafting • Inventory"],
 7:["👑 OVERLORD","🛡️ Admin • Groups • Security • System"],
 8:["🎭 NEXUS","🎰 Casino • AI • Pokémon • Social"]
};

// ============================================================
// 🌐 SERVER
// ============================================================

app.get("/",(q,s)=>s.json({
 status:"ACTIVE",bot:BOT_NAME,owner:OWNER,prefix:PREFIX,
 commands:commands.size,groups:groupCache.size,uptime:process.uptime()
}));

app.get("/health",(q,s)=>s.json({
 ok:true,bot:BOT_NAME,commands:commands.size,
 groups:groupCache.size,uptime:process.uptime()
}));

app.listen(PORT,()=>console.log(`🌐 ${BOT_NAME} running on ${PORT}`));

// ============================================================
// 📦 COMMAND LOADER
// ============================================================

function loadCommands(){
 commands.clear();
 aliases.clear();

 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});

 const files=fs.readdirSync(dir)
  .filter(x=>/^cmds_\d+\.js$/i.test(x))
  .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));

 for(const file of files){
  try{
   const full=path.join(dir,file);
   delete require.cache[require.resolve(full)];

   const data=require(full);
   const list=Array.isArray(data)?data:Object.values(data);

   for(const cmd of list){
    if(!cmd||typeof cmd.execute!=="function")continue;

    const name=String(cmd.name||cmd.command||"").toLowerCase().trim();
    if(!name)continue;

    if(commands.has(name)){
     console.log(`⚠️ DUPLICATE COMMAND: ${name} → skipped`);
     continue;
    }

    cmd.category=cmd.category||file;
    cmd.aliases=Array.isArray(cmd.aliases)?cmd.aliases:[];
    commands.set(name,cmd);

    for(const alias of cmd.aliases){
     const a=String(alias).toLowerCase().trim();
     if(!a||a===name||commands.has(a)||aliases.has(a)){
      console.log(`⚠️ DUPLICATE ALIAS: ${a} → skipped`);
      continue;
     }
     aliases.set(a,name);
    }
   }

   console.log(`✅ ${file} loaded`);
  }catch(e){
   console.error(`❌ ${file}:`,e.message);
  }
 }

 console.log(`🔥 ${BOT_NAME}: ${commands.size} commands loaded`);
}

loadCommands();

// ============================================================
// 🧰 HELPERS
// ============================================================

const cleanID=x=>String(x||"").replace(/\D/g,"");

function isAdmin(uid,event){
 const id=cleanID(uid);
 const admins=event?.threadInfo?.adminIDs||[];
 return id===cleanID(ADMIN_ID)||admins.map(cleanID).includes(id);
}

function isBotAdmin(event){
 const id=global.api?.getCurrentUserID?.();
 return !!id&&(event?.threadInfo?.adminIDs||[]).map(cleanID).includes(cleanID(id));
}

function getTarget(event){
 if(event?.messageReply?.senderID)return event.messageReply.senderID;
 const ids=Object.keys(event?.mentions||{});
 return ids[0]||event?.senderID;
}

const pick=a=>a[Math.floor(Math.random()*a.length)];

function money(n){
 return `$${Number(n||0).toLocaleString()}`;
}

function bar(v,max=100,size=10){
 v=Math.max(0,Math.min(Number(v)||0,max));
 const x=Math.round(v/max*size);
 return "█".repeat(x)+"░".repeat(size-x);
}

function send(api,event,text){
 if(!CONFIG.replies)return;
 try{
  return api.sendMessage(String(text),event.threadID,err=>{
   if(err)console.error("❌ SEND REPLY:",err);
  },event.messageID);
 }catch(e){
  console.error("❌ SEND REPLY:",e.message);
 }
}

function react(api,event){
 try{
  if(CONFIG.reactions&&CONFIG.autoReact)
   api.setMessageReaction(pick(REACTS),event.messageID,()=>{},true);
 }catch(e){}
}

function autoReact(api,event){
 const key=`react:${event.threadID}:${event.senderID}`;
 const now=Date.now();
 if(now-(cooldowns.get(key)||0)<CONFIG.reactCooldown)return;
 cooldowns.set(key,now);
 react(api,event);
}

function remaining(ms){
 const s=Math.ceil(ms/1000);
 return s<60?`${s}s`:`${Math.floor(s/60)}m ${s%60}s`;
}

function cooldown(key,ms){
 const last=cooldowns.get(key)||0;
 const left=ms-(Date.now()-last);
 if(left>0)return left;
 cooldowns.set(key,Date.now());
 return 0;
}

// ============================================================
// 🌌 MAIN MENU
// ============================================================

function mainMenu(api,event){
 send(api,event,
`🤖 ${BOT_NAME}
━━━━━━━━━━━━━━━━

👑 OWNER
APHECKS IKON KLERK

🌌 WELCOME TO THE IKONVERSE

👤 PLAYER
@${event.senderID}

⚡ PREFIX
${PREFIX}

━━━━━━━━━━━━━━━━
🌐 COMMAND WORLDS
━━━━━━━━━━━━━━━━

💎 1. IKONVAULT
💰 Economy • Jobs • Business • Finance

🔥 2. SHADOWSTREET
🚗 GTA • Crime • Police • Heists

🐉 3. BEASTREALM
🐾 Pets • Evolution • Breeding • Battles

⚔️ 4. WARFORGE
🗡️ Combat • PvP • Bosses • Raids

🌿 5. WILDCORE
🌾 Farming • Mining • Fishing • Hunting

💠 6. TITANMART
🛒 Shop • Items • Crafting • Inventory

👑 7. OVERLORD
🛡️ Admin • Groups • Security • System

🎭 8. NEXUS
🎰 Casino • AI • Pokémon • Social

━━━━━━━━━━━━━━━━
⚡ QUICK ACCESS
━━━━━━━━━━━━━━━━

📖 ${PREFIX}help <command>
👤 ${PREFIX}profile
💰 ${PREFIX}balance
🎒 ${PREFIX}inventory
🐾 ${PREFIX}pets
⚔️ ${PREFIX}fight
🎮 ${PREFIX}games

━━━━━━━━━━━━━━━━

💡 HINT
${PREFIX}menu 1-8

🔥 ${BOT_NAME} • ONLINE
😂 Pick a world and let's cook!`);
}

function categoryMenu(api,event,n){
 const cat=CATEGORIES[n];
 if(!cat)return mainMenu(api,event);

 const list=[...commands.values()]
  .filter(c=>String(c.category).includes(`cmds_${n}`));

 const body=list.slice(0,80).map(c=>{
  const a=c.aliases?.length
   ?`\n   ↳ 🔗 ${c.aliases.slice(0,2).join(" • ")}`
   :"";
  return `🔹 ${PREFIX}${c.name}${a}`;
 }).join("\n\n");

 send(api,event,
`${cat[0]}
━━━━━━━━━━━━━━━━

${cat[1]}

━━━━━━━━━━━━━━━━
📚 COMMANDS
━━━━━━━━━━━━━━━━

${body||"🔄 Commands loading..."}

━━━━━━━━━━━━━━━━

💡 HINT
${PREFIX}help <command>

↩️ ${PREFIX}menu

🔥 Choose your weapon wisely 😈`);
}

function help(api,event,name){
 const key=String(name||"").toLowerCase();
 const canonical=aliases.get(key)||key;
 const cmd=commands.get(canonical);

 if(!cmd)
  return send(api,event,
`❌ COMMAND NOT FOUND 😂

🔎 I searched the IKONVERSE...

💡 TRY

📖 ${PREFIX}menu
❓ ${PREFIX}help <command>

🔥 Check the spelling and try again.`);

 send(api,event,
`📖 COMMAND GUIDE
━━━━━━━━━━━━━━━━

⚡ ${PREFIX}${cmd.name}

🎯 PURPOSE
${cmd.description||"Command information"}

━━━━━━━━━━━━━━━━

📝 SYNTAX
${cmd.usage||`${PREFIX}${cmd.name}`}

🔗 ALIASES
${cmd.aliases?.length?cmd.aliases.join(" • "):"None"}

⏳ COOLDOWN
${cmd.cooldown?remaining(cmd.cooldown):"None"}

👑 PERMISSION
${cmd.permission||"Everyone"}

💡 HINT
${cmd.hint||"Use the syntax shown above."}

━━━━━━━━━━━━━━━━

🔥 ${BOT_NAME}
😂 Now go cook!`);
}

// ============================================================
// 👋 GROUP CACHE
// ============================================================

function refreshThread(api,id){
 return new Promise(resolve=>{
  try{
   api.getThreadInfo(id,(err,info)=>{
    if(!err&&info)groupCache.set(id,{...info,updatedAt:Date.now()});
    resolve(info);
   });
  }catch(e){resolve(null);}
 }
});

function welcome(event,info){
 return`🎉 NEW MEMBER DETECTED!
━━━━━━━━━━━━━━━━

👋 WELCOME @${event.author}!

🌌 YOU ENTERED
🔥 ${info?.threadName||"THE IKONVERSE"}

👥 MEMBERS
${info?.participantIDs?.length||"?"}

━━━━━━━━━━━━━━━━
🚀 START HERE
━━━━━━━━━━━━━━━━

📖 ${PREFIX}menu
👤 ${PREFIX}profile
💰 ${PREFIX}daily
🐾 ${PREFIX}pets
🎮 ${PREFIX}games

🔥 Have fun...
😂 and please don't start a war
💀 in the first 5 minutes!`;
}

// ============================================================
// 📨 PENDING
// ============================================================

function makePending(type,from,to,data={}){
 const id=`${type}:${from}:${to}`;
 pending.set(id,{
  id,type,from,to,data,
  createdAt:Date.now(),
  expiresAt:Date.now()+600000
 });
 return id;
}

function findPending(type,to){
 for(const [id,p] of pending){
  if(p.expiresAt<Date.now()){pending.delete(id);continue;}
  if(p.type===type&&p.to===to)return p;
 }
 return null;
}

// ============================================================
// 📨 MESSAGE ENGINE
// ============================================================

async function handleMessage(api,event){
 if(!event||event.type!=="message")return;

 global.api=api;

 const body=String(event.body||"").trim();
 if(!body)return;

 autoReact(api,event);

 if(event.isGroup&&!groupCache.has(event.threadID))
  await refreshThread(api,event.threadID);

 const upper=body.toUpperCase();

 // REQUESTS
 if(["ACCEPT","DECLINE","JOIN","REJECT"].includes(upper)){
  const p=
   findPending("battle",event.senderID)||
   findPending("co",event.senderID)||
   findPending("heist",event.senderID);

  if(p){
   pending.delete(p.id);

   return send(api,event,upper==="ACCEPT"||upper==="JOIN"
`✅ REQUEST ACCEPTED!
━━━━━━━━━━━━━━━━

📨 ${p.type.toUpperCase()}
👤 From: ${p.from}

🔥 The next stage is now active!

⚔️ LET THE CHAOS BEGIN 😂`
:
`❌ REQUEST DECLINED
━━━━━━━━━━━━━━━━

📨 ${p.type.toUpperCase()}

😂 Bro said:
"not today."

💀 Request cancelled.`);
  }
 }

 // PREFIX
 if(!body.startsWith(CONFIG.prefix))return;

 const raw=body.slice(CONFIG.prefix.length).trim();
 if(!raw)return;

 const parts=raw.split(/\s+/);
 const commandName=parts.shift().toLowerCase();
 const args=parts;

 // MENU / HELP
 if(commandName==="menu"){
  const n=Number(args[0]);
  return n>=1&&n<=8
   ?categoryMenu(api,event,n)
   :mainMenu(api,event);
 }

 if(commandName==="help"){
  return args[0]
   ?help(api,event,args[0])
   :mainMenu(api,event);
 }

 // QUICK
 if(commandName==="ping")
  return send(api,event,
`🏓 PONG!
━━━━━━━━━━━━━━━━

🤖 ${BOT_NAME}
🟢 ONLINE

⚡ Commands: ${commands.size}
🌐 Groups: ${groupCache.size}/${CONFIG.maxGroups}
⏱️ Uptime: ${Math.floor(process.uptime())}s

🔥 System is breathing 😂`);

 if(commandName==="status")
  return send(api,event,
`📊 ${BOT_NAME} STATUS
━━━━━━━━━━━━━━━━

🟢 BOT       ONLINE
🟢 COMMANDS  ${commands.size}
🟢 GROUPS    ${groupCache.size}/${CONFIG.maxGroups}
${canvas?"🟢":"🟡"} CANVAS    ${canvas?"READY":"FALLBACK"}
${CONFIG.gemini?"🟢":"🔴"} GEMINI    ${CONFIG.gemini?"READY":"OFF"}

⚡ UPTIME
${Math.floor(process.uptime())} seconds

🔥 IKONVERSE SYSTEMS ACTIVE`);

 if(commandName==="uid"||commandName==="myuid")
  return send(api,event,
`👤 YOUR PROFILE ID
━━━━━━━━━━━━━━━━

🆔 UID
${event.senderID}

💡 Use this ID for
supported admin operations.

🔥 ${BOT_NAME}`);

 if(commandName==="botinfo")
  return send(api,event,
`🤖 ${BOT_NAME}
━━━━━━━━━━━━━━━━

👑 OWNER
${OWNER}

📦 COMMANDS
${commands.size}

🌐 GROUPS
${groupCache.size}/${CONFIG.maxGroups}

⚡ PREFIX
${PREFIX}

🌌 IKONVERSE
🟢 ONLINE`);

 // LOOKUP
 const canonical=aliases.get(commandName)||commandName;
 const cmd=commands.get(canonical);

 if(!cmd)
  return send(api,event,
`❌ UNKNOWN COMMAND 😂
━━━━━━━━━━━━━━━━

🚫 ${PREFIX}${commandName}

That command isn't registered.

💡 TRY
📖 ${PREFIX}menu
❓ ${PREFIX}help <command>

🔥 Don't worry bro, we got you.`);

 // SYSTEM
 if(!CONFIG.botEnabled&&!isAdmin(event.senderID,event))
  return send(api,event,
`🔴 BOT DISABLED

🛠️ The bot is currently offline
for normal commands.

👑 Admins can still operate
the control system.`);

 if(CONFIG.maintenance&&!isAdmin(event.senderID,event))
  return send(api,event,
`🛠️ MAINTENANCE MODE
━━━━━━━━━━━━━━━━

🌌 The IKONVERSE is upgrading.

🔧 Systems are being tuned...
💾 Data is being protected...
⚡ Engines are being optimized...

😂 Come back shortly!`);

 // PERMISSION
 const permission=String(cmd.permission||"everyone").toLowerCase();

 if((permission==="admin"||permission==="owner")&&!isAdmin(event.senderID,event))
  return send(api,event,
`🚫 ACCESS DENIED 😂
━━━━━━━━━━━━━━━━

👑 REQUIRED
${permission.toUpperCase()}

🛡️ This command is restricted.

😂 Nice try though, boss.`);

 if(permission==="botadmin"&&!isBotAdmin(event))
  return send(api,event,
`❌ BOT ADMIN REQUIRED
━━━━━━━━━━━━━━━━

👑 Make ${BOT_NAME}
a group admin first.

🛡️ Then try again.`);

 // COOLDOWN
 const cd=Number(cmd.cooldown||0);

 if(cd){
  const left=cooldown(`${event.threadID}:${event.senderID}:${canonical}`,cd);

  if(left){
   const pct=Math.max(0,Math.round(100-left/cd*100));

   return send(api,event,
`⏳ EASY THERE, CHAMP 😂
━━━━━━━━━━━━━━━━

🔥 ${PREFIX}${canonical}
is cooling down.

${bar(pct)} ${pct}%

⏱️ REMAINING
${remaining(left)}

💡 Try another command
while you wait 💰`);
  }
 }

 // CONTEXT
 const ctx={
  api,event,args,
  command:canonical,
  prefix:PREFIX,
  config:CONFIG,
  commands,aliases,pending,groupCache,
  canvas,axios,

  isAdmin:(uid=event.senderID)=>isAdmin(uid,event),
  isBotAdmin:()=>isBotAdmin(event),
  getTarget:()=>getTarget(event),

  reply:t=>send(api,event,t),
  react:e=>{try{api.setMessageReaction(e,event.messageID,()=>{},true)}catch(_){}},

  pick,money,bar,
  makePending,findPending
 };

 // EXECUTE
 try{
  await Promise.resolve(cmd.execute(ctx));
 }catch(err){
  console.error(`❌ ${canonical}:`,err);

  send(api,event,
`💥 COMMAND ERROR
━━━━━━━━━━━━━━━━

⚡ ${PREFIX}${canonical}

Something went wrong while
running this command.

🛠️ Error logged by the engine.

💡 Try again shortly.

🤖 ${BOT_NAME}`);
 }
}

// ============================================================
// 🔌 LOGIN / EVENTS
// ============================================================

function startBot(){
 let appstate;

 try{
  appstate=process.env.APPSTATE
   ?JSON.parse(process.env.APPSTATE)
   :(fs.existsSync("./appstate.json")
    ?JSON.parse(fs.readFileSync("./appstate.json","utf8"))
    :null);
 }catch(e){
  console.error("❌ APPSTATE JSON:",e.message);
  return;
 }

 if(!appstate){
  console.error("❌ APPSTATE missing");
  return;
 }

 login({appState:appstate},(err,api)=>{
  if(err){
   console.error("❌ LOGIN:",err);
   return setTimeout(startBot,10000);
  }

  global.api=api;

  api.setOptions({
   listenEvents:true,
   selfListen:false,
   autoMarkRead:false,
   autoMarkDelivery:false
  });

  console.log(`🔥 ${BOT_NAME} CONNECTED`);
  console.log(`👑 OWNER: ${OWNER}`);
  console.log(`📦 COMMANDS: ${commands.size}`);

  api.listenMqtt(async(err,event)=>{
   if(err)return console.error("⚠️ MQTT:",err);

   try{

    // JOIN
    if(event.type==="event"&&event.logMessageType==="log:subscribe"){
     const info=groupCache.get(event.threadID)||{};

     for(const u of event.logMessageData?.addedParticipants||[]){
      if(cleanID(u.userFbId)===cleanID(api.getCurrentUserID?.()))continue;

      if(CONFIG.welcome){
       send(api,{
        threadID:event.threadID,
        messageID:event.messageID
       },welcome({author:u.userFbId},info));
      }
     }

     await refreshThread(api,event.threadID);
     return;
    }

    // LEAVE
    if(event.type==="event"&&event.logMessageType==="log:unsubscribe"){
     if(CONFIG.goodbye){
      const uid=event.logMessageData?.leftParticipantFbId;

      send(api,{
       threadID:event.threadID,
       messageID:event.messageID
      },
`🚪 MEMBER DEPARTURE
━━━━━━━━━━━━━━━━

👤 @${uid}
has left the GC.

😢 The IKONVERSE lost a soldier.

💀 We'll miss the chaos 😂

━━━━━━━━━━━━━━━━
🔥 ${BOT_NAME}`);
     }

     await refreshThread(api,event.threadID);
     return;
    }

    if(event.type==="message")
     await handleMessage(api,event);

   }catch(e){
    console.error("❌ EVENT:",e);
   }
  });
 });
}

// ============================================================
// 🛡️ SAFETY
// ============================================================

process.on("uncaughtException",e=>console.error("💥 UNCAUGHT:",e));
process.on("unhandledRejection",e=>console.error("💥 UNHANDLED:",e));

process.on("SIGTERM",()=>process.exit(0));
process.on("SIGINT",()=>process.exit(0));

// ============================================================
// 🚀 START
// ============================================================

startBot();

console.log(`
🔥 =====================================
        ${BOT_NAME}
        IKONVERSE ENGINE
        👑 ${OWNER}
=====================================
📦 Commands : ${commands.size}
🌐 Groups   : ${CONFIG.maxGroups}
⚡ Prefix   : ${PREFIX}

💎 IKONVAULT
🔥 SHADOWSTREET
🐉 BEASTREALM
⚔️ WARFORGE
🌿 WILDCORE
💠 TITANMART
👑 OVERLORD
🎭 NEXUS
=====================================
`);
