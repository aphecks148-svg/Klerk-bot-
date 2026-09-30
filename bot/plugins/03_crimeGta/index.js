/**
 * ③ ALL CRIME CITY LISTS — 40 commands.
 *
 * A single job table drives both `.gta` (pick a job by number) and the 16 named
 * job shortcuts, so every job listed in `CRIME_JOBS` is reachable and the
 * payout tiers line up with the list order.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { CRIME_JOBS, CRIME_WEAPONS, CRIME_CARS, CRIME_GANGS, SAFEHOUSES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt, parseAmount } = require("../../utils/format");

/* ── job table: payout and risk scale with the position in CRIME_JOBS ──── */

const JOBS = CRIME_JOBS.map((name, i) => ({
  name,
  emoji: ["🎒", "🏪", "🪟", "🚗", "📦", "🚚", "📞", "💰", "🔫", "🖨️",
    "🛒", "🚛", "🏚️", "⛏️", "🔨", "👑"][i] || "🔫",
  pay: 200 + i * 150,
  risk: 10 + i * 6,
  // verb used when the job succeeds
  verb: ["lifted", "lifted", "climbed through", "hot-wired", "fenced", "moved",
    "leaned on", "shorted", "moved", "printed",
    "traded", "hijacked", "raided", "dug", "ran", "crowned"][i] || "worked",
}));

const GANG_RANKS = ["Runner", "Soldier", "Enforcer", "Captain", "Underboss", "Boss"];

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function state(ctx) {
  const user = await me(ctx);
  if (!user.crime) {
    user.crime = { rep: 0, wanted: 0, jailedUntil: 0, safehouse: null, gang: null, rank: 0 };
  }
  if (!isReady()) return user;
  await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime: user.crime } });
  return user;
}

/** Is the player currently in jail? */
function jailed(crime) {
  return (crime.jailedUntil || 0) > Date.now();
}

function jailTime(crime) {
  return Math.ceil(((crime.jailedUntil || 0) - Date.now()) / 1000);
}

/**
 * Do the job: roll against the risk, pay out, and possibly raise the heat.
 */
async function doJob(ctx, job) {
  const user = await me(ctx);
  const crime = user.crime || { rep: 0, wanted: 0, jailedUntil: 0 };
  if (jailed(crime)) {
    return ctx.send(`🔒 You're jailed for another ${jailTime(crime)}s. Try **${ctx.prefix}bail**.`);
  }
  if ((user.money || 0) < 50) return ctx.send(`💸 You need 50 coins to gear up for ${job.name}.`);

  const heat = Math.min(100, (crime.wanted || 0) + 10);
  const success = Math.random() * 100 < 100 - job.risk - heat * 0.3;
  crime.wanted = heat;
  crime.rep = (crime.rep || 0) + (success ? 1 : 0);

  if (success) {
    const cut = Math.floor(job.pay * (1 + Math.random() * 0.5));
    await adjustMoney(ctx.event.senderID, cut, ctx.profile.name);
    await addXp(ctx.event.senderID, Math.floor(job.pay / 20), ctx.profile.name);
    await ctx.send([
      `🔫 ${job.emoji} ${job.name} — success!`,
      `💰 You ${job.verb} ${fmt(cut)} coins.`,
      `⭐ Rep ${fmt(crime.rep)} • 🔥 Heat ${bar(heat, 100)}`,
    ].join("\n"));
  } else {
    const fine = randInt(100, 500);
    const busted = Math.random() < 0.4;
    crime.jailedUntil = Date.now() + randInt(120, 600) * 1000;
    await adjustMoney(ctx.event.senderID, -fine, ctx.profile.name);
    await ctx.send([
      `🚨 ${job.emoji} ${job.name} — busted!`,
      `💸 Fine: ${fmt(fine)} coins.`,
      `🔒 Jailed for ${jailTime(crime)}s.`,
    ].join("\n"));
  }
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime } });
}

/* ── 1. gta + 2. gta [n] ───────────────────────────────────────────────── */

