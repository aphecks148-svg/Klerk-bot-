const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios"),FCA=require("ws3-fca");
require("dotenv").config();

const login=typeof FCA==="function"?FCA:FCA.login;
let api=null;

const PORT=Number(process.env.PORT||1000);
const PREFIX=String(process.env.PREFIX||"!");
const ADMIN_ID=String(process.env.ADMIN_ID||"");
const APPSTATE=process.env.APPSTATE||null;

const CFG={
 prefix:PREFIX,botEnabled:true,maintenance:false,replies:true,reactions:true,
 autoReact:process.env.AUTO_REACT||"👍",
 reactCooldown:Number(process.env.REACT_COOLDOWN||2500)
};

const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={});
R.players=R.players||new Map();
R.staff=R.staff||new Map();
R.pending=R.pending||new Map();
R.commands=R.commands||new Map();
R.cooldowns=R.cooldowns||new Map();

const app=express();
app.get("/",(_,res)=>res.json({bot:"KLERK COMMUNITY BOT",status:"ACTIVE",commands:R.commands.size,prefix:PREFIX}));
app.get("/status",(_,res)=>res.json({status:"online",commands:R.commands.size,uptime:process.uptime()}));
app.listen(PORT,()=>console.log(`🌐 KLERK online :${PORT}`));

function sid(x){return x==null?null:(typeof x==="string"?x:String(x));}
function uid(e){return sid(e?.senderID||e?.author||e?.userID)||"";}

function send(e,msg,tag=true){
 if(!api||!CFG.replies||msg==null)return false;
 const tid=sid(e?.threadID);
 const mid=sid(e?.messageID);
 if(!tid){
  console.log("❌ SEND: missing threadID");
  return false;
 }
 const text=String(msg);
 const cb=err=>{
  if(err)console.log("❌ SEND CALLBACK:",err.message||err);
  else console.log(`📤 REPLY SENT → ${tid}`);
 };
 try{
  if(tag&&mid){
   api.sendMessage(text,tid,cb,mid);
  }else{
   api.sendMessage(text,tid,cb);
  }
  return true;
 }catch(err){
  console.log("❌ SEND ERROR:",err.message||err);
  try{
   api.sendMessage(text,tid,cb);
   return true;
  }catch(x){
   console.log("❌ SEND RETRY FAILED:",x.message||x);
   return false;
  }
 }
}

function react(e,emoji=CFG.autoReact){
 if(!api||!CFG.reactions)return;
 const mid=sid(e?.messageID);
 if(!mid)return;
 try{
  if(typeof api.setMessageReactionMqtt==="function"){
   api.setMessageReactionMqtt(String(emoji),mid,()=>{},true);
  }else if(typeof api.setMessageReaction==="function"){
   api.setMessageReaction(String(emoji),mid,()=>{},true);
  }
 }catch(err){console.log("⚠️ REACTION:",err.message||err)}
}

function box(title,body,foot="💡 Use !menu to explore"){
 return `╭━━━━━━━━━━━━━━━━━━━━╮\n┃ ${title}\n╰━━━━━━━━━━━━━━━━━━━━╯\n${body}\n\n╰━━〔 ${foot} 〕━━╯`;
}

function bar(n,max=10){
 n=Math.max(0,Math.min(max,Number(n)||0));
 return "▰".repeat(n)+"▱".repeat(max-n);
}

