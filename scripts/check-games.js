const { CASINO_GAMES } = require("../bot/data/lists");
console.log("len", CASINO_GAMES.length);
CASINO_GAMES.forEach((g, i) => console.log(String(i + 1).padStart(2), g, "→", g.toLowerCase().replace(/[^a-z0-9]/g, "")));
const seen = new Set();
const dup = CASINO_GAMES.filter((g) => { const k = g.toLowerCase().replace(/[^a-z0-9]/g, ""); if (seen.has(k)) return true; seen.add(k); return false; });
console.log("dupes after slugging:", dup);