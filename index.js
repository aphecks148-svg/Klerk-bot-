require("dotenv").config();
const fs=require("fs"),path=require("path"),express=require("express"),FCA=require("ws3-fca");
const login=typeof FCA==="function"?FCA:FCA.login;
const app=express();
const PORT=Number(process.env.PORT||10000);
const PREFIX=process.env.PREFIX||"!";
const APPSTATE=process.env.APPSTATE||"./appstate.json";
const COOLDOWN=Number(process.env.COOLDOWN||1200);
const GEMINI_KEY=process.env.GEMINI_API_KEY||process.env.GEMINI_KEY||"";
const GEMINI_MODEL=process.env.GEMINI_MODEL||"gemini-1.5-flash";
const ADMIN_UIDS=String(process.env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean);

let GoogleGenAI=null,geminiClient=null,Canvas=null;
try{
  ({GoogleGenAI}=require("@google/genai"));
  if(GEMINI_KEY) geminiClient=new GoogleGenAI({apiKey:GEMINI_KEY});
}catch{}
try{Canvas=require("canvas")}catch{try{Canvas=require("@napi-rs/canvas")}catch{}}
app.use(express.json({limit:"2mb"}));

const users=new Map(),groups=new Map(),commands=new Map(),aliases=new Map(),cooldowns=new Map(),profiles=new Map(),processed=new Map(),commandStats=new Map(),pendingGC=new Map();
global.users=users;global.groups=groups;global.commands=commands;

const DATA=path.join(__dirname,"data");
const GCFILE=path.join(DATA,"groups.json");
if(!fs.existsSync(DATA)) fs.mkdirSync(DATA,{recursive:true});

const defaultUser=uid=>({
  uid:String(uid),name:"Unknown",firstName:"User",profileUrl:"",avatar:"",
  wallet:100000,bank:0,vault:0,cash:100000,level:1,xp:0,prestige:0,
  health:100,energy:100,stamina:100,wanted:0,jailUntil:0,
  inventory:{},pets:[],cars:[],weapons:[],businesses:[],properties:[],
  achievements:[],skills:{},equipment:{},stats:{},warnings:0,admin:false,
  ai:{uses:0,level:1,xp:0}
});

const defaultGroup=tid=>({
  threadID:String(tid),name:"Unknown Group",enabled:true,approved:false,pending:false,
  prefix:PREFIX,welcome:true,goodbye:true,autoReact:false,antiSpam:true,
  disabledCommands:new Set(),disabledCategories:new Set(),admins:[],
  stats:{messages:0,commands:0}
});

function loadGroups(){
  try{
    if(fs.existsSync(GCFILE)){
      const x=JSON.parse(fs.readFileSync(GCFILE,"utf8"));
      for(const[k,v]of Object.entries(x)){
        groups.set(k,{...defaultGroup(k),...v,disabledCommands:new Set(v.disabledCommands||[]),disabledCategories:new Set(v.disabledCategories||[])});
      }
    }
  }catch{}
}
function saveGroups(){
  try{
    const x={};
    for(const[k,v]of groups) x[k]={...v,disabledCommands:[...(v.disabledCommands||[])],disabledCategories:[...(v.disabledCategories||[])]};
    fs.writeFileSync(GCFILE,JSON.stringify(x,null,2));
  }catch{}
}
loadGroups();

function getUser(uid,name){uid=String(uid);if(!users.has(uid))users.set(uid,defaultUser(uid));const u=users.get(uid);if(name&&name!=="Unknown")u.name=name;return u}
function getGroup(tid,name){tid=String(tid);if(!groups.has(tid))groups.set(tid,defaultGroup(tid));const g=groups.get(tid);if(name&&name!=="Unknown Group")g.name=name;return g}
function isAdmin(uid,u){return ADMIN_UIDS.includes(String(uid))||u?.admin===true}
function norm(x){return String(x||"").trim().toLowerCase()}
function fmt(n){return Number(n||0).toLocaleString()}
function uptime(s){s=Math.floor(s);const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);return `${d}d ${h}h ${m}m ${s%60}s`}
function parse(s){const a=[],r=/"([^"]+)"|'([^']+)'|(\S+)/g;let m;while((m=r.exec(s)))a.push(m[1]||m[2]||m[3]);return a}
function stat(n){commandStats.set(n,(commandStats.get(n)||0)+1)}
function reply(api,event,text){return new Promise((res,rej)=>{try{api.sendMessage(String(text??""),event.threadID,e=>e?rej(e):res(),event.messageID)}catch(e){rej(e)}})}

