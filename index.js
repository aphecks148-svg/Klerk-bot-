const fca=require("ws3-fca"),express=require("express"),axios=require("axios"),fs=require("fs-extra"),{GoogleGenerativeAI}=require("@google/generative-ai");const app=express();const PORT=process.env.PORT||3000;app.get("/",(r,s)=>s.send("iKON ALIVE"));app.listen(PORT,()=>console.log(PORT));const PREFIX=(process.env.PREFIX||"!").trim();const ADMIN_UIDS=(process.env.ADMIN_UIDS||"").split(",").map(s=>s.trim()).filter(Boolean);const GEMINI_KEY=process.env.GEMINI_KEY;const genAI=GEMINI_KEY?new GoogleGenerativeAI(GEMINI_KEY):null;function fmt(n){return"$"+(Number(n)*10).toLocaleString()}function makeBar(c,m,l=10){let p=Math.max(0,Math.min(1,c/m)),f=Math.round(p*l);return"█".repeat(f)+"░".repeat(l-f)+` ${Math.round(p*100)}%`}async function getFBpfp(uid){return`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`}function ensureDB(){if(!fs.existsSync("./db.json"))fs.writeJsonSync("./db.json",{});return fs.readJsonSync("./db.json")}function saveDB(d){fs.writeJsonSync("./db.json",d)}function getUser(uid){let db=ensureDB();if(!db[uid]){db[uid]={cash:1e6,bank:5e5,vault:0,vaultLvl:1,gems:100,tokens:50,level:1,xp:0,power:100,hp:1e3,maxHp:1e3,attack:100,defense:100,speed:100,luck:10,job:null,businesses:[],farm:{lvl:1},mine:{lvl:1},fish:{rod:1},pets:[],inventory:[],cars:[],weapons:[],streak:0,battles:0,wins:0};saveDB(db)}return ensureDB()[uid]}function addXP(uid,a){let db=ensureDB(),u=db[uid];u.xp+=a;let need=u.level*1e3;if(u.xp>=need){u.level++;u.maxHp+=200;u.attack+=20;u.defense+=20;u.xp=0;u.power+=50}saveDB(db);return u}
function menu1(){return`
💎 iKON-BOT • MENU 1/5 • 739 CMDS • 10x MONEY
━━━━━━━━━━━━━━━━━━━━━━ 💰 NEO VAULT
💵!bal!cash!coins!gems!tokens!credits!wallet!bank!vault
🏦!deposit!withdraw!transfer!pay!give!vaultdeposit!vaultwithdraw!vaultupgrade!vaultinfo
📈!savings!interest!loan!borrow!repay!credit!creditcheck!investment!invest!portfolio!stocks!stock!crypto!dividend!exchange!convert!tax!insurance!claim!networth!assets!income!expenses!transactions!statement!history!rich!richest!wealth!moneyrank!bankrank!financial
━━━━━━━━━━━━━━━━━━━━━━ 💼 CORPORATE GRIND
🎁!daily!weekly!monthly!bonus!streak!reward!jackpot!lottery!lotto!ticket!scratch!wheel
🏪!market!buy!sell!price!prices!auction!bid!auctionlist!trade!tradeoffer!tradeaccept!tradedecline!tradecancel!tradehistory
💼!job!jobs!work!apply!quitjob!career!careerlevel!promote!shift!overtime!salary!skills
🏢!business!businesses!buybusiness!sellbusiness!upgradebusiness!businessinfo!employees!hire!fire!manage!profit!revenue!customers!marketing!advertise!factory!shop!restaurant!company!office!warehouse!franchise!partner!contract!contractlist!businessrank!jobrank!economy
💡!work = $45k 10x + XP bar | Next:!menu2
`;}
function menu2(){return`
💎 MENU 2/5 • BEAST KINGDOM x WILD FRONTIER
━━━━━━━━━━━━━━━━━━━━━━ 🐾 BEAST KINGDOM
🐾!pet!pets!mypets!adopt!petshop!buypet!sellpet!feed!heal!train!petstats!petinfo!petname!renamepet!equipPet!unequipPet!petbattle!petrank!petlevel!evolve!evolution!petxp!petpower!pethealth!petattack!petdefense!petspeed!petluck!petbreed!breed!egg!eggs!hatch!incubator!petcrate!rarepet!legendarypet!divinepet!petcollection!petlist!petmarket!tradepet!petgift!petfusion!petupgrade!petreset!petleaderboard!strongestpet
📜 Lists in this cat:!pets = list owned pets |!eggs = list eggs |!petlist = list species |!petcollection = collection list |!petmarket = market list
━━━━━━━━━━━━━━━━━━━━━━ 🌾 WILD FRONTIER
🌾!farm!plant!harvest!water!fertilize!seed!seeds!farmshop!farminfo!farmupgrade!farmlevel!crops!cropmarket!sellcrop
⛏️!mine!mining!dig!ore!ores!mineshop!mineinfo!mineupgrade!minelevel!pickaxe!refine!smelt
🎣!fish!fishing!cast!reel!bait!fishshop!fishinfo!fishingrod!rodupgrade!sellfish!aquarium
🏹!hunt!hunting!track!trap!huntshop!huntinfo!animal!animals!sellanimal!hunterrank!gather
📜 Lists:!seeds!crops!ores!animals = list all | Next:!menu3
`;}
function menu3(){return`
💎 MENU 3/5 • GEAR VAULT x QUESTLINE
━━━━━━━━━━━━━━━━━━━━━━ 🎒 GEAR VAULT
🎒!inv!inventory!items!item!use!equip!unequip!consume!sellitem!buyitem!giftitem!iteminfo
🔨!craft!crafting!recipes!recipe!forge!combine!fusion!material!materials!blueprint
🛡️!gear!equipment!armor!helmet!boots!gloves!shield!accessory!upgradegear!repair!repairweapon!repaircar
📦!crate!crates!box!boxes!opencrate!openbox!buycrate!buybox!crateinfo!boxinfo!lootbox!drops!drop!dailybox!rarebox!legendarybox!divinebox
📜 Lists:!items!materials!recipes!crates!boxes!drops = list all
📈!level!levels!xp!rank!rankup!levelup!maxlevel!upgrade!upgrades!upgradeinfo!upgradeall!stats!stat!skill!skilltree!power!powerup!requirements!unlock!attributes!strength!defense!speed!luck!intelligence!endurance!charisma!build!resetbuild!prestige!prestiges!prestigeup!prestigereq!prestigeinfo!prestigeshop!prestigepoints!prestigebonus!prestigerank!prestigelb
━━━━━━━━━━━━━━━━━━━━━━ 🎯 QUESTLINE
!quest!quests!dailyquest!weeklyquest!monthlyquest!questlist!questinfo!queststart!questclaim!questcomplete!task!tasks!dailytask!weeklytask!tasklist!taskinfo!taskclaim!taskprogress!objectives!mission!missions!missionlist!missioninfo!missionstart!missionjoin!missioncancel!missionprogress!missioncomplete!missionclaim!missionreward!storymission!dailymission!weeklymission!specialmission!secretmission!bossmission!heistmission!huntmission!warMission!ach!achievement!achievements!badges!badge!titles!title!milestones!collection!collectibles
📜 Lists:!quests!tasks!missions!questlist!tasklist!missionlist!achievements = list all | Next:!menu4
`;}
function menu4(){return`
💎 MENU 4/5 • WAR ZONE x HEART SYNC
━━━━━━━━━━━━━━━━━━━━━━ ⚔️ WAR ZONE - Shows DMG XP Power HP LVL
⚔️!battle!fight!duel!challenge!accept!decline!attack!defend!ultimate!combo!critical!block!dodge!arena!arenarank!pvp!pve!boss!bossfight!bosses!raid!raidboss!raidinfo!raidjoin!raidstart!raidreward!team!party!battlepass!battlelog!battlestats!war
🏎️!cars!car!buycar!sellcar!garage!drive!race!drag!streetrace!circuit!tournament!racelobby!raceupgrade!raceleague!carinfo!upgradecar!repaircar
🔫!weapons!weapon!buyweapon!sellweapon!equipweapon!unequipweapon!weaponinfo!upgradeweapon!repairweapon!arsenal
🏰!dungeon!dungeons!enterdungeon!dungeoninfo!floor!bossroom!map!explore!travel!locations!discover!treasure!chest!heist!heists!heistinfo!heistcreate!heistjoin!heistleave!heistaccept!heistdecline!heiststart!heistcancel!heistloot!heistreward
🔫!rob!robbery!robinfo!robplayer!robstore!robhouse!robcar!robvault!robchance!robprotect!robshield!crime!crimes!wanted!wantedlist!bounty!bounties!police!cop!arrest!escape!jail!bail!fine!streetrep!hack!hacks!hackinfo!hacktarget!hackserver!hackbank!hackvault!hackminigame!hackchance!hackskill!hackxp!hackrank!firewall!antivirus!encryption!decrypt!breach!security!cyberrank!cyberlb!informant!fence!safehouse!getaway!blackmarket
📜 Lists:!cars!weapons!bosses!dungeons!heists!crimes!bounties!wantedlist = list all
━━━━━━━━━━━━━━━━━━━━━━ ❤️ HEART SYNC
👤!profile!me!myuid!uid!userinfo!avatar!name!nickname!bio!status - REAL FB PIC + HP bar + DMG + XP + Power + LVL
💕!marry!divorce!love!ship!compatibility!relationship
👥!friend!friends!follow!unfollow!block!unblock!gift!hug!kiss!slap!pat!highfive!socialrank
🏰!guild!guildcreate!guildjoin!guildleave!guildinfo!guildbank!guildshop!guildlevel!guildupgrade!guildwar!guildmission!guildrank!guildmembers!guildinvite!guildkick!crew!gang!gangcreate!gangjoin!gangwar!territory!capture!defend!territoryinfo!territorywar!territoryincome!territoryupgrade!territoryrank!gcboss!gcquest!gcraid!gcheist!gcchallenge
📜 Lists:!friends!guildmembers!locations = list all | Next:!menu5
`;}
function menu5(){return`
💎 MENU 5/5 • NEON CASINO x CONTROL TOWER
━━━━━━━━━━━━━━━━━━━━━━ 🎰 CASINO
!games!slots!blackjack!roulette!dice!coinflip!higherlower!rps!number!guess!casino!casinoinfo!bet!gamble!gamestats!lottery!lotto!jackpot!scratch!wheel!event!events!eventshop!eventboss!eventloot!eventleaderboard!season!seasonpass!seasonrank!seasonquests!story!chapter!lore!encounter!random!merchant!worldevent!festival!challenge!dailychallenge!weeklychallenge!tournament!bracket!winner!streak!leaderboard!lb!top!leveltop!xptop!petlb!battlelb!joblb!businesslb!mininglb!fishinglb!huntinglb!farmlb!carlb!sociallb!prestigelb!killlb!winlb
📜 Lists:!games!events!leaderboard lists all FB Pics + bars
━━━━━━━━━━━━━━━━━━━━━━ 🔧 CONTROL TOWER
🛠️!help!menu!commands!cmds!ping!uptime!status!info!botinfo!groupinfo!rules!prefix!time!date!weather!calc!convert!remind!translate!search!download!dl!media!video!audio!song!play!searchvideo!searchsong!yt!ytmp3!ytmp4!tiktok!instagram!facebook!twitter!reddit!image!sticker!quote!qr!shorten!encode!decode!json!timezones!countdown!timer!reminders!pingall!health!latency!logs!version!changelog!faq!support!feedback!report
👑!admin!admins!addadmin!deladmin!promote!demote!warn!warnings!clearwarn!mute!unmute!kick!ban!unban!blacklist!unblacklist!whitelist!unwhitelist!freeze!unfreeze!lock!unlock!slowmode!unslowmode!approve!pending!approveall!reject!unsend!clear!purge!setprefix!setname!setnick!setwelcome!setgoodbye!welcome!goodbye!autoreact!autojoin!autoleave!antilink!antispam!antibot!antitag!modlogs!settings!groupconfig!adminpanel
👑!owner!owners!owneradd!ownerremove!system!systeminfo!reload!restart!shutdown!maintenance!boton!botoff!module!modules!enable!disable!enablecmd!disablecmd!broadcast!announce!eval
💡 Shows DMG,XP,Power,HP,LVL,Happening,FB Pics,Bars • 10x Money • Buy by name+amount • Type!menu1 to restart
`;}
let allCmds=[];try{let files=fs.readdirSync("./commands");files.forEach(f=>{if(f.endsWith(".js")){let cmds=require("./commands/"+f);allCmds.push(...cmds)}})}catch(e){}
let msgCount=0;const cooldowns=new Map(),spamMap=new Map();const pokemonList=["pikachu","charizard","mewtwo","gengar","lucario","eevee","snorlax","gyarados"];function handleCmd(name,args,event,api){name=name.toLowerCase();if(name==="menu1"||name==="menu"||name==="help"||name==="commands"||name==="cmds"){api.sendMessage(menu1(),event.threadID,event.messageID);return}if(name==="menu2"){api.sendMessage(menu2(),event.threadID,event.messageID);return}if(name==="menu3"){api.sendMessage(menu3(),event.threadID,event.messageID);return}if(name==="menu4"){api.sendMessage(menu4(),event.threadID,event.messageID);return}if(name==="menu5"){api.sendMessage(menu5(),event.threadID,event.messageID);return}let cmd=allCmds.find(c=>c.name===name||(c.aliases&&c.aliases.includes(name)));if(!cmd)return;let uid=event.senderID,key=uid+"_"+cmd.name,now=Date.now();if(cmd.cooldown&&cooldowns.has(key)&&now-cooldowns.get(key)<cmd.cooldown*1e3){api.sendMessage(`⚠️ Cooldown ${cmd.name} ${Math.ceil((cmd.cooldown*1e3-(now-cooldowns.get(key)))/1e3)}s`,event.threadID,event.messageID);return}if(cmd.permission==="admin"&&!ADMIN_UIDS.includes(uid)){api.sendMessage("🔒 Admin only",event.threadID,event.messageID);return}if(cmd.permission==="owner"&&!ADMIN_UIDS.includes(uid)){api.sendMessage("🔒 Owner only",event.threadID,event.messageID);return}let spam=spamMap.get(uid)||{c:0,t:now};if(now-spam.t<5e3){spam.c++;if(spam.c>5){api.sendMessage("🛡️ Anti-spam wait 10s",event.threadID,event.messageID);return}}else spam={c:0,t:now};spamMap.set(uid,spam);cooldowns.set(key,now);try{cmd.execute({api,event,args,uid,getUser,ensureDB,saveDB,addXP,makeBar,getFBpfp,fmt,genAI})}catch(e){api.sendMessage("❌ "+e.message,event.threadID,event.messageID)}}
const loginOpt={appState:JSON.parse(process.env.APPSTATE||"[]"),selfListen:false,listenEvents:true};fca(loginOpt,(err,api)=>{if(err)throw err;console.log("[iKON] 739 CMDS LOADED");api.setOptions({selfListen:false});api.listenMqtt(async(err,event)=>{if(err)return;if(event.type!=="message")return;msgCount++;if(msgCount%20===0){let p=pokemonList[Math.floor(Math.random()*pokemonList.length)];api.sendMessage(`🔔 Wild Pokemon!\n💥 ${p.toUpperCase()} [CP ${Math.floor(Math.random()*2e3)+800}]\n❤️ ${makeBar(100,100)}\n⚡ Power 1,200\nQuick!catch ${p}`,event.threadID)}try{api.sendMessage("❤️",event.threadID,()=>{},event.messageID)}catch{};let body=(event.body||"").trim();if(!body.startsWith(PREFIX))return;let raw=body.slice(PREFIX.length).trim();let parts=raw.split(/\s+/);handleCmd(parts[0].toLowerCase(),parts.slice(1),event,api)})});setInterval(()=>{axios.get(`http://localhost:${PORT}/`).catch(()=>{})},240000);
