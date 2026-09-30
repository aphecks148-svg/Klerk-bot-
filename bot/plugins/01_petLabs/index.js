/**
 * ① ALL PETS & BEASTS — 50 commands.
 *
 * `.petlist` is the centrepiece: it renders every one of the 50 pets with its
 * picture, a strength bar, its name and its type, paginated across as many
 * messages as Messenger needs.
 */

const { command, commands } = require("../14_systemCore/kit");
const { PETS, RARITIES, petsByRarity, findPet } = require("../../data/pets");
const { PET_TYPES, PET_FOOD, PET_TOYS, PET_SKILLS_TREE } = require("../../data/lists");
const { getUser, adjustMoney, addXp } = require("../../utils/economy");
const { setUserPets } = require("../../core/actions");
const { renderTable, renderList } = require("../../utils/listRenderer");
const { fmt, bar, titleCase, pick, randInt, parseAmount, sample } = require("../../utils/format");

const MAX_ROSTER = 20;

/* ── shared state helpers ──────────────────────────────────────────────── */

async function me(ctx) {
  return getUser(ctx.event.senderID, ctx.profile.name);
}

async function saveRoster(ctx, pets) {
  await setUserPets(ctx.event.senderID, pets);
}

/** The first pet in the roster, or null. */
function first(pets) {
  return Array.isArray(pets) && pets.length ? pets[0] : null;
}

function ownedNames(pets) {
  return (pets || []).map((p) => String(p.name).toLowerCase());
}

function findOwned(pets, query) {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return first(pets);
  return (pets || []).find((p) => String(p.name).toLowerCase() === q)
    || (pets || []).find((p) => String(p.name).toLowerCase().includes(q))
    || null;
}

async function needPet(ctx) {
  const user = await me(ctx);
  const pet = first(user.pets);
  if (!pet) {
    await ctx.send(`🐾 You have no pets yet. Adopt one with **${ctx.prefix}adopt [pet]** — there are ${PETS.length} to choose from.`);
    return null;
  }
  return { user, pet };
}

function noMatch(ctx, query) {
  return ctx.send(`❓ No pet called "${query}". **${ctx.prefix}petlist** shows all ${PETS.length}.`);
}

function line(pet) {
  return `${pet.emoji || "🐾"} ${pet.name} [${"■".repeat(Math.min(10, Math.ceil(pet.power / 20)))}${"□".repeat(Math.max(0, 10 - Math.ceil(pet.power / 20)))}] ${pet.rarity} • ${pet.type}`;
}

/* ── 1. petlist — all 50, with pics + bars + name + type ───────────────── */

async function petList(ctx) {
  const filter = ctx.args[0] ? String(ctx.args[0]).toLowerCase() : null;
  const list = filter ? PETS.filter((pet) => pet.rarity.toLowerCase() === filter || pet.type.toLowerCase() === filter) : PETS;
  if (!list.length) {
    return ctx.send(`❓ Nothing matches "${ctx.args[0]}".\nRarities: ${RARITIES.join(", ")}\nTypes: ${PET_TYPES.join(", ")}`);
  }
  const chunks = renderTable({
    title: `🐾 All Pets & Beasts — ${list.length} shown`,
    rows: list,
    emoji: "",
    size: 10,
  });
  for (const chunk of chunks) await ctx.send(chunk);
  await ctx.send(`💡 Filter: **${ctx.prefix}petlist [rarity|type]**\n🎴 Adopt one: **${ctx.prefix}adopt [name]**`);
}

/* ── 2. pet card ───────────────────────────────────────────────────────── */

async function petCard(ctx) {
  const pet = findPet(ctx.args.join(" "));
  if (!pet) return noMatch(ctx, ctx.args.join(" "));
  const chunks = renderTable({ title: `🐾 ${pet.emoji} ${pet.name}`, rows: [pet], size: 10, header: false });
  await ctx.send(chunks[0]);
  await ctx.send([
    `💎 Rarity: ${pet.rarity}`,
    `⚔️ Power: ${pet.power}  ${bar(Math.min(10, Math.ceil(pet.power / 20)), 10)}`,
    `❤️ HP: ${pet.hp}   🜁 Type: ${pet.type}`,
    `📖 ${pet.lore}`,
    `⚔️ Skills: ${pet.skills.map((s) => `${s.name} (${s.damage >= 0 ? "+" : ""}${s.damage})`).join(", ")}`,
  ].join("\n"));
}

/* ── 3. adopt ──────────────────────────────────────────────────────────── */

