/**
 * ⑥ ALL WARZONE ARSENAL — 25 commands.
 *
 * Sixteen weapons, loadouts, vehicles, missions and bosses, each exposed as a
 * full list with a power bar, plus the deployment/mission loop that consumes
 * them.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { WARZONE_WEAPONS, WARZONE_LOADOUTS, WARZONE_VEHICLES, WARZONE_MISSIONS, WARZONE_BOSSES } = require("../../data/lists");
const { renderTable, renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt, parseAmount, sample } = require("../../utils/format");

/** Power scales with position in each list, so tier 16 is the strongest. */
const powerOf = (list, item) => 10 + (list.indexOf(item) / (list.length - 1)) * 90;
const bar5 = (list, item) => Math.max(1, Math.min(5, Math.round((powerOf(list, item) / 100) * 5)));

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function saveWz(ctx, wz) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { warzone: wz } });
  else wz.__memory = true;
}

function wzOf(user) {
  return user.warzone || { credits: 0, weapon: null, loadout: "Scout", vehicle: "Bike", missions: 0, kills: 0 };
}

/* ── the five data lists ───────────────────────────────────────────────── */

const weaponList = barListCommand("weaponlist", WARZONE_WEAPONS, { emoji: "🔫", title: "Warzone Weapons", size: 5, description: "All 16 weapons" });
const loadoutList = listCommand("loadoutlist", WARZONE_LOADOUTS.map((l, i) => `${l} — ${Math.round(powerOf(WARZONE_LOADOUTS, l))} power`), { emoji: "🎖️", title: "Loadouts", description: "All 16 loadouts" });
const vehicleList = barListCommand("vehiclelist", WARZONE_VEHICLES, { emoji: "🚙", title: "Vehicles", size: 5, description: "All 16 vehicles" });
const missionList = listCommand("missionlist", WARZONE_MISSIONS, { emoji: "🎯", title: "Missions", description: "All 16 missions" });
const bossList = barListCommand("wzbosslist", WARZONE_BOSSES, { emoji: "💀", title: "Boss Power", size: 10, aliases: ["wzbosslist2"], description: "All 16 warzone bosses by power" });

/* ── 6. warzone home / 7. wzarsenal ─────────────────────────────────────── */

async function warzoneHome(ctx) {
  const wz = wzOf(await me(ctx));
  await ctx.send([
    "💣 Warzone",
    `🔫 Weapon:  ${wz.weapon || "none"}`,
    `🎖️ Loadout: ${wz.loadout}`,
    `🚙 Vehicle: ${wz.vehicle}`,
    `💳 Credits: ${fmt(wz.credits)}`,
    `🎯 Missions: ${fmt(wz.missions)} • Kills: ${fmt(wz.kills)}`,
    `🕊️ Revives: ${fmt(wz.revives || 0)}`,
    "",
    `◦ ${ctx.prefix}deploy — start a deployment`,
    `◦ ${ctx.prefix}weaponlist / ${ctx.prefix}vehiclelist / ${ctx.prefix}bosslist`,
  ].join("\n"));
}

async function arsenal(ctx) {
  const wz = wzOf(await me(ctx));
  const owned = Object.keys(wz.owned || {});
  const lines = [
    `🔫 Equipped: ${wz.weapon || "nothing"} ${wz.weapon ? `(${Math.round(powerOf(WARZONE_WEAPONS, wz.weapon))} power)` : ""}`,
    `🎖️ Loadout: ${wz.loadout}`,
    `🚙 Vehicle: ${wz.vehicle} (${Math.round(powerOf(WARZONE_VEHICLES, wz.vehicle))} power)`,
    `🧰 Owned: ${owned.length ? owned.join(", ") : "nothing yet"}`,
  ];
  await ctx.send(["🧰 Arsenal", ...lines].join("\n"));
}

/* ── 8. deploy ─────────────────────────────────────────────────────────── */

