// ============================================================
// 🤖 iKON-BOT | MAIN ENGINE
// 👑 OWNER: APHECKS IKON KLERK
// ============================================================

const fs=require("fs");
const path=require("path");
const express=require("express");
const axios=require("axios");
require("dotenv").config();

let FCA;
try{FCA=require("ws3-fca");}
catch(e){console.error("❌ ws3-fca missing:",e.message);process.exit(1);}

const login=typeof FCA==="function"?FCA:FCA.login;

let canvas=null;
try{canvas=require("canvas");}
catch(e){console.log("⚠️ Canvas unavailable - image commands will use fallback.");}

const app=express();
app.use(express.json());

const PORT=Number(process.env.PORT||1000);
const PREFIX=process.env.PREFIX||"!";
const ADMIN_ID=String(process.env.ADMIN_ID||"");
const BOT_NAME="iKON-BOT";
const OWNER="APHECKS IKON KLERK";

const CONFIG={
 botEnabled:true,
 maintenance:false,
 replies:true,
 reactions:true,
 autoReact:true,
 reactCooldown:2500,
 prefix:PREFIX,
 maxGroups:10,
 welcome:true,
 goodbye:true,
 gemini:true,
 canvas:!!canvas
};

const REACTS=["👍","😂","🔥","❤️","💰","🐾","⚔️","👑"];
const cooldowns=new Map();
const groupCache=new Map();
const commands=new Map();
const aliases=new Map();
const pending=new Map();

const CATEGORIES={
 1:{name:"💎 IKONVAULT",file:"cmds_1.js",desc:"💰 Economy • Jobs • Business • Finance"},
 2:{name:"🔥 SHADOWSTREET",file:"cmds_2.js",desc:"🚗 GTA • Crime • Police • Heists"},
 3:{name:"🐉 BEASTREALM",file:"cmds_3.js",desc:"🐾 Pets • Evolution • Breeding • Battles"},
 4:{name:"⚔️ WARFORGE",file:"cmds_4.js",desc:"🗡️ Combat • PvP • Bosses • Raids"},
 5:{name:"🌿 WILDCORE",file:"cmds_5.js",desc:"🌾 Farming • Mining • Fishing • Hunting"},
 6:{name:"💠 TITANMART",file:"cmds_6.js",desc:"🛒 Shop • Items • Crafting • Inventory"},
 7:{name:"👑 OVERLORD",file:"cmds_7.js",desc:"🛡️ Admin • Groups • Security • System"},
 8:{name:"🎭 NEXUS",file:"cmds_8.js",desc:"🎰 Casino • AI • Pokémon • Social"}
};

// ------------------------------------------------------------
// 🌐 HEALTH SERVER
// ------------------------------------------------------------
app.get("/",(req,res)=>res.json({
 status:"ACTIVE",
 bot:BOT_NAME,
 owner:OWNER,
 prefix:PREFIX,
 commands:commands.size,
 groups:groupCache.size,
 uptime:process.uptime()
}));

app.get("/health",(req,res)=>res.json({
 ok:true,
 bot:BOT_NAME,
 uptime:process.uptime(),
 commands:commands.size,
 groups:groupCache.size
}));

app.listen(PORT,()=>console.log(`🌐 ${BOT_NAME} running on port ${PORT}`));

// ------------------------------------------------------------
// 📦 COMMAND LOADER
// ------------------------------------------------------------
function loadCommands(){
 commands.clear();
 aliases.clear();

 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});

 const files=fs.readdirSync(dir)
  .filter(f=>/^cmds_\d+\.js$/i.test(f))
  .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));

 for(const file of files){
  try{
   const full=path.join(dir,file);
   delete require.cache[require.resolve(full)];
   const loaded=require(full);
   const list=Array.isArray(loaded)?loaded:Object.values(loaded);

   for(const cmd of list){
    if(!cmd)continue;

    const name=String(cmd.name||cmd.command||"").toLowerCase().trim();
    if(!name||typeof cmd.execute!=="function")continue;

    if(commands.has(name)){
     console.log(`⚠️ DUPLICATE COMMAND IGNORED: ${name} (${file})`);
     continue;
    }

    cmd.category=cmd.category||file;
    cmd.aliases=Array.isArray(cmd.aliases)?cmd.aliases:[];
    commands.set(name,cmd);

    for(const alias of cmd.aliases){
     const a=String(alias).toLowerCase().trim();
     if(!a)continue;
     if(commands.has(a)||aliases.has(a)){
      console.log(`⚠️ DUPLICATE ALIAS IGNORED: ${a}`);
      continue;
     }
     aliases.set(a,name);
    }
   }

   console.log(`✅ ${file} loaded`);
  }catch(e){
   console.error(`❌ Failed loading ${file}:`,e.message);
  }
 }

 console.log(`🔥 ${BOT_NAME}: ${commands.size} commands loaded`);
}

