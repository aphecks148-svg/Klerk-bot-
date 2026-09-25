// commands/cmds_6.js
// ⚔️ BATTLECORE — iKON-BOT • 35 Commands
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=30)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.battle=u.battle||{power:100,defense:50,crit:5,dodge:5,rage:0,mana:100,maxMana:100,combo:0,wins:0,losses:0,bossKills:0,arenaWins:0,raid:0,dungeon:0,bounty:0,skills:{slash:1,shield:1,heal:1,fireball:0},equipment:{weapon:null,armor:null},energy:u.energy||100};
  u.inventory=u.inventory||{}; u.health=Math.min(u.maxHealth||100,Number(u.health||100)); u.maxHealth=u.maxHealth||100; u.energy=u.energy||100; u.maxEnergy=u.maxEnergy||100;
  u.level=u.level||1; u.xp=u.xp||0;
};
const rand=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()*100<p;
const dmg=(attacker,defender)=>{
  let base=Math.floor((attacker.battle?.power||100)*(0.8+Math.random()*0.6));
  let crit=chance(attacker.battle?.crit||5); if(crit) base=Math.floor(base*1.8);
  let dodge=chance(defender.battle?.dodge||5); if(dodge) return {dmg:0,crit:false,dodge:true};
  let def=Math.floor((defender.battle?.defense||50)*0.4); let final=Math.max(5,base-def);
  return {dmg:final,crit,dodge:false};
};

const BOSSES=[
  {name:"Goblin King",hp:500,power:40,reward:10000,xp:100},
  {name:"Orc Warlord",hp:1200,power:80,reward:25000,xp:250},
  {name:"Dragon Whelp",hp:3000,power:150,reward:75000,xp:600},
  {name:"Ancient Titan",hp:8000,power:300,reward:250000,xp:1500},
  {name:"Demon Lord",hp:20000,power:600,reward:1000000,xp:5000}
];

