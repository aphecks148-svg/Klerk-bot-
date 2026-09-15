const fs=require("fs"),path=require("path"),express=require("express"),dotenv=require("dotenv"),{login}=require("ws3-fca");
dotenv.config();

const PREFIX=process.env.PREFIX||"!",ADMIN_ID=process.env.ADMIN_ID||"100086783504073",PORT=+(process.env.PORT||3000);
const APPSTATE=process.env.APPSTATE?JSON.parse(process.env.APPSTATE):require("./appstate.json");
const Commands=new Map(),Aliases=new Map(),Cooldowns=new Map();
const CONFIG_FILE=path.join(__dirname,"bot-config.json");

const DEFAULT={
 botEnabled:true,maintenance:false,replies:true,reactions:true,
 modules:{cmds_1:true,cmds_2:true,cmds_3:true,cmds_4:true,cmds_5:true,cmds_6:true,cmds_7:true,cmds_8:true},
 commands:{}
};

let CFG=loadConfig(),api;

function loadConfig(){
 try{
  if(!fs.existsSync(CONFIG_FILE)){
   fs.writeFileSync(CONFIG_FILE,JSON.stringify(DEFAULT,null,2));
   return JSON.parse(JSON.stringify(DEFAULT));
  }
  const x=JSON.parse(fs.readFileSync(CONFIG_FILE,"utf8"));
  return {...DEFAULT,...x,modules:{...DEFAULT.modules,...(x.modules||{})},commands:{...DEFAULT.commands,...(x.commands||{})}};
 }catch(e){console.error("Config:",e);return JSON.parse(JSON.stringify(DEFAULT))}
}

function saveConfig(){try{fs.writeFileSync(CONFIG_FILE,JSON.stringify(CFG,null,2))}catch(e){console.error(e)}}
function norm(x){return String(x||"").toLowerCase().trim().replace(/^!/,"")}
function getCmd(x){x=norm(x);return Commands.get(x)||Commands.get(Aliases.get(x))}
function cmdOn(x){return CFG.commands[norm(x)]!==false}
function modOn(x){return CFG.modules[x]!==false}

function register(c,m){
 if(!c||!c.name||typeof c.execute!=="function")return;
 let n=norm(c.name);
 if(Commands.has(n))return console.log("⚠️ Duplicate:",n);
 c.name=n;c.module=m;Commands.set(n,c);
 (c.aliases||[]).forEach(a=>{a=norm(a);if(a&&!Commands.has(a))Aliases.set(a,n)});
}

function loadCommands(){
 Commands.clear();Aliases.clear();
 const dir=path.join(__dirname,"commands");
 if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});

 for(let i=1;i<=8;i++){
  const m=`cmds_${i}`,f=path.join(dir,m+".js");
  if(!fs.existsSync(f)){console.log("⚠️ Missing:",f);continue}
  try{
   delete require.cache[require.resolve(f)];
   const x=require(f);
   if(Array.isArray(x))x.forEach(c=>register(c,m));
   else if(x?.name&&typeof x.execute==="function")register(x,m);
   else if(x&&typeof x==="object")
    Object.entries(x).forEach(([n,c])=>{
     if(typeof c==="function")register({name:n,execute:c},m);
     else if(c?.execute)register({...c,name:c.name||n},m);
    });
   console.log("✅",m,"loaded");
  }catch(e){console.error("❌",m,e)}
 }
 console.log("📚 Commands:",Commands.size);
}

function send(e,msg){
 if(!e||!msg||CFG.replies===false)return;
 try{api.sendMessage(String(msg),e.threadID,()=>{},e.messageID)}
 catch(x){console.error("Send:",x.message)}
}

function react(e,emoji="👍"){
 if(!e||CFG.reactions===false)return;
 try{
  if(typeof api.setMessageReactionMqtt==="function")api.setMessageReactionMqtt(emoji,e.messageID,()=>{},true);
  else if(typeof api.setMessageReaction==="function")api.setMessageReaction(emoji,e.messageID,()=>{},true);
 }catch(x){}
}

function profile(id){
 return new Promise(resolve=>{
  try{
   api.getUserInfo(id,(err,info)=>{
    const u=!err&&info?info[id]||{}:{};
    resolve({id,name:u.name||u.fullName||"Unknown User",firstName:u.firstName||u.name||"User",photo:u.thumbSrc||u.profileUrl||null});
   });
  }catch(e){resolve({id,name:"Unknown User",firstName:"User",photo:null})}
 })
}

function menu(){
 return `╭━━ 🤖 COMMUNITY BOT ━━╮
┃ 1️⃣ 🏆 Progression/World
┃ 2️⃣ 🐾 Pets/Farming
┃ 3️⃣ 💰 Economy/Market
┃ 4️⃣ 🔫 GTA/Crime/Vehicles
┃ 5️⃣ 🎰 Casino/Social
┃ 6️⃣ 🤖 AI Systems
┃ 7️⃣ 👑 Admin/Utilities
┃ 8️⃣ ⚔️ War/Crafting
╰━━━━━━━━━━━━━━━━━━━━╯
📌 ${PREFIX}menu 1-8
📌 ${PREFIX}help <command>
📌 ${PREFIX}status`;
}

