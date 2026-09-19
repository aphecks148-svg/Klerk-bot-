const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv"),axios=require("axios");
dotenv.config();
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;
const app=express(),PORT=+(process.env.PORT||10000),PREFIX=process.env.PREFIX||"!",BOT_NAME=process.env.BOT_NAME||"iKON-BOT",OWNER=process.env.OWNER||"APHECKS IKON KLERK",ADMIN_ID=String(process.env.ADMIN_ID||""),APPSTATE=process.env.APPSTATE||"";
const PREFIXES=["!", ".", "/", "$", "-"];
const commands=new Map(),aliases=new Map(),cooldowns=new Map(),groupCache=new Map(),pending=new Map();
const CONFIG={botEnabled:true,maintenance:false,replies:true,reactions:true,autoReact:true,reactCooldown:2500,maxGroups:10,welcome:true};
const REACTIONS=["👍","😂","🔥","❤️","💰","🐾","⚔️","👑","💀","😎","⚡","💯","🎉"];

app.get("/",(_,r)=>r.json({status:"ACTIVE",bot:BOT_NAME,owner:OWNER,prefix:PREFIX,commands:commands.size,groups:groupCache.size}));
app.get("/health",(_,r)=>r.json({status:"OK",bot:BOT_NAME,commands:commands.size,groups:groupCache.size,uptime:Math.floor(process.uptime())}));
app.listen(PORT,()=>console.log(`🌐 ${BOT_NAME} :${PORT}`));

const CATS={
1:["IKONVAULT","MONEY BANK JOBS BUSINESS FINANCE"],
2:["SHADOWSTREET","GTA CRIME POLICE HEISTS"],
3:["BEASTREALM","PETS EVOLUTION BREEDING BATTLES"],
4:["WARFORGE","COMBAT PVP BOSSES RAIDS"],
5:["WILDCORE","FARMING MINING FISHING HUNTING"],
6:["TITANMART","SHOP ITEMS CRAFTING INVENTORY"],
7:["OVERLORD","ADMIN GROUPS SECURITY SYSTEM"],
8:["NEXUS","CASINO AI POKEMON SOCIAL"]
};

// ===== NO BOX MENU - CAPITAL HEADLINES - 3 PARTS =====
const getMenuPart = (part, cmdCount) => {
  const listByCat = (n) => {
    const arr=[];
    for(const [name,c] of commands){ if(+(c.category||c.cat||0)===n) arr.push(name); }
    return arr.length? arr.join(", ") : "No commands loaded";
  };
  if(part===1) return `KILLER-BOT 400 - LOCKED REGISTRY
545 MAIN x 5 SUBS = 2725 TOTAL

PET LABS - 100 / 500 - Part 5 & 9
${listByCat(3)}

FINANCE - 90 / 450 - Part 3,4,7
${listByCat(1)}

CRIME - 64 / 320 - Part 6
${listByCat(2)}

Type ${PREFIX}menu 2 for next`;

  if(part===2) return `ARCADE - 95 / 475 - Part 7,9,11
${listByCat(8).split(",").slice(0,50).join(", ")}

ADMIN - 52 / 260 - Part 2 & 8
${listByCat(7)}

PROGRESSION - 64 / 320
${listByCat(5)}

Type ${PREFIX}menu 3 for next`;

  if(part===3) return `WAR-ZONE - 40 / 200 - Expansion
${listByCat(4)}

AI SYSTEMS - 40 / 200
${listByCat(8).split(",").slice(50).join(", ")}

TOTAL LOCKED: 545 MAIN = 2725 WITH SUBS
Owner: ${OWNER}`;
  return "";
};

const UI={
menu:()=>`KILLER-BOT 400 - LOCKED REGISTRY
${commands.size} COMMANDS ONLINE

MAIN CATEGORIES

${PREFIX}menu 1 - PET LABS + FINANCE + CRIME
${PREFIX}menu 2 - ARCADE + ADMIN + PROGRESSION
${PREFIX}menu 3 - WARZONE + AI

QUICK
${PREFIX}help <command>
${PREFIX}uid
${PREFIX}status
${PREFIX}ping

Owner: ${OWNER}`,

category:(n,list)=>`${CATS[n][0]}
${CATS[n][1]}

${list||"No commands loaded."}

${PREFIX}help <command>
${PREFIX}menu`,

unknown:c=>`UNKNOWN COMMAND: ${PREFIX}${c}

Try ${PREFIX}help ${c} or ${PREFIX}menu`,

cooldown:(c,t)=>`COOLDOWN: ${PREFIX}${c} - ${t} remaining`,

denied:()=>`ACCESS DENIED - ADMIN ONLY`,

error:()=>`SYSTEM ERROR - Try again`,

ping:x=>`PONG! ${x}ms | ${commands.size} CMDS | ${BOT_NAME} ONLINE`,

welcome:n=>`WELCOME ${n} to THE IKONVERSE

${PREFIX}menu
${PREFIX}daily
${PREFIX}profile`,

battle:t=>`BATTLE TURN ${t} - USE ${PREFIX}attack ${PREFIX}defend`,

request:(a,b,t)=>`${t.toUpperCase()} REQUEST FROM ${a} TO ${b} - ACCEPT / DECLINE`,

accepted:t=>`REQUEST ACCEPTED - ${t}`,

declined:t=>`REQUEST DECLINED - ${t}`,

offline:()=>`BOT OFFLINE - MAINTENANCE`,

money:()=>`CASH DROP +$6,000,000 +250 XP`
};

