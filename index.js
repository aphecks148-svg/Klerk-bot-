// iKON-BOT • FINAL PRODUCTION INDEX // Owner: Aphecks iKon Klerk - 360 cmds
const fs=require("fs"),path=require("path"),express=require("express");
try{ require("dotenv").config(); }catch(e){ console.log("dotenv skip"); }
let login; try{ const FCA=require("ws3-fca"); login=typeof FCA==="function"?FCA:FCA.login; }catch(e){ console.error("ws3-fca missing:",e.message); process.exit(1); }

const app=express();
const PORT=process.env.PORT||10000;
const GLOBAL_PREFIX=process.env.PREFIX||"!";
const ADMIN_UIDS=new Set((process.env.ADMIN_UIDS||"").split(",").map(s=>s.trim()).filter(Boolean));
const APPSTATE=process.env.APPSTATE||"";

app.get("/",(_,res)=>res.json({status:"ACTIVE",bot:"iKON-BOT",prefix:GLOBAL_PREFIX,commands:360}));
app.get("/health",(_,res)=>res.json({ok:true,uptime:process.uptime()}));

const users=new Map(),groups=new Map(),commands=new Map(),aliases=new Map();
const cooldowns=new Map(),profiles=new Map();

const CAT={
 MONEYFORGE:["💰","MONEYFORGE"],MARKETVERSE:["🛒","MARKETVERSE"],WILDHEART:["🐾","WILDHEART"],
 EARTHBOUND:["🌾","EARTHBOUND"],FRONTIER:["⛏️","FRONTIER"],BATTLECORE:["⚔️","BATTLECORE"],
 STREETKINGS:["🚘","STREETKINGS"],UNDERWORLD:["💀","UNDERWORLD"],LUCKYVAULT:["🎰","LUCKYVAULT"],
 SOCIALHUB:["❤️","SOCIALHUB"],NEURALINK:["🤖","NEURALINK"],ARENA360:["⚽","ARENA360"],
 KLERKCORE:["👑","ONLYADMIN"],SYSTEMHUB:["🛠️","SYSTEMHUB"]
};

const MENU1={
 MONEYFORGE:`balance deposit withdraw transfer daily weekly monthly work job jobs salary beg invest loan credit business property networth tax payday bonus cashdrop bankinterest savings vault`,
 MARKETVERSE:`shop buy sell inventory use trade market auction items prices iteminfo materials storage stash gift give exchange bundle restock rarity blueprint salvage`,
 WILDHEART:`pet pets adopt petinfo feed train evolve petbattle pettrade release petstats petlevel petxp petheal petpower petduel petgift petrename petcollection petrare petlist petbreed petmerge petrevive petarmor petweapon petquest petmission petfood petgear`,
 EARTHBOUND:`farm plant seeds water harvest fertilize farminfo field crop crops garden greenhouse grow replant farmshop farmsell farmupgrade farmlevel farmxp farmlog compost irrigation fertilizerbox cropinfo harvestall farmquest`,
 FRONTIER:`mine ores oreinfo dig excavate prospect smelt forge fish bait fishing fishinfo hunt animals tracking trap catch cook camp explore gather resources fishingrod fishinglevel fishingquest huntingrank miningrank cave map`,
 BATTLECORE:`stats level xp skills skilltree upgrade prestige rebirth battle attack defend ultimate pvp arena dungeon raid boss bossfight adventure quest quests mission missions equipment loadout power combat heal energy defense dodge critical combo rage mana armor weaponrank bossrank raidrank arenaRank battlepass bountyxp`
};
const MENU2={
 STREETKINGS:`gta rob robbery crime heist wanted bounty police arrest jail escape gang ganginfo gangjoin gangleave gangwar territory capture car cars garage race racing chopshop tuner nitro`,
 UNDERWORLD:`smuggle blackmarket hit assassinate kidnap extort bribe fence contraband stashhouse safehouse crew contract target heat hideout streetrep ransom informant`,
 LUCKYVAULT:`casino gamble coinflip dice slots roulette blackjack poker baccarat rps guess lottery lotto wheel spin jackpot bet highscore games minigames tournament risk cashout streak crash keno baccaratplus`,
 SOCIALHUB:`profile me user uid avatar rep friends friend follow block unblock marry divorce partner couple pair crush slap kiss hug poke gift spy roast compliment ship social statusmsg`,
 NEURALINK:`ai ask chat imagine image translate summarize define search weather calc convert qrcode youtube music video sticker gif meme caption rewrite prompt explain`,
 ARENA360:`football live livescore fixtures results match team teams league leagues standings table footballnews wrestling wrestlingnews wwe ufc sports score player`,
 KLERKCORE:`admin settings enable disable maintenance broadcast reload logs stats pending approve reject pendinggc approvegc rejectgc warn warnings kick ban unban`,
 SYSTEMHUB:`menu menu1 menu2 commands cmd botinfo ping uptime groupinfo members admins rules id myid status report suggest feedback support prefix slowmode antispam announce`
};

