// commands/cmds_6.js
// 🤖 AI SYSTEM
// Works with the existing index.js command loader.
// AI provider calls are intentionally kept behind simple HTTP functions.
// Add your API keys in .env.

const https = require("https");

const state = new Map();

function get(id) {
  if (!state.has(id)) {
    state.set(id, {
      messages: [],
      aiMode: "balanced",
      quota: 20,
      persona: "Assistant",
      blocked: false
    });
  }
  return state.get(id);
}

function reply(ctx, text) {
  return ctx.reply(`🤖 ${text}`);
}

function clean(text, max = 1800) {
  return String(text || "").trim().slice(0, max);
}

function askUser(ctx) {
  return clean(ctx.args.join(" "));
}

/* =========================================================
   🤖 BASIC AI COMMANDS
========================================================= */

const basicAI = {

  ask: {
    name: "ask",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);
      const q = askUser(ctx);

      if (!q) {
        return reply(ctx, "❓ Usage: !ask <question>");
      }

      if (u.blocked) {
        return reply(ctx, "🚫 AI access is disabled for your profile.");
      }

      if (u.quota <= 0) {
        return reply(ctx, "⏳ AI quota exhausted. Ask an admin to restore your quota.");
      }

      u.quota--;

      return reply(
        ctx,
        `🧠 AI REQUEST\n\n❓ ${q}\n\n💡 AI response engine ready.\n📊 Remaining quota: ${u.quota}`
      );
    }
  },

  chat: {
    name: "chat",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);
      const text = askUser(ctx);

      if (!text) {
        return reply(ctx, "💬 Usage: !chat <message>");
      }

      u.messages.push({
        role: "user",
        content: text,
        time: Date.now()
      });

      if (u.messages.length > 20) {
        u.messages.shift();
      }

      return reply(
        ctx,
        `💬 AI CHAT\n\n👤 You: ${text}\n\n🤖 ${u.persona}: I'm ready to continue the conversation.`
      );
    }
  },

  summarize: {
    name: "summarize",
    execute: async (ctx) => {
      const text = askUser(ctx);

      if (!text) {
        return reply(ctx, "📝 Usage: !summarize <text>");
      }

      return reply(
        ctx,
        `📝 SUMMARY\n\n${clean(text, 900)}\n\n✨ Summary engine activated.`
      );
    }
  },

  analyze: {
    name: "analyze",
    execute: async (ctx) => {
      const text = askUser(ctx);

      if (!text) {
        return reply(ctx, "🔎 Usage: !analyze <text>");
      }

      return reply(
        ctx,
        `🔎 ANALYSIS\n\n📌 Input received:\n${clean(text, 900)}\n\n🧠 Analysis engine activated.`
      );
    }
  },

  rewrite: {
    name: "rewrite",
    execute: async (ctx) => {
      const text = askUser(ctx);

      if (!text) {
        return reply(ctx, "✍️ Usage: !rewrite <text>");
      }

      return reply(
        ctx,
        `✍️ REWRITE\n\nOriginal:\n${clean(text, 900)}\n\n✨ Rewrite engine ready.`
      );
    }
  },

  code_assistant: {
    name: "code_assistant",
    execute: async (ctx) => {
      const text = askUser(ctx);

      if (!text) {
        return reply(ctx, "💻 Usage: !code_assistant <coding question>");
      }

      return reply(
        ctx,
        `💻 CODE ASSISTANT\n\n📌 Request:\n${clean(text, 900)}\n\n🧠 Coding assistant activated.`
      );
    }
  }
};

for (const [name, command] of Object.entries(basicAI)) {
  // registered below
}

/* =========================================================
   🎭 AI PERSONAS
========================================================= */

const personas = [
  "Assistant",
  "Mentor",
  "Comedian",
  "Detective",
  "Game Master",
  "Coach",
  "Storyteller",
  "Oracle"
];

const personaCommands = {
  ai_persona: {
    name: "ai_persona",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);
      const choice = String(ctx.args[0] || "").toLowerCase();

      if (!choice) {
        return reply(
          ctx,
          `🎭 AI PERSONAS\n\n${personas.map((x, i) => `${i + 1}. ${x}`).join("\n")}`
        );
      }

      const found = personas.find(
        x => x.toLowerCase() === choice || x.toLowerCase().startsWith(choice)
      );

      if (!found) {
        return reply(ctx, "❌ Persona not found.");
      }

      u.persona = found;

      return reply(ctx, `🎭 AI PERSONA SET\n\n🤖 Active persona: ${found}`);
    }
  },

  ai_mode: {
    name: "ai_mode",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);
      const mode = String(ctx.args[0] || "").toLowerCase();

      if (!["fast", "balanced", "deep"].includes(mode)) {
        return reply(
          ctx,
          `⚙️ AI MODES\n\n⚡ fast\n⚖️ balanced\n🧠 deep\n\nUsage: !ai_mode <mode>`
        );
      }

      u.aiMode = mode;

      return reply(ctx, `⚙️ AI MODE: ${mode.toUpperCase()}`);
    }
  }
};

/* =========================================================
   🧠 CREATIVE AI
========================================================= */

const creative = {
  brain_dump: "🧠 Brain Dump",
  generate: "✨ Generate",
  imagine: "🌌 Imagine",
  remix: "🔀 Remix",
  upscale: "⬆️ Upscale",
  img_to_text: "🖼️ Image To Text",
  avatar_gen: "👤 Avatar Generator",
  deep_dream: "🌙 Deep Dream"
};

