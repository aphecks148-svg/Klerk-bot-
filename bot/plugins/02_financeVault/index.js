/**
 * ② ALL FINANCE VAULT LISTS — 40 commands.
 *
 * Money lives in two places: `money` (wallet, spendable) and `bank` (protected,
 * earns interest). Bank protection is a per-group thread setting and blocks
 * withdrawals larger than the stored balance.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, depositBank, withdrawBank, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const {
  BANKS, INVESTMENTS, LOAN_TYPES, TAX_BRACKETS, LOAN_SHOP_ITEMS,
} = require("../../data/lists");
const { renderList, renderBarList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt, parseAmount, sample } = require("../../utils/format");

/* ── market simulation ─────────────────────────────────────────────────── */

const market = new Map();
const txlog = new Map();

function priceOf(symbol) {
  if (!market.has(symbol)) market.set(symbol, Math.round(randInt(80, 400) * 100) / 100);
  return market.get(symbol);
}
function setPrice(symbol, value) { market.set(symbol, Math.round(value * 100) / 100); }
function drift(symbol) {
  const p = priceOf(symbol);
  const next = Math.max(1, p * (0.9 + Math.random() * 0.2));
  setPrice(symbol, next);
  return next;
}

function logTx(uid, entry) {
  if (!txlog.has(uid)) txlog.set(uid, []);
  const list = txlog.get(uid);
  list.unshift({ ...entry, at: Date.now() });
  txlog.set(uid, list.slice(0, 25));
}

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

function mentionedId(ctx) {
  return Object.keys(ctx.event.mentions || {})[0] || ctx.args.find((a) => /^\d{5,}$/.test(a)) || null;
}

function findMatch(list, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return list.find((x) => String(x).toLowerCase() === q)
    || list.find((x) => String(x).toLowerCase().includes(q)) || null;
}

function noMatch(ctx, query, listName) {
  return ctx.send(`❓ No ${listName || "entry"} called "${query}". Try **${ctx.prefix}${listName ? listName.toLowerCase() + "_list" : "list"}**.`);
}

/* ── 1. rich / 2. richlist ─────────────────────────────────────────────── */

async function rich(ctx) {
  const user = await me(ctx);
  const net = (user.money || 0) + (user.bank || 0);
  await ctx.send([
    "💎 Your net worth",
    `👛 Wallet: ${fmt(user.money || 0)}`,
    `🏦 Bank:   ${fmt(user.bank || 0)}`,
    `💰 Total:  ${fmt(net)} coins`,
  ].join("\n"));
}

async function richList(ctx) {
  if (!isReady()) return ctx.send("🏆 The leaderboard needs MongoDB (MONGO_URI) to be configured.");
  const top = await models.User.find({}).sort({ money: -1, bank: -1 }).limit(10).lean();
  if (!top.length) return ctx.send("🏆 No accounts yet — be the first!");
  const lines = top.map((u, i) => `  ${String(i + 1).padStart(2)}. ${u.name || "Anonymous"} — ${fmt((u.money || 0) + (u.bank || 0))} coins`);
  await ctx.send(["🏆 Richest players", ...lines].join("\n"));
}

/* ── 3. interest ───────────────────────────────────────────────────────── */

async function interest(ctx) {
  const user = await me(ctx);
  const daily = Math.floor((user.bank || 0) * 0.01);
  await ctx.send([
    "📈 Bank interest",
    `🏦 Balance: ${fmt(user.bank || 0)} coins`,
    `💵 Daily interest: ${fmt(daily)} coins (1%)`,
    `📆 Claim with **${ctx.prefix}claim**.`,
  ].join("\n"));
}

/* ── 4. banklist / 5. loanlist / 6. loanshop / 7. taxlist ──────────────── */

