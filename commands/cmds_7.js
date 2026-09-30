// commands/cmds_7.js
// 🚘 STREETKINGS — iKON-BOT
module.exports=({api,event,user,reply,users,profile,fun})=>{
const r=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID),a=(t,c)=>({name:t,aliases:c?.split(",")||[],run:async({args=[]})=>r(t+" system: "+(args.join(" ")||"ready"))});
user.cars=user.cars||{};user.garage=user.garage||[];user.driving=user.driving||{level:1,xp:0,wins:0,losses:0};user.gta=user.gta||{cash:0,rep:0,wanted:0,heat:0};user.weapons=user.weapons||{};user.properties=user.properties||{};
const cars={civic:["Honda Civic",25000,70],supra:["Toyota Supra",65000,90],gtr:["Nissan GTR",150000,110],r8:["Audi R8",220000,120],lambo:["Lamborghini Huracan",300000,140],ferrari:["Ferrari 488",350000,150],porsche:["Porsche 911",180000,130],mustang:["Ford Mustang",85000,100],bmw:["BMW M4",95000,105],bugatti:["Bugatti Chiron",2500000,220]};
const car=(id)=>cars[String(id||"").toLowerCase()];
const owned=()=>Object.keys(user.cars).filter(k=>cars[k]);
const cmds=[
{name:"garage",aliases:["cars"],run:async()=>r("🚘 GARAGE\n"+(owned().length?owned().map(k=>`• ${cars[k][0]} ⚡${cars[k][2]}`).join("\n"):"Empty garage.") )},
{name:"carshop",aliases:["dealership"],run:async()=>r("🚘 STREETKINGS DEALERSHIP\n"+Object.entries(cars).map(([k,v])=>`• ${k} — ${v[0]} | $${v[1].toLocaleString()} | ⚡${v[2]}`).join("\n"))},
{name:"buycar",aliases:["carbuy"],run:async({args})=>{let c=car(args[0]);if(!c)return r("❌ Choose a car: "+Object.keys(cars).join(", "));if(user.wallet<c[1])return r(`💸 You need $${(c[1]-user.wallet).toLocaleString()} more.`);user.wallet-=c[1];user.cars[args[0].toLowerCase()]=1;r(`🚘🔥 You bought a ${c[0]} for $${c[1].toLocaleString()}!`)}},
{name:"sellcar",aliases:["carsell"],run:async({args})=>{let id=String(args[0]||"").toLowerCase(),c=car(id);if(!c||!user.cars[id])return r("❌ You don't own that car.");let v=Math.floor(c[1]*.7);delete user.cars[id];user.wallet+=v;r(`💰 Sold ${c[0]} for $${v.toLocaleString()}.`)}},
{name:"carinfo",aliases:["vehicleinfo"],run:async({args})=>{let c=car(args[0]);r(c?`🚘 ${c[0]}\n💵 $${c[1].toLocaleString()}\n⚡ Speed: ${c[2]}`:"❌ Car not found.")}},
{name:"drive",aliases:["driving"],run:async()=>{let o=owned();if(!o.length)return r("🚘 Buy a car first with !buycar <car>.");let k=o[Math.floor(Math.random()*o.length)],c=cars[k],cash=Math.floor(Math.random()*5000)+1000;user.wallet+=cash;user.driving.xp+=20;user.gta.rep+=5;r(`🏁 ${c[0]} hit the streets!\n💰 Earned $${cash.toLocaleString()}\n⭐ Driving XP +20`)}},
{name:"race",aliases:["streetrace"],run:async()=>{let o=owned();if(!o.length)return r("🚘 You need a car.");let c=cars[o[0]],win=Math.random()<.6;user.driving[win?"wins":"losses"]++;let cash=win?Math.floor(c[1]*.08):0;if(win)user.wallet+=cash;r(win?`🏆 STREET RACE WON!\n🚘 ${c[0]}\n💰 +$${cash.toLocaleString()}`:`💥 Race lost. Your ${c[0]} needs tuning.`)}},
{name:"raceinfo",aliases:["racehelp"],run:async()=>r("🏁 STREET RACING\n!race • !drive • !tune • !upgradecar\n!racerank • !carinfo <car>")},
{name:"tune",aliases:["tuning"],run:async()=>{let o=owned();if(!o.length)return r("❌ Buy a car first.");let cost=15000;if(user.wallet<cost)return r("💸 Tuning costs $15,000.");user.wallet-=cost;user.driving.xp+=50;r("🔧 Car tuned! ⚡ Performance increased.")}},
{name:"upgradecar",aliases:["carupgrade"],run:async()=>{let o=owned();if(!o.length)return r("❌ Buy a car first.");let cost=25000;if(user.wallet<cost)return r("💸 Upgrade costs $25,000.");user.wallet-=cost;user.driving.xp+=100;r("⚙️ Engine upgrade installed! 🚘🔥")}},
{name:"racerank",aliases:["racingrank"],run:async()=>{let arr=[...users.values()].sort((a,b)=>(b.driving?.wins||0)-(a.driving?.wins||0)).slice(0,10);r("🏁 STREET RACE RANK\n"+arr.map((u,i)=>`${i+1}. ${u.name||u.uid} — 🏆${u.driving?.wins||0}`).join("\n"))}},
{name:"drivelevel",aliases:["driverlevel"],run:async()=>r(`🚘 Driving Level: ${user.driving.level}\n⭐ XP: ${user.driving.xp}`)},
{name:"drivexp",aliases:["driverxp"],run:async()=>r(`⭐ Driving XP: ${user.driving.xp}`)},
{name:"wanted",aliases:["wantedlevel"],run:async()=>r(`🚨 WANTED LEVEL: ${user.gta.wanted}/5\n🔥 Heat: ${user.gta.heat}`)},
{name:"heat",aliases:["gtaheat"],run:async()=>r(`🔥 GTA HEAT: ${user.gta.heat}\n🚨 Wanted: ${user.gta.wanted}/5`)},
{name:"rep",aliases:["gtarep"],run:async()=>r(`⭐ STREET REP: ${user.gta.rep}`)},
{name:"streetstats",aliases:["gtastats"],run:async()=>r(`🚘 STREETKINGS\n💰 Cash: $${user.gta.cash.toLocaleString()}\n⭐ Rep: ${user.gta.rep}\n🚨 Wanted: ${user.gta.wanted}\n🔥 Heat: ${user.gta.heat}\n🏁 Wins: ${user.driving.wins}\n💥 Losses: ${user.driving.losses}`)},
{name:"heistcar",aliases:["carheist"],run:async()=>{let cash=Math.floor(Math.random()*25000)+5000;user.gta.cash+=cash;user.gta.heat++;user.gta.wanted=Math.min(5,user.gta.wanted+1);r(`💀 VEHICLE HEIST SUCCESS!\n💰 GTA Cash +$${cash.toLocaleString()}\n🚨 Wanted +1`) }},
{name:"carjack",aliases:["jackcar"],run:async()=>{let cash=Math.floor(Math.random()*10000)+2000;user.gta.cash+=cash;user.gta.heat++;r(`🚘💨 Carjack complete!\n💰 GTA Cash +$${cash.toLocaleString()}\n🔥 Heat +1`) }},
{name:"robbery",aliases:["rob"],run:async()=>{let cash=Math.floor(Math.random()*15000)+3000;user.gta.cash+=cash;user.gta.heat+=2;user.gta.wanted=Math.min(5,user.gta.wanted+1);r(`💰 ROBBERY COMPLETE!\n+$${cash.toLocaleString()} GTA Cash\n🚨 Wanted: ${user.gta.wanted}/5`)}},
{name:"police",aliases:["cops"],run:async()=>r(`🚔 POLICE STATUS\n🚨 Wanted: ${user.gta.wanted}/5\n🔥 Heat: ${user.gta.heat}\nUse !escape or !bribe.`)},
{name:"escape",aliases:["evade"],run:async()=>{if(!user.gta.wanted)return r("😎 You're not wanted.");let ok=Math.random()<.55;if(ok){user.gta.wanted=0;user.gta.heat=Math.max(0,user.gta.heat-3);r("🏃💨 You escaped the police!")}else{user.gta.wanted=Math.min(5,user.gta.wanted+1);r("🚨 Escape failed! Wanted level increased.")}}},
{name:"bribe",aliases:["paycops"],run:async()=>{let cost=user.gta.wanted*10000;if(!user.gta.wanted)return r("😎 No wanted level.");if(user.wallet<cost)return r(`💸 Police bribe costs $${cost.toLocaleString()}.`);user.wallet-=cost;user.gta.wanted=0;user.gta.heat=0;r("💵 Police bribed. Wanted level cleared.")}},
{name:"streetjob",aliases:["driverjob"],run:async()=>{let cash=Math.floor(Math.random()*8000)+2000;user.wallet+=cash;user.driving.xp+=30;r(`🚕 Street job complete!\n💰 +$${cash.toLocaleString()}\n⭐ Driving XP +30`)}},
{name:"delivery",aliases:["deliver"],run:async()=>{let cash=Math.floor(Math.random()*6000)+1500;user.wallet+=cash;user.driving.xp+=15;r(`📦 Delivery complete!\n💰 +$${cash.toLocaleString()}`)}},
{name:"garageupgrade",aliases:["upgradegarage"],run:async()=>{let cost=50000;if(user.wallet<cost)return r("💸 Garage upgrade costs $50,000.");user.wallet-=cost;user.garage.push({level:user.garage.length+2});r("🏢 Garage upgraded! More vehicles can be stored.")}},
{name:"garageinfo",aliases:["garagelevel"],run:async()=>r(`🏢 Garage Slots: ${5+user.garage.length}\n🚘 Cars Owned: ${owned().length}`)},
{name:"cartrade",aliases:["tradecar"],run:async()=>r("🤝 Car trading is available between players through the central trade system.")},
{name:"carlist",aliases:["vehicles"],run:async()=>r("🚘 OWNED VEHICLES\n"+(owned().length?owned().map(k=>`• ${cars[k][0]}`).join("\n"):"None"))},
{name:"streetmarket",aliases:["carmarket"],run:async()=>r("🏪 STREET MARKET\nBuy vehicles with !buycar <name>\nSell with !sellcar <name>.")},
{name:"gta",aliases:["gtamenu"],run:async()=>r("💀 GTA SYSTEM\n!drive !race !carjack !robbery !heistcar\n!wanted !escape !bribe !rep !streetstats")},
{name:"streetking",aliases:["streetboss"],run:async()=>{let o=owned();r(`👑 STREET KING\n🚘 Cars: ${o.length}\n🏆 Race Wins: ${user.driving.wins}\n⭐ Rep: ${user.gta.rep}`)}},
{name:"carpower",aliases:["speed"],run:async()=>{let o=owned();if(!o.length)return r("❌ No vehicle.");let p=Math.max(...o.map(k=>cars[k][2]));r(`⚡ BEST VEHICLE POWER: ${p}`)}},
{name:"carcollection",aliases:["carscollection"],run:async()=>r(`🚘 Collection: ${owned().length}/${Object.keys(cars).length}\n${owned().map(k=>`• ${cars[k][0]}`).join("\n")||"Empty"}`)},
{name:"streethelp",aliases:["carhelp"],run:async()=>r("🚘 STREETKINGS\n!garage !carshop !buycar !sellcar !drive !race !tune !upgradecar\n!wanted !escape !bribe !robbery !carjack !racerank !streetstats")},
{name:"streetcash",aliases:["gtacash"],run:async()=>r(`💵 GTA CASH: $${user.gta.cash.toLocaleString()}`)},
{name:"streetreset",aliases:["resetgta"],run:async()=>{user.gta={cash:0,rep:0,wanted:0,heat:0};user.driving={level:1,xp:0,wins:0,losses:0};r("🔄 Street progress reset.")}}
];
return cmds;
};
