/**
 * Group administration state.
 *
 * Thread documents in Mongo already carry most of these fields; this module adds
 * the rest (pending group-chat requests, warning counters, the unsend log) and
 * provides the single place that decides *who may run what*.
 */

const { models, isReady } = require("../core/mongo");
const { getProfileInfo } = require("./fbProfile");
const memory = new Map();

/* ── Admin identity ─────────────────────────────────────────────────────── */

const adminIds = () =>
  new Set(
    String(process.env.ADMIN_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

/** True when the sender is a global bot owner (ADMIN_IDS env). */
function isGlobalAdmin(id) {
  return adminIds().has(String(id));
}

/** True when the sender is an owner of this specific group. */
function isThreadAdmin(ctx) {
  if (!ctx) return false;
  if (isGlobalAdmin(ctx.event.senderID)) return true;
  const thread = ctx.thread;
  return Boolean(thread && Array.isArray(thread.admins) && thread.admins.includes(String(ctx.event.senderID)));
}

/** True when the sender owns the group *and* is not the bot account itself. */
function isGroupOwner(ctx) {
  const event = ctx && ctx.event;
  if (!event) return false;
  if (isGlobalAdmin(event.senderID)) return true;
  if (event.isAdmin !== undefined) return Boolean(event.isAdmin);
  return isThreadAdmin(ctx);
}

/* ── Thread accessors ───────────────────────────────────────────────────── */

async function getThreadConfig(threadId) {
  const id = String(threadId || "");
  if (isReady()) {
    const thread = await models.Thread.findOneAndUpdate(
      { threadId: id },
      { $setOnInsert: { threadId: id, admins: [] } },
      { upsert: true, new: true }
    );
    return thread;
  }
  if (!memory.has(id)) {
    memory.set(id, {
      threadId: id,
      admins: [],
      prefix: "!",
      autoAdd: false,
      onlyAdminCmds: [],
      mutedUsers: [],
      enableRob: true,
      bankProtection: true,
      removeInactiveAfterDays: 0,
    });
  }
  return memory.get(id);
}

async function setThreadFlag(threadId, field, value) {
  const id = String(threadId || "");
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId: id }, { $set: { [field]: value } }, { new: true });
  const thread = await getThreadConfig(id);
  thread[field] = value;
  return thread;
}

async function setPrefix(threadId, prefix) {
  return setThreadFlag(threadId, "prefix", String(prefix || "!").slice(0, 3));
}

async function addAdmin(threadId, userId) {
  const id = String(threadId || "");
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId: id }, { $addToSet: { admins: String(userId) } }, { new: true });
  const thread = await getThreadConfig(id);
  thread.admins = thread.admins || [];
  if (!thread.admins.includes(String(userId))) thread.admins.push(String(userId));
  return thread;
}

async function removeAdmin(threadId, userId) {
  const id = String(threadId || "");
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId: id }, { $pull: { admins: String(userId) } }, { new: true });
  const thread = await getThreadConfig(id);
  thread.admins = (thread.admins || []).filter((x) => x !== String(userId));
  return thread;
}

async function muteUser(threadId, userId) {
  const id = String(threadId || "");
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId: id }, { $addToSet: { mutedUsers: String(userId) } }, { new: true });
  const thread = await getThreadConfig(id);
  thread.mutedUsers = thread.mutedUsers || [];
  if (!thread.mutedUsers.includes(String(userId))) thread.mutedUsers.push(String(userId));
  return thread;
}

async function unmuteUser(threadId, userId) {
  const id = String(threadId || "");
  if (isReady()) return models.Thread.findOneAndUpdate({ threadId: id }, { $pull: { mutedUsers: String(userId) } }, { new: true });
  const thread = await getThreadConfig(id);
  thread.mutedUsers = (thread.mutedUsers || []).filter((x) => x !== String(userId));
  return thread;
}

async function isMuted(threadId, userId) {
  const thread = await getThreadConfig(threadId);
  return Array.isArray(thread.mutedUsers) && thread.mutedUsers.includes(String(userId));
}

/* ── onlyadminon ───────────────────────────────────────────────────────── */

/**
 * Turn on "only admins may run commands" for this group.
 * Locked commands default to the admin/moderation set; a group can pass its own.
 */
