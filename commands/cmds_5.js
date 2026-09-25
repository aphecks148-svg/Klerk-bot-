// commands/cmds_5.js
// ⛏️ FRONTIER — iKON-BOT • Mining / Fishing / Hunting
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=20)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.frontier=u.frontier||{miningLevel:1,miningXp:0,fishingLevel:1,fishingXp:0,huntingLevel:1,huntingXp:0,ores:{},fish:{},animals:{},totalMined:0,totalFished:0,totalHunted:0};
  u.inventory=u.inventory||{}; u.farm=u.farm||{fertilizer:0};
  u.stats=u.stats||{};
};
const ORES={
  stone:{name:"Stone",price:50,rarity:"Common",xp:5,power:10},
  coal:{name:"Coal",price:120,rarity:"Common",xp:8,power:15},
  iron:{name:"Iron Ore",price:400,rarity:"Common",xp:15,power:30},
  copper:{name:"Copper",price:350,rarity:"Common",xp:12,power:25},
  silver:{name:"Silver",price:900,rarity:"Uncommon",xp:25,power:50},
  gold:{name:"Gold Ore",price:1800,rarity:"Rare",xp:40,power:80},
  emerald:{name:"Emerald",price:5000,rarity:"Epic",xp:80,power:150},
  diamond:{name:"Diamond",price:12000,rarity:"Epic",xp:120,power:250},
  ruby:{name:"Ruby",price:10000,rarity:"Epic",xp:100,power:220},
  mythril:{name:"Mythril",price:50000,rarity:"Legendary",xp:300,power:500},
  adamantite:{name:"Adamantite",price:150000,rarity:"Mythic",xp:600,power:1000}
};
const FISH={
  minnow:{name:"Minnow",price:80,rarity:"Common",xp:5},
  bass:{name:"Bass",price:250,rarity:"Common",xp:10},
  trout:{name:"Trout",price:400,rarity:"Common",xp:12},
  salmon:{name:"Salmon",price:800,rarity:"Uncommon",xp:20},
  tuna:{name:"Tuna",price:1500,rarity:"Uncommon",xp:30},
  shark:{name:"Shark",price:5000,rarity:"Rare",xp:70},
  kraken:{name:"Kraken",price:25000,rarity:"Legendary",xp:250},
  leviathan:{name:"Leviathan",price:100000,rarity:"Mythic",xp:600}
};
const ANIMALS={
  rabbit:{name:"Rabbit",price:150,rarity:"Common",xp:8},
  deer:{name:"Deer",price:600,rarity:"Common",xp:15},
  wolf:{name:"Wolf",price:1200,rarity:"Uncommon",xp:25},
  bear:{name:"Bear",price:3500,rarity:"Rare",xp:60},
  boar:{name:"Boar",price:2000,rarity:"Uncommon",xp:35},
  lion:{name:"Lion",price:8000,rarity:"Epic",xp:120},
  dragon:{name:"Forest Dragon",price:75000,rarity:"Mythic",xp:500}
};
const rand=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()*100<p;