async function adopt(ctx) {
  const user = await me(ctx);
  const query = ctx.args.join(" ").trim();
  if (!query) {
    return ctx.send(`🐾 Usage: **${ctx.prefix}adopt [pet name or id]**\nThere are ${PETS.length} pets — try **${ctx.prefix}petlist**.`);
  }
  const pet = findPet(query);
  if (!pet) return noMatch(ctx, query);
  if ((user.pets || []).length >= MAX_ROSTER) {
    return ctx.send(`🐾 Your roster is full (${MAX_ROSTER}). Release one with **${ctx.prefix}release [name]** first.`);
  }
  const owned = [...(user.pets || []), { ...pet, level: 1, xp: 0, hunger: 100, thirst: 100, happiness: 100, bond: 0 }];
  await saveRoster(ctx, owned);
  await ctx.send([
    `👑 ${pet.emoji} ${pet.name} joined your roster!`,
    `💎 ${pet.rarity} • ⚔️ ${pet.power} • 🜁 ${pet.type}`,
    `📖 ${pet.lore}`,
    `🐾 Roster: ${owned.length}/${MAX_ROSTER}`,
  ].join("\n"));
}

/* ── 4. release ────────────────────────────────────────────────────────── */

async function release(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const target = ctx.args.length ? findOwned(user.pets, ctx.args.join(" ")) : pet;
  if (!target) return noMatch(ctx, ctx.args.join(" "));
  await saveRoster(ctx, user.pets.filter((p) => p !== target));
  await ctx.send(`🕊️ ${target.name} was released. It will find a home in the wild.`);
}

/* ── 5. feed / 6. water / 7. play ──────────────────────────────────────── */

async function feed(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const food = pick(PET_FOOD);
  const cost = 20;
  if ((user.money || 0) < cost) return ctx.send(`💸 ${food} costs ${cost} coins. You have ${fmt(user.money)}.`);
  const updated = { ...pet, hunger: Math.min(100, (pet.hunger == null ? 100 : pet.hunger) + 40), happiness: Math.min(100, (pet.happiness || 100) + 5) };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await ctx.send(`🍽️ ${pet.emoji} ${pet.name} ate ${food}. Hunger ${bar(updated.hunger, 100)} (-${cost} coins)`);
}

async function water(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const updated = { ...pet, thirst: Math.min(100, (pet.thirst == null ? 100 : pet.thirst) + 50) };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await ctx.send(`💧 ${pet.emoji} ${pet.name} drank. Thirst ${bar(updated.thirst, 100)}`);
}

async function play(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const toy = pick(PET_TOYS);
  const gain = randInt(10, 30);
  const updated = { ...pet, happiness: Math.min(100, (pet.happiness || 100) + gain), bond: (pet.bond || 0) + 1 };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await ctx.send(`🎾 ${pet.emoji} ${pet.name} played with ${toy}. Happiness ${bar(updated.happiness, 100)} (+${gain})`);
}

/* ── 8. heal ───────────────────────────────────────────────────────────── */

async function petHeal(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const cost = 100;
  if ((user.money || 0) < cost) return ctx.send(`💸 Healing costs ${cost} coins.`);
  const updated = { ...pet, hp: pet.hp, happiness: 100, hunger: 100, thirst: 100 };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await ctx.send(`💚 ${pet.emoji} ${pet.name} is fully healed. (-${cost} coins)`);
}

/* ── 9. train ──────────────────────────────────────────────────────────── */

async function petTrain(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const gain = randInt(20, 60);
  const updated = { ...pet, xp: (pet.xp || 0) + gain, level: pet.level || 1 };
  const need = (updated.level + 1) * 100;
  const levelled = updated.xp >= need;
  if (levelled) { updated.level += 1; updated.xp -= need; }
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await ctx.send([
    `🏋️ Training with ${pet.emoji} ${pet.name}…`,
    `⭐ +${gain} XP  ${bar(Math.min(100, updated.xp), need)}`,
    levelled ? `🎉 Level up! Now level ${updated.level}.` : `Next level at ${fmt(need - updated.xp)} more XP.`,
  ].join("\n"));
}

/* ── 10. evolve ────────────────────────────────────────────────────────── */

async function evolve(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const level = pet.level || 1;
  if (level < 5) return ctx.send(`⚠️ ${pet.name} must be level 5 to evolve (currently ${level}).`);
  const next = PETS.find((p) => p.rarity === pet.rarity && p.name !== pet.name);
  const target = next || PETS.find((p) => p.rarity === "Divine");
  if (!target || target.name === pet.name) return ctx.send(`✨ ${pet.name} is already at max evolution.`);
  const evolved = { ...target, level, xp: pet.xp || 0, hunger: 100, thirst: 100, happiness: 100, bond: pet.bond || 0 };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? evolved : p)));
  await ctx.send([
    `✨ ${pet.emoji} ${pet.name} evolved!`,
    `🔮 ${pet.name} → ${target.emoji} ${target.name}`,
    `💎 ${target.rarity} • ⚔️ ${target.power} • 🜁 ${target.type}`,
  ].join("\n"));
}

