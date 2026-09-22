// iKON-BOT - Owner: Aphecks iKon Klerk - ENV VERSION - FINAL
const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const login = require('ws3-fca');

// ===== 0. LOAD ENV FROM RENDER =====
const APPSTATE_RAW = process.env.APPSTATE; // JSON string from Render ENV
const GEMINI_KEY = process.env.GEMINI_KEY; // Gemini key from Render ENV
const PORT = process.env.PORT || 10000; // Render port from Render ENV
const ADMIN_UIDS = (process.env.ADMIN_UIDS || "").split(',').map(x=>x.trim()).filter(Boolean); // Admin UIDs from Render ENV

if(!APPSTATE_RAW) console.error("[ENV ERR] APPSTATE missing in Render ENV!");
if(!GEMINI_KEY) console.error("[ENV ERR] GEMINI_KEY missing in Render ENV!");
console.log(`[ENV] Admins: ${ADMIN_UIDS.length} loaded | Port: ${PORT} | Gemini: ${GEMINI_KEY? 'OK' : 'MISSING'}`);

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ===== 1. NEVER SLEEP + LOGS =====
const app = express();
app.get('/', (req,res) => res.send(`iKON-BOT ALIVE - Owner Aphecks iKon Klerk - ${new Date().toISOString()} - ${ADMIN_UIDS.length} admins`));
app.get('/logs', (req,res) => { try{ res.type('json').send(fs.readFileSync('./database/logs.json','utf8')); } catch{ res.send('No logs yet'); } });
app.get('/env-check', (req,res) => { res.json({ appstate:!!APPSTATE_RAW, gemini:!!GEMINI_KEY, port: PORT, admins: ADMIN_UIDS.length, admin_list: ADMIN_UIDS }); });
app.listen(PORT, () => console.log(`[iKON-BOT] Web server on ${PORT} - ENV MODE`));
setInterval(()=>{ const url=`https://${process.env.RENDER_EXTERNAL_HOSTNAME}`; if(process.env.RENDER_EXTERNAL_HOSTNAME) axios.get(url).catch(()=>{}); }, 3*60*1000);

// ===== 2. 8 CATEGORIES =====
const CATEGORIES = [
  { name:"PETS_TAMING", folder:"01_pets_taming", emoji:"🐉" },
  { name:"ECONOMY_EMPIRE", folder:"02_economy_empire", emoji:"💎" },
  { name:"ACTION_CRIME", folder:"03_action_crime", emoji:"🔫" },
  { name:"GARAGE_CASINO", folder:"04_garage_casino", emoji:"🏎️" },
  { name:"WORLD_RAID", folder:"05_world_raid", emoji:"🌪️" },
  { name:"SOCIAL_CLAN", folder:"06_social_clan", emoji:"💋" },
  { name:"ADMIN_GOD", folder:"07_admin_god", emoji:"👑" },
  { name:"AI_ESTATE", folder:"08_ai_estate", emoji:"🤖" }
];

// ===== 3. DATABASE - RENDER DISK PERSIST =====
fs.ensureDirSync('./database');
const DB_FILES={ economy:'./database/economy.json', pets:'./database/pets.json', users:'./database/users.json', cooldowns:'./database/cooldowns.json', logs:'./database/logs.json', spawns:'./database/spawns.json', battles:'./database/battles.json' };
for(const f of Object.values(DB_FILES)) if(!fs.existsSync(f)) fs.writeJsonSync(f,{});
let DATABASE={}; for(const [k,f] of Object.entries(DB_FILES)) DATABASE[k]=fs.readJsonSync(f);
function getUserData(uid){ if(!DATABASE.economy[uid]) DATABASE.economy[uid]={bank:500,wallet:500,savings:0,gold:50,coins:100,xp:0,level:1,prestige:0}; if(!DATABASE.users[uid]) DATABASE.users[uid]={name:"",level:1,xp:0,title:"Newbie",pets:[],weapons:[],cars:[],isAdmin:ADMIN_UIDS.includes(uid)}; DATABASE.users[uid].isAdmin=ADMIN_UIDS.includes(uid); return DATABASE.economy[uid]; }
setInterval(()=>{ for(const [k,f] of Object.entries(DB_FILES)) fs.writeJsonSync(f, DATABASE[k]); }, 3000);
process.on('SIGTERM', ()=>{ for(const [k,f] of Object.entries(DB_FILES)) fs.writeJsonSync(f, DATABASE[k]); process.exit(); });

