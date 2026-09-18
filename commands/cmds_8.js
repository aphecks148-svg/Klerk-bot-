const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={}),P=R.players||(R.players=new Map()),C={};
const U=id=>{id=String(id||"");let u=P.get(id);if(!u)u={id,cash:100000,bank:0,vault:0,savings:0,coins:100,tokens:0,xp:0,level:1,inventory:{},materials:{},equipment:{},skills:{},missions:[],guild:null,ore:[],loot:[],hp:100,maxHp:100,energy:100,maxEnergy:100};u.inventory??={};u.materials??={};u.equipment??={};u.skills??={};u.missions??=[];u.ore??=[];u.loot??=[];u.hp??=100;u.maxHp??=100;u.energy??=100;u.maxEnergy??=100;P.set(id,u);return u};
const N=x=>String(x||"").toLowerCase().trim(),num=x=>Math.max(0,Number(String(x||"").replace(/[$,]/g,""))||0),money=n=>`$${Math.floor(n||0).toLocaleString()}`,D=(u,k,n=1)=>u.inventory[k]=(u.inventory[k]||0)+n,M=(u,k,n=1)=>u.materials[k]=(u.materials[k]||0)+n,BAR=(v,m=100,n=10)=>{let a=Math.round(Math.max(0,Math.min(m,v)/m*n));return"█".repeat(a)+"░".repeat(n-a)},XP=(c,n=100)=>{let u=U(c.uid),old=u.level;u.xp=(u.xp||0)+n;while(u.xp>=u.level*100){u.xp-=u.level*100;u.level++}return old<u.level?` 🎉 Lv.${u.level}!`:""},REWARD=(c,x=100,cash=50000,it=["🎁 Mystery Box","💎 Gem","🪙 Token"])=>{let u=U(c.uid);u.cash+=cash;it.slice(0,3).forEach(i=>D(u,i));return`💰 +${money(cash)}\n🎁 ${it.slice(0,3).join(" • ")}\n✨ +${x} XP${XP(c,x)}`};
const target=c=>Object.keys(c.event?.mentions||{})[0]||null,mention=c=>Object.keys(c.event?.mentions||{}).length>0,add=(names,fn)=>String(names).split("|").forEach(n=>C[N(n)]={name:N(n),execute:fn,module:"combat_crafting"});
const reqMention=c=>{if(!mention(c)){c.reply("🎯 This mode requires you to mention the player.\n💡 Example: !pvp @user");return false}return true};
const action=(c,n)=>{let u=U(c.uid);u.energy=Math.max(0,(u.energy||100)-5);c.reply(`⚔️ ${n.toUpperCase()}\n❤️ HP ${u.hp}/${u.maxHp} ${BAR(u.hp,u.maxHp)}\n⚡ Energy ${u.energy}/${u.maxEnergy} ${BAR(u.energy,u.maxEnergy)}\n${REWARD(c,75,25000,["⚔️ Combat Token","🛡️ Battle Shard","🎁 Combat Chest"])}`)};

add("craft",c=>{let u=U(c.uid),item=N(c.args[0])||"iron_sword",cost=10000;if(u.cash<cost)return c.reply("❌ Need $10K.");u.cash-=cost;D(u,item);c.reply(`🔨 CRAFTED\n🧱 ${item}\n💰 -${money(cost)}\n✨ Craft successful!`)});
add("recipe|recipes",c=>c.reply(`📜 RECIPES\n${["⚔️ Iron Sword — 2 Iron + 1 Wood","🛡️ Iron Armor — 4 Iron + 2 Leather","⛏️ Steel Pickaxe — 5 Steel + 2 Wood","🧪 Health Potion — 2 Herb + 1 Crystal","🍖 Cooked Meat — 2 Meat + 1 Herb","🏹 Hunter Bow — 3 Wood + 2 Fiber","🪄 Mana Crystal — 3 Crystal","💎 Gem Ring — 2 Gem + 1 Gold","🐾 Pet Charm — 1 Gem + 2 Fur","🔥 Fire Blade — 3 Ember + 2 Steel"].join("\n")}`));
add("craft_weapon|craft_armor|craft_tool|craft_potion|craft_food|craft_pet_item",c=>{let n=N(c.event.body.split(/\s+/)[0].slice(1));let u=U(c.uid);D(u,n.replace("craft_",""));c.reply(`🔨 ${n.toUpperCase()}\n✅ Item crafted successfully.\n${REWARD(c,75,20000,["🧱 Material","💎 Craft Gem","🎁 Craft Box"])}`)});
add("materials",c=>{let u=U(c.uid);c.reply(`🧱 MATERIALS\n${Object.entries(u.materials).map(([k,v])=>`• ${k}: ${v}`).join("\n")||"No materials yet."}`)});
add("gather",c=>{let u=U(c.uid),a=["Wood","Stone","Iron","Fiber","Herb","Crystal"];let x=a[Math.floor(Math.random()*a.length)];M(u,x,Math.floor(Math.random()*5)+1);c.reply(`🌿 GATHERED ${x}\n📦 Material added.`)});
add("workbench",c=>c.reply("🔨 WORKBENCH\n⚙️ Crafting station ready.\n💡 !recipe to view recipes."));
add("upgrade_item|repair|dismantle|enchant|socket|gem|craft_queue",c=>{let u=U(c.uid),n=N(c.event.body.split(/\s+/)[0].slice(1));c.reply(`⚙️ ${n.toUpperCase()}\n✅ Operation completed.\n${REWARD(c,100,30000,["🔧 Upgrade Part","💎 Enhancement Gem","🎁 Gear Box"])}`)});