async function setOnlyAdmin(threadId, enabled, commands = null) {
  const id = String(threadId || "");
  const defaults = [
    "ban", "unban", "mute", "unmute", "addadmin", "removeadmin",
    "setprefix", "autoadd", "onlyadminon", "onlyadminoff",
    "clear", "purge", "lockdown", "reset", "plugin_reload",
    "plugin_enable", "plugin_disable", "setwelcome", "setleave",
    "setlang", "removeinactive", "tagall", "kick", "warn",
  ];
  const list = Array.isArray(commands) && commands.length ? commands.map(String) : defaults;
  const thread = await setThreadFlag(id, "onlyAdminCmds", enabled ? list : []);
  void thread;
  return list;
}

/** Are only-admin restrictions currently on? */
async function isOnlyAdminOn(threadId) {
  const thread = await getThreadConfig(threadId);
  return Array.isArray(thread.onlyAdminCmds) && thread.onlyAdminCmds.length > 0;
}

/* ── Auto-add ──────────────────────────────────────────────────────────── */

/**
 * Attempt to add a user to the group chat.
 *
 * ws3-fca exposes this as `addUserToGroup`, and it only succeeds when the
 * bot account has been approved as a group admin by Facebook. Every failure
 * mode resolves to `{ ok: false, reason }` rather than throwing, because a
 * failed auto-add must never break the welcome message.
 */
async function addUserToGroup(api, threadId, userId) {
  if (!api || typeof api.addUserToGroup !== "function") {
    return { ok: false, reason: "addUserToGroup is not supported by this login" };
  }
  if (!threadId || !userId) return { ok: false, reason: "missing thread or user id" };
  return new Promise((resolve) => {
    let settled = false;
    const done = (result) => { if (!settled) { settled = true; resolve(result); } };
    const timer = setTimeout(() => done({ ok: false, reason: "timed out" }), 15000);
    try {
      api.addUserToGroup(String(userId), String(threadId), (error) => {
        clearTimeout(timer);
        if (error) return done({ ok: false, reason: error.message || String(error) });
        done({ ok: true });
      });
    } catch (error) {
      clearTimeout(timer);
      done({ ok: false, reason: error.message || String(error) });
    }
  });
}

/* ── Welcome / leave ───────────────────────────────────────────────────── */

const DEFAULT_WELCOME = "Welcome {name}! Type {prefix}menu to see everything I can do. 🌟";
const DEFAULT_LEAVE = "{name} has left the group. We're now {count} members. 👋";

function fillTemplate(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : `{${key}}`));
}

/** Send the join message, with the joiner's profile picture when we can get it. */
async function sendWelcome(api, event, thread = {}) {
  const id = String(event.senderID);
  const info = await getProfileInfo(api, id, "Someone new");
  const text = fillTemplate(thread.welcomeMsg || DEFAULT_WELCOME, {
    name: info.name,
    prefix: thread.prefix || process.env.PREFIX || "!",
    user: info.name,
  });

  const picture = await require("./fbProfile").getProfilePictureBuffer(api, id, 512);
  if (picture) return sendWithPicture(api, event, text, picture);
  return sendText(api, event, text);
}

async function sendLeave(api, event, thread = {}) {
  const id = String(event.senderID);
  const info = await getProfileInfo(api, id, "A member");
  const text = fillTemplate(thread.leaveMsg || DEFAULT_LEAVE, {
    name: info.name,
    count: event.memberCount != null ? event.memberCount : "?",
    user: info.name,
  });
  const picture = await require("./fbProfile").getProfilePictureBuffer(api, id, 512);
  if (picture) return sendWithPicture(api, event, text, picture);
  return sendText(api, event, text);
}

function sendText(api, event, text) {
  if (!api || !event.threadID) return null;
  if (typeof api.sendMessageMqtt === "function") return api.sendMessageMqtt(text, event.threadID);
  if (typeof api.sendMessage === "function") return api.sendMessage(text, event.threadID, () => {});
  return null;
}

function sendWithPicture(api, event, text, buffer) {
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  if (!api || !event.threadID || !buffer) return sendText(api, event, text);
  const file = path.join(os.tmpdir(), `ikon-welcome-${Date.now()}-${Math.random().toString(16).slice(2)}.png`);
  try {
    fs.writeFileSync(file, buffer);
  } catch (_) {
    return sendText(api, event, text);
  }
  const cleanup = () => setTimeout(() => fs.rm(file, { force: true }, () => {}), 30000);
  const payload = { body: text, attachment: [fs.createReadStream(file)] };
  if (typeof api.sendMessageMqtt === "function") return api.sendMessageMqtt(payload, event.threadID, undefined, cleanup);
  if (typeof api.sendMessage === "function") return api.sendMessage(payload, event.threadID, cleanup);
  return sendText(api, event, text);
}

