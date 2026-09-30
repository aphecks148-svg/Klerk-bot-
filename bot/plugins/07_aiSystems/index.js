/**
 * ⑦ ALL AI SYSTEMS — 30 commands.
 *
 * Sixteen models, sixteen personas and sixteen prompt styles. Everything that
 * actually calls Gemini funnels through `askGemini()` so a missing GEMINI_KEY
 * produces one clear message rather than fifteen different failures.
 */

const { command, commands, listCommand } = require("../14_systemCore/kit");
const { getUser, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { AI_MODELS, AI_PERSONAS, AI_PROMPTS } = require("../../data/lists");
const { geminiCall } = require("../../core/actions");
const { translate } = require("../../utils/helpers");
const { renderList } = require("../../utils/listRenderer");
const { fmt, pick, randInt } = require("../../utils/format");

const MAX_CHARS = 1800;

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

/* ── persona state (per user) ──────────────────────────────────────────── */

function personaOf(user) {
  return (user.ai && user.ai.persona) || "Sarcastic";
}

async function savePersona(ctx, persona) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { "ai.persona": persona } });
}

/* ── the single Gemini entry point ─────────────────────────────────────── */

/**
 * Ask Gemini, applying the caller's persona, and send the reply.
 * Never throws — every failure becomes a readable message.
 */
async function askGemini(ctx, prompt, { persona = null, prefixLabel = "🤖", maxTokens = 800 } = {}) {
  const user = await me(ctx);
  const tone = persona || personaOf(user);
  const system = `You are iKON-BOT. Answer in under 120 words unless asked for more. Your persona right now is: ${tone}. Stay in character.`;
  const userPrompt = `${system}\n\n${prompt}`;
  await ctx.send("🤖 Thinking…");
  try {
    const reply = await geminiCall(userPrompt, maxTokens);
    await addXp(ctx.event.senderID, 3, ctx.profile.name);
    await ctx.send(`${prefixLabel} ${reply.slice(0, MAX_CHARS)}`);
  } catch (error) {
    await ctx.send(`⚠️ ${error.message}\n\n💡 Set GEMINI_KEY in the environment to enable AI features.`);
  }
}

/* ── the list commands ─────────────────────────────────────────────────── */

const modelList = listCommand("modellist", AI_MODELS, { emoji: "🧠", title: "AI Models", description: "All 16 models" });
const personaList = listCommand("personalist", AI_PERSONAS, { emoji: "🎭", title: "AI Personas", description: "All 16 personas" });
const promptList = listCommand("promptlist", AI_PROMPTS, { emoji: "💬", title: "Prompt Styles", description: "All 16 prompt styles" });

/* ── 4. ai / 5. ask / 6. chat ───────────────────────────────────────────── */

async function ai(ctx) {
  const prompt = ctx.args.join(" ").trim();
  if (!prompt) return ctx.send(`Usage: **${ctx.prefix}ai [your question]**\nPersona: ${personaOf(await me(ctx))} — change with **${ctx.prefix}setpersona**`);
  return askGemini(ctx, prompt, { prefixLabel: "🤖" });
}

async function ask(ctx) {
  const prompt = ctx.args.join(" ").trim();
  if (!prompt) return ctx.send(`Usage: **${ctx.prefix}ask [question]**`);
  return askGemini(ctx, prompt, { prefixLabel: "💡" });
}

async function chat(ctx) {
  const prompt = ctx.args.join(" ").trim();
  if (!prompt) return ctx.send(`Start a conversation — say something and I'll answer.`);
  return askGemini(ctx, prompt, { prefixLabel: "💬", maxTokens: 1000 });
}

/* ── 7. imagine / 8. describe ──────────────────────────────────────────── */

async function imagine(ctx) {
  const prompt = ctx.args.join(" ").trim();
  if (!prompt) return ctx.send(`Usage: **${ctx.prefix}imagine [what to picture]**`);
  return askGemini(ctx, `Describe in vivid detail, in 60 words, the image: ${prompt}`, { prefixLabel: "🎨" });
}

