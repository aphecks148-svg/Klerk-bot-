/**
 * iKON-BOT — static game data.
 *
 * Every list here backs a `.xxx_list` command. The contract enforced by
 * scripts/check-lists.js: every list has at least 15 entries, so no category
 * ships a stub roster.
 */

/* ── ① Pet Labs ─────────────────────────────────────────────────────────── */

const PET_TYPES = [
  "Beast", "Fire", "Water", "Grass", "Ice", "Storm",
  "Shadow", "Light", "Metal", "Arcane", "Dragon", "Cosmic", "Earthen",
  "Poison", "Crystal",
];

const PET_FOOD = [
  "Kibble", "Roast Beef", "Sardine Tin", "Honey Cake", "Moonberry",
  "Ember Jerky", "Frost Mint", "Sun Seeds", "Deep Root", "Star Crumble",
  "River Prawn", "Thunder Nectar", "Shadow Gummy", "Golden Bone", "Divine Feast",
];

const PET_TOYS = [
  "Squeaky Bone", "Wand Feather", "Jumping Ring", "Chew Ball", "Scribble Pad",
  "Ice Cube", "Warm Stone", "Puzzle Cube", "Mirror Disc", "Music Box",
  "Bounce Orb", "Crinkle Tunnel", "Cork Bone", "Bubble Wand", "Dream Lantern",
];

const PET_SKILLS_TREE = [
  "Bite", "Howl", "Ember Fang", "Frost Claw", "Tail Sweep",
  "Sonic Growl", "Venom Spit", "Aerial Dive", "Iron Hide", "Focus",
  "Second Wind", "Crescendo", "Dive Bomb", "Guarded Stance", "Seraph Ray",
];

/* ── ② Finance Vault ────────────────────────────────────────────────────── */

const BANKS = [
  "Pocket Savings", "Standard Current", "High-Yield Vault", "Iron Ledger",
  "Diamond Reserve", "Offline Vault", "Seraph Trust", "Royal Treasury",
  "Vault Tier 1", "Vault Tier 2", "Vault Tier 3", "Vault Tier 4",
  "Vault Tier 5", "International Wire", "Emergency Fund", "Retirement Pot",
];

const INVESTMENTS = [
  "Index Fund", "Government Bond", "Startup Equity", "Real Estate Trust",
  "Gold Bullion", "Municipal Bond", "REIT Units", "Peer Loan",
  "Money Market", "Pension Plan", "Commodity Futures", "Green Energy Bond",
  "Healthcare Fund", "Tech Basket", "Infrastructure Note", "Divine Deposit",
];

const LOAN_TYPES = [
  "Personal Loan", "Auto Loan", "Mortgage", "Payday Loan", "Student Loan",
  "Business Loan", "Crypto Advance", "Pawn Loan", "Micro Loan", "Bridge Loan",
  "Equipment Loan", "Property Loan", "SME Loan", "Seasonal Loan", "Vault Loan", "Divine Loan",
];

const TAX_BRACKETS = [
  "0% Allowance", "10% Basic", "20% Standard", "30% Progressive", "40% High",
  "50% Luxury", "60% Top Earners", "70% Ultra", "80% Whale", "90% Tycoon",
  "95% Baron", "99% Royal", "100% Divine", "Flat Guild Tax", "Property Levy", "Market Duty",
];

const LOAN_SHOP_ITEMS = [
  "Loan Application", "Credit Report", "Collateral Deed", "Repayment Plan",
  "Debt Freeze", "Interest Freeze", "Budget Planner", "Pension Boost",
  "Insurance Policy", "Audit Safe", "Escrow Key", "Notary Seal",
  "Wire Priority", "Foreclosure Ward", "Refinance Token", "Divine Guarantee",
];

/* ── ③ Crime City ───────────────────────────────────────────────────────── */

const CRIME_JOBS = [
  "Pickpocket", "Shoplift", "Burglary", "Carjack", "Fence Goods",
  "Smuggle Run", "Extortion", "Loan Shark", "Arms Deal", "Counterfeit",
  "Black Market", "Hijack Rig", "Warehouse Raid", "Tunnel Dig", "Brass Truck",
  "Crown Heist",
];

