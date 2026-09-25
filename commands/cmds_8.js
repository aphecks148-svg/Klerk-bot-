// commands/cmds_8.js
// 💀 UNDERWORLD — iKON-BOT • 20 Commands • Black Market
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=30)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.under=u.under||{heat:0,rep:0,smuggles:0,hits:0,blackmarketLevel:1,bounty:0,contacts:0,stealth:10};
  u.inventory=u.inventory||{}; u.wanted=u.wanted||0; u.level=u.level||1;
};
const BLACKMARKET={
  lockpick:{name:"Lockpick",price:2500,illegal:true},
  fake_id:{name:"Fake ID",price:15000,illegal:true},
  silencer:{name:"Silencer",price:25000,illegal:true},
  cocaine:{name:"Cocaine Pack",price:50000,illegal:true,sell:75000},
  weed:{name:"Weed Pack",price:10000,illegal:true,sell:18000},
  diamond_illegal:{name:"Blood Diamond",price:100000,illegal:true,sell:160000},
  usb_hack:{name:"Hack USB",price:30000,illegal:true},
  briefcase:{name:"Money Briefcase",price:200000,illegal:true,sell:350000}
};
const chance=p=>Math.random()*100<p;
const rand=a=>a[Math.floor(Math.random()*a.length)];

const cmds=[
{name:"underworld",aliases:["under"],description:"Underworld hub",run:async()=>{
  ensure(user); let u=user.under; replyx(`💀 UNDERWORLD
━━━━━━━━━━━━
🔥 Heat: ${bar?bar(u.heat,100,10):u.heat+"%"} ${u.heat}%
💀 Rep: ${fmt(u.rep)} • Stealth: ${u.stealth}%
📦 Smuggles: ${u.smuggles} • 🎯 Hits: ${u.hits}
👥 Contacts: ${u.contacts} • Lv.${u.blackmarketLevel}
${u.heat>80?"🚨 HIGH HEAT! Lay low!":"✅ Low profile"}
${fun?fun():""}`)
}},

{name:"blackmarket",aliases:["bm"],description:"Black market shop",run:async()=>{
  replyx(`💀 BLACK MARKET\n━━━━━━━━━━━━\n${Object.entries(BLACKMARKET).map(([k,v])=>`• ${v.name} — $${fmt(v.price)}${v.sell?" → Sell $${fmt(v.sell)}":""}`).join("\n")}\n━━━━━━━━━━━━\n💡!buy <item> •!sell <item> (illegal profit)`)
}},

{name:"smuggle",aliases:["smuggling"],description:"Smuggle goods",cooldown:60,run:async()=>{
  ensure(user); let u=user.under; if((user.energy||100)<35) return replyx("⚡ Need 35 energy"); user.energy-=35;
  let goods=rand(Object.keys(BLACKMARKET).filter(k=>BLACKMARKET[k].sell)); let risk=u.heat + Math.random()*30;
  if(risk>85){ u.heat=Math.min(100,u.heat+15); user.wanted=(user.wanted||0)+1; replyx(`🚨 SMUGGLE BUSTED!\n👮 Caught with ${BLACKMARKET[goods].name}!\n🔥 Heat +15 → ${u.heat}%\nWanted +1`); return; }
  user.inventory[goods]=(user.inventory[goods]||0)+1; u.smuggles++; u.heat=Math.min(100,u.heat+5); u.rep+=20; xp(user,40);
  replyx(`📦 SMUGGLED!\n💼 ${BLACKMARKET[goods].name} ×1\n💀 Rep +20 → ${u.rep}\n🔥 Heat ${u.heat}%\n💡 Sell with!sell ${goods}`)
}},

{name:"sellcontraband",aliases:["sellillegal"],description:"Sell contraband",run:async({args})=>{
  ensure(user); let id=String(args[0]||"").toLowerCase().replace(/ /g,"_"); let item=BLACKMARKET[id]; if(!item||!item.sell) return replyx("❌ That can't be sold as contraband.");
  if((user.inventory[id]||0)<1) return replyx(`❌ Need ${item.name}`); user.inventory[id]--; setMoney(user,money(user)+item.sell); user.under.rep+=10; user.under.heat=Math.min(100,user.under.heat+3);
  replyx(`💰 Sold ${item.name} for $${fmt(item.sell)} (profit $${fmt(item.sell-item.price)})\n💀 Rep +10\n🔥 Heat +3`)
}},

{name:"heistunder",aliases:["uheist"],description:"Underworld heist",cooldown:90,run:async()=>{
  ensure(user); if((user.energy||100)<45) return replyx("⚡ Need 45 energy"); user.energy-=45;
  let win=chance(40+user.under.stealth/2); if(win){ let loot=Math.floor(Math.random()*100000)+30000; setMoney(user,money(user)+loot); user.under.rep+=30; xp(user,80); replyx(`💎 UNDER HEIST SUCCESS!\n💰 +$${fmt(loot)}\n💀 Rep +30\n${fun?fun():""}`); }else{ user.under.heat+=20; user.health=Math.max(0,(user.health||100)-35); replyx(`💀 HEIST FAILED!\n🔥 Heat +20 → ${user.under.heat}%\n❤️ -35 HP`); }
}},

{name:"hit",aliases:["hitman"],description:"Hire/perform hit",cooldown:120,run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; ensure(user);
  if(!target){ // NPC hit
    if(money(user)<10000) return replyx("💸 Need $10k for hit contract"); setMoney(user,money(user)-10000);
    if(chance(55)){ let rew=Math.floor(Math.random()*80000)+20000; setMoney(user,money(user)+rew); user.under.hits++; user.under.rep+=40; replyx(`🎯 HIT COMPLETED!\n💰 +$${fmt(rew)} (net +$${fmt(rew-10000)})\n💀 Rep +40`); }else replyx("💀 HIT FAILED! Target escaped.");
    return;
  }
  let other=users.get(target); if(!other) return replyx("❌ User not found");
  if(money(user)<20000) return replyx("💸 Need $20k for player hit"); setMoney(user,money(user)-20000);
  other.health=Math.max(0,(other.health||100)-50); other.wanted=(other.wanted||0)+1; user.under.hits++; user.under.heat+=10;
  replyx(`🎯 HIT on ${other.name}!\n❤️ -50 HP to target\n🔥 Heat +10`)
}},

