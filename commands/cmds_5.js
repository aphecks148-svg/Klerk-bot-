const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={}),P=R.players||(R.players=new Map()),C={};
const U=id=>{id=String(id||"");let u=P.get(id);if(!u)u={id,cash:100000,bank:0,vault:0,savings:0,coins:100,tokens:0,xp:0,level:1,inventory:{},wins:0,losses:0,fish:[],hunts:[],trophies:[],reputation:0,friends:[],blocked:[],married:null,streak:0,cooldowns:{}};u.inventory??={};u.fish??=[];u.hunts??=[];u.trophies??=[];u.friends??=[];u.blocked??=[];u.cooldowns??={};P.set(id,u);return u};
const N=x=>String(x||"").toLowerCase().trim(),num=x=>Math.max(0,Number(String(x||"").replace(/[$,]/g,""))||0),money=n=>`$${Math.floor(n||0).toLocaleString()}`,BAR=(v,m=100,n=10)=>{let a=Math.round(Math.max(0,Math.min(m,v))/m*n);return"█".repeat(a)+"░".repeat(n-a)},D=(u,k,n=1)=>u.inventory[k]=(u.inventory[k]||0)+n;
const XP=(c,n=100)=>{let u=U(c.uid),old=u.level;u.xp=(u.xp||0)+n;while(u.xp>=u.level*100){u.xp-=u.level*100;u.level++}return old<u.level?`\n🎉 LEVEL UP ${old} ➜ ${u.level}!`:""};
const REWARD=(c,x=100,cash=50000,it=["🎁 Mystery Box","💎 Gem","🪙 Token"])=>{let u=U(c.uid);u.cash+=cash;it.slice(0,3).forEach(i=>D(u,i));return`💰 +${money(cash)}\n🎁 ${it.slice(0,3).join(" • ")}\n✨ +${x} XP${XP(c,x)}`};
const CD=(u,k,s)=>{let r=(u.cooldowns[k]||0)-Date.now();if(r>0)return Math.ceil(r/1000);u.cooldowns[k]=Date.now()+s*1000;return 0};
const target=c=>Object.keys(c.event?.mentions||{})[0]||c.event?.messageReply?.senderID||c.replyToUserID||null;
const LIST=(a,p=1)=>{let s=(Math.max(1,num(p))-1)*10;return a.slice(s,s+10).map((x,i)=>`${s+i+1}. ${x}`).join("\n")||"Nothing found."};
const add=(names,fn)=>String(names).split("|").forEach(n=>C[N(n)]={name:N(n),execute:fn,module:"arcade_social"});
const game=(c,name,min=1000,max=50000,win=.5)=>{let u=U(c.uid),r=CD(u,"game_"+name,5);if(r)return c.reply(`⏳ ${name} cooldown: ${r}s`);let bet=Math.min(Math.max(1,num(c.args[0])||min),u.cash);if(u.cash<bet)return c.reply("❌ Not enough cash.");if(Math.random()<win){let g=Math.floor(bet*(1.5+Math.random()*2));u.cash+=g;u.wins++;return c.reply(`🎰 ${name.toUpperCase()}\n🎉 WIN!\n💰 +${money(g)}\n🏆 Wins: ${u.wins}`)}u.cash-=bet;u.losses++;c.reply(`🎰 ${name.toUpperCase()}\n💀 LOSS\n💸 -${money(bet)}\n📊 W/L ${u.wins}/${u.losses}`)};

const GAMES=["slots","coinflip","blackjack","roulette","dice_roll","poker","baccarat","lottery","scratch_card","horse_race","wheel_fortune","high_low","keno","craps","plinko","mines","crash","cups","spin_dice","crypto_slots","diamond_mine","fortune_teller"];
GAMES.forEach(n=>add(n,c=>game(c,n)));
add("vip_lounge",c=>{let u=U(c.uid);if(u.cash<500000)return c.reply("👑 VIP access requires $500K.");c.reply(`👑 VIP LOUNGE\n${LIST(["VIP Slots","High Roller Blackjack","Diamond Roulette","Whale Poker","Golden Baccarat","Private Horse Race","Luxury Keno","VIP Crash","Royal Plinko","Elite Lottery"],1)}`)});
add("casino_rob",c=>{let u=U(c.uid),r=CD(u,"casino_rob",900);if(r)return c.reply(`⏳ Casino robbery cooldown: ${r}s`);let a=250000+Math.floor(Math.random()*750000);u.cash+=a;u.losses++;c.reply(`🎰 CASINO ROBBERY\n💰 +${money(a)}\n⚠️ Security heat rising!`)});
add("bet_insurance",c=>c.reply("🛡️ Bet insurance purchased for your next casino game."));
add("token_exchange",c=>{let u=U(c.uid),a=num(c.args[0])||1;if(u.tokens<a)return c.reply("❌ Not enough tokens.");u.tokens-=a;u.cash+=a*10000;c.reply(`🪙 Exchanged ${a} tokens for ${money(a*10000)}.`)});
add("gambling_lb|casino_streak|house_bank|cheat_shop|counting",c=>{let u=U(c.uid);c.reply(`🎰 CASINO STATS\n🏆 Wins: ${u.wins}\n💀 Losses: ${u.losses}\n🔥 Streak: ${u.streak||0}\n💰 Cash: ${money(u.cash)}`)});

