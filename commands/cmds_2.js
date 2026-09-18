const U=new Map(),P=[
"voidfang","bloodmoon_wolf","inferno_hound","shadow_drake","venomclaw","nightstalker","bonecrusher","hellfang","frostbite_beast","stormfang",
"dreadclaw","skullreaper","embermaw","darkwing","thunderjaw","ironhide","ravager","deathscale","ashfang","grimtooth",
"chaos_wolf","toxic_hydra","crimson_wyvern","abyss_serpent","doomcat","warbear","phantom_tiger","nether_hound","dragonfang","black_talon",
"wraith_wolf","demon_lynx","infernal_croc","steelback","razorclaw","magma_beast","frost_drake","thunder_roc","venom_hydra","leviathan_pup",
"void_serpent","cursed_panther","bloodclaw","soul_reaper","titan_hound","apocalypse_drake","chaos_hydra","ancient_behemoth","world_eater","apex_overlord"
];

const u=id=>{
 if(!U.has(id))U.set(id,{pets:[],active:null,coins:500000,items:{},farm:{level:1,crops:[],storage:0,workers:0,land:1,animals:0},skills:{power:1,speed:1,defense:1},wins:0});
 return U.get(id);
};
const r=(c,s)=>c.reply(`╭━━ 🐾 PETS + FARM ━━╮\n${s}\n╰━━━━━━━━━━━━━━━━━━╯`);
const c=(name,description,execute,aliases=[])=>({name,description,execute,aliases,reaction:"🐾"});
const pet=c=>u(c.event.senderID);
const addPet=(x,n)=>{if(!x.pets.includes(n))x.pets.push(n)};
const C={};

// 🐾 PETS
C.pets=c("pets","View your pets",c=>{
 const x=pet(c);
 r(c,x.pets.length?`🐾 Your Pets:\n${x.pets.map((p,i)=>`${i+1}. ${p}${x.active===p?" ⭐":""}`).join("\n")}`:"📭 You have no pets.\nUse !pet_shop");
});

C.pet_shop=c("pet_shop","Open pet shop",c=>r(c,
`🏪 PET SHOP
🐺 voidfang — $500K
🐉 shadow_drake — $750K
🔥 inferno_hound — $900K
👑 apex_overlord — $10M

📌 !buypet <pet>`),["petshop"]);

C.buypet=c("buypet","Buy a fictional pet",c=>{
 const x=pet(c),n=(c.args[0]||"").toLowerCase();
 if(!P.includes(n))return r(c,"❌ Pet not found. Use !pet_shop");
 if(x.pets.includes(n))return r(c,"⚠️ You already own this pet.");
 const prices={voidfang:500000,shadow_drake:750000,inferno_hound:900000,apex_overlord:10000000},price=prices[n]||250000;
 if(x.coins<price)return r(c,`💸 Need $${price.toLocaleString()}.`);
 x.coins-=price;addPet(x,n);r(c,`🎉 Purchased ${n}!\n💰 Balance: $${x.coins.toLocaleString()}`);
});

C.sellpet=c("sellpet","Sell a pet",c=>{
 const x=pet(c),n=(c.args[0]||x.active||"").toLowerCase(),i=x.pets.indexOf(n);
 if(i<0)return r(c,"❌ You don't own that pet.");
 x.pets.splice(i,1);if(x.active===n)x.active=null;x.coins+=250000;
 r(c,`💰 Sold ${n} for $250,000.`);
});

C.rename=c("rename","Rename equipped pet",c=>{
 const x=pet(c),n=c.args.join(" ");
 if(!x.active)return r(c,"❌ Equip a pet first.");
 if(!n)return r(c,"📌 !rename <new name>");
 x.petNames=x.petNames||{};
 x.petNames[x.active]=n;
 r(c,`✏️ ${x.active} is now known as "${n}".`);
});

C.release=c("release","Release a pet",c=>{
 const x=pet(c),n=(c.args[0]||"").toLowerCase(),i=x.pets.indexOf(n);
 if(i<0)return r(c,"❌ Pet not found.");
 x.pets.splice(i,1);if(x.active===n)x.active=null;r(c,`🌿 ${n} has been released.`);
});

C.equip=c("equip","Equip a pet",c=>{
 const x=pet(c),n=(c.args[0]||"").toLowerCase();
 if(!x.pets.includes(n))return r(c,"❌ You don't own that pet.");
 x.active=n;r(c,`⭐ Equipped: ${n}`);
});

C.unequip=c("unequip","Unequip your pet",c=>{pet(c).active=null;r(c,"🐾 Pet unequipped.")});