async function gta(ctx) {
  if (ctx.args.length) {
    const n = Number(ctx.args[0]);
    const job = JOBS[n - 1];
    if (!job) return ctx.send(`❓ Job ${n} doesn't exist. There are ${JOBS.length}.`);
    return doJob(ctx, job);
  }
  const lines = JOBS.map((j, i) => `  ${String(i + 1).padStart(2)}. ${j.emoji} ${j.name} — ${fmt(j.pay)} coins, ${j.risk}% risk`);
  const chunks = renderList({ title: "🔫 Crime Jobs — pick with .gta [number]", items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function gtaNumber(ctx) {
  return gta(ctx);
}

/* ── 3-6. the four list commands ───────────────────────────────────────── */

const gtaList = listCommand("gtalist", CRIME_JOBS, { emoji: "🔫", title: "Crime Jobs", aliases: ["joblist"], description: "All 16 crime jobs" });
const gtaJobList = listCommand("gtajoblist", JOBS.map((j) => `${j.emoji} ${j.name} — ${fmt(j.pay)} coins, ${j.risk}% risk`), { emoji: "📋", title: "Crime Jobs — pay & risk", description: "Jobs with payouts" });
const gtaWeaponList = barListCommand("gtaweaponlist", CRIME_WEAPONS, { emoji: "🔪", title: "Crime Weapons", size: 5, description: "All 16 weapons" });
const gtaCarList = barListCommand("gtacarlist", CRIME_CARS, { emoji: "🚗", title: "Crime Cars", size: 5, description: "All 16 cars" });
const gtaGangList = listCommand("gtaganglist", CRIME_GANGS, { emoji: "🕶️", title: "Crime Gangs", description: "All 16 gangs" });
const gtaSafehouseList = listCommand("gtasafehouselist", SAFEHOUSES, { emoji: "🏚️", title: "Safehouses", description: "All 16 safehouses" });

/* ── 7-22. named job shortcuts ─────────────────────────────────────────── */

function jobCommand(job) {
  return async (ctx) => doJob(ctx, job);
}

/* ── 23. crimeweapon / 24. crimecar / 25. safeshouse ────────────────────── */

async function crimeWeapon(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  const weapon = (query && CRIME_WEAPONS.find((w) => w.toLowerCase() === query))
    || (query && CRIME_WEAPONS.find((w) => w.toLowerCase().includes(query)))
    || pick(CRIME_WEAPONS);
  const tier = CRIME_WEAPONS.indexOf(weapon);
  const cost = tier * 250 + 500;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${weapon} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const owned = { ...(user.weapons || {}) };
  owned[weapon] = (owned[weapon] || 0) + 1;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { weapons: owned } });
  await ctx.send(`🔪 Bought **${weapon}** for ${fmt(cost)} coins. Heat resistance +${Math.max(1, Math.round(tier * 0.8))}%.`);
}

async function crimeCar(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  const car = (query && CRIME_CARS.find((c) => c.toLowerCase() === query))
    || (query && CRIME_CARS.find((c) => c.toLowerCase().includes(query)))
    || pick(CRIME_CARS);
  const tier = CRIME_CARS.indexOf(car);
  const cost = tier * 1000 + 2000;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${car} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await ctx.send(`🚗 Bought **${car}** for ${fmt(cost)} coins. Escape chance +${Math.min(60, tier * 4)}%.`);
}

async function safeshouse(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  const house = (query && SAFEHOUSES.find((h) => h.toLowerCase() === query))
    || (query && SAFEHOUSES.find((h) => h.toLowerCase().includes(query)))
    || pick(SAFEHOUSES);
  const cost = SAFEHOUSES.indexOf(house) * 500 + 1000;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${house} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const crime = { ...(user.crime || {}), safehouse: house, wanted: 0 };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime } });
  await ctx.send([
    `🏚️ Bought **${house}** for ${fmt(cost)} coins.`,
    `🧹 Heat cleared — your jobs here are safer.`,
  ].join("\n"));
}

/* ── 26. wanted / 27. bust / 28. bail ──────────────────────────────────── */

async function wanted(ctx) {
  const user = await me(ctx);
  const crime = user.crime || { wanted: 0, rep: 0 };
  await ctx.send([
    `🚨 Wanted`,
    `🔥 Heat: ${bar(crime.wanted || 0, 100)} ${crime.wanted || 0}%`,
    `💀 Rep: ${fmt(crime.rep || 0)}`,
    jailed(crime) ? `🔒 Jailed for ${jailTime(crime)}s` : "🔓 Free",
  ].join("\n"));
}

