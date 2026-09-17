const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv"),axios=require("axios"),{login}=require("ws3-fca");
dotenv.config();

let canvas=null;
try{canvas=require("canvas")}catch(e){console.log("⚠️ Canvas not installed; canvas commands disabled")}

const ADMIN_ID=process.env.ADMIN_ID||"100086783504073";
const PORT=+(process.env.PORT||1000);
const CONFIG_FILE=path.join(__dirname,"bot-config.json");
const APPSTATE=process.env.APPSTATE?JSON.parse(process.env.APPSTATE):require("./appstate.json");

const Commands=new Map(),Aliases=new Map(),Cooldowns=new Map(),ReactCD=new Map();
let api;

const DEFAULT={
 prefix:process.env.PREFIX||"!",
 botEnabled:true,maintenance:false,replies:true,reactions:true,
 autoReact:"👍",reactCooldown:2500,
 modules:{},
 commands:{},
 groups:{}
};

let CFG=loadConfig();

function loadConfig(){
 try{
  if(!fs.existsSync(CONFIG_FILE)){
   fs.writeFileSync(CONFIG_FILE,JSON.stringify(DEFAULT,null,2));
   return JSON.parse(JSON.stringify(DEFAULT));
  }
  const x=JSON.parse(fs.readFileSync(CONFIG_FILE,"utf8"));
  return {
   ...DEFAULT,...x,
   modules:{...DEFAULT.modules,...(x.modules||{})},
   commands:{...DEFAULT.commands,...(x.commands||{})},
   groups:{...DEFAULT.groups,...(x.groups||{})}
  };
 }catch(e){
  console.error("Config:",e.message);
  return JSON.parse(JSON.stringify(DEFAULT));
 }
}

function saveConfig(){
 try{fs.writeFileSync(CONFIG_FILE,JSON.stringify(CFG,null,2))}
 catch(e){console.error("Config save:",e.message)}
}

function norm(x){
 return String(x||"").toLowerCase().trim().replace(/^!/,"");
}

function getCmd(x){
 x=norm(x);
 return Commands.get(x)||Commands.get(Aliases.get(x));
}

function cmdOn(x){
 return CFG.commands[norm(x)]!==false;
}

function modOn(x){
 return CFG.modules[x]!==false;
}

function register(c,m){
 if(!c||!c.name||typeof c.execute!=="function")return;

 const n=norm(c.name);

 if(Commands.has(n)){
  console.log("⚠️ Duplicate:",n);
  return;
 }

 c.name=n;
 c.module=c.module||m;
 Commands.set(n,c);

 (c.aliases||[]).forEach(a=>{
  a=norm(a);
  if(a&&!Commands.has(a)&&!Aliases.has(a))Aliases.set(a,n);
 });
}

/* 🧩 AUTOMATIC COMMAND LOADER
   Add cmds_9.js, cmds_10.js, etc.
   No index.js changes required. */
function loadCommands(){
 Commands.clear();
 Aliases.clear();

 const dir=path.join(__dirname,"commands");

 if(!fs.existsSync(dir))
  fs.mkdirSync(dir,{recursive:true});

 const files=fs.readdirSync(dir)
  .filter(x=>/^cmds_\d+\.js$/i.test(x))
  .sort((a,b)=>{
   return Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]);
  });

 for(const file of files){
  const m=file.replace(/\.js$/i,"");

  try{
   const f=path.join(dir,file);
   delete require.cache[require.resolve(f)];

   const x=require(f);

   if(Array.isArray(x)){
    x.forEach(c=>register(c,m));
   }else if(x?.name&&typeof x.execute==="function"){
    register(x,m);
   }else if(x&&typeof x==="object"){
    Object.entries(x).forEach(([n,c])=>{
     if(typeof c==="function")
      register({name:n,execute:c},m);
     else if(c?.execute)
      register({...c,name:c.name||n},m);
    });
   }

   if(CFG.modules[m]===undefined)CFG.modules[m]=true;

   console.log("✅",file,"loaded");
  }catch(e){
   console.error(`❌ ${file}:`,e.message);
  }
 }

 saveConfig();
 console.log("📚 Commands:",Commands.size);
}

/* ↩️ DIRECT REPLY
   Uses the triggering message ID so Messenger can attach
   the bot response to the original message. */