const bankList = listCommand("banklist", BANKS, { emoji: "🏦", title: "Bank Accounts", description: "All bank types" });
const loanList = listCommand("loanlist", LOAN_TYPES, { emoji: "📋", title: "Loan Types", description: "All loan types" });
const loanShop = listCommand("loanshop", LOAN_SHOP_ITEMS, { emoji: "🛒", title: "Loan Shop Items", description: "Loan shop stock" });
const taxList = listCommand("taxlist", TAX_BRACKETS, { emoji: "🧾", title: "Tax Brackets", description: "All tax brackets" });
const investList = listCommand("investlist", INVESTMENTS, { emoji: "📊", title: "Investment Types", description: "All investment types" });

/* ── 8. loan / 9. repay ────────────────────────────────────────────────── */

async function loan(ctx) {
  const user = await me(ctx);
  const type = findMatch(LOAN_TYPES, ctx.args.slice(1).join(" ")) || pick(LOAN_TYPES);
  const amount = parseAmount(ctx.args[0]) || Math.min(5000, Math.floor((user.money || 0) * 2) || 500);
  const rate = randInt(5, 25);
  const owed = Math.ceil(amount * (1 + rate / 100));
  if ((user.money || 0) < 100) return ctx.send("💸 You need at least 100 coins to take a loan.");
  await adjustMoney(ctx.event.senderID, amount, ctx.profile.name);
  const loans = [...(user.loans || []), { type, amount, rate, owed, takenAt: Date.now() }];
  user.loans = loans;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { loans } });
  await ctx.send([
    `🏦 Loan approved: **${type}**`,
    `💰 Received ${fmt(amount)} coins`,
    `📈 Interest: ${rate}% — repay ${fmt(owed)}`,
    `💳 Wallet: ${fmt((user.money || 0) + amount)} coins`,
  ].join("\n"));
}

async function repay(ctx) {
  const user = await me(ctx);
  const loans = user.loans || [];
  if (!loans.length) return ctx.send("🏦 You have no outstanding loans.");
  const amount = parseAmount(ctx.args[0]) || Math.min(loans[0].owed, user.money || 0);
  if (amount > (user.money || 0)) return ctx.send(`💸 You only have ${fmt(user.money)} coins.`);
  const idx = loans.findIndex((l) => l.owed > 0);
  if (idx < 0) return ctx.send("🎉 All your loans are cleared!");
  const loan = loans[idx];
  loan.owed = Math.max(0, loan.owed - amount);
  const updated = loans.filter((l) => l.owed > 0);
  user.loans = updated;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { loans: updated } });
  await adjustMoney(ctx.event.senderID, -amount, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Repaid ${fmt(amount)} on ${loan.type}` });
  await ctx.send(`🏦 Repaid ${fmt(amount)} coins. ${updated.length ? `${updated.length} loan(s) left.` : "🎉 All debts cleared!"}`);
}

/* ── 10. buyshop ───────────────────────────────────────────────────────── */

async function buyShop(ctx) {
  const user = await me(ctx);
  const item = findMatch(LOAN_SHOP_ITEMS, ctx.args.join(" "));
  if (!item) return noMatch(ctx, ctx.args.join(" "), "LOAN_SHOP_ITEMS");
  const cost = randInt(100, 800);
  if ((user.money || 0) < cost) return ctx.send(`💸 ${item} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await addXp(ctx.event.senderID, 15, ctx.profile.name);
  await ctx.send(`🛒 Bought **${item}** for ${fmt(cost)} coins. 📉 Interest rate: -2%`);
}

/* ── 11. tax ───────────────────────────────────────────────────────────── */

async function tax(ctx) {
  const user = await me(ctx);
  const net = (user.money || 0) + (user.bank || 0);
  const bracket = TAX_BRACKETS[Math.min(TAX_BRACKETS.length - 1, Math.floor(net / 25000))];
  const rate = (TAX_BRACKETS.indexOf(bracket) + 1) * 5;
  const owed = Math.floor(net * (rate / 100));
  if (owed <= 0) return ctx.send("🧾 You're under the tax threshold — nothing to pay.");
  if ((user.money || 0) < owed) return ctx.send(`🧾 Tax due: ${fmt(owed)} coins. You only have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -owed, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Paid ${fmt(owed)} tax (${bracket})` });
  await ctx.send([
    `🧾 Tax collected — ${bracket}`,
    `💸 Paid ${fmt(owed)} coins (${rate}%)`,
    `💳 Wallet: ${fmt((user.money || 0) - owed)} coins`,
  ].join("\n"));
}

