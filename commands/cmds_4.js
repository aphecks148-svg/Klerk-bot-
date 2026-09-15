const U=new Map();
function u(id){if(!U.has(id))U.set(id,{cash:0,wanted:0,jail:0,crew:null,cars:[],garage:[],respect:0,turf:0,missions:0});return U.get(id)}
function r(c,s){c.reply(`╭━━ 🔫 GTA + VEHICLES ━━╮\n${s}\n╰━━━━━━━━━━━━━━━━━━━━╯`)}
function cmd(name,description,execute,aliases=[]){return{name,description,execute,aliases,reaction:"🔥"}}
const C={};

// ============================================================
// 🔫 GTA MISSIONS
// ============================================================

for(let i=1;i<=20;i++){
 const n=`gta_mission_${i}`;
 C[n]=cmd(n,`GTA Mission ${i}`,c=>{
  const x=u(c.event.senderID),reward=100000+i*50000;
  x.cash+=reward;x.missions++;
  r(c,`🎯 GTA MISSION ${i}\n✅ Mission complete!\n💰 +$${reward.toLocaleString()}\n⭐ Missions: ${x.missions}`);
 });
}

// ============================================================
// 💰 FICTIONAL CRIME SYSTEM
// ============================================================

C.heist=cmd("heist","Start a fictional heist",c=>{
 const x=u(c.event.senderID),reward=30000000;
 x.cash+=reward;r(c,`💰 HEIST COMPLETE!\n🎯 Fictional crew operation successful.\n💵 +$${reward.toLocaleString()}`);
});

C.crew_join=cmd("crew_join","Join a fictional crew",c=>{
 const x=u(c.event.senderID);x.crew=c.args.join(" ")||"Street Crew";
 r(c,`👥 Joined: ${x.crew}`);
});

C.crew_kick=cmd("crew_kick","Remove a crew member",c=>r(c,"👥 Crew member removed from the fictional crew."));
C.heist_plan=cmd("heist_plan","Plan a fictional heist",c=>r(c,"🗺️ Heist planning board opened.\n🎯 Choose crew • target • escape route."));
C.rob=cmd("rob","Attempt fictional robbery",c=>{let x=u(c.event.senderID),n=1200000;x.cash+=n;x.wanted=Math.min(5,x.wanted+1);r(c,`💰 Fictional robbery successful!\n+$${n.toLocaleString()}\n⭐ Wanted: ${x.wanted}/5`)});
C.hack=cmd("hack","Play fictional hacking mission",c=>{let x=u(c.event.senderID),n=3000000;x.cash+=n;x.wanted=Math.min(5,x.wanted+1);r(c,`💻 Fictional hacking mission complete!\n💰 +$${n.toLocaleString()}\n⭐ Wanted: ${x.wanted}/5`)});
C.mug=cmd("mug","Attempt fictional mugging",c=>{let x=u(c.event.senderID);x.cash+=300000;x.wanted=Math.min(5,x.wanted+1);r(c,"💰 Fictional mugging mission complete.\n+$300,000")});
C.bounty_hunt=cmd("bounty_hunt","Hunt a fictional game target",c=>{let x=u(c.event.senderID);x.cash+=500000;x.respect++;r(c,"🎯 Bounty completed!\n💰 +$500,000\n⭐ Respect +1")});
C.scam=cmd("scam","Fictional scam mini-game",c=>r(c,"🎭 Fictional scam mini-game completed."));
C.carjack=cmd("carjack","Steal a fictional game vehicle",c=>{let x=u(c.event.senderID);x.wanted=Math.min(5,x.wanted+1);x.cars.push("Stolen Ride");r(c,"🚗 Fictional vehicle acquired.\n⭐ Wanted +1")});
C.extort=cmd("extort","Fictional intimidation mission",c=>r(c,"💼 Fictional extortion mission completed."));
C.loan_shark=cmd("loan_shark","Run fictional loan-shark mission",c=>r(c,"💰 Fictional loan mission completed."));
C.shred_records=cmd("shred_records","Destroy fictional game records",c=>r(c,"🗑️ Fictional records mission completed."));
C.weapons=cmd("weapons","View fictional game equipment",c=>r(c,"🛠️ FICTIONAL EQUIPMENT\n⚔️ Equipment is used only inside the game."));
C.buyweapon=cmd("buyweapon","Buy fictional game equipment",c=>r(c,"🛒 Fictional equipment purchased."));
C.garage=cmd("garage","View vehicle garage",c=>{let x=u(c.event.senderID);r(c,x.cars.length?x.cars.map((v,i)=>`${i+1}. 🚗 ${v}`).join("\n"):"🚘 Garage empty.")});
C.modcar=cmd("modcar","Modify a game vehicle",c=>r(c,"🔧 Vehicle modifications applied."));
C.smuggle=cmd("smuggle","Fictional smuggling mission",c=>r(c,"📦 Fictional smuggling mission completed."));
C.armory_store=cmd("armory_store","Open fictional armory",c=>r(c,"🛠️ FICTIONAL ARMORY\nEquipment available for game missions."));
C.chop_shop=cmd("chop_shop","Fictional chop-shop mission",c=>r(c,"🚗 Fictional chop-shop mission completed."));
C.blackmarket=cmd("blackmarket","Open fictional black market",c=>r(c,"🕶️ FICTIONAL BLACK MARKET\n🎮 Game items and missions only."));
C.warehouse=cmd("warehouse","View fictional warehouse",c=>r(c,"🏭 Warehouse: Secure\n📦 Storage available."));
C.safehouse=cmd("safehouse","View fictional safehouse",c=>r(c,"🏠 Safehouse secured."));
C.crew_create=cmd("crew_create","Create a fictional crew",c=>{let x=u(c.event.senderID);x.crew=c.args.join(" ")||"New Crew";r(c,`👥 Crew created: ${x.crew}`)});
C.turf_claim=cmd("turf_claim","Claim fictional territory",c=>{let x=u(c.event.senderID);x.turf++;r(c,`🏙️ Turf claimed!\n⭐ Turf: ${x.turf}`)});
C.turf_war=cmd("turf_war","Start fictional turf war",c=>r(c,"⚔️ Fictional turf war started."));
C.rank_respect=cmd("rank_respect","View crime respect",c=>{let x=u(c.event.senderID);r(c,`⭐ Respect: ${x.respect}\n🏙️ Turf: ${x.turf}`)});
C.gang_upgrade=cmd("gang_upgrade","Upgrade fictional gang",c=>r(c,"⬆️ Crew upgraded."));
C.smuggle_sea=cmd("smuggle_sea","Fictional sea mission",c=>r(c,"🌊 Sea mission launched."));
C.smuggle_air=cmd("smuggle_air","Fictional air mission",c=>r(c,"✈️ Air mission launched."));
C.hit_list=cmd("hit_list","View fictional target list",c=>r(c,"📋 FICTIONAL TARGET BOARD\n🎯 Rookie\n🎯 Veteran\n👑 Elite"));
C.money_laund=cmd("money_laund","Fictional laundering mission",c=>r(c,"🌀 Fictional in-game laundering mission completed."));
C.bribe_cop=cmd("bribe_cop","Fictional police encounter",c=>{let x=u(c.event.senderID);x.wanted=Math.max(0,x.wanted-1);r(c,"👮 Fictional police encounter resolved.\n⭐ Wanted -1")});
C.jail_break=cmd("jail_break","Escape fictional game jail",c=>{let x=u(c.event.senderID);x.jail=0;r(c,"🔓 You escaped the fictional game jail!");});
C.infiltrate=cmd("infiltrate","Fictional infiltration mission",c=>r(c,"🕵️ Infiltration mission complete."));
C.snitch=cmd("snitch","Fictional informant mission",c=>r(c,"🗣️ Fictional informant mission completed."));
C.wire_tap=cmd("wire_tap","Fictional surveillance mini-game",c=>r(c,"📡 Fictional surveillance mini-game complete."));
C.informant=cmd("informant","Use a fictional informant",c=>r(c,"🕵️ Informant contacted."));
C.underworld=cmd("underworld","View fictional underworld",c=>r(c,"🌑 UNDERWORLD\n👥 Crews\n💰 Heists\n🏙️ Turf\n🎯 Contracts"));
C.street_race=cmd("street_race","Start fictional street race",c=>r(c,"🏁 Street race started!"));
C.heist_prep=cmd("heist_prep","Prepare fictional heist",c=>r(c,"🧰 Heist preparation complete."));
C.safe_crack=cmd("safe_crack","Play fictional safe-cracking mini-game",c=>r(c,"🔐 Safe-cracking mini-game complete."));
C.syndicate_hq=cmd("syndicate_hq","View fictional syndicate HQ",c=>r(c,"🏢 SYNDICATE HQ\n👥 Crew operations online."));

