const { PETS, RARITIES, petsByRarity, findPet } = require("../bot/data/pets");
console.log("total", PETS.length);
for (const r of RARITIES) {
  console.log(String(r).padEnd(10), String(petsByRarity(r).length).padStart(2), "|", petsByRarity(r).map((p) => p.emoji + p.name).join(" "));
}
console.log("find phoenix ->", findPet("phoenix") && findPet("phoenix").name);
console.log("find common-01 ->", findPet("common-01") && findPet("common-01").name);
console.log("find zzz ->", findPet("zzz"));
const bad = PETS.filter((p) => !p.id || !p.type || !p.strength || p.skills.length !== 4);
console.log("malformed:", bad.length);
