const { box } = require("./box");

const menuTemplates = {
  menu1: {
    emoji: "🐾",
    title: "PET LABS & CREATURES",
    subtitle: "Adopt, train, and care for divine pets 🐶🐱🦊",
    sections: [
      { header: "🐶 ADOPTION & BASICS", commands: ["!adopt [name] - Adopt a new pet", "!pet_list - Browse 50+ divine pets", "!petcard [name] - View pet details", "!petstats - Check your pet's stats", "!pet - Current pet info"] },
      { header: "🍖 PET CARE", commands: ["!feed - Feed your pet (hunger -20%)", "!water - Give water (thirst -30%)", "!petheal - Heal your pet (HP +50)", "!petsafe - Lock pet in safe", "!petrename [name] - Rename pet"] },
      { header: "💪 TRAINING & EVOLUTION", commands: ["!pettrain - Train your pet (+XP)", "!evolve - Evolve pet (Lv5+, 1000 coins)", "!petbattle - Battle with pet", "!battle - Battle opponent's pet", "!pokedex - Your caught pokemon"] },
      { header: "🎮 POKEMON SYSTEM", commands: ["!catch - Catch wild pokemon", "!pokemon_list - All 151 pokemon", "!release - Release a pet", "!use - Use pet ability", "!give_pet [@user] - Gift pet to friend"] },
    ],
    cooldowns: "Feed: 30s | Water: 30s | Battle: 3s | Evolve: 1d",
    tips: "💡 Tips: Feed pet to keep happiness up! Evolve increases HP & damage. Bank protects pets!",
  },
  menu2: {
    emoji: "💰",
    title: "FINANCE VAULT & ECONOMY",
    subtitle: "Earn, save, invest & grow your wealth 💸💵💎",
    sections: [
      { header: "💵 EARN COINS", commands: ["!daily - Daily reward (500 coins, 24h CD)", "!work - Work shift (100 coins, 30s CD)", "!weekly - Weekly bonus (1000 coins, 7d CD)", "!beg - Beg for coins (10-50 random)", "!farm - Farm crops (50 coins, 30s CD)"] },
      { header: "🏦 BANKING", commands: ["!balance - Check wallet & bank", "!deposit [amount] - Save coins", "!withdraw [amount] - Take from bank", "!bank - Bank info & interest rates", "!vault - Vault protection details"] },
      { header: "📈 INVESTING & MARKET", commands: ["!invest [amount] - Invest in stocks", "!stock - View stock portfolio", "!crypto - Crypto wallet", "!portfolio - Full investment report", "!rich - Richest users"] },
      { header: "📋 ECONOMY", commands: ["!transfer [@user] [amount] - Send money", "!loan - Take a loan", "!tax - View tax bracket", "!networth - Total net worth", "!economy - Command guide"] },
    ],
    cooldowns: "Daily: 24h | Weekly: 7d | Work/Farm/Beg: 30s | Transfer: 30s",
    tips: "💡 Tips: Deposit in the bank for interest! Invest in stocks & crypto. Complete quests for bonus XP!",
  },
  menu3: {
    emoji: "🔫",
    title: "CRIME GTA",
    subtitle: "Heists, crimes & street racing 🚓💨",
    sections: [
      { header: "💀 CRIME JOBS", commands: ["!pickpocket - Steal wallets", "!shoplift - Grab & go", "!burglary - Break in", "!smuggling - Move goods", "!bankjob - Big score"] },
      { header: "🚗 STREET RACING", commands: ["!garage - View your cars", "!carshop - Dealership", "!buycar [name] - Buy vehicle", "!sellcar [name] - Sell vehicle", "!race - Street race"] },
      { header: "💥 HEISTS & CREW", commands: ["!heist - Heist menu", "!planheist [target] - Plan job", "!crew - Your crew", "!joinheist - Join a heist", "!startheist - Begin heist"] },
      { header: "📊 UNDERWORLD", commands: ["!wanted - Wanted level", "!escape - Lose the cops", "!launder - Clean money", "!blackmarket - Black market", "!underworldrank - Crime rank"] },
    ],
    cooldowns: "Crime jobs: 30s | Heist: 1m | Race: 30s",
    tips: "💡 Tips: Plan heists with friends! Bigger crews = bigger payouts. Stay wanted low!",
  },
  menu4: {
    emoji: "🎰",
    title: "CASINO ARCADE",
    subtitle: "Luck, skill & high-stakes gambling 🃏🎲",
    sections: [
      { header: "🎰 CASINO GAMES", commands: ["!slots [bet] - Spin the reels", "!blackjack [bet] - 21", "!roulette [bet] [color] - Wheel", "!coinflip [bet] [call] - Heads/Tails", "!gamble [bet] - Quick bet"] },
      { header: "🎲 DICE & CARDS", commands: ["!dice [bet] - Roll dice", "!poker [bet] - Draw poker", "!baccarat [bet] - Punto banco", "!crash - Multiplier crash", "!mines - Minefield"] },
      { header: "💎 JACKPOT & LOTTERY", commands: ["!jackpot - Daily jackpot", "!lottery [ticket] - Buy ticket", "!scratch - Scratch card", "!spin - Wheel spin", "!casinostats - Casino stats"] },
      { header: "📊 CASINO INFO", commands: ["!highroll [bet] - High roller", "!allin [bet] - Go all in", "!doubleup - Double or nothing", "!risk [bet] - Risky bet", "!safelay [bet] - Safe play"] },
    ],
    cooldowns: "Casino games: 3s | Daily bonus: 24h",
    tips: "💡 Tips: The house always wins... but you can too! Check your casino stats with !casinostats.",
  },
  menu5: {
    emoji: "🛡️",
    title: "ADMIN POLICE",
    subtitle: "Server management & moderation 🚨👮",
    sections: [
      { header: "🛠️ MODERATION", commands: ["!ban [@user] - Ban user", "!unban [@user] - Unban user", "!kick [@user] - Kick user", "!mute [@user] - Mute user", "!warn [@user] - Warn user"] },
      { header: "⚙️ ADMIN TOOLS", commands: ["!settings - Bot settings", "!plugin_reload [cat] - Reload plugin", "!plugin_disable [cat] - Disable plugin", "!plugin_enable [cat] - Enable plugin", "!set_prefix [char] - Change prefix"] },
      { header: "📊 STATS & LOGS", commands: ["!view_users - User list", "!audit_log - Audit log", "!logs - System logs", "!backup_mongo - Backup DB", "!pending - Pending actions"] },
      { header: "📡 SYSTEM", commands: ["!broadcast [msg] - Server announcement", "!maintenance [on/off] - Toggle maintenance", "!reload - Reload commands", "!shutdown - Shutdown bot", "!admin_help - Admin help"] },
    ],
    cooldowns: "Moderation: instant | Broadcast: 5m",
    tips: "💡 Tips: Use !settings for admin configuration. Plugin reload doesn't require restart!",
  },
  menu6: {
    emoji: "⚔️",
    title: "WARZONE BATTLE ARENA",
    subtitle: "War, battles, PvP & clan wars ⚔️🛡️🔥",
    sections: [
      { header: "⚔️ COMBAT", commands: ["!war - War menu", "!fight [enemy] - Attack", "!duel [@user] - Duel player", "!raid - Raid boss", "!boss - Summon boss"] },
      { header: "🛡️ GEAR & WEAPONS", commands: ["!weapon - Equip weapon", "!armor - Equip armor", "!shield - Equip shield", "!forge - Forge gear", "!enchant - Enchant gear"] },
      { header: "👥 CLANS & SQUADS", commands: ["!clan - Clan menu", "!party - Form party", "!squad - Create squad", "!tournament - Join tournament", "!arena - Battle arena"] },
      { header: "📊 WAR STATS", commands: ["!war_rank - War leaderboard", "!war_stats - War stats", "!battlepass - Battle pass", "!loot - Loot rewards", "!warhelp - War command help"] },
    ],
    cooldowns: "Combat: 3s | Raid: 1m | Tournament: 1h",
    tips: "💡 Tips: Forge and enchant your gear! Join a clan for team bonuses!",
  },
  menu7: {
    emoji: "🤖",
    title: "AI SYSTEMS & NEURALINK",
    subtitle: "AI chat, image gen & smart assistance 🧠✨",
    sections: [
      { header: "🤖 AI CHAT & ASSIST", commands: ["!ai [prompt] - Ask iKON anything", "!ask [q] - Quick question", "!chat [msg] - Chat with AI", "!explain [topic] - Explain concept", "!summarize [text] - Summarize"] },
      { header: "🎨 IMAGE GENERATION", commands: ["!imagine [prompt] - Generate image", "!image [prompt] - AI image", "!caption - Image caption", "!describe - Describe image", "!artist [style] - Art style"] },
      { header: "💻 CODE & CREATIVE", commands: ["!code [request] - Generate code", "!debug [code] - Fix code", "!rewrite [text] - Rewrite", "!poem [topic] - Write poem", "!story [prompt] - Story"] },
      { header: "🎮 GAMES & UTILITIES", commands: ["!quiz - Trivia quiz", "!trivia - Fun facts", "!riddle - Riddle me", "!weather [city] - Weather", "!translate [text] - Translate"] },
    ],
    cooldowns: "AI: 5s | Imagine: 5s | Quiz: 10s | Translate: 5s",
    tips: "💡 Tips: Powered by Gemini 2.5 Flash! Requires GEMINI_KEY. Try !ai explain recursion to start!",
  },
  menu8: {
    emoji: "⛏️",
    title: "GATHERING & SKILLS",
    subtitle: "Farm, mine, hunt, fish & level up 🌾⛏️🎣",
    sections: [
      { header: "🌾 FARMING & CROPS", commands: ["!farm - Farm crops (+50 coins, +15 XP)", "!plant [crop] - Plant seeds", "!harvest - Harvest crops", "!water - Water plants", "!fertilize - Add fertilizer (+yield)"] },
      { header: "⛏️ MINING & ORE", commands: ["!mine - Mine ore (+50 coins, +15 XP)", "!ore - Check ore types", "!ore_list - All ores (1-50)", "!dig - Dig for treasure", "!chop - Chop wood (+30 coins)"] },
      { header: "🏹 HUNTING & FISHING", commands: ["!hunt - Hunt animals (+50 coins, +15 XP)", "!fish - Go fishing (+50 coins, +15 XP)", "!fish_list - All fish (1-50)", "!gather - Gather resources", "!forage - Forage for items (+30 coins)"] },
      { header: "🧘 TRAINING & SKILLS", commands: ["!meditate - Meditation (+20 XP)", "!explore - Explore world", "!train - Train yourself", "!practice - Practice skill", "!workshop - Skill workshop"] },
    ],
    cooldowns: "Farm/Mine/Hunt/Fish: 30s | Forage: 30s | Meditate: 1m",
    tips: "💡 Tips: Gathering gives coins & XP! Best way to level up. Multiple actions = more XP!",
  },
  menu9: {
    emoji: "❤️",
    title: "SOCIAL & FUN INTERACTIONS",
    subtitle: "Marry, kiss, hug & social games 💕👥🎉",
    sections: [
      { header: "💕 ROMANCE", commands: ["!marry [@user] - Propose marriage", "!divorce - Get divorced", "!couple - View couple status", "!couplecard - Beautiful couple card", "!crush [@user] - Declare a crush"] },
      { header: "👋 PHYSICAL INTERACTIONS", commands: ["!kiss [@user] - Kiss someone 😘", "!hug [@user] - Hug someone 🤗", "!slap [@user] - Slap someone 👋", "!highfive [@user] - High five! 🖐️", "!pat [@user] - Pat someone 🤚"] },
      { header: "❤️ SOCIAL STATUS", commands: ["!love [@user] - Express love", "!ship [@user] [@user2] - Ship two users", "!wave [@user] - Wave at someone", "!compliment [@user] - Compliment", "!flirt [@user] - Flirt with someone"] },
      { header: "👥 FRIEND SYSTEM", commands: ["!friend [@user] - Add friend", "!unfriend [@user] - Remove friend", "!friends - Your friends list", "!follow [@user] - Follow user", "!unfollow [@user] - Unfollow user"] },
    ],
    cooldowns: "Kiss/Hug/Slap: 1s | Marry: instant | Divorce: 5m CD",
    tips: "💡 Tips: Marriages are fun roleplay! Get paired profiles! Block users with !block",
  },
  menu10: {
    emoji: "💼",
    title: "BUSINESS, CRYPTO & REAL ESTATE",
    subtitle: "Start businesses, trade crypto, buy property 🏢📈🏠",
    sections: [
      { header: "🏢 BUSINESS MANAGEMENT", commands: ["!business - Start your business", "!business_list - All business types", "!company - Manage your company", "!startup [name] - Launch startup", "!hire [@user] - Hire employee"] },
      { header: "💼 EMPLOYEE & PAYROLL", commands: ["!fire [@user] - Fire employee", "!employee - Employee info", "!payroll - Pay all employees", "!office - Upgrade office", "!upgrade_business - Upgrade stats"] },
      { header: "📈 CRYPTO & STOCKS", commands: ["!crypto - Cryptocurrency wallet", "!stock - Stock market trading", "!buy_crypto [coin] [amount] - Buy crypto", "!sell_crypto [coin] [amount] - Sell crypto", "!portfolio - View investments"] },
      { header: "🏡 REAL ESTATE", commands: ["!estate - Property portfolio", "!buyhouse - Buy a house", "!sellhouse - Sell property", "!rent - Rent property", "!mortgage - Take mortgage"] },
    ],
    cooldowns: "Business: 1h | Crypto: 5m | Estate: 30m",
    tips: "💡 Tips: Build a business empire! Trade crypto & stocks. Buy your dream mansion! 💰",
  },
};