const CRIME_WEAPONS = [
  "Brass Knuckles", "Switchblade", "Tire Iron", "Crowbar", "Molotov",
  "Sawn Shotgun", "Silenced Pistol", "Machine Pistol", "Assault Rifle", "Sniper",
  "SMG Vector", "Flamethrower", "Grenade Launcher", "Taser Baton", "Rail Lance", "Seraph Cannon",
];

const CRIME_CARS = [
  "Beat-Up Hatchback", "Sleeper Sedan", "Street Tuner", "Police Interceptor Clone",
  "Vintage Roadster", "Muscle Coupe", "Panel Van", "Armoured Limousine",
  "Super Car", "Getaway Bike", "Cargo Truck", "Cement Mixer",
  "Hot Rod", "Bullet-Proof SUV", "Drift Wagon", "Phantom Limo",
];

const CRIME_GANGS = [
  "The Cobras", "Neon Serpents", "Iron Saints", "Vulture Crew",
  "Riverside Kings", "Dust Wolves", "Midnight Cartel", "The Ledger",
  "Chrome Saints", "Night Harbour", "Razor Choir", "Deep Alley",
  "Cobalt Crew", "Salt Line", "Old Quarter", "The Ninth Floor",
];

const SAFEHOUSES = [
  "Backroom Lockup", "Laundromat Bunker", "Dockside Container", "Neon Arcade",
  "Pawn Shop Back", "Parking Level 3", "Rooftop Flat", "Subway Depot",
  "Hotel Room 12", "Bar Basement", "Garage Row", "Old Theatre",
  "Cargo Lift", "Fish Market", "Quiet Chapel", "Unmarked Office",
];

/* ── ④ Casino Arcade ────────────────────────────────────────────────────── */

/**
 * 45 playable arcade titles. `04_casinoArcade` maps each of these to a real
 * command — the first 15 are hand-written table games, the rest run on the
 * shared arcade engine — so every title here is genuinely playable.
 */
const CASINO_GAMES = [
  "Star Slots", "Blackjack 21", "European Roulette", "American Roulette",
  "Coin Flip", "High/Low", "Dice Roll", "Poker Draw", "Crash Multiplier",
  "Minesweeper Bet", "Prize Wheel", "Jackpot Progressive", "Baccarat",
  "Keno", "Ladder Up", "Tower Blocks", "Candy Drop", "Balloon Pop",
  "Fishing Rod", "Hilo Ride", "Double or Nothing", "Ladder Ladder",
  "Crane Claw", "7s", "Red Dog", "Three Card Poker", "Video Draw", "Martingale",
  "Neon Roulette", "Cyber Dice", "Dream Keno", "Joker Draw", "Pachinko",
  "Rainbow Drop", "Golden Wheel", "Reel Rush", "Ace High", "Lucky Nine",
  "Card Shark", "Jackpot Cube", "Spin Cycle", "Bingo Line", "Scratch Pass",
  "Tower Climb", "Coin Push", "Fire Driller", "Mole Bash",
];

const SLOT_SYMBOLS = [
  "🍒", "🍋", "🍊", "🍉", "🔔", "⭐", "💎", "🔥", "🌈", "👑",
  "🎰", "🃏", "🎯", "🪙", "💰",
];

/** Progressive jackpot ladders, smallest to largest. */
const JACKPOT_TIERS = [
  "Micro Jackpot", "Mini Jackpot", "Minor Jackpot", "Low Jackpot", "Mid Jackpot",
  "Major Jackpot", "High Jackpot", "Mega Jackpot", "Ultra Jackpot", "Giga Jackpot",
  "Legendary Jackpot", "Celestial Jackpot", "Mythic Jackpot", "Divine Jackpot", "Omega Jackpot",
];

/** The 13 card ranks, then the 4 suits — everything a hand can be built from. */
const CARD_DECK = [
  "Ace", "2", "3", "4", "5", "6", "7",
  "8", "9", "10", "Jack", "Queen", "King",
  "♠️ Spades", "♥️ Hearts", "♦️ Diamonds", "♣️ Clubs",
];