/* ── 11. rename ────────────────────────────────────────────────────────── */

async function rename(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const newName = ctx.args.join(" ").trim().slice(0, 20);
  if (!newName) return ctx.send(`Usage: **${ctx.prefix}petrename [new name]**`);
  const updated = { ...pet, name: newName, species: newName };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await ctx.send(`🏷️ Renamed to **${newName}**.`);
}

/* ── 12. sell ──────────────────────────────────────────────────────────── */

async function sell(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const target = ctx.args.length ? findOwned(user.pets, ctx.args.join(" ")) : pet;
  if (!target) return noMatch(ctx, ctx.args.join(" "));
  if ((user.pets || []).length <= 1) return ctx.send("🐾 You can't sell your last pet.");
  const price = Math.floor((target.power || 10) * 10);
  await saveRoster(ctx, user.pets.filter((p) => p !== target));
  await adjustMoney(ctx.event.senderID, price, ctx.profile.name);
  await ctx.send(`💰 Sold ${target.emoji} ${target.name} for ${fmt(price)} coins.`);
}

/* ── 13. buy ───────────────────────────────────────────────────────────── */

async function buy(ctx) {
  const user = await me(ctx);
  const pet = findPet(ctx.args.join(" ")) || pick(PETS.filter((p) => p.rarity === "Common"));
  const price = Math.floor((pet.power || 10) * 12);
  if ((user.money || 0) < price) return ctx.send(`💸 ${pet.emoji} ${pet.name} costs ${fmt(price)} coins. You have ${fmt(user.money)}.`);
  if ((user.pets || []).length >= MAX_ROSTER) return ctx.send(`🐾 Roster full (${MAX_ROSTER}).`);
  if (ownedNames(user.pets).includes(pet.name.toLowerCase())) return ctx.send(`You already own ${pet.name}.`);
  await saveRoster(ctx, [...(user.pets || []), { ...pet, level: 1, xp: 0, hunger: 100, thirst: 100, happiness: 100, bond: 0 }]);
  await adjustMoney(ctx.event.senderID, -price, ctx.profile.name);
  await ctx.send(`🛒 Bought ${pet.emoji} ${pet.name} (${pet.rarity}) for ${fmt(price)} coins.`);
}

/* ── 14. merge ─────────────────────────────────────────────────────────── */

async function merge(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  if ((user.pets || []).length < 2) return ctx.send("🐾 You need at least 2 pets to merge.");
  const [a, b] = user.pets;
  const merged = {
    ...a,
    name: `${a.name.split(" ")[0]}×${b.name.split(" ")[0]}`,
    power: Math.round((a.power + b.power) / 2) + 5,
    hp: Math.round((a.hp + b.hp) / 2),
    level: Math.max(a.level || 1, b.level || 1),
    xp: 0,
  };
  await saveRoster(ctx, [merged, ...user.pets.slice(2)]);
  await ctx.send([
    `🧬 Fusion complete!`,
    `${a.emoji} ${a.name} + ${b.emoji} ${b.name} → ${merged.emoji} **${merged.name}**`,
    `⚔️ Power ${fmt(merged.power)} • ❤️ HP ${fmt(merged.hp)}`,
  ].join("\n"));
}

/* ── 15. skills ────────────────────────────────────────────────────────── */

