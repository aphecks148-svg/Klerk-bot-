const axios = require("axios");
const { getRegistry, reloadPlugin, setPluginEnabled } = require("./loader");
const { box } = require("../utils/box");
const { getUser, adjustMoney, depositBank, withdrawBank, addXp } = require("../utils/economy");
const { addAdmin, removeAdmin, muteUser, unmuteUser } = require("../utils/thread");
const { getEmoji, getJoke, getMention, translate, getLyrics, getPinterest, getFootballUpdates } = require("../utils/helpers");
const { models, isReady } = require("./mongo");
const { PETS, findPet } = require("../data/pets");
const { getMenuAsBox } = require("../utils/menuFormatter");
const { setPrefix } = require("../utils/thread");

const adminIds = () => new Set(String(process.env.ADMIN_IDS || "").split(",").map((id) => id.trim()).filter(Boolean));
const isAdmin = (id) => adminIds().has(String(id));
const isThreadAdmin = (ctx) => isAdmin(ctx.event.senderID) || (ctx.thread && ctx.thread.admins && ctx.thread.admins.includes(ctx.event.senderID));

// Gemini 2.5 Flash model endpoint
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Call Gemini 2.5 Flash API with a text prompt.
 * Returns the generated text response.
 */
async function geminiCall(prompt, maxTokens = 1024) {
  if (!process.env.GEMINI_KEY) throw new Error("GEMINI_KEY is not configured in environment variables 😅");
  const response = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      topP: 0.95,
    },
  }, {
    headers: { "x-goog-api-key": process.env.GEMINI_KEY, "Content-Type": "application/json" },
    timeout: 15000,
  });
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response 🤔");
  return text.trim();
}

// Set of command names that are handled by the built-in actions.run dispatcher.
// Commands NOT in this set will fall through to the plugin's default run handler.
const builtInCommands = new Set([
  "menu", "help", "ping", "about", "version",
  "profile", "me", "rank", "balance", "bal", "uid",
  "daily", "claim", "work", "beg",
  "deposit", "withdraw", "transfer", "rob",
  "pet", "petlist", "adopt", "petcard", "petstats",
  "battle", "petbattle", "duel",
  "slots",
  "ai", "ask", "gemini", "imagine", "image", "chat",
  "admin", "settings", "config", "ban", "unban", "mute", "unmute",
  "setprefix", "plugin_reload", "plugin_disable", "plugin_enable", "uptime",
]);

/**
 * Built-in command handler dispatcher.
 * Returns true if the command was handled, false otherwise.
 */
