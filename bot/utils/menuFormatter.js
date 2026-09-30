/**
 * iKON-BOT command menu.
 *
 * There is deliberately **no box** here — the menu is plain Messenger text with
 * styled headings, matching the format requested for every release:
 *
 *   Title     𝙄𝙆𝙊𝙉 𝙈𝘿 - 𝘼𝙇 𝙇𝙄𝙎𝙏𝙎
 *   Headlines _*① ALL PETS & BEASTS_*
 *   Bullets   ◦ .command
 *   Footer    _Type .menu ①_
 *
 * One page per category, in the same order as the 14 plugin folders.
 */

const CATEGORY_GLYPHS = ["①", "②", "③", "④", "⑤", "⑥", "⑦",
  "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭"];

/** The menu title, in the mathematical-styled glyphs used across the bot. */
const MENU_TITLE = "𝙄𝙆𝙊𝙉 𝙈𝘿 - 𝘼𝙇 𝙇𝙄𝙎𝙏𝙎";

/** Separator between pages of the full index. */
const RULE = "━━━━━━━━━━━━━━━";

/**
 * The active command prefix.
 *
 * PREFIX comes from the environment, and some hosts (containers, CI, cron)
 * export PREFIX as a filesystem path — which would render every bullet as
 * "/data/usr/libexec/dog adopt". Only a short, non-path-like token is accepted.
 */
function activePrefix() {
  const raw = String(process.env.PREFIX == null ? "" : process.env.PREFIX).trim();
  if (!raw || raw.length > 2) return "!";
  if (/[\s/\\.:]/.test(raw)) return "!";
  return raw;
}

/**
 * Per-category menu pages.
 *   headline  — the styled `_① TITLE_` line
 *   hint      — one-line description
 *   commands  — the bullets shown on the page
 */
