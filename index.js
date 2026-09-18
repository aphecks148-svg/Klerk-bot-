const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv"),axios=require("axios");
dotenv.config();

const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;
let canvas=null;try{canvas=require("canvas")}catch(e){console.log("⚠️ canvas unavailable")}

const ADMIN_ID=String(process.env.ADMIN_ID||"100086783504073"),PORT=Number(process.env.PORT||1000);
const APPSTATE_FILE=path.join(__dirname,"appstate.json"),CONFIG_FILE=path.join(__dirname,"bot-config.json");

let api=null;
const commands=new Map(),profiles=new Map(),cooldowns=new Map();
const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={});
R.players=R.players||new Map();R.staff=R.staff||new Map();R.pending=R.pending||new Map();

let CFG={
 prefix:"!",botEnabled:true,maintenance:false,replies:true,reactions:true,autoReact:true,
 reactCooldown:3000,modules:{},commands:{},groups:{},welcome:true,leave:true,
 pokemon:true,pokemonInterval:1200000
};

function loadConfig(){try{if(fs.existsSync(CONFIG_FILE))CFG={...CFG,...JSON.parse(fs.readFileSync(CONFIG_FILE,"utf8"))}}catch(e){console.log("Config:",e.message)}}
function saveConfig(){try{fs.writeFileSync(CONFIG_FILE,JSON.stringify(CFG,null,2))}catch(e){console.log("Config save:",e.message)}}
loadConfig();

const norm=x=>String(x||"").toLowerCase().trim();
const getCmd=x=>commands.get(norm(x));
const cmdOn=x=>CFG.commands[norm(x)]!==false;
const modOn=x=>CFG.modules[norm(x)]!==false;

function register(name,execute,module="general",extra={}){
 name=norm(name);
 if(!name||typeof execute!=="function")return;
 if(commands.has(name)){console.log("⚠️ DUPLICATE SKIPPED:",name);return}
 commands.set(name,{name,execute,module,...extra});
}

function loadCommands(){
 commands.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){console.log("❌ commands folder missing");return}
 const files=fs.readdirSync(dir).filter(f=>/^cmds_\d+\.js$/i.test(f))
 .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));

 for(const file of files)try{
  const full=path.join(dir,file);
  delete require.cache[require.resolve(full)];
  const mod=require(full);
  const add=(n,c,m,e)=>register(n,c,m,e);

  if(typeof mod==="function")mod(add,api,CFG);
  else if(Array.isArray(mod))
   mod.forEach(x=>x&&register(x.name||x.cmd,x.execute,x.module,x));
  else if(mod&&typeof mod==="object")
   for(const[n,v]of Object.entries(mod))
    if(typeof v==="function")register(n,v);
    else if(v&&typeof v.execute==="function")register(n,v.execute,v.module,v);

  console.log("✅ Loaded",file);
 }catch(e){console.error("❌",file,e.stack||e.message)}

 console.log("📚 TOTAL COMMANDS:",commands.size);
}

function send(e,msg){
 if(!e||msg==null||CFG.replies===false||!api||!e.threadID)return;
 try{
  api.sendMessage(String(msg),e.threadID,err=>{
   if(err)console.log("❌ SEND:",err.message||err);
  },e.messageID);
 }catch(x){
  try{api.sendMessage(String(msg),e.threadID)}catch(y){console.log("❌ SEND:",y.message)}
 }
}

function react(e,emoji="👍"){
 if(!e?.messageID||CFG.reactions===false||!api)return;
 try{
  if(typeof api.setMessageReactionMqtt==="function")api.setMessageReactionMqtt(emoji,e.messageID,()=>{},true);
  else if(typeof api.setMessageReaction==="function")api.setMessageReaction(emoji,e.messageID,()=>{},true);
 }catch(e){}
}

