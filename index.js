const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv"),axios=require("axios");
dotenv.config();

const FCA=require("ws3-fca");
const login=typeof FCA==="function"?FCA:FCA.login;

const ADMIN_ID=String(process.env.ADMIN_ID||"100086783504073");
const PORT=Number(process.env.PORT||1000);
const APPSTATE_FILE=path.join(__dirname,"appstate.json");
const CONFIG_FILE=path.join(__dirname,"bot-config.json");

let api=null,commands=new Map(),profiles=new Map(),cooldowns=new Map();
let CFG={
 prefix:"!",
 botEnabled:true,
 maintenance:false,
 replies:true,
 reactions:true,
 autoReact:true,
 reactCooldown:3000,
 modules:{},
 commands:{},
 groups:{}
};

function loadConfig(){
 try{
  if(fs.existsSync(CONFIG_FILE)) CFG={...CFG,...JSON.parse(fs.readFileSync(CONFIG_FILE,"utf8"))};
 }catch(e){console.log("Config load:",e.message)}
}
function saveConfig(){
 try{fs.writeFileSync(CONFIG_FILE,JSON.stringify(CFG,null,2))}catch(e){console.log("Config save:",e.message)}
}
loadConfig();

const norm=x=>String(x||"").toLowerCase().trim();
const getCmd=x=>commands.get(norm(x));
const cmdOn=x=>CFG.commands[norm(x)]!==false;
const modOn=x=>CFG.modules[norm(x)]!==false;

function register(name,execute,module="general",extra={}){
 name=norm(name);
 if(!name||typeof execute!=="function")return;
 if(commands.has(name)){
  console.log("⚠️ Duplicate:",name);
  return;
 }
 commands.set(name,{name,execute,module,...extra});
}

function loadCommands(){
 commands.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir)){console.log("⚠️ commands folder missing");return}
 const files=fs.readdirSync(dir)
  .filter(f=>/^cmds_\d+\.js$/i.test(f))
  .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));

 for(const file of files){
  try{
   delete require.cache[require.resolve(path.join(dir,file))];
   const mod=require(path.join(dir,file));
   const add=(n,c,m,e)=>register(n,c,m,e);
   if(typeof mod==="function")mod(add,api,CFG);
   else if(Array.isArray(mod))mod.forEach(x=>register(x.name||x.cmd,x.execute,x.module,x));
   else if(mod&&typeof mod==="object"){
    for(const [n,v] of Object.entries(mod)){
     if(typeof v==="function")register(n,v);
     else if(v&&typeof v.execute==="function")register(n,v.execute,v.module,v);
    }
   }
   console.log("✅ Loaded",file);
  }catch(e){console.error("❌",file,e.stack||e.message)}
 }
 console.log("📚 Commands:",commands.size);
}

function send(e,msg){
 if(!e||msg===undefined||msg===null||CFG.replies===false)return;
 const text=String(msg);
 const tid=e.threadID,mid=e.messageID;
 if(!tid)return;
 let done=false;
 const cb=err=>{
  if(err)console.error("❌ Reply:",err.message||err);
  else console.log("📤 Replied:",text.slice(0,70));
 };
 try{
  api.sendMessage(text,tid,(err)=>{
   done=true;
   cb(err);
  },mid);
 }catch(err){
  console.error("Direct reply failed:",err.message);
  if(!done){
   try{api.sendMessage(text,tid,cb)}catch(x){console.error("Send failed:",x.message)}
  }
 }
}

function react(e,emoji="👍"){
 if(!e?.messageID||!e?.threadID||CFG.reactions===false)return;
 try{
  if(typeof api.setMessageReactionMqtt==="function")
   api.setMessageReactionMqtt(emoji,e.messageID,()=>{},true);
  else if(typeof api.setMessageReaction==="function")
   api.setMessageReaction(emoji,e.messageID,()=>{},true);
 }catch(x){console.log("Reaction:",x.message)}
}

function profile(uid){
 uid=String(uid);
 const old=profiles.get(uid);
 if(old&&Date.now()-old.time<300000)return Promise.resolve(old.data);

 return new Promise(resolve=>{
  let finished=false;
  const fallback={uid,name:uid,vanity:uid,pic:null};
  const timer=setTimeout(()=>{
   if(!finished){
    finished=true;
    resolve(fallback);
   }
  },2000);

  try{
   api.getUserInfo(uid,(err,data)=>{
    if(finished)return;
    finished=true;
    clearTimeout(timer);

    if(err||!data||!data[uid]){
     resolve(fallback);
     return;
    }

    const u=data[uid];
    const out={
     uid,
     name:u.name||uid,
     vanity:u.vanity||uid,
     pic:u.thumbSrc||u.profilePic||u.profileUrl||null
    };
    profiles.set(uid,{time:Date.now(),data:out});
    resolve(out);
   });
  }catch(e){
   clearTimeout(timer);
   if(!finished){
    finished=true;
    resolve(fallback);
   }
  }
 });
}

