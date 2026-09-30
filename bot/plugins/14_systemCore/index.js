/**
 * ⑭ ALL SYSTEM CORE — 20 commands.
 *
 * Bot control, plugin management, rules and support. This category also owns
 * `kit.js`, the command factory that replaced `bot/plugins/_shared`.
 *
 * The `menu` and `help` commands are handled by `core/actions.js` (which runs
 * first so the styled menu always wins), but they are registered here too so
 * the System Core page in the menu lists them.
 */

const { command, commands } = require("./kit");
const { getRegistry, reloadPlugin, setPluginEnabled } = require("../../core/loader");
const { isReady, models } = require("../../core/mongo");
const { isGlobalAdmin } = require("../../utils/group");
const { RULES, LANGS, VAULT_TIERS, RARITY_LIST } = require("../../data/lists");
const { renderPage, renderIndex, parsePage, getPages, MENU_TITLE, CATEGORY_GLYPHS, RULE } = require("../../utils/menuFormatter");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, titleCase } = require("../../utils/format");

const path = require("path");
const PLUGIN_DIR = path.join(__dirname, "..");

function deny(ctx, what) {
  return ctx.send(`🛑 **${what}** is for the bot owner only.`);
}

/* ── 1. menu / 2. help / 3. commands ────────────────────────────────────── */

async function menu(ctx) {
  const page = parsePage(ctx.args[0]);
  if (ctx.args[0] && !page) {
    await ctx.send([
      MENU_TITLE,
      "",
      "Pick a page from ① to ⑭ — or just send a command with no page.",
      "",
      renderIndex().split("\n").slice(2).join("\n"),
      "",
      RULE,
      `_Type ${ctx.prefix}menu ①_`,
    ].join("\n"));
    return;
  }
  await ctx.send(ctx.args[0] ? renderPage(page.index) : renderIndex());
}

async function help(ctx) {
  await menu(ctx);
}

async function commandsList(ctx) {
  const reg = getRegistry();
  const lines = reg.categories.map((c, i) =>
    `  ${CATEGORY_GLYPHS[i]} **${c.emoji} ${c.label}** — ${c.commands.length} commands`);
  await ctx.send([MENU_TITLE, "", "**Every category**", ...lines].join("\n"));
}

/* ── 4. commandcount / 5. categories ────────────────────────────────────── */

async function commandCount(ctx) {
  const reg = getRegistry();
  const lines = reg.categories.map((c) => `  ${c.emoji} ${c.label}: ${c.commands.length}`);
  const total = reg.categories.reduce((n, c) => n + c.commands.length, 0);
  await ctx.send([
    "🔢 Command count",
    ...lines,
    `📦 Total: ${fmt(total)} commands across ${reg.categories.length} categories`,
  ].join("\n"));
}

async function categories(ctx) {
  const reg = getRegistry();
  const lines = reg.categories.map((c, i) => `  ${CATEGORY_GLYPHS[i]} ${c.emoji} ${c.key} — ${c.commands.length} cmds`);
  await ctx.send([`📂 ${reg.categories.length} categories`, ...lines].join("\n"));
}

/* ── 6. plugins / 7. pluginreload / 8. pluginenable / 9. plugindisable ───── */

async function plugins(ctx) {
  const reg = getRegistry();
  const lines = reg.categories.map((c, i) => {
    const on = !reg.disabled.has(c.key);
    return `  ${CATEGORY_GLYPHS[i]} ${c.emoji} ${c.key} — ${c.commands.length} cmds ${on ? "🟢" : "🔴"}`;
  });
  await ctx.send([`🧩 ${reg.categories.length} plugins`, ...lines].join("\n"));
}

async function pluginReload(ctx) {
  if (!isGlobalAdmin(ctx.event.senderID)) return deny(ctx, "pluginreload");
  const category = ctx.args[0];
  if (!category) return ctx.send(`Usage: **${ctx.prefix}pluginreload [category]**\nSee: **${ctx.prefix}plugins**`);
  try {
    const loaded = reloadPlugin(PLUGIN_DIR, category);
    await ctx.send(loaded
      ? `✅ Reloaded **${category}** — ${loaded.commands.length} commands.`
      : `⚠️ Could not load **${category}**. Check the folder name.`);
  } catch (error) {
    await ctx.send(`⚠️ Reload failed: ${error.message}`);
  }
}