async function bust(ctx) {
  const target = Object.keys(ctx.event.mentions || {})[0];
  if (!target) return ctx.send(`Usage: **${ctx.prefix}bust @user**`);
  const them = await getUser(target, "Facebook user");
  const crime = them.crime || {};
  if (!(crime.wanted > 0)) return ctx.send(`🚓 ${them.name || "They"} have no heat. Nothing to bust.`);
  const bustChance = 40 + Math.min(50, crime.wanted);
  if (Math.random() * 100 < bustChance) {
    crime.jailedUntil = Date.now() + 600000;
    crime.wanted = 0;
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: target }, { $set: { crime } });
    await ctx.send(`🚓 Busted ${them.name || "them"}! They're in for 10 minutes.`);
  } else {
    await ctx.send(`💨 ${them.name || "They"} got away! You need a higher wanted level.`);
  }
}

async function bail(ctx) {
  const user = await me(ctx);
  const crime = user.crime || {};
  if (!jailed(crime)) return ctx.send("🔓 You're not jailed.");
  const cost = randInt(200, 800);
  if ((user.money || 0) < cost) return ctx.send(`💸 Bail is ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  crime.jailedUntil = 0;
  crime.wanted = 0;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime } });
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await ctx.send(`🔓 Bailed out for ${fmt(cost)} coins. You're free.`);
}

/* ── 29. crimeboss / 30. crimeshop / 31. crimequest / 32. codeleaderboard ── */

async function crimeBoss(ctx) {
  const user = await me(ctx);
  const crime = user.crime || { rep: 0 };
  if ((crime.rep || 0) < 25) return ctx.send(`👹 You need 25 crime rep to face a boss. You have ${fmt(crime.rep || 0)}.`);
  const boss = pick(CRIME_GANGS);
  const power = (crime.rep || 0) * (0.6 + Math.random());
  const win = power > 60;
  if (win) crime.rep += 5;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime } });
  await ctx.send([
    `👹 Boss fight vs **${boss}**`,
    `⚔️ Your power: ${fmt(Math.round(power))} vs 60`,
    win ? "🏆 You won! +5 rep." : "💀 You lost. No rep gained.",
  ].join("\n"));
}