function send(e,msg){
 if(!e||msg===undefined||msg===null||CFG.replies===false)return;

 try{
  const text=String(msg);

  api.sendMessage(
   text,
   e.threadID,
   ()=>{},
   e.messageID
  );
 }catch(x){
  console.error("Send:",x.message);
 }
}

/* ❤️ AUTO REACTION + ANTI-SPAM */
function react(e,emoji=CFG.autoReact||"👍"){
 if(!e||CFG.reactions===false||!emoji)return;

 const key=`${e.threadID}:${e.messageID}`;
 const now=Date.now();
 const wait=+(CFG.reactCooldown||2500);

 if(now-(ReactCD.get(key)||0)<wait)return;
 ReactCD.set(key,now);

 try{
  if(typeof api.setMessageReactionMqtt==="function"){
   api.setMessageReactionMqtt(
    emoji,
    e.messageID,
    e.threadID,
    ()=>{}
   );
  }else if(typeof api.setMessageReaction==="function"){
   api.setMessageReaction(
    emoji,
    e.messageID,
    e.threadID,
    ()=>{}
   );
  }
 }catch(_){}
}

/* 👤 REAL FACEBOOK PROFILE */
function profile(uid){
 return new Promise(resolve=>{
  uid=String(uid||"");

  try{
   api.getUserInfo(uid,(err,info)=>{
    const u=!err&&info?info[uid]||{}:{};

    resolve({
     uid,
     id:uid,
     name:u.name||u.fullName||u.firstName||"Unknown User",
     firstName:u.firstName||u.name||"User",
     vanity:u.vanity||null,
     photo:u.thumbSrc||u.thumbSrcBig||u.profilePic||null,
     profileUrl:u.profileUrl||null
    });
   });
  }catch(e){
   resolve({
    uid,id:uid,name:"Unknown User",
    firstName:"User",vanity:null,
    photo:null,profileUrl:null
   });
  }
 });
}

/* 👥 GROUP CONFIG */
function groupConfig(threadID){
 CFG.groups=CFG.groups||{};

 if(!CFG.groups[threadID])
  CFG.groups[threadID]={enabled:true};

 return CFG.groups[threadID];
}

function groupOn(threadID){
 return groupConfig(threadID).enabled!==false;
}

/* 📥 PENDING GC HELPERS */
function pendingGCList(callback){
 if(!api||typeof api.getThreadList!=="function")
  return callback(new Error("getThreadList unavailable"));

 try{
  api.getThreadList(100,0,[],(err,list)=>{
   if(err)return callback(err);

   const pending=(list||[]).filter(x=>{
    const folder=String(x.folder||"").toLowerCase();
    const type=String(x.threadType||"").toLowerCase();

    return folder.includes("pending")||
           type.includes("pending");
   });

   callback(null,pending);
  });
 }catch(e){callback(e)}
}

/* 📋 MENU */
function menu(){
 return `╭━━ 🤖 KLERK COMMUNITY BOT ━━╮
┃ 1️⃣ 🏆 Progression / World
┃ 2️⃣ 🐾 Pets / Farming
┃ 3️⃣ 💰 Economy / Market
┃ 4️⃣ 🚗 GTA / Crime / Vehicles
┃ 5️⃣ 🎰 Casino / Social
┃ 6️⃣ 🤖 AI Systems
┃ 7️⃣ 👑 Admin / Utilities
┃ 8️⃣ ⚔️ War / Crafting
╰━━━━━━━━━━━━━━━━━━━━━━╯
📌 ${CFG.prefix}menu 1-8
📌 ${CFG.prefix}help <command>
📌 ${CFG.prefix}uid
📌 ${CFG.prefix}me
📌 ${CFG.prefix}status`;
}

/* 📚 CATEGORY */
function category(n){
 const m=`cmds_${n}`;

 if(!modOn(m))
  return `🚫 ${m} is disabled.`;

 const a=[];

 for(const [name,c] of Commands){
  if(c.module===m)
   a.push(`${CFG.prefix}${name}${c.description?" — "+c.description:""}`);
 }

 return `╭━━ 📚 ${m.toUpperCase()} ━━╮
${a.length?a.join("\n"):"📭 Empty"}
╰━━ ${a.length} commands ━━╯`;
}

