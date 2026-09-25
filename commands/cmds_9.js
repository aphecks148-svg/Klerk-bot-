// commands/cmds_9.js
// 🎰 LUCKYVAULT — iKON-BOT • Gambling & Luck
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=10)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.lucky=u.lucky||{spins:0,jackpots:0,totalWon:0,totalLost:0,luck:0,streak:0,bestWin:0,luckyCoin:0};
  u.inventory=u.inventory||{};
};
const rand=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()*100<p;
const slots=["🍒","🍋","🍊","🍉","⭐","💎","7️⃣","🔔","🍀"];

const cmds=[
{name:"slots",aliases:["slot"],description:"Play slots",cooldown:8,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||500; if(money(user)<bet) return replyx(`💸 Need $${fmt(bet)}`); if(bet<100) return replyx("Min bet $100");
  setMoney(user,money(user)-bet); user.lucky.spins++;
  let a=rand(slots), b=rand(slots), c=rand(slots); let win=0;
  if(a===b&&b===c){ win=a==="7️⃣"?bet*20:a==="💎"?bet*15:a==="⭐"?bet*10:bet*5; if(a==="7️⃣") user.lucky.jackpots++; }
  else if(a===b||b===c||a===c) win=Math.floor(bet*1.5);
  if(win>0){ setMoney(user,money(user)+win); user.lucky.totalWon+=win; user.lucky.bestWin=Math.max(user.lucky.bestWin,win); user.lucky.streak++; user.lucky.luck+=1; xp(user,15);
    replyx(`🎰 SLOTS | ${a} ${b} ${c} |\n💥 WIN $${fmt(win)}! ${a===b&&b===c?"JACKPOT!":""}\n💰 Wallet: $${fmt(money(user))}\n🔥 Streak: ${user.lucky.streak}\n${fun?fun():""}`);
  }else{ user.lucky.totalLost+=bet; user.lucky.streak=0; user.lucky.luck=Math.max(0,user.lucky.luck-1); replyx(`🎰 SLOTS | ${a} ${b} ${c} |\n💀 LOST $${fmt(bet)}\n💰 Wallet: $${fmt(money(user))}`); }
}},

{name:"roll",aliases:["dice"],description:"Roll dice",cooldown:5,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||300; let guess=Number(args[1])||0; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); if(bet<50) return replyx("Min $50");
  setMoney(user,money(user)-bet); let roll=Math.floor(Math.random()*6)+1;
  if(guess>=1&&guess<=6){ if(roll===guess){ let win=bet*5; setMoney(user,money(user)+win); replyx(`🎲 Rolled ${roll} — GUESS ${guess} WIN! +$${fmt(win)}`); }else replyx(`🎲 Rolled ${roll} — Guess ${guess} lost $${fmt(bet)}`); }
  else{ if(roll>=4){ let win=Math.floor(bet*1.8); setMoney(user,money(user)+win); replyx(`🎲 Rolled ${roll} WIN! +$${fmt(win)}`); }else replyx(`🎲 Rolled ${roll} LOST $${fmt(bet)}`); }
}},

{name:"coinflip",aliases:["flip","cf"],description:"Coin flip gamble",cooldown:5,run:async({args})=>{
  ensure(user); let bet=Number(args[1])||Number(args[0])||200; let side=String(args[0]||"").toLowerCase(); if(side==="500"||!isNaN(side)) side="heads";
  if(!["heads","tails","h","t"].includes(side)) side="heads"; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let res=chance(50)?"heads":"tails"; let win=(side[0]===res[0]);
  if(win){ let w=bet*2; setMoney(user,money(user)+w); replyx(`🪙 ${res.toUpperCase()} — WIN! +$${fmt(w)}`); }else replyx(`🪙 ${res.toUpperCase()} — LOST $${fmt(bet)}`);
}},

