// iKON-BOT - 545 MAIN × 5 SUBS = 2,725 TOTAL - LOCKED REGISTRY
// Owner: Aphecks iKon Klerk | Bot: iKON-BOT | Clean Aesthetic
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');

const fcaRaw = require('ws3-fca');
const login = typeof fcaRaw === 'function'? fcaRaw : (fcaRaw.login || fcaRaw.default);

const app = express();
app.get('/', (req,res)=> res.send(`iKON-BOT 2725 ONLINE - ${new Date().toISOString()}`));
app.listen(process.env.PORT || 10000, ()=> console.log("Port listening"));

// ENV
const OWNER_ID = process.env.OWNER_ID || "100086783504073";
const GEMINI_KEY = process.env.GEMINI_KEY || "";
let APPSTATE;
try{
  let raw = process.env.APPSTATE?.trim() || "";
  if((raw.startsWith('"')&&raw.endsWith('"'))||(raw.startsWith("'")&&raw.endsWith("'"))) raw=raw.slice(1,-1);
  APPSTATE = raw? JSON.parse(raw) : JSON.parse(fs.readFileSync('./appstate.json','utf8'));
  console.log(`APPSTATE ${APPSTATE.length}`);
}catch(e){ APPSTATE=[]; console.error("APPSTATE fail", e.message); }

let data = fs.existsSync("./data.json")? JSON.parse(fs.readFileSync("./data.json")) : { users:{}, threads:{}};
if(!data.users) data.users={}; if(!data.threads) data.threads={};
const save=()=>fs.writeFileSync("./data.json", JSON.stringify(data,null,2));
const getUser=(uid)=>{ if(!data.users[uid]) data.users[uid]={cash:5000000,bank:20000000,level:1,xp:0,pets:[],banned:false}; return data.users[uid]; };
const getThread=(tid)=>{ if(!data.threads[tid]) data.threads[tid]={whitelist:[OWNER_ID]}; return data.threads[tid]; };

