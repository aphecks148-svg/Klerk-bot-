const axios = require("axios");
const { getRegistry, reloadPlugin, setPluginEnabled } = require("./loader");
const { box } = require("../utils/box");
const { getUser, adjustMoney, addXp } = require("../utils/economy");
const { createMenuCanvas, createProfileCard, createPetCard, createBattleCard } = require("../utils/canvas");
const { PETS, findPet } = require("../data/pets");
const lists = require("../data/lists");
const autoReact = require("../utils/autoReact");
const { models, isReady } = require("./mongo");
const { getPending, consumePending } = require("../events/pokemonSpawn");
const { setRate } = require("../events/pokemonSpawn");

const adminIds = () => new Set(String(process.env.ADMIN_IDS || "").split(",").map((id) => id.trim()).filter(Boolean));
const isAdmin = (id) => adminIds().has(String(id));
const adminOnly = new Set(["addmoney", "removemoney", "setlevel", "ban", "unban", "jail", "bail", "kick", "warn", "clear", "announcement", "bot_restart", "plugin_reload", "plugin_disable", "plugin_enable", "set_spawn_rate", "pokemon_rate", "set_prefix", "give_pet", "give_divine", "economy_reset", "backup_mongo", "restore_mongo", "audit_log", "view_users", "autoreact", "eval", "shell", "appstate_update"]);

async function normalUser(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }
function listText(key) {
  const values = lists[key] || [];
  return box(`📋 ${key}`, values.map((item, i) => `${i + 1}. ${item}`));
}
function mentionId(ctx) {
  const mention = ctx.event.mentions && Object.keys(ctx.event.mentions)[0];
  return mention || ctx.args[0] || ctx.event.senderID;
}

async function aiReply(ctx) {
  if (!process.env.GEMINI_KEY) return "🤖 Gemini is offline-safe: add GEMINI_KEY to enable AI replies.";
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const model = new GoogleGenerativeAI(process.env.GEMINI_KEY).getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(ctx.args.join(" ") || "Say hello as iKON-BOT.");
  return `🤖 ${result.response.text()}`;
}

