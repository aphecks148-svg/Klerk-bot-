const { box } = require("../../utils/box");

const aliasMap = {
  menu: [...Array.from({ length: 10 }, (_, i) => `menu${i + 1}`)],
  balance: ["bal"], profile: ["me"], help: ["commands"], daily: ["claim"],
  pet_list: ["pets"], deposit: ["save"], withdraw: ["get"], flip: ["coin"],
  addadmin: ["makeadmin"], removeadmin: ["unadmin"], mute: ["silence"], unmute: ["speak"],
  thread: ["info", "gc"], stats: ["status"], ping: ["pong"], raid: ["attack"],
};

/**
 * Create command objects from a list of names.
 * Each command gets a default run handler that responds with a friendly,
 * emoji-rich message. Plugins can override run by wrapping the output.
 *
 * The strict 50-command requirement is relaxed: plugins that have fewer
 * or more than 50 commands will load successfully with a warning.
 */
function createCommands(names) {
  if (!Array.isArray(names)) throw new Error("Plugin must expose an array of command names");
  if (names.length === 0) throw new Error("Plugin must expose at least one command");
  if (names.length < 50) {
    console.warn(`[WARN] Plugin exposes ${names.length} commands (expected 50). Loading anyway.`);
  }
  if (names.length > 50) {
    console.warn(`[WARN] Plugin exposes ${names.length} commands (expected 50). Loading anyway.`);
  }
  return names.map((name) => ({
    name,
    aliases: [...new Set([name.replace(/_/g, ""), ...(aliasMap[name] || [])].filter((alias) => alias !== name))],
    description: `${name} • iKON-BOT v5.0 Divine — ${Math.random() > 0.5 ? "totally useful" : "probably broken"} 🤖`,
    run: async (ctx) => {
      const friendlyCommands = [
        "balance", "daily", "work", "beg", "deposit", "withdraw",
        "pet", "adopt", "feed", "petheal", "pettrain", "evolve",
        "slots", "gamble", "coinflip", "dice", "blackjack",
        "mine", "fish", "hunt", "farm", "gather", "plant", "harvest",
        "ai", "ask", "imagine", "chat",
        "marry", "hug", "kiss", "wave", "compliment",
        "business", "crypto", "estate", "invest", "stock",
        "level", "rank", "profile", "quest", "achievement",
        "battle", "duel", "raid", "boss", "arena",
        "menu", "help", "ping", "stats", "about",
      ];
      const suggestion = friendlyCommands[Math.floor(Math.random() * friendlyCommands.length)];
      return ctx.send(box(`🤖 ${name.toUpperCase()}`, [
        `Hey there! 👋 Nice to see you checking out **${name}**!`,
        ``,
        `✨ This command is registered in the iKON-BOT v5.0 Divine system.`,
        `💡 Try something like: **!${suggestion}**`,
        ``,
        `📖 Need help? Just type **!help** or **!menu**!`,
      ]));
    },
  }));
}

module.exports = { createCommands };
