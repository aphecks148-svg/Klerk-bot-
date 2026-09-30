/**
 * Shared bot utilities that used to live in `bot/plugins/_shared`.
 *
 * There is deliberately no `_shared` plugin folder any more — every helper a
 * plugin needs is here, and the one piece of plugin-authoring code
 * (`commandFactory`) lives inside `14_systemCore/kit.js` so the System Core
 * category owns the command system.
 */

/* ═══════════════════════════════════════════════════════════════════════
 * Progress bars
 * ═══════════════════════════════════════════════════════════════════════ */

const BAR_FILLED = "■";
const BAR_EMPTY = "□";

/**
 * Render a progress bar.
 * @param {number} value  current value
 * @param {number} max    maximum value
 * @param {object} opts   { size = 5, fill = "■", empty = "□" }
 * @returns {string} e.g. "[■■■■■□□]"
 */
function bar(value, max, opts = {}) {
  const size = Math.max(1, Number(opts.size) || 5);
  const fill = opts.fill || BAR_FILLED;
  const empty = opts.empty || BAR_EMPTY;
  const maxValue = Number(max) || 0;
  const ratio = maxValue > 0 ? Math.max(0, Math.min(1, Number(value) / maxValue)) : 0;
  const filled = Math.round(ratio * size);
  return `[${fill.repeat(filled)}${empty.repeat(Math.max(0, size - filled))}]`;
}

/** Same as bar() but with a trailing label, e.g. `[■■■□□□] 60%`. */
function barWithLabel(value, max, opts = {}) {
  const pct = max > 0 ? Math.round((Number(value) / Number(max)) * 100) : 0;
  return `${bar(value, max, opts)} ${pct}%`;
}

/** A 10-cell strength meter used by pets, bosses and gear. */
function strengthBar(strength) {
  return bar(Number(strength) || 0, 10, { size: 10 });
}

/* ═══════════════════════════════════════════════════════════════════════
 * Numbers & text
 * ═══════════════════════════════════════════════════════════════════════ */

/** 1234567 → "1,234,567" */
function fmt(n) {
  const num = Number(n) || 0;
  const sign = num < 0 ? "-" : "";
  return sign + Math.abs(Math.trunc(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Compact coin display: 1,250,000 → "1.25M" */
function fmtShort(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${Math.trunc(abs)}`;
}

/** Percentage string, clamped to 0–100. */
function pct(part, whole) {
  const w = Number(whole) || 0;
  if (w <= 0) return "0%";
  return `${Math.max(0, Math.min(100, Math.round((Number(part) / w) * 100)))}%`;
}

/** Turn "iron_sword" into "Iron Sword". */
function titleCase(str) {
  return String(str == null ? "" : str)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Truncate for single-line display. */
function clamp(str, max = 60) {
  const s = String(str == null ? "" : str);
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/** Truncate a string into N roughly-equal lines (for long list blobs). */
function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Pick a random element. */
function pick(arr) {
  return Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

/** Pick N distinct random elements. */
function sample(arr, n) {
  const pool = Array.isArray(arr) ? [...arr] : [];
  const out = [];
  while (pool.length && out.length < n) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

/** Random integer in [min, max]. */
function randInt(min, max) {
  const lo = Math.ceil(Number(min) || 0);
  const hi = Math.floor(Number(max) || 0);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** Parse a money amount from user input; returns null when invalid. */
function parseAmount(raw) {
  const n = Number(String(raw == null ? "" : raw).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** Split a string into words, ignoring case and duplicates. */
function norm(str) {
  return String(str == null ? "" : str).trim().toLowerCase();
}

module.exports = {
  BAR_FILLED,
  BAR_EMPTY,
  bar,
  barWithLabel,
  strengthBar,
  fmt,
  fmtShort,
  pct,
  titleCase,
  clamp,
  chunk,
  pick,
  sample,
  randInt,
  parseAmount,
  norm,
};