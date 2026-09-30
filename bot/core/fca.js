/**
 * Facebook login + event plumbing.
 *
 * `start()` resolves once the login is ready, and then keeps calling `onEvent`
 * for every inbound frame. Non-message frames (member joins/leaves, unsends,
 * reactions) are normalised here before they reach the rest of the bot.
 */

const { login } = require("ws3-fca");
const {
  getThreadConfig,
  sendWelcome,
  sendLeave,
  addUserToGroup,
  unsendRecent,
  pruneMessageLog,
  isMuted,
} = require("../utils/group");

function readAppState() {
  if (!process.env.APPSTATE) throw new Error("APPSTATE is not configured");
  try {
    const appState = JSON.parse(process.env.APPSTATE);
    if (!Array.isArray(appState)) throw new Error("APPSTATE must be a JSON array");
    return appState;
  } catch (error) {
    throw new Error(`APPSTATE is invalid JSON: ${error.message}`);
  }
}

/** Coarse frame classification — ws3-fca reports these in several shapes. */
function classify(event) {
  if (!event || typeof event !== "object") return { kind: "other" };
  const type = String(event.type || "").toLowerCase();

  if (type === "message" || (event.isGroupMessage && event.body != null)) {
    if (event.isUnsend) return { kind: "unsend" };
    return { kind: "message" };
  }
  if (type === "event" || event.eventType) {
    const inner = String(event.eventType || type).toLowerCase();
    if (inner.includes("join")) return { kind: "join" };
    if (inner.includes("leave")) return { kind: "leave" };
    return { kind: "event" };
  }
  if (event.logClassName === "MessageReactions") return { kind: "reaction" };
  return { kind: "other" };
}

/**
 * Handle the non-message frames. Kept separate from `onEvent` so a failure
 * here can never block a real command.
 */
async function handleLifecycle(api, event, kind) {
  const threadID = event.threadID || (event.thread && event.threadID);
  if (!threadID) return;

  if (kind === "unsend") {
    await unsendRecent(api, threadID, 5 * 60 * 1000);
    return;
  }

  const thread = await getThreadConfig(threadID);
  const actor = event.senderID;

  if (kind === "join") {
    if (actor && await isMuted(threadID, actor)) return;
    if (thread.autoAdd && actor) {
      const result = await addUserToGroup(api, threadID, actor);
      if (!result.ok) console.warn(`[AUTOADD] ${actor}: ${result.reason}`);
    }
    if (thread.welcomeMsg !== null || true) await sendWelcome(api, event, thread);
    return;
  }

  if (kind === "leave") {
    await sendLeave(api, event, thread);
  }
}

/**
 * Log in and start listening.
 * @param {(api, event) => Promise<void>} onEvent  called for every message frame
 * @returns {Promise<object>} the ws3-fca api
 */
async function start(onEvent) {
  const appState = readAppState();
  return new Promise((resolve, reject) => {
    let settled = false;

    login({ appState }, {
      selfListen: false,
      listenEvents: true,
      updatePresence: true,
      autoReconnect: true,
      online: true,
      emitReady: true,
    }, (error, api) => {
      if (error) {
        if (!settled) { settled = true; reject(error); }
        return;
      }
      if (!settled) { settled = true; resolve(api); }

      const listen = api.listenMqtt || api.listen;
      if (typeof listen !== "function") {
        const listenerError = new Error("ws3-fca returned no listenMqtt listener");
        if (!settled) { settled = true; reject(listenerError); }
        return;
      }

      // Housekeeping: drop stale unsend-log entries once a minute.
      const sweeper = setInterval(pruneMessageLog, 60000);
      if (sweeper.unref) sweeper.unref();

      listen.call(api, (listenError, event) => {
        if (listenError) {
          console.error("[FCA] listener:", listenError.message || listenError);
          return;
        }
        const { kind } = classify(event);
        if (kind === "message") {
          Promise.resolve(onEvent(api, event)).catch((err) => console.error("[EVENT]", err));
          return;
        }
        if (kind === "join" || kind === "leave" || kind === "unsend") {
          Promise.resolve(handleLifecycle(api, event, kind)).catch((err) => console.error("[LIFECYCLE]", err));
        }
      });
    });
  });
}

module.exports = { start, classify, handleLifecycle };
