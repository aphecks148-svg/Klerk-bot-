const lists = require("../bot/data/lists");

const MIN = 15;
let bad = 0;
for (const [key, value] of Object.entries(lists)) {
  if (!Array.isArray(value)) { console.log("NOT ARRAY", key); bad++; continue; }
  if (value.length < MIN) { console.log("TOO SHORT", key, value.length); bad++; }
}
const keys = Object.keys(lists);
console.log("lists:", keys.length, "entries:", keys.reduce((n, k) => n + lists[k].length, 0), "under-min:", bad);

// legacy keys the old data file exported — anything still referenced?
const legacy = ["pet_list", "gta_list", "business_list", "stock_list", "crypto_list", "crop_list",
  "ore_list", "fish_list", "weapon_list", "boss_list", "achievement_list", "quest_list", "title_list",
  "recipe_list", "shop_list", "badge_list", "clan_list", "estate_list", "vault_tier_list", "rarity_list"];
console.log("legacy keys still present:", legacy.filter((k) => k in lists));