async function getProfile(api,uid){
  uid=String(uid);
  if(profiles.has(uid)) return profiles.get(uid);
  try{
    const x=await new Promise((r,j)=>api.getUserInfo(uid,(e,d)=>e?j(e):r(d)));
    const p=x?.[uid]||x||{};
    const z={uid,name:p.name||"Unknown",firstName:p.firstName||"User",profileUrl:p.profileUrl||"",avatar:p.thumbSrc||""};
    profiles.set(uid,z);return z;
  }catch{return{uid,name:"Unknown",firstName:"User",profileUrl:"",avatar:""}}
}

async function askGemini(prompt,user){
  if(!geminiClient) throw Error("Gemini API not configured");
  const r=await geminiClient.models.generateContent({
    model:GEMINI_MODEL,
    contents:String(prompt),
    config:{systemInstruction:"You are iKON-BOT friendly Messenger bot concise.",temperature:.8,maxOutputTokens:1200}
  });
  const t=typeof r.text==="function"?r.text():r.text;
  if(!t) throw Error("No text");
  if(user){user.ai=user.ai||{uses:0,level:1,xp:0};user.ai.uses++;user.ai.xp++;if(user.ai.xp>=10){user.ai.level++;user.ai.xp=0}}
  return String(t).trim();
}

const C={
1:["balance","deposit","withdraw","transfer","daily","weekly","monthly","work","job","jobs","salary","beg","invest","loan","credit","business","property","networth","tax","payday","bonus","cashdrop","bankinterest","savings","vault","money","richest","economy","bal"],
2:["shop","buy","sell","inventory","use","trade","market","auction","items","prices","iteminfo","materials","storage","stash","gift","give","exchange","bundle","restock","rarity","blueprint","salvage","craft","collection","stashinfo","sellall","marketvalue","restockinfo","marketquest","itemdrop","itemsearch","itemcount","materialvalue","markethelp","inv"],
3:["pet","pets","adopt","petinfo","feed","train","evolve","petbattle","pettrade","release","petstats","petlevel","petxp","petheal","petpower","petduel","petgift","petrename","petcollection","petrare","petbreed","petmerge","petrevive","petarmor","petweapon","petquest","petmission","petfood","petgear","petsearch","petleaderboard","petstatus","petreset","pethunt","pethelp"],
4:["farm","plant","seeds","water","harvest","fertilize","farminfo","field","crop","crops","garden","greenhouse","grow","replant","farmsell","farmshop","farmupgrade","farmlevel","farmxp","farmlog","compost","irrigation","fertilizerbox","harvestall","farmquest","seedbuy","seedcount","cropvalue","farmpower","farmrank","farmcollect","farmstatus","farmhelp"],
5:["mine","ores","oreinfo","dig","excavate","prospect","smelt","forge","fish","bait","fishingrod","fishinfo","fishinglevel","fishquest","hunt","animals","tracking","trap","catch","cook","camp","explore","gather","resources","miningrank","huntingrank","frontier","map","cave","resourcevalue","frontierquest","frontierlevel","frontiergear","frontierhelp"],
6:["stats","level","xp","skills","skilltree","upgrade","prestige","rebirth","battle","attack","defend","ultimate","pvp","arena","dungeon","raid","boss","adventure","quest","mission","equipment","loadout","equipweapon","equiparmor","heal","energy","defense","power","critical","combo","rage","mana","weaponrank","bossrank","raidrank","arenarank","battlepass","bountyxp","combat","battlehelp"],
7:["garage","carshop","buycar","sellcar","carinfo","drive","race","raceinfo","tune","upgradecar","racerank","drivelevel","drivexp","wanted","heat","rep","streetstats","heistcar","carjack","robbery","police","escape","bribe","streetjob","delivery","garageupgrade","garageinfo","cartrade","carlist","streetmarket","gta","streetking","carpower","carcollection","streethelp","streetcash","streetreset"],
8:["crime","pickpocket","shoplift","burglary","smuggling","bankjob","armored","casinojob","vaultjob","heist","planheist","heistinfo","crew","joinheist","leaveheist","startheist","cancelheist","crimeinfo","crimelevel","crimerep","heat","coolheat","blackmarket","blackbuy","safehouse","upgradehouse","fence","launder","blackdeal","hit","assassin","crimejobs","crimeleaderboard","heistleaderboard","crimehistory","underworldrank","criminal","crimecooldown","underhelp","underworldreset"],
9:["casino","gamble","coinflip","dice","slots","roulette","blackjack","poker","baccarat","casinostats","casinolevel","casinorank","jackpot","highroll","allin","double","lucky","gambleinfo","winrate","streak","losses","wins","wagered","casinowallet","fortunecookie","risk","safeplay","casinoreset","luckyvault","gamblehelp","casinoresetstreak","casinofortune","houseedge","casinoabout","luckyleaderboard"],
10:["me","social","bio","status","rep","friends","follow","unfollow","followers","following","addfriend","removefriend","post","posts","like","likes","compliment","roast","ship","match","rate","truth","dare","8ball","dicegame","compliments","leaderboard","friendrank","followrank","postrank","sociallevel","socialquest","dailychat","socialstats","socialsearch","socialreset","socialhelp"],
11:["ai","ask","aichat","aijoke","aifact","advice","translate","summarize","rewrite","aicode","ailevel","aistats","aihelp","neuralrank","aireset","football","sports","player","team","fixtures","scores","standings","sportstats","footballquiz","sportsquiz","footballbattle","penalty","freekick","shootout","arena","arenastats","arenalb","goalrank","sportsdaily","arenahelp","sportreset"],
12:["admin","settings","enable","disable","maintenance","broadcast","reload","logs","stats","pending","approve","reject","pendinggc","approvegc","rejectgc","warn","warnings","kick","ban","unban","mute","unmute","freeze","unfreeze","groupinfo","groupname","welcome","goodbye","antispam","autoreact","cooldown","user","finduid","commandstats","adminhelp","adminrank","audit","security","klerkmenu","menu","commands","system","health","memory","modules","search","uptime","ping","botinfo","systemhelp","server","version","resetuser","setprefix","shutdown","klerk","systemreset"]
};

