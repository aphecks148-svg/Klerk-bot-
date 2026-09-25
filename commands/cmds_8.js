// commands/cmds_8.js
// 💀 UNDERWORLD — iKON-BOT
module.exports=({api,event,user,reply,users,profile,fun})=>{
const r=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
user.crime=user.crime||{rep:0,heat:0,success:0,fail:0,heists:0,crew:[],rank:1};
user.heists=user.heists||[];
user.safehouse=user.safehouse||{level:1};
user.blackmarket=user.blackmarket||{};
user.inventory=user.inventory||{};
const jobs={pickpocket:[500,1500,10],shoplift:[1000,3000,15],burglary:[3000,8000,25],smuggling:[5000,15000,35],bankjob:[10000,30000,50],armored:[15000,45000,70],casinojob:[25000,70000,90],vaultjob:[50000,150000,120]};
const crime=(id)=>jobs[String(id||"").toLowerCase()];
const cmds=[
{name:"crime",aliases:["crimes"],run:async()=>r("💀 UNDERWORLD\n!pickpocket !shoplift !burglary !smuggling\n!bankjob !armored !casinojob !vaultjob")},
{name:"pickpocket",aliases:["pocket"],run:async()=>doCrime("pickpocket")},
{name:"shoplift",aliases:["steal"],run:async()=>doCrime("shoplift")},
{name:"burglary",aliases:["burglar"],run:async()=>doCrime("burglary")},
{name:"smuggling",aliases:["smuggle"],run:async()=>doCrime("smuggling")},
{name:"bankjob",aliases:["bankrob"],run:async()=>doCrime("bankjob")},
{name:"armored",aliases:["armoredrob"],run:async()=>doCrime("armored")},
{name:"casinojob",aliases:["casinocrime"],run:async()=>doCrime("casinojob")},
{name:"vaultjob",aliases:["vaultrob"],run:async()=>doCrime("vaultjob")},
{name:"heist",aliases:["heistmenu"],run:async()=>r("💰 HEIST SYSTEM\n!planheist <target>\n!heistinfo\n!crew\n!joinheist\n!leaveheist\n!startheist\n!cancelheist")},
{name:"planheist",aliases:["plan"],run:async({args})=>{let target=args.join(" ")||"bank";user.heists.push({target,crew:[user.uid],status:"planned",created:Date.now()});r(`🗺️ HEIST PLANNED\n🎯 Target: ${target}\n👥 Crew: 1\nUse !joinheist to recruit.`)}},
{name:"heistinfo",aliases:["heiststatus"],run:async()=>{let h=user.heists[user.heists.length-1];r(h?`💀 HEIST\n🎯 ${h.target}\n👥 Crew: ${h.crew.length}\n📌 Status: ${h.status}`:"❌ No active heist.")}},
{name:"crew",aliases:["mycrew"],run:async()=>r(`👥 CREW\nMembers: ${user.crime.crew.length?user.crime.crew.join(", "):"No crew members"}\n⭐ Crime Rep: ${user.crime.rep}`)},
{name:"joinheist",aliases:["join"],run:async()=>{let h=user.heists[user.heists.length-1];if(!h)return r("❌ No heist available.");if(!h.crew.includes(user.uid))h.crew.push(user.uid);r(`🤝 Joined ${h.target} heist.\n👥 Crew: ${h.crew.length}`)}},
{name:"leaveheist",aliases:["leave"],run:async()=>{let h=user.heists[user.heists.length-1];if(!h)return r("❌ No active heist.");h.crew=h.crew.filter(x=>x!==user.uid);r("🚪 You left the heist.")}},
{name:"startheist",aliases:["executeheist"],run:async()=>{let h=user.heists[user.heists.length-1];if(!h)return r("❌ Plan a heist first.");if(h.crew.length<2)return r("👥 You need at least 2 crew members.");let win=Math.random()<.62;if(win){let cash=Math.floor((Math.random()*50000+25000)*h.crew.length);user.wallet+=cash;user.crime.success++;user.crime.heists++;user.crime.rep+=50;h.status="completed";r(`💰💀 HEIST SUCCESS!\n🎯 ${h.target}\n👥 Crew: ${h.crew.length}\n💵 Your cut: $${cash.toLocaleString()}\n⭐ Rep +50`)}else{user.crime.fail++;user.crime.heat+=2;h.status="failed";r("🚨 HEIST FAILED!\nThe crew was spotted. 🔥 Heat +2.")}}},
{name:"cancelheist",aliases:["abortheist"],run:async()=>{let h=user.heists[user.heists.length-1];if(!h)return r("❌ No active heist.");h.status="cancelled";r("🛑 Heist cancelled.")}},
{name:"crimeinfo",aliases:["underworld"],run:async()=>r(`💀 UNDERWORLD PROFILE\n⭐ Rep: ${user.crime.rep}\n🔥 Heat: ${user.crime.heat}\n🏆 Success: ${user.crime.success}\n💥 Failed: ${user.crime.fail}\n💰 Heists: ${user.crime.heists}\n👑 Rank: ${user.crime.rank}`)},
{name:"crimelevel",aliases:["crimerank"],run:async()=>{user.crime.rank=Math.max(1,Math.floor(user.crime.rep/100)+1);r(`💀 Crime Rank: ${user.crime.rank}\n⭐ Rep: ${user.crime.rep}`)}},
{name:"crimerep",aliases:["underrep"],run:async()=>r(`⭐ Crime Reputation: ${user.crime.rep}`)},
{name:"heat",aliases:["crimeheat"],run:async()=>r(`🔥 UNDERWORLD HEAT: ${user.crime.heat}\n🚨 Higher heat increases risk.`)},
{name:"coolheat",aliases:["laylow"],run:async()=>{if(user.crime.heat<=0)return r("😎 Heat is already clear.");user.crime.heat=Math.max(0,user.crime.heat-1);r("🕶️ You laid low and reduced heat by 1.")}},
{name:"blackmarket",aliases:["blackmarketshop"],run:async()=>r("🕶️ BLACK MARKET\n🔫 Lockpick — $5,000\n💣 Heist Gear — $15,000\n🛡️ Armor — $25,000\n📡 Scanner — $35,000\nUse !blackbuy <item>.")},
{name:"blackbuy",aliases:["bmBuy"],run:async({args})=>{let x=args.join(" ").toLowerCase();const items={lockpick:5000,"heist gear":15000,armor:25000,scanner:35000};let k=Object.keys(items).find(i=>x.includes(i));if(!k)return r("❌ Item not found.");if(user.wallet<items[k])return r("💸 Not enough cash.");user.wallet-=items[k];user.blackmarket[k]=(user.blackmarket[k]||0)+1;r(`🕶️ Purchased ${k} for $${items[k].toLocaleString()}.`)}},
{name:"safehouse",aliases:["hideout"],run:async()=>r(`🏠 SAFEHOUSE\nLevel: ${user.safehouse.level}\nUse !upgradehouse to improve protection.`)},
{name:"upgradehouse",aliases:["houseupgrade"],run:async()=>{let cost=user.safehouse.level*50000;if(user.wallet<cost)return r(`💸 Upgrade costs $${cost.toLocaleString()}.`);user.wallet-=cost;user.safehouse.level++;r(`🏠 Safehouse upgraded to Level ${user.safehouse.level}.`)}},
{name:"fence",aliases:["sellloot"],run:async()=>{let cash=Math.floor(Math.random()*12000)+3000;user.wallet+=cash;user.crime.rep+=10;r(`🕶️ LOOT FENCED\n💰 +$${cash.toLocaleString()}\n⭐ Rep +10`)}},
{name:"launder",aliases:["moneylaunder"],run:async()=>{let amount=Math.min(user.wallet,50000);if(amount<1000)return r("💸 You need at least $1,000.");let fee=Math.floor(amount*.1);user.wallet-=amount;user.bank=(user.bank||0)+amount-fee;r(`🧼 MONEY LAUNDERED\n💵 Processed: $${amount.toLocaleString()}\n💸 Fee: $${fee.toLocaleString()}`)}},
{name:"blackdeal",aliases:["deal"],run:async()=>{let cash=Math.floor(Math.random()*20000)+5000;user.wallet+=cash;user.crime.rep+=20;user.crime.heat++;r(`🤝 UNDERWORLD DEAL COMPLETE\n💰 +$${cash.toLocaleString()}\n⭐ Rep +20\n🔥 Heat +1`)}},
{name:"hit",aliases:["contract"],run:async()=>{let reward=Math.floor(Math.random()*30000)+10000;user.wallet+=reward;user.crime.rep+=30;user.crime.heat+=2;r(`🎯 CONTRACT COMPLETE\n💰 +$${reward.toLocaleString()}\n⭐ Rep +30\n🔥 Heat +2`)}},
{name:"assassin",aliases:["assassination"],run:async()=>{let success=Math.random()<.55;if(success){let reward=Math.floor(Math.random()*60000)+20000;user.wallet+=reward;user.crime.rep+=60;r(`🗡️ CONTRACT SUCCESS\n💰 +$${reward.toLocaleString()}\n⭐ Rep +60`)}else{user.crime.heat+=3;user.crime.fail++;r("🚨 Contract failed. 🔥 Heat +3.")}}},
{name:"crimejobs",aliases:["underjobs"],run:async()=>r("💀 CRIME JOBS\n"+Object.entries(jobs).map(([k,v])=>`• ${k} — $${v[0].toLocaleString()}-$${v[1].toLocaleString()} | ⭐${v[2]}`).join("\n"))},
{name:"crimeleaderboard",aliases:["crimeLB"],run:async()=>{let a=[...users.values()].sort((x,y)=>(y.crime?.rep||0)-(x.crime?.rep||0)).slice(0,10);r("💀 UNDERWORLD LEADERBOARD\n"+a.map((u,i)=>`${i+1}. ${u.name||u.uid} — ⭐${u.crime?.rep||0}`).join("\n"))}},
{name:"heistleaderboard",aliases:["heistLB"],run:async()=>{let a=[...users.values()].sort((x,y)=>(y.crime?.heists||0)-(x.crime?.heists||0)).slice(0,10);r("💰 HEIST LEADERBOARD\n"+a.map((u,i)=>`${i+1}. ${u.name||u.uid} — 💀${u.crime?.heists||0}`).join("\n"))}},
{name:"crimehistory",aliases:["crimeLog"],run:async()=>r(`📜 CRIME HISTORY\nSuccessful: ${user.crime.success}\nFailed: ${user.crime.fail}\nHeists: ${user.crime.heists}`)},
{name:"underworldrank",aliases:["uwrank"],run:async()=>{user.crime.rank=Math.max(1,Math.floor(user.crime.rep/100)+1);r(`👑 UNDERWORLD RANK ${user.crime.rank}\n⭐ ${user.crime.rep} reputation`)}},
{name:"criminal",aliases:["criminalstatus"],run:async()=>r(`🕶️ CRIMINAL STATUS\nRank: ${user.crime.rank}\nRep: ${user.crime.rep}\nHeat: ${user.crime.heat}\nHeists: ${user.crime.heists}`)},
{name:"crimecooldown",aliases:["crimecd"],run:async()=>r("⏱️ Crime commands use the central bot cooldown system.")},
{name:"underhelp",aliases:["crimehelp"],run:async()=>r("💀 UNDERWORLD\n!crime !crimejobs !pickpocket !burglary !bankjob\n!heist !planheist !joinheist !startheist\n!blackmarket !fence !launder !hit !assassin\n!safehouse !coolheat !crimeleaderboard")},
{name:"underworldreset",aliases:["resetcrime"],run:async()=>{user.crime={rep:0,heat:0,success:0,fail:0,heists:0,crew:[],rank:1};user.heists=[];r("🔄 Underworld progress reset.")}}
];
async function doCrime(id){let j=crime(id);if(!j)return r("❌ Crime unavailable.");let risk=Math.min(.85,.35+(user.crime.heat*.05));if(Math.random()>risk){let cash=Math.floor(Math.random()*(j[1]-j[0]+1))+j[0];user.wallet+=cash;user.crime.success++;user.crime.rep+=j[2];user.crime.heat++;r(`💀 ${id.toUpperCase()} SUCCESS!\n💰 +$${cash.toLocaleString()}\n⭐ Rep +${j[2]}\n🔥 Heat +1`)}else{user.crime.fail++;user.crime.heat+=2;user.crime.wanted=Math.min(5,(user.crime.wanted||0)+1);r(`🚨 ${id.toUpperCase()} FAILED!\n🔥 Heat +2\n🚔 Police are searching for you.`)}}
return cmds;
};
