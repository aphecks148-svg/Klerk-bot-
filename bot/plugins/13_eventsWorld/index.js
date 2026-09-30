/**
 * ⑬ ALL WORLD EVENTS — 25 commands.
 *
 * Sixteen world bosses, sixteen map locations, sixteen NPCs and sixteen worlds.
 * Exploring moves a player between locations; bosses and dungeons pay out.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { WORLD_BOSSES, MAP_LOCATIONS, NPCS, WORLDS, TIMEZONES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt } = require("../../utils/format");

const WEATHERS = ["Clear", "Overcast", "Rain", "Storm", "Snow", "Fog", "Ash", "Aurora"];
const REALM_TRAVEL = ["Portal", "Rift", "Wormhole", "Mirror", "Stairway"];

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function saveWorld(ctx, world) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { world } });
}

function worldOf(user) {
  return user.world || { location: MAP_LOCATIONS[0], world: WORLDS[0], weather: "Clear", discovered: [], bossKills: 0 };
}

function matchIn(list, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return list.find((x) => String(x).toLowerCase() === q) || list.find((x) => String(x).toLowerCase().includes(q)) || null;
}

/* ── the four lists ────────────────────────────────────────────────────── */

const bossList = barListCommand("worldbosslist", WORLD_BOSSES, { emoji: "👹", title: "World Bosses", size: 10, description: "All 16 world bosses" });
const mapList = listCommand("maplist", MAP_LOCATIONS, { emoji: "🗺️", title: "Map Locations", description: "All 16 locations" });
const npcList = listCommand("npclist", NPCS, { emoji: "🧑‍🌾", title: "NPCs", description: "All 16 NPCs" });
const worldList = listCommand("worldlist", WORLDS, { emoji: "🌍", title: "Worlds", description: "All 16 worlds" });

/* ── 5. world home / 6. map / 7. location / 8. explore / 9. travel ──────── */

async function worldHome(ctx) {
  const w = worldOf(await me(ctx));
  await ctx.send([
    "🌍 World status",
    `🗺️ Location: ${w.location}`,
    `🌐 World:    ${w.world}`,
    `🌦️ Weather:  ${w.weather}`,
    `🧭 Discovered: ${w.discovered.length}/${MAP_LOCATIONS.length} ${bar(w.discovered.length, MAP_LOCATIONS.length)}`,
    `👹 Bosses slain: ${fmt(w.bossKills || 0)}`,
  ].join("\n"));
}

