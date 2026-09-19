const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv");dotenv.config();
const FCA=require("ws3-fca"),login=typeof FCA==="function"?FCA:FCA.login;
const app=express(),PORT=+(process.env.PORT||1000),PREFIX=process.env.PREFIX||"!",BOT_NAME="iKON-BOT",OWNER="APHECKS IKON KLERK",ADMIN_ID=String(process.env.ADMIN_ID||""),APPSTATE=process.env.APPSTATE||"";
const commands=new Map(),aliases=new Map(),cooldowns=new Map(),groups=new Map(),pending=new Map();
const CONFIG={replies:true,reactions:true,autoReact:true,reactCooldown:2500,maxGroups:10,maintenance:false,welcome:true};

app.get("/",(_,r)=>r.json({status:"ACTIVE",bot:BOT_NAME,commands:commands.size,groups:groups.size}));
app.get("/health",(_,r)=>r.json({status:"OK",uptime:Math.floor(process.uptime()),commands:commands.size}));
app.listen(PORT,()=>console.log(`🌐 ${BOT_NAME} :${PORT}`));

const CATS={1:["💎 IKONVAULT","💰 MONEY • BANK • JOBS • BUSINESS"],2:["🔥 SHADOWSTREET","🚗 GTA • CRIME • POLICE • HEISTS"],3:["🐉 BEASTREALM","🐾 PETS • EVOLUTION • BREEDING • BATTLES"],4:["⚔️ WARFORGE","🗡️ COMBAT • PVP • BOSSES • RAIDS"],5:["🌿 WILDCORE","🌾 FARMING • MINING • FISHING • HUNTING"],6:["💠 TITANMART","🛒 SHOP • ITEMS • CRAFTING • INVENTORY"],7:["👑 OVERLORD","🛡️ ADMIN • GROUPS • SECURITY • SYSTEM"],8:["🎭 NEXUS","🎰 CASINO • AI • POKÉMON • SOCIAL"]};

