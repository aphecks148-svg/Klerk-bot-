const p = require("../bot/plugins/04_casinoArcade");
const { CASINO_GAMES } = require("../bot/data/lists");
const names = p.commands.map((c) => c.name);
const dup = names.filter((n, i) => names.indexOf(n) !== i);
console.log("commands:", names.length, "(target 45)", names.length === 45 ? "OK" : "BAD");
console.log("dupe names:", dup);
console.log("games reachable via `play`:", CASINO_GAMES.length, "(all match:", CASINO_GAMES.length === 47 ? "OK" : "BAD", ")");
console.log("all have run:", p.commands.every((c) => typeof c.run === "function"));
console.log("names:", names.join(" "));