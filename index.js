const fs=require("fs"),path=require("path"),express=require("express"),axios=require("axios"),FCA=require("ws3-fca");
require("dotenv").config();

const login=typeof FCA==="function"?FCA:FCA.login;
let api=null;
const PORT=Number(process.env.PORT||1000),PREFIX=process.env.PREFIX||"!";
const ADMIN_ID=String(process.env.ADMIN_ID||"");
const APPSTATE=process.env.APPSTATE||null;

const CFG={
 prefix:PREFIX,botEnabled:true,maintenance:false,replies:true,reactions:true,
 autoReact:process.env.AUTO_REACT||"👍",reactCooldown:Number(process.env.REACT_COOLDOWN||2500)
};

const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={});
R.players=R.players||new Map();R.staff=R.staff||new Map();R.pending=R.pending||new Map();
R.commands=R.commands||new Map();R.cooldowns=R.cooldowns||new Map();

const app=express();
app.get("/",(_,res)=>res.json({bot:"KLERK COMMUNITY BOT",status:"ACTIVE",commands:R.commands.size,prefix:PREFIX}));
app.get("/status",(_,res)=>res.json({status:"online",commands:R.commands.size,uptime:process.uptime()}));
app.listen(PORT,()=>console.log(`🌐 KLERK online :${PORT}`));

function sid(x){return x==null?null:(typeof x==="string"?x:String(x));}

function send(e,msg,tag=true){
 if(!api||!CFG.replies||msg==null)return;
 const tid=sid(e?.threadID),mid=sid(e?.messageID);
 if(!tid)return;
 const text=String(msg),cb=err=>err&&console.log("❌ SEND:",err.message||err);
 try{tag&&mid?api.sendMessage(text,tid,cb,mid):api.sendMessage(text,tid,cb)}
 catch(err){try{api.sendMessage(text,tid,cb)}catch(x){console.log("❌ SEND FAILED:",x.message)}}
}

function react(e,emoji=CFG.autoReact){
 if(!api||!CFG.reactions)return;
 const mid=sid(e?.messageID);if(!mid)return;
 try{
  if(typeof api.setMessageReactionMqtt==="function")api.setMessageReactionMqtt(String(emoji),mid,()=>{},true);
  else if(typeof api.setMessageReaction==="function")api.setMessageReaction(String(emoji),mid,()=>{},true);
 }catch{}
}

function box(title,body,foot="💡 Use !menu to explore"){
 return `╭━━━━━━━━━━━━━━━━━━━━╮\n┃ ${title}\n╰━━━━━━━━━━━━━━━━━━━━╯\n${body}\n\n╰━━〔 ${foot} 〕━━╯`;
}

function bar(n,max=10){
 n=Math.max(0,Math.min(max,n));
 return "▰".repeat(n)+"▱".repeat(max-n);
}

function menu(page=0){
 const groups=[
  ["📈 PROGRESSION & WORLD",1],["🐾 PETS & FARMING",2],["💰 ECONOMY & MARKET",3],
  ["🚗 GTA & CRIME",4],["🎰 CASINO & SOCIAL",5],["🧠 AI & GEMINI",6],
  ["👑 ADMIN & UTILITIES",7],["⚔️ COMBAT & ADVENTURES",8]
 ];
 let s="╭━━━━━━━━━━━━━━━━━━━━━━╮\n┃ 🤖 K L E R K  B O T ┃\n┃ ⚡ COMMUNITY RPG ⚡ ┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n👋 Welcome to the community!\n\n";
 groups.forEach((g,i)=>s+=`${i+1}️⃣ ${g[0]}\n`);
 s+=`\n╭──〔 📚 COMMAND CENTER 〕──╮\n│ 🔎 ${PREFIX}search <command>\n│ 📖 ${PREFIX}help <command>\n│ 👤 ${PREFIX}me\n│ 🏓 ${PREFIX}ping\n│ 📋 ${PREFIX}allcmds\n╰──────────────────────────╯\n\n📊 Loaded Commands: ${R.commands.size}\n⚡ ${bar(Math.min(10,Math.ceil(R.commands.size/100)),10)}\n\n💡 ${PREFIX}menu 1 — ${PREFIX}menu 8`;
 if(page){
  const g=groups[page-1],list=[...R.commands.values()].filter(x=>Number(x.module)===page);
  const start=0,end=Math.min(30,list.length);
  s+=`\n\n╭──〔 ${g[0]} 〕──╮\n`;
  list.slice(start,end).forEach((x,i)=>s+=`│ ${String(i+1).padStart(2,"0")} • ${PREFIX}${x.name}\n`);
  s+=`╰────────────────────╯\n📦 ${list.length} commands`;
 }
 return s;
}