function menu(page=0){
 const groups=[
  ["📈 PROGRESSION & WORLD",1],
  ["🐾 PETS & FARMING",2],
  ["💰 ECONOMY & MARKET",3],
  ["🚗 GTA & CRIME",4],
  ["🎰 CASINO & SOCIAL",5],
  ["🧠 AI & GEMINI",6],
  ["👑 ADMIN & UTILITIES",7],
  ["⚔️ COMBAT & ADVENTURES",8]
 ];

 let s=`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🤖 K L E R K  B O T ┃
┃ ⚡ COMMUNITY RPG ⚡ ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

👋 Welcome to KLERK COMMUNITY!

💰 Economy • 🐾 Pets • ⚔️ Combat
🚗 GTA • 🎰 Casino • 🧠 AI

╭──〔 📚 COMMAND CENTER 〕──╮
`;

 groups.forEach((g,i)=>s+=`│ ${i+1}️⃣ ${g[0]}\n`);

 s+=`╰──────────────────────────╯

🔎 ${PREFIX}search <command>
📖 ${PREFIX}help <command>
👤 ${PREFIX}me
🏓 ${PREFIX}ping
📋 ${PREFIX}allcmds

📦 Loaded Commands: ${R.commands.size}
⚡ ${bar(Math.min(10,Math.ceil(R.commands.size/100)),10)}

💡 ${PREFIX}menu 1 — ${PREFIX}menu 8`;

 if(page){
  const g=groups[page-1];
  if(!g)return s;

  const list=[...R.commands.values()]
   .filter(x=>Number(x.module)===page)
   .sort((a,b)=>a.name.localeCompare(b.name));

  s+=`\n\n╭──〔 ${g[0]} 〕──╮\n`;
  list.slice(0,40).forEach((x,i)=>{
   s+=`│ ${String(i+1).padStart(2,"0")} • ${PREFIX}${x.name}\n`;
  });
  s+=`╰────────────────────╯\n📦 ${list.length} commands`;
 }

 return s;
}

function help(name){
 const n=String(name||"").toLowerCase();
 const x=R.commands.get(n);

 if(!x){
  return box(
   "❓ COMMAND NOT FOUND",
   `🚫 ${PREFIX}${name||""} doesn't exist.

🔎 Try: ${PREFIX}search ${name||"command"}
📚 Or: ${PREFIX}menu`
  );
 }

 return box(
  `📖 ${PREFIX}${x.name.toUpperCase()}`,
  `⚡ Command: ${PREFIX}${x.name}
📦 Module: cmds_${x.module}.js
🟢 Status: READY

${x.description||"Klerk community command ready."}`,
  `🚀 ${PREFIX}${x.name}`
 );
}

function search(q){
 q=String(q||"").toLowerCase().trim();

 if(!q){
  return box(
   "🔎 COMMAND SEARCH",
   `Type a command name.

Example:
${PREFIX}search pet
${PREFIX}search bank
${PREFIX}search gta`
  );
 }

 const a=[...R.commands.values()]
  .filter(x=>x.name.includes(q))
  .sort((x,y)=>x.name.localeCompare(y.name));

 if(!a.length){
  return box("🔎 NO MATCH",`Nothing found for "${q}".\n\n📚 Try ${PREFIX}menu`);
 }

 return box(
  "🔎 SEARCH RESULTS",
  a.slice(0,40).map((x,i)=>`${i+1}️⃣ ${PREFIX}${x.name} • M${x.module}`).join("\n"),
  `📦 ${a.length} matches`
 );
}

function register(name,fn,module,description=""){
 name=String(name||"").toLowerCase().trim();

 if(!name||typeof fn!=="function")return false;

 if(R.commands.has(name)){
  console.log(`⚠️ DUPLICATE SKIPPED: ${name}`);
  return false;
 }

 R.commands.set(name,{name,run:fn,module,description});
 return true;
}

function loadCommands(){
 R.commands.clear();

 const dir=path.join(__dirname,"commands");

 if(!fs.existsSync(dir)){
  console.log("❌ commands/ folder missing");
  return;
 }

 const files=fs.readdirSync(dir)
  .filter(f=>/^cmds_\d+\.js$/i.test(f))
  .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));

 for(const file of files){
  const mod=Number(file.match(/\d+/)[0]);

  try{
   const full=path.join(dir,file);
   delete require.cache[require.resolve(full)];

   const out=require(full);

   const list=Array.isArray(out)
    ?out
    :(Array.isArray(out?.commands)
      ?out.commands
      :Object.entries(out||{}).map(([name,run])=>({name,run})));

   let loaded=0;

   for(const c of list){
    let ok=false;

    if(typeof c==="function"&&c.name){
     ok=register(c.name,c,mod);
    }else if(c&&typeof c.run==="function"){
     ok=register(c.name,c.run,mod,c.description);
    }else if(c&&typeof c.handler==="function"){
     ok=register(c.name,c.handler,mod,c.description);
    }else if(c&&typeof c.execute==="function"){
     ok=register(c.name,c.execute,mod,c.description);
    }

    if(ok)loaded++;
   }

   console.log(`📦 ${file} loaded • ${loaded} commands`);
  }catch(e){
   console.log(`❌ ${file}:`,e.stack||e.message);
  }
 }

 console.log(`✅ KLERK COMMANDS: ${R.commands.size}`);
}

