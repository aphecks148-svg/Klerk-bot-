const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={}),P=R.players||(R.players=new Map()),W=R.world||(R.world={day:1,weather:"☀️ Clear",event:"🌍 Normal",district:"Central"});
const ID=c=>String(c.uid||c.senderID||c.author||"");const U=c=>{let id=ID(c),u=P.get(id);if(!u)u={id,cash:100000,bank:0,vault:0,savings:0,coins:100,tokens:0,xp:0,level:1,prestige:0,rebirth:0,legacy:0,career:1,skill:1,stats:{},achievements:[],badges:[],titles:[],activeTitle:"Rookie",discoveries:[],quests:[],completed:[],season:1,seasonXP:0,dailyClaims:{},cooldowns:{},streak:0,streakRewardDate:"",inventory:{},jobsDone:0,missionsDone:0,activitiesDone:0,totalEarned:0,lastRewards:[]};P.set(id,u);return u};
const N=x=>String(x||"").toLowerCase().trim(),num=x=>Math.max(0,Number(String(x||"").replace(/[$,]/g,""))||0),money=n=>`$${Math.floor(n||0).toLocaleString()}`,BAR=(v,m=100,n=10)=>{v=Math.max(0,Math.min(m,v));let a=Math.round(v/m*n);return"█".repeat(a)+"░".repeat(n-a)},date=()=>new Date().toISOString().slice(0,10);
const XP=(c,n=100)=>{let u=U(c),old=u.level;u.xp+=Math.max(0,n);while(u.xp>=u.level*100){u.xp-=u.level*100;u.level++}return old<u.level?`\n🎉 LEVEL UP! ${old} ➜ ${u.level}`:""};
const AWARD=(c,x=100,cash=50000,items=["🎁 Mystery Box","💎 Gem","🪙 Token"])=>{let u=U(c);u.cash+=cash;u.totalEarned+=cash;items=items.slice(0,3);items.forEach(i=>u.inventory[i]=(u.inventory[i]||0)+1);u.lastRewards=items;return`💰 +${money(cash)}\n🎁 ${items.join(" • ")}\n✨ +${x} XP${XP(c,x)}`};
const CD=(u,k,s)=>{let r=Number(u.cooldowns[k]||0)-Date.now();if(r>0)return Math.ceil(r/1000);u.cooldowns[k]=Date.now()+s*1000;return 0};
const CLAIM=(c,k,amt=100000,x=100,items=["🎁 Box","💎 Gem","🪙 Token"],hours=24)=>{let u=U(c),r=CD(u,k,hours*3600);return r?`⏳ Try again in ${Math.ceil(r/3600)}h`:AWARD(c,x,amt,items)};
const LIST=(a,p=1,n=10)=>{p=Math.max(1,Number(p)||1);let s=(p-1)*n;return a.slice(s,s+n).map((x,i)=>`${s+i+1}. ${x}`).join("\n")||"Nothing here."};
const target=c=>{let e=c.event||{},m=e.mentions||{},ids=Object.keys(m);return ids[0]||e.messageReply?.senderID||e.replyToUserID||null};
const profile=async(c,id=ID(c))=>new Promise(res=>{try{c.api.getUserInfo(String(id),(e,d)=>{let u=d&&d[String(id)];res({uid:String(id),name:u?.name||String(id),pic:u?.thumbSrc||u?.profilePic||null})})}catch(e){res({uid:String(id),name:String(id),pic:null})}});
R.user=U;R.bar=BAR;R.reward=R.reward||AWARD;R.profile=R.profile||profile;

const C=[];const add=(names,run,description="")=>String(names).split("|").forEach(name=>C.push({name:N(name),run,module:1,description}));