/* ── ⑤ Admin Police ─────────────────────────────────────────────────────── */

const POLICE_ROLES = [
  "Patrol Officer", "Desk Sergeant", "Detective", "Traffic Marshal",
  "Evidence Tech", "Cyber Unit", "Vice Squad", "K-9 Handler",
  "SWAT Team", "Tactical Lead", "Chief of Police", "Precinct Chief",
  "Sheriff", "Federal Agent", "State Marshal", "Commissioner",
];

const POLICE_CENTERS = [
  "Central Precinct", "Riverside Station", "Northside Post", "Old Town Hall",
  "Highway Patrol Post", "Harbour Unit", "Market Watch", "Dockside Bureau",
  "University Guard", "Suburb Station", "Airport Response", "Border Checkpoint",
  "Interstate Detail", "Federal Annex", "Night Watch", "Command HQ",
];

const PUNISHMENTS = [
  "Verbal Warning", "Written Warning", "Community Service", "Fine Tier 1",
  "Fine Tier 2", "Fine Tier 3", "Curfew", "Community Lock",
  "Jail Term 1", "Jail Term 2", "Jail Term 3", "Bail Set",
  "Property Confiscation", "Rank Demotion", "Feature Suspension", "Permanent Ban",
];

const BAN_REASONS = [
  "Spam Flood", "Command Abuse", "Harassment", "Impersonation",
  "Scam Attempt", "Bot Farming", "Nsfw Flooding", "Link Dumping",
  "Mention Spam", "Raid Participation", "Exploit Abuse", "Nuking",
  "Token Fraud", "Hate Speech", "Self-Harm Content", "Repeated Warnings",
];

/* ── ⑥ Warzone ──────────────────────────────────────────────────────────── */

const WARZONE_WEAPONS = [
  "Rusty Revolver", "Steel Machete", "Hunting Rifle", "Scattergun", "Assault Carbine",
  "Plasma Rifle", "Rail Cannon", "Flamethrower", "Gauss Sniper", "Minigun",
  "Rocket Launcher", "Tesla Coil", "Frost Blaster", "Arc Caster", "Void Cannon", "Seraph Beam",
];

const WARZONE_LOADOUTS = [
  "Scout", "Rusher", "Sniper Nest", "Heavy Support", "Medic",
  "Engineer", "Sapper", "Recon", "Shotgunner", "Marksman",
  "Demolitions", "Support", "Flanker", "Vanguard", "Wanderer", "Bulwark",
];

const WARZONE_VEHICLES = [
  "Bike", "Quad", "Technical", "Armoured Car", "Buggy",
  "Truck", "APV", "Helicopter", "Drone", "Walker",
  "Hover Bike", "Gun Truck", "Artillery", "Stealth Jet", "Mech", "Seraph Carrier",
];

const WARZONE_MISSIONS = [
  "Hold the Ridge", "Rescue Hostages", "Escort Convoy", "Sabotage Depot",
  "Recover Black Box", "Clear the Tunnels", "Secure Bridge", "Hunt the Commander",
  "Defend Outpost", "Scout the Valley", "Escort the VIP", "Fortify the Perimeter",
  "Salvage the Wreck", "Intercept the Drop", "Burn the Camp", "Storm the Tower",
];

const WARZONE_BOSSES = [
  "Siltjaw", "Rustclaw", "Ironjaw", "Frostmaw", "Ashwraith",
  "Thornhide", "Voidgrinder", "Stormbreaker", "Ironhowl", "Pyreheart",
  "Magmaw", "Frostclaw", "Nightmaw", "Seraphus Prime", "Omega Warden", "The Hollow King",
];

/* ── ⑦ AI Systems ───────────────────────────────────────────────────────── */

const AI_MODELS = [
  "iKON Flash", "iKON Pro", "iKON Reason", "iKON Vision", "iKON Code",
  "iKON Muse", "iKON Oracle", "iKON Nano", "iKON Turbo", "iKON Deep",
  "iKON Scholar", "iKON Whisper", "iKON Forge", "iKON Sage", "iKON Atlas", "iKON Omega",
];

