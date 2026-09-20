const C={finance:["balance","deposit","withdraw","transfer","give","daily","weekly","monthly","shop","inventory","salary","paytaxes","vault","loan","credit_score","atm","invoice","charity_fund","pawn","audit","bankruptcy","insurance","will","trust","business","revenue","hire","fire","franchise","realestate","stock","portfolio","crypto","investment","market","trade","auction"],farm:["farm","plant","harvest","water_crop","fertilize","weed","pest_control","crop_info","seed_shop","buy_seed","sell_crop","farm_upgrade","farm_worker","farm_storage","farm_market","animal_farm","feed_animal","milk","collect_egg","shear","barn","silo","tractor","irrigation","compost","weather","season","farm_quest","farm_rank","farm_lb","farm_contract","farm_export"],fish:["fish","fishspot","cast","reel","bait","buy_bait","rod","buy_rod","upgrade_rod","boat","buy_boat","sail","deepsea","fish_market","sell_fish","fish_trophy","fish_collection","rare_fish","legendary_fish","fish_quest","fish_rank","fish_lb","fishing_competition","net_fishing","ice_fishing","treasure_fishing","underwater","sea_monster"],hunt:["hunt","track","scout","trap","bait_trap","hunt_area","wildlife","animal_track","hunt_quest","hunt_rank","hunt_lb","rare_hunt","legendary_hunt","night_hunt","forest","jungle","mountain","swamp","desert","safari","trophy","hide","fur","meat","hunt_shop","hunter_license","hunter_guild","expedition","wild_boss"],business:["business","business_buy","business_sell","business_revenue","hire_npc","fire_npc","upgrade_tech","franchise","supply_chain","marketing","corporate_raid","shares_issue","real_estate","permit_apply","headquarters","union_negotiate","corporate_bonds","merger","vandalize_rival","insure_business","business_tax","business_payroll"]};

const CROPS=["Wheat","Corn","Rice","Potato","Tomato","Carrot","Cabbage","Pumpkin","Cotton","Sugarcane","Coffee","Cocoa","Golden Wheat","Mystic Herb"],FISH=["Sardine","Mackerel","Salmon","Tuna","Swordfish","Shark","Golden Fish","Crystal Fish","Leviathan Fish","Divine Koi"],ANIMALS=["Rabbit","Deer","Boar","Wolf","Bear","Tiger","Lion","Crocodile","Ancient Beast","World Beast"],JOBS=["Farmer","Miner","Fisherman","Hunter","Mechanic","Driver","Chef","Police Officer","Merchant","Engineer","Doctor","Cyber Specialist","Construction Worker","Pilot","Captain","Journalist","Detective","Executive","Scientist","Developer"],BUSINESSES=["Food Stall","Farm","Restaurant","Garage","Nightclub","Casino","Bank","Tech Company","Mega Corporation"],STOCKS=["AAPL","TSLA","META","NVDA","MSFT","AMZN","GOOGL","SPACEX"],CRYPTO=["BTC","ETH","SOL","DOGE","USDT","CITYCOIN","DARKCOIN"];

const pay=(c,n,x=50)=>{c.user.money=(c.user.money||0)+n;return{text:`💰 +$${n.toLocaleString()}\n⭐ +${x} XP\n🎁 Token • Ticket • Supply Pack`,money:n,xp:x,rewards:["token","ticket","supply"]}},list=(title,a)=>async c=>({text:`${title}\n\n${a.map((x,i)=>`${i+1}. ${x}`).join("\n")}`,gameplay:false}),simple=(name,cat,aliases=[])=>({name,aliases,category:cat,purpose:`${name} system`,run:async c=>pay(c,Math.floor(Math.random()*5000)+1000)});

