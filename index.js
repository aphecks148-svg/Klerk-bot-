const express=require("express"),axios=require("axios"),fs=require("fs"),path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
app.get("/",(req,res)=>res.send("iKON-BOT ONLINE by Aphecks iKon Klerk"));
app.listen(PORT,()=>console.log(`🌐 iKON-BOT Port ${PORT}`));
setInterval(()=>{axios.get(`http://localhost:${PORT}/`).catch(()=>{});console.log("💓 Keep Alive Ping")},14*60*1000);

// FIX: ws3-fca export is object, not function
const _fca=require("ws3-fca");
const fca=typeof _fca==="function"?_fca:_fca.login||_fca.default||_fca;

let ADMIN_UIDS=[];
try{ADMIN_UIDS=JSON.parse(process.env.ADMIN_UIDS||"[]")}catch{ADMIN_UIDS=(process.env.ADMIN_UIDS||"").split(",").filter(Boolean)};
const APPSTATE=JSON.parse(process.env.APPSTATE||"[]");
const GEMINI_KEY=process.env.GEMINI_KEY||"";

function fmt(n){return"$"+(Number(n)*10).toLocaleString()}
function makeBar(c,m,l=10){let p=Math.max(0,Math.min(1,c/m)),f=Math.round(p*l);return"█".repeat(f)+"░".repeat(l-f)+` ${Math.round(p*100)}%`}

function loadDB(){let p=path.join(__dirname,"database.json");if(!fs.existsSync(p))return{};try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return{}}}
function saveDB(db){fs.writeFileSync(path.join(__dirname,"database.json"),JSON.stringify(db,null,2))}
function getUser(uid){let db=loadDB();if(!db[uid]){db[uid]={cash:1000,level:1,power:100,hp:100,maxHp:100,attack:50,defense:20,wins:0,hearts:0,heartsync:0,casinoWins:0,xp:0,inventory:{}};saveDB(db)}return db[uid]}

const COMMANDS_DIR=path.join(__dirname,"commands");
let allCmds=[];let files=fs.existsSync(COMMANDS_DIR)?fs.readdirSync(COMMANDS_DIR).filter(f=>f.endsWith(".js")).sort():[];
for(let f of files){try{delete require.cache[require.resolve(path.join(COMMANDS_DIR,f))];let d=require(path.join(COMMANDS_DIR,f));if(Array.isArray(d))allCmds.push(...d);else if(d&&d.name)allCmds.push(d);console.log(`✅ ${f} ${Array.isArray(d)?d.length:1}`)}catch(e){console.log(`❌ ${f} ${e.message}`)}}
console.log(`🔥 iKON-BOT TOTAL ${allCmds.length} CMDS`);
const cmdMap={};for(let c of allCmds){cmdMap[c.name.toLowerCase()]=c;if(c.aliases)for(let a of c.aliases)cmdMap[a.toLowerCase()]=c}

let threadMsgCount={};let cooldownMap={};let spamMap={};
const REACTS={love:"❤️",haha:"😂",sad:"😢",angry:"😠",wow:"😮",like:"👍",war:"⚔️",casino:"🎰",heart:"💖",poki:"🔥"};
const POKEMONS=["Pikachu","Charizard","Mewtwo","Gengar","Eevee","Lucario","Greninja","Rayquaza"];

function canUse(uid){let now=Date.now();if(!spamMap[uid])spamMap[uid]=[];spamMap[uid]=spamMap[uid].filter(t=>now-t<10000);spamMap[uid].push(now);if(spamMap[uid].length>5)return false;if(cooldownMap[uid]&&now-cooldownMap[uid]<3000)return false;cooldownMap[uid]=now;return true}

async function geminiReply(prompt){if(!GEMINI_KEY)return null;try{let r=await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,{contents:[{parts:[{text:`You are iKON-BOT owned by Aphecks iKon Klerk. Be funny, flirty, roasty, short, interesting. User: ${prompt}`}]}]});return r.data.candidates?.[0]?.content?.parts?.[0]?.text||null}catch{return null}}

function mainMenu(){return`╭━─━─━─━─━─━─━─━─━─━╮
┃ 🌟 𝗶𝗞𝗢𝗡-𝗕𝗢𝗧 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 🌟
┃ 👑 Owner: Aphecks iKon Klerk
╰━─━─━─━─━─━─━─━─━─━╯

┏━━━ ⚔️ 𝗪𝗔𝗥 𝗭𝗢𝗡𝗘 ━━━┓
   ➥!war - Start your war journey
   ➥!attack - Attack enemy
   ➥!heal - Heal your HP
   ➥!warshop - Buy weapons
   ➥!warrank - Top warriors
┗━━━━━━━━━━━━━━━┛
┏━━━ ❤️ 𝗛𝗘𝗔𝗥𝗧 𝗦𝗬𝗡𝗖 ━━━┓
   ➥!heart - Send heart
   ➥!love @tag - Love someone
   ➥!ship @tag - Ship 2 users
   ➥!marry @tag - Marry user
   ➥!loverank - Top lovers
┗━━━━━━━━━━━━━━━┛
┏━━━ 🎰 𝗡𝗘𝗢𝗡 𝗖𝗔𝗦𝗜𝗡𝗢 ━━━┓
   ➥!casino - View cash
   ➥!slot <bet> - Slot machine
   ➥!spin <bet> - Spin wheel
   ➥!jackpot <bet> - Big jackpot
   ➥!blackjack <bet> - Card game
┗━━━━━━━━━━━━━━━┛
┏━━━ 🎛️ 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 ━━━┓
   ➥!control - Admin panel
   ➥!ban <uid> - Ban user
   ➥!setcash <uid> <amt>
   ➥!stats - Bot stats
   ➥!ping - Bot speed
┗━━━━━━━━━━━━━━━┛

📦 Files: ${files.length} | 📜 Total: ${allCmds.length} CMDS
👑 Bot: iKON-BOT by Aphecks iKon Klerk
`}

