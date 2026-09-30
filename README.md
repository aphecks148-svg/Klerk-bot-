# iKON-BOT v5.0 Divine

Modular Facebook automation bot built for Render with `ws3-fca`, Express, MongoDB/Mongoose, Axios, node-canvas, and Gemini.

## What is included

- 14 isolated plugin folders, each with a `manifest.json` and `index.js`
- Exactly 50 commands per plugin: **700 commands total**
- 50 pets with the requested rarity split: 15 Common, 12 Uncommon, 10 Rare, 7 Epic, 3 Legendary, 2 Mythic, 1 Divine
- Render keep-alive server: `GET /` reports status, uptime, Mongo mode, and total commands
- `APPSTATE` login through `ws3-fca` with auto-reconnect
- Mongo schemas for `User`, `Pet`, `Cooldown`, `Business`, and `Transaction`
- Canvas menus, profile cards, pet cards, battle cards, and Pokémon spawn cards
- Axios-backed PokeAPI and image downloads
- Gemini commands through `@google/generative-ai`
- Message-count Pokémon spawns every 20 messages by default, with admin rate control
- Category auto-reactions, keyword heart reactions, error/success reactions, and admin toggle
- Runtime plugin reload/enable/disable without restarting the process

## Render setup

Create a Render Web Service from this repository:

```text
Build command: npm install
Start command: npm start
Health check: /
```

Set these environment variables in Render:

| Variable | Required | Description |
| --- | --- | --- |
| `APPSTATE` | Production | JSON array from the Facebook session |
| `MONGO_URI` | Production | MongoDB connection string |
| `GEMINI_KEY` | For AI | Google Gemini API key |
| `ADMIN_IDS` | Recommended | Comma-separated Facebook IDs |
| `PREFIX` | Optional | Defaults to `!`; `/` is also accepted |
| `PORT` | Optional | Render supplies it; local default is `10000` |

Without credentials, the service intentionally remains online in safe mode so Render can still reach the health endpoint and report the missing configuration.

## Examples

```text
!menu
!profile
!adopt iKON Seraph
!petcard phoenix
!battle
!catch
!pokedex
!ai explain recursion
!pokemon_rate 10       # admin
!plugin_reload 07_aiSystems  # admin
```

Never commit `APPSTATE`, API keys, or a MongoDB password. Use Render environment variables.