const MENU_PAGES = [
  {
    glyph: "①",
    headline: "_*① ALL PETS & BEASTS_*",
    hint: "50 pets across 7 rarities — adopt, train, evolve, battle.",
    commands: [
      ".adopt [pet]", ".pet", ".petlist", ".petcard [pet]", ".petstats [pet]",
      ".pets", ".petrename [name]", ".petsell [pet]", ".petbuy [pet]", ".petmerge",
      ".feed", ".water", ".play", ".petheal", ".pettrain",
      ".evolve", ".petskill", ".petlevel", ".petxp", ".petluck",
      ".catch", ".pokedex", ".release", ".petbattle", ".petduel",
      ".pokemonlist", ".petspawn", ".pettrade", ".petgift", ".petcollection",
      ".petcompare", ".pettop", ".pethelp", ".petinventory", ".petreset",
      ".petrevive", ".petclone", ".petfavorite", ".petsellall", ".petbreed",
      ".petarena", ".pettrainer", ".petbond", ".petrarity", ".petfull",
      ".petfusion", ".petskin", ".petcage", ".petstamina", ".petfame",
    ],
  },
  {
    glyph: "②",
    headline: "_*② ALL FINANCE VAULT LISTS_*",
    hint: "40 commands — earn, bank, borrow, invest, and grow.",
    commands: [
      ".balance", ".bank", ".wallet", ".cash", ".networth", ".rich",
      ".deposit [amt]", ".withdraw [amt]", ".transfer @user [amt]", ".donate @user [amt]",
      ".daily", ".weekly", ".work", ".beg", ".rob @user",
      ".interest", ".vault", ".banklist", ".loan", ".repay [amt]",
      ".loanlist", ".loanshop", ".buyshop", ".tax", ".taxlist",
      ".invest [amt]", ".buyshares [name]", ".selshares [name]", ".transactions", ".price [name]",
      ".richlist", ".auction", ".refund",
      ".splitbill", ".tip @user [amt]", ".allowance", ".salary", ".claim", ".dailyquest",
      ".financehelp",
    ],
  },
  {
    glyph: "③",
    headline: "_*③ ALL CRIME CITY LISTS_*",
    hint: "40 commands — 16 jobs, 16 weapons, 16 cars, 16 gangs, 16 safehouses.",
    commands: [
      ".gta_jobs", ".gta [1-20]", ".gtalist", ".gtajoblist", ".gtaweaponlist",
      ".gtacarlist", ".gtaganglist", ".gtasafehouselist", ".heist", ".getaway",
      ".smuggle", ".carjack", ".pickpocket", ".fence", ".shoplift",
      ".burglary", ".extortion", ".loanshark", ".armsdeal", ".counterfeit",
      ".blackmarket", ".hijack", ".racket", ".tunnel", ".brassrun",
      ".crownheist", ".crimeweapon", ".crimecar", ".safeshouse", ".wanted",
      ".bust", ".bail", ".crimeboss", ".crimeshop", ".crimeleaderboard",
      ".crimereputation", ".crimehelp", ".crimemission", ".crimequest", ".crimesafehouse",
    ],
  },
  {
    glyph: "④",
    headline: "_*④ ALL CASINO ARCADE GAMES_*",
    hint: "45 commands — 45 arcade games, 15 slot symbols, 15 jackpot tiers.",
    commands: [
      ".slots [amt]", ".blackjack [amt]", ".roulette [amt]", ".coinflip [amt]",
      ".dice [amt]", ".poker [amt]", ".crash", ".mines", ".wheel", ".jackpot",
      ".baccarat", ".keno", ".hilo", ".doubleup", ".luck",
      ".casino", ".gamelist", ".symbollist", ".jackpotlist", ".card",
      ".shuffle", ".hit", ".stand", ".split", ".double",
      ".insurance", ".bet", ".cashout", ".casino_daily", ".casino_weekly",
      ".casino_stats", ".casino_rank", ".casino_leaderboard", ".casinohelp", ".houseedge",
      ".bigsix", ".limo", ".odds", ".payouts", ".tourny",
      ".carddeck", ".slotroll", ".rush", ".ripmode", ".jingle",
    ],
  },
  {
    glyph: "⑤",
    headline: "_*⑤ ALL ADMIN POLICE CONTROLS_*",
    hint: "20 commands — keep the group safe. Admin only.",
    commands: [
      ".admin", ".ban @user", ".unban @user", ".mute @user", ".unmute @user",
      ".addadmin @user", ".removeadmin @user", ".tagall", ".kick @user", ".clear",
      ".lockdown on|off", ".setwelcome [msg]", ".setleave [msg]", ".autoadd on|off",
      ".onlyadminon", ".onlyadminoff", ".removeinactive", ".userinfo @user", ".adminhelp",
      ".checkpol",
    ],
  },
  {
    glyph: "⑥",
    headline: "_*⑥ ALL WARZONE ARSENAL_*",
    hint: "25 commands — 16 weapons, 16 loadouts, 16 vehicles, 16 missions, 16 bosses.",
    commands: [
      ".warzone", ".wzarsenal", ".weaponlist", ".loadoutlist", ".vehiclelist",
      ".wzbosslist", ".deploy",
      ".resupply", ".upgradeweapon", ".raid", ".hold", ".scout",
      ".rescue", ".escort", ".sabotage", ".recover", ".ambush",
      ".retreat", ".warzoneleaderboard", ".warzonestats", ".warzoneloadout", ".arsenal",
      ".warzoneinventory", ".warzonerevive", ".wzrank",
    ],
  },
  {
    glyph: "⑦",
    headline: "_*⑦ ALL AI SYSTEMS_*",
    hint: "30 commands — 16 models, 16 personas, 16 prompt styles.",
    commands: [
      ".ai [prompt]", ".ask [question]", ".chat", ".imagine [prompt]", ".describe [image]",
      ".translate [text]", ".summarize [text]", ".explain [topic]", ".rewrite [text]",
      ".joke", ".story [prompt]", ".poem", ".sayit", ".roast @user",
      ".persona", ".setpersona [name]", ".modellist", ".personalist", ".promptlist", ".aiclear",
      ".aimodels", ".aisystem", ".dalle", ".remix", ".aivideo",
      ".code [task]", ".debug [code]", ".regex [pattern]", ".aistats", ".aihelp",
    ],
  },
  {
    glyph: "⑧",
    headline: "_*⑧ ALL GATHERING RESOURCES_*",
    hint: "20 commands — 16 crops, 16 ores, 16 fish, 16 animals, 16 trees.",
    commands: [
      ".farm", ".plant", ".harvest", ".croplist", ".irrigate",
      ".mine", ".ore", ".orelist", ".dig", ".gem",
      ".fish", ".catchfish", ".fishlist", ".bait", ".angler",
      ".hunt", ".traphunt", ".animal", ".treelist", ".gatherhelp",
    ],
  },
  {
    glyph: "⑨",
    headline: "_*⑨ ALL SOCIAL FUN MOMENTS_*",
    hint: "35 commands — 35 social actions, 35 group games, 15 jokes.",
    commands: [
      ".hug @user", ".kiss @user", ".handshake @user", ".highfive @user",
      ".wave @user", ".bow", ".salute", ".dance",
      ".pat @user", ".tickle @user", ".poke @user", ".blush",
      ".shout", ".sing", ".pose", ".flex",
      ".toast", ".confess", ".compliment @user", ".roastsocial @user", ".gossip",
      ".socialactions", ".fun", ".truthordare", ".wyr", ".nhie", ".charades",
      ".ttyl", ".riddle", ".8ball", ".fortune",
      ".socialhelp", ".jokes", ".hugall", ".kissall",
    ],
  },
  {
    glyph: "⑩",
    headline: "_*⑩ ALL BUSINESS CRYPTO ESTATES_*",
    hint: "35 commands — 16 businesses, 16 properties, 16 coins, 16 stocks, 16 upgrades.",
    commands: [
      ".business", ".businesslist", ".buybusiness", ".businessinfo", ".takecash",
      ".upgradebusiness", ".buybusinesslevel", ".businessstats", ".properties", ".propertylist",
      ".buyproperty", ".propertyinfo", ".upgradeproperty", ".upgradelist", ".estate", ".networthestate",
      ".crypto", ".cryptolist", ".buycrypto", ".sellcrypto", ".cryptoprice",
      ".portfolio", ".stocks", ".stocklist", ".buystock", ".sellstock",
      ".stockprice", ".dividend", ".market", ".estatehelp", ".broker",
      ".offermarket", ".buyoffer", ".collectrent", ".rentincome",
    ],
  },
  {
    glyph: "⑪",
    headline: "_*⑪ ALL LEVELS & RANKS_*",
    hint: "20 commands — 16 ranks, 16 titles, 16 achievements, 25 quests, 16 badges.",
    commands: [
      ".level", ".xp", ".rank", ".ranklist", ".titlelist",
      ".mytitle", ".settitle", ".achievement", ".achievementlist", ".badgelist",
      ".quest", ".questlist", ".myquests", ".claimquest", ".xplog",
      ".progress", ".levelup", ".prestige", ".rankleaderboard", ".levelhelp",
    ],
  },
  {
    glyph: "⑫",
    headline: "_*⑫ ALL INVENTORY CRAFT LISTS_*",
    hint: "25 commands — 16 weapons, 16 armour, 16 materials, 20 recipes.",
    commands: [
      ".inventory", ".weapon", ".wplist", ".armour", ".armourlist",
      ".materiallist", ".recipelist", ".craft", ".brew", ".smelt",
      ".equip", ".unequip", ".use", ".drop", ".sellitem",
      ".buyitem", ".shop", ".gift @user", ".storage", ".weight",
      ".iteminfo", ".loadout", ".enchant", ".upgradeitem", ".invhelp",
    ],
  },
  {
    glyph: "⑬",
    headline: "_*⑬ ALL WORLD EVENTS_*",
    hint: "25 commands — 16 bosses, 16 map locations, 16 NPCs, 16 worlds.",
    commands: [
      ".world", ".worldboss", ".bosslist", ".explore", ".map",
      ".location", ".maplist", ".travel", ".npc", ".npclist",
      ".worldlist", ".dimension", ".teleport", ".weather", ".time",
      ".event", ".eventlist", ".dailEvent", ".weeklyevent", ".eventboss",
      ".treasure", ".dungeon", ".portal", ".realm", ".announce",
    ],
  },
  {
    glyph: "⑭",
    headline: "_*⑭ ALL SYSTEM CORE_*",
    hint: "20 commands — bot control, plugin management, rules, and support.",
    commands: [
      ".menu", ".menu ①", ".commands", ".plugins", ".pluginreload",
      ".pluginenable", ".plugindisable", ".commandcount", ".ping", ".uptime",
      ".status", ".version", ".owner", ".invite", ".support",
      ".rules", ".guide", ".language", ".timezone", ".systemhelp",
    ],
  },
];

