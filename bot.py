import os
import json
import time
import random
from threading import Timer
from fbchat import Client
from fbchat.models import *

def fake_login(self, email, password, max_tries=1, user_agent=None):
    return True
Client.login = fake_login

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


class KlerkBot(Client):
    def onMessage(self, author_id, message_object, thread_id, thread_type, **kwargs):
        
if __name__ == "__main__":
    COOKIE = os.environ.get("COOKIE")
    if not COOKIE:
        print("Set COOKIE env var to your Facebook appState JSON")
        exit(1)

    client = KlerkBot("", "", session_cookies=json.loads(COOKIE))
    client.listen()