const cmds=[
{name:"stats",aliases:["stat"],description:"View battle stats",run:async()=>{
  ensure(user); let b=user.battle; replyx(`⚔️ ${user.name}'s BATTLE STATS
━━━━━━━━━━━━
⭐ Level: ${user.level} • XP: ${fmt(user.xp)}
❤️ HP: ${bar?bar(user.health,user.maxHealth,10):""} ${user.health}/${user.maxHealth}
⚡ Energy: ${bar?bar(user.energy,user.maxEnergy,10):""} ${user.energy}/${user.maxEnergy}
🔮 Mana: ${bar?bar(b.mana,b.maxMana,10):""} ${b.mana}/${b.maxMana}
⚔️ Power: ${fmt(b.power)} • 🛡️ Def: ${fmt(b.defense)}
💥 Crit: ${b.crit}% • 💨 Dodge: ${b.dodge}%
🔥 Rage: ${b.rage}% • Combo: ${b.combo}
🏆 Wins: ${b.wins} • 💀 Losses: ${b.losses}
👹 Boss Kills: ${b.bossKills}
${fun?fun():""}`)
}},

{name:"level",aliases:["lvl"],description:"Check level",run:async()=>{
  ensure(user); replyx(`⭐ ${user.name}\nLevel: ${user.level}\nXP: ${fmt(user.xp)}/${fmt(user.level*1000)}\nProgress: ${bar?bar(user.xp%1000,1000,10):""} ${Math.floor((user.xp%1000)/10)}%`)
}},

{name:"xp",aliases:["experience"],description:"XP info",run:async()=>{
  ensure(user); replyx(`⭐ XP: ${fmt(user.xp)}\nLevel: ${user.level}\nNext: ${fmt(user.level*1000 - user.xp%1000)} XP needed`)
}},

{name:"skills",aliases:["skilllist"],description:"View skills",run:async()=>{
  ensure(user); let s=user.battle.skills; replyx(`📚 SKILLS\n${Object.entries(s).map(([k,v])=>`• ${k} — Lv.${v}`).join("\n")}\n💡 Use!skilltree`)
}},

{name:"skilltree",aliases:["tree"],description:"Skill tree",run:async()=>{
  replyx(`🌳 SKILL TREE\nTier 1: slash, shield, heal (Lv.1)\nTier 2: fireball, lightning, berserk (Lv.10)\nTier 3: ultimate, shadowstrike, divineheal (Lv.25)\n💡!upgrade <skill>`)
}},

{name:"upgrade",aliases:["upgradeskill"],description:"Upgrade skill",run:async({args})=>{
  ensure(user); let sk=String(args[0]||"").toLowerCase(); if(!sk) return replyx("Usage:!upgrade <skill>"); if(money(user)<5000) return replyx("💸 Need $5,000");
  setMoney(user,money(user)-5000); user.battle.skills[sk]=(user.battle.skills[sk]||0)+1;
  if(sk==="slash") user.battle.power+=10; if(sk==="shield") user.battle.defense+=10; if(sk==="heal") user.maxHealth+=5;
  replyx(`⬆️ ${sk} → Lv.${user.battle.skills[sk]}\n⚔️ Power now ${user.battle.power}`)
}},

{name:"prestige",aliases:["pres"],description:"Prestige reset",run:async()=>{
  ensure(user); if(user.level<50) return replyx("🔒 Need Level 50 to prestige.");
  user.prestige=(user.prestige||0)+1; user.level=1; user.xp=0; user.battle.power+=50; user.battle.defense+=25;
  replyx(`🔥 PRESTIGE ${user.prestige}!\n⚔️ +50 Power • 🛡️ +25 Def\n⭐ Reset to Level 1 — stronger than ever!\n${fun?fun():""}`)
}},

{name:"rebirth",aliases:["rb"],description:"Rebirth system",run:async()=>{
  ensure(user); if((user.prestige||0)<2) return replyx("🔒 Need Prestige 2 for rebirth.");
  user.rebirth=(user.rebirth||0)+1; user.prestige=0; user.level=1; user.xp=0; user.maxHealth+=20; user.battle.power+=100;
  replyx(`♻️ REBIRTH ${user.rebirth}!\n❤️ +20 Max HP\n⚔️ +100 Power\n👑 You are reborn!`)
}},

{name:"battle",aliases:["fight"],description:"Quick battle vs bot",cooldown:15,run:async()=>{
  ensure(user); if((user.energy||100)<20) return replyx("⚡ Need 20 energy."); user.energy-=20;
  let enemy={name:rand(["Goblin","Orc","Bandit","Skeleton"]),health:100+user.level*10,maxHealth:100+user.level*10,power:30+user.level*2,battle:{defense:20+user.level,crit:3,dodge:3}};
  let log=[]; let uh=user.health||100; let eh=enemy.health;
  for(let i=0;i<6;i++){
    let a=dmg(user,enemy); if(!a.dodge){ eh-=a.dmg; log.push(`You hit ${a.dmg}${a.crit?" CRIT!":""}`); }else log.push(`${enemy.name} dodged!`);
    if(eh<=0) break;
    let b=dmg(enemy,user); if(!b.dodge){ uh-=b.dmg; log.push(`${enemy.name} hits ${b.dmg}`); }else log.push(`You dodged!`);
    if(uh<=0) break;
  }
  user.health=Math.max(0,uh);
  if(eh<=0){ let rew=2000+user.level*200; setMoney(user,money(user)+rew); xp(user,50); user.battle.wins++; user.battle.power+=1; replyx(`⚔️ BATTLE WON vs ${enemy.name}!\n${log.slice(-3).join("\n")}\n💰 +$${fmt(rew)} • ⭐ +50 XP`); }
  else if(uh<=0){ user.battle.losses++; replyx(`💀 DEFEATED by ${enemy.name}\n${log.slice(-3).join("\n")}\n💡!heal then try again`); }
  else replyx(`⚔️ BATTLE DRAW\n${log.join("\n")}\n❤️ You: ${Math.max(0,uh)} HP • 👹 Enemy: ${Math.max(0,eh)} HP`)
}},

{name:"attack",aliases:["atk"],description:"Attack player",cooldown:20,run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("⚔️ Tag someone to attack!");
  let other=users.get(target); if(!other) return replyx("❌ User not found."); ensure(user); ensure(other);
  if((user.energy||100)<25) return replyx("⚡ Need 25 energy."); user.energy-=25;
  let r=dmg(user,other); if(r.dodge) return replyx(`💨 ${other.name} dodged your attack!`);
  other.health=Math.max(0,(other.health||100)-r.dmg); user.battle.power+=0.5; other.battle.defense+=0.2;
  replyx(`⚔️ ATTACK!\n💥 You hit ${other.name} for ${r.dmg}${r.crit?" CRIT!":""}\n❤️ ${other.name} HP: ${other.health}/${other.maxHealth||100}\n${r.dmg>other.maxHealth*0.3?fun?fun():"":""}`)
}},