C.favorite=c("favorite","Favorite a pet",c=>{
 const x=pet(c),n=(c.args[0]||x.active||"").toLowerCase();
 if(!x.pets.includes(n))return r(c,"❌ Pet not found.");
 x.favorite=x.favorite||new Set;
 x.favorite.add(n);
 r(c,`💖 ${n} added to favorites.`);
});

C.giftpet=c("giftpet","Gift a fictional pet",c=>{
 const x=pet(c),n=(c.args[0]||"").toLowerCase();
 if(!n)return r(c,"📌 !giftpet <pet> @user");
 if(!x.pets.includes(n))return r(c,"❌ You don't own that pet.");
 r(c,`🎁 ${n} is ready to be gifted to the mentioned player.`);
});

C.inspect=c("inspect","Inspect your active pet",c=>{
 const x=pet(c);
 if(!x.active)return r(c,"❌ Equip a pet first.");
 r(c,`🔎 ${x.active}\n❤️ HP: 100\n⚔️ Power: ${x.skills.power}\n🏃 Speed: ${x.skills.speed}\n🛡️ Defense: ${x.skills.defense}`);
});

[
 ["insurance","Protect your pet","🛡️ Pet insurance is active for your game pets."],
 ["salvage","Salvage pet gear","♻️ Pet gear salvaged into crafting materials."],
 ["feed","Feed active pet",null],
 ["water","Give pet water",null],
 ["heal","Heal active pet",null],
 ["revive","Revive active pet",null],
 ["sleep","Put pet to sleep",null],
 ["wake","Wake pet",null],
 ["clean","Clean active pet",null],
 ["pet_doctor","Visit pet doctor","🩺 Pet Doctor: Your pet has been checked."],
 ["vitamin","Give pet vitamins","💊 Pet received vitamins."],
 ["steroid","Use fictional pet booster","⚡ Fictional game booster activated."],
 ["diet","Change pet diet","🥩 Pet diet updated."],
 ["vaccine","Vaccinate game pet","💉 Game pet vaccination complete."]
].forEach(([n,d,msg])=>C[n]=c(n,d,c=>{
 const p=pet(c).active||"Your pet";
 r(c,msg||({feed:`🍖 ${p} has been fed.`,water:`💧 ${p} is hydrated.`,heal:`❤️ ${p} restored to full HP.`,revive:`✨ ${p} has been revived.`,sleep:`😴 ${p} is sleeping.`,wake:`☀️ ${p} woke up.`,clean:`🧼 ${p} is clean.`}[n]));
}));

C.petbattle=c("petbattle","Battle another pet",c=>{
 const x=pet(c);
 if(!x.active)return r(c,"❌ Equip a pet first.");
 x.wins++;r(c,`⚔️ ${x.active} won the pet battle!\n🏆 Wins: ${x.wins}`);
});

C.pve_hunt=c("pve_hunt","Send pet on a PvE hunt",c=>{
 const x=pet(c);
 if(!x.active)return r(c,"❌ Equip a pet first.");
 x.coins+=150000;r(c,`🏹 ${x.active} completed a fictional PvE hunt!\n💰 +$150K\n✨ +XP`);
});

C.arena_rank=c("arena_rank","View pet arena rank",c=>{
 const x=pet(c);r(c,`🏟️ Pet Arena Rank\n🏆 Wins: ${x.wins}\n⭐ Rank: ${Math.max(1,Math.floor(x.wins/5)+1)}`);
});

C.skills=c("skills","View pet skills",c=>{
 const x=pet(c);r(c,`🌳 SKILLS\n⚔️ Power ${x.skills.power}\n🏃 Speed ${x.skills.speed}\n🛡️ Defense ${x.skills.defense}`);
});

C.upgrade_skill=c("upgrade_skill","Upgrade pet skill",c=>{
 const x=pet(c),s=(c.args[0]||"power").toLowerCase();
 if(!Object.hasOwn(x.skills,s))return r(c,"📌 Use power, speed or defense.");
 x.skills[s]++;r(c,`⬆️ ${s} upgraded to ${x.skills[s]}.`);
});

[
 ["defend","Defend in pet combat","🛡️ Defensive stance activated."],
 ["flee","Flee pet battle","🏃 Battle escaped."],
 ["spectate","Spectate pet battle","👀 Spectating a fictional pet battle."],
 ["challenge_bot","Challenge game bot","🤖 Bot pet challenge accepted!"],
 ["bet_battle","Bet on fictional pet battle","🎲 Pet battle wager registered in the game."],
 ["damage_matrix","View pet damage chart","⚔️ DAMAGE MATRIX\n🔥 Fire > Frost\n❄️ Frost > Storm\n⚡ Storm > Water\n🌑 Void > Shadow"],
 ["rage","Activate pet rage",null]
].forEach(([n,d,msg])=>C[n]=c(n,d,c=>r(c,msg||`😡 ${pet(c).active||"Pet"} entered Rage Mode!`)));