const AI_PERSONAS = [
  "Sarcastic", "Formal", "Poet", "Teacher", "Scientist",
  "Gamer", "Detective", "Chef", "Historian", "Pirate",
  "Cheerleader", "Grumpy Cat", "Philosopher", "Comedian", "Shaman", "Oracle",
];

const AI_PROMPTS = [
  "Summarise this", "Explain simply", "Roast me", "Give me 3 ideas",
  "Write a tagline", "Brainstorm names", "Plan my week", "Compare two options",
  "Make it funny", "Make it epic", "Fix my grammar", "Translate the vibe",
  "Rate my idea", "Continue this story", "Quiz me", "Give me a pep talk",
];

/* ── ⑧ Gathering ────────────────────────────────────────────────────────── */

const CROPS = [
  "Wheat", "Corn", "Rice", "Soybean", "Carrot",
  "Potato", "Berry Bush", "Pumpkin", "Tomato", "Cotton",
  "Cocoa Pod", "Sunflower", "Flax", "Hop Vine", "Sugarcane", "Moon Melon",
];

const ORES = [
  "Stone", "Coal", "Copper", "Iron", "Silver",
  "Gold", "Quartz", "Crystal", "Ruby", "Sapphire",
  "Emerald", "Mithril", "Obsidian", "Adamant", "Divine Ore", "Starlight Shard",
];

const FISH = [
  "Common Carp", "Bluegill", "Perch", "Salmon", "Trout",
  "Sturgeon", "Tuna", "Mackerel", "Pike", "Eel",
  "Koi", "Catfish", "Marlin", "Swordfish", "Moonfish", "Leviathan Fry",
];

const ANIMALS = [
  "Rabbit", "Fox", "Boar", "Deer", "Wolf",
  "Bear", "Elk", "Goat", "Hare", "Badger",
  "Tiger", "Lion", "Panther", "Griffin", "Basilisk", "Wyvern",
];

const TREES = [
  "Oak", "Pine", "Birch", "Willow", "Maple",
  "Cherry", "Ash", "Spruce", "Cedar", "Redwood",
  "Ironbark", "Silverleaf", "Goldleaf", "Nightwood", "Starwood", "World Tree",
];

const GATHER_NODES = [
  "Riverbank", "Quarry Face", "Deep Mine", "Old Growth", "Tide Pool",
  "Dry Riverbed", "Cave Mouth", "Mountain Pass", "Meadow", "Swamp Edge",
  "Glacier Shelf", "Volcanic Vent", "Sunken Wreck", "Sky Ridge", "Bamboo Grove", "Salt Flats",
];

/* ── ⑨ Social Fun ───────────────────────────────────────────────────────── */

const SOCIAL_ACTIONS = [
  "Hug", "Kiss", "Handshake", "High Five", "Fist Bump",
  "Wave", "Bow", "Salute", "Dance", "Spin",
  "Pat", "Tickle", "Poke", "Peek", "Blush",
  "Comfort", "Shout", "Sing", "Pose", "Flex",
  "Selfie", "Nap", "Stretch", "Applaud", "Cheer",
  "Confess", "Compliment", "Roast", "Challenge", "Toast",
  "Hug Bomb", "High Five Wall", "Group Photo", "Storytime", "Whisper",
];

const GAMES = [
  "Truth or Dare", "Would You Rather", "Never Have I Ever", "Two Truths One Lie",
  "Riddle Me This", "Fastest Finger", "Emoji Decoder", "Charades",
  "Twenty Questions", "Story Chain", "Pictionary", "Word Chain",
  "Rock Paper Scissors", "Magic 8 Ball", "Fortune Cookie", "Hot Potato",
  "Mystery Box", "Name That Tune", "Spot the Difference", "Treasure Hunt",
  "Balloon Pop", "Ring Toss", "Card Shuffle", "Coin Duel", "Dice Duel",
  "Simon Says", "Obstacle Course", "Tug of War", "Pillow Fight", "Hide and Seek",
  "Tag", "Duck Duck Goose", "Red Handed", "Last One Standing", "King of the Hill",
];

