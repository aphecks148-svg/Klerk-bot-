// commands/cmds_6.js
// 🏢 BUSINESS EMPIRE & PROPERTIES — iKON-BOT
module.exports = ({ api, event, user, reply, users, profile, fun }) => {
  const r = t => api.sendMessage(t, event.threadID, () => {}, event.messageID);
  const fmt = n => Number(n || 0).toLocaleString();
  const find = uid => users.get(String(uid || ""));
  const name = u => u?.name || u?.firstName || u?.uid || "Unknown";

  const businesses = {
    cafe: { name: "☕ Café", price: 5000, income: 500, desc: "Cozy coffee shop" },
    farm: { name: "🌾 Farm", price: 8000, income: 800, desc: "Fresh produce farm" },
    studio: { name: "🎥 Studio", price: 12000, income: 1200, desc: "Content creation studio" },
    arcade: { name: "🎮 Arcade", price: 20000, income: 2000, desc: "Retro gaming arcade" },
    mine: { name: "⛏️ Mine", price: 30000, income: 3000, desc: "Resource extraction mine" },
    agency: { name: "🏢 Agency", price: 50000, income: 5000, desc: "Talent & recruitment agency" },
    logistics: { name: "🚚 Logistics", price: 80000, income: 8000, desc: "Shipping & delivery" },
    tech: { name: "💻 Tech Lab", price: 150000, income: 15000, desc: "Cutting-edge R&D lab" },
  };

  const cmds = [
    { name: "biz", aliases: ["business"], description: "View your businesses", run: async () => {
      ensure(user);
      let owns = Object.keys(businesses).filter(k => user.biz && user.biz[k]);
      r(`🏢 BUSINESS EMPIRE\n${owns.length ? owns.map(k => `⭐ ${businesses[k].name} — 💰$${fmt(businesses[k].income)}/hr`).join("\n") : "No businesses yet. Start with !buybiz [name]! 💼"}`);
    } },
    { name: "buybiz", aliases: ["startbiz"], description: "Buy a business", run: async ({ args }) => {
      ensure(user);
      let id = String(args[0] || "").toLowerCase();
      let b = businesses[id];
      if (!b) return r(`❌ Business not found. Try: ${Object.keys(businesses).join(", ")}`);
      if ((user.biz_owned || []).includes(id)) return r(`🔄 You already own ${b.name}!`);
      if ((user.wallet || 0) < b.price) return r(`💸 Need $${fmt(b.price - user.wallet)} more for ${b.name}!`);
      user.wallet -= b.price;
      user.biz = user.biz || {};
      user.biz[id] = true;
      user.biz_owned = user.biz_owned || [];
      if (!user.biz_owned.includes(id)) user.biz_owned.push(id);
      user.biz_income = (user.biz_income || 0) + b.income;
      r(`🎉 PURCHASED!\n${b.name} — ${b.desc}\n💰 Income: $${fmt(b.income)}/hr\n✨ Your empire grows!`);
    } },
    { name: "bizlist", aliases: ["businesses"], description: "List all businesses", run: async () => {
      r(`🏢 AVAILABLE BUSINESSES\n${Object.entries(businesses).map(([k, v]) => `• ${v.name} — 💰$${fmt(v.price)} — ${v.desc}`).join("\n")}`);
    } },
    { name: "bizincome", aliases: ["bizearnings"], description: "Check business income", run: async () => {
      ensure(user);
      let total = user.biz_income || 0;
      r(`💰 BUSINESS INCOME\n💵 Hourly: $${fmt(total)}\n⭐ Businesses: ${user.biz_owned?.length || 0}`);
    } },
    { name: "collectbiz", aliases: ["bizcollect"], description: "Collect business earnings", run: async () => {
      ensure(user);
      let earned = (user.pending_income || 0) || Math.floor((user.biz_income || 0) * 0.5);
      user.wallet = (user.wallet || 0) + earned;
      user.pending_income = 0;
      r(`📦 COLLECTED!\n💰 You earned $${fmt(earned)} from your businesses!\n💵 Wallet: $${fmt(user.wallet)}`);
    } },
    { name: "upgrade_biz", aliases: ["bizupgrade", "upgradebiz"], description: "Upgrade a business", run: async ({ args }) => {
      ensure(user);
      let id = String(args[0] || "").toLowerCase();
      let b = businesses[id];
      if (!b) return r(`❌ Business not found. Try: ${Object.keys(businesses).join(", ")}`);
      if (!user.biz || !user.biz[id]) return r(`❌ You don't own ${b.name}. Buy it with !buybiz ${id}!`);
      let cost = Math.floor(b.price * 0.5);
      if (user.wallet < cost) return r(`💸 Upgrade costs $${fmt(cost)}. You need more cash!`);
      user.wallet -= cost;
      user.biz_income += Math.floor(b.income * 0.3);
      r(`🚀 UPGRADED!\n${b.name} → Tier 2\n💰 Income now: $${fmt(user.biz_income)}/hr`);
    } },
    { name: "bizvalue", aliases: ["biznet"], description: "Calculate total business value", run: async () => {
      ensure(user);
      let owns = Object.keys(businesses).filter(k => user.biz && user.biz[k]);
      let total = owns.reduce((s, k) => s + businesses[k].price, 0);
      r(`💎 BUSINESS NET WORTH\n💰 Total Value: $${fmt(total)}\n🏢 Businesses: ${owns.length}`);
    } },
    { name: "realestate", aliases: ["estate"], description: "View your properties", run: async () => {
      ensure(user);
      let owns = user.properties || {};
      r(`🏠 REAL ESTATE PORTFOLIO\n${Object.keys(owns).length ? Object.entries(owns).map(([k, v]) => `• ${k} — 💰$${fmt(v)}`).join("\n") : "No properties yet. Try !buy_house! 🏡"}`);
    } },
    { name: "buyhouse", aliases: ["buy_house"], description: "Buy a house", run: async ({ args }) => {
      ensure(user);
      const houses = { cottage: 15000, villa: 80000, mansion: 250000, penthouse: 1000000 };
      let id = String(args[0] || "").toLowerCase();
      let price = houses[id];
      if (!price) return r(`❌ House not found. Try: ${Object.keys(houses).join(", ")}`);
      if (user.wallet < price) return r(`💸 Need $${fmt(price - user.wallet)} more for a ${id}!`);
      user.wallet -= price;
      user.properties = user.properties || {};
      user.properties[id] = price;
      r(`🏠 PURCHASED!\n${id} — $${fmt(price)}\n✨ Welcome home!`);
    } },
    { name: "sellhouse", aliases: ["sell_house"], description: "Sell a property", run: async ({ args }) => {
      ensure(user);
      let id = String(args[0] || "").toLowerCase();
      let props = user.properties || {};
      if (!props[id]) return r(`❌ You don't own a ${id}.`);
      let refund = Math.floor(props[id] * 0.8);
      delete props[id];
      user.wallet += refund;
      r(`💰 SOLD!\n${id} — 💸$${fmt(refund)} (80% value)\n💵 Wallet: $${fmt(user.wallet)}`);
    } },
    { name: "property", aliases: ["property_info"], description: "View property details", run: async ({ args }) => {
      ensure(user);
      let id = String(args[0] || "").toLowerCase();
      let props = user.properties || {};
      if (!props[id]) return r(`❌ You don't own a ${id}.`);
      r(`🏠 PROPERTY: ${id}\n💰 Value: $${fmt(props[id])}\n✨ A fine piece of real estate!`);
    } },
    { name: "net worth", aliases: ["networth"], description: "Calculate total net worth", run: async () => {
      ensure(user);
      let biz = (user.wallet || 0) + (user.bank || 0);
      let owns = Object.keys(businesses).filter(k => user.biz && user.biz[k]);
      let bizVal = owns.reduce((s, k) => s + businesses[k].price, 0);
      let propVal = Object.values(user.properties || {}).reduce((s, v) => s + v, 0);
      let total = biz + bizVal + propVal;
      r(`💎 NET WORTH\n💰 Wallet: $${fmt(user.wallet)}\n🏦 Bank: $${fmt(user.bank || 0)}\n🏢 Business: $${fmt(bizVal)}\n🏠 Property: $${fmt(propVal)}\n✨ TOTAL: $${fmt(total)}`);
    } },
    { name: "market", aliases: ["marketplace"], description: "View marketplace", run: async () => {
      r(`🛒 BUSINESS MARKETPLACE\n${Object.entries(businesses).map(([k, v]) => `• ${v.name} — 💰$${fmt(v.price)} — ${v.desc}`).join("\n")}\n\n🏠 Houses: cottage, villa, mansion, penthouse\n💡 Tip: Buy businesses to generate passive income!`);
    } },
    { name: "bizhelp", aliases: ["businesshelp"], description: "Business command help", run: async () => {
      r(`🏢 BUSINESS EMPIRE\n!biz • !buybiz <name> • !bizlist • !bizincome • !collectbiz • !upgrade_biz <name>\n!realestate • !buyhouse <name> • !sellhouse <name> • !property <name>\n!networth • !market • !bizhelp`);
    } },
  ];

  function ensure(u) {
    u.wallet = u.wallet || 1000;
    u.bank = u.bank || 0;
    u.inventory = u.inventory || {};
    u.biz = u.biz || {};
    u.biz_owned = u.biz_owned || [];
    u.biz_income = u.biz_income || 0;
    u.properties = u.properties || {};
  }

  return cmds;
};