/* ── 12. invest ────────────────────────────────────────────────────────── */

async function invest(ctx) {
  const user = await me(ctx);
  const type = findMatch(INVESTMENTS, ctx.args.slice(1).join(" ")) || pick(INVESTMENTS);
  const amount = parseAmount(ctx.args[0]) || 500;
  if (amount > (user.money || 0)) return ctx.send(`💸 You only have ${fmt(user.money)} coins.`);
  if (amount < 100) return ctx.send("📊 Minimum investment is 100 coins.");
  const returns = Math.random() < 0.45;
  const rate = returns ? randInt(10, 40) : -randInt(5, 25);
  const value = Math.floor(amount * (1 + rate / 100));
  const holdings = { ...(user.holdings || {}) };
  holdings[type] = (holdings[type] || 0) + value;
  user.holdings = holdings;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { holdings } });
  const delta = value - amount;
  await adjustMoney(ctx.event.senderID, delta, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Invested ${fmt(amount)} in ${type} → ${fmt(value)}` });
  await ctx.send([
    `📊 Investment: **${type}**`,
    `💵 Put in ${fmt(amount)} coins`,
    returns ? `📈 Value now ${fmt(value)} (+${rate}%)` : `📉 Value now ${fmt(value)} (${rate}%)`,
  ].join("\n"));
}

/* ── 13. buyshares / 14. selshares / 15. price / 16. transactions ──────── */

const SYMBOLS = ["IKON", "NOVA", "META", "MOON", "BYTE", "GOLD", "VOLT", "AERO"];

async function buyshares(ctx) {
  const user = await me(ctx);
  const symbol = (ctx.args[1] || ctx.args[0] || "IKON").toUpperCase();
  const amountArg = parseAmount(ctx.args[0]) || 100;
  const price = priceOf(symbol);
  const shares = Math.floor(amountArg / price);
  if (shares < 1) return ctx.send(`📊 ${symbol} is ${price} — you can't afford a single share.`);
  const cost = shares * price;
  if (cost > (user.money || 0)) return ctx.send(`💸 ${shares} shares of ${symbol} cost ${fmt(cost)}. You have ${fmt(user.money)}.`);
  const portfolio = { ...(user.portfolio || {}) };
  portfolio[symbol] = (portfolio[symbol] || 0) + shares;
  user.portfolio = portfolio;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { portfolio } });
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  drift(symbol);
  logTx(ctx.event.senderID, { what: `Bought ${shares} ${symbol} @ ${price}` });
  await ctx.send(`📈 Bought ${shares} share(s) of **${symbol}** at ${price} each (${fmt(cost)} coins).`);
}

async function selshares(ctx) {
  const user = await me(ctx);
  const symbol = (ctx.args[0] || "").toUpperCase();
  const held = (user.portfolio || {})[symbol] || 0;
  if (!held) return ctx.send(`📉 You hold no ${symbol || "shares"}.`);
  const amount = parseAmount(ctx.args[1]) || held;
  const shares = Math.min(held, Math.floor(amount / priceOf(symbol)) || held);
  if (shares < 1) return ctx.send("📉 Not enough value to sell a share.");
  const value = Math.round(shares * priceOf(symbol));
  const portfolio = { ...(user.portfolio || {}) };
  portfolio[symbol] = held - shares;
  if (portfolio[symbol] <= 0) delete portfolio[symbol];
  user.portfolio = portfolio;
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { portfolio } });
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  drift(symbol);
  logTx(ctx.event.senderID, { what: `Sold ${shares} ${symbol} @ ${priceOf(symbol)}` });
  await ctx.send(`📉 Sold ${shares} share(s) of **${symbol}** for ${fmt(value)} coins.`);
}