{name:"defend",aliases:["def","block"],description:"Defensive stance",run:async()=>{
  ensure(user); user.battle.defense+=5; user.battle.dodge=Math.min(40,(user.battle.dodge||5)+3); user.energy=Math.max(0,(user.energy||100)-10);
  replyx(`🛡️ DEFEND!\n🛡️ +5 Def (temp)\n💨 +3% Dodge\n⚡ -10 Energy`)
}},

{name:"ultimate",aliases:["ult"],description:"Use ultimate",cooldown:60,run:async()=>{
  ensure(user); if((user.battle.rage||0)<100) return replyx(`🔥 Need 100 Rage (have ${user.battle.rage}%). Build with!attack /!battle`);
  user.battle.rage=0; let dmgVal=Math.floor((user.battle.power||100)*2.5);
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(target){ let o=users.get(target); if(o){ o.health=Math.max(0,(o.health||100)-dmgVal); replyx(`💥 ULTIMATE on ${o.name}!\n🔥 ${dmgVal} DAMAGE!\n${fun?fun():""}`); return; } }
  let rew=dmgVal*10; setMoney(user,money(user)+rew); replyx(`💥 ULTIMATE unleashed!\n🔥 ${dmgVal} power!\n💰 +$${fmt(rew)} from shockwave!`)
}},

{name:"pvp",aliases:["duel"],description:"PvP duel",cooldown:30,run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("⚔️ Tag opponent for PvP!");
  let other=users.get(target); if(!other) return replyx("❌ User not found."); ensure(user); ensure(other);
  if((user.energy||100)<30||(other.energy||10)<10) return replyx("⚡ Both need energy.");
  user.energy-=30; other.energy=Math.max(0,(other.energy||100)-10);
  let up=user.battle.power+Math.random()*50, op=other.battle.power+Math.random()*50;
  if(up>=op){ user.battle.wins++; other.battle.losses++; let steal=Math.floor(money(other)*0.05); if(steal>0){ setMoney(other,money(other)-steal); setMoney(user,money(user)+steal); } replyx(`🏆 PVP WIN vs ${other.name}!\n⚔️ ${Math.floor(up)} vs ${Math.floor(op)}\n💰 Stole $${fmt(steal)}`); }
  else { user.battle.losses++; other.battle.wins++; replyx(`💀 PVP LOST vs ${other.name}\n⚔️ ${Math.floor(up)} vs ${Math.floor(op)}`); }
}},

{name:"arena",aliases:["arenafight"],description:"Arena battle",cooldown:40,run:async()=>{
  ensure(user); if((user.energy||100)<35) return replyx("⚡ Need 35 energy."); user.energy-=35;
  let enemyPower=100+Math.random()*user.battle.power; let win=(user.battle.power+Math.random()*80)>=enemyPower;
  if(win){ user.battle.arenaWins=(user.battle.arenaWins||0)+1; let rew=5000+user.battle.arenaWins*300; setMoney(user,money(user)+rew); xp(user,60); replyx(`🏟️ ARENA WIN!\nStreak: ${user.battle.arenaWins}\n💰 +$${fmt(rew)}`); }
  else replyx(`🏟️ ARENA LOST!\nEnemy Power: ${Math.floor(enemyPower)}`)
}},

{name:"dungeon",aliases:["dungeons"],description:"Enter dungeon",cooldown:60,run:async()=>{
  ensure(user); if((user.energy||100)<40) return replyx("⚡ Need 40 energy."); user.energy-=40;
  let floors=Math.floor(Math.random()*3)+1; let loot=floors*4000; setMoney(user,money(user)+loot); user.battle.dungeon=(user.battle.dungeon||0)+floors; xp(user,floors*30);
  replyx(`🏚️ DUNGEON CLEARED!\n🗺️ ${floors} floors\n💰 +$${fmt(loot)}\n⭐ +${floors*30} XP`)
}},

{name:"raid",aliases:["raids"],description:"Join a raid",cooldown:90,run:async()=>{
  ensure(user); if((user.energy||100)<50) return replyx("⚡ Need 50 energy."); user.energy-=50;
  let success=chance(60+user.battle.power/100); if(success){ let rew=Math.floor(Math.random()*20000)+10000; setMoney(user,money(user)+rew); user.battle.raid=(user.battle.raid||0)+1; xp(user,100); replyx(`⚔️ RAID SUCCESS!\n💰 +$${fmt(rew)}\n⭐ +100 XP\n${fun?fun():""}`); }else replyx("💀 RAID FAILED! The boss was too strong.");
}},