// ===== 4. LOAD LISTS FROM CATEGORIES =====
let ALL_LISTS={};
for(const cat of CATEGORIES){
  try{
    const lp=path.join(__dirname,'commands',cat.folder,'lists.js');
    if(fs.existsSync(lp)){ ALL_LISTS[cat.name]=require(lp); console.log(`[LISTS] ${cat.name} OK`); }
  } catch(e){ console.log(`[LISTS ERR] ${cat.name}: ${e.message}`); }
}

// ===== 5. SPAM + ADMIN CHECK =====
const SPAM=new Map();
function checkSpam(uid){ const now=Date.now(); if(!SPAM.has(uid)) SPAM.set(uid,{count:1,last:now,blockedUntil:0}); else { const d=SPAM.get(uid); if(now<d.blockedUntil) return `🚫 Spam Block ${(d.blockedUntil-now)/1000|0}s`; if(now-d.last<1500) d.count++; else d.count=1; d.last=now; if(d.count>6){ d.blockedUntil=now+15000; d.count=0; return "🚫 15s spam block!"; } if(d.count>4) return "⚠️ Slow down!"; } return null; }
function isAdmin(uid){ return ADMIN_UIDS.includes(uid); }

// ===== 6. GEMINI - ENV KEY =====
async function askGemini(prompt){
  if(!GEMINI_KEY) return "🤖 GEMINI_KEY missing in Render ENV!";
  try{ const r=await axios.post(GEMINI_URL, {contents:[{parts:[{text: prompt}]}]}); return r.data.candidates[0].content.parts[0].text; } catch(e){ console.log(`[GEMINI ERR] ${e.response?.data?.error?.message || e.message}`); return "🤖 Gemini busy, try later!"; }
}

// ===== 7. CANVAS + FB PIC + UID =====
async function genCanvas(fbPicUrl, eco, name, uid){
  const c=createCanvas(1080,520); const ctx=c.getContext('2d');
  ctx.fillStyle='#0A0A0A'; ctx.fillRect(0,0,1080,520); ctx.strokeStyle='#FFD700'; ctx.lineWidth=5; ctx.strokeRect(0,0,1080,520);
  try{ const img=await loadImage(fbPicUrl); ctx.save(); ctx.beginPath(); ctx.arc(140,140,90,0,Math.PI*2); ctx.clip(); ctx.drawImage(img,50,50,180,180); ctx.restore(); ctx.strokeStyle=eco?.bank>100000?'#FFD700':'#00FFAA'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(140,140,94,0,Math.PI*2); ctx.stroke(); } catch{}
  ctx.fillStyle='#FFF'; ctx.font='bold 36px Arial'; ctx.fillText(name.substring(0,22), 280, 80);
  ctx.fillStyle=isAdmin(uid)?'#FFD700':'#AAA'; ctx.font='bold 20px Arial'; ctx.fillText(`UID: ${uid} ${isAdmin(uid)?'👑 ADMIN':''}`, 280, 112);
  ctx.fillStyle='#FFD700'; ctx.font='24px Arial'; ctx.fillText(`LVL ${eco.level||1} | XP ${eco.xp||0} | PRESTIGE ${eco.prestige||0}`, 280, 145);
  const xpPerc=Math.min(100,(eco.xp%1000)/10); ctx.fillStyle='#333'; ctx.fillRect(280,160,600,24); ctx.fillStyle='#00FFAA'; ctx.fillRect(280,160,600*xpPerc/100,24);
  ctx.fillStyle='#FFF'; ctx.font='bold 28px Arial'; ctx.fillText(`💵 $${eco.bank} BANK | 💰 $${eco.wallet} WALLET`, 280, 230); ctx.fillText(`🪙 ${eco.gold} GOLD | 💎 ${eco.coins} COINS`, 280, 270);
  ctx.fillStyle='#888'; ctx.font='18px Arial'; ctx.fillText(`iKON-BOT by Aphecks iKon Klerk | ${new Date().toLocaleTimeString()}`, 280, 320);
  return c.toBuffer();
}