const commands=[
{name:"balance",aliases:["bal","b","wallet"],category:"Finance",run:async c=>({text:`💰 WALLET\n💵 $${(c.user.money||0).toLocaleString()}\n🏦 $${(c.user.bank||0).toLocaleString()}\n💎 $${(c.user.savings||0).toLocaleString()}\n🔐 $${(c.user.vault||0).toLocaleString()}`,gameplay:false})},
{name:"deposit",aliases:["dep"],category:"Finance",run:async c=>{let n=c.args[0]==="all"?c.user.money:+c.args[0];if(!n||n>c.user.money)return{text:"❌ Invalid amount."};c.user.money-=n;c.user.bank=(c.user.bank||0)+n;return{text:`🏦 Deposited $${n.toLocaleString()}`,gameplay:false}}},
{name:"withdraw",aliases:["with"],category:"Finance",run:async c=>{let n=c.args[0]==="all"?c.user.bank:+c.args[0];if(!n||n>c.user.bank)return{text:"❌ Invalid amount."};c.user.bank-=n;c.user.money+=n;return{text:`💵 Withdrawn $${n.toLocaleString()}`,gameplay:false}}},
{name:"transfer",aliases:["sendmoney","pay"],category:"Finance",run:async c=>({text:"💸 Transfer system ready.",gameplay:false})},
{name:"daily",aliases:["daily_bonus"],category:"Finance",cooldown:86400,run:async c=>pay(c,10000,100)},
{name:"weekly",aliases:["weekly_bonus"],category:"Finance",cooldown:604800,run:async c=>pay(c,50000,500)},
{name:"salary",aliases:["payday"],category:"Finance",cooldown:3600,run:async c=>pay(c,7500,75)},
{name:"loan",aliases:["loan_apply"],category:"Finance",run:async c=>pay(c,25000,50)},
{name:"credit_score",aliases:["credit"],category:"Finance",run:async c=>({text:`💳 CREDIT SCORE\n⭐ ${500+(c.user.level||1)*5}`,gameplay:false})},
{name:"inventory",aliases:["inv","bag"],category:"Finance",run:async c=>({text:`🎒 INVENTORY\n${Object.entries(c.user.inventory||{}).map(([k,v])=>`${k}: ${v}`).join("\n")||"Empty"}`,gameplay:false})},
{name:"shop",aliases:["market"],category:"Finance",run:list("🛒 SHOP",["Consumables","Tools","Boosters","Equipment","Housing Items","Pet Items"])},
{name:"job",aliases:["jobs"],category:"Finance",run:list("💼 JOBS",JOBS)},
{name:"work",aliases:["jobwork"],category:"Finance",cooldown:3600,run:async c=>pay(c,7500,75)},
{name:"farm",aliases:["farming"],category:"Farming",run:list("🌾 FARM CROPS",CROPS)},
{name:"plant",aliases:["plant_crop"],category:"Farming",cooldown:30,run:async c=>pay(c,1500,40)},
{name:"harvest",aliases:["harvest_crop"],category:"Farming",cooldown:60,run:async c=>pay(c,5000,100)},
{name:"crop_info",aliases:["crops","seed_shop"],category:"Farming",run:list("🌱 CROPS",CROPS)},
{name:"farm_upgrade",aliases:["upgrade_farm"],category:"Farming",run:async c=>pay(c,25000,100)},
{name:"fish",aliases:["fishing"],category:"Fishing",cooldown:45,run:async c=>{let x=FISH[Math.floor(Math.random()*FISH.length)];c.user.inventory[x]=(c.user.inventory[x]||0)+1;return pay(c,500,80)}},
{name:"fishspot",aliases:["fishing_spot"],category:"Fishing",run:list("🎣 FISHING SPOTS",["River","Lake","Harbor","Deep Sea","Ice Lake"])},
{name:"bait",aliases:["buy_bait"],category:"Fishing",run:async c=>pay(c,500,25)},
{name:"rod",aliases:["buy_rod"],category:"Fishing",run:list("🎣 RODS",["Basic Rod","Silver Rod","Golden Rod","Divine Rod"])},
{name:"deepsea",aliases:["deep_sea"],category:"Fishing",cooldown:120,run:async c=>pay(c,10000,150)},
{name:"fish_market",aliases:["sell_fish"],category:"Fishing",run:async c=>pay(c,5000,75)},
{name:"fish_rank",aliases:["fish_lb","fishing_lb"],category:"Fishing",run:async c=>({text:"🏆 FISHING RANK\nRank increases through catches and competitions.",gameplay:false})},
{name:"hunt",aliases:["hunting"],category:"Hunting",cooldown:60,run:async c=>{let x=ANIMALS[Math.floor(Math.random()*ANIMALS.length)];return pay(c,10000,100)}},
{name:"track",aliases:["animal_track"],category:"Hunting",cooldown:30,run:async c=>pay(c,1000,50)},
{name:"hunt_area",aliases:["wildlife"],category:"Hunting",run:list("🏹 HUNTING AREAS",["Forest","Jungle","Mountain","Swamp","Desert","Safari"])},
{name:"hunt_rank",aliases:["hunt_lb"],category:"Hunting",run:async c=>({text:"🏆 HUNTER RANK\nRank rises from successful hunts.",gameplay:false})},
{name:"safari",aliases:["safari_hunt"],category:"Hunting",cooldown:120,run:async c=>pay(c,25000,150)},
{name:"cook",aliases:["cooking"],category:"Finance",cooldown:60,run:async c=>pay(c,3000,50)},
{name:"recipebook",aliases:["recipes"],category:"Finance",run:list("📖 RECIPES",["Bread","Burger","Pizza","Steak","Sushi","Golden Meal","Divine Feast"])},
{name:"business",aliases:["businesses","biz"],category:"Business",run:list("🏢 BUSINESSES",BUSINESSES)},
{name:"business_buy",aliases:["buybusiness"],category:"Business",run:async c=>pay(c,10000,200)},
{name:"business_revenue",aliases:["revenue"],category:"Business",cooldown:3600,run:async c=>pay(c,25000,100)},
{name:"business_sell",aliases:["sellbusiness"],category:"Business",run:async c=>pay(c,15000,50)},
{name:"hire_npc",aliases:["hire"],category:"Business",run:async c=>pay(c,2000,50)},
{name:"upgrade_tech",aliases:["business_upgrade"],category:"Business",run:async c=>pay(c,5000,100)},
{name:"stock_market",aliases:["stocks"],category:"Finance",run:list("📈 STOCK MARKET",STOCKS)},
{name:"stock_buy",aliases:["buy_stock"],category:"Finance",run:async c=>pay(c,5000,50)},
{name:"stock_sell",aliases:["sell_stock"],category:"Finance",run:async c=>pay(c,6000,50)},
{name:"portfolio",aliases:["stock_portfolio","investments"],category:"Finance",run:async c=>({text:"📊 PORTFOLIO\nYour stock holdings are stored in your inventory.",gameplay:false})},
{name:"crypto",aliases:["crypto_market"],category:"Finance",run:list("₿ CRYPTO MARKET",CRYPTO)},
{name:"crypto_buy",aliases:["buy_crypto"],category:"Finance",run:async c=>pay(c,5000,50)},
{name:"crypto_sell",aliases:["sell_crypto"],category:"Finance",run:async c=>pay(c,6000,50)},
{name:"crypto_wallet",aliases:["cryptowallet"],category:"Finance",run:async c=>({text:"₿ CRYPTO WALLET\nHoldings are stored in your inventory.",gameplay:false})},
{name:"leaderboard",aliases:["lb","top","richest"],category:"Finance",run:async c=>({text:"🏆 RICHEST PLAYERS\nLeaderboard uses persistent economy balances.",gameplay:false})}
];

for(const [cat,names] of Object.entries(C))for(const n of names)if(!commands.some(x=>x.name===n||x.aliases?.includes(n)))commands.push(simple(n,cat));
module.exports=commands;