// ============================================================
// 🚗 VEHICLES
// ============================================================

const V={
 vehicles:"View vehicles",vehicle:"Inspect vehicle",buycar:"Buy a car",sellcar:"Sell a car",
 drive:"Drive vehicle",park:"Park vehicle",repaircar:"Repair vehicle",fuel:"Check fuel",
 refuel:"Refuel vehicle",carwash:"Wash vehicle",car_upgrade:"Upgrade vehicle",engine:"Upgrade engine",
 tires:"Upgrade tires",paint:"Change vehicle paint",license:"View vehicle license",
 vehicle_trade:"Trade vehicle",vehicle_market:"Vehicle market",race:"Race",race_join:"Join race",
 race_create:"Create race",race_lb:"Race leaderboard",motorcycle:"Motorcycles",boat:"Boats",plane:"Planes"
};

for(const[n,d]of Object.entries(V)){
 C[n]=cmd(n,d,c=>{
  const x=u(c.event.senderID);
  if(n==="vehicles")return r(c,x.cars.length?x.cars.map((v,i)=>`${i+1}. 🚗 ${v}`).join("\n"):"🚘 No vehicles.");
  if(n==="buycar"){
   const car=c.args.join(" ")||"Sports Car";
   x.cars.push(car);return r(c,`🚗 Purchased: ${car}`);
  }
  if(n==="sellcar"){
   if(!x.cars.length)return r(c,"❌ No vehicle to sell.");
   const car=x.cars.pop();return r(c,`💰 Sold ${car}.`);
  }
  if(n==="vehicle_market")return r(c,"🚘 VEHICLE MARKET\n🏎️ Sports Car\n🚙 SUV\n🏍️ Motorcycle\n🚤 Boat\n✈️ Plane");
  if(n==="race"||n==="race_join")return r(c,"🏁 Race started! Finish to receive game rewards.");
  if(n==="race_create")return r(c,"🏁 Race lobby created.");
  if(n==="race_lb")return r(c,"🏆 RACE LEADERBOARD\n🥇 Champion\n🥈 Challenger\n🥉 Racer");
  r(c,`🚗 ${d}\n✅ Vehicle action completed.`);
 });
}

// ============================================================
// 📌 EXTRA GTA STATUS
// ============================================================

C.gta_status=cmd("gta_status","View GTA game status",c=>{
 const x=u(c.event.senderID);
 r(c,`🔫 GTA STATUS\n💰 Cash: $${x.cash.toLocaleString()}\n⭐ Wanted: ${x.wanted}/5\n👥 Crew: ${x.crew||"None"}\n🏙️ Turf: ${x.turf}\n⭐ Respect: ${x.respect}`);
});

module.exports=C;