function groupConfig(tid){
 return CFG.groups[String(tid)]||{};
}
function groupOn(tid){
 const g=groupConfig(tid);
 return g.enabled!==false;
}

function pendingGCList(){
 return new Promise(resolve=>{
  try{
   api.getThreadList(100,0,[],(err,list)=>resolve(err?[]:(list||[])));
  }catch(e){resolve([])}
 });
}

function menu(){
 return `
╭━━━〔 🤖 KLERK BOT 〕━━━╮
┃
┃ 📌 PREFIX: ${CFG.prefix}
┃ 👑 MASTER: ${ADMIN_ID}
┃ 📚 COMMANDS: ${commands.size}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🐾 PET LABS 〕─╮
│ !pets
│ !petshop
│ !buypet
│ !sellpet
│ !feed
│ !heal
│ !petbattle
│ !pve_hunt
│ !arena_rank
│ !pet_breed
│ !pet_fusion
│ !evolve
│ !mutate
│ !incubate
│ !hatch
│ !clone
│ !gene_splice
│ !dna_bank
│ !ascend
│ !pet_job
│ !guard_home
│ !patrol
│ !track_user
│ !rescue
│ !safari
│ !pet_expo
╰────────────────────╯

╭─〔 💰 FINANCE & ECONOMY 〕─╮
│ !balance
│ !deposit
│ !withdraw
│ !transfer
│ !give
│ !daily
│ !weekly
│ !monthly
│ !salary
│ !shop
│ !inventory
│ !vault_lock
│ !loan
│ !credit_score
│ !wallet_upgrade
│ !business_buy
│ !business_revenue
│ !real_estate
│ !stock_market
│ !stock_buy
│ !stock_sell
│ !stock_portfolio
│ !crypto_buy
│ !crypto_sell
│ !crypto_wallet
│ !crypto_exchange
│ !market
│ !auction
│ !merchant
╰──────────────────────────╯

╭─〔 🔫 GTA / CRIME 〕─╮
│ !gta_mission_1
│ !gta_mission_2
│ !gta_mission_3
│ !gta_mission_4
│ !gta_mission_5
│ !gta_mission_6
│ !gta_mission_7
│ !gta_mission_8
│ !gta_mission_9
│ !gta_mission_10
│ !heist
│ !crew_join
│ !crew_create
│ !heist_plan
│ !rob
│ !hack
│ !mug
│ !bounty_hunt
│ !carjack
│ !garage
│ !modcar
│ !smuggle
│ !chop_shop
│ !blackmarket
│ !warehouse
│ !safehouse
│ !turf_claim
│ !turf_war
│ !street_race
╰──────────────────────╯

╭─〔 🎰 ARCADE / CASINO 〕─╮
│ !slots
│ !coinflip
│ !blackjack
│ !roulette
│ !dice_roll
│ !poker
│ !baccarat
│ !lottery
│ !scratch_card
│ !horse_race
│ !wheel_fortune
│ !high_low
│ !keno
│ !craps
│ !plinko
│ !mines
│ !crash
│ !cups
│ !football
│ !quiz
│ !wrestle
│ !event_join
│ !arena_games
│ !scavenger_hunt
│ !streak_check
╰────────────────────────╯

╭─〔 👑 ADMIN / CONTROL 〕─╮
│ !admin
│ !admins
│ !addadmin
│ !removeadmin
│ !promote
│ !demote
│ !mod
│ !unmod
│ !permissions
│ !grant
│ !revoke
│ !role
│ !roles
│ !group_config
│ !group_enable
│ !group_disable
│ !command_enable
│ !command_disable
│ !command_toggle
│ !module_enable
│ !module_disable
│ !module_toggle
│ !maintenance_on
│ !maintenance_off
│ !ban
│ !unban
│ !kick
│ !mute
│ !unmute
│ !warn
│ !purge
│ !audit_log
│ !jail_user
│ !release_user
│ !freeze_wallet
│ !seize_business
│ !force_unsend
│ !mass_warn
│ !mass_kick
│ !mass_mute
│ !pendinggc
│ !backup
│ !logs
│ !announcement
│ !reboot_system
╰────────────────────────╯

╭─〔 ⚔️ WAR ZONE 〕─╮
│ !bossfight
│ !boss_spawn
│ !boss_ability
│ !boss_spectate
│ !kaiju_rage
│ !cyborg_overlord
│ !dragon_nest
│ !arena
│ !pvp_queue
│ !pvp_match
│ !pvp_rank
│ !pvp_wager
│ !pvp_loadout
│ !dungeon
│ !dungeon_enter
│ !dungeon_clear
│ !dungeon_status
│ !dungeon_boss
│ !raid
│ !raid_party
│ !raid_attack
│ !raid_status
│ !raid_loot
│ !raid_hq
│ !coop_quest
│ !survival_wave
│ !merc_agency
╰──────────────────────╯

╭─〔 🌾 WORLD / LIFE 〕─╮
│ !farm
│ !plant
│ !harvest
│ !water_crop
│ !mine
│ !dig
│ !ore
│ !fish
│ !cast
│ !reel
│ !hunt
│ !track
│ !scout
│ !craft
│ !recipes
│ !cook
│ !recipebook
│ !explore
│ !travel
│ !map
│ !home
│ !home_upgrade
│ !vehicles
│ !buycar
│ !drive
│ !garage
│ !race
│ !guild
│ !guild_create
│ !guild_join
│ !guild_war
╰────────────────────────╯

╭─〔 🤝 COMMUNITY / SOCIAL 〕─╮
│ !introduce
│ !wave
│ !hug
│ !highfive
│ !laugh
│ !dance
│ !joke
│ !story
│ !poll
│ !vote
│ !question
│ !truth
│ !dare
│ !confess
│ !compliment
│ !birthday
│ !marry
│ !divorce
│ !family
│ !relationship
│ !party
│ !event
│ !friend_add
│ !block_user
│ !reputation
│ !clan_chat
╰────────────────────────────╯

╭─〔 🤖 AI 〕─╮
│ !ask
│ !chat
│ !summarize
│ !analyze
│ !rewrite
│ !code_assistant
│ !ai_persona
│ !generate
│ !imagine
│ !translate
│ !ocr_translate
│ !audio_trans
│ !dictionary
│ !ai_mode
│ !ai_config
│ !ai_status
│ !ai_blacklist
│ !ai_quota
│ !ai_logs
│ !riddle_bot
│ !roast_ai
│ !compliment_ai
│ !fortune_ai
│ !oracle
╰────────────────╯

╭─〔 📈 PROGRESSION 〕─╮
│ !level_xp
│ !rank_rewards
│ !prestige
│ !rebirth
│ !passport
│ !achieve_total
│ !skills_tree
│ !title_shop
│ !legacy_score
│ !badge_case
│ !perk_activate
│ !stat_allocate
│ !mastery_loop
│ !career_level
│ !season_pass
│ !codex
│ !tasks_daily
│ !tasks_weekly
│ !quests_main
│ !quests_side
│ !milestones
│ !achieve_hunt
╰──────────────────────╯

╭─〔 🛠️ UTILITIES 〕─╮
│ !help
│ !menu
│ !status
│ !uid
│ !me
│ !search <command>
│ !allcmds
│ !profile
│ !ping
│ !uptime
│ !prefix
│ !weather
│ !time
│ !remind
│ !timer
│ !schedule
│ !notifications
╰────────────────────╯

╭━━〔 💡 QUICK USE 〕━━╮
┃ !menu 1-8 = category
┃ !search <word> = find commands
┃ !allcmds = command list
┃ !uid @user = Facebook UID
┃ !profile @user = profile
┃ !status = bot status
╰━━━━━━━━━━━━━━━━━━━━╯
`;
}