function category(n){
 const m=`cmds_${n}`;
 if(!modOn(m))return `🚫 ${m} is disabled.`;
 const a=[];
 for(const [name,c] of Commands)if(c.module===m)a.push(`${PREFIX}${name}${c.description?" — "+c.description:""}`);
 return `╭━━ 📚 ${m.toUpperCase()} ━━╮\n${a.length?a.join("\n"):"📭 Empty"}\n╰━━ ${a.length} commands ━━╯`;
}

function help(n){
 const c=getCmd(n);
 if(!c)return `❌ Unknown command.\nUse ${PREFIX}menu`;
 return `╭━━ 📖 HELP ━━╮
⚡ ${PREFIX}${c.name}
📦 ${c.module}
📝 ${c.description||"No description"}
${c.aliases?.length?"🔗 "+c.aliases.map(x=>PREFIX+x).join(", "):""}
${c.usage?"\n📌 "+c.usage:""}
╰━━━━━━━━━━━━╯`;
}

function status(){
 let on=0;for(const c of Commands.values())if(cmdOn(c.name))on++;
 return `╭━━ 📊 BOT STATUS ━━╮
🤖 Bot: ${CFG.botEnabled?"🟢 ON":"🔴 OFF"}
🛠️ Maintenance: ${CFG.maintenance?"🟠 ON":"🟢 OFF"}
📚 Commands: ${Commands.size}
✅ Enabled: ${on}
❤️ Reactions: ${CFG.reactions?"ON":"OFF"}
💬 Replies: ${CFG.replies?"ON":"OFF"}
👑 Admin: ${ADMIN_ID}
╰━━━━━━━━━━━━━━━━╯`;
}

async function handle(e){
 if(!e||(e.type!=="message"&&e.type!=="message_reply"))return;
 const body=e.body||e.message?.body||"";
 if(!body||!body.trim().startsWith(PREFIX))return;

 const p=body.trim().slice(PREFIX.length).split(/\s+/),name=norm(p.shift()),args=p,id=e.senderID||e.author||e.userID;
 const isAdmin=String(id)===String(ADMIN_ID),user=await profile(id);

 if(!CFG.botEnabled&&!isAdmin)return send(e,"🔴 Bot is disabled.");
 if(CFG.maintenance&&!isAdmin)return send(e,"🛠️ Maintenance mode.");

 if(name==="menu"||name==="commands"){
  const n=+args[0];return send(e,n>=1&&n<=8?category(n):menu());
 }
 if(name==="help")return send(e,args[0]?help(args[0]):menu());
 if(name==="status"||name==="botstatus")return send(e,status());

 const c=getCmd(name);
 if(!c)return send(e,`❌ Unknown command: ${PREFIX}${name}\n📌 Use ${PREFIX}menu`);
 if(!modOn(c.module)&&!isAdmin)return send(e,`🚫 ${c.module} is disabled.`);
 if(!cmdOn(c.name)&&!isAdmin)return send(e,`🚫 ${PREFIX}${c.name} is disabled.`);
 if(c.adminOnly&&!isAdmin)return send(e,"⛔ Admin permission required.");

 const cd=+(c.cooldown||c.cooldownSeconds||0);
 if(cd&&!isAdmin){
  const k=id+":"+c.name,last=Cooldowns.get(k)||0,remain=cd-(Date.now()-last)/1000;
  if(remain>0)return send(e,`⏳ Wait ${Math.ceil(remain)}s.`);
  Cooldowns.set(k,Date.now());
 }

 if(CFG.reactions&&c.autoReact!==false)react(e,c.reaction||"👍");

 const ctx={
  api,event:e,args,tokens:args,adminID:ADMIN_ID,isAdmin,user,
  username:user.name,photo:user.photo,prefix:PREFIX,config:CFG,
  reply:x=>send(e,x),react:x=>react(e,x),getProfile:profile,
  saveConfig,commands:Commands,aliases:Aliases
 };

 try{
  if(c.execute.length<=1)await c.execute(ctx);
  else await c.execute(api,e,args,ADMIN_ID);
 }catch(x){
  console.error(`❌ ${c.name}:`,x);
  send(e,`❌ Error running ${PREFIX}${c.name}.`);
 }
}

const app=express();
app.get("/",(_,r)=>r.send("🤖 Messenger Community Bot Online"));
app.get("/status",(_,r)=>r.json({online:true,commands:Commands.size,maintenance:CFG.maintenance}));
app.listen(PORT,()=>console.log("🌐 Port:",PORT));

function start(){
 console.log("🚀 Starting bot...");
 loadCommands();

 login({appState:APPSTATE},(err,a)=>{
  if(err)return console.error("❌ Login failed:",err);
  api=a;
  console.log("✅ Facebook login successful");
  console.log("📚 Commands:",Commands.size);
  console.log("👑 Admin:",ADMIN_ID);

  api.setOptions({
   listenEvents:true,
   selfListen:false,
   autoMarkRead:true,
   online:true
  });

  api.listenMqtt((err,e)=>{
   if(err)return console.error("MQTT:",err);
   handle(e);
  });
 });
}

process.on("uncaughtException",e=>console.error("💥",e));
process.on("unhandledRejection",e=>console.error("💥",e));

start();
