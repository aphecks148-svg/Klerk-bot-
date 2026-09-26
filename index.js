// index.js
require("dotenv").config();
const fs=require("fs"),path=require("path"),express=require("express");
const FCA=require("ws3-fca");
const login=typeof FCA==="function"?FCA:FCA.login;
const app=express();
const PORT=process.env.PORT||1000,PREFIX=process.env.PREFIX||"!",APPSTATE=process.env.APPSTATE||"./appstate.json";
const ADMIN_UIDS=String(process.env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean);
const COOLDOWN=Number(process.env.COOLDOWN||1200),AUTO_REACT=process.env.AUTO_REACT||"👍";
const users=new Map(),groups=new Map(),commands=new Map(),aliases=new Map(),cooldowns=new Map(),spam=new Map(),commandStats=new Map(),profiles=new Map(),processed=new Map();
global.users=users;global.groups=groups;global.commands=commands;

const DEFAULT_USER=uid=>({uid:String(uid),name:"Unknown",firstName:"User",profileUrl:"",avatar:"",wallet:100000,bank:0,vault:0,savings:0,cash:100000,level:1,xp:0,prestige:0,health:100,maxHealth:100,energy:100,maxEnergy:100,stamina:100,maxStamina:100,reputation:0,credit:500,wanted:0,jailUntil:0,job:null,inventory:{},pets:[],cars:[],weapons:[],businesses:[],properties:[],achievements:[],skills:{},equipment:{weapon:null,armor:null},stats:{},warnings:0,admin:false});
const DEFAULT_GROUP=(tid,name)=>({threadID:String(tid),name:name||"Unknown Group",enabled:true,prefix:PREFIX,welcome:true,goodbye:true,autoReact:true,antiSpam:true,disabledCommands:new Set(),disabledCategories:new Set(),admins:[],stats:{messages:0,commands:0}});

function getUser(uid,name){uid=String(uid);if(!users.has(uid))users.set(uid,DEFAULT_USER(uid));let u=users.get(uid);if(name&&(!u.name||u.name==="Unknown"))u.name=name;return u}
function getGroup(tid,name){tid=String(tid);if(!groups.has(tid))groups.set(tid,DEFAULT_GROUP(tid,name));let g=groups.get(tid);if(name&&name!=="Unknown Group")g.name=name;return g}
function reply(api,event,text){return api.sendMessage(String(text),event.threadID,()=>{},event.messageID)}
async function profile(api,uid){uid=String(uid);if(profiles.has(uid))return profiles.get(uid);try{const x=await new Promise((res,rej)=>api.getUserInfo(uid,(e,d)=>e?rej(e):res(d)));const p=x&&x[uid]?x[uid]:x||{};const z={uid,name:p.name||p.fullName||"Unknown",firstName:p.firstName||p.name||"User",profileUrl:p.profileUrl||p.vanity||"",avatar:p.thumbSrc||p.url||p.photo||""};profiles.set(uid,z);return z}catch(e){return{uid,name:"Unknown",firstName:"User",profileUrl:"",avatar:""}}}
function isAdmin(uid,u){return ADMIN_UIDS.includes(String(uid))||u.admin===true}
function parse(s){const a=[],r=/"([^"]+)"|'([^']+)'|(\S+)/g;let m;while((m=r.exec(s)))a.push(m[1]||m[2]||m[3]);return a}
function norm(x){return String(x||"").trim().toLowerCase()}
function stat(name){commandStats.set(name,(commandStats.get(name)||0)+1)}
function commandList(){return [...commands.keys()].sort()}
function menu(u,g){return`✨ iKON-BOT • MENU\n👑 Aphecks iKon Klerk\n👤 ${u.name} • ⭐ Lv.${u.level||1} • 🔥 P${u.prestige||0} • 💰 $${Number(u.wallet||0).toLocaleString()}\n❤️ ${u.health||100}/${u.maxHealth||100} • ⚡ ${u.energy||100}/${u.maxEnergy||100}\n━━━━━━━━━━━━━━━━━━\n💰 MONEYFORGE: balance • deposit • withdraw • transfer • work • job • invest\n🛒 MARKETVERSE: shop • buy • sell • inventory • craft • market • trade\n🐾 WILDHEART: pet • pets • adopt • feed • train • evolve • petbattle\n🌾 EARTHBOUND: farm • plant • water • harvest • seeds • grow • farmupgrade\n⛏️ FRONTIER: mine • ores • fish • hunt • explore • gather • smelt\n⚔️ BATTLECORE: stats • skills • battle • attack • defend • dungeon • raid • boss\n🚘 STREETKINGS: garage • carshop • drive • race • wanted • police • robbery\n💀 UNDERWORLD: crime • heist • crew • blackmarket • safehouse • hit\n🎰 LUCKYVAULT: casino • gamble • slots • roulette • blackjack • poker\n❤️ SOCIALHUB: me • bio • friends • follow • post • like • truth • dare\n🤖 NEURALINK/ARENA: ai • ask • translate • football • fixtures • standings\n👑 KLERKCORE/SYSTEM: admin • settings • pending • warn • kick • ban • system\n━━━━━━━━━━━━━━━━━━\n📖 ${g.prefix}help <cmd> • 🔎 ${g.prefix}search <word> • 📋 ${g.prefix}commands`}

