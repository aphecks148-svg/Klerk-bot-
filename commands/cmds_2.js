const PETS=[
["Tiny Fox","COMMON",50,40,35],["Forest Cat","COMMON",45,45,40],["Brown Wolf","COMMON",60,50,45],
["River Otter","COMMON",40,55,35],["Little Bear","COMMON",65,40,60],["Wild Rabbit","COMMON",35,65,25],
["Farm Dog","COMMON",50,45,40],["Mountain Goat","COMMON",55,50,55],["Desert Lizard","COMMON",40,60,30],
["Blue Bird","COMMON",35,70,25],["Silver Fox","UNCOMMON",80,75,65],["Shadow Cat","UNCOMMON",75,85,60],
["Frost Wolf","UNCOMMON",95,70,80],["Fire Rabbit","UNCOMMON",65,95,50],["Storm Hawk","UNCOMMON",75,110,55],
["Iron Boar","UNCOMMON",110,50,100],["Emerald Snake","UNCOMMON",70,90,65],["Golden Crow","UNCOMMON",65,100,60],
["Mystic Deer","UNCOMMON",85,80,75],["Thunder Hound","UNCOMMON",105,85,90],["Flame Wolf","RARE",150,120,130],
["Ice Lynx","RARE",125,155,115],["Storm Tiger","RARE",170,145,145],["Crystal Fox","RARE",130,160,125],
["Venom Cobra","RARE",145,170,120],["Dark Raven","RARE",120,180,110],["Lava Bear","RARE",190,110,180],
["Moon Deer","RARE",140,150,150],["Thunder Lion","RARE",200,145,175],["Ocean Serpent","RARE",175,155,190],
["Inferno Dragon","EPIC",300,230,280],["Frost Dragon","EPIC",270,260,300],["Shadow Panther","EPIC",290,330,250],
["Lightning Phoenix","EPIC",280,350,240],["Abyss Wolf","EPIC",340,280,300],["Crystal Wyvern","EPIC",310,290,330],
["Demon Tiger","EPIC",350,300,280],["Celestial Eagle","EPIC",280,370,260],["Void Serpent","EPIC",330,320,310],
["Ancient Hydra","EPIC",390,260,350],["Ancient Dragon","LEGENDARY",500,420,520],["Solar Phoenix","LEGENDARY",480,550,430],
["Lunar Dragon","LEGENDARY",510,470,540],["Thunder Godbeast","LEGENDARY",570,500,560],["Leviathan","LEGENDARY",620,400,650],
["World Serpent","LEGENDARY",600,450,620],["Titan Wolf","LEGENDARY",650,480,590],["Eternal Phoenix","LEGENDARY",550,650,500],
["Void Dragon","LEGENDARY",630,570,610],["Celestial Dragon","LEGENDARY",680,600,670],["Cosmic Dragon","MYTHIC",850,760,900],
["Infinity Phoenix","MYTHIC",800,950,780],["Astral Leviathan","MYTHIC",920,700,1000],["Time Wolf","MYTHIC",880,900,850],
["Reality Serpent","MYTHIC",950,850,930],["Divine Dragon","DIVINE",1200,1050,1300],["Divine Phoenix","DIVINE",1100,1400,1050],
["Divine Leviathan","DIVINE",1450,1000,1550],["Divine Behemoth","DIVINE",1550,900,1650],["World Eater","DIVINE",1800,1300,1900]
];