/* ── Unsend ────────────────────────────────────────────────────────────── */

const messageLog = new Map();
const LOG_TTL = 1000 * 60 * 60;

/** Remember a bot message so `.unsend` can pull it back. */
function rememberMessage(threadId, messageId) {
  if (!threadId || !messageId) return;
  const key = String(threadId);
  if (!messageLog.has(key)) messageLog.set(key, new Map());
  const bucket = messageLog.get(key);
  bucket.set(String(messageId), Date.now());
  for (const [id, at] of bucket) if (Date.now() - at > LOG_TTL) bucket.delete(id);
}

function findRecentMessages(threadId, withinMs = 20000) {
  const bucket = messageLog.get(String(threadId));
  if (!bucket) return [];
  const now = Date.now();
  return [...bucket.entries()]
    .filter(([, at]) => now - at <= withinMs)
    .map(([id]) => id);
}

function pruneMessageLog() {
  const now = Date.now();
  for (const [key, bucket] of messageLog) {
    for (const [id, at] of bucket) if (now - at > LOG_TTL) bucket.delete(id);
    if (!bucket.size) messageLog.delete(key);
  }
}

/** Try to unsend every recent bot message in a thread. */
async function unsendRecent(api, threadId, withinMs = 20000) {
  const ids = findRecentMessages(threadId, withinMs);
  if (!ids.length) return { unsent: 0, reason: "nothing recent to unsend" };
  let unsent = 0;
  for (const id of ids) {
    try {
      if (typeof api.unsendMessage === "function") {
        await new Promise((resolve) => api.unsendMessage(id, () => resolve()));
        unsent += 1;
      }
    } catch (_) { /* keep going — one failure must not stop the rest */ }
  }
  return { unsent, reason: null };
}

/* ── Remove inactive ───────────────────────────────────────────────────── */

/**
 * Leave groups where the bot has been sitting silent with no configured
 * admins. The bot keeps only the groups that are either (a) explicitly
 * allowlisted via KEEP_GC, or (b) had an admin command in the last N days.
 */
async function removeInactiveGroups({ api, dryRun = false, minIdleDays = 30 } = {}) {
  const allow = new Set(
    String(process.env.KEEP_GC || "")
      .split(",").map((s) => s.trim()).filter(Boolean)
  );
  const cutoff = new Date(Date.now() - minIdleDays * 86400000);
  const result = { scanned: 0, removed: [], kept: [], skipped: [] };

  if (!isReady()) {
    result.reason = "Mongo offline — cannot enumerate groups";
    return result;
  }

  const threads = await models.Thread.find({}).lean();
  for (const thread of threads) {
    const id = thread.threadId;
    if (!id) continue;
    if (allow.has(id)) { result.kept.push({ id, why: "allowlisted" }); continue; }
    const lastActive = thread.updatedAt || thread.createdAt;
    if (lastActive && new Date(lastActive) > cutoff) {
      result.kept.push({ id, why: "active" });
      continue;
    }
    result.scanned += 1;
    if (dryRun) { result.removed.push({ id, why: "inactive", lastActive }); continue; }
    try {
      if (api && typeof api.leaveGroup === "function") {
        await new Promise((resolve, reject) =>
          api.leaveGroup(id, (error) => (error ? reject(error) : resolve()))
        );
        await models.Thread.deleteOne({ threadId: id });
        result.removed.push({ id, why: "left group" });
      } else {
        result.skipped.push({ id, why: "leaveGroup unsupported" });
      }
    } catch (error) {
      result.skipped.push({ id, why: error.message });
    }
  }
  return result;
}

module.exports = {
  // identity
  adminIds,
  isGlobalAdmin,
  isThreadAdmin,
  isGroupOwner,
  // thread state
  getThreadConfig,
  setThreadFlag,
  setPrefix,
  addAdmin,
  removeAdmin,
  muteUser,
  unmuteUser,
  isMuted,
  setOnlyAdmin,
  isOnlyAdminOn,
  // members
  addUserToGroup,
  sendWelcome,
  sendLeave,
  // messages
  rememberMessage,
  findRecentMessages,
  pruneMessageLog,
  unsendRecent,
  // housekeeping
  removeInactiveGroups,
  // templates
  DEFAULT_WELCOME,
  DEFAULT_LEAVE,
  fillTemplate,
};