async function price(ctx) {
  const symbol = (ctx.args[0] || "").toUpperCase();
  if (!symbol) {
    const lines = SYMBOLS.map((s) => `  ${s}: ${priceOf(s)} coins`);
    return ctx.send(["📊 Market prices", ...lines].join("\n"));
  }
  drift(symbol);
  await ctx.send(`📊 ${symbol}: **${priceOf(symbol)}** coins per share.`);
}

async function transactions(ctx) {
  const list = txlog.get(String(ctx.event.senderID)) || [];
  if (!list.length) return ctx.send("🧾 No transactions yet.");
  const lines = list.slice(0, 15).map((t) => `  ${new Date(t.at).toISOString().slice(0, 16).replace("T", " ")} — ${t.what}`);
  await ctx.send(["🧾 Recent transactions", ...lines].join("\n"));
}

/* ── 17. portfolio ─────────────────────────────────────────────────────── */

async function portfolio(ctx) {
  const user = await me(ctx);
  const portfolio = user.portfolio || {};
  const names = Object.keys(portfolio);
  if (!names.length) return ctx.send("📊 No shares yet. Buy some with **" + ctx.prefix + "buyshares [symbol]**.");
  const lines = names.map((s) => `  ${s}: ${portfolio[s]} share(s) @ ${priceOf(s)} = ${fmt(portfolio[s] * priceOf(s))}`);
  const total = names.reduce((n, s) => n + portfolio[s] * priceOf(s), 0);
  await ctx.send(["📊 Portfolio", ...lines, `💰 Total value: ${fmt(total)} coins`].join("\n"));
}

/* ── 18. auction / 19. bid ─────────────────────────────────────────────── */

const auctions = [];

async function auction(ctx) {
  if (!auctions.length) {
    const lot = pick(LOAN_SHOP_ITEMS);
    auctions.push({ lot, bid: randInt(100, 500), bidder: null, endsAt: Date.now() + 3600000 });
    return ctx.send(`🔨 New auction: **${lot}** — opening bid ${fmt(auctions[0].bid)} coins. Bid with **${ctx.prefix}bid [amount]**`);
  }
  const lines = auctions.map((a) => `  ${a.lot} — ${fmt(a.bid)} coins${a.bidder ? ` (leading)` : ""}`);
  await ctx.send([`🔨 Auctions (${auctions.length})`, ...lines].join("\n"));
}

async function bid(ctx) {
  const amount = parseAmount(ctx.args[0]);
  if (amount == null) return ctx.send(`Usage: **${ctx.prefix}bid [amount]**`);
  if (!auctions.length) return ctx.send("🔨 No live auctions. Start one with **" + ctx.prefix + "auction**.");
  const lot = auctions[0];
  if (amount <= lot.bid) return ctx.send(`🔨 Your bid of ${fmt(amount)} is too low. Current: ${fmt(lot.bid)}.`);
  const user = await me(ctx);
  if (amount > (user.money || 0)) return ctx.send(`💸 You only have ${fmt(user.money)} coins.`);
  lot.bid = amount;
  lot.bidder = ctx.event.senderID;
  await ctx.send(`🔨 Bid placed: **${fmt(amount)}** coins for ${lot.lot}. You're leading.`);
}

/* ── 20. refund / 21. paybill / 22. splitbill / 23. tip ─────────────────── */

