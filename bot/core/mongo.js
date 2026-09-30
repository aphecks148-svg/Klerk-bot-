const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  facebookId: { type: String, unique: true, index: true },
  name: String,
  money: { type: Number, default: 1000 },
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  prefix: { type: String, default: "!" },
  pets: [{ name: String, rarity: String, hp: Number, level: { type: Number, default: 1 } }],
  pokedex: [String],
  inventory: [{ item: String, qty: { type: Number, default: 1 } }],
  crypto: new mongoose.Schema({}, { strict: false }),
  stocks: new mongoose.Schema({}, { strict: false }),
  skills: [{ name: String, level: Number, exp: Number }],
  quests: [{ id: String, progress: Number, completed: Boolean }],
  uid: { type: String, unique: true, sparse: true },
  warnings: { type: Number, default: 0 },
  banned: { type: Boolean, default: false },
  jailedUntil: Date,
}, { timestamps: true });

const ThreadSchema = new mongoose.Schema({
  threadId: { type: String, unique: true, index: true },
  name: String,
  admins: [String],
  prefix: { type: String, default: "!" },
  autoAdd: { type: Boolean, default: false },
  welcomeMsg: String,
  leaveMsg: String,
  language: { type: String, default: "en" },
  onlyAdminCmds: [String],
  mutedUsers: [String],
  enableSpy: { type: Boolean, default: false },
  enableHack: { type: Boolean, default: false },
  enableRob: { type: Boolean, default: true },
  enableTasks: { type: Boolean, default: true },
  enableQuests: { type: Boolean, default: true },
  enableQuiz: { type: Boolean, default: false },
  enableFootball: { type: Boolean, default: false },
  enablePokemon: { type: Boolean, default: true },
  bankProtection: { type: Boolean, default: true },
  removeInactiveAfterDays: { type: Number, default: 0 },
  spyTargets: [String],
}, { timestamps: true });

const TradeSchema = new mongoose.Schema({
  from: String,
  to: String,
  itemsFrom: [String],
  itemsTo: [String],
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

const EventLogSchema = new mongoose.Schema({
  threadId: String,
  userId: String,
  action: String,
  details: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const models = {
  User: mongoose.models.User || mongoose.model("User", UserSchema),
  Thread: mongoose.models.Thread || mongoose.model("Thread", ThreadSchema),
  Trade: mongoose.models.Trade || mongoose.model("Trade", TradeSchema),
  EventLog: mongoose.models.EventLog || mongoose.model("EventLog", EventLogSchema),
};

let connected = false;

async function connect() {
  if (!process.env.MONGO_URI) {
    console.warn("[MONGO] MONGO_URI missing — using safe in-memory mode");
    return false;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log("[MONGO] connected");
    return true;
  } catch (error) {
    console.error(`[MONGO] offline-safe: ${error.message}`);
    return false;
  }
}

function isReady() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = { connect, isReady, models, mongoose };
