/**
 * ⑫ ALL INVENTORY CRAFT LISTS — 25 commands.
 *
 * Sixteen weapons, sixteen armour pieces, sixteen materials and twenty recipes.
 * Crafting consumes materials from the shared inventory; equipment changes your
 * combat power.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { WEAPONS, ARMOUR, MATERIALS, RECIPES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt, parseAmount, sample } = require("../../utils/format");

/** What each recipe needs, by index — cycles through MATERIALS. */
function recipeCost(index) {
  const a = MATERIALS[index % MATERIALS.length];
  const b = MATERIALS[(index * 3 + 5) % MATERIALS.length];
  return [[a, 2], [b, 1]];
}

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function saveInv(ctx, inv) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { inventory: inv } });
}

function invOf(user) {
  return user.inventory || {};
}

function countOf(inv, item) {
  return (inv || []).reduce((n, e) => n + (e.item === item ? (e.qty || 0) : 0), 0);
}

/* ── the four lists ────────────────────────────────────────────────────── */

const weaponList = barListCommand("wplist", WEAPONS, { emoji: "🗡️", title: "Weapons", size: 5, description: "All 16 weapons" });
const armourList = barListCommand("armourlist", ARMOUR, { emoji: "🛡️", title: "Armour", size: 5, description: "All 16 armour pieces" });
const materialList = listCommand("materiallist", MATERIALS, { emoji: "🧱", title: "Materials", description: "All 16 materials" });
const recipeList = listCommand("recipelist", RECIPES, { emoji: "📖", title: "Recipes", description: "All 20 recipes" });

/* ── 5. inventory ──────────────────────────────────────────────────────── */

async function inventory(ctx) {
  const inv = invOf(await me(ctx));
  if (!inv.length) return ctx.send(`🎒 Your inventory is empty.\n◦ ${ctx.prefix}craft [recipe] — make something\n◦ ${ctx.prefix}shop — buy items`);
  const lines = inv.map((e) => `  ${e.item} ×${e.qty}`);
  await ctx.send([`🎒 Inventory (${inv.length} stacks)`, ...lines].join("\n"));
}

/* ── 6. weapon / 7. armour / 8. equip / 9. unequip ───────────────────────── */

async function weapon(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) {
    const chunks = renderList({ title: "🗡️ Weapons", items: WEAPONS, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return;
  }
  const found = WEAPONS.find((w) => w.toLowerCase() === query) || WEAPONS.find((w) => w.toLowerCase().includes(query));
  if (!found) return ctx.send(`❓ No weapon called "${ctx.args.join(" ")}". See **${ctx.prefix}wplist**.`);
  const tier = WEAPONS.indexOf(found);
  const power = 10 + (tier / (WEAPONS.length - 1)) * 90;
  const owned = countOf(invOf(user), found);
  await ctx.send([
    `🗡️ ${found}`,
    `⚔️ Power: ${Math.round(power)} ${bar(Math.ceil(power / 10), 10)}`,
    `🎒 Owned: ${owned}`,
  ].join("\n"));
}

async function armour(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) {
    const chunks = renderList({ title: "🛡️ Armour", items: ARMOUR, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return;
  }
  const found = ARMOUR.find((a) => a.toLowerCase() === query) || ARMOUR.find((a) => a.toLowerCase().includes(query));
  if (!found) return ctx.send(`❓ No armour called "${ctx.args.join(" ")}". See **${ctx.prefix}armourlist**.`);
  const tier = ARMOUR.indexOf(found);
  const power = 10 + (tier / (ARMOUR.length - 1)) * 90;
  await ctx.send(`🛡️ ${found}\n⚔️ Defence: ${Math.round(power)} ${bar(Math.ceil(power / 10), 10)}\n🎒 Owned: ${countOf(invOf(user), found)}`);
}

async function equip(ctx) {
  const user = await me(ctx);
  const item = ctx.args.join(" ").trim();
  const inv = invOf(user);
  if (!inv.length) return ctx.send("🎒 Nothing to equip.");
  const found = item
    ? inv.find((e) => e.item.toLowerCase() === item.toLowerCase() || e.item.toLowerCase().includes(item.toLowerCase()))
    : pick(inv);
  if (!found) return ctx.send(`❓ You don't have "${item}".`);
  const isWeapon = WEAPONS.includes(found.item);
  const isArmour = ARMOUR.includes(found.item);
  if (!isWeapon && !isArmour) return ctx.send(`⚠️ ${found.item} isn't equipment — only weapons and armour can be equipped.`);
  const list = isWeapon ? WEAPONS : ARMOUR;
  const power = Math.round(10 + (list.indexOf(found.item) / (list.length - 1)) * 90);
  const equipped = { ...(user.equipped || {}), [isWeapon ? "weapon" : "armour"]: found.item };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { equipped } });
  await ctx.send(`${isWeapon ? "🗡️" : "🛡️"} Equipped **${found.item}** — ${isWeapon ? "power" : "defence"} ${power} ${bar(Math.ceil(power / 10), 10)}`);
}