const cmds=[
{name:"mine",aliases:["mining"],description:"Mine for ores",cooldown:15,run:async()=>{
  ensure(user); let u=user.frontier; let roll=Math.random()*100+u.miningLevel*2;
  let oreKey=roll>99?"adamantite":roll>96?"mythril":roll>90?"diamond":roll>84?"ruby":roll>76?"emerald":roll>65?"gold":roll>50?"silver":roll>35?"iron":roll>20?"copper":roll>10?"coal":"stone";
  let ore=ORES[oreKey]; let amt=1+(oreKey==="stone"||oreKey==="coal"?Math.floor(Math.random()*3):0);
  u.ores[oreKey]=(u.ores[oreKey]||0)+amt; user.inventory[oreKey]=(user.inventory[oreKey]||0)+amt;
  u.miningXp+=ore.xp; u.totalMined+=amt; if(u.miningXp>=u.miningLevel*150){u.miningXp-=u.miningLevel*150; u.miningLevel++;}
  xp(user,ore.xp);
  replyx(`⛏️ MINED!\n💎 ${ore.name} ×${amt} [${ore.rarity}]\n⭐ +${ore.xp} Mining XP • Lv.${u.miningLevel}\n${bar?bar(u.miningXp,u.miningLevel*150,8):""} ${u.miningXp}/${u.miningLevel*150}\n${fun?fun():""}`)
}},

{name:"ores",aliases:["orelist"],description:"List all ores",run:async()=>{
  replyx(`⛏️ ORES\n${Object.values(ORES).map(o=>`• ${o.name} — $${fmt(o.price)} [${o.rarity}]`).join("\n")}`)
}},

{name:"oreinfo",aliases:["ore"],description:"Ore details",run:async({args})=>{
  let k=String(args[0]||"").toLowerCase(); let o=ORES[k]||Object.values(ORES).find(x=>x.name.toLowerCase()===k);
  if(!o) return replyx("❌ Ore not found."); replyx(`⛏️ ${o.name}\nRarity: ${o.rarity}\nPrice: $${fmt(o.price)}\nXP: ${o.xp}\nPower: ${o.power}`)
}},

{name:"dig",aliases:["excavate"],description:"Dig deeper",run:async()=>{
  ensure(user); let u=user.frontier; if((user.energy||100)<15) return replyx("⚡ Need 15 energy.");
  user.energy=(user.energy||100)-15; let gain=Math.floor(Math.random()*800)+200; setMoney(user,money(user)+gain); u.totalMined++;
  replyx(`🕳️ DUG!\n💰 Found $${fmt(gain)} in dirt!\n⚡ -15 Energy`)
}},

{name:"excavate",aliases:["deepmine"],description:"Excavate rare area",run:async()=>{
  ensure(user); if((user.energy||100)<30) return replyx("⚡ Need 30 energy."); user.energy-=30;
  let key=chance(10)?"diamond":chance(25)?"gold":chance(50)?"iron":"stone"; let o=ORES[key];
  user.inventory[key]=(user.inventory[key]||0)+1; user.frontier.ores[key]=(user.frontier.ores[key]||0)+1;
  replyx(`⛏️ EXCAVATED!\n💎 ${o.name} ×1\n⚡ -30 Energy`)
}},

{name:"prospect",aliases:["prospecting"],description:"Prospect for veins",run:async()=>{
  ensure(user); let veins=Object.keys(ORES).filter(()=>Math.random()>0.6).slice(0,3);
  replyx(veins.length?`🔍 PROSPECTED!\nVeins nearby:\n${veins.map(k=>`• ${ORES[k].name} — ${chance(60)?"Rich":"Faint"} signal`).join("\n")}`:"🔍 No veins detected nearby.")
}},

{name:"smelt",aliases:["smelting"],description:"Smelt ores into bars",run:async({args})=>{
  ensure(user); let ore=String(args[0]||"iron").toLowerCase(); let amt=Number(args[1])||1;
  if(!ORES[ore]) return replyx("❌ Ore not found."); if((user.inventory[ore]||0)<amt) return replyx(`❌ Need ${amt}x ${ore}`);
  user.inventory[ore]-=amt; let barKey=ore+"_bar"; user.inventory[barKey]=(user.inventory[barKey]||0)+amt;
  replyx(`🔥 Smelted ${amt}x ${ORES[ore].name} → ${amt}x ${barKey}\n${fun?fun():""}`)
}},

{name:"forge",aliases:["blacksmith"],description:"Forge equipment",run:async({args})=>{
  ensure(user); let item=String(args.join(" ")||"").toLowerCase();
  if(item.includes("sword")){ if((user.inventory.iron_bar||0)<3) return replyx("Need 3 iron_bar"); user.inventory.iron_bar-=3; user.inventory.iron_sword=(user.inventory.iron_sword||0)+1; return replyx("⚔️ Forged Iron Sword!"); }
  if(item.includes("armor")){ if((user.inventory.iron_bar||0)<5) return replyx("Need 5 iron_bar"); user.inventory.iron_bar-=5; user.inventory.steel_armor=(user.inventory.steel_armor||0)+1; return replyx("🛡️ Forged Steel Armor!"); }
  replyx("🔨 FORGE\nRecipes:\n• Iron Sword = 3 iron_bar\n• Steel Armor = 5 iron_bar\n!forge <name>")
}},

{name:"fish",aliases:["fishing"],description:"Fish for fish",cooldown:20,run:async()=>{
  ensure(user); let u=user.frontier; let roll=Math.random()*100+u.fishingLevel;
  let fishKey=roll>99?"leviathan":roll>95?"kraken":roll>88?"shark":roll>75?"tuna":roll>55?"salmon":roll>35?"trout":roll>18?"bass":"minnow";
  let f=FISH[fishKey]; let amt=1; u.fish[fishKey]=(u.fish[fishKey]||0)+amt; user.inventory[fishKey]=(user.inventory[fishKey]||0)+amt;
  u.fishingXp+=f.xp; u.totalFished+=amt; if(u.fishingXp>=u.fishingLevel*120){u.fishingXp-=u.fishingLevel*120; u.fishingLevel++;}
  xp(user,f.xp); replyx(`🎣 CAUGHT!\n🐟 ${f.name} ×${amt} [${f.rarity}]\n⭐ +${f.xp} Fishing XP • Lv.${u.fishingLevel}\n${bar?bar(u.fishingXp,u.fishingLevel*120,8):""} ${u.fishingXp}/${u.fishingLevel*120}`)
}},

{name:"bait",aliases:["baits"],description:"View baits",run:async()=>{
  ensure(user); replyx(`🪱 BAITS\nWorm — +5% rare • $${fmt(100)}\nLure — +15% rare • $${fmt(1000)}\nGolden Bait — +30% legendary • $${fmt(10000)}\n💡!shop to buy, auto-used on!fish`)
}},

{name:"fishing",aliases:["fishstats"],description:"Fishing stats",run:async()=>{
  ensure(user); let f=user.frontier; replyx(`🎣 FISHING STATS\nLevel: ${f.fishingLevel}\nXP: ${fmt(f.fishingXp)}/${fmt(f.fishingLevel*120)}\nTotal caught: ${fmt(f.totalFished)}\n${bar?bar(f.fishingXp,f.fishingLevel*120,10):""}`)
}},

{name:"fishinfo",aliases:["fishdex"],description:"Fish details",run:async({args})=>{
  let k=String(args[0]||"").toLowerCase(); let f=FISH[k]||Object.values(FISH).find(x=>x.name.toLowerCase()===k);
  if(!f) return replyx("❌ Fish not found."); replyx(`🐟 ${f.name}\nRarity: ${f.rarity}\nPrice: $${fmt(f.price)}\nXP: ${f.xp}`)
}},

{name:"hunt",aliases:["hunting"],description:"Hunt animals",cooldown:25,run:async()=>{
  ensure(user); let u=user.frontier; let roll=Math.random()*100+u.huntingLevel*1.5;
  let key=roll>98?"dragon":roll>90?"lion":roll>80?"bear":roll>65?"boar":roll>45?"wolf":roll>25?"deer":"rabbit";
  let a=ANIMALS[key]; u.animals[key]=(u.animals[key]||0)+1; user.inventory[key]=(user.inventory[key]||0)+1;
  u.huntingXp+=a.xp; u.totalHunted++; if(u.huntingXp>=u.huntingLevel*150){u.huntingXp-=u.huntingLevel*150; u.huntingLevel++;}
  xp(user,a.xp); replyx(`🏹 HUNTED!\n🦌 ${a.name} ×1 [${a.rarity}]\n⭐ +${a.xp} Hunting XP • Lv.${u.huntingLevel}\n${fun?fun():""}`)
}},

{name:"animals",aliases:["animallist"],description:"List animals",run:async()=>{
  replyx(`🦌 ANIMALS\n${Object.values(ANIMALS).map(a=>`• ${a.name} — $${fmt(a.price)} [${a.rarity}]`).join("\n")}`)
}},

{name:"tracking",aliases:["track"],description:"Track animals",run:async()=>{
  ensure(user); let found=Object.keys(ANIMALS).filter(()=>Math.random()>0.5).slice(0,3);
  replyx(found.length?`👣 TRACKED!\nTracks found:\n${found.map(k=>`• ${ANIMALS[k].name} — ${chance(70)?"Fresh":"Old"} tracks`).join("\n")}`:"👣 No tracks found.")
}},

{name:"trap",aliases:["traps"],description:"Set a trap",run:async()=>{
  ensure(user); if((user.inventory.trap||0)<1 && money(user)<500) return replyx("Need trap ($500) or buy one.");
  if((user.inventory.trap||0)>=1) user.inventory.trap--; else setMoney(user,money(user)-500);
  setTimeout(()=>{},0);
  let reward=chance(60)?rand(Object.keys(ANIMALS)):null;
  if(reward){ user.inventory[reward]=(user.inventory[reward]||0)+1; user.frontier.animals[reward]=(user.frontier.animals[reward]||0)+1; replyx(`🪤 Trap triggered!\n🦌 Caught ${ANIMALS[reward].name}!`); }else replyx("🪤 Trap set... but nothing caught this time.");
}},

{name:"catch",aliases:["catchanimal"],description:"Catch tracked animal",run:async({args})=>{
  ensure(user); let k=String(args[0]||"").toLowerCase(); if(!ANIMALS[k]) return replyx("Usage:!catch <animal>"); if(!chance(55+user.frontier.huntingLevel)) return replyx(`💨 ${ANIMALS[k].name} escaped!`);
  user.inventory[k]=(user.inventory[k]||0)+1; user.frontier.animals[k]=(user.frontier.animals[k]||0)+1; replyx(`✅ Caught ${ANIMALS[k].name}!`)
}},

{name:"cook",aliases:["cooking"],description:"Cook fish/meat",run:async({args})=>{
  ensure(user); let item=String(args[0]||"minnow").toLowerCase(); let src=FISH[item]||ANIMALS[item]; if(!src) return replyx("Usage:!cook <fish/animal>"); if((user.inventory[item]||0)<1) return replyx("❌ You don't have that.");
  user.inventory[item]--; let heal=src.price>1000?50:20; user.health=Math.min(user.maxHealth||100,(user.health||100)+heal); user.inventory["cooked_"+item]=(user.inventory["cooked_"+item]||0)+1;
  replyx(`🍳 Cooked ${src.name}!\n❤️ +${heal} HP • 🍖 Got cooked_${item}`)
}},

{name:"camp",aliases:["campsite"],description:"Rest at camp",run:async()=>{
  ensure(user); user.health=user.maxHealth||100; user.energy=user.maxEnergy||100; user.stamina=user.maxStamina||100;
  replyx(`⛺ CAMP RESTED!\n❤️ HP Full\n⚡ Energy Full\n🏃 Stamina Full\n${fun?fun():""}`)
}},

{name:"explore",aliases:["exploring"],description:"Explore wilderness",cooldown:30,run:async()=>{
  ensure(user); let finds=["ores","fish","animals","money","nothing"]; let f=rand(finds);
  if(f==="money"){ let g=Math.floor(Math.random()*5000)+500; setMoney(user,money(user)+g); replyx(`🗺️ Explored! Found $${fmt(g)}!`); }
  else if(f==="nothing") replyx("🗺️ Explored... found nothing but footprints. 👣");
  else { let pool=f==="ores"?ORES:f==="fish"?FISH:ANIMALS; let k=rand(Object.keys(pool)); user.inventory[k]=(user.inventory[k]||0)+1; replyx(`🗺️ Explored! Found ${pool[k].name}!`); }
  xp(user,15);
}},

{name:"gather",aliases:["gathering"],description:"Gather resources",run:async()=>{
  ensure(user); let res=["stone","coal","minnow","rabbit","apple"]; let k=rand(res); user.inventory[k]=(user.inventory[k]||0)+1; replyx(`🌿 Gathered ${k} ×1`)
}},

{name:"resources",aliases:["res"],description:"View frontier resources",run:async()=>{
  ensure(user); let f=user.frontier; replyx(`📦 FRONTIER RESOURCES\n⛏️ Ores: ${Object.entries(f.ores).map(([k,n])=>`${k}×${n}`).join(", ")||"None"}\n🎣 Fish: ${Object.entries(f.fish).map(([k,n])=>`${k}×${n}`).join(", ")||"None"}\n🦌 Animals: ${Object.entries(f.animals).map(([k,n])=>`${k}×${n}`).join(", ")||"None"}`)
}},

{name:"fishingrod",aliases:["rod"],description:"View/upgrade rod",run:async()=>{
  ensure(user); user.frontier.rod=user.frontier.rod||1; let cost=user.frontier.rod*15000; replyx(`🎣 ROD Lv.${user.frontier.rod}\n⬆️ Next: $${fmt(cost)}\n💡 Use!fishingrod upgrade`);
}},

{name:"fishinglevel",aliases:["flevel"],description:"Fishing level",run:async()=>{
  ensure(user); let f=user.frontier; replyx(`🎣 Fishing Lv.${f.fishingLevel}\nXP: ${f.fishingXp}/${f.fishingLevel*120}\n${bar?bar(f.fishingXp,f.fishingLevel*120,10):""}`)
}},

{name:"fishingquest",aliases:["fquest"],description:"Fishing quest",run:async()=>{
  ensure(user); user.frontier.fishingQuest=(user.frontier.fishingQuest||0)+1; let rew=4000+user.frontier.fishingQuest*600; setMoney(user,money(user)+rew); xp(user,25); user.frontier.fishingXp+=30; replyx(`🎣 Fishing Quest #${user.frontier.fishingQuest} DONE!\n💰 +$${fmt(rew)}\n⭐ +30 Fishing XP`)
}},

{name:"huntingrank",aliases:["hrank"],description:"Hunting rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,xp:u.frontier?.huntingXp||0,lv:u.frontier?.huntingLevel||1})).sort((a,b)=>b.lv*1000+b.xp - (a.lv*1000+a.xp)).slice(0,10);
  replyx(`🏹 HUNTING RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — Lv.${x.lv}`).join("\n")||"No hunters yet."}`)
}},

{name:"miningrank",aliases:["mrank"],description:"Mining rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,xp:u.frontier?.miningXp||0,lv:u.frontier?.miningLevel||1})).sort((a,b)=>b.lv*1000+b.xp - (a.lv*1000+a.xp)).slice(0,10);
  replyx(`⛏️ MINING RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — Lv.${x.lv}`).join("\n")||"No miners yet."}`)
}},