function catMenu(cat){let list=allCmds.filter(c=>c.category.toLowerCase()==cat.toLowerCase());let emoji={war:"⚔️",heart:"❤️",casino:"🎰",control:"🎛️",core:"🌟"}[cat.toLowerCase()]||"📜";let msg=`╭━ ${emoji} ${cat.toUpperCase()} - ${list.length} CMDS ─╮\n\n`;list.forEach((c,i)=>{msg+=` ${i+1}.!${c.name}\n └ ${c.purpose} | ${c.syntax}\n 💡 XP:${c.XP} Money:${c.money}\n\n`});msg+=`╰━ Use!help <cmd> for details ─╯`;return msg}

fca({appState:APPSTATE},(err,api)=>{
if(err)return console.error(err);
api.setOptions({listenEvents:true,selfListen:false});
console.log("🔥 iKON-BOT Logged In by Aphecks iKon Klerk");
api.listenMqtt(async(err,event)=>{
if(err)return;
if(event.type!="message")return;
let threadID=event.threadID;
let senderID=event.senderID;
let body=(event.body||"").trim();if(!body)return;
threadMsgCount[threadID]=(threadMsgCount[threadID]||0)+1;
if(threadMsgCount[threadID]%20==0){
let poke=POKEMONS[Math.floor(Math.random()*POKEMONS.length)];
api.sendMessage(`🔥 𝗣𝗢𝗞𝗘𝗠𝗢𝗡 𝗦𝗣𝗔𝗪𝗡!\n\n A wild ${poke} appeared!\n\n 💡 Type!catch ${poke} to catch!\n 🎁 Reward: ${fmt(5000)}`,threadID,event.messageID);
try{api.setMessageReaction("🔥",event.messageID,()=>{},true)}catch{}
}
let lower=body.toLowerCase();
for(let k in REACTS){if(lower.includes(k)){try{api.setMessageReaction(REACTS[k],event.messageID,()=>{},true)}catch{};break}}

if(!canUse(senderID)){api.sendMessage(`🚫 Spam detected! Slow down 3s\n [${makeBar(3,10)}]`,threadID,event.messageID);return}

let prefixMatch=body.match(/^!\s*(\w+)\s*(.*)/);
if(prefixMatch){
let name=prefixMatch[1].toLowerCase();
let args=prefixMatch[2]?prefixMatch[2].split(/\s+/).filter(Boolean):[];
if(name=="menu"||name=="help"||name=="botmenu"||name=="ikon"){
if(args[0]&&["war","heart","casino","control","core"].includes(args[0].toLowerCase())){api.sendMessage(catMenu(args[0]),threadID,event.messageID);return}
api.sendMessage(mainMenu(),threadID,event.messageID);return
}
if(name=="buy"){
let item=args[0];let amt=parseInt(args[1])||1;
let priceList={sword:500,shield:400,potion:200,chip:1000,token:2000,rose:300,ring:5000};
let price=(priceList[item?.toLowerCase()]||500)*amt;
let db=loadDB();if(!db[senderID])db[senderID]={cash:1000,level:1,power:100,hp:100,maxHp:100,attack:50,defense:20,wins:0,hearts:0,heartsync:0,casinoWins:0,xp:0,inventory:{}};
if(db[senderID].cash<price){api.sendMessage(`❌ Need ${fmt(price)} you have ${fmt(db[senderID].cash)}`,threadID,event.messageID);return}
db[senderID].cash-=price;db[senderID].inventory[item]=(db[senderID].inventory[item]||0)+amt;saveDB(db);
api.sendMessage(`✅ Bought ${amt}x ${item} for ${fmt(price)}\n 💰 Left: ${fmt(db[senderID].cash)} [${makeBar(db[senderID].cash,100000)}]`,threadID,event.messageID);return
}
if(name=="catch"){
api.sendMessage(`🎉 Caught ${args[0]||"Pokemon"}! +${fmt(5000)}\n Power +100`,threadID,event.messageID);
let db=loadDB();if(!db[senderID])db[senderID]={cash:1000,level:1,power:100,hp:100,maxHp:100,attack:50,defense:20,wins:0,hearts:0,heartsync:0,casinoWins:0,xp:0,inventory:{}};
db[senderID].cash+=5000;db[senderID].power+=100;saveDB(db);return
}
let cmd=cmdMap[name];
if(cmd){
let db=loadDB();if(!db[senderID]){db[senderID]={cash:1000,level:1,power:100,hp:100,maxHp:100,attack:50,defense:20,wins:0,hearts:0,heartsync:0,casinoWins:0,xp:0,inventory:{},banned:false};saveDB(db)}
if(db[senderID].banned)return api.sendMessage("🚫 You are banned by Aphecks iKon Klerk",threadID,event.messageID);
if(cmd.permission=="admin"&&!ADMIN_UIDS.includes(senderID)&&!db[senderID].isAdmin)return api.sendMessage("❌ Admin only - iKON-BOT",threadID,event.messageID);
try{await cmd.execute({api,event,args,uid:senderID,ensureDB:loadDB,saveDB,getUser,makeBar,fmt,db});}catch(e){api.sendMessage(`⚠️ Error!${cmd.name}: ${e.message}`,threadID,event.messageID);}return
}
}
let ai=await geminiReply(body);if(ai){api.sendMessage(`🤖 iKON-BOT by Aphecks\n\n${ai}\n\n💡 Type!menu for cmds`,threadID,event.messageID);}
});
});