async function describe(ctx) {
  const target = Object.keys(ctx.event.mentions || {})[0];
  if (!target && !ctx.args.length) {
    return ctx.send(`Usage: **${ctx.prefix}describe @user** — describes the tagged person, or **${ctx.prefix}describe [thing]**.`);
  }
  if (target) {
    const info = require("../../utils/fbProfile").getProfileName(ctx.api, target, "someone");
    const name = await info;
    return askGemini(ctx, `Describe what a person's profile picture might suggest about them. Their name is ${name}. Be playful, never insulting.`, { prefixLabel: "👤" });
  }
  return askGemini(ctx, `Describe: ${ctx.args.join(" ")}`, { prefixLabel: "👁️" });
}

/* ── 9-13. text utilities ───────────────────────────────────────────────── */

async function summarize(ctx) {
  const text = ctx.args.join(" ").trim();
  if (!text) return ctx.send(`Usage: **${ctx.prefix}summarize [text]** (or reply to a message with it)`);
  return askGemini(ctx, `Summarise this in exactly 3 bullet points:\n\n${text}`, { prefixLabel: "📋" });
}

async function explain(ctx) {
  const topic = ctx.args.join(" ").trim();
  if (!topic) return ctx.send(`Usage: **${ctx.prefix}explain [topic]**`);
  return askGemini(ctx, `Explain "${topic}" as if to a 12-year-old, in 3 short sentences.`, { prefixLabel: "📖" });
}

async function rewrite(ctx) {
  const text = ctx.args.join(" ").trim();
  if (!text) return ctx.send(`Usage: **${ctx.prefix}rewrite [text]**`);
  return askGemini(ctx, `Rewrite this more clearly and briefly, keeping the meaning:\n\n${text}`, { prefixLabel: "✍️" });
}

async function aijoke(ctx) {
  const user = await me(ctx);
  const persona = personaOf(user);
  return askGemini(ctx, `Tell me one short joke. Your persona is ${persona}. No preamble.`, { prefixLabel: "😂" });
}

async function story(ctx) {
  const prompt = ctx.args.join(" ").trim() || "a bot that learns to dance";
  return askGemini(ctx, `Write a 4-sentence story about: ${prompt}`, { prefixLabel: "📖", maxTokens: 600 });
}

async function poem(ctx) {
  const topic = ctx.args.join(" ").trim() || "the internet";
  return askGemini(ctx, `Write a 4-line poem about ${topic}. No title.`, { prefixLabel: "🎋" });
}

async function sayit(ctx) {
  const text = ctx.args.join(" ").trim();
  if (!text) return ctx.send(`Usage: **${ctx.prefix}sayit [text]** — makes it sound dramatic.`);
  return askGemini(ctx, `Rewrite this dramatically, over the top, in 2 sentences:\n\n${text}`, { prefixLabel: "📣" });
}

async function roast(ctx) {
  const target = Object.keys(ctx.event.mentions || {})[0];
  const name = target ? await require("../../utils/fbProfile").getProfileName(ctx.api, target, "them") : "me";
  return askGemini(ctx, `Write one gentle, playful one-sentence roast for ${name}. Harmless, no real insult.`, { prefixLabel: "🔥" });
}

/* ── 14-16. persona controls ────────────────────────────────────────────── */

async function persona(ctx) {
  const user = await me(ctx);
  await ctx.send(`🎭 Your persona: **${personaOf(user)}**\nChange it: **${ctx.prefix}setpersona [name]**\nAll personas: **${ctx.prefix}personalist**`);
}

async function setPersona(ctx) {
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) return persona(ctx);
  const persona = AI_PERSONAS.find((p) => p.toLowerCase() === query)
    || AI_PERSONAS.find((p) => p.toLowerCase().includes(query));
  if (!persona) return ctx.send(`❓ No persona called "${ctx.args.join(" ")}". Try **${ctx.prefix}personalist**.`);
  await savePersona(ctx, persona);
  await ctx.send(`🎭 Persona set to **${persona}**. ${pick(["This should be fun.", "Let's see how this goes.", "Character established."])}`);
}