function category(n){
 const arr=[...commands.values()].filter(c=>String(c.module||"").toLowerCase().includes(String(n).toLowerCase()));
 if(!arr.length)return `❌ No commands found for module: ${n}`;
 return `╭─〔 📚 ${n.toUpperCase()} 〕─╮\n${arr.map((c,i)=>`│ ${i+1}. ${CFG.prefix}${c.name}`).join("\n")}\n╰────────────────────╯`;
}

function allCommands(){
 const a=[...commands.keys()].sort();
 const chunk=180;
 let page=Number(arguments[0]||1);
 let start=(page-1)*chunk;
 let part=a.slice(start,start+chunk);
 if(!part.length)return `❌ No commands on page ${page}.`;
 return `╭─〔 📚 ALL COMMANDS ${page} 〕─╮\n${part.map(x=>`${CFG.prefix}${x}`).join(" • ")}\n╰────────────────────────╯\n📄 Page ${page}/${Math.max(1,Math.ceil(a.length/chunk))}`;
}

function searchCommands(q){
 q=norm(q);
 if(!q)return `🔎 Usage: ${CFG.prefix}search <command>`;
 const a=[...commands.keys()].filter(x=>x.includes(q)).slice(0,80);
 return a.length?`╭─〔 🔎 SEARCH: ${q} 〕─╮\n${a.map(x=>`│ ${CFG.prefix}${x}`).join("\n")}\n╰────────────────────╯`:`❌ No command matches "${q}".`;
}

