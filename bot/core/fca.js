const { login } = require("ws3-fca");

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
      api.listen((listenError, event) => {
        if (listenError) return console.error("[FCA] listener:", listenError.message || listenError);
        Promise.resolve(onEvent(api, event)).catch((err) => console.error("[EVENT]", err));
      });
    });
  });
}

module.exports = { start };