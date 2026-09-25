// commands/cmds_11.js
// 🤖 NEURALINK + ⚽ ARENA360 — iKON-BOT
module.exports=({api,event,user,reply,users,profile,fun})=>{
const r=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
user.ai=user.ai||{uses:0,level:1,xp:0};
user.sports=user.sports||{wins:0,losses:0,draws:0,points:0,goals:0};
const cmds=[
{name:"ai",aliases:["artificial"],run:async({args})=>{user.ai.uses++;user.ai.xp+=5;r(`🤖 NEURALINK AI\n👤 ${user.name||user.uid}\n🧠 AI request received.\n💬 ${args.join(" ")||"Ask me something."}\n⭐ AI XP +5`)}},
{name:"ask",aliases:["question","aiask"],run:async({args})=>{user.ai.uses++;r(`🤖 AI ANSWER\n💬 ${args.join(" ")||"Please ask a question."}\n🧠 Neuralink is ready.`)}},
{name:"aichat",aliases:["chat","talkai"],run:async({args})=>{user.ai.uses++;r(`🤖 NEURALINK\nYou said: "${args.join(" ")||"Hello"}"\n🔥 I'm online. Keep the conversation going.`)}},
{name:"aijoke",aliases:["joke"],run:async()=>{let x=["😂 Why did the bot cross the chat? To reach the other thread!","🤣 My code has fewer bugs than my sleep schedule.","💀 Programmer: it works. Bot: until you restart it."];r(x[Math.floor(Math.random()*x.length)])}},
{name:"aifact",aliases:["fact"],run:async()=>{let x=["🧠 Octopuses have three hearts.","🌍 A day on Venus is longer than its year.","⚡ Lightning can heat air to extremely high temperatures.","🐝 Bees can recognize human faces."];r(x[Math.floor(Math.random()*x.length)])}},
{name:"advice",aliases:["aiguide"],run:async({args})=>r(`🧠 AI ADVICE\n${args.join(" ")||"Stay consistent, learn from mistakes, and keep improving."}`)},
{name:"translate",aliases:["tr"],run:async({args})=>r(`🌐 TRANSLATOR\nInput: ${args.join(" ")||"Nothing provided"}\nUse the configured AI translation service for full translation.`)},
{name:"summarize",aliases:["summary"],run:async({args})=>r(`📝 AI SUMMARY\n${args.join(" ")||"Send text to summarize."}`)},
{name:"rewrite",aliases:["rephrase"],run:async({args})=>r(`✍️ AI REWRITE\n${args.join(" ")||"Send text to rewrite."}`)},
{name:"aicode",aliases:["codeai"],run:async({args})=>r(`💻 AI CODER\nRequest: ${args.join(" ")||"Describe the code you need."}`)},
{name:"ailevel",aliases:["aixp"],run:async()=>r(`🤖 AI Level: ${user.ai.level}\n⭐ XP: ${user.ai.xp}\n📊 Requests: ${user.ai.uses}`)},
{name:"aistats",aliases:["aiprofile"],run:async()=>r(`🤖 NEURALINK STATS\n🧠 Uses: ${user.ai.uses}\n⭐ XP: ${user.ai.xp}\n🎯 Level: ${user.ai.level}`)},
{name:"football",aliases:["soccer"],run:async({args})=>r(`⚽ ARENA360\n🔎 ${args.join(" ")||"Use !football <team/player>"}\nLive sports data requires the configured sports API.`)},
{name:"sports",aliases:["sport"],run:async()=>r("⚽ ARENA360\n!football <team>\n!player <name>\n!team <name>\n!fixtures <team>\n!standings <league>\n!scores\n!sportstats")},
{name:"player",aliases:["playerinfo"],run:async({args})=>r(`⚽ PLAYER SEARCH\n🔎 ${args.join(" ")||"Enter a player name."}`)},
{name:"team",aliases:["teaminfo"],run:async({args})=>r(`⚽ TEAM SEARCH\n🔎 ${args.join(" ")||"Enter a team name."}`)},
{name:"fixtures",aliases:["matches"],run:async({args})=>r(`📅 FIXTURES\n🔎 ${args.join(" ")||"Enter a team or league."}`)},
{name:"scores",aliases:["livescores"],run:async()=>r("⚽ LIVE SCORES\nLive results are supplied through the configured sports API.")},
{name:"standings",aliases:["table"],run:async({args})=>r(`🏆 STANDINGS\n🔎 ${args.join(" ")||"Enter a league."}`)},
{name:"sportstats",aliases:["footballstats"],run:async()=>r(`⚽ YOUR ARENA STATS\n🏆 Wins: ${user.sports.wins}\n💀 Losses: ${user.sports.losses}\n🤝 Draws: ${user.sports.draws}\n⭐ Points: ${user.sports.points}\n⚽ Goals: ${user.sports.goals}`)},
{name:"footballquiz",aliases:["soccerquiz"],run:async()=>{let q=[["Who won the 2018 FIFA World Cup?","France"],["How many players start for one football team?","11"],["What card means a player is sent off?","Red"]],x=q[Math.floor(Math.random()*q.length)];r(`⚽ FOOTBALL QUIZ\n❓ ${x[0]}\n💡 Answer: ${x[1]}`)}},
{name:"sportsquiz",aliases:["sportquiz"],run:async()=>{let q=["🏀 Which sport uses a hoop?","🎾 Which sport uses a racket and ball?","⚽ Which sport has a goalkeeper?"];r(`🧠 SPORTS QUIZ\n${q[Math.floor(Math.random()*q.length)]}`)}},
{name:"footballbattle",aliases:["soccerbattle"],run:async({args})=>{let a=Math.floor(Math.random()*5),b=Math.floor(Math.random()*5);r(`⚽ MATCH SIMULATION\n🏠 ${args[0]||"Team A"} ${a} - ${b} ${args[1]||"Team B"}`)}},
{name:"penalty",aliases:["penaltykick"],run:async()=>{let goal=Math.random()<.7;if(goal){user.sports.goals++;r("⚽🥅 GOAL! What a penalty!")}else r("⚽🥅 MISS! The keeper saves it.")}},
{name:"freekick",aliases:["freekickgame"],run:async()=>{let goal=Math.random()<.5;if(goal){user.sports.goals++;r("⚽🔥 FREE KICK GOAL!")}else r("⚽❌ Free kick missed.")}},
{name:"shootout",aliases:["penaltyshootout"],run:async()=>{let score=Math.floor(Math.random()*6),opp=Math.floor(Math.random()*6);if(score>opp){user.sports.wins++;user.sports.points+=3;r(`⚽ SHOOTOUT\nYou ${score} - ${opp} Opponent\n🏆 WIN +3 points`)}else if(score<opp){user.sports.losses++;r(`⚽ SHOOTOUT\nYou ${score} - ${opp} Opponent\n💀 LOSS`)}else{user.sports.draws++;user.sports.points++;r(`⚽ SHOOTOUT\n${score} - ${opp}\n🤝 DRAW +1 point`)}}},
{name:"arena",aliases:["arena360"],run:async()=>r(`⚽ ARENA360\n🏆 Points: ${user.sports.points}\n⚽ Goals: ${user.sports.goals}\n🏆 Wins: ${user.sports.wins}\n💀 Losses: ${user.sports.losses}`)},
{name:"arenastats",aliases:["sportprofile"],run:async()=>r(`⚽ ARENA PROFILE\n🏆 Wins: ${user.sports.wins}\n💀 Losses: ${user.sports.losses}\n🤝 Draws: ${user.sports.draws}\n⭐ Points: ${user.sports.points}`)},
{name:"arenalb",aliases:["sportslb"],run:async()=>{let a=[...users.values()].sort((x,y)=>(y.sports?.points||0)-(x.sports?.points||0)).slice(0,10);r("⚽ ARENA LEADERBOARD\n"+a.map((u,i)=>`${i+1}. ${u.name||u.uid} — ⭐${u.sports?.points||0}`).join("\n"))}},
{name:"goalrank",aliases:["goallb"],run:async()=>{let a=[...users.values()].sort((x,y)=>(y.sports?.goals||0)-(x.sports?.goals||0)).slice(0,10);r("⚽ GOAL LEADERBOARD\n"+a.map((u,i)=>`${i+1}. ${u.name||u.uid} — ⚽${u.sports?.goals||0}`).join("\n"))}},
{name:"sportsdaily",aliases:["arenadaily"],run:async()=>{let n=Math.floor(Math.random()*5000)+1000;user.wallet+=n;user.sports.points++;r(`⚽ DAILY ARENA BONUS\n💰 +$${n.toLocaleString()}\n⭐ +1 point`)}},
{name:"aihelp",aliases:["neuralhelp"],run:async()=>r("🤖 NEURALINK\n!ai !ask !aichat !aijoke !aifact !advice\n!translate !summarize !rewrite !aicode !aistats")},
{name:"arenahelp",aliases:["sportshelp"],run:async()=>r("⚽ ARENA360\n!football !player !team !fixtures !scores\n!standings !footballquiz !penalty !freekick\n!shootout !arena !arenalb !goalrank")},
{name:"neuralrank",aliases:["airank"],run:async()=>{let a=[...users.values()].sort((x,y)=>(y.ai?.xp||0)-(x.ai?.xp||0)).slice(0,10);r("🤖 NEURALINK RANK\n"+a.map((u,i)=>`${i+1}. ${u.name||u.uid} — 🧠${u.ai?.xp||0} XP`).join("\n"))}},
{name:"sportreset",aliases:["resetarena"],run:async()=>{user.sports={wins:0,losses:0,draws:0,points:0,goals:0};r("🔄 Arena statistics reset.")}},
{name:"aireset",aliases:["resetai"],run:async()=>{user.ai={uses:0,level:1,xp:0};r("🔄 AI statistics reset.")}}
];
return cmds;
};
