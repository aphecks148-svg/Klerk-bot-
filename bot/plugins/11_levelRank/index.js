/**
 * ⑪ ALL LEVELS & RANKS — 20 commands.
 *
 * Sixteen ranks, sixteen titles, sixteen achievements, twenty-five quests and
 * sixteen badges. XP comes from `economy.addXp`, which levels a player
 * automatically at `level × 100` XP.
 */

const { command, commands, listCommand } = require("../14_systemCore/kit");
const { getUser, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { RANKS, TITLES, ACHIEVEMENTS, QUESTS, BADGES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt } = require("../../utils/format");

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function saveProgress(ctx, progress) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { progress } });
}

function progressOf(user) {
  return user.progress || { title: null, quests: [], achievements: [], badges: [], xpLog: 0, prestiges: 0 };
}

/** XP needed to reach the next level. */
const needFor = (level) => level * 100;

function rankFor(level) {
  return RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 5))];
}

/* ── 1. level / 2. xp / 3. progress ────────────────────────────────────── */

async function level(ctx) {
  const user = await me(ctx);
  const lv = user.level || 1;
  const xp = user.xp || 0;
  const need = needFor(lv);
  await ctx.send([
    `⭐ Level ${lv}`,
    `📊 ${bar(xp, need)} ${fmt(xp)}/${fmt(need)} XP`,
    `🏅 Rank: ${rankFor(lv)}`,
    `🆔 ${user.uid || "—"}`,
  ].join("\n"));
}

async function xpCmd(ctx) {
  const user = await me(ctx);
  const xp = user.xp || 0;
  const need = needFor(user.level || 1);
  const total = ((user.level || 1) - 1) * 100 + xp;
  await ctx.send([
    `✨ ${fmt(total)} XP total`,
    `📈 To level ${(user.level || 1) + 1}: ${fmt(need - xp)} XP ${bar(xp, need)}`,
  ].join("\n"));
}

async function progress(ctx) {
  const user = await me(ctx);
  const p = progressOf(user);
  const lv = user.level || 1;
  await ctx.send([
    "📈 Your progress",
    `⭐ Level ${lv} ${bar(user.xp || 0, needFor(lv))}`,
    `🏅 Rank: ${rankFor(lv)}`,
    `🎖️ Title: ${p.title || "none set"}`,
    `📋 Quests done: ${p.quests.length}/${QUESTS.length}`,
    `🏆 Achievements: ${p.achievements.length}/${ACHIEVEMENTS.length}`,
    `🔰 Badges: ${p.badges.length}/${BADGES.length}`,
    `🔁 Prestiges: ${p.prestiges || 0}`,
  ].join("\n"));
}

/* ── 4. rank / 5. xplog ────────────────────────────────────────────────── */

