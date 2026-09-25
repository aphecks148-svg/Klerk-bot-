// iKON-BOT • FIXED FINAL // Owner: Aphecks iKon Klerk
const fs=require("fs"),path=require("path"),express=require("express");
let dotenv; try{ dotenv=require("dotenv"); dotenv.config(); }catch(e){ console.log("dotenv skip"); }
let login; try{const FCA=require("ws3-fca");login=typeof FCA==="function"?FCA:FCA.login}catch(e){console.error("ws3-fca:",e.message);process.exit(1)}
const app=express(),PORT=process.env.PORT||10000,PREFIX=process.env.PREFIX||"!";
const ADMINS=new Set((process.env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean));
const APPSTATE=process.env.APPSTATE||"";
const GEMINI_KEY=process.env.GEMINI_API_KEY||"";
app.get("/",(_,r)=>r.json({status:"ACTIVE",bot:"iKON-BOT",owner:"Aphecks iKon Klerk",commands:360}));
app.get("/health",(_,r)=>r.json({ok:true,uptime:process.uptime(),commands:commands.size}));
const users=new Map(),groups=new Map(),commands=new Map(),aliases=new Map();
const cooldowns=new Map(),profiles=new Map(),pendingGCs=new Map(),pendingUsers=new Map(),warns=new Map();
const CFG={ enabled:true,maintenance:false,replies:true,autoReact:true,react:"👍", cooldown:1500,antiSpam:false,maxSpam:7, welcome:false,goodbye:false,ai:!!GEMINI_KEY };
const CAT={ MONEYFORGE:["💰","MONEYFORGE"],MARKETVERSE:["🛒","MARKETVERSE"], WILDHEART:["🐾","WILDHEART"],EARTHBOUND:["🌾","EARTHBOUND"], FRONTIER:["⛏️","FRONTIER"],BATTLECORE:["⚔️","BATTLECORE"], STREETKINGS:["🚘","STREETKINGS"],UNDERWORLD:["💀","UNDERWORLD"], LUCKYVAULT:["🎰","LUCKYVAULT"],SOCIALHUB:["❤️","SOCIALHUB"], NEURALINK:["🤖","NEURALINK"],ARENA360:["⚽","ARENA360"], KLERKCORE:["👑","ONLYADMIN"],SYSTEMHUB:["🛠️","KLERKCORE"] };
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
const addCatalog=(menu,n)=>{ let count=0; for(const [cat,str] of Object.entries(menu)){ for(const name of str.split(/\s+/).filter(Boolean)){ commands.set(name,{name,category:cat,aliases:[],catalog:true}); count++; } } console.log(`📋 MENU ${n}: ${count} commands`); return count; };
const C1=addCatalog(MENU1,1),C2=addCatalog(MENU2,2);
console.log(`✅ ${C1+C2} command catalog loaded (${C1} + ${C2})`);

function user(uid,name="Unknown"){ if(!users.has(uid))users.set(uid,{ uid,name,firstName:name,profileUrl:"",avatar:"", wallet:0,bank:0,vault:0,savings:0, xp:0,level:1,prestige:0, health:100,maxHealth:100,energy:100,maxEnergy:100, stamina:100,maxStamina:100, reputation:0,credit:500,wanted:0,jailUntil:0, job:null,inventory:{},pets:[],cars:[],weapons:[], businesses:[],achievements:[],stats:{} }); return users.get(uid); }
// FIXED: enabled:true by default so bot replies immediately
function group(tid,name="Unknown Group"){ if(!groups.has(tid))groups.set(tid,{ threadID:tid,name,enabled:true,pending:false, prefix:PREFIX,admins:new Set(),welcome:false,goodbye:false, autoReact:true,disabledCommands:new Set(),disabledCategories:new Set(), warnings:{},settings:{},stats:{messages:0,commands:0} }); return groups.get(tid); }
function isAdmin(uid){return ADMINS.size===0?true:ADMINS.has(String(uid))}
function key(tid,uid){return `${tid}:${uid}`}

async function profile(api,uid){ uid=String(uid); if(profiles.has(uid))return profiles.get(uid); let p={uid,name:"Unknown",firstName:"Unknown",profileUrl:"",avatar:""}; try{ const x=await api.getUserInfo(uid),u=x&&x[uid]; if(u)p={ uid,name:u.name||u.firstName||"Unknown", firstName:u.firstName||u.name||"Unknown", profileUrl:u.profileUrl||u.vanity||"", avatar:u.thumbSrc||u.profilePicture||u.avatar||"" }; }catch(e){} profiles.set(uid,p); const u=user(uid,p.name);Object.assign(u,p); return p; }