function profile(uid){
 uid=String(uid);
 const c=profiles.get(uid);
 if(c&&Date.now()-c.time<300000)return Promise.resolve(c.data);

 return new Promise(resolve=>{
  const fallback={uid,name:uid,vanity:uid,pic:null};
  let done=false;
  const timer=setTimeout(()=>{if(!done){done=true;resolve(fallback)}},2500);

  try{
   api.getUserInfo(uid,(err,data)=>{
    if(done)return;
    done=true;clearTimeout(timer);
    if(err||!data||!data[uid])return resolve(fallback);

    const u=data[uid],out={
     uid,name:u.name||uid,vanity:u.vanity||uid,
     pic:u.thumbSrc||u.profilePic||null
    };
    profiles.set(uid,{time:Date.now(),data:out});
    resolve(out);
   });
  }catch(e){
   clearTimeout(timer);
   if(!done){done=true;resolve(fallback)}
  }
 });
}

const groupConfig=tid=>CFG.groups[String(tid)]||{};
const groupOn=tid=>groupConfig(tid).enabled!==false;
const staffRole=uid=>String(R.staff.get(String(uid))||"").toLowerCase();
const isAdmin=uid=>String(uid)===ADMIN_ID||["owner","admin","superadmin"].includes(staffRole(uid));
const canControl=uid=>String(uid)===ADMIN_ID||["owner","admin","superadmin","mod"].includes(staffRole(uid));

function getTarget(e,args){
 let id=null;
 if(e.messageReply?.senderID)id=String(e.messageReply.senderID);
 const m=e.mentions&&Object.keys(e.mentions)[0];
 if(m)id=String(m);
 if(args[0]&&/^\d{5,}$/.test(args[0]))id=args[0];
 return id||String(e.senderID||"");
}

function bar(value,max=100,size=10){
 value=Math.max(0,Math.min(max,Number(value)||0));
 const n=Math.round(value/max*size);
 return "█".repeat(n)+"░".repeat(size-n);
}

function mainMenu(user){
 const p=CFG.prefix||"!";
 return `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 K L E R K  B O T   ┃
┃     ⚡ COMMUNITY RPG ⚡     ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

👋 Welcome, ${user?.name||"Player"}!

💰 Economy • 🐾 Pets • ⚔️ Combat
🚗 GTA • 🎰 Casino • 🧠 AI

╭──〔 📚 COMMAND CENTER 〕──╮
│
│ 1️⃣ 📈 Progression & World
│ 2️⃣ 🐾 Pets & Farming
│ 3️⃣ 💰 Economy & Market
│ 4️⃣ 🚗 GTA & Crime
│ 5️⃣ 🎰 Casino & Social
│ 6️⃣ 🧠 AI & Gemini
│ 7️⃣ 👑 Admin & Utilities
│ 8️⃣ ⚔️ Combat & Adventures
│
╰─────────────────────────╯

💡 ${p}menu 1-8
🔎 ${p}search <command>
📖 ${p}help <command>
👤 ${p}me
🏓 ${p}ping

╰━━━〔 KLERK COMMUNITY 〕━━━╯`;
}

const categories={
 1:["📈 PROGRESSION / WORLD",["level_xp","rank_rewards","prestige","rebirth","passport","quests_main","quests_side","faction_quest","bounty_board","milestones","daily","streak","daily_spin","daily_bonus","world_status","town","district","npc_list","npc_chat"]],
 2:["🐾 PETS / FARMING",["pets","pet","petshop","buypet","sellpet","rename","release","equip","unequip","favorite","giftpet","inspect","pet_safe","feed","heal","revive","sleep","wake","petbattle","pet_breed","evolve","mutate","farm","plant","harvest","water_crop","fertilize","seed_shop"]],
 3:["💰 ECONOMY / MARKET",["balance","bal","wallet","bank","deposit","withdraw","vault","savings","saving","save","transfer","pay","give","loan","credit_score","inventory","inv","shop","market","trade","auction","stock_market","crypto_exchange","business_buy","business_revenue","real_estate","lb","richest","top"]],
 4:["🚗 GTA / CRIME / VEHICLES",["gta_status","wanted","rob","hack","mug","scam","carjack","extort","smuggle","safe_crack","heist","crew_create","crew_join","bounty_hunt","garage","vehicles","buycar","sellcar","drive","repaircar","fuel","car_upgrade","race","street_race","turf_claim","turf_war"]],
 5:["🎰 CASINO / SOCIAL / FISHING",["slots","coinflip","blackjack","roulette","dice_roll","poker","lottery","wheel_fortune","crash","mines","football","quiz","roast","flirt_chat","marry","divorce","friend_add","wave","hug","joke","poll","truth","dare","fish","cast","reel","fish_market","hunt","track","trap"]],
 6:["🧠 AI / GEMINI",["ask","chat","summarize","analyze","rewrite","generate","imagine","remix","code_assistant","ai_persona","ai_mode","oracle","riddle_bot","roast_ai","compliment_ai","translate","dictionary","img_to_text","avatar_gen","ai_status"]],
 7:["👑 ADMIN / UTILITIES",["admin","admins","addadmin","removeadmin","promote","demote","permissions","grant","revoke","group_config","group_enable","group_disable","command_enable","command_disable","command_toggle","module_enable","module_disable","module_toggle","set_balance","set_xp","set_level","ban","unban","kick","mute","unmute","warn","pendinggc","unsend","audit_log","broadcast","maintenance"]],
 8:["⚔️ CRAFT / MINE / COMBAT / PVP",["craft","recipe","recipes","materials","gather","workbench","upgrade_item","repair","dismantle","enchant","mine","ore","prospect","pickaxe","smelt","forge","attack","skill","ultimate","equipment","bossfight","arena","pvp","dungeon","raid","co","explore","travel","treasure","loot","lootbox","mission","missions","guild","survival_wave"]]
};