/**
 * Legacy text menu output — now cleaned up without ugly ASCII boxes.
 */
function formatMenuOutput(pageNum) {
  const page = Math.max(1, Math.min(10, pageNum || 1));
  const menu = menuTemplates[`menu${page}`];
  if (!menu) return null;

  let output = "\n";
  output += `  ✨ ${menu.emoji} ${menu.title} ${menu.emoji} ✨\n`;
  output += `  📖 ${menu.subtitle}\n\n`;

  menu.sections.forEach((section) => {
    output += `${section.header}\n`;
    output += `${"·".repeat(50)}\n`;
    section.commands.forEach((cmd) => {
      output += `  ${cmd}\n`;
    });
    output += "\n";
  });

  output += `⏱️  Cooldowns: ${menu.cooldowns}\n`;
  output += `${menu.tips}\n\n`;
  output += `📄 Page ${page}/10 | Use !menu [1-10] to navigate ✨\n`;
  return output;
}

/**
 * Returns a chat-friendly boxed menu with emojis — no ugly ASCII borders.
 */
function getMenuAsBox(pageNum) {
  const page = Math.max(1, Math.min(10, pageNum || 1));
  const menu = menuTemplates[`menu${page}`];
  if (!menu) return null;

  const lines = [];
  lines.push(`${menu.emoji} ${menu.title.toUpperCase()} ${menu.emoji}`);
  lines.push(`📖 ${menu.subtitle}`);
  lines.push("");

  menu.sections.forEach((section, idx) => {
    lines.push(`▸ ${section.header}`);
    section.commands.forEach((cmd) => lines.push(`  • ${cmd}`));
    if (idx < menu.sections.length - 1) lines.push("");
  });

  lines.push("");
  lines.push(`⏱️  ${menu.cooldowns}`);
  lines.push(menu.tips);
  lines.push("");
  lines.push(`📄 MENU ${page}/10 | !menu [1-10] to navigate`);

  return box(`${menu.emoji} iKON-BOT Command Menu ${page}/10`, lines);
}

module.exports = { menuTemplates, formatMenuOutput, getMenuAsBox };