function register(n,fn,file){
  n=norm(n);
  if(!n||typeof fn!=="function") return;
  if(commands.has(n)) return;
  commands.set(n,{name:n,run:fn,file});
}

function loadCommands(){
  commands.clear();aliases.clear();
  const d=path.join(__dirname,"commands");
  if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true});
  const files=fs.readdirSync(d).filter(x=>/^cmds_\d+\.js$/i.test(x)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
  for(const f of files){
    try{
      const p=path.join(d,f);
      delete require.cache[require.resolve(p)];
      const m=require(p);
      const cat=C[Number(f.match(/\d+/)[0])]||[];
      if(typeof m==="function"){for(const n of cat) register(n,m,f)}
      else if(Array.isArray(m)){for(const c of m) register(c.name,c.run||c.execute||c.handler,f)}
      else if(m?.commands){for(const c of(Array.isArray(m.commands)?m.commands:Object.values(m.commands))) register(c.name,c.run||c.execute||c.handler,f)}
      else if(typeof m==="object"){for(const[n,c]of Object.entries(m)) if(typeof c==="function") register(n,c,f);else if(c) register(c.name||n,c.run||c.execute||c.handler||c,f)}
    }catch(e){console.log(f,e.message)}
  }
  console.log(commands.size+" commands loaded");
}