/** The headline hint always states the real command count. */
function hintFor(page) {
  const count = page.commands.length;
  if (page.baseHint) return `${page.baseHint} _(${count} commands)_`;
  return `${count} commands.`;
}

/** The "here's everything" page — all 14 headlines, no bullets. */
function renderIndex() {
  const lines = [MENU_TITLE, ""];
  for (const page of MENU_PAGES) {
    lines.push(page.headline);
    lines.push(`   ${hintFor(page)}`);
  }
  lines.push("");
  lines.push(`_Type ${activePrefix()}menu ①_`);
  return lines.join("\n");
}

/** A single category page. */
function renderPage(pageNumber) {
  const index = Math.max(1, Math.min(MENU_PAGES.length, Number(pageNumber) || 1)) - 1;
  const page = MENU_PAGES[index];
  const prefix = activePrefix();
  const lines = [MENU_TITLE, "", page.headline, `   ${hintFor(page)}`, ""];
  for (const command of page.commands) lines.push(`◦ ${prefix}${command.slice(1)}`);
  lines.push("");
  lines.push(RULE);
  lines.push(`_Type ${prefix}menu ${page.glyph}_`);
  return lines.join("\n");
}

/**
 * Resolve a page argument. Accepts "3", "③", "menu3", "menu 3".
 * Returns { index, glyph } or null.
 */
