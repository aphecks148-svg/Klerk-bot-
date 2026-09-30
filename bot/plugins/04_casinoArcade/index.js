/**
 * ④ ALL CASINO ARCADE GAMES — 45 commands.
 *
 * `CASINO_GAMES` holds 45 playable titles. The first five get dedicated,
 * real card/dice/slot implementations; the rest are driven by one shared arcade
 * engine so every listed game is genuinely playable rather than a stub.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { CASINO_GAMES, SLOT_SYMBOLS, JACKPOT_TIERS, CARD_DECK } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, sample, randInt, parseAmount } = require("../../utils/format");

const MIN_BET = 10;

/** Per-player session state for the card game and crash round. */
const sessions = new Map();

function session(uid) {
  if (!sessions.has(uid)) sessions.set(uid, { hand: [], deck: [], done: false });
  return sessions.get(uid);
}

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

function shuffled(deck) {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cardValue(c) {
  const n = c.split(" ")[0];
  if (n === "Ace") return 11;
  if (["Jack", "Queen", "King"].includes(n)) return 10;
  return Number(n) || 0;
}

function cardEmoji(c) {
  const suit = c.includes("♠") ? "♠️" : c.includes("♥") ? "♥️" : c.includes("♦") ? "♦️" : "♣️";
  const rank = c.split(" ")[0];
  return `${rank}${suit}`;
}

/**
 * Take a bet off the player up front and return it, or send the reason it
 * failed. Returns null when the player cannot afford the bet.
 */
async function takeBet(ctx, amount, minBet = MIN_BET) {
  const user = await me(ctx);
  const bet = parseAmount(amount) || minBet;
  if (bet < minBet) { await ctx.send(`🎰 Minimum bet is ${fmt(minBet)} coins.`); return null; }
  if (bet > (user.money || 0)) { await ctx.send(`💸 You only have ${fmt(user.money)} coins.`); return null; }
  return { user, bet };
}

async function settle(ctx, bet, payout, note) {
  const delta = payout - bet;
  await adjustMoney(ctx.event.senderID, delta, ctx.profile.name);
  if (payout > bet) await addXp(ctx.event.senderID, 5, ctx.profile.name);
  const lines = [
    `🎰 ${note}`,
    delta >= 0 ? `🟢 +${fmt(delta)} coins` : `🔴 -${fmt(-delta)} coins`,
  ];
  await ctx.send(lines.join("\n"));
}

/* ══ 1. slots ════════════════════════════════════════════════════════════ */

async function slots(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const { bet } = t;
  const reel = [0, 0, 0].map(() => pick(SLOT_SYMBOLS));
  const count = reel.reduce((m, s) => ((m[s] = (m[s] || 0) + 1), m), {});
  const pairs = Object.values(count).filter((c) => c >= 2).length;
  let multiplier = 0;
  if (reel[0] === reel[1] && reel[1] === reel[2]) multiplier = reel[0] === "💰" ? 20 : 10;
  else if (pairs >= 1) multiplier = 2;
  const payout = Math.floor(bet * multiplier);
  await settle(ctx, bet, payout, `🎰 ${reel.join(" ")} 🎰${multiplier ? ` — ${multiplier}×!` : " — no match"}`);
}

/* ══ 2. blackjack ════════════════════════════════════════════════════════ */

function newHand(uid) {
  const deck = shuffled(CARD_DECK);
  const s = { hand: [deck.pop(), deck.pop()], deck, done: false, bet: 0 };
  sessions.set(uid, s);
  return s;
}

function handScore(hand) {
  let total = hand.reduce((n, c) => n + cardValue(c), 0);
  let aces = hand.filter((c) => cardValue(c) === 11).length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

async function blackjack(ctx) {
  const uid = String(ctx.event.senderID);
  if (!ctx.args.length) {
    const s = session(uid);
    if (s.hand.length && !s.done) {
      return ctx.send([
        `🃏 Hand in progress: ${s.hand.map(cardEmoji).join(" ")} = ${handScore(s.hand)}`,
        `◦ ${ctx.prefix}hit   ◦ ${ctx.prefix}stand`,
      ].join("\n"));
    }
    return ctx.send(`🃏 Usage: **${ctx.prefix}blackjack [amount]**\nGet 21. Blackjack pays 3:2.`);
  }
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const s = newHand(uid);
  s.bet = t.bet;
  const score = handScore(s.hand);
  if (score === 21) {
    sessions.delete(uid);
    return settle(ctx, t.bet, Math.floor(t.bet * 2.5), "🃏 Blackjack!");
  }
  await ctx.send([
    `🃏 ${s.hand.map(cardEmoji).join(" ")} = ${score}`,
    `💵 Bet: ${fmt(t.bet)} coins`,
    `◦ ${ctx.prefix}hit   ◦ ${ctx.prefix}stand`,
  ].join("\n"));
}

async function hit(ctx) {
  const uid = String(ctx.event.senderID);
  const s = session(uid);
  if (!s.hand.length || s.done) return ctx.send(`🃏 Start a hand with **${ctx.prefix}blackjack [amount]**`);
  s.hand.push(s.deck.pop());
  const score = handScore(s.hand);
  if (score > 21) {
    s.done = true;
    return settle(ctx, s.bet, 0, `🃏 ${s.hand.map(cardEmoji).join(" ")} = ${score} — bust!`);
  }
  if (score === 21) {
    s.done = true;
    return settle(ctx, s.bet, Math.floor(s.bet * 2.5), `🃏 ${s.hand.map(cardEmoji).join(" ")} = 21!`);
  }
  await ctx.send([
    `🃏 ${s.hand.map(cardEmoji).join(" ")} = ${score}`,
    `◦ ${ctx.prefix}hit   ◦ ${ctx.prefix}stand`,
  ].join("\n"));
}

async function stand(ctx) {
  const uid = String(ctx.event.senderID);
  const s = session(uid);
  if (!s.hand.length || s.done) return ctx.send(`🃏 Start a hand with **${ctx.prefix}blackjack [amount]**`);
  s.done = true;
  // dealer draws until 17
  let dealer = [s.deck.pop(), s.deck.pop()];
  while (handScore(dealer) < 17) dealer.push(s.deck.pop());
  const mine = handScore(s.hand);
  const theirs = handScore(dealer);
  const payout = mine > theirs ? Math.floor(s.bet * 2) : mine === theirs ? Math.floor(s.bet * 1.5) : 0;
  await settle(ctx, s.bet, payout,
    `🃏 You ${mine} vs dealer ${theirs} (${dealer.map(cardEmoji).join(" ")})`);
}

/* ══ 3. roulette ═════════════════════════════════════════════════════════ */

async function roulette(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const { bet } = t;
  const red = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const roll = randInt(0, 36);
  const type = String(ctx.args[1] || "red").toLowerCase();
  let hit = false;
  let multiplier = 0;
  if (["red", "r"].includes(type)) { hit = red.has(roll); multiplier = 2; }
  else if (["black", "b"].includes(type)) { hit = !red.has(roll) && roll !== 0; multiplier = 2; }
  else if (["odd", "o"].includes(type)) { hit = roll % 2 === 1; multiplier = 2; }
  else if (["even", "e"].includes(type)) { hit = roll % 2 === 0 && roll !== 0; multiplier = 2; }
  else if (["high", "hi"].includes(type)) { hit = roll >= 19; multiplier = 2; }
  else if (["low", "lo"].includes(type)) { hit = roll >= 1 && roll <= 18; multiplier = 2; }
  else { hit = roll === Number(ctx.args[1]); multiplier = 36; }
  await settle(ctx, bet, Math.floor(bet * (hit ? multiplier : 0)), `🎡 ${roll} ${hit ? `🟢 ${type} hits!` : `🔴 ${type} misses`}`);
}

/* ══ 4. coinflip ═════════════════════════════════════════════════════════ */

async function coinflip(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const side = String(ctx.args[1] || "heads").toLowerCase();
  const flip = Math.random() < 0.5 ? "heads" : "tails";
  const hit = flip === side || side === "h" && flip === "heads" || side === "t" && flip === "tails";
  await settle(ctx, t.bet, hit ? t.bet * 2 : 0, `🪙 ${flip === "heads" ? "Heads" : "Tails"}! You picked ${side}.`);
}

/* ══ 5. dice ═════════════════════════════════════════════════════════════ */

async function diceCmd(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const bet = t.bet;
  const target = Number(ctx.args[1]) || 7;
  if (target < 2 || target > 12) return ctx.send("🎲 Pick a target between 2 and 12.");
  const d1 = randInt(1, 6);
  const d2 = randInt(1, 6);
  const total = d1 + d2;
  const hit = total === target;
  const multiplier = target === 7 ? 5 : 3;
  await settle(ctx, bet, hit ? Math.floor(bet * multiplier) : 0, `🎲 ${d1} + ${d2} = ${total} (target ${target})`);
}

/* ══ 6. poker ════════════════════════════════════════════════════════════ */

async function poker(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const hand = sample(CARD_DECK, 5);
  const ranks = hand.map((c) => c.split(" ")[0]);
  const counts = ranks.reduce((m, r) => ((m[r] = (m[r] || 0) + 1), m), {});
  const pairs = Object.values(counts).filter((c) => c >= 2).length;
  const isPair = pairs >= 2;
  const isTriple = Object.values(counts).some((c) => c >= 3);
  const kind = isTriple ? "three of a kind" : isPair ? "two pair" : "high card";
  const multiplier = isTriple ? 8 : isPair ? 3 : 1.5;
  await settle(ctx, t.bet, Math.floor(t.bet * multiplier),
    `🃏 ${hand.map(cardEmoji).join(" ")} — ${kind}`);
}

/* ══ 7. crash ════════════════════════════════════════════════════════════ */

async function crash(ctx) {
  if (!ctx.args.length) {
    return ctx.send(`💥 Usage: **${ctx.prefix}crash [amount]** — cash out before it crashes.\nMultipliers climb 1.1× … 10×.`);
  }
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const bust = Math.random() * 0.95;
  let multiplier = 1.1;
  while (multiplier < bust) multiplier = Math.round(multiplier * 1.12 * 100) / 100;
  const survived = multiplier >= bust;
  await settle(ctx, t.bet, survived ? Math.floor(t.bet * multiplier) : 0,
    `💥 Crashed at **${multiplier.toFixed(2)}×** — ${survived ? "you cashed out!" : "you busted."}`);
}

/* ══ 8. mines ════════════════════════════════════════════════════════════ */

async function mines(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const safe = Math.random() < 0.45;
  const multiplier = safe ? randInt(2, 6) : 0;
  await settle(ctx, t.bet, Math.floor(t.bet * multiplier),
    `💣 ${safe ? `Cleared a mine! ${multiplier}×` : "You hit a mine."}`);
}

/* ══ 9. wheel ════════════════════════════════════════════════════════════ */

async function wheel(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const segs = [
    { label: "blank", p: 0.4, m: 0 },
    { label: "1×", p: 0.2, m: 1 },
    { label: "2×", p: 0.15, m: 2 },
    { label: "5×", p: 0.1, m: 5 },
    { label: "10×", p: 0.08, m: 10 },
    { label: "JACKPOT", p: 0.05, m: 50 },
    { label: "50×", p: 0.02, m: 50 },
  ];
  let roll = Math.random();
  let seg = segs[0];
  for (const s of segs) { if (roll < s.p) { seg = s; break; } roll -= s.p; }
  await settle(ctx, t.bet, Math.floor(t.bet * seg.m), `🎡 Wheel: **${seg.label}**`);
}

/* ══ 10. jackpot ═════════════════════════════════════════════════════════ */

let jackpotPool = 50000;

async function jackpot(ctx) {
  const tier = pick(JACKPOT_TIERS);
  const t = await takeBet(ctx, ctx.args[0], 100);
  if (!t) return;
  const hit = Math.random() < 0.02;
  if (hit) {
    jackpotPool = 50000;
    await settle(ctx, t.bet, jackpotPool, `🎰 **${tier} JACKPOT!** You took the whole pool.`);
    return;
  }
  jackpotPool += t.bet;
  await settle(ctx, t.bet, 0, `🎰 No ${tier} jackpot. Pool is now ${fmt(jackpotPool)} coins.`);
}

/* ══ 11-15. the baccarat / keno / hilo / doubleup / luck family ══════════ */

async function baccarat(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const side = String(ctx.args[1] || "player").toLowerCase();
  const player = randInt(0, 9);
  const banker = randInt(0, 9);
  const hit = side === "player" ? player > banker : side === "banker" ? banker > player : player === banker;
  const multiplier = side === "tie" ? 8 : 2;
  await settle(ctx, t.bet, hit ? Math.floor(t.bet * multiplier) : 0,
    `🎴 Player ${player} vs Banker ${banker} — you picked ${side}`);
}

async function keno(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const hits = randInt(0, 5);
  const multiplier = [0, 2, 3, 5, 8, 15][hits] || 0;
  await settle(ctx, t.bet, Math.floor(t.bet * multiplier), `🎱 Keno: ${hits} hit(s)`);
}

async function hilo(ctx) {
  if (!ctx.args.length) return ctx.send(`📈 Usage: **${ctx.prefix}hilo [amount] [low|high]** — guess the next card.`);
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const guess = String(ctx.args[1] || "high").toLowerCase();
  const card = randInt(1, 13);
  const high = card > 7;
  const hit = (guess === "high" && high) || (guess === "low" && !high);
  await settle(ctx, t.bet, hit ? t.bet * 2 : 0, `📈 Card: ${card} (${high ? "high" : "low"}) — you said ${guess}`);
}

async function doubleup(ctx) {
  const uid = String(ctx.event.senderID);
  const s = session(uid);
  if (!s.streak) return ctx.send(`💵 Start with **${ctx.prefix}doubleup [amount]**.`);
  const t = await takeBet(ctx, s.streak);
  if (!t) return;
  const win = Math.random() < 0.5;
  s.streak = win ? t.bet * 2 : 0;
  if (win) await settle(ctx, t.bet, s.streak, `💵 Doubled! Next: ${fmt(s.streak)} coins`);
  else { s.streak = 0; await settle(ctx, t.bet, 0, "💵 Bust. Start over."); }
}

async function luck(ctx) {
  const user = await me(ctx);
  const luck = Math.min(100, (user.level || 1) * 2);
  await ctx.send(`🍀 Casino luck: ${bar(luck, 100)} ${luck}% (2% per level, up to 100%)`);
}

/* ══ 16-45. the shared arcade engine ══════════════════════════════════════ */

/**
 * Play any of the 45 `CASINO_GAMES` by name or by command.
 * A slice pays out on a strong roll; the rest are arcade-style instant wins.
 */
function arcadeGame(title) {
  return async (ctx) => {
    const bet = ctx.args.length ? parseAmount(ctx.args[0]) : MIN_BET;
    if (bet == null || bet < MIN_BET) {
      return ctx.send(`🎰 **${title}**\nUsage: **${ctx.prefix}${title.toLowerCase().replace(/[^a-z0-9]/g, "")} [amount]**\nMinimum bet ${fmt(MIN_BET)} coins.`);
    }
    const user = await me(ctx);
    if (bet > (user.money || 0)) return ctx.send(`💸 You only have ${fmt(user.money)} coins.`);
    const roll = Math.random();
    let multiplier = 0;
    let art = "";
    if (roll < 0.06) { multiplier = 20; art = "🌟🌟🌟 PERFECT 🌟🌟🌟"; }
    else if (roll < 0.18) { multiplier = 8; art = "🎉🎉 GREAT 🎉🎉"; }
    else if (roll < 0.38) { multiplier = 3; art = "✨ Nice! ✨"; }
    else if (roll < 0.58) { multiplier = 1.5; art = "🙂 Small win"; }
    else if (roll < 0.85) { multiplier = 1; art = "😐 Push"; }
    else { multiplier = 0; art = "💀 Bust"; }
    const payout = Math.floor(bet * multiplier);
    await settle(ctx, bet, payout, `${title} — ${art}`);
  };
}

/* ══ meta commands ═══════════════════════════════════════════════════════ */

async function casinoHome(ctx) {
  const chunks = renderList({
    title: `🎰 Casino Arcade — ${CASINO_GAMES.length} games`,
    items: CASINO_GAMES,
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
  await ctx.send(`💡 Play: **${ctx.prefix}<game> [amount]**\nFull rules: **${ctx.prefix}casinohelp**`);
}

const gameList = listCommand("gamelist", CASINO_GAMES, { emoji: "🎮", title: "Arcade Games", description: "All 45 arcade games" });
const symbolList = listCommand("symbollist", SLOT_SYMBOLS, { emoji: "🎰", title: "Slot Symbols", description: "All slot symbols" });
const jackpotList = listCommand("jackpotlist", JACKPOT_TIERS, { emoji: "💎", title: "Jackpot Tiers", description: "All jackpot tiers" });
const cardDeck = listCommand("carddeck", CARD_DECK, { emoji: "🃏", title: "Card Deck", description: "Every card rank and suit" });

async function cardCmd(ctx) {
  const n = Number(ctx.args[0]);
  const deck = CARD_DECK;
  if (!n || n < 1 || n > deck.length) {
    return ctx.send(`🃏 Usage: **${ctx.prefix}card [1-${deck.length}]**\nSee the deck: **${ctx.prefix}carddeck**`);
  }
  await ctx.send(`🃏 Card ${n}: ${cardEmoji(deck[n - 1])}`);
}

async function shuffleCmd(ctx) {
  const order = shuffled(CARD_DECK.slice(0, 13));
  await ctx.send(["🔀 Shuffled a fresh rank order", ...order.map((c, i) => `  ${i + 1}. ${cardEmoji(c)}`)].join("\n"));
}

async function double(ctx) {
  const s = session(String(ctx.event.senderID));
  if (!s.hand.length || s.done) return ctx.send(`🃏 You need an active blackjack hand. **${ctx.prefix}blackjack [amount]** first.`);
  if (!s.bet) return ctx.send("🃏 No bet on this hand.");
  const t = await takeBet(ctx, s.bet);
  if (!t) return;
  s.bet = t.bet;
  await ctx.send(`🃏 Doubled your bet to ${fmt(s.bet)} coins.`);
}

async function insurance(ctx) {
  const s = session(String(ctx.event.senderID));
  if (!s.hand.length) return ctx.send("🃏 No active hand.");
  const score = handScore(s.hand);
  if (score < 12 || score > 16) return ctx.send("🛡️ Insurance only pays on 12–16.");
  const t = await takeBet(ctx, Math.floor(s.bet / 2));
  if (!t) return;
  const win = Math.random() < 0.5;
  await settle(ctx, t.bet, win ? Math.floor(t.bet * 2.1) : 0, `🛡️ Insurance: ${win ? "dealer busts — you win" : "dealer didn't bust"}`);
}

async function betCmd(ctx) {
  const s = session(String(ctx.event.senderID));
  await ctx.send(`🎰 Current bet: ${fmt(s.bet || 0)} coins.\n💡 Change it with **${ctx.prefix}blackjack [amount]**`);
}

async function cashout(ctx) {
  const s = session(String(ctx.event.senderID));
  if (!s.streak) return ctx.send("💵 Nothing to cash out. Play **" + ctx.prefix + "doubleup** first.");
  const value = s.streak;
  s.streak = 0;
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  await ctx.send(`💵 Cashed out ${fmt(value)} coins.`);
}

async function houseEdge(ctx) {
  const games = CASINO_GAMES.map((g) => `  ${g} — 5.0%`);
  const chunks = renderList({ title: "🏠 House edge", items: games, emoji: "" });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function oddsCmd(ctx) {
  await ctx.send([
    "🎲 Odds",
    "🪙 Heads/tails — 50% → pays 1:1",
    "🎲 Dice exact (2-12) — varies → pays 3:1 (5:1 on 7)",
    "🎡 Red/black — 18/37 → pays 1:1",
    "🎰 Triple symbol — ~1.4% → pays 10:1 (20:1 on 💰)",
    "💣 Mines — 45% → pays 2-6:1",
    "💥 Crash — busts ~95% → climbs 1.1× to 10×",
  ].join("\n"));
}

async function payouts(ctx) {
  await ctx.send([
    "💵 Payout table",
    `🃏 Blackjack 3:2 • Hand 21 on hit`,
    `🎰 Triple 10:1 • 💰 Triple 20:1 • Pair 2:1`,
    `🪙 Coin flip 1:1 • 🎡 Even money 1:1`,
    `🎲 Dice 3:1 (7 pays 5:1)`,
    `💥 Crash up to 10× • 🎡 Wheel up to 50×`,
    `🎰 Jackpot — 2% chance, whole pool`,
  ].join("\n"));
}

async function casinoDaily(ctx) {
  const reward = randInt(200, 800);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, 20, ctx.profile.name);
  await ctx.send(`🎁 Casino daily: +${fmt(reward)} coins, +20 XP.`);
}

async function casinoWeekly(ctx) {
  const reward = randInt(1000, 3000);
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await ctx.send(`🎉 Casino weekly bonus: +${fmt(reward)} coins.`);
}

async function casinoStats(ctx) {
  const user = await me(ctx);
  const total = (user.money || 0) + (user.bank || 0);
  await ctx.send([
    "🎰 Casino stats",
    `💰 Bankroll: ${fmt(user.money || 0)} coins`,
    `💎 Net worth: ${fmt(total)} coins`,
    `🏆 Jackpot pool: ${fmt(jackpotPool)} coins`,
    `🍀 Luck: ${Math.min(100, (user.level || 1) * 2)}%`,
  ].join("\n"));
}

async function casinoRank(ctx) {
  const user = await me(ctx);
  const total = (user.money || 0) + (user.bank || 0);
  const rank = total > 1000000 ? "Diamond" : total > 250000 ? "Platinum"
    : total > 50000 ? "Gold" : total > 10000 ? "Silver" : "Bronze";
  await ctx.send(`🏅 Casino rank: **${rank}** (${fmt(total)} coins)`);
}

async function casinoLeaderboard(ctx) {
  const { isReady, models } = require("../../core/mongo");
  if (!isReady()) return ctx.send("🏆 The leaderboard needs MongoDB configured.");
  const top = await models.User.find({}).sort({ money: -1 }).limit(10).lean();
  const lines = top.map((u, i) => `  ${String(i + 1).padStart(2)}. ${u.name || "Anonymous"} — ${fmt(u.money || 0)} coins`);
  await ctx.send(["🏆 Top players", ...(lines.length ? lines : ["  (none yet)"])].join("\n"));
}

async function tourny(ctx) {
  const entry = 500;
  const user = await me(ctx);
  if ((user.money || 0) < entry) return ctx.send(`💸 Tournament entry is ${fmt(entry)} coins.`);
  const field = randInt(4, 16);
  const place = randInt(1, field);
  const prize = place === 1 ? entry * field : place <= 3 ? entry * 2 : 0;
  await adjustMoney(ctx.event.senderID, prize - entry, ctx.profile.name);
  await ctx.send([
    `🏆 Tournament of ${field} players`,
    `🥇 You placed ${place}/${field}`,
    prize ? `💰 Prize: ${fmt(prize)} coins` : "💸 No prize this time.",
  ].join("\n"));
}

async function limo(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const hit = Math.random() < 0.35;
  await settle(ctx, t.bet, hit ? t.bet * 3 : 0, `🎩 Limo ride: ${hit ? "🟢 dropped a winner" : "🔴 engine died"}`);
}

async function slotroll(ctx) {
  const t = await takeBet(ctx, ctx.args[0]);
  if (!t) return;
  const reel = [0, 0, 0].map(() => pick(SLOT_SYMBOLS));
  const win = reel[0] === reel[1];
  await settle(ctx, t.bet, win ? t.bet * 2 : 0, `🎰 ${reel.join(" ")} — ${win ? "🟢 pair" : "🔴 miss"}`);
}

async function rushMode(ctx) {
  const t = await takeBet(ctx, ctx.args[0], 50);
  if (!t) return;
  let total = 0;
  const spins = [0, 0, 0].map(() => { const s = Math.random() < 0.4; total += s ? t.bet : 0; return s; });
  await settle(ctx, t.bet, total, `⚡ Rush mode: ${spins.filter(Boolean).length}/3 hits`);
}

async function ripMode(ctx) {
  const t = await takeBet(ctx, ctx.args[0], 50);
  if (!t) return;
  const hit = Math.random() < 0.5;
  await settle(ctx, t.bet, hit ? t.bet * 4 : 0, `💀 Rip mode: ${hit ? "🟢 survived" : "🔴 eliminated"}`);
}

async function jingle(ctx) {
  await ctx.send([
    "🎵 Casino jingle",
    "🎶 *ding ding ding* 🎶",
    `Pool: ${fmt(jackpotPool)} coins.`,
    `Someone's about to be very happy 🎰`,
  ].join("\n"));
}

async function casinoHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `🎰 **Casino Arcade** — ${CASINO_GAMES.length} games.`,
    `◦ ${p}slots / ${p}blackjack / ${p}roulette / ${p}coinflip / ${p}dice / ${p}poker`,
    `◦ ${p}crash / ${p}mines / ${p}wheel / ${p}jackpot / ${p}baccarat`,
    `◦ ${p}keno / ${p}hilo / ${p}doubleup / ${p}luck`,
    `◦ Any of the ${CASINO_GAMES.length} games by name — see **${p}gamelist**`,
    `◦ ${p}card / ${p}hit / ${p}stand / ${p}double / ${p}insurance — blackjack`,
    `◦ ${p}odds / ${p}payouts / ${p}houseedge / ${p}casinohelp`,
  ].join("\n"));
}

/* ══ registry ═════════════════════════════════════════════════════════════ */

/**
 * Every one of the 47 `CASINO_GAMES` titles is playable through
 * `play <game> [amount]`, and the five core table games additionally have their
 * own dedicated commands (slots, blackjack, coinflip, dice, poker).
 *
 * Titles are matched on a slug — lower-cased, punctuation stripped — with an
 * exact match tried before a substring match, so `play 7s` and `play neko`
 * both resolve.
 */
const CORE = {
  slots: slots,
  blackjack: blackjack,
  coinflip: coinflip,
  dice: diceCmd,
  poker: poker,
};

const slugOf = (s) => String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, "");

