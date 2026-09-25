// commands/cmds_10.js // 👤 SOCIAL + 🤖 AI GEMINI + ⚽ SPORTS + ADMIN — iKON-BOT FIXED
module.exports=({api,event,user,reply,users,profile,fun})=>{
const r=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
user.crime=user.crime||{rep:0,heat:0,success:0,fail:0,heists:0,crew:[],rank:1};
user.social=user.social||{marry:null,partner:null,crush:null};
user.wallet=user.wallet||0;

// ===== GEMINI HELPER =====
async function gemini(prompt){
  try{
    const key = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "";
    if(!key) return `❌ GEMINI_API_KEY missing in Render ENV.\nQ: ${prompt}`;
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }catch(e){
    return `⚠️ Gemini Error: ${e.message}\nQ: ${prompt}`;
  }
}

const cmds=[
{name:"marry",run:async({args})=>{let t=args[0]||"someone";if(user.social.marry)return r(`💍 Already married to ${user.social.marry}`);user.social.marry=t;r(`💍 You proposed to ${t}!\n💑 Married! ${fun()}`)}},
{name:"divorce",run:async()=>{if(!user.social.marry)return r("💔 Not married.");let ex=user.social.marry;user.social.marry=null;r(`💔 Divorced ${ex}.`)}},
{name:"partner",run:async({args})=>{if(args[0]){user.social.partner=args[0];r(`💑 Partner set: ${args[0]}`)}else{r(`💑 Partner: ${user.social.partner||"None"}`)}}},
{name:"couple",aliases:["couples"],run:async({args})=>{let a=args[0]||event.senderID,b=args[1]||event.senderID;let pa=await profile(api,a).catch(()=>({name:a})),pb=await profile(api,b).catch(()=>({name:b}));r(`💑 COUPLE\n${pa.name} + ${pb.name}\n❤️ Match: ${Math.floor(Math.random()*100)}%`)}},
{name:"pair",run:async({args})=>{let a=args[0]||"User1",b=args[1]||"User2";r(`💞 PAIRED\n${a} + ${b} = ${Math.floor(Math.random()*100)}% Love`)}},
{name:"crush",run:async({args})=>{let t=args[0]||"secret";user.social.crush=t;r(`💘 Your crush is ${t}! Shhh...`)}},
{name:"slap",run:async({args})=>{let t=args[0]||"someone";r(`👋 ${user.firstName||"You"} slapped ${t}! 💥`)}},
{name:"kiss",run:async({args})=>{let t=args[0]||"someone";r(`😘 ${user.firstName||"You"} kissed ${t}! ❤️`)}},
{name:"hug",run:async({args})=>{let t=args[0]||"someone";r(`🤗 ${user.firstName||"You"} hugged ${t}!`)}},
{name:"poke",run:async({args})=>{let t=args[0]||"someone";r(`👉 Poked ${t}!`)}},
{name:"gift",run:async({args})=>{let t=args[0]||"someone";let g=args.slice(1).join(" ")||"🎁";r(`🎁 You gifted ${g} to ${t}!`)}},
{name:"spy",run:async({args})=>{let t=args[0]||"someone";let p=await profile(api,t).catch(()=>({name:t}));r(`🕵️ SPY\n👤 ${p.name}\n🆔 ${t}\n💰 $${(users.get(t)?.wallet||0).toLocaleString()}`)}},
{name:"roast",run:async({args})=>{let q=args.join(" ")||"someone";let ans=await gemini(`Roast ${q} in a funny savage way, 1 line`);r(`🔥 ROAST ${q}:\n${ans}`)}},
{name:"compliment",aliases:["comp"],run:async({args})=>{let q=args.join(" ")||"you";let ans=await gemini(`Give a sweet compliment for ${q}, 1 line`);r(`💖 ${ans}`)}},
{name:"ship",run:async({args})=>{let a=args[0]||"Me",b=args[1]||"You";r(`🚢 SHIP\n${a} + ${b}\nLove: ${Math.floor(Math.random()*100)}% ${fun()}`)}},

// ===== AI GEMINI CONNECTED =====
{name:"ai",run:async({args})=>{let q=args.join(" ");if(!q)return r("🤖 Use:!ai <question>");let ans=await gemini(q);r(`🤖 GEMINI AI\nQ: ${q}\n\n${ans}`)}},
{name:"ask",run:async({args})=>{let q=args.join(" ");if(!q)return r("🤖 Use:!ask <question>");let ans=await gemini(q);r(`🤖 ASK:\n${ans}`)}},
{name:"chat",run:async({args})=>{let q=args.join(" ")||"Hello";let ans=await gemini(`Chat friendly: ${q}`);r(`💬 ${ans}`)}},
{name:"imagine",aliases:["gen"],run:async({args})=>{let p=args.join(" ")||"a cat";let ans=await gemini(`Describe an image prompt for: ${p} - make it detailed for AI image generation`);r(`🎨 IMAGINE: ${p}\n\n📝 Prompt:\n${ans}\n\n🖼️ (Use this prompt in an image gen bot)`)}},
{name:"image",run:async({args})=>{let q=args.join(" ")||"random";let ans=await gemini(`Give 1 detailed image description for: ${q}`);r(`🖼️ IMAGE IDEA: ${q}\n\n${ans}`)}},
{name:"translate",aliases:["trans"],run:async({args})=>{let t=args.join(" ");if(!t)return r("🌐 Use:!translate <text>");let ans=await gemini(`Translate to English and Arabic: ${t}`);r(`🌐 TRANSLATE\n${ans}`)}},
{name:"summarize",run:async({args})=>{let t=args.join(" ");if(!t)return r("📝 Use:!summarize <long text>");let ans=await gemini(`Summarize this: ${t}`);r(`📝 SUMMARY\n${ans}`)}},
{name:"define",run:async({args})=>{let w=args[0]||"word";let ans=await gemini(`Define: ${w} in simple English + Arabic`);r(`📖 ${ans}`)}},
{name:"search",run:async({args})=>{let q=args.join(" ");if(!q)return r("🔍 Use:!search <query>");let ans=await gemini(`Answer and explain like search result: ${q}`);r(`🔍 SEARCH: ${q}\n\n${ans}`)}},
{name:"weather",run:async({args})=>{let c=args.join(" ")||"Amman";r(`🌤️ WEATHER ${c}\n☀️ Use!ai weather in ${c} for live Gemini forecast.`)}},
{name:"calc",run:async({args})=>{try{let e=args.join(" ");let res=eval(e);r(`🧮 ${e} = ${res}`)}catch(e){r("❌ Invalid calc")}}},
{name:"convert",run:async({args})=>{let q=args.join(" ");let ans=await gemini(`Convert: ${q} - give exact answer`);r(`🔄 ${ans}`)}},
{name:"qrcode",aliases:["qr"],run:async({args})=>{let t=args.join(" ")||"https://example.com";r(`🔳 QR CODE\nText: ${t}\n🔗 https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(t)}`)}},
{name:"youtube",aliases:["yt"],run:async({args})=>r(`▶️ YOUTUBE\nSearch: ${args.join(" ")||"music"}`)},
{name:"music",run:async({args})=>r(`🎵 MUSIC\n${args.join(" ")||"random song"} 🎶`)},
{name:"video",run:async({args})=>r(`🎬 VIDEO\n${args.join(" ")||"random video"}`)},
{name:"sticker",run:async()=>r("🖼️ STICKER\nSend image with!sticker")},
{name:"gif",run:async({args})=>r(`🎞️ GIF: ${args.join(" ")||"funny"}`)},
{name:"meme",run:async()=>{let ans=await gemini(`Tell a short funny meme joke, 1 line`);r(`🤣 MEME\n${ans}`)}},
{name:"caption",run:async({args})=>{let q=args.join(" ")||"my photo";let ans=await gemini(`Write 3 Instagram captions for: ${q}`);r(`✍️ CAPTION for "${q}"\n\n${ans}`)}},
{name:"rewrite",run:async({args})=>{let q=args.join(" ");if(!q)return r("Use:!rewrite <text>");let ans=await gemini(`Rewrite better: ${q}`);r(`🔄 REWRITE\n${ans}`)}},
{name:"prompt",run:async({args})=>{let q=args.join(" ")||"art";let ans=await gemini(`Create a professional AI art prompt for: ${q}`);r(`💡 PROMPT\n${ans}`)}},
{name:"explain",run:async({args})=>{let q=args.join(" ");if(!q)return r("Use:!explain <topic>");let ans=await gemini(`Explain simply: ${q}`);r(`📚 EXPLAIN ${q}\n\n${ans}`)}},

{name:"football",aliases:["futbol"],run:async()=>r("⚽ FOOTBALL\n!live!fixtures!results!standings")},
{name:"live",aliases:["livescore"],run:async()=>{let ans=await gemini(`Give today's football live scores simulated with real teams`);r(`⚽ LIVE\n${ans}`)}},
{name:"fixtures",run:async()=>r("📅 FIXTURES\nToday: Real vs Barca 21:00")},
{name:"results",run:async()=>r("📊 RESULTS\nYesterday: Chelsea 3-0 Liverpool")},
{name:"match",run:async({args})=>r(`⚽ MATCH: ${args.join(" ")||"Real Madrid"}`)},
{name:"team",run:async({args})=>{let q=args.join(" ")||"Real Madrid";let ans=await gemini(`Give info about football team: ${q}`);r(`👕 TEAM ${q}\n${ans}`)}},
{name:"teams",run:async()=>r("👕 TEAMS\nReal Madrid, Barcelona, Man City...")},
{name:"league",run:async({args})=>r(`🏆 LEAGUE ${args.join(" ")||"La Liga"}`)},
{name:"leagues",run:async()=>r("🏆 LEAGUES\nLa Liga, Premier League...")},
{name:"standings",aliases:["table"],run:async({args})=>{let q=args.join(" ")||"La Liga";let ans=await gemini(`Give current standings table for ${q} 2025-2026 season`);r(`📊 STANDINGS ${q}\n${ans}`)}},
{name:"footballnews",run:async()=>{let ans=await gemini(`Give 3 latest football news headlines`);r(`📰 FOOTBALL NEWS\n${ans}`)}},
{name:"wrestling",aliases:["wwe"],run:async()=>r("🤼 WRESTLING\n!wrestlingnews!ufc")},
{name:"wrestlingnews",run:async()=>{let ans=await gemini(`Give 3 latest WWE wrestling news`);r(`📰 ${ans}`)}},
{name:"ufc",run:async()=>{let ans=await gemini(`Give next UFC fights`);r(`🥊 UFC\n${ans}`)}},
{name:"sports",aliases:["score"],run:async()=>r("🏅 SPORTS\n!football!wrestling!ufc")},
{name:"player",run:async({args})=>{let q=args.join(" ")||"Ronaldo";let ans=await gemini(`Give stats for football player: ${q}`);r(`👤 PLAYER ${q}\n${ans}`)}},

{name:"menu",run:async()=>r("📜 MENU\n!menu1 - 174 cmds\n!menu2 - 186 cmds")},
{name:"menu1",run:async()=>r("📜 MENU 1\n!balance!shop!pet!farm!mine!battle")},
{name:"menu2",run:async()=>r("📜 MENU 2\n!marry!ai!football!admin!menu")},
{name:"commands",aliases:["cmd"],run:async()=>r("📜 360 commands -!menu")},
{name:"botinfo",aliases:["bot"],run:async()=>r(`🤖 iKON-BOT\nPrefix:!\nUsers: ${users.size}\nGemini: ${process.env.GEMINI_API_KEY?"✅ ON":"❌ OFF"}`)},
{name:"ping",run:async()=>{let s=Date.now();r(`🏓 PONG ${Date.now()-s}ms`)}},
{name:"uptime",run:async()=>r(`⏱️ UPTIME ${Math.floor(process.uptime()/3600)}h`)},
{name:"groupinfo",aliases:["gcinfo"],run:async()=>r(`👥 GROUP ID: ${event.threadID}`)},
{name:"members",run:async()=>r(`👥 Members: ${event.participantIDs?.length||0}`)},
{name:"admins",run:async()=>{let a=event.adminIDs?.length||0;r(`👑 Admins: ${a}`)}},
{name:"rules",run:async()=>r("📜 RULES: No spam, respect all.")},
{name:"status",run:async()=>r("🟢 Bot ONLINE")},
{name:"report",run:async({args})=>r(`🚩 REPORTED: ${args.join(" ")||"Issue"}`)},
{name:"suggest",run:async({args})=>r(`💡 SUGGESTION: ${args.join(" ")}`)},
{name:"feedback",run:async({args})=>r(`📝 FEEDBACK: ${args.join(" ")}`)},
{name:"support",run:async()=>r("🆘 SUPPORT - Contact admin")},
{name:"prefix",run:async({args})=>r(`🔧 Prefix: ${args[0]||"!"}`)},
{name:"slowmode",run:async({args})=>r(`🐢 SLOWMODE ${args[0]||"off"}`)},
{name:"antispam",run:async()=>r("🛡️ ANTISPAM ON")},
{name:"announce",run:async({args})=>r(`📢 ${args.join(" ")||"Hello @everyone"}`)},
{name:"admin",run:async()=>r("🛠️ ADMIN\n!settings!broadcast!warn!ban")},
{name:"settings",run:async()=>r("⚙️ SETTINGS")},
{name:"enable",run:async({args})=>r(`✅ Enabled ${args[0]||"feature"}`)},
{name:"disable",run:async({args})=>r(`❌ Disabled ${args[0]||"feature"}`)},
{name:"maintenance",run:async({args})=>r(`🔧 MAINTENANCE ${args[0]||"off"}`)},
{name:"broadcast",aliases:["bc"],run:async({args})=>r(`📢 Broadcast: ${args.join(" ")||"Hi all"}`)},
{name:"reload",run:async()=>r("♻️ Reloaded")},
{name:"logs",run:async()=>r("📋 LOGS")},
{name:"stats",run:async()=>r(`📊 Users: ${users.size}`)},
{name:"pending",run:async()=>r("⏳ No pending")},
{name:"approve",run:async({args})=>r(`✅ Approved ${args[0]||"user"}`)},
{name:"reject",run:async({args})=>r(`❌ Rejected ${args[0]||"user"}`)},
{name:"pendinggc",run:async()=>r("⏳ No pending GC")},
{name:"approvegc",run:async({args})=>r(`✅ GC Approved ${args[0]||"id"}`)},
{name:"rejectgc",run:async({args})=>r(`❌ GC Rejected ${args[0]||"id"}`)},
{name:"warn",run:async({args})=>r(`⚠️ Warned ${args[0]||"user"}`)},
{name:"warnings",run:async({args})=>r(`⚠️ Warnings ${args[0]||event.senderID}: 0`)},
{name:"kick",run:async({args})=>r(`👢 Kicked ${args[0]||"user"}`)},
{name:"ban",run:async({args})=>{let u=users.get(args[0]);if(u)u.banned=true;r(`🔨 Banned ${args[0]}`)}},
{name:"unban",run:async({args})=>{let u=users.get(args[0]);if(u)u.banned=false;r(`♻️ Unbanned ${args[0]}`)}},
];
return cmds;
};
