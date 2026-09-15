// ============================================================
// 🏆 CMDS_1 — PROGRESSION + DAILY + WORLD/CORE
// ============================================================

const U=new Map();
const W={
 day:1,weather:"☀️ Clear",event:"🌍 Normal",
 district:"Central District",
 npcs:{
  mayor:["Mayor","🏛️","Runs the city and announces major events."],
  police:["Police Chief","👮","Keeps the district secure."],
  doctor:["Doctor","🩺","Restores players and pets."],
  merchant:["Merchant","🛒","Trades useful goods."],
  blacksmith:["Blacksmith","⚒️","Works with equipment."],
  farmer:["Farmer","🌾","Manages crops and farms."],
  fisherman:["Fisherman","🎣","Knows the best fishing spots."],
  miner:["Miner","⛏️","Searches for valuable ores."],
  hunter:["Hunter","🏹","Explores the wilderness."],
  mechanic:["Mechanic","🔧","Maintains vehicles."],
  bartender:["Bartender","🍻","Knows the latest city rumors."],
  citizen:["Citizen","🧑","A normal resident of the world."]
 }
};

const today=()=>new Date().toISOString().slice(0,10);
function u(id){
 if(!U.has(id))U.set(id,{
  xp:0,level:1,prestige:0,rebirth:0,legacy:0,career:1,
  streak:0,lastDaily:"",tokens:0,skill:0,stats:{str:0,agi:0,int:0,luck:0},
  achievements:[],badges:[],titles:[],activeTitle:"Rookie",
  discoveries:[],quests:[],completed:0,season:1,seasonXP:0
 });
 return U.get(id);
}
function need(l){return 100+(l-1)*75}
function xp(ctx,n,reason=""){
 const x=u(ctx.event.senderID);x.xp+=n;x.seasonXP+=Math.max(1,Math.floor(n/2));
 let up=0;
 while(x.xp>=need(x.level)){x.xp-=need(x.level);x.level++;up++}
 return `✨ +${n} XP${reason?" • "+reason:""}${up?`\n🎉 LEVEL UP! → ${x.level}`:""}`;
}
function reply(ctx,msg){ctx.reply(`╭━━ 🤖 WORLD SYSTEM ━━╮\n${msg}\n╰━━━━━━━━━━━━━━━━━━╯`)}
function cmd(name,description,fn,aliases=[]){
 return {name,description,execute:fn,aliases,reaction:"✨"};
}
function daily(ctx,key,reward){
 const x=u(ctx.event.senderID),d=today();
 if(x.lastDaily===key+":"+d)return false;
 x.lastDaily=key+":"+d;
 x.tokens+=reward;
 return true;
}

// ============================================================
// 🏆 PROGRESSION
// ============================================================

const C={};

C.level_xp=cmd("level_xp","View level and XP",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`⭐ Level: ${x.level}\n✨ XP: ${x.xp}/${need(x.level)}\n🏆 Prestige: ${x.prestige}\n♻️ Rebirth: ${x.rebirth}`);
});

C.rank_rewards=cmd("rank_rewards","View rank rewards",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🏅 Current Level: ${x.level}\n🎁 Next rewards:\n• Lv5 — 100 Tokens\n• Lv10 — Rare Badge\n• Lv20 — Elite Title\n• Lv30 — Prestige access\n\n💰 Tokens: ${x.tokens}`);
});

C.prestige=cmd("prestige","Reset level for Prestige",ctx=>{
 const x=u(ctx.event.senderID);
 if(x.level<20)return reply(ctx,`🔒 Reach Level 20 first.\nCurrent: ${x.level}`);
 x.prestige++;x.level=1;x.xp=0;x.legacy+=100;
 reply(ctx,`🌟 PRESTIGE ${x.prestige}!\n🏛️ Legacy +100\n⭐ Level reset to 1`);
});

C.rebirth=cmd("rebirth","Rebirth after high progression",ctx=>{
 const x=u(ctx.event.senderID);
 if(x.level<50||x.prestige<1)return reply(ctx,"🔒 Requires Prestige 1+ and Level 50.");
 x.rebirth++;x.level=1;x.xp=0;x.legacy+=500;
 reply(ctx,`♻️ REBIRTH ${x.rebirth} COMPLETE!\n🏛️ Legacy +500`);
});

C.passport=cmd("passport","View your world passport",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🪪 WORLD PASSPORT\n👤 ${ctx.username}\n⭐ Level ${x.level}\n🌟 Prestige ${x.prestige}\n♻️ Rebirth ${x.rebirth}\n🏛️ Legacy ${x.legacy}`);
});