add("mine",c=>{let u=U(c.uid),ore=["Coal","Iron","Gold","Diamond","Ruby","Emerald","Sapphire","Obsidian","Mythril","Void Ore"][Math.floor(Math.random()*10)];let q=Math.floor(Math.random()*5)+1;u.ore.push(ore);M(u,ore,q);c.reply(`⛏️ MINING SUCCESS\n🪨 ${ore} x${q}\n⛏️ Pickaxe Lv.${u.pickaxe||1}\n${REWARD(c,100,35000,["⛏️ Ore Token","💎 Mining Gem","🎁 Ore Chest"])}`)});
add("mine_enter|mine_exit|dig|excavate|ore|prospect|ore_scan|pickaxe|buy_pickaxe|upgrade_pickaxe|minecart|gem_shop",c=>{let u=U(c.uid),n=N(c.event.body.split(/\s+/)[0].slice(1));if(["buy_pickaxe","upgrade_pickaxe"].includes(n))u.pickaxe=(u.pickaxe||0)+1;c.reply(`⛏️ ${n.toUpperCase()}\n🪨 Mine system active.\n⛏️ Pickaxe Lv.${u.pickaxe||1}`)});
add("dynamite",c=>{let u=U(c.uid),q=Math.floor(Math.random()*10)+1;M(u,"Rare Ore",q);c.reply(`💥 DYNAMITE BLAST!\n💎 Rare Ore x${q}\n${REWARD(c,125,60000,["💣 Dynamite Core","💎 Rare Gem","🎁 Blast Chest"])}`)});
add("refine_ore|smelt|forge|blacksmith",c=>{let u=U(c.uid);D(u,"🔥 Refined Metal");c.reply(`🔥 FORGE COMPLETE\n⚙️ Refined Metal added.\n${REWARD(c,100,40000,["🔥 Forge Core","⚙️ Steel Part","💎 Forge Gem"])}`)});

add("attack",c=>action(c,"attack"));
add("skill",c=>action(c,"skill"));
add("ultimate",c=>action(c,"ultimate"));
add("damage",c=>action(c,"damage"));
add("critical",c=>action(c,"critical"));
add("status_effect|equipment|armor|weapon_stats|combat_log",c=>{let u=U(c.uid);c.reply(`⚔️ COMBAT STATUS\n❤️ ${u.hp}/${u.maxHp} ${BAR(u.hp,u.maxHp)}\n⚡ ${u.energy}/${u.maxEnergy} ${BAR(u.energy,u.maxEnergy)}\n🗡️ Weapon: ${u.equipment.weapon||"Basic"}\n🛡️ Armor: ${u.equipment.armor||"Basic"}`)});
add("combat_skills|combat_stats",c=>c.reply(`⚔️ COMBAT SKILLS\n${["⚔️ Slash","🔥 Fire Strike","❄️ Ice Blast","☠️ Poison Fang","⚡ Thunder Hit","🛡️ Shield Wall","💚 Recovery","💥 Critical Strike","🌌 Void Beam","👑 Ultimate"].map((x,i)=>`${i+1}. ${x}`).join("\n")}`));
add("defend|heal|flee",c=>{let u=U(c.uid),n=N(c.event.body.split(/\s+/)[0].slice(1));if(n==="heal")u.hp=Math.min(u.maxHp,u.hp+40);if(n==="flee")return c.reply("🏃 You escaped the battle.");c.reply(`🛡️ ${n.toUpperCase()}\n❤️ HP ${u.hp}/${u.maxHp} ${BAR(u.hp,u.maxHp)}`)});

