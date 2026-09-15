// index.js - iKON-BOT 400 CMDS - RENDER READY - FINAL FIXED
// Owner: Aphecks iKon Klerk ID 100086783504073
// Bot: iKON-BOT
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { createCanvas } = require('canvas');
const axios = require('axios');

// --- FIX 1: ws3-fca import robust for Node 20 ---
const fcaRaw = require('ws3-fca');
const login = typeof fcaRaw === 'function'? fcaRaw : (fcaRaw.login || fcaRaw.default);
if(typeof login!== 'function') console.error("FCA still not function! Keys:", Object.keys(fcaRaw));

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req,res)=> res.send(`iKON-BOT 400 cmds Online! Owner Aphecks iKon Klerk ${process.env.OWNER_ID || "100086783504073"} - ${new Date().toISOString()}`));
app.listen(PORT, ()=> console.log(`iKON-BOT Render Port ${PORT} listening!`));

const PREFIX = "!";
const OWNER_ID = process.env.OWNER_ID || "100086783504073";
const GEMINI_KEY = process.env.GEMINI_KEY || "";

// --- FIX 2: APPSTATE robust parse ---
let APPSTATE;
try{
  if(process.env.APPSTATE){
    let raw = process.env.APPSTATE.trim();
    // Remove outer quotes if added by Render
    if((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))){
      raw = raw.slice(1,-1);
    }
    APPSTATE = JSON.parse(raw);
    console.log(`✅ APPSTATE from ENV: ${APPSTATE.length} cookies`);
  } else {
    APPSTATE = JSON.parse(fs.readFileSync('./appstate.json','utf8'));
    console.log(`✅ APPSTATE from file`);
  }
}catch(e){
  console.error("❌ APPSTATE parse failed:", e.message.slice(0,200));
  APPSTATE = [];
}

const DATA_FILE = "./data.json";
let data = fs.existsSync(DATA_FILE)? JSON.parse(fs.readFileSync(DATA_FILE)) : { users:{}, threads:{}, pokemonSpawn:null };
if(!data.users) data.users={}; if(!data.threads) data.threads={};
function save(){ fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2)); }