add("level_xp",c=>{let u=U(c);c.reply(`✨ LEVEL ${u.level}\n${BAR(u.xp,u.level*100)}\nXP: ${u.xp}/${u.level*100}`)});
add("rank_rewards",c=>c.reply(`🏆 RANK REWARDS\n${LIST(["🥉 Bronze — $50K","🥈 Silver — $100K","🥇 Gold — $250K","💎 Platinum — $500K","👑 Diamond — $1M","🔥 Master — $2M","⚡ Grandmaster — $5M","🌌 Mythic — $10M","☠️ Legend — $25M","👑 Apex — $50M"])}`));
add("prestige",c=>{let u=U(c);if(u.level<50)return c.reply("🔒 Reach level 50 first.");u.prestige++;u.level=1;u.xp=0;u.cash+=500000;c.reply(`👑 PRESTIGE ${u.prestige}\n✨ Level reset to 1\n💰 +$500K`)});
add("rebirth",c=>{let u=U(c);if(u.level<100)return c.reply("🔒 Reach level 100 first.");u.rebirth++;u.level=1;u.xp=0;u.cash+=1000000;c.reply(`♻️ REBIRTH ${u.rebirth}\n💰 +$1M`)});
add("passport",c=>c.reply(`🛂 KLERK PASSPORT\n👤 ${c.name||ID(c)}\n🆔 ${ID(c)}\n🌍 ${W.district}\n⭐ Level ${U(c).level}`));
add("achieve_total",c=>c.reply(`🏆 Achievements: ${U(c).achievements.length}`));
add("skills_tree",c=>c.reply(`🌳 SKILL TREE\n${LIST(["💪 Strength","🛡️ Defense","⚡ Speed","🧠 Intelligence","🍀 Luck","💰 Finance","🎯 Hunting","🎣 Fishing","⛏️ Mining","🌾 Farming"])}`));
add("title_shop",c=>c.reply(`🏷️ TITLE SHOP\n${LIST(["Rookie — $10K","Hustler — $50K","Boss — $100K","Legend — $250K","Mythic — $500K","King — $1M","Emperor — $2M","Shadow — $5M","Apex — $10M","Immortal — $25M"])}`));
add("legacy_score",c=>c.reply(`📜 Legacy Score: ${U(c).legacy}`));
add("badge_case",c=>c.reply(`🎖️ BADGES\n${U(c).badges.slice(0,10).join("\n")||"No badges yet."}`));
add("perk_activate",c=>c.reply("⚡ Perk activated for your next reward!"));
add("profile_glow",c=>c.reply("✨ Profile glow updated."));
add("stat_allocate",c=>{let u=U(c),s=N(c.args?.[0]||"strength");u.stats[s]=(u.stats[s]||0)+1;c.reply(`📈 ${s} +1`)});
add("mastery_loop",c=>{let u=U(c);u.skill++;c.reply(`🌀 Mastery increased to ${u.skill}`)});
add("career_level",c=>{let u=U(c);u.career++;c.reply(`💼 Career level: ${u.career}`)});
add("season_pass",c=>{let u=U(c);c.reply(`🎫 Season ${u.season}\nXP: ${u.seasonXP}`)});
add("booster_pack",c=>c.reply(AWARD(c,150,75000,["🚀 XP Booster","💎 Gem","🎁 Pack"])));
add("codex",c=>c.reply(`📖 CODEX\nDiscoveries: ${U(c).discoveries.length}`));
add("witness_prot",c=>c.reply("🕵️ Witness protection enabled."));
add("citizen_oath",c=>{let u=U(c);if(u.achievements.includes("Citizen"))return c.reply("✅ Oath already completed.");u.achievements.push("Citizen");c.reply(`🤝 Citizen oath completed!\n${AWARD(c,100,25000,["🪪 Badge","🎁 Box","🪙 Token"])}`)});

add("tasks_daily|tasks_weekly|quests_main|quests_side|quest_inventory|faction_quest|bounty_board|milestones|achieve_hunt|campaign_stats",c=>{let n=N(c.event?.body?.split(/\s+/)[0]?.slice(1)||c.args?.[0]||"task");c.reply(`📜 ${n.toUpperCase()}\n${LIST(["Collect rewards","Complete activities","Earn money","Gain XP","Find items","Visit districts","Help NPCs","Win battles","Discover locations","Complete bonus"])}\n\n📊 Progress: ${U(c).completed.length}/10`)});

add("daily|daily_activity|daily_bonus",c=>c.reply(`🎁 DAILY REWARD\n${CLAIM(c,"daily",150000,250,["🎁 Daily Box","💎 Gem","🪙 Token"],24)}`));
add("daily_spin",c=>{let r=["💰 $50K","💎 Gem","🎁 Box","🪙 100 Tokens","✨ 500 XP","🎟️ Ticket","🍀 Luck","🔥 Booster","🧰 Tool","👑 Badge"][Math.floor(Math.random()*10)],u=U(c);u.cash+=50000;c.reply(`🎡 DAILY SPIN\n🎉 ${r}\n💰 +$50K`)});
add("daily_challenge|daily_hunt|daily_fish|daily_mine|daily_farm|daily_battle|daily_quest",c=>c.reply(`🔥 DAILY CHALLENGE\n${AWARD(c,200,100000,["🎁 Challenge Box","💎 Rare Gem","🪙 Token"])}`));
add("weekly_challenge|weekly_event",c=>c.reply(`📅 WEEKLY EVENT\n${CLAIM(c,"weekly",500000,750,["🏆 Trophy","💎 Rare Gem","🎟️ Ticket"],168)}`));
add("monthly_event",c=>c.reply(`🗓️ MONTHLY EVENT\n${CLAIM(c,"monthly",2000000,2500,["👑 Crown","💎 Epic Gem","🎁 Mega Box"],720)}`));
add("season_event",c=>c.reply(`🌌 SEASON EVENT\n${AWARD(c,1000,1000000,["🌟 Season Token","💎 Crystal","🎁 Season Chest"])}`));
add("streak",c=>{let u=U(c);u.streak++;c.reply(`🔥 STREAK ${u.streak}\n${BAR(Math.min(u.streak,10),10)}`)});
add("streak_reward",c=>{let u=U(c);if(u.streakRewardDate===date())return c.reply("⏳ Streak reward already claimed today.");u.streakRewardDate=date();c.reply(`🔥 STREAK REWARD\n${AWARD(c,100*u.streak,50000+u.streak*10000,["🔥 Streak Token","💎 Gem","🎁 Box"])}`)});

