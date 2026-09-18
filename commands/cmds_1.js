const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={}),P=R.players||(R.players=new Map()),W=R.world||(R.world={day:1,weather:"☀️ Clear",event:"🌍 Normal",district:"Central"});
const U=id=>{id=String(id||"");let u=P.get(id);if(!u)u={id,cash:100000,bank:0,vault:0,savings:0,coins:100,tokens:0,xp:0,level:1,prestige:0,rebirth:0,legacy:0,career:1,skill:1,stats:{},achievements:[],badges:[],titles:[],activeTitle:"Rookie",discoveries:[],quests:[],completed:[],season:1,seasonXP:0,dailyClaims:{},cooldowns:{},lastDailyDate:"",streak:0,streakRewardDate:"",inventory:{},jobsDone:0,missionsDone:0,activitiesDone:0,totalEarned:0,lastRewards:[]};P.set(id,u);return u};
const N=x=>String(x||"").toLowerCase().trim(),num=x=>Math.max(0,Number(String(x||"").replace(/[$,]/g,""))||0),date=()=>new Date().toISOString().slice(0,10),BAR=(v,m=100,n=10)=>{v=Math.max(0,Math.min(m,v));let a=Math.round(v/m*n);return"█".repeat(a)+"░".repeat(n-a)},money=n=>`$${Math.floor(n).toLocaleString()}`,T=(c,s)=>c.reply(`🤖 ${s}`),D=(u,k)=>{u[k]=(u[k]||0)+1};
const XP=(c,n=100,why="Action")=>{let u=U(c.uid),old=u.level;u.xp+=Math.max(0,n);while(u.xp>=u.level*100){u.xp-=u.level*100;u.level++}return old<u.level?`\n🎉 LEVEL UP! ${old} ➜ ${u.level}`:""};
const AWARD=(c,x=100,cash=50000,items=["🎁 Mystery Box","💎 Gem","🪙 Token"])=>{let u=U(c.uid);u.cash+=cash;u.totalEarned+=cash;items.slice(0,3).forEach(i=>D(u.inventory,i));u.lastRewards=items.slice(0,3);return`💰 +${money(cash)}\n🎁 ${items.slice(0,3).join(" • ")}\n✨ +${x} XP${XP(c,x,"Reward")}`};
const CD=(u,k,s)=>{let z=Number(u.cooldowns[k]||0),r=z-Date.now();if(r>0)return Math.ceil(r/1000);u.cooldowns[k]=Date.now()+s*1000;return 0};
const CLAIM=(c,k,amt=100000,x=100,items=["🎁 Box","💎 Gem","🪙 Token"],hours=24)=>{let u=U(c.uid),r=CD(u,k,hours*3600);if(r)return`⏳ Try again in ${Math.ceil(r/3600)}h`;return AWARD(c,x,amt,items)};
const LIST=(a,p=1,n=10)=>{p=Math.max(1,Number(p)||1);let s=(p-1)*n;return a.slice(s,s+n).map((x,i)=>`${s+i+1}. ${x}`).join("\n")||"Nothing here.";
const target=c=>{let e=c.event||{},m=e.mentions||{};let ids=Object.keys(m);return ids[0]||e.messageReply?.senderID||e.replyToUserID||null};
const profile=async(c,id=c.uid)=>new Promise(res=>{try{c.api.getUserInfo(String(id),(e,d)=>{let u=d&&d[String(id)];res({uid:String(id),name:u?.name||String(id),pic:u?.thumbSrc||u?.profilePic||null})})}catch(e){res({uid:String(id),name:String(id),pic:null})}});
R.user=U;R.bar=BAR;R.reward=R.reward||((c,x,cash,items)=>AWARD(c,x,cash,items));R.profile=R.profile||profile;

const C={};const add=(names,fn)=>String(names).split("|").forEach(n=>C[N(n)]={name:N(n),execute:fn,module:"progression"});

add("level_xp",c=>{let u=U(c.uid);c.reply(`✨ LEVEL ${u.level}\n${BAR(u.xp,u.level*100)}\nXP: ${u.xp}/${u.level*100}`)});
add("rank_rewards",c=>c.reply(`🏆 RANK REWARDS\n${LIST(["🥉 Bronze — $50K","🥈 Silver — $100K","🥇 Gold — $250K","💎 Platinum — $500K","👑 Diamond — $1M","🔥 Master — $2M","⚡ Grandmaster — $5M","🌌 Mythic — $10M","☠️ Legend — $25M","👑 Apex — $50M"],1)}`));
add("prestige",c=>{let u=U(c.uid);if(u.level<50)return c.reply("🔒 Reach level 50 first.");u.prestige++;u.level=1;u.xp=0;c.reply(`👑 PRESTIGE ${u.prestige}!\n✨ Level reset to 1\n💰 +$500K`);u.cash+=500000});
add("rebirth",c=>{let u=U(c.uid);if(u.level<100)return c.reply("🔒 Reach level 100 first.");u.rebirth++;u.level=1;u.xp=0;u.cash+=1000000;c.reply(`♻️ REBIRTH ${u.rebirth}\n💰 +$1M`)});
add("passport",c=>c.reply(`🛂 KLERK PASSPORT\n👤 ${c.name}\n🆔 ${c.uid}\n🌍 District: ${W.district}\n⭐ Level: ${U(c.uid).level}`));
add("achieve_total",c=>c.reply(`🏆 Achievements: ${U(c.uid).achievements.length}`));
add("skills_tree",c=>c.reply(`🌳 SKILL TREE\n${LIST(["💪 Strength","🛡️ Defense","⚡ Speed","🧠 Intelligence","🍀 Luck","💰 Finance","🎯 Hunting","🎣 Fishing","⛏️ Mining","🌾 Farming"],1)}`));
add("title_shop",c=>c.reply(`🏷️ TITLE SHOP\n${LIST(["Rookie — $10K","Hustler — $50K","Boss — $100K","Legend — $250K","Mythic — $500K","King — $1M","Emperor — $2M","Shadow — $5M","Apex — $10M","Immortal — $25M"],1)}`));
add("legacy_score",c=>c.reply(`📜 Legacy Score: ${U(c.uid).legacy}`));
add("badge_case",c=>c.reply(`🎖️ BADGES\n${U(c.uid).badges.slice(0,10).join("\n")||"No badges yet."}`));
add("perk_activate",c=>c.reply("⚡ Perk activated for your next reward!"));
add("profile_glow",c=>c.reply("✨ Profile glow updated."));
add("stat_allocate",c=>{let u=U(c.uid),s=N(c.args[0]||"strength");u.stats[s]=(u.stats[s]||0)+1;c.reply(`📈 ${s} +1`)});
add("mastery_loop",c=>{let u=U(c.uid);u.skill++;c.reply(`🌀 Mastery increased to ${u.skill}`)});
add("career_level",c=>{let u=U(c.uid);u.career++;c.reply(`💼 Career level: ${u.career}`)});
add("season_pass",c=>c.reply(`🎫 Season ${U(c.uid).season}\nXP: ${U(c.uid).seasonXP}`));
add("booster_pack",c=>c.reply(AWARD(c,150,75000,["🚀 XP Booster","💎 Gem","🎁 Pack"])));
add("codex",c=>c.reply(`📖 CODEX\nDiscoveries: ${U(c.uid).discoveries.length}`));
add("witness_prot",c=>c.reply("🕵️ Witness protection enabled."));
add("citizen_oath",c=>{let u=U(c.uid);if(u.achievements.includes("Citizen"))return c.reply("✅ Oath already completed.");u.achievements.push("Citizen");c.reply("🤝 Citizen oath completed!\n"+AWARD(c,100,25000,["🪪 Badge","🎁 Box","🪙 Token"]))});
add("tasks_daily|tasks_weekly|quests_main|quests_side|quest_inventory|faction_quest|bounty_board|milestones|achieve_hunt|campaign_stats",c=>{let u=U(c.uid),n=c.args[0]||"daily";c.reply(`📜 ${c.event.body.split(/\s+/)[0].slice(1).toUpperCase()}\n${LIST(["Collect rewards","Complete activities","Earn money","Gain XP","Find items","Visit districts","Help NPCs","Win battles","Discover locations","Complete bonus"],1)}\nProgress: ${u.completed.length}/10`)});

add("daily|daily_activity|daily_bonus",c=>c.reply(`🎁 DAILY\n${CLAIM(c,"daily",150000,250,["🎁 Daily Box","💎 Gem","🪙 Token"],24)}`));
add("daily_spin",c=>{let r=["💰 $50K","💎 Gem","🎁 Box","🪙 100 Tokens","✨ 500 XP","🎟️ Ticket","🍀 Luck","🔥 Booster","🧰 Tool","👑 Badge"][Math.floor(Math.random()*10)],u=U(c.uid);u.cash+=50000;c.reply(`🎡 DAILY SPIN\n🎉 ${r}\n💰 +$50K`)});
add("daily_challenge|daily_hunt|daily_fish|daily_mine|daily_farm|daily_battle|daily_quest",c=>c.reply(`🔥 DAILY CHALLENGE\n${AWARD(c,200,100000,["🎁 Challenge Box","💎 Rare Gem","🪙 Token"])}`));
add("weekly_challenge|weekly_event",c=>c.reply(`📅 WEEKLY\n${CLAIM(c,"weekly",500000,750,["🏆 Trophy","💎 Rare Gem","🎟️ Ticket"],168)}`));
add("monthly_event",c=>c.reply(`🗓️ MONTHLY\n${CLAIM(c,"monthly",2000000,2500,["👑 Crown","💎 Epic Gem","🎁 Mega Box"],720)}`));
add("season_event",c=>c.reply(`🌌 SEASON EVENT\n${AWARD(c,1000,1000000,["🌟 Season Token","💎 Crystal","🎁 Season Chest"])}`));
add("streak",c=>{let u=U(c.uid);u.streak++;c.reply(`🔥 STREAK ${u.streak}\n${BAR(Math.min(u.streak,10),10)}`)});
add("streak_reward",c=>{let u=U(c.uid);if(u.streakRewardDate===date())return c.reply("⏳ Streak reward already claimed today.");u.streakRewardDate=date();c.reply(`🔥 STREAK REWARD\n${AWARD(c,100*u.streak,50000+u.streak*10000,["🔥 Streak Token","💎 Gem","🎁 Box"])}`)});

add("world_status",c=>c.reply(`🌍 WORLD STATUS\n☀️ ${W.weather}\n🎉 ${W.event}\n🏙️ ${W.district}\n📅 Day ${W.day}`));
add("town|district|district_status",c=>c.reply(`🏙️ ${W.district}\n🌦️ ${W.weather}\n🎉 ${W.event}\n👥 Active community\n💰 Economy online`));
add("npc_list",c=>c.reply(`👥 NPC LIST\n${LIST(["👑 Mayor","👮 Police","🧑‍⚕️ Doctor","🛒 Merchant","⚒️ Blacksmith","🌾 Farmer","🎣 Fisherman","⛏️ Miner","🏹 Hunter","🔧 Mechanic"],1)}`));
add("npc|npc_chat|npc_job|npc_quest|npc_trade|npc_relationship|npc_reputation",c=>c.reply(`🤝 NPC SYSTEM\n${AWARD(c,100,30000,["📜 Contract","🎁 NPC Gift","🪙 Reputation Token"])}`));
add("mayor|police|doctor|merchant|blacksmith|farmer|fisherman|miner|hunter|mechanic|bartender|citizen",c=>c.reply(`🏙️ ${c.event.body.split(/\s+/)[0].slice(1).toUpperCase()}\nNPC service available.\n${AWARD(c,50,15000,["🎁 Service Token","🪙 Coin","📜 Voucher"])}`));

add("weather_event|rain|storm|heatwave|flood|earthquake|volcano|eclipse|meteor|treasure_event|double_xp|double_cash|rare_spawn|boss_event|invasion|festival_event|market_event|fishing_event|mining_event|farm_event",c=>{W.day++;W.event=c.event.body.split(/\s+/)[0].slice(1);c.reply(`🌍 EVENT: ${W.event.toUpperCase()}\n⚡ World event activated!\n${AWARD(c,200,75000,["🎟️ Event Ticket","💎 Event Gem","🎁 Event Chest"])}`)});

add("vault",c=>{let u=U(c.uid);c.reply(`🏦 VAULT\n💰 ${money(u.vault)}\n🔐 Protected storage\nUse !deposit vault <amount>`)});add("saving|savings",c=>{let u=U(c.uid);c.reply(`💵 SAVINGS\n💰 ${money(u.savings)}\n📈 Secure savings account`)});
add("give",async c=>{let t=target(c);if(!t)return c.reply("🎁 Usage: !give @user <cash|bank|vault|savings|coins|tokens|xp> <amount>");if(String(t)===String(c.uid))return c.reply("😂 You can't gift yourself.");let u=U(c.uid),v=U(t),type=N(c.args[0]),amt=num(c.args[1]);if(!["cash","money","bank","vault","savings","coin","coins","token","tokens","xp"].includes(type)||amt<=0)return c.reply("💡 Example: !give @user cash 50000");type=type==="money"?"cash":type==="coin"?"coins":type==="token"?"tokens":type;let real=type==="xp"?amt:Math.floor(amt);if((u[type]||0)<real)return c.reply(`❌ Not enough ${type}.`);u[type]-=real;v[type]=(v[type]||0)+real;let p=await profile(c,t);c.reply(`🎁 GIFT SENT\n👤 ${p.name}\n💎 ${type}: ${type==="xp"?"✨ ":""}${real.toLocaleString()}\n🤝 Transfer complete.`)});

add("hint",c=>c.reply("💡 HINT: Use !menu, !menu 1-8, !allcmds or !search <word>."));
add("help",c=>c.reply("📖 HELP\n!menu = categories\n!allcmds = command list\n!search <word> = find commands\n!uid = your UID\n!profile = profile card\n!give @user cash 50000 = transfer"));
add("status",c=>c.reply(`🤖 KLERK ONLINE\n👤 ${c.name}\n⭐ Lv.${U(c.uid).level} ${BAR(U(c.uid).xp,U(c.uid).level*100)}\n💰 ${money(U(c.uid).cash)}\n🌍 ${W.district}`));

module.exports=Object.values(C);
