const axios = require("axios");
let createCanvas, loadImage;
try {
  ({ createCanvas, loadImage } = require("canvas"));
} catch (e) {
  console.warn("[CANVAS] Native canvas module unavailable — image features disabled");
  createCanvas = () => { throw new Error("Canvas module not available"); };
  loadImage = () => Promise.reject(new Error("Canvas module not available"));
}

const COLORS = { bg: "#0b1020", panel: "#151d35", gold: "#f6c453", text: "#f5f7ff", muted: "#a9b4d0", green: "#41d58a", red: "#ff6b6b" };

// Emoji-compatible font stack for proper rendering on canvas
const EMOJI_FONT = "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Sans', sans-serif";

function roundedRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function text(ctx, value, x, y, size = 24, color = COLORS.text, weight = "600", family = EMOJI_FONT) {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.fillText(String(value), x, y);
}

async function imageFromUrl(url) {
  if (!url) return null;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    return loadImage(Buffer.from(response.data));
  } catch (_) { return null; }
}

function drawAvatar(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  if (image) ctx.drawImage(image, x, y, size, size);
  else { ctx.fillStyle = "#30436d"; ctx.fillRect(x, y, size, size); text(ctx, "👤", x + size * 0.22, y + size * 0.68, size * 0.45); }
  ctx.restore();
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.stroke();
}

function base(width = 1000, height = 650) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#090d1d"); gradient.addColorStop(1, "#1b2c52");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
}

async function createMenuCanvas(category, userPic, userName, commands = [], page = 1, totalPages = 1) {
  const rows = Math.max(1, Math.ceil(Math.min(commands.length, 140) / 4));
  const height = Math.max(650, 250 + rows * 38 + 100);
  const { canvas, ctx } = base(1200, height);
  drawAvatar(ctx, userPic, 48, 38, 92);
  text(ctx, "iKON-BOT", 165, 75, 38, COLORS.gold, "900");
  text(ctx, `${category.emoji || "🧩"} ${category.label || "Command Menu"}`, 165, 112, 24, COLORS.text, "600", EMOJI_FONT);
  text(ctx, userName || "Facebook user", 165, 145, 19, COLORS.muted, "400", EMOJI_FONT);
  roundedRect(ctx, 42, 180, 1116, height - 270, 22, "rgba(21,29,53,.92)", "#344976");
  text(ctx, `Commands • page ${page}/${totalPages} • send one code at a time`, 75, 225, 23, COLORS.gold, "700", EMOJI_FONT);
  commands.slice(0, 140).forEach((command, i) => {
    const rowsPerColumn = Math.max(1, Math.ceil(Math.min(commands.length, 140) / 4));
    const col = Math.floor(i / rowsPerColumn); const row = i % rowsPerColumn;
    const x = 72 + col * 270; const y = 265 + row * 38;
    text(ctx, `${i + 1}. ${command.displayName || command.name || command}`, x, y, 13, row % 2 ? COLORS.text : COLORS.muted, "500", "Monospace");
    if (command.hint) text(ctx, `↳ ${command.hint}`, x + 13, y + 15, 10, "#7890bd", "400", "Serif");
  });
  text(ctx, "Owner: Aphecks • v5.0 Divine • 700 commands • 🤖 powered by chaos", 75, height - 34, 18, COLORS.gold, "600", EMOJI_FONT);
  return canvas.toBuffer("image/png");
}

async function createProfileCard(userData = {}, userPic) {
  const { canvas, ctx } = base(1000, 560);
  drawAvatar(ctx, userPic, 55, 58, 150);
  text(ctx, userData.name || "Facebook user", 250, 110, 38, COLORS.text, "800", EMOJI_FONT);
  text(ctx, "iKON-BOT profile 🌟", 250, 148, 22, COLORS.gold, "600", EMOJI_FONT);
  const stats = [`💰 Money: ${userData.money || 0}`, `⭐ Level: ${userData.level || 1}`, `🐾 Pets: ${(userData.pets || []).length}`, `🎒 Items: ${(userData.inventory || []).length}`];
  stats.forEach((line, i) => text(ctx, line, 250, 205 + i * 48, 24, COLORS.text, "600", EMOJI_FONT));
  roundedRect(ctx, 55, 345, 890, 28, 14, "#26385d");
  roundedRect(ctx, 55, 345, Math.max(16, Math.min(890, ((userData.xp || 0) % 100) * 8.9)), 28, 14, COLORS.green);
  text(ctx, `${userData.xp || 0} XP to next level`, 55, 420, 20, COLORS.muted, "600", EMOJI_FONT);
  text(ctx, "Owner: Aphecks • Divine mode 👑", 55, 505, 20, COLORS.gold, "600", EMOJI_FONT);
  return canvas.toBuffer("image/png");
}