add("football",c=>{let u=U(c.uid),r=CD(u,"football",30);if(r)return c.reply(`⏳ Wait ${r}s.`);let win=Math.random()<.5;win?u.wins++:u.losses++;c.reply(`⚽ FOOTBALL MINI GAME\n${win?"🏆 GOAL! YOU WIN!":"💀 Full time — you lose."}\n${win?REWARD(c,100,50000,["⚽ Match Ball","🎟️ Ticket","🏆 Trophy"]):"💪 Try again!"}`)});
add("quiz",c=>c.reply(`🧠 QUIZ\n❓ What is 2 + 2?\n💡 Reply: !answer 4`));
add("answer",c=>{let a=N(c.args.join(" "));if(a==="4")c.reply(`✅ Correct!\n${REWARD(c,100,25000,["🧠 Quiz Token","🎁 Quiz Box","🏆 Brain Badge"])}`);else c.reply("❌ Wrong answer 😂")});
add("wrestle",c=>game(c,"wrestle",1000,100000,.5));
add("event_join|event_status|air_drop",c=>c.reply(`🎉 EVENT SYSTEM\n${REWARD(c,100,75000,["🎟️ Event Ticket","💎 Event Gem","🎁 Event Chest"])}`));

const EVENTS=["bank_panic","riot_alert","market_crash","crypto_pump","plague_outbreak","alien_invasion","natural_disaster","gang_warfare","mayor_elections","blackout","gold_rush","bounty_frenzy","festival","uprising","cyber_attack","meteor_shower","blackmarket_run","arena_games","scavenger_hunt","tax_holiday","shark_attack","zombie_wave","hyper_inflation","mafia_execution","spy_ring","convoy_heist","monopoly_deal"];
EVENTS.forEach(n=>add(n,c=>{let u=U(c.uid);u.reputation=(u.reputation||0)+5;c.reply(`🌍 WORLD EVENT: ${n.replace(/_/g," ").toUpperCase()}\n🔥 Event is active!\n⭐ Reputation +5\n${REWARD(c,100,50000,["🎟️ Event Ticket","💎 Event Gem","🎁 Event Chest"])}`)}));