const AI=new Set(["ai","ask","aichat","aijoke","aifact","advice","translate","summarize","rewrite","aicode"]);
const AIINFO=new Set(["ailevel","aistats","aihelp","neuralrank","aireset"]);

async function runAI(n,args,u,send){
  if(n==="aireset"){u.ai={uses:0,level:1,xp:0};return send("AI reset")}
  if(n==="ailevel") return send(`AI LEVEL ${u.ai?.level||1}`);
  if(n==="aistats") return send(`AI Uses:${u.ai?.uses||0} Lv:${u.ai?.level||1} XP:${u.ai?.xp||0}`);
  if(n==="aihelp") return send("AI: ai ask aichat aijoke aifact advice translate summarize rewrite aicode");
  const q=args.join(" ").trim();
  if(!q) return send(`Use ${PREFIX}${n} <question>`);
  if(!geminiClient) return send("Gemini not configured add GEMINI_API_KEY");
  const prompts={aijoke:`joke about ${q}`,aifact:`fact about ${q}`,advice:`advice about ${q}`,translate:`translate ${q}`,summarize:`summarize ${q}`,rewrite:`rewrite ${q}`,aicode:`code ${q}`,ask:q,aichat:q,ai:q};
  try{const out=await askGemini(prompts[n]||q,u);return send(out)}
  catch(e){return send(`Gemini error ${e.message}`)}
}

const built={};
built.menu=async({reply,args,user,group,event})=>{
  const pre=event.body[0]||"!";
  let input=norm(args[0]||"1");
  // handle menu1 -> 1
  if(input.startsWith("menu")) input=input.replace("menu","");
  let pg=Number(input||1);
  if(isNaN(pg)||pg<1) pg=1;
  if(pg>2) pg=2;
  const sets=pg===2?[[7,"STREETKINGS"],[8,"UNDERWORLD"],[9,"LUCKYVAULT"],[10,"SOCIALHUB"],[11,"NEURALINK"],[12,"KLERKCORE"]]:[[1,"MONEYFORGE"],[2,"MARKETVERSE"],[3,"WILDHEART"],[4,"EARTHBOUND"],[5,"FRONTIER"],[6,"BATTLECORE"]];
  let s=`iKON-BOT MENU ${pg}/2 ${user.name} Lv.${user.level||1} $${fmt(user.wallet)}\n`;
  for(const[n,t]of sets) s+=`${t}\n${C[n].map(x=>`${pre}${x}`).join(" • ")}\n\n`;
  s+=`help <cmd> search <word> ${pg===1?pre+"menu 2":pre+"menu 1"}`;
  reply(s);
};
built.commands=async({reply,group,event})=>{const pre=event.body[0]||"!";reply([...commands.keys()].sort().map(x=>pre+x).join(" • "))};
built.help=async({reply,args,group,event})=>{const pre=event.body[0]||"!";const n=norm(args[0]);reply(n&&commands.has(n)?`${pre}${n} from ${commands.get(n).file}`:`Use ${pre}menu 1 / menu 2`)};
built.search=async({reply,args,group,event})=>{const pre=event.body[0]||"!";const q=norm(args.join(" ")),x=[...commands.keys()].filter(n=>n.includes(q));reply(x.length?x.map(n=>pre+n).join(" • "):"No commands")};
built.uid=async({reply,event})=>reply(`UID ${event.senderID}`);
built.ping=async({reply})=>reply("PONG");
built.uptime=async({reply})=>reply(uptime(process.uptime()));
built.botinfo=async({reply})=>reply(`iKON-BOT ONLINE ${commands.size} cmds ${groups.size} groups gemini ${geminiClient?"ON":"OFF"}`);
built.profile=async({api,event,args,reply})=>{const id=args[0]||event.senderID,p=await getProfile(api,id),u=getUser(id);reply(`${p.name} ${id} Lv.${u.level} $${fmt(u.wallet)}`)};
built.admin=async({reply,event,user})=>reply(isAdmin(event.senderID,user)?"ADMIN BYPASS":"Admin only");
built.pending=async({reply,event,user})=>{if(!isAdmin(event.senderID,user))return reply("Admin only");const a=[...groups.values()].filter(g=>g.pending&&!g.approved);reply(a.length?a.map(g=>`${g.threadID} ${g.name}`).join("\n"):"No pending")};
built.pendinggc=built.pending;
built.approve=async({reply,event,user,args})=>{if(!isAdmin(event.senderID,user))return reply("Admin only");const id=String(args[0]||event.threadID),g=getGroup(id);g.approved=true;g.pending=false;g.rejected=false;saveGroups();reply(`Approved ${id}`)};
built.approvegc=built.approve;
built.reject=async({reply,event,user,args})=>{if(!isAdmin(event.senderID,user))return reply("Admin only");const id=String(args[0]||event.threadID),g=getGroup(id);g.approved=false;g.pending=false;g.rejected=true;saveGroups();reply(`Rejected ${id}`)};
built.rejectgc=built.reject;
built.enable=async({reply,event,user,args,group})=>{if(!isAdmin(event.senderID,user))return reply("Admin only");group.disabledCommands.delete(norm(args[0]));saveGroups();reply(`Enabled ${args[0]}`)};
built.disable=async({reply,event,user,args,group})=>{if(!isAdmin(event.senderID,user))return reply("Admin only");group.disabledCommands.add(norm(args[0]));saveGroups();reply(`Disabled ${args[0]}`)};
built.reload=async({reply,event,user})=>{if(!isAdmin(event.senderID,user))return reply("Admin only");loadCommands();reply(`${commands.size} reloaded`)};
built.system=async({reply})=>reply(`ONLINE ${commands.size} cmds ${groups.size} groups ${uptime(process.uptime())}`);
built.health=built.system;
built.memory=async({reply})=>{const m=process.memoryUsage();reply(`RSS ${Math.round(m.rss/1048576)}MB Heap ${Math.round(m.heapUsed/1048576)}MB`)};