function help(name){
 const x=R.commands.get(String(name||"").toLowerCase());
 if(!x)return box("❓ COMMAND NOT FOUND",`🚫 ${PREFIX}${name||""} doesn't exist.\n\n🔎 Try: ${PREFIX}search ${name||"command"}\n📚 Or: ${PREFIX}menu`);
 return box(`📖 ${PREFIX}${x.name.toUpperCase()}`,
  `⚡ Command: ${PREFIX}${x.name}\n📦 Module: cmds_${x.module}.js\n🛠️ Status: ${x.run?"READY":"LOADED"}\n\n${x.description||"Klerk community command ready."}`,
  `🚀 ${PREFIX}${x.name}`);
}

function search(q){
 q=String(q||"").toLowerCase().trim();
 if(!q)return box("🔎 COMMAND SEARCH","Type a command name.\n\nExample:\n!search pet\n!search bank\n!search gta");
 const a=[...R.commands.values()].filter(x=>x.name.includes(q));
 if(!a.length)return box("🔎 NO MATCH",`Nothing found for "${q}".\n\n📚 Try ${PREFIX}menu`);
 return box("🔎 SEARCH RESULTS",a.slice(0,40).map((x,i)=>`${i+1}️⃣ ${PREFIX}${x.name}  •  M${x.module}`).join("\n"),`📦 ${a.length} matches`);
}

function register(name,fn,module,description=""){
 name=String(name||"").toLowerCase().trim();
 if(!name||typeof fn!=="function")return false;
 if(R.commands.has(name)){console.log(`⚠️ DUPLICATE SKIPPED: ${name}`);return false}
 R.commands.set(name,{name,run:fn,module,description});
 return true;
}

function loadCommands(){
 R.commands.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){console.log("❌ commands/ folder missing");return}
 const files=fs.readdirSync(dir).filter(f=>/^cmds_\d+\.js$/i.test(f)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
 for(const file of files){
  const mod=Number(file.match(/\d+/)[0]);
  try{
   const full=path.join(dir,file);
   delete require.cache[require.resolve(full)];
   const out=require(full);
   const list=Array.isArray(out)?out:(Array.isArray(out?.commands)?out.commands:Object.entries(out||{}).map(([name,run])=>({name,run})));
   for(const c of list){
    if(typeof c==="function"&&c.name)register(c.name,c,mod);
    else if(c&&typeof c.run==="function")register(c.name,c.run,mod,c.description);
    else if(c&&typeof c.handler==="function")register(c.name,c.handler,mod,c.description);
   }
   console.log(`📦 ${file} loaded`);
  }catch(e){console.log(`❌ ${file}:`,e.message)}
 }
 console.log(`✅ KLERK COMMANDS: ${R.commands.size}`);
}

function uid(e){return sid(e?.senderID||e?.author||e?.userID)||"";}

function profile(e){
 const id=uid(e);
 return box("👤 YOUR PROFILE",`🆔 UID: ${id}\n💬 Thread: ${sid(e?.threadID)||"Unknown"}\n⚡ Status: ONLINE`);
}

function cooldown(id){
 const now=Date.now(),last=R.cooldowns.get(id)||0;
 if(now-last<CFG.reactCooldown)return false;
 R.cooldowns.set(id,now);return true;
}

function autoReact(e){
 if(cooldown(uid(e)))react(e);
}