function addCatalog(menu,n){
 let c=0; for(const [cat,str] of Object.entries(menu)){
  for(const name of str.split(/\s+/).filter(Boolean)){
   commands.set(name.toLowerCase(),{name:name.toLowerCase(),category:cat,aliases:[],catalog:true});
   c++;
  }
 } console.log(`📋 MENU ${n}: ${c} commands`); return c;
}
const C1=addCatalog(MENU1,1),C2=addCatalog(MENU2,2);
console.log(`✅ ${C1+C2} catalog loaded`);

// ===== CORE STATE =====
function getUser(uid,name="Unknown"){
 if(!users.has(uid)) users.set(uid,{uid,name,firstName:name,wallet:500,bank:0,xp:0,level:1,prestige:0,health:100,energy:100,inventory:{},pets:[],warnings:0,banned:false});
 return users.get(uid);
}
function getGroup(tid,name="Unknown"){
 if(!groups.has(tid)) groups.set(tid,{threadID:tid,name,enabled:true,prefix:GLOBAL_PREFIX,admins:new Set(),disabledCommands:new Set(),stats:{messages:0,commands:0}});
 return groups.get(tid);
}
function isAdmin(uid){ if(ADMIN_UIDS.size===0) return true; return ADMIN_UIDS.has(String(uid)); }

async function getProfile(api,uid){
 uid=String(uid);
 if(profiles.has(uid)) return profiles.get(uid);
 let p={uid,name:"Unknown",firstName:"Unknown",profileUrl:"",avatar:""};
 try{ const info=await api.getUserInfo(uid); const u=info[uid]; if(u) p={uid,name:u.name||"Unknown",firstName:u.firstName||u.name,profileUrl:u.profileUrl||"",avatar:u.thumbSrc||""}; }catch(_){}
 profiles.set(uid,p); getUser(uid,p.name).name=p.name; return p;
}

const fun=()=>["🔥 AYOOO!","🐐 GOAT move!","🚀 Cooking!","💀 SHEESH!","😎 Clean!"][Math.floor(Math.random()*5)];
const bar=(v,m=100,n=10)=>{ v=Math.max(0,Math.min(m,v)); const x=Math.round(v/m*n); return "█".repeat(x)+"░".repeat(n-x); };

// ===== REPLY + REACT - FIXED =====
function reply(api,event,msg){
 const text=String(msg);
 console.log(`💬 SENDING to ${event.threadID}: ${text.slice(0,120)}`);
 return new Promise((resolve)=>{
  api.sendMessage(text, event.threadID, (err,info)=>{
   if(err){ console.error("❌ SEND FAILED:",err); resolve(null); }
   else{ console.log("✅ SENT:",info?.messageID); resolve(info); }
  }, event.messageID);
 });
}
function react(api,event,emoji="👍"){ try{ api.setMessageReaction(emoji,event.messageID,()=>{},true); }catch(_){} }

// ===== COMMAND REGISTER =====
function registerCommand(c){
 if(!c||!c.name) return;
 const name=String(c.name).toLowerCase().trim();
 const existing=commands.get(name);
 if(existing && existing.catalog){
  commands.set(name,{...existing,...c,name,category:c.category||existing.category,catalog:false});
 }else if(existing &&!existing.catalog){
  console.log(`⚠️ DUPLICATE CMD: ${name}`); return;
 }else{
  commands.set(name,{...c,name,catalog:false});
 }
 for(const a of (c.aliases||[])){
  const al=String(a).toLowerCase().trim(); if(!aliases.has(al)) aliases.set(al,name);
 }
}

