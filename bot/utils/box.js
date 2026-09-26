const LINE = "━━━━━━━━━━━━━━━━━━";

function box(title, lines = []) {
  return [`╭${LINE}`, `│ ${title}`, `├${LINE}`, ...lines.map((line) => `│ ${line}`), `╰${LINE}`].join("\n");
}

module.exports = { box, LINE };