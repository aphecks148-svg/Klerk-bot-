const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv");
dotenv.config();

const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;
const ADMIN_ID=String(process.env.ADMIN_ID||"100086783504073");
const PORT=Number(process.env.PORT||1000);
const APPSTATE_FILE=path.join(__dirname,"appstate.json");
const CONFIG_FILE=path.join(__dirname,"bot-config.json");

let api=null;
const commands=new Map(),profiles=new Map(),cooldowns=new Map();

let CFG={
 prefix:"!",botEnabled:true,maintenance:false,replies:true,
 reactions:true,autoReact:true,reactCooldown:3000,
 modules:{},commands:{},groups:{}
};

function loadConfig(){
 try{
  if(fs.existsSync(CONFIG_FILE))
   CFG={...CFG,...JSON.parse(fs.readFileSync(CONFIG_FILE,"utf8"))};
 }catch(e){console.log("Config:",e.message)}
}
function saveConfig(){
 try{fs.writeFileSync(CONFIG_FILE,JSON.stringify(CFG,null,2))}
 catch(e){console.log("Config save:",e.message)}
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
 if(!fs.existsSync(dir)){
  console.log("❌ commands folder missing");
  return;
 }

 const files=fs.readdirSync(dir)
  .filter(f=>/^cmds_\d+\.js$/i.test(f))
  .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));

 for(const file of files){
  try{
   const full=path.join(dir,file);
   delete require.cache[require.resolve(full)];
   const mod=require(full);
   const add=(n,c,m,e)=>register(n,c,m,e);

   if(typeof mod==="function")mod(add,api,CFG);
   else if(Array.isArray(mod))
    mod.forEach(x=>x&&register(x.name||x.cmd,x.execute,x.module,x));
   else if(mod&&typeof mod==="object")
    for(const [n,v] of Object.entries(mod)){
     if(typeof v==="function")register(n,v);
     else if(v&&typeof v.execute==="function")
      register(n,v.execute,v.module,v);
    }

   console.log("✅ Loaded",file);
  }catch(e){console.error("❌",file,e.stack||e.message)}
 }
 console.log("📚 Commands:",commands.size);
}

function send(e,msg){
 if(!e||msg===undefined||msg===null||CFG.replies===false)return;
 const text=String(msg),tid=e.threadID,mid=e.messageID;
 if(!tid||!api)return;

 let done=false;
 const cb=err=>{
  if(err)console.error("❌ Send:",err.message||err);
  else{
   done=true;
   console.log("📤 Reply:",text.slice(0,80));
  }
 };

 try{
  api.sendMessage(text,tid,err=>{
   done=true;
   cb(err);
  },mid);
 }catch(err){
  console.error("❌ Direct reply:",err.message);
  if(!done){
   try{api.sendMessage(text,tid,cb)}
   catch(x){console.error("❌ Normal send:",x.message)}
  }
 }
}

function react(e,emoji="👍"){
 if(!e?.messageID||CFG.reactions===false||!api)return;
 try{
  if(typeof api.setMessageReactionMqtt==="function")
   return api.setMessageReactionMqtt(emoji,e.messageID,()=>{},true);
  if(typeof api.setMessageReaction==="function")
   api.setMessageReaction(emoji,e.messageID,()=>{},true);
 }catch(x){console.log("Reaction:",x.message)}
}

