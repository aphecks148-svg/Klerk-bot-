// ============================================================
// iKON-BOT — MINIMAL CONNECTION / REPLY TEST
// Owner: Aphecks iKon Klerk
// Purpose: Test AppState + ws3-fca + Messenger replies
// ============================================================

require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

const FCA = require("ws3-fca");
const login = typeof FCA === "function" ? FCA : FCA.login;

const app = express();

const PORT = Number(process.env.PORT || 10000);
const PREFIX = process.env.PREFIX || "!";

app.get("/", (req, res) => {
  res.json({
    bot: "iKON-BOT",
    status: "ONLINE",
    test: true,
    prefix: PREFIX
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ------------------------------------------------------------
// APPSTATE
// ------------------------------------------------------------

let appState;

try {
  if (process.env.APPSTATE) {
    console.log("🔐 Loading APPSTATE from environment...");
    
    appState = JSON.parse(process.env.APPSTATE);
  } else {
    const file = path.join(__dirname, "appstate.json");

    if (!fs.existsSync(file)) {
      throw new Error("appstate.json not found and APPSTATE environment variable is empty.");
    }

    console.log("🔐 Loading APPSTATE from appstate.json...");

    appState = JSON.parse(fs.readFileSync(file, "utf8"));
  }

  if (!Array.isArray(appState)) {
    throw new Error("APPSTATE must be a JSON array.");
  }

  console.log(`✅ APPSTATE loaded: ${appState.length} cookies`);
} catch (err) {
  console.error("❌ APPSTATE ERROR:");
  console.error(err.message);
  process.exit(1);
}

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

console.log("🔄 Connecting to Messenger...");

login(
  {
    appState
  },
  (err, api) => {

    if (err) {
      console.error("❌ LOGIN FAILED");
      console.error(err);
      process.exit(1);
    }

    console.log("============================================");
    console.log("✅ LOGIN SUCCESSFUL");
    console.log("🤖 iKON-BOT is connected");
    console.log(`💬 Prefix: ${PREFIX}`);
    console.log("🧪 TEST MODE: command files disabled");
    console.log("============================================");

    // --------------------------------------------------------
    // BASIC BOT SETTINGS
    // --------------------------------------------------------

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      forceLogin: true,
      autoMarkRead: false,
      autoMarkDelivery: false
    });

    // --------------------------------------------------------
    // MESSAGE LISTENER
    // --------------------------------------------------------

    api.listenMqtt((error, event) => {

      if (error) {
        console.error("❌ LISTENER ERROR:");
        console.error(error);
        return;
      }

      if (!event) return;

      // Ignore messages without body
      if (!event.body) return;

      console.log("--------------------------------------------");
      console.log("📩 MESSAGE RECEIVED");
      console.log("👤 Sender:", event.senderID);
      console.log("💬 Thread:", event.threadID);
      console.log("📝 Body:", event.body);
      console.log("--------------------------------------------");

      const body = String(event.body).trim();

      // ------------------------------------------------------
      // TEST REACTION
      // ------------------------------------------------------

      try {
        api.setMessageReaction(
          "👍",
          event.messageID,
          (reactionError) => {
            if (reactionError) {
              console.error("⚠️ Reaction failed:", reactionError);
            } else {
              console.log("👍 Reaction sent");
            }
          }
        );
      } catch (e) {
        console.error("⚠️ Reaction exception:", e);
      }

      // ------------------------------------------------------
      // TEST COMMANDS
      // ------------------------------------------------------

      if (body.toLowerCase() === `${PREFIX}test`) {

        console.log("🧪 TEST COMMAND DETECTED");

        api.sendMessage(
          "✅ iKON-BOT TEST REPLY WORKS!\n\n" +
          "🤖 Messenger connection: OK\n" +
          "📩 Message listener: OK\n" +
          "💬 SendMessage: OK\n" +
          "👍 Reaction: OK\n\n" +
          "⚙️ Command loader is NOT being used in this test.",
          event.threadID,
          (sendError) => {
            if (sendError) {
              console.error("❌ SEND ERROR:");
              console.error(sendError);
            } else {
              console.log("✅ TEST REPLY SENT");
            }
          },
          event.messageID
        );

        return;
      }

      // ------------------------------------------------------
      // MENU TEST
      // ------------------------------------------------------

      if (
        body.toLowerCase() === `${PREFIX}menu` ||
        body.toLowerCase() === `${PREFIX}help`
      ) {

        console.log("📋 MENU TEST DETECTED");

        api.sendMessage(
          "╭──────────────╮\n" +
          "│ 🤖 iKON-BOT  │\n" +
          "╰──────────────╯\n\n" +
          "✅ TEST MENU ONLINE\n\n" +
          "🧪 !test\n" +
          "📋 !menu\n" +
          "ℹ️ !help\n\n" +
          "⚙️ Command modules are disabled during this test.",
          event.threadID,
          (sendError) => {
            if (sendError) {
              console.error("❌ MENU SEND ERROR:");
              console.error(sendError);
            } else {
              console.log("✅ MENU REPLY SENT");
            }
          },
          event.messageID
        );

        return;
      }

      // ------------------------------------------------------
      // PING TEST
      // ------------------------------------------------------

      if (body.toLowerCase() === `${PREFIX}ping`) {

        api.sendMessage(
          "🏓 PONG!\n\n🤖 iKON-BOT is alive.",
          event.threadID,
          (sendError) => {
            if (sendError) {
              console.error("❌ PING SEND ERROR:");
              console.error(sendError);
            } else {
              console.log("🏓 PONG SENT");
            }
          },
          event.messageID
        );

        return;
      }

      // ------------------------------------------------------
      // NORMAL MESSAGE — NO REPLY
      // ------------------------------------------------------

      console.log("ℹ️ No test command matched.");
    });
  }
);