add("bossfight",c=>{if(!reqMention(c))return;let t=target(c);let u=U(c.uid),v=U(t);let skill=["⚔️ Slash","🔥 Fire Blast","☠️ Poison Strike","⚡ Thunder Skill","💥 Ultimate"][Math.floor(Math.random()*5)];let dmg=Math.floor(Math.random()*40)+20;v.hp=Math.max(1,v.hp-dmg);c.reply(`👹 BOSSFIGHT\n🎯 Target: ${t}\n🧠 Pet Skill: ${skill}\n💥 Damage: ${dmg}\n❤️ Target HP: ${v.hp}/${v.maxHp}\n${REWARD(c,200,100000,["👹 Boss Core","💎 Boss Gem","🎁 Boss Chest"])}`)});
add("boss_spawn|boss_ability|boss_spectate|kaiju_rage|cyborg_overlord|dragon_nest|boss_history",c=>c.reply(`👹 BOSS SYSTEM\n🔥 ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()}\n⚔️ Legendary encounter ready.`));

add("arena",c=>{if(!reqMention(c))return;let t=target(c);c.reply(`🏟️ ARENA MATCH\n⚔️ Challenger: ${c.uid}\n🎯 Opponent: ${t}\n🧠 Pet skills enabled!\n🔥 Match started.`)});
add("pvp_queue|pvp_match|pvp_rank|pvp_wager|pvp_loadout|arena_hazard|gladiator_oath",c=>{if(!reqMention(c))return;let t=target(c);c.reply(`⚔️ PVP\n🎯 Opponent: ${t}\n🧠 Pet skills enabled\n🔥 ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()} activated.`)});
add("pvp",c=>{if(!reqMention(c))return;let t=target(c),u=U(c.uid),v=U(t),skills=["🔥 Fire Blast","⚡ Thunder Claw","☠️ Venom Strike","🛡️ Guard","💚 Heal","💥 Critical"];let s=skills[Math.floor(Math.random()*skills.length)],d=Math.floor(Math.random()*35)+15;v.hp=Math.max(1,v.hp-d);c.reply(`⚔️ PVP PET BATTLE\n👤 ${c.uid} VS ${t}\n🧠 Skill: ${s}\n💥 Damage: ${d}\n❤️ Opponent HP: ${v.hp}/${v.maxHp}`)});

add("dungeon",c=>{if(!reqMention(c))return;let t=target(c);c.reply(`🏰 DUNGEON\n👥 Party target: ${t}\n🧠 Pet skills enabled\n👹 Dungeon enemies spawned.\n${REWARD(c,250,125000,["🏰 Dungeon Key","💎 Dungeon Gem","🎁 Dungeon Chest"])}`)});
add("dungeon_enter|dungeon_clear|dungeon_status|dungeon_boss|dungeon_leave|dungeon_modify|dungeon_lb",c=>c.reply(`🏰 DUNGEON SYSTEM\n⚔️ ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()}\n🗝️ Dungeon ready.`));

add("raid",c=>{if(!reqMention(c))return;let t=target(c);c.reply(`🐉 RAID\n👥 Raid partner: ${t}\n🧠 Pet skills enabled\n🔥 Raid battle launched!\n${REWARD(c,300,150000,["🐉 Raid Core","💎 Raid Gem","🎁 Raid Chest"])}`)});
add("raid_party|raid_attack|raid_status|raid_loot|raid_cooldown|raid_bunker|raid_hq|coop_quest|coop_trade",c=>{if(!reqMention(c))return;let t=target(c);c.reply(`🤝 CO-OP RAID\n🎯 Partner: ${t}\n⚔️ ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()}\n🔥 Team action complete.`)});
add("co",c=>{if(!reqMention(c))return;let t=target(c);c.reply(`🤝 CO-OP PET BATTLE\n👤 ${c.uid} + ${t}\n🧠 Pet skills enabled\n⚔️ Team-up battle started!\n${REWARD(c,200,100000,["🤝 Co-op Token","💎 Team Gem","🎁 Co-op Chest"])}`)});

add("explore|travel|map|location|discover|camp|rest|forage|ruins|cave|island|ocean|village|city|landmark|treasure|lost_temple|secret_area|random_event|encounter|explorer_rank",c=>{let u=U(c.uid);u.energy=Math.min(u.maxEnergy,u.energy+10);c.reply(`🧭 EXPLORATION\n📍 ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()}\n⚡ Energy ${u.energy}/${u.maxEnergy}\n${REWARD(c,100,50000,["🧭 Explorer Token","💎 Discovery Gem","🎁 Explorer Chest"])}`)});

