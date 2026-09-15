// cmds/games.js - 50 GAMES & SOCIAL COMMANDS - Slots, Blackjack, Marry, Slap, Pair, etc - Bars + Levels

module.exports = {

  // ===== GAMES 25 CMDS =====
  "slots": async ({api,tid,args,user,save,makeBar,addXP})=>{
    const bet=parseInt(args[0])||10000;
    if(user.cash<bet) return api.sendMessage(`❌ Need $${bet.toLocaleString()} have $${user.cash.toLocaleString()}`,tid);
    const emojis=["🍒","🍋","🍊","💎","7️⃣","🔔"];
    const s1=emojis[Math.floor(Math.random()*emojis.length)], s2=emojis[Math.floor(Math.random()*emojis.length)], s3=emojis[Math.floor(Math.random()*emojis.length)];
    let win=0; if(s1==s2 && s2==s3){ win=bet*5; } else if(s1==s2 || s2==s3 || s1==s3){ win=bet*2; }
    user.cash+=win-bet; const r=addXP(tid,30); save();
    api.sendMessage(`╭─〔 🎰 SLOTS - Bet $${bet.toLocaleString()} ${makeBar(win,bet*5,6)} 〕─╮\n[${s1} | ${s2} | ${s3}]\n${win>0?`🎉 WIN $${win.toLocaleString()}!`:`❌ LOSE -$${bet.toLocaleString()}`}\nCash $${user.cash.toLocaleString()} LVL ${user.level} ${r.leveled?`UP!`:""}\n╰──────────────────╯`,tid);
  },
  "slot": async (ctx)=> module.exports["slots"](ctx),
  "coinflip": async ({api,tid,args,user,save})=>{
    const bet=parseInt(args[1])||10000; const choice=args[0]?.toLowerCase()||"heads";
    if(user.cash<bet) return api.sendMessage(`Need $${bet}`,tid);
    const result=Math.random()<0.5?"heads":"tails";
    if(result==choice){ user.cash+=bet; api.sendMessage(`✅ ${result}! WIN +$${bet.toLocaleString()}! Cash $${user.cash.toLocaleString()}`,tid); } else { user.cash-=bet; api.sendMessage(`❌ ${result}! LOSE -$${bet.toLocaleString()}! Cash $${user.cash.toLocaleString()}`,tid); }
    save();
  },
  "cf": async (ctx)=> module.exports["coinflip"](ctx),
  "dice": async ({api,tid,args,user,save})=>{
    const bet=parseInt(args[0])||10000; const roll=Math.floor(Math.random()*6)+1; const botRoll=Math.floor(Math.random()*6)+1;
    if(user.cash<bet) return api.sendMessage(`Need $${bet}`,tid);
    if(roll>botRoll){ user.cash+=bet; api.sendMessage(`🎲 You ${roll} vs Bot ${botRoll} - WIN +$${bet}!`,tid); } else { user.cash-=bet; api.sendMessage(`🎲 You ${roll} vs Bot ${botRoll} - LOSE -$${bet}!`,tid); }
    save();
  },
  "roll": async (ctx)=> module.exports["dice"](ctx),
  "blackjack": async ({api,tid,args,user,save})=>{
    const bet=parseInt(args[0])||20000; if(user.cash<bet) return api.sendMessage(`Need $${bet}`,tid);
    const you=Math.floor(Math.random()*11)+10, bot=Math.floor(Math.random()*11)+10;
    if(you>bot && you<=21){ user.cash+=bet; api.sendMessage(`🃏 BJ You ${you} vs Bot ${bot} WIN +$${bet}!`,tid); } else { user.cash-=bet; api.sendMessage(`🃏 BJ You ${you} vs Bot ${bot} LOSE -$${bet}!`,tid); }
    save();
  },
  "bj": async (ctx)=> module.exports["blackjack"](ctx),
  "roulette": async ({api,tid,args,user,save})=>{
    const bet=parseInt(args[1])||10000; const color=args[0]||"red"; const result=Math.random()<0.5?"red":"black";
    if(user.cash<bet) return api.sendMessage(`Need $${bet}`,tid);
    if(color==result){ user.cash+=bet; api.sendMessage(`🎡 Roulette ${result}! WIN +$${bet}!`,tid); } else { user.cash-=bet; api.sendMessage(`🎡 Roulette ${result}! LOSE -$${bet}!`,tid); }
    save();
  },
  "rps": async ({api,tid,args,user,save})=>{
    const choice=args[0]?.toLowerCase()||"rock"; const bot=["rock","paper","scissors"][Math.floor(Math.random()*3)];
    let res="draw"; if((choice=="rock"&&bot=="scissors")||(choice=="paper"&&bot=="rock")||(choice=="scissors"&&bot=="paper")) res="win";
    else if(choice!=bot) res="lose";
    if(res=="win"){ user.cash+=5000; api.sendMessage(`✊ RPS You ${choice} vs Bot ${bot} - WIN +$5k!`,tid); } else if(res=="lose"){ user.cash-=5000; api.sendMessage(`✊ RPS You ${choice} vs Bot ${bot} - LOSE -$5k!`,tid); } else api.sendMessage(`✊ RPS Draw ${choice} vs ${bot}`,tid);
    save();
  },
  "rockpaperscissors": async (ctx)=> module.exports["rps"](ctx),
  "8ball": async ({api,tid,args})=>{
    const q=args.join(" "); const ans=["Yes! 🎉","No 😢","Maybe 🤔","Ask later ⏰","Definitely! 🔥","Never! ❌"][Math.floor(Math.random()*6)];
    api.sendMessage(`🎱 8Ball Q: ${q}\nA: ${ans}`,tid);
  },
  "gamble": async (ctx)=> module.exports["slots"](ctx),
  "spin": async (ctx)=> module.exports["slots"](ctx),
  "lottery": async ({api,tid,user,save})=>{ if(Math.random()<0.1){ user.cash+=1000000; api.sendMessage(`🎟️ Lottery WIN $1M!`,tid); } else api.sendMessage(`🎟️ Lottery LOSE!`,tid); save(); },
  "scratch": async ({api,tid,user,save})=>{ const win=Math.random()<0.3; if(win){ user.cash+=20000; api.sendMessage(`🎫 Scratch WIN $20k!`,tid); } else api.sendMessage(`🎫 Scratch LOSE!`,tid); save(); },
  "mines": async ({api,tid})=> api.sendMessage(`💣 Mines game! Use!slots for now!`,tid),
  "crash": async ({api,tid,user,save})=>{ const mult=(Math.random()*5).toFixed(2); const win=Math.random()<0.5; if(win){ const gain=Math.floor(10000*parseFloat(mult)); user.cash+=gain; api.sendMessage(`📈 Crash ${mult}x WIN +$${gain}!`,tid); } else api.sendMessage(`📉 Crash LOSE!`,tid); save(); },

  // ===== SOCIAL 25 CMDS =====
  "marry": async ({api,tid,args,user,save,getUser})=>{
    const target=args[0]?.replace(/[@<>]/g,""); if(!target) return api.sendMessage(`💍 Use:!marry @user - Marry! Cost $1M!`,tid);
    if(user.cash<1000000) return api.sendMessage(`Need $1M to marry! Have $${user.cash.toLocaleString()}`,tid);
    const t=getUser(target); user.cash-=1000000; if(!user.married) user.married=[]; user.married.push(target); t.married=t.married||[]; t.married.push(tid); save();
    api.sendMessage(`╭─〔 💍 MARRIED! 💍 〕─╮\n[Real Pics] 👤 ${tid} married 👤 ${target}! 💖 Cost $1M!\n💒 Now married! Use!divorce to divorce!\n╰──────────────────╯`,tid);
  },
  "marriage": async (ctx)=> module.exports["marry"](ctx),
  "divorce": async ({api,tid,user,save})=>{ user.married=[]; save(); api.sendMessage(`💔 Divorced!`,tid); },
  "friend": async ({api,tid,args,user,save,getUser})=>{
    const target=args[0]?.replace(/[@<>]/g,""); if(!target) return api.sendMessage(`Use!friend @user`,tid);
    const t=getUser(target); user.friends=user.friends||[]; user.friends.push(target); save(); api.sendMessage(`🤝 Friended ${target}! Friends ${user.friends.length}`,tid);
  },
  "friends": async ({api,tid,user})=>{ api.sendMessage(`🤝 Friends: ${user.friends?.length||0} - ${user.friends?.join(", ")||"None"}`,tid); },
  "unfriend": async ({api,tid,args,user,save})=>{ const target=args[0]?.replace(/[@<>]/g,""); user.friends=(user.friends||[]).filter(f=>f!=target); save(); api.sendMessage(`💔 Unfriended ${target}`,tid); },
  "slap": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`👋 ${tid} slapped ${target}! 😂 SLAP!`,tid); },
  "kiss": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`😘 ${tid} kissed ${target}! ❤️ KISS!`,tid); },
  "hug": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`🤗 ${tid} hugged ${target}! 💖 HUG!`,tid); },
  "punch": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`👊 ${tid} punched ${target}! 💥`,tid); },
  "kick": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`🦵 ${tid} kicked ${target}! 😂`,tid); },
  "crush": async ({api,tid,args,user,save})=>{ const target=args[0]?.replace(/[@<>]/g,""); user.crush=target; save(); api.sendMessage(`😍 Crush set to ${target}! 💘`,tid); },
  "propose": async (ctx)=> module.exports["marry"](ctx),
  "pair": async ({api,tid,data})=>{
    const ids=Object.keys(data.users); const a=ids[Math.floor(Math.random()*ids.length)], b=ids[Math.floor(Math.random()*ids.length)];
    api.sendMessage(`💘 Pair: ID ${a} + ID ${b} = ${Math.floor(Math.random()*100)}% match! 💖`,tid);
  },
  "ship": async (ctx)=> module.exports["pair"](ctx),
  "love": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`❤️ Love ${target} 100%! 💖 ${"█".repeat(10)} 100%`,tid); },
  "hate": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`💔 Hate ${target} 0%! ${"░".repeat(10)} 0%`,tid); },
  "pat": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`🥰 Pat ${target}! So cute!`,tid); },
  "cuddle": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`🤗 Cuddle ${target}! Warm!`,tid); },
  "poke": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`👉 Poked ${target}!`,tid); },
  "highfive": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`✋ Highfive ${target}!`,tid); },
  "bite": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`😬 Bite ${target}! Ouch!`,tid); },
  "lick": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`👅 Lick ${target}! Weird!`,tid); },
  "kill": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`💀 ${tid} killed ${target}! (joke)`,tid); },
  "yeet": async ({api,tid,args})=>{ const target=args[0]||"someone"; api.sendMessage(`🚀 Yeet ${target}!`,tid); }
};