function profile(e){
 const id=uid(e);

 return box(
  "👤 YOUR PROFILE",
  `🆔 UID: ${id}
💬 Thread: ${sid(e?.threadID)||"Unknown"}
⚡ Status: ONLINE`
 );
}

function cooldown(id){
 const now=Date.now();
 const last=R.cooldowns.get(id)||0;

 if(now-last<CFG.reactCooldown)return false;

 R.cooldowns.set(id,now);
 return true;
}

function autoReact(e){
 const id=uid(e);
 if(id&&cooldown(id))react(e);
}

async function runCommand(e,name,args){
 const c=R.commands.get(name);
 if(!c)return false;

 console.log(`⚡ COMMAND: ${PREFIX}${name} | UID:${uid(e)} | THREAD:${sid(e.threadID)}`);

 try{
  const ctx={
   ...e,
   args,
   uid:uid(e),
   senderID:uid(e),
   author:uid(e),
   name:e?.senderName||e?.name||"",
   send:(m)=>send(e,m,false),
   reply:(m)=>send(e,m,true),
   api,
   config:CFG,
   registry:R
  };

  const result=c.run(ctx);

  if(result&&typeof result.then==="function"){
   await result;
  }

  console.log(`✅ COMMAND COMPLETE: ${PREFIX}${name}`);
 }catch(err){
  console.log(`❌ ${name}:`,err.stack||err.message||err);

  send(
   e,
   box(
    "❌ COMMAND ERROR",
    `⚠️ ${PREFIX}${name} could not complete.

🛠️ ${err.message||"Unknown error"}`
   ),
   true
  );
 }

 return true;
}

function globalCommand(e,name,args){
 const n=String(name||"").toLowerCase();

 if(n==="menu"){
  send(e,menu(Number(args[0])||0),true);
  return true;
 }

 if(n==="allcmds"||n==="commands"){
  send(e,box(
   "📋 ALL COMMANDS",
   `📦 ${R.commands.size} commands loaded.

Use:
${PREFIX}menu 1
${PREFIX}menu 2
${PREFIX}menu 3
${PREFIX}menu 4
${PREFIX}menu 5
${PREFIX}menu 6
${PREFIX}menu 7
${PREFIX}menu 8

🔎 ${PREFIX}search <command>
📖 ${PREFIX}help <command>`
  ),true);
  return true;
 }

 if(n==="search"){
  send(e,search(args.join(" ")),true);
  return true;
 }

 if(n==="help"){
  send(e,help(args[0]),true);
  return true;
 }

 if(n==="ping"){
  send(e,box(
   "🏓 PONG",
   `⚡ Klerk is alive!

🟢 Engine: ONLINE
🟢 Commands: ${R.commands.size}
🟢 Messenger: CONNECTED
🟢 MQTT: CONNECTED`,
   `⏱️ ${Math.round(process.uptime())}s uptime`
  ),true);
  return true;
 }

 if(n==="status"){
  send(e,box(
   "📊 KLERK STATUS",
   `🟢 Bot: ONLINE
🟢 Commands: ${R.commands.size}
🟢 Prefix: ${PREFIX}
🟢 Uptime: ${Math.floor(process.uptime())}s
🟢 MQTT: CONNECTED

${bar(10)}`
  ),true);
  return true;
 }

 if(n==="me"||n==="profile"||n==="uid"){
  send(e,profile(e),true);
  return true;
 }

 if(n==="reloadcmds"){
  if(ADMIN_ID&&uid(e)!==ADMIN_ID){
   send(e,box("🔒 ACCESS DENIED","👑 Admin only."),true);
   return true;
  }

  loadCommands();

  send(
   e,
   box("🔄 COMMANDS RELOADED",`✅ ${R.commands.size} commands available.`),
   true
  );

  return true;
 }

 if(n==="reply"){
  send(e,args.join(" ")||"💬 Reply received.",true);
  return true;
 }

 return false;
}

