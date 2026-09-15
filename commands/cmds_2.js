const U=new Map(),P=[
"voidfang","bloodmoon_wolf","inferno_hound","shadow_drake","venomclaw","nightstalker","bonecrusher","hellfang","frostbite_beast","stormfang",
"dreadclaw","skullreaper","embermaw","darkwing","thunderjaw","ironhide","ravager","deathscale","ashfang","grimtooth",
"chaos_wolf","toxic_hydra","crimson_wyvern","abyss_serpent","doomcat","warbear","phantom_tiger","nether_hound","dragonfang","black_talon",
"wraith_wolf","demon_lynx","infernal_croc","steelback","razorclaw","magma_beast","frost_drake","thunder_roc","venom_hydra","leviathan_pup",
"void_serpent","cursed_panther","bloodclaw","soul_reaper","titan_hound","apocalypse_drake","chaos_hydra","ancient_behemoth","world_eater","apex_overlord"
];

function u(id){if(!U.has(id))U.set(id,{pets:[],active:null,coins:500000,items:{},farm:{level:1,crops:[],storage:0,workers:0,land:1,animals:0},skills:{power:1,speed:1,defense:1},wins:0});return U.get(id)}
function r(ctx,s){ctx.reply(`╭━━ 🐾 PETS + FARM ━━╮\n${s}\n╰━━━━━━━━━━━━━━━━━━╯`)}
function c(name,description,execute,aliases=[]){return{name,description,execute,aliases,reaction:"🐾"}}
function pet(ctx){return u(ctx.event.senderID)}
function addPet(x,n){if(!x.pets.includes(n))x.pets.push(n)}

const C={};

// ============================================================
// 🐾 PET LAB
// ============================================================

C.pets=c("pets","View your pets",ctx=>{
 const x=pet(ctx);
 r(ctx,x.pets.length?`🐾 Your Pets:\n${x.pets.map((p,i)=>`${i+1}. ${p}${x.active===p?" ⭐":" "}`).join("\n")}`:"📭 You have no pets.\nUse !pet_shop");
});

C.pet_shop=c("pet_shop","Open pet shop",ctx=>{
 r(ctx,`🏪 PET SHOP\n🐺 voidfang — $500K\n🐉 shadow_drake — $750K\n🔥 inferno_hound — $900K\n👑 apex_overlord — $10M\n\n📌 !buypet <pet>`);
},["petshop"]);

C.buypet=c("buypet","Buy a fictional pet",ctx=>{
 const x=pet(ctx),n=(ctx.args[0]||"").toLowerCase();
 if(!P.includes(n))return r(ctx,"❌ Pet not found. Use !pet_shop");
 if(x.pets.includes(n))return r(ctx,"⚠️ You already own this pet.");
 const prices={voidfang:500000,shadow_drake:750000,inferno_hound:900000,apex_overlord:10000000};
 const price=prices[n]||250000;
 if(x.coins<price)return r(ctx,`💸 Need $${price.toLocaleString()}.`);
 x.coins-=price;addPet(x,n);r(ctx,`🎉 Purchased ${n}!\n💰 Balance: $${x.coins.toLocaleString()}`);
});

C.sellpet=c("sellpet","Sell a pet",ctx=>{
 const x=pet(ctx),n=(ctx.args[0]||x.active||"").toLowerCase(),i=x.pets.indexOf(n);
 if(i<0)return r(ctx,"❌ You don't own that pet.");
 x.pets.splice(i,1);if(x.active===n)x.active=null;x.coins+=250000;
 r(ctx,`💰 Sold ${n} for $250,000.`);
});

C.rename=c("rename","Rename equipped pet",ctx=>{
 const x=pet(ctx),n=ctx.args.join(" ");
 if(!x.active)return r(ctx,"❌ Equip a pet first.");
 if(!n)return r(ctx,"📌 !rename <new name>");
 r(ctx,`✏️ ${x.active} is now known as "${n}".`);
});

C.release=c("release","Release a pet",ctx=>{
 const x=pet(ctx),n=(ctx.args[0]||"").toLowerCase(),i=x.pets.indexOf(n);
 if(i<0)return r(ctx,"❌ Pet not found.");
 x.pets.splice(i,1);if(x.active===n)x.active=null;r(ctx,`🌿 ${n} has been released.`);
});

C.equip=c("equip","Equip a pet",ctx=>{
 const x=pet(ctx),n=(ctx.args[0]||"").toLowerCase();
 if(!x.pets.includes(n))return r(ctx,"❌ You don't own that pet.");
 x.active=n;r(ctx,`⭐ Equipped: ${n}`);
});