// ===== 8. TURN FIGHT =====
function petBattleTurn(attacker, defender, skill){
  let dmg=Math.floor((attacker.atk*(skill.dmg/100)) - (defender.hp*0.05)); dmg=Math.max(15,dmg);
  defender.currentHp=(defender.currentHp||defender.hp)-dmg;
  let log=[`🔥 ${attacker.name} uses ${skill.name}! -${dmg}`]; if(skill.effect) log.push(`💫 ${skill.effect}`);
  if(defender.currentHp<=0) return { finished:true, winner:attacker, log:[...log,`💀 ${defender.name} dead!`] };
  log.push(`❤️ ${defender.name} ${defender.currentHp}/${defender.hp}`); return { finished:false, log, dmg };
}

// ===== 9. LOAD 585 CMDS =====
let COMMANDS=new Map(), ALIASES=new Map();
for(const cat of CATEGORIES){
  const fp=path.join(__dirname,'commands',cat.folder); fs.ensureDirSync(fp);
  for(const f of fs.readdirSync(fp).filter(x=>x.endsWith('.js') && x!=='lists.js')){
    try{ const cmd=require(path.join(fp,f)); COMMANDS.set(cmd.name,{...cmd, category:cat.name}); if(cmd.aliases) for(const a of cmd.aliases) ALIASES.set(a,cmd.name); } catch(e){ console.log(`[CMD ERR] ${f}: ${e.message}`); }
  }
}
console.log(`[iKON-BOT] ${COMMANDS.size} CMDS LOADED - ENV MODE`);

// ===== 10. AUTO REACTS + SPAWN 20MIN + 10 GCs =====
let activeGCs=new Set();
const AUTO_REACTS=[ {t:["lol","haha","lmao"], e:"😂", r:(n)=>`😂 ${n} lol - iKON-BOT laughing`}, {t:["hello","hi","hey"], e:"👋", r:(n)=>`👋 Yo ${n}! Type.menu - 585 cmds`}, {t:["bank","money"], e:"💰", r:(n)=>`💰 ${n} flexing?.bank`} ];
async function pokemonSpawn(api){
  if(activeGCs.size===0) return; const petsList=ALL_LISTS["PETS_TAMING"]?.pets; if(!petsList) return;
  const pet=petsList[Math.floor(Math.random()*petsList.length)];
  const msg=`🎉✨ WILD PET SPAWN! ✨🎉\n\n🐉 ${pet.name}\n💎 ${pet.rarity} | 🔥 ${pet.skill}\n⚔️ ${pet.atk} ATK | ❤️ ${pet.hp} HP\n\nType.claim to catch! 2 min only!\nGCs: ${activeGCs.size}/10`;
  for(const tid of activeGCs){ try{ api.sendMessage({body:msg}, tid); console.log(`[SPAWN] ${pet.name} -> ${tid}`); } catch{} }
}

// ===== 11. PARSE APPSTATE FROM ENV =====
let appState;
try{
  // Render ENV APPSTATE is JSON stringified array
  appState = typeof APPSTATE_RAW === 'string'? JSON.parse(APPSTATE_RAW) : APPSTATE_RAW;
  if(typeof appState === 'string') appState = JSON.parse(appState); // double parse if needed
  console.log(`[APPSTATE] Loaded ${appState.length} cookies from ENV`);
} catch(e){
  console.error(`[APPSTATE ERR] Failed to parse APPSTATE from ENV: ${e.message}`);
  console.error(`Make sure APPSTATE in Render ENV is valid JSON string!`);
  process.exit(1);
}