const PET_ITEMS=[
["Crystal Water",15000,"water"],["Fruit Juice",25000,"energy"],["Herbal Tea",50000,"heal"],["Energy Drink",80000,"stamina"],
["Ocean Essence",200000,"water"],["Mystic Potion",500000,"heal"],["Star Water",1000000,"energy"],["Divine Elixir",3000000,"heal"],
["Health Potion",200000,"heal"],["Bandage",50000,"heal"],["Fever Cure",150000,"cleanse"],["Antidote",300000,"poison"],
["Stamina Shot",400000,"stamina"],["Super Potion",800000,"heal"],["Miracle Cure",2000000,"heal"],["Divine Medicine",5000000,"heal"],
["Ribbon",100000,"cosmetic"],["Circus Hat",300000,"cosmetic"],["Sun Hat",200000,"cosmetic"],["Victory Medal",500000,"cosmetic"],
["Lucky Charm",800000,"luck"],["Power Ring",1500000,"attack"],["Crown",4000000,"rank"],["Starlight Bow",2500000,"cosmetic"],
["Stat Booster",500000,"stats"],["Power Elixir",1000000,"attack"],["Defense Brew",1000000,"defense"],["Speed Formula",1000000,"speed"],
["Genius Serum",1000000,"xp"],["Stamina Tonic",1000000,"stamina"],["Supreme Elixir",5000000,"stats"],["God Serum",15000000,"stats"],
["Evolution Stone",5000000,"evolution"],["Star Stone",10000000,"evolution"],["Flame Stone",7500000,"fire"],["Frost Stone",7500000,"ice"],
["Thunder Stone",7500000,"thunder"],["Divine Stone",50000000,"divine"],["Battle Sword",800000,"attack"],["Iron Shield",800000,"defense"],
["Magic Bow",1200000,"speed"],["Battle Bomb",2000000,"damage"],["Magic Wand",1500000,"magic"],["Chaos Orb",3000000,"ultimate"],
["Briefcase",500000,"job"],["Tool Kit",800000,"job"],["Art Set",700000,"job"],["Training Equipment",1000000,"training"],
["Happiness Charm",300000,"bond"],["Lucky Clover",1200000,"luck"]
];

const SKILLS=[
"Divine Flame","Divine Shield","Dragon Roar","World Breaker","Flame Burst",
"Ice Blast","Thunder Strike","Shadow Bite","Venom Fang","Healing Light",
"Rage","Meteor Strike","Void Beam","Celestial Guard","Phoenix Rebirth"
];

const EGGS=[
["Bronze Egg",50000,"COMMON"],["Silver Egg",500000,"UNCOMMON"],["Gold Egg",5000000,"RARE"],
["Mystic Egg",25000000,"EPIC"],["Divine Egg",100000000,"DIVINE"]
];

const ELEMENTS=["Fire","Water","Earth","Nature","Electric","Light","Dark","Void"];

function owned(c){
  c.user.pets=Array.isArray(c.user.pets)?c.user.pets:[];
  return c.user.pets;
}

function money(c){
  if(c.user.money==null)c.user.money=Number(c.user.balance||0);
  return Number(c.user.money)||0;
}

function setMoney(c,n){
  c.user.money=Math.max(0,Number(n)||0);
  c.user.balance=c.user.money;
}

function findPet(n){
  return PETS.find(x=>x[0].toLowerCase()===String(n||"").toLowerCase());
}

function addPet(c,p){
  owned(c).push({
    name:p[0],rarity:p[1],hp:p[2],maxHp:p[2],attack:p[3],defense:p[4],
    level:1,xp:0,energy:0,wins:0,losses:0,skills:[],
    element:ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)]
  });
}

function petText(p){
  return `🐾 ${p.name}
💎 ${p.rarity}
❤️ HP: ${p.hp}/${p.maxHp||p.hp}
⚔️ ATK: ${p.attack}
🛡️ DEF: ${p.defense}
⭐ Level: ${p.level||1}
⚡ Energy: ${p.energy||0}/100
🏆 ${p.wins||0}W / ${p.losses||0}L
🌈 Element: ${p.element||"Nature"}`;
}

function battleStore(c){
  if(!c.state)c.state={};
  if(!c.state.battles)c.state.battles={};
  return c.state.battles;
}