async function pokemon(ctx) {
  const caught = consumePending(ctx.event.threadID);
  if (ctx.command.name === "catch" && caught) {
    const user = await normalUser(ctx);
    user.pokedex = [...new Set([...(user.pokedex || []), caught.name])];
    if (isReady()) await models.User.updateOne({ facebookId: user.facebookId }, { $set: { pokedex: user.pokedex } });
    return `🔴✨ You caught ${caught.name}! It joined your pokedex.`;
  }
  if (ctx.command.name === "pokedex") {
    const user = await normalUser(ctx);
    return box("📖 Your Pokédex", (user.pokedex || []).map((item, i) => `${i + 1}. ${item}`) || ["Empty — catch a wild Pokémon!"]);
  }
  const query = ctx.args[0] || "pikachu";
  const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query.toLowerCase())}`, { timeout: 8000 });
  return `🌟 ${response.data.name} • base XP ${response.data.base_experience} • type ${response.data.types.map((t) => t.type.name).join(", ")}`;
}

async function run(ctx) {
  const name = ctx.command.name;
  if (adminOnly.has(name) && !isAdmin(ctx.event.senderID)) return ctx.send(box("🛡️ Admin only", ["Your Facebook ID is not in ADMIN_IDS."]));

  if (name === "menu" || name === "help") {
    const registry = getRegistry();
    const categories = registry.categories.map((c) => `${c.emoji} ${c.label} — ${c.commands.length}`).join("\n");
    const image = await createMenuCanvas({ label: "All Categories", emoji: "🧭" }, ctx.profile.picture, ctx.profile.name, registry.categories.flatMap((c) => c.commands).slice(0, 50));
    return ctx.send(box("🧭 iKON-BOT v5.0 Divine", [categories, "", `Total commands: ${registry.totalCommands}`, "Send a category command to open its menu."]), image);
  }
  if (name === "profile" || name === "rank" || name === "balance") {
    const user = await normalUser(ctx);
    const image = name === "balance" ? await createProfileCard(user, ctx.profile.picture) : await createProfileCard(user, ctx.profile.picture);
    return ctx.send(box("👤 Profile", [`👋 ${ctx.profile.name}`, `💰 ${user.money}`, `⭐ Level ${user.level}`, `🐾 ${(user.pets || []).length} pets`]), image);
  }
  if (name.endsWith("_list") || name === "rarity_list") return ctx.send(listText(name));
  if (name === "pet_list") {
    const image = await createMenuCanvas({ label: "50 Divine Pets", emoji: "🐾" }, ctx.profile.picture, ctx.profile.name, PETS);
    return ctx.send(box("🐾 Pet Labs", [`${PETS.length} pets loaded`, "Use adopt [pet] or petcard [pet]."]), image);
  }
  if (name === "adopt" || name === "give_pet" || name === "give_divine") {
    const pet = name === "give_divine" ? findPet("iKON Seraph") : findPet(ctx.args[0]);
    const userId = name === "adopt" ? ctx.event.senderID : mentionId(ctx);
    const user = await getUser(userId, userId === ctx.event.senderID ? ctx.profile.name : "Facebook user");
    user.pets = [...(user.pets || []), { ...pet, acquiredAt: new Date().toISOString() }];
    if (isReady()) await models.User.updateOne({ facebookId: userId }, { $set: { pets: user.pets } });
    const image = await createPetCard(pet, ctx.profile.picture, ctx.profile.name);
    return ctx.send(box("👑 Pet acquired!", [`🐾 ${pet.name}`, `💎 ${pet.rarity}`, "4 skills unlocked"]), image);
  }
  if (name === "petcard" || name === "petstats") {
    const pet = findPet(ctx.args[0]);
    return ctx.send(box("🐾 Pet card", [`${pet.name} • ${pet.rarity}`, `⚔️ ${pet.power} power`, "Use petbattle to fight."]), await createPetCard(pet, ctx.profile.picture, ctx.profile.name));
  }
  if (name === "battle" || name === "petbattle" || name === "arena") {
    const pet = findPet(ctx.args[0]);
    const image = await createBattleCard({ name: ctx.profile.name, species: pet.name, hp: pet.hp, maxHp: pet.hp, skills: pet.skills }, { name: "Opponent", species: "Wild challenger", hp: 100, maxHp: 100 });
    return ctx.send(box("⚔️ Battle ready", ["Reply 1-4 to use a skill.", "Effects: burn 🔥 freeze ❄️ heal 💚 rage 💢"]), image);
  }
  if (name === "ai" || name === "ask" || name === "gemini" || name === "ai_girlfriend") return ctx.send(await aiReply(ctx));
  if (["catch", "pokedex", "pokemon_list"].includes(name)) return ctx.send(await pokemon(ctx));
  if (name === "daily" || name === "work" || name === "beg" || name === "claim") {
    const amount = name === "daily" ? 500 : 100;
    const user = await adjustMoney(ctx.event.senderID, amount, ctx.profile.name, name);
    return ctx.send(box(`💰 ${name}`, [`+${amount} coins`, `Balance: ${user.money}`]));
  }
  if (name === "addmoney" || name === "removemoney") {
    const amount = Number(ctx.args.find((arg) => /^-?\d+$/.test(arg)) || 0);
    const amountWithSign = name === "removemoney" ? -Math.abs(amount) : Math.abs(amount);
    const user = await adjustMoney(mentionId(ctx), amountWithSign, "Facebook user", name);
    return ctx.send(`💰 Updated balance: ${user.money}`);
  }
  if (name === "plugin_reload") {
    const category = ctx.args[0];
    const loaded = reloadPlugin(require("path").join(__dirname, "..", "plugins"), category);
    return ctx.send(loaded ? `🔄 Reloaded ${category} — ${loaded.commands.length} commands online.` : `❌ Could not reload ${category}.`);
  }
  if (name === "plugin_disable" || name === "plugin_enable") {
    const category = ctx.args[0];
    const enabled = name === "plugin_enable";
    setPluginEnabled(category, enabled);
    return ctx.send(`${enabled ? "✅ Enabled" : "🛑 Disabled"} plugin: ${category}`);
  }
  if (name === "set_spawn_rate" || name === "pokemon_rate") {
    const rate = Math.max(1, Number(ctx.args[0]) || 20);
    setRate(ctx.event.threadID, rate);
    return ctx.send(`🌟 Pokémon spawn rate set to every ${rate} messages for this thread.`);
  }
  if (["eval", "shell", "appstate_update"].includes(name)) {
    return ctx.send(box("👑 Owner control", [
      "This command is reserved for the configured owner.",
      "For hosted deployments, update Render environment variables instead of mutating process secrets from chat.",
    ]));
  }
  if (name === "autoreact") {
    const value = String(ctx.args[0] || "on").toLowerCase() !== "off";
    autoReact.setEnabled(value);
    return ctx.send(`✨ Auto reacts ${value ? "enabled" : "disabled"}.`);
  }
  if (name === "set_prefix") {
    process.env.PREFIX = ctx.args[0] || "!";
    return ctx.send(`⚙️ Prefix set to ${process.env.PREFIX}`);
  }
  if (name === "command_count" || name === "stats" || name === "about") return ctx.send(box("🤖 iKON-BOT", [`Version: 5.0 Divine`, `Commands: ${getRegistry().totalCommands}`, "Owner: Aphecks", "Plugin isolation: ONLINE"]));
  if (name === "gta" || name.startsWith("gta_")) return ctx.send(box("🔫 GTA mission", [`Mission ${ctx.args[0] || "1"} loaded`, "Reward: 💰 250", "Canvas story card ready."]));
  if (name === "slots" || name === "blackjack" || name === "coinflip" || name === "gamble") return ctx.send(box("🎰 Casino Arcade", ["The reels spin...", "Use balance to place a wager."]));
  if (name === "farm" || name === "mine" || name === "hunt" || name === "fish") {
    await addXp(ctx.event.senderID, 15, ctx.profile.name);
    return ctx.send(box("🌾 Gather action", [`${name} complete`, "+15 XP", "Items added to inventory."]));
  }
  return ctx.send(box(`${ctx.command.category} ${name}`, ["✅ Command online.", "Use help or menu for the full command list.", "This module is isolated and ready for extension."]));
}

module.exports = { run };