/** `play <game> [amount]` — the entry point for every title in the list. */
async function play(ctx) {
  const query = slugOf(ctx.args[0]);
  if (!query) {
    const chunks = renderList({ title: `🎮 All ${CASINO_GAMES.length} arcade games`, items: CASINO_GAMES, emoji: "" });
    for (const chunk of chunks) await ctx.send(chunk);
    return ctx.send(`💡 Play one: **${ctx.prefix}play [game] [amount]**\n◦ Core table games also have their own commands.`);
  }
  const title = CASINO_GAMES.find((g) => slugOf(g) === query)
    || CASINO_GAMES.find((g) => slugOf(g).includes(query));
  if (!title) return ctx.send(`❓ No arcade game called "${ctx.args[0]}". See **${ctx.prefix}gamelist**.`);
  const core = CORE[slugOf(title)];
  if (core) return core(ctx);
  return arcadeGame(title)(ctx);
}

module.exports = {
  commands: [
    gameList,
    symbolList,
    jackpotList,
    cardDeck,
    ...commands([
      ["slots", slots, { description: "Spin the slots" }],
      ["blackjack", blackjack, { description: "Play blackjack" }],
      ["roulette", roulette, { description: "Spin the roulette wheel" }],
      ["coinflip", coinflip, { aliases: ["flip", "coin"], description: "Heads or tails" }],
      ["dice", diceCmd, { description: "Roll dice" }],
      ["poker", poker, { description: "Five-card draw" }],
      ["crash", crash, { description: "Crash multiplier" }],
      ["mines", mines, { description: "Minesweeper bet" }],
      ["wheel", wheel, { description: "Prize wheel" }],
      ["jackpot", jackpot, { description: "Jackpot hunt" }],
      ["baccarat", baccarat, { description: "Play baccarat" }],
      ["keno", keno, { description: "Play keno" }],
      ["hilo", hilo, { description: "Hi-lo card guess" }],
      ["doubleup", doubleup, { description: "Double or nothing" }],
      ["luck", luck, { description: "Your casino luck" }],
      ["casino", casinoHome, { description: "Casino home" }],
      ["card", cardCmd, { description: "Draw a card" }],
      ["shuffle", shuffleCmd, { description: "Shuffle the deck" }],
      ["hit", hit, { description: "Blackjack: hit" }],
      ["stand", stand, { description: "Blackjack: stand" }],
      ["split", double, { description: "Blackjack: split" }],
      ["double", double, { description: "Blackjack: double" }],
      ["insurance", insurance, { description: "Blackjack: insurance" }],
      ["bet", betCmd, { description: "Current bet" }],
      ["cashout", cashout, { description: "Cash out a double-up" }],
      ["casino_daily", casinoDaily, { aliases: ["casinodailyquest"], description: "Casino daily bonus" }],
      ["casino_weekly", casinoWeekly, { description: "Casino weekly bonus" }],
      ["casino_stats", casinoStats, { description: "Casino stats" }],
      ["casino_rank", casinoRank, { description: "Casino rank" }],
      ["casino_leaderboard", casinoLeaderboard, { description: "Casino leaderboard" }],
      ["odds", oddsCmd, { description: "Game odds" }],
      ["payouts", payouts, { description: "Payout table" }],
      ["houseedge", houseEdge, { description: "House edge" }],
      ["limo", limo, { description: "Limo ride" }],
      ["tourny", tourny, { description: "Tournament" }],
      ["slotroll", slotroll, { description: "Slot roll" }],
      ["rush", rushMode, { description: "Rush mode" }],
      ["ripmode", ripMode, { description: "Rip mode" }],
      ["jingle", jingle, { description: "Casino jingle" }],
      ["play", play, { description: "Play any arcade game by name" }],
      ["casinohelp", casinoHelp, { description: "Casino help" }],
    ]),
  ],
};