async function pluginEnable(ctx) {
  if (!isGlobalAdmin(ctx.event.senderID)) return deny(ctx, "pluginenable");
  const category = ctx.args[0];
  if (!category) return ctx.send(`Usage: **${ctx.prefix}pluginenable [category]**`);
  setPluginEnabled(category, true);
  await ctx.send(`✅ **${category}** is back online.`);
}

async function pluginDisable(ctx) {
  if (!isGlobalAdmin(ctx.event.senderID)) return deny(ctx, "plugindisable");
  const category = ctx.args[0];
  if (!category) return ctx.send(`Usage: **${ctx.prefix}plugindisable [category]**`);
  setPluginEnabled(category, false);
  await ctx.send(`🛑 **${category}** is now offline.`);
}

/* ── 10. status / 11. uptime / 12. ping / 13. version / 14. owner ────────── */

async function status(ctx) {
  const reg = getRegistry();
  const up = Math.floor((Date.now() - (global.ikonBotStart || Date.now())) / 1000);
  await ctx.send([
    "📊 iKON-BOT status",
    `🟢 Uptime: ${fmt(up)}s`,
    `🔤 Prefix: ${ctx.prefix}`,
    `📦 ${reg.totalCommands} commands / ${reg.categories.length} categories`,
    `💾 Mongo: ${isReady() ? "connected" : "offline-safe mode"}`,
    `🔑 Gemini: ${process.env.GEMINI_KEY ? "configured" : "not configured"}`,
    `🌐 Group: ${ctx.thread.threadId}`,
  ].join("\n"));
}

async function uptime(ctx) {
  const up = Math.floor((Date.now() - (global.ikonBotStart || Date.now())) / 1000);
  const h = Math.floor(up / 3600);
  const m = Math.floor((up % 3600) / 60);
  await ctx.send([
    "⏱️ Uptime",
    `⏳ ${fmt(up)} seconds (${h}h ${m}m)`,
    `📊 Started: ${new Date(global.ikonBotStart || Date.now()).toISOString().slice(0, 19).replace("T", " ")} UTC`,
  ].join("\n"));
}

async function ping(ctx) {
  const t0 = Date.now();
  await ctx.send("🏓 Pong!");
  void t0;
  await ctx.send(`⚡ Round trip: ${Date.now() - t0}ms`);
}

async function version(ctx) {
  const reg = getRegistry();
  await ctx.send([
    "🤖 iKON-BOT v5.0 Divine",
    `📦 ${reg.totalCommands} commands`,
    `🧩 ${reg.categories.length} categories`,
    "🛠️ ws3-fca • Express • MongoDB • Gemini 2.5 Flash",
  ].join("\n"));
}

async function owner(ctx) {
  const owner = String(process.env.OWNER || "Aphecks");
  await ctx.send([
    "👑 Bot owner",
    `👤 ${owner}`,
    `🆔 Admin IDs: ${(process.env.ADMIN_IDS || "").split(",").filter(Boolean).length} configured`,
  ].join("\n"));
}

/* ── 15. invite / 16. support / 17. rules / 18. guide ───────────────────── */

async function invite(ctx) {
  await ctx.send([
    "📨 Invite",
    `Add **${ctx.user.name}** to your group and type **${ctx.prefix}menu**.`,
    "Every category works in any group — set a prefix with the setprefix command.",
  ].join("\n"));
}

async function support(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    "🛟 Support",
    `◦ ${p}menu — everything the bot can do`,
    `◦ ${p}rules — group rules`,
    `◦ ${p}systemhelp — category overview`,
    `◦ ${p}status — is the bot healthy?`,
    `◦ ${p}ping — is it responsive?`,
    "◦ Admin? " + `${p}admin — your control panel`,
  ].join("\n"));
}