loadCommands();

// ------------------------------------------------------------
// 🧰 HELPERS
// ------------------------------------------------------------
function cleanID(id){return String(id||"").replace(/[^0-9]/g,"");}

function isAdmin(uid,event){
 uid=cleanID(uid);
 const threadAdmins=event?.threadInfo?.adminIDs||[];
 return uid===cleanID(ADMIN_ID)||threadAdmins.map(cleanID).includes(uid);
}

function isBotAdmin(event){
 const botID=global.api?.getCurrentUserID?.();
 if(!botID)return false;
 return (event?.threadInfo?.adminIDs||[]).map(cleanID).includes(cleanID(botID));
}

function getTarget(event){
 if(event?.messageReply?.senderID)return event.messageReply.senderID;
 const ids=Object.keys(event?.mentions||{});
 if(ids.length)return ids[0];
 return event?.senderID;
}

function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

function formatMoney(n){
 n=Number(n||0);
 return `$${n.toLocaleString()}`;
}

function bar(value,max=100,size=10){
 value=Math.max(0,Math.min(Number(value)||0,max));
 const filled=Math.round(value/max*size);
 return "█".repeat(filled)+"░".repeat(size-filled);
}

function reply(api,event,text){
 if(!CONFIG.replies)return;
 return api.sendMessage(String(text),event.threadID,()=>{},event.messageID);
}

function react(api,event,emoji){
 try{
  if(!CONFIG.reactions||!CONFIG.autoReact)return;
  api.setMessageReaction(emoji,event.messageID,()=>{},true);
 }catch(e){}
}

function autoReact(api,event){
 const now=Date.now();
 const key=`${event.threadID}:${event.senderID}`;
 const last=cooldowns.get(`react:${key}`)||0;

 if(now-last<CONFIG.reactCooldown)return;

 cooldowns.set(`react:${key}`,now);
 react(api,event,pick(REACTS));
}

function remaining(ms){
 const s=Math.ceil(ms/1000);
 if(s<60)return `${s}s`;
 const m=Math.floor(s/60);
 const sec=s%60;
 return `${m}m ${sec}s`;
}

function checkCooldown(key,ms){
 const last=cooldowns.get(key)||0;
 const left=ms-(Date.now()-last);
 if(left>0)return left;
 cooldowns.set(key,Date.now());
 return 0;
}

// ------------------------------------------------------------
// 📋 MENU
// ------------------------------------------------------------
function mainMenu(event){
 const text=
`🤖 ${BOT_NAME}
━━━━━━━━━━━━━━━━

👑 ${OWNER}
🌌 WELCOME TO THE IKONVERSE

👤 Player: @${event.senderID}
⚡ Prefix: ${PREFIX}

━━━━━━━━━━━━━━━━

🌐 COMMAND WORLDS

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

📖 ${PREFIX}help <command>
👤 ${PREFIX}profile
💰 ${PREFIX}balance
🎒 ${PREFIX}inventory
🐾 ${PREFIX}pets
⚔️ ${PREFIX}fight
🎮 ${PREFIX}games

💡 HINT
Type ${PREFIX}menu 1-8
to open a world.

🔥 ${BOT_NAME} • ONLINE`;

 reply(global.api,event,text);
}

function categoryMenu(event,num){
 const cat=CATEGORIES[num];
 if(!cat)return mainMenu(event);

 const list=[...commands.values()]
  .filter(c=>String(c.category||"").includes(`cmds_${num}`)||c.module===num||c.category===cat.name);

 let body=list.slice(0,80).map(c=>{
  const a=c.aliases?.length?` | ${c.aliases.slice(0,2).join(", ")}`:"";
  return `🔹 ${PREFIX}${c.name}${a}`;
 }).join("\n");

 if(!body)body="🔹 Commands are loading...";

 reply(global.api,event,
`${cat.name}
━━━━━━━━━━━━━━━━

${cat.desc}

${body}

━━━━━━━━━━━━━━━━

💡 HINT
${PREFIX}help <command>

↩️ ${PREFIX}menu
`);
}