// ===== FB NAME + PIC + REPLY TAG FIX =====
async function getFbUser(api, uid){
  try{
    const info = await new Promise((res,rej)=>{
      api.getUserInfo(uid, (err,data)=>{ if(err) rej(err); else res(data); });
    });
    const u = info[uid];
    return {name: u?.name || uid, thumb: u?.thumbSrc || null};
  }catch{
    return {name: uid, thumb: null};
  }
}

// FIXED SEND - WITH REPLY TAG + LOGS
const send=(api,e,t,attachment=null)=>new Promise(resolve=>{
  if(!CONFIG.replies) return resolve();
  const bodyStr = String(t);
  console.log(`→ SEND to ${e.threadID}: ${bodyStr.slice(0,80)}`);
  try{
    const msg = attachment? {body: bodyStr, attachment} : bodyStr;
    api.sendMessage(msg, e.threadID, (err, info)=>{
      if(err){
        console.error("❌ SEND FAIL:", err);
        console.error(JSON.stringify(err));
      }else{
        console.log("✅ SEND OK:", info?.messageID);
      }
      resolve();
    }, e.messageID); // reply tag - 4th param
  }catch(err){
    console.error("❌ SEND EXCEPTION:", err.message);
    resolve();
  }
});

const react=(api,e,x)=>{try{api.setMessageReaction(x,e.messageID,()=>{},true)}catch{}};
const isAdmin=e=>ADMIN_ID&&String(e.senderID)===ADMIN_ID;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const remaining=k=>{const x=(cooldowns.get(k)||0)-Date.now();if(x<=0)return null;const s=Math.ceil(x/1000),m=Math.floor(s/60);return`${m?m+"m ":""}${s%60}s`};
const findCommand=n=>{n=String(n||"").toLowerCase();return commands.get(n)||commands.get(aliases.get(n))};

// ===== POKEMON SPAWN EVERY 20 MIN =====
const POKEMONS=["Pikachu","Charizard","Mewtwo","Gengar","Dragonite","Snorlax","Lucario","Eevee","Garchomp","Rayquaza","Pikachu Shiny","Bulbasaur"];
let activePokemon=null;
function spawnPokemon(api){
  const poke=pick(POKEMONS);
  activePokemon={name:poke, caught:false, time:Date.now()};
  const text=`WILD POKEMON SPAWNED
A wild ${poke} appeared!
Type ${PREFIX}catch to catch it!
Despawn in 5 min`;
  for(const tid of groupCache.keys()){
    api.sendMessage(text, tid, ()=>{});
  }
  console.log(`[POKEMON] Spawned ${poke} in ${groupCache.size} groups`);
  setTimeout(()=>{activePokemon=null;}, 5*60*1000);
}

function loadCommands(){
 commands.clear();aliases.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){console.error("❌ commands directory missing");return}
 const files=fs.readdirSync(dir).filter(f=>/^cmds_\d+\.js$/i.test(f)).sort((a,b)=>+a.match(/\d+/)[0]-+b.match(/\d+/)[0]);
 for(const file of files){
  try{
   const full=path.join(dir,file);delete require.cache[require.resolve(full)];
   const mod=require(full);
   const list=Array.isArray(mod)?mod:Array.isArray(mod.commands)?mod.commands:mod.default?(Array.isArray(mod.default)?mod.default:[mod.default]):Object.values(mod);
   for(const c of list){
    if(!c||typeof c!=="object"||!c.name)continue;
    const name=String(c.name).toLowerCase().trim();
    if(commands.has(name)){console.log(`⚠️ DUPLICATE: ${name}`);continue}
    c.name=name;c.file=file;commands.set(name,c);
    for(const a of Array.isArray(c.aliases)?c.aliases:[]){
     const x=String(a).toLowerCase().trim();
     if(!x||x===name||commands.has(x)||aliases.has(x))continue;
     aliases.set(x,name);
    }
   }
   console.log(`📦 ${file} loaded`);
  }catch(err){console.error(`❌ ${file}:`,err.message)}
 }
 console.log(`🔥 ${BOT_NAME}: ${commands.size} commands loaded`);
}