function onMessage(e){
 if(!e)return;

 console.log(
  `📩 EVENT type=${e.type||"unknown"} body=${JSON.stringify(e.body||"")}`
 );

 if(!e.body)return;

 const text=String(e.body).trim();
 if(!text)return;

 if(!text.startsWith(PREFIX))return;

 console.log(`📨 KLERK COMMAND RECEIVED: ${text}`);

 autoReact(e);

 if(!CFG.botEnabled)return;

 if(CFG.maintenance&&uid(e)!==ADMIN_ID){
  send(
   e,
   box("🛠️ MAINTENANCE","Klerk is temporarily offline for maintenance."),
   true
  );
  return;
 }

 const raw=text.slice(PREFIX.length).trim();

 if(!raw)return;

 const p=raw.split(/\s+/);
 const name=String(p.shift()||"").toLowerCase();
 const args=p;

 console.log(`🔎 PARSED → command=${name} args=${JSON.stringify(args)}`);

 if(globalCommand(e,name,args))return;

 runCommand(e,name,args).catch(err=>{
  console.log("❌ DISPATCH:",err.message||err);
 });
}

function start(){
 if(!APPSTATE){
  console.log("❌ APPSTATE missing");
  return;
 }

 let state;

 try{
  state=JSON.parse(APPSTATE);
 }catch(err){
  console.log("❌ APPSTATE JSON ERROR:",err.message);
  return;
 }

 console.log("🔐 Starting Messenger login...");

 login(
  {appState:state},
  (err,logged)=>{
   if(err){
    console.log("❌ LOGIN ERROR:",err.stack||err.message||err);
    return;
   }

   api=logged;

   console.log("✅ KLERK LOGIN SUCCESS");

   try{
    api.setOptions?.({
     listenEvents:true,
     selfListen:false
    });
   }catch(err){
    console.log("⚠️ setOptions:",err.message);
   }

   console.log("👂 KLERK LISTENER STARTING...");

   api.listenMqtt((err,e)=>{
    if(err){
     console.log("❌ MQTT ERROR:",err.message||err);
     return;
    }

    try{
     if(!e){
      console.log("⚠️ EMPTY MQTT EVENT");
      return;
     }

     /*
      * IMPORTANT:
      * Do NOT require e.type === "message".
      * If Messenger supplies a body, process it.
      */
     if(e.body){
      onMessage(e);
      return;
     }

     if(e.type==="event"&&e.logMessageType==="log:subscribe"){
      console.log("👋 MEMBER EVENT");
      return;
     }

     if(e.type==="event"){
      console.log(`📡 EVENT: ${e.logMessageType||"unknown"}`);
     }
    }catch(x){
     console.log("❌ EVENT HANDLER:",x.stack||x.message||x);
    }
   });

   console.log("🟢 KLERK MQTT LISTENER ACTIVE");
  }
 );
}

loadCommands();
start();

setInterval(async()=>{
 try{
  const r=await axios.get(
   "https://pokeapi.co/api/v2/pokemon/"+(Math.floor(Math.random()*151)+1)
  );
  const p=r.data;
  console.log(`🐾 Pokémon spawn: ${p.name}`);
 }catch{}
},20*60*1000);

process.on("uncaughtException",e=>console.log("⚠️ UNCAUGHT:",e.stack||e.message));
process.on("unhandledRejection",e=>console.log("⚠️ REJECTION:",e?.stack||e?.message||e));