const JOKES = [
  "Why did the coin go to therapy? It had too many issues.",
  "I told my bank I needed a loan. They said to take a number.",
  "Why don't eggs tell jokes? They'd crack up.",
  "I asked the casino for advice. They said to fold.",
  "What's a pirate's favourite casino game? Aye-odds.",
  "I told my wallet to stop. It had no room for debt.",
  "Why was the computer cold? It left its Windows open.",
  "I lost my pet goldfish. Now I'm learning to cope with aquatic.",
  "What do you call a bear with no teeth? A gummy bear.",
  "My friend said I have great jokes. I told him to stop.",
  "Why did the ghost go broke? Too many boos.",
  "I have a lot of questions. My doctor says it's stage four.",
  "The casino said I was over the limit. I was at row three.",
  "What do you call a cat that swims? A sub-mar-ine.",
  "I asked for a job at the bank and they said I needed experience. I said where do I get it.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "My savings account is so thin it's on a diet.",
  "I tried to make a pun about poker but it was too flush with effort.",
  "The robot joined a band because it already knew the algorithm.",
];

/* ── ⑩ Business, Crypto & Estates ───────────────────────────────────────── */

const BUSINESSES = [
  "Corner Cafe", "Dirt Farm", "Recording Studio", "Retro Arcade", "Coal Mine",
  "Creative Agency", "Logistics Firm", "Tech Lab", "Bookshop", "Craft Brewery",
  "Movie Theatre", "Private Gym", "Auto Repair", "Boutique Hotel", "Food Truck", "SaaS Startup",
];

const PROPERTIES = [
  "Studio Flat", "City Apartment", "Suburban House", "Townhouse", "Beach Bungalow",
  "Country Estate", "Sky Penthouse", "Lakeside Villa", "Mountain Lodge", "Desert Ranch",
  "Castle Keep", "Island Resort", "Private Island", "Space Station", "Floating City", "Olympus Peak",
];

const CRYPTO_COINS = [
  "iKONX", "PIXEL", "NEXUS", "DIVINE", "MOON",
  "SERAPH", "FCA", "DRAGON", "CHAOS", "AURORA",
  "VOID", "NOVA", "ZENITH", "ARCANA", "ELEMENT", "HALO",
];

const STOCKS = [
  "iKON Corp", "NOVA Tech", "META Social", "MOON Energy", "BYTE Systems",
  "GOLD Mining", "VOLT Motors", "AERO Space", "NOVA Bio", "PIXEL Media",
  "IRIS Optics", "ATLAS Freight", "LUMEN Retail", "ORBIT Telecom", "CINDER Steel", "HALO Bank",
];

const ESTATE_UPGRADES = [
  "Furnishings", "Home Cinema", "Private Gym", "Wine Cellar", "Panoramic Windows",
  "Heated Floors", "Sauna", "Infinity Pool", "Garden Suite", "Chef Kitchen",
  "Smart Home Core", "Security Grid", "Art Vault", "Garage Wing", "Rooftop Terrace", "Temple Wing",
];

/* ── ⑪ Levels & Ranks ───────────────────────────────────────────────────── */

const RANKS = [
  "Newcomer", "Recruit", "Novice", "Apprentice", "Adept",
  "Veteran", "Elite", "Champion", "Master", "Grandmaster",
  "Legend", "Mythic", "Divine", "Seraph", "Icon", "iKON",
];

const TITLES = [
  "Rookie", "Street Runner", "Pet Tamer", "Vault Keeper", "Card Shark",
  "Gunslinger", "Prompt Master", "Forager", "Heartthrob", "Broker",
  "Duelist", "Questor", "Builder", "Collector", "Boss Hunter", "Champion",
];

const ACHIEVEMENTS = [
  "First Login", "First Trade", "Pet Tamer", "Millionaire", "Billionaire",
  "Arena Victor", "Divine Pull", "Level 50", "Level 100", "Casino King",
  "Crime Lord", "Gather Lord", "Property Baron", "Crypto Whale", "AI Whisperer", "Social Butterfly",
];

