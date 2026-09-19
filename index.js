// ============================================================
// iKON-BOT — FIXED MINIMAL TEST INDEX
// Owner: Aphecks iKon Klerk
//
// PURPOSE:
// Test AppState + ws3-fca + MQTT + message receiving + replies
//
// IMPORTANT:
// Command files are NOT loaded in this test.
// ============================================================

require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

const FCA = require("ws3-fca");
const login = typeof FCA === "function" ? FCA : FCA.login;

const app = express();

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

const PORT = Number(process.env.PORT || 1000);
const PREFIX = process.env.PREFIX || "!";

// ------------------------------------------------------------
// WEB SERVER
// ------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    bot: "iKON-BOT",
    owner: "Aphecks iKon Klerk",
    status: "ONLINE",
    mode: "TEST",
    prefix: PREFIX
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ------------------------------------------------------------
// LOAD APPSTATE
// ------------------------------------------------------------

let appState;

try {
  if (process.env.APPSTATE) {
    console.log("🔐 Loading APPSTATE from environment...");

    appState = JSON.parse(process.env.APPSTATE);
  } else {
    const appStatePath = path.join(__dirname, "appstate.json");

    if (!fs.existsSync(appStatePath)) {
      throw new Error(
        "appstate.json not found and APPSTATE environment variable is empty."
      );
    }

    console.log("🔐 Loading APPSTATE from appstate.json...");

    appState = JSON.parse(
      fs.readFileSync(appStatePath, "utf8")
    );
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
    appState: appState
  },
  (err, api) => {

    if (err) {
      console.error("❌ LOGIN FAILED");
      console.error(err);
      process.exit(1);
    }

    console.log("============================================");
    console.log("✅ LOGIN SUCCESSFUL");
    console.log("🤖 iKON-BOT CONNECTED");
    console.log(`💬 Prefix: ${PREFIX}`);
    console.log("🧪 TEST MODE");
    console.log("📦 Command files: DISABLED");
    console.log("============================================");

    // --------------------------------------------------------
    // API OPTIONS
    // --------------------------------------------------------

    try {
      api.setOptions({
        listenEvents: true,
        selfListen: false,
        forceLogin: true,
        autoMarkRead: false,
        autoMarkDelivery: false
      });

      console.log("⚙️ API options configured");

    } catch (e) {
      console.error("⚠️ Could not set API options:");
      console.error(e.message);
    }

    // --------------------------------------------------------
    // SAFE SEND FUNCTION
    // --------------------------------------------------------

    function send(threadID, message) {

      if (!threadID) {
        console.error("❌ Missing threadID");
        return;
      }

      if (!message) {
        console.error("❌ Empty message");
        return;
      }

      console.log("📤 Sending reply...");

      try {

        // IMPORTANT:
        // Do NOT pass event.messageID as the 4th argument.
        // ws3-fca currently throws:
        //
        // MessageID should be of type string and not String.
        //

        api.sendMessage(
          String(message),
          String(threadID),
          (sendError) => {

            if (sendError) {
              console.error("❌ SEND ERROR:");
              console.error(sendError);
              return;
            }

            console.log("✅ REPLY SENT");
          }
        );

      } catch (e) {

        console.error("❌ SEND EXCEPTION:");
        console.error(e);
      }
    }

    // --------------------------------------------------------
    // SAFE REACTION
    // --------------------------------------------------------

    function react(messageID) {

      if (!messageID) return;

      try {

        api.setMessageReaction(
          "👍",
          messageID,
          (reactionError) => {

            if (reactionError) {
              console.error(
                "⚠️ REACTION ERROR:",
                reactionError
              );
              return;
            }

            console.log("👍 REACTION SENT");
          }
        );

      } catch (e) {

        console.error(
          "⚠️ REACTION EXCEPTION:",
          e.message
        );
      }
    }

    // --------------------------------------------------------
    // MQTT LISTENER
    // --------------------------------------------------------

    console.log("👂 Starting Messenger listener...");

    api.listenMqtt((error, event) => {

      // ------------------------------------------------------
      // LISTENER ERROR
      // ------------------------------------------------------

      if (error) {

        console.error("❌ MQTT LISTENER ERROR:");
        console.error(error);

        return;
      }

      if (!event) return;

      // ------------------------------------------------------
      // IGNORE EVENTS WITHOUT BODY
      // ------------------------------------------------------

      if (!event.body) {
        return;
      }

      const body = String(event.body).trim();

      const threadID = String(event.threadID || "");
      const senderID = String(event.senderID || "");
      const messageID = String(event.messageID || "");

      console.log("");
      console.log("============================================");
      console.log("📩 MESSAGE RECEIVED");
      console.log("👤 Sender:", senderID);
      console.log("💬 Thread:", threadID);
      console.log("📝 Body:", body);
      console.log("🆔 Message:", messageID);
      console.log("============================================");

      // ------------------------------------------------------
      // REACTION TEST
      // ------------------------------------------------------

      react(messageID);

      // ------------------------------------------------------
      // COMMAND
      // ------------------------------------------------------

      const command = body.toLowerCase();

      // ------------------------------------------------------
      // !TEST
      // ------------------------------------------------------

      if (command === `${PREFIX}test`) {

        console.log("🧪 TEST COMMAND DETECTED");

        send(
          threadID,
          "╭───────────────╮\n" +
          "│ 🤖 iKON-BOT   │\n" +
          "╰───────────────╯\n\n" +
          "✅ TEST REPLY WORKS!\n\n" +
          "🔐 AppState: OK\n" +
          "🔌 Login: OK\n" +
          "📡 MQTT: OK\n" +
          "📩 Listener: OK\n" +
          "💬 SendMessage: OK\n" +
          "👍 Reaction: OK\n\n" +
          "🧪 Command files are disabled.\n" +
          "⚙️ Core connection test passed."
        );

        return;
      }

      // ------------------------------------------------------
      // !PING
      // ------------------------------------------------------

      if (command === `${PREFIX}ping`) {

        console.log("🏓 PING COMMAND DETECTED");

        send(
          threadID,
          "🏓 PONG!\n\n" +
          "🤖 iKON-BOT is alive.\n" +
          "📡 Messenger connection: ONLINE."
        );

        return;
      }

      // ------------------------------------------------------
      // !MENU
      // ------------------------------------------------------

      if (
        command === `${PREFIX}menu` ||
        command === `${PREFIX}help`
      ) {

        console.log("📋 MENU COMMAND DETECTED");

        send(
          threadID,
          "╭──────────────────╮\n" +
          "│ 🤖 iKON-BOT MENU │\n" +
          "╰──────────────────╯\n\n" +
          "🧪 TEST MODE\n\n" +
          "🏓 !ping\n" +
          "🧪 !test\n" +
          "📋 !menu\n" +
          "ℹ️ !help\n\n" +
          "⚙️ Command modules are currently disabled.\n" +
          "✅ Core Messenger test is running."
        );

        return;
      }

      // ------------------------------------------------------
      // !STATUS
      // ------------------------------------------------------

      if (command === `${PREFIX}status`) {

        console.log("📊 STATUS COMMAND DETECTED");

        send(
          threadID,
          "╭──────────────╮\n" +
          "│ 📊 STATUS    │\n" +
          "╰──────────────╯\n\n" +
          "🤖 Bot: ONLINE\n" +
          "🔐 AppState: LOADED\n" +
          "📡 MQTT: CONNECTED\n" +
          "📩 Listener: ACTIVE\n" +
          "💬 Reply system: ACTIVE\n" +
          "👍 Reaction system: ACTIVE\n" +
          "📦 Commands: TEST MODE"
        );

        return;
      }

      // ------------------------------------------------------
      // UNKNOWN COMMAND
      // ------------------------------------------------------

      console.log("ℹ️ No test command matched.");
    });
  }
);