{name:"lottery",aliases:["lott"],description:"Lottery ticket",cooldown:20,run:async()=>{
  ensure(user); let cost=1000; if(money(user)<cost) return replyx(`Need $${fmt(cost)}`); setMoney(user,money(user)-cost);
  let win=chance(5)?Math.floor(Math.random()*100000)+50000:chance(20)?Math.floor(Math.random()*10000)+2000:0;
  if(win>0){ setMoney(user,money(user)+win); replyx(`🎟️ LOTTERY WIN! 🎉 +$${fmt(win)}\n${fun?fun():""}`); }else replyx("🎟️ Lottery — no win this time. Try again!");
}},

{name:"jackpot",aliases:["jp"],description:"Jackpot spin",cooldown:30,run:async()=>{
  ensure(user); let bet=Number(event.body.split(" ")[1])||2000; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  if(chance(1)){ let mega=bet*100; setMoney(user,money(user)+mega); user.lucky.jackpots++; user.lucky.bestWin=Math.max(user.lucky.bestWin,mega); replyx(`💎 MEGA JACKPOT!!! +$${fmt(mega)}\n${fun?fun():""}`); }
  else if(chance(10)){ let win=bet*10; setMoney(user,money(user)+win); replyx(`⭐ JACKPOT! +$${fmt(win)}`); }
  else replyx(`💀 Jackpot missed! Lost $${fmt(bet)}`);
}},

{name:"roulette",aliases:["rou"],description:"Roulette",cooldown:10,run:async({args})=>{
  ensure(user); let bet=Number(args[1])||Number(args[0])||500; let color=String(args[0]||"").toLowerCase(); if(!isNaN(color)) color="red";
  if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let res=rand(["red","black","green"]); let win=false;
  if(color===res) win=true; else if((color==="red"||color==="black")&&res!=="green"&&chance(48)) win=true;
  if(win||res===color){ let mult=res==="green"?14:2; let w=bet*mult; setMoney(user,money(user)+w); replyx(`🎡 Roulette: ${res.toUpperCase()} WIN! +$${fmt(w)} (x${mult})`); }else replyx(`🎡 Roulette: ${res.toUpperCase()} LOST $${fmt(bet)}`);
}},

{name:"blackjack",aliases:["bj","21"],description:"Blackjack",cooldown:15,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||1000; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let player=Math.floor(Math.random()*11)+12, dealer=Math.floor(Math.random()*11)+12;
  if(player===21){ let w=Math.floor(bet*2.5); setMoney(user,money(user)+w); replyx(`🃏 BLACKJACK! You ${player} vs Dealer ${dealer} WIN +$${fmt(w)}`); }
  else if(player>dealer){ let w=bet*2; setMoney(user,money(user)+w); replyx(`🃏 You ${player} vs Dealer ${dealer} WIN +$${fmt(w)}`); }
  else if(player===dealer){ setMoney(user,money(user)+bet); replyx(`🃏 PUSH! You ${player} vs Dealer ${dealer} — bet returned`); }
  else replyx(`🃏 You ${player} vs Dealer ${dealer} LOST $${fmt(bet)}`);
}},

{name:"poker",aliases:["texas"],description:"Poker hand",cooldown:20,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||1500; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let hands=["High Card","Pair","Two Pair","Three Kind","Straight","Flush","Full House","Four Kind","Straight Flush"]; let my=rand(hands), opp=rand(hands);
  let myRank=hands.indexOf(my), oppRank=hands.indexOf(opp);
  if(myRank>oppRank){ let w=bet*2; setMoney(user,money(user)+w); replyx(`♠️ POKER WIN!\nYou: ${my} beats ${opp}\n+$${fmt(w)}`); }
  else if(myRank===oppRank){ setMoney(user,money(user)+bet); replyx(`♠️ POKER TIE! Both ${my} — bet returned`); }
  else replyx(`♠️ POKER LOST! You ${my} vs ${opp} — lost $${fmt(bet)}`);
}},

{name:"crash",aliases:["crashgame"],description:"Crash gambling",cooldown:10,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||800; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let crash=(Math.random()*5+0.2).toFixed(2); let mult=parseFloat(crash); let win=mult>1.5;
  if(win){ let w=Math.floor(bet*mult); setMoney(user,money(user)+w); replyx(`📈 CRASH x${crash} WIN! +$${fmt(w)}\n${fun?fun():""}`); }else replyx(`📉 CRASH x${crash} — LOST $${fmt(bet)} (crashed early!)`);
}},