async function run(ctx) {
  const { name, args, command, thread } = ctx;

  // Check admin-only commands
  if (!isThreadAdmin(ctx) && thread.onlyAdminCmds && thread.onlyAdminCmds.includes(name)) {
    ctx.send(box("🛑 Hold up, admin-only!", [
      `Hey friend! 👋 The **${name}** command is reserved for group admins.`,
      `Ask an admin to run it for you! 😊`,
    ]));
    return true;
  }

  // 📋 MENU & INFO
  if (name === "menu" || name === "help") {
    const page = Math.max(1, Math.min(10, Number(args[0]) || 1));
    ctx.send(getMenuAsBox(page));
    return true;
  }

  if (name === "ping") {
    ctx.send(box("🏓 Pong!", [
      `Hey there! 🤖 I'm alive and kicking!`,
      `💫 iKON-BOT v5.0 Divine is online and ready to help!`,
    ]));
    return true;
  }

  if (name === "about" || name === "version") {
    ctx.send(box("🤖 About iKON-BOT", [
      `✨ iKON-BOT v5.0 Divine ✨`,
      `Built with ❤️ by Aphecks`,
      `Powered by ws3-fca • Express • MongoDB • Gemini 2.5 Flash`,
      `Say hello to your friendly neighborhood bot! 😄`,
    ]));
    return true;
  }

  // 👤 USER PROFILE
  if (name === "profile" || name === "me" || name === "rank") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    ctx.send(box("👤 Your Profile", [
      `Name: ${ctx.profile.name}`,
      `💰 Wallet: ${user.money} coins`,
      `🏦 Bank: ${user.bank} coins`,
      `⭐ Level: ${user.level}`,
      `📈 XP: ${user.xp}/${user.level * 100}`,
      `🆔 UID: ${user.uid}`,
      `🐾 Pets: ${(user.pets || []).length}`,
    ]));
    return true;
  }

  if (name === "balance" || name === "bal") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    ctx.send(box("💰 Your Balance", [
      `💵 Wallet: ${user.money} coins`,
      `🏦 Bank: ${user.bank} coins`,
      `💎 Total: ${(user.money || 0) + (user.bank || 0)} coins`,
    ]));
    return true;
  }

  if (name === "uid") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    ctx.send(box("🆔 Your UID", [user.uid || "Not assigned yet"]));
    return true;
  }

  // 💰 ECONOMY
  if (name === "daily" || name === "claim") {
    const amount = name === "daily" ? 500 : 250;
    await adjustMoney(ctx.event.senderID, amount, ctx.profile.name);
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    ctx.send(box("🎁 Daily Reward!", [
      `Yay! 🎉 You claimed your daily reward of **${amount} coins**!`,
      `💼 New balance: ${user.money} coins`,
      `Come back tomorrow for more! 😊`,
    ]));
    return true;
  }

  if (name === "work" || name === "beg") {
    const amount = name === "work" ? 100 : Math.floor(Math.random() * 40) + 10;
    await adjustMoney(ctx.event.senderID, amount, ctx.profile.name);
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const msg = name === "work" ? `You worked a shift and earned **${amount} coins**! 💼` : `People gave you **${amount} coins** because you looked cute! 🥺`;
    ctx.send(box("💸 Cash earned!", [
      msg,
      `💰 New balance: ${user.money} coins`,
    ]));
    return true;
  }

  if (name === "deposit") {
    const amt = parseInt(args[0]) || 0;
    if (amt <= 0) { ctx.send(box("⚠️ Oops!", ["Use: !deposit [amount] — I need a number! 🔢"])); return true; }
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    if ((user.money || 0) < amt) { ctx.send(box("💸 Not enough cash!", [`You only have ${user.money || 0} coins. Maybe try working or begging? 💼`])); return true; }
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { money: user.money - amt, bank: (user.bank || 0) + amt } });
    else { user.money = (user.money || 0) - amt; user.bank = (user.bank || 0) + amt; }
    const updated = await getUser(ctx.event.senderID, ctx.profile.name);
    ctx.send(box("🏦 Deposit successful!", [
      `📥 Saved **${amt} coins** into your bank!`,
      `💵 Wallet: ${updated.money || 0} | 🏦 Bank: ${updated.bank || 0}`,
    ]));
    return true;
  }

  if (name === "withdraw") {
    const amt = parseInt(args[0]) || 0;
    if (amt <= 0) { ctx.send(box("⚠️ Oops!", ["Use: !withdraw [amount] — I need a number! 🔢"])); return true; }
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    if ((user.bank || 0) < amt) { ctx.send(box("🏦 Empty vault...", [`You only have ${user.bank || 0} coins in the bank. 💔`])); return true; }
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { money: (user.money || 0) + amt, bank: user.bank - amt } });
    else { user.money = (user.money || 0) + amt; user.bank = (user.bank || 0) - amt; }
    const updated = await getUser(ctx.event.senderID, ctx.profile.name);
    ctx.send(box("💰 Withdrawal successful!", [
      `📤 Withdrew **${amt} coins** from your bank!`,
      `💵 Wallet: ${updated.money || 0} | 🏦 Bank: ${updated.bank || 0}`,
    ]));
    return true;
  }

  if (name === "transfer" && thread.enableTransfer !== false) {
    const mentionId = getMention(ctx);
    const amt = parseInt(args.find((arg) => /^-?\d+$/.test(arg)) || 0) || 0;
    if (!mentionId || amt <= 0) { ctx.send(box("⚠️ Usage", ["!transfer [@user] [amount] — tag someone and enter an amount!"])); return true; }
    const sender = await getUser(ctx.event.senderID, ctx.profile.name);
    if ((sender.money || 0) < amt) { ctx.send(box("💸 Broke!", [`You need ${amt} coins but only have ${sender.money || 0}. Try working! 💼`])); return true; }
    if (isReady()) {
      await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $inc: { money: -amt } });
      await models.User.findOneAndUpdate({ facebookId: mentionId }, { $inc: { money: amt } });
    } else {
      sender.money = (sender.money || 0) - amt;
      const target = await getUser(mentionId, "Facebook user");
      target.money = (target.money || 0) + amt;
    }
    ctx.send(box("✅ Transfer complete!", [
      `💸 Sent **${amt} coins** to your friend!`,
      `They'll get a notification soon! 📩`,
    ]));
    return true;
  }

  if (name === "rob" && thread.enableRob !== false) {
    const mentionId = getMention(ctx);
    if (!mentionId) { ctx.send(box("🔫 Rob who?", ["Tag someone to rob! Use: !rob [@user]"])); return true; }
    const victim = await getUser(mentionId, "Facebook user");
    const stolen = Math.floor((victim.money || 0) * 0.3);
    if (stolen <= 0) { ctx.send(box("💸 Target is broke!", ["They have no money to steal! Maybe try being nice instead? 😅"])); return true; }
    if (isReady()) {
      await models.User.findOneAndUpdate({ facebookId: mentionId }, { $inc: { money: -stolen } });
      await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $inc: { money: stolen } });
    } else {
      victim.money = (victim.money || 0) - stolen;
      const robber = await getUser(ctx.event.senderID, ctx.profile.name);
      robber.money = (robber.money || 0) + stolen;
    }
    ctx.send(box("🔫 Heist success!", [
      `🎯 You stole **${stolen} coins**!`,
      `💨 Run before the cops arrive!`,
    ]));
    return true;
  }

  // 🐾 PETS
  if (name === "pet" || name === "petlist") {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const petList = (user.pets || []).slice(0, 5);
    const petInfo = petList.length > 0 ? petList.map((p, i) => `${i + 1}. ${p.name} - ${p.rarity} ⭐`).join("\n") : "No pets yet. Use !adopt to get one! 🐶";
    ctx.send(box("🐾 Your Pets", [petInfo]));
    return true;
  }

  if (name === "adopt") {
    const petName = args[0] || "Divine Pet";
    const pet = findPet(petName);
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    user.pets = [...(user.pets || []), { ...pet, acquiredAt: new Date().toISOString(), name: petName }];
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { pets: user.pets } });
    ctx.send(box("👑 New pet acquired! 🎉", [
      `🐾 ${petName || pet.name}`,
      `💎 Rarity: ${pet.rarity}`,
      `⚔️ Power: ${pet.power}`,
      `Welcome to the family! 🥰`,
    ]));
    return true;
  }

  if (name === "petcard" || name === "petstats") {
    const petName = args[0] || "Pup";
    const pet = findPet(petName);
    ctx.send(box("🐾 Pet Stats", [
      `${pet.name} - ${pet.rarity}`,
      `⚔️ Power: ${pet.power}`,
      `❤️ HP: ${pet.hp}`,
    ]));
    return true;
  }

  // ⚔️ BATTLE
  if (name === "battle" || name === "petbattle" || name === "duel") {
    const opponent = getMention(ctx);
    if (!opponent) { ctx.send(box("⚔️ Battle who?", ["Tag someone to battle! Use: !battle [@user]"])); return true; }
    ctx.send(box("⚔️ Let the battle begin!", [
      `🥊 Fight! Reply with a number (1-4) to attack!`,
      `May the odds be ever in your favor! 🍀`,
    ]));
    return true;
  }

  // 🎰 CASINO
  if (name === "slots") {
    const amt = parseInt(args[0]) || 0;
    if (amt <= 0) { ctx.send(box("🎰 Slots", ["Use: !slots [amount] — place your bet! 💰"])); return true; }
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    if ((user.money || 0) < amt) { ctx.send(box("💸 Not enough cash!", [`You need ${amt} coins. Try !work or !daily! 💼`])); return true; }
    const win = Math.random() > 0.6;
    const payout = win ? amt * 2.5 : 0;
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $inc: { money: payout - amt } });
    else { const u = await getUser(ctx.event.senderID, ctx.profile.name); u.money = (u.money || 0) + payout - amt; }
    ctx.send(box("🎰 Slots Result", [
      win ? `🎉 LUCKY! You won **${payout} coins**! 🍀` : `😢 Better luck next time! You lost ${amt} coins.`,
    ]));
    return true;
  }

  // 🤖 AI — now with Gemini 2.5 Flash
  if (name === "ai" || name === "ask" || name === "gemini") {
    const prompt = args.join(" ") || "Hello!";
    try {
      const response = await geminiCall(`You are iKON-BOT, a friendly Discord-like messenger bot. Respond conversationally and with personality. User: ${prompt}`, 2048);
      ctx.send(box("🤖 Gemini 2.5 Flash", [
        `Hey! 👋 Here's what **Gemini 2.5 Flash** thinks:`,
        ``,
        response,
      ]));
    } catch (error) {
      ctx.send(box("🤖 Gemini says:", [
        `Oops! 😢 I couldn't reach Gemini 2.5 Flash.`,
        `Error: ${error.message || "Something went wrong, try again!"}`,
        `Make sure GEMINI_KEY is set in your environment! 🛠️`,
      ]));
    }
    return true;
  }

  if (name === "imagine" || name === "image") {
    const prompt = args.join(" ") || "a beautiful landscape";
    ctx.send(box("🎨 Image generation", [
      `Generating an image of: "${prompt}"`,
      `🎨 Powered by Gemini 2.5 Flash! Coming right up! ✨`,
    ]));
    return true;
  }

  if (name === "chat") {
    const message = args.join(" ") || "Hi!";
    ctx.send(box("💬 Chat with iKON", [
      `Hey there! 👋 You said: "${message}"`,
      `I'm here to chat! What's on your mind? 💭`,
    ]));
    return true;
  }

  // 👑 ADMIN
  if (name === "admin") {
    if (!isAdmin(ctx.event.senderID)) {
      ctx.send(box("⛔ Nope!", [`You're not an admin. Try asking nicely! 😊`]));
      return true;
    }
    ctx.send(box("👑 Welcome, Admin!", [
      `Access: GLOBAL ADMIN`,
      `🛡️ Full bot controls enabled!`,
      `What would you like to do today? 😎`,
    ]));
    return true;
  }

  if (name === "settings" || name === "config") {
    if (!isAdmin(ctx.event.senderID)) {
      ctx.send(box("⛔ Nope!", [`Only admins can do that! 😉`]));
      return true;
    }
    ctx.send(box("⚙️ Bot Settings", [
      `📟 Prefix: ${process.env.PREFIX || "!"}`,
      `💬 Replies: ON`,
      `⚡ AutoReact: ON`,
      `⏱️ Cooldown: ON`,
      `🛡️ AntiSpam: ON`,
      `🧩 Modules: ACTIVE`,
    ]));
    return true;
  }

  if (name === "ban" && isAdmin(ctx.event.senderID)) {
    const mentionId = getMention(ctx);
    if (!mentionId) { ctx.send(box("⚠️ Who to ban?", ["Tag a user to ban! Use: !ban [@user]"])); return true; }
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: mentionId }, { $set: { banned: true } });
    ctx.send(box("🚫 User banned!", ["They've been removed from the server! 👋"]));
    return true;
  }

  if (name === "unban" && isAdmin(ctx.event.senderID)) {
    const mentionId = getMention(ctx);
    if (!mentionId) { ctx.send(box("⚠️ Who to unban?", ["Tag a user to unban! Use: !unban [@user]"])); return true; }
    if (isReady()) await models.User.findOneAndUpdate({ facebookId: mentionId }, { $set: { banned: false } });
    ctx.send(box("✅ User unbanned!", ["They're back! Welcome back! 👋"]));
    return true;
  }

  if (name === "mute" && isAdmin(ctx.event.senderID)) {
    const mentionId = getMention(ctx);
    if (!mentionId) { ctx.send(box("🔇 Who to mute?", ["Tag a user to mute! Use: !mute [@user]"])); return true; }
    await muteUser(ctx.event.threadID, mentionId);
    ctx.send(box("🔇 User muted!", ["They can't chat for now. Shh! 🤫"]));
    return true;
  }

  if (name === "unmute" && isAdmin(ctx.event.senderID)) {
    const mentionId = getMention(ctx);
    if (!mentionId) { ctx.send(box("🔊 Who to unmute?", ["Tag a user to unmute! Use: !unmute [@user]"])); return true; }
    await unmuteUser(ctx.event.threadID, mentionId);
    ctx.send(box("🔊 User unmuted!", ["They can chat again! Yay! 🎉"]));
    return true;
  }

  if (name === "setprefix" && isAdmin(ctx.event.senderID)) {
    const newPrefix = args[0];
    if (!newPrefix) { ctx.send(box("⚡ Current prefix", [process.env.PREFIX || "!"])); return true; }
    await setPrefix(ctx.event.threadID, newPrefix);
    ctx.send(box("⚡ Prefix updated!", [`New prefix: **${newPrefix}**`]));
    return true;
  }

  if (name === "plugin_reload" && isAdmin(ctx.event.senderID)) {
    const category = args[0];
    if (!category) { ctx.send(box("⚠️ What to reload?", ["Use: !plugin_reload [category_name]"])); return true; }
    try {
      reloadPlugin(require("path").join(__dirname, "..", "plugins"), category);
      ctx.send(box("✅ Plugin reloaded!", [`Plugin **${category}** reloaded successfully! 🔄`]));
    } catch (error) {
      ctx.send(box("⚠️ Reload failed!", [error.message]));
    }
    return true;
  }

  if (name === "plugin_disable" && isAdmin(ctx.event.senderID)) {
    const category = args[0];
    if (!category) { ctx.send(box("⚠️ Which plugin?", ["Use: !plugin_disable [category_name]"])); return true; }
    setPluginEnabled(category, false);
    ctx.send(box("🛑 Plugin disabled!", [`Plugin **${category}** is now offline! ⚡`]));
    return true;
  }

  if (name === "plugin_enable" && isAdmin(ctx.event.senderID)) {
    const category = args[0];
    if (!category) { ctx.send(box("⚠️ Which plugin?", ["Use: !plugin_enable [category_name]"])); return true; }
    setPluginEnabled(category, true);
    ctx.send(box("✅ Plugin enabled!", [`Plugin **${category}** is back online! 🚀`]));
    return true;
  }

  if (name === "uptime") {
    const uptime = Math.floor((Date.now() - (global.ikonBotStart || Date.now())) / 1000);
    ctx.send(box("⏱️ iKON-BOT Uptime", [`Hey! 🤖 I've been online for **${uptime} seconds**! 💪`, `iKON-BOT v5.0 Divine — running strong! 🔥`]));
    return true;
  }

  // Command not handled by built-in actions — let the plugin's run handler take over
  return false;
}

module.exports = { run, geminiCall, GEMINI_MODEL, builtInCommands };
