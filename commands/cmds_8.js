// commands/cmds_8.js
const S={xp:new Map(),mine:new Map(),guild:new Map(),pvp:new Map(),raid:new Map(),boss:new Map(),inv:new Map(),jobs:new Map()};
const say=(c,x)=>c.reply(`⚔️ ${x}`);
const me=c=>{let id=c.event.senderID;if(!S.xp.has(id))S.xp.set(id,{xp:0,lv:1});return S.xp.get(id)};
const add=(c,x)=>{let m=me(c);m.xp+=x;while(m.xp>=m.lv*100)m.xp-=m.lv*100,m.lv++;return m};
const C={};
const A=(names,fn)=>names.forEach(n=>C[n]={name:n,execute:async c=>fn(c)});

// ⚔️ WAR-ZONE
A([
"bossfight","boss_spawn","boss_ability","boss_spectate","kaiju_rage",
"cyborg_overlord","dragon_nest","boss_history"
],c=>{
 let id=c.event.senderID;
 if(c.command==="boss_spawn"&&!c.isAdmin)return say(c,"❌ Admin only.");
 if(c.command==="boss_spawn")S.boss.set(id,{hp:10000,name:"World Boss"});
 let b=S.boss.get(id)||{hp:10000,name:"Titan Boss"};
 let dmg=Math.floor(Math.random()*900)+100;
 if(c.command==="bossfight")b.hp=Math.max(0,b.hp-dmg);
 say(c,`👹 ${b.name}\n❤️ HP: ${b.hp}\n⚔️ Damage: ${dmg}\n✨ XP +${add(c,25).lv}`);
});

A([
"pvp_queue","pvp_match","pvp_rank","pvp_wager","pvp_loadout",
"arena_hazard","gladiator_oath"
],c=>say(c,`🏟️ ${c.command.replace(/_/g," ")} activated!\n⚔️ Battle system ready.`));

A([
"arena","dungeon","dungeon_enter","dungeon_clear","dungeon_status",
"dungeon_boss","dungeon_leave","dungeon_modify","dungeon_lb"
],c=>say(c,`🏰 ${c.command.replace(/_/g," ")}\n🎁 Explore • Fight • Loot • XP`));

A([
"raid","raid_party","raid_attack","raid_status","raid_loot",
"raid_cooldown","raid_bunker","raid_hq","coop_quest","coop_trade",
"combat_skills","combat_stats","survival_wave","merc_agency","medevac"
],c=>say(c,`🔥 ${c.command.replace(/_/g," ")}\n🛡️ Team system activated.`));

// ⛏️ MINING
A([
"mine","mine_enter","mine_exit","dig","excavate","ore","prospect",
"ore_scan","pickaxe","buy_pickaxe","upgrade_pickaxe","minecart",
"dynamite","gem_shop","refine_ore","smelt","forge","mineshaft",
"mine_upgrade","mine_worker","mine_storage","ore_market","sell_ore",
"mining_quest","mining_rank","mining_lb","cave","cave_boss","ancient_ruins"
],c=>{
 let id=c.event.senderID,m=S.mine.get(id)||{ore:0,level:1};
 if(c.command==="mine"||c.command==="dig"||c.command==="excavate")
   m.ore+=Math.floor(Math.random()*10)+1;
 if(c.command==="upgrade_pickaxe")m.level++;
 S.mine.set(id,m);
 say(c,`⛏️ ${c.command.replace(/_/g," ")}\n🪨 Ore: ${m.ore}\n⛏️ Pickaxe Lv.${m.level}`);
});

// 🔨 CRAFTING
A([
"craft","recipe","recipes","craft_weapon","craft_armor","craft_tool",
"craft_potion","craft_food","craft_pet_item","materials","gather",
"workbench","blacksmith","upgrade_item","repair","dismantle","enchant",
"socket","gem","craft_queue"
],c=>say(c,`🔨 Crafting: ${c.command.replace(/_/g," ")}\n🧱 Materials checked.\n✨ Crafting system ready.`));