const QUESTS = [
  "Daily Hunt", "Farm Five", "Win a Battle", "Catch a Pokemon", "Help a Friend",
  "Earn Daily", "Spin the Wheel", "Mine Ten", "Fish Ten", "Craft Three",
  "Rob a Rival", "Place a Bet", "Buy a Business", "Upgrade an Estate", "Train a Pet", "Reach Level 10",
  "Complete 5 Quests", "Survive a World Boss", "Top the Leaderboard", "Invite a Friend",
  "Collect 10 Badges", "Master all Skills", "Fill the Almanac", "Break a Record", "Divine Ascension",
];

const BADGES = [
  "Early Bird", "Night Owl", "Pet Master", "Rich", "Warrior",
  "Scholar", "Builder", "Explorer", "Collector", "Gambler",
  "Tamer", "Healer", "Scout", "Champion", "Founder", "Legend",
];

/* ── ⑫ Inventory & Craft ───────────────────────────────────────────────── */

const WEAPONS = [
  "Wood Blade", "Iron Sword", "Steel Axe", "Steel Bow", "Hunter Spear",
  "Warhammer", "Steel Dagger", "Rune Blade", "Storm Bow", "Flame Staff",
  "Frost Wand", "Thunder Halberd", "Void Saber", "Divine Rapier", "Seraph Lance", "Obsidian Greatsword",
];

const ARMOUR = [
  "Cloth Vest", "Leather Cuirass", "Chain Mail", "Studded Jacket", "Scale Coat",
  "Bronze Plate", "Iron Plate", "Shadow Cloak", "Rune Plate", "Frost Armour",
  "Flame Armour", "Storm Plate", "Void Mail", "Seraph Plate", "Divine Aegis", "Starforged Plate",
];

const MATERIALS = [
  "Wood", "Stone", "Iron Ore", "Leather", "String",
  "Copper Ingot", "Steel Ingot", "Silver Ingot", "Gold Ingot", "Crystal Shard",
  "Ruby", "Sapphire", "Emerald", "Mithril", "Divine Essence", "Star Fragment",
];

const RECIPES = [
  "Health Potion", "Mana Elixir", "Pokeball", "Iron Blade", "XP Elixir",
  "Divine Charm", "Leather Vest", "Chain Mail", "Bow", "Arrow Bundle",
  "Smoked Fish", "Roast Meat", "Bread Loaf", "Cheese Wheel", "Torch", "Lockpick",
  "Gem Detector", "Coolant Flask", "Stealth Cloak", "Signal Flare",
];

/* ── ⑬ World Events ─────────────────────────────────────────────────────── */

const WORLD_BOSSES = [
  "Stone Colossus", "Bog Matron", "Ashen Wyrm", "Frost Tyrant", "Thorn Sovereign",
  "Plague Merchant", "Iron Golem", "Storm Herald", "Shadow Regent", "Blood Tide",
  "Desert Sphinx", "Glacier Behemoth", "Magma Drake", "Void Herald", "Rune Juggernaut", "World Serpent",
];

const MAP_LOCATIONS = [
  "Starting Village", "Iron Market", "Whispering Woods", "Sunken Docks", "Sunset Strip",
  "Clocktower", "Frozen Pass", "Ashfall Ridge", "Crystal Caverns", "The Undercity",
  "Sky Gardens", "Salt Flats", "Old Graveyard", "Observatory", "Sand Temple", "Neon City",
];

const NPCS = [
  "Merchant", "Blacksmith", "Healer", "Scribe", "Innkeeper",
  "Trainer", "Fisher", "Farmer", "Miner", "Hunter",
  "Guard Captain", "Auctioneer", "Alchemist", "Cartographer", "Storyteller", "Mysterious Stranger",
];

const WORLDS = [
  "Overworld", "Iron Realm", "Moss Realm", "Frost Realm", "Ash Realm",
  "Storm Realm", "Tide Realm", "Shade Realm", "Sun Realm", "Deep Realm",
  "Void Realm", "Aether Realm", "Neon Realm", "Flesh Realm", "Dream Realm", "The Core",
];

