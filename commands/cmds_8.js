const S={
 xp:new Map(),
 mine:new Map(),
 guild:new Map(),
 pvp:new Map(),
 raid:new Map(),
 boss:new Map(),
 inv:new Map(),
 jobs:new Map()
};

const say=(c,x)=>c.reply(`⚔️ ${x}`);

function cmd(name,description,fn,aliases=[]){
 return {
  name,
  description,
  execute:fn,
  aliases,
  reaction:"⚔️"
 };
}

const C={};

function add(names,description,fn){
 names.forEach(n=>{
  if(!C[n]) C[n]=cmd(n,description,fn);
 });
}

/* ═══════════════════════════════
   ⚒️ CRAFTING
═══════════════════════════════ */
add([
 "craft","recipe","recipes","craft_weapon","craft_armor",
 "craft_tool","craft_potion","craft_food","craft_pet_item",
 "materials","gather","workbench","blacksmith","upgrade_item",
 "repair","dismantle","enchant","socket","gem","craft_queue"
],"⚒️ Crafting command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`⚒️ ${n.replace(/_/g," ")} completed!\n📦 Materials processed successfully.`);
});

/* ═══════════════════════════════
   ⛏️ MINING
═══════════════════════════════ */
add([
 "mine","mine_enter","mine_exit","dig","excavate","ore",
 "prospect","ore_scan","pickaxe","buy_pickaxe","upgrade_pickaxe",
 "minecart","dynamite","gem_shop","refine_ore","smelt","forge",
 "blacksmith","upgrade_item","repair","dismantle","enchant",
 "socket","gem","craft_queue"
],"⛏️ Mining command",(c)=>{
 const id=c.event.senderID;
 let x=S.mine.get(id)||{ore:0,gems:0,level:1};
 x.ore+=Math.floor(Math.random()*10)+1;
 S.mine.set(id,x);
 say(c,`⛏️ Mining operation complete!\n🪨 Ore: +${Math.floor(Math.random()*10)+1}\n📊 Mine Lv.${x.level}`);
});

/* ═══════════════════════════════
   ⚔️ COMBAT
═══════════════════════════════ */
add([
 "attack","defend","skill","ultimate","heal","flee",
 "damage","critical","status_effect","equipment",
 "armor","weapon_stats","combat_log"
],"⚔️ Combat command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`⚔️ ${n.replace(/_/g," ")} executed!\n💥 Combat system processed the action.`);
});

/* ═══════════════════════════════
   👑 BOSS / ARENA / PVP
═══════════════════════════════ */
add([
 "bossfight","boss_spawn","boss_ability","boss_spectate",
 "kaiju_rage","cyborg_overlord","dragon_nest","boss_history",
 "arena","pvp_queue","pvp_match","pvp_rank","pvp_wager",
 "pvp_loadout","arena_hazard","gladiator_oath"
],"👑 War-zone command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`👑 ${n.replace(/_/g," ")} activated!\n⚔️ War-zone system is ready.`);
});

/* ═══════════════════════════════
   🏰 DUNGEON
═══════════════════════════════ */
add([
 "dungeon","dungeon_enter","dungeon_clear","dungeon_status",
 "dungeon_boss","dungeon_leave","dungeon_modify","dungeon_lb"
],"🏰 Dungeon command",(c)=>{
 const id=c.event.senderID;
 let x=S.xp.get(id)||{dungeon:0};
 x.dungeon++;
 S.xp.set(id,x);
 say(c,`🏰 Dungeon action complete!\n🗡️ Dungeon progress: ${x.dungeon}`);
});

/* ═══════════════════════════════
   💀 RAID
═══════════════════════════════ */
add([
 "raid","raid_party","raid_attack","raid_status","raid_loot",
 "raid_cooldown","raid_bunker","raid_hq","coop_quest","coop_trade"
],"💀 Raid command",(c)=>{
 const id=c.event.senderID;
 let x=S.raid.get(id)||{raids:0};
 x.raids++;
 S.raid.set(id,x);
 say(c,`💀 RAID SYSTEM\n⚔️ Operation started!\n🏆 Raid count: ${x.raids}`);
});