async function mainMenu(api,e){
  const fb=await getFbUser(api, e.senderID);
  return send(api,e,`${fb.name}\n\n${UI.menu()}`);
}

async function categoryMenu(api,e,n){
 n=+n;
 if(!CATS[n])return send(api,e,`INVALID CATEGORY 1-8. ${PREFIX}menu`);
 const list=[];
 for(const [name,c] of commands){if(+(c.category||c.cat||0)===n)list.push(`${PREFIX}${name}${c.description?` - ${c.description}`:""}`)}
 const fb=await getFbUser(api, e.senderID);
 const txt = getMenuPart(n<=3?1:n<=6?2:3, commands.size);
 // if it's menu 1,2,3 direct
 if(n>=1 && n<=3 && (e.body.includes("menu 1")||e.body.includes("menu 2")||e.body.includes("menu 3"))){
   const part = parseInt(e.body.match(/menu\s+(\d)/)?.[1]||n);
   return send(api,e,`${fb.name}\n\n${getMenuPart(part)}`);
 }
 return send(api,e,`${fb.name}\n\n${UI.category(n,list.length?list.join("\n"):"No commands")}`);
}

async function helpCommand(api,e,name){
 if(!name)return send(api,e,`HELP Usage: ${PREFIX}help <command>`);
 const c=findCommand(name);
 if(!c)return send(api,e,UI.unknown(name));
 return send(api,e,`COMMAND INFO

COMMAND
${PREFIX}${c.name}

DESCRIPTION
${c.description||"No description"}

CATEGORY
${CATS[+(c.category||c.cat||0)]?.[0]||"NEXUS"}

${c.aliases?.length?`ALIASES: ${c.aliases.map(x=>PREFIX+x).join(" ")}\n`:""}USAGE
${c.usage||PREFIX+c.name}`);
}

function addPending(type,from,to,data={}){const id=`${type}:${from}:${to}:${Date.now()}`;pending.set(id,{id,type,from,to,expires:Date.now()+600000,...data});return id}
function findPending(type,user){for(const p of pending.values()){if(p.type===type&&(p.from===user||p.to===user)){if(p.expires>Date.now())return p;pending.delete(p.id)}}return null}

