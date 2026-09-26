const path = require("path");
const { getRegistry, isPluginEnabled } = require("./loader");
const { box } = require("../utils/box");
const { react, categoryReaction } = require("../utils/autoReact");
const actions = require("./actions");

async function getProfile(api, senderID) {
  return new Promise((resolve) => {
    if (!api || typeof api.getUserInfo !== "function") return resolve({ name: "Facebook user", picture: null });
    api.getUserInfo(senderID, async (error, info) => {
      const user = info && (info[senderID] || info[String(senderID)]);
      if (error || !user) return resolve({ name: "Facebook user", picture: null });
      const picture = await require("../utils/canvas").imageFromUrl(user.thumbSrc || user.profileUrl);
      resolve({ name: user.name || "Facebook user", picture });
    });
  });
}

async function send(api, event, message, imageBuffer) {
  if (!api || typeof api.sendMessageMqtt !== "function") return;
  if (!imageBuffer) return api.sendMessageMqtt(message, event.threadID, event.messageID);
  const fs = require("fs");
  const os = require("os");
  const file = path.join(os.tmpdir(), `ikon-${Date.now()}-${Math.random().toString(16).slice(2)}.png`);
  fs.writeFileSync(file, imageBuffer);
  api.sendMessageMqtt({ body: message, attachment: [fs.createReadStream(file)] }, event.threadID, event.messageID, () => {
    setTimeout(() => fs.rm(file, { force: true }, () => {}), 30000);
  });
}

async function handleMessage({ api, event }) {
  const prefix = process.env.PREFIX || "!";
  const body = String(event.body || "").trim();
  if (!body) return;
  const keyword = /\b(ikon|aphecks|bot)\b/i.test(body);
  if (keyword) await react(api, event, "❤️");
  if (!body.startsWith(prefix) && !body.startsWith("/")) return;
  const args = body.slice(body.startsWith("/") ? 1 : prefix.length).trim().split(/\s+/).filter(Boolean);
  const name = (args.shift() || "").toLowerCase();
  const command = getRegistry().commands.get(name);
  if (!command) return;
  if (!isPluginEnabled(command.category)) {
    return send(api, event, box("🛑 Plugin disabled", [`${command.category} is currently offline.`]));
  }
  const profile = await getProfile(api, event.senderID);
  const ctx = { api, event, args, command, profile, send: (message, image) => send(api, event, message, image) };
  await react(api, event, categoryReaction(command.category));
  try {
    await actions.run(ctx);
    await react(api, event, "✅");
  } catch (error) {
    console.error(`[COMMAND ${name}]`, error);
    await react(api, event, "😢");
    await send(api, event, box("⚠️ iKON-BOT error", [error.message]));
  }
}

module.exports = { handleMessage, getProfile, send };