// ===== ALL LISTS =====
const PETS_LIST = [
  { name:"Shadow Hound", rarity:"Common", price:1000000, power:50, emoji:"🐶", type:"danger" },
  { name:"Blood Wolf", rarity:"Common", price:2000000, power:80, emoji:"🐺", type:"danger" },
  { name:"Venom Bat", rarity:"Uncommon", price:3000000, power:100, emoji:"🦇", type:"danger" },
  { name:"Toxic Spider", rarity:"Uncommon", price:5000000, power:120, emoji:"🕷️", type:"danger" },
  { name:"Death Viper", rarity:"Rare", price:8000000, power:150, emoji:"🐍", type:"danger" },
  { name:"Scorpion King", rarity:"Rare", price:10000000, power:180, emoji:"🦂", type:"danger" },
  { name:"Killer Croc", rarity:"Rare", price:12000000, power:200, emoji:"🐊", type:"danger" },
  { name:"Mega Shark", rarity:"Epic", price:15000000, power:250, emoji:"🦈", type:"danger" },
  { name:"Grizzly Reaper", rarity:"Epic", price:18000000, power:280, emoji:"🐻", type:"danger" },
  { name:"Inferno Lion", rarity:"Epic", price:20000000, power:300, emoji:"🦁", type:"danger" },
  { name:"Frost Tiger", rarity:"Epic", price:22000000, power:320, emoji:"🐯", type:"danger" },
  { name:"Thunder Eagle", rarity:"Legendary", price:25000000, power:350, emoji:"🦅", type:"danger" },
  { name:"Baby Dragon", rarity:"Legendary", price:30000000, power:380, emoji:"🐉", type:"danger" },
  { name:"Killer Dragon", rarity:"Legendary", price:75000000, power:500, emoji:"🐲", type:"danger" },
  { name:"Phoenix Reborn", rarity:"Legendary", price:80000000, power:520, emoji:"🔥", type:"danger" },
  { name:"Demon Lord", rarity:"Mythic", price:100000000, power:600, emoji:"👹", type:"danger" },
  { name:"Oni Destroyer", rarity:"Mythic", price:120000000, power:650, emoji:"👺", type:"danger" },
  { name:"Vampire King", rarity:"Mythic", price:150000000, power:700, emoji:"🧛", type:"danger" },
  { name:"Zombie Titan", rarity:"Mythic", price:180000000, power:750, emoji:"🧟", type:"danger" },
  { name:"Alien Overlord", rarity:"Mythic", price:200000000, power:800, emoji:"👽", type:"danger" },
  { name:"Mecha Beast", rarity:"Mythic", price:250000000, power:850, emoji:"🤖", type:"danger" },
  { name:"T-Rex Alpha", rarity:"Divine", price:300000000, power:900, emoji:"🦖", type:"danger" },
  { name:"Kraken Abyss", rarity:"Divine", price:350000000, power:950, emoji:"🐙", type:"danger" },
  { name:"Leviathan", rarity:"Divine", price:400000000, power:1000, emoji:"🐋", type:"danger" },
  { name:"Dark Unicorn", rarity:"Divine", price:500000000, power:1100, emoji:"🦄", type:"danger" },
  { name:"Manticore", rarity:"Divine", price:600000000, power:1200, emoji:"🦁", type:"danger" },
  { name:"Hydra 7 Head", rarity:"Divine", price:750000000, power:1300, emoji:"🐉", type:"danger" },
  { name:"Balrog Demon", rarity:"Divine", price:900000000, power:1500, emoji:"🔥", type:"danger" },
  { name:"Godzilla King", rarity:"Divine", price:1000000000, power:2000, emoji:"👑", type:"danger" },
  { name:"Void Emperor", rarity:"Divine+", price:2000000000, power:3000, emoji:"🌌", type:"danger" }
];
const WEAPONS_LIST = [
  { name:"AK-47 Fury", price:500000, dmg:100, emoji:"🔫" },
  { name:"RPG Destroyer", price:1000000, dmg:200, emoji:"💣" },
  { name:"Katana Soul", price:2000000, dmg:300, emoji:"🔪" },
  { name:"Excalibur Divine", price:10000000, dmg:500, emoji:"⚔️" },
  { name:"Void Cannon", price:50000000, dmg:1000, emoji:"🌌" },
  { name:"Laser Rifle", price:5000000, dmg:400, emoji:"🔫" },
  { name:"Plasma Sword", price:15000000, dmg:600, emoji:"⚔️" },
  { name:"Thunder Hammer", price:25000000, dmg:750, emoji:"🔨" },
  { name:"Soul Reaper", price:100000000, dmg:1200, emoji:"💀" },
  { name:"Galaxy Blaster", price:500000000, dmg:2500, emoji:"🌌" }
];
const CARS_LIST = [
  { name:"Lambo Huracan", price:50000000, speed:300, emoji:"🏎️" },
  { name:"Bugatti Chiron", price:100000000, speed:400, emoji:"🚗" },
  { name:"Ferrari F1", price:200000000, speed:500, emoji:"🏁" },
  { name:"Tesla Rocket", price:500000000, speed:800, emoji:"🚀" },
  { name:"UFO Speeder", price:1000000000, speed:2000, emoji:"🛸" },
  { name:"GTR Nismo", price:30000000, speed:250, emoji:"🚙" },
  { name:"Koenigsegg", price:800000000, speed:1500, emoji:"🏎️" },
  { name:"Batmobile", price:600000000, speed:1200, emoji:"🦇" },
  { name:"Time Machine", price:2000000000, speed:5000, emoji:"⏰" },
  { name:"Void Racer", price:5000000000, speed:10000, emoji:"🌌" }
];
const SEEDS_LIST = [
  { name:"Carrot Seed", price:1000, profit:5000, emoji:"🥕", time:"1m" },
  { name:"Corn Seed", price:5000, profit:20000, emoji:"🌽", time:"5m" },
  { name:"Dragon Fruit Seed", price:50000, profit:200000, emoji:"🐉", time:"30m" },
  { name:"Money Tree Seed", price:500000, profit:2000000, emoji:"🌳", time:"2h" },
  { name:"Void Berry Seed", price:5000000, profit:50000000, emoji:"🍇", time:"6h" },
  { name:"Golden Apple Seed", price:1000000, profit:10000000, emoji:"🍎", time:"3h" },
  { name:"Crystal Seed", price:10000000, profit:100000000, emoji:"💎", time:"12h" },
  { name:"Galaxy Seed", price:50000000, profit:1000000000, emoji:"🌌", time:"24h" }
];
const CRYPTO_LIST = [
  { name:"Bitcoin", symbol:"BTC", price:50000, emoji:"₿" },
  { name:"Ethereum", symbol:"ETH", price:3000, emoji:"Ξ" },
  { name:"Doge", symbol:"DOGE", price:0.1, emoji:"🐶" },
  { name:"Void Coin", symbol:"VOID", price:1000, emoji:"🌌" },
  { name:"Killer Coin", symbol:"KILL", price:500, emoji:"💀" }
];
const CRATES_LIST = [
  { name:"Economy Crate", price:1000000, emoji:"💰", rewards:"$100k-$5M+Coins" },
  { name:"Pet Crate", price:500000, emoji:"🐾", rewards:"Common to Legendary Pet" },
  { name:"Game Crate", price:250000, emoji:"🎮", rewards:"Game coins+XP" },
  { name:"Utility Crate", price:100000, emoji:"🔧", rewards:"AFK bonus" },
  { name:"AI Crate", price:50000, emoji:"🤖", rewards:"10 free AI" },
  { name:"Admin Crate", price:10000000, emoji:"👑", rewards:"Admin tools" },
  { name:"Owner Crate", price:100000000, emoji:"🔥", rewards:"Everything $50M+Leg pet" },
  { name:"Pokemon Crate", price:2000000, emoji:"⚡", rewards:"Random Pokemon" }
];
const POKEMON_LIST = [
  { name:"Pikachu", rarity:"Rare", worth:5000000, power:200, emoji:"⚡" },
  { name:"Charizard", rarity:"Legendary", worth:50000000, power:600, emoji:"🔥" },
  { name:"Blastoise", rarity:"Epic", worth:20000000, power:400, emoji:"💧" },
  { name:"Venusaur", rarity:"Epic", worth:20000000, power:400, emoji:"🌿" },
  { name:"Gengar", rarity:"Mythic", worth:100000000, power:800, emoji:"👻" },
  { name:"Dragonite", rarity:"Legendary", worth:80000000, power:700, emoji:"🐉" },
  { name:"Mew", rarity:"Divine", worth:300000000, power:1500, emoji:"🌟" },
  { name:"Mewtwo", rarity:"Divine+", worth:500000000, power:2500, emoji:"🌌" },
  { name:"Rayquaza", rarity:"Divine", worth:400000000, power:2000, emoji:"🐲" },
  { name:"Arceus", rarity:"Divine+", worth:1000000000, power:3000, emoji:"👑" },
  { name:"Lucario", rarity:"Legendary", worth:60000000, power:650, emoji:"⚔️" },
  { name:"Garchomp", rarity:"Legendary", worth:70000000, power:700, emoji:"🦈" },
  { name:"Greninja", rarity:"Epic", worth:30000000, power:500, emoji:"🥷" },
  { name:"Eevee", rarity:"Common", worth:1000000, power:100, emoji:"🐶" },
  { name:"Snorlax", rarity:"Rare", worth:10000000, power:300, emoji:"😴" },
  { name:"Gyarados", rarity:"Epic", worth:25000000, power:450, emoji:"🐋" },
  { name:"Alakazam", rarity:"Mythic", worth:120000000, power:900, emoji:"🧠" },
  { name:"Machamp", rarity:"Rare", worth:15000000, power:350, emoji:"💪" },
  { name:"Lugia", rarity:"Divine", worth:350000000, power:1800, emoji:"🌊" },
  { name:"Ho-Oh", rarity:"Divine", worth:350000000, power:1800, emoji:"🔥" }
];

