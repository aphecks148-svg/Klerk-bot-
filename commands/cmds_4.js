// commands/cmds_4.js
// 🌾 EARTHBOUND — iKON-BOT
module.exports=({api,event,user,reply,users,profile,fun})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const xp=(u,n=5)=>{u.xp=(u.xp||0)+n;};
const ensure=u=>{u.farm=u.farm||{level:1,xp:0,plots:4,crops:{},water:100};u.inventory=u.inventory||{};u.farms=u.farms||{};};
const crops={
wheat:{name:"Wheat",seed:"wheat_seed",time:30,value:500,xp:10},
corn:{name:"Corn",seed:"corn_seed",time:45,value:800,xp:15},
rice:{name:"Rice",seed:"rice_seed",time:60,value:1200,xp:20},
tomato:{name:"Tomato",seed:"tomato_seed",time:50,value:1000,xp:18},
potato:{name:"Potato",seed:"potato_seed",time:40,value:700,xp:14},
carrot:{name:"Carrot",seed:"carrot_seed",time:35,value:650,xp:12},
pumpkin:{name:"Pumpkin",seed:"pumpkin_seed",time:90,value:2500,xp:30},
strawberry:{name:"Strawberry",seed:"strawberry_seed",time:75,value:3000,xp:35},
blueberry:{name:"Blueberry",seed:"blueberry_seed",time:80,value:3500,xp:38},
golden_apple:{name:"Golden Apple",seed:"golden_apple_seed",time:150,value:15000,xp:100}
};
const fmt=n=>Number(n||0).toLocaleString();
const find=q=>{q=String(q||"").toLowerCase().replace(/[_-]/g," ");let id=Object.keys(crops).find(k=>k===q.replace(/ /g,"_"));if(id)return id;return Object.keys(crops).find(k=>crops[k].name.toLowerCase()===q)||Object.keys(crops).find(k=>k.includes(q.replace(/ /g,"_")))};
const add=(u,id,n=1)=>{u.inventory[id]=(u.inventory[id]||0)+n};
const rem=(u,id,n=1)=>{if((u.inventory[id]||0)<n)return false;u.inventory[id]-=n;if(u.inventory[id]<=0)delete u.inventory[id];return true};
const ready=(p)=>Date.now()>=p.readyAt;
const cmds=[
{name:"farm",aliases:["myfarm"],description:"View your farm",run:async()=>{ensure(user);let f=user.farm;replyx(`🌾 EARTHBOUND\n━━━━━━━━━━━━\n👤 ${user.name||user.uid}\n⭐ Farm Lv.${f.level}\n📐 Plots: ${f.plots}\n💧 Water: ${f.water}/100\n🌱 Growing: ${Object.keys(f.crops).length}\n⭐ Farm XP: ${f.xp}`)}},
{name:"plant",aliases:["plantseed"],description:"Plant a seed",run:async({args})=>{ensure(user);let id=find(args.join(" "));if(!id)return replyx("❌ Crop not found.");let c=crops[id],f=user.farm;if(Object.keys(f.crops).length>=f.plots)return replyx("🌾 All plots are occupied.");if(!rem(user,c.seed,1))return replyx(`❌ Need 1 ${c.name} Seed.`);let plot="plot"+(Object.keys(f.crops).length+1);f.crops[plot]={crop:id,plantedAt:Date.now(),readyAt:Date.now()+c.time*1000,watered:false,fertilized:false};replyx(`🌱 Planted ${c.name}.\n📍 ${plot}\n⏳ Ready in ${c.time}s.`)}},
{name:"seeds",aliases:["seedshop"],description:"View available seeds",run:async()=>replyx(`🌱 SEED LIST\n${Object.values(crops).map(c=>`• ${c.name} Seed — $${fmt(Math.floor(c.value*.25))}`).join("\n")}`)},
{name:"water",aliases:["waterfarm"],description:"Water crops",run:async()=>{ensure(user);let f=user.farm;if(f.water<10)return replyx("💧 Not enough water.");let n=0;for(let p of Object.values(f.crops)){if(!p.watered){p.watered=true;p.readyAt=Math.max(Date.now(),p.readyAt-5000);n++}}f.water=Math.max(0,f.water-n*10);replyx(`💧 Watered ${n} crop(s).\n💧 Water: ${f.water}/100`)}},
{name:"harvest",aliases:["harvestcrop"],description:"Harvest a ready crop",run:async({args})=>{ensure(user);let f=user.farm,plot=args[0]||Object.keys(f.crops)[0];let p=f.crops[plot];if(!p)return replyx("❌ Plot not found.");if(!ready(p))return replyx(`⏳ ${crops[p.crop].name} is not ready yet.`);let c=crops[p.crop],qty=p.fertilized?2:1;add(user,p.crop,qty);f.xp+=c.xp*qty;delete f.crops[plot];xp(user,c.xp);replyx(`🌾 HARVEST!\n${c.name} ×${qty}\n⭐ Farm XP +${c.xp*qty}`)}},
{name:"fertilize",aliases:["fertilizer"],description:"Speed up crops",run:async({args})=>{ensure(user);let f=user.farm,plot=args[0]||Object.keys(f.crops)[0],p=f.crops[plot];if(!p)return replyx("❌ Plot not found.");if(!rem(user,"fertilizer",1))return replyx("🧪 Need Fertilizer.");p.fertilized=true;p.readyAt=Math.max(Date.now(),p.readyAt-15000);replyx(`🧪 ${crops[p.crop].name} fertilized!\n⏳ Growth accelerated.`)}},
{name:"farminfo",aliases:["farmstatus"],description:"Detailed farm information",run:async()=>{ensure(user);let f=user.farm;replyx(`🌾 FARM INFO\nLevel: ${f.level}\nXP: ${f.xp}\nPlots: ${f.plots}\nWater: ${f.water}/100\nGrowing: ${Object.keys(f.crops).length}`)}},
{name:"field",aliases:["fields"],description:"View farm plots",run:async()=>{ensure(user);let f=user.farm;let rows=[];for(let i=1;i<=f.plots;i++){let p=f.crops["plot"+i];rows.push(p?`🌱 Plot ${i}: ${crops[p.crop].name} ${ready(p)?"✅ READY":"⏳ GROWING"}`:`⬜ Plot ${i}: Empty`)}replyx(`🌾 FIELD\n${rows.join("\n")}`)}},
{name:"crop",aliases:["cropinfo"],description:"View crop information",run:async({args})=>{let id=find(args.join(" "));if(!id)return replyx("❌ Crop not found.");let c=crops[id];replyx(`🌱 ${c.name}\n⏳ Growth: ${c.time}s\n💰 Value: $${fmt(c.value)}\n⭐ XP: ${c.xp}\n🌰 Seed: ${c.seed}`)}},
{name:"crops",aliases:["allcrops"],description:"List crops",run:async()=>replyx(`🌱 CROPS\n${Object.values(crops).map(c=>`${c.name} • $${fmt(c.value)} • ${c.time}s`).join("\n")}`)},
{name:"garden",aliases:["gardening"],description:"View garden",run:async()=>{ensure(user);let n=Object.values(user.inventory).filter((_,i)=>i>=0).length;replyx(`🌺 GARDEN\n🌱 Crop types available: ${Object.keys(crops).length}\n🎒 Stored item types: ${n}`)}},
{name:"greenhouse",aliases:["house"],description:"View greenhouse",run:async()=>{ensure(user);user.greenhouse=user.greenhouse||{level:0};replyx(`🏡 GREENHOUSE\nLevel: ${user.greenhouse.level}\n🌡️ Growth bonus: ${user.greenhouse.level*5}%\nUpgrade with !farmupgrade.`)}},
{name:"grow",aliases:["growth"],description:"Check crop growth",run:async()=>{ensure(user);let a=Object.entries(user.farm.crops);replyx(a.length?`🌱 GROWTH\n${a.map(([k,p])=>`${k}: ${crops[p.crop].name} • ${ready(p)?"READY":"GROWING"}`).join("\n")}`:"🌾 No crops growing.")}},
{name:"replant",aliases:["replantall"],description:"Plant available seeds",run:async()=>{ensure(user);let f=user.farm,n=0;for(let id of Object.keys(crops)){while(f.crops&&Object.keys(f.crops).length<f.plots&&(user.inventory[crops[id].seed]||0)>0){user.inventory[crops[id].seed]--;let plot="plot"+(Object.keys(f.crops).length+1);f.crops[plot]={crop:id,plantedAt:Date.now(),readyAt:Date.now()+crops[id].time*1000,watered:false,fertilized:false};n++}}replyx(`🌱 Replant complete.\nPlots planted: ${n}`)}},
{name:"farmsell",aliases:["sellcrop"],description:"Sell harvested crops",run:async({args})=>{ensure(user);let id=find(args.slice(0,-1).join(" ")||args.join(" ")),n=Number(args.at(-1))||1;if(!id)return replyx("❌ Crop not found.");if(!rem(user,id,n))return replyx("❌ Not enough harvested crops.");let gain=crops[id].value*n;user.wallet=(user.wallet||0)+gain;replyx(`💰 Sold ${n}x ${crops[id].name} for $${fmt(gain)}.`)}},
{name:"farmshop",aliases:["farmstore"],description:"Buy farm supplies",run:async()=>replyx(`🛒 FARM SHOP\n• Fertilizer — $1,000\n• Water Tank — $5,000\n• Wheat Seed — $125\n• Corn Seed — $200\n• Rice Seed — $300\nBuy seeds with !buy <item>.`)},
{name:"farmupgrade",aliases:["upgradefarm"],description:"Upgrade farm",run:async()=>{ensure(user);let f=user.farm,cost=f.level*50000;if((user.wallet||0)<cost)return replyx(`💸 Need $${fmt(cost)}.`);user.wallet-=cost;f.level++;f.plots+=2;f.water=100;replyx(`🏡 FARM UPGRADED!\n⭐ Level ${f.level}\n📐 Plots: ${f.plots}\n💸 -$${fmt(cost)}`)}},
{name:"farmlevel",aliases:["flevel"],description:"View farm level",run:async()=>{ensure(user);let f=user.farm;replyx(`⭐ FARM LEVEL ${f.level}\nXP: ${f.xp}/${f.level*500}\nPlots: ${f.plots}`)}},
{name:"farmxp",aliases:["fxp"],description:"View farm XP",run:async()=>{ensure(user);replyx(`⭐ Farm XP: ${fmt(user.farm.xp)}`)}},
{name:"farmlog",aliases:["farmhistory"],description:"View farm activity",run:async()=>{user.farmLog=user.farmLog||[];replyx(user.farmLog.length?`📜 FARM LOG\n${user.farmLog.slice(-10).reverse().join("\n")}`:"📜 No farm activity yet.")}},
{name:"compost",aliases:["makecompost"],description:"Create compost",run:async()=>{ensure(user);if((user.inventory.wheat||0)<2)return replyx("🌱 Need 2 Wheat.");rem(user,"wheat",2);add(user,"compost",1);replyx("♻️ Created 1 Compost.")}},
{name:"irrigation",aliases:["irrigate"],description:"Restore farm water",run:async()=>{ensure(user);if((user.inventory.water_tank||0)<1)return replyx("💧 Need a Water Tank.");rem(user,"water_tank",1);user.farm.water=100;replyx("💧 Irrigation system restored farm water to 100.")}},
{name:"fertilizerbox",aliases:["fertilizers"],description:"View fertilizer supplies",run:async()=>{ensure(user);replyx(`🧪 FERTILIZER\nOwned: ${user.inventory.fertilizer||0}\nEffect: speeds crop growth by 15 seconds.`)}},
{name:"harvestall",aliases:["allharvest"],description:"Harvest all ready crops",run:async()=>{ensure(user);let f=user.farm,total=0,count=0;for(let [plot,p] of Object.entries(f.crops)){if(!ready(p))continue;let c=crops[p.crop],qty=p.fertilized?2:1;add(user,p.crop,qty);total+=c.xp*qty;count+=qty;delete f.crops[plot]}f.xp+=total;xp(user,total);replyx(`🌾 HARVEST ALL\nCrops: ${count}\n⭐ Farm XP +${total}`)}},
{name:"farmquest",aliases:["farmquests"],description:"Complete a farming quest",run:async()=>{ensure(user);user.farmQuest=(user.farmQuest||0)+1;let reward=5000+user.farmQuest*1000;user.wallet=(user.wallet||0)+reward;user.farm.xp+=50;replyx(`📜 FARM QUEST COMPLETE!\n💰 +$${fmt(reward)}\n⭐ +50 Farm XP`)}},
{name:"seedbuy",aliases:["buyseed"],description:"Buy seeds directly",run:async({args})=>{ensure(user);let id=find(args.join(" "));if(!id)return replyx("❌ Seed not found.");let c=crops[id],cost=Math.floor(c.value*.25);if((user.wallet||0)<cost)return replyx(`💸 Need $${fmt(cost)}.`);user.wallet-=cost;add(user,c.seed,1);replyx(`🌱 Bought 1 ${c.name} Seed for $${fmt(cost)}.`)}},
{name:"seedcount",aliases:["seedinventory"],description:"Count seeds",run:async()=>{ensure(user);let a=Object.values(crops).map(c=>`${c.name}: ${user.inventory[c.seed]||0}`);replyx(`🌰 SEED INVENTORY\n${a.join("\n")}`)}},
{name:"cropvalue",aliases:["farmvalue"],description:"Calculate harvested crop value",run:async()=>{ensure(user);let total=0;for(let [id,n] of Object.entries(user.inventory))if(crops[id])total+=crops[id].value*n;replyx(`💰 Harvest value: $${fmt(total)}`)}},
{name:"farmpower",aliases:["farmrank"],description:"View farm production power",run:async()=>{ensure(user);let f=user.farm,p=f.level*f.plots*100+f.xp;replyx(`🌾 FARM POWER: ${fmt(p)}\n⭐ Level ${f.level}\n📐 ${f.plots} plots`)}},
{name:"farmrank",aliases:["farmlb"],description:"Farm leaderboard",run:async()=>{let list=[...users.values()].map(u=>{ensure(u);return{name:u.name||u.uid,p:u.farm.level*u.farm.plots*100+u.farm.xp}}).sort((a,b)=>b.p-a.p).slice(0,10);replyx(`🏆 FARM LEADERBOARD\n${list.map((x,i)=>`${i+1}. ${x.name} — ${fmt(x.p)}`).join("\n")}`)}},
{name:"farmcollect",aliases:["collectfarm"],description:"Collect farm earnings",run:async()=>{ensure(user);let total=0;for(let [id,n] of Object.entries(user.inventory))if(crops[id])total+=Math.floor(crops[id].value*n*.1);user.wallet=(user.wallet||0)+total;replyx(`💰 Farm bonus collected: $${fmt(total)}`)}},
{name:"farmstatus",aliases:["fstatus"],description:"Show farm status",run:async()=>{ensure(user);let f=user.farm;replyx(`🌾 STATUS\n⭐ Lv.${f.level}\n📐 Plots ${f.plots}\n💧 Water ${f.water}/100\n🌱 Growing ${Object.keys(f.crops).length}`)}},
{name:"farmhelp",aliases:["farmcommands"],description:"Farming command help",run:async()=>replyx("🌾 EARTHBOUND\n!farm • !plant • !seeds • !water • !harvest • !fertilize • !field • !crop • !crops • !farmupgrade • !farmsell • !farmquest • !harvestall")}
];
return cmds;
};
