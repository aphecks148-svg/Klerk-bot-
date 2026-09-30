/**
 * iKON-BOT — Pet Labs data set.
 * 50 hand-authored pets across 7 rarities.
 *
 * Each pet carries:
 *   id        stable lookup key (used by .petcard / .adopt)
 *   name      display name
 *   type      battle element (Fire / Water / …)
 *   rarity    Common → Divine
 *   power     battle power (drives the [■■■■■□□] strength bar)
 *   hp        base hit points
 *   emoji     the "pic" drawn on pet cards and in .petlist
 *   color     accent colour used by the canvas renderer
 *   strength  0–10 meter, rendered as [■■■■■□□]
 *   lore      one-line flavour text
 *   skills    4 battle abilities
 */

const SKILL_POOL = {
  strike: { name: "⚔️ Strike", damage: 18, cooldown: 0, effect: "none" },
  burn: { name: "🔥 Ember", damage: 26, cooldown: 2, effect: "burn" },
  freeze: { name: "❄️ Frost Lock", damage: 15, cooldown: 3, effect: "freeze" },
  heal: { name: "💚 Divine Heal", damage: -22, cooldown: 4, effect: "heal" },
  surge: { name: "🌊 Tide Surge", damage: 24, cooldown: 2, effect: "slow" },
  spark: { name: "⚡ Spark", damage: 21, cooldown: 1, effect: "stun" },
  howl: { name: "🌑 Moon Howl", damage: 23, cooldown: 3, effect: "silence" },
  quake: { name: "💥 Quake", damage: 30, cooldown: 4, effect: "shake" },
  ward: { name: "🛡️ Iron Ward", damage: -18, cooldown: 3, effect: "guard" },
  holy: { name: "☀️ Seraph Ray", damage: 34, cooldown: 5, effect: "bless" },
};

/** Rarity order, lowest → highest. */
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"];

/** Base power per rarity — Common is deliberately weak, Divine is the ceiling. */
const RARITY_POWER = { Common: 10, Uncommon: 22, Rare: 38, Epic: 58, Legendary: 84, Mythic: 118, Divine: 165 };

/** Accent colour per rarity. */
const RARITY_COLOR = {
  Common: "#8d99ae",
  Uncommon: "#41d58a",
  Rare: "#4aa8ff",
  Epic: "#a86bff",
  Legendary: "#f6c453",
  Mythic: "#ff6b6b",
  Divine: "#ff2e88",
};

/** Battle elements, documented once so the roster vocabulary stays in one place. */
const ALL_TYPES = [
  "Beast", "Fire", "Water", "Grass", "Ice", "Storm",
  "Shadow", "Light", "Metal", "Arcane", "Dragon", "Cosmic", "Earthen",
];

/** Which ability quartet each element fights with. */
const TYPE_SKILLS = {
  Fire: ["strike", "burn", "quake", "holy"],
  Water: ["strike", "surge", "freeze", "heal"],
  Grass: ["strike", "heal", "surge", "ward"],
  Ice: ["strike", "freeze", "surge", "ward"],
  Storm: ["strike", "spark", "quake", "holy"],
  Shadow: ["strike", "howl", "burn", "ward"],
  Light: ["strike", "holy", "heal", "ward"],
  Metal: ["strike", "quake", "ward", "spark"],
  Arcane: ["strike", "spark", "heal", "holy"],
  Dragon: ["strike", "burn", "holy", "quake"],
  Cosmic: ["strike", "holy", "freeze", "howl"],
  Earthen: ["strike", "quake", "ward", "heal"],
  Beast: ["strike", "howl", "quake", "ward"],
};

/**
 * Build 4 element-themed abilities, scaled by rarity tier.
 */
function skillsFor(type, rarity) {
  const tier = RARITY_POWER[rarity] || 10;
  const k = Math.floor(tier / 12);
  const keys = TYPE_SKILLS[type] || TYPE_SKILLS.Beast;
  return keys.map((key, i) => ({ ...SKILL_POOL[key], damage: SKILL_POOL[key].damage + k + i * 2 }));
}

