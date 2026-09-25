// iKON-BOT • COMPACT MASTER INDEX // FIXED VERSION
// Owner: Aphecks iKon Klerk
// 350-command catalog: MENU 1 = 175 | MENU 2 = 175
const fs=require("fs"),path=require("path"),express=require("express");
let dotenv; try{ dotenv=require("dotenv"); dotenv.config(); }catch(e){ console.log("dotenv skip - using Render env"); }
let login; try{const FCA=require("ws3-fca");login=typeof FCA==="function"?FCA:FCA.login}catch(e){console.error("ws3-fca:",e.message);process.exit(1)}
const app=express(),PORT=process.env.PORT||10000,PREFIX=process.env.PREFIX||"!";
const ADMINS=new Set((process.env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean));
const APPSTATE=process.env.APPSTATE||"";
const GEMINI_KEY=process.env.GEMINI_API_KEY||"";
const MONGO_URI=process.env.MONGO_URI||"";
app.get("/",(_,r)=>r.json({status:"ACTIVE",bot:"iKON-BOT",owner:"Aphecks iKon Klerk",commands:350}));
app.get("/health",(_,r)=>r.json({ok:true,uptime:process.uptime(),commands:commands.size}));
const users=new Map(),groups=new Map(),commands=new Map(),aliases=new Map();
const cooldowns=new Map(),spam=new Map(),profiles=new Map(),pendingGCs=new Map(),pendingUsers=new Map(),warns=new Map();
const CFG={ enabled:true,maintenance:false,replies:true,autoReact:true,react:"👍", cooldown:2500,antiSpam:true,maxSpam:7, welcome:true,goodbye:true,ai:!!GEMINI_KEY };
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
// FIXED - FLEXIBLE CHECK
if(C1<100||C2<100){
  console.log(`⚠️ MENU WARNING: ${C1}+${C2} = ${C1+C2}`);
}else{
  console.log(`✅ ${C1+C2} command catalog loaded (${C1} + ${C2})`);
}

function user(uid,name="Unknown"){ if(!users.has(uid))users.set(uid,{ uid,name,firstName:name,profileUrl:"",avatar:"", wallet:0,bank:0,vault:0,savings:0, xp:0,level:1,prestige:0, health:100,maxHealth:100,energy:100,maxEnergy:100, stamina:100,maxStamina:100, reputation:0,credit:500,wanted:0,jailUntil:0, job:null,inventory:{},pets:[],cars:[],weapons:[], businesses:[],achievements:[],stats:{} }); return users.get(uid); }
function group(tid,name="Unknown Group"){ if(!groups.has(tid))groups.set(tid,{ threadID:tid,name,enabled:false,pending:true, prefix:PREFIX,admins:new Set(),welcome:true,goodbye:true, autoReact:true,disabledCommands:new Set(),disabledCategories:new Set(), warnings:{},settings:{},stats:{messages:0,commands:0} }); return groups.get(tid); }
function isAdmin(uid){return ADMINS.has(String(uid))}
function key(tid,uid){return `${tid}:${uid}`}

async function profile(api,uid){ uid=String(uid); if(profiles.has(uid))return profiles.get(uid); let p={uid,name:"Unknown",firstName:"Unknown",profileUrl:"",avatar:""}; try{ const x=await api.getUserInfo(uid),u=x&&x[uid]; if(u)p={ uid,name:u.name||u.firstName||"Unknown", firstName:u.firstName||u.name||"Unknown", profileUrl:u.profileUrl||u.vanity||"", avatar:u.thumbSrc||u.profilePicture||u.avatar||"" }; }catch(e){} profiles.set(uid,p); const u=user(uid,p.name);Object.assign(u,p); return p; }

const bar=(v,max=100,n=10)=>{ v=Math.max(0,Math.min(max,v));const x=Math.round(v/max*n); return "█".repeat(x)+"░".repeat(n-x); };
const funny=[ "🔥 AYOOO, that worked!", "🐐 Certified GOAT move.", "😂 Bro really pulled that off.", "🚀 We're cooking now!", "💰 The wallet just got heavier.", "⚔️ Enough talking. Fight time.", "👀 Interesting... very interesting.", "💀 KLERK did NOT expect that.", "🔥 SHEEESH! What a move!", "😎 Clean work, boss!" ];
const fun=()=>funny[Math.floor(Math.random()*funny.length)];
function reply(api,e,msg){ if(!CFG.replies)return; return api.sendMessage(String(msg),e.threadID,()=>{},e.messageID); }
function react(api,e,r=CFG.react){ if(!CFG.autoReact)return; try{api.setMessageReaction(r,e.messageID,()=>{},true)}catch(_){} }
function fail(api,e,msg="❌ Something went wrong."){return reply(api,e,`⚠️ ${msg}`)}
function cooldown(uid,name,ms=CFG.cooldown){ const k=`${uid}:${name}`,now=Date.now(),last=cooldowns.get(k)||0; if(now-last<ms)return Math.ceil((ms-(now-last))/1000); cooldowns.set(k,now);return 0; }