function helpCommand(event,name){
 name=String(name||"").toLowerCase();
 const canonical=aliases.get(name)||name;
 const cmd=commands.get(canonical);

 if(!cmd){
  return reply(global.api,event,
`❌ COMMAND NOT FOUND 😂

I searched the whole IKONVERSE.

💡 Try:
${PREFIX}menu
${PREFIX}help <command>`);
 }

 reply(global.api,event,
`📖 COMMAND GUIDE
━━━━━━━━━━━━━━━━

⚡ ${PREFIX}${cmd.name}
🏷️ Category: ${cmd.category||"General"}
🎯 Purpose: ${cmd.description||cmd.purpose||"Command information"}

📝 Syntax:
${cmd.usage||cmd.syntax||`${PREFIX}${cmd.name}`}

🔗 Aliases:
${cmd.aliases?.length?cmd.aliases.join(", "):"None"}

⏳ Cooldown:
${cmd.cooldown||"None"}

👑 Permission:
${cmd.permission||"Everyone"}

💡 Hint:
${cmd.hint||"Use the command exactly as shown."}

🔥 ${BOT_NAME}`);
}

// ------------------------------------------------------------
// 👋 GROUP INFO / WELCOME / LEAVE
// ------------------------------------------------------------
async function refreshThread(api,threadID){
 try{
  api.getThreadInfo(threadID,(err,info)=>{
   if(err||!info)return;
   groupCache.set(threadID,{
    ...info,
    updatedAt:Date.now()
   });
  });
 }catch(e){}
}

function welcomeMessage(event,info){
 return `🎉 NEW MEMBER DETECTED!

👋 Welcome @${event.author}!

🌐 You just entered:
🔥 ${info?.threadName||"THE IKONVERSE"}

👥 Members: ${info?.participantIDs?.length||"?"}

💡 START HERE

📖 ${PREFIX}menu
👤 ${PREFIX}profile
💰 ${PREFIX}daily
🐾 ${PREFIX}pets
🎮 ${PREFIX}games

🔥 Have fun...
and please don't start a war
in the first 5 minutes 😂💀`;
}

// ------------------------------------------------------------
// 📨 PENDING REQUESTS
// ------------------------------------------------------------
function makePending(type,from,to,data={}){
 const id=`${type}:${from}:${to}`;
 pending.set(id,{
  id,type,from,to,data,
  createdAt:Date.now(),
  expiresAt:Date.now()+10*60*1000
 });
 return id;
}

function findPending(type,to){
 const now=Date.now();
 for(const [id,p] of pending){
  if(p.expiresAt<now){
   pending.delete(id);
   continue;
  }
  if(p.type===type&&p.to===to)return p;
 }
 return null;
}