function categoryMenu(n){
 const p=CFG.prefix||"!",x=categories[Number(n)];
 if(!x)return `╭━━〔 🤔 KLERK 〕━━╮
❌ Category not found.

💡 Choose a category from:
${p}menu

╰━━〔 1️⃣ → 8️⃣ 〕━━╯`;

 const list=x[1],rows=[];
 for(let i=0;i<list.length;i+=10)
  rows.push(list.slice(i,i+10).map((c,j)=>`${i+j+1}. ${p}${c}`).join("\n"));

 return `╭━━━━〔 ${x[0]} 〕━━━━╮

${rows.join("\n\n")}

╰━━━━━━━━━━━━━━━━━━━━╯
💡 ${p}help <command>
🔎 ${p}search <word>
📚 ${p}menu`;
}

function allCommands(page=1){
 const p=CFG.prefix||"!",a=[...commands.keys()];
 const pg=Math.max(1,Number(page)||1),start=(pg-1)*10,items=a.slice(start,start+10);
 return `╭━━〔 📚 KLERK COMMANDS 〕━━╮

${items.length?items.map((x,i)=>`${start+i+1}. ${p}${x}`).join("\n"):"❌ No commands on this page."}

━━━━━━━━━━━━━━━━━━━━
📄 Page ${pg}/${Math.max(1,Math.ceil(a.length/10))}
➡️ ${p}allcmds ${pg+1}

🔎 ${p}search <word>
╰━━━━━━━━━━━━━━━━━━━━╯`;
}

function searchCommands(q){
 const p=CFG.prefix||"!";
 if(!q)return `🔎 SEARCH KLERK\n\n💡 Example: ${p}search pet`;
 const a=[...commands.keys()].filter(x=>x.includes(norm(q)));
 return a.length?`╭━━〔 🔎 SEARCH RESULTS 〕━━╮

${a.slice(0,20).map((x,i)=>`${i+1}. ${p}${x}`).join("\n")}

📊 Found: ${a.length}
💡 ${p}help <command>
╰━━━━━━━━━━━━━━━━━━━━╯`:`╭━━〔 🤔 NOT FOUND 〕━━╮

❌ Nothing matched "${q}"

😂 Even Klerk couldn't find that one.

💡 Try:
${p}search pet
${p}search money
${p}search gta

╰━━━━━━━━━━━━━━━━━━━━╯`;
}

function helpCommand(name){
 const p=CFG.prefix||"!",c=getCmd(name);
 if(!c)return `╭━━〔 📖 HELP 〕━━╮
❌ Unknown command: ${p}${name||""}

💡 ${p}search ${name||"pet"}
📚 ${p}menu
╰━━━━━━━━━━━━━━━━━━━━╯`;
 return `╭━━〔 📖 COMMAND HELP 〕━━╮

⚡ Command:
${p}${c.name}

📦 Module:
${c.module||"general"}

${c.usage?`📝 Usage:\n${p}${c.name} ${c.usage}\n`:""}
💡 Tip:
Use ${p}search ${c.name}

╰━━━━━━━━━━━━━━━━━━━━╯`;
}

