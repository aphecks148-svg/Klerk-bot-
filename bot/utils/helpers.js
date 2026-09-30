const axios = require("axios");

const emojis = {
  pet: "🐾", money: "💰", ai: "🤖", crime: "🔫", casino: "🎰", admin: "🛡️",
  level: "📈", quest: "📋", task: "✅", crypto: "💰", stock: "📊", trade: "🔄",
  bank: "🏦", invite: "👋", leave: "👋‍♂️", mute: "🔇", unmute: "🔊", football: "⚽",
  pinterest: "📌", download: "⬇️", translate: "🌐", lyrics: "🎵", sing: "🎤",
  spy: "🕵️", hack: "💻", pokemon: "🔴", info: "ℹ️", stats: "📊", ping: "🏓",
  uid: "🆔", thread: "📧", error: "⚠️", cool: "⏱️", success: "✅", warning: "⚠️",
};

const jokes = [
  "I'm not just a bot, I'm a very expensive paperweight if you're offline 🤖",
  "Did you know? I'm cooler than my database connection 🧊",
  "Error 404: Your gaming skills not found 👾",
  "I'm fluent in 127 languages: all of them confused 🤯",
  "Warning: Do not feed the bot after midnight 🌙",
  "My code is like a good joke - nobody laughs until I explain it 😅",
  "I've seen things you wouldn't believe 👀",
  "AI? More like... A.I.nnoyed at your request 😤",
];

function getEmoji(cat) { return emojis[cat] || "🤖"; }
function getJoke() { return jokes[Math.floor(Math.random() * jokes.length)]; }

function getMention(ctx) {
  const mention = ctx.event.mentions && Object.keys(ctx.event.mentions)[0];
  return mention || ctx.args[0] || ctx.event.senderID;
}

async function translate(text, targetLang = "en") {
  try {
    const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`, { timeout: 5000 });
    return res.data.responseData.translatedText || text;
  } catch { return text; }
}

async function getLyrics(artist, song) {
  try {
    const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`, { timeout: 5000 });
    const lyrics = res.data.lyrics;
    return lyrics.slice(0, 500) + (lyrics.length > 500 ? "..." : "");
  } catch { return "Lyrics not found 🎵"; }
}

async function downloadVideo(url) {
  return `📥 Video processing... (feature requires external API setup)`;
}

async function getPinterest(query) {
  return `📌 Pinterest results for "${query}" (feature requires external API setup)`;
}

async function getFootballUpdates() {
  try {
    const res = await axios.get(`https://api.api-football.com/v3/fixtures?live=all`, {
      headers: { "x-rapidapi-key": process.env.FOOTBALL_API_KEY || "" },
      timeout: 5000
    });
    return res.data.response.slice(0, 3);
  } catch { return null; }
}

module.exports = { emojis, jokes, getEmoji, getJoke, getMention, translate, getLyrics, downloadVideo, getPinterest, getFootballUpdates };
