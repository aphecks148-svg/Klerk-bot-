const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={}),P=R.players||(R.players=new Map());

const ITEMS=["💎 Crystal","🪙 Gold","🔮 Relic","🧪 Potion","⚙️ Metal","🧿 Rune","🗡️ Blade","🛡️ Armor","💠 Gem","📜 Scroll","🐉 Dragon Scale","👑 Royal Token"];
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const uid=c=>String(c?.uid||c?.event?.senderID||"");
const player=c=>{let id=uid(c);if(!P.has(id))P.set(id,{uid:id,name:c?.name||id,cash:0,bank:0,vault:0,savings:0,xp:0,level:1,items:{},pet:null,petSafe:false,skills:{},jobsDone:0});let p=P.get(id);p.name=c?.name||p.name;return p};
const save=c=>{try{c?.save?.()}catch{}};
const addItem=(p,n,q=1)=>p.items[n]=(p.items[n]||0)+q;
const award=(c,m="Adventure")=>{let p=player(c),cash=rand(50000,250000),xp=rand(100,500),got=[];p.cash+=cash;p.xp+=xp;for(let i=0;i<3;i++){let x=pick(ITEMS);addItem(p,x);got.push(x)};let old=p.level;while(p.xp>=p.level*1000){p.xp-=p.level*1000;p.level++}save(c);return `╭━━〔 ⚔️ ${m.toUpperCase()} 〕━━╮\n│ ✅ Completed successfully!\n│ 💰 +$${cash.toLocaleString()}\n│ ⭐ +${xp} XP\n│ 🎁 ${got.join(" • ")}\n│ 📈 Level: ${old} → ${p.level}\n╰━━━━━━━━━━━━━━━━━━╯\n💡 Tip: Keep completing missions to level up!`};
const bar=(v,max=100,n=10)=>{v=Math.max(0,Math.min(v,max));let x=Math.round(v/max*n);return"█".repeat(x)+"░".repeat(n-x)};
const target=c=>c?.event?.mentions&&Object.keys(c.event.mentions)[0]||null;
const requireMention=c=>{let t=target(c);if(!t){c.reply("🎯 Please mention a player.\n💡 Example: !pvp @user");return null}return t};
const petName=p=>p.pet?.name||p.pet?.type||"your pet";
const battle=c=>{let p=player(c),t=requireMention(c);if(!t)return;if(p.petSafe)return c.reply("🛡️ Your active pet is protected by PET SAFE.\n💡 Use !pet_safe to toggle protection.");let enemy=P.get(String(t));let ep=enemy?.pet;if(enemy&&enemy.petSafe)return c.reply("🛡️ Target's pet is protected by PET SAFE.");let dmg=rand(50,300),xp=rand(100,350),cash=rand(10000,80000);p.cash+=cash;p.xp+=xp;p.jobsDone=(p.jobsDone||0)+1;let old=p.level;while(p.xp>=p.level*1000){p.xp-=p.level*1000;p.level++}save(c);return `╭━━〔 ⚔️ PET COMBAT 〕━━╮\n│ 🐾 ${petName(p)} attacked!\n│ 🎯 Target: ${t}\n│ 💥 Damage: ${dmg}\n│ ⭐ +${xp} XP\n│ 💰 +$${cash.toLocaleString()}\n│ 📈 Level: ${old} → ${p.level}\n╰━━━━━━━━━━━━━━━━━━╯\n💡 Tip: Train your pet skills before harder battles.`};
const generic=(c,title,desc)=>c.reply(`╭━━〔 ${title} 〕━━╮\n│ ${desc}\n╰━━━━━━━━━━━━━━━━━━╯\n💡 Tip: Complete activities to earn XP, cash and items.`);
const missionNames=["First Steps","Lost Relic","Goblin Hunt","Mine Expedition","Dragon Hunt","Village Rescue","Ancient Ruins","Treasure Run","Forest Guardian","Cave Mystery","Bandit Camp","Royal Escort","Sea Voyage","Volcano Quest","Crystal Search","Demon Gate","Sky Temple","Void Portal","Titan Battle","Final Legend"];
const recipes=["iron_sword","steel_sword","dragon_blade","iron_armor","steel_armor","dragon_armor","health_potion","mana_potion","energy_food","pet_treat","rune","gem"];
const commands={};

const add=(n,fn,m="combat")=>commands[n]={name:n,execute:fn,module:m};