function commandContext(e,args,user){
 return {
  api,event:e,args,argsText:args.join(" "),uid:String(e.senderID||""),
  user,name:user.name,username:user.vanity,profilePic:user.pic,
  admin:ADMIN_ID,isAdmin:isAdmin(e.senderID),canControl:canControl(e.senderID),
  prefix:CFG.prefix,config:CFG,shared:R,target:getTarget(e,args),
  send:m=>send(e,m),reply:m=>send(e,m),react:x=>react(e,x),save:saveConfig,
  bar
 };
}

function welcome(e){
 if(CFG.welcome===false||!e?.threadID)return;
 const ids=(e.logMessageData?.addedParticipants||[]).map(x=>x.userFbId).filter(Boolean);
 if(!ids.length)return;
 Promise.all(ids.map(profile)).then(us=>{
  send(e,`╭━━━━〔 🎉 WELCOME 〕━━━━╮

👋 Welcome ${us.map(x=>x.name).join(", ")}!

🤖 You are now part of
⚡ KLERK COMMUNITY RPG

🎮 Economy • Pets • GTA
⚔️ Combat • Casino • AI

📚 Type ${CFG.prefix}menu
to explore the bot.

💡 Tip: ${CFG.prefix}help <command>

╰━━〔 HAVE FUN & GRIND 🔥 〕━━╯`);
  react(e,"🎉");
 });
}

function leave(e){
 if(CFG.leave===false||!e?.threadID)return;
 const id=e.logMessageData?.leftParticipantFbId;
 if(!id)return;
 profile(id).then(u=>{
  send(e,`╭━━〔 👋 GOODBYE 〕━━╮

${u.name||"A member"} has left the community.

🫡 Take care!
💙 Klerk Community will remember you.

╰━━━━━━━━━━━━━━━━━━━━╯`);
  react(e,"👋");
 });
}