function register(file,mod){
 let arr=Array.isArray(mod)?mod:(typeof mod==="function"?[mod]:mod&&Array.isArray(mod.commands)?mod.commands:[]);
 for(const c of arr){
  if(!c)continue;
  const names=[c.name,...(c.aliases||[])].filter(Boolean).map(norm);
  if(!names.length)continue;
  const fn=typeof c==="function"?c:(c.run||c.execute||c.handler);
  if(typeof fn!=="function")continue;
  const main=names[0];
  if(commands.has(main)){console.log(`⚠️ DUPLICATE COMMAND: ${main} ← ${file}`);continue}
  commands.set(main,{...c,name:main,run:fn,file});
  for(const a of names.slice(1)){
   if(commands.has(a)||aliases.has(a)){console.log(`⚠️ DUPLICATE ALIAS: ${a} ← ${file}`);continue}
   aliases.set(a,main)
  }
 }
}

function loadCommands(){
 commands.clear();aliases.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
 const files=fs.readdirSync(dir).filter(x=>/^cmds_\d+\.js$/i.test(x)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
 for(const f of files){
  try{const p=path.join(dir,f);delete require.cache[require.resolve(p)];register(f,require(p));console.log(`📦 ${f} loaded`)}
  catch(e){console.log(`❌ ${f}: ${e.message}`)}
 }
 console.log(`✅ ${commands.size} commands • ${aliases.size} aliases`)
}
loadCommands();

const builtins={
 menu:{aliases:["help"],run:async({api,event,user,group,args,reply})=>reply(menu(user,group))},
 commands:{aliases:["cmds"],run:async({reply,group})=>reply(`📋 COMMANDS\n${[...commands.keys()].map(x=>group.prefix+x).join(" • ")}`)},
 search:{aliases:["findcmd"],run:async({reply,args,group})=>{const q=norm(args.join(" "));const a=commandList().filter(x=>x.includes(q));reply(a.length?`🔎 MATCHES\n${a.map(x=>group.prefix+x).join(" • ")}`:"❌ No matching command.")}},
 profile:{aliases:["whois"],run:async({api,event,args,user,reply})=>{const uid=args[0]||event.senderID,p=await profile(api,uid);reply(`👤 PROFILE\n━━━━━━━━━━━━\n🆔 ${p.uid}\n📛 ${p.name}\n⭐ Level: ${getUser(uid).level||1}\n🔥 Prestige: ${getUser(uid).prestige||0}\n💰 $${Number(getUser(uid).wallet||0).toLocaleString()}\n🖼️ ${p.avatar?"Profile picture available":"No picture available"}`)}},
 uid:{aliases:["myuid"],run:async({event,reply})=>reply(`🆔 UID: ${event.senderID}`)},
 ping:{run:async({reply})=>reply(`🏓 PONG • iKON-BOT ONLINE\n⚡ ${Date.now()%1000}ms`)},
 uptime:{run:async({reply})=>reply(`⏱️ Uptime: ${formatUptime(process.uptime())}`)},
 botinfo:{run:async({reply})=>reply(`🤖 iKON-BOT\n📦 Modules: 12\n📋 Commands: ${commands.size}\n🔗 Aliases: ${aliases.size}\n⚡ Prefix: ${PREFIX}\n🟢 Status: ONLINE`)},
 admin:{run:async({event,user,reply})=>reply(isAdmin(event.senderID,user)?`👑 GLOBAL ADMIN\n🆔 ${event.senderID}\n🔓 Full control enabled.`:"⛔ Admin permission required.")},
 settings:{run:async({event,user,group,reply})=>reply(isAdmin(event.senderID,user)?`⚙️ SETTINGS\nPrefix: ${group.prefix}\nAutoReact: ${group.autoReact?"ON":"OFF"}\nWelcome: ${group.welcome?"ON":"OFF"}\nGoodbye: ${group.goodbye?"ON":"OFF"}\nAntiSpam: ${group.antiSpam?"ON":"OFF"}`:"⛔ Admin permission required.")},
 enable:{run:async({event,user,args,reply})=>{if(!isAdmin(event.senderID,user))return reply("⛔ Admin permission required.");const x=norm(args[0]);if(!x)return reply("Usage: enable <command>");const g=groups.get(String(event.threadID));if(g?.disabledCommands)g.disabledCommands.delete(x);reply(`✅ Enabled: ${x}`)}},
 disable:{run:async({event,user,args,reply})=>{if(!isAdmin(event.senderID,user))return reply("⛔ Admin permission required.");const x=norm(args[0]);if(!x)return reply("Usage: disable <command>");const g=groups.get(String(event.threadID));if(g)g.disabledCommands.add(x);reply(`🔒 Disabled: ${x}`)}},
 reload:{run:async({event,user,reply})=>{if(!isAdmin(event.senderID,user))return reply("⛔ Admin permission required.");loadCommands();reply(`♻️ Reloaded\n📋 ${commands.size} commands\n🔗 ${aliases.size} aliases`)}}
};
for(const [name,c] of Object.entries(builtins)){if(commands.has(name)){console.log(`⚠️ Built-in skipped: ${name}`);continue}commands.set(name,{name,...c})}
for(const [name,c] of Object.entries(builtins))for(const a of c.aliases||[]){const x=norm(a);if(!commands.has(x)&&!aliases.has(x))aliases.set(x,name)}

function formatUptime(s){s=Math.floor(s);const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60),z=s%60;return`${d}d ${h}h ${m}m ${z}s`}