{name:"mines",aliases:["minesweeper"],description:"Mines game",cooldown:10,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||600; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  if(chance(70)){ let w=Math.floor(bet*1.6); setMoney(user,money(user)+w); replyx(`💣 MINES SAFE! +$${fmt(w)} (x1.6)`); }else replyx(`💥 BOOM! Hit a mine! Lost $${fmt(bet)}`);
}},

{name:"wheel",aliases:["wheeloffortune"],description:"Spin the wheel",cooldown:20,run:async()=>{
  ensure(user); let cost=1500; if(money(user)<cost) return replyx(`Need $${fmt(cost)}`); setMoney(user,money(user)-cost);
  let prizes=[0,500,1000,2000,5000,0,10000,25000,0,50000]; let prize=rand(prizes);
  if(prize>0){ setMoney(user,money(user)+prize); replyx(`🎡 WHEEL → $${fmt(prize)} WIN!\n${prize>=25000?fun?fun():"":""}`); }else replyx("🎡 WHEEL → $0 — try again!");
}},

{name:"lucky",aliases:["luckystats"],description:"Luck stats",run:async()=>{
  ensure(user); let l=user.lucky; replyx(`🍀 LUCK STATS\nSpins: ${fmt(l.spins)}\nJackpots: ${l.jackpots}\nWon: $${fmt(l.totalWon)}\nLost: $${fmt(l.totalLost)}\nNet: $${fmt(l.totalWon-l.totalLost)}\nBest: $${fmt(l.bestWin)}\nStreak: ${l.streak}\nLuck: ${l.luck}`)
}},

{name:"luck",aliases:["lucklevel"],description:"Luck level",run:async()=>{
  ensure(user); replyx(`🍀 Luck: ${user.lucky.luck}\n${bar?bar(user.lucky.luck,100,10):""} ${user.lucky.luck}/100\nHigher luck = better gambling odds!`)
}},

{name:"dailySpin",aliases:["dailyspin","freespin"],description:"Daily free spin",run:async()=>{
  ensure(user); let last=user.lucky.lastDaily||0; if(Date.now()-last<86400000) return replyx(`⏳ Daily spin in ${Math.ceil((86400000-(Date.now()-last))/3600000)}h`);
  user.lucky.lastDaily=Date.now(); let win=Math.floor(Math.random()*20000)+1000; setMoney(user,money(user)+win); user.lucky.spins++; replyx(`🎁 DAILY SPIN!\n💰 +$${fmt(win)}\nCome back tomorrow!`)
}},

{name:"scratch",aliases:["scratchcard"],description:"Scratch card",cooldown:10,run:async()=>{
  ensure(user); let cost=500; if(money(user)<cost) return replyx(`Need $${fmt(cost)}`); setMoney(user,money(user)-cost);
  if(chance(30)){ let win=Math.floor(Math.random()*8000)+500; setMoney(user,money(user)+win); replyx(`🎫 SCRATCH WIN $${fmt(win)}!`); }else replyx("🎫 Scratch — no win");
}},

{name:"double",aliases:["doubleor"],description:"Double or nothing",cooldown:8,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||1000; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  if(chance(48)){ let w=bet*2; setMoney(user,money(user)+w); replyx(`⚡ DOUBLE WIN! $${fmt(bet)} → $${fmt(w)}`); }else replyx(`💀 DOUBLE LOST $${fmt(bet)}`);
}},

{name:"luckyshop",aliases:["lshop"],description:"Lucky shop",run:async()=>{
  replyx(`🍀 LUCKY SHOP\n• Lucky Coin — $50,000 (+5% win chance)\n• Golden Ticket — $100,000 (free jackpot spin)\n• Fortune Charm — $250,000 (+10% luck)\n💡!buy lucky_coin`)
}},