C.achieve_total=cmd("achieve_total","View achievement count",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🏆 Achievements: ${x.achievements.length}\n🎖️ Badges: ${x.badges.length}\n👑 Titles: ${x.titles.length}`);
});

C.skills_tree=cmd("skills_tree","View progression skills",ctx=>{
 reply(ctx,`🌳 SKILL TREE\n⚔️ Strength\n🏃 Agility\n🧠 Intelligence\n🍀 Luck\n🔥 Mastery\n\nUse ${ctx.prefix}stat_allocate <stat>`);
});

C.title_shop=cmd("title_shop","View available titles",ctx=>{
 reply(ctx,`👑 TITLE SHOP\n• Rookie — Free\n• Explorer — 100 Tokens\n• Veteran — 250 Tokens\n• Elite — 500 Tokens\n• Legend — 1000 Tokens`);
});

C.legacy_score=cmd("legacy_score","View legacy score",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🏛️ LEGACY SCORE\n${x.legacy}\n🌟 Prestige: ${x.prestige}\n♻️ Rebirth: ${x.rebirth}`);
});

C.badge_case=cmd("badge_case","View badges",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🎖️ BADGE CASE\n${x.badges.length?x.badges.map(a=>"🏅 "+a).join("\n"):"📭 No badges yet."}`);
});

C.perk_activate=cmd("perk_activate","Activate unlocked perk",ctx=>{
 const x=u(ctx.event.senderID);
 if(x.level<10)return reply(ctx,"🔒 Reach Level 10 to unlock perks.");
 x.skill++;
 reply(ctx,`🔥 Perk activated!\n⚡ Skill Points: ${x.skill}`);
});

C.profile_glow=cmd("profile_glow","View profile glow status",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`✨ PROFILE GLOW\n⭐ Level ${x.level}\n🌟 Prestige ${x.prestige}\n👑 Title: ${x.activeTitle}`);
});

C.stat_allocate=cmd("stat_allocate","Allocate a progression stat",ctx=>{
 const x=u(ctx.event.senderID),s=(ctx.args[0]||"").toLowerCase();
 const map={strength:"str",str:"str",agility:"agi",agi:"agi",intelligence:"int",int:"int",luck:"luck"};
 if(!map[s])return reply(ctx,"📌 Usage: !stat_allocate strength|agility|intelligence|luck");
 if(x.skill<1)return reply(ctx,"❌ You need a Skill Point.");
 x.stats[map[s]]++;x.skill--;
 reply(ctx,`📈 ${s} +1\n⚡ Skill Points: ${x.skill}`);
});

C.mastery_loop=cmd("mastery_loop","View mastery progress",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🔄 MASTERY LOOP\nLevel: ${x.level}\nPrestige: ${x.prestige}\nRebirth: ${x.rebirth}\nLegacy: ${x.legacy}`);
});

C.career_level=cmd("career_level","View career level",ctx=>{
 const x=u(ctx.event.senderID);
 x.career=Math.max(1,Math.floor(x.level/5));
 reply(ctx,`💼 Career Level: ${x.career}\n⭐ Player Level: ${x.level}`);
});

