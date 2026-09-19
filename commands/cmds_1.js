"use strict";

module.exports=[
{name:"profile",aliases:["me"],category:"profile",submenu:"Profile",description:"View your profile and stats",execute:({event,send})=>send(`👤 PROFILE\n🆔 UID: ${event.senderID}\n⭐ Level: 1\n✨ XP: 0\n🏆 Prestige: 0`)},

{name:"uid",aliases:[],category:"profile",submenu:"Profile",description:"Show your Messenger UID",execute:({event,send})=>send(`🆔 Your UID:\n${event.senderID}`)},

{name:"ping",aliases:[],category:"utility",submenu:"Utilities",description:"Check bot status",execute:({send})=>send("🏓 PONG!\n✅ Klerk is online.")},

{name:"stats",aliases:[],category:"profile",submenu:"Profile",description:"Show bot statistics",execute:({commands,send})=>send(`📊 KLERK STATS\n📦 Commands: ${commands.length}\n⚡ Status: ONLINE`)},

{name:"level",aliases:["lvl"],category:"progression",submenu:"Progression",description:"View your level",execute:({send})=>send("⭐ LEVEL 1/1000\n✨ XP: 0/100\n🏆 Prestige: 0")},

{name:"prestige",aliases:["rebirth"],category:"progression",submenu:"Progression",description:"View prestige system",execute:({send})=>send("🏆 PRESTIGE\nReach Level 1000 to unlock Prestige.")},

{name:"achievements",aliases:["achieve"],category:"progression",submenu:"Progression",description:"View achievements",execute:({send})=>send("🏅 ACHIEVEMENTS\nComplete missions, battles, jobs and challenges to unlock achievements.")},

{name:"rank",aliases:[],category:"progression",submenu:"Progression",description:"View your dynamic rank",execute:({send})=>send("🏆 RANK\nYour rank is calculated from level, XP, prestige and achievements.")},

{name:"jobs",aliases:["job"],category:"jobs",submenu:"Jobs",description:"View available jobs",execute:({send})=>send("💼 JOBS\n1. Farmer\n2. Miner\n3. Fisherman\n4. Hunter\n5. Mechanic\n6. Driver\n7. Chef\n8. Police Officer\n9. Merchant\n10. Engineer")},

{name:"missions",aliases:["mission"],category:"missions",submenu:"Missions",description:"View missions",execute:({send})=>send("🎯 MISSIONS\n20 missions are available.\nUse !mission <id> to inspect one.")},

{name:"hint",aliases:["helpme"],category:"utility",submenu:"Utilities",description:"Get command help",execute:({send})=>send("💡 TIP\nUse !menu to view commands.\nUse !help <command> for command details.")},

{name:"introduce",aliases:["intro"],category:"social",submenu:"Social",description:"Introduce yourself",execute:({event,send})=>send(`👋 Hello everyone!\nGive a warm welcome to UID ${event.senderID}! ❤️`)},

{name:"wave",aliases:[],category:"social",submenu:"Social",description:"Wave at the group",execute:({send})=>send("👋 WAVE!\nHello everyone! 😎")},

{name:"hug",aliases:[],category:"social",submenu:"Social",description:"Send a hug",execute:({send})=>send("🤗 *sends a big hug* ❤️")},

{name:"highfive",aliases:["high5"],category:"social",submenu:"Social",description:"Give a high five",execute:({send})=>send("🙌 HIGH FIVE! 🔥")},

{name:"joke",aliases:[],category:"social",submenu:"Social",description:"Tell a joke",execute:({send})=>send("😂 Why did the bot cross the road?\nBecause someone typed !run. 🤖")},

{name:"truth",aliases:[],category:"social",submenu:"Social",description:"Truth challenge",execute:({send})=>send("🎭 TRUTH\nAsk me a truth question.")},

{name:"dare",aliases:[],category:"social",submenu:"Social",description:"Dare challenge",execute:({send})=>send("🔥 DARE\nChallenge accepted. Give me your dare.")},

{name:"love",aliases:["crush","ship"],category:"social",submenu:"Social",description:"Check relationship fun",execute:({send,args})=>send(`❤️ LOVE CHECK\n${args.length?args.join(" "):"You"} 💕 Klerk says: 100% vibes!`)},

{name:"roast",aliases:[],category:"social",submenu:"Social",description:"Get a playful roast",execute:({send})=>send("🔥 ROAST\nYou're so early to the menu that even the loading bar is waiting for you. 😂")},

{name:"compliment",aliases:["compliment_ai"],category:"social",submenu:"Social",description:"Receive a compliment",execute:({send})=>send("✨ You're officially part of the Klerk Community. 👑")},

{name:"football",aliases:["soccer"],category:"games",submenu:"Arcade",description:"Play football game",execute:({send})=>send("⚽ FOOTBALL\nChoose: attack, defend or pass.")},

{name:"quiz",aliases:[],category:"games",submenu:"Arcade",description:"Start a quiz",execute:({send})=>send("🧠 QUIZ\nQuestion: What is the capital of Ghana?\nReply with your answer.")},

{name:"coinflip",aliases:["coin"],category:"games",submenu:"Casino",description:"Flip a coin",execute:({send})=>send(`🪙 COIN FLIP\n${Math.random()<.5?"HEADS":"TAILS"}!`)},

{name:"dice",aliases:["dice_roll"],category:"games",submenu:"Casino",description:"Roll dice",execute:({send})=>send(`🎲 DICE: ${Math.floor(Math.random()*6)+1}`)}
];