{name:"luckycoin",aliases:["lcoin"],description:"Use lucky coin",run:async()=>{
  ensure(user); if((user.inventory.lucky_coin||0)<1 && money(user)<50000) return replyx("Need Lucky Coin ($50k)"); if((user.inventory.lucky_coin||0)>=1) user.inventory.lucky_coin--; else setMoney(user,money(user)-50000);
  user.lucky.luck=Math.min(100,user.lucky.luck+5); replyx(`🍀 Lucky Coin used!\nLuck +5 → ${user.lucky.luck}`)
}},

{name:"luckystreak",aliases:["streak"],description:"Luck streak",run:async()=>{
  ensure(user); replyx(`🔥 STREAK: ${user.lucky.streak}\nBest Win: $${fmt(user.lucky.bestWin)}\nCurrent Luck: ${user.lucky.luck}`)
}},

{name:"luckyboard",aliases:["lbboard","luckylb"],description:"Lucky leaderboard",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,win:u.lucky?.totalWon||0})).sort((a,b)=>b.win-a.win).slice(0,10);
  replyx(`🍀 LUCKY LB (Total Won)\n${list.map((x,i)=>`${i+1}. ${x.name} — $${fmt(x.win)}`).join("\n")||"Empty"}`)
}},

{name:"gamblestats",aliases:["gstats"],description:"Gambling stats",run:async()=>{
  ensure(user); let l=user.lucky; replyx(`📊 GAMBLE STATS\nSpins: ${l.spins}\nW/L: $${fmt(l.totalWon)}/$${fmt(l.totalLost)}\nNet: $${fmt(l.totalWon-l.totalLost)}\nJackpots: ${l.jackpots}`)
}},

{name:"bet",aliases:["placebet"],description:"Place bet",cooldown:5,run:async({args})=>{
  ensure(user); let amt=Number(args[0])||500; if(money(user)<amt) return replyx(`Need $${fmt(amt)}`); setMoney(user,money(user)-amt);
  if(chance(47)){ let w=amt*2; setMoney(user,money(user)+w); replyx(`🎲 BET WIN! +$${fmt(w)}`); }else replyx(`🎲 BET LOST $${fmt(amt)}`);
}},

{name:"dicegame",aliases:["dices"],description:"3 dice game",cooldown:8,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||700; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let d1=Math.floor(Math.random()*6)+1,d2=Math.floor(Math.random()*6)+1,d3=Math.floor(Math.random()*6)+1, sum=d1+d2+d3;
  if(sum>=11){ let w=Math.floor(bet*1.9); setMoney(user,money(user)+w); replyx(`🎲 ${d1}+${d2}+${d3}=${sum} WIN +$${fmt(w)}`); }else replyx(`🎲 ${d1}+${d2}+${d3}=${sum} LOST $${fmt(bet)}`)
}},

{name:"highlow",aliases:["hl"],description:"High low game",cooldown:6,run:async({args})=>{
  ensure(user); let bet=Number(args[1])||Number(args[0])||400; let choice=String(args[0]||"").toLowerCase(); if(!isNaN(choice)) choice="high";
  if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let card=Math.floor(Math.random()*13)+1; let win=(choice==="high"&&card>7)||(choice==="low"&&card<7);
  if(card===7){ setMoney(user,money(user)+bet); replyx(`🃏 Card 7 — PUSH, bet returned`); }
  else if(win){ let w=bet*2; setMoney(user,money(user)+w); replyx(`🃏 Card ${card} ${choice.toUpperCase()} WIN +$${fmt(w)}`); }
  else replyx(`🃏 Card ${card} LOST $${fmt(bet)}`)
}},

{name:"plinko",aliases:["plink"],description:"Plinko game",cooldown:10,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||1000; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let mults=[0.2,0.5,1,1.5,2,5,2,1.5,1,0.5,0.2]; let m=rand(mults); let win=Math.floor(bet*m);
  if(win>0) setMoney(user,money(user)+win); replyx(`🔴 PLINKO x${m} → ${win>bet?"WIN":"LOSS"} $${fmt(win)} ${m>=5?fun?fun():"": ""}`)
}},

