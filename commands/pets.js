// cmds/pets.js - 50 PETS COMMANDS - 30 Dangerous Pets Rarity up to Divine+ + PVP/Dungeon/Raid/Boss/Arena + Pokemon
// Buy with name+amount, Bars, Canvas, Levels 1-1000

module.exports = {

  // ===== PET LIST + INFO =====
  "pet": async ({api,tid,args,user,save,PETS_LIST,makeBar})=>{
    if(!args[0] || args[0]=="list"){
      let txt=`╭─〔 🐾 30 DANGEROUS PETS - RARITY UP TO DIVINE+! 〕─╮\n`;
      PETS_LIST.forEach((p,i)=> txt+=`${i+1}. ${p.emoji} ${p.name} - ${p.rarity} 💰$${(p.price/1000000).toFixed(1)}M Power ${p.power} ${makeBar(p.power,3000,5)}\n`);
      txt+=`Use:!pet buy <name> <amount> |!pet info <name>\n╰──────────────────╯`;
      return api.sendMessage(txt,tid);
    }
    if(args[0]=="buy"){
      const amt=parseInt(args[args.length-1])||1;
      const name=args.slice(1,args.length-1).join(" ") || args[1];
      if(isNaN(parseInt(args[args.length-1]))) { // no amount given
        const name2=args.slice(1).join(" "); const pet=PETS_LIST.find(p=>p.name.toLowerCase()==name2.toLowerCase() || p.name.toLowerCase().includes(name2.toLowerCase()));
        if(!pet) return api.sendMessage(`❌ Pet not found: ${name2}\nPets: ${PETS_LIST.map(p=>p.name).join(", ")}`,tid);
        if(user.cash<pet.price) return api.sendMessage(`❌ Need $${pet.price.toLocaleString()} have $${user.cash.toLocaleString()} for ${pet.emoji} ${pet.name}`,tid);
        user.cash-=pet.price; user.pets.push(pet); save();
        return api.sendMessage(`✅ Bought ${pet.emoji} ${pet.name} x1! Rarity ${pet.rarity} Power ${pet.power} ${makeBar(pet.power,3000,8)}\n💰 Cash $${user.cash.toLocaleString()} Pets ${user.pets.length}`,tid);
      } else {
        const petName=args.slice(1,args.length-1).join(" ");
        const pet=PETS_LIST.find(p=>p.name.toLowerCase()==petName.toLowerCase() || p.name.toLowerCase().includes(petName.toLowerCase()));
        if(!pet) return api.sendMessage(`❌ Pet ${petName} not found`,tid);
        const cost=pet.price*amt;
        if(user.cash<cost) return api.sendMessage(`❌ Need $${cost.toLocaleString()} for ${pet.name} x${amt} (each $${pet.price.toLocaleString()}) have $${user.cash.toLocaleString()}`,tid);
        user.cash-=cost; for(let i=0;i<amt;i++) user.pets.push(pet); save();
        return api.sendMessage(`✅ Bought ${pet.emoji} ${pet.name} x${amt} for $${cost.toLocaleString()}!\nPower ${pet.power*amt} total! Pets ${user.pets.length} Cash $${user.cash.toLocaleString()}`,tid);
      }
    }
    if(args[0]=="info"){
      const name=args.slice(1).join(" "); const pet=PETS_LIST.find(p=>p.name.toLowerCase().includes(name.toLowerCase()));
      if(!pet) return api.sendMessage(`Pet ${name} not found`,tid);
      return api.sendMessage(`╭─〔 ${pet.emoji} ${pet.name} INFO 〕─╮\nRarity ${pet.rarity} Price $${pet.price.toLocaleString()} Power ${pet.power} ${makeBar(pet.power,3000,10)}\nType ${pet.type}\nBuy:!pet buy ${pet.name} <amount>\n╰──────────────────╯`,tid);
    }
    if(args[0]=="sell"){
      const amt=parseInt(args[args.length-1])||1; const name=args.slice(1,args.length-1).join(" ")||args[1];
      const idx=user.pets.findIndex(p=>p.name.toLowerCase().includes(name.toLowerCase()));
      if(idx==-1) return api.sendMessage(`You don't have ${name}`,tid);
      const pet=user.pets[idx]; user.pets.splice(idx,amt); user.cash+=Math.floor(pet.price*0.7*amt); save();
      api.sendMessage(`✅ Sold ${pet.emoji} ${pet.name} x${amt} for $${Math.floor(pet.price*0.7*amt).toLocaleString()} (70%)`,tid);
    }
  },
  "pets": async (ctx)=> module.exports["pet"]({...ctx, args:["list"]}),
  "pet list": async (ctx)=> module.exports["pet"]({...ctx, args:["list"]}),
  "pet buy": async (ctx)=> module.exports["pet"](ctx),
  "pet info": async (ctx)=> module.exports["pet"](ctx),
  "mypets": async ({api,tid,user,makeBar})=>{
    if(user.pets.length==0) return api.sendMessage(`No pets! Buy!pet buy Shadow Hound 1`,tid);
    let txt=`╭─〔 🐾 MY PETS ${user.pets.length} - Power ${user.pets.reduce((a,p)=>a+p.power,0)} 〕─╮\n`;
    user.pets.slice(0,20).forEach((p,i)=> txt+=`${i+1}. ${p.emoji} ${p.name} Power ${p.power} ${makeBar(p.power,3000,5)}\n`);
    txt+=`Total Power ${user.pets.reduce((a,p)=>a+p.power,0)}\n╰──────────────────╯`;
    api.sendMessage(txt,tid);
  },
  "my pet": async (ctx)=> module.exports["mypets"](ctx),

  // ===== PVP =====
  "pvp": async ({api,tid,args,user,save,getUser,makeBar,addXP})=>{
    const target=args[0]?.replace(/[@<>]/g,""); if(!target) return api.sendMessage(`⚔️ Use:!pvp @user - Pet PVP battle!`,tid);
    if(user.pets.length==0) return api.sendMessage(`❌ No pets! Buy!pet buy Shadow Hound 1`,tid);
    const t=getUser(target); if(t.pets.length==0) return api.sendMessage(`Target no pets!`,tid);
    const myPower=user.pets.reduce((a,p)=>a+p.power,0); const tPower=t.pets.reduce((a,p)=>a+p.power,0);
    const myBar=makeBar(myPower, myPower+tPower,10); const tBar=makeBar(tPower, myPower+tPower,10);
    let win=false; if(myPower>tPower){ win=true; const reward=Math.floor(Math.random()*1000000)+100000; user.cash+=reward; t.cash-=Math.min(reward,t.cash); save(); api.sendMessage(`╭─〔 ⚔️ PVP WIN - ${myPower} vs ${tPower} 〕─╮\nYou ${myPower} ${myBar} vs Enemy ${tPower} ${tBar}\n✅ YOU WIN! +$${reward.toLocaleString()}!\nPets: You ${user.pets[0].emoji} ${user.pets[0].name} vs ${t.pets[0].emoji} ${t.pets[0].name}\n╰──────────────────╯`,tid); } else { const loss=Math.floor(Math.random()*500000)+50000; user.cash-=Math.min(loss,user.cash); t.cash+=loss; save(); api.sendMessage(`╭─〔 ⚔️ PVP LOSE - ${myPower} vs ${tPower} 〕─╮\nYou ${myPower} ${myBar} vs Enemy ${tPower} ${tBar}\n❌ YOU LOSE! -$${loss.toLocaleString()}!\n╰──────────────────╯`,tid); }
    addXP(tid,100);
  },
  "battle": async (ctx)=> module.exports["pvp"](ctx),
  "pet battle": async (ctx)=> module.exports["pvp"](ctx),
  "fight": async (ctx)=> module.exports["pvp"](ctx),

  // ===== DUNGEON =====
  "dungeon": async ({api,tid,args,user,save,makeBar,addXP})=>{
    const lvl=parseInt(args[0])||1;
    if(lvl>user.level) return api.sendMessage(`❌ Dungeon Lv${lvl} requires Level ${lvl}! You LVL ${user.level} ${makeBar(user.level,lvl)}`,tid);
    if(user.pets.length==0) return api.sendMessage(`Need pet!`,tid);
    const power=user.pets.reduce((a,p)=>a+p.power,0);
    const needPower=lvl*50; if(power<needPower) return api.sendMessage(`❌ Need Power ${needPower}! You ${power} ${makeBar(power,needPower)}`,tid);
    const reward=lvl*100000+Math.floor(Math.random()*lvl*50000);
    user.cash+=reward; user.coins+=1; const r=addXP(tid,lvl*20); user.workCount++; if(r.leveled) user.pets.push({name:"Blood Wolf"}); save();
    api.sendMessage(`╭─〔 🏰 DUNGEON Lv${lvl} CLEARED! ${makeBar(lvl,100,8)} 〕─╮\nPower ${power}/${needPower} ✅\n💰 +$${reward.toLocaleString()} +1 coin +${lvl*20}XP!\nLVL ${user.level}/1000 ${r.leveled?`UP to ${r.lvl}! +$${r.cash}!`:""}\nWork ${user.workCount} +3 things: cash+coins+pet chance!\n╰──────────────────╯`,tid);
  },
  "dung": async (ctx)=> module.exports["dungeon"](ctx),
  "dungeons": async (ctx)=> module.exports["dungeon"](ctx),

  // ===== RAID =====
  "raid": async ({api,tid,args,user,save,getUser,makeBar,addXP})=>{
    const targets=args.map(a=>a.replace(/[@<>]/g,"")).filter(Boolean);
    if(targets.length<1) return api.sendMessage(`👥 Use:!raid @user @user - 3 players raid boss!`,tid);
    const team=[user,...targets.map(id=>getUser(id))];
    const teamPower=team.reduce((sum,u)=> sum+u.pets.reduce((a,p)=>a+p.power,0),0);
    const bossPower=2000+Math.floor(Math.random()*3000);
    const bar=makeBar(teamPower,bossPower+teamPower,10);
    if(teamPower>bossPower){ const rewardPer=1000000; team.forEach(u=>{u.cash+=rewardPer; u.coins+=1;}); save(); api.sendMessage(`╭─〔 👥 RAID WIN! Team ${teamPower} vs Boss ${bossPower} ${bar} 〕─╮\n✅ WIN! Each +$${rewardPer.toLocaleString()} +1 coin!\nTeam: ${team.length} players Power ${teamPower}\nBoss Power ${bossPower}\n╰──────────────────╯`,tid); } else { api.sendMessage(`╭─〔 👥 RAID LOSE! Team ${teamPower} vs Boss ${bossPower} ${bar} 〕─╮\n❌ LOSE! Need more power!\n╰──────────────────╯`,tid); }
    addXP(tid,150);
  },

  // ===== BOSS FIGHT =====
  "boss": async ({api,tid,user,save,makeBar,addXP,PETS_LIST})=>{
    const bosses=[{name:"Godzilla King", power:2000, reward:100000000, emoji:"👑"}, {name:"Void Emperor Boss", power:5000, reward:500000000, emoji:"🌌"}, {name:"Kraken", power:1500, reward:50000000, emoji:"🐙"}];
    const boss=bosses[Math.floor(Math.random()*bosses.length)];
    const myPower=user.pets.reduce((a,p)=>a+p.power,0);
    const dmg=Math.min(myPower, boss.power); const hpLeft=boss.power-dmg;
    const bar=makeBar(dmg,boss.power,12);
    if(myPower>=boss.power){ user.cash+=boss.reward; user.coins+=5; save(); api.sendMessage(`╭─〔 👹 BOSS ${boss.name} DEFEATED! ${bar} 〕─╮\n${boss.emoji} Boss Power ${boss.power} vs You ${myPower}!\nDamage ${dmg} Boss HP ${hpLeft} -> 0!\n💰 +$${boss.reward.toLocaleString()} +5 coins!\nLVL ${user.level} +200XP!\n╰──────────────────╯`,tid); } else { api.sendMessage(`╭─〔 👹 BOSS ${boss.name} HP ${hpLeft}/${boss.power} ${bar} 〕─╮\nYou dealt ${dmg} dmg! Need ${boss.power} power!\nYour Power ${myPower} ${makeBar(myPower,boss.power)}\nKeep fighting! Use stronger pets like ${PETS_LIST[29].name}!\n╰──────────────────╯`,tid); }
    addXP(tid,200);
  },
  "bossfight": async (ctx)=> module.exports["boss"](ctx),
  "boss fight": async (ctx)=> module.exports["boss"](ctx),

  // ===== ARENA =====
  "arena": async ({api,tid,args,user,save,makeBar,data})=>{
    if(args[0]=="join" ||!args[0]){
      if(!data.arena) data.arena=[];
      if(!data.arena.includes(tid)) data.arena.push(tid);
      const power=user.pets.reduce((a,p)=>a+p.power,0);
      const all=Object.entries(data.users).map(([id,u])=>({id, power:u.pets.reduce((a,p)=>a+p.power,0), level:u.level})).sort((a,b)=>b.power-a.power);
      const rank=all.findIndex(a=>a.id==tid)+1 || all.findIndex(a=>a.id==user.id)+1 || 100;
      save();
      api.sendMessage(`╭─〔 🏟️ ARENA RANK #${rank} Power ${power} ${makeBar(power,10000,10)} 〕─╮\n🏆 Rank #${rank} / ${all.length} players!\nPower ${power} LVL ${user.level}/1000\nTop 1: ID ${all[0]?.id} Power ${all[0]?.power}\nReward Top 1: $50M daily!\nUse!arena top for leaderboard!\n╰──────────────────╯`,tid);
    }
    if(args[0]=="top"){
      const all=Object.entries(data.users).map(([id,u])=>({id, power:u.pets.reduce((a,p)=>a+p.power,0)})).sort((a,b)=>b.power-a.power).slice(0,10);
      let txt=`╭─〔 🏟️ ARENA TOP 10 〕─╮\n`; all.forEach((a,i)=> txt+=`${i+1}. ID ${a.id} Power ${a.power} ${makeBar(a.power,10000,5)}\n`); txt+=`╰──────────────────╯`; api.sendMessage(txt,tid);
    }
  },

  // ===== POKEMON 20 =====
  "pokemon": async ({api,tid,POKEMON_LIST,makeBar})=>{
    let txt=`╭─〔 ⚡ 20 POKEMON LIST! 〕─╮\n`; POKEMON_LIST.forEach((p,i)=> txt+=`${i+1}. ${p.emoji} ${p.name} ${p.rarity} $${(p.worth/1000000).toFixed(1)}M Power ${p.power} ${makeBar(p.power,3000,4)}\n`); txt+=`Spawn every 20min! Use!catch\n╰──────────────────╯`; api.sendMessage(txt,tid);
  },
  "pokemons": async (ctx)=> module.exports["pokemon"](ctx),
  "pokedex": async (ctx)=> module.exports["pokemon"](ctx),
  "catch": async ({api,tid,user,save,currentPokemon,makeBar,addXP})=>{
    if(!currentPokemon || currentPokemon.caught) return api.sendMessage(`❌ No pokemon spawned! Wait 20min! Next spawn soon!`,tid);
    if(Date.now()-currentPokemon.spawnedAt>20*60*1000) return api.sendMessage(`❌ Pokemon escaped! Spawned 20min ago!`,tid);
    const chance=user.level/1000+0.5;
    if(Math.random()<chance){
      currentPokemon.caught=true; user.pets.push({name:currentPokemon.name, rarity:currentPokemon.rarity, power:currentPokemon.power, price:currentPokemon.worth, emoji:currentPokemon.emoji}); user.cash+=Math.floor(currentPokemon.worth*0.1); addXP(tid,300); save();
      api.sendMessage(`╭─〔 🎉 CAUGHT ${currentPokemon.emoji} ${currentPokemon.name}! ${makeBar(currentPokemon.power,3000,8)} 〕─╮\n✅ Caught! Worth $${currentPokemon.worth.toLocaleString()} Power ${currentPokemon.power} Rarity ${currentPokemon.rarity}!\n💰 +$${Math.floor(currentPokemon.worth*0.1).toLocaleString()} bonus!\nPets ${user.pets.length} LVL ${user.level}\n╰──────────────────╯`,tid);
    } else {
      api.sendMessage(`❌ ${currentPokemon.name} escaped! Try again! Power ${currentPokemon.power} ${makeBar(currentPokemon.power,3000)}`,tid);
    }
  },
  "poke catch": async (ctx)=> module.exports["catch"](ctx),

  // ===== MORE PET CMDS 30-50 =====
  "pet battle top": async ({api,tid,data,makeBar})=>{ const top=Object.entries(data.users).sort((a,b)=> b[1].pets.reduce((s,p)=>s+p.power,0)-a[1].pets.reduce((s,p)=>s+p.power,0)).slice(0,10); let txt=`🏆 PET POWER TOP 10\n`; top.forEach((u,i)=> txt+=`${i+1}. ID ${u[0]} Power ${u[1].pets.reduce((s,p)=>s+p.power,0)} ${makeBar(u[1].pets.reduce((s,p)=>s+p.power,0),10000,5)}\n`); api.sendMessage(txt,tid); },
  "feed": async ({api,tid,user,save})=>{ if(user.pets.length==0) return api.sendMessage(`No pets`,tid); user.pets[0].power+=10; save(); api.sendMessage(`🍖 Fed ${user.pets[0].emoji} ${user.pets[0].name} Power +10 -> ${user.pets[0].power}`,tid); },
  "pet feed": async (ctx)=> module.exports["feed"](ctx),
  "pet level": async ({api,tid,user,makeBar})=>{ if(user.pets.length==0) return api.sendMessage(`No pets`,tid); api.sendMessage(`🐾 ${user.pets[0].name} Power ${user.pets[0].power} ${makeBar(user.pets[0].power,3000)} LVL ${user.level}`,tid); },
  "evolve": async ({api,tid,user,save})=>{ if(user.pets.length==0) return api.sendMessage(`No pets`,tid); if(user.cash<10000000) return api.sendMessage(`Need $10M to evolve`,tid); user.cash-=10000000; user.pets[0].power+=100; save(); api.sendMessage(`✨ Evolved ${user.pets[0].name} Power +100 -> ${user.pets[0].power}`,tid); },
  "pet evolve": async (ctx)=> module.exports["evolve"](ctx),
  "pet sell": async (ctx)=> module.exports["pet"]({...ctx, args:["sell",...ctx.args]}),
  "heal": async ({api,tid})=> api.sendMessage(`💚 Healed pets!`,tid),
  "pet heal": async (ctx)=> module.exports["heal"](ctx),
  "train": async ({api,tid,user,save,addXP})=>{ if(user.pets.length==0) return api.sendMessage(`No pets`,tid); user.pets[0].power+=5; addXP(tid,50); save(); api.sendMessage(`🏋️ Trained ${user.pets[0].name} +5 power -> ${user.pets[0].power} +50XP`,tid); },
  "pet train": async (ctx)=> module.exports["train"](ctx),
  "release": async ({api,tid,args,user,save})=>{ const name=args.join(" "); const idx=user.pets.findIndex(p=>p.name.toLowerCase().includes(name.toLowerCase())); if(idx==-1) return api.sendMessage(`No pet ${name}`,tid); user.pets.splice(idx,1); save(); api.sendMessage(`🕊️ Released ${name}`,tid); },
  "pet release": async (ctx)=> module.exports["release"](ctx),
  "rename pet": async ({api,tid,args,user,save})=>{ const old=args[0]; const newName=args[1]; if(!user.pets[0]) return api.sendMessage(`No pets`,tid); user.pets[0].name=newName; save(); api.sendMessage(`✏️ Renamed pet to ${newName}`,tid); },
  "pet rename": async (ctx)=> module.exports["rename pet"](ctx),
  "power": async ({api,tid,user,makeBar})=>{ const p=user.pets.reduce((a,x)=>a+x.power,0); api.sendMessage(`⚡ Total Pet Power ${p} ${makeBar(p,10000,12)} Pets ${user.pets.length}`,tid); },
  "mypower": async (ctx)=> module.exports["power"](ctx),
  "pet power": async (ctx)=> module.exports["power"](ctx),
  "fusion": async ({api,tid,user,save})=>{ if(user.pets.length<2) return api.sendMessage(`Need 2 pets to fuse`,tid); const p1=user.pets.pop(); const p2=user.pets.pop(); const fused={name:`${p1.name}-${p2.name} Fusion`, power:p1.power+p2.power+100, rarity:"Mythic", price:(p1.price||1000000)+(p2.price||1000000), emoji:"🌌"}; user.pets.push(fused); save(); api.sendMessage(`🌌 Fused ${p1.name}+${p2.name} -> ${fused.name} Power ${fused.power}`,tid); },
  "pet fusion": async (ctx)=> module.exports["fusion"](ctx),
  "pet combine": async (ctx)=> module.exports["fusion"](ctx),
  "trade pet": async ({api,tid})=> api.sendMessage(`Use!trade @user`,tid),
  "gift pet": async ({api,tid,args,user,save,getUser})=>{ const target=args[0]?.replace(/[@<>]/g,""); const name=args.slice(1).join(" "); const idx=user.pets.findIndex(p=>p.name.toLowerCase().includes(name.toLowerCase())); if(idx==-1) return api.sendMessage(`You don't have ${name}`,tid); const t=getUser(target); t.pets.push(user.pets[idx]); user.pets.splice(idx,1); save(); api.sendMessage(`🎁 Gifted ${name} to ${target}`,tid); }
};