async function rank(ctx) {
  const user = await me(ctx);
  const lv = user.level || 1;
  const idx = RANKS.indexOf(rankFor(lv));
  const lines = RANKS.map((r, i) => `  ${i < idx ? "✔" : "·"} ${r} (L${i * 5 + 1})`);
  const chunks = renderList({ title: `🏅 ${rankFor(lv)} — rank ${idx + 1}/${RANKS.length}`, items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function xplog(ctx) {
  const user = await me(ctx);
  const p = progressOf(user);
  const days = p.xpLog;
  await ctx.send([
    "📜 XP log",
    `✨ Lifetime XP: ${fmt(((user.level || 1) - 1) * 100 + (user.xp || 0))}`,
    `📈 Current level: ${user.level || 1}`,
    `🔁 Prestiges: ${p.prestiges || 0}`,
    `💡 XP comes from working, gaming, quests and battles.`,
  ].join("\n"));
}

/* ── 6-8. titles ────────────────────────────────────────────────────────── */

async function myTitle(ctx) {
  const p = progressOf(await me(ctx));
  await ctx.send(`🎖️ Your title: **${p.title || "none"}**\nSet one: **${ctx.prefix}settitle [title]**\nAll titles: **${ctx.prefix}titlelist**`);
}

async function setTitle(ctx) {
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) return myTitle(ctx);
  const title = TITLES.find((t) => t.toLowerCase() === query) || TITLES.find((t) => t.toLowerCase().includes(query));
  if (!title) return ctx.send(`❓ No title called "${ctx.args.join(" ")}". See **${ctx.prefix}titlelist**.`);
  const p = progressOf(await me(ctx));
  p.title = title;
  await saveProgress(ctx, p);
  await ctx.send(`🎖️ Title set to **${title}**.`);
}

const titleList = listCommand("titlelist", TITLES, { emoji: "🎖️", title: "Titles", description: "All 16 titles" });

/* ── 9-10. achievements & badges ────────────────────────────────────────── */

async function achievement(ctx) {
  const user = await me(ctx);
  const p = progressOf(user);
  const earned = ACHIEVEMENTS.filter((a) => p.achievements.includes(a));
  const lines = ACHIEVEMENTS.map((a) => `  ${p.achievements.includes(a) ? "🏆" : "🔒"} ${a}`);
  const chunks = renderList({ title: `🏆 Achievements — ${earned.length}/${ACHIEVEMENTS.length}`, items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
  void user;
}

const achievementList = listCommand("achievementlist", ACHIEVEMENTS, { emoji: "🏆", title: "Achievements", description: "All 16 achievements" });
const badgeList = listCommand("badgelist", BADGES, { emoji: "🔰", title: "Badges", description: "All 16 badges" });

/* ── 11-14. quests ──────────────────────────────────────────────────────── */

async function quest(ctx) {
  const p = progressOf(await me(ctx));
  const next = QUESTS.find((q) => !p.quests.includes(q)) || QUESTS[0];
  await ctx.send([
    `📋 Next quest: **${next}**`,
    `✅ Completed: ${p.quests.length}/${QUESTS.length} ${bar(p.quests.length, QUESTS.length)}`,
    `Claim: **${ctx.prefix}claimquest**`,
  ].join("\n"));
}

async function questList(ctx) {
  const p = progressOf(await me(ctx));
  const lines = QUESTS.map((q) => `  ${p.quests.includes(q) ? "✅" : "⬜"} ${q}`);
  const chunks = renderList({ title: `📋 Quests — ${p.quests.length}/${QUESTS.length}`, items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function myQuests(ctx) {
  const p = progressOf(await me(ctx));
  const done = QUESTS.filter((q) => p.quests.includes(q));
  await ctx.send(done.length
    ? ["✅ Your completed quests", ...done.map((q) => `  ${q}`)].join("\n")
    : "📋 You haven't completed any quests yet.");
}

async function claimQuest(ctx) {
  const user = await me(ctx);
  const p = progressOf(user);
  const next = QUESTS.find((q) => !p.quests.includes(q));
  if (!next) return ctx.send("🎉 All quests complete!");
  const reward = randInt(200, 700);
  p.quests.push(next);
  await saveProgress(ctx, p);
  await addXp(ctx.event.senderID, 50, ctx.profile.name);
  const { adjustMoney } = require("../../utils/economy");
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await ctx.send(`✅ Quest complete: **${next}**\n💰 +${fmt(reward)} coins • ⭐ +50 XP`);
}

/* ── 15. levelup / 16. prestige ─────────────────────────────────────────── */

async function levelUp(ctx) {
  const user = await me(ctx);
  const gain = randInt(20, 60);
  const before = user.level || 1;
  await addXp(ctx.event.senderID, gain, ctx.profile.name);
  const after = (await me(ctx)).level || 1;
  await ctx.send(after > before
    ? `🎉 Level up! ${before} → ${after} (+${gain} XP)`
    : `🏋️ +${gain} XP (${bar((user.xp || 0) + gain, needFor(before))})`);
}

async function prestige(ctx) {
  const user = await me(ctx);
  const lv = user.level || 1;
  if (lv < 10) return ctx.send(`🔁 Prestige unlocks at level 10. You're level ${lv}.`);
  const p = progressOf(user);
  p.prestiges = (p.prestiges || 0) + 1;
  await saveProgress(ctx, p);
  await ctx.send([
    `🔁 Prestige ${p.prestiges}!`,
    "🎁 You keep your businesses and badges; your level and XP reset.",
  ].join("\n"));
}

/* ── 17-20. the lists & help ────────────────────────────────────────────── */

const rankList = listCommand("ranklist", RANKS, { emoji: "🏅", title: "Ranks", description: "All 16 ranks" });

async function rankLeaderboard(ctx) {
  if (!isReady()) return ctx.send("🏆 The leaderboard needs MongoDB configured.");
  const top = await models.User.find({}).sort({ level: -1, xp: -1 }).limit(10).lean();
  const lines = top.map((u, i) => `  ${String(i + 1).padStart(2)}. ${u.name || "Anonymous"} — L${u.level || 1} ${rankFor(u.level || 1)}`);
  await ctx.send(["🏆 Rank leaderboard", ...(lines.length ? lines : ["  (none yet)"])].join("\n"));
}

async function levelHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `📈 **Levels & Ranks** — 20 commands, ${RANKS.length} ranks, ${QUESTS.length} quests.`,
    `◦ ${p}level / ${p}xp / ${p}progress / ${p}xplog`,
    `◦ ${p}rank / ${p}ranklist / ${p}rankleaderboard`,
    `◦ ${p}mytitle / ${p}settitle [title] / ${p}titlelist`,
    `◦ ${p}achievement / ${p}achievementlist / ${p}badgelist`,
    `◦ ${p}quest / ${p}questlist / ${p}myquests / ${p}claimquest`,
    `◦ ${p}levelup / ${p}prestige`,
  ].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    rankList,
    titleList,
    achievementList,
    badgeList,
    ...commands([
      ["level", level, { description: "Your level" }],
      ["xp", xpCmd, { description: "Your XP" }],
      ["progress", progress, { description: "Overall progress" }],
      ["xplog", xplog, { description: "XP log" }],
      ["rank", rank, { description: "Your rank" }],
      ["mytitle", myTitle, { description: "Your title" }],
      ["settitle", setTitle, { description: "Set your title" }],
      ["achievement", achievement, { description: "Your achievements" }],
      ["quest", quest, { description: "Your next quest" }],
      ["questlist", questList, { description: "All quests" }],
      ["myquests", myQuests, { description: "Completed quests" }],
      ["claimquest", claimQuest, { description: "Claim a quest reward" }],
      ["levelup", levelUp, { description: "Gain some XP" }],
      ["prestige", prestige, { description: "Prestige your account" }],
      ["rankleaderboard", rankLeaderboard, { description: "Rank leaderboard" }],
      ["levelhelp", levelHelp, { aliases: ["rankhelp"], description: "Level help" }],
    ]),
  ],
};
