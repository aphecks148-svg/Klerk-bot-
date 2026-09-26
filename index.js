const express = require("express");
const path = require("path");
const { loadPlugins, getRegistry } = require("./bot/core/loader");
const mongo = require("./bot/core/mongo");
const fca = require("./bot/core/fca");
const { handleMessage } = require("./bot/core/router");
const { tickPokemonSpawn } = require("./bot/events/pokemonSpawn");

const startedAt = Date.now();
const app = express();
const PORT = Number(process.env.PORT || 10000);
let botApi = null;
let online = false;
let bootError = null;

app.get("/", (_req, res) => {
  const registry = getRegistry();
  res.json({
    name: "iKON-BOT",
    version: "5.0 Divine",
    status: online ? "ONLINE" : bootError ? "OFFLINE" : "STARTING",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    totalCommands: registry.totalCommands,
    categories: registry.categories.length,
    mongo: mongo.isReady() ? "connected" : "offline-safe",
    facebook: online ? "connected" : "not connected",
    error: bootError,
  });
});

app.get("/health", (_req, res) => res.status(online ? 200 : 503).json({
  ok: online,
  service: "ikon-bot",
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
}));

async function onFacebookEvent(api, event) {
  if (!event || event.type !== "message" || !event.body || !event.threadID) return;
  await tickPokemonSpawn({ api, event });
  await handleMessage({ api, event });
}

async function start() {
  await mongo.connect();
  loadPlugins(path.join(__dirname, "bot", "plugins"));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WEB] iKON-BOT keep-alive listening on ${PORT}`);
  });

  try {
    botApi = await fca.start((api, event) => onFacebookEvent(api, event));
    online = true;
    console.log(`[ONLINE] iKON-BOT v5.0 Divine | ${getRegistry().totalCommands} commands`);
  } catch (error) {
    bootError = error.message;
    console.error(`[OFFLINE] Facebook login unavailable: ${error.message}`);
    console.error("[INFO] Add APPSTATE, GEMINI_KEY, and MONGO_URI in Render environment variables.");
  }
}

process.on("unhandledRejection", (error) => console.error("[UNHANDLED]", error));
process.on("uncaughtException", (error) => console.error("[UNCAUGHT]", error));

start().catch((error) => {
  bootError = error.message;
  console.error("[BOOT FAILED]", error);
});

module.exports = { app, start };