/* 📖 HELP */
function help(n){
 const c=getCmd(n);

 if(!c)
  return `❌ Unknown command.\nUse ${CFG.prefix}menu`;

 return `╭━━ 📖 HELP ━━╮
⚡ ${CFG.prefix}${c.name}
📦 ${c.module}
📝 ${c.description||"No description"}
${c.aliases?.length?"🔗 "+c.aliases.map(x=>CFG.prefix+x).join(", "):""}
${c.usage?"\n📌 "+c.usage:""}
╰━━━━━━━━━━━━╯`;
}

/* 📊 STATUS */
function status(){
 let on=0;

 for(const c of Commands.values())
  if(cmdOn(c.name))on++;

 return `╭━━ 📊 BOT STATUS ━━╮
🤖 Bot: ${CFG.botEnabled?"🟢 ON":"🔴 OFF"}
🛠️ Maintenance: ${CFG.maintenance?"🟠 ON":"🟢 OFF"}
📚 Commands: ${Commands.size}
✅ Enabled: ${on}
❤️ Reactions: ${CFG.reactions?"ON":"OFF"}
💬 Replies: ${CFG.replies?"ON":"OFF"}
👥 GC Control: ON
🧩 Dynamic Commands: ON
👑 Admin: ${ADMIN_ID}
╰━━━━━━━━━━━━━━━━╯`;
}

