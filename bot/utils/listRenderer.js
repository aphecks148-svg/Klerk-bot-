/**
 * Shared list rendering.
 *
 * Every `.xxx_list` command across all 14 categories funnels through here, so
 * lists always look the same and always show *every* entry — never a truncated
 * preview. When a list is too long for one Messenger message the renderer
 * paginates automatically and returns the extra pages for the caller to send.
 */

const { fmt, chunk, titleCase } = require("./format");

/** Facebook rejects very long bodies; stay comfortably under it. */
const MAX_CHARS = 1600;
const PER_LINE_BUDGET = 130;

/**
 * Render a plain bulleted list.
 *
 * @param {object} opts
 *   title     heading line
 *   items     string[]
 *   emoji     leading emoji for each bullet
 *   footer    optional trailing note
 *   bullets   bullet glyph, default "◦"
 * @returns {string[]} one or more message chunks
 */
function renderList({ title, items, emoji = "◦", footer = "", bullets = "◦" }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [`${emoji} ${title}\n\n(empty — nothing registered yet)`];

  const head = `${emoji} ${title}`;
  const out = [];
  let buffer = head;

  list.forEach((item, i) => {
    const line = `${bullets} ${i + 1}. ${item}`;
    if (buffer.length + line.length + 1 > MAX_CHARS) {
      out.push(buffer);
      buffer = "";
    }
    buffer += (buffer ? "\n" : "") + line;
  });

  if (footer) {
    if (buffer.length + footer.length + 2 > MAX_CHARS) {
      out.push(buffer);
      buffer = "";
    }
    buffer += (buffer ? "\n\n" : "") + footer;
  }

  out.push(buffer);
  return out;
}

/**
 * Render a list where each entry carries a strength bar.
 *
 * @param {object} opts
 *   title, footer, emoji
 *   items     [{ name, strength }] or [{ label, value }]
 * @returns {string[]} message chunks
 */
function renderBarList({ title, items, emoji = "📊", footer = "", size = 5, bullets = "◦" }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [`${emoji} ${title}\n\n(empty — nothing registered yet)`];

  const head = `${emoji} ${title}`;
  const out = [];
  let buffer = head;

  list.forEach((item, i) => {
    const name = item.name != null ? item.name : item.label;
    const value = item.strength != null ? item.strength : item.value;
    const filled = "■".repeat(Math.max(0, Math.min(size, Number(value) || 0)));
    const empty = "□".repeat(Math.max(0, size - (Number(value) || 0)));
    const line = `${bullets} ${String(i + 1).padStart(2)}. [${filled}${empty}] ${name}`;
    if (buffer.length + line.length + 1 > MAX_CHARS) {
      out.push(buffer);
      buffer = "";
    }
    buffer += (buffer ? "\n" : "") + line;
  });

  if (footer) {
    if (buffer.length + footer.length + 2 > MAX_CHARS) {
      out.push(buffer);
      buffer = "";
    }
    buffer += (buffer ? "\n\n" : "") + footer;
  }

  out.push(buffer);
  return out;
}

/**
 * Render a paginated table of `{ name, emoji, type, rarity, strength }` rows —
 * the shape used by `.petlist`. Every pet is included; the output is split into
 * as many messages as needed.
 *
 * @returns {string[]} message chunks
 */
function renderTable({ title, rows, emoji = "📋", bullets = "◦", size = 5, header = true }) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return [`${emoji} ${title}\n\n(empty — nothing registered yet)`];

  const out = [];
  let buffer = header ? `${emoji} ${title}` : "";
  let index = 0;

  for (const group of chunk(list, PER_LINE_BUDGET)) {
    for (const row of group) {
      index += 1;
      const bar = "■".repeat(Math.max(0, Math.min(size, Number(row.strength) || 0)))
        + "□".repeat(Math.max(0, size - (Number(row.strength) || 0)));
      const num = String(index).padStart(2, " ");
      const parts = [`${bullets} ${num}.`, `[${bar}]`];
      if (row.emoji) parts.push(row.emoji);
      parts.push(row.name);
      if (row.type) parts.push(`(${row.type})`);
      if (row.rarity) parts.push(`· ${row.rarity}`);
      const line = parts.join(" ");
      if (buffer.length + line.length + 1 > MAX_CHARS) {
        out.push(buffer);
        buffer = "";
      }
      buffer += (buffer ? "\n" : "") + line;
    }
  }

  if (buffer.trim()) out.push(buffer);
  return out;
}

/**
 * Build a reply handler for a simple list command.
 *
 * Usage:
 *   const handler = listHandler("🐾 Pet List", lists.CROPS, "All 16 crops.");
 *   module.exports = { commands: [listCommand("crop_list", "🌾", handler, "Browse all crops")] };
 *
 * @param {string} title    heading, already includes its own emoji
 * @param {string[]} items  the data
 * @param {string} note     footer note
 * @returns {(ctx) => Promise<void>}
 */
function listHandler(title, items, note = "") {
  return async (ctx) => {
    const chunks = renderList({
      title,
      items,
      emoji: "",
      footer: note || `Total: ${items.length}`,
    });
    for (const chunkText of chunks) await ctx.send(chunkText);
  };
}

/**
 * Build a reply handler for a bar list (cars, weapons, bosses, gear…).
 */
function barListHandler(title, items, note = "") {
  return async (ctx) => {
    const chunks = renderBarList({
      title,
      items,
      emoji: "",
      footer: note || `Total: ${items.length}`,
    });
    for (const chunkText of chunks) await ctx.send(chunkText);
  };
}

/**
 * Sectioned help block — a title plus labelled command groups.
 * Used by `.guide` and the per-category help commands.
 */
function renderSections({ title, emoji = "📖", sections, footer = "" }) {
  const lines = [`${emoji} ${title}`];
  for (const section of sections || []) {
    lines.push("");
    lines.push(`▸ ${section.header}`);
    for (const cmd of section.commands || []) lines.push(`  ${cmd}`);
  }
  if (footer) {
    lines.push("");
    lines.push(footer);
  }
  return lines.join("\n");
}

/** "3 / 50" style position indicator. */
function position(index, total) {
  return `${fmt(index)} / ${fmt(total)}`;
}

module.exports = {
  MAX_CHARS,
  renderList,
  renderBarList,
  renderTable,
  renderSections,
  listHandler,
  barListHandler,
  position,
  titleCase,
};