// ===== LOCKED REGISTRY - 545 MAIN =====
const REGISTRY = {
  "① PET LABS": ["pets","buypet","sellpet","rename","release","equip","unequip","favorite","giftpet","inspect","insurance","salvage","feed","water","heal","revive","sleep","wake","clean","pet_doctor","vitamin","steroid","diet","vaccine","petbattle","pve_hunt","arena_rank","skills","upgrade_skill","defend","flee","spectate","challenge_bot","bet_battle","damage_matrix","rage","pet_breed","pet_fusion","evolve","mutate","incubate","hatch","clone","gene_splice","dna_bank","de_evolve","ascend","sterilize","pet_shop","buy_toy","play","buy_potion","use_potion","craft_item","item_vault","collar","leash","market_list","market_buy","cosmetics","scrap","scavenge","pet_job","guard_home","patrol","track_user","smuggle_pet","pet_expo","mine_crypto","tax_collector","spy","rescue","safari","cyber_enhance","dna_sequence","clone_vats","graft_trait","cryo_freeze","bio_waste","nano_heal","guild_register","guild_raid","pet_pageant","trick_show","licensing","bounty_hound","smell_contraband","pet_psych","loyalty_oath","jealousy","pack_order","temperament","comfort","hibernation","blackmarket_pet","pet_ransom","poach","tax_evasion_pet","scrap_gear","pet_loan"],
  "② FINANCE": ["balance","deposit","withdraw","transfer","give","daily","weekly","monthly","shop","inventory","salary","paytaxes","vault_lock","loan","credit_score","atm_hack","bounty_escrow","laundering","wallet_upgrade","invoice","charity_fund","pawn","gold_bar","audit","subsidies","bankruptcy","insurance_buy","will_testament","offshore_trust","counterfeit","business_buy","business_revenue","hire_npc","fire_npc","upgrade_tech","franchise","supply_chain","marketing","bribe_official","corporate_raid","shares_issue","real_estate","permit_apply","headquarters","union_negotiate","corporate_bonds","merger","vandalize_rival","business_sell","insure_business","stock_buy","stock_sell","stock_portfolio","stock_market","stock_vanguard","stock_tesla","stock_apple","stock_google","stock_amazon","stock_meta","stock_nvidia","stock_microsoft","stock_spacex","stock_cyberdyne","stock_starkcorp","stock_wayneent","stock_umbrella","stock_robocorp","stock_insider","stock_options","crypto_buy","crypto_sell","crypto_wallet","crypto_exchange","crypto_btc","crypto_eth","crypto_sol","crypto_doge","crypto_usdt","crypto_citycoin","crypto_darkcoin","crypto_nft","crypto_stake","crypto_rig","crypto_ico","crypto_rugpull","crypto_airdrop","crypto_futures","crypto_whale","crypto_hack"],
  "③ CRIME": ["gta_mission_1","gta_mission_2","gta_mission_3","gta_mission_4","gta_mission_5","gta_mission_6","gta_mission_7","gta_mission_8","gta_mission_9","gta_mission_10","gta_mission_11","gta_mission_12","gta_mission_13","gta_mission_14","gta_mission_15","gta_mission_16","gta_mission_17","gta_mission_18","gta_mission_19","gta_mission_20","heist","crew_join","crew_kick","heist_plan","rob","hack","mug","bounty_hunt","scam","counterfeit","carjack","extort","loan_shark","shred_records","weapons","buyweapon","garage","modcar","smuggle","armory_store","chop_shop","blackmarket","warehouse","safehouse","crew_create","turf_claim","turf_war","rank_respect","gang_upgrade","smuggle_sea","smuggle_air","hit_list","money_laund","bribe_cop","jail_break","infiltrate","snitch","wire_tap","informant","underworld","street_race","heist_prep","safe_crack","syndicate_hq"],
  "④ ARCADE": ["slots","coinflip","blackjack","roulette","dice_roll","poker","baccarat","lottery","scratch_card","horse_race","wheel_fortune","high_low","keno","craps","plinko","mines","crash","cups","spin_dice","crypto_slots","diamond_mine","fortune_teller","vip_lounge","casino_rob","bet_insurance","token_exchange","gambling_lb","casino_streak","house_bank","cheat_shop","counting","football","quiz","wrestle","event_join","event_status","air_drop","bank_panic","riot_alert","market_crash","crypto_pump","plague_outbreak","alien_invasion","natural_disaster","gang_warfare","mayor_elections","blackout","gold_rush","bounty_frenzy","festival","uprising","cyber_attack","meteor_shower","blackmarket_run","arena_games","scavenger_hunt","tax_holiday","shark_attack","zombie_wave","hyper_inflation","mafia_execution","spy_ring","convoy_heist","monopoly_deal","streak_check","profile_ping","roast","hint","marry_chat","flirt_chat","chat_lb","gift_item","trade_request","reputation","clan_chat","party_create","leaderboards","achievements","title_equip","chat_stats","daily_quest","mini_boss","duel","emoji_shop","user_bio","friend_add","block_user","avatar_border","chat_theme","coin_toss","rock_paper","word_scramble","number_guess","tic_tac","hangman"],
  "⑤ ADMIN": ["callpolice","wanted","bail","jail","court","bounty","ban","unban","kick","mute","unmute","warn","clearwarns","blacklist","slowmode","lockdistrict","purge","audit_log","jail_user","release_user","freeze_wallet","seize_business","inspect_user","fine_user","strip_role","give_role","warn_staff","clear_staff","district_move","shadow_mute","whitelist_add","whitelist_rm","force_unsend","mass_warn","mass_kick","mass_mute","staff_chat","help","prefix","unsend","keepalive","backup","stats","uptime","config_bot","maintenance","logs","announcement","api_key","db_query","server_leave","reboot_system"],
  "⑥ PROGRESSION": ["level_xp","rank_rewards","prestige","rebirth","passport","achieve_total","skills_tree","title_shop","legacy_score","badge_case","perk_activate","profile_glow","stat_allocate","mastery_loop","career_level","season_pass","booster_pack","codex","witness_prot","citizen_oath","tasks_daily","tasks_weekly","quests_main","quests_side","quest_inventory","faction_quest","bounty_board","milestones","achieve_hunt","campaign_stats","reply_box","loading_bar","font_buffer","popup_engine","menu_style","auto_reaction","ui_divider","color_matrix","canvas_render","text_compress","panel_layout","emoji_palette","hud_display","render_clear","house_buy","house_sell","decorate","upgrade_yard","invite_guest","estate_tax","mansion_vault","neighborhood","appliances","room_rent","farm_plot","greenhouse","land_deed","home_defense","safe_box","estate_bonds","garage_view","wardrobe","power_grid","estate_audit"],
  "⑦ WAR-ZONE": ["bossfight","boss_spawn","boss_ability","boss_spectate","kaiju_rage","cyborg_overlord","dragon_nest","boss_history","arena","pvp_queue","pvp_match","pvp_rank","pvp_wager","pvp_loadout","arena_hazard","gladiator_oath","dungeon","dungeon_enter","dungeon_clear","dungeon_status","dungeon_boss","dungeon_leave","dungeon_modify","dungeon_lb","raid","raid_party","raid_attack","raid_status","raid_loot","raid_cooldown","raid_bunker","raid_hq","coop_quest","coop_trade","combat_skills","combat_stats","bounty_hunt","survival_wave","merc_agency","medevac"],
  "⑧ AI SYSTEMS": ["ask","chat","summarize","analyze","rewrite","code_assistant","ai_persona","brain_dump","generate","imagine","remix","upscale","img_to_text","avatar_gen","deep_dream","render_clear","translate","dialect_shift","ocr_translate","audio_trans","embassy_link","dictionary","censor_scan","lang_pack","ai_mode","ai_config","ai_status","ai_blacklist","ai_bounty","ai_quota","ai_logs","ai_shutdown","riddle_bot","roast_ai","compliment_ai","fortune_ai","oracle","news_anchor","prompt_shop","cyber_patch"]
};