[
["craft","🔨 Craft an item"],["recipe","📜 View a recipe"],["recipes","📚 View recipes"],["craft_weapon","🗡️ Craft weapon"],["craft_armor","🛡️ Craft armor"],["craft_tool","⛏️ Craft tool"],["craft_potion","🧪 Craft potion"],["craft_food","🍖 Craft food"],["craft_pet_item","🐾 Craft pet item"],["materials","🧱 View materials"],["gather","🌿 Gather materials"],["workbench","🔨 Open workbench"],["upgrade_item","⬆️ Upgrade item"],["repair","🔧 Repair item"],["dismantle","♻️ Dismantle item"],["enchant","✨ Enchant item"],["socket","🔮 Socket item"],["gem","💎 Manage gems"],["craft_queue","⏳ Craft queue"]
].forEach(([n,d])=>add(n,c=>generic(c,"🔨 CRAFTING",d)));

add("craft",c=>{let p=player(c),x=pick(recipes);addItem(p,x);save(c);c.reply(`🔨 Crafted **${x}** successfully!\n🧱 Materials consumed\n🎁 Item added to inventory\n💡 Use !inventory to view your items.`)},"crafting");

[
["mine","⛏️ Mine for ore"],["mine_enter","🚪 Enter mine"],["mine_exit","🚪 Exit mine"],["dig","⛏️ Dig"],["excavate","🏺 Excavate"],["ore","🪨 Inspect ore"],["prospect","🔎 Prospect"],["ore_scan","📡 Scan ore"],["pickaxe","⛏️ View pickaxe"],["buy_pickaxe","🛒 Buy pickaxe"],["upgrade_pickaxe","⬆️ Upgrade pickaxe"],["minecart","🚋 Minecart"],["dynamite","💣 Blast rocks"],["gem_shop","💎 Gem shop"],["refine_ore","⚗️ Refine ore"],["smelt","🔥 Smelt"],["forge","🔥 Forge"]
].forEach(([n,d])=>add(n,c=>generic(c,"⛏️ MINING",d),"mining"));

add("mine",c=>{let p=player(c),ore=pick(["Iron Ore","Gold Ore","Crystal Ore","Diamond Ore","Mythril Ore"]),q=rand(1,8);addItem(p,ore,q);p.xp+=rand(50,150);save(c);c.reply(`╭━━〔 ⛏️ MINING 〕━━╮\n│ 🪨 Found: ${ore}\n│ 📦 Quantity: x${q}\n│ ⭐ Mining XP gained\n╰━━━━━━━━━━━━━━━━━━╯\n💡 Tip: Upgrade your pickaxe for rare ores.`)},"mining");

[
["attack","⚔️ Attack"],["skill","✨ Use combat skill"],["ultimate","💥 Ultimate attack"],["damage","💥 Damage info"],["critical","🎯 Critical info"],["status_effect","☠️ Status effects"],["equipment","🎒 Equipment"],["armor","🛡️ Armor"],["weapon_stats","🗡️ Weapon stats"],["combat_log","📜 Combat log"],["combat_skills","✨ Combat skills"],["combat_stats","📊 Combat stats"]
].forEach(([n,d])=>add(n,c=>generic(c,"⚔️ COMBAT",d)));

add("attack",battle,"combat");

[
["bossfight","👹 Boss Fight"],["boss_spawn","👹 Spawn Boss"],["boss_ability","💀 Boss Ability"],["boss_spectate","👁️ Spectate Boss"],["kaiju_rage","🦖 Kaiju Rage"],["cyborg_overlord","🤖 Cyborg Overlord"],["dragon_nest","🐉 Dragon Nest"],["boss_history","📜 Boss History"]
].forEach(([n,d])=>add(n,c=>{let t=requireMention(c);if(t)generic(c,"👹 BOSS FIGHT",d)},"boss"));

add("bossfight",c=>{if(!requireMention(c))return;c.reply(award(c,"BOSS DEFEATED"))},"boss");

[
["arena","🏟️ Arena"],["pvp_queue","⚔️ PvP Queue"],["pvp_match","⚔️ PvP Match"],["pvp_rank","🏆 PvP Rank"],["pvp_wager","💰 PvP Wager"],["pvp_loadout","🎒 PvP Loadout"],["arena_hazard","☠️ Arena Hazard"],["gladiator_oath","🛡️ Gladiator Oath"],["pvp","⚔️ PvP"]
].forEach(([n,d])=>add(n,c=>{let t=requireMention(c);if(t)generic(c,"🏟️ PVP / ARENA",d)},"pvp"));

add("pvp",battle,"pvp");
add("arena",battle,"pvp");