/* 🆔 UID / PROFILE */
async function profileMessage(e){
 const uid=e.senderID||e.author||e.userID;
 const u=await profile(uid);

 return `╭━━ 👤 FACEBOOK PROFILE ━━╮
👤 Name: ${u.name}
🆔 UID: ${u.uid}
📛 First name: ${u.firstName}
${u.vanity?`🔗 Username: ${u.vanity}`:""}
📸 Profile: ${u.photo||"Unavailable"}
${u.profileUrl?`🌐 ${u.profileUrl}`:""}
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

/* 📥 PENDING GC COMMAND */
async function pendingGCMessage(e){
 if(String(e.senderID)!==String(ADMIN_ID))
  return send(e,"❌ Admin only.");

 pendingGCList((err,list)=>{
  if(err)
   return send(e,`❌ Pending GC lookup unavailable: ${err.message}`);

  if(!list.length)
   return send(e,"📭 No pending GC found.");

  let out="╭━━ 📥 PENDING GC ━━╮\n";

  list.slice(0,30).forEach((g,i)=>{
   out+=`┃ ${i+1}. ${g.name||"Unnamed GC"}\n`;
   out+=`┃ 🆔 ${g.threadID}\n`;
  });

  out+="╰━━━━━━━━━━━━━━━━╯";

  send(e,out);
 });
}

/* 🎯 MAIN HANDLER */
async function handle(e){
 if(!e)return;
 if(e.type!=="message"&&e.type!=="message_reply")return;

 const body=e.body||e.message?.body||"";
 if(!body||!String(body).trim().startsWith(CFG.prefix))return;

 const p=String(body).trim()
  .slice(CFG.prefix.length)
  .split(/\s+/);

 const name=norm(p.shift());
 const args=p;
 const uid=e.senderID||e.author||e.userID;

 if(!name)return;

 const isAdmin=String(uid)===String(ADMIN_ID);

 /* 🆔 QUICK UID */
 if(name==="uid"||name==="myuid"){
  return send(e,`🆔 Facebook UID: ${uid}`);
 }

 /* 👤 REAL PROFILE */
 if(name==="me"||name==="profile"||name==="myprofile"||name==="whoami"){
  return send(e,await profileMessage(e));
 }

 /* 📥 PENDING GC */
 if(name==="pendinggc"||name==="pendinggcs"){
  return pendingGCMessage(e);
 }

 /* 📚 MENU */
 if(name==="menu"||name==="commands"){
  const n=+args[0];
  return send(e,n>=1&&n<=8?category(n):menu());
 }

 /* 📖 HELP */
 if(name==="help")
  return send(e,args[0]?help(args[0]):menu());

 /* 📊 STATUS */
 if(name==="status"||name==="botstatus")
  return send(e,status());

 /* 🤖 BOT GLOBAL CONTROL */
 if(!CFG.botEnabled&&!isAdmin)
  return send(e,"🔴 Bot is disabled.");

 if(CFG.maintenance&&!isAdmin)
  return send(e,"🛠️ Maintenance mode.");

 /* 👥 GC CONTROL */
 if(!groupOn(e.threadID)&&!isAdmin)
  return;

 const c=getCmd(name);

 if(!c)
  return send(e,`❌ Unknown command: ${CFG.prefix}${name}\n📌 Use ${CFG.prefix}menu`);

 if(!modOn(c.module)&&!isAdmin)
  return send(e,`🚫 ${c.module} is disabled.`);

 if(!cmdOn(c.name)&&!isAdmin)
  return send(e,`🚫 ${CFG.prefix}${c.name} is disabled.`);

 if(c.adminOnly&&!isAdmin)
  return send(e,"⛔ Admin permission required.");

 /* ⏱️ COMMAND COOLDOWN */
 const cd=+(c.cooldown||c.cooldownSeconds||0);

 if(cd&&!isAdmin){
  const k=uid+":"+c.name;
  const last=Cooldowns.get(k)||0;
  const remain=cd-(Date.now()-last)/1000;

  if(remain>0)
   return send(e,`⏳ Wait ${Math.ceil(remain)}s.`);

  Cooldowns.set(k,Date.now());
 }

 /* ❤️ REACTION */
 if(CFG.reactions&&c.autoReact!==false)
  react(e,c.reaction||CFG.autoReact||"👍");

 /* 👤 FETCH REAL FACEBOOK DATA */
 const user=await profile(uid);

 /* 🧰 SHARED COMMAND CONTEXT */
 const ctx={
  api,
  event:e,
  args,
  tokens:args,
  command:c.name,

  adminID:ADMIN_ID,
  isAdmin,
  uid:user.uid,

  user,
  username:user.name,
  name:user.name,
  firstName:user.firstName,
  photo:user.photo,
  profileUrl:user.profileUrl,

  prefix:CFG.prefix,
  config:CFG,

  /* 🌐 Axios */
  axios,

  /* 🖼️ Canvas */
  canvas,

  /* ↩️ Direct reply */
  reply:x=>send(e,x),

  /* ❤️ Reaction */
  react:x=>react(e,x),

  /* 👤 Profile lookup */
  getProfile:id=>profile(id),

  /* 💾 Config */
  saveConfig,

  /* 👥 GC helpers */
  groupConfig:()=>groupConfig(e.threadID),
  groupOn:()=>groupOn(e.threadID),

  /* 📥 Pending GC */
  pendingGC:(cb)=>pendingGCList(cb),

  /* 📚 Command registry */
  commands:Commands,
  aliases:Aliases
 };

 try{
  /*
   New commands use:
   execute:async c=>{}

   Older commands using:
   execute(api,event,args,ADMIN_ID)

   are still supported.
  */
  if(c.execute.length<=1)
   await c.execute(ctx);
  else
   await c.execute(api,e,args,ADMIN_ID);

 }catch(x){
  console.error(`❌ ${c.name}:`,x);
  send(e,`❌ Error running ${CFG.prefix}${c.name}.`);
 }
}

/* 🌐 WEB SERVER */
const app=express();

app.get("/",(_,r)=>
 r.send("🤖 Klerk Messenger Community Bot Online")
);

app.get("/status",(_,r)=>r.json({
 online:true,
 commands:Commands.size,
 maintenance:CFG.maintenance,
 uptime:process.uptime()
}));

app.listen(PORT,()=>console.log("🌐 Port:",PORT));

/* 🚀 START */
function start(){
 console.log("🚀 Starting Klerk Bot...");
 console.log("👑 Admin:",ADMIN_ID);

 loadCommands();

 login({appState:APPSTATE},(err,a)=>{
  if(err){
   console.error("❌ Login failed:",err);
   return;
  }

  api=a;

  console.log("✅ Facebook login successful");
  console.log("📚 Commands:",Commands.size);
  console.log("👑 Admin:",ADMIN_ID);

  api.setOptions({
   listenEvents:true,
   selfListen:false,
   autoMarkRead:true,
   online:true
  });

  api.listenMqtt((err,e)=>{
   if(err){
    console.error("MQTT:",err);
    return;
   }

   handle(e);
  });
 });
}

/* 🛡️ CRASH PROTECTION */
process.on("uncaughtException",e=>
 console.error("💥 Uncaught:",e)
);

process.on("unhandledRejection",e=>
 console.error("💥 Rejection:",e)
);

start();