async function rules(ctx) {
  const lines = RULES.map((r, i) => `  ${i + 1}. ${r}`);
  const chunks = renderList({ title: "📋 Group rules", items: lines, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function guide(ctx) {
  const p = ctx.prefix;
  const pages = getPages();
  const lines = pages.map((page, i) => `  ${page.glyph} ${page.headline.replace(/^_\*|\*_$/g, "")}`);
  await ctx.send([
    "📖 Getting started",
    "",
    "① Pick a page to see its commands.",
    "",
    ...lines,
    "",
    `◦ ${p}menu ① — first page`,
    `◦ ${p}menu ⑤ — admin controls`,
    `◦ ${p}menu ⑭ — this page`,
    "",
    "💡 Tip: commands work with or without a space after the prefix.",
    `   ${p}menu and ${p} menu both work.`,
  ].join("\n"));
}

/* ── 19. language / 20. systemhelp ──────────────────────────────────────── */

async function language(ctx) {
  const arg = ctx.args.join(" ").toLowerCase();
  if (!arg) {
    return ctx.send([
      `🌐 Current language: **${ctx.thread.language || "en"}**`,
      `Set one: **${ctx.prefix}language [name]**`,
      `Available: ${LANGS.join(", ")}`,
    ].join("\n"));
  }
  if (!LANGS.some((l) => l.toLowerCase() === arg)) {
    return ctx.send(`❓ Unknown language "${ctx.args.join(" ")}".\nAvailable: ${LANGS.join(", ")}`);
  }
  const name = LANGS.find((l) => l.toLowerCase() === arg);
  const { setThreadFlag } = require("../../utils/group");
  await setThreadFlag(ctx.thread.threadId, "language", name);
  await ctx.send(`🌐 Language set to **${name}**.`);
}

async function systemHelp(ctx) {
  const p = ctx.prefix;
  const reg = getRegistry();
  const lines = reg.categories.map((c, i) => `  ${CATEGORY_GLYPHS[i]} ${c.emoji} ${c.label} — ${c.commands.length}`);
  await ctx.send([
    "⚙️ System Core",
    `📦 ${reg.totalCommands} commands, ${reg.categories.length} categories`,
    "",
    ...lines,
    "",
    `◦ ${p}menu [①-⑭] — the full command list`,
    `◦ ${p}commandcount / ${p}categories / ${p}plugins`,
    `◦ ${p}status / ${p}uptime / ${p}ping / ${p}version`,
    `◦ ${p}rules / ${p}guide / ${p}support / ${p}language`,
    `◦ ${p}invite / ${p}owner`,
    "",
    `🔐 Vault tiers: ${VAULT_TIERS.length}`,
    `💎 Pet rarities: ${RARITY_LIST.length}`,
  ].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: commands([
    ["menu", menu, { aliases: ["help", "commands"], description: "The command menu" }],
    ["commandcount", commandCount, { description: "Count commands" }],
    ["categories", categories, { description: "List categories" }],
    ["plugins", plugins, { description: "List plugins" }],
    ["pluginreload", pluginReload, { adminOnly: true, description: "Reload a plugin" }],
    ["pluginenable", pluginEnable, { adminOnly: true, description: "Enable a plugin" }],
    ["plugindisable", pluginDisable, { adminOnly: true, description: "Disable a plugin" }],
    ["status", status, { description: "Bot status" }],
    ["uptime", uptime, { description: "Bot uptime" }],
    ["ping", ping, { aliases: ["pong"], description: "Check responsiveness" }],
    ["version", version, { aliases: ["about"], description: "Bot version" }],
    ["owner", owner, { description: "Bot owner" }],
    ["invite", invite, { description: "How to add the bot" }],
    ["support", support, { description: "Get help" }],
    ["rules", rules, { description: "Group rules" }],
    ["guide", guide, { description: "Getting started" }],
    ["language", language, { description: "Set the language" }],
    ["systemhelp", systemHelp, { aliases: ["syshelp", "systembot"], description: "System overview" }],
    ["unsend", unsendPassthrough, { description: "Pull back recent messages" }],
    ["feedback", feedback, { description: "Send feedback" }],
  ]),
};

/**
 * `.unsend` is implemented in `core/actions.js` (it needs the raw api and the
 * message log, and must work for everyone). This registration exists so the
 * command shows up in the System Core listing and in `.commandcount`.
 */
async function unsendPassthrough(ctx) {
  const { unsendRecent } = require("../../utils/group");
  const result = await unsendRecent(ctx.api, ctx.thread.threadId, 30000);
  await ctx.send(result.unsent
    ? `🧹 Pulled back ${result.unsent} recent message(s).`
    : "🧹 Nothing recent to unsend.");
}

async function feedback(ctx) {
  const text = ctx.args.join(" ").trim();
  if (!text) return ctx.send(`Usage: **${ctx.prefix}feedback [your message]**`);
  if (isReady()) {
    await models.EventLog.create({
      threadId: ctx.thread.threadId,
      userId: String(ctx.event.senderID),
      action: "feedback",
      details: { text: text.slice(0, 500) },
    });
  }
  await ctx.send([
    "📬 Thanks — your feedback was recorded.",
    "🛠️ The owner can read it with the EventLog collection.",
  ].join("\n"));
}