const bar=(v,max=100,n=10)=>{ v=Math.max(0,Math.min(max,v));const x=Math.round(v/max*n); return "█".repeat(x)+"░".repeat(n-x); };
const funny=[ "🔥 AYOOO, that worked!", "🐐 Certified GOAT move.", "😂 Bro really pulled that off.", "🚀 We're cooking now!", "💰 The wallet just got heavier." ];
const fun=()=>funny[Math.floor(Math.random()*funny.length)];
function reply(api,e,msg){ if(!CFG.replies)return; return api.sendMessage(String(msg),e.threadID,()=>{},e.messageID); }
function react(api,e,r=CFG.react){ if(!CFG.autoReact)return; try{api.setMessageReaction(r,e.messageID,()=>{},true)}catch(_){} }
function fail(api,e,msg="❌ Something went wrong."){return reply(api,e,`⚠️ ${msg}`)}
function cooldown(uid,name,ms=CFG.cooldown){ const k=`${uid}:${name}`,now=Date.now(),last=cooldowns.get(k)||0; if(now-last<ms)return Math.ceil((ms-(now-last))/1000); cooldowns.set(k,now);return 0; }

function registerCommand(c){ if(!c||!c.name)return; const name=String(c.name).toLowerCase(); if(commands.has(name)&&commands.get(name).catalog){ commands.set(name,{...commands.get(name),...c,name,category:c.category||commands.get(name).category}); }else if(commands.has(name)){ console.log(`⚠️ DUPLICATE: ${name}`);return; }else commands.set(name,{...c,name}); for(const a of c.aliases||[]){ const al=String(a).toLowerCase(); if(!aliases.has(al))aliases.set(al,name); } }
function loadCommands(){ const dir=path.join(__dirname,"commands"); if(!fs.existsSync(dir))return; fs.readdirSync(dir).filter(x=>/^cmds_\d+\.js$/i.test(x)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0])).forEach(file=>{ try{ delete require.cache[require.resolve(path.join(dir,file))]; const mod=require(path.join(dir,file)); let list=[]; if(typeof mod==="function"){ const res=mod({api:{},event:{},user:{wallet:0,crime:{rep:0},casino:{wins:0,loss:0,streak:0},friends:[],reputation:0},reply:()=>{},users,profile:async()=>({name:"Test"}),fun}); if(Array.isArray(res))list=res; }else{ list=Array.isArray(mod)?mod:(mod.commands||[mod]); } list.filter(Boolean).forEach(registerCommand); console.log(`📦 ${file} loaded - ${list.length} cmds`); }catch(e){console.error(`❌ ${file}:`,e.message,e.stack)} }); }
loadCommands();

const icon=c=>CAT[c]?.[0]||"📌"; const title=c=>CAT[c]?.[1]||c;
function menuPage(which,api,e){ const src=which===1?MENU1:MENU2; const u=user(e.senderID); const lines=[ `✨ iKON-BOT • MENU ${which}/2`, `👑 Aphecks iKon Klerk`, `👤 ${u.name} • ⭐ Lv.${u.level} • 🔥 P${u.prestige}`, `💰 $${Number(u.wallet).toLocaleString()}`, `━━━━━━━━━━━━━━━━━━` ]; for(const [cat,str] of Object.entries(src)) lines.push(`${icon(cat)} ${title(cat)}: ${str.split(/\s+/).map(x=>PREFIX+x).join(" • ")}`); lines.push( `━━━━━━━━━━━━━━━━━━`, `📖 ${PREFIX}help <cmd>` ); return lines.join("\n"); }

registerCommand({ name:"menu",aliases:["m"],category:"SYSTEMHUB", run:async({api,event,args})=>{ const n=String(args[0]||""); if(n==="1"||n==="2")return reply(api,event,menuPage(Number(n),api,event)); reply(api,event,menuPage(1,api,event)); setTimeout(()=>reply(api,event,menuPage(2,api,event)),400); } });
registerCommand({ name:"help",aliases:["h"],category:"SYSTEMHUB", run:async({api,event,args})=>{ const q=String(args[0]||"").toLowerCase(); if(!q)return reply(api,event,`📖 ${PREFIX}help <command>`); const n=aliases.get(q)||q,c=commands.get(n); if(!c)return fail(api,event,`Command ${PREFIX}${q} not found.`); reply(api,event, `📖 ${PREFIX}${c.name} ${icon(c.category)} ${title(c.category)}` ); } });
registerCommand({ name:"ping",category:"SYSTEMHUB", run:async({api,event})=>{ reply(api,event,`🏓 PONG! ${Date.now()%1000}ms\n${fun()}`); } });
registerCommand({ name:"botinfo",category:"SYSTEMHUB", run:async({api,event})=>reply(api,event, `🤖 iKON-BOT 👑 Owner: Aphecks iKon Klerk 📦 Commands: ${commands.size} 👥 Users: ${users.size}` ) });