{name:"cave",aliases:["caves"],description:"Enter cave",run:async()=>{
  ensure(user); if((user.energy||100)<20) return replyx("⚡ Need 20 energy."); user.energy-=20;
  let key=chance(15)?"mythril":chance(30)?"diamond":chance(50)?"gold":"iron"; let o=ORES[key]; user.inventory[key]=(user.inventory[key]||0)+1; user.frontier.ores[key]=(user.frontier.ores[key]||0)+1;
  replyx(`🕳️ CAVE EXPLORED!\n💎 Found ${o.name}!\n⚡ -20 Energy`)
}},

{name:"map",aliases:["frontiermap"],description:"Frontier map",run:async()=>{
  replyx(`🗺️ FRONTIER MAP\n⛏️ North — Mining Caves (rare ores)\n🎣 East — Ocean (legendary fish)\n🦌 West — Dark Forest (mythic animals)\n🏕️ Center — Camp (rest area)\n💡 Explore each for bonuses!`)
}},

{name:"frontierstats",aliases:["fronstats"],description:"Frontier stats",run:async()=>{
  ensure(user); let f=user.frontier; replyx(`📊 FRONTIER STATS\n⛏️ Mining Lv.${f.miningLevel} (${f.totalMined} mined)\n🎣 Fishing Lv.${f.fishingLevel} (${f.totalFished} caught)\n🏹 Hunting Lv.${f.huntingLevel} (${f.totalHunted} hunted)`)
}},

