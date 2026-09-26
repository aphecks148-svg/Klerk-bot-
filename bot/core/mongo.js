const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  facebookId: { type: String, unique: true, index: true },
  name: String,
  money: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  prefix: { type: String, default: process.env.PREFIX || "!" },
  pets: { type: Array, default: [] },
  pokedex: { type: Array, default: [] },
  inventory: { type: Array, default: [] },
  warnings: { type: Number, default: 0 },
  banned: { type: Boolean, default: false },
  jailedUntil: Date,
}, { timestamps: true });

const PetSchema = new mongoose.Schema({
  ownerId: { type: String, index: true },
  name: String,
  species: String,
  rarity: String,
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  hp: { type: Number, default: 100 },
  skills: { type: Array, default: [] },
}, { timestamps: true });

const CooldownSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
  expiresAt: Date,
}, { timestamps: true });

const BusinessSchema = new mongoose.Schema({
  ownerId: { type: String, index: true },
  name: String,
  type: String,
  level: { type: Number, default: 1 },
  treasury: { type: Number, default: 0 },
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  actorId: String,
  targetId: String,
  type: String,
  amount: Number,
  note: String,
}, { timestamps: true });

const models = {
  User: mongoose.models.User || mongoose.model("User", UserSchema),
  Pet: mongoose.models.Pet || mongoose.model("Pet", PetSchema),
  Cooldown: mongoose.models.Cooldown || mongoose.model("Cooldown", CooldownSchema),
  Business: mongoose.models.Business || mongoose.model("Business", BusinessSchema),
  Transaction: mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema),
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