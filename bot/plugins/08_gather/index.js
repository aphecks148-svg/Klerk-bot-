/**
 * ⑧ ALL GATHERING RESOURCES — 20 commands.
 *
 * Five resource families (crops, ores, fish, animals, trees) share one engine;
 * each list in `lists.js` has 16 entries and every entry is reachable through
 * `gather <type> [name]`.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { CROPS, ORES, FISH, ANIMALS, TREES, GATHER_NODES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt, sample } = require("../../utils/format");

/** Resource families: what they yield, how long they take, what they cost. */
const FAMILIES = {
  crop: { list: CROPS, emoji: "🌾", verb: "harvest", cooldown: 30, value: 120, xp: 12, noun: "crops" },
  ore: { list: ORES, emoji: "⛏️", verb: "mine", cooldown: 30, value: 200, xp: 18, noun: "ores" },
  fish: { list: FISH, emoji: "🎣", verb: "catch", cooldown: 30, value: 160, xp: 15, noun: "fish" },
  animal: { list: ANIMALS, emoji: "🦌", verb: "hunt", cooldown: 45, value: 240, xp: 22, noun: "animals" },
  tree: { list: TREES, emoji: "🌳", verb: "fell", cooldown: 45, value: 180, xp: 16, noun: "trees" },
};

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function saveBag(ctx, bag) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { bag } });
}

/** Value and rarity of an entry, derived from its position in the list. */
const rarityOf = (list, item) => {
  const i = list.indexOf(item);
  return Math.max(1, Math.min(5, Math.ceil(((i + 1) / list.length) * 5)));
};

function bagOf(user) {
  return user.bag || {};
}

/* ── 1. farm ───────────────────────────────────────────────────────────── */

async function farm(ctx) {
  const user = await me(ctx);
  const field = user.field || {};
  const ready = field.readyAt || 0;
  if (Date.now() < ready) {
    const left = Math.ceil((ready - Date.now()) / 1000);
    return ctx.send(`🌱 Your field is still growing. Ready in ${left}s.`);
  }
  const planted = field.planted || pick(CROPS);
  const yieldCount = randInt(2, 5);
  const value = yieldCount * 100;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await addXp(ctx.event.senderID, 12, ctx.profile.name);
  const next = { planted: pick(CROPS), readyAt: Date.now() + 60000 };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { field: next } });
  await ctx.send([
    `🌾 Harvested ${yieldCount}× ${planted}`,
    `💰 +${fmt(value)} coins  ⭐ +12 XP`,
    `🌱 Planted ${next.planted} — ready in 60s.`,
  ].join("\n"));
}

/* ── 2. plant / 3. harvest ──────────────────────────────────────────────── */