function loadCommands(){
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){ console.log("No commands dir"); return; }
 const files=fs.readdirSync(dir).filter(f=>/^cmds_\d+\.js$/i.test(f)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]));
 for(const file of files){
  try{
   delete require.cache[require.resolve(path.join(dir,file))];
   const mod=require(path.join(dir,file));
   let list=[];
   if(typeof mod==="function"){
    const ctx={api:{},event:{senderID:"0",threadID:"0",messageID:"",body:""},user:getUser("0"),reply:()=>{},users,profile:getProfile,fun,bar,isAdmin,PREFIX:GLOBAL_PREFIX,usersMap:users};
    const res=mod(ctx); if(Array.isArray(res)) list=res;
   }else{
    list=Array.isArray(mod)?mod:(mod.commands||[mod]);
   }
   list.filter(Boolean).forEach(registerCommand);
   console.log(`📦 ${file} -> ${list.length} cmds | total ${commands.size}`);
  }catch(e){ console.error(`❌ ${file}:`,e.message); }
 }
}
loadCommands();

// ===== MENU =====
const icon=c=>CAT[c]?.[0]||"📌"; const title=c=>CAT[c]?.[1]||c;
function menuPage(which,e){
 const src=which===1?MENU1:MENU2;
 const u=getUser(e.senderID);
 const g=getGroup(e.threadID);
 const pre=g.prefix||GLOBAL_PREFIX;
 let lines=[`✨ iKON-BOT • MENU ${which}/2`,`👑 Aphecks iKon Klerk`,`💰 $${u.wallet} • ⭐ Lv.${u.level}`,`📌 Prefix: ${pre}`,`━━━━━━━━━━━━━━━━━━`];
 for(const [cat,str] of Object.entries(src)) lines.push(`${icon(cat)} ${title(cat)}: ${str.split(/\s+/).map(x=>pre+x).join(" • ")}`);
 lines.push(`━━━━━━━━━━━━━━━━━━`,`📖 ${pre}help <cmd> • ${pre}menu${which===1?"2":"1"}`);
 return lines.join("\n");
}

// ===== BUILT-IN =====
registerCommand({name:"menu",aliases:["m"],category:"SYSTEMHUB",run:async({api,event,args})=>{
 const g=getGroup(event.threadID); const pre=g.prefix;
 const n=args[0]; if(n==="1"||n==="2") return reply(api,event,menuPage(Number(n),event));
 await reply(api,event,menuPage(1,event)); setTimeout(()=>reply(api,event,menuPage(2,event)),600);
}});
registerCommand({name:"ping",category:"SYSTEMHUB",run:async({api,event})=>{ await reply(api,event,`🏓 PONG! ${Math.floor(Math.random()*200)}ms\n${fun()}`); }});
registerCommand({name:"prefix",category:"SYSTEMHUB",run:async({api,event,args})=>{
 const g=getGroup(event.threadID);
 if(!args[0]) return reply(api,event,`🔧 Current prefix: ${g.prefix}\nUse: ${g.prefix}prefix <new>\nExample: ${g.prefix}prefix!`);
 g.prefix=args[0]; await reply(api,event,`✅ Prefix changed to: ${g.prefix}`);
}});
registerCommand({name:"botinfo",category:"SYSTEMHUB",run:async({api,event})=>{
 const g=getGroup(event.threadID); await reply(api,event,`🤖 iKON-BOT\n👑 Owner: Aphecks iKon Klerk\n📦 Commands: ${commands.size}\n📌 Prefix: ${g.prefix}\n👥 Users: ${users.size}\n⏱️ Uptime: ${Math.floor(process.uptime()/60)}m`);
}});

