/**
 * System Core — the command kit.
 *
 * This is the merged home of the old `bot/plugins/_shared/commandFactory.js`.
 * There is no `_shared` folder any more; every plugin authors its commands
 * through these helpers, and the loader/router/canvas layers read the same
 * shapes.
 *
 * A command object is:
 *   { name, aliases, description, usage, cooldown, adminOnly, run }
 */

const { getRegistry } = require("../../core/loader");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { fmt, parseAmount, titleCase, pick, sample, randInt, bar, norm } = require("../../utils/format");
const { listHandler, barListHandler, renderList, renderBarList } = require("../../utils/listRenderer");

/* ── Command construction ──────────────────────────────────────────────── */

/**
 * Build a command object.
 * @param {string} name       primary name, e.g. "petcard"
 * @param {object} opts
 *   aliases     string[]     extra names
 *   description string       shown in help
 *   usage       string       argument hint
 *   cooldown    number       seconds, 0 disables
 *   adminOnly   boolean
 *   run         function     async (ctx) => {}
 */
function command(name, opts = {}) {
  if (!name) throw new Error("command() requires a name");
  const { aliases = [], description = "", usage = "", cooldown = 0, adminOnly = false, run } = opts;
  return {
    name: String(name),
    aliases: [...new Set(aliases.filter(Boolean).map(String))],
    description: description || titleCase(name),
    usage,
    cooldown,
    adminOnly: Boolean(adminOnly),
    run: typeof run === "function" ? run : notImplemented(name),
  };
}

/**
 * The fallback handler. It exists so a registered command always answers
 * something; a real handler should replace it.
 */
function notImplemented(name) {
  return async (ctx) => {
    await ctx.send([
      `⚙️ ${name}`,
      `This command is registered but has no handler yet.`,
      `Try ${ctx.thread && ctx.thread.prefix ? ctx.thread.prefix : "!"}menu to see what works.`,
    ].join("\n"));
  };
}

/**
 * Build many commands at once from a compact spec.
 *
 * @param {Array} specs  array of [name, run, opts?] or [name] or "name"
 * @returns {Array} command objects
 */
function commands(specs) {
  return specs.map((spec) => {
    if (typeof spec === "string") return command(spec);
    if (Array.isArray(spec)) {
      const [name, run, opts] = spec;
      return command(name, { ...(opts || {}), run });
    }
    if (spec && typeof spec === "object" && spec.name) return command(spec.name, spec);
    throw new Error(`commands(): bad spec ${JSON.stringify(spec)}`);
  });
}

/**
 * A list command backed by a static array.
 * @param {string} name
 * @param {string[]} items
 * @param {object} opts  { emoji, title, note, aliases }
 */
function listCommand(name, items, opts = {}) {
  const title = opts.title || titleCase(name);
  const note = opts.note || `${items.length} entries — the full list.`;
  return command(name, {
    aliases: opts.aliases,
    description: opts.description || `Browse ${title.toLowerCase()}`,
    usage: "",
    run: listHandler(`${opts.emoji || "📋"} ${title}`, items, note),
  });
}

/**
 * A list command backed by a static array, with strength bars.
 * @param {string} name
 * @param {string[]} items
 * @param {object} opts  { emoji, title, note, size }
 */
function barListCommand(name, items, opts = {}) {
  const size = opts.size || 5;
  const rows = items.map((item, i) => ({ name: item, strength: ((i * 7) % size) + 1 }));
  const title = opts.title || titleCase(name);
  const note = opts.note || `${items.length} entries — the full list.`;
  return command(name, {
    aliases: opts.aliases,
    description: opts.description || `Browse ${title.toLowerCase()}`,
    run: barListHandler(`${opts.emoji || "📊"} ${title}`, rows, note),
  });
}

/* ── Common handler patterns ───────────────────────────────────────────── */

/**
 * A handler that shows the caller's user record fields.
 * @param {string[]} fields  keys to display
 * @param {string} title
 */
function statsHandler(title, fields) {
  return async (ctx) => {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const lines = fields.map((f) => {
      const [key, label] = Array.isArray(f) ? f : [f, titleCase(f)];
      return `  ${label}: ${formatValue(user[key])}`;
    });
    await ctx.send([`${title}`, ...lines].join("\n"));
  };
}

function formatValue(v) {
  if (v == null) return "—";
  if (Array.isArray(v)) return `${v.length} items`;
  if (typeof v === "number") return fmt(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * A gambling handler: charge a bet, roll against `winChance`, pay `payout`
 * times the bet on a win.
 * @param {object} opts  { title, betWords, minBet, winChance, payout, extra }
 */
function gambleHandler(opts) {
  const {
    title, emoji = "🎲", minBet = 10, winChance = 0.4, payout = 2,
    betWords = ["bet", "amount"], extra = null,
  } = opts;
  return async (ctx) => {
    const user = await getUser(ctx.event.senderID, ctx.profile.name);
    const raw = ctx.args.find((a) => /\d/.test(a));
    const bet = parseAmount(raw);
    if (bet == null) {
      await ctx.send(`${emoji} ${title}\nUsage: ${ctx.thread && ctx.thread.prefix ? ctx.thread.prefix : "!"}${ctx.name} ${betWords.join(" ")} [amount]\nMinimum bet: ${fmt(minBet)} coins.`);
      return;
    }
    if (bet < minBet) { await ctx.send(`${emoji} Minimum bet is ${fmt(minBet)} coins.`); return; }
    if ((user.money || 0) < bet) { await ctx.send(`💸 You only have ${fmt(user.money)} coins.`); return; }

    const won = Math.random() < winChance;
    const delta = won ? Math.floor(bet * payout) - bet : -bet;
    await adjustMoney(ctx.event.senderID, delta, ctx.profile.name);
    if (won) await addXp(ctx.event.senderID, 5, ctx.profile.name);

    const roll = randInt(1, 100);
    const lines = [
      `${emoji} ${title}`,
      `🎲 Roll: ${roll} (needed ≤ ${Math.round(winChance * 100)})`,
      won ? `🟢 You won ${fmt(Math.floor(bet * payout))} coins!` : `🔴 You lost ${fmt(bet)} coins.`,
    ];
    if (extra) lines.push(...(Array.isArray(extra) ? extra(roll, won) : [extra]));
    await ctx.send(lines.join("\n"));
  };
}

/**
 * A handler that answers with a randomly chosen line from a list.
 * @param {string} title
 * @param {string[]} lines
 */
function randomHandler(title, lines) {
  return async (ctx) => {
    await ctx.send(`${title}\n${pick(lines)}`);
  };
}

/**
 * A handler that lists a static array with bars, using items' order.
 * @param {string} title
 * @param {string[]} items
 */
function simpleListHandler(title, items) {
  return async (ctx) => {
    const chunks = renderList({ title, items, emoji: "" });
    for (const c of chunks) await ctx.send(c);
  };
}

function simpleBarHandler(title, items) {
  return async (ctx) => {
    const rows = items.map((item, i) => ({ name: item, strength: ((i * 7) % 5) + 1 }));
    const chunks = renderBarList({ title, items: rows, emoji: "" });
    for (const c of chunks) await ctx.send(c);
  };
}

module.exports = {
  command,
  commands,
  listCommand,
  barListCommand,
  notImplemented,
  statsHandler,
  gambleHandler,
  randomHandler,
  simpleListHandler,
  simpleBarHandler,
  getRegistry,
  getUser,
  adjustMoney,
  addXp,
  fmt,
  parseAmount,
  titleCase,
  pick,
  sample,
  randInt,
  bar,
  norm,
};