/**
 * The roster — 50 entries, each `[rarity, name, type, emoji, lore]`.
 * Ordered by rarity, lowest first, so `.petlist` reads as a natural rarity ladder.
 */
const ROSTER = [
  // ── Common (10) ────────────────────────────────────────────────────────────
  ["Common", "Pebble Pup", "Beast", "🐶", "Naps in the sun and bites your shoelaces."],
  ["Common", "Mochi Bun", "Grass", "🐰", "Small, round, and endlessly hungry."],
  ["Common", "Sprig Sprout", "Grass", "🌱", "Photosynthesises while you sleep."],
  ["Common", "Pip Sparrow", "Storm", "🐦", "Delivers mail nobody asked for."],
  ["Common", "Dust Mutt", "Earthen", "🐕", "A loyal shadow at your heel."],
  ["Common", "Pebble Crab", "Water", "🦀", "Walks sideways through life."],
  ["Common", "Twig Wisp", "Arcane", "🪵", "Barely there, but tries its best."],
  ["Common", "Cinder Kit", "Fire", "🐈‍⬛", "Sleeps on warm machinery."],
  ["Common", "Dewdrop Slug", "Water", "🐌", "Slow but never late."],
  ["Common", "Chick Bit", "Storm", "🐤", "Cheeps through every tutorial."],

  // ── Uncommon (9) ──────────────────────────────────────────────────────────
  ["Uncommon", "Frostpaw", "Ice", "🐺", "Its breath freezes the morning air."],
  ["Uncommon", "Emberfox", "Fire", "🦊", "Leaves glowing pawprints in the snow."],
  ["Uncommon", "Mossling", "Grass", "🍄", "Grows a new cap every full moon."],
  ["Uncommon", "Tidefin", "Water", "🐟", "Rides the undertow like a throne."],
  ["Uncommon", "Stormkit", "Storm", "🐈", "Static clings to its whiskers."],
  ["Uncommon", "Bramble Boar", "Beast", "🐗", "Roots the forest floor in anger."],
  ["Uncommon", "Moonhare", "Shadow", "🐇", "Only visible under a silver sky."],
  ["Uncommon", "Voltling", "Storm", "🐲", "Crackles when it is excited."],
  ["Uncommon", "Coralyn", "Water", "🪸", "Builds a fortress one polyp at a time."],

  // ── Rare (8) ──────────────────────────────────────────────────────────────
  ["Rare", "Aurora Wolf", "Ice", "🐺", "Its fur shimmers green and violet."],
  ["Rare", "Thunder Roc", "Storm", "🦅", "Wings beat like distant thunder."],
  ["Rare", "Crystal Lynx", "Ice", "🐈", "Paws chime like struck glass."],
  ["Rare", "Shadow Drake", "Shadow", "🦇", "A silhouette with teeth."],
  ["Rare", "Ocean Wyrm", "Water", "🐉", "Older than the harbour itself."],
  ["Rare", "Solar Stag", "Light", "🦌", "Antlers bloom with summer."],
  ["Rare", "Ironclaw Bear", "Metal", "🐻", "Armour grown, not worn."],
  ["Rare", "Star Serpent", "Cosmic", "🐍", "Slithering through a meteor shower."],

  // ── Epic (7) ──────────────────────────────────────────────────────────────
  ["Epic", "Rune Bear", "Arcane", "🐻", "Glyphs glow beneath its fur."],
  ["Epic", "Mist Panther", "Shadow", "🐆", "You see it after it has gone."],
  ["Epic", "Phoenix", "Fire", "🔥", "Dies beautifully, returns louder."],
  ["Epic", "Leviathan", "Water", "🐋", "The tide answers when it sings."],
  ["Epic", "Nightmare", "Shadow", "👁️", "A bad dream given teeth."],
  ["Epic", "Celestial Tiger", "Cosmic", "🐅", "Constellations mark its shoulders."],
  ["Epic", "Titan Beetle", "Metal", "🪲", "Armour plate of forged star-iron."],

  // ── Legendary (6) ─────────────────────────────────────────────────────────
  ["Legendary", "Arcane Dragon", "Dragon", "🐉", "Reads the future in open flame."],
  ["Legendary", "Eclipse Dragon", "Cosmic", "🌑", "Where it flies, daylight hesitates."],
  ["Legendary", "World Turtle", "Water", "🐢", "Carries a coastline on its shell."],
  ["Legendary", "Infinity Kitsune", "Arcane", "🦊", "Nine tails, nine lifetimes."],
  ["Legendary", "Storm Sovereign", "Storm", "👑", "Crowned by a hurricane."],
  ["Legendary", "Void Leviord", "Shadow", "🌊", "The sea floor is its throne."],

  // ── Mythic (5) ────────────────────────────────────────────────────────────
  ["Mythic", "Astral Seraph", "Cosmic", "👼", "Wings of collapsing starlight."],
  ["Mythic", "Chrono Beast", "Arcane", "⏳", "Older than yesterday."],
  ["Mythic", "Ragnarok Wolf", "Fire", "🐺", "Howls at the end of everything."],
  ["Mythic", "Null Specter", "Shadow", "💀", "A hole shaped like a promise."],
  ["Mythic", "Singularity", "Cosmic", "🕳️", "Swallows light, returns power."],

  // ── Divine (5) ────────────────────────────────────────────────────────────
  ["Divine", "Seraphine", "Light", "🕊️", "The first light of the new cycle."],
  ["Divine", "iKON Seraph", "Light", "👑", "The mascot of iKON-BOT. Do not sell."],
  ["Divine", "Genesis Wyrm", "Dragon", "🌟", "A dragon who remembers the First Word."],
  ["Divine", "Aeon Guardian", "Cosmic", "🛡️", "Guards the seam between ticks and tocks."],
  ["Divine", "Omega Seraph", "Light", "💠", "The final page of the divine code."],
];