{name:"boss",aliases:["bosslist"],description:"List bosses",run:async()=>{
  replyx(`👹 BOSSES\n${BOSSES.map((b,i)=>`${i+1}. ${b.name} — HP ${fmt(b.hp)} — $${fmt(b.reward)}`).join("\n")}`)
}},

{name:"bossfight",aliases:["bfight"],description:"Fight a boss",cooldown:120,run:async()=>{
  ensure(user); let idx=Number(event.body.split(" ")[1])||1; let boss=BOSSES[idx-1]||BOSSES[0];
  if((user.energy||100)<50) return replyx("⚡ Need 50 energy."); user.energy-=50;
  let userDmg=user.battle.power*3+Math.random()*user.battle.power; let win=userDmg>=boss.hp*0.6;
  if(win){ setMoney(user,money(user)+boss.reward); xp(user,boss.xp); user.battle.bossKills++; user.battle.power+=5; replyx(`👹 BOSS DEFEATED: ${boss.name}!\n💰 +$${fmt(boss.reward)}\n⭐ +${boss.xp} XP\n⚔️ +5 Power\n${fun?fun():""}`); }
  else { user.health=Math.max(0,(user.health||100)-Math.floor(boss.power*0.5)); replyx(`💀 Failed vs ${boss.name}\n❤️ HP: ${user.health}\n💡 Upgrade power first!`); }
}},

{name:"adventure",aliases:["adv"],description:"Adventure mode",cooldown:45,run:async()=>{
  ensure(user); let loot=Math.floor(Math.random()*8000)+2000; setMoney(user,money(user)+loot); xp(user,40); user.battle.rage=Math.min(100,(user.battle.rage||0)+10);
  replyx(`🗺️ ADVENTURE!\n💰 Found $${fmt(loot)}\n⭐ +40 XP\n🔥 +10 Rage`)
}},

{name:"quest",aliases:["quests"],description:"Battle quest",run:async()=>{
  ensure(user); user.battle.quest=(user.battle.quest||0)+1; let rew=6000+user.battle.quest*500; setMoney(user,money(user)+rew); xp(user,35); replyx(`📜 QUEST #${user.battle.quest} DONE!\n💰 +$${fmt(rew)}\n⭐ +35 XP`)
}},

{name:"mission",aliases:["missions"],description:"Battle missions",run:async()=>{
  ensure(user); user.battle.mission=(user.battle.mission||0)+1; let rew=8000+user.battle.mission*700; setMoney(user,money(user)+rew); xp(user,45); replyx(`🎯 MISSION #${user.battle.mission} COMPLETE!\n💰 +$${fmt(rew)}\n⭐ +45 XP`)
}},

{name:"equipment",aliases:["equip","eq"],description:"View equipment",run:async()=>{
  ensure(user); let e=user.battle.equipment; replyx(`⚔️ EQUIPMENT\nWeapon: ${e.weapon||"None"}\nArmor: ${e.armor||"None"}\nPower: ${fmt(user.battle.power)}\nDef: ${fmt(user.battle.defense)}`)
}},

{name:"loadout",aliases:["loadouts"],description:"Loadouts",run:async()=>{
  ensure(user); replyx(`🎒 LOADOUT\nWeapon: ${user.battle.equipment.weapon||"Fists"}\nArmor: ${user.battle.equipment.armor||"Clothes"}\n💡!use <weapon> to equip`)
}},

{name:"power",aliases:["battlepower"],description:"Battle power",run:async()=>{
  ensure(user); replyx(`⚔️ Power: ${fmt(user.battle.power)}\n🔥 With crit: ${fmt(Math.floor(user.battle.power*1.8))} (if crit)`)
}},

{name:"combat",aliases:["combatlog"],description:"Combat history",run:async()=>{
  ensure(user); let b=user.battle; replyx(`📜 COMBAT LOG\nWins: ${b.wins} • Losses: ${b.losses}\nBoss: ${b.bossKills} • Arena: ${b.arenaWins||0}\nRaid: ${b.raid||0} • Dungeon: ${b.dungeon||0}`)
}},

