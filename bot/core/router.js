const path = require("path");
const { getRegistry, isPluginEnabled } = require("./loader");
const { box } = require("../utils/box");
const { react, categoryReaction } = require("../utils/autoReact");
const { check, cooldown } = require("../utils/cooldown");
const { getThread } = require("../utils/thread");
const actions = require("./actions");

async function getProfile(api, senderID) {
  return new Promise((resolve) => {
    if (!api || typeof api.getUserInfo !== "function") return resolve({ name: "Facebook user", picture: null });
    api.getUserInfo(senderID, async (error, info) => {
      const user = info && (info[senderID] || info[String(senderID)]);
      if (error || !user) return resolve({ name: "Facebook user", picture: null });
      const safeReq = require("./safeRequire").safeRequire;
      const canvasMod = safeReq("../utils/canvas", "canvas");
      if (canvasMod.ok) {
        const picture = await canvasMod.value.imageFromUrl(user.thumbSrc || user.profileUrl || "").catch(() => null);
        resolve({ name: user.name || "Facebook user", picture: picture || null });
      } else {
        resolve({ name: user.name || "Facebook user", picture: null });
      }
    });
  });
}

/**
 * Send a message reply via the Messenger API.
 * Works with both ws3-fca (sendMessageMqtt) and standard fca (sendMessage).
 */
async function send(api, event, message, imageBuffer) {
  if (!api) return;
  const threadID = event && event.threadID;
  const messageID = event && event.messageID;
  if (!threadID) return;

  // If no image, just send text
  if (!imageBuffer) {
    if (typeof api.sendMessageMqtt === "function") {
      return api.sendMessageMqtt(message, threadID, messageID);
    }
    if (typeof api.sendMessage === "function") {
      return api.sendMessage(message, threadID, () => {}, messageID);
    }
    return;
  }

  // If image buffer, send attachment
  const fs = require("fs");
  const os = require("os");
  const filePath = path.join(os.tmpdir(), `ikon-${Date.now()}-${Math.random().toString(16).slice(2)}.png`);
  fs.writeFileSync(filePath, imageBuffer);
  const callback = () => setTimeout(() => fs.rm(filePath, { force: true }, () => {}), 30000);

  if (typeof api.sendMessageMqtt === "function") {
    api.sendMessageMqtt({ body: message, attachment: [fs.createReadStream(filePath)] }, threadID, messageID, callback);
  } else if (typeof api.sendMessage === "function") {
    api.sendMessage({ body: message, attachment: [fs.createReadStream(filePath)] }, threadID, callback, messageID);
  }
}

async function handleMessage({ api, event }) {
  const thread = await getThread(event.threadID);
  const prefix = thread.prefix || process.env.PREFIX || "!";
  const body = String(event.body || "").trim();
  if (!body) return;

  // React to being mentioned
  if (/\b(ikon|aphecks|bot|klerk)\b/i.test(body)) await react(api, event, "❤️");

  // Check for command prefix
  if (!body.startsWith(prefix) && !body.startsWith("/")) return;

  const useSlash = body.startsWith("/");
  const parts = body.slice(useSlash ? 1 : prefix.length).trim().split(/\s+/);
  const name = (parts.shift() || "").toLowerCase();
  const args = parts;

  const command = getRegistry().commands.get(name);
  if (!command) return;

  // Check if plugin is disabled
  if (!isPluginEnabled(command.category)) {
    return send(api, event, box("🛑 Plugin Offline", [`Hey! 👋 The **${command.category}** plugin is currently offline. Try another command! ✨`]));
  }

  // Check if user is muted
  if (thread.mutedUsers && thread.mutedUsers.includes(event.senderID)) {
    return send(api, event, box("🔇 Shh, you're muted", ["You can't use commands while muted. Try being good! 😉"]));
  }

  // Check cooldown
  const cd = await check(event.senderID || event.threadID, command.name, cooldown(command.name));
  if (!cd.ok) {
    return send(api, event, box("⏱️ Hold up, speedster!", [
      `Hey! 🤖 My circuits need a quick breather.`,
      `Try **!${command.name}** again in **${cd.left}s**. ⏳`,
      `While you wait, how about a snack? 🍪`,
    ]));
  }

  // Get user profile
  const profile = await getProfile(api, event.senderID);

  // Build context
  const ctx = {
    api, event, args, command, name, profile, thread,
    send: (m, img) => send(api, event, m, img),
    user: { name: profile.name, uid: event.senderID },
    reply: (m, img) => send(api, event, m, img),
    users: new Map(),
  };

  // React with category emoji
  await react(api, event, categoryReaction(command.category));

  try {
    // Try actions.js first (handles built-in commands like menu, help, ping, etc.)
    // Then fall back to the command's own run handler from plugins
    const actionsHandled = await actions.run(ctx);
    if (!actionsHandled) {
      // If actions.js didn't handle it, use the plugin command's run handler
      if (typeof command.run === "function") {
        await command.run(ctx);
      } else {
        // Neither handler matched — unknown command
        await send(api, event, box("❓ Hmm, I don't know that one!", [
          `Hey! 👋 I couldn't find a command called **${name}**. 🤔`,
          `💡 Try !menu to see all available commands!`,
        ]));
      }
    }
    await react(api, event, "✅");
  } catch (error) {
    console.error(`[COMMAND ${name}]`, error);
    await react(api, event, "😢");
    await send(api, event, box("⚠️ Oops, something went wrong!", [
      `Hey there! 👋 Something glitched on my end.`,
      `The command **${name}** tripped over: ${error.message || "something unexpected"}`,
      `My engineers are on it! 🛠️ Try again in a moment.`,
    ]));
  }
}

module.exports = { handleMessage, getProfile, send };