async function genBox(title, userName, stats){
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0,0,800,400);
  ctx.fillStyle = "#fff"; ctx.font = "30px Arial"; ctx.fillText(title, 20, 50);
  ctx.font = "20px Arial"; ctx.fillText(`${userName} - ${stats}`, 20, 100);
  return canvas.toBuffer();
}
function getUser(uid){
  if(!data.users[uid]) data.users[uid]={ cash:5000000, bank:20000000, coins:5, level:1, xp:0, prestige:0, pets:[], weapons:[], cars:[], seeds:[], crypto:{}, crates:{}, warnings:0, banned:false, afk:null, dailyStreak:0, lastDaily:0, missions:{}, workCount:0, missionCount:0, messages:0, lastActive:Date.now(), inventory:{} };
  return data.users[uid];
}
function getThread(tid){
  if(!data.threads[tid]) data.threads[tid]={ welcome:"Welcome {name}! Member {count}!", leave:"Goodbye {name}!", onlyAdmin:false, filters:[], whitelist:[OWNER_ID], blacklist:[], onlyAdminText:"🔒 Only admin!", members:{} };
  return data.threads[tid];
}
function makeBar(cur,max,size=12){ const p=Math.min(cur/max,1); return "█".repeat(Math.round(p*size))+"░".repeat(size-Math.round(p*size))+` ${Math.round(p*100)}% (${cur}/${max})`; }
function addXP(uid, amt){
  const u=getUser(uid); u.xp+=amt; u.messages++;
  let need = u.level*1000; if(u.level>=100) need=u.level*2000; if(u.level>=500) need=u.level*5000;
  if(u.level>=1000 && u.xp>=5000000){ u.prestige++; u.level=1; u.xp=0; u.cash+=100000000*u.prestige; return {prestige:true, lvl:1, pres:u.prestige}; }
  if(u.xp>=need){ u.level++; u.xp=0; u.cash+=50000*u.level; u.coins+=1; if(u.level%10==0) u.pets.push(PETS_LIST[Math.floor(Math.random()*5)]); return {leveled:true, lvl:u.level, cash:50000*u.level}; }
  return {leveled:false};
}
function parseCmd(text){
  if(!text) return null; let t=text.trim(); if(!t.startsWith("!")) return null;
  t=t.slice(1).trim(); if(!t) return null;
  const parts=t.split(/\s+/); return {cmd:parts[0].toLowerCase(), args:parts.slice(1)};
}
async function geminiAQ(q){
  try{
    if(!GEMINI_KEY ||!GEMINI_KEY.startsWith("AQ")) return `⚠️ Set GEMINI_KEY starting AQ! Owner Aphecks iKon Klerk Bot iKON-BOT: You said "${q}"`;
    const res=await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {contents:[{parts:[{text:q}]}]});
    return res.data.candidates[0].content.parts[0].text;
  }catch(e){ return `🤖 iKON-BOT AQ: ${q} - I'm 400 cmds bot by Aphecks iKon Klerk! Type!menu`; }
}