async function handleMessage(api,e){
 if(e.type!=="message"&&e.type!=="message_reply")return;
 if(!e.body)return;
 const body=String(e.body).trim();if(!body)return;

 // AUTO REACT - ALWAYS
 if(CONFIG.autoReact){
   const r=pick(REACTIONS);
   react(api,e,r);
 }

 if(!CONFIG.botEnabled){console.log("BOT DISABLED");return;}
 if(CONFIG.maintenance&&!isAdmin(e))return send(api,e,UI.offline());

 // MULTI PREFIX FIX
 const usedPrefix = PREFIXES.find(p=>body.startsWith(p));
 if(!usedPrefix) return;
 const input=body.slice(usedPrefix.length).trim();if(!input)return mainMenu(api,e);
 const parts=input.split(/\s+/),name=parts.shift().toLowerCase(),args=parts;

 console.log(`[MSG] ${body} -> CMD:${name} ARGS:${args.join(",")} | ${e.senderID}`);

 const upper=body.toUpperCase();
 if(["ACCEPT","DECLINE","JOIN","REJECT"].includes(upper)){
  const p=findPending("battle",e.senderID)||findPending("co",e.senderID)||findPending("heist",e.senderID);
  if(p){pending.delete(p.id);return send(api,e,upper==="ACCEPT"||upper==="JOIN"?UI.accepted(p.type):UI.declined(p.type))}
 }

 // MENU 1,2,3 DIVIDED
 if(name==="menu"||name==="commands"){
   const fb=await getFbUser(api, e.senderID);
   if(args[0]==="1") return send(api,e,`${fb.name}\n\n${getMenuPart(1)}`);
   if(args[0]==="2") return send(api,e,`${fb.name}\n\n${getMenuPart(2)}`);
   if(args[0]==="3") return send(api,e,`${fb.name}\n\n${getMenuPart(3)}`);
   return args[0]?categoryMenu(api,e,args[0]):mainMenu(api,e);
 }
 if(name==="help")return helpCommand(api,e,args.join(" "));
 if(name==="ping"){const t=Date.now();return send(api,e,UI.ping(Date.now()-t))}
 if(name==="uid"||name==="myuid"){
   const fb=await getFbUser(api, e.senderID);
   let attachment=null;
   try{
     if(fb.thumb){
       const imgPath=path.join(__dirname, `${e.senderID}_thumb.jpg`);
       const res=await axios.get(fb.thumb, {responseType:"arraybuffer"});
       fs.writeFileSync(imgPath, res.data);
       attachment=fs.createReadStream(imgPath);
     }
   }catch{}
   return send(api,e,`USER ID\n\nID: ${e.senderID}\nName: ${fb.name}\nThread: ${e.threadID}\n${BOT_NAME}`, attachment);
 }
 if(name==="status")return send(api,e,`${BOT_NAME} STATUS\nONLINE\nCMDS: ${commands.size}\nGROUPS: ${groupCache.size}\nUPTIME: ${Math.floor(process.uptime())}s\nOWNER: ${OWNER}`);
 if(name==="catch"){
   const fb=await getFbUser(api, e.senderID);
   if(!activePokemon) return send(api,e,`${fb.name}\nNo pokemon now. Wait 20min`);
   if(activePokemon.caught) return send(api,e,`${fb.name}\nAlready caught!`);
   activePokemon.caught=true;
   return send(api,e,`${fb.name}\nYou caught ${activePokemon.name}! +$50k`);
 }

 const command=findCommand(name);
 if(!command)return send(api,e,UI.unknown(name));

 const permission=command.permission||command.role||"user";
 if((permission==="admin"||command.adminOnly===true)&&!isAdmin(e))return send(api,e,UI.denied());

 const cd=+(command.cooldown||0);
 if(cd){
  const key=`cmd:${e.threadID}:${e.senderID}:${command.name}`,x=remaining(key);
  if(x)return send(api,e,UI.cooldown(command.name,x));
  cooldowns.set(key,Date.now()+cd*1000);
 }

 const context={
  api,event:e,args,body,prefix:usedPrefix,command:command.name,BOT_NAME,OWNER,ADMIN_ID,CONFIG,commands,aliases,cooldowns,pending,groupCache,
  isAdmin:()=>isAdmin(e),getTarget:()=>Object.keys(e.mentions||{})[0]||e.senderID,
  send:t=>send(api,e,t),reply:t=>send(api,e,t),react:x=>react(api,e,x),
  pick,addPending,findPending,UI,getFbUser
 };

 try{
  if(typeof command.execute!=="function")return send(api,e,`COMMAND NOT READY: ${PREFIX}${command.name}`);
  const result=await command.execute(context);
  if(typeof result==="string"&&result.trim())await send(api,e,result);
 }catch(err){console.error(`❌ CMD ERROR [${command.name}]`,err);await send(api,e,UI.error())}
}

async function refreshThread(api,e){
 try{
  const info=await api.getThreadInfo(e.threadID);
  groupCache.set(e.threadID,{id:e.threadID,name:info.threadName||"Unnamed",updated:Date.now()});
  while(groupCache.size>CONFIG.maxGroups)groupCache.delete(groupCache.keys().next().value);
 }catch{}
}

function startBot(){
 console.log("🚀 Starting Messenger login...");
 if(!APPSTATE){console.error("❌ APPSTATE missing!");return}
 let state;
 try{state=JSON.parse(APPSTATE)}catch(err){console.error("❌ APPSTATE JSON ERROR:",err.message);return}
 console.log(`🔐 APPSTATE loaded (${Array.isArray(state)?state.length:"object"} entries)`);
 if(typeof login!=="function"){console.error("❌ ws3-fca login unavailable");return}
 login({appState:state},async(err,api)=>{
  if(err){console.error("❌ LOGIN ERROR:",err);return}
  console.log(`🔥 ${BOT_NAME} CONNECTED`);
  console.log(`👑 OWNER: ${OWNER}`);
  try{api.setOptions({listenEvents:true,selfListen:false,forceLogin:true,autoMarkRead:false,autoMarkDelivery:false})}catch(err){console.error("⚠️ setOptions:",err)}

  // POKEMON SPAWN EVERY 20 MIN
  setInterval(()=>spawnPokemon(api), 20*60*1000);
  setTimeout(()=>spawnPokemon(api), 15000);
  console.log("🐾 Pokemon spawn every 20 min enabled");

  api.listenMqtt(async(err,event)=>{
   if(err){console.error("❌ MQTT ERROR:",err);return}
   try{
    if(event.type==="message"||event.type==="message_reply"){await refreshThread(api,event);await handleMessage(api,event)}
    else if(event.type==="event"&&event.logMessageType==="log:subscribe"){try{const info=await api.getThreadInfo(event.threadID);await send(api,event,UI.welcome(info.threadName||"Legend"))}catch{}}
   }catch(x){console.error("❌ EVENT ERROR:",x)}
  });
 });
}

process.on("uncaughtException",e=>console.error("💥 UNCAUGHT:",e));
process.on("unhandledRejection",e=>console.error("💥 UNHANDLED:",e));

loadCommands();
startBot();