{name:"smuggleinfo",aliases:["sinfo"],description:"Smuggling info",run:async()=>{
  replyx(`📦 SMUGGLING GUIDE\n1.!smuggle — get contraband\n2.!sellcontraband <item> — sell for profit\n3. Heat ↑ on each smuggle\n4. Heat >85 = bust risk\n5.!launder to reduce heat`)
}},

{name:"launder",aliases:["laundering"],description:"Launder money / heat",run:async()=>{
  ensure(user); if(money(user)<15000) return replyx("💸 Need $15k to launder"); setMoney(user,money(user)-15000); user.under.heat=Math.max(0,user.under.heat-25); user.wanted=Math.max(0,(user.wanted||0)-1);
  replyx(`🧼 LAUNDERED!\n🔥 Heat -25 → ${user.under.heat}%\n⭐ Wanted -1 → ${user.wanted||0}\n💸 -$15,000 fee`)
}},

{name:"bribe",aliases:["bribecops"],description:"Bribe police",run:async()=>{
  ensure(user); let cost=(user.wanted||0)*8000+5000; if(money(user)<cost) return replyx(`💸 Need $${fmt(cost)} to bribe`); setMoney(user,money(user)-cost); user.wanted=0; user.under.heat=Math.max(0,user.under.heat-15);
  replyx(`💵 BRIBED!\n👮 Cops paid $${fmt(cost)}\n✅ Wanted cleared\n🔥 Heat -15`)
}},

{name:"stealth",aliases:["stealthstat"],description:"Stealth level",run:async()=>{
  ensure(user); replyx(`🥷 Stealth: ${user.under.stealth}%\n💡 Increases smuggle & heist success\n💡 Upgrade with!upgradestealth`)
}},