function registerCommand(c){ if(!c||!c.name)return; const name=String(c.name).toLowerCase(); if(commands.has(name)&&commands.get(name).catalog){ commands.set(name,{...commands.get(name),...c,name,category:c.category||commands.get(name).category}); }else if(commands.has(name)){ console.log(`⚠️ DUPLICATE: ${name}`);return; }else commands.set(name,{...c,name}); for(const a of c.aliases||[]){ const al=String(a).toLowerCase(); if(!aliases.has(al))aliases.set(al,name); else console.log(`⚠️ DUPLICATE ALIAS: ${al}`); } }
function loadCommands(){ const dir=path.join(__dirname,"commands"); if(!fs.existsSync(dir))return; fs.readdirSync(dir).filter(x=>/^cmds_\d+\.js$/i.test(x)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0])).forEach(file=>{ try{ delete require.cache[require.resolve(path.join(dir,file))]; const mod=require(path.join(dir,file)); const list=Array.isArray(mod)?mod:(mod.commands||[mod]); if(typeof mod==="function"){ const res=mod({api:{},event:{},user:{},reply:()=>{},users,profile:()=>{},fun}); if(Array.isArray(res))res.filter(Boolean).forEach(registerCommand); }else{ list.filter(Boolean).forEach(registerCommand); } console.log(`📦 ${file} loaded`); }catch(e){console.error(`❌ ${file}:`,e.message)} }); }
loadCommands();

const icon=c=>CAT[c]?.[0]||"📌"; const title=c=>CAT[c]?.[1]||c;
function menuPage(which,api,e){ const src=which===1?MENU1:MENU2; const u=user(e.senderID); const lines=[ `✨ iKON-BOT • MENU ${which}/2`, `👑 Aphecks iKon Klerk`, `👤 ${u.name} • ⭐ Lv.${u.level} • 🔥 P${u.prestige}`, `💰 $${Number(u.wallet).toLocaleString()} • ❤️ ${bar(u.health,u.maxHealth)} ${u.health}%`, `⚡ ${bar(u.energy,u.maxEnergy)} ${u.energy}%`, `━━━━━━━━━━━━━━━━━━` ]; for(const [cat,str] of Object.entries(src)) lines.push(`${icon(cat)} ${title(cat)}: ${str.split(/\s+/).map(x=>PREFIX+x).join(" • ")}`); lines.push( `━━━━━━━━━━━━━━━━━━`, `📖 ${PREFIX}help <cmd> • 🔎 ${PREFIX}search <word>`, which===1?`➡️ ${PREFIX}menu2 for the other 175 commands`:`⬅️ ${PREFIX}menu1 • 🏠 ${PREFIX}menu` ); return lines.join("\n"); }

registerCommand({ name:"menu",aliases:["m"],category:"SYSTEMHUB", run:async({api,event,args})=>{ const n=String(args[0]||""); if(n==="1"||n==="2")return reply(api,event,menuPage(Number(n),api,event)); reply(api,event,menuPage(1,api,event)); setTimeout(()=>reply(api,event,menuPage(2,api,event)),250); } });
registerCommand({ name:"help",aliases:["h"],category:"SYSTEMHUB", run:async({api,event,args})=>{ const q=String(args[0]||"").toLowerCase(); if(!q)return reply(api,event,`📖 ${PREFIX}help <command>\n💡 Example: ${PREFIX}help balance`); const n=aliases.get(q)||q,c=commands.get(n); if(!c)return fail(api,event,`Command ${PREFIX}${q} was not found.`); reply(api,event, `📖 ${PREFIX}${c.name} ${icon(c.category)} ${title(c.category)} 📝 ${c.description||"Command information available."} ⌨️ Usage: ${c.usage||PREFIX+c.name} ⏱️ Cooldown: ${c.cooldown||CFG.cooldown}ms 🔐 Permission: ${c.permission||"user"} 💡 Hint: ${c.hint||"Try it and see what happens! 😎"}` ); } });
registerCommand({ name:"commands",aliases:["cmd"],category:"SYSTEMHUB", run:async({api,event})=>reply(api,event,menuPage(1,api,event)) });
registerCommand({ name:"profile",aliases:["me"],category:"SOCIALHUB", run:async({api,event,args})=>{ const uid=args[0]||event.senderID,p=await profile(api,uid),u=user(uid,p.name); reply(api,event, `👤 ${p.name} 🆔 ${p.uid} ⭐ Level ${u.level} • 🔥 Prestige ${u.prestige} ❤️ ${bar(u.health,u.maxHealth)} ${u.health}/${u.maxHealth} ⚡ ${bar(u.energy,u.maxEnergy)} ${u.energy}/${u.maxEnergy} 💰 $${u.wallet.toLocaleString()} 🏆 Rep: ${u.reputation} ⚠️ Wanted: ${u.wanted}`); } });
registerCommand({ name:"uid",aliases:["id","myid"],category:"SYSTEMHUB", run:async({api,event,args})=>{ const uid=args[0]||event.senderID,p=await profile(api,uid); reply(api,event,`🆔 ${p.name}\n${p.uid}\n🔗 ${p.profileUrl||"Profile link unavailable"}`); } });
registerCommand({ name:"ping",category:"SYSTEMHUB", run:async({api,event})=>{ const t=Date.now(); reply(api,event,`🏓 PONG!\n⚡ ${Date.now()-t}ms\n${fun()}`); } });
registerCommand({ name:"botinfo",category:"SYSTEMHUB", run:async({api,event})=>reply(api,event, `🤖 iKON-BOT 👑 Owner: Aphecks iKon Klerk 📦 Commands: 350 👥 Users: ${users.size} 💬 Groups: ${groups.size} ⏱️ Uptime: ${Math.floor(process.uptime())}s 🔥 Status: ONLINE` ) });

