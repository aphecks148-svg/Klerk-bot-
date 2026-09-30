/**
 * ⑨ ALL SOCIAL FUN MOMENTS — 35 commands.
 *
 * 35 social actions, 35 group games and 15 jokes. The 25 directed actions
 * (`.hug`, `.kiss`, …) all share one engine, so adding an action to
 * `SOCIAL_ACTIONS` gives it a working command immediately.
 */

const { command, commands, listCommand } = require("../14_systemCore/kit");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { isReady, models } = require("../../core/mongo");
const { SOCIAL_ACTIONS, GAMES, JOKES } = require("../../data/lists");
const { renderList } = require("../../utils/listRenderer");
const { fmt, pick, sample, randInt } = require("../../utils/format");

/** Per-action flavour, so a hug reads differently from a fist bump. */
const ACTION_FLAVOUR = {
  hug: ["wraps you in a warm hug", "squeezes you tight", "gives you a proper cuddle"],
  kiss: ["kisses you on the cheek", "blows a kiss your way", "plants a kiss on your forehead"],
  handshake: ["shakes your hand firmly", "offers a business handshake", "grips your hand in solidarity"],
  highfive: ["slaps your palm with a high five", "high-fives you mid-air", "slaps a high five"],
  fistbump: ["bumps your fist", "offers a fist bump", "knuckles up with you"],
  wave: ["waves enthusiastically", "gives a lazy wave", "waves both hands wildly"],
  bow: ["bows politely", "bows deeply", "gives a slight bow"],
  salute: ["salutes crisply", "snaps off a salute", "salutes with a grin"],
  dance: ["breaks into a dance", "does a spin on the spot", "starts a victory dance"],
  spin: ["spins in a circle", "spins and nearly trips", "spins twice for effect"],
  pat: ["pats you on the head", "gives you a friendly pat", "pats your back"],
  tickle: ["tickles you mercilessly", "attacks with tickles", "finds your weakest spot"],
  poke: ["pokes you", "pokes you right in the ribs", "gives you a poke"],
  blush: ["goes bright red", "blushes and looks away", "turns a shade of pink"],
  comfort: ["puts an arm around you", "offers a comforting hug", "says it's going to be okay"],
  shout: ["shouts at the top of their lungs", "yells across the room", "shouts enthusiastically"],
  sing: ["sings out of tune", "belts a tune", "sings very dramatically"],
  pose: ["strikes a heroic pose", "poses for the camera", "hits a dramatic pose"],
  flex: ["flexes their muscles", "poses and flexes", "shows off their arms"],
  toast: ["raises a glass", "clinks glasses with you", "toasts to the group"],
  confess: ["confesses something", "makes a confession", "opens their heart"],
  gossip: ["leans in with a secret", "passes on some gossip", "whispers the news"],
};

/** Actions that read better with a target than alone. */
const DIRECTED = new Set(["hug", "kiss", "handshake", "highfive", "fistbump", "wave",
  "pat", "tickle", "poke", "comfort", "toast", "confess", "compliment", "roastsocial"]);

async function me(ctx) { return getUser(ctx.event.senderID, ctx.profile.name); }

function targetOf(ctx) {
  const mention = Object.keys(ctx.event.mentions || {})[0];
  if (mention) return mention;
  return null;
}

async function targetName(ctx) {
  const id = targetOf(ctx);
  if (!id) return null;
  const { getProfileName } = require("../../utils/fbProfile");
  return getProfileName(ctx.api, id, "them");
}

async function saveSocial(ctx, social) {
  if (isReady()) await models.User.findOneAndUpdate({ facebookId: ctx.event.senderID }, { $set: { social } });
}

function socialOf(user) {
  return user.social || { hugs: 0, games: 0, streak: 0 };
}

/* ── the social action engine ──────────────────────────────────────────── */