add("use",c=>{let u=U(c.uid),i=N(c.args[0]);if(!i)return c.reply("💡 !use <item>");if(!u.inventory[i])return c.reply("❌ Item not found.");u.inventory[i]--;c.reply(`🧪 Used ${i}.`)});
add("drop",c=>{let u=U(c.uid),i=N(c.args[0]),q=Math.max(1,num(c.args[1])||1);if(!u.inventory[i])return c.reply("❌ Item not found.");u.inventory[i]=Math.max(0,u.inventory[i]-q);c.reply(`🗑️ Dropped ${i} x${q}.`)});
add("sort",c=>c.reply("📦 Inventory sorted."));
add("search",c=>c.reply(`🔎 Inventory search\n💡 Use !inv or !item_info <item>.`));
add("stash",c=>c.reply("📦 Items moved to stash."));
add("unstash",c=>c.reply("📦 Items returned from stash."));
add("item_info|item_value|item_history",c=>{let i=N(c.args[0])||"unknown";c.reply(`📦 ITEM INFO\n🏷️ ${i}\n💰 Value: $10,000\n⭐ Rarity: Rare\n🔧 Usable: YES`)});

add("loot|lootbox|chest|open_chest|rare_drop|treasure_map|treasure_hunt|relic|artifact",c=>{let u=U(c.uid),items=["💎 Diamond","👑 Ancient Crown","⚔️ Legendary Blade","🛡️ Dragon Shield","🪙 Ancient Coin","🔮 Mystic Crystal","🐉 Dragon Scale","🌌 Void Fragment","💠 Cosmic Gem","🎁 Mystery Chest"];let i=items[Math.floor(Math.random()*items.length)];D(u,i);c.reply(`🎁 LOOT FOUND!\n${i}\n${REWARD(c,125,75000,["💎 Loot Gem","🗝️ Treasure Key","🎁 Rare Chest"])}`)});
add("drop_rate",c=>c.reply(`🎲 DROP RATES\n${["Common 50%","Uncommon 25%","Rare 15%","Epic 7%","Legendary 2.5%","Mythic 0.5%"].join("\n")}`));

const MIS=["First Steps","Lost Relic","Goblin Hunt","Mine Expedition","Dragon Hunt","Village Rescue","Ancient Ruins","Treasure Run","Forest Guardian","Cave Mystery","Bandit Camp","Royal Escort","Sea Voyage","Volcano Quest","Crystal Search","Demon Gate","Sky Temple","Void Portal","Titan Battle","Final Legend"];
MIS.forEach((x,i)=>add(`mission_${i+1}`,c=>{let u=U(c.uid);u.missions.push(i+1);c.reply(`📜 MISSION ${i+1}/20\n🎯 ${x}\n✅ Mission accomplished!\n⭐ Level progress +100 XP\n${REWARD(c,100,75000,["🎁 Mission Item","💎 Mission Gem","🪙 Mission Token"])}`)}));
add("mission|missions|mission_accept|mission_complete|mission_cancel|mission_reward|mission_history|contract|contract_accept|contract_complete",c=>{let u=U(c.uid);if(N(c.event.body).includes("complete")||N(c.event.body).startsWith("!mission ")){u.missions.push(Date.now());return c.reply(`📜 MISSION COMPLETE!\n${REWARD(c,150,75000,["🎁 Mission Reward","💎 Mission Gem","🪙 Mission Token"])}`)}c.reply(`📜 MISSIONS\n${MIS.map((x,i)=>`${i+1}. ${x}`).join("\n")}`)});

add("guild",c=>c.reply(`🏰 GUILD\n👤 ${c.uid}\n🏷️ Guild: ${U(c.uid).guild||"None"}\n💡 !guild_create <name>`));
add("guild_create",c=>{let u=U(c.uid);u.guild=c.args.join(" ")||"Klerk Guild";c.reply(`🏰 Guild created: ${u.guild}`)});
add("guild_join|guild_leave|guild_invite|guild_kick|guild_rank|guild_upgrade|guild_bank|guild_shop|guild_quest|guild_war|guild_lb",c=>{let u=U(c.uid);if(!u.guild)return c.reply("❌ Join/create a guild first.");c.reply(`🏰 GUILD ACTION\n⚔️ ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()}\n🏷️ ${u.guild}\n${REWARD(c,100,50000,["🏰 Guild Token","💎 Guild Gem","🎁 Guild Chest"])}`)});

add("survival_wave|merc_agency|medevac",c=>{let u=U(c.uid);u.hp=Math.min(u.maxHp,u.hp+25);c.reply(`🛡️ SURVIVAL\n🔥 ${N(c.event.body.split(/\s+/)[0].slice(1)).replace(/_/g," ").toUpperCase()}\n❤️ HP ${u.hp}/${u.maxHp}\n${REWARD(c,125,60000,["🩺 Survival Kit","🛡️ Survival Token","🎁 Survival Chest"])}`)});

module.exports=Object.values(C);
