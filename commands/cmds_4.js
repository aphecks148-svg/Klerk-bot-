// commands/cmds_4.js
const C="cmds_4";
const c=(name,aliases,description,usage,hint,execute,permission="everyone",cooldown=0)=>({name,aliases,category:C,description,usage,hint,permission,cooldown,execute});
const r=(reply,msg)=>reply(`⚔️ WARFORGE\n━━━━━━━━━━━━━━━━\n${msg}\n━━━━━━━━━━━━━━━━\n🔥 FIGHT. SURVIVE. DOMINATE.`);
const E=(title,msg)=>async({reply,args})=>r(reply,`${title}\n${msg.replace(/\{a\}/g,args.join(" ")||"Target")}`);

module.exports=[
c("bossfight",["boss"],"Fight active boss","!bossfight","Requires active boss",E("👹 BOSS FIGHT","🔥 Boss encounter loaded!\n⚔️ Use !attack, !defend, !skill or !ultimate.")),
c("boss_spawn",["spawnboss"],"Spawn game boss","!boss_spawn","Event/admin boss system",E("👹 BOSS SPAWN","🌋 A boss has appeared!\n⚔️ Players can challenge the encounter.")),
c("boss_ability",["bossability"],"View boss abilities","!boss_ability","Shows current boss skills",E("💀 BOSS ABILITIES","🔥 Inferno Blast\n🌪️ Storm Crash\n☠️ Doom Strike\n🛡️ Regeneration")),
c("boss_spectate",["bossspectate"],"Watch boss battle","!boss_spectate","Spectator mode",E("👀 BOSS SPECTATE","🍿 Watching: {a}\n⚔️ Combat feed enabled.")),
c("kaiju_rage",["kaiju"],"Activate Kaiju event","!kaiju_rage","Rare boss event",E("🦖 KAIJU RAGE","🌋 Massive beast detected!\n🔥 City event activated.")),
c("cyborg_overlord",["cyborg"],"Fight Cyborg Overlord","!cyborg_overlord","Endgame boss",E("🤖 CYBORG OVERLORD","⚡ Target locked.\n🛡️ Armor integrity online.\n⚔️ Assemble your squad.")),
c("dragon_nest",["dragonnest"],"Enter dragon nest","!dragon_nest","High-risk dungeon",E("🐉 DRAGON NEST","🔥 Ancient nest discovered!\n💎 Rare loot detected.\n⚔️ Enter at your own risk.")),
c("boss_history",["bosshistory"],"View boss history","!boss_history","Past bosses",E("📜 BOSS HISTORY","👹 Recent encounters loaded.\n🏆 Victories and damage rankings available.")),
c("arena",["arenamode"],"Enter arena","!arena","PvP arena",E("🏟️ WARFORGE ARENA","⚔️ Queue opened!\n🔥 Choose your loadout and prepare for battle.")),
c("pvp_queue",["queue"],"Join PvP queue","!pvp_queue","Matchmaking",E("⚔️ PVP QUEUE","🔎 Searching for opponent...\n⏳ Matchmaking started.")),
c("pvp_match",["pvp"],"Start PvP match","!pvp_match @user","Mention/reply target",E("⚔️ PVP CHALLENGE","🎯 Target: {a}\n⏳ Challenge request sent.\n✅ Target must ACCEPT.")),
c("pvp_rank",["pvprank"],"View PvP rank","!pvp_rank","Competitive rating",E("🏆 PVP RANK","⭐ Rating loaded.\n⚔️ Wins/Losses tracked.\n🔥 Keep climbing.")),
c("pvp_wager",["pvpbet"],"Wager on PvP battle","!pvp_wager @user 100000","Explicit amount required",async({reply,args})=>r(reply,`💰 PVP WAGER\n🎯 Target: ${args[0]||"target"}\n💵 Stake: ${args[1]||"amount"}\n⚠️ Both players must satisfy wager rules.`)),
c("pvp_loadout",["loadout"],"Manage PvP loadout","!pvp_loadout","Choose battle equipment",E("🎒 PVP LOADOUT","⚔️ Weapon\n🛡️ Armor\n💎 Artifact\n✨ Skill set\n🔥 Loadout saved by combat engine.")),
c("arena_hazard",["hazard"],"View arena hazards","!arena_hazard","Battlefield effects",E("🌋 ARENA HAZARDS","🔥 Lava Zone\n⚡ Lightning Field\n❄️ Frost Floor\n🌪️ Storm Wind")),
c("gladiator_oath",["gladiator"],"Take gladiator oath","!gladiator_oath","Arena progression",E("🏛️ GLADIATOR OATH","⚔️ Your oath is recorded.\n🔥 Arena reputation increased.")),
c("dungeon",["dungeons"],"View dungeons","!dungeon","Browse dungeon worlds",E("🏰 DUNGEONS","🌲 Shadow Forest\n🔥 Inferno Cavern\n❄️ Frost Citadel\n🌑 Void Temple\n🐉 Dragon Nest")),
c("dungeon_enter",["enter"],"Enter dungeon","!dungeon_enter Shadow","Requires level/energy",E("🚪 DUNGEON ENTRY","🏰 {a}\n⚔️ Party preparation started.")),
c("dungeon_clear",["clear"],"Clear dungeon","!dungeon_clear","Requires active dungeon",E("🏆 DUNGEON CLEAR","🔥 Dungeon completion recorded.\n💰 XP + loot awarded by dungeon engine.")),
c("dungeon_status",["dungeoninfo"],"Dungeon status","!dungeon_status","View current run",E("📊 DUNGEON STATUS","🏰 Active run: {a}\n❤️ HP and progress loaded.\n🎁 Loot remains locked until completion.")),
c("dungeon_boss",["dboss"],"Fight dungeon boss","!dungeon_boss","Final dungeon stage",E("👹 DUNGEON BOSS","🔥 Final guardian detected!\n⚔️ Combat phase activated.")),
c("dungeon_leave",["leave"],"Leave dungeon","!dungeon_leave","Exit current run",E("🚪 DUNGEON EXIT","🏃 You left the dungeon.\n⚠️ Unclaimed loot may be lost.")),
c("dungeon_modify",["modifydungeon"],"Modify dungeon difficulty","!dungeon_modify hard","Difficulty system",E("⚙️ DUNGEON SETTINGS","🎚️ Difficulty: {a}\n🔥 Rewards and enemy power scale together.")),
c("dungeon_lb",["dungeonlb"],"Dungeon leaderboard","!dungeon_lb","Fastest clears",E("🏆 DUNGEON LEADERBOARD","🥇 Speed Runner\n🥈 Boss Slayer\n🥉 Void Walker\n📊 Rankings loaded.")),
c("raid",["raids"],"View raids","!raid","Large-scale combat",E("⚔️ RAID SYSTEM","🐉 Dragon Raid\n🤖 Cyborg Raid\n🌑 Void Raid\n🔥 World Boss Raid")),
c("raid_party",["raidparty"],"Create raid party","!raid_party","Group combat",E("👥 RAID PARTY","⚔️ Party created!\n👤 Invite players with !partyinvite.")),
c("raid_attack",["raidattack"],"Attack raid boss","!raid_attack","Requires active raid",E("💥 RAID ATTACK","⚔️ Your squad strikes!\n🔥 Raid damage calculated.")),
c("raid_status",["raidstatus"],"View raid status","!raid_status","Boss HP + party",E("📊 RAID STATUS","👹 Boss HP: 72%\n👥 Players: 4\n🔥 Team damage: 28%")),
c("raid_loot",["raidloot"],"Claim raid loot","!raid_loot","Requires eligible victory",E("🎁 RAID LOOT","💎 Rare items detected!\n💰 Coins • XP • gear distributed by loot engine.")),
c("raid_cooldown",["raidcd"],"View raid cooldown","!raid_cooldown","Check remaining time",E("⏳ RAID COOLDOWN","🔥 Raid recovery timer checked.\n⚔️ Prepare your loadout while waiting.")),
c("raid_bunker",["bunker"],"Access raid bunker","!raid_bunker","Requires raid unlock",E("🏚️ RAID BUNKER","🛡️ Defense systems online.\n📦 Supplies and raid equipment available.")),
c("raid_hq",["raidhq"],"Open raid headquarters","!raid_hq","Raid management",E("🏰 RAID HQ","👥 Parties\n⚔️ Raids\n🏆 Rankings\n📦 Loot\n⚙️ Configuration")),
c("coop_quest",["coopquest"],"Start co-op quest","!coop_quest","Requires teammate",E("🤝 CO-OP QUEST","👥 Team mission created!\n🎯 Complete objectives together for shared rewards.")),
c("coop_trade",["cooptrade"],"Trade during co-op","!coop_trade @user","Target required",E("🔄 CO-OP TRADE","👤 Target: {a}\n📦 Trade request created.\n⏳ Target must ACCEPT.")),
c("combat_skills",["combatskills"],"View combat skills","!combat_skills","Battle abilities",E("✨ COMBAT SKILLS","⚔️ Slash\n🔥 Fireball\n🛡️ Guard\n💨 Dash\n💥 Meteor Strike")),
c("combat_stats",["combatstats"],"View combat stats","!combat_stats","Combat profile",E("📊 COMBAT STATS","❤️ HP\n⚔️ ATK\n🛡️ DEF\n💨 SPD\n🎯 CRIT\n🔥 POWER")),
c("survival_wave",["survival"],"Fight survival waves","!survival_wave","Endless combat",E("🌊 SURVIVAL MODE","👹 Wave 1 incoming!\n❤️ Keep your HP above zero.\n💰 Rewards increase per wave.")),
c("merc_agency",["mercs"],"Manage mercenaries","!merc_agency","Hire combat NPCs",E("💼 MERCENARY AGENCY","🗡️ Assault Merc\n🛡️ Guard Merc\n🎯 Sniper Merc\n💰 Hire costs calculated by combat engine.")),
c("medevac",["medic"],"Request battle medevac","!medevac","Emergency battle support",E("🚑 MEDEVAC","🚨 Emergency extraction requested!\n❤️ Recovery process started.\n⏳ Cooldown applies."))
];