add("profile_ping",c=>c.reply(`👤 PROFILE PING\n🆔 ${c.uid}\n💰 ${money(U(c.uid).cash)}\n⭐ Lv.${U(c.uid).level}`));
add("roast",c=>{let t=target(c);c.reply(`🔥 ROAST\n${t?"😂 Your target":"😂 You"} has been officially roasted by Klerk Bot.`)});
add("hint",c=>c.reply("💡 HINT: Try !menu, !allcmds or !search <command>.\n😂 If you're lost, the bot is lost with you."));
add("marry_chat|flirt_chat",c=>{let t=target(c);if(!t)return c.reply("💘 Mention or reply to someone.");c.reply(`💘 ${t} received your ${N(c.event.body.split(/\s+/)[0].slice(1))} message.`)});
add("chat_lb|leaderboards",c=>{let a=[...P.values()].sort((x,y)=>(y.wins||0)-(x.wins||0)).slice(0,10);c.reply(`🏆 COMMUNITY LEADERBOARD\n${a.map((u,i)=>`${i+1}. 👤 ${u.id} — 🏆 ${u.wins||0} wins`).join("\n")||"No players yet."}`)});
add("achievements",c=>c.reply(`🏆 ACHIEVEMENTS\n${LIST(["🎯 First Win","💰 Millionaire","🎣 Fisher","🏹 Hunter","🎰 Gambler","🤝 Socializer","❤️ Romantic","🏆 Champion","🔥 Streak Master","👑 Community Legend"],1)}`));
add("title_equip",c=>c.reply("🏷️ Title equipped successfully."));
add("chat_stats",c=>{let u=U(c.uid);c.reply(`💬 CHAT STATS\n🏆 Wins ${u.wins}\n💀 Losses ${u.losses}\n⭐ Reputation ${u.reputation||0}\n🔥 Streak ${u.streak||0}`)});
add("emoji_shop",c=>c.reply(`😀 EMOJI SHOP\n${LIST(["😂 Laugh — 10K","🔥 Fire — 15K","💎 Diamond — 25K","👑 Crown — 50K","💀 Skull — 75K","🐉 Dragon — 100K","⚡ Lightning — 125K","🌌 Galaxy — 250K","🪽 Angel — 500K","👹 Demon — 750K"],1)}`));
add("user_bio",c=>c.reply(`📝 BIO\n👤 ${c.name}\n🌟 Klerk Community member.`));
add("friend_add",c=>{let t=target(c),u=U(c.uid);if(!t)return c.reply("💡 Mention/reply to add a friend.");if(!u.friends.includes(String(t)))u.friends.push(String(t));c.reply("🤝 Friend added.")});
add("block_user",c=>{let t=target(c),u=U(c.uid);if(!t)return c.reply("💡 Mention/reply to block.");if(!u.blocked.includes(String(t)))u.blocked.push(String(t));c.reply("🚫 User blocked.")});
add("avatar_border|chat_theme",c=>c.reply("✨ Cosmetic updated."));
add("coin_toss|rock_paper|word_scramble|number_guess|tic_tac|hangman",c=>{let n=N(c.event.body.split(/\s+/)[0].slice(1)),u=U(c.uid);if(n==="coin_toss"){let r=Math.random()<.5?"HEADS":"TAILS";return c.reply(`🪙 COIN TOSS: ${r}`)}c.reply(`🎮 ${n.toUpperCase()}\n🎯 Challenge generated!\n💡 Play with !answer`)});
add("introduce|wave|hug|highfive|handshake|laugh|cry|dance|sing|joke|story|poll|vote|question|truth|dare|confess|complaint|compliment|birthday",c=>{let t=target(c);c.reply(`💬 SOCIAL ACTION\n${t?"👤 Target selected.":"👤 Community interaction."}\n✨ ${c.event.body.split(/\s+/)[0].slice(1)} completed.`)});
add("marry|divorce|adopt|family|family_tree|relationship|breakup|date|party|event",c=>{let u=U(c.uid),t=target(c),n=N(c.event.body.split(/\s+/)[0].slice(1));if(["marry","date"].includes(n)&&!t)return c.reply("💘 Mention or reply to someone.");if(n==="marry")u.married=String(t);if(n==="divorce")u.married=null;c.reply(`❤️ ${n.toUpperCase()} completed.`)});

const FISH=["carp","salmon","tuna","trout","bass","catfish","swordfish","shark","goldfish","dragon_fish","kraken_fish","moon_fish","crystal_fish","lava_fish","void_fish"];
const HUNT=["rabbit","deer","boar","fox","wolf","bear","lion","tiger","crocodile","buffalo","rhino","elephant","wyvern","griffin","dragon"];
add("fish",c=>{let u=U(c.uid),r=CD(u,"fish",30);if(r)return c.reply(`🎣 Wait ${r}s before fishing again.`);let f=FISH[Math.floor(Math.random()*FISH.length)];u.fish.push(f);D(u,"🐟 "+f);u.cash+=10000;u.reputation++;c.reply(`🎣 FISH CAUGHT!\n🐟 ${f}\n💰 +$10K\n✨ +50 XP${XP(c,50)}`)});
add("fishspot|cast|reel",c=>c.reply(`🎣 FISHING SPOTS\n${LIST(["🌊 River","🏞️ Lake","🌅 Coast","🌌 Deep Sea","🧊 Ice Lake","🪸 Coral Reef","🕳️ Deep Trench","🏝️ Island","🌋 Volcanic Bay","🌑 Moonlit Sea"],1)}`));
add("bait|buy_bait",c=>{let u=U(c.uid),q=Math.max(1,num(c.args[0])||1),a=q*5000;if(u.cash<a)return c.reply("❌ Not enough cash.");u.cash-=a;D(u,"🎣 Bait",q);c.reply(`🎣 Bought ${q} bait for ${money(a)}.`)});
add("rod|buy_rod|upgrade_rod",c=>{let u=U(c.uid),a=50000;if(u.cash<a)return c.reply("❌ Need $50K.");u.cash-=a;u.rod=(u.rod||0)+1;c.reply(`🎣 Rod upgraded to Lv.${u.rod}.`)});
add("deepsea|underwater|treasure_fishing|net_fishing|ice_fishing|sea_monster",c=>{let u=U(c.uid),f=FISH[Math.floor(Math.random()*FISH.length)];u.fish.push(f);c.reply(`🌊 ${c.event.body.split(/\s+/)[0].slice(1).toUpperCase()}\n🐟 ${f}\n${REWARD(c,150,75000,["🐟 Rare Fish","💎 Ocean Gem","🎁 Sea Chest"])}`)});
add("fish_market|sell_fish",c=>{let u=U(c.uid);if(!u.fish.length)return c.reply("🎣 No fish.");let a=u.fish.length*15000;u.cash+=a;u.fish=[];c.reply(`🐟 FISH SOLD\n💰 +${money(a)}`)});
add("fish_trophy|fish_collection|rare_fish|legendary_fish|fish_quest|fish_rank|fish_lb|fishing_competition",c=>c.reply(`🏆 FISHING\n🐟 Collection: ${U(c.uid).fish.length}\n${LIST(["🐟 Common Catch","🐠 Rare Catch","🦈 Shark Hunter","🐉 Dragon Fish","🌌 Void Fish","💎 Crystal Fish","🌋 Lava Fish","👑 Legendary Catch","🌊 Deep Sea Master","🎣 Fishing Legend"],1)}`));