async function pokemonSpawn(){
 if(!api||CFG.pokemon===false)return;
 try{
  const id=Math.floor(Math.random()*151)+1;
  const r=await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`,{timeout:7000});
  const x=r.data,n=x.name.toUpperCase();
  const pic=x.sprites?.other?.["official-artwork"]?.front_default||x.sprites?.front_default;
  const msg=`╭━━━━〔 🐾 POKÉMON SPAWN 〕━━━━╮

⚡ A wild ${n} appeared!

❤️ HP: ${Math.floor(Math.random()*500)+500}
🎯 Catch:
${CFG.prefix}catch ${x.name}

⏳ It won't stay forever!

🖼️ ${pic||"Picture unavailable"}

╰━━〔 ⚡ CATCH IT! 〕━━╯`;

  const list=await new Promise(resolve=>{
   try{api.getThreadList(100,0,[],(err,l)=>resolve(err?[]:(l||[])))}
   catch(e){resolve([])}
  });
  for(const t of list)if(t.threadID)try{api.sendMessage(msg,t.threadID)}catch(e){}
 }catch(e){console.log("Pokemon:",e.message)}
}

async function handle(e){
 try{
  if(!e)return;

  if(e.type==="event"){
   if(e.logMessageType==="log:subscribe")return welcome(e);
   if(e.logMessageType==="log:unsubscribe")return leave(e);
   return;
  }

  if(e.type!=="message"||!e.body||!api)return;

  const body=String(e.body).trim(),prefix=CFG.prefix||"!";
  if(!body.startsWith(prefix))return;

  const raw=body.slice(prefix.length).trim();
  if(!raw)return;

  const bits=raw.split(/\s+/),name=norm(bits.shift()),args=bits;
  const uid=String(e.senderID||""),admin=isAdmin(uid);

  if(name==="ping"){
   send(e,`╭━━〔 🏓 PONG 〕━━╮

🟢 Klerk Bot is ONLINE!
⚡ Response: FAST
📚 Commands: ${commands.size}
⏱️ Uptime: ${Math.floor(process.uptime())}s

╰━━〔 🤖 READY 〕━━╯`);
   react(e,"🏓");return;
  }

  if(name==="menu"){
   const u=await profile(uid);
   send(e,args[0]?categoryMenu(args[0]):mainMenu(u));
   react(e,"📚");return;
  }

  if(name==="allcmds"){send(e,allCommands(args[0]||1));return}
  if(name==="search"){send(e,searchCommands(args[0]));return}
  if(name==="help"){send(e,helpCommand(args[0]));return}

  if(name==="status"){
   send(e,`╭━━━━〔 🤖 KLERK STATUS 〕━━━━╮

🟢 SYSTEM: ONLINE
📚 COMMANDS: ${commands.size}
⚙️ PREFIX: ${prefix}
⏱️ UPTIME: ${Math.floor(process.uptime())}s
👑 MASTER ADMIN: ${ADMIN_ID}

🧩 MODULES
📈 Progression
🐾 Pets
💰 Economy
🚗 GTA
🎰 Casino
🧠 AI
👑 Admin
⚔️ Combat

📊 LOAD
${bar(Math.min(100,commands.size/10),100,20)}

╰━━━━〔 KLERK COMMUNITY 〕━━━━╯`);
   return;
  }

  if(name==="uid"||name==="me"||name==="profile"){
   const id=getTarget(e,args),u=await profile(id);
   send(e,`╭━━━━〔 👤 PLAYER PROFILE 〕━━━━╮

👤 ${u.name}
🆔 UID: ${u.uid}
🔗 ${u.vanity||u.uid}

⭐ LEVEL: —
✨ XP: ${bar(0)} —
💰 BALANCE: —

🖼️ PROFILE PIC:
${u.pic||"Unavailable"}

╰━━━━〔 🤖 KLERK RPG 〕━━━━╯`);
   return;
  }

  if(name==="pendinggc"||name==="pending_gc"){
   if(!admin){send(e,"╭━━〔 🔒 ADMIN 〕━━╮\n⛔ Admin permission required.\n╰━━━━━━━━━━━━╯");return}
   const l=await new Promise(resolve=>{
    try{api.getThreadList(100,0,[],(er,x)=>resolve(er?[]:(x||[])))}
    catch(e){resolve([])}
   });
   send(e,`╭━━〔 📥 GROUP CONTROL 〕━━╮

👥 Groups found: ${l.length}

${l.slice(0,10).map((x,i)=>`${i+1}. ${x.name||"Unnamed"}\n   🆔 ${x.threadID}`).join("\n\n")||"No groups found."}

💡 Use admin controls to manage groups.

╰━━━━━━━━━━━━━━━━━━━━╯`);
   return;
  }

  if(name==="reloadcmds"){
   if(!admin){send(e,"⛔ Admin only.");return}
   loadCommands();
   send(e,`╭━━〔 ♻️ COMMAND RELOAD 〕━━╮

✅ Reload complete!
📚 Commands: ${commands.size}
🧩 Modules: 8

╰━━〔 SYSTEM READY 🟢 〕━━╯`);
   return;
  }

  if(name==="unsend"){
   if(!api.unsendMessage){
    send(e,"╭━━〔 🗑️ UNSEND 〕━━╮\n❌ This FCA version does not support unsend.\n╰━━━━━━━━━━━━━━━━╯");
    return;
   }
   try{
    api.unsendMessage(e.messageID,err=>{
     send(e,err?"❌ Unable to unsend this message.":"╭━━〔 🗑️ UNSEND 〕━━╮\n\n✅ Message unsent.\n\n╰━━〔 KLERK CLEANUP 〕━━╯");
    });
   }catch(x){send(e,"❌ Unsend failed.")}
   return;
  }

  if(!CFG.botEnabled&&!admin){send(e,"🔴 Klerk Bot is currently disabled.");return}
  if(CFG.maintenance&&!admin){send(e,"🛠️ Klerk is under maintenance. Please try again later.");return}
  if(!groupOn(e.threadID)&&!admin){send(e,"⛔ Klerk is disabled in this group.");return}

  const c=getCmd(name);

  if(!c){
   send(e,`╭━━〔 🤔 KLERK CONFUSED 〕━━╮

❌ I don't know:
${prefix}${name}

😂 Even Klerk has never heard
of that command.

💡 TRY THIS:
🔎 ${prefix}search ${name}
📚 ${prefix}menu
📖 ${prefix}help <command>

╰━━〔 🤖 TRY AGAIN 〕━━╯`);
   react(e,"🤔");
   return;
  }

  if(!cmdOn(name)&&!admin){send(e,`🚫 ${prefix}${name} is currently disabled.`);return}
  if(!modOn(c.module)&&!admin){send(e,`🚫 The ${c.module} module is currently disabled.`);return}
  if(c.adminOnly&&!admin){send(e,"⛔ Admin permission required.");return}

  const cd=Number(c.cooldown||0),key=`${uid}:${name}`,last=cooldowns.get(key)||0;
  if(cd&&!admin&&Date.now()-last<cd){
   const left=Math.ceil((cd-(Date.now()-last))/1000);
   send(e,`╭━━〔 ⏳ COOLDOWN 〕━━╮

⚡ ${prefix}${name}
is cooling down.

⏱️ Remaining: ${left}s

💡 Try another command while
you wait!

╰━━〔 🔥 KLERK RPG 〕━━╯`);
   react(e,"⏳");return;
  }

  if(cd)cooldowns.set(key,Date.now());
  if(CFG.autoReact)react(e,"👍");

  const user=await profile(uid),cc=commandContext(e,args,user);

  try{
   if(c.execute.length<=1)await c.execute(cc);
   else await c.execute(api,e,args,ADMIN_ID);
  }catch(err){
   console.error("❌ COMMAND",name,err);
   send(e,`╭━━〔 💥 KLERK ERROR 〕━━╮

❌ ${prefix}${name} could not complete.

💡 Try:
${prefix}help ${name}

If the problem continues,
contact an admin.

╰━━〔 🤖 SYSTEM RECOVERY 〕━━╯`);
   react(e,"💥");
  }
 }catch(err){console.error("❌ HANDLER:",err)}
}

function readAppState(){
 try{
  if(process.env.APPSTATE)return JSON.parse(process.env.APPSTATE);
  if(fs.existsSync(APPSTATE_FILE))return JSON.parse(fs.readFileSync(APPSTATE_FILE,"utf8"));
 }catch(e){console.log("Appstate:",e.message)}
 return null;
}

const app=express();
app.get("/",(req,res)=>res.json({bot:"Klerk Messenger Bot",status:"ONLINE",commands:commands.size,uptime:process.uptime()}));
app.get("/status",(req,res)=>res.json({online:true,commands:commands.size,uptime:process.uptime(),admin:ADMIN_ID}));
app.listen(PORT,()=>console.log("🌐 HTTP PORT:",PORT));

function start(){
 const appState=readAppState();
 if(!appState){console.log("❌ APPSTATE missing");return}

 try{
  login({appState},(err,logged)=>{
   if(err||!logged){console.error("❌ Login failed:",err||"No API");return}

   api=logged;
   console.log("✅ Messenger login successful");

   loadCommands();

   const listener=api.listenMqtt||api.mqttListen||api.listen;
   if(typeof listener!=="function"){console.error("❌ Messenger listener unavailable");return}

   listener.call(api,(err,event)=>{
    if(err)console.log("Listener:",err.message||err);
    else handle(event);
   });

   console.log(`🤖 KLERK BOT ONLINE | ${commands.size} COMMANDS`);

   if(CFG.pokemon!==false){
    setInterval(pokemonSpawn,Number(CFG.pokemonInterval||1200000));
    console.log("🐾 Pokémon spawn system: 20 MINUTES");
   }
  });
 }catch(e){console.error("❌ START ERROR:",e.stack||e.message)}
}

process.on("uncaughtException",e=>console.error("🔥 uncaughtException:",e.stack||e));
process.on("unhandledRejection",e=>console.error("🔥 unhandledRejection:",e));
process.on("SIGTERM",()=>{console.log("🛑 SIGTERM");process.exit(0)});
process.on("SIGINT",()=>{console.log("🛑 SIGINT");process.exit(0)});

start();
