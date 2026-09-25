// commands/cmds_9.js // 🎰 CASINO & GAMBLE — iKON-BOT
module.exports=({api,event,user,reply,users,profile,fun})=>{
const r=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
user.crime=user.crime||{rep:0,heat:0,success:0,fail:0,heists:0,crew:[],rank:1};
user.heists=user.heists||[];
user.safehouse=user.safehouse||{level:1};
user.blackmarket=user.blackmarket||{};
user.inventory=user.inventory||{};
user.casino=user.casino||{wins:0,loss:0,streak:0,highscore:0};
user.wallet=user.wallet||0;
const jobs={casino:[100,5000,10],gamble:[100,10000,15],coinflip:[50,2000,10],dice:[100,3000,15],slots:[200,8000,20],roulette:[500,15000,25],blackjack:[1000,20000,30],poker:[1000,25000,35],baccarat:[1500,30000,40]};
const crime=(id)=>jobs[String(id||"").toLowerCase()];
const cmds=[
{name:"casino",aliases:["casinomenu"],run:async()=>r("🎰 CASINO & GAMBLE\n!gamble!bet!risk!cashout\n!coinflip!dice!slots!roulette\n!blackjack!poker!baccarat!baccaratplus\n!rps!guess!lottery!lotto!wheel!spin!jackpot\n!keno!crash!streak!highscore!tournament")},
{name:"gamble",aliases:["betgame"],run:async()=>doCrime("gamble")},
{name:"bet",aliases:["wager"],run:async()=>doCrime("gamble")},
{name:"risk",aliases:["highrisk"],run:async()=>doCrime("gamble")},
{name:"cashout",aliases:["cash"],run:async()=>r(`💰 CASHOUT\n💵 Wallet: $${user.wallet.toLocaleString()}\n🏦 Bank: $${(user.bank||0).toLocaleString()}\n🔥 Streak: ${user.casino.streak}`)},
{name:"coinflip",aliases:["cf","flip"],run:async()=>doCrime("coinflip")},
{name:"dice",aliases:["roll"],run:async()=>doCrime("dice")},
{name:"slots",aliases:["slot"],run:async()=>doCrime("slots")},
{name:"roulette",aliases:["roul"],run:async()=>doCrime("roulette")},
{name:"blackjack",aliases:["bj","21"],run:async()=>doCrime("blackjack")},
{name:"poker",run:async()=>doCrime("poker")},
{name:"baccarat",aliases:["bacc"],run:async()=>doCrime("baccarat")},
{name:"baccaratplus",aliases:["baccplus"],run:async()=>doCrime("baccarat")},
{name:"rps",aliases:["rockpaper"],run:async({args})=>{let p=(args[0]||"").toLowerCase();let o=["rock","paper","scissors"][Math.floor(Math.random()*3)];if(!p)return r(`✂️ RPS\n${o} - Choose rock/paper/scissors`);let win=(p==="rock"&&o==="scissors")||(p==="paper"&&o==="rock")||(p==="scissors"&&o==="paper");if(p===o)r(`✂️ RPS\nYou: ${p} | Bot: ${o}\n🤝 Draw!`);else if(win){user.wallet+=500;user.casino.wins++;r(`✂️ RPS\nYou: ${p} | Bot: ${o}\n✅ You win +$500`)}else{user.casino.loss++;r(`✂️ RPS\nYou: ${p} | Bot: ${o}\n❌ You lost`)}}},
{name:"guess",aliases:["guessnumber"],run:async({args})=>{let n=Math.floor(Math.random()*10)+1;let g=parseInt(args[0]);if(!g)return r("🤔 GUESS\nGuess 1-10:!guess <number>");if(g===n){user.wallet+=1000;r(`🤔 GUESS\nNumber was ${n} - CORRECT! +$1000`)}else{r(`🤔 GUESS\nNumber was ${n} - Wrong!`)}}},
{name:"lottery",aliases:["lotto"],run:async()=>doCrime("gamble")},
{name:"lotto",run:async()=>doCrime("gamble")},
{name:"wheel",aliases:["wheelspin"],run:async()=>doCrime("slots")},
{name:"spin",run:async()=>doCrime("slots")},
{name:"jackpot",aliases:["jack"],run:async()=>{let win=Math.random()<0.08;if(win){let cash=Math.floor(Math.random()*100000)+50000;user.wallet+=cash;user.casino.wins++;r(`💰💎 JACKPOT HIT!\n💵 +$${cash.toLocaleString()}\n${fun()}`)}else{user.casino.loss++;r("💰 JACKPOT\nNo win this time. Try again!")}}},
{name:"keno",run:async()=>doCrime("dice")},
{name:"crash",aliases:["crashgame"],run:async()=>{let mult=(Math.random()*5+0.1).toFixed(2);let crash=parseFloat(mult)<1.5;if(!crash){let cash=Math.floor(parseFloat(mult)*1000);user.wallet+=cash;r(`📈 CRASH x${mult}\n💰 +$${cash} - You cashed out!`)}else{r(`📈 CRASH x${mult}\n💥 Crashed! You lost.`)}}},
{name:"streak",run:async()=>r(`🔥 WIN STREAK\nCurrent: ${user.casino.streak}\n🏆 Wins: ${user.casino.wins}\n💥 Loss: ${user.casino.loss}`)},
{name:"highscore",aliases:["topscore"],run:async()=>{let a=[...users.values()].sort((x,y)=>(y.casino?.wins||0)-(x.casino?.wins||0)).slice(0,10);r("🏆 CASINO LEADERBOARD\n"+a.map((u,i)=>`${i+1}. ${u.name||u.uid} — 🏆${u.casino?.wins||0}`).join("\n"))}},
{name:"tournament",aliases:["tourney"],run:async()=>r("🏆 TOURNAMENT\n!casino!gamble!slots\nCompete for top wins!")},
{name:"games",aliases:["gamelist"],run:async()=>r("🎮 GAMES & MINIGAMES\n!casino!coinflip!dice!slots!rps!guess\n!crash!wheel!jackpot")},
{name:"minigames",run:async()=>r("🎮 MINIGAMES\n!rps!guess!coinflip!dice\nQuick fun games.")},
{name:"profile",aliases:["me"],run:async({args})=>{let uid=args[0]||event.senderID;let p=await profile(api,uid);r(`👤 ${p.name}\n🆔 ${p.uid}\n💰 $${(users.get(uid)?.wallet||0).toLocaleString()}\n🏆 Casino Wins: ${users.get(uid)?.casino?.wins||0}`)}},
{name:"user",run:async({args})=>{let uid=args[0]||event.senderID;let p=await profile(api,uid);r(`👤 ${p.name}\n🆔 ${p.uid}\n🔗 ${p.profileUrl||"No link"}`)}},
{name:"uid",aliases:["id","myid"],run:async({args})=>{let uid=args[0]||event.senderID;let p=await profile(api,uid);r(`🆔 ${p.name}\n${p.uid}`)}},
{name:"avatar",aliases:["av"],run:async({args})=>{let uid=args[0]||event.senderID;let p=await profile(api,uid);r(`🖼️ ${p.name}\n${p.avatar||"No avatar"}\n🔗 ${p.profileUrl||""}`)}},
{name:"rep",run:async()=>r(`🏆 Reputation: ${user.reputation||0}\n⭐ Casino Rep: ${user.crime.rep}`)},
{name:"statusmsg",run:async({args})=>{if(args.length){user.statusmsg=args.join(" ");r(`📝 Status set: ${user.statusmsg}`)}else{r(`📝 Status: ${user.statusmsg||"No status"}`)}}},
{name:"friends",aliases:["friendlist"],run:async()=>r(`👥 Friends: ${user.friends?.length||0}\nUse!friend <uid> to add.`)},
{name:"friend",aliases:["addfriend"],run:async({args})=>{let uid=args[0];if(!uid)return r("❌ Use!friend <uid>");user.friends=user.friends||[];if(!user.friends.includes(uid))user.friends.push(uid);r(`👥 Added ${uid} as friend.`)}},
{name:"follow",run:async({args})=>{let uid=args[0]||event.senderID;r(`➕ Following ${uid}`)}},
{name:"block",run:async({args})=>{let uid=args[0];if(!uid)return r("❌ Use!block <uid>");user.blocked=user.blocked||[];user.blocked.push(uid);r(`🚫 Blocked ${uid}`)}},
{name:"unblock",run:async({args})=>{let uid=args[0];if(!uid)return r("❌ Use!unblock <uid>");user.blocked=(user.blocked||[]).filter(x=>x!==uid);r(`♻️ Unblocked ${uid}`)}}
]; async function doCrime(id){let j=crime(id);if(!j)return r("❌ Game unavailable.");let win=Math.random()<0.48;if(win){let cash=Math.floor(Math.random()*(j[1]-j[0]+1))+j[0];user.wallet+=cash;user.casino.wins++;user.casino.streak++;user.casino.highscore=Math.max(user.casino.highscore,user.casino.streak);r(`🎰 ${id.toUpperCase()} WIN!\n💰 +$${cash.toLocaleString()}\n🔥 Streak: ${user.casino.streak}`)}else{user.casino.loss++;user.casino.streak=0;r(`🎰 ${id.toUpperCase()} LOST!\n💀 Try again! Streak reset.`)} } return cmds; };