const ALL_MAINS = Object.values(REGISTRY).flat(); // 545
console.log(`LOCKED: ${ALL_MAINS.length} MAIN`);

const SUBS = ["info","buy","stats","list","help"]; // 5 subs per main = 2725

// ===== CLEAN MENU STRING - YOUR DESIGN =====
const MENU_TXT = `║
║ 🏙️ KILLER-BOT 400 — LOCKED REGISTRY
║ 📦 545 MAIN CMDS × 5 SUBS = 2,725 TOTAL
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ① 🐾 PET LABS — 100 / 500 — Part 5 & 9
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ${REGISTRY["① PET LABS"].slice(0,10).join(", ")}
║... +90 more in pet labs
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ② 💰 FINANCE — 90 / 450 — Part 3,4,7
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ${REGISTRY["② FINANCE"].slice(0,10).join(", ")}
║... +80 more in finance
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ③ 🔫 CRIME — 64 / 320 — Part 6
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ gta_mission_1 to gta_mission_20, heist, crew_join, crew_kick, heist_plan, rob, hack, mug...
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ④ 🎉 ARCADE — 95 / 475
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ slots, coinflip, blackjack, roulette, dice_roll, poker, baccarat...
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ⑤ 👑 ADMIN — 52 / 260
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ban, unban, kick, mute, warn, blacklist, slowmode, lockdistrict...
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ⑥ 📈 PROGRESSION — 64 / 320
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ level_xp, rank_rewards, prestige, rebirth, passport, achieve_total...
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ⑦ ⚔️ WAR-ZONE — 40 / 200
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ bossfight, boss_spawn, arena, pvp_queue, dungeon, raid...
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ⑧ 🤖 AI SYSTEMS — 40 / 200
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ ask, chat, summarize, analyze, rewrite, imagine, translate...
║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ TOTAL LOCKED: 545 MAIN = 2,725 WITH SUBS`;

