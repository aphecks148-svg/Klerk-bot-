/**
 * Message router.
 *
 * Responsibilities, in order:
 *   1. resolve the group config (prefix, mutes, only-admin list)
 *   2. parse the command name + args — `! bal` and `!bal` both work
 *   3. enforce guards: disabled plugin, mute, only-admin, admin-only, cooldown
 *   4. build the ctx object and hand it to actions.run, then the command's run
 *   5. remember the reply so `.unsend` can pull it back
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { getRegistry, isPluginEnabled } = require("./loader");
const { box } = require("../utils/box");
const { react, categoryReaction } = require("../utils/autoReact");
const { check, cooldown } = require("../utils/cooldown");
const { getThreadConfig, isThreadAdmin, isMuted, rememberMessage } = require("../utils/group");
const { getProfileInfo } = require("../utils/fbProfile");
const actions = require("./actions");

/** Resolve a user's name + profile picture. */
async function getProfile(api, senderID) {
  const info = await getProfileInfo(api, senderID, "Facebook user");
  return { name: info.name, picture: info.picture, id: info.id };
}

/**
 * Send a reply.
 *
 * Accepts a string or an array of strings. When `imageBuffer` is present the
 * first string becomes the attachment caption. The message id of a successful
 * send is remembered so `.unsend` works.
 */
async function send(api, event, message, imageBuffer) {
  if (!api) return null;
  const threadID = event && event.threadID;
  const messageID = event && event.messageID;
  if (!threadID) return null;

  const text = Array.isArray(message) ? message.join("\n") : String(message == null ? "" : message);

  if (!imageBuffer) {
    if (typeof api.sendMessageMqtt === "function") {
      const result = await api.sendMessageMqtt(text, threadID, messageID);
      rememberMessage(threadID, extractId(result, messageID));
      return result;
    }
    if (typeof api.sendMessage === "function") {
      const result = await api.sendMessage(text, threadID, () => {}, messageID);
      rememberMessage(threadID, extractId(result, messageID));
      return result;
    }
    return null;
  }

  const filePath = path.join(os.tmpdir(), `ikon-${Date.now()}-${Math.random().toString(16).slice(2)}.png`);
  try {
    fs.writeFileSync(filePath, imageBuffer);
  } catch (error) {
    console.error("[SEND] could not write attachment:", error.message);
    return send(api, event, text);
  }
  const cleanup = () => setTimeout(() => fs.rm(filePath, { force: true }, () => {}), 30000);
  const payload = { body: text, attachment: [fs.createReadStream(filePath)] };

  if (typeof api.sendMessageMqtt === "function") {
    return api.sendMessageMqtt(payload, threadID, messageID, cleanup);
  }
  if (typeof api.sendMessage === "function") {
    return api.sendMessage(payload, threadID, cleanup, messageID);
  }
  return null;
}

/** Pull a message id out of whatever shape the login returned. */
function extractId(result, fallback) {
  if (!result) return fallback;
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    const mid = result.messageID || result.messageId;
    if (mid) return mid;
    if (result.messageIds && result.messageIds[0]) return result.messageIds[0];
  }
  return fallback;
}

/** `!bal` and `! bal` are both valid — strip leading whitespace after the prefix. */
function parseCommand(body, prefix) {
  const useSlash = body.startsWith("/");
  if (!useSlash && !body.startsWith(prefix)) return null;
  const rest = body.slice(useSlash ? 1 : prefix.length).trim();
  if (!rest) return null;
  const parts = rest.split(/\s+/);
  const name = (parts.shift() || "").toLowerCase();
  if (!name) return null;
  return { name, args: parts };
}

async function handleMessage({ api, event }) {
  if (!event || !event.threadID) return;

  const thread = await getThreadConfig(event.threadID);
  const prefix = (thread && thread.prefix) || "!";

  // React when the bot is addressed by name.
  const body = String(event.body || "").trim();
  if (body && /\b(ikon|aphecks|bot|klerk)\b/i.test(body)) await react(api, event, "❤️");

  const parsed = parseCommand(body, prefix);
  if (!parsed) return;

  const { name, args } = parsed;
  const command = getRegistry().commands.get(name);
  if (!command) return;

  if (!isPluginEnabled(command.category)) {
    return send(api, event, box("🛑 Plugin Offline", [
      `The **${command.category}** category is switched off in this group.`,
      `Ask an admin to re-enable it with the plugin commands. ✨`,
    ]));
  }

  // `.unsend` is deliberately reachable by everyone — you may only ever pull
  // back the bot's own last message, so it is not an abuse vector.
  if (name !== "unsend" && thread.mutedUsers && thread.mutedUsers.includes(String(event.senderID))) {
    return send(api, event, box("🔇 Shh, you're muted", [
      "You can't run commands while muted in this group.",
      "An admin can lift it with the unmute command. 😉",
    ]));
  }

  // onlyadminon — when the list is non-empty, everyone else is locked out.
  const onlyAdmin = Array.isArray(thread.onlyAdminCmds) && thread.onlyAdminCmds.length > 0;
  if (onlyAdmin && !isThreadAdmin({ event, thread }) && !thread.onlyAdminCmds.includes(name)) {
    return send(api, event, box("🛑 Admin-only mode", [
      "This group is currently admin-only. Members can't run commands.",
      "An admin can turn it off with the onlyadminoff command. 🔒",
    ]));
  }

  const isAdminUser = isThreadAdmin({ event, thread });
  if (command.adminOnly && !isAdminUser) {
    return send(api, event, box("🛑 Admins only", [
      `**${command.name}** is restricted to group admins.`,
      "You can still use the regular commands. 😊",
    ]));
  }

  const seconds = command.cooldown != null ? command.cooldown : cooldown(command.name);
  const cd = await check(event.senderID || event.threadID, command.name, seconds);
  if (!cd.ok) {
    return send(api, event, box("⏱️ Hold up, speedster!", [
      `Try **${prefix}${command.name}** again in **${cd.left}s**. ⏳`,
      "While you wait, how about a snack? 🍪",
    ]));
  }

  const profile = await getProfile(api, event.senderID);
  const ctx = {
    api,
    event,
    args,
    command,
    name,
    prefix,
    profile,
    thread,
    isAdmin: isAdminUser,
    send: (m, img) => send(api, event, m, img),
    reply: (m, img) => send(api, event, m, img),
    user: { name: profile.name, uid: event.senderID, id: event.senderID },
    users: new Map(),
  };

  await react(api, event, categoryReaction(command.category));

  try {
    // Built-ins first (menu, help, ping, …), then the plugin's own handler.
    const handled = await actions.run(ctx);
    if (!handled) {
      if (typeof command.run === "function") await command.run(ctx);
      else await send(api, event, box("❓ Not wired up", [`**${name}** has no handler yet. Try **${prefix}menu**.`]));
    }
    await react(api, event, "✅");
  } catch (error) {
    console.error(`[COMMAND ${name}]`, error);
    await react(api, event, "😢");
    await send(api, event, box("⚠️ Oops, something went wrong!", [
      `**${prefix}${name}** tripped over: ${error.message || "something unexpected"}`,
      "My engineers are on it! 🛠️ Try again in a moment.",
    ]));
  }
}

module.exports = { handleMessage, getProfile, send, parseCommand };
