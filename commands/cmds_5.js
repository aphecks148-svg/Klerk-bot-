// commands/cmds_5.js
// 🎰 ARCADE/CASINO + 🤝 SOCIAL + 🎣 FISHING + 🏹 HUNTING
// Fictional in-bot game mechanics only.

const state = new Map();

function get(id) {
  if (!state.has(id)) {
    state.set(id, {
      coins: 1000,
      wins: 0,
      losses: 0,
      fish: [],
      catches: 0,
      hunts: 0,
      trophies: [],
      reputation: 0,
      friends: [],
      blocked: [],
      married: null,
      streak: 0
    });
  }
  return state.get(id);
}

const C = {};

function reply(ctx, text) {
  return ctx.reply(`🎮 ${text}`);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function money(n) {
  return `$${n.toLocaleString()}`;
}

/* =========================================================
   🎰 ARCADE / CASINO
========================================================= */

const games = {
  slots: "🎰 Slots",
  coinflip: "🪙 Coin Flip",
  blackjack: "🃏 Blackjack",
  roulette: "🎡 Roulette",
  dice_roll: "🎲 Dice Roll",
  poker: "♠️ Poker",
  baccarat: "♦️ Baccarat",
  lottery: "🎟️ Lottery",
  scratch_card: "🪪 Scratch Card",
  horse_race: "🏇 Horse Race",
  wheel_fortune: "🎡 Wheel of Fortune",
  high_low: "⬆️ High / Low",
  keno: "🔢 Keno",
  craps: "🎲 Craps",
  plinko: "🔴 Plinko",
  mines: "💣 Mines",
  crash: "📈 Crash",
  cups: "🥤 Cups",
  spin_dice: "🎲 Spin Dice",
  crypto_slots: "₿ Crypto Slots",
  diamond_mine: "💎 Diamond Mine",
  fortune_teller: "🔮 Fortune Teller",
  vip_lounge: "👑 VIP Lounge",
  casino_rob: "🏦 Casino Rob",
  bet_insurance: "🛡️ Bet Insurance",
  token_exchange: "🔄 Token Exchange",
  gambling_lb: "🏆 Gambling Leaderboard",
  casino_streak: "🔥 Casino Streak",
  house_bank: "🏦 House Bank",
  cheat_shop: "🛒 Cheat Shop",
  counting: "🧮 Counting Challenge"
};

for (const [name, label] of Object.entries(games)) {
  C[name] = {
    name,
    execute: (ctx) => {
      const u = get(ctx.event.senderID);
      const bet = Math.max(10, Number(ctx.args[0]) || 50);

      if (u.coins < bet) {
        return reply(ctx, `❌ You need ${money(bet)} to play.`);
      }

      if (name === "gambling_lb") {
        return reply(
          ctx,
          `🏆 GAMBLING LEADERBOARD\n\n🥇 Top players are ranked by fictional casino wins.\n💰 Your coins: ${money(u.coins)}`
        );
      }

      if (name === "vip_lounge") {
        return reply(
          ctx,
          `👑 VIP LOUNGE\n\n✨ Exclusive fictional casino area\n🎁 Bonus multiplier available\n💰 Balance: ${money(u.coins)}`
        );
      }

      if (name === "fortune_teller") {
        const fortunes = [
          "🌟 A huge reward is coming!",
          "💎 Rare loot may find you soon!",
          "🔥 Your next challenge looks lucky!",
          "🌙 Something unexpected awaits!",
          "👑 Your reputation is rising!"
        ];
        return reply(ctx, `🔮 ${fortunes[rand(0, fortunes.length - 1)]}`);
      }

      if (name === "house_bank") {
        return reply(
          ctx,
          `🏦 HOUSE BANK\n\n💰 Your coins: ${money(u.coins)}\n🎰 House games are fictional and use bot currency only.`
        );
      }

      if (name === "casino_streak") {
        return reply(ctx, `🔥 CASINO STREAK\n\n🎯 Current streak: ${u.streak}`);
      }

      u.coins -= bet;

      const win = Math.random() < 0.48;

      if (win) {
        const reward = bet * rand(2, 4);
        u.coins += reward;
        u.wins++;
        u.streak++;

        return reply(
          ctx,
          `🎉 YOU WON!\n\n💰 Bet: ${money(bet)}\n🏆 Prize: ${money(reward)}\n🔥 Streak: ${u.streak}\n💳 Balance: ${money(u.coins)}`
        );
      }

      u.losses++;
      u.streak = 0;

      return reply(
        ctx,
        `😵 YOU LOST!\n\n💸 Lost: ${money(bet)}\n💳 Balance: ${money(u.coins)}\n🔥 Streak reset.`
      );
    }
  };
}

/* =========================================================
   🎮 MINI GAMES
========================================================= */

C.football = {
  name: "football",
  execute: (ctx) => {
    const teams = ["⚽ Lions", "⚽ Titans", "⚽ Royals", "⚽ United"];
    return reply(
      ctx,
      `⚽ FOOTBALL MINI GAME\n\n${teams[rand(0, 3)]} vs ${teams[rand(0, 3)]}\n🏟️ Match simulation started!`
    );
  }
};

C.quiz = {
  name: "quiz",
  execute: (ctx) =>
    reply(ctx, `🧠 QUIZ\n\nQuestion: What has keys but cannot open locks?\n\n💡 Use your answer to continue!`)
};

C.wrestle = {
  name: "wrestle",
  execute: (ctx) =>
    reply(ctx, `🤼 WRESTLE\n\n💥 Match started!\n🥊 Power clash incoming!`)
};

C.event_join = {
  name: "event_join",
  execute: (ctx) =>
    reply(ctx, `🎉 You joined the current community event!`)
};

C.event_status = {
  name: "event_status",
  execute: (ctx) =>
    reply(ctx, `📅 EVENT STATUS\n\n🎊 Community event: ACTIVE\n👥 Participants: growing\n🏆 Rewards: available`)
};

C.air_drop = {
  name: "air_drop",
  execute: (ctx) => {
    const u = get(ctx.event.senderID);
    const reward = rand(100, 500);
    u.coins += reward;

    return reply(ctx, `🪂 AIR DROP!\n\n💰 You collected ${money(reward)}!`);
  }
};

/* =========================================================
   🌍 WORLD EVENTS / ARCADE EVENTS
========================================================= */

const events = [
  "bank_panic",
  "riot_alert",
  "market_crash",
  "crypto_pump",
  "plague_outbreak",
  "alien_invasion",
  "natural_disaster",
  "gang_warfare",
  "mayor_elections",
  "blackout",
  "gold_rush",
  "bounty_frenzy",
  "festival",
  "uprising",
  "cyber_attack",
  "meteor_shower",
  "blackmarket_run",
  "arena_games",
  "scavenger_hunt",
  "tax_holiday",
  "shark_attack",
  "zombie_wave",
  "hyper_inflation",
  "mafia_execution",
  "spy_ring",
  "convoy_heist",
  "monopoly_deal"
];

for (const name of events) {
  C[name] = {
    name,
    execute: (ctx) =>
      reply(
        ctx,
        `🌍 WORLD EVENT\n\n🔥 ${name.replace(/_/g, " ").toUpperCase()}\n\n🎮 A fictional world event has been triggered!`
      )
  };
}

/* =========================================================
   🤝 SOCIAL
========================================================= */

const social = {
  profile_ping: "📡 Profile Ping",
  roast: "🔥 Roast",
  hint: "💡 Hint",
  marry_chat: "💍 Marry",
  flirt_chat: "💘 Flirt",
  chat_lb: "🏆 Chat Leaderboard",
  gift_item: "🎁 Gift Item",
  trade_request: "🤝 Trade Request",
  reputation: "⭐ Reputation",
  clan_chat: "🏰 Clan Chat",
  party_create: "🎉 Party Create",
  leaderboards: "🏆 Leaderboards",
  achievements: "🏅 Achievements",
  title_equip: "👑 Equip Title",
  chat_stats: "📊 Chat Stats",
  emoji_shop: "😀 Emoji Shop",
  user_bio: "📝 User Bio",
  friend_add: "👥 Add Friend",
  block_user: "🚫 Block User",
  avatar_border: "🖼️ Avatar Border",
  chat_theme: "🎨 Chat Theme",
  coin_toss: "🪙 Coin Toss",
  rock_paper: "✊ Rock Paper Scissors",
  word_scramble: "🔤 Word Scramble",
  number_guess: "🔢 Number Guess",
  tic_tac: "❌⭕ Tic Tac Toe",
  hangman: "📝 Hangman"
};

for (const [name, label] of Object.entries(social)) {
  C[name] = {
    name,
    execute: (ctx) => {
      const u = get(ctx.event.senderID);
      const target = ctx.args[0];

      if (name === "friend_add") {
        if (!target) return reply(ctx, "👥 Usage: !friend_add @user");
        if (!u.friends.includes(target)) u.friends.push(target);
        return reply(ctx, `🤝 Friend request sent to ${target}`);
      }

      if (name === "block_user") {
        if (!target) return reply(ctx, "🚫 Usage: !block_user @user");
        if (!u.blocked.includes(target)) u.blocked.push(target);
        return reply(ctx, `🚫 ${target} has been blocked in your bot profile.`);
      }

      if (name === "reputation") {
        return reply(ctx, `⭐ REPUTATION\n\n⭐ Score: ${u.reputation}`);
      }

      if (name === "chat_stats") {
        return reply(
          ctx,
          `📊 CHAT STATS\n\n💬 Community activity tracked by the bot.\n⭐ Reputation: ${u.reputation}`
        );
      }

      if (name === "achievements") {
        return reply(
          ctx,
          `🏅 ACHIEVEMENTS\n\n🎯 Wins: ${u.wins}\n🎣 Fish: ${u.catches}\n🏹 Hunts: ${u.hunts}`
        );
      }

      if (name === "leaderboards" || name === "chat_lb") {
        return reply(
          ctx,
          `🏆 LEADERBOARDS\n\n🥇 Rankings available\n💰 Coins: ${money(u.coins)}\n🎰 Wins: ${u.wins}\n🎣 Catches: ${u.catches}\n🏹 Hunts: ${u.hunts}`
        );
      }

      if (name === "party_create") {
        return reply(ctx, `🎉 PARTY CREATED!\n\n👥 Invite your friends and start a community activity.`);
      }

      if (name === "clan_chat") {
        return reply(ctx, `🏰 CLAN CHAT\n\n💬 Clan communication channel opened.`);
      }

      if (name === "profile_ping") {
        return reply(
          ctx,
          `📡 PROFILE PING\n\n👤 ${ctx.username || "Player"}\n🆔 ${ctx.event.senderID}`
        );
      }

      if (name === "roast") {
        return reply(ctx, `🔥 ROAST\n\n😂 Your luck needs a software update!`);
      }

      if (name === "hint") {
        return reply(ctx, `💡 HINT\n\n🎯 Try exploring different game systems and daily activities.`);
      }

      if (name === "flirt_chat") {
        return reply(ctx, `💘 FLIRT\n\n😉 Someone's charisma just increased!`);
      }

      if (name === "marry_chat") {
        return reply(ctx, `💍 MARRIAGE\n\n❤️ Fictional community relationship request created.`);
      }

      return reply(ctx, `${label}\n\n✨ Feature activated!\n👤 Player: ${ctx.username || "Player"}`);
    }
  };
}

/* =========================================================
   🎣 FISHING
========================================================= */

const fishCommands = [
  "fish",
  "fishspot",
  "cast",
  "reel",
  "bait",
  "buy_bait",
  "rod",
  "buy_rod",
  "upgrade_rod",
  "deepsea",
  "fish_market",
  "sell_fish",
  "fish_trophy",
  "fish_collection",
  "rare_fish",
  "legendary_fish",
  "fish_quest",
  "fish_rank",
  "fish_lb",
  "fishing_competition",
  "net_fishing",
  "ice_fishing",
  "treasure_fishing",
  "underwater",
  "sea_monster"
];

for (const name of fishCommands) {
  C[name] = {
    name,
    execute: (ctx) => {
      const u = get(ctx.event.senderID);

      if (name === "fish_collection") {
        return reply(
          ctx,
          `🎣 FISH COLLECTION\n\n🐟 Catches: ${u.catches}\n📦 Unique fish: ${u.fish.length}`
        );
      }

      if (name === "fish_lb") {
        return reply(ctx, `🏆 FISHING LEADERBOARD\n\n🎣 Your catches: ${u.catches}`);
      }

      if (name === "fish_rank") {
        const rank = Math.max(1, Math.floor(u.catches / 5) + 1);
        return reply(ctx, `🎣 FISHING RANK\n\n🏅 Rank: ${rank}\n🐟 Catches: ${u.catches}`);
      }

      if (name === "fish_market") {
        return reply(ctx, `🐟 FISH MARKET\n\n💰 Fish can be sold here for fictional bot currency.`);
      }

      if (name === "fish_trophy") {
        return reply(ctx, `🏆 FISH TROPHY ROOM\n\n🎣 Display your rare catches here.`);
      }

      if (name === "rod") {
        return reply(ctx, `🎣 ROD\n\n🪵 Basic Rod\n⭐ Upgradeable fishing equipment.`);
      }

      if (name === "bait") {
        return reply(ctx, `🪱 BAIT\n\n📦 Basic bait ready for fishing.`);
      }

      if (name === "rare_fish") {
        return reply(ctx, `✨ RARE FISH\n\n🐠 A rare fictional fish may appear during fishing.`);
      }

      if (name === "legendary_fish") {
        return reply(ctx, `👑 LEGENDARY FISH\n\n🐉 Extremely rare fictional catch available.`);
      }

      if (name === "sea_monster") {
        return reply(ctx, `🌊 SEA MONSTER\n\n👾 A fictional sea boss has appeared!`);
      }

      if (name === "fishing_competition") {
        return reply(ctx, `🏆 FISHING COMPETITION\n\n🎣 Competition opened!\n🥇 Highest catch wins.`);
      }

      if (name === "deepsea" || name === "underwater") {
        return reply(ctx, `🌊 DEEP SEA\n\n🤿 Expedition launched into the fictional ocean.`);
      }

      if (name === "treasure_fishing") {
        const reward = rand(100, 750);
        u.coins += reward;
        return reply(ctx, `💎 TREASURE FISHING\n\n🎣 You found treasure worth ${money(reward)}!`);
      }

      if (name === "buy_bait") {
        return reply(ctx, `🪱 BAIT PURCHASED\n\n🎣 Your fishing supplies have been restocked.`);
      }

      if (name === "buy_rod") {
        return reply(ctx, `🎣 ROD PURCHASED\n\n⭐ Basic fishing rod added.`);
      }

      if (name === "upgrade_rod") {
        return reply(ctx, `⬆️ ROD UPGRADED\n\n🎣 Fishing power increased!`);
      }

      // Actual fishing action
      const catches = [
        "🐟 Common Fish",
        "🐠 Tropical Fish",
        "🦈 Small Shark",
        "🐡 Rare Puffer",
        "🦑 Deep Sea Squid",
        "🐉 Legendary Sea Serpent"
      ];

      const caught = catches[rand(0, catches.length - 1)];
      const value = rand(50, 400);

      u.fish.push(caught);
      u.catches++;
      u.coins += value;

      return reply(
        ctx,
        `🎣 GREAT CATCH!\n\n${caught}\n💰 Value: ${money(value)}\n🐟 Total catches: ${u.catches}\n💳 Balance: ${money(u.coins)}`
      );
    }
  };
}

/* =========================================================
   🏹 HUNTING / WILDLIFE
========================================================= */

const huntCommands = [
  "hunt",
  "track",
  "scout",
  "trap",
  "bait_trap",
  "hunt_area",
  "wildlife",
  "animal_track",
  "hunt_quest",
  "hunt_rank",
  "hunt_lb",
  "rare_hunt",
  "legendary_hunt",
  "night_hunt",
  "forest",
  "jungle",
  "mountain",
  "swamp",
  "desert",
  "trophy",
  "hide",
  "fur",
  "meat",
  "hunt_shop",
  "hunter_license",
  "hunter_guild",
  "expedition",
  "wild_boss"
];

for (const name of huntCommands) {
  C[name] = {
    name,
    execute: (ctx) => {
      const u = get(ctx.event.senderID);

      if (name === "hunt_rank") {
        return reply(ctx, `🏹 HUNTER RANK\n\n🏅 Rank: ${Math.max(1, Math.floor(u.hunts / 5) + 1)}\n🎯 Hunts: ${u.hunts}`);
      }

      if (name === "hunt_lb") {
        return reply(ctx, `🏆 HUNTING LEADERBOARD\n\n🏹 Your hunts: ${u.hunts}`);
      }

      if (name === "wildlife") {
        return reply(ctx, `🦌 WILDLIFE\n\n🌲 Forest\n🌴 Jungle\n🏔️ Mountain\n🏜️ Desert\n🌫️ Swamp`);
      }

      if (name === "hunt_shop") {
        return reply(ctx, `🏹 HUNT SHOP\n\n🪤 Traps\n🥩 Supplies\n🎯 Hunting gear\n📜 Licenses`);
      }

      if (name === "hunter_license") {
        return reply(ctx, `📜 HUNTER LICENSE\n\n✅ Fictional hunting license registered.`);
      }

      if (name === "hunter_guild") {
        return reply(ctx, `🏹 HUNTER GUILD\n\n🛡️ Guild hall opened.\n🎯 Complete hunting quests to rank up.`);
      }

      if (name === "rare_hunt") {
        return reply(ctx, `✨ RARE HUNT\n\n🦌 A rare fictional creature has been spotted!`);
      }

      if (name === "legendary_hunt") {
        return reply(ctx, `👑 LEGENDARY HUNT\n\n🐉 A legendary fictional creature has appeared!`);
      }

      if (name === "wild_boss") {
        return reply(ctx, `👹 WILD BOSS\n\n🌲 A fictional world boss has spawned!`);
      }

      if (name === "trophy") {
        return reply(ctx, `🏆 TROPHY ROOM\n\n🎯 Hunts completed: ${u.hunts}\n🏅 Trophies: ${u.trophies.length}`);
      }

      if (name === "expedition") {
        return reply(ctx, `🧭 HUNTING EXPEDITION\n\n🏕️ Expedition team deployed.`);
      }

      if (["forest", "jungle", "mountain", "swamp", "desert"].includes(name)) {
        return reply(ctx, `🗺️ ${name.toUpperCase()}\n\n🌍 Hunting area selected.`);
      }

      const targets = [
        "🦌 Forest Stag",
        "🐗 Wild Boar",
        "🐺 Shadow Wolf",
        "🦅 Mountain Eagle",
        "🐊 Swamp Beast",
        "🐆 Jungle Panther"
      ];

      const target = targets[rand(0, targets.length - 1)];
      const reward = rand(75, 500);

      u.hunts++;
      u.trophies.push(target);
      u.coins += reward;

      return reply(
        ctx,
        `🏹 HUNT SUCCESS!\n\n🎯 Target: ${target}\n💰 Reward: ${money(reward)}\n🏹 Hunts: ${u.hunts}\n💳 Balance: ${money(u.coins)}`
      );
    }
  };
}

/* =========================================================
   🧾 EXTRA SOCIAL ACTIONS
========================================================= */

const actions = {
  introduce: "👋 Introduce",
  wave: "👋 Wave",
  hug: "🤗 Hug",
  highfive: "🙌 High Five",
  handshake: "🤝 Handshake",
  laugh: "😂 Laugh",
  cry: "😢 Cry",
  dance: "💃 Dance",
  sing: "🎤 Sing",
  joke: "😂 Joke",
  story: "📖 Story",
  poll: "📊 Poll",
  vote: "🗳️ Vote",
  question: "❓ Question",
  answer: "💬 Answer",
  truth: "🎭 Truth",
  dare: "🔥 Dare",
  confess: "❤️ Confess",
  complaint: "📢 Complaint",
  compliment: "🌟 Compliment",
  birthday: "🎂 Birthday",
  marry: "💍 Marry",
  divorce: "💔 Divorce",
  adopt: "👶 Adopt",
  family: "👨‍👩‍👧 Family",
  family_tree: "🌳 Family Tree",
  relationship: "❤️ Relationship",
  breakup: "💔 Breakup",
  date: "🌹 Date",
  party: "🎉 Party",
  event: "🎪 Event"
};

for (const [name, label] of Object.entries(actions)) {
  C[name] = {
    name,
    execute: (ctx) =>
      reply(
        ctx,
        `${label}\n\n✨ ${ctx.username || "Player"} used ${name.replace(/_/g, " ")}!\n💬 Community interaction completed.`
      )
  };
}

/* =========================================================
   📦 EXPORT
========================================================= */

module.exports = Object.values(C);