[
["dungeon","🏰 Dungeon"],["dungeon_enter","🚪 Enter dungeon"],["dungeon_clear","🏆 Clear dungeon"],["dungeon_status","📊 Dungeon status"],["dungeon_boss","👹 Dungeon boss"],["dungeon_leave","🚪 Leave dungeon"],["dungeon_modify","🛠️ Modify dungeon"],["dungeon_lb","🏆 Dungeon leaderboard"]
].forEach(([n,d])=>add(n,c=>{let t=requireMention(c);if(t)generic(c,"🏰 DUNGEON",d)},"dungeon"));

add("dungeon",c=>{if(!requireMention(c))return;c.reply(award(c,"DUNGEON CLEARED"))},"dungeon");

[
["raid","☠️ Raid"],["raid_party","👥 Raid party"],["raid_attack","⚔️ Raid attack"],["raid_status","📊 Raid status"],["raid_loot","🎁 Raid loot"],["raid_cooldown","⏳ Raid cooldown"],["raid_bunker","🏰 Raid bunker"],["raid_hq","🏢 Raid HQ"],["coop_quest","🤝 Co-op quest"],["coop_trade","🤝 Co-op trade"],["co","🤝 Co-op Battle"]
].forEach(([n,d])=>add(n,c=>{let t=requireMention(c);if(t)generic(c,"☠️ RAID / CO-OP",d)},"raid"));

add("raid",c=>{if(!requireMention(c))return;c.reply(award(c,"RAID COMPLETED"))},"raid");
add("co",c=>{if(!requireMention(c))return;c.reply(award(c,"CO-OP COMPLETED"))},"raid");

[
["explore","🗺️ Explore"],["travel","🚶 Travel"],["map","🗺️ Map"],["location","📍 Location"],["discover","🔎 Discover"],["camp","⛺ Camp"],["rest","😴 Rest"],["forage","🌿 Forage"],["ruins","🏛️ Ruins"],["cave","🕳️ Cave"],["island","🏝️ Island"],["ocean","🌊 Ocean"],["village","🏘️ Village"],["city","🏙️ City"],["landmark","📍 Landmark"],["treasure","💎 Treasure"],["lost_temple","🏛️ Lost Temple"],["secret_area","🔐 Secret Area"],["random_event","🎲 Random Event"],["encounter","⚔️ Encounter"],["explorer_rank","🏆 Explorer Rank"]
].forEach(([n,d])=>add(n,c=>generic(c,"🗺️ EXPLORATION",d),"exploration"));

[
["use","🖐️ Use item"],["drop","🗑️ Drop item"],["sort","🔃 Sort inventory"]
].forEach(([n,d])=>add(n,c=>generic(c,"🎒 INVENTORY",d),"inventory"));

[
["loot","🎁 Loot"],["lootbox","📦 Loot Box"],["chest","🧰 Chest"],["open_chest","🔓 Open Chest"],["rare_drop","💎 Rare Drop"],["treasure_map","🗺️ Treasure Map"],["treasure_hunt","💎 Treasure Hunt"],["relic","🔮 Relic"],["artifact","🏺 Artifact"],["drop_rate","📊 Drop Rate"]
].forEach(([n,d])=>add(n,c=>generic(c,"🎁 LOOT",d),"loot"));

missionNames.forEach((name,i)=>add(`mission_${i+1}`,c=>c.reply(award(c,`MISSION ${i+1}: ${name}`)),"missions"));

[
["mission","📜 Mission"],["missions","📚 Missions"],["mission_accept","✅ Accept mission"],["mission_complete","🏆 Complete mission"],["mission_cancel","❌ Cancel mission"],["mission_reward","🎁 Mission reward"],["mission_history","📜 Mission history"],["contract","📄 Contract"],["contract_accept","✅ Accept contract"],["contract_complete","🏆 Complete contract"]
].forEach(([n,d])=>add(n,c=>c.reply(award(c,d)),"missions"));

[
["guild","🏰 Guild"],["guild_create","🏗️ Create guild"],["guild_join","🤝 Join guild"],["guild_leave","🚪 Leave guild"],["guild_invite","📨 Invite member"],["guild_kick","👢 Kick member"],["guild_rank","🏆 Guild rank"],["guild_upgrade","⬆️ Upgrade guild"],["guild_bank","🏦 Guild bank"],["guild_shop","🛒 Guild shop"],["guild_quest","📜 Guild quest"],["guild_war","⚔️ Guild war"],["guild_lb","🏆 Guild leaderboard"]
].forEach(([n,d])=>add(n,c=>generic(c,"🏰 GUILD",d),"guild"));

[
["survival_wave","🌊 Survival Wave"],["merc_agency","💼 Mercenary Agency"],["medevac","🚑 Medevac"]
].forEach(([n,d])=>add(n,c=>c.reply(award(c,d)),"survival"));

module.exports=commands;