function profile(uid){
 uid=String(uid);
 const c=profiles.get(uid);
 if(c&&Date.now()-c.time<300000)return Promise.resolve(c.data);

 return new Promise(resolve=>{
  let done=false;
  const fallback={uid,name:uid,vanity:uid,pic:null};
  const timer=setTimeout(()=>{
   if(!done){done=true;resolve(fallback)}
  },2000);

  try{
   api.getUserInfo(uid,(err,data)=>{
    if(done)return;
    done=true;
    clearTimeout(timer);

    if(err||!data||!data[uid])return resolve(fallback);

    const u=data[uid],out={
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
   if(!done){done=true;resolve(fallback)}
  }
 });
}

const groupConfig=tid=>CFG.groups[String(tid)]||{};
const groupOn=tid=>groupConfig(tid).enabled!==false;

function pendingGCList(){
 return new Promise(resolve=>{
  try{
   api.getThreadList(100,0,[],(err,list)=>resolve(err?[]:(list||[])));
  }catch(e){resolve([])}
 });
}

/* =========================
   MENU — KEPT READABLE
========================= */

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
│ !water
│ !heal
│ !revive
│ !petbattle
│ !pve_hunt
│ !arena_rank
│ !skills
│ !upgrade_skill
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
│ !market_buy
│ !market_sell
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
│ !gta_mission_11
│ !gta_mission_12
│ !gta_mission_13
│ !gta_mission_14
│ !gta_mission_15
│ !gta_mission_16
│ !gta_mission_17
│ !gta_mission_18
│ !gta_mission_19
│ !gta_mission_20
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
│ !spin_dice
│ !crypto_slots
│ !diamond_mine
│ !fortune_teller
│ !vip_lounge
│ !casino_rob
│ !bet_insurance
│ !token_exchange
│ !gambling_lb
│ !casino_streak
│ !football
│ !quiz
│ !wrestle
│ !event_join
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
│ !economy_enable
│ !economy_disable
│ !pets_enable
│ !pets_disable
│ !casino_enable
│ !casino_disable
│ !pvp_enable
│ !pvp_disable
│ !ai_enable
│ !ai_disable
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
│ !boss_history
│ !arena
│ !pvp_queue
│ !pvp_match
│ !pvp_rank
│ !pvp_wager
│ !pvp_loadout
│ !arena_hazard
│ !dungeon
│ !dungeon_enter
│ !dungeon_clear
│ !dungeon_status
│ !dungeon_boss
│ !dungeon_leave
│ !dungeon_lb
│ !raid
│ !raid_party
│ !raid_attack
│ !raid_status
│ !raid_loot
│ !raid_hq
│ !coop_quest
│ !survival_wave
│ !merc_agency
│ !medevac
╰──────────────────────╯

╭─〔 🌎 WORLD / LIFE 〕─╮
│ !farm
│ !plant
│ !harvest
│ !water_crop
│ !fertilize
│ !mine
│ !dig
│ !excavate
│ !ore
│ !fish
│ !fishspot
│ !cast
│ !reel
│ !hunt
│ !track
│ !scout
│ !trap
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
│ !handshake
│ !laugh
│ !cry
│ !dance
│ !sing
│ !joke
│ !story
│ !poll
│ !vote
│ !question
│ !answer
│ !truth
│ !dare
│ !confess
│ !complaint
│ !compliment
│ !birthday
│ !marry
│ !divorce
│ !adopt
│ !family
│ !family_tree
│ !relationship
│ !breakup
│ !date
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
│ !brain_dump
│ !generate
│ !imagine
│ !remix
│ !upscale
│ !img_to_text
│ !avatar_gen
│ !translate
│ !dialect_shift
│ !ocr_translate
│ !audio_trans
│ !dictionary
│ !censor_scan
│ !lang_pack
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
│ !profile_glow
│ !stat_allocate
│ !mastery_loop
│ !career_level
│ !season_pass
│ !booster_pack
│ !codex
│ !tasks_daily
│ !tasks_weekly
│ !quests_main
│ !quests_side
│ !quest_inventory
│ !faction_quest
│ !bounty_board
│ !milestones
│ !achieve_hunt
╰──────────────────────╯

╭─〔 🛠️ UTILITIES 〕─╮
│ !help
│ !menu
│ !status
│ !uid
│ !me
│ !profile
│ !search <word>
│ !allcmds <page>
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
┃ !menu = full menu
┃ !menu 1-8 = module list
┃ !search <word> = find commands
┃ !allcmds 1 = command pages
┃ !uid @user = Facebook UID
┃ !profile @user = Facebook profile
┃ !status = bot status
┃ !ping = connection test
╰━━━━━━━━━━━━━━━━━━━━╯
`;
}

function category(q){
 q=norm(q);
 const aliases={
  "1":"pets","2":"finance","3":"crime","4":"arcade",
  "5":"admin","6":"progression","7":"war","8":"ai"
 };
 q=aliases[q]||q;

 const arr=[...commands.values()].filter(c=>norm(c.module).includes(q));

 if(!arr.length)
  return `❌ No commands found for "${q}".\n💡 Try ${CFG.prefix}search ${q}`;

 return `╭─〔 📚 ${q.toUpperCase()} 〕─╮
${arr.map((c,i)=>`│ ${i+1}. ${CFG.prefix}${c.name}`).join("\n")}
╰────────────────────╯`;
}

function allCommands(page=1){
 page=Math.max(1,Number(page)||1);
 const list=[...commands.keys()].sort(),perPage=100;
 const total=Math.max(1,Math.ceil(list.length/perPage));
 const part=list.slice((page-1)*perPage,page*perPage);

 if(!part.length)return `❌ Page ${page} does not exist.\n📄 Total pages: ${total}`;

 return `╭─〔 📚 ALL COMMANDS ${page}/${total} 〕─╮
${part.map(x=>`${CFG.prefix}${x}`).join(" • ")}
╰────────────────────────╯`;
}

function searchCommands(q){
 q=norm(q);
 if(!q)return `🔎 Usage: ${CFG.prefix}search <command>`;

 const found=[...commands.keys()].filter(x=>x.includes(q)).slice(0,100);

 return found.length?
 `╭─〔 🔎 SEARCH: ${q} 〕─╮
${found.map(x=>`│ ${CFG.prefix}${x}`).join("\n")}
╰────────────────────╯`:
 `❌ No command matches "${q}".`;
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
${pending.slice(0,30).map((x,i)=>
`│ ${i+1}. ${x.name||"Unnamed"}\n│ 🆔 ${x.threadID}`
).join("\n")}
╰────────────────────────╯`;
}

const ctx=(e,args,user)=>({
 api,event:e,e,args,argsText:args.join(" "),
 uid:String(e.senderID||""),user,name:user.name,
 username:user.vanity,profilePic:user.pic,
 admin:ADMIN_ID,isAdmin:String(e.senderID)===ADMIN_ID,
 prefix:CFG.prefix,config:CFG,
 send:m=>send(e,m),reply:m=>send(e,m),
 react:x=>react(e,x),save:saveConfig
});

async function handle(e){
 try{
  if(!e||!e.body||!api)return;

  const body=String(e.body).trim(),prefix=CFG.prefix||"!";
  if(!body.startsWith(prefix))return;

  const raw=body.slice(prefix.length).trim();
  if(!raw)return;

  const bits=raw.split(/\s+/),name=norm(bits.shift()),args=bits;
  const uid=String(e.senderID||""),isAdmin=uid===ADMIN_ID;

  if(name==="ping"){
   send(e,"🏓 Pong! Klerk Bot is alive.");
   react(e,"🏓");
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

  if(name==="menu"){
   send(e,args[0]?category(args[0]):menu());
   react(e,"📚");
   return;
  }

  if(name==="allcmds"){
   send(e,allCommands(args[0]));
   return;
  }

  if(name==="search"){
   send(e,searchCommands(args[0]));
   return;
  }

  if(name==="help"){
   send(e,`📖 ${prefix}menu
🔎 ${prefix}search <word>
📚 ${prefix}allcmds <page>
🆔 ${prefix}uid
👤 ${prefix}profile
🏓 ${prefix}ping`);
   return;
  }

  if(name==="uid"||name==="me"){
   let target=uid;
   if(e.mentions){
    const ids=Object.keys(e.mentions);
    if(ids.length)target=ids[0];
   }

   const u=await profile(target);

   send(e,`╭─〔 🆔 FACEBOOK UID 〕─╮
│ 👤 Name: ${u.name}
│ 🆔 UID: ${u.uid}
│ 🔗 Username: ${u.vanity}
╰──────────────────────╯`);

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

  if(name==="pendinggc"){
   if(!isAdmin){
    send(e,"⛔ Master admin only.");
    return;
   }
   send(e,await pendingMessage());
   return;
  }

  if(name==="reloadcmds"){
   if(!isAdmin){
    send(e,"⛔ Master admin only.");
    return;
   }

   loadCommands();
   send(e,`🔄 Commands reloaded!\n📚 ${commands.size} commands loaded.`);
   return;
  }

  if(!CFG.botEnabled&&!isAdmin){
   send(e,"🔴 Bot is currently disabled.");
   return;
  }

  if(CFG.maintenance&&!isAdmin){
   send(e,"🛠️ Bot is currently under maintenance.");
   return;
  }

  if(!groupOn(e.threadID)&&!isAdmin){
   send(e,"🔒 Bot commands are disabled in this group.");
   return;
  }

  const c=getCmd(name);

  if(!c){
   send(e,`❓ Unknown command: ${prefix}${name}

💡 Try:
${prefix}menu
${prefix}search ${name}`);
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

  const key=`${uid}:${name}`,now=Date.now(),cd=Number(c.cooldown||0);

  if(cd&&!isAdmin){
   const until=cooldowns.get(key)||0;

   if(until>now){
    send(e,`⏳ Cooldown active.\n🕐 Try again in ${Math.ceil((until-now)/1000)}s.`);
    return;
   }

   cooldowns.set(key,now+cd*1000);
  }

  if(CFG.autoReact)react(e,"👍");

  const user=await profile(uid),commandCtx=ctx(e,args,user);

  try{
   if(c.execute.length<=1)
    await c.execute(commandCtx);
   else
    await c.execute(api,e,args,ADMIN_ID);
  }catch(err){
   console.error(`❌ ${name}:`,err.stack||err.message);
   send(e,`❌ Command error: ${prefix}${name}
🔧 ${err.message||"Unknown error"}`);
  }

 }catch(err){
  console.error("❌ Handler:",err.stack||err.message);
 }
}

/* =========================
   WEB SERVER
========================= */

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
   return Array.isArray(x)?x:(x.appState||x);
  }

  if(fs.existsSync(APPSTATE_FILE))
   return JSON.parse(fs.readFileSync(APPSTATE_FILE,"utf8"));

 }catch(e){
  console.error("❌ Appstate:",e.message);
 }

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
  }catch(e){console.log("Options:",e.message)}

  if(typeof api.getCurrentUserID==="function")
   console.log("👤 Bot UID:",api.getCurrentUserID());

  const listener=
   api.listenMqtt||
   api.mqttListen||
   api.listen;

  if(typeof listener==="function"){
   try{
    listener.call(api,(err,event)=>{
     if(err){
      console.error("❌ MQTT:",err);
      return;
     }

     if(event){
      console.log(
       "📨 EVENT:",
       event.type||event.logMessageType||"message"
      );
      handle(event);
     }
    });

    console.log("📡 MQTT listener started.");
   }catch(e){
    console.error("❌ MQTT listener:",e.stack||e.message);
   }
  }else{
   console.error("❌ No MQTT listener found.");
   console.log(
    "🔎 Listener methods:",
    Object.keys(api||{})
     .filter(x=>/listen|mqtt/i.test(x))
     .join(", ")||"none"
   );
  }
 };

 try{
  if(typeof login!=="function"){
   console.error("❌ ws3-fca login unavailable.");
   return;
  }

  if(login.length>=3){
   login(options,done);
  }else{
   const result=login(options);

   if(result&&typeof result.then==="function")
    result.then(x=>done(null,x)).catch(done);
   else
    done(null,result);
  }

 }catch(e){
  console.error("❌ Login exception:",e.stack||e.message);
 }
}

process.on("uncaughtException",e=>
 console.error("🔥 UNCAUGHT:",e.stack||e.message)
);

process.on("unhandledRejection",e=>
 console.error("🔥 REJECTION:",e.stack||e.message)
);

start();