[
"pet_breed","pet_fusion","evolve","mutate","incubate","hatch","clone","gene_splice","dna_bank",
"de_evolve","ascend","sterilize","buy_toy","play","buy_potion","use_potion","craft_item",
"item_vault","collar","leash","market_list",
"cosmetics","scrap","scavenge","pet_job","guard_home","patrol","track_user","smuggle_pet",
"pet_expo","mine_crypto","tax_collector","spy","rescue","safari","cyber_enhance","dna_sequence",
"clone_vats","graft_trait","cryo_freeze","bio_waste","nano_heal","guild_register","guild_raid",
"pet_pageant","trick_show","licensing","bounty_hound","smell_contraband","pet_psych",
"loyalty_oath","jealousy","pack_order","temperament","comfort","hibernation",
"blackmarket_pet","pet_ransom","poach","tax_evasion_pet","scrap_gear","pet_loan"
].forEach(n=>C[n]=c(n,`Pet system: ${n.replace(/_/g," ")}`,c=>r(c,`🐾 ${n.replace(/_/g," ").toUpperCase()}\n✅ Game system ready.`)));

// 🌾 FARMING
const farmCmds={
 farm:"View your farm",plant:"Plant a crop",harvest:"Harvest crops",water_crop:"Water crops",
 fertilize:"Fertilize crops",weed:"Remove weeds",pest_control:"Control pests",crop_info:"Crop information",
 seed_shop:"Open seed shop",buy_seed:"Buy seeds",sell_crop:"Sell crops",farm_upgrade:"Upgrade farm",
 farm_worker:"Manage farm workers",farm_storage:"View farm storage",farm_market:"Farm market",
 animal_farm:"Manage farm animals",feed_animal:"Feed farm animals",milk:"Collect milk",collect_egg:"Collect eggs",
 shear:"Shear animals",barn:"View barn",silo:"View silo",tractor:"Use tractor",irrigation:"Use irrigation",
 compost:"Make compost",weather:"Check farm weather",season:"Check farming season",farm_quest:"Farm quest",
 farm_rank:"Farm rank",farm_lb:"Farm leaderboard",farm_contract:"Farm contract",farm_export:"Export crops"
};

for(const[n,d]of Object.entries(farmCmds))C[n]=c(n,d,c=>{
 const x=pet(c).farm;
 if(n==="farm")return r(c,`🌾 FARM\n⭐ Level: ${x.level}\n🌱 Crops: ${x.crops.length}\n👷 Workers: ${x.workers}\n🏡 Land: ${x.land}`);
 if(n==="plant"){const crop=c.args[0]||"wheat";x.crops.push(crop);return r(c,`🌱 Planted ${crop}.`)}
 if(n==="harvest"){
  if(!x.crops.length)return r(c,"🌾 Nothing to harvest.");
  const q=x.crops.length*50000;x.crops=[];x.storage+=q;
  return r(c,`🌾 Harvest complete!\n💰 Crop value: $${q.toLocaleString()}`);
 }
 if(n==="farm_upgrade"){x.level++;x.land++;return r(c,`⬆️ Farm upgraded to Level ${x.level}.`)}
 if(n==="farm_worker"){x.workers++;return r(c,`👷 Worker hired. Total: ${x.workers}`)}
 if(n==="farm_storage")return r(c,`🏚️ Storage value: $${x.storage.toLocaleString()}`);
 if(n==="animal_farm"){x.animals++;return r(c,`🐄 Animal added. Total: ${x.animals}`)}
 if(n==="farm_rank"||n==="farm_lb")return r(c,`🏆 FARM RANK\n⭐ Level ${x.level}\n🌾 Storage $${x.storage.toLocaleString()}`);
 if(n==="crop_info")return r(c,"🌱 WHEAT • CORN • RICE • TOMATO • GOLDEN CROP");
 if(n==="seed_shop")return r(c,"🌱 SEED SHOP\n🌾 Wheat $5K\n🌽 Corn $8K\n🍅 Tomato $12K\n✨ Golden Crop $100K");
 if(n==="weather")return r(c,"🌤️ Farm Weather: Clear\n🌱 Crop growth: Normal");
 if(n==="season")return r(c,"🌱 Season: Spring\n🌾 Growth bonus: +10%");
 r(c,`🌾 ${d}\n✅ Farm action completed.`);
});

module.exports=C;