{name:"keno",aliases:["kenogame"],description:"Keno",cooldown:15,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||800; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let picks=Math.floor(Math.random()*5)+1; let win=picks>=3?Math.floor(bet*(picks*0.8)):0;
  if(win>0){ setMoney(user,money(user)+win); replyx(`🔢 KENO ${picks}/10 matched WIN +$${fmt(win)}`); }else replyx(`🔢 KENO ${picks}/10 matched LOST $${fmt(bet)}`)
}},

{name:"bingo",aliases:["bingogame"],description:"Bingo",cooldown:25,run:async()=>{
  ensure(user); let cost=2000; if(money(user)<cost) return replyx(`Need $${fmt(cost)}`); setMoney(user,money(user)-cost);
  if(chance(15)){ let win=Math.floor(Math.random()*50000)+10000; setMoney(user,money(user)+win); replyx(`🎱 BINGO!!! +$${fmt(win)}\n${fun?fun():""}`); }else replyx("🎱 Bingo — no bingo this time")
}},

{name:"luckyquest",aliases:["lquest"],description:"Lucky quest",run:async()=>{
  ensure(user); user.lucky.quest=(user.lucky.quest||0)+1; let rew=7000+user.lucky.quest*700; setMoney(user,money(user)+rew); xp(user,25); replyx(`🍀 Lucky Quest #${user.lucky.quest} DONE!\n💰 +$${fmt(rew)}\n⭐ +25 XP`)
}},

{name:"fortune",aliases:["fortunes"],description:"Fortune teller",run:async()=>{
  ensure(user); let fortunes=["Big win coming!","Beware of greed","Lucky coin will save you","Jackpot in next 3 spins","Your luck is rising!","Don't gamble too much!"]; replyx(`🔮 FORTUNE: ${rand(fortunes)}\n🍀 Luck: ${user.lucky.luck}`)
}},

{name:"spinwheel",aliases:["spin"],description:"Spin wheel variant",cooldown:12,run:async({args})=>{
  ensure(user); let bet=Number(args[0])||1000; if(money(user)<bet) return replyx(`Need $${fmt(bet)}`); setMoney(user,money(user)-bet);
  let wheel=[0,0.5,1,1.2,2,3,10,0,0.8,1.5]; let m=rand(wheel); let w=Math.floor(bet*m); if(w>0) setMoney(user,money(user)+w);
  replyx(`🎡 SPIN x${m} → $${fmt(w)} ${w>bet*2?"WIN!":""}`)
}},

{name:"luckyhelp",aliases:["lhelp"],description:"Lucky help",run:async()=>{
  replyx(`🎰 LUCKYVAULT HELP\n🎰!slots •!roll •!coinflip •!roulette\n🃏!blackjack •!poker •!highlow\n📈!crash •💣!mines •🔴!plinko\n🎡!wheel •!jackpot •!lottery •!bingo\n🍀!lucky •!luck •!luckyboard •!dailySpin`)
}},

{name:"casinorank",aliases:["crank"],description:"Casino rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,jp:u.lucky?.jackpots||0})).sort((a,b)=>b.jp-a.jp).slice(0,10);
  replyx(`🎰 CASINO RANK (Jackpots)\n${list.map((x,i)=>`${i+1}. ${x.name} — ${x.jp} jackpots`).join("\n")||"Empty"}`)
}},

{name:"luckychest",aliases:["lchest"],description:"Lucky chest",cooldown:60,run:async()=>{
  ensure(user); if(chance(50)){ let win=Math.floor(Math.random()*15000)+3000; setMoney(user,money(user)+win); replyx(`🎁 LUCKY CHEST! +$${fmt(win)}`); }else replyx("🎁 Chest was empty! 💀")
}},

{name:"gamble",aliases:["gambleall"],description:"Gamble all",cooldown:30,run:async()=>{
  ensure(user); let all=money(user); if(all<100) return replyx("Need $100 min"); setMoney(user,0);
  if(chance(45)){ let w=all*2; setMoney(user,w); replyx(`💀 ALL IN WIN! $${fmt(all)} → $${fmt(w)}\n${fun?fun():""}`); }else replyx(`💀 ALL IN LOST $${fmt(all)}! You're broke!`)
}}
];
return cmds;
};