async function profileMessage(uid){
 const u=await profile(uid);
 return `╭─〔 👤 PROFILE 〕─╮
│ 👤 Name: ${u.name}
│ 🆔 UID: ${u.uid}
│ 🔗 Username: ${u.vanity}
│ 🖼️ Picture: ${u.pic||"Unavailable"}
╰──────────────────╯`;
}

async function pendingMessage(){
 const list=await pendingGCList();
 const pending=list.filter(x=>x.isGroup&&(
  x.approvalMode===true||
  x.isApproved===false||
  x.threadType==="GROUP"
 ));
 if(!pending.length)return "📭 No pending group chats found.";
 return `╭─〔 ⏳ PENDING GROUPS 〕─╮
${pending.slice(0,30).map((x,i)=>`│ ${i+1}. ${x.name||"Unnamed"}\n│ 🆔 ${x.threadID}`).join("\n")}
╰────────────────────────╯`;
}

async function context(e,args,user){
 return {
  api,event:e,e,args,
  argsText:args.join(" "),
  uid:String(e.senderID||""),
  user,
  name:user.name,
  username:user.vanity,
  profilePic:user.pic,
  admin:ADMIN_ID,
  isAdmin:String(e.senderID)===ADMIN_ID,
  prefix:CFG.prefix,
  config:CFG,
  send:m=>send(e,m),
  reply:m=>send(e,m),
  react:x=>react(e,x),
  save:saveConfig
 };
}

async function handle(e){
 try{
  if(!e||!e.body||!api)return;

  const body=String(e.body).trim();
  const prefix=CFG.prefix||"!";
  if(!body.startsWith(prefix))return;

  const raw=body.slice(prefix.length).trim();
  if(!raw)return;

  const bits=raw.split(/\s+/);
  const name=norm(bits.shift());
  const args=bits;

  const uid=String(e.senderID||"");
  const isAdmin=uid===ADMIN_ID;

  if(name==="uid"||name==="me"){
   let target=uid;
   if(e.mentions){
    const ids=Object.keys(e.mentions);
    if(ids.length)target=ids[0];
   }
   const u=await profile(target);
   send(e,`🆔 UID: ${u.uid}\n👤 Name: ${u.name}\n🔗 Username: ${u.vanity}`);
   react(e,"🆔");
   return;
  }

  if(name==="profile"){
   let target=uid;
   if(e.mentions){
    const ids=Object.keys(e.mentions);
    if(ids.length)target=ids[0];
   }
   send(e,await profileMessage(target));
   return;
  }

  if(name==="menu"){
   const n=args[0];
   send(e,n?category(n):menu());
   react(e,"📚");
   return;
  }

  if(name==="allcmds"){
   send(e,allCommands(Number(args[0]||1)));
   return;
  }

  if(name==="search"){
   send(e,searchCommands(args[0]));
   return;
  }

  if(name==="help"){
   send(e,`📖 Use ${prefix}menu to open the full command menu.\n🔎 ${prefix}search <word> to find commands.\n📚 ${prefix}allcmds <page> to browse commands.`);
   return;
  }

  if(name==="pendinggc"){
   if(!isAdmin){
    send(e,"⛔ Master admin only.");
    return;
   }
   send(e,await pendingMessage());
   return;
  }

  if(name==="status"){
   send(e,`╭─〔 🤖 BOT STATUS 〕─╮
│ 🟢 Bot: ${CFG.botEnabled?"ONLINE":"OFF"}
│ 🔧 Maintenance: ${CFG.maintenance?"ON":"OFF"}
│ 📚 Commands: ${commands.size}
│ 👥 Groups: ${Object.keys(CFG.groups||{}).length}
│ 👑 Admin: ${ADMIN_ID}
│ ⏱️ Uptime: ${Math.floor(process.uptime())}s
╰────────────────────╯`);
   return;
  }

  if(name==="ping"){
   send(e,"🏓 Pong! Bot is alive.");
   return;
  }

  if(name==="reloadcmds"){
   if(!isAdmin){
    send(e,"⛔ Master admin only.");
    return;
   }
   loadCommands();
   send(e,`🔄 Commands reloaded.\n📚 ${commands.size} commands loaded.`);
   return;
  }

  if(!CFG.botEnabled&&!isAdmin){
   send(e,"🔴 Bot is currently disabled.");
   return;
  }

  if(CFG.maintenance&&!isAdmin){
   send(e,"🛠️ Bot is under maintenance.");
   return;
  }

  if(!groupOn(e.threadID)&&!isAdmin){
   send(e,"🔒 This group has disabled the bot.");
   return;
  }

  const c=getCmd(name);
  if(!c){
   send(e,`❓ Unknown command: ${prefix}${name}\n💡 Try ${prefix}menu or ${prefix}search ${name}`);
   return;
  }

  if(!cmdOn(name)&&!isAdmin){
   send(e,`🚫 ${prefix}${name} is disabled.`);
   return;
  }

  if(!modOn(c.module)&&!isAdmin){
   send(e,`🚫 Module "${c.module}" is disabled.`);
   return;
  }

  if(CFG.maintenance&&!isAdmin){
   send(e,"🛠️ Maintenance mode is active.");
   return;
  }

  if(CFG.autoReact)react(e,"👍");

  const key=`${uid}:${name}`;
  const now=Date.now();
  const cd=Number(c.cooldown||0);
  if(cd&&!isAdmin){
   const until=cooldowns.get(key)||0;
   if(until>now){
    const left=Math.ceil((until-now)/1000);
    send(e,`⏳ Cooldown active. Try again in ${left}s.`);
    return;
   }
   cooldowns.set(key,now+cd*1000);
  }

  const user=await profile(uid);
  const ctx=await context(e,args,user);

  try{
   if(c.execute.length<=1)await c.execute(ctx);
   else await c.execute(api,e,args,ADMIN_ID);
  }catch(err){
   console.error(`❌ ${name}:`,err.stack||err.message);
   send(e,`❌ Error running ${prefix}${name}.\n🔧 ${err.message||"Unknown error"}`);
  }
 }catch(err){
  console.error("Handler:",err.stack||err.message);
 }
}