// 🍳 COOKING
A([
"cook","recipebook","ingredients","buy_food","eat","restaurant","chef",
"kitchen","kitchen_upgrade","meal","buff_food","food_market",
"sell_food","catering","cooking_quest","chef_rank","cookoff"
],c=>say(c,`🍳 ${c.command.replace(/_/g," ")}\n🥘 Kitchen system ready!\n✨ Buffs & meals available.`));

// 🌍 EXPLORATION
A([
"explore","travel","map","location","discover","camp","rest","forage",
"ruins","forest","island","ocean","village","city","landmark",
"treasure","lost_temple","secret_area","random_event","encounter",
"explorer_rank"
],c=>say(c,`🗺️ ${c.command.replace(/_/g," ")}\n🌎 New territory discovered!\n🎁 Exploration rewards available.`));

// 🏰 GUILDS
A([
"guild","guild_create","guild_join","guild_leave","guild_invite",
"guild_kick","guild_rank","guild_upgrade","guild_bank","guild_shop",
"guild_quest","guild_war","guild_lb"
],c=>{
 let id=c.event.senderID,g=S.guild.get(id)||{name:null,lv:1,bank:0};
 if(c.command==="guild_create")g.name=c.args.join(" ")||`Guild-${id.slice(-4)}`;
 if(c.command==="guild_upgrade")g.lv++;
 S.guild.set(id,g);
 say(c,`🏰 Guild: ${g.name||"No Guild"}\n⭐ Lv.${g.lv}\n⚔️ ${c.command.replace(/_/g," ")}`);
});

// ⚔️ COMBAT
A([
"attack","skill","ultimate","damage","critical","status_effect",
"equipment","armor","weapon_stats","combat_log"
],c=>{
 let dmg=Math.floor(Math.random()*500)+50;
 if(c.command==="critical")dmg*=2;
 say(c,`⚔️ ${c.command.replace(/_/g," ")}\n💥 Damage: ${dmg}\n🔥 Combat action complete.`);
});

// 🎁 LOOT
A([
"loot","lootbox","chest","open_chest","rare_drop","drop_rate",
"treasure_map","treasure_hunt","relic","artifact"
],c=>{
 let items=["💎 Diamond","🪙 Ancient Coin","⚔️ Rare Blade","🛡️ Mystic Armor","🔮 Relic"];
 let item=items[Math.floor(Math.random()*items.length)];
 say(c,`🎁 LOOT FOUND!\n${item}\n✨ Rare-drop system processed.`);
});

// 📜 MISSIONS
A([
"mission","missions","mission_accept","mission_complete","mission_cancel",
"mission_reward","mission_history","contract","contract_accept",
"contract_complete"
],c=>{
 let m=add(c,50);
 say(c,`📜 ${c.command.replace(/_/g," ")}\n⭐ Level: ${m.lv}\n✨ XP: ${m.xp}/${m.lv*100}`);
});

// 🎒 INVENTORY REMAINING
A([
"use","drop","sort","search","stash","unstash",
"item_info","item_value","item_history"
],c=>say(c,`🎒 Inventory → ${c.command.replace(/_/g," ")}\n📦 Inventory action complete.`));

// 🤖 AUTOMATION
A([
"remind","timer","schedule","auto_daily","auto_event","event_alert",
"cooldown","notifications","subscribe","unsubscribe"
],c=>{
 let id=c.event.senderID;
 if(!S.jobs.has(id))S.jobs.set(id,[]);
 if(c.command==="subscribe")S.jobs.get(id).push("alerts");
 if(c.command==="unsubscribe")S.jobs.set(id,[]);
 say(c,`🤖 ${c.command.replace(/_/g," ")}\n⚙️ Automation updated.`);
});

module.exports=Object.values(C);
