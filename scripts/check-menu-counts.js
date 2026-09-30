const menu = require("../bot/utils/menuFormatter");
const TARGETS = [50, 40, 40, 45, 20, 25, 30, 20, 35, 35, 20, 25, 25, 20];
const pages = menu.getPages();

pages.forEach((p, i) => {
  const ok = p.commands.length === TARGETS[i] ? "OK " : "BAD";
  console.log(`${ok} ${p.glyph} target=${String(TARGETS[i]).padStart(2)} actual=${String(p.commands.length).padStart(2)}  ${p.headline}`);
});

// duplicate bullets inside a page
pages.forEach((p) => {
  const dupes = p.commands.filter((c, i) => p.commands.indexOf(c) !== i);
  if (dupes.length) console.log("DUPES in", p.glyph, dupes);
});

// same command name on two pages
const seen = new Map();
pages.forEach((p) => p.commands.forEach((c) => {
  const k = c.split(" ")[0];
  if (seen.has(k)) console.log("CROSS-PAGE DUPE", k, seen.get(k), p.glyph);
  seen.set(k, p.glyph);
}));

console.log("total bullets:", pages.reduce((n, p) => n + p.commands.length, 0), "target:", TARGETS.reduce((a, b) => a + b, 0));
