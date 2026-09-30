/**
 * Built-in actions.
 *
 * These run *before* a plugin's own handler, so anything registered here takes
 * precedence over a same-named plugin command. Kept deliberately small: the
 * menu, the profile/balance surfaces, the money primitives, the AI bridge, and
 * the global plugin switches.
 *
 * Group moderation lives in `05_adminPolice`, the arcade table games in
 * `04_casinoArcade`, and the list/index commands in `14_systemCore` — do not
 * re-add them here or they will shadow the plugin handlers.
 */

const path = require("path");
const axios = require("axios");
const { box } = require("../utils/box");
const { reloadPlugin, setPluginEnabled, getRegistry } = require("./loader");
const { getUser, adjustMoney, depositBank, withdrawBank, addXp } = require("../utils/economy");
const { isGlobalAdmin, setPrefix, unsendRecent } = require("../utils/group");
const { getLyrics, getFootballUpdates } = require("../utils/helpers");
const { renderPage, renderIndex, parsePage, MENU_TITLE, RULE } = require("../utils/menuFormatter");
const { fmt, bar, titleCase, parseAmount } = require("../utils/format");
const { findPet } = require("../data/pets");

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Commands handled here. Kept for diagnostics and for the `!commands` page. */
const builtInCommands = new Set([
  "menu", "help", "commands", "ping", "about", "version", "uptime", "status",
  "balance", "bal", "bank", "wallet", "cash", "networth", "profile", "me", "uid",
  "deposit", "save", "withdraw", "get", "transfer", "rob",
  "daily", "claim", "work", "beg", "pet", "pets", "petcard", "petstats", "adopt",
  "battle", "petbattle", "duel", "slots",
  // AI and translate are owned by 07_aiSystems; see the note above.
  "lyrics", "football",
  "setprefix", "unsend", "admin", "mute", "unmute", "clear", "tagall",
  "plugin_reload", "plugin_disable", "plugin_enable",
]);

/** Call Gemini. Returns generated text. */
async function geminiCall(prompt, maxTokens = 1024) {
  if (!process.env.GEMINI_KEY) throw new Error("GEMINI_KEY is not configured 😅");
  const response = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8, topP: 0.95 },
  }, {
    headers: { "x-goog-api-key": process.env.GEMINI_KEY, "Content-Type": "application/json" },
    timeout: 20000,
  });
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/** The first real mention in the event, falling back to the sender. */
function mentioned(ctx) {
  const m = ctx.event.mentions;
  if (m) {
    const first = Object.keys(m)[0];
    if (first) return first;
  }
  return ctx.args.find((a) => /^\d{5,}$/.test(a)) || null;
}

/**
 * Dispatch. Returns true when handled, false to fall through to the plugin's
 * own `run`.
 */