add("world_status",c=>c.reply(`🌍 WORLD STATUS\n☀️ ${W.weather}\n🎉 ${W.event}\n🏙️ ${W.district}\n📅 Day ${W.day}`));
add("town|district|district_status",c=>c.reply(`🏙️ ${W.district}\n🌦️ ${W.weather}\n🎉 ${W.event}\n👥 Community Online\n💰 Economy Online`));
add("npc_list",c=>c.reply(`👥 NPC LIST\n${LIST(["👑 Mayor","👮 Police","🧑‍⚕️ Doctor","🛒 Merchant","⚒️ Blacksmith","🌾 Farmer","🎣 Fisherman","⛏️ Miner","🏹 Hunter","🔧 Mechanic"])}`));
add("npc|npc_chat|npc_job|npc_quest|npc_trade|npc_relationship|npc_reputation",c=>c.reply(`🤝 NPC SYSTEM\n${AWARD(c,100,30000,["📜 Contract","🎁 NPC Gift","🪙 Reputation Token"])}`));
add("mayor|police|doctor|merchant|blacksmith|farmer|fisherman|miner|hunter|mechanic|bartender|citizen",c=>{let n=N(c.event?.body?.split(/\s+/)[0]?.slice(1)||"npc");c.reply(`🏙️ ${n.toUpperCase()}\n🤝 NPC service available.\n${AWARD(c,50,15000,["🎁 Service Token","🪙 Coin","📜 Voucher"])}`)});

add("weather_event|rain|storm|heatwave|flood|earthquake|volcano|eclipse|meteor|treasure_event|double_xp|double_cash|rare_spawn|boss_event|invasion|festival_event|market_event|fishing_event|mining_event|farm_event",c=>{let n=N(c.event?.body?.split(/\s+/)[0]?.slice(1)||"event");W.day++;W.event=n;c.reply(`🌍 EVENT: ${n.toUpperCase()}\n⚡ World event activated!\n${AWARD(c,200,75000,["🎟️ Event Ticket","💎 Event Gem","🎁 Event Chest"])}`)});

add("give",async c=>{let t=target(c);if(!t)return c.reply("🎁 Usage: !give @user cash 50000");if(String(t)===ID(c))return c.reply("😂 You can't gift yourself.");let u=U(c),v=U({...c,uid:t}),a=c.args||[],type=N(a[0]),amt=num(a[1]);type=type==="money"?"cash":type==="coin"?"coins":type==="token"?"tokens":type;if(!["cash","bank","vault","savings","coins","tokens","xp"].includes(type)||amt<=0)return c.reply("💡 Example: !give @user cash 50000");if((u[type]||0)<amt)return c.reply(`❌ Not enough ${type}.`);u[type]-=amt;v[type]=(v[type]||0)+amt;let p=await profile(c,t);c.reply(`🎁 GIFT SENT\n👤 ${p.name}\n💎 ${type}: ${amt.toLocaleString()}\n🤝 Transfer complete.`)});

add("vault",c=>{let u=U(c);c.reply(`🏦 VAULT\n💰 ${money(u.vault)}\n🔐 Protected storage`)});
add("saving|savings",c=>{let u=U(c);c.reply(`💵 SAVINGS\n💰 ${money(u.savings)}\n🔐 Secure account`)});
add("hint",c=>c.reply("💡 HINT\nUse !menu → category\nUse !search <word> → find commands\nUse !help <command> → command guide"));
add("help",c=>c.reply("📖 HELP\n!menu • !allcmds • !search <word>\n!uid • !profile • !give @user cash 50000"));
add("status",c=>{let u=U(c);c.reply(`🤖 KLERK ONLINE\n👤 ${c.name||ID(c)}\n⭐ Lv.${u.level} ${BAR(u.xp,u.level*100)}\n💰 ${money(u.cash)}\n🌍 ${W.district}`)});

module.exports=C;