app.use(express.json({limit:"1mb"}));
app.get("/",(q,s)=>s.json({status:"ACTIVE",bot:"iKON-BOT",commands:commands.size,aliases:aliases.size,groups:groups.size,uptime:formatUptime(process.uptime())}));
app.get("/health",(q,s)=>s.json({ok:true,status:"ONLINE",commands:commands.size,uptime:process.uptime()}));
app.listen(PORT,()=>console.log(`🌐 iKON-BOT server on ${PORT}`));

function loginBot(){
 let state=APPSTATE;
 try{if(typeof state==="string"&&state.trim().startsWith("["))state=JSON.parse(state);else if(typeof state==="string"&&fs.existsSync(state))state=JSON.parse(fs.readFileSync(state,"utf8"))}catch(e){console.log("⚠️ Appstate parse error:",e.message)}
 login({appState:state},(err,api)=>{
  if(err){console.log("❌ LOGIN ERROR:",err);setTimeout(loginBot,10000);return}
  console.log("✅ LOGIN SUCCESSFUL");console.log("🤖 iKON-BOT connected");api.setOptions({listenEvents:true,selfListen:false,updatePresence:true});
  api.listenMqtt(async(err,event)=>{
   if(err){console.log("⚠️ MQTT:",err);return}
   try{await onMessage(api,event)}catch(e){console.log("❌ EVENT ERROR:",e.stack||e)}
  });
 });
}

async function onMessage(api,event){
 if(!event||event.type!=="message"||!event.body)return;
 const tid=String(event.threadID),sid=String(event.senderID||""),body=String(event.body||"").trim();
 if(!sid||!tid)return;
 const now=Date.now();
 if(processed.has(event.messageID)&&now-processed.get(event.messageID)<60000)return;
 if(event.messageID)processed.set(event.messageID,now);
 if(processed.size>3000)for(const[k,v]of processed)if(now-v>60000)processed.delete(k);
 let info={};try{info=await profile(api,sid)}catch{}
 const user=getUser(sid,info.name),group=getGroup(tid,event.threadName||"Unknown Group");
 group.stats.messages++;
 user.name=info.name||user.name;user.firstName=info.firstName||user.firstName;user.profileUrl=info.profileUrl||user.profileUrl;user.avatar=info.avatar||user.avatar;
 if(group.autoReact!==false&&AUTO_REACT){try{api.setMessageReaction(AUTO_REACT,event.messageID,()=>{},true)}catch{}}
 const prefix=group.prefix||PREFIX;
 if(!body.startsWith(prefix))return;
 const parts=parse(body.slice(prefix.length).trim()),raw=norm(parts.shift());
 if(!raw)return;
 const name=commands.has(raw)?raw:aliases.get(raw);
 if(!name)return;
 const cmd=commands.get(name);
 if(!cmd)return;
 if(group.disabledCommands?.has(name))return reply(api,event,`🚫 ${name} is disabled in this group.`);
 const key=`${sid}:${name}`,last=cooldowns.get(key)||0,cd=Number(cmd.cooldown||COOLDOWN);
 if(now-last<cd)return reply(api,event,`⏳ Slow down bro 😎 Try again in ${((cd-(now-last))/1000).toFixed(1)}s.`);
 cooldowns.set(key,now);
 stat(name);group.stats.commands++;
 const ctx={api,event,args:parts,body,user,group,profile:(uid)=>profile(api,uid),users,groups,commands,reply:t=>reply(api,event,t),fun:{formatNumber:n=>Number(n||0).toLocaleString(),random:(a,b)=>Math.floor(Math.random()*(b-a+1))+a,isAdmin:(uid)=>isAdmin(uid,getUser(uid))}};
 try{await cmd.run(ctx)}catch(e){console.log(`❌ ${name}:`,e.stack||e);reply(api,event,"❌ Something went wrong while running that command.")}}
process.on("uncaughtException",e=>console.log("❌ UNCAUGHT:",e.stack||e));
process.on("unhandledRejection",e=>console.log("❌ REJECTION:",e));
process.on("SIGTERM",()=>{console.log("🛑 SIGTERM");process.exit(0)});
process.on("SIGINT",()=>{console.log("🛑 SIGINT");process.exit(0)});
loginBot();