async function unequip(ctx) {
  const user = await me(ctx);
  const equipped = { ...(user.equipped || {}) };
  if (!Object.keys(equipped).length) return ctx.send("🎒 Nothing equipped.");
  const slot = ctx.args[0] || Object.keys(equipped)[0];
  if (!equipped[slot]) return ctx.send(`❓ Nothing equipped in "${slot}". You have: ${Object.keys(equipped).join(", ")}`);
  delete equipped[slot];
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { equipped } });
  await ctx.send(`🎒 Unequipped ${slot}.`);
}

/* ── 10. craft ─────────────────────────────────────────────────────────── */

async function craft(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) {
    const chunks = renderList({ title: "📖 Recipes", items: RECIPES, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return ctx.send(`💡 Craft: **${ctx.prefix}craft [recipe]**`);
  }
  const idx = RECIPES.findIndex((r) => r.toLowerCase() === query) >= 0
    ? RECIPES.findIndex((r) => r.toLowerCase() === query)
    : RECIPES.findIndex((r) => r.toLowerCase().includes(query));
  if (idx < 0) return ctx.send(`❓ No recipe called "${ctx.args.join(" ")}". See **${ctx.prefix}recipelist**.`);
  const recipe = RECIPES[idx];
  const cost = recipeCost(idx);
  const inv = invOf(user);
  const missing = cost.filter(([m, n]) => countOf(inv, m) < n);
  if (missing.length) {
    return ctx.send([
      `🧪 Crafting **${recipe}** needs:`,
      ...cost.map(([m, n]) => `  ${m}: ${n - countOf(inv, m)} more`),
      `💡 Buy materials at the **${ctx.prefix}shop**.`,
    ].join("\n"));
  }
  const next = [...inv];
  for (const [m, n] of cost) {
    const entry = next.find((e) => e.item === m);
    entry.qty -= n;
  }
  const cleaned = next.filter((e) => e.qty > 0);
  const out = cleaned.find((e) => e.item === recipe);
  if (out) out.qty += 1;
  else cleaned.push({ item: recipe, qty: 1 });
  await saveInv(ctx, cleaned);
  await addXp(ctx.event.senderID, 20, ctx.profile.name);
  await ctx.send(`🧪 Crafted **${recipe}**! ⭐ +20 XP`);
}

/* ── 11. brew / 12. smelt ──────────────────────────────────────────────── */

async function brew(ctx) {
  const user = await me(ctx);
  const inv = invOf(user);
  if (countOf(inv, "Moonberry") + countOf(inv, "Sunflower") < 2) {
    return ctx.send(`🧪 Brewing needs 2 Moonberry or Sunflower.\nYou have ${countOf(inv, "Moonberry")} / ${countOf(inv, "Sunflower")}.`);
  }
  const potion = pick(["Health Potion", "Mana Elixir", "XP Elixir", "Coolant Flask", "Divine Charm"]);
  const next = inv.filter((e) => !(e.item === "Moonberry" && e.qty >= 2) && !(e.item === "Sunflower" && e.qty >= 2));
  const out = next.find((e) => e.item === potion);
  if (out) out.qty += 1; else next.push({ item: potion, qty: 1 });
  await saveInv(ctx, next);
  await ctx.send(`🧪 Brewed **${potion}**.`);
}

async function smelt(ctx) {
  const user = await me(ctx);
  const inv = invOf(user);
  const query = ctx.args.join(" ").toLowerCase();
  const ore = query
    ? MATERIALS.find((m) => m.toLowerCase() === query) || MATERIALS.find((m) => m.toLowerCase().includes(query))
    : pick(MATERIALS.filter((m) => countOf(inv, m) > 0));
  if (!ore) return ctx.send(`❓ Nothing to smelt. Buy materials at the **${ctx.prefix}shop**.`);
  const have = countOf(inv, ore);
  if (have < 1) return ctx.send(`🎒 You have no ${ore}.`);
  const ingot = pick(MATERIALS.filter((m) => m.includes("Ingot"))) || MATERIALS[0];
  const next = inv.filter((e) => e.item !== ore);
  const out = next.find((e) => e.item === ingot);
  if (out) out.qty += 1; else next.push({ item: ingot, qty: 1 });
  await saveInv(ctx, next);
  await ctx.send(`🔥 Smelted 1× ${ore} into **${ingot}**.`);
}

/* ── 13. use / 14. drop / 15. sellitem / 16. buyitem ────────────────────── */

async function use(ctx) {
  const user = await me(ctx);
  const item = ctx.args.join(" ").trim().toLowerCase();
  const inv = invOf(user);
  const entry = inv.find((e) => e.item.toLowerCase() === item);
  if (!entry) return ctx.send(`🎒 You don't have "${ctx.args.join(" ")}".`);
  const consumable = ["Health Potion", "Mana Elixir", "XP Elixir", "Bread Loaf", "Cheese Wheel", "Torch", "Coolant Flask"];
  if (consumables.includes(entry.item)) {
    const next = inv.filter((e) => e !== entry);
    if (entry.qty > 1) { entry.qty -= 1; next.push(entry); }
    await saveInv(ctx, next);
    if (["XP Elixir"].includes(entry.item)) await addXp(ctx.event.senderID, 100, ctx.profile.name);
    if (["Bread Loaf", "Cheese Wheel"].includes(entry.item)) await adjustMoney(ctx.event.senderID, 50, ctx.profile.name);
    return ctx.send(`✨ Used **${entry.item}**.`);
  }
  if (WEAPONS.includes(entry.item) || ARMOUR.includes(entry.item)) return equip({ ...ctx, args: [entry.item] });
  return ctx.send(`⚠️ ${entry.item} isn't usable. Equip weapons/armour, or craft a consumable.`);
}

const CONSUMABLES = consumableList();
function consumableList() {
  return ["Health Potion", "Mana Elixir", "XP Elixir", "Divine Charm", "Bread Loaf", "Cheese Wheel",
    "Torch", "Coolant Flask", "Smoked Fish", "Roast Meat", "Gem Detector", "Signal Flare",
    "Stealth Cloak", "Lockpick", "Pokeball", "Skill Scroll", "Mystery Box", "Divine Ticket"];
}

async function drop(ctx) {
  const user = await me(ctx);
  const item = ctx.args.join(" ").trim().toLowerCase();
  const inv = invOf(user);
  const entry = inv.find((e) => e.item.toLowerCase() === item);
  if (!entry) return ctx.send(`🎒 You don't have "${ctx.args.join(" ")}".`);
  await saveInv(ctx, inv.filter((e) => e !== entry));
  await ctx.send(`🗑️ Dropped **${entry.item}**.`);
}

async function sellItem(ctx) {
  const user = await me(ctx);
  const item = ctx.args.join(" ").trim();
  const inv = invOf(user);
  const entry = inv.find((e) => e.item.toLowerCase() === item.toLowerCase());
  if (!entry) return ctx.send(`🎒 You don't have "${item}".`);
  const value = (WEAPONS.includes(entry.item) ? 300 : ARMOUR.includes(entry.item) ? 250 : 80) * (entry.qty || 1);
  await saveInv(ctx, inv.filter((e) => e !== entry));
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await ctx.send(`💰 Sold **${entry.item}** for ${fmt(value)} coins.`);
}

async function buyItem(ctx) {
  const user = await me(ctx);
  const item = ctx.args.join(" ").trim();
  if (!item) {
    const chunks = renderList({ title: "🛒 Shop", items: CONSUMABLES, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return ctx.send(`💡 Buy: **${ctx.prefix}buyitem [name]**`);
  }
  const found = CONSUMABLES.find((c) => c.toLowerCase() === item.toLowerCase())
    || CONSUMABLES.find((c) => c.toLowerCase().includes(item.toLowerCase()));
  if (!found) return ctx.send(`❓ Not sold here. See the **${ctx.prefix}buyitem** list.`);
  const qty = parseAmount(ctx.args.filter((a) => /\d/.test(a)).pop()) || 1;
  const cost = (WEAPONS.includes(found) ? 800 : ARMOUR.includes(found) ? 600 : 200) * qty;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${qty}× ${found} costs ${fmt(cost)}. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const inv = invOf(user);
  const entry = inv.find((e) => e.item === found);
  if (entry) entry.qty += qty; else inv.push({ item: found, qty });
  await saveInv(ctx, inv);
  await ctx.send(`🛒 Bought ${qty}× **${found}** for ${fmt(cost)} coins.`);
}

const shop = listCommand("shop", CONSUMABLES, { emoji: "🛒", title: "Shop Stock", description: "Everything for sale" });

/* ── 17-20. storage / weight / loadout ──────────────────────────────────── */

async function storage(ctx) {
  const inv = invOf(await me(ctx));
  const total = inv.reduce((n, e) => n + (e.qty || 0), 0);
  await ctx.send([
    "📦 Storage",
    `🎒 Slots used: ${inv.length}/40 ${bar(inv.length, 40)}`,
    `🔢 Total items: ${fmt(total)}`,
  ].join("\n"));
}

async function weight(ctx) {
  const inv = invOf(await me(ctx));
  const total = inv.reduce((n, e) => n + (e.qty || 0), 0);
  const cap = 150;
  const pct = Math.min(100, Math.round((total / cap) * 100));
  await ctx.send([
    "⚖️ Carry weight",
    `📦 ${fmt(total)} / ${fmt(cap)} ${bar(pct, 100)} ${pct}%`,
    total > cap ? "⚠️ Overloaded — you move slower." : "✅ Comfortably within capacity.",
  ].join("\n"));
}

async function loadout(ctx) {
  const user = await me(ctx);
  const equipped = user.equipped || {};
  await ctx.send([
    "🎽 Current loadout",
    `🗡️ Weapon: ${equipped.weapon || "none"}`,
    `🛡️ Armour: ${equipped.armour || "none"}`,
    "",
    `◦ ${ctx.prefix}equip [item] — equip`,
    `◦ ${ctx.prefix}unequip [slot] — remove`,
  ].join("\n"));
}

async function gift(ctx) {
  const target = Object.keys(ctx.event.mentions || {})[0];
  if (!target) return ctx.send(`Usage: **${ctx.prefix}gift @user [item]**`);
  const user = await me(ctx);
  const item = ctx.args.slice(1).join(" ").trim();
  const inv = invOf(user);
  const entry = inv.find((e) => e.item.toLowerCase() === item.toLowerCase());
  if (!entry) return ctx.send(`🎒 You don't have "${item}".`);
  const { getUser: get } = require("../../utils/economy");
  const them = await get(target, "Facebook user");
  const theirInv = them.inventory || [];
  const out = theirInv.find((e) => e.item === entry.item);
  if (out) out.qty += 1; else theirInv.push({ item: entry.item, qty: 1 });
  if (entry.qty > 1) entry.qty -= 1;
  await saveInv(ctx, inv.filter((e) => e.qty > 0));
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: target }, { $set: { inventory: theirInv } });
  await ctx.send(`🎁 Gave **${entry.item}** to ${them.name || "them"}.`);
}

/* ── 21-25. iteminfo / enchant / upgradeitem / invhelp ──────────────────── */

async function itemInfo(ctx) {
  const item = ctx.args.join(" ").trim();
  if (!item) return ctx.send(`Usage: **${ctx.prefix}iteminfo [item]**`);
  const wi = WEAPONS.findIndex((w) => w.toLowerCase() === item.toLowerCase());
  const ai = ARMOUR.findIndex((a) => a.toLowerCase() === item.toLowerCase());
  const mi = MATERIALS.findIndex((m) => m.toLowerCase() === item.toLowerCase());
  const ri = RECIPES.findIndex((r) => r.toLowerCase() === item.toLowerCase());
  if (wi >= 0) return weapon({ ...ctx, args: [WEAPONS[wi]] });
  if (ai >= 0) return armour({ ...ctx, args: [ARMOUR[ai]] });
  if (mi >= 0) return ctx.send(`🧱 ${MATERIALS[mi]} — a crafting material.\n◦ ${ctx.prefix}smelt ${MATERIALS[mi]} — refine it`);
  if (ri >= 0) {
    const cost = recipeCost(ri);
    return ctx.send([
      `📖 ${RECIPES[ri]}`,
      `🧪 Needs: ${cost.map(([m, n]) => `${n}× ${m}`).join(", ")}`,
    ].join("\n"));
  }
  return ctx.send(`❓ No item called "${item}".`);
}

async function enchant(ctx) {
  const user = await me(ctx);
  const equipped = user.equipped || {};
  const slot = ctx.args[0] || "weapon";
  if (!equipped[slot]) return ctx.send(`🎒 Nothing equipped in "${slot}".`);
  const cost = 1000;
  if ((user.money || 0) < cost) return ctx.send(`💸 Enchanting costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const enchant = pick(["Frost", "Ember", "Storm", "Void", "Radiant", "Seraph"]);
  const ench = { ...(user.enchants || {}), [slot]: enchant };
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { enchants: ench } });
  await ctx.send(`✨ ${equipped[slot]} enchanted with **${enchant}**!`);
}

async function upgradeItem(ctx) {
  const user = await me(ctx);
  const item = ctx.args.join(" ").trim();
  const inv = invOf(user);
  const entry = inv.find((e) => e.item.toLowerCase() === item.toLowerCase());
  if (!entry) return ctx.send(`🎒 You don't have "${item}".`);
  const lvl = entry.level || 1;
  if (lvl >= 5) return ctx.send(`⬆️ ${entry.item} is fully upgraded.`);
  const cost = lvl * 800;
  if ((user.money || 0) < cost) return ctx.send(`💸 Upgrade to +${lvl + 1} costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  entry.level = lvl + 1;
  await saveInv(ctx, inv);
  await ctx.send(`⬆️ **${entry.item}** is now +${lvl + 1}.`);
}

async function invHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `🎒 **Inventory & Craft** — 25 commands, ${WEAPONS.length} weapons, ${ARMOUR.length} armour, ${MATERIALS.length} materials, ${RECIPES.length} recipes.`,
    `◦ ${p}inventory / ${p}storage / ${p}weight`,
    `◦ ${p}craft [recipe] / ${p}brew / ${p}smelt`,
    `◦ ${p}weapon [name] / ${p}armour [name] / ${p}equip / ${p}unequip`,
    `◦ ${p}use / ${p}drop / ${p}gift @user`,
    `◦ ${p}buyitem / ${p}sellitem / ${p}shop`,
    `◦ ${p}iteminfo / ${p}loadout / ${p}enchant / ${p}upgradeitem`,
    `📋 Lists: wplist, armourlist, materiallist, recipelist`,
  ].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    weaponList,
    armourList,
    materialList,
    recipeList,
    shop,
    ...commands([
      ["inventory", inventory, { description: "Your inventory" }],
      ["weapon", weapon, { description: "Weapon info" }],
      ["armour", armour, { aliases: ["armor"], description: "Armour info" }],
      ["equip", equip, { description: "Equip an item" }],
      ["unequip", unequip, { description: "Unequip an item" }],
      ["craft", craft, { description: "Craft an item" }],
      ["brew", brew, { description: "Brew a potion" }],
      ["smelt", smelt, { description: "Smelt a material" }],
      ["use", use, { description: "Use an item" }],
      ["drop", drop, { description: "Drop an item" }],
      ["sellitem", sellItem, { description: "Sell an item" }],
      ["buyitem", buyItem, { description: "Buy an item" }],
      ["storage", storage, { description: "Storage space" }],
      ["weight", weight, { description: "Carry weight" }],
      ["loadout", loadout, { description: "Your loadout" }],
      ["gift", gift, { description: "Gift an item" }],
      ["iteminfo", itemInfo, { description: "Item details" }],
      ["enchant", enchant, { description: "Enchant equipment" }],
      ["upgradeitem", upgradeItem, { description: "Upgrade an item" }],
      ["invhelp", invHelp, { aliases: ["crafthelp"], description: "Inventory help" }],
    ]),
  ],
};