C.season_pass=cmd("season_pass","View season pass",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🎫 SEASON ${x.season} PASS\nXP: ${x.seasonXP}\nTier: ${Math.floor(x.seasonXP/100)+1}\n🎁 More rewards unlock as you progress.`);
});

C.booster_pack=cmd("booster_pack","Use a free XP booster",ctx=>{
 const x=u(ctx.event.senderID);
 x.tokens+=10;
 reply(ctx,`${xp(ctx,150,"XP Booster")}\n🪙 +10 Tokens`);
});

C.codex=cmd("codex","View world codex",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`📖 WORLD CODEX\n🔎 Discoveries: ${x.discoveries.length}\n${x.discoveries.length?x.discoveries.join("\n"):"Explore the world to discover new entries."}`);
});

C.witness_prot=cmd("witness_prot","Activate fictional witness protection",ctx=>{
 reply(ctx,"🕶️ Witness Protection activated.\nYour identity is hidden inside the game world.");
});

C.citizen_oath=cmd("citizen_oath","Take the citizen oath",ctx=>{
 const x=u(ctx.event.senderID);
 x.achievements.push("Citizen Oath");
 reply(ctx,"🏛️ Citizen Oath accepted!\n🎖️ Achievement unlocked.");
});

C.tasks_daily=cmd("tasks_daily","View daily tasks",ctx=>{
 reply(ctx,`📋 DAILY TASKS\n1️⃣ Earn XP\n2️⃣ Explore the world\n3️⃣ Complete an activity\n4️⃣ Visit an NPC\n\n🎁 Rewards: XP + Tokens`);
});

C.tasks_weekly=cmd("tasks_weekly","View weekly tasks",ctx=>{
 reply(ctx,`📋 WEEKLY TASKS\n⚔️ Complete battles\n💰 Earn money\n🗺️ Discover locations\n🎯 Complete missions\n\n🎁 Large weekly rewards.`);
});

C.quests_main=cmd("quests_main","View main quests",ctx=>{
 reply(ctx,`📜 MAIN QUEST\n🌍 Build your reputation\n🏙️ Discover the city\n⭐ Reach Level 10\n🏆 Become a recognized citizen`);
});

C.quests_side=cmd("quests_side","View side quests",ctx=>{
 reply(ctx,`📜 SIDE QUESTS\n🧑 Help an NPC\n🗺️ Discover a location\n🎁 Find a hidden reward\n⚔️ Survive an encounter`);
});

C.quest_inventory=cmd("quest_inventory","View quest progress",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🎒 QUEST INVENTORY\nActive: ${x.quests.length}\nCompleted: ${x.completed}`);
});

C.faction_quest=cmd("faction_quest","View faction quest",ctx=>{
 reply(ctx,"🏴 FACTION QUEST\nChoose a faction through the future faction system.\n⚔️ Reputation will affect your rewards.");
});

C.bounty_board=cmd("bounty_board","View fictional world bounties",ctx=>{
 reply(ctx,"📜 BOUNTY BOARD\n🎯 Rookie targets\n💰 City contracts\n👑 Elite contracts\n\nUse the dedicated bounty system for actual game contracts.");
});

