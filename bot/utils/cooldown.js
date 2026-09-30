const { models, isReady } = require("../core/mongo");
const memory = new Map();

function key(scope, cmd) { return `cd:${scope}:${cmd}`.toLowerCase(); }
function secs(exp) { return Math.max(0, Math.ceil((new Date(exp).getTime() - Date.now()) / 1000)); }

async function check(scope, cmd, seconds) {
  const dur = Math.max(0, Number(seconds) || 0);
  if (!dur) return { ok: true, left: 0 };
  const k = key(scope, cmd);
  const now = Date.now();
  const exp = memory.get(k) || 0;
  if (exp > now) return { ok: false, left: Math.ceil((exp - now) / 1000) };
  memory.set(k, now + dur * 1000);
  return { ok: true, left: 0 };
}

function cooldown(cmd) {
  const c = String(cmd).toLowerCase();
  if (["daily", "claimdaily"].includes(c)) return 24 * 60 * 60;
  if (["weekly"].includes(c)) return 7 * 24 * 60 * 60;
  if (["work", "beg", "mine", "fish", "farm", "hunt"].includes(c)) return 30;
  if (["ai", "ask", "chat", "imagine", "image"].includes(c)) return 5;
  if (["catch", "rob", "hack", "spy", "slots", "blackjack", "flip"].includes(c)) return 3;
  if (["adopt", "trade"].includes(c)) return 10;
  return 1;
}

module.exports = { check, cooldown };