for(const[n,f]of Object.entries(built)) if(!commands.has(n)) commands.set(n,{name:n,run:f,file:"index.js"});
loadCommands();
for(const[n,f]of Object.entries(built)) if(!commands.has(n)) commands.set(n,{name:n,run:f,file:"index.js"});

async function dispatch(api,event){
  if(!event||event.type!=="message"||!event.body||!event.senderID) return;
  const tid=String(event.threadID),sid=String(event.senderID),body=String(event.body).trim();
  if(event.messageID){if(processed.has(event.messageID)) return;processed.set(event.messageID,Date.now());setTimeout(()=>processed.delete(event.messageID),60000)}
  const p=await getProfile(api,sid),u=getUser(sid,p.name),g=getGroup(tid,event.threadName);
  u.firstName=p.firstName||u.firstName;u.profileUrl=p.profileUrl||u.profileUrl;u.avatar=p.avatar||u.avatar;
  g.stats.messages++;

  // FIX: support both. and! prefix
  let pre=null;
  if(body.startsWith("!")) pre="!";
  else if(body.startsWith(".")) pre=".";
  else if(body.startsWith(g.prefix)) pre=g.prefix;
  else if(body.startsWith(PREFIX)) pre=PREFIX;
  else return;

  let rawBody=body.slice(pre.length).trim();
  const parts=parse(rawBody);
  let raw=norm(parts.shift());
  if(!raw) return;

  // FIX:!menu1 =>!menu 1
  const mm=raw.match(/^menu(\d+)$/);
  if(mm){ raw="menu"; parts.unshift(mm[1]); }
  const m2=raw.match(/^([a-z]+)(\d+)$/);
  if(m2 &&!commands.has(raw)){ raw=m2[1]; parts.unshift(m2[2]); }

  // FIX aliases like bal
  const aliasMap={bal:"balance",inv:"inventory",prof:"profile",fb:"football",n:"menu"};
  if(aliasMap[raw]) raw=aliasMap[raw];

  if(!isAdmin(sid,u)&&!g.approved){g.pending=true;pendingGC.set(tid,g);saveGroups();return reply(api,event,`PENDING GC needs approval ID ${tid}`)}
  let n=commands.has(raw)?raw:aliases.get(raw)||raw;
  if(!commands.has(n)) return reply(api,event,`Unknown ${pre}${raw} Try ${pre}menu`);
  if(g.disabledCommands.has(n)&&!isAdmin(sid,u)) return reply(api,event,`${pre}${n} disabled`);
  const key=`${sid}:${n}`,now=Date.now(),last=cooldowns.get(key)||0,cd=Number(commands.get(n).cooldown||COOLDOWN);
  if(now-last<cd) return reply(api,event,`Slow down ${(cd-now+last)/1000}s`);
  cooldowns.set(key,now);g.stats.commands++;stat(n);
  const send=t=>reply(api,event,t);
  if(AI.has(n)||AIINFO.has(n)) return runAI(n,parts,u,send);

  // FIX: fun is both function and object (for your cmds)
  function funFn(a,b){
    if(typeof a==="number" && typeof b==="number") return Math.floor(Math.random()*(b-a+1))+a;
    return Math.floor(Math.random()*100)+1;
  }
  funFn.fmt=fmt; funFn.formatNumber=fmt;
  funFn.random=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  funFn.isAdmin=id=>isAdmin(id,getUser(id));
  funFn.gemini=q=>askGemini(q,u); funFn.askGemini=q=>askGemini(q,u); funFn.canvas=Canvas;

  try{
    await commands.get(n).run({
      api,event,args:parts,body,user:u,group:g,users,groups,commands,
      profile:id=>getProfile(api,id),reply:send,fun:funFn
    });
  }catch(e){console.log(n,e.stack||e);await send(`${pre}${n} error ${e.message}`)}
}