async function deploy(ctx) {
  const user = await me(ctx);
  const wz = wzOf(user);
  const cost = 100;
  if ((user.money || 0) < cost) return ctx.send(`💸 Deployment costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  wz.missions = (wz.missions || 0) + 1;
  await saveWz(ctx, wz);
  const weaponPower = wz.weapon ? powerOf(WARZONE_WEAPONS, wz.weapon) : 10;
  const vehiclePower = powerOf(WARZONE_VEHICLES, wz.vehicle);
  const roll = weaponPower + vehiclePower * 0.5 + Math.random() * 120;
  const outcome = roll > 160 ? "victory" : roll > 90 ? "partial" : "defeat";
  const pay = outcome === "victory" ? randInt(400, 1200) : outcome === "partial" ? randInt(100, 400) : 0;
  if (pay) await adjustMoney(ctx.event.senderID, pay, ctx.profile.name);
  await addXp(ctx.event.senderID, outcome === "victory" ? 40 : 15, ctx.profile.name);
  await ctx.send([
    `🚁 Deployed with ${wz.loadout}`,
    `🔫 ${wz.weapon || "unarmed"} • 🚙 ${wz.vehicle}`,
    outcome === "victory" ? `🏆 Victory! +${fmt(pay)} coins` : outcome === "partial" ? `🩸 Partial success +${fmt(pay)} coins` : `💀 Wiped out. ${fmt(cost)} coins lost.`,
  ].join("\n"));
}

/* ── 9. resupply / 10. upgradeweapon ────────────────────────────────────── */

async function resupply(ctx) {
  const user = await me(ctx);
  const wz = wzOf(user);
  const cost = 250;
  if ((user.money || 0) < cost) return ctx.send(`💸 Resupply costs ${fmt(cost)} coins.`);
  const pack = pick(["Ammo Crate", "Med Kit", "Grenade Bundle", "Repair Kit", "Intel Pack", "Supply Drop"]);
  const roll = Math.random() < 0.6;
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  if (roll) {
    const owned = { ...(wz.owned || {}) };
    const weapon = owned[wz.weapon] ? wz.weapon : pick(WARZONE_WEAPONS);
    owned[weapon] = (owned[weapon] || 0) + 1;
    wz.owned = owned;
    if (!wz.weapon) wz.weapon = weapon;
    await saveWz(ctx, wz);
  }
  await ctx.send(`📦 Resupplied: ${pack} ${roll ? "— found something useful!" : "— nothing but old ration tins."}`);
}

async function upgradeWeapon(ctx) {
  const user = await me(ctx);
  const wz = wzOf(user);
  if (!wz.weapon) return ctx.send(`🔫 Pick a weapon first: **${ctx.prefix}arsenal** or run **${ctx.prefix}deploy**.`);
  const level = (wz.upgrades && wz.upgrades[wz.weapon]) || 0;
  if (level >= 5) return ctx.send(`⬆️ ${wz.weapon} is fully upgraded.`);
  const cost = (level + 1) * 400;
  if ((user.money || 0) < cost) return ctx.send(`💸 Upgrade level ${level + 1} costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  wz.upgrades = { ...(wz.upgrades || {}), [wz.weapon]: level + 1 };
  await saveWz(ctx, wz);
  await ctx.send(`⬆️ ${wz.weapon} upgraded to level ${level + 1}. (+${level + 1 * 5}% power)`);
}

/* ── 11-20. the mission verbs ──────────────────────────────────────────── */

const VERBS = {
  raid: ["Raided an outpost", "Rushed a compound"],
  hold: ["Held the ridge", "Defended a position"],
  scout: ["Scouted the valley", "Marked enemy positions"],
  rescue: ["Rescued hostages", "Extracted a teammate"],
  escort: ["Escorted the convoy", "Guarded the VIP"],
  sabotage: ["Sabotaged a depot", "Disabled a turret"],
  recover: ["Recovered a black box", "Found supply intel"],
  ambush: ["Landed an ambush", "Sprung a trap"],
  retreat: ["Retreated under fire", "Fell back to cover"],
};

function missionCommand(verb, index) {
  return async (ctx) => {
    const user = await me(ctx);
    const wz = wzOf(user);
    const cost = 150 + index * 50;
    if ((user.money || 0) < cost) return ctx.send(`💸 ${ctx.prefix}${verb} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
    const difficulty = 40 + index * 5;
    const weaponPower = wz.weapon ? powerOf(WARZONE_WEAPONS, wz.weapon) + ((wz.upgrades && wz.upgrades[wz.weapon] || 0) * 5) : 10;
    const success = Math.random() * 140 < weaponPower + difficulty;
    const reward = success ? randInt(300, 800) + index * 150 : 0;
    await adjustMoney(ctx.event.senderID, -cost, (reward - cost), ctx.profile.name);
    wz.missions = (wz.missions || 0) + 1;
    if (success) wz.kills = (wz.kills || 0) + randInt(1, 5);
    await saveWz(ctx, wz);
    await addXp(ctx.event.senderID, success ? 25 : 5, ctx.profile.name);
    const [a, b] = VERBS[verb];
    await ctx.send([
      `🎯 ${pick([a, b])}`,
      `🔫 ${wz.weapon || "unarmed"} (${Math.round(weaponPower)} power)`,
      success ? `✅ Success — +${fmt(reward)} coins` : `❌ Failed — ${fmt(cost)} coins lost.`,
    ].join("\n"));
  };
}

/* ── 21. warzonestats / 22. warzoneloadout / 23. warzoneinventory ────────── */

async function warzoneStats(ctx) {
  const wz = wzOf(await me(ctx));
  const weaponPower = wz.weapon ? powerOf(WARZONE_WEAPONS, wz.weapon) : 0;
  await ctx.send([
    "📊 Warzone stats",
    `🎯 Missions: ${fmt(wz.missions || 0)}`,
    `💀 Kills:    ${fmt(wz.kills || 0)}`,
    `🔫 Weapon:   ${wz.weapon || "none"} (${Math.round(weaponPower)} power)`,
    `💳 Credits:  ${fmt(wz.credits || 0)}`,
    `📈 K/D: ${(wz.kills / Math.max(1, wz.missions || 1)).toFixed(1)} per mission`,
  ].join("\n"));
}

async function warzoneLoadout(ctx) {
  const wz = wzOf(await me(ctx));
  const query = ctx.args.join(" ").toLowerCase();
  const loadout = WARZONE_LOADOUTS.find((l) => l.toLowerCase() === query)
    || WARZONE_LOADOUTS.find((l) => l.toLowerCase().includes(query));
  if (!loadout) {
    const chunks = renderList({ title: "🎖️ All loadouts", items: WARZONE_LOADOUTS, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return ctx.send(`💡 Equip: **${ctx.prefix}warzoneloadout [name]**`);
  }
  wz.loadout = loadout;
  await saveWz(ctx, wz);
  await ctx.send(`🎖️ Loadout set to **${loadout}** (${Math.round(powerOf(WARZONE_LOADOUTS, loadout))} power).`);
}

async function warzoneInventory(ctx) {
  const wz = wzOf(await me(ctx));
  const owned = wz.owned || {};
  const lines = Object.keys(owned).map((w) => `  ${w} ×${owned[w]}`);
  await ctx.send([
    `🧰 Warzone inventory (${Object.keys(owned).length})`,
    ...(lines.length ? lines : ["  empty — resupply to find weapons"]),
    `🚙 Vehicle: ${wz.vehicle}`,
  ].join("\n"));
}

/* ── 24. warzonerevive / 25. wzrank ─────────────────────────────────────── */

async function warzoneRevive(ctx) {
  const user = await me(ctx);
  const wz = wzOf(user);
  const used = wz.revives || 0;
  if (used >= 3) return ctx.send("🕊️ No revives left today. They reset daily.");
  const cost = 300;
  if ((user.money || 0) < cost) return ctx.send(`💸 A revive costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  wz.revives = used + 1;
  await saveWz(ctx, wz);
  await ctx.send(`🕊️ Revived a squadmate. (${used + 1}/3 used today)`);
}

async function wzRank(ctx) {
  const wz = wzOf(await me(ctx));
  const score = (wz.missions || 0) * 10 + (wz.kills || 0) * 25;
  const ranks = ["Recruit", "Private", "Corporal", "Sergeant", "Lieutenant",
    "Captain", "Major", "Colonel", "Commander", "Warlord"];
  const rank = ranks[Math.min(ranks.length - 1, Math.floor(score / 200))];
  await ctx.send([
    `🎖️ Warzone rank: **${rank}**`,
    `⭐ Score: ${fmt(score)} ${bar(Math.min(score, 2000), 2000)}`,
    `🎯 Missions ${fmt(wz.missions || 0)} • 💀 Kills ${fmt(wz.kills || 0)}`,
  ].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    weaponList,
    loadoutList,
    vehicleList,
    missionList,
    bossList,
    ...commands([
      ["warzone", warzoneHome, { description: "Warzone status" }],
      ["wzarsenal", arsenal, { description: "Your arsenal" }],
      ["deploy", deploy, { description: "Deploy to a match" }],
      ["resupply", resupply, { description: "Buy a supply crate" }],
      ["upgradeweapon", upgradeWeapon, { description: "Upgrade your weapon" }],
      ["raid", missionCommand("raid", 0), { description: "Raid an outpost" }],
      ["hold", missionCommand("hold", 1), { description: "Hold a position" }],
      ["scout", missionCommand("scout", 2), { description: "Scout ahead" }],
      ["rescue", missionCommand("rescue", 3), { description: "Rescue hostages" }],
      ["escort", missionCommand("escort", 4), { description: "Escort a convoy" }],
      ["sabotage", missionCommand("sabotage", 5), { description: "Sabotage a depot" }],
      ["recover", missionCommand("recover", 6), { description: "Recover intel" }],
      ["ambush", missionCommand("ambush", 7), { description: "Ambush the enemy" }],
      ["retreat", missionCommand("retreat", 8), { description: "Retreat safely" }],
      ["warzonestats", warzoneStats, { description: "Warzone stats" }],
      ["warzoneloadout", warzoneLoadout, { description: "Set your loadout" }],
      ["warzoneinventory", warzoneInventory, { description: "Warzone inventory" }],
      ["warzonerevive", warzoneRevive, { description: "Revive a squadmate" }],
      ["wzrank", wzRank, { description: "Your warzone rank" }],
      ["arsenal2", arsenal, { description: "Arsenal detail" }],
    ]),
  ],
};