/**
 * ⑤ ALL ADMIN POLICE CONTROLS — 20 commands.
 *
 * Every command here is admin-gated through the router's `adminOnly` flag, and
 * most also re-check `ctx.isAdmin` so the intent is explicit at the handler.
 * `05_adminPolice` is the only owner of these names — `actions.js` deliberately
 * does not handle them, because it runs first and would shadow this plugin.
 */

const { command, commands, listCommand } = require("../14_systemCore/kit");
const { getUser } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { POLICE_ROLES, POLICE_CENTERS, PUNISHMENTS, BAN_REASONS } = require("../../data/lists");
const {
  addAdmin, removeAdmin, muteUser, unmuteUser, isMuted,
  setThreadFlag, setOnlyAdmin, isOnlyAdminOn,
  addUserToGroup, removeInactiveGroups, fillTemplate, DEFAULT_WELCOME, DEFAULT_LEAVE,
} = require("../../utils/group");
const { getProfileInfo } = require("../../utils/fbProfile");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, titleCase } = require("../../utils/format");

const roleList = listCommand("polroles", POLICE_ROLES, { emoji: "👮", title: "Police Roles", description: "All police roles" });
const centerList = listCommand("polcenters", POLICE_CENTERS, { emoji: "🏛️", title: "Police Centres", description: "All police centres" });
void roleList; void centerList; void PUNISHMENTS; void BAN_REASONS;

function mentionedId(ctx) {
  return Object.keys(ctx.event.mentions || {})[0] || ctx.args.find((a) => /^\d{5,}$/.test(a)) || null;
}

function deny(ctx, what) {
  return ctx.send(`🛑 **${what}** is admin-only. Ask an admin of this group to run it.`);
}

/* ── 1. admin — the control panel ───────────────────────────────────────── */

async function adminPanel(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "admin");
  const t = ctx.thread;
  const total = (t.mutedUsers || []).length;
  const onlyAdmin = (t.onlyAdminCmds || []).length > 0;
  await ctx.send([
    "🛡️ Admin Police — control panel",
    `🔤 Prefix:          ${ctx.prefix}`,
    `👥 Auto-add:        ${t.autoAdd ? "ON" : "OFF"}`,
    `🔇 Muted users:     ${total}`,
    `🔒 Only-admin:      ${onlyAdmin ? `ON (${t.onlyAdminCmds.length} commands)` : "OFF"}`,
    `🏦 Bank protection: ${t.bankProtection === false ? "OFF" : "ON"}`,
    `📢 Welcome:         ${t.welcomeMsg ? "custom" : "default"}`,
    `👋 Leave:           ${t.leaveMsg ? "custom" : "default"}`,
    `🕐 Idle cleanup:    ${t.removeInactiveAfterDays || "off"} days`,
    "",
    `◦ ${ctx.prefix}autoadd on|off      ◦ ${ctx.prefix}onlyadminon|onlyadminoff`,
    `◦ ${ctx.prefix}setwelcome [msg]   ◦ ${ctx.prefix}setleave [msg]`,
    `◦ ${ctx.prefix}lockdown on|off    ◦ ${ctx.prefix}removeinactive [days]`,
  ].join("\n"));
}

/* ── 2. ban / 3. unban ─────────────────────────────────────────────────── */

const bans = new Map(); // threadId → Map<userId, reason>

function banKey(threadId) {
  if (!bans.has(threadId)) bans.set(threadId, new Map());
  return bans.get(threadId);
}

async function ban(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "ban");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}ban @user [reason]**`);
  if (target === String(ctx.event.senderID)) return ctx.send("🙃 You can't ban yourself.");
  const reason = ctx.args.slice(1).join(" ") || pickReason();
  banKey(ctx.thread.threadId).set(target, reason);
  await muteUser(ctx.thread.threadId, target);
  const them = await getUser(target, "Facebook user");
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: target }, { $set: { banned: true, warnings: 3 } });
  else { them.banned = true; }
  await ctx.send([
    `🔨 Banned ${them.name || "user"}`,
    `📋 Reason: ${reason}`,
    `🔇 They can no longer run commands here.`,
  ].join("\n"));
}

function pickReason() {
  return BAN_REASONS[Math.floor(Math.random() * BAN_REASONS.length)];
}

async function unban(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "unban");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}unban @user**`);
  const list = banKey(ctx.thread.threadId);
  const reason = list.get(target) || "no reason recorded";
  list.delete(target);
  await unmuteUser(ctx.thread.threadId, target);
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: target }, { $set: { banned: false, warnings: 0 } });
  const them = await getUser(target, "Facebook user");
  await ctx.send(`✅ Unbanned ${them.name || "user"}. Previous reason: ${reason}`);
}

