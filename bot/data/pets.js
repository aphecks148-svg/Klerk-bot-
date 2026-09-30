const skills = [
  { name: "🌟 Pulse", damage: 18, cooldown: 0, effect: "none" },
  { name: "🔥 Ember", damage: 24, cooldown: 2, effect: "burn" },
  { name: "❄️ Frost Lock", damage: 14, cooldown: 3, effect: "freeze" },
  { name: "💚 Divine Heal", damage: -20, cooldown: 4, effect: "heal" },
];
const names = {
  Common: ["Pup", "Kitten", "Bunny", "Chick", "Cub", "Sprout", "Pebble", "Mochi", "Bean", "Pip", "Miso", "Nibbles", "Cloud", "Dew", "Twig"],
  Uncommon: ["Frostpaw", "Emberfox", "Mossling", "Tidefin", "Stormkit", "Bramble", "Moonhare", "Voltling", "Coralyn", "Duskhound", "Sunfawn", "Leaflet"],
  Rare: ["Aurora Wolf", "Thunder Roc", "Crystal Lynx", "Shadow Drake", "Ocean Wyrm", "Solar Stag", "Ironclaw", "Star Serpent", "Rune Bear", "Mist Panther"],
  Epic: ["Phoenix", "Leviathan", "Nightmare", "Celestial Tiger", "Void Hound", "Titan Beetle", "Arcane Dragon"],
  Legendary: ["Eclipse Dragon", "World Turtle", "Infinity Kitsune"],
  Mythic: ["Astral Deity", "Chrono Beast"],
  Divine: ["iKON Seraph"],
};
const rarityPower = { Common: 10, Uncommon: 18, Rare: 30, Epic: 48, Legendary: 70, Mythic: 100, Divine: 150 };
const PETS = Object.entries(names).flatMap(([rarity, list]) => list.map((name, index) => ({
  id: `${rarity.toLowerCase()}-${index + 1}`,
  name, species: name, rarity, power: rarityPower[rarity] + index, hp: 100 + rarityPower[rarity] * 2,
  skills: skills.map((skill, skillIndex) => ({ ...skill, damage: skill.damage + Math.floor(rarityPower[rarity] / 8) + skillIndex })),
})));
function findPet(query) {
  const lower = String(query || "").toLowerCase();
  return PETS.find((pet) => pet.id === lower || pet.name.toLowerCase() === lower) || PETS[0];
}
module.exports = { PETS, skills, findPet };