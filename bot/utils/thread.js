const { models, isReady } = require("../core/mongo");
const memory = new Map();

async function getThread(threadId) {
  if (isReady()) {
    return models.Thread.findOneAndUpdate(
      { threadId },
      { $setOnInsert: { threadId, admins: [] } },
      { upsert: true, new: true }
    );
  }
  if (!memory.has(threadId)) memory.set(threadId, { threadId, admins: [], prefix: "!" });
  return memory.get(threadId);
}

async function setPrefix(threadId, prefix) {
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId }, { $set: { prefix } }, { new: true });
  const thread = memory.get(threadId) || { threadId };
  thread.prefix = prefix;
  memory.set(threadId, thread);
  return thread;
}

async function addAdmin(threadId, userId) {
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId }, { $addToSet: { admins: userId } }, { new: true });
  const thread = memory.get(threadId) || { threadId, admins: [] };
  if (!thread.admins) thread.admins = [];
  if (!thread.admins.includes(userId)) thread.admins.push(userId);
  memory.set(threadId, thread);
  return thread;
}

async function removeAdmin(threadId, userId) {
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId }, { $pull: { admins: userId } }, { new: true });
  const thread = memory.get(threadId) || { threadId, admins: [] };
  if (thread.admins) thread.admins = thread.admins.filter(id => id !== userId);
  memory.set(threadId, thread);
  return thread;
}

async function muteUser(threadId, userId) {
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId }, { $addToSet: { mutedUsers: userId } }, { new: true });
  const thread = memory.get(threadId) || { threadId, mutedUsers: [] };
  if (!thread.mutedUsers) thread.mutedUsers = [];
  if (!thread.mutedUsers.includes(userId)) thread.mutedUsers.push(userId);
  memory.set(threadId, thread);
  return thread;
}

async function unmuteUser(threadId, userId) {
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId }, { $pull: { mutedUsers: userId } }, { new: true });
  const thread = memory.get(threadId) || { threadId, mutedUsers: [] };
  if (thread.mutedUsers) thread.mutedUsers = thread.mutedUsers.filter(id => id !== userId);
  memory.set(threadId, thread);
  return thread;
}

async function toggleFeature(threadId, feature, enabled) {
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId }, { $set: { [feature]: enabled } }, { new: true });
  const thread = memory.get(threadId) || { threadId };
  thread[feature] = enabled;
  memory.set(threadId, thread);
  return thread;
}

module.exports = { getThread, setPrefix, addAdmin, removeAdmin, muteUser, unmuteUser, toggleFeature };
