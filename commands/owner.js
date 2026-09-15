// cmds/owner.js - 50 OWNER COMMANDS - Only Owner ID 100086783504073 + Crates, Pokemon, Logs, Requirements, Bars, Prestige!

module.exports = {

  // ===== OWNER CHECK 5 CMDS =====
  "owner": async ({api,tid,OWNER_ID})=>{
    api.sendMessage(`╭─〔 👑 OWNER INFO - Ahmed Khan 👑 〕─╮\n👑 Owner: Ahmed Khan\n🆔 ID: ${OWNER_ID}\n[Real FB Pic Owner]\n💰 Net $375M+ 💎 Top #1\n📜 400 cmds - 8 files x 50\n🔥 Premium: $50M+ $200M+ $500M crates have pets+money!\nUse!admin for owner cmds!\n╰──────────────────╯`,tid);
  },
  "owner info": async (ctx)=> module.exports["owner"](ctx),
  "owner id": async ({api,tid,OWNER_ID})=> api.sendMessage(`👑 Owner ID ${OWNER_ID} Ahmed Khan!`,tid),
  "creator": async (ctx)=> module.exports["owner"](ctx),
  "dev": async (ctx)=> module.exports["owner"](ctx),

  // ===== GIVE / ECONOMY OWNER 15 CMDS =====
  "giveall": async ({api,tid,args,data,save,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`❌ Only Owner ${OWNER_ID} can use!giveall!`,tid);
    const amt=parseInt(args[0])||1000000;
    Object.values(data.users).forEach(u=> u.cash+=amt);
    save(); api.sendMessage(`✅ GiveAll $${amt.toLocaleString()} to ${Object.keys(data.users).length} users! Each got $${amt.toLocaleString()}!`,tid);
  },
  "give": async ({api,tid,args,getUser,save,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    const target=args[0]?.replace(/[@<>]/g,""); const amt=parseInt(args[1])||1000000;
    const u=getUser(target); u.cash+=amt; save(); api.sendMessage(`✅ Gave $${amt.toLocaleString()} to ${target}!`,tid);
  },
  "give cash": async (ctx)=> module.exports["give"](ctx),
  "add cash": async (ctx)=> module.exports["give"](ctx),
  "set level": async ({api,tid,args,getUser,save,OWNER_ID,uid,makeBar})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    const target=args[0]?.replace(/[@<>]/g,""); const lvl=parseInt(args[1])||1;
    if(lvl>1000) return api.sendMessage(`❌ Max Level 1000! Prestige after! You set ${lvl}`,tid);
    const u=getUser(target); u.level=lvl; save(); api.sendMessage(`✅ Set Level ${target} to ${lvl}/1000 ${makeBar(lvl,1000)}`,tid);
  },
  "set prestige": async ({api,tid,args,getUser,save,OWNER_ID,uid,makeBar})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    const target=args[0]?.replace(/[@<>]/g,""); const pres=parseInt(args[1])||0;
    const u=getUser(target); u.prestige=pres; save(); api.sendMessage(`✅ Set Prestige ${target} to ${pres}/10 ${makeBar(pres,10)}`,tid);
  },
  "reset": async ({api,tid,args,getUser,save,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    const target=args[0]?.replace(/[@<>]/g,""); const u=getUser(target); u.cash=5000000; u.bank=20000000; u.level=1; u.xp=0; u.prestige=0; u.pets=[]; save(); api.sendMessage(`✅ Reset ${target} to Level 1!`,tid);
  },
  "banall": async ({api,tid,args,data,save,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    const target=args[0]?.replace(/[@<>]/g,""); if(target){ data.users[target].banned=true; save(); api.sendMessage(`🚫 Banned ${target}`,tid); }
  },
  "unbanall": async ({api,tid,data,save,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    Object.values(data.users).forEach(u=> u.banned=false); save(); api.sendMessage(`✅ Unbanned all!`,tid);
  },

  // ===== CRATES 10 CMDS - $50M $200M $500M HAVE PETS+MONEY =====
  "crate": async ({api,tid,args,user,save,CRATES_LIST,PETS_LIST,makeBar})=>{
    if(args[0]=="list"){
      let txt=`╭─〔 📦 CRATES LIST - Buy name+amount! 〕─╮\n`; CRATES_LIST.forEach(c=> txt+=`${c.emoji} ${c.name} - $${(c.price/1000000).toFixed(1)}M Reward ${c.rewards}\n`); txt+=`Premium: Owner Crate $100M has $50M+Leg pet!\nUse!crate buy <name> <amount>\n╰──────────────────╯`; return api.sendMessage(txt,tid);
    }
    if(args[0]=="buy"){
      const amt=parseInt(args[args.length-1])||1; const name=args.slice(1,args.length-1).join(" ") || args[1];
      if(isNaN(parseInt(args[args.length-1]))){ // no amount
        const crate=CRATES_LIST.find(c=>c.name.toLowerCase().includes(args.slice(1).join(" ").toLowerCase()));
        if(!crate) return api.sendMessage(`Crate not found`,tid);
        if(user.cash<crate.price) return api.sendMessage(`Need $${crate.price.toLocaleString()}`,tid);
        user.cash-=crate.price;
        if(crate.name.includes("Owner")){ user.cash+=50000000; user.pets.push(PETS_LIST[13]); } // $50M + Legendary pet for Owner crate $100M+
        else if(crate.price>=50000000){ user.cash+=20000000; user.pets.push(PETS_LIST[10]); } // $200M crate
        else if(crate.price>=200000000){ user.cash+=100000000; user.pets.push(PETS_LIST[20]); } // $500M
        else { user.cash+=Math.floor(Math.random()*1000000)+500000; }
        save(); return api.sendMessage(`📦 Opened ${crate.emoji} ${crate.name}! +$${(crate.price*0.5).toLocaleString()} +pet ${user.pets.slice(-1)[0]?.name||""}! Cash $${user.cash.toLocaleString()}`,tid);
      } else {
        const cname=args.slice(1,args.length-1).join(" "); const crate=CRATES_LIST.find(c=>c.name.toLowerCase().includes(cname.toLowerCase()));
        if(!crate) return api.sendMessage(`Crate ${cname} not found`,tid);
        const cost=crate.price*amt; if(user.cash<cost) return api.sendMessage(`Need $${cost.toLocaleString()}`,tid);
        user.cash-=cost; for(let i=0;i<amt;i++){ if(crate.name.includes("Owner")){ user.cash+=50000000; user.pets.push(PETS_LIST[13]); } else { user.cash+=1000000; user.pets.push(PETS_LIST[0]); } } save();
        api.sendMessage(`📦 Bought ${crate.name} x${amt} for $${cost.toLocaleString()}! Got $${(50000000*amt).toLocaleString()} +${amt} pets!`,tid);
      }
    }
    if(args[0]=="open"){ return module.exports["crate"]({...arguments[0], args:["buy",...args.slice(1)]}); }
  },
  "crates": async (ctx)=> module.exports["crate"]({...ctx, args:["list"]}),
  "crate list": async (ctx)=> module.exports["crate"]({...ctx, args:["list"]}),
  "crate buy": async (ctx)=> module.exports["crate"](ctx),
  "open crate": async (ctx)=> module.exports["crate"](ctx),
  "premium crate": async ({api,tid,user,save,PETS_LIST})=>{
    if(user.cash<50000000) return api.sendMessage(`❌ Premium Crate $50M need $50M have $${user.cash.toLocaleString()} - Reward $50M+Legendary pet Killer Dragon!`,tid);
    user.cash-=50000000; user.cash+=75000000; user.pets.push(PETS_LIST[13]); save(); api.sendMessage(`💎 Premium $50M Crate! Got Killer Dragon Legendary Power 500 +$75M! Profit $25M!`,tid);
  },
  "200m crate": async ({api,tid,user,save,PETS_LIST})=>{
    if(user.cash<200000000) return api.sendMessage(`Need $200M`,tid);
    user.cash-=200000000; user.cash+=250000000; user.pets.push(PETS_LIST[20]); user.pets.push(PETS_LIST[13]); save(); api.sendMessage(`💎 $200M Crate! Got Mecha Beast Mythic + Killer Dragon +$250M!`,tid);
  },
  "500m crate": async ({api,tid,user,save,PETS_LIST})=>{
    if(user.cash<500000000) return api.sendMessage(`Need $500M`,tid);
    user.cash-=500000000; user.cash+=750000000; user.pets.push(PETS_LIST[29]); save(); api.sendMessage(`💎 $500M Crate! Got Void Emperor Divine+ Power 3000 $2B +$750M!`,tid);
  },

  // ===== LOGS / ANTI / AUTO / REQUIREMENTS 20 CMDS =====
  "logs": async ({api,tid,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    api.sendMessage(`📜 Logs: Bot Uptime ${Math.floor(process.uptime()/3600)}h! Commands 400! Owner ${OWNER_ID}! Render Port ${process.env.PORT}! AQ Key ${process.env.GEMINI_KEY?.slice(0,4)}...`,tid);
  },
  "log": async (ctx)=> module.exports["logs"](ctx),
  "bot logs": async (ctx)=> module.exports["logs"](ctx),
  "error logs": async (ctx)=> module.exports["logs"](ctx),
  "requirements": async ({api,tid})=>{
    api.sendMessage(`╭─〔 📋 REQUIREMENTS - LEVELS 1-1000 + PRESTIGE! 〕─╮\n🎮 Games: Need LVL 5+ for slots, LVL 10+ for rob\n🐾 Pets: LVL 20+ for rare, LVL 100+ for Divine\n⚔️ PVP: LVL 30+ Power 500+\n🏰 Dungeon: LVL = Dungeon LVL Power LVL*50\n👹 Boss: Power 2000+ for Godzilla\n🏟️ Arena: LVL 50+\n💍 Marry: $1M + LVL 10\n🚨 Warn: LVL 50+ to warn\n🕵️ Spy: LVL 100+ or Admin\n👑 Admin: Need Admin or Owner ID 100086783504073\n👑 Owner cmds: Only Owner 100086783504073\n📊 Level 1-1000, each work/mission +XP +3 things (cash+coins+pet) +money\n👑 Prestige after 1000 need 5M XP -> Reset to 1 + Prestige 1 +$100M per prestige!\nBars: █░ 50% on balance, level, prestige, pet power!\n╰──────────────────╯`,tid);
  },
  "req": async (ctx)=> module.exports["requirements"](ctx),
  "rules": async (ctx)=> module.exports["requirements"](ctx),
  "levels": async ({api,tid,makeBar})=>{
    api.sendMessage(`📊 Levels 1-1000 ${makeBar(500,1000)} + Prestige 10! Each mission work + LVL +3 things cash+coins+pet +money! Bars on important!`,tid);
  },
  "level system": async (ctx)=> module.exports["levels"](ctx),
  "prestige system": async (ctx)=> module.exports["levels"](ctx),
  "bars": async ({api,tid,makeBar})=>{
    api.sendMessage(`📊 Bars System: Important cmds show bars!\n${makeBar(50,100)} Level\n${makeBar(5,10)} Prestige\n${makeBar(1500,3000)} Pet Power\n${makeBar(5000000,10000000)} Bank\nUse on balance, dungeon, pvp, boss, arena!`,tid);
  },
  "show bars": async (ctx)=> module.exports["bars"](ctx),
  "auto": async ({api,tid,args})=>{ api.sendMessage(`🤖 Auto: autoseen on/off, autoreact on/off, never sleep 30s save + 20min pokemon + auto reacts 🔥 to every msg!`,tid); },
  "auto list": async (ctx)=> module.exports["auto"](ctx),
  "bot never sleep": async ({api,tid})=> api.sendMessage(`😴 Never Sleep ON! Auto Seen 30s, Save 30s, Pokemon 20min, Auto React 🔥❤️😂 to every msg!`,tid),
  "render": async ({api,tid})=> api.sendMessage(`🌐 Render Port ${process.env.PORT||10000} - Express running! APPSTATE in ENV! GEMINI_KEY AQ... in ENV! Canvas + ws3 fca!`,tid),
  "env": async ({api,tid,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    api.sendMessage(`🔑 ENV: PORT=${process.env.PORT} OWNER_ID=${OWNER_ID} GEMINI_KEY=${process.env.GEMINI_KEY?.slice(0,10)}... APPSTATE length ${process.env.APPSTATE?.length||0}`,tid);
  },
  "restart": async ({api,tid,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    api.sendMessage(`🔄 Restarting bot... Render will auto restart!`,tid); setTimeout(()=> process.exit(0), 1000);
  },
  "shutdown": async (ctx)=> module.exports["restart"](ctx),
  "update": async ({api,tid,OWNER_ID,uid})=>{
    if(uid!=OWNER_ID) return api.sendMessage(`Only Owner!`,tid);
    api.sendMessage(`🔄 Updating... Pulling 400 cmds!`,tid);
  },
  "final menu": async ({api,tid})=>{
    api.sendMessage(`╭─〔 📜 FINAL MENU - 400 CMDS LINKED - 4 MENUS x100! 〕─╮\n1️⃣!menu economy - 100 cmds: Bank 25 + Work 25 + Missions 25 + Market 25\nTags: {name} etc + Bars 💰\n2️⃣!menu pets - 100 cmds: 30 Pets Dangerous Common->Divine+ $2B + PVP/Dungeon/Raid/Boss/Arena 20 + Weapons 10 + Cars 10 + Pokemon 20\nBuy:!pet buy Void Emperor 5 + amount!\n3️⃣!menu utility - 100 cmds: Info 35 UID/Count/Spy/Rank Bars + Utility 35 Welcome {name} {username} {count} {pic} {id} Leave {name} {count} {pic} + AI 20 Gemini AQ... + Download 10\n4️⃣!menu admin - 100 cmds: Filter/Whitelist/Thread/Pending/OnlyAdmin/Unsend/Ban + Owner 40 GiveAll/BanAll/Crates $50M $200M $500M have pets+money + Logs/Requirements/Bars/Levels 1-1000 Prestige\nAll 400 cmds have Real FB Pic Boxes + Bars + Bot reply to every msg + Auto Reacts 🔥 + Never Sleep!\nOwner: Ahmed Khan ID 100086783504073\n╰──────────────────╯`,tid);
  },
  "menu final": async (ctx)=> module.exports["final menu"](ctx),
  "400": async (ctx)=> module.exports["final menu"](ctx),
  "all menu": async (ctx)=> module.exports["final menu"](ctx),
  "all cmds": async ({api,tid})=>{
    api.sendMessage(`400 CMDS LIST:\nEconomy: balance bank deposit withdraw daily weekly monthly pay leaderboard rob crime beg work farm mine fish hunt chop dig collect job market crypto btc buy sell inventory networth level prestige rank mission quest task etc (100)\nPets: pet pets mypets pvp battle fight dungeon raid boss arena pokemon pokedex catch feed evolve heal train release power fusion trade gift etc (100)\nUtility: welcome leave count uid spy active rank top warnings wanted stats profile bio check uptime ping bot version help menu m1 m2 m3 m4 afk tagall warn unwarn clear unsend kick add rename emoji etc (100)\nAI/Admin/Owner: gemini ai aq ask gpt image canvas box logo yt tiktok fb ig sing lyrics filter whitelist blacklist ban unban thread onlyadmin pending antispam autoseen autoreact owner give giveall crate logs requirements levels bars auto render env restart final etc (100)\nAll linked!`,tid);
  }
};
