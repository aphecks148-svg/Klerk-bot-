import os
import json
import time
import random
from threading import Timer
from fbchat import Client
from fbchat.models import *

DATA_FILE = "economy.json"
if os.path.exists(DATA_FILE):
    with open(DATA_FILE) as f:
        economy = json.load(f)
else:
    economy = {}

heists = {}

def save_data():
    with open(DATA_FILE, "w") as f:
        json.dump(economy, f)

def get_user(uid):
    if uid not in economy:
        economy[uid] = {
            "coins": 100, "bank": 0, "lastDaily": 0, "lastRob": 0, "lastHeist": 0,
            "lastPetWork": 0, "lastExplore": 0, "items": [],
            "pet": None, "petLastClaim": 0, "petHP": 100,
            "petLevel": 1, "petExp": 0, "prestige": 0
        }
    return economy[uid]

PETS = {
    "cat": {"cost": 1000, "income": 50, "hp": 100, "atk": 10},
    "dog": {"cost": 2000, "income": 120, "hp": 140, "atk": 15},
    "rabbit": {"cost": 1200, "income": 70, "hp": 90, "atk": 8},
    "hamster": {"cost": 800, "income": 40, "hp": 70, "atk": 6},
    "parrot": {"cost": 1500, "income": 90, "hp": 100, "atk": 12},
    "turtle": {"cost": 1800, "income": 100, "hp": 180, "atk": 7},
    "squirrel": {"cost": 1300, "income": 80, "hp": 95, "atk": 9},
    "fox": {"cost": 5000, "income": 300, "hp": 180, "atk": 25},
    "wolf": {"cost": 8000, "income": 500, "hp": 220, "atk": 30},
    "eagle": {"cost": 7000, "income": 450, "hp": 200, "atk": 28},
    "panther": {"cost": 10000, "income": 650, "hp": 260, "atk": 40},
    "tiger": {"cost": 12000, "income": 750, "hp": 280, "atk": 45},
    "bear": {"cost": 15000, "income": 900, "hp": 350, "atk": 55},
    "dragon": {"cost": 10000, "income": 800, "hp": 300, "atk": 50},
    "griffin": {"cost": 14000, "income": 850, "hp": 320, "atk": 52},
    "kraken": {"cost": 13000, "income": 820, "hp": 340, "atk": 48},
    "phoenix": {"cost": 25000, "income": 1500, "hp": 400, "atk": 70},
    "unicorn": {"cost": 50000, "income": 3000, "hp": 500, "atk": 90},
    "basilisk": {"cost": 30000, "income": 1800, "hp": 450, "atk": 80},
    "hydra": {"cost": 35000, "income": 2100, "hp": 480, "atk": 85},
    "wyvern": {"cost": 22000, "income": 1300, "hp": 380, "atk": 65},
    "gargoyle": {"cost": 20000, "income": 1200, "hp": 360, "atk": 60},
    "leviathan": {"cost": 38000, "income": 2300, "hp": 520, "atk": 95},
    "pegasus": {"cost": 28000, "income": 1700, "hp": 420, "atk": 75},
    "cerberus": {"cost": 60000, "income": 3500, "hp": 600, "atk": 110},
    "minotaur": {"cost": 55000, "income": 3200, "hp": 580, "atk": 105},
    "sphinx": {"cost": 70000, "income": 4000, "hp": 650, "atk": 120},
    "chimera": {"cost": 65000, "income": 3800, "hp": 620, "atk": 115},
    "fenrir": {"cost": 80000, "income": 4500, "hp": 700, "atk": 130},
    "jormungandr": {"cost": 90000, "income": 5000, "hp": 750, "atk": 140},
    "bahamut": {"cost": 100000, "income": 5500, "hp": 800, "atk": 150},
    "zhulong": {"cost": 85000, "income": 4800, "hp": 720, "atk": 135},
    "seraph": {"cost": 150000, "income": 8000, "hp": 900, "atk": 170},
    "leviathanPrime": {"cost": 200000, "income": 10000, "hp": 1000, "atk": 190},
    "titan": {"cost": 250000, "income": 12000, "hp": 1100, "atk": 210},
    "voidDragon": {"cost": 300000, "income": 15000, "hp": 1200, "atk": 230},
    "cosmicPhoenix": {"cost": 350000, "income": 18000, "hp": 1300, "atk": 250},
    "eldritchHorror": {"cost": 400000, "income": 20000, "hp": 1400, "atk": 270},
    "primordial": {"cost": 450000, "income": 23000, "hp": 1500, "atk": 290},
    "omegaBeast": {"cost": 500000, "income": 25000, "hp": 1600, "atk": 300},
    "abyssalGod": {"cost": 600000, "income": 30000, "hp": 1800, "atk": 330},
    "celestialSerpent": {"cost": 750000, "income": 35000, "hp": 2000, "atk": 360},
    "starEater": {"cost": 1000000, "income": 45000, "hp": 2200, "atk": 400},
    "chaosLord": {"cost": 1500000, "income": 60000, "hp": 2500, "atk": 450},
    "genesisWyrm": {"cost": 2000000, "income": 80000, "hp": 3000, "atk": 500}
}