async function createPetCard(pet = {}, userPic, userName) {
  const { canvas, ctx } = base(900, 600);
  drawAvatar(ctx, userPic, 44, 42, 82);
  text(ctx, userName || "Trainer", 145, 94, 24, COLORS.text, "600", EMOJI_FONT);
  text(ctx, `🐾 ${pet.name || pet.species || "Mystery Pet"}`, 50, 185, 42, COLORS.gold, "800", EMOJI_FONT);
  text(ctx, `💎 ${pet.rarity || "Common"} • LVL ${pet.level || 1}`, 52, 225, 23, COLORS.text, "600", EMOJI_FONT);
  text(ctx, `❤️ HP ${pet.hp || 100} • ⚔️ Power ${pet.power || 10}`, 52, 270, 23, COLORS.muted, "600", EMOJI_FONT);
  (pet.skills || []).slice(0, 4).forEach((skill, i) => text(ctx, `${i + 1}. ${skill.name || skill}`, 72, 335 + i * 38, 22, COLORS.text, "600", EMOJI_FONT));
  roundedRect(ctx, 560, 92, 270, 350, 24, pet.rarity === "Divine" ? "#5d4715" : "#202f53", pet.rarity === "Divine" ? COLORS.gold : "#4a6ba7");
  text(ctx, pet.rarity === "Divine" ? "👑 DIVINE" : "✨ PET", 610, 180, 32, COLORS.gold, "800", EMOJI_FONT);
  text(ctx, "4 skills ready 🔥", 610, 235, 20, COLORS.muted, "600", EMOJI_FONT);
  text(ctx, "iKON-BOT • v5.0 🤖", 610, 405, 19, COLORS.text, "600", EMOJI_FONT);
  return canvas.toBuffer("image/png");
}

async function createBattleCard(fighter1 = {}, fighter2 = {}) {
  const { canvas, ctx } = base(1100, 620);
  text(ctx, "⚔️ iKON-BOT BATTLE ARENA", 52, 65, 32, COLORS.gold, "800", EMOJI_FONT);
  const fighters = [fighter1, fighter2];
  fighters.forEach((fighter, i) => {
    const x = i ? 590 : 55;
    roundedRect(ctx, x, 110, 455, 370, 24, "#182642", "#415e93");
    text(ctx, fighter.name || `Fighter ${i + 1}`, x + 28, 165, 30, COLORS.text, "800", EMOJI_FONT);
    text(ctx, `🐾 ${fighter.species || "Champion"}`, x + 28, 202, 20, COLORS.muted, "600", EMOJI_FONT);
    roundedRect(ctx, x + 28, 235, 395, 30, 15, "#3a2637");
    roundedRect(ctx, x + 28, 235, Math.max(20, 395 * Math.max(0, Math.min(1, (fighter.hp || 70) / (fighter.maxHp || 100)))), 30, 15, i ? "#ff6b6b" : COLORS.green);
    text(ctx, `❤️ ${fighter.hp || 70}/${fighter.maxHp || 100}`, x + 28, 310, 22, COLORS.text, "600", EMOJI_FONT);
    (fighter.skills || ["Strike", "Guard", "Rage", "Heal"]).slice(0, 4).forEach((skill, n) => text(ctx, `${n + 1}. ${skill.name || skill}`, x + 32, 355 + n * 28, 17, COLORS.text, "600", EMOJI_FONT));
  });
  text(ctx, "Reply 1-4 to use a skill • turn by turn ⚔️", 55, 555, 22, COLORS.gold, "700", EMOJI_FONT);
  return canvas.toBuffer("image/png");
}

async function createPokemonSpawnCard(pokemon = {}) {
  const { canvas, ctx } = base(900, 600);
  text(ctx, "🌟 A WILD POKÉMON APPEARED!", 50, 72, 32, COLORS.gold, "800", EMOJI_FONT);
  const image = await imageFromUrl(pokemon.image);
  if (image) ctx.drawImage(image, 285, 105, 330, 330);
  else text(ctx, "❔", 395, 300, 100, COLORS.text, "400", EMOJI_FONT);
  text(ctx, `${pokemon.name || "Unknown"}`, 50, 500, 34, COLORS.text, "800", EMOJI_FONT);
  text(ctx, `✨ ${pokemon.rarity || "Common"} • ⚔️ CP ${pokemon.cp || 100}`, 50, 540, 22, COLORS.muted, "600", EMOJI_FONT);
  text(ctx, "Use catch with a pokeball 🔴", 570, 525, 20, COLORS.gold, "700", EMOJI_FONT);
  return canvas.toBuffer("image/png");
}

module.exports = { imageFromUrl, createMenuCanvas, createProfileCard, createPetCard, createBattleCard, createPokemonSpawnCard, COLORS, EMOJI_FONT };