function runCommand(e,name,args){
 const c=R.commands.get(name);
 if(!c)return false;
 try{
  const ctx={...e,args,send:(m)=>send(e,m),reply:(m)=>send(e,m,true),api,config:CFG,registry:R};
  const result=c.run(ctx);
  if(result&&typeof result.then==="function")result.catch(err=>send(e,`❌ Command error: ${err.message}`));
 }catch(err){console.log(`❌ ${name}:`,err);send(e,`❌ ${name} failed.\n🛠️ ${err.message}`)}
 return true;
}

function globalCommand(e,name,args){
 const n=String(name||"").toLowerCase();
 if(n==="menu")return send(e,menu(args[0]||0));
 if(n==="allcmds"||n==="commands")return send(e,box("📋 ALL COMMANDS",`📦 ${R.commands.size} commands loaded.\n\nUse ${PREFIX}menu 1 through ${PREFIX}menu 8 to browse.\n\n🔎 ${PREFIX}search <command>\n📖 ${PREFIX}help <command>`));
 if(n==="search")return send(e,search(args.join(" ")));
 if(n==="help")return send(e,help(args[0]));
 if(n==="ping")return send(e,box("🏓 PONG","⚡ Klerk is alive!\n\n🟢 Engine: ONLINE\n🟢 Commands: READY\n🟢 Messenger: CONNECTED",`⏱️ ${Math.round(process.uptime())}s uptime`));
 if(n==="status")return send(e,box("📊 KLERK STATUS",`🟢 Bot: ONLINE\n🟢 Commands: ${R.commands.size}\n🟢 Prefix: ${PREFIX}\n🟢 Uptime: ${Math.floor(process.uptime())}s\n${bar(10)}`));
 if(n==="me"||n==="profile"||n==="uid")return send(e,profile(e));
 if(n==="reloadcmds"){
  if(ADMIN_ID&&uid(e)!==ADMIN_ID)return send(e,box("🔒 ACCESS DENIED","Admin only."));
  loadCommands();return send(e,box("🔄 COMMANDS RELOADED",`✅ ${R.commands.size} commands available.`));
 }
 if(n==="reply")return send(e,args.join(" ")||"💬 Reply received.",true);
 return false;
}

function onMessage(e){
 if(!e||!e.body)return;
 const text=String(e.body).trim();
 if(!text.startsWith(PREFIX))return;
 autoReact(e);
 if(!CFG.botEnabled)return;
 if(CFG.maintenance&&uid(e)!==ADMIN_ID)return send(e,box("🛠️ MAINTENANCE","Klerk is temporarily offline for maintenance."));
 const raw=text.slice(PREFIX.length).trim(),p=raw.split(/\s+/),name=String(p.shift()||"").toLowerCase(),args=p;
 if(globalCommand(e,name,args))return;
 if(runCommand(e,name,args))return;
 send(e,box("🤔 UNKNOWN COMMAND",`❌ ${PREFIX}${name} was not found.\n\n🔎 ${PREFIX}search ${name}\n📚 ${PREFIX}menu\n📖 ${PREFIX}help <command>`,"💡 Klerk Tip"));
}

function start(){
 if(!APPSTATE){console.log("❌ APPSTATE missing");return}
 login({appState:JSON.parse(APPSTATE)},(err,logged)=>{
  if(err)return console.log("❌ LOGIN ERROR:",err);
  api=logged;
  console.log("✅ KLERK LOGIN SUCCESS");
  api.setOptions?.({listenEvents:true,selfListen:false});
  api.listenMqtt((err,e)=>{
   if(err)return console.log("❌ MQTT:",err.message||err);
   try{
    if(e.type==="message")onMessage(e);
    else if(e.type==="event"&&e.logMessageType==="log:subscribe")console.log("👋 MEMBER EVENT");
   }catch(x){console.log("❌ EVENT:",x.message)}
  });
 });
}

loadCommands();
start();

setInterval(async()=>{
 try{
  const r=await axios.get("https://pokeapi.co/api/v2/pokemon/"+(Math.floor(Math.random()*151)+1));
  const p=r.data;
  console.log(`🐾 Pokémon spawn: ${p.name}`);
 }catch{}
},20*60*1000);

process.on("uncaughtException",e=>console.log("⚠️",e.message));
process.on("unhandledRejection",e=>console.log("⚠️",e?.message||e));