/** Used only to spread power values evenly inside each rarity block. */
const RARITY_BLOCK = 8;

/** Build the 50 fully-formed pet objects from the roster table. */
const PETS = ROSTER.map(([rarity, name, type, emoji, lore], index) => {
  const tier = RARITY_POWER[rarity];
  const offset = index % RARITY_BLOCK;
  const power = tier + offset * 2;
  return {
    id: `${rarity.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
    name,
    species: name,
    type,
    emoji,
    lore,
    rarity,
    power,
    hp: 100 + tier * 2 + offset * 5,
    color: RARITY_COLOR[rarity],
    strength: Math.max(1, Math.min(10, Math.round(power / 18))),
    skills: skillsFor(type, rarity),
  };
});

/**
 * Look up a pet by id, exact name, or fuzzy partial name.
 * Returns null when nothing matches — callers decide their own fallback.
 */
function findPet(query) {
  const lower = String(query == null ? "" : query).trim().toLowerCase();
  if (!lower) return null;
  const exact = PETS.find((pet) => pet.id === lower || pet.name.toLowerCase() === lower);
  if (exact) return exact;
  const startsWith = PETS.find((pet) => pet.name.toLowerCase().startsWith(lower));
  if (startsWith) return startsWith;
  return PETS.find(
    (pet) => pet.name.toLowerCase().includes(lower) || pet.type.toLowerCase() === lower
  ) || null;
}

/** All pets of a given rarity, in roster order. */
function petsByRarity(rarity) {
  const target = String(rarity == null ? "" : rarity).trim().toLowerCase();
  return PETS.filter((pet) => pet.rarity.toLowerCase() === target);
}

/** Rarity of a pet looked up by name/id, or null. */
function rarityOf(name) {
  const pet = findPet(name);
  return pet ? pet.rarity : null;
}

module.exports = {
  PETS,
  RARITIES,
  RARITY_POWER,
  RARITY_COLOR,
  ALL_TYPES,
  SKILL_POOL,
  findPet,
  petsByRarity,
  rarityOf,
};