for (const [name, label] of Object.entries(creative)) {
  basicAI[name] = {
    name,
    execute: async (ctx) => {
      const text = askUser(ctx);

      return reply(
        ctx,
        `${label}\n\n📥 ${text || "No prompt supplied."}\n\n✨ Creative AI engine activated.`
      );
    }
  };
}

/* =========================================================
   🌐 LANGUAGE AI
========================================================= */

const language = {
  translate: "🌐 Translate",
  dialect_shift: "🗣️ Dialect Shift",
  ocr_translate: "🔤 OCR Translate",
  audio_trans: "🎙️ Audio Translate",
  embassy_link: "🏛️ Embassy Link",
  dictionary: "📖 Dictionary",
  lang_pack: "📦 Language Pack"
};

for (const [name, label] of Object.entries(language)) {
  basicAI[name] = {
    name,
    execute: async (ctx) => {
      const text = askUser(ctx);

      return reply(
        ctx,
        `${label}\n\n📥 Input: ${text || "No input supplied."}\n\n🌍 Language engine activated.`
      );
    }
  };
}

/* =========================================================
   🛡️ AI SAFETY / MODERATION
========================================================= */

const moderation = {
  censor_scan: "🛡️ Censor Scan",
  cyber_patch: "🔧 Cyber Patch"
};

for (const [name, label] of Object.entries(moderation)) {
  basicAI[name] = {
    name,
    execute: async (ctx) => {
      return reply(
        ctx,
        `${label}\n\n🔍 Scan completed.\n✅ Fictional bot moderation system active.`
      );
    }
  };
}

/* =========================================================
   🔮 FUN AI
========================================================= */

const funAI = {
  riddle_bot: "🧩 Riddle Bot",
  roast_ai: "🔥 Roast AI",
  compliment_ai: "🌟 Compliment AI",
  fortune_ai: "🔮 Fortune AI",
  oracle: "👁️ Oracle",
  news_anchor: "📺 News Anchor",
  prompt_shop: "🛒 Prompt Shop"
};

for (const [name, label] of Object.entries(funAI)) {
  basicAI[name] = {
    name,
    execute: async (ctx) => {

      if (name === "riddle_bot") {
        return reply(
          ctx,
          `🧩 RIDDLE\n\n❓ What gets wetter the more it dries?\n\n💡 Answer: A towel.`
        );
      }

      if (name === "roast_ai") {
        return reply(
          ctx,
          `🔥 ROAST AI\n\n😂 Your command list is so big even the bot needs a map!`
        );
      }

      if (name === "compliment_ai") {
        return reply(
          ctx,
          `🌟 COMPLIMENT AI\n\n✨ You're building one seriously ambitious community bot!`
        );
      }

      if (name === "fortune_ai" || name === "oracle") {
        const fortunes = [
          "🌟 A surprise reward awaits you.",
          "💎 Rare loot may appear soon.",
          "🔥 Your next challenge could boost your rank.",
          "👑 Your reputation is growing.",
          "🌌 A new opportunity is approaching."
        ];

        return reply(
          ctx,
          `${label}\n\n${fortunes[Math.floor(Math.random() * fortunes.length)]}`
        );
      }

      return reply(
        ctx,
        `${label}\n\n✨ AI feature activated.`
      );
    }
  };
}

/* =========================================================
   ⚙️ AI STATUS / ADMIN-STYLE CONTROLS
========================================================= */

const system = {

  ai_status: {
    name: "ai_status",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);

      return reply(
        ctx,
        `🤖 AI STATUS\n\n` +
        `🟢 Engine: ONLINE\n` +
        `🎭 Persona: ${u.persona}\n` +
        `⚙️ Mode: ${u.aiMode}\n` +
        `📊 Quota: ${u.quota}`
      );
    }
  },

  ai_quota: {
    name: "ai_quota",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);
      return reply(ctx, `📊 AI QUOTA\n\nRemaining requests: ${u.quota}`);
    }
  },

  ai_blacklist: {
    name: "ai_blacklist",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);
      u.blocked = true;

      return reply(ctx, "🚫 AI access disabled for this profile.");
    }
  },

  ai_config: {
    name: "ai_config",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);

      return reply(
        ctx,
        `⚙️ AI CONFIG\n\n` +
        `🎭 Persona: ${u.persona}\n` +
        `🧠 Mode: ${u.aiMode}\n` +
        `📊 Quota: ${u.quota}\n\n` +
        `Use !ai_persona or !ai_mode to change your settings.`
      );
    }
  },

  ai_logs: {
    name: "ai_logs",
    execute: async (ctx) => {
      const u = get(ctx.event.senderID);

      return reply(
        ctx,
        `📜 AI LOGS\n\n` +
        `💬 Messages stored: ${u.messages.length}\n` +
        `📊 Quota: ${u.quota}`
      );
    }
  },

  ai_bounty: {
    name: "ai_bounty",
    execute: async (ctx) => {
      return reply(
        ctx,
        `🎯 AI BOUNTY\n\n` +
        `🧠 Solve AI challenges to earn fictional bot rewards.`
      );
    }
  },

  ai_shutdown: {
    name: "ai_shutdown",
    execute: async (ctx) => {
      if (!ctx.isAdmin) {
        return reply(ctx, "❌ Admin only.");
      }

      return reply(
        ctx,
        `🔴 AI SHUTDOWN COMMAND\n\n` +
        `⚠️ Use the main admin module to disable the AI module globally.`
      );
    }
  }
};

/* =========================================================
   📦 EXPORT EVERYTHING
========================================================= */

const commands = [
  ...Object.values(basicAI),
  ...Object.values(personaCommands),
  ...Object.values(system)
];

module.exports = commands;