async function mapCmd(ctx) {
  const w = worldOf(await me(ctx));
  const lines = MAP_LOCATIONS.map((l) => `  ${l === w.location ? "➤" : w.discovered.includes(l) ? "✔" : "·"} ${l}`);
  const chunks = renderList({ title: `🗺️ ${w.world} — ${w.location}`, items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
  await ctx.send(`🧭 Discovered ${w.discovered.length}/${MAP_LOCATIONS.length}. Travel: **${ctx.prefix}travel [location]**`);
}

async function location(ctx) {
  const w = worldOf(await me(ctx));
  const here = MAP_LOCATIONS.indexOf(w.location);
  const desc = [
    "A quiet start, and the smell of bread.",
    "Banners everywhere. Someone is always shouting.",
    "The fog remembers everyone who walks through it.",
    "Salt, rust, and a gull that follows you.",
    "Neon bleeds onto the wet asphalt.",
    "The clock is wrong. It has been wrong for years.",
    "Wind that bites through every seam.",
    "Grey stone and the smell of old smoke.",
  ][here % 8];
  await ctx.send(`📍 ${w.location}\n📖 ${desc}\n🌦️ ${w.weather}`);
}

async function explore(ctx) {
  const user = await me(ctx);
  const w = worldOf(user);
  const roll = Math.random();
  if (roll < 0.15) {
    await ctx.send(`🔭 Everything here is already discovered. Try **${ctx.prefix}travel**.`);
    return;
  }
  const found = pick(MAP_LOCATIONS.filter((l) => !w.discovered.includes(l)) || MAP_LOCATIONS);
  w.discovered = [...new Set([...(w.discovered || []), found])];
  w.location = found;
  w.weather = pick(WEATHERS);
  await saveWorld(ctx, w);
  const reward = randInt(100, 500);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, 25, ctx.profile.name);
  await ctx.send([
    `🧭 You pushed into **${found}**`,
    `🌦️ Weather: ${w.weather}`,
    `💰 +${fmt(reward)} coins  ⭐ +25 XP`,
  ].join("\n"));
}

async function travel(ctx) {
  const user = await me(ctx);
  const w = worldOf(user);
  const dest = matchIn(MAP_LOCATIONS, ctx.args.join(" "));
  if (!dest) {
    const chunks = renderList({ title: "🗺️ Destinations", items: MAP_LOCATIONS, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return ctx.send(`💡 Travel: **${ctx.prefix}travel [location]**`);
  }
  const cost = randInt(50, 300);
  if ((user.money || 0) < cost) return ctx.send(`💸 Travel to ${dest} costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  w.location = dest;
  w.weather = pick(WEATHERS);
  w.discovered = [...new Set([...(w.discovered || []), dest])];
  await saveWorld(ctx, w);
  await ctx.send(`🧭 Travelled to **${dest}** for ${fmt(cost)} coins. (${w.weather})`);
}

/* ── 10. weather / 11. time / 12. timezone ──────────────────────────────── */

async function weather(ctx) {
  const w = worldOf(await me(ctx));
  if (ctx.args.length) {
    w.weather = matchIn(WEATHERS, ctx.args.join(" ")) || pick(WEATHERS);
    await saveWorld(ctx, w);
  }
  await ctx.send(`🌦️ ${w.location}: **${w.weather}** ${bar(WEATHERS.indexOf(w.weather) + 1, WEATHERS.length)}`);
}

async function timeCmd(ctx) {
  const now = new Date();
  await ctx.send([
    `🕐 ${now.toISOString().replace("T", " ").slice(0, 19)} UTC`,
    `📅 ${now.toUTCString().slice(0, 16)}`,
  ].join("\n"));
}

const timezoneList = listCommand("tzlist", TIMEZONES, { emoji: "🕰️", title: "Timezones", description: "Supported timezones" });

/* ── 14-18. npcs, worlds, dimensions, realms ───────────────────────────── */

async function npc(ctx) {
  const w = worldOf(await me(ctx));
  const npc = matchIn(NPCS, ctx.args.join(" ")) || pick(NPCS);
  const greeting = pick([
    `"Careful out there. ${w.location} isn't safe after dark."`,
    `"Bring me materials and I'll pay well."`,
    `"Seen anything unusual? I'll trade information."`,
    `"The boss that roams the ${pick(MAP_LOCATIONS)}? Avoid it at night."`,
  ]);
  await ctx.send(`🧑‍🌾 **${npc}** (${w.location})\n${greeting}`);
}

async function worldListCmd(ctx) {
  const w = worldOf(await me(ctx));
  const lines = WORLDS.map((x) => `  ${x === w.world ? "➤" : "·"} ${x}`);
  const chunks = renderList({ title: `🌐 Worlds — you're in ${w.world}`, items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function dimension(ctx) {
  const user = await me(ctx);
  const w = worldOf(user);
  const cost = 500;
  if ((user.money || 0) < cost) return ctx.send(`💸 Changing dimension costs ${fmt(cost)} coins.`);
  const dest = pick(WORLDS.filter((x) => x !== w.world)) || WORLDS[0];
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  w.world = dest;
  w.location = MAP_LOCATIONS[0];
  await saveWorld(ctx, w);
  await ctx.send(`🌀 Stepped into the **${dest}** dimension. (-${fmt(cost)} coins)`);
}

async function realm(ctx) {
  const w = worldOf(await me(ctx));
  await ctx.send([
    `🔮 Realm: **${w.world}**`,
    `🎭 Aspect: ${pick(["Lawful", "Neutral", "Chaotic"])}`,
    `✨ Ambience: ${pick(["Silent", "Whispering", "Roaring", "Singing", "Crying"])}`,
    "",
    `◦ ${ctx.prefix}dimension — change world`,
  ].join("\n"));
}

async function portal(ctx) {
  const user = await me(ctx);
  const w = worldOf(user);
  const kind = pick(REALM_TRAVEL);
  const cost = randInt(300, 900);
  if ((user.money || 0) < cost) return ctx.send(`💸 A ${kind.toLowerCase()} costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  w.location = pick(MAP_LOCATIONS);
  w.weather = pick(WEATHERS);
  await saveWorld(ctx, w);
  await ctx.send(`🌀 The ${kind} opens — you step through to **${w.location}**. (-${fmt(cost)} coins)`);
}

/* ── 19-25. events, bosses, treasure, dungeon, announce ─────────────────── */

async function eventList(ctx) {
  const names = ["Lunar Festival", "Harvest Night", "Ashfall", "High Tide", "Starfall",
    "Frostfall", "Ember Night", "The Long Dark", "Double Moon", "Harvest Moon",
    "Solstice", "Equinox", "Meteor Shower", "Eclipse", "Aurora", "The Quiet Hour"];
  const lines = names.map((n, i) => `  ${n} — ${["active", "soon", "ended"][i % 3]}`);
  const chunks = renderList({ title: "🎪 World events", items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function event(ctx) {
  const current = pick(["Lunar Festival", "Starfall", "Double Moon", "The Quiet Hour", "Ashfall"]);
  await ctx.send([
    `🎪 Current world event: **${current}**`,
    `📢 Effects are active across every realm.`,
    `◦ ${ctx.prefix}eventlist — see the calendar`,
  ].join("\n"));
}

async function dailyEvent(ctx) {
  const w = worldOf(await me(ctx));
  const reward = randInt(300, 900);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, 40, ctx.profile.name);
  await ctx.send([
    `📅 Daily event at ${w.location}`,
    `🏆 Reward: ${fmt(reward)} coins  ⭐ +40 XP`,
  ].join("\n"));
}

async function weeklyEvent(ctx) {
  const reward = randInt(1500, 4000);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, 200, ctx.profile.name);
  await ctx.send([
    `📅 Weekly event complete!`,
    `🏆 ${fmt(reward)} coins  ⭐ +200 XP`,
  ].join("\n"));
}

async function worldBoss(ctx) {
  const user = await me(ctx);
  const w = worldOf(user);
  const boss = matchIn(WORLD_BOSSES, ctx.args.join(" ")) || pick(WORLD_BOSSES);
  const tier = WORLD_BOSSES.indexOf(boss);
  const bossPower = 50 + (tier / (WORLD_BOSSES.length - 1)) * 450;
  const playerPower = 40 + (user.level || 1) * 8;
  const win = (playerPower * Math.random()) > (bossPower * 0.6);
  if (win) {
    w.bossKills = (w.bossKills || 0) + 1;
    await saveWorld(ctx, w);
  }
  const reward = Math.round(bossPower * (win ? 1.5 : 0.2));
  if (reward) await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, win ? 80 : 20, ctx.profile.name);
  await ctx.send([
    `👹 Boss: **${boss}** (${bossPower} power)`,
    `⚔️ You: ${playerPower} power`,
    win ? `🏆 Defeated! +${fmt(reward)} coins` : `💀 You fell. +${fmt(reward)} consolation.`,
  ].join("\n"));
}

async function treasure(ctx) {
  const user = await me(ctx);
  const w = worldOf(user);
  const roll = Math.random();
  if (roll < 0.5) return ctx.send(`🔍 You searched ${w.location} and found nothing but rust.`);
  const find = randInt(200, 1500);
  await adjustMoney(ctx.event.senderID, find, ctx.profile.name);
  await addXp(ctx.event.senderID, 30, ctx.profile.name);
  const what = pick(["an old coin purse", "a buried cache", "a merchant's strongbox", "a smuggler's cache", "a shrine's offering"]);
  await ctx.send(`💰 You found ${what} at **${w.location}**: ${fmt(find)} coins. ⭐ +30 XP`);
}

async function dungeon(ctx) {
  const user = await me(ctx);
  const depth = randInt(1, 5);
  const cost = depth * 200;
  if ((user.money || 0) < cost) return ctx.send(`💸 Entering depth ${depth} costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const found = Math.random() < 0.6;
  const reward = Math.round(cost * (found ? 2.5 : 0.4));
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, depth * 20, ctx.profile.name);
  await ctx.send([
    `🕳️ Dungeon depth ${depth}`,
    found ? `💎 Treasure found: ${fmt(reward)} coins` : `💀 Trap. You salvage ${fmt(reward)} coins.`,
    `⭐ +${depth * 20} XP`,
  ].join("\n"));
}

async function announce(ctx) {
  const text = ctx.args.join(" ").trim();
  const notices = [
    "🛠️ Scheduled maintenance this week. Coins are safe.",
    "🎉 New event live: Starfall. Bonus rewards tonight.",
    "🔧 Pet balances tuned. Rare pets are stronger.",
    "📢 Reminder: gamble responsibly. Bank protection is on by default.",
  ];
  await ctx.send(text ? `📢 ${text}` : notices.join("\n"));
}

async function worldHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `🌍 **World Events** — 25 commands, ${WORLD_BOSSES.length} bosses, ${MAP_LOCATIONS.length} locations, ${NPCS.length} NPCs, ${WORLDS.length} worlds.`,
    `◦ ${p}world / ${p}map / ${p}location — where you are`,
    `◦ ${p}explore / ${p}travel [loc]`,
    `◦ ${p}weather / ${p}time / ${p}tzlist`,
    `◦ ${p}npc / ${p}npclist / ${p}worldlist / ${p}dimension / ${p}realm / ${p}portal`,
    `◦ ${p}event / ${p}eventlist / ${p}dailEvent / ${p}weeklyevent`,
    `◦ ${p}worldboss / ${p}treasure / ${p}dungeon / ${p}announce`,
  ].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    bossList,
    mapList,
    npcList,
    worldList,
    timezoneList,
    ...commands([
      ["world", worldHome, { description: "World status" }],
      ["map", mapCmd, { description: "The world map" }],
      ["location", location, { description: "Your location" }],
      ["explore", explore, { description: "Explore for a new location" }],
      ["travel", travel, { description: "Travel to a location" }],
      ["weather", weather, { description: "Current weather" }],
      ["time", timeCmd, { description: "Current time" }],
      ["timezone", timezoneList, { description: "Supported timezones" }],
      ["npc", npc, { description: "Talk to an NPC" }],
      ["dimension", dimension, { description: "Change dimension" }],
      ["realm", realm, { description: "Realm details" }],
      ["portal", portal, { description: "Use a portal" }],
      ["event", event, { description: "Current world event" }],
      ["eventlist", eventList, { description: "Event calendar" }],
      ["dailEvent", dailyEvent, { description: "Daily event reward" }],
      ["weeklyevent", weeklyEvent, { description: "Weekly event reward" }],
      ["worldboss", worldBoss, { description: "Fight a world boss" }],
      ["treasure", treasure, { description: "Search for treasure" }],
      ["dungeon", dungeon, { description: "Enter a dungeon" }],
      ["announce", announce, { description: "Announcements" }],
    ]),
  ],
};