async function refund(ctx) {
  const user = await me(ctx);
  const amount = Math.min(randInt(50, 300), user.money || 0);
  if (amount <= 0) return ctx.send("💸 Nothing to refund.");
  await adjustMoney(ctx.event.senderID, amount, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Refund +${fmt(amount)}` });
  await ctx.send(`↩️ Refunded ${fmt(amount)} coins. Wallet: ${fmt((user.money || 0) + amount)}.`);
}

async function paybill(ctx) {
  const user = await me(ctx);
  const bill = ctx.args.join(" ") || "Utilities";
  const amount = randInt(50, 400);
  if (amount > (user.money || 0)) return ctx.send(`💸 ${bill} costs ${fmt(amount)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -amount, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Paid ${bill} ${fmt(amount)}` });
  await ctx.send(`🧾 Paid **${bill}**: -${fmt(amount)} coins. Wallet: ${fmt((user.money || 0) - amount)}.`);
}

async function splitbill(ctx) {
  const user = await me(ctx);
  const amount = parseAmount(ctx.args[0]) || 100;
  const shares = (ctx.event.mentions && Object.keys(ctx.event.mentions).length) || 0;
  if (!shares) return ctx.send(`Usage: **${ctx.prefix}splitbill [amount]** and tag the people splitting it.`);
  const per = Math.ceil(amount / (shares + 1));
  if ((user.money || 0) < per) return ctx.send(`💸 Your share is ${fmt(per)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -per, ctx.profile.name);
  await ctx.send(`🧾 Split ${fmt(amount)} coins ${shares + 1} ways — you paid ${fmt(per)}.`);
}

async function tip(ctx) {
  const target = mentionedId(ctx);
  const amount = parseAmount(ctx.args.find((a) => /\d/.test(a))) || 100;
  if (!target) return ctx.send(`Usage: **${ctx.prefix}tip @user [amount]**`);
  if (target === String(ctx.event.senderID)) return ctx.send("🙃 Tip someone else!");
  const user = await me(ctx);
  if (amount > (user.money || 0)) return ctx.send(`💸 You only have ${fmt(user.money)} coins.`);
  const them = await getUser(target, "Facebook user");
  await adjustMoney(ctx.event.senderID, -amount, ctx.profile.name);
  await adjustMoney(target, amount, them.name);
  await ctx.send(`💝 Tipped ${fmt(amount)} coins to ${them.name || "them"}.`);
}

/* ── 24. allowance / 25. salary / 26. claim / 27. weekly / 28. remittance ─ */

async function allowance(ctx) {
  const user = await me(ctx);
  const amount = Math.floor((user.money || 0) * 0.02);
  if (amount < 1) return ctx.send("💸 Not enough in your wallet for an allowance.");
  await adjustMoney(ctx.event.senderID, amount, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Allowance +${fmt(amount)}` });
  await ctx.send(`🪙 Pocket money: +${fmt(amount)} coins (2% of your wallet).`);
}

async function salary(ctx) {
  const user = await me(ctx);
  const level = user.level || 1;
  const pay = 150 * level;
  await adjustMoney(ctx.event.senderID, pay, ctx.profile.name);
  await ctx.send(`💼 Salary at level ${level}: +${fmt(pay)} coins.`);
}

async function claim(ctx) {
  const user = await me(ctx);
  const interest = Math.floor((user.bank || 0) * 0.01);
  if (interest < 1) return ctx.send("🏦 No interest to claim — deposit coins first.");
  await withdrawBank(ctx.event.senderID, interest, ctx.profile.name);
  logTx(ctx.event.senderID, { what: `Claimed interest ${fmt(interest)}` });
  await ctx.send(`🏦 Claimed ${fmt(interest)} coins of bank interest.`);
}

async function weekly(ctx) {
  const user = await me(ctx);
  const reward = 1000 + (user.level || 1) * 50;
  await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, 100, ctx.profile.name);
  await ctx.send([
    `🎉 Weekly bonus claimed!`,
    `💰 +${fmt(reward)} coins`,
    `⭐ +100 XP`,
  ].join("\n"));
}

async function remit(ctx) {
  const target = mentionedId(ctx);
  const amount = parseAmount(ctx.args.find((a) => /\d/.test(a))) || 500;
  if (!target) return ctx.send(`Usage: **${ctx.prefix}remit @user [amount]**`);
  if (target === String(ctx.event.senderID)) return ctx.send("🙃 Remit to someone else!");
  const user = await me(ctx);
  if (amount > (user.bank || 0)) return ctx.send(`🛡️ You only have ${fmt(user.bank)} in the bank.`);
  const them = await getUser(target, "Facebook user");
  await withdrawBank(ctx.event.senderID, amount, ctx.profile.name);
  await adjustMoney(target, amount, them.name);
  logTx(ctx.event.senderID, { what: `Remitted ${fmt(amount)} to ${them.name}` });
  await ctx.send(`🌍 Remitted ${fmt(amount)} coins to ${them.name || "them"}.`);
}

/* ── 29. auction house extras: 30. dailyquest / 31. financehelp ─────────── */

async function dailyQuest(ctx) {
  const user = await me(ctx);
  const roll = Math.random() < 0.5;
  const reward = roll ? randInt(100, 400) : 0;
  if (reward) await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await addXp(ctx.event.senderID, 20, ctx.profile.name);
  await ctx.send([
    `📋 Daily finance quest`,
    roll ? `✅ Completed! +${fmt(reward)} coins` : "❌ Not today — try again tomorrow.",
    `⭐ +20 XP`,
  ].join("\n"));
}

async function financeHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `💰 **Finance Vault** — 40 commands.`,
    `◦ ${p}balance / ${p}bank / ${p}networth — check money`,
    `◦ ${p}deposit [amt] / ${p}withdraw [amt] — move coins`,
    `◦ ${p}claim — collect bank interest`,
    `◦ ${p}loan / ${p}repay — borrow`,
    `◦ ${p}invest / ${p}portfolio / ${p}price — grow wealth`,
    `◦ ${p}buyshares [sym] / ${p}selshares [sym] — trade`,
    `◦ ${p}tax / ${p}paybill / ${p}refund — costs`,
    `◦ Lists: banklist, loanlist, loanshop, taxlist, investlist`,
  ].join("\n"));
}

/* ── 30. crypto / 31. stocks / 32. market / 33. price list / 34. dividend ─ */

const cryptoCoins = ["iKONX", "PIXEL", "NEXUS", "DIVINE", "MOON", "SERAPH", "FCA", "DRAGON"];
const STOCK_NAMES = ["iKON Corp", "NOVA Tech", "META Social", "MOON Energy", "BYTE Systems", "GOLD Mining", "VOLT Motors", "AERO Space"];

const cryptoList = listCommand("cryptolist", cryptoCoins, { emoji: "🪙", title: "Crypto Coins", description: "All crypto coins" });
const stockList = listCommand("stocklist", STOCK_NAMES, { emoji: "📊", title: "Stocks", description: "All stocks" });
void cryptoList; void stockList;

/**
 * Finance Vault owns the *ledger*: balances, bank, loans, taxes, investments,
 * share trading, auctions and transfers.
 *
 * The estate/crypto *property* layer (businesses, properties, coin and stock
 * ownership, estate upgrades) belongs to `10_businessCryptoEstate`. The two
 * plugins therefore deliberately do not register the same names — the loader's
 * command map is flat, so a duplicate would silently shadow one handler.
 */
async function crypto(ctx) {
  const lines = cryptoCoins.map((c) => `  ${c}: ${priceOf(c)} coins`);
  await ctx.send(["🪙 Crypto prices", ...lines, "💡 Trade crypto in ⑩ Business."].join("\n"));
}

async function stocks(ctx) {
  const lines = STOCK_NAMES.map((s) => `  ${s}: ${priceOf(s)} coins`);
  await ctx.send(["📊 Stock prices", ...lines, "💡 Estates and upgrades in ⑩ Business."].join("\n"));
}

async function transfer(ctx) {
  const target = mentionedId(ctx);
  const amount = parseAmount(ctx.args.find((a) => /\d/.test(a))) || 100;
  if (!target) return ctx.send(`Usage: **${ctx.prefix}${ctx.name} @user [amount]**`);
  if (target === String(ctx.event.senderID)) return ctx.send("🙃 You can't pay yourself.");
  const user = await me(ctx);
  if (amount > (user.money || 0)) return ctx.send(`💸 You only have ${fmt(user.money)} coins.`);
  const them = await getUser(target, "Facebook user");
  await adjustMoney(ctx.event.senderID, -amount, ctx.profile.name);
  await adjustMoney(target, amount, them.name);
  logTx(ctx.event.senderID, { what: `Sent ${fmt(amount)} to ${them.name}` });
  await ctx.send(`💸 Sent ${fmt(amount)} coins to ${them.name || "them"}.`);
}

async function marketCmd(ctx) {
  await ctx.send([
    "🌍 Market status",
    `📊 ${SYMBOLS.length} shares + ${cryptoCoins.length} coins tracked`,
    `💡 Prices drift every time you check.`,
    `◦ ${ctx.prefix}price [symbol] — one price`,
    `◦ ${ctx.prefix}portfolio — your holdings`,
  ].join("\n"));
}

async function dividend(ctx) {
  const user = await me(ctx);
  const portfolio = user.portfolio || {};
  const shares = Object.values(portfolio).reduce((a, b) => a + b, 0);
  if (!shares) return ctx.send("📉 Hold shares to earn dividends.");
  const payout = Math.floor(shares * randInt(2, 10));
  await adjustMoney(ctx.event.senderID, payout, ctx.profile.name);
  await ctx.send(`💵 Dividend from ${shares} share(s): +${fmt(payout)} coins.`);
}

async function vaultsCmd(ctx) {
  const user = await me(ctx);
  const net = (user.money || 0) + (user.bank || 0);
  const tierIdx = Math.min(14, Math.floor(net / 50000));
  const tiers = ["bronze", "copper", "iron", "steel", "silver", "gold", "platinum", "titanium", "onyx", "emerald", "sapphire", "ruby", "obsidian", "voidglass", "divine"];
  const protection = Math.min(90, tierIdx * 6);
  await ctx.send([
    `🏛️ Your vault: **${tiers[tierIdx]}**`,
    `💰 Net worth: ${fmt(net)} coins`,
    `🛡️ Theft protection: ${bar(protection, 90)} ${protection}%`,
    `📈 Next tier at ${fmt((tierIdx + 1) * 50000)} coins`,
  ].join("\n"));
}

async function bank(ctx) {
  const user = await me(ctx);
  const tier = user.bank >= 1000000 ? "Divine" : user.bank >= 100000 ? "Platinum"
    : user.bank >= 10000 ? "Gold" : user.bank >= 1000 ? "Silver" : "Bronze";
  await ctx.send([
    "🏦 Bank",
    `💳 Balance: ${fmt(user.bank || 0)} coins`,
    `🏅 Tier: ${tier}`,
    `📈 Daily interest: ${fmt(Math.floor((user.bank || 0) * 0.01))} coins`,
    `🛡️ Protection: ${ctx.thread.bankProtection === false ? "OFF" : "ON"}`,
    "",
    `Deposit: ${ctx.prefix}deposit [amount]   Withdraw: ${ctx.prefix}withdraw [amount]`,
  ].join("\n"));
}

async function networth(ctx) {
  const user = await me(ctx);
  const net = (user.money || 0) + (user.bank || 0);
  await ctx.send(`💎 Net worth: ${fmt(net)} coins`);
}

async function creditCard(ctx) {
  const user = await me(ctx);
  const limit = (user.level || 1) * 500;
  await ctx.send([
    "💳 Credit card",
    `💳 Limit: ${fmt(limit)} coins`,
    `💳 Used: ${fmt((user.credit || 0))}`,
    `📈 Interest: 5%/month`,
    `💡 Spend on credit with **${ctx.prefix}buyshop**.`,
  ].join("\n"));
}

async function autocollect(ctx) {
  const user = await me(ctx);
  const hours = Math.floor((Date.now() - (user.lastAutoCollect || Date.now())) / 3600000);
  const owed = Math.floor((user.income || 0) * hours);
  if (owed < 1) return ctx.send("💰 Nothing to auto-collect yet.");
  await adjustMoney(ctx.event.senderID, owed, ctx.profile.name);
  await ctx.send(`💰 Auto-collected ${fmt(owed)} coins from passive income.`);
}

async function autopay(ctx) {
  const user = await me(ctx);
  const bill = Math.floor((user.money || 0) * 0.05);
  if (bill < 1) return ctx.send("🧾 Nothing to auto-pay this cycle.");
  await adjustMoney(ctx.event.senderID, -bill, ctx.profile.name);
  await ctx.send(`🧾 Auto-paid ${fmt(bill)} coins for recurring bills.`);
}

async function bankProtectionCmd(ctx) {
  if (!ctx.isAdmin) return ctx.send("🛑 Only admins can change bank protection.");
  const { setThreadFlag } = require("../../utils/group");
  const on = !(ctx.thread.bankProtection !== false);
  await setThreadFlag(ctx.thread.threadId, "bankProtection", on);
  await ctx.send(`🛡️ Bank protection ${on ? "ENABLED" : "DISABLED"} for this group.`);
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    bankList,
    loanList,
    loanShop,
    taxList,
    investList,
    ...commands([
      ["rich", rich, { description: "Your net worth" }],
      ["interest", interest, { description: "Bank interest" }],
      ["vault", vaultsCmd, { description: "Vault tier and protection" }],
      ["loan", loan, { description: "Take a loan" }],
      ["repay", repay, { description: "Repay a loan" }],
      ["buyshop", buyShop, { description: "Buy a financial item" }],
      ["tax", tax, { description: "Pay your taxes" }],
      ["invest", invest, { description: "Make an investment" }],
      ["buyshares", buyshares, { description: "Buy shares" }],
      ["selshares", selshares, { description: "Sell shares" }],
      ["price", price, { description: "Check a price" }],
      ["transactions", transactions, { aliases: ["tx"], description: "Recent transactions" }],
      ["auction", auction, { description: "Browse auctions" }],
      ["bid", bid, { description: "Place a bid" }],
      ["refund", refund, { description: "Claim a refund" }],
      ["paybill", paybill, { description: "Pay a bill" }],
      ["splitbill", splitbill, { description: "Split a bill" }],
      ["tip", tip, { description: "Tip a user" }],
      ["allowance", allowance, { description: "Take pocket money" }],
      ["salary", salary, { description: "Collect salary" }],
      ["claim", claim, { description: "Claim bank interest" }],
      ["weekly", weekly, { description: "Weekly bonus" }],
      ["remit", remit, { description: "Send money" }],
      ["dailyquest", dailyQuest, { aliases: ["financequest"], description: "Daily finance quest" }],
      ["richlist", richList, { description: "Richest players" }],
      ["bankprotection", bankProtectionCmd, { adminOnly: true, description: "Toggle bank protection" }],
      ["financehelp", financeHelp, { aliases: ["finhelp"], description: "Finance help" }],
      ["transfer", transfer, { aliases: ["send"], description: "Send coins to a user" }],
      ["donate", transfer, { description: "Donate to a user" }],
      ["vaulttiers", vaultsCmd, { description: "Vault tiers" }],
      ["bank", bank, { aliases: ["bankinfo"], description: "Bank info" }],
      ["networth", networth, { aliases: ["worth"], description: "Net worth" }],
      ["creditcard", creditCard, { description: "Credit card" }],
      ["autocollect", autocollect, { description: "Auto-collect income" }],
      ["autopay", autopay, { description: "Auto-pay bills" }],
    ]),
  ],
};