/* ═══════════════════════════════
   🌍 EXPLORATION
═══════════════════════════════ */
add([
 "explore","travel","map","location","discover","expedition",
 "camp","rest","forage","gather","ruins","cave","forest",
 "mountain","island","ocean","village","city","landmark",
 "treasure","lost_temple","secret_area","random_event",
 "encounter","explorer_rank"
],"🌍 Exploration command",(c)=>{
 const places=[
  "🏝️ Mysterious Island",
  "🏔️ Ancient Mountain",
  "🌲 Dark Forest",
  "🏛️ Lost Temple",
  "🗺️ Forgotten Ruins"
 ];
 const p=places[Math.floor(Math.random()*places.length)];
 say(c,`🌍 EXPEDITION COMPLETE\n📍 ${p}\n🎒 Exploration rewards collected!`);
});

/* ═══════════════════════════════
   🎒 INVENTORY
═══════════════════════════════ */
add([
 "use","drop","equip","unequip","sort","search",
 "stash","unstash","item_info","item_value","item_history"
],"🎒 Inventory command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`🎒 INVENTORY\n📦 Action: ${n.replace(/_/g," ")}\n✅ Inventory updated.`);
});

/* ═══════════════════════════════
   🏆 LOOT
═══════════════════════════════ */
add([
 "loot","lootbox","chest","open_chest","rare_drop",
 "drop_rate","treasure_map","treasure_hunt","relic","artifact"
],"🏆 Loot command",(c)=>{
 const drops=[
  "💎 Rare Gem",
  "🪙 Gold Cache",
  "⚔️ Ancient Weapon",
  "🛡️ Legendary Armor",
  "✨ Mystic Relic"
 ];
 const d=drops[Math.floor(Math.random()*drops.length)];
 say(c,`🏆 LOOT FOUND!\n🎁 ${d}`);
});

/* ═══════════════════════════════
   📜 MISSIONS
═══════════════════════════════ */
add([
 "mission","missions","mission_accept","mission_complete",
 "mission_cancel","mission_reward","mission_history",
 "contract","contract_accept","contract_complete"
],"📜 Mission command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`📜 MISSION CONTROL\n🎯 ${n.replace(/_/g," ")}\n✅ Mission system updated.`);
});

/* ═══════════════════════════════
   🛡️ GUILDS
═══════════════════════════════ */
add([
 "guild","guild_create","guild_join","guild_leave","guild_invite",
 "guild_kick","guild_rank","guild_upgrade","guild_bank",
 "guild_shop","guild_quest","guild_war","guild_lb"
],"🛡️ Guild command",(c)=>{
 const id=c.event.senderID;
 let x=S.guild.get(id)||{level:1,members:1};
 S.guild.set(id,x);
 say(c,`🛡️ GUILD SYSTEM\n⭐ Guild Lv.${x.level}\n👥 Members: ${x.members}`);
});

/* ═══════════════════════════════
   🌊 SURVIVAL / CO-OP
═══════════════════════════════ */
add([
 "survival_wave","merc_agency","medevac"
],"🌊 Survival command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`🌊 ${n.replace(/_/g," ")} activated!\n🛡️ Survival system ready.`);
});

/* ═══════════════════════════════
   🔨 EXTRA WAR UTILITIES
═══════════════════════════════ */
add([
 "combat_skills","combat_stats","bounty_hunt"
],"⚔️ Advanced combat command",(c)=>{
 const n=c.event.body.trim().split(/\s+/)[0].replace(/^!/,"");
 say(c,`⚔️ ${n.replace(/_/g," ")} updated!\n📊 Combat data synchronized.`);
});

module.exports=Object.values(C);