// ------------------------------------------------------------
// 🤖 MESSAGE ENGINE
// ------------------------------------------------------------
async function handleMessage(api,event){
 if(!event||event.type!=="message")return;

 global.api=api;

 const body=String(event.body||"").trim();
 if(!body)return;

 const threadID=event.threadID;
 const senderID=event.senderID;

 autoReact(api,event);

 if(event.isGroup){
  if(!groupCache.has(threadID))await refreshThread(api,threadID);
 }

 // ----------------------------------------------------------
 // ACCEPT / DECLINE PENDING REQUESTS
 // ----------------------------------------------------------
 const upper=body.toUpperCase();

 if(["ACCEPT","DECLINE","JOIN","REJECT"].includes(upper)){
  const p=
   findPending("battle",senderID)||
   findPending("co",senderID)||
   findPending("heist",senderID);

  if(p){
   pending.delete(p.id);

   if(upper==="ACCEPT"||upper==="JOIN"){
    return reply(api,event,
`✅ REQUEST ACCEPTED! 🔥

📨 Type: ${p.type.toUpperCase()}
👤 From: ${p.from}
👤 To: ${p.to}

⚡ The next stage has been activated.`);
   }

   return reply(api,event,
`❌ REQUEST DECLINED.

📨 ${p.type.toUpperCase()} request cancelled.

😂 Bro said "not today."`);
  }
 }

 // ----------------------------------------------------------
 // PREFIX CHECK
 // ----------------------------------------------------------
 if(!body.startsWith(CONFIG.prefix))return;

 const raw=body.slice(CONFIG.prefix.length).trim();
 if(!raw)return;

 const parts=raw.split(/\s+/);
 const commandName=parts.shift().toLowerCase();
 const args=parts;

 // ----------------------------------------------------------
 // MENU
 // ----------------------------------------------------------
 if(commandName==="menu"||commandName==="help"){
  if(commandName==="menu"){
   const n=Number(args[0]);
   if(n>=1&&n<=8)return categoryMenu(event,n);
   return mainMenu(event);
  }

  if(!args[0])return mainMenu(event);
  return helpCommand(event,args[0]);
 }

 // ----------------------------------------------------------
 // QUICK COMMANDS
 // ----------------------------------------------------------
 if(commandName==="ping"){
  return reply(api,event,
`🏓 PONG!

🤖 ${BOT_NAME}
⚡ Online
⏱️ Uptime: ${Math.floor(process.uptime())}s
📦 Commands: ${commands.size}
🌐 Groups: ${groupCache.size}/10`);
 }

 if(commandName==="status"){
  return reply(api,event,
`📊 ${BOT_NAME} STATUS

🟢 Bot: ONLINE
🟢 Commands: ${commands.size}
🟢 Groups: ${groupCache.size}/10
🟢 Canvas: ${canvas?"READY":"FALLBACK"}
🟢 Gemini: ${CONFIG.gemini?"READY":"OFF"}

⚡ Uptime:
${Math.floor(process.uptime())} seconds`);
 }

 if(commandName==="uid"||commandName==="myuid"){
  return reply(api,event,
`👤 YOUR UID

🆔 ${senderID}

💡 You can use this ID
for supported admin commands.`);
 }

 if(commandName==="botinfo"){
  return reply(api,event,
`🤖 ${BOT_NAME}

👑 Owner:
${OWNER}

📦 Commands:
${commands.size}

🌐 Groups:
${groupCache.size}/10

⚡ Prefix:
${PREFIX}

🔥 IKONVERSE ONLINE`);
 }

 // ----------------------------------------------------------
 // COMMAND LOOKUP
 // ----------------------------------------------------------
 const canonical=aliases.get(commandName)||commandName;
 const cmd=commands.get(canonical);

 if(!cmd){
  return reply(api,event,
`❌ UNKNOWN COMMAND 😂

"${PREFIX}${commandName}" isn't registered.

💡 Try:
${PREFIX}menu

Or:
${PREFIX}help <command>`);
 }

 // ----------------------------------------------------------
 // BOT / MAINTENANCE
 // ----------------------------------------------------------
 if(!CONFIG.botEnabled&&!isAdmin(senderID,event))
  return reply(api,event,"🔴 Bot commands are currently disabled.");

 if(CONFIG.maintenance&&!isAdmin(senderID,event))
  return reply(api,event,
`🛠️ MAINTENANCE MODE

The IKONVERSE is being upgraded. 🔧

💡 Try again later.`);
  
 // ----------------------------------------------------------
 // PERMISSION
 // ----------------------------------------------------------
 const permission=String(cmd.permission||"everyone").toLowerCase();

 if(
  (permission==="admin"||permission==="owner") &&
  !isAdmin(senderID,event)
 ){
  return reply(api,event,
`❌ ACCESS DENIED 😂

👑 This command requires:
${permission.toUpperCase()} permission.

Nice try, boss 💀`);
 }

 if(permission==="botadmin"&&!isBotAdmin(event)){
  return reply(api,event,
`❌ BOT ADMIN REQUIRED

👑 Make ${BOT_NAME} a GC admin
before using this command.`);
 }

 // ----------------------------------------------------------
 // COOLDOWN
 // ----------------------------------------------------------
 const cd=Number(cmd.cooldown||0);

 if(cd>0){
  const left=checkCooldown(`${threadID}:${senderID}:${canonical}`,cd);

  if(left){
   return reply(api,event,
`⏳ EASY THERE, CHAMP 😂

🔥 ${PREFIX}${canonical} is cooling down.

${bar(100-left/cd*100)} ${Math.max(0,Math.round(100-left/cd*100))}%

⏱️ Remaining:
${remaining(left)}

💡 Try another command while you wait.`);
  }
 }

 // ----------------------------------------------------------
 // COMMAND CONTEXT
 // ----------------------------------------------------------
 const context={
  api,
  event,
  args,
  command:canonical,
  prefix:PREFIX,
  config:CONFIG,
  commands,
  aliases,
  pending,
  groupCache,
  canvas,
  axios,
  isAdmin:(uid=senderID)=>isAdmin(uid,event),
  isBotAdmin:()=>isBotAdmin(event),
  getTarget:()=>getTarget(event),
  reply:(text)=>reply(api,event,text),
  react:(emoji)=>react(api,event,emoji),
  pick,
  formatMoney,
  bar,
  makePending,
  findPending
 };

 // ----------------------------------------------------------
 // EXECUTE COMMAND
 // ----------------------------------------------------------
 try{
  await cmd.execute(context);
 }catch(err){
  console.error(`❌ ${canonical}:`,err);

  try{
   await reply(api,event,
`💥 COMMAND ERROR

Something went wrong while running:
${PREFIX}${canonical}

🛠️ The error was logged.

💡 Try again in a moment.`);
  }catch(e){}
 }
}