{name:"frontierlb",aliases:["flb"],description:"Frontier leaderboard",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,score:(u.frontier?.miningLevel||1)+(u.frontier?.fishingLevel||1)+(u.frontier?.huntingLevel||1)}).sort((a,b)=>b.score-a.score).slice(0,10);
  replyx(`🏆 FRONTIER LB\n${list.map((x,i)=>`${i+1}. ${x.name} — Score ${x.score}`).join("\n")}`)
}},

{name:"frontierhelp",aliases:["fhelp2"],description:"Frontier help",run:async()=>{
  replyx(`⛏️ FRONTIER HELP\n⛏️!mine •!dig •!prospect •!smelt •!forge\n🎣!fish •!fishinfo •!fishingquest •!fishingrod\n🏹!hunt •!tracking •!trap •!catch\n🗺️!explore •!cave •!map •!camp •!cook`)
}},

{name:"smeltall",aliases:["smeltinventory"],description:"Smelt all ores",run:async()=>{
  ensure(user); let total=0; for(let [k,n] of Object.entries({...user.inventory})){ if(!ORES[k]) continue; if(n<=0) continue; user.inventory[k]=0; let bk=k+"_bar"; user.inventory[bk]=(user.inventory[bk]||0)+n; total+=n; } replyx(total?`🔥 Smelted ${total} ores into bars!`:"❌ No ores to smelt.")
}},

{name:"sellores",aliases:["sellfish","sellanimals"],description:"Sell frontier loot",run:async({args})=>{
  ensure(user); let all=Object.entries(user.inventory).filter(([k])=>ORES[k]||FISH[k]||ANIMALS[k]); let tot=0; for(let [k,n] of all){ let p=ORES[k]?.price||FISH[k]?.price||ANIMALS[k]?.price||0; tot+=p*n; delete user.inventory[k]; } setMoney(user,money(user)+tot); replyx(tot?`💰 Sold frontier loot for $${fmt(tot)}`:"❌ Nothing to sell.")
}},

{name:"frontierquest",aliases:["frontquest"],description:"Frontier daily quest",run:async()=>{
  ensure(user); user.frontier.dailyQuest=(user.frontier.dailyQuest||0)+1; let rew=10000+user.frontier.dailyQuest*1000; setMoney(user,money(user)+rew); xp(user,50); replyx(`🗺️ FRONTIER QUEST #${user.frontier.dailyQuest} DONE!\n💰 +$${fmt(rew)}\n⭐ +50 XP\n${fun?fun():""}`)
}}
];
return cmds;
};