// ===== COMMAND HANDLER - 2725 AUTO =====
let commands = {};

// Main handler factory - CLEAN REPLY NO UGLY SPAM
function makeHandler(mainName){
  return async ({api, event, args, uid})=>{
    const sub = args[0]?.toLowerCase() || "info";
    const user = getUser(uid);
    // CLEAN aesthetic reply - NO bars spam
    let reply = `║ ${mainName}\n`;
    if(SUBS.includes(sub)){
      reply += `║ → ${mainName} ${sub}\n║ 💰 $${user.cash.toLocaleString()}`;
    }else{
      reply += `║ Sub cmds: ${SUBS.map(s=>`${mainName} ${s}`).join(", ")}\n║ 💡 Use: ${mainName} [${SUBS.join("|")}]`;
    }
    api.sendMessage(reply, event.threadID);
  };
}

// Register 545 mains + 2725 subs
for(let main of ALL_MAINS){
  const handler = makeHandler(main);
  commands[main.toLowerCase()] = handler;
  for(let s of SUBS){
    commands[`${main.toLowerCase()} ${s}`] = handler; // for space subs
    commands[`${main.toLowerCase()}_${s}`] = handler; // for underscore
  }
}

// Special menu command - CLEAN
commands["menu"] = async ({api, event})=>{ api.sendMessage(MENU_TXT, event.threadID); };
commands["help"] = commands["menu"];
commands["registry"] = commands["menu"];

console.log(`Loaded ${Object.keys(commands).length} cmds = ${ALL_MAINS.length} main × ${SUBS.length+1} variants = ${ALL_MAINS.length * (SUBS.length+1)} total paths`);

function parseCmd(text){
  if(!text) return null;
  let t=text.trim();
  if(!t.startsWith("!")) return null;
  t=t.slice(1).trim().toLowerCase();
  // Try exact match first (for "pets info")
  if(commands[t]) return {cmd:t, args:[]};
  // Try split main + sub
  const parts=t.split(/\s+/);
  const main=parts[0];
  if(commands[main]) return {cmd:main, args:parts.slice(1)};
  // Try main_sub
  if(commands[t]) return {cmd:t, args:[]};
  return {cmd:parts[0], args:parts.slice(1)};
}

login({appState: APPSTATE}, (err,api)=>{
  if(err) return console.error("Login fail", err);
  api.setOptions({listenEvents:true, selfListen:false});
  console.log(`🔥 iKON-BOT 2725 ONLINE - Owner Aphecks iKon Klerk 🔥`);
  setInterval(()=>{ save(); try{ for(let tid in data.threads) api.markAsRead(tid,true); }catch{} }, 30000);

  api.listenMqtt(async (err,event)=>{
    if(err) return;
    try{
      if(event.type!=="message" ||!event.body) return;
      const tid=event.threadID, uid=event.senderID;
      if(!tid||!uid) return;
      // Auto react clean
      if(event.messageID){
        try{ api.setMessageReaction(["🔥","❤️","⚡"][Math.floor(Math.random()*3)], event.messageID, ()=>{}, true); }catch{}
      }
      const parsed=parseCmd(event.body);
      if(!parsed) return; // No spam AQ reply now - clean only when command
      const handler = commands[parsed.cmd] || commands[parsed.cmd.toLowerCase()];
      if(handler){
        const user=getUser(uid);
        if(user.banned && uid!==OWNER_ID) return api.sendMessage(`🚫 Banned`, tid);
        await handler({api, event, args:parsed.args, uid, tid});
      }
    }catch(e){ console.error(e.message); }
  });
});