// ------------------------------------------------------------
// 🔌 EVENT LISTENER
// ------------------------------------------------------------
function startBot(){
 const appstate=process.env.APPSTATE
  ?JSON.parse(process.env.APPSTATE)
  :(fs.existsSync("./appstate.json")
    ?JSON.parse(fs.readFileSync("./appstate.json","utf8"))
    :null);

 if(!appstate){
  console.error("❌ APPSTATE missing.");
  return;
 }

 login(
  {appState:appstate},
  (err,api)=>{
   if(err){
    console.error("❌ Messenger login failed:",err);
    setTimeout(startBot,10000);
    return;
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
    if(err){
     console.error("⚠️ MQTT:",err);
     return;
    }

    try{
     // JOIN
     if(event.type==="event"&&event.logMessageType==="log:subscribe"){
      const info=groupCache.get(event.threadID)||{};
      for(const user of event.logMessageData?.addedParticipants||[]){
       if(cleanID(user.userFbId)===cleanID(api.getCurrentUserID?.()))continue;

       if(CONFIG.welcome){
        reply(api,{
         threadID:event.threadID,
         messageID:event.messageID
        },welcomeMessage({
         author:user.userFbId
        },info));
       }
      }
      await refreshThread(api,event.threadID);
      return;
     }

     // LEAVE
     if(event.type==="event"&&event.logMessageType==="log:unsubscribe"){
      if(CONFIG.goodbye){
       const uid=event.logMessageData?.leftParticipantFbId;
       reply(api,{
        threadID:event.threadID,
        messageID:event.messageID
       },
`🚪 MEMBER DEPARTURE

👤 @${uid} has left the GC.

😢 The IKONVERSE just lost a soldier.

👥 We'll miss the chaos 😂💀`);
      }

      await refreshThread(api,event.threadID);
      return;
     }

     if(event.type==="message"){
      await handleMessage(api,event);
     }

    }catch(e){
     console.error("❌ Event error:",e);
    }
   });
  }
 );
}

// ------------------------------------------------------------
// 🔄 PROCESS SAFETY
// ------------------------------------------------------------
process.on("uncaughtException",e=>{
 console.error("💥 UNCAUGHT:",e);
});

process.on("unhandledRejection",e=>{
 console.error("💥 UNHANDLED:",e);
});

process.on("SIGTERM",()=>{
 console.log("🛑 SIGTERM received.");
 process.exit(0);
});

process.on("SIGINT",()=>{
 console.log("🛑 SIGINT received.");
 process.exit(0);
});

// ------------------------------------------------------------
// 🚀 START
// ------------------------------------------------------------
startBot();

console.log(`
🔥 =================================
        ${BOT_NAME}
        IKONVERSE ENGINE
        OWNER: ${OWNER}
=================================
📦 Commands: ${commands.size}
🌐 Target GC: ${CONFIG.maxGroups}
⚡ Prefix: ${PREFIX}
💎 IKONVAULT
🔥 SHADOWSTREET
🐉 BEASTREALM
⚔️ WARFORGE
🌿 WILDCORE
💠 TITANMART
👑 OVERLORD
🎭 NEXUS
=================================
`);