SHOP = {"shield": 500, "bomb": 300, "heal_potion": 200}

BOSS_PETS = {30: "phoenix", 35: "unicorn", 40: "cerberus", 45: "bahamut", 50: "voidDragon"}

def gain_exp(user, amount):
    user["petExp"] += amount
    if user["petLevel"] >= 50:
        return False
    needed = user["petLevel"] * 100
    if user["petExp"] >= needed:
        user["petExp"] -= needed
        user["petLevel"] += 1
        user["petHP"] = PETS[user["pet"]["name"]]["hp"]
        return True
    return False

class KlerkBot(Client):
    def onMessage(self, author_id, message_object, thread_id, thread_type, **kwargs):
        if author_id == self.uid:
            return

        user = get_user(author_id)
        msg = message_object.text
        if not msg:
            return
        args = msg.strip().split()
        cmd = args[0].lower()
        now = time.time()

        def send(text):
            self.send(Message(text=text), thread_id=thread_id, thread_type=thread_type)

        # Economy
        if cmd == "!bal":
            pet_info = f"Pet: {user['pet']['name']} Lvl{user['petLevel']}" if user["pet"] else "No pet"
            hp = user["petHP"] if user["pet"] else 0
            max_hp = PETS[user["pet"]["name"]]["hp"] if user["pet"] else 0
            send(f"💰 Wallet: {user['coins']}\n🏦 Bank: {user['bank']}\n{pet_info}\nHP: {hp}/{max_hp}\nItems: {', '.join(user['items']) or 'None'}")

        elif cmd == "!daily":
            if now - user["lastDaily"] < 86400:
                send("You already claimed daily. Come back tomorrow.")
            else:
                user["coins"] += 200
                user["lastDaily"] = now
                save_data()
                send("✅ Daily claimed: 200 coins")

        elif cmd == "!work":
            if now - user.get("lastWork", 0) < 3600:
                send("You need to rest. Try again in 1 hour.")
            else:
                reward = random.randint(50, 250)
                user["coins"] += reward
                user["lastWork"] = now
                save_data()
                send(f"💼 You worked and earned {reward} coins")

        # Bank
        elif cmd == "!bank":
            if len(args) < 2:
                send("Usage:!bank dep/wit/bal")
                return
            sub = args[1]
            if sub in ["dep", "deposit"]:
                amount = user["coins"] if args[2] == "all" else int(args[2])
                if amount <= 0 or amount > user["coins"]:
                    send("Usage:!bank dep <amount/all>")
                else:
                    user["coins"] -= amount
                    user["bank"] += amount
                    save_data()
                    send(f"🏦 Deposited {amount}. Bank: {user['bank']}")
            elif sub in ["wit", "withdraw"]:
                amount = user["bank"] if args[2] == "all" else int(args[2])
                if amount <= 0 or amount > user["bank"]:
                    send("Usage:!bank wit <amount/all>")
                else:
                    user["bank"] -= amount
                    user["coins"] += amount
                    save_data()
                    send(f"💸 Withdrew {amount}. Wallet: {user['coins']}")
            elif sub == "bal":
                send(f"🏦 Bank: {user['bank']}\n💰 Wallet: {user['coins']}")

        # Pets
        elif cmd == "!pet":
            if len(args) < 2:
                send("Usage:!pet buy/claim/info")
                return
            sub = args[1]
            if sub == "buy":
                pet_name = args[2]
                if pet_name not in PETS:
                    send("Pet not found.")
                elif user["coins"] < PETS[pet_name]["cost"]:
                    send("Not enough coins.")
                else:
                    user["coins"] -= PETS[pet_name]["cost"]
                    user["pet"] = {"name": pet_name, "income": PETS[pet_name]["income"]}
                    user["petHP"] = PETS[pet_name]["hp"]
                    save_data()
                    send(f"✅ Adopted {pet_name}! Income: {PETS[pet_name]['income']}/hr. Use!pet claim")
            elif sub == "claim":
                if not user["pet"]:
                    send("No pet yet.")
                elif now - user["petLastClaim"] < 3600:
                    send("Pet not ready. Try in 1 hour.")
                else:
                    mult = (1 + user["petLevel"] * 0.1) * (1 + user["prestige"] * 0.2)
                    income = int(PETS[user["pet"]["name"]]["income"] * mult)
                    user["coins"] += income
                    user["petLastClaim"] = now
                    save_data()
                    send(f"🐾 Your {user['pet']['name']} gave {income} coins!")
            elif sub == "info":
                if not user["pet"]:
                    send("No pet yet.")
                else:
                    p = user["pet"]["name"]
                    send(f"Pet: {p}\nLevel: {user['petLevel']}\nExp: {user['petExp']}/{user['petLevel']*100}\nHP: {user['petHP']}/{PETS[p]['hp']}\nIncome: {PETS[p]['income']}/hr")

        elif cmd == "!petwork":
            if not user["pet"]:
                send("No pet.")
            elif now - user["lastPetWork"] < 1800:
                send("Pet is tired. Try in 30 min.")
            else:
                base = random.randint(50, PETS[user["pet"]["name"]]["income"])
                mult = (1 + user["petLevel"] * 0.1) * (1 + user["prestige"] * 0.2)
                earn = int(base * mult)
                user["coins"] += earn
                user["lastPetWork"] = now
                leveled = gain_exp(user, 20)
                save_data()
                msg = f"🐾 Earned {earn} coins!"
                if leveled:
                    msg += f"\n🎉 Level up! Now level {user['petLevel']}"
                send(msg)

        elif cmd == "!petfood":
            if not user["pet"]:
                send("No pet.")
            elif user["coins"] < 50:
                send("Need 50 coins.")
            else:
                user["coins"] -= 50
                user["petHP"] = min(PETS[user["pet"]["name"]]["hp"], user["petHP"] + 40)
                save_data()
                send(f"🍖 Fed {user['pet']['name']}. HP: {user['petHP']}/{PETS[user['pet']['name']]['hp']}")

        elif cmd == "!petheal":
            if not user["pet"]:
                send("No pet.")
            elif "heal_potion" not in user["items"]:
                send("No Heal Potion.")
            else:
                user["items"].remove("heal_potion")
                user["petHP"] = PETS[user["pet"]["name"]]["hp"]
                save_data()
                send(f"💊 Full heal! {user['pet']['name']} HP: {user['petHP']}")

        elif cmd == "!petexplore":
            if not user["pet"]:
                send("No pet.")
            elif now - user["lastExplore"] < 1800:
                send("Exploring. Try in 30 min.")
            else:
                user["lastExplore"] = now
                roll = random.random()
                result = ""
                if roll < 0.01 and user["petLevel"] >= 30:
                    boss_lvl = (user["petLevel"] // 5) * 5
                    boss = BOSS_PETS.get(boss_lvl, "phoenix")
                    if not user["pet"] or PETS[boss]["cost"] > PETS[user["pet"]["name"]]["cost"]:
                        user["pet"] = {"name": boss, "income": PETS[boss]["income"]}
                        user["petHP"] = PETS[boss]["hp"]
                        result = f"👑 Found and tamed {boss}!"
                    else:
                        result = f"👑 Found {boss} but yours is stronger."
                elif roll < 0.4:
                    coins = random.randint(50, 250)
                    user["coins"] += coins
                    result = f"🐾 Found {coins} coins!"
                elif roll < 0.6:
                    user["items"].append("heal_potion")
                    result = "📦 Found Heal Potion!"
                elif roll < 0.8:
                    user["items"].append("mystery_box")
                    result = "📦 Found Mystery Box!"
                else:
                    result = "🌲 Found nothing."
                save_data()
                send(result)

        elif cmd == "!petfight":
            if not user["pet"]:
                send("No pet.")
            elif not message_object.mentions:
                send("Tag someone:!petfight @user")
            else:
                target_id = list(message_object.mentions.keys())[0]
                target = get_user(target_id)
                if not target["pet"]:
                    send("They have no pet.")
                elif user["petHP"] <= 0:
                    send("Your pet needs heal.")
                elif target["petHP"] <= 0:
                    send("Their pet is down.")
                else:
                    your_atk = PETS[user["pet"]["name"]]["atk"]
                    their_atk = PETS[target["pet"]["name"]]["atk"]
                    target["petHP"] -= your_atk
                    user["petHP"] -= their_atk

                    if target["petHP"] <= 0 and user["petHP"] > 0:
                        reward = 200
                        user["coins"] += reward
                        target["petHP"] = 0
                        leveled = gain_exp(user, 30)
                        save_data()
                        msg = f"⚔️ You won! +{reward} coins."
                        if leveled:
                            msg += f"\n🎉 Level up! Now {user['petLevel']}"
                        msg += f"\nYour HP: {user['petHP']}\nTheir HP: 0"
                        send(msg)
                    elif user["petHP"] <= 0 and target["petHP"] > 0:
                        save_data()
                        send(f"💀 You lost!\nYour HP: 0\nTheir HP: {target['petHP']}")
                    else:
                        save_data()
                        send(f"🤝 Draw!\nYour HP: {user['petHP']}\nTheir HP: {target['petHP']}")

        elif cmd == "!petprestige":
            if not user["pet"]:
                send("No pet.")
            elif user["petLevel"] < 50:
                send("Need level 50.")
            else:
                user["prestige"] += 1
                user["petLevel"] = 1
                user["petExp"] = 0
                user["petHP"] = PETS[user["pet"]["name"]]["hp"]
                save_data()
                send(f"⭐ Prestige {user['prestige']}! +{user['prestige']*20}% income forever.")

        # Items
        elif cmd == "!open":
            if "mystery_box" not in user["items"]:
                send("No Mystery Box.")
            else:
                user["items"].remove("mystery_box")
                roll = random.random()
                if roll < 0.5:
                    coins = random.randint(100, 600)
                    user["coins"] += coins
                    reward = f"{coins} coins"
                elif roll < 0.8:
                    user["items"].append("heal_potion")
                    reward = "Heal Potion"
                elif roll < 0.95:
                    user["items"].append("bomb")
                    reward = "Bomb"
                else:
                    user["coins"] += 2000
                    reward = "2000 coins - JACKPOT!"
                save_data()
                send(f"📦 Opened box: {reward}")

        elif cmd == "!shop":
            send("🛒 Shop:\nshield - 500\nbomb - 300\nheal_potion - 200\nUse!buy <item>")

        elif cmd == "!buy":
            item = args[1] if len(args) > 1 else None
            if item not in SHOP:
                send("Item not found.")
            elif user["coins"] < SHOP[item]:
                send("Not enough coins.")
            else:
                user["coins"] -= SHOP[item]
                user["items"].append(item)
                save_data()
                send(f"✅ Bought {item}")

        # Heist
        elif cmd == "!heist":
            sub = args[1] if len(args) > 1 else None
            if sub == "start":
                if thread_id in heists:
                    send("Heist already running!")
                else:
                    heists[thread_id] = {"players": [author_id]}
                    send("🚨 Heist started! Type!heist join. Starts in 30s...")
                    def end_heist():
                        h = heists.get(thread_id)
                        if not h:
                            return
                        pot = len(h["players"]) * 200
                        success = random.random() < 0.3 + len(h["players"]) * 0.1
                        if success:
                            share = pot // len(h["players"])
                            for pid in h["players"]:
                                get_user(pid)["coins"] += share
                            self.send(Message(text=f"💰 Success! Each gets {share} coins."), thread_id=thread_id, thread_type=thread_type)
                        else:
                            loss = 100
                            for pid in h["players"]:
                                get_user(pid)["coins"] -= loss
                            self.send(Message(text=f"❌ Failed! Each loses {loss} coins."), thread_id=thread_id, thread_type=thread_type)
                        save_data()
                        del heists[thread_id]
                    Timer(30, end_heist).start()
            elif sub == "join":
                if thread_id not in heists:
                    send("No active heist.")
                elif author_id not in heists[thread_id]["players"]:
                    heists[thread_id]["players"].append(author_id)
                    send(f"Joined! {len(heists[thread_id]['players'])} players.")

        # Leaderboard
        elif cmd in ["!lb", "!leaderboard"]:
            sorted_users = sorted(economy.items(), key=lambda x: x[1]["coins"] + x[1]["bank"], reverse=True)[:10]
            msg = "🏆 Top 10:\n"
            for i, (uid, data) in enumerate(sorted_users, 1):
                msg += f"{i}. {uid[:8]}... - {data['coins'] + data['bank']} coins\n"
            send(msg)

        elif cmd == "!help":
            send("Economy:!bal!bank dep/wit/bal!daily!work\nPets:!pet buy/claim/info!petwork!petfood!petheal!petexplore!petfight @user!petprestige\nItems:!shop!buy <item>!open\nPvP:!heist start/join\nOther:!lb")

if __name__ == "__main__":
    COOKIE = os.environ.get("COOKIE")
    if not COOKIE:
        print("Set COOKIE env var to your Facebook appState JSON")
        exit(1)
import json

class KlerkBot(Client):
    def login(self, email, password, max_tries=1, user_agent=None):
        
        self._state = self._State()
        self._state.session.cookies.update(json.loads(COOKIE))
        return True

client = KlerkBot("x", "x")
client.listen()