async function plant(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  const crop = (query && CROPS.find((c) => c.toLowerCase() === query))
    || (query && CROPS.find((c) => c.toLowerCase().includes(query)))
    || pick(CROPS);
  const cost = 50;
  if ((user.money || 0) < cost) return ctx.send(`💸 Planting costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const field = { planted: crop, readyAt: Date.now() + 60000 };
  if (isReady()) await models.User.findOneAndUpdate({facebookId: ctx.event.senderID }, { $set: { field } });
  await ctx.send(`🌱 Planted **${crop}**. Ready in 60s. (-${cost} coins)`);
}

async function harvest(ctx) {
  const user = await me(ctx);
  const field = user.field || {};
  if (!field.planted) return ctx.send(`🌱 Nothing planted. Use **${ctx.prefix}plant** first.`);
  if (Date.now() < (field.readyAt || 0)) {
    return ctx.send(`⏳ ${field.planted} needs ${Math.ceil(((field.readyAt - Date.now()) / 1000))}s more.`);
  }
  const yieldCount = randInt(2, 5);
  const value = yieldCount * 120;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  const next = { planted: pick(CROPS), readyAt: Date.now() + 60000 };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { field: next } });
  await ctx.send(`🌾 Harvested ${yieldCount}× ${field.planted} for ${fmt(value)} coins. Replanted ${next.planted}.`);
}

/* ── 4. mine / 5. gem ──────────────────────────────────────────────────── */

async function mine(ctx) {
  const user = await me(ctx);
  const node = pick(GATHER_NODES);
  const depth = randInt(1, 5);
  const found = pick(ORES);
  const rarity = rarityOf(ORES, found);
  const amount = randInt(1, 3);
  const value = amount * rarity * 60;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await addXp(ctx.event.senderID, 18, ctx.profile.name);
  const bag = bagOf(user);
  bag[found] = (bag[found] || 0) + amount;
  await saveBag(ctx, bag);
  await ctx.send([
    `⛏️ Mined at ${node} (depth ${depth})`,
    `💎 Found ${amount}× **${found}** ${bar(rarity, 5)}`,
    `💰 +${fmt(value)} coins  ⭐ +18 XP`,
  ].join("\n"));
}

async function gem(ctx) {
  const user = await me(ctx);
  const gems = ORES.filter((o) => rarityOf(ORES, o) >= 4);
  const found = pick(gems);
  const cut = 15 + Math.floor((user.money || 0) * 0.01);
  if ((user.money || 0) < cut) return ctx.send(`💸 A gem cut costs ${fmt(cut)} coins.`);
  await adjustMoney(ctx.event.senderID, -cut, ctx.profile.name);
  const bag = bagOf(user);
  bag[found] = (bag[found] || 0) + 1;
  await saveBag(ctx, bag);
  await ctx.send(`💎 Cut and stored **${found}**. (-${fmt(cut)} coins)`);
}

/* ── 6. fish / 7. bait ─────────────────────────────────────────────────── */

const tackle = new Map();

async function fish(ctx) {
  const user = await me(ctx);
  const spot = pick(GATHER_NODES);
  const rodPower = tackle.get(String(ctx.event.senderID)) || 1;
  const roll = Math.random();
  const rarity = roll < 0.5 ? 1 : roll < 0.8 ? 2 : roll < 0.95 ? 3 : roll < 0.99 ? 4 : 5;
  const pool = FISH.filter((f) => rarityOf(FISH, f) === rarity);
  const found = pick(pool.length ? pool : FISH);
  const amount = randInt(1, 3);
  const value = amount * rarity * 70;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await addXp(ctx.event.senderID, 15, ctx.profile.name);
  const bag = bagOf(user);
  bag[found] = (bag[found] || 0) + amount;
  await saveBag(ctx, bag);
  await ctx.send([
    `🎣 Fishing at ${spot} (rod ×${rodPower})`,
    `🐟 Caught ${amount}× **${found}** ${bar(rarity, 5)}`,
    `💰 +${fmt(value)} coins  ⭐ +15 XP`,
  ].join("\n"));
}

async function bait(ctx) {
  const cost = 100;
  const user = await me(ctx);
  if ((user.money || 0) < cost) return ctx.send(`💸 Bait costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const current = tackle.get(String(ctx.event.senderID)) || 1;
  tackle.set(String(ctx.event.senderID), Math.min(5, current + 1));
  await ctx.send(`🪱 Bought bait. Rod is now ×${tackle.get(String(ctx.event.senderID))} — better odds.`);
}

async function hunt(ctx) {
  const user = await me(ctx);
  const beast = pick(ANIMALS);
  const rarity = rarityOf(ANIMALS, beast);
  const success = Math.random() < 0.6;
  if (!success) {
    return ctx.send(`🏹 You tracked a ${beast} but it bolted. No cost this time.`);
  }
  const value = rarity * 130;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await addXp(ctx.event.senderID, 22, ctx.profile.name);
  const bag = bagOf(user);
  bag[beast] = (bag[beast] || 0) + 1;
  await saveBag(ctx, bag);
  await ctx.send([
    `🏹 Hunted **${beast}** ${bar(rarity, 5)}`,
    `💰 +${fmt(value)} coins  ⭐ +22 XP`,
  ].join("\n"));
}

async function trapHunt(ctx) {
  const cost = 200;
  const user = await me(ctx);
  if ((user.money || 0) < cost) return ctx.send(`💸 Setting a trap costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const trapped = sample(ANIMALS, randInt(1, 3));
  const bag = bagOf(user);
  const lines = [];
  for (const t of trapped) {
    const r = rarityOf(ANIMALS, t);
    bag[t] = (bag[t] || 0) + 1;
    lines.push(`  ${t} ${bar(r, 5)}`);
  }
  await saveBag(ctx, bag);
  await ctx.send([`🪤 Trap caught ${trapped.length}:`, ...lines].join("\n"));
}

async function animal(ctx) {
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) {
    const chunks = renderList({ title: "🦌 Animals", items: ANIMALS, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return;
  }
  const found = ANIMALS.find((a) => a.toLowerCase() === query) || ANIMALS.find((a) => a.toLowerCase().includes(query));
  if (!found) return ctx.send(`❓ No animal called "${query}".`);
  const rarity = rarityOf(ANIMALS, found);
  await ctx.send(`🦌 ${found} — rarity ${bar(rarity, 5)} (${rarity}/5)\n💰 ~${fmt(rarity * 130)} coins`);
}

/* ── 14. chop (tree) ────────────────────────────────────────────────────── */

async function chop(ctx) {
  const user = await me(ctx);
  const tree = pick(TREES);
  const rarity = rarityOf(TREES, tree);
  const logs = randInt(2, 6);
  const value = logs * rarity * 40;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await addXp(ctx.event.senderID, 16, ctx.profile.name);
  const bag = bagOf(user);
  bag[tree] = (bag[tree] || 0) + logs;
  await saveBag(ctx, bag);
  await ctx.send([
    `🌳 Felled **${tree}** ${bar(rarity, 5)}`,
    `🪵 ${logs} logs  💰 +${fmt(value)} coins  ⭐ +16 XP`,
  ].join("\n"));
}

/* ── the list commands ─────────────────────────────────────────────────── */

const cropList = listCommand("croplist", CROPS, { emoji: "🌾", title: "Crops", description: "All 16 crops" });
const oreList = barListCommand("orelist", ORES, { emoji: "⛏️", title: "Ores", size: 5, description: "All 16 ores" });
const fishList = listCommand("fishlist", FISH, { emoji: "🎣", title: "Fish", description: "All 16 fish" });
const treeList = listCommand("treelist", TREES, { emoji: "🌳", title: "Trees", description: "All 16 trees" });

/* ── 15-17. bag / weight / sell ─────────────────────────────────────────── */

async function bag(ctx) {
  const user = await me(ctx);
  const bag = bagOf(user);
  const keys = Object.keys(bag);
  if (!keys.length) return ctx.send("🎒 Your bag is empty. Try **" + ctx.prefix + "mine** or **" + ctx.prefix + "fish**.");
  const lines = keys.map((k) => `  ${k} ×${bag[k]}`);
  await ctx.send([`🎒 Bag (${keys.length} kinds)`, ...lines].join("\n"));
}

async function weight(ctx) {
  const user = await me(ctx);
  const bag = bagOf(user);
  const total = Object.values(bag).reduce((a, b) => a + b, 0);
  const cap = 200 + (user.level || 1) * 25;
  const pct = Math.min(100, Math.round((total / cap) * 100));
  await ctx.send([
    "⚖️ Carry weight",
    `📦 ${fmt(total)} / ${fmt(cap)} ${bar(pct, 100)} ${pct}%`,
    total > cap ? "⚠️ Overloaded — you move slower." : "✅ Within capacity.",
  ].join("\n"));
}

async function sell(ctx) {
  const user = await me(ctx);
  const bag = bagOf(user);
  const query = ctx.args.join(" ").toLowerCase();
  const keys = Object.keys(bag);
  if (!keys.length) return ctx.send("🎒 Nothing to sell.");
  const key = query
    ? keys.find((k) => k.toLowerCase() === query) || keys.find((k) => k.toLowerCase().includes(query))
    : pick(keys);
  if (!key) return ctx.send(`❓ You don't have "${query}".`);
  const qty = bag[key];
  const family = Object.entries(FAMILIES).find(([, f]) => f.list.includes(key));
  const rarity = family ? rarityOf(family[1].list, key) : 3;
  const value = qty * rarity * 50;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  const next = { ...bag };
  delete next[key];
  await saveBag(ctx, next);
  await ctx.send(`💰 Sold ${qty}× ${key} for ${fmt(value)} coins.`);
}

/* ── remaining ─────────────────────────────────────────────────────────── */

async function gatherHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `🌾 **Gathering** — 20 commands, ${CROPS.length} crops, ${ORES.length} ores, ${FISH.length} fish, ${ANIMALS.length} animals, ${TREES.length} trees.`,
    `◦ ${p}farm / ${p}plant / ${p}harvest — crops`,
    `◦ ${p}mine / ${p}dig / ${p}ore / ${p}gem — ores`,
    `◦ ${p}fish / ${p}bait / ${p}angler — fishing`,
    `◦ ${p}hunt / ${p}traphunt / ${p}animal — animals`,
    `◦ ${p}chop — trees`,
    `◦ ${p}croplist / ${p}orelist / ${p}fishlist / ${p}treelist — full lists`,
    `◦ ${p}bag / ${p}weight / ${p}sell — inventory`,
  ].join("\n"));
}

