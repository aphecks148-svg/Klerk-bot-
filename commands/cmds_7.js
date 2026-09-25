// commands/cmds_7.js
// 🚘 STREETKINGS — iKON-BOT • GTA Style
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=20)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.street=u.street||{wanted:0,jailUntil:0,robberies:0,heists:0,gang:null,rep:0,cars:[],races:0,wins:0};
  u.wanted=u.wanted||0; u.jailUntil=u.jailUntil||0; u.gang=u.gang||null; u.cars=u.cars||[]; u.inventory=u.inventory||{};
};
const CARS={
  civic:{name:"Honda Civic",price:15000,speed:120,rarity:"Common"},
  supra:{name:"Toyota Supra",price:45000,speed:180,rarity:"Rare"},
  gtr:{name:"Nissan GTR",price:120000,speed:220,rarity:"Epic"},
  lambo:{name:"Lamborghini",price:350000,speed:280,rarity:"Legendary"},
  bugatti:{name:"Bugatti Chiron",price:1200000,speed:350,rarity:"Mythic"},
  batmobile:{name:"Batmobile",price:5000000,speed:400,rarity:"Divine"}
};
const chance=p=>Math.random()*100<p;
const isJailed=u=>Number(u.jailUntil||0)>Date.now();

const cmds=[
{name:"gta",aliases:["gtahelp"],description:"GTA help",run:async()=>{
  replyx(`🚘 STREETKINGS • GTA MODE
━━━━━━━━━━━━
💰!rob •!heist •!crime
🚔!wanted •!bounty •!police
🚓!jail •!escape •!arrest
🏁!gang •!territory •!car
💡 Start with!rob or!crime`)
}},

{name:"rob",aliases:["robbery"],description:"Rob a store",cooldown:30,run:async()=>{
  ensure(user); if(isJailed(user)) return replyx(`🔒 You are in jail! ${Math.ceil((user.jailUntil-Date.now())/1000)}s left. Use!escape`);
  let success=chance(65); if(!success){ user.wanted=(user.wanted||0)+1; user.street.wanted=(user.street.wanted||0)+1; user.xp=(user.xp||0)+10; return replyx(`🚨 ROBBERY FAILED!\n👮 Wanted +1 → ${user.wanted} stars\n💨 You escaped!`); }
  let loot=Math.floor(Math.random()*8000)+2000+user.level*100; setMoney(user,money(user)+loot); user.street.robberies++; xp(user,25);
  replyx(`💰 ROBBERY SUCCESS!\n🏪 Store: $${fmt(loot)}\n⭐ Wanted: ${user.wanted||0} • Robberies: ${user.street.robberies}\n${fun?fun():""}`)
}},

{name:"robbery",aliases:["rob2"],description:"Advanced robbery",cooldown:40,run:async()=>{
  ensure(user); if(isJailed(user)) return replyx("🔒 In jail!"); if(money(user)<500) return replyx("💸 Need $500 setup");
  setMoney(user,money(user)-500); let loot=Math.floor(Math.random()*15000)+5000; let win=chance(55);
  if(win){ setMoney(user,money(user)+loot); xp(user,35); replyx(`💰 ROBBERY +$${fmt(loot)} (net +$${fmt(loot-500)})`); }else{ user.wanted=(user.wanted||0)+2; replyx(`🚨 FAILED! Lost $500 • Wanted +2 → ${user.wanted}`); }
}},

{name:"crime",aliases:["crimes"],description:"Commit random crime",cooldown:25,run:async()=>{
  ensure(user); if(isJailed(user)) return replyx("🔒 Jailed!"); let crimes=["steal car","pickpocket","hack ATM","smash grab"]; let c=crimes[Math.floor(Math.random()*crimes.length)];
  let loot=Math.floor(Math.random()*6000)+1000; setMoney(user,money(user)+loot); user.wanted=Math.min(5,(user.wanted||0)+(chance(30)?1:0));
  replyx(`🔫 CRIME: ${c}\n💰 +$${fmt(loot)}\n⭐ Wanted: ${user.wanted}/5`)
}},

{name:"heist",aliases:["heistjob"],description:"Start a heist",cooldown:120,run:async()=>{
  ensure(user); if(isJailed(user)) return replyx("🔒 Jailed!"); if((user.energy||100)<40) return replyx("⚡ Need 40 energy"); user.energy-=40;
  let win=chance(45+user.level); if(win){ let loot=Math.floor(Math.random()*50000)+20000; setMoney(user,money(user)+loot); user.street.heists++; xp(user,100); user.street.rep+=10; replyx(`💎 HEIST SUCCESS!\n🏦 Bank: +$${fmt(loot)}\n🏆 Heists: ${user.street.heists}\n🔥 Rep +10\n${fun?fun():""}`); }else{ user.wanted=(user.wanted||0)+3; user.health=Math.max(0,(user.health||100)-30); replyx(`💀 HEIST FAILED!\n🚨 Wanted +3 → ${user.wanted}\n❤️ -30 HP`); }
}},

{name:"wanted",aliases:["stars"],description:"Check wanted level",run:async()=>{
  ensure(user); let w=user.wanted||0; replyx(`🚨 WANTED: ${"⭐".repeat(w)}${"☆".repeat(5-w)} ${w}/5\n${w===0?"✅ Clean record":w<3?"⚠️ Cops watching":w<5?"🔥 SWAT alerted":"💀 MAX WANTED!"}\n${bar?bar(w,5,5):""}`)
}},

{name:"bounty",aliases:["bounties"],description:"Check bounty",run:async()=>{
  ensure(user); let b=(user.wanted||0)*5000+ (user.street?.rep||0)*100; replyx(`💀 BOUNTY: $${fmt(b)}\nWanted: ${user.wanted||0} stars\nRep: ${user.street?.rep||0}`)
}},

{name:"police",aliases:["cops"],description:"Police status",run:async()=>{
  ensure(user); if((user.wanted||0)===0) return replyx("👮 No police after you. Clean!");
  if(chance(40)){ user.wanted=Math.max(0,(user.wanted||0)-1); replyx(`👮 Police lost you! Wanted → ${user.wanted}`); }else replyx(`🚔 Police chasing! Wanted: ${user.wanted} stars\n💡!escape or!bribe`)
}},

{name:"arrest",aliases:["getarrested"],description:"Get arrested",run:async()=>{
  ensure(user); if((user.wanted||0)===0) return replyx("✅ You are clean, no arrest."); user.jailUntil=Date.now()+60000*(user.wanted||1); user.wanted=0;
  replyx(`🚨 ARRESTED!\n🔒 Jail: ${Math.ceil((user.jailUntil-Date.now())/1000)}s\n💸 Fine: $5,000`); setMoney(user,Math.max(0,money(user)-5000));
}},

{name:"jail",aliases:["jailtime"],description:"Check jail time",run:async()=>{
  ensure(user); if(!isJailed(user)) return replyx("✅ Not in jail."); replyx(`🔒 IN JAIL\n⏱️ ${Math.ceil((user.jailUntil-Date.now())/1000)}s left\n💡!escape (50% chance)`)
}},

{name:"escape",aliases:["jailbreak"],description:"Escape jail",cooldown:30,run:async()=>{
  ensure(user); if(!isJailed(user)) return replyx("✅ Not jailed."); if(chance(50)){ user.jailUntil=0; xp(user,50); replyx(`🔓 ESCAPE SUCCESS!\n💨 You broke out!\n⭐ +50 XP\n${fun?fun():""}`); }else{ user.jailUntil+=30000; replyx(`🚨 ESCAPE FAILED!\n🔒 +30s added\n⏱️ Total: ${Math.ceil((user.jailUntil-Date.now())/1000)}s`); }
}},

{name:"gang",aliases:["gangs"],description:"Gang info",run:async()=>{
  ensure(user); replyx(user.gang?`🏴 GANG: ${user.gang}\n🔥 Rep: ${user.street.rep}\nHeists: ${user.street.heists}`:`🏴 No gang. Use!gangjoin <name> or!ganginfo`)
}},

{name:"ganginfo",aliases:["ginfo"],description:"Gang details",run:async()=>{
  replyx(`🏴 GANGS\n• Ballas — Rep 0+\n• Grove Street — Rep 100+\n• Vagos — Rep 300+\n• Mafia — Rep 1000+\n💡 Earn rep with!heist •!rob`)
}},

{name:"gangjoin",aliases:["joingang"],description:"Join gang",run:async({args})=>{
  ensure(user); let name=args.join(" ")||"Ballas"; user.gang=name; replyx(`🏴 Joined ${name}!\n🔥 Welcome to the streets!`)
}},

{name:"gangleave",aliases:["leavegang"],description:"Leave gang",run:async()=>{
  ensure(user); if(!user.gang) return replyx("❌ No gang."); let g=user.gang; user.gang=null; replyx(`🏳️ Left ${g}. You are solo now.`)
}},

{name:"gangwar",aliases:["war"],description:"Gang war",cooldown:60,run:async()=>{
  ensure(user); if(!user.gang) return replyx("❌ Join a gang first!"); let win=chance(50+user.street.rep/20); if(win){ user.street.rep+=25; let loot=Math.floor(Math.random()*20000)+5000; setMoney(user,money(user)+loot); replyx(`⚔️ GANG WAR WON!\n🏴 ${user.gang} dominates!\n💰 +$${fmt(loot)}\n🔥 Rep +25`); }else{ user.health=Math.max(0,(user.health||100)-40); replyx(`💀 GANG WAR LOST!\n❤️ -40 HP\n🔥 Rep -5`); user.street.rep=Math.max(0,user.street.rep-5); }
}},

{name:"territory",aliases:["turf"],description:"Check territory",run:async()=>{
  ensure(user); replyx(`🗺️ TERRITORY\nGang: ${user.gang||"None"}\nRep: ${user.street?.rep||0}\nTurf: ${Math.floor((user.street?.rep||0)/100)} blocks controlled`)
}},

{name:"capture",aliases:["captureturf"],description:"Capture turf",cooldown:45,run:async()=>{
  ensure(user); if(!user.gang) return replyx("❌ Need gang!"); if((user.energy||100)<30) return replyx("⚡ Need 30 energy"); user.energy-=30;
  if(chance(60)){ user.street.rep+=15; replyx(`🏴 TURF CAPTURED!\n🔥 Rep +15 → ${user.street.rep}`); }else replyx("💀 Capture failed! Enemy gang fought back.")
}},

{name:"car",aliases:["mycar"],description:"View main car",run:async()=>{
  ensure(user); let c=user.cars[0]; replyx(c?`🚗 ${CARS[c]?.name||c}\nSpeed: ${CARS[c]?.speed||100} km/h\nRarity: ${CARS[c]?.rarity||"Common"}`:"🚗 No car. Use!cars then!buy <car>")
}},

{name:"cars",aliases:["carlist","garage"],description:"List cars",run:async()=>{
  ensure(user); if(user.cars.length) replyx(`🚘 YOUR CARS\n${user.cars.map((k,i)=>`${i+1}. ${CARS[k]?.name||k} — ${CARS[k]?.speed||100} km/h`).join("\n")}`);
  else replyx(`🚘 CAR SHOP\n${Object.entries(CARS).map(([k,v])=>`• ${v.name} — $${fmt(v.price)} — ${v.speed} km/h [${v.rarity}]`).join("\n")}\n💡!buy <carname> or!cars buy <name>`)
}},

{name:"garage",aliases:["mygarage"],description:"Garage view",run:async()=>{
  ensure(user); replyx(`🏚️ GARAGE\nCars: ${user.cars.length}/10\n${user.cars.map(k=>`• ${CARS[k]?.name||k}`).join("\n")||"Empty — buy cars with!cars"}`)
}},

{name:"race",aliases:["streetrace"],description:"Street race",cooldown:30,run:async()=>{
  ensure(user); if(!user.cars.length) return replyx("🚗 Need a car!"); let myCar=CARS[user.cars[0]]||{speed:100}; let oppSpeed=100+Math.random()*250; let mySpeed=myCar.speed+Math.random()*50;
  if(mySpeed>=oppSpeed){ let rew=Math.floor(Math.random()*10000)+5000; setMoney(user,money(user)+rew); user.street.wins=(user.street.wins||0)+1; user.street.races++; xp(user,30); replyx(`🏁 RACE WON!\n🚗 ${myCar.name} ${Math.floor(mySpeed)} vs ${Math.floor(oppSpeed)} km/h\n💰 +$${fmt(rew)}\n🏆 Wins: ${user.street.wins}`); }
  else{ user.street.races++; replyx(`💀 RACE LOST!\n🚗 ${Math.floor(mySpeed)} vs ${Math.floor(oppSpeed)} km/h`); }
}},

{name:"racing",aliases:["races"],description:"Racing stats",run:async()=>{
  ensure(user); replyx(`🏁 RACING STATS\nRaces: ${user.street?.races||0}\nWins: ${user.street?.wins||0}\nWinrate: ${user.street?.races?Math.floor(user.street.wins/user.street.races*100):0}%`)
}},

{name:"chopshop",aliases:["chop"],description:"Chop shop",run:async({args})=>{
  ensure(user); let car=args[0]; if(!car||!user.cars.includes(car)) return replyx("Usage:!chopshop <carId>\nSells car for 60%"); let v=CARS[car]?.price||10000; user.cars=user.cars.filter(c=>c!==car); setMoney(user,money(user)+Math.floor(v*0.6)); replyx(`🔧 Chopped ${CARS[car]?.name||car} for $${fmt(Math.floor(v*0.6))}`)
}},

{name:"tuner",aliases:["tuning"],description:"Tune car",run:async({args})=>{
  ensure(user); if(!user.cars.length) return replyx("No car"); let cost=15000; if(money(user)<cost) return replyx(`Need $${fmt(cost)}`); setMoney(user,money(user)-cost); let car=user.cars[0]; if(CARS[car]) CARS[car].speed+=10; replyx(`🔧 Tuned ${CARS[car]?.name||car}! Speed +10 → ${CARS[car]?.speed||"?"} km/h`)
}},

{name:"nitro",aliases:["nos"],description:"Use nitro",run:async()=>{
  ensure(user); if((user.inventory.nitro||0)<1 && money(user)<2000) return replyx("💨 Need Nitro ($2k)"); if((user.inventory.nitro||0)>=1) user.inventory.nitro--; else setMoney(user,money(user)-2000);
  replyx(`💨 NITRO BOOST!\n🚗 Next race +50 speed boost!\n${fun?fun():""}`); user.street.nitroBoost=50;
}}
];
return cmds;
};