C.milestones=cmd("milestones","View progression milestones",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🏁 MILESTONES\n⭐ Level 5: ${x.level>=5?"✅":"🔒"}\n⭐ Level 10: ${x.level>=10?"✅":"🔒"}\n⭐ Level 20: ${x.level>=20?"✅":"🔒"}\n🌟 Prestige: ${x.prestige?"✅":"🔒"}`);
});

C.achieve_hunt=cmd("achieve_hunt","View achievement hunting",ctx=>{
 reply(ctx,"🔎 ACHIEVEMENT HUNT\n🏆 First Level\n🏆 Citizen\n🏆 Explorer\n🏆 Veteran\n🏆 Prestige\n\nComplete activities to unlock them.");
});

C.campaign_stats=cmd("campaign_stats","View campaign statistics",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`📊 CAMPAIGN STATS\n⭐ Level: ${x.level}\n✨ XP: ${x.xp}\n🏆 Achievements: ${x.achievements.length}\n📜 Quests: ${x.completed}\n🏛️ Legacy: ${x.legacy}`);
});

// ============================================================
// 🎯 DAILY ACTIVITIES
// ============================================================

const acts={
 daily_activity:["🎯 Daily Activity",50],
 daily_spin:["🎡 Daily Spin",75],
 daily_bonus:["🎁 Daily Bonus",100],
 daily_challenge:["⚡ Daily Challenge",125],
 daily_hunt:["🏹 Daily Hunt",80],
 daily_fish:["🎣 Daily Fishing",80],
 daily_mine:["⛏️ Daily Mining",80],
 daily_farm:["🌾 Daily Farming",80],
 daily_battle:["⚔️ Daily Battle",100],
 daily_quest:["📜 Daily Quest",120]
};

for(const [n,v] of Object.entries(acts)){
 C[n]=cmd(n,v[0],ctx=>{
  const x=u(ctx.event.senderID);
  if(!daily(ctx,n,10))return reply(ctx,`⏳ ${v[0]} already completed today.`);
  reply(ctx,`${v[0]} complete!\n${xp(ctx,v[1],"Daily Reward")}\n🪙 +10 Tokens`);
 });
}

C.weekly_challenge=cmd("weekly_challenge","Complete weekly challenge",ctx=>{
 if(!daily(ctx,"weekly",50))return reply(ctx,"⏳ Weekly challenge already claimed.");
 reply(ctx,`${xp(ctx,500,"Weekly Challenge")}\n🪙 +50 Tokens`);
});

C.weekly_event=cmd("weekly_event","View weekly event",ctx=>{
 reply(ctx,`📅 WEEKLY EVENT\n🌟 Double XP weekend\n🎁 Bonus rewards\n🏆 Limited achievements`);
});

C.monthly_event=cmd("monthly_event","View monthly event",ctx=>{
 reply(ctx,"📅 MONTHLY EVENT\n🏆 Monthly championship is active.");
});

C.season_event=cmd("season_event","View season event",ctx=>{
 reply(ctx,`🌟 SEASON ${u(ctx.event.senderID).season} EVENT\n⚔️ Special challenges\n🎁 Season rewards\n🏆 Limited titles`);
});

C.streak=cmd("streak","View activity streak",ctx=>{
 const x=u(ctx.event.senderID);
 reply(ctx,`🔥 STREAK: ${x.streak} days\n🎁 Keep completing daily activities for bonus rewards.`);
});

C.streak_reward=cmd("streak_reward","Claim streak reward",ctx=>{
 const x=u(ctx.event.senderID);
 if(x.streak<3)return reply(ctx,"🔒 Reach a 3-day streak first.");
 x.tokens+=x.streak*5;
 reply(ctx,`🔥 Streak reward claimed!\n🪙 +${x.streak*5} Tokens`);
});

// ============================================================
// 🌍 WORLD / CORE SYSTEM
// ============================================================

C.world_status=cmd("world_status","View world status",ctx=>{
 reply(ctx,`🌍 WORLD STATUS\n📅 Day: ${W.day}\n🌤️ Weather: ${W.weather}\n🎉 Event: ${W.event}\n🏙️ District: ${W.district}`);
});

C.town=cmd("town","View town information",ctx=>{
 reply(ctx,"🏙️ TOWN\nCentral City\n🏛️ Government\n🏪 Market\n🏠 Residential District\n⚔️ Arena District\n🌲 Wilderness Gate");
});

C.district=cmd("district","View current district",ctx=>{
 reply(ctx,`🏙️ DISTRICT\n${W.district}\n🟢 Status: Open\n👥 Population: Active\n🛡️ Security: Normal`);
});

C.district_status=cmd("district_status","View district status",ctx=>{
 reply(ctx,`🛡️ DISTRICT STATUS\n🏙️ ${W.district}\n🟢 Open\n👮 Security: Normal\n💰 Economy: Stable\n🌤️ Weather: ${W.weather}`);
});

C.npc_list=cmd("npc_list","List world NPCs",ctx=>{
 reply(ctx,Object.entries(W.npcs).map(([k,v])=>`${v[1]} ${k} — ${v[0]}`).join("\n"));
});

C.npc=cmd("npc","Inspect an NPC",ctx=>{
 const n=(ctx.args[0]||"").toLowerCase(),v=W.npcs[n];
 if(!v)return reply(ctx,`❌ NPC not found.\n📌 Try: ${Object.keys(W.npcs).join(", ")}`);
 reply(ctx,`${v[1]} ${v[0]}\n📝 ${v[2]}`);
});

C.npc_chat=cmd("npc_chat","Talk to an NPC",ctx=>{
 const n=(ctx.args[0]||"citizen").toLowerCase(),v=W.npcs[n];
 if(!v)return reply(ctx,"❌ NPC not found.");
 const lines=["Welcome to the city!","The world is changing every day.","Keep exploring and you'll find something rare.","Watch the event board!"];
 reply(ctx,`${v[1]} ${v[0]}: "${lines[Math.floor(Math.random()*lines.length)]}"`);
});

for(const n of ["npc_job","npc_quest","npc_trade","npc_relationship","npc_reputation"]){
 C[n]=cmd(n,`World NPC ${n.replace("npc_","")}`,ctx=>{
  const who=ctx.args[0]||"citizen";
  reply(ctx,`🧑 NPC ${n.replace("npc_","").toUpperCase()}\nTarget: ${who}\n🌍 This NPC system is active inside the game world.`);
 });
}

for(const n of ["mayor","police","doctor","merchant","blacksmith","farmer","fisherman","miner","hunter","mechanic","bartender","citizen"]){
 C[n]=cmd(n,`Visit the ${n}`,ctx=>{
  const v=W.npcs[n];
  reply(ctx,`${v[1]} ${v[0]}\n📝 ${v[2]}\n📍 ${W.district}`);
 });
}

// ============================================================
// 🌦️ WORLD EVENTS — INFORMATION/SIMULATION
// ============================================================

const events={
 weather_event:["🌦️ Weather Event","Weather conditions are changing."],
 rain:["🌧️ Rain","Crops benefit and travel becomes slower."],
 storm:["⛈️ Storm","A powerful storm is passing through the city."],
 heatwave:["🔥 Heatwave","Energy activities become harder."],
 flood:["🌊 Flood","Low areas are temporarily affected."],
 earthquake:["🌎 Earthquake","The world shakes and emergency NPCs respond."],
 volcano:["🌋 Volcano","Volcanic activity has been detected."],
 eclipse:["🌑 Eclipse","The sky has entered an unusual darkness."],
 meteor:["☄️ Meteor","A meteor has appeared somewhere in the world."],
 treasure_event:["💎 Treasure Event","Rare treasure may appear."],
 double_xp:["✨ Double XP","XP rewards are temporarily increased."],
 double_cash:["💰 Double Cash","Cash rewards are temporarily increased."],
 rare_spawn:["🌟 Rare Spawn","A rare creature has appeared."],
 boss_event:["👹 Boss Event","A powerful fictional boss has appeared."],
 invasion:["👾 Invasion","The city is facing a fictional invasion."],
 festival_event:["🎉 Festival","The city is celebrating."],
 market_event:["📈 Market Event","The market is experiencing unusual activity."],
 fishing_event:["🎣 Fishing Event","Rare fish may appear."],
 mining_event:["⛏️ Mining Event","Rare ores may appear."],
 farm_event:["🌾 Farm Event","Farm rewards are increased."]
};

for(const [n,v] of Object.entries(events)){
 C[n]=cmd(n,v[0],ctx=>reply(ctx,`${v[0]}\n${v[1]}\n🌍 Status: ${W.event==="🌍 Normal"?"Active":"World event active"}`));
}

// ============================================================
// 📦 EXPORT
// ============================================================

module.exports=C;
