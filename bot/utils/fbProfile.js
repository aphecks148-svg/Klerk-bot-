/**
 * Facebook profile picture fetcher.
 *
 * ws3-fca's getUserInfo is unreliable for profile images (it frequently returns
 * an empty `thumbSrc` for people it hasn't cached), so this module tries three
 * sources in order:
 *
 *   1. ws3-fca `getUserInfo`        — fastest, already authenticated
 *   2. mbasic.facebook.com profile  — public HTML, no auth
 *   3. graph.facebook.com picture   — public redirect, no auth
 *
 * Everything is cached in-process for a while, because both the HTML and graph
 * sources hit the network and welcome/leave messages run on every join event.
 */

const axios = require("axios");

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Map();

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function cacheGet(id) {
  const hit = cache.get(String(id));
  if (!hit) return null;
  if (Date.now() > hit.expires) { cache.delete(String(id)); return null; }
  return hit.value;
}

function cacheSet(id, value) {
  if (!value) return value;
  cache.set(String(id), { value, expires: Date.now() + CACHE_TTL });
  return value;
}

/** Normalise any of the several FB url shapes down to a direct image link. */
function normalisePictureUrl(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/(https?:\/\/[^"'\s)]+)/);
  const found = match ? match[1] : url;
  if (!/^https?:\/\//i.test(found)) return null;
  if (/\/photo\.php|\/photo\?|\/profile\.php/.test(found)) {
    const id = (found.match(/id=(\d+)/) || [])[1];
    return id ? `https://graph.facebook.com/${id}/picture?width=640&height=640` : null;
  }
  return found;
}

/** Source 3 — graph.facebook.com. Cheap, public, no auth needed. */
function fromGraph(userId) {
  return `https://graph.facebook.com/${userId}/picture?width=640&height=640`;
}

/** Source 2 — scrape the mbasic profile page for the og:image tag. */
async function fromMbasic(userId) {
  try {
    const res = await axios.get(`https://mbasic.facebook.com/profile.php?id=${userId}`, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 6000,
      maxRedirects: 3,
      validateStatus: (s) => s < 400,
    });
    const html = String(res.data || "");
    const og = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
    return og ? normalisePictureUrl(og[1]) : null;
  } catch (_) {
    return null;
  }
}

/** Source 1 — ask ws3-fca, which is authenticated and therefore the best one. */
function fromApi(api, userId) {
  return new Promise((resolve) => {
    if (!api || typeof api.getUserInfo !== "function") return resolve(null);
    let settled = false;
    const done = (value) => { if (!settled) { settled = true; resolve(value || null); } };
    const timer = setTimeout(() => done(null), 5000);
    try {
      api.getUserInfo(userId, (error, info) => {
        clearTimeout(timer);
        if (error || !info) return done(null);
        const user = info[userId] || info[String(userId)];
        if (!user) return done(null);
        done(normalisePictureUrl(user.thumbSrc || user.profileUrl || user.imageSrc || ""));
      });
    } catch (_) {
      clearTimeout(timer);
      done(null);
    }
  });
}

/**
 * Resolve a user's display name and profile picture.
 *
 * @param {object} api     the ws3-fca api (may be null)
 * @param {string} userId  numeric facebook user id
 * @param {string} fallbackName  used when the name cannot be resolved
 * @returns {Promise<{ name: string, picture: string|null, id: string }>}
 */
async function getProfileInfo(api, userId, fallbackName = "Facebook user") {
  const id = String(userId || "");
  if (!id) return { name: fallbackName, picture: null, id: "" };

  const cached = cacheGet(id);
  if (cached) return { ...cached, id };

  let name = fallbackName;
  let picture = null;

  if (api && typeof api.getUserInfo === "function") {
    picture = await fromApi(api, id);
    const info = await new Promise((resolve) => {
      try {
        api.getUserInfo(id, (error, data) => resolve(error || !data ? null : data[id] || data[String(id)] || null));
      } catch (_) { resolve(null); }
    });
    if (info && info.name) name = info.name;
  }

  if (!picture) picture = await fromMbasic(id);
  if (!picture) picture = fromGraph(id);

  const value = { name, picture };
  cacheSet(id, value);
  return { ...value, id };
}

/** Just the picture URL, or null. */
async function getProfilePicture(api, userId) {
  const info = await getProfileInfo(api, userId);
  return info.picture || null;
}

/** Just the display name. */
async function getProfileName(api, userId, fallback = "Facebook user") {
  const info = await getProfileInfo(api, userId, fallback);
  return info.name;
}

/** Download a profile picture as a PNG-sized buffer via canvas, for image sends. */
async function getProfilePictureBuffer(api, userId, size = 640) {
  const url = await getProfilePicture(api, userId);
  if (!url) return null;
  const { safeRequire } = require("../core/safeRequire");
  const canvasMod = safeRequire("./canvas", "canvas");
  if (!canvasMod.ok) return null;
  try {
    const image = await canvasMod.value.imageFromUrl(url);
    if (!image) return null;
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const scale = Math.max(size / image.width, size / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toBuffer("image/png");
  } catch (_) {
    return null;
  }
}

function clearCache() {
  cache.clear();
}

module.exports = {
  getProfileInfo,
  getProfilePicture,
  getProfilePictureBuffer,
  getProfileName,
  normalisePictureUrl,
  clearCache,
};