// ===== 12. LOGIN =====
login({appState}, (err, api) => {
  if(err){ console.error(`[LOGIN ERR] ${err}`); return; }
  console.log(`[iKON-BOT] ONLINE | Owner: Aphecks iKon Klerk | Admins: ${ADMIN_UIDS.join(',')} | Port: ${PORT} | 10 GCs ready | ENV MODE`);

  setInterval(()=> pokemonSpawn(api), 20*60*1000); setTimeout(()=> pokemonSpawn(api), 15000);

  api.listenMqtt(async (err, event) => {
    try{
      if(!event || event.type!=='message') return;
      const senderID=event.senderID, threadID=event.threadID, messageID=event.messageID, body=event.body||'';
      activeGCs.add(threadID); if(activeGCs.size>10) activeGCs.delete([...activeGCs][0]);
      const eco=getUserData(senderID); const user=DATABASE.users[senderID];
      const logEntry=`[${new Date().toLocaleString()}] UID:${senderID} ${isAdmin(senderID)?'👑ADMIN':''} | GC:${threadID} | MSG:${body.substring(0,100)} | BANK:$${eco.bank}`;
      console.log(logEntry); DATABASE.logs[Date.now()]=logEntry; if(Object.keys(DATABASE.logs).length>500) delete DATABASE.logs[Object.keys(DATABASE.logs)[0]];

      const spam=checkSpam(senderID); if(spam && typeof spam === 'string' && spam.includes('Block')) return api.sendMessage({body:spam}, threadID, messageID);

      let fbName="Commander", fbPic="https://i.imgur.com/5sQbG3q.png";
      try{ const info=await api.getUserInfo(senderID); fbName=info[senderID].name; fbPic=info[senderID].thumbSrc; user.name=fbName; } catch{}

      // AUTO REACTS - NO PREFIX
      if(!body.startsWith('.')){
        for(const a of AUTO_REACTS){ if(a.t.some(x=>body.toLowerCase().includes(x))){ api.setMessageReaction(a.e, messageID, ()=>{}, true); const buf=await genCanvas(fbPic, eco, fbName, senderID); return api.sendMessage({body:a.r(fbName), attachment:buf?[buf]:[]}, threadID, messageID); } }
        if(Math.random()<0.3){ const buf=await genCanvas(fbPic, eco, fbName, senderID); const ai=body.length>10? await askGemini(`You are iKON-BOT by Aphecks iKon Klerk, funny short reply to: ${body}`) : `👑 iKON-BOT by Aphecks iKon Klerk says hi ${fbName}!`; return api.sendMessage({body:ai, attachment:buf?[buf]:[]}, threadID, messageID); }
        return;
      }

      // COMMANDS
      const args=body.slice(1).trim().split(/ +/); let cmdName=args.shift().toLowerCase(); if(ALIASES.has(cmdName)) cmdName=ALIASES.get(cmdName);
      const cmd=COMMANDS.get(cmdName); if(!cmd){ const buf=await genCanvas(fbPic, eco, fbName, senderID); return api.sendMessage({body:`❌ Unknown.${cmdName} |.menu for 585 cmds | Admins: ${ADMIN_UIDS.length}`, attachment:buf?[buf]:[]}, threadID, messageID); }

      // ADMIN PERM CHECK
      if(cmd.permission==='admin' &&!isAdmin(senderID)){ return api.sendMessage({body:`🚫 Admin only! You: ${senderID} | Admins: ${ADMIN_UIDS.join(',')}`}, threadID, messageID); }

      const now=Date.now(), cdKey=`${senderID}_${cmd.name}`; if(DATABASE.cooldowns[cdKey] && now<DATABASE.cooldowns[cdKey]) return api.sendMessage({body:`⏳ Wait ${((DATABASE.cooldowns[cdKey]-now)/1000).toFixed(1)}s for.${cmd.name}`}, threadID, messageID);
      DATABASE.cooldowns[cdKey]=now + (cmd.cooldown*1000||3000);

      try{
        const buf=await genCanvas(fbPic, eco, fbName, senderID);
        const result=await cmd.execute({ api, event, args, eco, user, DATABASE, ALL_LISTS, fbName, fbPic, uid:senderID, isAdmin:isAdmin(senderID), ADMIN_UIDS, askGemini, genCanvas, petBattleTurn });
        api.sendMessage({body:`${result}\n\nUID:${senderID} ${isAdmin(senderID)?'👑':''} | GC:${threadID}`, attachment:buf?[buf]:[]}, threadID, messageID);
      } catch(e){ console.log(`[CMD ERR] ${e.stack}`); api.sendMessage({body:`❌ ${e.message}`}, threadID, messageID); }
    } catch(e){ console.log(`[LISTENER ERR] ${e.stack}`); }
  });
});