function parsePage(raw) {
  if (raw == null || raw === "") return { index: 1, glyph: CATEGORY_GLYPHS[0] };
  const text = String(raw).trim().toLowerCase();
  const glyphIndex = CATEGORY_GLYPHS.indexOf(text);
  if (glyphIndex >= 0) return { index: glyphIndex + 1, glyph: CATEGORY_GLYPHS[glyphIndex] };
  const numeric = Number(text.replace(/^menu/, "").replace(/[^0-9]/g, ""));
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= MENU_PAGES.length) {
    return { index: numeric, glyph: CATEGORY_GLYPHS[numeric - 1] };
  }
  return null;
}

/** Full page list, used by `.guide` and the canvas menu renderer. */
function getPages() {
  return MENU_PAGES;
}

/** Look up a page by its category key (e.g. "petLabs"). */
function getPageByKey(key) {
  const map = {
    petLabs: 1, financeVault: 2, crimeGta: 3, casinoArcade: 4,
    adminPolice: 5, warzone: 6, aiSystems: 7, gather: 8, socialFun: 9,
    businessCryptoEstate: 10, levelRank: 11, inventoryCraft: 12,
    eventsWorld: 13, systemCore: 14,
  };
  const index = map[key];
  return index ? MENU_PAGES[index - 1] : null;
}

/** Title + headline for a category key — used by the per-category help commands. */
function categoryHeadline(key) {
  const page = getPageByKey(key);
  return page ? page.headline : `_${key}_`;
}

module.exports = {
  MENU_TITLE,
  MENU_PAGES,
  CATEGORY_GLYPHS,
  RULE,
  renderIndex,
  renderPage,
  parsePage,
  getPages,
  getPageByKey,
  categoryHeadline,
};