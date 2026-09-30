const fs = require("fs");
const path = require("path");
const { loadPlugins, getRegistry } = require("../bot/core/loader");

loadPlugins(path.join(__dirname, "..", "bot", "plugins"));
const reg = getRegistry();

const TARGETS = {
  petLabs: 50, financeVault: 40, crimeGta: 40, casinoArcade: 45,
  adminPolice: 20, warzone: 25, aiSystems: 30, gather: 20, socialFun: 35,
  businessCryptoEstate: 35, levelRank: 20, inventoryCraft: 25,
  eventsWorld: 25, systemCore: 20,
};

let fail = 0;
for (const cat of reg.categories) {
  const target = TARGETS[cat.key];
  const n = cat.commands.length;
  const ok = n === target;
  if (!ok) fail++;
  console.log(`${ok ? "OK " : "BAD"} ${cat.key.padEnd(24)} target=${target} actual=${n}`);
}

// cross-plugin name collisions (loader map is flat — last wins)
const owners = new Map();
for (const cat of reg.categories) {
  for (const c of cat.commands) {
    for (const n of [c.name, ...(c.aliases || [])]) {
      const k = String(n).toLowerCase();
      if (owners.has(k)) {
        console.log(`COLLISION "${k}": ${owners.get(k)} (${cat.key})`);
        fail++;
      }
      owners.set(k, cat.key);
    }
  }
}

// every command must have a run handler
const noRun = [];
for (const c of reg.commands.values()) if (typeof c.run !== "function") noRun.push(c.name);
if (noRun.length) { console.log("NO HANDLER:", noRun.slice(0, 20)); fail++; }

console.log(`\ntotal: ${reg.totalCommands} commands, ${reg.categories.length} categories, ${owners.size} unique names, ${fail} problems`);
process.exit(fail ? 1 : 0);
