/**
 * ⑩ ALL BUSINESS CRYPTO ESTATES — 35 commands.
 *
 * Three interlocking economies: businesses that generate passive income,
 * properties that cost more as you stack upgrades, and crypto/stock markets
 * that drift on every price check.
 */

const { command, commands, listCommand, barListCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { BUSINESSES, PROPERTIES, CRYPTO_COINS, STOCKS, ESTATE_UPGRADES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, bar, pick, randInt, parseAmount } = require("../../utils/format");

/* ── market ────────────────────────────────────────────────────────────── */

const market = new Map();

function priceOf(sym) {
  if (!market.has(sym)) market.set(sym, Math.round(randInt(50, 600) * 100) / 100);
  return market.get(sym);
}
function drift(sym) {
  const next = Math.max(1, priceOf(sym) * (0.92 + Math.random() * 0.16));
  market.set(sym, Math.round(next * 100) / 100);
  return market.get(sym);
}

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

async function saveEmpire(ctx, empire) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { empire } });
}

function empireOf(user) {
  return user.empire || { businesses: {}, properties: {}, crypto: {}, stocks: {}, income: 0 };
}

function matchIn(list, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return list.find((x) => String(x).toLowerCase() === q) || list.find((x) => String(x).toLowerCase().includes(q)) || null;
}

/* ── the five lists ────────────────────────────────────────────────────── */

const businessList = listCommand("businesslist", BUSINESSES, { emoji: "🏢", title: "Businesses", description: "All 16 businesses" });
const propertyList = listCommand("propertylist", PROPERTIES, { emoji: "🏠", title: "Properties", description: "All 16 properties" });
const cryptoList = listCommand("cryptolist", CRYPTO_COINS, { emoji: "🪙", title: "Crypto Coins", description: "All 16 coins" });
const stockList = listCommand("stocklist", STOCKS, { emoji: "📊", title: "Stocks", description: "All 16 stocks" });
const upgradeList = listCommand("upgradelist", ESTATE_UPGRADES, { emoji: "🔨", title: "Estate Upgrades", description: "All 16 upgrades" });

/* ── 6-12. business ─────────────────────────────────────────────────────── */

async function businessHome(ctx) {
  const empire = empireOf(await me(ctx));
  const owned = Object.keys(empire.businesses || {});
  const lines = owned.map((b) => {
    const lvl = empire.businesses[b];
    return `  ${b} — L${lvl.level} (${fmt(lvl.income)}/h)`;
  });
  await ctx.send([
    "🏢 Businesses",
    ...(lines.length ? lines : ["  You own none yet."]),
    `💵 Passive income: ${fmt(empire.income || 0)}/hour`,
    "",
    `◦ ${ctx.prefix}buybusiness [name] — start one`,
    `◦ ${ctx.prefix}takecash — collect income`,
  ].join("\n"));
}