const UI={
menu:()=>`🔥━━━━━━━━━━━━━━━━━━━━🔥
       👑 ${BOT_NAME} 👑
🔥━━━━━━━━━━━━━━━━━━━━🔥

🌐 WELCOME TO THE IKONVERSE

👑 OWNER
${OWNER}

⚡ PREFIX: ${PREFIX}
🟢 STATUS: ONLINE
🧩 COMMANDS: ${commands.size}

━━━━━━━━━━━━━━━━━━━━━━

📚 MAIN CATEGORIES

💎 ${PREFIX}menu 1
💰 IKONVAULT
🏦 Money • Bank • Jobs • Business

🔥 ${PREFIX}menu 2
🚗 SHADOWSTREET
💀 GTA • Crime • Police • Heists

🐉 ${PREFIX}menu 3
🐾 BEASTREALM
🥚 Pets • Evolution • Breeding

⚔️ ${PREFIX}menu 4
🔥 WARFORGE
🗡️ PvP • Bosses • Raids

🌿 ${PREFIX}menu 5
🌾 WILDCORE
⛏️ Farming • Mining • Fishing

💠 ${PREFIX}menu 6
🛒 TITANMART
⚒️ Shop • Crafting • Items

👑 ${PREFIX}menu 7
🛡️ OVERLORD
🔐 Admin • Security • Groups

🎭 ${PREFIX}menu 8
🎰 NEXUS
🤖 AI • Casino • Pokémon • Social

━━━━━━━━━━━━━━━━━━━━━━

⚡ QUICK COMMANDS

📖 ${PREFIX}help <command>
👤 ${PREFIX}uid
📊 ${PREFIX}status
🏓 ${PREFIX}ping

━━━━━━━━━━━━━━━━━━━━━━

😂 Explore the IKONVERSE...
🔥 but don't destroy the economy!`,
category:(n,list)=>`${CATS[n][0]}
━━━━━━━━━━━━━━━━━━━━━━
${CATS[n][1]}

${list||"📭 No commands loaded."}

━━━━━━━━━━━━━━━━━━━━━━
📖 ${PREFIX}help <command>
🏠 ${PREFIX}menu

👑 ${BOT_NAME}`,
unknown:c=>`❓ UNKNOWN COMMAND

━━━━━━━━━━━━━━━━━━━━━━

😂 Bro... what is
${PREFIX}${c}?

🔎 Try:
📖 ${PREFIX}help ${c}
📚 ${PREFIX}menu

💀 Maybe that command
escaped the IKONVERSE.`,
cooldown:(c,t)=>`⏳ EASY THERE, CHAMP 😂

━━━━━━━━━━━━━━━━━━━━━━

🔥 ${PREFIX}${c}
is cooling down.

⏱️ REMAINING
${t}

━━━━━━━━━━━━━━━━━━━━━━

💡 While waiting:
💰 ${PREFIX}work
🎮 ${PREFIX}games
🐾 ${PREFIX}pets`,
denied:()=>`🚫 ACCESS DENIED

━━━━━━━━━━━━━━━━━━━━━━

🛡️ ADMIN CLEARANCE REQUIRED

😂 Nice try though...

👑 ${BOT_NAME}`,
error:()=>`💥 SYSTEM ERROR

━━━━━━━━━━━━━━━━━━━━━━

😵 Something went wrong.

🔄 Try again.

👑 Contact:
${OWNER}`,
ping:x=>`🏓 PONG!

━━━━━━━━━━━━━━━━━━━━━━

⚡ RESPONSE: ${x}ms
🟢 BOT: ONLINE
📡 CONNECTION: ACTIVE
🧩 COMMANDS: ${commands.size}

🔥 ${BOT_NAME} IS ALIVE!`,
welcome:n=>`🎉 NEW MEMBER DETECTED!

━━━━━━━━━━━━━━━━━━━━━━

👋 WELCOME ${n}!

🌐 You just entered:
🔥 THE IKONVERSE

━━━━━━━━━━━━━━━━━━━━━━

📖 ${PREFIX}menu
💰 ${PREFIX}daily
👤 ${PREFIX}profile
🐾 ${PREFIX}pets
🎮 ${PREFIX}games

😂 Have fun...
🔥 and don't start a war yet!`,
battle:t=>`⚔️ BATTLE TURN ${t}

━━━━━━━━━━━━━━━━━━━━━━

🐉 YOU
❤️ HP 720/1000
███████░░░

👹 ENEMY
❤️ HP 540/1000
█████░░░░░

━━━━━━━━━━━━━━━━━━━━━━

⚔️ ${PREFIX}attack
🛡️ ${PREFIX}defend
💨 ${PREFIX}dodge
🔥 ${PREFIX}skill
💥 ${PREFIX}ultimate
🏃 ${PREFIX}flee

⏳ MAKE YOUR MOVE!

😂 WHO'S GETTING COOKED? 🔥`,
request:(a,b,t)=>`💌 ${String(t).toUpperCase()} REQUEST

━━━━━━━━━━━━━━━━━━━━━━

👤 FROM: ${a}
🎯 TO: ${b}

📨 A special request
has been sent.

━━━━━━━━━━━━━━━━━━━━━━

✅ ACCEPT
❌ DECLINE

⏳ EXPIRES IN 10 MINUTES

😂 Choose wisely...`,
accepted:t=>`✅ REQUEST ACCEPTED!

━━━━━━━━━━━━━━━━━━━━━━

📨 ${String(t).toUpperCase()}

🔥 NEXT STAGE ACTIVATED!

⚔️ LET THE CHAOS BEGIN 😂🔥`,
declined:t=>`❌ REQUEST DECLINED

━━━━━━━━━━━━━━━━━━━━━━

📨 ${String(t).toUpperCase()}

😂 Bro said:

"not today."

💀 REQUEST CANCELLED.`,
offline:()=>`🔴 BOT OFFLINE

━━━━━━━━━━━━━━━━━━━━━━

🛠️ MAINTENANCE MODE

⏳ Try again later.

👑 ${BOT_NAME}`,
money:()=>`💰 CASH DROP!

━━━━━━━━━━━━━━━━━━━━━━

AYOOO 😭🔥

💵 +$6,000,000
⭐ +250 XP
🔥 STREAK INCREASED

📊 WALLET
█████████░

😂 Don't spend it all
in 4 seconds bro.`
};

function send(api,e,t){if(!CONFIG.replies)return;return new Promise(r=>{try{api.sendMessage(String(t),e.threadID,err=>{if(err)try{api.sendMessage(String(t),e.threadID,()=>{});}catch{};r()},e.messageID)}catch{try{api.sendMessage(String(t),e.threadID,()=>{})}catch{};r()}})}
function react(api,e,x){try{api.setMessageReaction(x,e.messageID,()=>{},true)}catch{}}
function admin(e){return ADMIN_ID&&String(e.senderID)===ADMIN_ID}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function left(k){let x=(cooldowns.get(k)||0)-Date.now();if(x<=0)return null;let s=Math.ceil(x/1000),m=Math.floor(s/60);return`${m?m+"m ":""}${s%60}s`}
function find(n){n=String(n).toLowerCase();return commands.get(n)||commands.get(aliases.get(n))}
function load(){const d=path.join(__dirname,"commands");if(!fs.existsSync(d))return;fs.readdirSync(d).filter(x=>/^cmds_\d+\.js$/i.test(x)).sort((a,b)=>+a.match(/\d+/)-+b.match(/\d+/)).forEach(f=>{try{delete require.cache[require.resolve(path.join(d,f))];let m=require(path.join(d,f)),a=Array.isArray(m)?m:Array.isArray(m.commands)?m.commands:Object.values(m);a.forEach(c=>{if(!c?.name)return;let n=String(c.name).toLowerCase();if(commands.has(n)){console.log(`⚠️ DUPLICATE COMMAND: ${n}`);return}commands.set(n,c);(c.aliases||[]).forEach(x=>{x=String(x).toLowerCase();if(x!==n&&!commands.has(x)&&!aliases.has(x))aliases.set(x,n)})})}catch(e){console.error(`❌ ${f}`,e.message)}});console.log(`🔥 ${BOT_NAME}: ${commands.size} commands loaded`)}