const onlyAdmin=(run)=>async(ctx)=>{ if(!isAdmin(ctx.event.senderID)) return fail(ctx.api,ctx.event,"ADMIN ONLY"); return run(ctx); };
registerCommand({name:"admin",category:"KLERKCORE",permission:"admin", run:onlyAdmin(async({api,event})=> reply(api,event,`👑 ADMIN OK - Bot is working!`))});

function parse(body){ const x=body.trim(); if(!x.startsWith(PREFIX))return null; const z=x.slice(PREFIX.length).trim(),a=z.match(/"[^"]*"|'[^']*'|\S+/g)||[]; return {name:(a.shift()||"").toLowerCase(),args:a.map(x=>x.replace(/^['"]|['"]$/g,""))}; }

async function handle(api,event){
 console.log(`📩 INCOMING: ${event.threadID} | ${event.senderID} : ${event.body}`);
 if(!event||event.type!=="message"||!event.body)return;
 const g=group(event.threadID);
 g.stats.messages++;
 const p=await profile(api,event.senderID);
 user(event.senderID,p.name);
 react(api,event);
 const q=parse(event.body);
 if(!q){ console.log(` -> Not a command (no prefix)`); return; }
 console.log(` -> COMMAND: ${q.name} ARGS: ${q.args.join(" ")}`);
 if(!CFG.enabled)return fail(api,event,"Bot disabled.");
 const name=aliases.get(q.name)||q.name,c=commands.get(name);
 if(!c){ console.log(` -> Unknown command: ${name}`); return fail(api,event,`Unknown: ${PREFIX}${q.name} Try ${PREFIX}menu`); }
 const cd=c.cooldown||CFG.cooldown,wait=cooldown(event.senderID,name,cd);
 if(wait)return reply(api,event,`⏳ ${wait}s cooldown`);
 try{
  g.stats.commands++;
  if(typeof c.run==="function") await c.run({ api,event,args:q.args,command:c, user:user(event.senderID,p.name),group:g, config:CFG,users,groups,commands,aliases, pendingGCs,pendingUsers,warns,profile,reply,react,bar,fun, isAdmin,PREFIX });
  else reply(api,event,`🚧 ${PREFIX}${name} no run()`);
 }catch(e){ console.error(`COMMAND ${name}:`,e); fail(api,event,"Error: "+e.message); }
}

function start(){
 if(!APPSTATE){console.error("❌ APPSTATE missing.");return}
 try{
  const state=typeof APPSTATE==="string"?JSON.parse(APPSTATE):APPSTATE;
  login({appState:state},(err,api)=>{
   if(err){console.error("❌ LOGIN:",err);return setTimeout(start,15000)}
   console.log("✅ LOGIN SUCCESSFUL");
   console.log("🤖 iKON-BOT CONNECTED");
   console.log(`📌 Prefix: ${PREFIX}`);
   api.setOptions({listenEvents:true,updatePresence:true,selfListen:false,forceLogin:false,listenTyping:true,autoMarkRead:false});
   api.listenMqtt(async(err,event)=>{
    if(err){console.error("LISTENER:",err);return}
    try{
     if(event.type==="event"&&event.threadID&&!groups.has(event.threadID)){
      pendingGCs.set(event.threadID,{ threadID:event.threadID,name:event.threadName||"Unknown", members:event.participantIDs?.length||"?", createdAt:Date.now() });
      group(event.threadID,event.threadName||"Unknown");
     }
     await handle(api,event);
    }catch(e){console.error("EVENT:",e)}
   });
  });
 }catch(e){console.error("START:",e)}
}
process.on("unhandledRejection",e=>console.error("UNHANDLED:",e));
process.on("uncaughtException",e=>console.error("UNCAUGHT:",e));
app.listen(PORT,()=>console.log(`🌐 HTTP :${PORT}`));
start();
module.exports={ app,users,groups,commands,aliases, CFG,MENU1,MENU2 };
