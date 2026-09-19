"use strict";

require("dotenv").config();
const fs=require("fs");
const path=require("path");
const express=require("express");
const axios=require("axios");
const FCA=require("ws3-fca");

const login=typeof FCA==="function"?FCA:FCA.login;
const PORT=Number(process.env.PORT||1000);
const PREFIX=process.env.PREFIX||"!";
const ADMIN_ID=String(process.env.ADMIN_ID||"100086783504073");
const APPSTATE=process.env.APPSTATE;

if(!APPSTATE){
 console.error("❌ APPSTATE missing in Render Environment Variables");
 process.exit(1);
}

/* ───────── CONFIG ───────── */
const CFG={
 prefix:PREFIX,
 admin:ADMIN_ID,
 replies:true,
 reactions:true,
 autoReact:process.env.AUTO_REACT||"👍",
 reactCooldown:Number(process.env.REACT_COOLDOWN||2500),
 maintenance:false,
 botEnabled:true
};

/* ───────── COMMAND LOADER ───────── */
const CMD_DIR=path.join(__dirname,"commands");
const registry=new Map();
const aliases=new Map();

function loadCommands(){
 if(!fs.existsSync(CMD_DIR)){
  throw new Error("❌ commands/ directory not found");
 }

 const files=fs.readdirSync(CMD_DIR)
  .filter(f=>/^cmds_\d+\.js$/i.test(f))
  .sort((a,b)=>{
   const A=Number(a.match(/\d+/)[0]);
   const B=Number(b.match(/\d+/)[0]);
   return A-B;
  });

 if(!files.length)throw new Error("❌ No cmds_*.js files found");

 for(const file of files){
  const mod=require(path.join(CMD_DIR,file));
  const list=Array.isArray(mod)?mod:
   Array.isArray(mod.commands)?mod.commands:
   Object.values(mod);

  for(const cmd of list){
   if(!cmd||typeof cmd.execute!=="function"||!cmd.name)continue;

   const name=String(cmd.name).toLowerCase().trim();

   if(registry.has(name)){
    const old=registry.get(name);
    throw new Error(
     `❌ DUPLICATE COMMAND: ${name}\n`+
     `Existing: ${old._file}\n`+
     `Duplicate: ${file}`
    );
   }

   cmd.name=name;
   cmd.aliases=(cmd.aliases||[])
    .map(x=>String(x).toLowerCase().trim())
    .filter(Boolean);
   cmd.category=cmd.category||`cmds_${file.match(/\d+/)[0]}`;
   cmd.submenu=cmd.submenu||cmd.category;
   cmd._file=file;

   registry.set(name,cmd);

   for(const alias of cmd.aliases){
    if(registry.has(alias)||aliases.has(alias)){
     const old=registry.get(alias)||aliases.get(alias);
     throw new Error(
      `❌ DUPLICATE ALIAS: ${alias}\n`+
      `Existing: ${old._file}\n`+
      `Duplicate: ${file}`
     );
    }
    aliases.set(alias,cmd);
   }
  }
 }

 console.log(`✅ ${registry.size} commands loaded`);
 console.log(`📁 ${files.length} command modules loaded`);
}

loadCommands();

function getCommand(name){
 name=String(name||"").toLowerCase();
 return registry.get(name)||aliases.get(name);
}

/* ───────── EXPRESS / RENDER ───────── */
const app=express();
app.use(express.json({limit:"1mb"}));

app.get("/",(_,res)=>res.json({
 status:"ACTIVE",
 bot:"KLERK COMMUNITY BOT",
 commands:registry.size,
 modules:8,
 uptime:process.uptime()
}));

app.get("/health",(_,res)=>res.json({
 status:"ok",
 uptime:process.uptime(),
 commands:registry.size
}));

app.listen(PORT,()=>console.log(`🌐 Klerk running on port ${PORT}`));

/* ───────── RUNTIME ───────── */
let api=null;
const cooldowns=new Map();
const reactTimes=new Map();

function isAdmin(uid){
 return String(uid)===ADMIN_ID;
}

function send(e,text){
 if(!api||!e||text===undefined||text===null)return;
 try{
  api.sendMessage(
   String(text),
   e.threadID,
   ()=>{},
   e.messageID
  );
 }catch(err){
  console.error("SEND:",err.message);
 }
}

function react(e){
 if(!CFG.reactions||!api||!e)return;

 const key=String(e.senderID);
 const now=Date.now();

 if(now-(reactTimes.get(key)||0)<CFG.reactCooldown)return;

 reactTimes.set(key,now);

 try{
  api.setMessageReaction(
   CFG.autoReact,
   e.messageID,
   ()=>{},
   true
  );
 }catch(_){}
}

function cooldown(e,cmd,ms){
 const key=`${e.threadID}:${e.senderID}:${cmd}`;
 const now=Date.now();
 const last=cooldowns.get(key)||0;

 if(now-last<ms){
  return Math.ceil((ms-(now-last))/1000);
 }

 cooldowns.set(key,now);
 return 0;
}

/* ───────── COMMAND HELP ───────── */
function commandList(){
 return [...registry.values()];
}