async function aiclear(ctx) {
  await savePersona(ctx, "Sarcastic");
  await ctx.send("🧹 Persona reset to Sarcastic. Fresh start.");
}

/* ── 17-20. the extra systems ───────────────────────────────────────────── */

async function aiModels(ctx) {
  const user = await me(ctx);
  await ctx.send([
    "🧠 AI Systems",
    `Model: Gemini 2.5 Flash`,
    `Persona: ${personaOf(user)}`,
    `Available models: ${AI_MODELS.length}`,
    `Key: ${process.env.GEMINI_KEY ? "✅ configured" : "❌ missing"}`,
  ].join("\n"));
}

async function aiSystem(ctx) {
  const chunks = renderList({
    title: "🤖 AI Systems overview",
    items: [
      `🧠 Models — ${AI_MODELS.length} available (see modellist)`,
      `🎭 Personas — ${AI_PERSONAS.length} (see personalist)`,
      `💬 Prompt styles — ${AI_PROMPTS.length} (see promptlist)`,
      `🔑 Backend — Gemini 2.5 Flash`,
      `📏 Max reply — ${MAX_CHARS} characters`,
      `⚡ Cooldown — 5s per AI command`,
    ],
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function dalle(ctx) {
  const prompt = ctx.args.join(" ").trim();
  if (!prompt) return ctx.send(`Usage: **${ctx.prefix}dalle [image prompt]**`);
  await ctx.send("🎨 Image models aren't wired to a key yet. Use **" + ctx.prefix + "imagine** for a text description instead.");
}

async function remix(ctx) {
  const text = ctx.args.join(" ").trim();
  if (!text) return ctx.send(`Usage: **${ctx.prefix}remix [text]** — remixes it into a new style.`);
  const styles = ["a pirate", "a robot", "a nature documentary narrator", "a 1920s radio host", "a game show announcer"];
  return askGemini(ctx, `Rewrite this in the voice of ${pick(styles)}, in 2 sentences:\n\n${text}`, { prefixLabel: "🎛️" });
}

async function aivideo(ctx) {
  await ctx.send("🎬 Video generation needs a separate key. Use **" + ctx.prefix + "imagine** for a written scene instead.");
}

/* ── 21-24. dev tools ───────────────────────────────────────────────────── */

async function code(ctx) {
  const task = ctx.args.join(" ").trim();
  if (!task) return ctx.send(`Usage: **${ctx.prefix}code [what you need]**`);
  return askGemini(ctx, `Write working code for this task. Output code only, no explanation:\n\n${task}`, { prefixLabel: "💻", maxTokens: 1200 });
}

async function debug(ctx) {
  const snippet = ctx.args.join(" ").trim();
  if (!snippet) return ctx.send(`Usage: **${ctx.prefix}debug [code]**`);
  return askGemini(ctx, `Find the bug in this code and give the fixed version. Be brief:\n\n${snippet}`, { prefixLabel: "🐛", maxTokens: 1200 });
}

async function regexCmd(ctx) {
  const pattern = ctx.args.join(" ").trim();
  if (!pattern) return ctx.send(`Usage: **${ctx.prefix}regex [pattern]** — suggests matching patterns.`);
  return askGemini(ctx, `Suggest 3 useful regular expressions related to "${pattern}". Give each with a one-line explanation.`, { prefixLabel: "🔤" });
}

/* ── 25. translate — re-exported so every AI command lives in one place ──── */

async function translateCmd(ctx) {
  const args = ctx.args;
  const isLang = (t) => /^[a-z]{2}$/i.test(String(t || ""));
  const target = isLang(args[0]) ? args[0] : "en";
  const text = (isLang(args[0]) ? args.slice(1) : args).join(" ");
  if (!text) return ctx.send(`Usage: **${ctx.prefix}translate [lang] [text]**`);
  await ctx.send(`🌐 ${await translate(text, target)}`);
}

/* ── 26. aistats / 27. aihelp ───────────────────────────────────────────── */

async function aiStats(ctx) {
  const user = await me(ctx);
  await ctx.send([
    "📊 AI stats",
    `🎭 Persona: ${personaOf(user)}`,
    `⭐ Level: ${user.level || 1} (XP ${fmt(user.xp || 0)})`,
    `🔑 API key: ${process.env.GEMINI_KEY ? "configured" : "missing"}`,
    `🤖 Model: Gemini 2.5 Flash`,
    `💬 Persona presets: ${AI_PERSONAS.length}`,
  ].join("\n"));
}

async function aiHelp(ctx) {
  const p = ctx.prefix;
  await ctx.send([
    `🤖 **AI Systems** — 30 commands.`,
    `◦ ${p}ai / ${p}ask / ${p}chat — ask anything`,
    `◦ ${p}imagine / ${p}dalle / ${p}aivideo — visual prompts`,
    `◦ ${p}summarize / ${p}explain / ${p}rewrite / ${p}remix — text tools`,
    `◦ ${p}story / ${p}poem / ${p}sayit / ${p}roast / ${p}joke — creative`,
    `◦ ${p}code / ${p}debug / ${p}regex — dev tools`,
    `◦ ${p}translate [lang] [text] — translation`,
    `◦ ${p}persona / ${p}setpersona [name] / ${p}aiclear — persona control`,
    `◦ ${p}modellist / ${p}personalist / ${p}promptlist — the full lists`,
    `◦ ${p}aistats / ${p}aisystem / ${p}aihelp — info`,
  ].join("\n"));
}

/* ── 28-30. extra game-style AI commands ────────────────────────────────── */

async function aimodelsDetail(ctx) {
  const chunks = renderList({
    title: "🧠 All AI models (detail)",
    items: AI_MODELS.map((m, i) => `${m} — tier ${i < 5 ? "core" : i < 11 ? "advanced" : "flagship"}`),
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function promptRandom(ctx) {
  const style = pick(AI_PROMPTS);
  await ctx.send(`💬 Random prompt style: **${style}**\nTry: **${ctx.prefix}ai <your text>** in that style.`);
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    modelList,
    personaList,
    promptList,
    ...commands([
      ["ai", ai, { cooldown: 5, description: "Ask the AI" }],
      ["ask", ask, { cooldown: 5, description: "Ask a question" }],
      ["chat", chat, { cooldown: 5, description: "Chat with the AI" }],
      ["imagine", imagine, { cooldown: 5, description: "Visualise a prompt" }],
      ["describe", describe, { cooldown: 5, description: "Describe something" }],
      ["summarize", summarize, { cooldown: 5, description: "Summarise text" }],
      ["explain", explain, { cooldown: 5, description: "Explain a topic" }],
      ["rewrite", rewrite, { cooldown: 5, description: "Rewrite text" }],
      ["aijoke", aijoke, { cooldown: 5, description: "Tell a joke" }],
      ["story", story, { cooldown: 5, description: "Write a story" }],
      ["poem", poem, { cooldown: 5, description: "Write a poem" }],
      ["sayit", sayit, { cooldown: 5, description: "Make it dramatic" }],
      ["roast", roast, { cooldown: 5, description: "Gentle roast" }],
      ["persona", persona, { description: "Your AI persona" }],
      ["setpersona", setPersona, { description: "Change persona" }],
      ["aiclear", aiclear, { description: "Reset persona" }],
      ["aimodels", aiModels, { description: "AI model info" }],
      ["aisystem", aiSystem, { description: "AI systems overview" }],
      ["dalle", dalle, { cooldown: 5, description: "Image prompt" }],
      ["remix", remix, { cooldown: 5, description: "Remix text" }],
      ["aivideo", aivideo, { cooldown: 5, description: "Video prompt" }],
      ["code", code, { cooldown: 5, description: "Generate code" }],
      ["debug", debug, { cooldown: 5, description: "Debug code" }],
      ["regex", regexCmd, { cooldown: 5, description: "Suggest regexes" }],
      ["translate", translateCmd, { cooldown: 5, aliases: ["tr"], description: "Translate text" }],
      ["aistats", aiStats, { description: "AI stats" }],
      ["aihelp", aiHelp, { description: "AI help" }],
    ]),
  ],
};
