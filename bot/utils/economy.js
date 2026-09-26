const { models, isReady } = require("../core/mongo");
const memory = new Map();

function defaultUser(facebookId, name) {
  return { facebookId, name: name || "Facebook user", money: 1000, level: 1, xp: 0, pets: [], pokedex: [], inventory: [] };
}

async function getUser(facebookId, name) {
  if (isReady()) {
    return models.User.findOneAndUpdate({ facebookId }, { $setOnInsert: defaultUser(facebookId, name), $set: { name: name || "Facebook user" } }, { upsert: true, new: true });
  }
  if (!memory.has(facebookId)) memory.set(facebookId, defaultUser(facebookId, name));
  const user = memory.get(facebookId);
  if (name) user.name = name;
  return user;
}

async function adjustMoney(facebookId, amount, name, note = "economy") {
  const user = await getUser(facebookId, name);
  const next = Math.max(0, Number(user.money || 0) + Number(amount || 0));
  if (isReady()) return models.User.findOneAndUpdate({ facebookId }, { $set: { money: next } }, { new: true });
  user.money = next;
  return user;
}

async function addXp(facebookId, amount, name) {
  const user = await getUser(facebookId, name);
  user.xp = Number(user.xp || 0) + Number(amount || 0);
  while (user.xp >= user.level * 100) { user.xp -= user.level * 100; user.level += 1; }
  if (isReady()) return models.User.findOneAndUpdate({ facebookId }, { $set: { xp: user.xp, level: user.level } }, { new: true });
  return user;
}

module.exports = { getUser, adjustMoney, addXp };