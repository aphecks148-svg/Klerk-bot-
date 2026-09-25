// commands/cmds_4.js
// 🌾 EARTHBOUND — iKON-BOT • 35 Commands
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=15)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.farm=u.farm||{plots:6,level:1,xp:0,crops:{},log:[],compost:0,fertilizer:5,irrigation:0,greenhouse:0};
  u.inventory=u.inventory||{};
  u.farm.crops=u.farm.crops||{};
};
const CROPS={
  wheat:{name:"Wheat",seed:"wheat_seed",grow:60,price:500,yield:1200,rarity:"Common"},
  corn:{name:"Corn",seed:"corn_seed",grow:120,price:1200,yield:3000,rarity:"Common"},
  carrot:{name:"Carrot",seed:"carrot_seed",grow:90,price:800,yield:2000,rarity:"Uncommon"},
  potato:{name:"Potato",seed:"potato_seed",grow:100,price:900,yield:2200,rarity:"Uncommon"},
  tomato:{name:"Tomato",seed:"tomato_seed",grow:150,price:1500,yield:4000,rarity:"Rare"},
  strawberry:{name:"Strawberry",seed:"strawberry_seed",grow:180,price:2200,yield:6000,rarity:"Rare"},
  golden_apple:{name:"Golden Apple",seed:"golden_seed",grow:300,price:10000,yield:35000,rarity:"Legendary"},
  moonflower:{name:"Moonflower",seed:"moon_seed",grow:600,price:50000,yield:200000,rarity:"Mythic"}
};
const findCrop=q=>{
  q=String(q||"").toLowerCase().replace(/ /g,"_");
  return Object.keys(CROPS).find(k=>k===q||CROPS[k].name.toLowerCase()===q||k.includes(q));
};
const now=()=>Date.now();
const log=(u,t)=>{ensure(u); u.farm.log.unshift(`[${new Date().toLocaleTimeString()}] ${t}`); if(u.farm.log.length>20) u.farm.log.pop();};