async function buyBusiness(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const name = matchIn(BUSINESSES, ctx.args.join(" ")) || pick(BUSINESSES);
  const tier = BUSINESSES.indexOf(name);
  const cost = (tier + 1) * 2000;
  if ((empire.businesses || {})[name]) return ctx.send(`🏢 You already own ${name}. Use **${ctx.prefix}upgradebusiness**.`);
  if ((user.money || 0) < cost) return ctx.send(`💸 ${name} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  empire.businesses = empire.businesses || {};
  const income = Math.floor(cost * 0.05);
  empire.businesses[name] = { level: 1, income, lastCollect: Date.now() };
  empire.income = (empire.income || 0) + income;
  await saveEmpire(ctx, empire);
  await ctx.send(`🏢 Bought **${name}** for ${fmt(cost)} coins.\n💵 Earns ${fmt(income)}/hour.`);
}

async function businessInfo(ctx) {
  const empire = empireOf(await me(ctx));
  const name = matchIn(BUSINESSES, ctx.args.join(" "));
  if (!name) return ctx.send(`Usage: **${ctx.prefix}businessinfo [name]**\nSee all: **${ctx.prefix}businesslist**`);
  const owned = (empire.businesses || {})[name];
  const tier = BUSINESSES.indexOf(name);
  await ctx.send([
    `🏢 ${name}`,
    owned ? `⭐ Level ${owned.level} — ${fmt(owned.income)}/hour` : `Not owned. Cost: ${fmt((tier + 1) * 2000)} coins.`,
    `📈 Each level doubles income.`,
  ].join("\n"));
}

async function takeCash(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const hours = Math.floor((Date.now() - (empire.lastCollect || Date.now())) / 3600000);
  const owed = Math.floor((empire.income || 0) * hours);
  if (owed < 1) return ctx.send(`💵 Nothing to collect yet. (${empire.income || 0}/h)`);
  await adjustMoney(ctx.event.senderID, owed, ctx.profile.name);
  empire.lastCollect = Date.now();
  await saveEmpire(ctx, empire);
  await ctx.send(`💵 Collected ${fmt(owed)} coins from ${hours}h of income.`);
}

async function upgradeBusiness(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const owned = Object.keys(empire.businesses || {});
  if (!owned.length) return ctx.send("🏢 You own no businesses. **" + ctx.prefix + "buybusiness** first.");
  const name = matchIn(owned, ctx.args.join(" ")) || pick(owned);
  const biz = empire.businesses[name];
  const cost = biz.level * 3000;
  if ((user.money || 0) < cost) return ctx.send(`💸 Upgrading ${name} to L${biz.level + 1} costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  empire.income = (empire.income || 0) - biz.income;
  biz.level += 1;
  biz.income = Math.floor(biz.income * 2);
  empire.income += biz.income;
  await saveEmpire(ctx, empire);
  await ctx.send(`📈 ${name} is now level ${biz.level} — ${fmt(biz.income)}/hour.`);
}

async function businessStats(ctx) {
  const empire = empireOf(await me(ctx));
  const count = Object.keys(empire.businesses || {}).length;
  const props = Object.keys(empire.properties || {}).length;
  await ctx.send([
    "📊 Empire stats",
    `🏢 Businesses: ${count}`,
    `🏠 Properties: ${props}`,
    `💵 Passive income: ${fmt(empire.income || 0)}/hour`,
    `🪙 Crypto holdings: ${Object.keys(empire.crypto || {}).length}`,
    `📊 Stock holdings: ${Object.keys(empire.stocks || {}).length}`,
  ].join("\n"));
}

/* ── 13-18. property ────────────────────────────────────────────────────── */

async function properties(ctx) {
  const empire = empireOf(await me(ctx));
  const owned = Object.keys(empire.properties || {});
  const lines = owned.map((p) => {
    const e = empire.properties[p];
    return `  ${p} — ${e.upgrades.length} upgrade(s), worth ${fmt(e.worth)}`;
  });
  await ctx.send(["🏠 Properties", ...(lines.length ? lines : ["  You own none yet."]),
    `◦ ${ctx.prefix}buyproperty [name] — buy one`].join("\n"));
}

async function buyProperty(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const name = matchIn(PROPERTIES, ctx.args.join(" ")) || pick(PROPERTIES);
  if ((empire.properties || {})[name]) return ctx.send(`🏠 You already own ${name}.`);
  const tier = PROPERTIES.indexOf(name);
  const cost = (tier + 1) * 8000;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${name} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  empire.properties = empire.properties || {};
  empire.properties[name] = { upgrades: [], worth: cost };
  await saveEmpire(ctx, empire);
  await ctx.send(`🏠 Bought **${name}** for ${fmt(cost)} coins.\n🔨 Add upgrades: **${ctx.prefix}upgradeproperty**`);
}

async function propertyInfo(ctx) {
  const name = matchIn(PROPERTIES, ctx.args.join(" "));
  if (!name) return ctx.send(`Usage: **${ctx.prefix}propertyinfo [name]**`);
  const empire = empireOf(await me(ctx));
  const owned = (empire.properties || {})[name];
  const tier = PROPERTIES.indexOf(name);
  await ctx.send([
    `🏠 ${name}`,
    owned ? `🔨 Upgrades: ${owned.upgrades.length ? owned.upgrades.join(", ") : "none"}`
      : `Not owned. Cost: ${fmt((tier + 1) * 8000)} coins.`,
  ].join("\n"));
}

async function upgradeProperty(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const owned = Object.keys(empire.properties || {});
  if (!owned.length) return ctx.send("🏠 You own no properties. **" + ctx.prefix + "buyproperty** first.");
  const pName = matchIn(owned, ctx.args[0]) || pick(owned);
  const prop = empire.properties[pName];
  const upName = matchIn(ESTATE_UPGRADES, ctx.args.slice(1).join(" ")) || pick(ESTATE_UPGRADES);
  if (prop.upgrades.includes(upName)) return ctx.send(`🔨 ${pName} already has ${upName}.`);
  const cost = (prop.upgrades.length + 1) * 4000;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${upName} costs ${fmt(cost)} coins. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  prop.upgrades.push(upName);
  prop.worth += cost;
  await saveEmpire(ctx, empire);
  await ctx.send(`🔨 Added **${upName}** to ${pName}. Worth ${fmt(prop.worth)} coins.`);
}

async function estate(ctx) {
  const empire = empireOf(await me(ctx));
  const props = Object.keys(empire.properties || {});
  if (!props.length) return ctx.send("🏠 Your estate is empty. **" + ctx.prefix + "buyproperty** to start.");
  const total = props.reduce((n, p) => n + empire.properties[p].worth, 0);
  const lines = props.map((p) => `  ${p} — ${fmt(empire.properties[p].worth)} coins`);
  await ctx.send(["🏛️ Your estate", ...lines, `💎 Total value: ${fmt(total)} coins`].join("\n"));
}

async function networthEstate(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const liquid = (user.money || 0) + (user.bank || 0);
  const props = Object.keys(empire.properties || {}).reduce((n, p) => n + empire.properties[p].worth, 0);
  const cryptoValue = Object.keys(empire.crypto || {}).reduce((n, c) => n + empire.crypto[c] * priceOf(c), 0);
  const stockValue = Object.keys(empire.stocks || {}).reduce((n, s) => n + empire.stocks[s] * priceOf(s), 0);
  const total = liquid + props + cryptoValue + stockValue;
  await ctx.send([
    "💎 Estate net worth",
    `💧 Liquid:  ${fmt(liquid)}`,
    `🏠 Property: ${fmt(props)}`,
    `🪙 Crypto:   ${fmt(cryptoValue)}`,
    `📊 Stocks:   ${fmt(stockValue)}`,
    `💰 TOTAL:    ${fmt(total)} coins ${bar(Math.min(total, 1000000), 1000000)}`,
  ].join("\n"));
}

/* ── 19-26. crypto & stocks ────────────────────────────────────────────── */

async function cryptoHome(ctx) {
  const lines = CRYPTO_COINS.map((c) => `  ${c}: ${priceOf(c)} coins`);
  await ctx.send(["🪙 Crypto market", ...lines].join("\n"));
}

async function buyCrypto(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const coin = matchIn(CRYPTO_COINS, ctx.args[1] || ctx.args[0]) || pick(CRYPTO_COINS);
  const price = priceOf(coin);
  const amount = parseAmount(ctx.args[0]) || price;
  const qty = Math.floor(amount / price);
  if (qty < 1) return ctx.send(`🪙 One ${coin} costs ${price} coins.`);
  const cost = qty * price;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${qty} ${coin} costs ${fmt(cost)}. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  empire.crypto = empire.crypto || {};
  empire.crypto[coin] = (empire.crypto[coin] || 0) + qty;
  await saveEmpire(ctx, empire);
  drift(coin);
  await ctx.send(`🪙 Bought ${qty} ${coin} at ${price} each (${fmt(cost)} coins).`);
}

async function sellCrypto(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const coin = matchIn(CRYPTO_COINS, ctx.args[0]);
  if (!coin) return ctx.send(`Usage: **${ctx.prefix}sellcrypto [coin] [amount]**`);
  const held = (empire.crypto || {})[coin] || 0;
  if (!held) return ctx.send(`🪙 You hold no ${coin}.`);
  const qty = Math.min(held, parseAmount(ctx.args[1]) || held);
  const value = Math.floor(qty * priceOf(coin));
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  empire.crypto[coin] = held - qty;
  if (empire.crypto[coin] <= 0) delete empire.crypto[coin];
  await saveEmpire(ctx, empire);
  drift(coin);
  await ctx.send(`🪙 Sold ${qty} ${coin} for ${fmt(value)} coins.`);
}

async function cryptoPrice(ctx) {
  const coin = matchIn(CRYPTO_COINS, ctx.args[0]);
  if (!coin) return ctx.send(`Usage: **${ctx.prefix}cryptoprice [coin]**\nAll coins: **${ctx.prefix}cryptolist**`);
  await ctx.send(`🪙 ${coin}: **${drift(coin)}** coins`);
}

async function stocksHome(ctx) {
  const lines = STOCKS.map((s) => `  ${s}: ${priceOf(s)} coins`);
  await ctx.send(["📊 Stock market", ...lines].join("\n"));
}

async function buyStock(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const stock = matchIn(STOCKS, ctx.args[1] || ctx.args[0]) || pick(STOCKS);
  const price = priceOf(stock);
  const amount = parseAmount(ctx.args[0]) || price;
  const qty = Math.floor(amount / price);
  if (qty < 1) return ctx.send(`📊 One share of ${stock} costs ${price} coins.`);
  const cost = qty * price;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${qty} shares cost ${fmt(cost)}. You have ${fmt(user.money)}.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  empire.stocks = empire.stocks || {};
  empire.stocks[stock] = (empire.stocks[stock] || 0) + qty;
  await saveEmpire(ctx, empire);
  drift(stock);
  await ctx.send(`📈 Bought ${qty} share(s) of **${stock}** at ${price} (${fmt(cost)} coins).`);
}

async function sellStock(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const stock = matchIn(STOCKS, ctx.args[0]);
  if (!stock) return ctx.send(`Usage: **${ctx.prefix}sellstock [stock] [amount]**`);
  const held = (empire.stocks || {})[stock] || 0;
  if (!held) return ctx.send(`📊 You hold no ${stock}.`);
  const qty = Math.min(held, parseAmount(ctx.args[1]) || held);
  const value = Math.floor(qty * priceOf(stock));
  await adjustMoney(ctx.event.senderID, value, ctx.profile.name);
  empire.stocks[stock] = held - qty;
  if (empire.stocks[stock] <= 0) delete empire.stocks[stock];
  await saveEmpire(ctx, empire);
  drift(stock);
  await ctx.send(`📉 Sold ${qty} share(s) of **${stock}** for ${fmt(value)} coins.`);
}

async function stockPrice(ctx) {
  const stock = matchIn(STOCKS, ctx.args[0]);
  if (!stock) return ctx.send(`Usage: **${ctx.prefix}stockprice [stock]**`);
  await ctx.send(`📊 ${stock}: **${drift(stock)}** coins`);
}

async function dividend(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const shares = Object.values(empire.stocks || {}).reduce((a, b) => a + b, 0);
  if (!shares) return ctx.send("📉 Hold shares to earn dividends.");
  const payout = Math.floor(shares * randInt(3, 12));
  await adjustMoney(ctx.event.senderID, payout, ctx.profile.name);
  await ctx.send(`💵 Dividend from ${shares} share(s): +${fmt(payout)} coins.`);
}

/* ── 27-35. the rest ────────────────────────────────────────────────────── */

async function portfolio(ctx) {
  const empire = empireOf(await me(ctx));
  const cLines = Object.keys(empire.crypto || {}).map((c) => `  🪙 ${c}: ${empire.crypto[c]} @ ${priceOf(c)} = ${fmt(empire.crypto[c] * priceOf(c))}`);
  const sLines = Object.keys(empire.stocks || {}).map((s) => `  📊 ${s}: ${empire.stocks[s]} @ ${priceOf(s)} = ${fmt(empire.stocks[s] * priceOf(s))}`);
  if (!cLines.length && !sLines.length) return ctx.send("📊 No holdings. Buy crypto or shares to start.");
  await ctx.send(["📊 Portfolio", ...cLines, ...sLines].join("\n"));
}

async function marketCmd(ctx) {
  await ctx.send([
    "🌍 Market status",
    `🪙 ${CRYPTO_COINS.length} coins • 📊 ${STOCKS.length} stocks`,
    "Prices drift every time you check them.",
    `◦ ${ctx.prefix}networthestate — your total worth`,
  ].join("\n"));
}

async function estateHelp(ctx) {
  const p = ctx.prefix;
  const chunks = renderList({
    title: `🏢 **Business, Crypto & Estates** — 35 commands.`,
    items: [
      `◦ ${p}business / ${p}buybusiness [name] / ${p}upgradebusiness`,
      `◦ ${p}takecash — collect passive income`,
      `◦ ${p}properties / ${p}buyproperty [name] / ${p}upgradeproperty`,
      `◦ ${p}estate / ${p}networthestate — total worth`,
      `◦ ${p}crypto / ${p}buycrypto [amt] [coin] / ${p}sellcrypto [coin]`,
      `◦ ${p}stocks / ${p}buystock [amt] [name] / ${p}sellstock [name]`,
      `◦ ${p}portfolio / ${p}dividend / ${p}market`,
      `📋 Lists: businesslist, propertylist, cryptolist, stocklist, upgradelist`,
    ],
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function broker(ctx) {
  const user = await me(ctx);
  const tip = pick([
    "Diversify across at least three sectors.",
    "Cash reserves first, then property, then speculative coins.",
    "Upgrade early — each business level doubles income.",
    "Don't put rent money in crypto.",
    "Passive income beats active grinding once you have three businesses.",
  ]);
  await ctx.send([
    "🧑‍💼 Your broker",
    `💼 You hold ${fmt((user.money || 0) + (user.bank || 0))} coins in liquid funds.`,
    `💡 ${tip}`,
  ].join("\n"));
}

async function offerMarket(ctx) {
  const offer = pick(CRYPTO_COINS);
  const from = pick(STOCKS);
  const want = randInt(100, 900);
  await ctx.send([
    "🤝 Market offers",
    `🪙 ${offer} for ${fmt(want)} coins`,
    `📊 1 share of ${from} for ${fmt(want * 2)} coins`,
    "No live counter-offers yet — build your portfolio first.",
  ].join("\n"));
}

async function buyOffer(ctx) {
  const user = await me(ctx);
  const cost = randInt(200, 1200);
  if ((user.money || 0) < cost) return ctx.send(`💸 That offer costs ${fmt(cost)} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const gift = pick(ESTATE_UPGRADES);
  await ctx.send(`🤝 Deal accepted for ${fmt(cost)} coins. You received **${gift}** as a bonus.`);
}

async function collectRent(ctx) {
  const user = await me(ctx);
  const empire = empireOf(user);
  const count = Object.keys(empire.properties || {}).length;
  if (!count) return ctx.send("🏠 You own no properties to rent out.");
  const rent = count * randInt(300, 900);
  await adjustMoney(ctx.event.senderID, rent, ctx.profile.name);
  await ctx.send(`💵 Rent from ${count} propert${count === 1 ? "y" : "ies"}: +${fmt(rent)} coins.`);
}

async function holdings(ctx) {
  const empire = empireOf(await me(ctx));
  const all = {
    businesses: Object.keys(empire.businesses || {}).length,
    properties: Object.keys(empire.properties || {}).length,
    crypto: Object.keys(empire.crypto || {}).length,
    stocks: Object.keys(empire.stocks || {}).length,
  };
  const lines = Object.entries(all).map(([k, v]) => `  ${k}: ${v}`);
  await ctx.send(["🎒 Holdings", ...lines].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    businessList,
    propertyList,
    cryptoList,
    stockList,
    upgradeList,
    ...commands([
      ["business", businessHome, { description: "Your businesses" }],
      ["buybusiness", buyBusiness, { description: "Buy a business" }],
      ["businessinfo", businessInfo, { description: "Business info" }],
      ["takecash", takeCash, { description: "Collect passive income" }],
      ["upgradebusiness", upgradeBusiness, { description: "Upgrade a business" }],
      ["businessstats", businessStats, { description: "Empire stats" }],
      ["properties", properties, { description: "Your properties" }],
      ["buyproperty", buyProperty, { description: "Buy a property" }],
      ["propertyinfo", propertyInfo, { description: "Property info" }],
      ["upgradeproperty", upgradeProperty, { description: "Upgrade a property" }],
      ["estate", estate, { description: "Your estate" }],
      ["networthestate", networthEstate, { aliases: ["empire"], description: "Total net worth" }],
      ["crypto", cryptoHome, { description: "Crypto market" }],
      ["buycrypto", buyCrypto, { description: "Buy crypto" }],
      ["sellcrypto", sellCrypto, { description: "Sell crypto" }],
      ["cryptoprice", cryptoPrice, { description: "Crypto price" }],
      ["stocks", stocksHome, { description: "Stock market" }],
      ["buystock", buyStock, { description: "Buy shares" }],
      ["sellstock", sellStock, { description: "Sell shares" }],
      ["stockprice", stockPrice, { description: "Stock price" }],
      ["dividend", dividend, { description: "Collect dividends" }],
      ["portfolio", portfolio, { description: "Your portfolio" }],
      ["market", marketCmd, { description: "Market status" }],
      ["broker", broker, { description: "Broker advice" }],
      ["offermarket", offerMarket, { description: "Browse offers" }],
      ["buyoffer", buyOffer, { description: "Accept an offer" }],
      ["collectrent", collectRent, { aliases: ["rentincome"], description: "Collect rent" }],
      ["holdings", holdings, { description: "All your holdings" }],
      ["estateinfo", estate, { description: "Estate summary" }],
      ["estatehelp", estateHelp, { description: "Estate help" }],
    ]),
  ],
};