// --- FIX 3: Commands loader checks BOTH folders ---
let commands={};
const possibleFolders = ["commands", "cmds"];
const files=["economy.js","pets.js","games.js","info.js","utility.js","ai_media.js","admin.js","owner.js"];
let loadedCount = 0;
for(let folder of possibleFolders){
  for(let f of files){
    const fp=path.join(__dirname, folder, f);
    if(fs.existsSync(fp)){
      try{
        delete require.cache[require.resolve(fp)];
        const mod=require(fp);
        for(let k in mod){ commands[k.toLowerCase()]=mod[k]; loadedCount++; }
      }catch(e){ console.log(`Error loading ${fp}:`, e.message); }
    }
  }
}
console.log(`Loaded ${Object.keys(commands).length} cmds (${loadedCount} exports) - Pets ${PETS_LIST.length}, Weapons ${WEAPONS_LIST.length}, Cars ${CARS_LIST.length}, Pokemon ${POKEMON_LIST.length}`);

let currentPokemon=null;
function spawnPokemon(api){
  const poke=POKEMON_LIST[Math.floor(Math.random()*POKEMON_LIST.length)];
  currentPokemon={...poke, spawnedAt:Date.now()};
  for(let tid in data.threads){
    try{ api.sendMessage(`🐾 WILD ${poke.emoji} ${poke.name} Spawned! Worth $${poke.worth.toLocaleString()} Type!catch`, tid); }catch{}
  }
}
function neverSleep(api){
  setInterval(()=>{ save(); for(let tid in data.threads) try{ api.markAsRead(tid,true); }catch{} },30000);
  setInterval(()=> spawnPokemon(api), 20*60*1000);
  console.log("iKON-BOT Never Sleep ON - Auto Seen 30s - Pokemon 20min");
}