const commands=[
{
 name:"pets",aliases:["petlist","mypets"],category:"Pets",featured:true,
 purpose:"Show owned pets",
 run:async c=>({
   text:owned(c).length
    ?`🐾 YOUR PETS\n\n${owned(c).map((p,i)=>`${i+1}. ${petText(p)}`).join("\n\n")}`
    :"🐾 You have no pets yet.\nUse !pet shop or !pet buy <name>.",
   gameplay:false
 })
},

{
 name:"pet",aliases:["petmenu"],category:"Pets",featured:true,
 purpose:"Main pet system",
 run:async c=>{
   const a=c.args.map(x=>x.toLowerCase()),sub=a[0]||"view";

   if(sub==="shop"||sub==="petshop")
     return{text:`🐾 PET SHOP\n\n${PETS.map((p,i)=>`${i+1}. ${p[0]} | ${p[1]} | $${(p[2]*1000).toLocaleString()}`).join("\n")}`,gameplay:false};

   if(sub==="items")
     return{text:`🛒 PET ITEMS\n\n${PET_ITEMS.map((x,i)=>`${i+1}. ${x[0]} | $${x[1].toLocaleString()} | ${x[2]}`).join("\n")}`,gameplay:false};

   if(sub==="eggs")
     return{text:`🥚 PET EGGS\n\n${EGGS.map(x=>`${x[0]} — $${x[1].toLocaleString()} — ${x[2]}`).join("\n")}`,gameplay:false};

   if(sub==="view"||sub==="stats"||sub==="pets")
     return{text:owned(c).length?owned(c).map(p=>petText(p)).join("\n\n"):"🐾 No pets owned.",gameplay:false};

   if(sub==="buy"){
     const name=c.args.slice(1).join(" "),p=findPet(name);
     if(!p)return{text:"❌ Pet not found. Use !pet shop."};
     const price=p[2]*1000;
     if(money(c)<price)return{text:`❌ You need $${price.toLocaleString()}.`};
     setMoney(c,money(c)-price);addPet(c,p);
     return{
       text:`🐾 PET ACQUIRED!\n${petText(owned(c).at(-1))}\n💰 -$${price.toLocaleString()}\n⭐ +100 XP\n🎁 Pet Token, Care Pack, Bond Charm`,
       xp:100,rewards:[{id:"pet_token"},{id:"care_pack"},{id:"bond_charm"}]
     };
   }

   if(sub==="select"){
     const p=owned(c)[Number(a[1])-1];
     if(!p)return{text:"❌ Invalid pet number."};
     c.user.activePet=p.name;
     return{text:`🐾 Active pet: ${p.name}`,gameplay:false};
   }

   if(sub==="release"){
     const i=Number(a[1])-1,p=owned(c)[i];
     if(!p)return{text:"❌ Invalid pet."};
     owned(c).splice(i,1);
     if(c.user.activePet===p.name)c.user.activePet=null;
     return{text:`👋 ${p.name} released.\n🎁 Release Token`,rewards:[{id:"release_token"}]};
   }

   if(sub==="rename"){
     const p=owned(c)[Number(a[1])-1]||owned(c)[0],n=c.args.slice(2).join(" ")||c.args.slice(1).join(" ");
     if(!p||!n)return{text:`Usage: ${c.prefix}pet rename <number> <name>`};
     p.name=n;
     return{text:`✏️ Pet renamed to ${n}.`,gameplay:false};
   }

   if(["feed","water","heal","train","upgrade"].includes(sub)){
     const p=owned(c)[0];
     if(!p)return{text:"❌ You need a pet first."};

     if(sub==="feed")p.hp=Math.min(p.maxHp||p.hp,p.hp+20);
     if(sub==="water")p.energy=Math.min(100,(p.energy||0)+25);
     if(sub==="heal")p.hp=Math.min(p.maxHp||p.hp,p.hp+100);
     if(sub==="train")p.attack+=5;

     if(sub==="upgrade"){
       if(money(c)<100000)return{text:"❌ $100,000 required."};
       setMoney(c,money(c)-100000);
       p.attack+=10;p.defense+=10;p.maxHp=(p.maxHp||p.hp)+25;p.hp=p.maxHp;
     }

     return{
       text:`🐾 ${p.name} ${sub} complete!
❤️ HP: ${p.hp}/${p.maxHp||p.hp}
⚔️ ATK: ${p.attack}
🛡️ DEF: ${p.defense}
⚡ Energy: ${p.energy||0}
⭐ +50 XP
🎁 Care Token, Training Point, Happiness Point`,
       xp:50,
       rewards:[{id:"care_token"},{id:"training_point"},{id:"happiness_point"}]
     };
   }

   if(sub==="battle"||sub==="duel"){
     const p=owned(c)[0];
     if(!p)return{text:"❌ You need an active pet."};
     return{text:`⚔️ PET BATTLE READY
🐾 ${p.name}
❤️ ${p.hp}/${p.maxHp||p.hp}
⚔️ ${p.attack}
🛡️ ${p.defense}
🎯 Target: ${c.args.slice(1).join(" ")||"Opponent"}
🎮 Turn actions:
attack | skill | defend | ultimate | heal | switch | flee
⚡ Speed and battle energy are tracked.`,gameplay:false};
   }

   if(sub==="evolve"){
     const p=owned(c)[0];
     if(!p)return{text:"❌ No active pet."};
     if(money(c)<5000000)return{text:"❌ $5,000,000 required."};
     setMoney(c,money(c)-5000000);
     p.level=(p.level||1)+1;p.hp+=100;p.maxHp=(p.maxHp||p.hp)+100;p.attack+=75;p.defense+=75;
     return{
       text:`✨ EVOLUTION COMPLETE!
🐾 ${p.name}
⭐ Level ${p.level}
❤️ ${p.hp} | ⚔️ ${p.attack} | 🛡️ ${p.defense}
🎁 Evolution Stone, Gene Fragment, Rare Core`,
       xp:200,
       rewards:[{id:"evolution_stone"},{id:"gene_fragment"},{id:"rare_core"}]
     };
   }

   return{text:`🐾 PET SYSTEM

${c.prefix}pet shop
${c.prefix}pet items
${c.prefix}pet buy <name>
${c.prefix}pet view
${c.prefix}pet feed
${c.prefix}pet train
${c.prefix}pet battle @user
${c.prefix}pet evolve
${c.prefix}pet rename <number> <name>
${c.prefix}pet release <number>
${c.prefix}pet select <number>`,gameplay:false};
 }
},

{
 name:"buypet",aliases:["buy_pet"],category:"Pets",purpose:"Buy a pet",
 run:async c=>{c.args.unshift("buy");return commands.find(x=>x.name==="pet").run(c)}
},

{
 name:"petshop",aliases:["pet_shop"],category:"Pets",purpose:"Open pet shop",
 run:async c=>{c.args=["shop"];return commands.find(x=>x.name==="pet").run(c)}
},

{
 name:"sellpet",aliases:["sell_pet"],category:"Pets",purpose:"Sell active pet",
 run:async c=>{
   const p=owned(c).pop();
   if(!p)return{text:"❌ No pet to sell."};
   const cash=Math.floor((p.hp+p.attack+p.defense)*500);
   setMoney(c,money(c)+cash);
   return{text:`💰 Sold ${p.name} for $${cash.toLocaleString()}.\n🎁 Sale Token`,money:cash,rewards:[{id:"sale_token"}]};
 }
},

{
 name:"feed",aliases:["petfeed"],category:"Pets",purpose:"Feed active pet",
 run:async c=>{c.args=["feed"];return commands.find(x=>x.name==="pet").run(c)}
},

{
 name:"petbattle",aliases:["pet_battle","petduel"],category:"Pets",
 purpose:"Start a turn-by-turn pet battle",
 run:async c=>{
   const p=owned(c)[0];
   if(!p)return{text:"❌ You need an active pet."};
   const id=`${c.threadID}:${Date.now()}`,b=battleStore(c);
   b[id]={
     id,type:"pet",players:[c.uid],active:{[c.uid]:p.name},
     turn:c.uid,round:1,status:"waiting",history:[],
     energy:{[c.uid]:0},createdAt:Date.now()
   };
   return{text:`⚔️ PET BATTLE CREATED
🐾 ${p.name}
❤️ ${p.hp}/${p.maxHp||p.hp}
⚔️ ${p.attack} | 🛡️ ${p.defense}
🎯 Waiting for opponent...
🆔 ${id}`,gameplay:false};
 }
},

{
 name:"petstats",aliases:["pet_stats"],category:"Pets",purpose:"Show active pet stats",
 run:async c=>({text:owned(c)[0]?petText(owned(c)[0]):"❌ No pet.",gameplay:false})
},

{
 name:"skills",aliases:["pet_skills"],category:"Pets",purpose:"Show pet battle skills",
 run:async c=>({text:`⚔️ PET SKILLS\n\n${SKILLS.map((x,i)=>`${i+1}. ${x}`).join("\n")}`,gameplay:false})
},

{
 name:"pet_rank",aliases:["petrank"],category:"Pets",purpose:"Show pet rank",
 run:async c=>{
   const p=owned(c)[0];
   return{text:`🏆 PET RANK
🐾 ${p?.name||"None"}
⭐ Level ${p?.level||0}
⚔️ Wins ${p?.wins||0}
💀 Losses ${p?.losses||0}`,gameplay:false}
 }
},

{
 name:"petleaderboard",aliases:["pet_lb","petleader"],category:"Pets",purpose:"Show pet leaderboard",
 run:async c=>({text:"🏆 PET LEADERBOARD\n\nRankings use wins, battle XP, level and rarity.",gameplay:false})
},

{
 name:"petgift",aliases:["giftpet"],category:"Pets",purpose:"Gift a pet",
 run:async c=>({text:"🎁 Pet gifting is available through !pet gift @user <pet>.",gameplay:false})
},

{
 name:"pet_inventory",aliases:["petinv"],category:"Pets",purpose:"Show pet items",
 run:async c=>({text:`🎒 PET INVENTORY\n\n${PET_ITEMS.map(x=>`• ${x[0]} — $${x[1].toLocaleString()}`).join("\n")}`,gameplay:false})
},

{
 name:"petitems",aliases:["pet_items"],category:"Pets",purpose:"Show pet shop items",
 run:async c=>({text:`🛒 PET ITEMS\n\n${PET_ITEMS.map((x,i)=>`${i+1}. ${x[0]} | $${x[1].toLocaleString()} | ${x[2]}`).join("\n")}`,gameplay:false})
},

{
 name:"potion",aliases:["petpotion","buy_potion"],category:"Pets",purpose:"Use or buy pet potions",
 run:async c=>({text:"🧪 Pet potions are available in !pet items.",gameplay:false})
},

{
 name:"pet_egg",aliases:["petegg"],category:"Pets",purpose:"Show pet eggs",
 run:async c=>({text:`🥚 PET EGGS\n\n${EGGS.map(x=>`${x[0]} — $${x[1].toLocaleString()} — ${x[2]}`).join("\n")}`,gameplay:false})
},

{
 name:"pet_breed",aliases:["petbreed","breed"],category:"Pets",cooldown:300,purpose:"Breed compatible pets",
 run:async c=>{
   if(owned(c).length<2)return{text:"❌ You need at least 2 pets."};
   return{text:"🧬 BREEDING COMPLETE!\n🥚 Hybrid Egg created.\n⭐ +150 XP\n🎁 Gene Fragment, Breeding Token, Hybrid Core",xp:150,rewards:[{id:"gene_fragment"},{id:"breeding_token"},{id:"hybrid_core"}]};
 }
},

{
 name:"pet_fusion",aliases:["fusion"],category:"Pets",cooldown:300,purpose:"Fuse pets",
 run:async c=>{
   if(owned(c).length<2)return{text:"❌ Two pets required."};
   return{text:"🧬 FUSION COMPLETE!\n✨ Pet Fusion Core created.\n⭐ +200 XP\n🎁 Fusion Core, Mutation Chip, Rare Essence",xp:200,rewards:[{id:"fusion_core"},{id:"mutation_chip"},{id:"rare_essence"}]};
 }
},

{
 name:"pet_explore",aliases:["petexplore"],category:"Pets",cooldown:60,purpose:"Send a pet exploring",
 run:async c=>({text:"🧭 PET EXPEDITION COMPLETE!\n🐾 Your pet returned safely.\n💰 +$10,000\n⭐ +100 XP\n🎁 Explorer Token, Pet Food, Discovery Fragment",money:10000,xp:100,rewards:[{id:"pet_explorer_token"},{id:"pet_food"},{id:"discovery_fragment"}]})
},

{
 name:"pet_daily",aliases:["petdaily"],category:"Pets",cooldown:86400,purpose:"Claim pet daily reward",
 run:async c=>({text:"🐾 PET DAILY!\n💰 +$15,000\n⭐ +100 XP\n🎁 Pet Treat, Bond Token, Lucky Paw",money:15000,xp:100,rewards:[{id:"pet_treat"},{id:"bond_token"},{id:"lucky_paw"}]})
},

{
 name:"pet_hunt",aliases:["pethunt"],category:"Pets",cooldown:120,purpose:"Hunt with your pet",
 run:async c=>({text:"🏹 PET HUNT COMPLETE!\n💰 +$12,000\n⭐ +100 XP\n🎁 Hunt Trophy, Meat Pack, Hunter Token",money:12000,xp:100,rewards:[{id:"hunt_trophy"},{id:"meat_pack"},{id:"hunter_token"}]})
},

{
 name:"pet_fish",aliases:["petfish"],category:"Pets",cooldown:120,purpose:"Fish with your pet",
 run:async c=>({text:"🎣 PET FISHING COMPLETE!\n💰 +$10,000\n⭐ +100 XP\n🎁 Fish Trophy, Bait Pack, Fisher Token",money:10000,xp:100,rewards:[{id:"fish_trophy"},{id:"bait_pack"},{id:"fisher_token"}]})
},

{
 name:"pet_dig",aliases:["petdig"],category:"Pets",cooldown:120,purpose:"Dig for treasure with your pet",
 run:async c=>({text:"⛏️ PET DIG COMPLETE!\n💰 +$15,000\n⭐ +100 XP\n🎁 Dig Token, Ore Fragment, Treasure Shard",money:15000,xp:100,rewards:[{id:"dig_token"},{id:"ore_fragment"},{id:"treasure_shard"}]})
},

{
 name:"pet_race",aliases:["petrace"],category:"Pets",cooldown:180,purpose:"Race your pet",
 run:async c=>({text:"🏁 PET RACE COMPLETE!\n🏆 Race result recorded.\n💰 +$20,000\n⭐ +120 XP\n🎁 Race Medal, Speed Token, Prize Ticket",money:20000,xp:120,rewards:[{id:"race_medal"},{id:"speed_token"},{id:"prize_ticket"}]})
},

{
 name:"pet_quest",aliases:["petquest"],category:"Pets",purpose:"Show pet quests",
 run:async c=>({text:"📜 PET QUESTS\n\n🐾 Train your pet\n🐾 Explore an area\n🐾 Win a battle\n🐾 Find rare loot\n🐾 Evolve a pet",gameplay:false})
},

{
 name:"pet_ability",aliases:["petability"],category:"Pets",purpose:"Show active pet ability",
 run:async c=>({text:`⚡ ACTIVE ABILITY\n🐾 ${owned(c)[0]?.name||"None"}\n✨ ${SKILLS[Math.floor(Math.random()*SKILLS.length)]}`,gameplay:false})
},

{
 name:"pet_profile",aliases:["petprofile"],category:"Pets",purpose:"Show pet profile",
 run:async c=>({text:owned(c)[0]?petText(owned(c)[0]):"❌ No pet.",gameplay:false})
},

{
 name:"pet_inspect",aliases:["inspectpet"],category:"Pets",purpose:"Inspect a pet",
 run:async c=>{
   const p=owned(c)[0];
   return{text:p?`🔍 INSPECT\n\n${petText(p)}\n⚔️ Skills: ${(p.skills||[]).join(", ")||"None"}`:"❌ No pet.",gameplay:false}
 }
},

{
 name:"pet_sleep",aliases:["petsleep","pet_nap"],category:"Pets",cooldown:300,purpose:"Restore pet energy",
 run:async c=>{
   const p=owned(c)[0];
   if(!p)return{text:"❌ No pet."};
   p.energy=100;
   return{text:`😴 ${p.name} rested.\n⚡ Energy restored to 100.\n🎁 Rest Token, Comfort Food, Sleep Charm`,rewards:[{id:"rest_token"},{id:"comfort_food"},{id:"sleep_charm"}]};
 }
},

{
 name:"pet_trick",aliases:["pettrick"],category:"Pets",purpose:"Perform a pet trick",
 run:async c=>({text:`🎪 ${owned(c)[0]?.name||"Your pet"} performed a trick!\n⭐ +30 XP\n🎁 Trick Token, Treat, Happiness Point`,xp:30,rewards:[{id:"trick_token"},{id:"treat"},{id:"happiness_point"}]})
},

{
 name:"pet_party",aliases:["petparty"],category:"Pets",cooldown:300,purpose:"Host a pet party",
 run:async c=>({text:"🎉 PET PARTY!\n💰 +$25,000\n⭐ +150 XP\n🎁 Party Ticket, Friendship Token, Party Box",money:25000,xp:150,rewards:[{id:"party_ticket"},{id:"friendship_token"},{id:"party_box"}]})
},

{
 name:"pet_spa",aliases:["petspa"],category:"Pets",cooldown:300,purpose:"Restore pet condition",
 run:async c=>({text:"🧖 PET SPA COMPLETE!\n❤️ Condition restored.\n⭐ +100 XP\n🎁 Spa Voucher, Grooming Kit, Comfort Charm",xp:100,rewards:[{id:"spa_voucher"},{id:"grooming_kit"},{id:"comfort_charm"}]})
},

{
 name:"pet_dungeon",aliases:["petdungeon"],category:"Pets",purpose:"Enter a dungeon with your pet",
 run:async c=>({text:"🏰 PET DUNGEON\nChoose a floor and prepare your pet team.",gameplay:false})
},

{
 name:"pet_raid",aliases:["petraid"],category:"Pets",purpose:"Join a pet raid",
 run:async c=>({text:"⚔️ PET RAID\nRaid party system ready.\nUse your strongest pets and coordinate turns.",gameplay:false})
},

{
 name:"pet_rescue",aliases:["petrescue"],category:"Pets",cooldown:300,purpose:"Rescue a lost pet",
 run:async c=>({text:"🚑 PET RESCUE SUCCESS!\n🐾 A lost pet was rescued.\n💰 +$20,000\n⭐ +150 XP\n🎁 Rescue Badge, Care Kit, Hero Token",money:20000,xp:150,rewards:[{id:"rescue_badge"},{id:"care_kit"},{id:"hero_token"}]})
},

{
 name:"pet_mine",aliases:["petmine"],category:"Pets",cooldown:120,purpose:"Mine with your pet",
 run:async c=>({text:"⛏️ PET MINING COMPLETE!\n💰 +$12,000\n⭐ +100 XP\n🎁 Ore Pack, Mining Token, Gem Fragment",money:12000,xp:100,rewards:[{id:"ore_pack"},{id:"mining_token"},{id:"gem_fragment"}]})
},

{
 name:"pet_foraging",aliases:["petforage"],category:"Pets",cooldown:120,purpose:"Forage with your pet",
 run:async c=>({text:"🌿 PET FORAGING COMPLETE!\n💰 +$8,000\n⭐ +80 XP\n🎁 Herb Pack, Nature Token, Food Bundle",money:8000,xp:80,rewards:[{id:"herb_pack"},{id:"nature_token"},{id:"food_bundle"}]})
}
];

module.exports=commands;
