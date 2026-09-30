const { models, isReady } = require("../core/mongo");
const crypto = require("crypto");
const memory = new Map();

function defaultUser(facebookId, name) {
  return { facebookId, name: name || "Facebook user", money: 1000, bank: 0, level: 1, xp: 0, pets: [], pokedex: [], inventory: [], crypto: {}, stocks: {} };
}

async function getUser(facebookId, name) {
  if (isReady()) {
    const defaults = defaultUser(facebookId, name);
    delete defaults.name;
    const user = await models.User.findOneAndUpdate(
      { facebookId },
      { $setOnInsert: defaults, $set: { name: name || "Facebook user" } },
      { upsert: true, new: true }
    );
    if (!user.uid) {
      user.uid = crypto.randomBytes(6).toString("hex").toUpperCase();
      await user.save();
    }
    return user;
  }
  if (!memory.has(facebookId)) memory.set(facebookId, defaultUser(facebookId, name));
  const user = memory.get(facebookId);
  if (name) user.name = name;
  if (!user.uid) user.uid = crypto.randomBytes(6).toString("hex").toUpperCase();
  return user;
}

async function adjustMoney(facebookId, amount, name) {
  await getUser(facebookId, name);
  if (isReady()) return models.User.findOneAndUpdate({ facebookId }, { $inc: { money: Number(amount || 0) } }, { new: true });
  const user = memory.get(facebookId);
  user.money = Math.max(0, Number(user.money || 0) + Number(amount || 0));
  return user;
}

async function depositBank(facebookId, amount, name) {
  await getUser(facebookId, name);
  if (isReady()) {
    return models.User.findOneAndUpdate(
      { facebookId },
      { $inc: { money: -Number(amount), bank: Number(amount) } },
      { new: true }
    );
  }
  const user = memory.get(facebookId);
  user.money = Math.max(0, Number(user.money || 0) - Number(amount || 0));
  user.bank = Number(user.bank || 0) + Number(amount || 0);
  return user;
}

async function withdrawBank(facebookId, amount, name) {
  await getUser(facebookId, name);
  if (isReady()) {
    return models.User.findOneAndUpdate(
      { facebookId },
      { $inc: { money: Number(amount), bank: -Number(amount) } },
      { new: true }
    );
  }
  const user = memory.get(facebookId);
  user.bank = Math.max(0, Number(user.bank || 0) - Number(amount || 0));
  user.money = Number(user.money || 0) + Number(amount || 0);
  return user;
}

async function addXp(facebookId, amount, name) {
  const user = await getUser(facebookId, name);
  user.xp = Number(user.xp || 0) + Number(amount || 0);
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100;
    user.level += 1;
  }
  if (isReady()) return models.User.findOneAndUpdate({ facebookId }, { $set: { xp: user.xp, level: user.level } }, { new: true });
  return user;
}

module.exports = { getUser, adjustMoney, depositBank, withdrawBank, addXp };