async function petSkills(ctx) {
  const { pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const lines = pet.skills.map((s, i) => `  ${i + 1}. ${s.name} — ${s.damage >= 0 ? "+" : ""}${s.damage} dmg, ${s.cooldown}s cd (${s.effect})`);
  await ctx.send([`⚔️ ${pet.emoji} ${pet.name}'s skills`, ...lines].join("\n"));
}

/* ── 16. level / 17. xp ────────────────────────────────────────────────── */

async function petLevel(ctx) {
  const { pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  await ctx.send(`${pet.emoji} ${pet.name} is level ${pet.level || 1} with ${fmt(pet.xp || 0)} XP.`);
}

async function petXp(ctx) {
  const { pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const need = ((pet.level || 1) + 1) * 100;
  await ctx.send(`⭐ ${pet.name}: ${bar(Math.min(100, pet.xp || 0), need)} ${fmt(pet.xp || 0)}/${fmt(need)} XP`);
}

/* ── 18. luck / 19. bond / 20. fame ────────────────────────────────────── */

async function petLuck(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const luck = Math.min(100, (pet.bond || 0) * 4 + (pet.happiness || 100) / 2);
  await ctx.send(`🍀 ${pet.name}'s luck: ${bar(luck, 100)} ${Math.round(luck)}% (bond + happiness)`);
}

async function petBond(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const bond = pet.bond || 0;
  const stage = bond < 3 ? "Stranger" : bond < 10 ? "Friend" : bond < 25 ? "Companion" : bond < 50 ? "Soulbound" : "Devoted";
  await ctx.send(`💞 ${pet.name} bond: ${stage} (${fmt(bond)} interactions)`);
}

async function petFame(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const fame = (user.pets || []).reduce((n, p) => n + (p.power || 0), 0);
  await ctx.send(`🌟 ${pet.name}'s fame: ${fmt(fame)} total roster power.`);
}

/* ── 21. favourite / 22. revive / 23. clone / 24. compare ──────────────── */

async function petFavorite(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  await ctx.send(`⭐ ${pet.name} is already your active pet (position 1 in the roster).`);
}

async function petRevive(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  if ((pet.hp || 0) > 0 && (pet.hunger == null || pet.hunger > 20)) {
    return ctx.send(`${pet.emoji} ${pet.name} is fine — no revival needed.`);
  }
  const updated = { ...pet, hp: pet.hp, hunger: 80, thirst: 80, happiness: 60 };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await ctx.send(`💖 ${pet.emoji} ${pet.name} was revived.`);
}

async function petClone(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  if ((user.pets || []).length >= MAX_ROSTER) return ctx.send(`🐾 Roster full (${MAX_ROSTER}).`);
  const cost = Math.floor((pet.power || 10) * 20);
  if ((user.money || 0) < cost) return ctx.send(`💸 Cloning costs ${fmt(cost)} coins.`);
  await saveRoster(ctx, [...(user.pets || []), { ...pet, name: `${pet.name} (Clone)`, level: 1, xp: 0 }]);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  await ctx.send(`🧬 Cloned ${pet.emoji} ${pet.name} for ${fmt(cost)} coins.`);
}

async function petCompare(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  if (pets.length < 2) return ctx.send("🐾 Adopt at least 2 pets to compare.");
  const [a, b] = pets;
  const lines = [
    `⚖️ ${a.emoji} ${a.name} vs ${b.emoji} ${b.name}`,
    `⚔️ Power:  ${fmt(a.power)} vs ${fmt(b.power)}`,
    `❤️ HP:     ${fmt(a.hp)} vs ${fmt(b.hp)}`,
    `💎 Rarity: ${a.rarity} vs ${b.rarity}`,
    `🜁 Type:   ${a.type} vs ${b.type}`,
    `🏆 ${(a.power || 0) >= (b.power || 0) ? a.name : b.name} is stronger.`,
  ];
  await ctx.send(lines.join("\n"));
}

/* ── 25. collection / 26. top / 27. duel / 28. arena / 29. raid ─────────── */

async function petCollection(ctx) {
  const user = await me(ctx);
  const owned = new Set(ownedNames(user.pets));
  const chunks = renderTable({
    title: `🐾 Collection — ${owned.size}/${PETS.length} discovered`,
    rows: PETS,
    size: 10,
  });
  for (const chunk of chunks) await ctx.send(chunk);
  await ctx.send(`✅ You own ${owned.size} of ${PETS.length} pets (${bar(owned.size, PETS.length, { size: 10 })}).`);
}

async function petTop(ctx) {
  const sorted = [...PETS].sort((a, b) => b.power - a.power);
  const top = sorted.slice(0, 10);
  const lines = top.map((p, i) => `  ${String(i + 1).padStart(2)}. ${p.emoji} ${p.name} ${bar(Math.ceil(p.power / 20), 10)} ${fmt(p.power)}`);
  await ctx.send(["🏆 Strongest pets", ...lines].join("\n"));
}

async function petDuel(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  if (pets.length < 2) return ctx.send("⚔️ You need 2 pets to duel.");
  const [a, b] = sample(pets, 2);
  const aRoll = (a.power || 10) * Math.random();
  const bRoll = (b.power || 10) * Math.random();
  const win = aRoll >= bRoll ? a : b;
  await addXp(ctx.event.senderID, 15, ctx.profile.name);
  await ctx.send([
    `⚔️ Duel: ${a.emoji} ${a.name} vs ${b.emoji} ${b.name}`,
    `🎲 ${a.name} ${Math.round(aRoll)} — ${b.name} ${Math.round(bRoll)}`,
    `🏆 ${win.emoji} ${win.name} wins! (+15 XP)`,
  ].join("\n"));
}

async function petArena(ctx) {
  const user = await me(ctx);
  const pet = first(user.pets);
  if (!pet) return ctx.send(`🐾 No pets. Adopt one with **${ctx.prefix}adopt**.`);
  const waves = randInt(2, 5);
  let power = pet.power || 10;
  let cleared = 0;
  for (let i = 0; i < waves; i++) if (power * (0.6 + Math.random()) > 25 * (i + 1)) cleared++;
  const reward = cleared * 60;
  if (reward) await adjustMoney(ctx.event.senderID, reward, ctx.profile.name);
  await ctx.send([
    `🏟️ Arena run with ${pet.emoji} ${pet.name}`,
    `🌊 Cleared ${cleared}/${waves} waves ${bar(cleared, waves)}`,
    reward ? `💰 +${fmt(reward)} coins` : `💸 No payout this run.`,
  ].join("\n"));
}

async function petRaid(ctx) {
  const user = await me(ctx);
  const pet = first(user.pets);
  if (!pet) return ctx.send(`🐾 No pets. Adopt one with **${ctx.prefix}adopt**.`);
  const boss = pick(PETS.filter((p) => ["Epic", "Legendary", "Mythic", "Divine"].includes(p.rarity)));
  const damage = Math.round((pet.power || 10) * (0.4 + Math.random() * 0.8));
  const bossHp = boss.power * 3;
  await ctx.send([
    `🗡️ Raid: ${pet.emoji} ${pet.name} vs ${boss.emoji} ${boss.name}`,
    `💥 You dealt ${fmt(damage)} damage`,
    `${boss.emoji} HP ${bar(Math.max(0, bossHp - damage), bossHp, { size: 10 })}`,
    damage >= bossHp ? "🏆 Boss defeated!" : "🛡️ The boss holds.",
  ].join("\n"));
}

/* ── 30. boss / 31. spawn / 32. battle vs mention ───────────────────────── */

async function petBoss(ctx) {
  const user = await me(ctx);
  const pet = first(user.pets);
  if (!pet) return ctx.send(`🐾 No pets. Adopt one with **${ctx.prefix}adopt**.`);
  const boss = pick(PETS.filter((p) => ["Mythic", "Divine"].includes(p.rarity)));
  const power = (pet.power || 10) * 3;
  const win = power > boss.power * (0.5 + Math.random());
  await ctx.send([
    `👹 Boss fight: ${pet.emoji} ${pet.name} vs ${boss.emoji} ${boss.name}`,
    `⚔️ ${fmt(power)} vs ${fmt(boss.power * 2)}`,
    win ? "🏆 Victory! Your pet stands tall." : "💀 Defeated. Train more and return.",
  ].join("\n"));
}

async function petSpawn(ctx) {
  const pet = pick(PETS);
  const chunks = renderTable({ title: `🥚 A wild ${pet.name} appears`, rows: [pet], size: 10, header: false });
  await ctx.send(chunks[0]);
  await ctx.send([
    `💎 ${pet.rarity} • 🜁 ${pet.type} • ⚔️ ${pet.power}`,
    `📖 ${pet.lore}`,
    `🎴 Catch it: **${ctx.prefix}adopt ${pet.name}**`,
  ].join("\n"));
}

async function petBattleMention(ctx) {
  const target = Object.keys(ctx.event.mentions || {})[0];
  if (!target) return ctx.send(`⚔️ Tag someone: **${ctx.prefix}petbattle @user**`);
  const meUser = await me(ctx);
  const them = await getUser(target, "Facebook user");
  const a = first(meUser.pets);
  const b = first(them.pets);
  if (!a || !b) return ctx.send("⚔️ One of you has no pets. Adopt one first!");
  const aRoll = (a.power || 10) * Math.random();
  const bRoll = (b.power || 10) * Math.random();
  const win = aRoll >= bRoll;
  await addXp(ctx.event.senderID, win ? 25 : 10, ctx.profile.name);
  await ctx.send([
    `⚔️ ${a.emoji} ${a.name} vs ${b.emoji} ${b.name}`,
    `🎲 ${Math.round(aRoll)} — ${Math.round(bRoll)}`,
    win ? `🏆 You win! +25 XP` : `💀 You lost. +10 XP for showing up.`,
  ].join("\n"));
}

/* ── 33. trade / 34. gift / 35. full / 36. inventory ───────────────────── */

async function petTrade(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const target = Object.keys(ctx.event.mentions || {})[0];
  if (!target) return ctx.send(`🔄 Usage: **${ctx.prefix}pettrade @user** — they receive ${pet.name}.`);
  const them = await getUser(target, "Facebook user");
  if ((them.pets || []).length >= MAX_ROSTER) return ctx.send(`🐾 ${them.name}'s roster is full.`);
  await saveRoster(ctx, user.pets.filter((p) => p !== pet));
  await setUserPets(target, [...(them.pets || []), { ...pet, name: pet.name }]);
  await ctx.send(`🔄 ${pet.emoji} ${pet.name} was traded to ${them.name || "them"}.`);
}

async function petGift(ctx) {
  const target = Object.keys(ctx.event.mentions || {})[0];
  if (!target) return ctx.send(`🎁 Usage: **${ctx.prefix}petgift @user [pet]**`);
  const user = await me(ctx);
  const pet = findOwned(user.pets, ctx.args.slice(1).join(" "));
  if (!pet) return ctx.send("🐾 You don't own a pet by that name.");
  const them = await getUser(target, "Facebook user");
  if ((them.pets || []).length >= MAX_ROSTER) return ctx.send(`🐾 ${them.name}'s roster is full.`);
  await saveRoster(ctx, user.pets.filter((p) => p !== pet));
  await setUserPets(target, [...(them.pets || []), { ...pet }]);
  await ctx.send(`🎁 You gifted ${pet.emoji} ${pet.name} to ${them.name || "them"}.`);
}

async function petFull(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  if (!pets.length) return ctx.send("🐾 Your roster is empty.");
  const lines = pets.map((p, i) => `  ${i + 1}. ${p.emoji || "🐾"} ${p.name} [${"■".repeat(Math.min(5, Math.ceil((p.power || 10) / 30)))}${"□".repeat(Math.max(0, 5 - Math.ceil((p.power || 10) / 30)))}] ${p.rarity || "Common"}`);
  await ctx.send([`🐾 Full roster (${pets.length}/${MAX_ROSTER})`, ...lines].join("\n"));
}

async function petInventory(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  await ctx.send([
    `🎒 Pet inventory`,
    `🐾 Roster: ${pets.length}/${MAX_ROSTER} ${bar(pets.length, MAX_ROSTER)}`,
    `💎 Highest rarity: ${pets.length ? pets.map((p) => p.rarity).sort((a, b) => RARITIES.indexOf(b) - RARITIES.indexOf(a))[0] : "—"}`,
    `⚔️ Total power: ${fmt(pets.reduce((n, p) => n + (p.power || 0), 0))}`,
    `🍽️ Food: ${PET_FOOD.length} • 🎾 Toys: ${PET_TOYS.length} • ⚔️ Skills: ${PET_SKILLS_TREE.length}`,
  ].join("\n"));
}

/* ── 37. skin / 38. cage / 39. stamina / 40. breed ─────────────────────── */

async function petSkin(ctx) {
  const { pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const skins = ["Classic", "Neon", "Chrome", "Galaxy", "Midnight", "Sunset", "Frost", "Inferno"];
  const skin = pick(skins);
  await ctx.send(`🎨 ${pet.emoji} ${pet.name} unlocked the **${skin}** skin. ${bar(pet.strength, 10, { size: 10 })}`);
}

async function petCage(ctx) {
  const { user, pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const cost = 50;
  if ((user.money || 0) < cost) return ctx.send(`💸 Cage upkeep is ${cost} coins.`);
  await adjustMoney(ctx.event.senderID, -cost, ctx.profile.name);
  const updated = { ...pet, happiness: Math.min(100, (pet.happiness || 100) + 5) };
  await saveRoster(ctx, user.pets.map((p) => (p === pet ? updated : p)));
  await ctx.send(`🛡️ ${pet.emoji} ${pet.name} is safe in its cage. (-${cost} coins)`);
}

async function petStamina(ctx) {
  const { pet } = (await needPet(ctx)) || {};
  if (!pet) return;
  const stamina = Math.round((pet.happiness || 100) / 2 + (pet.bond || 0));
  await ctx.send(`🔋 ${pet.name}'s stamina: ${bar(stamina, 100)}`);
}

async function petBreed(ctx) {
  const user = await me(ctx);
  if ((user.pets || []).length < 2) return ctx.send("🐾 You need 2 pets to breed.");
  const [a, b] = sample(user.pets, 2);
  const rarityIdx = Math.min(RARITIES.length - 1, Math.max(RARITIES.indexOf(a.rarity), RARITIES.indexOf(b.rarity)));
  const rarity = RARITIES[rarityIdx];
  const baby = pick(petsByRarity(rarity).filter((p) => p.name !== a.name && p.name !== b.name)) || a;
  if ((user.pets || []).length >= MAX_ROSTER) return ctx.send(`🐾 Roster full (${MAX_ROSTER}).`);
  await saveRoster(ctx, [...user.pets, { ...baby, name: `${baby.name} (Baby)`, level: 1, xp: 0 }]);
  await ctx.send([
    `🥚 ${a.emoji} ${a.name} + ${b.emoji} ${b.name} →`,
    `🐣 ${baby.emoji} **${baby.name} (Baby)** — ${baby.rarity}`,
  ].join("\n"));
}

/* ── 41. fusion / 42. trainer / 43. arena rank / 44. rarity ─────────────── */

async function petFusion(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  if (pets.length < 3) return ctx.send("🧬 Fusion needs at least 3 pets.");
  const trio = sample(pets, 3);
  const avg = Math.round(trio.reduce((n, p) => n + (p.power || 0), 0) / 3);
  const fused = pick(PETS.filter((p) => Math.abs((p.power || 0) - avg) < 25)) || trio[0];
  await saveRoster(ctx, pets.filter((p) => !trio.includes(p)).concat([{ ...fused, name: `${fused.name} ∆`, level: 3, xp: 0 }]));
  await ctx.send(`🧬 Three became one: **${fused.emoji} ${fused.name} ∆** (${fused.rarity}, ⚔️ ${fused.power})`);
}

async function petTrainer(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  if (!pets.length) return ctx.send("🐾 No pets to train.");
  const pet = first(pets);
  const gain = randInt(30, 80);
  const updated = { ...pet, xp: (pet.xp || 0) + gain, bond: (pet.bond || 0) + 1 };
  await saveRoster(ctx, pets.map((p) => (p === pet ? updated : p)));
  await addXp(ctx.event.senderID, 10, ctx.profile.name);
  await ctx.send(`🏋️ Trainer worked with ${pet.emoji} ${pet.name}: +${gain} pet XP, +10 your XP.`);
}

async function petArenaRank(ctx) {
  const user = await me(ctx);
  const power = (user.pets || []).reduce((n, p) => n + (p.power || 0), 0);
  const rank = power > 2000 ? "Divine I" : power > 1200 ? "Mythic I" : power > 700 ? "Legendary I"
    : power > 350 ? "Epic I" : power > 150 ? "Rare I" : power > 50 ? "Uncommon I" : "Common I";
  await ctx.send(`🏟️ Arena rank: **${rank}**\n⚔️ Roster power: ${fmt(power)} ${bar(Math.min(power, 2000), 2000, { size: 10 })}`);
}

async function petRarity(ctx) {
  const chunks = renderList({
    title: "💎 Pet rarities",
    items: RARITIES.map((r) => `${r} — ${petsByRarity(r).length} pets`),
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
  await ctx.send(`Total: ${PETS.length} pets across ${RARITIES.length} rarities.`);
}

/* ── 45. search / 46. sell all / 47. help / 48. reset / 49. types ──────── */

async function petSearch(ctx) {
  const query = ctx.args.join(" ").toLowerCase();
  if (!query) return ctx.send(`Usage: **${ctx.prefix}petsearch [name, type, or rarity]**`);
  const found = PETS.filter((p) => p.name.toLowerCase().includes(query)
    || p.type.toLowerCase().includes(query)
    || p.rarity.toLowerCase().includes(query)
    || p.lore.toLowerCase().includes(query));
  if (!found.length) return ctx.send(`❓ Nothing matched "${query}".`);
  const chunks = renderTable({ title: `🔍 Found ${found.length}`, rows: found, size: 10 });
  for (const chunk of chunks) await ctx.send(chunk);
}

async function petSellAll(ctx) {
  const user = await me(ctx);
  const pets = user.pets || [];
  if (pets.length <= 1) return ctx.send("🐾 Keep at least one pet.");
  const keep = first(pets);
  const sold = pets.slice(1);
  const total = sold.reduce((n, p) => n + Math.floor((p.power || 10) * 10), 0);
  await saveRoster(ctx, [keep]);
  await adjustMoney(ctx.event.senderID, total, ctx.profile.name);
  await ctx.send(`💰 Sold ${sold.length} pet(s) for ${fmt(total)} coins. Kept ${keep.emoji} ${keep.name}.`);
}

async function petHelp(ctx) {
  const p = ctx.prefix;
  const lines = [
    `🐾 **Pet Labs** — ${PETS.length} pets, ${RARITIES.length} rarities, ${PET_TYPES.length} types.`,
    "",
    `◦ ${p}petlist [rarity|type] — browse every pet with bars`,
    `◦ ${p}adopt [name] / ${p}release [name] — manage the roster`,
    `◦ ${p}feed / ${p}water / ${p}play / ${p}petheal — care`,
    `◦ ${p}pettrain / ${p}petlevel / ${p}petxp — growth`,
    `◦ ${p}evolve / ${p}petmerge / ${p}petbreed / ${p}petfusion — combine`,
    `◦ ${p}petcard [name] / ${p}petstats [name] — details`,
    `◦ ${p}petduel / ${p}petarena / ${p}petraid / ${p}petboss — combat`,
    `◦ ${p}petcollection / ${p}pettop / ${p}petcompare — collection`,
  ];
  await ctx.send(lines.join("\n"));
}

async function petReset(ctx) {
  const user = await me(ctx);
  if (!(user.pets || []).length) return ctx.send("🐾 Nothing to reset.");
  await saveRoster(ctx, []);
  await ctx.send("🧹 Your roster was cleared. Fresh start!");
}

async function petTypes(ctx) {
  const chunks = renderList({
    title: "🜁 Pet types",
    items: PET_TYPES.map((t) => `${t} — ${PETS.filter((p) => p.type === t).length} pets`),
    emoji: "",
  });
  for (const chunk of chunks) await ctx.send(chunk);
}

/* ── 50. sellprice ─────────────────────────────────────────────────────── */

async function petSellPrice(ctx) {
  const pet = findPet(ctx.args.join(" "));
  if (!pet) return noMatch(ctx, ctx.args.join(" "));
  await ctx.send([
    `💰 Sale value: ${pet.emoji} ${pet.name}`,
    `Sell for ${fmt(Math.floor((pet.power || 10) * 10))} coins`,
    `Buy for ${fmt(Math.floor((pet.power || 10) * 12))} coins`,
    `💎 ${pet.rarity} • ⚔️ ${pet.power}`,
  ].join("\n"));
}

/* ── registry ──────────────────────────────────────────────────────────── */

module.exports = {
  commands: commands([
    ["petlist", petList, { aliases: ["pets", "pet_list"], description: "Browse all 50 pets" }],
    ["petcard", petCard, { aliases: ["petstats", "petinfo"], description: "One pet in detail" }],
    ["adopt", adopt, { description: "Adopt a pet" }],
    ["release", release, { description: "Release a pet" }],
    ["feed", feed, { description: "Feed your pet" }],
    ["water", water, { description: "Give your pet water" }],
    ["petplay", play, { description: "Play with your pet" }],
    ["petheal", petHeal, { description: "Heal your pet" }],
    ["pettrain", petTrain, { description: "Train your pet" }],
    ["evolve", evolve, { description: "Evolve your pet" }],
    ["petrename", rename, { description: "Rename a pet" }],
    ["petsell", sell, { description: "Sell a pet" }],
    ["petbuy", buy, { description: "Buy a pet" }],
    ["petmerge", merge, { description: "Merge two pets" }],
    ["petskill", petSkills, { aliases: ["petskills"], description: "View pet skills" }],
    ["petlevel", petLevel, { description: "Pet level" }],
    ["petxp", petXp, { description: "Pet XP bar" }],
    ["petluck", petLuck, { description: "Pet luck meter" }],
    ["petbond", petBond, { description: "Pet bond" }],
    ["petfame", petFame, { description: "Pet fame" }],
    ["petfavorite", petFavorite, { description: "Favourite pet" }],
    ["petrevive", petRevive, { description: "Revive a pet" }],
    ["petclone", petClone, { description: "Clone a pet" }],
    ["petcompare", petCompare, { description: "Compare two pets" }],
    ["petcollection", petCollection, { description: "Full collection" }],
    ["pettop", petTop, { description: "Strongest pets" }],
    ["petduel", petDuel, { description: "Duel your own pets" }],
    ["petarena", petArena, { description: "Arena run" }],
    ["petraid", petRaid, { description: "Raid a boss" }],
    ["petboss", petBoss, { description: "Fight a mythic boss" }],
    ["petspawn", petSpawn, { description: "Summon a random pet" }],
    ["petbattle", petBattleMention, { aliases: ["duel"], description: "Battle another player" }],
    ["pettrade", petTrade, { description: "Trade a pet" }],
    ["petgift", petGift, { description: "Gift a pet" }],
    ["petfull", petFull, { description: "Full roster" }],
    ["petinventory", petInventory, { description: "Pet inventory" }],
    ["petskin", petSkin, { description: "Change pet skin" }],
    ["petcage", petCage, { description: "Put a pet in its cage" }],
    ["petstamina", petStamina, { description: "Pet stamina" }],
    ["petbreed", petBreed, { description: "Breed two pets" }],
    ["petfusion", petFusion, { description: "Fuse three pets" }],
    ["pettrainer", petTrainer, { description: "Hire a trainer" }],
    ["petarenarank", petArenaRank, { description: "Arena rank" }],
    ["petrarity", petRarity, { description: "Rarity ladder" }],
    ["petsearch", petSearch, { description: "Search the roster" }],
    ["petsellall", petSellAll, { description: "Sell extra pets" }],
    ["pethelp", petHelp, { aliases: ["petlabs"], description: "Pet Labs help" }],
    ["petreset", petReset, { description: "Clear your roster" }],
    ["pettype", petTypes, { aliases: ["pettypes"], description: "All pet types" }],
    ["petsellprice", petSellPrice, { description: "Pet buy/sell value" }],
  ]),
};