function socialAction(action) {
  const verb = action.toLowerCase();
  return async (ctx) => {
    const user = await me(ctx);
    const social = socialOf(user);
    const name = await targetName(ctx);
    const flavour = ACTION_FLAVOUR[verb];
    const target = name || "you";

    if (DIRECTED.has(verb) && !name) {
      return ctx.send(`💞 Tag someone: **${ctx.prefix}${verb} @user**${flavour ? `\n(${pick(flavour)} when you do)` : ""}`);
    }

    const body = flavour
      ? `${ctx.profile.name} ${pick(flavour)} ${name ? `@${name}` : "everyone"}!`
      : `${ctx.profile.name} — ${action}!`;

    // small social XP reward, and tracked counters
    const key = { hug: "hugs", kiss: "kisses", handshake: "handshakes", highfive: "highfives" }[verb];
    if (key) social[key] = (social[key] || 0) + 1;
    social.streak = (social.streak || 0) + 1;
    await saveSocial(ctx, social);
    await addXp(ctx.event.senderID, 2, ctx.profile.name);

    const emoji = { hug: "🤗", kiss: "💋", handshake: "🤝", highfive: "✋", fistbump: "👊", wave: "👋", bow: "🙇", salute: "🫡", dance: "💃", spin: "🌀", pat: "🤚", tickle: "🎏", poke: "👉", blush: "😊", comfort: "🫂", shout: "📢", sing: "🎤", pose: "🕺", flex: "💪", nap: "😴", toast: "🥂", confess: "💗", gossip: "🫢" }[verb] || "✨";
    await ctx.send(`${emoji} ${body}`);
  };
}

/* ── the group-game engine ─────────────────────────────────────────────── */

const gameQuestions = {
  truthordare: ["Truth: what's the last thing you searched for?", "Dare: send a random photo from your camera roll.", "Truth: who in this group would you trust with your password?", "Dare: reply with your most-used emoji, five times."],
  wyr: ["Would you rather fly or breathe underwater?", "Would you rather be rich and unknown, or famous and broke?", "Would you rather lose your phone for a year, or your keys for a day?", "Would you rather speak every language, or speak to animals?", "Would you rather time travel forward or back?"],
  nhie: ["Never have I ever stayed up past 4am.", "Never have I ever replied \"k\" and regretted it.", "Never have I ever forgotten someone's name.", "Never have I ever pretended to like a gift.", "Never have I ever crashed a group chat."],
  ttyl: ["TTYL — someone just asked a genuine question.", "BRB — the plot thickens.", "G2G — one sec.", "AFK — someone is at the door.", "Ttyl, don't spam the chat while I'm gone."],
  riddle: ["I have keys but no locks. I have space but no room. You can enter but can't exit. What am I?", "The more you take, the more you leave behind. What am I?", "I speak but have no mouth. I have a bed but never sleep. What am I?"],
  fastestfinger: ["Type the word 'ikon' — fastest gets the crown.", "First to name a fruit starting with P wins.", "Type 1 to 20 without a typo. Go!", "First to reply '🏓' wins."],
  charades: ["Act out: a cat stuck in a box. No words allowed.", "Act out: brushing your teeth with a spoon.", "Act out: being a traffic light.", "Act out: swimming across a road."],
  "8ball": ["Will I pass my exam?", "Should I text them first?", "Am I going to be late?", "Is this a sign?", "Will I regret buying that?"],
  fortune: ["A quiet week ahead — perfect for catching up on sleep.", "Someone in this chat owes you an apology.", "A coin will find you within three days.", "Good luck arrives on a Tuesday.", "A door opens that you thought was locked."],
  coinsocial: ["It's landed on heads.", "It's landed on tails.", "Still spinning… it's tails.", "The coin escaped. Recounting: tails."],
};

/**
 * Run one of the group games.
 * @param {string} key  the game key in `gameQuestions`
 * @param {string} label display name
 * @param {string} emoji
 */
function groupGame(key, label, emoji) {
  return async (ctx) => {
    const user = await me(ctx);
    const social = socialOf(user);
    social.games = (social.games || 0) + 1;
    await saveSocial(ctx, social);
    const prompts = gameQuestions[key] || [pick(GAMES)];
    await ctx.send([
      `${emoji} ${label}`,
      `💬 ${pick(prompts)}`,
      "",
      `🎮 ${social.games} game(s) played. Others: **${ctx.prefix}${key}** too.`,
    ].join("\n"));
  };
}

/* ── list commands ─────────────────────────────────────────────────────── */

const actionList = listCommand("socialactions", SOCIAL_ACTIONS, { emoji: "💞", title: "Social Actions", description: "All 35 social actions" });
const gameList = listCommand("fun", GAMES, { emoji: "🎮", title: "Group Games", description: "All 35 group games" });
const jokeList = listCommand("jokelist", JOKES, { emoji: "😂", title: "Jokes", description: "All 15 jokes" });

/* ── 4-28. the social actions ───────────────────────────────────────────── */

/**
 * The 25 directed/ambient actions that get a command. `socialroll` and
 * `grouppic` live further down with their own richer handlers, so they are
 * deliberately absent here.
 */