const cmds=[
{name:"farm",aliases:["myfarm"],description:"View your farm",run:async()=>{
  ensure(user);
  let f=user.farm, planted=Object.keys(f.crops).length;
  replyx(`🌾 ${user.name}'s FARM • Lv.${f.level}
━━━━━━━━━━━━━━
🌱 Plots: ${planted}/${f.plots} used
⭐ Farm XP: ${fmt(f.xp)} ${bar?bar(f.xp%1000,1000,10):""}
🧪 Fertilizer: ${fmt(f.fertilizer)} • 🌿 Compost: ${fmt(f.compost)}
💧 Irrigation: Lv.${f.irrigation} • 🏡 Greenhouse: ${f.greenhouse?"YES":"NO"}
💰 Wallet: $${fmt(money(user))}
${fun?fun():""}`)
}},

{name:"plant",aliases:["sow"],description:"Plant a crop",run:async({args})=>{
  ensure(user); let id=findCrop(args[0]); let plot=args[1]||String(Object.keys(user.farm.crops).length+1);
  if(!id) return replyx("❌ Usage:!plant <crop> [plot]\n🌱 Crops: wheat, corn, carrot, potato, tomato, strawberry, golden_apple, moonflower");
  if(Object.keys(user.farm.crops).length>=user.farm.plots) return replyx(`❌ Farm full (${user.farm.plots} plots). Upgrade with!farmupgrade`);
  let seed=CROPS[id].seed; if((user.inventory[seed]||0)<1) return replyx(`🌱 Need 1x ${seed}. Buy in!farmshop`);
  user.inventory[seed]--; user.farm.crops[plot]={id,planted:now(),watered:0,fertilized:0,growth:0};
  log(user,`Planted ${CROPS[id].name} in plot ${plot}`); xp(user,10); user.farm.xp+=10;
  replyx(`🌱 PLANTED!\n🌾 ${CROPS[id].name} in plot ${plot}\n⏱️ Grows in ${CROPS[id].grow}s\n💧 Use!water ${plot}`)
}},

{name:"seeds",aliases:["seedlist"],description:"List your seeds",run:async()=>{
  ensure(user); let s=Object.entries(user.inventory).filter(([k])=>k.includes("seed"));
  replyx(s.length?`🌱 YOUR SEEDS\n${s.map(([k,n])=>`• ${k} ×${n}`).join("\n")}`:"🌱 No seeds. Use!farmshop")
}},

{name:"water",aliases:["watercrop"],description:"Water a plot",run:async({args})=>{
  ensure(user); let p=args[0]; let c=p?user.farm.crops[p]:Object.values(user.farm.crops)[0];
  if(!c) return replyx("❌ No crop found. Use!farm");
  if(!p) p=Object.keys(user.farm.crops).find(k=>user.farm.crops[k]===c);
  c.watered=(c.watered||0)+1; c.growth=Math.min(100,(c.growth||0)+25);
  xp(user,5); user.farm.xp+=5;
  replyx(`💧 Plot ${p} watered!\n🌱 ${CROPS[c.id].name} Growth: ${bar?bar(c.growth,100,8):c.growth+"%"} ${c.growth}%\n💧 Total water: ${c.watered}`)
}},

{name:"harvest",aliases:["pick"],description:"Harvest a plot",run:async({args})=>{
  ensure(user); let p=args[0]||Object.keys(user.farm.crops)[0]; let c=user.farm.crops[p];
  if(!c) return replyx("❌ That plot is empty.");
  let age=(now()-c.planted)/1000; let need=CROPS[c.id].grow*(1 - (user.farm.irrigation*0.1));
  if(age<need && (c.growth||0)<100) return replyx(`⏳ ${CROPS[c.id].name} not ready. ${Math.ceil(need-age)}s left • Growth ${c.growth||0}%`);
  let bonus=1+(c.fertilized||0)*0.3+(c.watered||0)*0.05; let reward=Math.floor(CROPS[c.id].yield*bonus);
  setMoney(user,money(user)+reward); delete user.farm.crops[p]; xp(user,25); user.farm.xp+=30;
  log(user,`Harvested ${CROPS[c.id].name} for $${fmt(reward)}`);
  replyx(`🌾 HARVESTED plot ${p}!\n🌾 ${CROPS[c.id].name}\n💰 +$${fmt(reward)} (x${bonus.toFixed(1)} bonus)\n💵 Wallet: $${fmt(money(user))}\n${fun?fun():""}`)
}},

{name:"fertilize",aliases:["fert"],description:"Fertilize a plot",run:async({args})=>{
  ensure(user); let p=args[0]||Object.keys(user.farm.crops)[0]; let c=user.farm.crops[p];
  if(!c) return replyx("❌ No crop in that plot.");
  if((user.farm.fertilizer||0)<1) return replyx("🧪 No fertilizer. Buy in!farmshop");
  user.farm.fertilizer--; c.fertilized=(c.fertilized||0)+1; c.growth=Math.min(100,(c.growth||0)+35);
  replyx(`🧪 Plot ${p} fertilized!\n🌱 Growth +35% → ${c.growth}%\n🧪 Left: ${user.farm.fertilizer}`)
}},

{name:"farminfo",aliases:["farmstatus"],description:"Detailed farm info",run:async()=>{
  ensure(user); let f=user.farm;
  replyx(`🌾 FARM INFO\nLv.${f.level} • XP: ${fmt(f.xp)}\nPlots: ${Object.keys(f.crops).length}/${f.plots}\n🧪 Fert: ${f.fertilizer} • 🌿 Compost: ${f.compost}\n💧 Irrigation Lv.${f.irrigation}`)
}},

{name:"field",aliases:["fields"],description:"View field map",run:async()=>{
  ensure(user); let map=Object.entries(user.farm.crops).map(([k,v])=>`[${k}] ${CROPS[v.id].name} ${v.growth||0}%`).join("\n")||"Empty fields.";
  replyx(`🗺️ FIELD MAP\n${map}`)
}},

{name:"crop",aliases:["cropinfo"],description:"View single crop",run:async({args})=>{
  let id=findCrop(args[0]); if(!id) return replyx("❌ Crop not found.");
  let c=CROPS[id]; replyx(`🌾 ${c.name}\nRarity: ${c.rarity}\n🌱 Seed: ${c.seed}\n⏱️ Grow: ${c.grow}s\n💰 Sell: $${fmt(c.yield)}\n💵 Seed price: $${fmt(c.price)}`)
}},

{name:"crops",aliases:["croplist"],description:"List all crops",run:async()=>{
  replyx(`🌾 CROPS\n${Object.values(CROPS).map(c=>`• ${c.name} — ${c.rarity} — $${fmt(c.yield)}`).join("\n")}`)
}},

{name:"garden",aliases:["mygarden"],description:"Garden view",run:async()=>{ensure(user); replyx(`🌷 GARDEN\nCrops growing: ${Object.keys(user.farm.crops).length}\n${Object.values(user.farm.crops).map(c=>`• ${CROPS[c.id].name}`).join("\n")||"No crops."}`)}},

{name:"greenhouse",aliases:["gh"],description:"Upgrade greenhouse",run:async()=>{
  ensure(user); if(user.farm.greenhouse) return replyx("🏡 Greenhouse already built!");
  if(money(user)<100000) return replyx("💸 Need $100,000 for greenhouse.");
  setMoney(user,money(user)-100000); user.farm.greenhouse=1; user.farm.plots+=4;
  replyx(`🏡 Greenhouse built!\n🌱 +4 plots → ${user.farm.plots} total`)
}},

{name:"grow",aliases:["growth"],description:"Boost growth",run:async({args})=>{
  ensure(user); let p=args[0]||Object.keys(user.farm.crops)[0]; let c=user.farm.crops[p]; if(!c) return replyx("❌ No crop."); c.growth=Math.min(100,(c.growth||0)+15); replyx(`🌱 Growth boosted! Plot ${p}: ${c.growth}%`)
}},

{name:"replant",aliases:["replantcrop"],description:"Replant last harvested",run:async()=>{
  ensure(user); let last=user.farm.lastCrop; if(!last) return replyx("❌ No previous crop."); let id=last;
  if((user.inventory[CROPS[id].seed]||0)<1) return replyx(`Need ${CROPS[id].seed}`); if(Object.keys(user.farm.crops).length>=user.farm.plots) return replyx("Farm full");
  user.inventory[CROPS[id].seed]--; let plot=String(Date.now()).slice(-4); user.farm.crops[plot]={id,planted:now(),watered:0,fertilized:0,growth:0}; replyx(`🔄 Replanted ${CROPS[id].name} in ${plot}`)
}},

{name:"farmshop",aliases:["fshop"],description:"Farm shop",run:async()=>{
  replyx(`🌾 FARM SHOP\n━━━━━━━━━━━━\n${Object.entries(CROPS).map(([k,v])=>`🌱 ${v.seed} — $${fmt(v.price)} → ${v.name}`).join("\n")}\n━━━━━━━━━━━━\n🧪 fertilizer — $2,500\n🌿 compost — $1,000\n💧 irrigation upgrade — $50,000\n💡!buy <seed> or use!farmshop buy <item>`)
}},

{name:"farmsell",aliases:["fsell"],description:"Sell crops directly",run:async({args})=>{
  ensure(user); let id=findCrop(args[0]); let amt=Number(args[1])||1; if(!id) return replyx("Usage:!farmsell <crop> <amount>");
  let invKey=id; if((user.inventory[invKey]||0)<amt) return replyx("❌ Not enough crops in inventory.");
  user.inventory[invKey]-=amt; let gain=Math.floor(CROPS[id].yield*amt*0.8); setMoney(user,money(user)+gain); replyx(`💰 Sold ${amt}x ${CROPS[id].name} for $${fmt(gain)}`)
}},

{name:"farmupgrade",aliases:["fupgrade"],description:"Upgrade farm plots",run:async()=>{
  ensure(user); let cost=user.farm.plots*25000; if(money(user)<cost) return replyx(`💸 Need $${fmt(cost)} for next plot.`); setMoney(user,money(user)-cost); user.farm.plots++; xp(user,50); replyx(`⬆️ Farm upgraded! Plots: ${user.farm.plots}\n💸 Cost: $${fmt(cost)}`)
}},

{name:"farmlevel",aliases:["flevel"],description:"Farm level progress",run:async()=>{
  ensure(user); replyx(`⭐ FARM LEVEL\nLevel: ${user.farm.level}\nXP: ${fmt(user.farm.xp)}/${fmt(user.farm.level*500)}\nProgress: ${bar?bar(user.farm.xp%500,500,10):""} ${Math.floor((user.farm.xp%500)/5)}%`)
}},

{name:"farmxp",aliases:["fxp"],description:"Add farm XP",run:async()=>{
  ensure(user); user.farm.xp+=50; xp(user,10); replyx(`⭐ +50 Farm XP!\nTotal: ${fmt(user.farm.xp)}`)
}},

{name:"farmlog",aliases:["flog"],description:"View farm log",run:async()=>{
  ensure(user); replyx(user.farm.log.length?`📜 FARM LOG\n${user.farm.log.join("\n")}`:"📜 No farm activity yet.")
}},

{name:"compost",aliases:["compostbin"],description:"Make compost",run:async()=>{
  ensure(user); if((user.inventory.wheat||0)<5 && (user.inventory.corn||0)<3) return replyx("🌿 Need 5 wheat or 3 corn to compost.");
  if((user.inventory.wheat||0)>=5) user.inventory.wheat-=5; else user.inventory.corn-=3;
  user.farm.compost++; user.farm.fertilizer++; replyx(`🌿 Compost made!\n🧪 +1 Fertilizer\n🌿 Compost: ${user.farm.compost}`)
}},

{name:"irrigation",aliases:["irrigate"],description:"Upgrade irrigation",run:async()=>{
  ensure(user); let cost=(user.farm.irrigation+1)*50000; if(money(user)<cost) return replyx(`💸 Need $${fmt(cost)}`);
  setMoney(user,money(user)-cost); user.farm.irrigation++; replyx(`💧 Irrigation Lv.${user.farm.irrigation}!\n🌱 Crops grow ${user.farm.irrigation*10}% faster`)
}},

{name:"fertilizerbox",aliases:["fbox"],description:"Buy fertilizer",run:async({args})=>{
  ensure(user); let amt=Number(args[0])||1; let cost=amt*2500; if(money(user)<cost) return replyx(`💸 Need $${fmt(cost)}`); setMoney(user,money(user)-cost); user.farm.fertilizer+=amt; replyx(`🧪 Bought ${amt}x Fertilizer for $${fmt(cost)}`)
}},

{name:"cropinfo",aliases:["ci"],description:"Detailed crop growth",run:async({args})=>{
  ensure(user); let p=args[0]||Object.keys(user.farm.crops)[0]; let c=user.farm.crops[p]; if(!c) return replyx("❌ No crop."); let age=Math.floor((now()-c.planted)/1000); replyx(`🌾 Plot ${p}: ${CROPS[c.id].name}\n⏱️ Age: ${age}s / ${CROPS[c.id].grow}s\n💧 Water: ${c.watered||0}\n🧪 Fert: ${c.fertilized||0}\n📈 Growth: ${c.growth||0}%`)
}},

{name:"harvestall",aliases:["hvall"],description:"Harvest all ready crops",run:async()=>{
  ensure(user); let total=0, count=0; for(let [k,v] of Object.entries({...user.farm.crops})){ let age=(now()-v.planted)/1000; if(age>=CROPS[v.id].grow || (v.growth||0)>=100){ let bonus=1+(v.fertilized||0)*0.3; let r=Math.floor(CROPS[v.id].yield*bonus); total+=r; count++; delete user.farm.crops[k]; } } if(!count) return replyx("⏳ No crops ready yet."); setMoney(user,money(user)+total); xp(user,count*20); user.farm.xp+=count*25; user.farm.lastCrop=Object.values(CROPS)[0]?"wheat":"wheat"; replyx(`🌾 HARVEST ALL!\n🌱 ${count} crops\n💰 +$${fmt(total)}\n${fun?fun():""}`)
}},

{name:"farmquest",aliases:["fquest"],description:"Complete farm quest",run:async()=>{
  ensure(user); user.farm.quest=(user.farm.quest||0)+1; let rew=8000+user.farm.quest*800; setMoney(user,money(user)+rew); xp(user,30); user.farm.xp+=40; replyx(`🗺️ FARM QUEST #${user.farm.quest} COMPLETE!\n💰 +$${fmt(rew)}\n⭐ +40 Farm XP`)
}},

{name:"plantall",aliases:["pa"],description:"Plant all seeds you have",run:async()=>{
  ensure(user); let planted=0; for(let [seed,n] of Object.entries({...user.inventory})){ if(!seed.includes("seed")||n<=0) continue; let cropId=Object.keys(CROPS).find(k=>CROPS[k].seed===seed); if(!cropId) continue; while((user.inventory[seed]||0)>0 && Object.keys(user.farm.crops).length<user.farm.plots){ user.inventory[seed]--; let plot=String(Date.now()+planted).slice(-5); user.farm.crops[plot]={id:cropId,planted:now(),watered:0,fertilized:0,growth:0}; planted++; } } replyx(planted?`🌱 Planted ${planted} crops!\n🌾 Use!field to view`:"❌ No seeds or farm full.")
}},

{name:"waterall",aliases:["wa"],description:"Water all plots",run:async()=>{
  ensure(user); let c=0; for(let v of Object.values(user.farm.crops)){ v.watered=(v.watered||0)+1; v.growth=Math.min(100,(v.growth||0)+20); c++; } replyx(c?`💧 Watered ${c} plots! +20% growth each`:"❌ No crops.")
}},

{name:"fieldinfo",aliases:["finfo"],description:"Field statistics",run:async()=>{
  ensure(user); let total=Object.keys(user.farm.crops).length; let avg=total?Object.values(user.farm.crops).reduce((s,v)=>s+(v.growth||0),0)/total:0; replyx(`📊 FIELD STATS\n🌱 Planted: ${total}/${user.farm.plots}\n📈 Avg Growth: ${avg.toFixed(1)}%\n🧪 Fertilizer: ${user.farm.fertilizer}`)
}},

{name:"seedinfo",aliases:["si"],description:"Seed price list",run:async()=>{
  replyx(`🌱 SEED PRICES\n${Object.values(CROPS).map(c=>`• ${c.seed}: $${fmt(c.price)} → ${c.name}`).join("\n")}`)
}},

{name:"barn",aliases:["silo"],description:"View barn storage",run:async()=>{
  ensure(user); let barn=Object.entries(user.inventory).filter(([k])=>Object.keys(CROPS).includes(k)||k.includes("seed")); replyx(barn.length?`🏚️ BARN\n${barn.map(([k,n])=>`• ${k} ×${n}`).join("\n")}`:"🏚️ Barn empty.")
}},

{name:"farmstats",aliases:["fstats"],description:"Farm statistics",run:async()=>{
  ensure(user); let f=user.farm; replyx(`📊 FARM STATS\nLevel: ${f.level}\nXP: ${fmt(f.xp)}\nPlots: ${f.plots}\nHarvests: ${f.quest||0}\nCompost: ${f.compost}`)
}},

{name:"farmrank",aliases:["frank"],description:"Farm rank",run:async()=>{
  ensure(user); let rank=f=>f.level*100+f.xp; let list=[...users.values()].map(u=>({name:u.name||u.uid,r:u.farm?rank(u.farm):0})).sort((a,b)=>b.r-a.r).slice(0,10);
  replyx(`🏆 FARM RANK\n${list.map((x,i)=>`${i+1}. ${x.name} — Lv.${Math.floor(x.r/100)}`).join("\n")}`)
}},

{name:"farmlb",aliases:["farmleaderboard"],description:"Farm leaderboard",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,xp:u.farm?.xp||0})).sort((a,b)=>b.xp-a.xp).slice(0,10);
  replyx(`🌾 FARM LB\n${list.map((x,i)=>`${i+1}. ${x.name} — ${fmt(x.xp)} XP`).join("\n")}`)
}},

{name:"farmhelp",aliases:["fhelp"],description:"Farm help",run:async()=>{
  replyx(`🌾 EARTHBOUND HELP\n!farm •!plant •!water •!fertilize •!harvest\n!harvestall •!plantall •!waterall\n!farmshop •!farmupgrade •!farmlog\n!farmquest •!irrigation •!compost`)
}}
];
return cmds;
};