const app=express();
app.get("/",(req,res)=>res.send("🤖 Klerk Messenger Bot ONLINE"));
app.get("/status",(req,res)=>res.json({
 online:true,
 commands:commands.size,
 uptime:process.uptime(),
 admin:ADMIN_ID
}));
app.listen(PORT,()=>console.log("🌐 Port:",PORT));

function readAppState(){
 try{
  if(process.env.APPSTATE){
   const x=JSON.parse(process.env.APPSTATE);
   return Array.isArray(x)?x:x.appState||x;
  }
  if(fs.existsSync(APPSTATE_FILE))
   return JSON.parse(fs.readFileSync(APPSTATE_FILE,"utf8"));
 }catch(e){console.error("Appstate:",e.message)}
 return null;
}

function start(){
 const appState=readAppState();
 if(!appState){
  console.error("❌ No appstate found.");
  return;
 }

 loadCommands();

 const options={
  appState,
  selfListen:false,
  listenEvents:true,
  forceLogin:true,
  autoMarkRead:false,
  autoMarkDelivery:false
 };

 const done=(err,a)=>{
  if(err){
   console.error("❌ Login failed:",err);
   return;
  }

  api=a;
  console.log("✅ Logged in!");
  console.log("👑 Master admin:",ADMIN_ID);

  try{
   api.setOptions({
    listenEvents:true,
    selfListen:false,
    forceLogin:true,
    autoMarkRead:false,
    autoMarkDelivery:false
   });
  }catch(e){}

  if(api.getCurrentUserID)
   console.log("👤 Bot UID:",api.getCurrentUserID());

  if(api.listen){
   api.listen((err,event)=>{
    if(err){
     console.error("MQTT:",err);
     return;
    }
    handle(event);
   });
   console.log("📡 MQTT listener started.");
  }else{
   console.error("❌ api.listen unavailable.");
  }
 };

 try{
  if(login.length>=3)login(options,done);
  else login(options).then(x=>done(null,x)).catch(done);
 }catch(e){
  console.error("❌ Login exception:",e.stack||e.message);
 }
}

process.on("uncaughtException",e=>console.error("UNCAUGHT:",e.stack||e.message));
process.on("unhandledRejection",e=>console.error("REJECTION:",e.stack||e.message));

start();
