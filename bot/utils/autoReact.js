const categoryEmoji = {
  petLabs: "🐾", financeVault: "💰", crimeGta: "🔫", casinoArcade: "🎰",
  adminPolice: "🛡️", warzone: "⚔️", aiSystems: "🤖", gather: "🌾",
  socialFun: "💞", businessCryptoEstate: "📈", levelRank: "🏆",
  inventoryCraft: "🎒", eventsWorld: "🌍", systemCore: "⚙️",
};
let enabled = true;

async function react(api, event, emoji) {
  if (!enabled || !api || typeof api.setMessageReaction !== "function") return;
  try {
    if (typeof api.setMessageReactionMqtt === "function") api.setMessageReactionMqtt(emoji, event.messageID, event.threadID);
    else api.setMessageReaction(emoji, event.messageID, () => {});
  } catch (_) {}
}

function categoryReaction(category) {
  return categoryEmoji[category] || "✅";
}

function setEnabled(value) { enabled = Boolean(value); }
function isEnabled() { return enabled; }

module.exports = { react, categoryReaction, setEnabled, isEnabled };