C.unequip=c("unequip","Unequip your pet",ctx=>{
 const x=pet(ctx);x.active=null;r(ctx,"🐾 Pet unequipped.");
});

C.favorite=c("favorite","Favorite a pet",ctx=>{
 const x=pet(ctx),n=(ctx.args[0]||x.active||"").toLowerCase();
 if(!x.pets.includes(n))return r(ctx,"❌ Pet not found.");
 r(ctx,`💖 ${n} added to favorites.`);
});

C.giftpet=c("giftpet","Gift a fictional pet",ctx=>{
 const x=pet(ctx),n=(ctx.args[0]||"").toLowerCase();
 if(!n)return r(ctx,"📌 !giftpet <pet> @user");
 if(!x.pets.includes(n))return r(ctx,"❌ You don't own that pet.");
 r(ctx,`🎁 ${n} is ready to be gifted to the mentioned player.`);
});

C.inspect=c("inspect","Inspect your active pet",ctx=>{
 const x=pet(ctx);if(!x.active)return r(ctx,"❌ Equip a pet first.");
 r(ctx,`🔎 ${x.active}\n❤️ HP: 100\n⚔️ Power: ${x.skills.power}\n🏃 Speed: ${x.skills.speed}\n🛡️ Defense: ${x.skills.defense}`);
});

C.insurance=c("insurance","Protect your pet",ctx=>r(ctx,"🛡️ Pet insurance is active for your game pets."));
C.salvage=c("salvage","Salvage pet gear",ctx=>r(ctx,"♻️ Pet gear salvaged into crafting materials."));
C.feed=c("feed","Feed active pet",ctx=>r(ctx,`🍖 ${pet(ctx).active||"Your pet"} has been fed.`));
C.water=c("water","Give pet water",ctx=>r(ctx,`💧 ${pet(ctx).active||"Your pet"} is hydrated.`));
C.heal=c("heal","Heal active pet",ctx=>r(ctx,`❤️ ${pet(ctx).active||"Your pet"} restored to full HP.`));
C.revive=c("revive","Revive active pet",ctx=>r(ctx,`✨ ${pet(ctx).active||"Your pet"} has been revived.`));
C.sleep=c("sleep","Put pet to sleep",ctx=>r(ctx,`😴 ${pet(ctx).active||"Your pet"} is sleeping.`));
C.wake=c("wake","Wake pet",ctx=>r(ctx,`☀️ ${pet(ctx).active||"Your pet"} woke up.`));
C.clean=c("clean","Clean active pet",ctx=>r(ctx,`🧼 ${pet(ctx).active||"Your pet"} is clean.`));
C.pet_doctor=c("pet_doctor","Visit pet doctor",ctx=>r(ctx,"🩺 Pet Doctor: Your pet has been checked."));
C.vitamin=c("vitamin","Give pet vitamins",ctx=>r(ctx,"💊 Pet received vitamins."));
C.steroid=c("steroid","Use fictional pet booster",ctx=>r(ctx,"⚡ Fictional game booster activated."));
C.diet=c("diet","Change pet diet",ctx=>r(ctx,"🥩 Pet diet updated."));
C.vaccine=c("vaccine","Vaccinate game pet",ctx=>r(ctx,"💉 Game pet vaccination complete."));

C.petbattle=c("petbattle","Battle another pet",ctx=>{
 const x=pet(ctx);if(!x.active)return r(ctx,"❌ Equip a pet first.");
 x.wins++;r(ctx,`⚔️ ${x.active} won the pet battle!\n🏆 Wins: ${x.wins}`);
});

C.pve_hunt=c("pve_hunt","Send pet on a PvE hunt",ctx=>{
 const x=pet(ctx);if(!x.active)return r(ctx,"❌ Equip a pet first.");
 r(ctx,`🏹 ${x.active} completed a fictional PvE hunt!\n💰 +$150K\n✨ +XP`);
 x.coins+=150000;
});