{name:"upgradestealth",aliases:["ustealth"],description:"Upgrade stealth",run:async()=>{
  ensure(user); let cost=user.under.stealth*2000+10000; if(money(user)<cost) return replyx(`💸 Need $${fmt(cost)}`); setMoney(user,money(user)-cost); user.under.stealth=Math.min(95,user.under.stealth+5); replyx(`🥷 Stealth → ${user.under.stealth}%\n💸 Cost $${fmt(cost)}`)
}},

{name:"contact",aliases:["contacts"],description:"Underworld contacts",run:async()=>{
  ensure(user); replyx(`👥 CONTACTS: ${user.under.contacts}\n💀 Rep: ${user.under.rep}\nLevel: ${user.under.blackmarketLevel}\n💡!findcontact`)
}},

{name:"findcontact",aliases:["newcontact"],description:"Find new contact",cooldown:60,run:async()=>{
  ensure(user); if(chance(60)){ user.under.contacts++; user.under.rep+=15; replyx(`👥 New contact found!\nTotal: ${user.under.contacts}\n💀 Rep +15`); }else replyx("🔍 No contacts found today.")
}},

{name:"heat",aliases:["heatlevel"],description:"Check heat",run:async()=>{
  ensure(user); replyx(`🔥 HEAT: ${bar?bar(user.under.heat,100,10):""} ${user.under.heat}%\n${user.under.heat<30?"✅ Cold":user.under.heat<60?"⚠️ Warm":user.under.heat<85?"🔥 Hot!":"🚨 BURNING! Hide!"}`)
}},

{name:"rep",aliases:["underrep"],description:"Underworld rep",run:async()=>{
  ensure(user); replyx(`💀 Rep: ${fmt(user.under.rep)}\nLevel: ${user.under.blackmarketLevel}\nProgress: ${bar?bar(user.under.rep%500,500,10):""} ${user.under.rep%500}/500`)
}},

{name:"bountyset",aliases:["setbounty"],description:"Set bounty on player",run:async({args})=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("🎯 Tag player to set bounty on");
  let other=users.get(target); if(!other) return replyx("❌ User not found"); let amt=Number(args.filter(x=>!x.startsWith("@")).join(""))||5000;
  if(money(user)<amt) return replyx(`💸 Need $${fmt(amt)}`); setMoney(user,money(user)-amt); other.under=other.under||{bounty:0}; other.under.bounty=(other.under.bounty||0)+amt; ensure(user);
  replyx(`💀 Bounty $${fmt(amt)} set on ${other.name}!\n🎯 Total bounty: $${fmt(other.under.bounty)}`)
}},

{name:"hithistory",aliases:["hits"],description:"Hit history",run:async()=>{
  ensure(user); replyx(`🎯 HITS DONE: ${user.under.hits}\n💀 Rep: ${user.under.rep}\nSmuggles: ${user.under.smuggles}`)
}},

{name:"underrank",aliases:["urank"],description:"Underworld rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,rep:u.under?.rep||0})).sort((a,b)=>b.rep-a.rep).slice(0,10);
  replyx(`💀 UNDERWORLD RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — ${fmt(x.rep)} rep`).join("\n")||"Empty"})
}},

{name:"underhelp",aliases:["uhelp"],description:"Underworld help",run:async()=>{
  replyx(`💀 UNDERWORLD HELP\n📦!smuggle •!sellcontraband\n💎!heistunder •🎯!hit •!bountyset\n🧼!launder •💵!bribe\n🥷!stealth •!upgradestealth\n👥!contact •!findcontact\n🔥!heat •!rep •!underrank`)
}},

{name:"vault",aliases:["undervault"],description:"Illegal vault",run:async()=>{
  ensure(user); let stored=user.under.vault||0; replyx(`🔐 UNDER VAULT\n💰 $${fmt(stored)}\n💡!vaultdeposit <amount> •!vaultwithdraw <amount>`)
}}
];
return cmds;
};