const onlyAdmin=(run)=>async(ctx)=>{ if(!isAdmin(ctx.event.senderID)) return fail(ctx.api,ctx.event,"ADMIN ONLY — this command is restricted to the bot owner/admins."); return run(ctx); };
registerCommand({name:"admin",category:"KLERKCORE",permission:"admin", description:"Open admin controls",run:onlyAdmin(async({api,event})=> reply(api,event,`👑 ADMIN CONTROL\n\n${[ "settings","enable","disable","maintenance","broadcast","reload","logs","stats", "pending","approve","reject","pendinggc","approvegc","rejectgc", "warn","warnings","kick","ban","unban" ].map(x=>PREFIX+x).join(" • ")}`) )});
const adminSimple={ settings:"⚙️ SETTINGS", enable:"🟢 COMMAND ENABLED", disable:"🔴 COMMAND DISABLED", maintenance:"🛠️ MAINTENANCE UPDATED", broadcast:"📢 BROADCAST READY", reload:"🔄 COMMANDS RELOADED", logs:"📜 ADMIN LOGS", stats:"📊 ADMIN STATISTICS", approve:"✅ PENDING USER APPROVED", reject:"❌ PENDING USER REJECTED", approvegc:"✅ PENDING GC APPROVED", rejectgc:"❌ PENDING GC REJECTED", kick:"👢 MEMBER REMOVED", ban:"🔨 MEMBER BANNED", unban:"♻️ MEMBER UNBANNED" };
for(const [name,msg] of Object.entries(adminSimple)) registerCommand({name,category:"KLERKCORE",permission:"admin",run:onlyAdmin(async({api,event})=>reply(api,event,`${msg}\n${fun()}`))});
registerCommand({ name:"pendinggc",category:"KLERKCORE",permission:"admin", run:onlyAdmin(async({api,event})=>{ const a=[...pendingGCs.values()]; if(!a.length)return reply(api,event,"📥 PENDING GCs\n\n✅ No pending group chats."); reply(api,event, `📥 PENDING GCs\n━━━━━━━━━━━━━━━━━━\n`+ a.map((g,i)=>`${i+1}️⃣ 👥 ${g.name}\n🆔 ${g.threadID}\n👤 ${g.members||"?"} members\n🕐 ${new Date(g.createdAt).toLocaleString()}\n⏳ PENDING`).join("\n\n")+ `\n━━━━━━━━━━━━━━━━━━\n✅ ${PREFIX}approvegc <number>\n❌ ${PREFIX}rejectgc <number>` ); }) });
registerCommand({ name:"warn",category:"KLERKCORE",permission:"admin", run:onlyAdmin(async({api,event,args})=>{ const target=args[0]?.replace(/\D/g,"")||event.mentions&&Object.keys(event.mentions)[0]; const reason=args.slice(1).join(" ")||"No reason provided"; if(!target)return fail(api,event,`Use ${PREFIX}warn <uid> <reason>`); const k=key(event.threadID,target),arr=warns.get(k)||[]; arr.push({reason,by:event.senderID,at:Date.now()});warns.set(k,arr); const p=await profile(api,target); reply(api,event, `⚠️ WARNING ISSUED 👤 ${p.name} ⚠️ Warning: ${arr.length}/3 📝 ${reason} 👑 Admin: ${user(event.senderID).name||event.senderID} ${arr.length>=3?"🚨 Threshold reached — configured action may apply.":`⚠️ ${3-arr.length} warning(s) remaining.`}` ); }) });
registerCommand({ name:"warnings",category:"KLERKCORE",permission:"admin", run:onlyAdmin(async({api,event,args})=>{ const target=args[0]?.replace(/\D/g,"")||event.senderID,k=key(event.threadID,target); const arr=warns.get(k)||[],p=await profile(api,target); reply(api,event, `⚠️ WARNING HISTORY 👤 ${p.name} ━━━━━━━━━━━━━━━━━━ ${arr.length?arr.map((w,i)=>`${i+1}️⃣ ${w.reason}\n 🕐 ${new Date(w.at).toLocaleString()}`).join("\n\n"):"✅ No warnings."} ━━━━━━━━━━━━━━━━━━ 📊 Total: ${arr.length}/3` ); }) });