function loginBot(){
  let state=APPSTATE;
  try{
    if(typeof state==="string"&&state.trim().startsWith("[")) state=JSON.parse(state);
    else if(typeof state==="string"&&fs.existsSync(state)) state=JSON.parse(fs.readFileSync(state,"utf8"));
  }catch(e){console.log("APPSTATE error",e.message)}
  login({appState:state},(err,api)=>{
    if(err){console.log("LOGIN error",err);return setTimeout(loginBot,10000)}
    console.log(`iKON-BOT ONLINE ${commands.size} CMDS GEMINI ${geminiClient?"ON":"OFF"}`);
    try{
      api.setOptions({listenEvents:true,selfListen:false,updatePresence:true});
      api.setMessageReaction=(emoji,mid,cb,force)=>{ if(typeof cb==="function") cb(null); return Promise.resolve(); };
      if(api.setPostReaction) api.setPostReaction=(a,b,c)=>{ if(typeof c==="function") c(null); return Promise.resolve(); };
    }catch{}
    api.listenMqtt(async(e,event)=>{if(e)return console.log("MQTT",e);try{await dispatch(api,event)}catch(x){console.log("DISPATCH",x)}});
  });
}

app.get("/",(q,s)=>s.json({status:"ACTIVE",bot:"iKON-BOT",commands:commands.size,groups:groups.size,gemini:!!geminiClient,canvas:!!Canvas,uptime:process.uptime()}));
app.get("/health",(q,s)=>s.json({ok:true,status:"ONLINE",commands:commands.size,uptime:process.uptime()}));
app.listen(PORT,()=>console.log(`Server ${PORT}`));
process.on("uncaughtException",e=>console.log("UNCAUGHT",e.stack||e));
process.on("unhandledRejection",e=>console.log("REJECTION",e));
loginBot();