const TIMEZONES = [
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Shanghai", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland", "America/New_York", "America/Chicago", "America/Sao_Paulo", "America/Los_Angeles",
];

/* ── ⑭ System Core ─────────────────────────────────────────────────────── */

/** Vault protection tiers, weakest → strongest. */
const VAULT_TIERS = [
  "bronze", "copper", "iron", "steel", "silver",
  "gold", "platinum", "titanium", "onyx", "emerald",
  "sapphire", "ruby", "obsidian", "voidglass", "divine",
];

/** Pet rarity ladder — mirrors RARITIES in pets.js. */
const RARITY_LIST = [
  "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine",
  "Godly", "Celestial", "Astral", "Eternal", "Primordial", "Apocalyptic", "Transcendent", "iKON",
];

const RULES = [
  "Be kind to everyone in the group — this is a shared space.",
  "No spam, no self-botting, no multi-accounting.",
  "Commands that cost coins can fail — gamble responsibly.",
  "Rob and trade only with consent; the bot holds no liability.",
  "Do not mass-mention; it slows the group and may mute you.",
  "Admins can mute, ban, and restrict features at any time.",
  "Bot data may be reset on major updates; do not hoard single items.",
  "No NSFW, hate speech, or links to pirated content.",
  "Report bugs with a screenshot and the exact command used.",
  "Have fun, and may your rolls be ever in your favour.",
  "Do not use the bot to harass anyone outside this group.",
  "Never share your account cookies or app state with anyone.",
  "Keep financial commands to your own account; no account trading.",
  "Claim only what you earned — farms get reset without warning.",
  "If a command feels broken, use the report command instead of spamming it.",
];

const LANGS = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Russian", "Turkish", "Arabic",
  "Hindi", "Indonesian", "Japanese", "Korean", "Chinese", "Filipino",
];

const REASONS = [
  "Not a real feature", "Duplicate of another command", "Bug report", "Suggestion",
  "Balance feedback", "New category idea", "Bug in pet art", "Wrong list data",
  "Cooldown too long", "Cooldown too short", "Error message unclear", "Typo in output",
  "Command not responding", "Wrong number on cooldown", "List is incomplete", "Other",
];

module.exports = {
  PET_TYPES,
  PET_FOOD,
  PET_TOYS,
  PET_SKILLS_TREE,
  BANKS,
  INVESTMENTS,
  LOAN_TYPES,
  TAX_BRACKETS,
  LOAN_SHOP_ITEMS,
  CRIME_JOBS,
  CRIME_WEAPONS,
  CRIME_CARS,
  CRIME_GANGS,
  SAFEHOUSES,
  CASINO_GAMES,
  SLOT_SYMBOLS,
  JACKPOT_TIERS,
  CARD_DECK,
  POLICE_ROLES,
  POLICE_CENTERS,
  PUNISHMENTS,
  BAN_REASONS,
  WARZONE_WEAPONS,
  WARZONE_LOADOUTS,
  WARZONE_VEHICLES,
  WARZONE_MISSIONS,
  WARZONE_BOSSES,
  AI_MODELS,
  AI_PERSONAS,
  AI_PROMPTS,
  CROPS,
  ORES,
  FISH,
  ANIMALS,
  TREES,
  GATHER_NODES,
  SOCIAL_ACTIONS,
  GAMES,
  JOKES,
  BUSINESSES,
  PROPERTIES,
  CRYPTO_COINS,
  STOCKS,
  ESTATE_UPGRADES,
  RANKS,
  TITLES,
  ACHIEVEMENTS,
  QUESTS,
  BADGES,
  WEAPONS,
  ARMOUR,
  MATERIALS,
  RECIPES,
  WORLD_BOSSES,
  MAP_LOCATIONS,
  NPCS,
  WORLDS,
  TIMEZONES,
  VAULT_TIERS,
  RARITY_LIST,
  RULES,
  LANGS,
  REASONS,
};