// ===== PARSER WITH PREFIX PREFERENCE + REPLY TAG =====
function parseMessage(body,groupPrefix,botID){
 if(!body) return null;
 let txt=body.trim();

 // 1. Reply tag detection - if message starts with bot mention @
 // 2. Prefix preference: group prefix > global prefix
 const prefixes=[groupPrefix,GLOBAL_PREFIX].filter(Boolean);
 // Also allow no prefix if bot is mentioned or replied to
 const lower=txt.toLowerCase();

 // Check prefix
 let usedPrefix=null;
 for(const p of prefixes){
  if(txt.startsWith(p)){ usedPrefix=p; txt=txt.slice(p.length).trim(); break; }
 }
 // If no prefix but message is reply to bot or mentions bot, allow it
 const isMention = botID && (lower.includes("@ikon") || lower.includes(botID));
 if(!usedPrefix &&!isMention) return null;
 if(!txt) return null;

 const parts=txt.match(/"[^"]*"|'[^']*'|\S+/g)||[];
 const name=(parts.shift()||"").toLowerCase();
 const args=parts.map(s=>s.replace(/^['"]|['"]$/g,""));
 return {name,args,usedPrefix};
}

async function handle(api,event){
 if(!event || event.type!=="message") return;
 if(!event.body) return;

 const g=getGroup(event.threadID,event.threadName||"Unknown");
 g.stats.messages++;

 console.log(`📩 ${event.threadID} | ${event.senderID}: ${event.body.slice(0,150)}`);

 // Always get user profile
 const prof=await getProfile(api,event.senderID);
 const u=getUser(event.senderID,prof.name);
 if(u.banned) return;

 // React to every message
 react(api,event);

 // Parse with group prefix preference + mention support
 const q=parseMessage(event.body,g.prefix,api.getCurrentUserID());

 // If not a command, check if it's a reply to bot (reply tag)
 if(!q){
  // Reply tag: if user replies to bot's message, treat body as AI chat
  if(event.messageReply && event.messageReply.senderID===api.getCurrentUserID()){
   const aiCmd=commands.get("ai")||commands.get(aliases.get("ai"));
   if(aiCmd && aiCmd.run){
    console.log("-> REPLY TAG detected, triggering AI");
    try{ await aiCmd.run({api,event,args:event.body.split(/\s+/),command:aiCmd,user:u,group:g,users,profile:getProfile,reply:(t)=>reply(api,event,t),react,fun,bar,isAdmin,PREFIX:g.prefix}); }catch(e){ console.error("AI reply tag error:",e); }
   }
  }
  return;
 }

 console.log(`⚙️ CMD: ${q.name} | ARGS: ${q.args.join(" ")} | PREFIX: ${q.usedPrefix}`);

 const cmdName=aliases.get(q.name)||q.name;
 const cmd=commands.get(cmdName);

 if(!cmd){
  console.log(`❓ Unknown: ${cmdName}`);
  return reply(api,event,`❓ Unknown command: ${q.usedPrefix||g.prefix}${q.name}\n📜 Try ${g.prefix}menu`);
 }

 if(g.disabledCommands.has(cmdName)) return reply(api,event,`🚫 ${cmdName} disabled here`);

 // No cooldown for now to ensure reply
 try{
  g.stats.commands++;
  await cmd.run({
   api,event,args:q.args,command:cmd,
   user:u,group:g,users,groups,commands,aliases,
   profile:getProfile,reply:(t)=>reply(api,event,t),react:(e)=>react(api,event,e),
   bar,fun,isAdmin,PREFIX:g.prefix,apiRaw:api
  });
  console.log(`✅ Executed: ${cmdName}`);
 }catch(e){
  console.error(`❌ CMD ${cmdName} ERROR:`,e);
  reply(api,event,`⚠️ Error in ${cmdName}: ${e.message}`);
 }
}

function start(){
 if(!APPSTATE){ console.error("❌ APPSTATE missing in ENV"); return; }
 try{
  const state=typeof APPSTATE==="string"?JSON.parse(APPSTATE):APPSTATE;
  login({appState:state},(err,api)=>{
   if(err){ console.error("❌ LOGIN FAILED:",err); return setTimeout(start,10000); }
   console.log("✅ LOGIN SUCCESSFUL as",api.getCurrentUserID());
   console.log(`📌 Global Prefix: ${GLOBAL_PREFIX}`);
   console.log(`📦 Total Commands: ${commands.size} + ${aliases.size} aliases`);

   api.setOptions({listenEvents:true,selfListen:false,updatePresence:true,forceLogin:false,autoMarkRead:false});

   api.listenMqtt(async(err,event)=>{
    if(err){ console.error("MQTT ERR:",err); return; }
    try{ await handle(api,event); }catch(e){ console.error("HANDLE ERR:",e); }
   });
  });
 }catch(e){ console.error("START CRASH:",e); }
}

process.on("unhandledRejection",e=>console.error("UNHANDLED:",e));
process.on("uncaughtException",e=>console.error("UNCAUGHT:",e));

app.listen(PORT,()=>console.log(`🌐 HTTP ${PORT} LIVE`));
start();