{name:"heal",aliases:["healing","regain"],description:"Heal yourself",run:async()=>{
  ensure(user); if((user.inventory.healing_potion||0)<1 && money(user)<1000) return replyx("🧪 Need Healing Potion or $1,000");
  if((user.inventory.healing_potion||0)>=1) user.inventory.healing_potion--; else setMoney(user,money(user)-1000);
  user.health=user.maxHealth||100; replyx(`❤️ HEALED!\nHP: ${user.health}/${user.maxHealth}\n${fun?fun():""}`)
}},

{name:"energy",aliases:["eng"],description:"Energy status",run:async()=>{
  ensure(user); replyx(`⚡ Energy: ${bar?bar(user.energy,user.maxEnergy,10):""} ${user.energy}/${user.maxEnergy}\n💡 Regens over time or!camp`)
}},

{name:"defense",aliases:["defstat"],description:"Defense stat",run:async()=>{
  ensure(user); replyx(`🛡️ Defense: ${fmt(user.battle.defense)}\nReduces damage by ~40% of defense value`)
}},

{name:"dodge",aliases:["dodgechance"],description:"Dodge chance",run:async()=>{
  ensure(user); replyx(`💨 Dodge: ${user.battle.dodge}%\nChance to avoid damage completely`)
}},

{name:"critical",aliases:["crit"],description:"Crit chance",run:async()=>{
  ensure(user); replyx(`💥 Crit: ${user.battle.crit}%\n1.8x damage on crit`)
}},

{name:"combo",aliases:["combocount"],description:"Combo meter",run:async()=>{
  ensure(user); replyx(`🔥 Combo: ${user.battle.combo}\nBuild combo with consecutive attacks!`)
}},

{name:"rage",aliases:["ragemeter"],description:"Rage meter",run:async()=>{
  ensure(user); replyx(`🔥 Rage: ${bar?bar(user.battle.rage,100,10):""} ${user.battle.rage}%\n💡 100% =!ultimate`)
}},

{name:"mana",aliases:["manastatus"],description:"Mana status",run:async()=>{
  ensure(user); replyx(`🔮 Mana: ${bar?bar(user.battle.mana,user.battle.maxMana,10):""} ${user.battle.mana}/${user.battle.maxMana}`)
}},

{name:"armor",aliases:["armorstat"],description:"Armor details",run:async()=>{
  ensure(user); replyx(`🛡️ Armor: ${user.battle.equipment.armor||"None"}\nDefense: ${fmt(user.battle.defense)}`)
}},

{name:"weaponrank",aliases:["wrank"],description:"Weapon rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,p:u.battle?.power||0})).sort((a,b)=>b.p-a.p).slice(0,10);
  replyx(`⚔️ WEAPON RANK (Power)\n${list.map((x,i)=>`${i+1}. ${x.name} — ${fmt(x.p)}`).join("\n")}`)
}},

{name:"bossrank",aliases:["brank"],description:"Boss kill rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,k:u.battle?.bossKills||0})).sort((a,b)=>b.k-a.k).slice(0,10);
  replyx(`👹 BOSS RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — ${x.k} kills`).join("\n")}`)
}},

{name:"raidrank",aliases:["rrank"],description:"Raid rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,r:u.battle?.raid||0})).sort((a,b)=>b.r-a.r).slice(0,10);
  replyx(`⚔️ RAID RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — ${x.r} raids`).join("\n")}`)
}},

{name:"arenaRank",aliases:["arenarank"],description:"Arena rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,a:u.battle?.arenaWins||0})).sort((a,b)=>b.a-a.a).slice(0,10);
  replyx(`🏟️ ARENA RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — ${x.a} wins`).join("\n")}`)
}},

{name:"battlepass",aliases:["bpass"],description:"Battle pass progress",run:async()=>{
  ensure(user); let b=user.battle; let prog=(b.wins||0)+(b.bossKills||0)*2+(b.arenaWins||0); let tier=Math.floor(prog/10)+1;
  replyx(`🎫 BATTLE PASS\nTier: ${tier}\nProgress: ${prog} pts\nWins: ${b.wins} • Boss: ${b.bossKills} • Arena: ${b.arenaWins||0}\n💡 Rewards at every 10 pts!`)
}},

{name:"bountyxp",aliases:["bxp"],description:"Bounty XP",run:async()=>{
  ensure(user); replyx(`💀 Bounty: $${fmt(user.battle.bounty||0)}\nXP: ${fmt(user.xp)}\n💡 Win PvP to increase bounty!`)
}}
];
return cmds;
};