function menu(){
 const groups={};

 for(const cmd of commandList()){
  const cat=cmd.category||"other";
  (groups[cat]??=[]).push(cmd);
 }

 let out=`╭━━━〔 👑 KLERK COMMUNITY 〕━━━╮\n`;
 out+=`│ 📚 COMMAND CENTER\n`;
 out+=`│ 📦 ${registry.size} COMMANDS\n│\n`;

 Object.keys(groups).sort().forEach((cat,i)=>{
  out+=`│ ${i+1}️⃣ ${cat.toUpperCase()} — ${groups[cat].length}\n`;
 });

 out+=`│\n│ ${PREFIX}menu <category>\n`;
 out+=`│ ${PREFIX}help <command>\n`;
 out+=`│ ${PREFIX}ping\n`;
 out+=`╰━━━━━━━━━━━━━━━━━━━━━━╯`;

 return out;
}

function help(name){
 const c=getCommand(name);
 if(!c)return `❌ Unknown command "${name}".\n💡 Try ${PREFIX}menu or ${PREFIX}help <command>.`;

 return `╭─〔 📖 ${PREFIX}${c.name} 〕─╮\n`+
  `│ ${c.description||"Klerk Community command"}\n`+
  `│ 📂 ${c.category}\n`+
  `│ 📋 ${c.submenu}\n`+
  `│ 🔤 ${c.aliases.length?c.aliases.map(x=>PREFIX+x).join(", "):"None"}\n`+
  `╰──────────────────╯`;
}

/* ───────── EVENTS ───────── */
function onMessage(e){
 if(!e||!e.body)return;

 const body=String(e.body).trim();
 if(!body)return;

 react(e);

 if(!body.startsWith(PREFIX))return;

 const raw=body.slice(PREFIX.length).trim();

 if(!raw){
  send(e,menu());
  return;
 }

 const parts=raw.split(/\s+/);
 const name=parts.shift().toLowerCase();
 const args=parts;

 if(name==="menu"){
  send(e,menu());
  return;
 }

 if(name==="help"){
  send(e,help(args[0]));
  return;
 }

 if(name==="ping"){
  send(e,`🏓 Pong!\n⚡ Klerk online\n📦 ${registry.size} commands\n⏱️ ${Math.floor(process.uptime())}s`);
  return;
 }

 const cmd=getCommand(name);

 if(!cmd){
  const suggestions=commandList()
   .map(x=>x.name)
   .filter(x=>x.startsWith(name.slice(0,2)))
   .slice(0,5);

  send(
   e,
   `❌ Unknown command: ${PREFIX}${name}\n`+
   `💡 Try ${suggestions.length?
    suggestions.map(x=>PREFIX+x).join(", "):
    PREFIX+"menu"}`
  );
  return;
 }

 if(CFG.maintenance&&!isAdmin(e.senderID)){
  send(e,"🛠️ Klerk is currently under maintenance.");
  return;
 }

 if(cmd.adminOnly&&!isAdmin(e.senderID)){
  send(e,"👑 Admin only.");
  return;
 }

 const cd=Number(cmd.cooldown||0);
 if(cd){
  const left=cooldown(e,cmd.name,cd);
  if(left){
   send(e,`⏳ ${cmd.name} cooldown: ${left}s`);
   return;
  }
 }

 try{
  const ctx={
   api,
   event:e,
   args,
   prefix:PREFIX,
   config:CFG,
   isAdmin:isAdmin(e.senderID),
   send:(msg)=>send(e,msg),
   react:()=>react(e),
   getCommand,
   commands:commandList()
  };

  const result=cmd.execute(ctx);

  if(result instanceof Promise){
   result.catch(err=>{
    console.error(`CMD ${cmd.name}:`,err);
    send(e,"❌ Something went wrong while running that command.");
   });
  }
 }catch(err){
  console.error(`CMD ${cmd.name}:`,err);
  send(e,"❌ Command error. Please try again.");
 }
}

/* ───────── LOGIN ───────── */
function start(){
 console.log("🚀 Starting KLERK COMMUNITY BOT...");
 console.log(`📦 Commands: ${registry.size}`);
 console.log(`👑 Admin: ${ADMIN_ID}`);

 login(
  {appState:JSON.parse(APPSTATE)},
  (err,loggedInApi)=>{
   if(err){
    console.error("❌ LOGIN FAILED:",err);
    setTimeout(start,10000);
    return;
   }

   api=loggedInApi;

   try{
    api.setOptions({
     listenEvents:true,
     selfListen:false,
     forceLogin:true,
     autoMarkDelivery:false,
     autoMarkRead:false
    });
   }catch(_){}

   api.listenMqtt((err,event)=>{
    if(err){
     console.error("MQTT:",err.message||err);
     return;
    }

    try{
     if(event.type==="message")onMessage(event);
    }catch(x){
     console.error("EVENT:",x.message);
    }
   });

   console.log("✅ KLERK COMMUNITY BOT ONLINE");
   console.log("📡 MQTT connected");
   console.log("👑 Master admin:",ADMIN_ID);
  }
);

process.on("uncaughtException",err=>console.error("FATAL:",err));
process.on("unhandledRejection",err=>console.error("PROMISE:",err));
}

start();
