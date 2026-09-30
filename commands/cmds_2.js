// commands/cmds_2.js
// 🛒 MARKETVERSE — iKON-BOT
module.exports = ({api,event,user,reply,users,profile,fun}) => {
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=5)=>{u.xp=(u.xp||0)+n;};
const ensure=u=>{u.inventory=u.inventory||{};u.stash=u.stash||{};u.market=u.market||{};};
const add=(u,id,n=1)=>{ensure(u);u.inventory[id]=(u.inventory[id]||0)+n;};
const rem=(u,id,n=1)=>{ensure(u);if((u.inventory[id]||0)<n)return false;u.inventory[id]-=n;if(u.inventory[id]<=0)delete u.inventory[id];return true;};
const fmt=n=>Number(n||0).toLocaleString();
const ITEMS={
apple:{name:"Apple",price:120,type:"food",rarity:"Common",use:u=>{u.health=Math.min(u.maxHealth||100,(u.health||100)+3);}},
bread:{name:"Bread",price:250,type:"food",rarity:"Common",use:u=>{u.health=Math.min(u.maxHealth||100,(u.health||100)+6);}},
fish:{name:"Fish",price:500,type:"food",rarity:"Common",use:u=>{u.health=Math.min(u.maxHealth||100,(u.health||100)+10);}},
iron:{name:"Iron Ore",price:800,type:"material",rarity:"Common"},
coal:{name:"Coal",price:500,type:"material",rarity:"Common"},
gold:{name:"Gold Ore",price:3500,type:"material",rarity:"Rare"},
diamond:{name:"Diamond",price:12000,type:"material",rarity:"Epic"},
emerald:{name:"Emerald",price:9000,type:"material",rarity:"Epic"},
ruby:{name:"Ruby",price:10000,type:"material",rarity:"Epic"},
sapphire:{name:"Sapphire",price:8500,type:"material",rarity:"Rare"},
healing_potion:{name:"Healing Potion",price:3000,type:"consumable",rarity:"Rare",use:u=>{u.health=Math.min(u.maxHealth||100,(u.health||100)+35);}},
energy_potion:{name:"Energy Potion",price:2500,type:"consumable",rarity:"Rare",use:u=>{u.energy=Math.min(u.maxEnergy||100,(u.energy||100)+40);}},
xp_scroll:{name:"XP Scroll",price:5000,type:"consumable",rarity:"Epic",use:u=>xp(u,100)},
iron_sword:{name:"Iron Sword",price:15000,type:"weapon",rarity:"Rare"},
steel_armor:{name:"Steel Armor",price:25000,type:"armor",rarity:"Epic"},
lucky_coin:{name:"Lucky Coin",price:50000,type:"special",rarity:"Legendary"},
dragon_core:{name:"Dragon Core",price:250000,type:"material",rarity:"Mythic"},
divine_shard:{name:"Divine Shard",price:1000000,type:"material",rarity:"Divine"}
};
const find=q=>{q=String(q||"").toLowerCase().replace(/[_-]/g," ");let k=Object.keys(ITEMS).find(x=>x===q.replace(/ /g,"_"));if(k)return k;return Object.keys(ITEMS).find(x=>ITEMS[x].name.toLowerCase()===q)||Object.keys(ITEMS).find(x=>x.includes(q.replace(/ /g,"_")))};
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const cmds=[
{name:"shop",aliases:["store"],description:"View the marketplace",cooldown:2,run:async()=>{let s=Object.entries(ITEMS).map(([k,v])=>`• ${v.name} — $${fmt(v.price)} [${v.rarity}]`).join("\n");return replyx(`🛒 MARKETVERSE\n━━━━━━━━━━━━\n${s}`)}},
{name:"buy",aliases:["purchase"],description:"Buy an item",run:async({args})=>{ensure(user);let n=Number(args.at(-1))||1,q=args.slice(0,-1).join(" ")||args.join(" ");if(!Number.isFinite(n)||n<1){n=1;q=args.join(" ")}let id=find(q);if(!id)return replyx("❌ Item not found.");let cost=ITEMS[id].price*n;if(money(user)<cost)return replyx(`💸 Need $${fmt(cost)}.`);setMoney(user,money(user)-cost);add(user,id,n);xp(user,5);replyx(`✅ Bought ${n}x ${ITEMS[id].name} for $${fmt(cost)}.`)}},
{name:"sell",aliases:["sellitem"],description:"Sell an item",run:async({args})=>{ensure(user);let n=Number(args.at(-1))||1,q=args.slice(0,-1).join(" ")||args.join(" ");let id=find(q);if(!id)return replyx("❌ Item not found.");if(!rem(user,id,n))return replyx("❌ You don't have enough.");let gain=Math.floor(ITEMS[id].price*n*.65);setMoney(user,money(user)+gain);xp(user,3);replyx(`💰 Sold ${n}x ${ITEMS[id].name} for $${fmt(gain)}.`)}},
{name:"inventory",aliases:["inv","bag"],description:"View inventory",run:async()=>{ensure(user);let a=Object.entries(user.inventory);if(!a.length)return replyx("🎒 Your inventory is empty.");replyx(`🎒 INVENTORY\n━━━━━━━━━━━━\n${a.map(([k,n])=>`• ${ITEMS[k]?.name||k} ×${n}`).join("\n")}`)}},
{name:"use",aliases:["consume"],description:"Use an item",run:async({args})=>{ensure(user);let id=find(args.join(" "));if(!id||!ITEMS[id])return replyx("❌ Item not found.");if(!rem(user,id,1))return replyx("❌ You don't have that item.");if(typeof ITEMS[id].use==="function")ITEMS[id].use(user);else return replyx("⚠️ That item cannot be used yet.");xp(user,5);replyx(`✨ Used ${ITEMS[id].name}.`) }},
{name:"trade",aliases:["swap"],description:"Trade items or money",run:async({args})=>{let target=event.mentions&&Object.keys(event.mentions)[0];if(!target)return replyx("🤝 Tag the person you want to trade with.");let other=users.get(target);if(!other)return replyx("❌ User not found.");let amount=Number(args[0])||0;if(amount<=0||money(user)<amount)return replyx("❌ Invalid trade amount.");setMoney(user,money(user)-amount);setMoney(other,money(other)+amount);replyx(`🤝 Trade complete: $${fmt(amount)} sent.`)}},
{name:"market",aliases:["marketplace"],description:"View market prices",run:async()=>replyx(`📈 MARKET\n━━━━━━━━━━━━\n${Object.entries(ITEMS).map(([k,v])=>`${v.name}: $${fmt(v.price)}`).join("\n")}`)},
{name:"auction",aliases:["auctions"],description:"View auction house",run:async()=>{user.auctions=user.auctions||[];if(!user.auctions.length)return replyx("🔨 Auction House is empty.");replyx(`🔨 AUCTIONS\n${user.auctions.map((x,i)=>`${i+1}. ${x.name} — $${fmt(x.price)}`).join("\n")}`)}},
{name:"items",aliases:["itemlist"],description:"List all items",run:async()=>replyx(`📦 ITEMS\n${Object.values(ITEMS).map(x=>`${x.name} • ${x.rarity}`).join("\n")}`)},
{name:"prices",aliases:["price"],description:"Check prices",run:async({args})=>{let id=find(args.join(" "));if(!id)return replyx("❌ Item not found.");let x=ITEMS[id];replyx(`💵 ${x.name}\nBuy: $${fmt(x.price)}\nSell: $${fmt(x.price*.65)}`)}},
{name:"iteminfo",aliases:["infoitem"],description:"Detailed item information",run:async({args})=>{let id=find(args.join(" "));if(!id)return replyx("❌ Item not found.");let x=ITEMS[id];replyx(`📦 ${x.name}\nRarity: ${x.rarity}\nType: ${x.type}\nValue: $${fmt(x.price)}`)}},
{name:"materials",aliases:["mats"],description:"Show materials",run:async()=>replyx(`⛏️ MATERIALS\n${Object.values(ITEMS).filter(x=>x.type==="material").map(x=>`${x.name} — $${fmt(x.price)}`).join("\n")}`)},
{name:"storage",aliases:["warehouse"],description:"View stored items",run:async()=>{ensure(user);let a=Object.entries(user.stash);replyx(a.length?`🏭 STORAGE\n${a.map(([k,n])=>`${ITEMS[k]?.name||k} ×${n}`).join("\n")}`:"🏭 Storage is empty.")}},
{name:"stash",aliases:["storeitem"],description:"Move item into storage",run:async({args})=>{ensure(user);let id=find(args.join(" "));if(!id||!rem(user,id,1))return replyx("❌ You don't have that item.");user.stash[id]=(user.stash[id]||0)+1;replyx(`📦 ${ITEMS[id].name} stored.`)}},
{name:"gift",aliases:["giftitem"],description:"Gift an item",run:async({args})=>{let target=event.mentions&&Object.keys(event.mentions)[0];if(!target)return replyx("🎁 Tag someone.");let id=find(args.filter(x=>!x.startsWith("@")).join(" "));if(!id||!rem(user,id,1))return replyx("❌ Item unavailable.");let other=users.get(target);if(!other)return replyx("❌ User not found.");ensure(other);add(other,id,1);replyx(`🎁 Gifted ${ITEMS[id].name}.`)}},
{name:"give",aliases:["giveitem"],description:"Give money to another user",run:async({args})=>{let target=event.mentions&&Object.keys(event.mentions)[0],amount=Number(args.at(-1));if(!target||!amount||amount<=0)return replyx("Usage: !give @user <amount>");let other=users.get(target);if(!other||money(user)<amount)return replyx("❌ Invalid user or insufficient funds.");setMoney(user,money(user)-amount);setMoney(other,money(other)+amount);replyx(`💸 Sent $${fmt(amount)}.`)}},
{name:"exchange",aliases:["convert"],description:"Exchange materials",run:async({args})=>{let a=find(args[0]),b=find(args.slice(1).join(" "));if(!a||!b||ITEMS[a].type!=="material"||ITEMS[b].type!=="material")return replyx("Usage: !exchange <material> <material>");if(!rem(user,a,1))return replyx("❌ Missing source material.");add(user,b,Math.max(1,Math.floor(ITEMS[a].price/ITEMS[b].price)));replyx(`🔄 Exchanged ${ITEMS[a].name} → ${ITEMS[b].name}.`)}},
{name:"bundle",aliases:["bundles"],description:"View item bundles",run:async()=>replyx("📦 BUNDLES\n• Starter Bundle — Apple + Bread + Iron\n• Warrior Bundle — Sword + Armor\n• Rare Bundle — Gold + Sapphire + Ruby")},
{name:"restock",aliases:["restockshop"],description:"Refresh market stock",permission:"admin",run:async()=>replyx("🔄 Market stock refreshed.")},
{name:"rarity",aliases:["rarities"],description:"Show rarity tiers",run:async()=>replyx("🌈 RARITY\nCommon → Uncommon → Rare → Epic → Legendary → Mythic → Divine")},
{name:"blueprint",aliases:["blueprints"],description:"View crafting blueprints",run:async()=>replyx("📜 BLUEPRINTS\n• Iron Sword: 5 Iron + 1 Coal\n• Steel Armor: 10 Iron + 5 Coal\n• Healing Potion: 2 Fish + 1 Ruby")},
{name:"salvage",aliases:["dismantle"],description:"Salvage equipment",run:async({args})=>{let id=find(args.join(" "));if(!id||!rem(user,id,1))return replyx("❌ Equipment not found.");let gain=Math.max(1,Math.floor(ITEMS[id].price*.15));setMoney(user,money(user)+gain);replyx(`♻️ Salvaged ${ITEMS[id].name} for $${fmt(gain)}.`)}},
{name:"craft",aliases:["make"],description:"Craft an item",run:async({args})=>{let q=args.join(" ").toLowerCase();if(q.includes("iron sword")){if(!rem(user,"iron",5)||!rem(user,"coal",1)){if((user.inventory?.iron||0)<5||(user.inventory?.coal||0)<1)return replyx("❌ Need 5 Iron + 1 Coal.");}add(user,"iron_sword");return replyx("⚔️ Crafted Iron Sword.")}if(q.includes("steel armor")){if((user.inventory?.iron||0)<10||(user.inventory?.coal||0)<5)return replyx("❌ Need 10 Iron + 5 Coal.");rem(user,"iron",10);rem(user,"coal",5);add(user,"steel_armor");return replyx("🛡️ Crafted Steel Armor.")}replyx("📜 Blueprint not found.")}},
{name:"collection",aliases:["collectionbook"],description:"View collection",run:async()=>{ensure(user);let owned=Object.keys(user.inventory).length;replyx(`📚 COLLECTION\nItems discovered: ${owned}/${Object.keys(ITEMS).length}`)}},
{name:"stashinfo",aliases:["storageinfo"],description:"Storage information",run:async()=>{ensure(user);let count=Object.values(user.stash).reduce((a,b)=>a+b,0);replyx(`🏭 STORAGE\nStored items: ${count}`)}},
{name:"sellall",aliases:["sellinventory"],description:"Sell all sellable items",run:async()=>{ensure(user);let total=0,count=0;for(let [id,n] of Object.entries(user.inventory)){if(!ITEMS[id])continue;let gain=Math.floor(ITEMS[id].price*n*.65);total+=gain;count+=n;delete user.inventory[id]}setMoney(user,money(user)+total);replyx(`💰 Sold ${count} items for $${fmt(total)}.`)}},
{name:"marketvalue",aliases:["invvalue"],description:"Calculate inventory value",run:async()=>{ensure(user);let total=Object.entries(user.inventory).reduce((s,[id,n])=>s+(ITEMS[id]?.price||0)*n,0);replyx(`📊 Inventory market value: $${fmt(total)}`)}},
{name:"restockinfo",aliases:["stockinfo"],description:"Show restock information",run:async()=>replyx("📦 Market stock updates periodically. Rare items have lower availability.")},
{name:"marketquest",aliases:["tradequest"],description:"Complete a market quest",run:async()=>{user.marketQuest=user.marketQuest||0;user.marketQuest++;let reward=5000+user.marketQuest*500;setMoney(user,money(user)+reward);xp(user,20);replyx(`🛒 Market Quest complete!\n💰 +$${fmt(reward)}\n⭐ +20 XP`)}},
{name:"itemdrop",aliases:["drop"],description:"Claim a random item drop",run:async()=>{let ids=Object.keys(ITEMS),id=ids[Math.floor(Math.random()*ids.length)];add(user,id,1);replyx(`🎁 DROP!\nYou received ${ITEMS[id].name}.`)}},
{name:"itemsearch",aliases:["finditem"],description:"Search items",run:async({args})=>{let q=args.join(" ").toLowerCase();let r=Object.values(ITEMS).filter(x=>x.name.toLowerCase().includes(q));replyx(r.length?`🔎 RESULTS\n${r.map(x=>`${x.name} — ${x.rarity}`).join("\n")}`:"❌ No matching items.")}},
{name:"itemcount",aliases:["countitems"],description:"Count inventory items",run:async()=>{ensure(user);let n=Object.values(user.inventory).reduce((a,b)=>a+b,0);replyx(`🎒 Total items: ${n}`)}},
{name:"materialvalue",aliases:["matvalue"],description:"Calculate material value",run:async()=>{ensure(user);let total=Object.entries(user.inventory).reduce((s,[id,n])=>s+(ITEMS[id]?.type==="material"?ITEMS[id].price*n:0),0);replyx(`⛏️ Material value: $${fmt(total)}`)}},
{name:"markethelp",aliases:["marketcommands"],description:"Market command help",run:async()=>replyx("🛒 MARKETVERSE\n!shop • !buy • !sell • !inventory • !use • !trade • !market • !gift • !craft • !salvage • !stash • !sellall")}
];
return cmds;
};