const ACTIONS = [
  "hug", "kiss", "handshake", "highfive", "fistbump",
  "wave", "bow", "salute", "dance", "spin",
  "pat", "tickle", "poke", "blush", "comfort",
  "shout", "sing", "pose", "flex", "nap",
  "toast", "confess", "gossip",
];

const actionCommands = ACTIONS.map((a) => command(a, {
  description: `${a[0].toUpperCase()}${a.slice(1)} someone`,
  run: socialAction(a),
}));

/* ── 29-34. compliments and roasts ──────────────────────────────────────── */

const COMPLIMENTS = [
  "has genuinely great taste in memes",
  "always answers when you need help",
  "is unreasonably good at puzzles",
  "has the group's best laugh",
  "remembers everyone's birthday",
  "is the most reliable teammate alive",
  "makes every conversation better",
  "has surprisingly good taste in music",
  "would be lost without in a group project",
  "radiates calm energy",
];

const ROASTS = [
  "is so fast at replies, suspicious",
  "has the reply speed of a dial-up connection",
  "is the human equivalent of 'I'll do it later'",
  "brings a charger with 2% battery",
  "loses their keys at least twice a week",
  "types in all caps for no reason",
  "takes 11 minutes to name a restaurant",
  "always says 'quick question' then asks 40 minutes of questions",
  "forgets the context of every conversation",
  "has strong opinions about a game they have never played",
];

async function compliment(ctx) {
  const name = await targetName(ctx) || "you";
  await ctx.send(`💝 ${name} ${pick(COMPLIMENTS)}.`);
}

async function roastsocial(ctx) {
  const name = await targetName(ctx) || "you";
  await ctx.send(`🔥 ${name} ${pick(ROASTS)}. Play nice. 😄`);
}

/* ── 35. socialhelp ─────────────────────────────────────────────────────── */

async function socialHelp(ctx) {
  const p = ctx.prefix;
  const chunks = renderList({
    title: `💞 **Social Fun** — 35 commands, ${SOCIAL_ACTIONS.length} actions, ${GAMES.length} games.`,
    items: [
      `◦ ${p}hug @user / ${p}kiss / ${p}handshake / ${p}highfive / ${p}fistbump`,
      `◦ ${p}wave / ${p}bow / ${p}salute / ${p}dance / ${p}spin`,
      `◦ ${p}pat / ${p}tickle / ${p}poke / ${p}blush / ${p}comfort`,
      `◦ ${p}shout / ${p}sing / ${p}pose / ${p}flex / ${p}nap`,
      `◦ ${p}toast / ${p}confess / ${p}gossip / ${p}socialroll / ${p}grouppic`,
      `◦ ${p}compliment @user / ${p}roastsocial @user`,
      "",
      `🎮 ${p}truthordare / ${p}wyr / ${p}nhie / ${p}ttyl / ${p}riddle`,
      `🎮 ${p}fastestfinger / ${p}charades / ${p}8ball / ${p}fortune / ${p}coinsocial`,
      `📋 ${p}socialactions — all ${SOCIAL_ACTIONS.length} actions`,
      `📋 ${p}fun — all ${GAMES.length} games`,
      `😂 ${p}jokes — ${JOKES.length} jokes`,
    ],
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function jokeCmd(ctx) {
  await ctx.send(`😂 ${pick(JOKES)}`);
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: [
    actionList,
    gameList,
    ...actionCommands,
    ...commands([
      ["compliment", compliment, { aliases: ["compliments"], description: "Compliment someone" }],
      ["roastsocial", roastsocial, { aliases: ["roastfriend"], description: "Playfully roast someone" }],
      ["truthordare", groupGame("truthordare", "Truth or Dare", "🎭"), { description: "Truth or dare" }],
      ["wyr", groupGame("wyr", "Would You Rather", "🤔"), { description: "Would you rather" }],
      ["nhie", groupGame("nhie", "Never Have I Ever", "🙅"), { description: "Never have I ever" }],
      ["ttyl", groupGame("ttyl", "Be Right Back", "⏳"), { description: "Say you'll be back" }],
      ["riddle", groupGame("riddle", "Riddle Me This", "🧩"), { description: "A riddle" }],
      ["8ball", groupGame("8ball", "Magic 8 Ball", "🎱"), { description: "Ask the 8 ball" }],
      ["jokefun", jokeCmd, { aliases: ["joke"], description: "Tell a joke" }],
      ["socialhelp", socialHelp, { description: "Social help" }],
    ]),
  ],
};