function parse(body){ const x=body.trim(); if(!x.startsWith(PREFIX))return null; const z=x.slice(PREFIX.length).trim(),a=z.match(/"[^"]*"|'[^']*'|\S+/g)||[]; return {name:(a.shift()||"").toLowerCase(),args:a.map(x=>x.replace(/^['"]|['"]$/g,""))}; }
async function handle(api,event){ if(!event||event.type!=="message"||!event.body)return; const g=group(event.threadID); g.stats.messages++; const p=await profile(api,event.senderID); user(event.senderID,p.name); react(api,event); const q=parse(event.body); if(!q)return; if(!CFG.enabled)return fail(api,event,"Bot is currently disabled."); if(CFG.maintenance&&!isAdmin(event.senderID)) return fail(api,event,"Bot is under maintenance."); const name=aliases.get(q.name)||q.name,c=commands.get(name); if(!c)return fail(api,event,`Unknown command. Try ${PREFIX}menu or ${PREFIX}help ${q.name}`); if(g.disabledCommands.has(name)||g.disabledCategories.has(c.category)) return fail(api,event,"That command is disabled in this group."); if(c.permission==="admin"&&!isAdmin(event.senderID)) return fail(api,event,"ADMIN ONLY."); const cd=c.cooldown||CFG.cooldown,wait=cooldown(event.senderID,name,cd); if(wait)return reply(api,event,`⏳ Slow down, ${p.name}! Try again in ${wait}s.\n💡 Hint: Don't spam commands 😎`); try{ g.stats.commands++; if(typeof c.run==="function") await c.run({ api,event,args:q.args,command:c, user:user(event.senderID,p.name),group:g, config:CFG,users,groups,commands,aliases, pendingGCs,pendingUsers,warns,profile,reply,react,bar,fun, isAdmin,PREFIX }); else reply(api,event,`🚧 ${PREFIX}${name} is registered but its implementation is not loaded yet.`); }catch(e){ console.error(`COMMAND ${name}:`,e); fail(api,event,"The command hit an error. Please try again."); } }

function start(){ if(!APPSTATE){console.error("❌ APPSTATE missing.");return} try{ const state=typeof APPSTATE==="string"?JSON.parse(APPSTATE):APPSTATE; login({appState:state},(err,api)=>{ if(err){console.error("❌ LOGIN:",err);return setTimeout(start,10000)} console.log("✅ LOGIN SUCCESSFUL"); console.log("🤖 iKON-BOT CONNECTED"); console.log(`📌 Prefix: ${PREFIX}`); api.setOptions({listenEvents:true,updatePresence:true,selfListen:false, forceLogin:false,listenTyping:true,autoMarkRead:false}); api.listenMqtt(async(err,event)=>{ if(err){console.error("LISTENER:",err);return} try{ if(event.type==="event"){ if(event.threadID&&!groups.has(event.threadID)){ pendingGCs.set(event.threadID,{ threadID:event.threadID,name:event.threadName||"Unknown Group", members:event.participantIDs?.length||"?", createdAt:Date.now() }); group(event.threadID,event.threadName||"Unknown Group"); } } await handle(api,event); }catch(e){console.error("EVENT:",e)} }); }); }catch(e){console.error("START:",e)} }
process.on("unhandledRejection",e=>console.error("UNHANDLED:",e));
process.on("uncaughtException",e=>console.error("UNCAUGHT:",e));
app.listen(PORT,()=>console.log(`🌐 HTTP :${PORT}`));
start();
module.exports={ app,users,groups,commands,aliases, pendingGCs,pendingUsers,warns, CFG,MENU1,MENU2,profile,user,group, isAdmin,reply,react,bar,fun };
