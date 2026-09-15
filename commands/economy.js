// cmds/economy.js - 50 ECONOMY COMMANDS - Bank, Work, Missions, Market, Crypto
// All lists mentioned! Buy with name+amount! Bars on important!

module.exports = {

  // ===== BANK 20 CMDS =====
  "balance": async ({api,tid,user,makeBar,addXP})=>{
    const r=addXP(tid,10);
    const bar=makeBar(user.xp, user.level*1000,12);
    api.sendMessage(`╭─〔 💰 BALANCE - LVL ${user.level} ${bar} 〕─╮\n[Real FB Pic] 👤 ID ${tid}\n💵 Cash $${user.cash.toLocaleString()} 🏦 Bank $${user.bank.toLocaleString()}\n💰 Networth $${(user.cash+user.bank).toLocaleString()} 🪙 Coins ${user.coins}\n📊 Level ${user.level}/1000 Prestige ${user.prestige} XP ${user.xp}\n${r.leveled?`🎉 LEVEL UP! ${r.lvl}! +$${r.cash} +1 coin + pet!`:""}\n╰──────────────────╯`, tid);
  },
  "bal": async (ctx)=> module.exports["balance"](ctx),
  "bank": async ({api,tid,user,makeBar})=>{
    const total=user.cash+user.bank;
    api.sendMessage(`╭─〔 🏦 BANK BOX - ${makeBar(user.bank, total||1)} 〕─╮\n💵 Cash $${user.cash.toLocaleString()}\n🏦 Bank $${user.bank.toLocaleString()}\n💰 Total $${total.toLocaleString()}\n🪙 Coins ${user.coins} = $${(user.coins*10000000).toLocaleString()}\nUse:!deposit <amount>,!withdraw <amount>\n╰──────────────────╯`, tid);
  },
  "deposit": async ({api,tid,args,user,save})=>{
    const amt=parseInt(args[1]?args.join(" ").replace(/,/g,""):args[0])||0;
    if(args[0]?.toLowerCase()=="all"){ let a=user.cash; user.cash=0; user.bank+=a; save(); return api.sendMessage(`✅ Deposited ALL $${a.toLocaleString()}! Bank $${user.bank.toLocaleString()}`, tid); }
    if(user.cash<amt) return api.sendMessage(`❌ Need $${amt.toLocaleString()} have $${user.cash.toLocaleString()}`, tid);
    user.cash-=amt; user.bank+=amt; save();
    api.sendMessage(`✅ Deposited $${amt.toLocaleString()}! Cash $${user.cash.toLocaleString()} Bank $${user.bank.toLocaleString()}`, tid);
  },
  "dep": async (ctx)=> module.exports["deposit"](ctx),
  "withdraw": async ({api,tid,args,user,save})=>{
    const amt=parseInt(args[0])||0;
    if(args[0]=="all"){ let a=user.bank; user.bank=0; user.cash+=a; save(); return api.sendMessage(`✅ Withdrew ALL $${a.toLocaleString()}! Cash $${user.cash.toLocaleString()}`, tid); }
    if(user.bank<amt) return api.sendMessage(`❌ Bank $${user.bank.toLocaleString()} < $${amt.toLocaleString()}`, tid);
    user.bank-=amt; user.cash+=amt; save();
    api.sendMessage(`✅ Withdrew $${amt.toLocaleString()}! Cash $${user.cash.toLocaleString()}`, tid);
  },
  "with": async (ctx)=> module.exports["withdraw"](ctx),
  "daily": async ({api,tid,user,save,addXP})=>{
    const now=Date.now();
    if(now-user.lastDaily<86400000) return api.sendMessage(`⏰ Daily cooldown! ${Math.ceil((86400000-(now-user.lastDaily))/3600000)}h left`, tid);
    user.lastDaily=now; user.dailyStreak++;
    const reward=100000+user.dailyStreak*10000;
    user.cash+=reward; const r=addXP(tid,200);
    user.coins+=1; // 3 things: cash+coins+pet chance
    if(user.dailyStreak%7==0) user.pets.push({name:"Shadow Hound"});
    save();
    api.sendMessage(`╭─〔 🎁 DAILY - Streak ${user.dailyStreak} ${"█".repeat(Math.min(user.dailyStreak,10))} 〕─╮\n💰 +$${reward.toLocaleString()}! Streak ${user.dailyStreak}!\n🪙 +1 coin! 🐾 +pet if 7 days!\nLevel ${user.level} XP ${user.xp} ${r.leveled?"LEVEL UP!":""}\nCash $${user.cash.toLocaleString()}\n╰──────────────────╯`, tid);
  },
  "weekly": async ({api,tid,user,save})=>{ user.cash+=500000; save(); api.sendMessage(`✅ Weekly +$500k! Cash $${user.cash.toLocaleString()}`, tid); },
  "monthly": async ({api,tid,user,save})=>{ user.cash+=2000000; save(); api.sendMessage(`✅ Monthly +$2M! Cash $${user.cash.toLocaleString()}`, tid); },
  "pay": async ({api,tid,args,user,save,getUser})=>{
    const target=args[0]?.replace(/[@<>]/g,""); const amt=parseInt(args[1])||0;
    if(!target||!amt) return api.sendMessage(`Use:!pay @user 1000000`, tid);
    if(user.cash<amt) return api.sendMessage(`❌ Need $${amt.toLocaleString()}`, tid);
    const t=getUser(target); user.cash-=amt; t.cash+=amt; save();
    api.sendMessage(`✅ Paid $${amt.toLocaleString()} to ${target}! You $${user.cash.toLocaleString()}`, tid);
  },
  "transfer": async (ctx)=> module.exports["pay"](ctx),
  "leaderboard": async ({api,tid,data})=>{
    const top=Object.entries(data.users).sort((a,b)=> (b[1].cash+b[1].bank)-(a[1].cash+a[1].bank)).slice(0,10);
    let txt=`╭─〔 🏆 LEADERBOARD TOP 10 💰 〕─╮\n`; top.forEach((u,i)=> txt+=`${i+1}. ID ${u[0]} - $${(u[1].cash+u[1].bank).toLocaleString()} LVL ${u[1].level}\n`); txt+=`╰──────────────────╯`; api.sendMessage(txt,tid);
  },
  "top": async (ctx)=> module.exports["leaderboard"](ctx),
  "rich": async (ctx)=> module.exports["leaderboard"](ctx),
  "rob": async ({api,tid,args,user,save,getUser,addXP})=>{
    if(user.level<10) return api.sendMessage(`❌ Need Level 10! You LVL ${user.level} ${makeBar(user.level,10)}`, tid);
    const target=args[0]?.replace(/[@<>]/g,""); if(!target) return api.sendMessage(`!rob @user`, tid);
    const t=getUser(target); const steal=Math.floor(Math.random()*Math.min(t.cash,500000));
    if(Math.random()<0.5){ user.cash+=steal; t.cash-=steal; api.sendMessage(`✅ Robbed $${steal.toLocaleString()} from ${target}!`, tid); } else { user.cash-=100000; api.sendMessage(`❌ Failed! Lost $100k!`, tid); }
    addXP(tid,50); save();
  },
  "crime": async (ctx)=> module.exports["rob"](ctx),
  "beg": async ({api,tid,user,save,addXP})=>{ const a=Math.floor(Math.random()*5000)+1000; user.cash+=a; const r=addXP(tid,20); save(); api.sendMessage(`🪓 Beg +$${a} LVL ${user.level} ${r.leveled?`UP to ${r.lvl}! +$${r.cash} +1 coin!`:""} Cash $${user.cash.toLocaleString()}`, tid); },

  // ===== WORK 15 CMDS - EACH + LVL + 3 THINGS (CASH+COINS+PET/ITEM) + MONEY =====
  "work": async ({api,tid,user,save,addXP})=>{
    if(user.level<1) return api.sendMessage(`Need LVL 1`,tid);
    user.cash+=20000; user.coins+=1; user.workCount++; const r=addXP(tid,50); if(r.leveled) user.pets.push({name:"Shadow Hound"}); save();
    api.sendMessage(`💼 Work +$20k +1 coin +${r.leveled?"+pet":""} +50XP! LVL ${user.level} ${user.workCount} works! Cash $${user.cash.toLocaleString()}`, tid);
  },
  "farm": async ({api,tid,args,user,save,SEEDS_LIST,addXP})=>{
    if(args[0]=="buy"){
      const name=args.slice(1,args.length-1).join(" "); const amt=parseInt(args[args.length-1])||1;
      const seed=SEEDS_LIST.find(s=>s.name.toLowerCase().includes(name.toLowerCase()));
      if(!seed) return api.sendMessage(`Seeds: ${SEEDS_LIST.map(s=>s.name).join(", ")}`,tid);
      const cost=seed.price*amt; if(user.cash<cost) return api.sendMessage(`Need $${cost}`,tid);
      user.cash-=cost; user.seeds.push({name:seed.name, amt}); save(); return api.sendMessage(`🌱 Bought ${seed.emoji} ${seed.name} x${amt} for $${cost.toLocaleString()}!`, tid);
    }
    if(args[0]=="plant"){ user.cash+=50000; const r=addXP(tid,100); user.coins+=1; user.workCount++; save(); return api.sendMessage(`🌾 Farm plant +$50k +1 coin +100XP LVL ${user.level} ${r.leveled?`UP!`:""}`, tid); }
    user.cash+=50000; addXP(tid,100); save(); api.sendMessage(`🌾 Farm +$50k! Use!farm buy <name> <amount> - Seeds: ${SEEDS_LIST.slice(0,5).map(s=>s.name).join(", ")}`, tid);
  },
  "mine": async ({api,tid,user,save,addXP})=>{ user.cash+=50000; user.coins+=1; user.workCount++; const r=addXP(tid,100); save(); api.sendMessage(`⛏️ Mine +$50k +1 coin +100XP! LVL ${user.level}/1000 ${r.leveled?`LEVEL UP ${r.lvl}!`:""} ${"█".repeat(user.level%10)}`, tid); },
  "fish": async ({api,tid,user,save,addXP})=>{ user.cash+=30000; user.coins+=1; user.workCount++; const r=addXP(tid,80); save(); api.sendMessage(`🎣 Fish +$30k +1 coin +80XP LVL ${user.level}`, tid); },
  "hunt": async ({api,tid,user,save,addXP})=>{ user.cash+=40000; user.coins+=1; user.workCount++; const r=addXP(tid,90); save(); api.sendMessage(`🏹 Hunt +$40k +1 coin +90XP LVL ${user.level}`, tid); },
  "chop": async ({api,tid,user,save,addXP})=>{ user.cash+=35000; addXP(tid,70); save(); api.sendMessage(`🪓 Chop +$35k LVL ${user.level}`, tid); },
  "dig": async ({api,tid,user,save,addXP})=>{ user.cash+=45000; addXP(tid,85); save(); api.sendMessage(`⛏️ Dig +$45k LVL ${user.level}`, tid); },
  "collect": async ({api,tid,user,save,addXP})=>{ user.cash+=25000; addXP(tid,60); save(); api.sendMessage(`📦 Collect +$25k LVL ${user.level}`, tid); },
  "job": async (ctx)=> module.exports["work"](ctx),
  "jobs": async ({api,tid,WORKS_LIST})=>{ api.sendMessage(`Works:\n${WORKS_LIST.map(w=>`${w.emoji} ${w.name} - ${w.earn} XP ${w.xp}`).join("\n")}`, tid); },

  // ===== MISSIONS 15 CMDS - LVL 1-1000 + PRESTIGE + 3 THINGS =====
  "mission": async ({api,tid,args,user,save,MISSIONS_LIST,addXP})=>{
    if(!args[0]){ let txt=`╭─〔 🎯 MISSIONS ${user.missionCount}/30 LVL ${user.level}/1000 〕─╮\n`; MISSIONS_LIST.slice(0,10).forEach(m=> txt+=`${m.emoji} ${m.id}. ${m.name} Req ${m.req} Reward ${m.reward}\n`); txt+=`Use!mission claim <id>\n╰──────────────────╯`; return api.sendMessage(txt,tid); }
    if(args[0]=="claim"){
      const id=parseInt(args[1]); const m=MISSIONS_LIST.find(x=>x.id==id); if(!m) return api.sendMessage(`No mission ${id}`,tid);
      if(user.level < id*10) return api.sendMessage(`❌ Need Level ${id*10}! You ${user.level} ${"░".repeat(10)}`, tid);
      user.missionCount++; user.cash+=id*100000; user.coins+=id; user.xp+=id*100; const r=addXP(tid,id*100); user.pets.push({name:"Blood Wolf"}); save();
      api.sendMessage(`✅ Mission ${id} claimed! +$${(id*100000).toLocaleString()} +${id} coins +pet! LVL ${user.level} ${r.leveled?`UP to ${r.lvl}!`:""}`, tid);
    }
  },
  "missions": async (ctx)=> module.exports["mission"](ctx),
  "mission list": async (ctx)=> module.exports["mission"](ctx),
  "m": async (ctx)=> module.exports["mission"](ctx),
  "quest": async (ctx)=> module.exports["mission"](ctx),
  "quests": async (ctx)=> module.exports["mission"](ctx),
  "task": async (ctx)=> module.exports["mission"](ctx),
  "tasks": async (ctx)=> module.exports["mission"](ctx),
  "mission claim": async (ctx)=> module.exports["mission"]({...ctx, args:["claim", ctx.args[0]]}),
  "mission info": async ({api,tid,args,MISSIONS_LIST})=>{ const id=parseInt(args[0]); const m=MISSIONS_LIST.find(x=>x.id==id); api.sendMessage(m?`${m.name} ${m.req} ${m.reward}`:`No mission`, tid); },
  "daily mission": async (ctx)=> module.exports["mission"](ctx),
  "weekly mission": async (ctx)=> module.exports["mission"](ctx),

  // ===== MARKET / CRYPTO 10 CMDS =====
  "market": async ({api,tid,PETS_LIST,WEAPONS_LIST,CARS_LIST,SEEDS_LIST,CRYPTO_LIST})=>{
    api.sendMessage(`╭─〔 🛒 MARKET - BUY WITH NAME+AMOUNT! 〕─╮\n🐾 Pets: ${PETS_LIST.slice(0,3).map(p=>`${p.emoji}${p.name} $${(p.price/1000000).toFixed(1)}M`).join(", ")}\n🔫 Weapons: ${WEAPONS_LIST.slice(0,3).map(w=>`${w.emoji}${w.name} $${w.price}`).join(", ")}\n🏎️ Cars: ${CARS_LIST.slice(0,3).map(c=>`${c.emoji}${c.name}`).join(", ")}\n🌱 Seeds: ${SEEDS_LIST.slice(0,3).map(s=>`${s.emoji}${s.name}`).join(", ")}\n₿ Crypto: ${CRYPTO_LIST.map(c=>c.symbol).join(", ")}\nUse:!pet buy <name> <amount>!weapon buy <name> <amount>\n╰──────────────────╯`, tid);
  },
  "shop": async (ctx)=> module.exports["market"](ctx),
  "crypto": async ({api,tid,args,CRYPTO_LIST,user,save})=>{
    if(args[0]=="buy"){ const sym=args[1]?.toUpperCase(); const amt=parseFloat(args[2])||1; const c=CRYPTO_LIST.find(x=>x.symbol==sym); if(!c) return api.sendMessage(`Crypto: ${CRYPTO_LIST.map(x=>x.symbol).join(", ")}`,tid); const cost=c.price*amt; if(user.cash<cost) return api.sendMessage(`Need $${cost}`,tid); user.cash-=cost; user.crypto[c.symbol]=(user.crypto[c.symbol]||0)+amt; save(); api.sendMessage(`₿ Bought ${amt} ${sym} for $${cost}!`, tid); }
    else api.sendMessage(`₿ Crypto:\n${CRYPTO_LIST.map(c=>`${c.emoji} ${c.name} (${c.symbol}) $${c.price}`).join("\n")}\nUse!crypto buy <SYMBOL> <amount>`, tid);
  },
  "btc": async (ctx)=> module.exports["crypto"](ctx),
  "buy": async ({api,tid,args,user})=>{ api.sendMessage(`Use:!pet buy <name> <amount>,!weapon buy <name> <amount>,!car buy <name> <amount>,!seed buy <name> <amount>`, tid); },
  "sell": async ({api,tid})=>{ api.sendMessage(`Use!pet sell <name> <amount>`, tid); },
  "inventory": async ({api,tid,user})=>{ api.sendMessage(`📦 Inv: Pets ${user.pets.length}, Weapons ${user.weapons.length}, Cars ${user.cars.length}, Seeds ${user.seeds.length}, Crypto ${Object.keys(user.crypto).length}`, tid); },
  "inv": async (ctx)=> module.exports["inventory"](ctx),
  "networth": async ({api,tid,user})=>{ const nw=user.cash+user.bank+user.coins*10000000; api.sendMessage(`💰 Networth $${nw.toLocaleString()} LVL ${user.level}/1000 Prestige ${user.prestige}`, tid); },
  "worth": async (ctx)=> module.exports["networth"](ctx),
  "level": async ({api,tid,user,makeBar})=>{ api.sendMessage(`📊 Level ${user.level}/1000 ${makeBar(user.xp, user.level*1000)} Prestige ${user.prestige}/10 ${makeBar(user.prestige,10)} XP ${user.xp}`, tid); },
  "lvl": async (ctx)=> module.exports["level"](ctx),
  "xp": async (ctx)=> module.exports["level"](ctx),
  "prestige": async ({api,tid,user,makeBar})=>{ api.sendMessage(`👑 Prestige ${user.prestige}/10 ${makeBar(user.prestige,10)} Need LVL 1000 + 5M XP to prestige! You LVL ${user.level} XP ${user.xp}`, tid); },
  "rank": async (ctx)=> module.exports["level"](ctx)
};