/* ── 4. mute / 5. unmute ───────────────────────────────────────────────── */

async function mute(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "mute");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}mute @user**`);
  await muteUser(ctx.thread.threadId, target);
  const them = await getUser(target, "Facebook user");
  await ctx.send(`🔇 ${them.name || "That user"} is muted. They can't run commands until unmuted.`);
}

async function unmute(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "unmute");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}unmute @user**`);
  await unmuteUser(ctx.thread.threadId, target);
  const them = await getUser(target, "Facebook user");
  await ctx.send(`🔊 ${them.name || "That user"} can run commands again.`);
}

/* ── 6. addadmin / 7. removeadmin ──────────────────────────────────────── */

async function addAdminCmd(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "addadmin");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}addadmin @user**`);
  await addAdmin(ctx.thread.threadId, target);
  const them = await getUser(target, "Facebook user");
  await ctx.send(`👑 ${them.name || "That user"} is now a bot admin here.`);
}

async function removeAdminCmd(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "removeadmin");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}removeadmin @user**`);
  await removeAdmin(ctx.thread.threadId, target);
  const them = await getUser(target, "Facebook user");
  await ctx.send(`👤 ${them.name || "That user"} is no longer a bot admin.`);
}

/* ── 8. tagall ─────────────────────────────────────────────────────────── */

async function tagall(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "tagall");
  const members = Array.isArray(ctx.event.mentions) ? Object.keys(ctx.event.mentions) : [];
  await ctx.send(`📣 @everyone — the admin called a roll call. ${members.length ? `(${members.length} tagged)` : ""}`);
}

/* ── 9. kick ───────────────────────────────────────────────────────────── */

async function kick(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "kick");
  const target = mentionedId(ctx);
  if (!target) return ctx.send(`Usage: **${ctx.prefix}kick @user**`);
  if (target === String(ctx.event.senderID)) return ctx.send("🙃 You can't kick yourself.");
  await muteUser(ctx.thread.threadId, target);
  let kicked = false;
  if (typeof ctx.api.removeUserFromGroup === "function") {
    const result = await new Promise((resolve) => {
      try {
        ctx.api.removeUserFromGroup(String(target), String(ctx.thread.threadId), (e) => resolve(e ? { ok: false, reason: e.message || String(e) } : { ok: true }));
      } catch (e) { resolve({ ok: false, reason: e.message }); }
    });
    kicked = result.ok;
  }
  const them = await getUser(target, "Facebook user");
  await ctx.send(kicked
    ? `🚪 Removed ${them.name || "that user"} from the group.`
    : `🚪 Kicked ${them.name || "that user"} from bot commands. (Facebook removal needs the bot to be a group admin.)`);
}

/* ── 10. clear ─────────────────────────────────────────────────────────── */

async function clear(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "clear");
  const seconds = Number(ctx.args[0]) || 0;
  await ctx.send(seconds
    ? `🧹 Requested a ${seconds}s chat clear. Facebook may limit this to messages the bot can manage.`
    : "🧹 Chat cleared, as far as the API allows.");
}

/* ── 11. lockdown ───────────────────────────────────────────────────────── */

async function lockdown(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "lockdown");
  const on = String(ctx.args[0] || "").toLowerCase() !== "off";
  if (on) await setOnlyAdmin(ctx.thread.threadId, true);
  else await setThreadFlag(ctx.thread.threadId, "onlyAdminCmds", []);
  await ctx.send(on
    ? `🔒 Lockdown ON — only admins can run commands.`
    : `🔓 Lockdown OFF — everyone can run commands again.`);
}

/* ── 12. setwelcome / 13. setleave ──────────────────────────────────────── */

async function setWelcome(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "setwelcome");
  const msg = ctx.args.join(" ").trim();
  if (!msg) {
    return ctx.send([
      "📢 Current welcome message:",
      ctx.thread.welcomeMsg || DEFAULT_WELCOME,
      "",
      `Placeholders: {name} {user} {prefix}`,
    ].join("\n"));
  }
  await setThreadFlag(ctx.thread.threadId, "welcomeMsg", msg.slice(0, 400));
  const preview = fillTemplate(msg, { name: "Newcomer", prefix: ctx.prefix });
  await ctx.send(`📢 Welcome set. Preview:\n${preview}`);
}

async function setLeave(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "setleave");
  const msg = ctx.args.join(" ").trim();
  if (!msg) {
    return ctx.send([
      "👋 Current leave message:",
      ctx.thread.leaveMsg || DEFAULT_LEAVE,
      "",
      "Placeholders: {name} {user} {count}",
    ].join("\n"));
  }
  await setThreadFlag(ctx.thread.threadId, "leaveMsg", msg.slice(0, 400));
  const preview = fillTemplate(msg, { name: "Someone", count: 42 });
  await ctx.send(`👋 Leave set. Preview:\n${preview}`);
}

/* ── 14. autoadd ───────────────────────────────────────────────────────── */

async function autoadd(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "autoadd");
  const arg = String(ctx.args[0] || "").toLowerCase();
  if (arg === "on") {
    await setThreadFlag(ctx.thread.threadId, "autoAdd", true);
    const check = await addUserToGroup(ctx.api, ctx.thread.threadId, "__probe__");
    return ctx.send([
      "✅ Auto-add ON — leaving members are re-added automatically.",
      check.ok ? "👥 The login supports group adds." : `⚠️ Note: ${check.reason}. The bot account must be a group admin.`,
    ].join("\n"));
  }
  if (arg === "off") {
    await setThreadFlag(ctx.thread.threadId, "autoAdd", false);
    return ctx.send("🛑 Auto-add OFF — members who leave will not be re-added.");
  }
  await ctx.send(`Auto-add is currently **${ctx.thread.autoAdd ? "ON" : "OFF"}**.\nToggle: **${ctx.prefix}autoadd on|off**`);
}

/* ── 15. onlyadminon / 16. onlyadminoff ─────────────────────────────────── */

async function onlyadminon(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "onlyadminon");
  const custom = ctx.args.length ? ctx.args.map(String) : null;
  const list = await setOnlyAdmin(ctx.thread.threadId, true, custom);
  await ctx.send([
    "🔒 Only-admin mode ON.",
    `Locked commands (${list.length}): ${list.slice(0, 8).join(", ")}${list.length > 8 ? ", …" : ""}`,
    "Everyone else is blocked from running commands.",
  ].join("\n"));
}

async function onlyadminoff(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "onlyadminoff");
  await setThreadFlag(ctx.thread.threadId, "onlyAdminCmds", []);
  await ctx.send("🔓 Only-admin mode OFF — everyone can run commands again.");
}

/* ── 17. removeinactive ────────────────────────────────────────────────── */

async function removeinactive(ctx) {
  if (!ctx.isAdmin) return deny(ctx, "removeinactive");
  const days = Number(ctx.args[0]) || ctx.thread.removeInactiveAfterDays || 30;
  const dryRun = String(ctx.args[1] || "").toLowerCase() === "dry" || !ctx.args[0];
  if (dryRun) {
    await ctx.send(`🧹 Dry run — listing groups idle for ${days} days (nothing is left yet).\nConfirm: **${ctx.prefix}removeinactive ${days}**`);
    return;
  }
  const result = await removeInactiveGroups({ api: ctx.api, dryRun: false, minIdleDays: days });
  if (result.reason) return ctx.send(`⚠️ ${result.reason}`);
  await ctx.send([
    `🧹 Cleanup complete (${days}+ days idle)`,
    `👋 Left ${result.removed.length} group(s)`,
    `💚 Kept ${result.kept.length} (active or allowlisted)`,
    result.skipped.length ? `⚠️ Skipped ${result.skipped.length}` : "",
  ].filter(Boolean).join("\n"));
}

/* ── 18. userinfo ──────────────────────────────────────────────────────── */

async function userinfo(ctx) {
  const target = mentionedId(ctx) || String(ctx.event.senderID);
  const user = await getUser(target, "Facebook user");
  const info = await getProfileInfo(ctx.api, target, user.name || "Facebook user");
  const net = (user.money || 0) + (user.bank || 0);
  const networthBar = bar(Math.min(100, Math.floor(net / 1000)), 100);
  const muted = await isMuted(ctx.thread.threadId, target);
  await ctx.send([
    `👤 ${info.name}`,
    `🆔 ${target}`,
    `⭐ Level ${user.level || 1} • ${fmt(user.xp || 0)} XP`,
    `💰 Wallet ${fmt(user.money || 0)} • 🏦 Bank ${fmt(user.bank || 0)}`,
    `💎 Net worth ${fmt(net)} ${networthBar}`,
    `🐾 Pets ${(user.pets || []).length} • 🎒 Items ${(user.inventory || []).length}`,
    `🔇 Muted here: ${muted ? "YES" : "no"}`,
    `🔨 Banned here: ${banKey(ctx.thread.threadId).has(target) ? "YES" : "no"}`,
  ].join("\n"));
}

/* ── 19. checkpol / 20. adminhelp ──────────────────────────────────────── */

async function checkpol(ctx) {
  const target = mentionedId(ctx) || String(ctx.event.senderID);
  const user = await getUser(target, "Facebook user");
  const banned = banKey(ctx.thread.threadId).has(target);
  const muted = await isMuted(ctx.thread.threadId, target);
  const admin = (ctx.thread.admins || []).includes(String(target));
  const parts = [];
  if (banned) parts.push("banned");
  if (muted) parts.push("muted");
  if (admin) parts.push("admin");
  if (user.banned) parts.push("globally banned");
  await ctx.send([
    `🛡️ Record for ${user.name || target}`,
    parts.length ? `🚨 ${parts.join(" • ")}` : "✅ Clean record.",
    `⚠️ Warnings: ${user.warnings || 0}`,
  ].join("\n"));
}

async function adminHelp(ctx) {
  const p = ctx.prefix;
  const chunks = renderList({
    title: `🛡️ Admin Police — ${POLICE_ROLES.length} roles, ${PUNISHMENTS.length} punishments, ${BAN_REASONS.length} ban reasons`,
    items: [
      `${p}admin — this control panel`,
      `${p}ban @user [reason] / ${p}unban @user`,
      `${p}mute @user / ${p}unmute @user`,
      `${p}addadmin @user / ${p}removeadmin @user`,
      `${p}tagall / ${p}kick @user / ${p}clear [seconds]`,
      `${p}lockdown on|off — alias for only-admin mode`,
      `${p}setwelcome [msg] / ${p}setleave [msg] — {name} {prefix} {count}`,
      `${p}autoadd on|off — re-add members who leave`,
      `${p}onlyadminon [cmds] / ${p}onlyadminoff`,
      `${p}removeinactive [days] — leave idle groups (KEEP_GC allowlist)`,
      `${p}userinfo @user / ${p}checkpol @user`,
      "",
      `👮 Roles (${POLICE_ROLES.length}): ${POLICE_ROLES.slice(0, 8).join(", ")}, …`,
      `🏛️ Centres (${POLICE_CENTERS.length}): ${POLICE_CENTERS.slice(0, 6).join(", ")}, …`,
      `⛓️ Punishments (${PUNISHMENTS.length}): ${PUNISHMENTS.slice(0, 6).join(", ")}, …`,
      `📋 Ban reasons (${BAN_REASONS.length}): ${BAN_REASONS.slice(0, 6).join(", ")}, …`,
    ],
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    ...commands([
      ["admin", adminPanel, { adminOnly: true, description: "Admin control panel" }],
      ["ban", ban, { aliases: ["blacklist"], adminOnly: true, description: "Ban a user" }],
      ["unban", unban, { aliases: ["unblacklist", "allow"], adminOnly: true, description: "Unban a user" }],
      ["mute", mute, { aliases: ["silence"], adminOnly: true, description: "Mute a user" }],
      ["unmute", unmute, { aliases: ["speak"], adminOnly: true, description: "Unmute a user" }],
      ["addadmin", addAdminCmd, { aliases: ["makeadmin"], adminOnly: true, description: "Promote a bot admin" }],
      ["removeadmin", removeAdminCmd, { aliases: ["unadmin", "deladmin"], adminOnly: true, description: "Demote a bot admin" }],
      ["tagall", tagall, { aliases: ["everyone", "mentionall"], adminOnly: true, description: "Call a roll call" }],
      ["kick", kick, { adminOnly: true, description: "Remove a user" }],
      ["clear", clear, { aliases: ["purge"], adminOnly: true, description: "Clear chat" }],
      ["lockdown", lockdown, { aliases: ["lock"], adminOnly: true, description: "Toggle admin-only mode" }],
      ["setwelcome", setWelcome, { aliases: ["welcome"], adminOnly: true, description: "Set the welcome message" }],
      ["setleave", setLeave, { aliases: ["leave"], adminOnly: true, description: "Set the leave message" }],
      ["autoadd", autoadd, { aliases: ["autoadduser"], adminOnly: true, description: "Toggle auto-add on leave" }],
      ["onlyadminon", onlyadminon, { aliases: ["onlyadmin"], adminOnly: true, description: "Turn on only-admin mode" }],
      ["onlyadminoff", onlyadminoff, { adminOnly: true, description: "Turn off only-admin mode" }],
      ["removeinactive", removeinactive, { aliases: ["cleangroups", "prune"], adminOnly: true, description: "Leave idle groups" }],
      ["userinfo", userinfo, { aliases: ["whois", "info"], description: "Look up a user" }],
      ["checkpol", checkpol, { aliases: ["check", "record"], adminOnly: true, description: "Check a user's record" }],
      ["adminhelp", adminHelp, { aliases: ["adminguide", "policelist"], description: "Admin help" }],
    ]),
  ],
};