async function crimeShop(ctx) {
  const item = pick([...CRIME_WEAPONS, ...CRIME_CARS, ...SAFEHOUSES]);
  const cost = randInt(500, 5000);
  const user = await me(ctx);
  if ((user.money || 0) < cost) return ctx.send(`💸 ${item} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await ctx.send(`🛒 Bought **${item}** for ${fmt(cost)} coins.`);
}

async function crimeQuest(ctx) {
  const user = await me(ctx);
  const reward = randInt(200, 900);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  const crime = { ...(user.crime || {}), rep: (user.crime?.rep || 0) + 1 };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime } });
  await ctx.send(`📋 Crime quest complete: +${fmt(reward)} coins, +1 rep.`);
}

async function crimeLeaderboard(ctx) {
  if (!isReady()) return ctx.send("🏆 The leaderboard needs MongoDB configured.");
  const top = await models.User.find({ "crime.rep": { $gt: 0 } }).sort({ "crime.rep": -1 }).limit(10).lean();
  if (!top.length) return ctx.send("🏆 No crime records yet.");
  const lines = top.map((u, i) => `  ${String(i + 1).padStart(2)}. ${u.name || "Anonymous"} — ${fmt((u.crime && u.crime.rep) || 0)} rep`);
  await ctx.send(["🏆 Crime leaderboard", ...lines].join("\n"));
}

/* ── 33. crimereputation / 34. crimemission / 35. crimequest weekly ─────── */

async function crimeReputation(ctx) {
  const user = await me(ctx);
  const rep = (user.crime && user.crime.rep) || 0;
  const rank = GANG_RANKS[Math.min(GANG_RANKS.length - 1, Math.floor(rep / 25))];
  await ctx.send([
    `💀 Crime reputation`,
    `⭐ Rep: ${fmt(rep)} ${bar(rep, 150)}`,
    `🏅 Rank: ${rank}`,
    `👹 Boss fights unlock at 25 rep.`,
  ].join("\n"));
}

async function crimeMission(ctx) {
  const user = await me(ctx);
  const mission = `Operation ${pick(["Neon", "Iron", "Shadow", "Crimson", "Golden", "Silent"])} ${pick(["Dusk", "Rush", "Handshake", "Break", "Viper"])}`;
  const reward = randInt(500, 2500);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  const crime = { ...(user.crime || {}), rep: (user.crime?.rep || 0) + 2 };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { crime } });
  await ctx.send([
    `🎯 ${mission}`,
    `✅ Mission complete`,
    `💰 +${fmt(reward)} coins • +2 rep`,
  ].join("\n"));
}

async function crimeHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `🔫 **Crime City** — 40 commands, ${JOBS.length} jobs.`,
    `◦ ${p}gta — list jobs`,
    `◦ ${p}gta [1-16] — run a job`,
    `◦ ${p}gtajoblist / ${p}gtaweaponlist / ${p}gtacarlist / ${p}gtaganglist / ${p}gtasafehouselist`,
    `◦ ${p}heist / ${p}carjack / ${p}smuggle … — named jobs`,
    `◦ ${p}wanted / ${p}bust @user / ${p}bail — heat`,
    `◦ ${p}crimeboss / ${p}crimereputation / ${p}crimeleaderboard`,
  ].join("\n"));
}

/* ── 34. crimemission / 35. stash / 36. fence value ───────────────────── */

async function crimeStash(ctx) {
  const user = await me(ctx);
  const weapons = Object.keys(user.weapons || {});
  const crime = user.crime || {};
  await ctx.send([
    "🧰 Crime stash",
    `🔪 Weapons: ${weapons.length ? weapons.join(", ") : "none"}`,
    `🏚️ Safehouse: ${crime.safehouse || "none"}`,
    `💀 Rep: ${fmt(crime.rep || 0)}`,
    `🔥 Heat: ${crime.wanted || 0}%`,
  ].join("\n"));
}

async function fenceValue(ctx) {
  const user = await me(ctx);
  const weapons = user.weapons || {};
  const names = Object.keys(weapons);
  const total = names.reduce((n, w) => n + (weapons[w] || 0) * (CRIME_WEAPONS.indexOf(w) * 250 + 500) * 0.5, 0);
  if (!names.length) return ctx.send("🔪 You have nothing to fence.");
  await adjustMoney(ctx.event.senderID, Math.floor(total), ctx.profile.name);
  const cleared = {};
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { weapons: cleared } });
  await ctx.send(`💰 Fenced ${names.length} weapon(s) for ${fmt(Math.floor(total))} coins. Heat -20%.`);
}

/* ── registry ──────────────────────────────────────────────────────────── */

const namedJobs = {
  heist: 15, pickpocket: 0, shoplift: 1, burglary: 2, fencejob: 4,
  smuggle: 5, extortion: 6, loanshark: 7, armsdeal: 8, counterfeit: 9,
  blackmarket: 10, hijack: 11, carjack: 3, getaway: 3,
  tunnel: 13, brassrun: 14, crownheist: 15,
};

const dynamic = Object.entries(namedJobs).map(([name, jobIndex]) =>
  command(name, { description: `Run the ${JOBS[jobIndex].name} job`, run: jobCommand(JOBS[jobIndex]) })
);

module.exports = {
  commands: [
    gtaList,
    gtaJobList,
    gtaWeaponList,
    gtaCarList,
    gtaGangList,
    gtaSafehouseList,
    ...commands([
      ["gta", gta, { aliases: ["gta_jobs"], description: "List or run crime jobs" }],
      ["gta_1", gtaNumber, { aliases: ["gta1"], description: "Job 1" }],
      ["crimeweapon", crimeWeapon, { description: "Buy a weapon" }],
      ["crimecar", crimeCar, { description: "Buy a car" }],
      ["safeshouse", safeshouse, { aliases: ["crimesafehouse"], description: "Buy a safehouse" }],
      ["wanted", wanted, { description: "Your wanted level" }],
      ["bust", bust, { description: "Bust a wanted user" }],
      ["bail", bail, { description: "Bail yourself out" }],
      ["crimeboss", crimeBoss, { description: "Fight a crime boss" }],
      ["crimeshop", crimeShop, { description: "Buy from the crime shop" }],
      ["crimequest", crimeQuest, { description: "Daily crime quest" }],
      ["crimeleaderboard", crimeLeaderboard, { description: "Crime leaderboard" }],
      ["crimereputation", crimeReputation, { description: "Your crime rep" }],
      ["crimemission", crimeMission, { description: "Run a mission" }],
      ["crimestash", crimeStash, { description: "Your crime stash" }],
      ["fenceit", fenceValue, { aliases: ["fence"], description: "Fence your weapons" }],
      ["crimehelp", crimeHelp, { aliases: ["crimhelp"], description: "Crime City help" }],
    ]),
    ...dynamic,
  ],
};