C.arena_rank=c("arena_rank","View pet arena rank",ctx=>r(ctx,`🏟️ Pet Arena Rank\n🏆 Wins: ${pet(ctx).wins}\n⭐ Rank: ${Math.max(1,Math.floor(pet(ctx).wins/5)+1)}`));
C.skills=c("skills","View pet skills",ctx=>{let x=pet(ctx);r(ctx,`🌳 SKILLS\n⚔️ Power ${x.skills.power}\n🏃 Speed ${x.skills.speed}\n🛡️ Defense ${x.skills.defense}`)});
C.upgrade_skill=c("upgrade_skill","Upgrade pet skill",ctx=>{
 const x=pet(ctx),s=(ctx.args[0]||"power").toLowerCase();
 if(!x.skills[s])return r(ctx,"📌 Use power, speed or defense.");
 x.skills[s]++;r(ctx,`⬆️ ${s} upgraded to ${x.skills[s]}.`);
});
C.defend=c("defend","Defend in pet combat",ctx=>r(ctx,"🛡️ Defensive stance activated."));
C.flee=c("flee","Flee pet battle",ctx=>r(ctx,"🏃 Battle escaped."));
C.spectate=c("spectate","Spectate pet battle",ctx=>r(ctx,"👀 Spectating a fictional pet battle."));
C.challenge_bot=c("challenge_bot","Challenge game bot pet",ctx=>r(ctx,"🤖 Bot pet challenge accepted!"));
C.bet_battle=c("bet_battle","Bet on fictional pet battle",ctx=>r(ctx,"🎲 Pet battle wager registered in the game."));
C.damage_matrix=c("damage_matrix","View pet damage chart",ctx=>r(ctx,"⚔️ DAMAGE MATRIX\n🔥 Fire > Frost\n❄️ Frost > Storm\n⚡ Storm > Water\n🌑 Void > Shadow"));
C.rage=c("rage","Activate pet rage",ctx=>r(ctx,`😡 ${pet(ctx).active||"Pet"} entered Rage Mode!`));

[
"pet_breed","pet_fusion","evolve","mutate","incubate","hatch","clone","gene_splice","dna_bank",
"de_evolve","ascend","sterilize","buy_toy","play","buy_potion","use_potion","craft_item",
"item_vault","collar","leash","market_list","market_buy","cosmetics","scrap","scavenge",
"pet_job","guard_home","patrol","track_user","smuggle_pet","pet_expo","mine_crypto",
"tax_collector","spy","rescue","safari","cyber_enhance","dna_sequence","clone_vats",
"graft_trait","cryo_freeze","bio_waste","nano_heal","guild_register","guild_raid",
"pet_pageant","trick_show","licensing","bounty_hound","smell_contraband","pet_psych",
"loyalty_oath","jealousy","pack_order","temperament","comfort","hibernation",
"blackmarket_pet","pet_ransom","poach","tax_evasion_pet","scrap_gear","pet_loan"
].forEach(n=>C[n]=c(n,`Pet system: ${n.replace(/_/g," ")}`,ctx=>r(ctx,`🐾 ${n.replace(/_/g," ").toUpperCase()}\n✅ Game system ready.`)));

// ============================================================
// 🌾 FARMING
// ============================================================

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

for(const[n,d]of Object.entries(farmCmds))C[n]=c(n,d,ctx=>{
 const x=pet(ctx).farm;
 if(n==="farm")return r(ctx,`🌾 FARM\n⭐ Level: ${x.level}\n🌱 Crops: ${x.crops.length}\n👷 Workers: ${x.workers}\n🏡 Land: ${x.land}`);
 if(n==="plant"){
  const crop=ctx.args[0]||"wheat";x.crops.push(crop);return r(ctx,`🌱 Planted ${crop}.`);
 }
 if(n==="harvest"){
  if(!x.crops.length)return r(ctx,"🌾 Nothing to harvest.");
  const q=x.crops.length*50000;x.crops=[];x.storage+=q;return r(ctx,`🌾 Harvest complete!\n💰 Crop value: $${q.toLocaleString()}`);
 }
 if(n==="farm_upgrade"){x.level++;x.land++;return r(ctx,`⬆️ Farm upgraded to Level ${x.level}.`)}
 if(n==="farm_worker"){x.workers++;return r(ctx,`👷 Worker hired. Total: ${x.workers}`)}
 if(n==="farm_storage")return r(ctx,`🏚️ Storage value: $${x.storage.toLocaleString()}`);
 if(n==="animal_farm"){x.animals++;return r(ctx,`🐄 Animal added. Total: ${x.animals}`)}
 if(n==="farm_rank"||n==="farm_lb")return r(ctx,`🏆 FARM RANK\n⭐ Level ${x.level}\n🌾 Storage $${x.storage.toLocaleString()}`);
 if(n==="crop_info")return r(ctx,"🌱 WHEAT • CORN • RICE • TOMATO • GOLDEN CROP");
 if(n==="seed_shop")return r(ctx,"🌱 SEED SHOP\n🌾 Wheat $5K\n🌽 Corn $8K\n🍅 Tomato $12K\n✨ Golden Crop $100K");
 if(n==="weather")return r(ctx,"🌤️ Farm Weather: Clear\n🌱 Crop growth: Normal");
 if(n==="season")return r(ctx,"🌱 Season: Spring\n🌾 Growth bonus: +10%");
 r(ctx,`🌾 ${d}\n✅ Farm action completed.`);
});

module.exports=C;