async function run(ctx) {
  const { name, args, thread } = ctx;
  const p = ctx.prefix || "!";

  /* ── Menu & info ─────────────────────────────────────────────────────── */

  if (name === "menu" || name === "help" || name === "commands") {
    const page = parsePage(args[0]);
    if (args[0] && !page) {
      await ctx.send([
        MENU_TITLE,
        "",
        "Pick a page from ① to ⑭:",
        "",
        renderIndex().split("\n").slice(2).join("\n"),
        "",
        RULE,
        `_Type ${p}menu ①_`,
      ].join("\n"));
      return true;
    }
    await ctx.send(args[0] ? renderPage(page.index) : renderIndex());
    return true;
  }

  if (name === "ping") {
    const started = global.ikonBotStart || Date.now();
    await ctx.send([
      "🏓 Pong!",
      `💫 iKON-BOT v5.0 Divine is online.`,
      `⏱️ Up for ${fmt(Math.floor((Date.now() - started) / 1000))}s • ${getRegistry().totalCommands} commands.`,
    ].join("\n"));
    return true;
  }

  if (name === "about" || name === "version") {
    await ctx.send([
      "🤖 About iKON-BOT",
      "✨ iKON-BOT v5.0 Divine ✨",
      "Built with ❤️ by Aphecks",
      "ws3-fca • Express • MongoDB • Gemini 2.5 Flash",
      `${getRegistry().categories.length} categories • ${getRegistry().totalCommands} commands`,
    ].join("\n"));
    return true;
  }

  if (name === "uptime" || name === "status") {
    const started = global.ikonBotStart || Date.now();
    const seconds = Math.floor((Date.now() - started) / 1000);
    await ctx.send([
      "⏱️ iKON-BOT Uptime",
      `⏳ ${fmt(seconds)} seconds (${fmt(Math.floor(seconds / 60))} minutes)`,
      `📦 ${getRegistry().totalCommands} commands across ${getRegistry().categories.length} categories`,
      `💾 Mongo: ${require("./mongo").isReady() ? "connected" : "offline-safe"}`,
    ].join("\n"));
    return true;
  }

  /* ── Identity & money ────────────────────────────────────────────────── */

  if (name === "profile" || name === "me") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const level = user.level || 1;
    const xp = user.xp || 0;
    const need = level * 100;
    await ctx.send([
      `👤 ${user.name || ctx.profile.name}`,
      `🆔 UID: ${user.uid || "—"}`,
      `⭐ Level ${level}  ${bar(xp, need)} ${fmt(xp)}/${fmt(need)} XP`,
      `💰 Wallet ${fmt(user.money || 0)} • 🏦 Bank ${fmt(user.bank || 0)}`,
      `🐾 Pets ${(user.pets || []).length} • 🎒 Items ${(user.inventory || []).length}`,
    ].join("\n"));
    return true;
  }

  if (name === "uid") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    await ctx.send(`🆔 Your UID: ${user.uid || "—"}`);
    return true;
  }

  // `! bal` and `!bal` both land here — the router already trimmed the prefix.
  if (["balance", "bal", "wallet", "cash"].includes(name)) {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    await ctx.send([
      "💰 Balance",
      `👛 Wallet: ${fmt(user.money || 0)} coins`,
      `🏦 Bank:   ${fmt(user.bank || 0)} coins`,
      `💎 Net:    ${fmt((user.money || 0) + (user.bank || 0))} coins`,
      thread && thread.bankProtection === false ? "⚠️ Bank protection is OFF in this group." : "🛡️ Bank protection is ON.",
    ].join("\n"));
    return true;
  }

  if (name === "bank" || name === "vault") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const tier = user.bank >= 1000000 ? "Divine" : user.bank >= 100000 ? "Platinum"
      : user.bank >= 10000 ? "Gold" : user.bank >= 1000 ? "Silver" : "Bronze";
    await ctx.send([
      "🏦 Bank",
      `💳 Balance: ${fmt(user.bank || 0)} coins`,
      `🏅 Tier: ${tier}`,
      `📈 Daily interest: ${fmt(Math.floor((user.bank || 0) * 0.01))} coins`,
      `🛡️ Protection: ${thread && thread.bankProtection === false ? "OFF" : "ON"}`,
      "",
      `Deposit: ${p}deposit [amount]   Withdraw: ${p}withdraw [amount]`,
    ].join("\n"));
    return true;
  }

  if (name === "networth") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    await ctx.send(`💎 Net worth: ${fmt((user.money || 0) + (user.bank || 0))} coins`);
    return true;
  }

  if (name === "deposit" || name === "save") {
    const amount = parseAmount(args[0]);
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    if (amount == null) { await ctx.send(`Usage: ${p}deposit [amount]`); return true; }
    if (amount > (user.money || 0)) { await ctx.send(`💸 You only have ${fmt(user.money)} coins in your wallet.`); return true; }
    await depositBank(ctx.event.senderID, amount, ctx.profile.name);
    await ctx.send(`🏦 Deposited ${fmt(amount)} coins. New bank balance: ${fmt(user.bank + amount)}.`);
    return true;
  }

  if (name === "withdraw" || name === "get") {
    const amount = parseAmount(args[0]);
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    if (amount == null) { await ctx.send(`Usage: ${p}withdraw [amount]`); return true; }
    if (thread && thread.bankProtection !== false && amount > (user.bank || 0)) {
      await ctx.send(`🛡️ Bank protection: you only have ${fmt(user.bank)} in the bank.`);
      return true;
    }
    if (amount > (user.bank || 0)) { await ctx.send(`🏦 You only have ${fmt(user.bank)} in the bank.`); return true; }
    await withdrawBank(ctx.event.senderID, amount, ctx.profile.name);
    await ctx.send(`👛 Withdrew ${fmt(amount)} coins. New wallet: ${fmt(user.money + amount)}.`);
    return true;
  }

  if (name === "transfer" || name === "donate") {
    const target = mentioned(ctx);
    const amount = parseAmount(args.find((a) => /\d/.test(a)));
    if (!target || amount == null) { await ctx.send(`Usage: ${p}${name} @user [amount]`); return true; }
    const me = await getUser(ctx.event.senderID, ctx.profile.name);
    if (target === String(ctx.event.senderID)) { await ctx.send("🙃 You can't pay yourself."); return true; }
    if (amount > (me.money || 0)) { await ctx.send(`💸 You only have ${fmt(me.money)} coins.`); return true; }
    const them = await getUser(target, "Facebook user");
    await adjustMoney(ctx.event.senderID, -amount, ctx.profile.name);
    await adjustMoney(target, amount, them.name);
    await ctx.send(`💸 Sent ${fmt(amount)} coins to ${them.name || "them"}.`);
    return true;
  }

  if (name === "rob" && thread.enableRob !== false) {
    const target = mentioned(ctx);
    if (!target) { await ctx.send(`🔫 Rob who? Tag someone: ${p}rob @user`); return true; }
    const victim = await getUser(target, "Facebook user");
    const stolen = Math.floor((victim.money || 0) * 0.3);
    if (stolen <= 0) { await ctx.send("💸 They're broke — nothing to take. 😅"); return true; }
    await adjustMoney(target, -stolen);
    await adjustMoney(ctx.event.senderID, stolen, ctx.profile.name);
    await ctx.send([
      "🔫 Heist success!",
      `🎯 You stole ${fmt(stolen)} coins from ${victim.name || "them"}.`,
      "💨 Run before the cops notice!",
    ].join("\n"));
    return true;
  }

  if (name === "daily" || name === "claim") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    await adjustMoney(ctx.event.senderID, 500, ctx.profile.name);
    await addXp(ctx.event.senderID, 25, ctx.profile.name);
    await ctx.send([
      "🎁 Daily reward claimed!",
      "💰 +500 coins",
      "⭐ +25 XP",
      `💳 Wallet: ${fmt(user.money + 500)} coins`,
    ].join("\n"));
    return true;
  }

  if (name === "work") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const pay = 100 + Math.floor(Math.random() * 200);
    await adjustMoney(ctx.event.senderID, pay, ctx.profile.name);
    await addXp(ctx.event.senderID, 10, ctx.profile.name);
    await ctx.send([
      "💼 Shift complete!",
      `💰 +${fmt(pay)} coins`,
      `💳 Wallet: ${fmt((user.money || 0) + pay)} coins`,
    ].join("\n"));
    return true;
  }

  if (name === "beg") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const pay = 10 + Math.floor(Math.random() * 40);
    await adjustMoney(ctx.event.senderID, pay, ctx.profile.name);
    await ctx.send(`🙏 Someone gave you ${fmt(pay)} coins. Wallet: ${fmt((user.money || 0) + pay)}.`);
    return true;
  }

  /* ── Pets ────────────────────────────────────────────────────────────── */

  if (name === "pet" || name === "pets") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const list = user.pets || [];
    if (!list.length) {
      await ctx.send(`🐾 You have no pets yet. Try **${p}adopt** to get one!`);
      return true;
    }
    const lines = list.slice(0, 10).map((pet, i) => {
      const power = pet.power || 10;
      return `  ${i + 1}. ${pet.emoji || "🐾"} ${pet.name} [${"■".repeat(Math.min(5, Math.ceil(power / 30)))}${"□".repeat(Math.max(0, 5 - Math.ceil(power / 30)))}] ${pet.rarity || "Common"}`;
    });
    await ctx.send([`🐾 Your pets (${list.length})`, ...lines].join("\n"));
    return true;
  }

  if (name === "petcard" || name === "petstats") {
    const pet = findPet(args[0]);
    if (!pet) { await ctx.send(`❓ No pet called "${args[0] || ""}". Use **${p}petlist** to see all 50.`); return true; }
    await ctx.send([
      `🐾 ${pet.emoji} ${pet.name}`,
      `💎 Rarity: ${pet.rarity}  •  ⚔️ Power: ${pet.power}  [${"■".repeat(Math.min(10, Math.ceil(pet.power / 20)))}${"□".repeat(Math.max(0, 10 - Math.ceil(pet.power / 20)))}]`,
      `❤️ HP: ${pet.hp}  •  🜁 Type: ${pet.type}`,
      `📖 ${pet.lore}`,
      `⚔️ Skills: ${pet.skills.map((s) => s.name).join(", ")}`,
    ].join("\n"));
    return true;
  }

  if (name === "adopt") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const query = args.join(" ").trim();
    const pet = findPet(query);
    if (!pet) { await ctx.send(`❓ No pet called "${query}". Use **${p}petlist** to see all 50.`); return true; }
    if ((user.pets || []).length >= 20) { await ctx.send("🐾 Your pet roster is full (20). Release one first."); return true; }
    const owned = [...(user.pets || []), { ...pet, level: 1, xp: 0 }];
    await setUserPets(ctx.event.senderID, owned);
    await ctx.send([
      `👑 ${pet.emoji} ${pet.name} joined you!`,
      `💎 ${pet.rarity} • ⚔️ ${pet.power} • 🜁 ${pet.type}`,
      `📖 ${pet.lore}`,
    ].join("\n"));
    return true;
  }

  /* ── Battle & casino ─────────────────────────────────────────────────── */

  if (name === "battle" || name === "petbattle" || name === "duel") {
    const target = mentioned(ctx);
    if (!target) { await ctx.send(`⚔️ Battle who? Tag someone: ${p}battle @user`); return true; }
    const me = await getUser(ctx.event.senderID, ctx.profile.name);
    const them = await getUser(target, "Facebook user");
    const myPower = (me.pets || []).reduce((n, pet) => n + (pet.power || 10), 0) || 20;
    const theirPower = (them.pets || []).reduce((n, pet) => n + (pet.power || 10), 0) || 20;
    const roll = Math.random();
    const win = myPower * roll > theirPower * Math.random();
    await ctx.send([
      "⚔️ Battle!",
      `🧑 ${me.name}: ${fmt(myPower)} power`,
      `🧑 ${them.name || "Opponent"}: ${fmt(theirPower)} power`,
      win ? `🏆 You win! +30 XP` : "💀 You lost this round.",
    ].join("\n"));
    if (win) await addXp(ctx.event.senderID, 30, ctx.profile.name);
    return true;
  }

  if (name === "slots") {
    const bet = parseAmount(args[0]);
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    if (bet == null) { await ctx.send(`🎰 Usage: ${p}slots [amount]`); return true; }
    if (bet > (user.money || 0)) { await ctx.send(`💸 You only have ${fmt(user.money)} coins.`); return true; }
    const symbols = ["🍒", "🍋", "⭐", "💎", "👑"];
    const reel = [0, 0, 0].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    const triple = reel[0] === reel[1] && reel[1] === reel[2];
    const payout = triple ? bet * 4 : 0;
    await adjustMoney(ctx.event.senderID, payout - bet, ctx.profile.name);
    await ctx.send([
      "🎰 Slots",
      `🎰 ${reel.join(" ")} 🎰`,
      triple ? `🎉 TRIPLE! +${fmt(payout)} coins` : `🔸 No match. -${fmt(bet)} coins.`,
      `💳 Wallet: ${fmt((user.money || 0) - bet + payout)} coins`,
    ].join("\n"));
    return true;
  }

  /* ── AI bridge ───────────────────────────────────────────────────────── */
  //
  // NOTE: the AI commands are NOT handled here. `07_aiSystems` owns ai / ask /
  // chat / imagine / describe / translate / remix and routes every call through
  // its own askGemini(), which applies the user's persona. Handling them here
  // would shadow those handlers with a persona-less stub.

  if (name === "lyrics") {
    const song = args.join(" ");
    if (!song) { await ctx.send(`🎵 Usage: ${p}lyrics [artist - song]`); return true; }
    await ctx.send(await getLyrics(song.split("-")[0], song.split("-").slice(1).join("-") || song));
    return true;
  }

  if (name === "football") {
    const res = await getFootballUpdates();
    if (!res) { await ctx.send("⚽ Football updates need FOOTBALL_API_KEY configured."); return true; }
    await ctx.send(["⚽ Live fixtures", ...res.map((f) => `  ${f}`)].join("\n"));
    return true;
  }

  /* ── Group controls ──────────────────────────────────────────────────── */

  if (name === "setprefix") {
    if (!admin) { await ctx.send("🛑 Only admins can change the prefix."); return true; }
    const next = (args[0] || "").trim();
    if (!next || next.length > 2) { await ctx.send(`Usage: ${p}setprefix [1-2 chars]`); return true; }
    await setPrefix(thread.threadId, next);
    await ctx.send(`⚡ Prefix is now **${next}**`);
    return true;
  }

  if (name === "unsend") {
    const result = await unsendRecent(ctx.api, thread.threadId, 30000);
    await ctx.send(result.unsent
      ? `🧹 Pulled back ${result.unsent} recent message(s).`
      : "🧹 Nothing recent to unsend.");
    return true;
  }

  /* ── Plugin admin (global owner only) ────────────────────────────────── */
  //
  // NOTE: group moderation (ban, mute, welcome, auto-add, lockdown, cleanup)
  // is deliberately NOT handled here. `05_adminPolice` owns those commands, and
  // because the router runs this dispatcher first, handling them here would
  // shadow the plugin's handlers with these weaker stubs.

  if (name === "plugin_reload" && isGlobalAdmin(ctx.event.senderID)) {
    const category = args[0];
    if (!category) { await ctx.send(`Usage: ${p}plugin_reload [category]`); return true; }
    try {
      reloadPlugin(path.join(__dirname, "..", "plugins"), category);
      await ctx.send(`✅ Plugin **${category}** reloaded. 🔄`);
    } catch (error) {
      await ctx.send(`⚠️ Reload failed: ${error.message}`);
    }
    return true;
  }

  if (name === "plugin_disable" && isGlobalAdmin(ctx.event.senderID)) {
    const category = args[0];
    if (!category) { await ctx.send(`Usage: ${p}plugin_disable [category]`); return true; }
    setPluginEnabled(category, false);
    await ctx.send(`🛑 **${category}** is now offline.`);
    return true;
  }

  if (name === "plugin_enable" && isGlobalAdmin(ctx.event.senderID)) {
    const category = args[0];
    if (!category) { await ctx.send(`Usage: ${p}plugin_enable [category]`); return true; }
    setPluginEnabled(category, true);
    await ctx.send(`✅ **${category}** is back online.`);
    return true;
  }

  return false;
}

/** Persist a user's pet roster. */
async function setUserPets(facebookId, pets) {
  const { models, isReady } = require("./mongo");
  if (isReady()) return models.User.findOneAndUpdate({ facebookId }, { $set: { pets } }, { new: true });
  const { getUser } = require("../utils/economy");
  const user = await getUser(facebookId);
  user.pets = pets;
  return user;
}

module.exports = { run, geminiCall, GEMINI_MODEL, builtInCommands, mentioned, setUserPets };