add("hunt",c=>{let u=U(c.uid),r=CD(u,"hunt",45);if(r)return c.reply(`🏹 Wait ${r}s.`);let h=HUNT[Math.floor(Math.random()*HUNT.length)];u.hunts.push(h);D(u,"🥩 "+h);u.cash+=15000;u.reputation+=2;c.reply(`🏹 HUNT SUCCESS\n🐾 ${h}\n💰 +$15K\n⭐ Reputation +2\n✨ +75 XP${XP(c,75)}`)});
add("track|scout|trap|bait_trap",c=>c.reply(`🏹 HUNTING TRACK\n${LIST(["🐇 Rabbit","🦌 Deer","🐗 Boar","🦊 Fox","🐺 Wolf","🐻 Bear","🦁 Lion","🐯 Tiger","🐊 Crocodile","🐃 Buffalo"],1)}`));
add("hunt_area|wildlife|animal_track|hunt_quest|hunt_rank|hunt_lb|rare_hunt|legendary_hunt|night_hunt",c=>c.reply(`🏹 HUNTING SYSTEM\n${LIST(HUNT.map((x,i)=>`🐾 ${x} — ${money(25000+i*15000)}`),1)}`));
add("forest|jungle|mountain|swamp|desert|expedition",c=>{let u=U(c.uid);u.reputation+=5;c.reply(`🌍 EXPLORATION: ${c.event.body.split(/\s+/)[0].slice(1).toUpperCase()}\n🧭 Area explored!\n⭐ Reputation +5\n${REWARD(c,100,50000,["🧭 Explorer Token","💎 Area Gem","🎁 Discovery Chest"])}`)});
add("trophy|hide|fur|meat|hunt_shop|hunter_license|hunter_guild|wild_boss",c=>{let u=U(c.uid);c.reply(`🏹 HUNTER SYSTEM\n🎯 Hunts: ${u.hunts.length}\n🏆 Trophies: ${u.trophies.length}\n${REWARD(c,100,50000,["🏹 Hunter Token","🦴 Trophy Part","🎁 Hunt Chest"])}`)});

add("reputation",c=>{let u=U(c.uid);c.reply(`⭐ REPUTATION\n${u.reputation||0}\n${BAR(Math.min(u.reputation||0,100),100)}\n🏆 Higher reputation unlocks community rewards.`)});
add("gift_item",c=>{let u=U(c.uid),t=target(c),item=N(c.args[0]),q=Math.max(1,num(c.args[1])||1);if(!t)return c.reply("🎁 Mention/reply to a user.");if(!item)return c.reply("💡 !gift_item @user gem 2");if((u.inventory[item]||0)<q)return c.reply("❌ You don't have that item.");let v=U(t);u.inventory[item]-=q;D(v,item,q);c.reply(`🎁 GIFT SENT\n📦 ${item} x${q}`)});
add("trade_request",c=>{let t=target(c);c.reply(t?`🤝 Trade request sent to ${t}.`:"💡 Mention/reply to a trader.")});
add("clan_chat|party_create",c=>c.reply(`👥 COMMUNITY GROUP\n${REWARD(c,75,25000,["🎟️ Party Pass","🤝 Social Token","🎁 Group Box"])}`));

module.exports=Object.values(C);
