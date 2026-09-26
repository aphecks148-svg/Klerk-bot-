const axios = require("axios");
const { createPokemonSpawnCard } = require("../utils/canvas");
const { box } = require("../utils/box");
const pending = new Map();
const counters = new Map();
const rates = new Map();

async function tickPokemonSpawn({ api, event }) {
  const thread = String(event.threadID);
  const count = (counters.get(thread) || 0) + 1;
  counters.set(thread, count);
  const rate = rates.get(thread) || 20;
  if (count % rate !== 0 || pending.has(thread)) return;
  try {
    const id = 1 + Math.floor(Math.random() * 151);
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`, { timeout: 8000 });
    const data = response.data;
    const pokemon = {
      name: data.name,
      image: data.sprites.other?.["official-artwork"]?.front_default || data.sprites.front_default,
      rarity: id > 130 ? "Rare" : id > 80 ? "Uncommon" : "Common",
      cp: data.base_experience || 100,
    };
    pending.set(thread, pokemon);
    const image = await createPokemonSpawnCard(pokemon);
    if (api && typeof api.sendMessageMqtt === "function") {
      const fs = require("fs"); const os = require("os"); const path = require("path");
      const file = path.join(os.tmpdir(), `ikon-pokemon-${Date.now()}.png`);
      fs.writeFileSync(file, image);
      api.sendMessageMqtt({ body: box("🌟 Wild Pokémon", [`${pokemon.name} appeared!`, "Use catch 🔴"]), attachment: [fs.createReadStream(file)] }, thread, event.messageID, () => setTimeout(() => fs.rm(file, { force: true }, () => {}), 30000));
    }
  } catch (error) {
    console.error("[POKEMON SPAWN]", error.message);
  }
}

function consumePending(threadID) {
  const pokemon = pending.get(String(threadID));
  if (pokemon) pending.delete(String(threadID));
  return pokemon;
}
function setRate(threadID, rate) { rates.set(String(threadID), Math.max(1, Number(rate) || 20)); }
function getPending(threadID) { return pending.get(String(threadID)); }

module.exports = { tickPokemonSpawn, consumePending, getPending, setRate };