async function gatherNodes(ctx) {
  const chunks = renderList({ title: "🗺️ Gathering nodes", items: GATHER_NODES, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    cropList,
    oreList,
    fishList,
    treeList,
    ...commands([
      ["farm", farm, { cooldown: 30, description: "Harvest your field" }],
      ["plant", plant, { description: "Plant a crop" }],
      ["harvest", harvest, { description: "Harvest a crop" }],
      ["mine", mine, { cooldown: 30, aliases: ["dig"], description: "Mine an ore" }],
      ["gem", gem, { description: "Cut a gem" }],
      ["fish", fish, { cooldown: 30, aliases: ["catchfish"], description: "Go fishing" }],
      ["bait", bait, { description: "Buy better bait" }],
      ["hunt", hunt, { cooldown: 45, description: "Hunt an animal" }],
      ["traphunt", trapHunt, { description: "Set a trap" }],
      ["animal", animal, { description: "Look up an animal" }],
      ["chop", chop, { cooldown: 45, aliases: ["tree"], description: "Chop a tree" }],
      ["bag", bag, { description: "Your resource bag" }],
      ["gatherweight", weight, { aliases: ["load"], description: "Carry weight" }],
      ["sell", sell, { description: "Sell resources" }],
      ["gatherhelp", gatherHelp, { description: "Gathering help" }],
      ["nodes", gatherNodes, { description: "Gathering nodes" }],
    ]),
  ],
};