console.log("Attempting iKON-BOT login...");
login({appState: APPSTATE}, (err,api)=>{
  if(err) return console.error("Login error:", err);
  api.setOptions({listenEvents:true, selfListen:false});
  neverSleep(api);
  console.log("🔥 iKON-BOT ONLINE 400 CMDS - Owner Aphecks iKon Klerk 🔥");

  api.listenMqtt(async (err,event)=>{
    if(err) return;
    try{
      const tid=event.threadID, uid=event.senderID;
      if(!tid||!uid) return;
      const thread=getThread(tid), user=getUser(uid);
      if(event.type=="message" && event.messageID){
        const emojis=["🔥","❤️","😂","😮","👍","🎉","💯","⚡","🌌","👑"];
        try{ api.setMessageReaction(emojis[Math.floor(Math.random()*emojis.length)], event.messageID, ()=>{}, true); }catch{}
      }
      if(event.type=="message" && event.body){
        const parsed=parseCmd(event.body);
        if(parsed && commands[parsed.cmd]){
          if(user.banned && uid!=OWNER_ID) return api.sendMessage(`🚫 Banned! Contact Owner Aphecks iKon Klerk ${OWNER_ID}`,tid);
          if(thread.onlyAdmin &&!thread.whitelist.includes(uid) && uid!=OWNER_ID) return api.sendMessage(thread.onlyAdminText,tid);
          await commands[parsed.cmd]({ api, event, args:parsed.args, user, thread, data, uid, tid, OWNER_ID, makeBar, addXP, getUser, genBox, PETS_LIST, WEAPONS_LIST, CARS_LIST, SEEDS_LIST, CRYPTO_LIST, CRATES_LIST, POKEMON_LIST, currentPokemon, save, geminiAQ });
        }else if(!parsed){
          if(event.body.length>1){
            const aq=await geminiAQ(event.body);
            api.sendMessage(`╭─〔 🤖 iKON-BOT AQ - LVL ${user.level} ${makeBar(user.xp, user.level*1000,8)} 〕─╮\n👤 ${uid}: ${event.body}\n🤖 AQ: ${aq}\n💰 $${user.cash.toLocaleString()} Bank $${user.bank.toLocaleString()}\n📊 Level ${user.level}/1000 Prestige ${user.prestige}\n👑 Owner Aphecks iKon Klerk |!menu 400 cmds\n╰──────────────────╯`, tid);
          }
        }
      }
    }catch(e){ console.error("Listen error:", e.message); }
  });
});
