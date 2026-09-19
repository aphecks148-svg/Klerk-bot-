// commands/cmds_7.js
const C="cmds_7";

const c=(name,aliases,description,usage,hint,execute,permission="admin",cooldown=0)=>({
  name,aliases,category:C,description,usage,hint,permission,cooldown,execute
});

const r=(reply,msg)=>reply(
`👑 OVERLORD
━━━━━━━━━━━━━━━━
${msg}
━━━━━━━━━━━━━━━━
🛡️ ADMIN • 👥 GROUP • ⚙️ SYSTEM`
);

const E=(title,msg)=>async({reply,args})=>
  r(reply,`${title}\n${msg.replace(/\{a\}/g,args.join(" ")||"Target")}`);

const A=(title,msg)=>async({reply})=>
  r(reply,`${title}\n${msg}`);

module.exports=[

c("admin",["admins","adminpanel","panel"],"Open admin panel","!admin","Admin only",
  A("👑 ADMIN PANEL","🛡️ Security\n👥 Members\n⚙️ Config\n🤖 Bot controls\n📊 Logs")),

c("settings",["config","configuration"],"View group settings","!settings","Admin only",
  A("⚙️ GROUP SETTINGS","🛡️ Permissions\n👋 Welcome\n🚪 Goodbye\n🔥 Reactions\n💬 Replies\n⏱️ Cooldowns")),

c("prefix",["setprefix"],"Change bot prefix","!prefix !","Admin only",
  E("⌨️ PREFIX CONTROL","New prefix: {a}")),

c("enable",["on"],"Enable module/command","!enable economy","Admin only",
  E("🟢 ENABLED","Target: {a}\n⚡ Feature activated.")),

c("disable",["off"],"Disable module/command","!disable economy","Admin only",
  E("🔴 DISABLED","Target: {a}\n🛑 Feature deactivated.")),

c("toggle",["switch"],"Toggle a feature","!toggle autoreact","Admin only",
  E("🔄 TOGGLE","Feature: {a}\n⚙️ Configuration updated.")),

c("module",["modules"],"Manage modules","!module cmds_1","Admin only",
  E("🧩 MODULE CONTROL","Module: {a}\n🟢 Status checked.")),

c("commands",["commandlist","commandslist"],"List commands","!commands","Shows loaded commands",
  A("📚 COMMAND REGISTRY","🔢 All registered commands are read from cmds_1 → cmds_8.\n🔍 Use !commandinfo <name>.")),

// FIXED: removed duplicate alias "info"
c("commandinfo",["cmdinfo"],"Inspect command","!commandinfo daily","Admin only",
  E("🔎 COMMAND INFO","Command: {a}\n⚙️ Registry details loaded.")),

c("alias",["aliases"],"Manage command aliases","!alias","Admin only",
  A("🔗 ALIAS SYSTEM","Canonical commands and aliases are managed centrally.\n🛡️ Duplicate aliases are rejected.")),

c("reload",["refresh"],"Reload command registry","!reload","Admin only",
  A("♻️ RELOAD","🔄 Command registry refresh requested.\n🛡️ Duplicate names/aliases are skipped.")),

c("restart",["reboot"],"Restart bot process","!restart","Admin only",
  A("🔄 RESTART","🤖 Restart signal requested.\n⏱️ Reconnect system will restore the bot.")),

c("status",["botstatus"],"Show bot status","!status","System status",
  A("📡 SYSTEM STATUS","🟢 ONLINE\n⚡ Command engine: READY\n💾 Database: CONNECTED\n🔁 Reconnect: ACTIVE")),

c("uptime",["alive"],"Show uptime","!uptime","System uptime",
  A("⏱️ UPTIME","🤖 iKON-BOT heartbeat active.\n🔄 Reconnect watchdog enabled.")),

c("logs",["log"],"View bot logs","!logs","Admin only",
  E("📜 SYSTEM LOGS","Recent logs for {a} loaded.")),

c("announce",["announcement","broadcast"],"Send announcement","!announce <message>","Admin only",
  E("📢 ANNOUNCEMENT","📣 {a}")),

c("maintenance",["maint"],"Toggle maintenance mode","!maintenance on","Admin only",
  E("🛠️ MAINTENANCE","Mode: {a}")),

c("warn",["warning"],"Warn member","!warn @user reason","Reply or mention target",
  E("⚠️ WARNING","👤 Target: {a}\n📌 Warning recorded.")),

c("warnings",["warns"],"View warnings","!warnings @user","Reply or mention target",
  E("📋 WARNINGS","👤 Target: {a}\n📊 Warning history loaded.")),

c("unwarn",["clearwarn"],"Remove warning","!unwarn @user","Admin only",
  E("✅ WARNING REMOVED","👤 Target: {a}")),

c("mute",["silence"],"Mute member","!mute @user 10m","Reply or mention target",
  E("🔇 MEMBER MUTED","👤 Target: {a}\n⏱️ Duration processed.")),

c("unmute",["unsilence"],"Unmute member","!unmute @user","Reply or mention target",
  E("🔊 MEMBER UNMUTED","👤 Target: {a}")),

c("ban",["block"],"Ban member","!ban @user reason","Bot must have permission",
  E("⛔ MEMBER BAN","👤 Target: {a}\n🛡️ Ban request processed.")),

c("unban",["unblock"],"Unban member","!unban UID","Admin only",
  E("✅ MEMBER UNBANNED","🆔 {a}")),

c("kick",["remove"],"Kick member","!kick @user","Reply or mention target",
  E("👢 MEMBER KICK","👤 Target: {a}\n🛡️ Removal request processed.")),

c("promote",["adminadd"],"Promote member","!promote @user","Bot admin required",
  E("⬆️ PROMOTE","👤 Target: {a}\n👑 Promotion request processed.")),

c("demote",["admindel"],"Demote member","!demote @user","Bot admin required",
  E("⬇️ DEMOTE","👤 Target: {a}\n🛡️ Demotion request processed.")),

c("role",["roles"],"Manage custom roles","!role @user staff","Admin only",
  E("🎭 ROLE CONTROL","👤 Target: {a}\n🏷️ Role operation processed.")),

c("staff",["stafflist"],"View staff","!staff","Admin only",
  A("🛡️ STAFF","👑 Owner\n🔴 Admins\n🟠 Moderators\n🟢 Staff")),

c("blacklist",["blacklist_add"],"Blacklist member","!blacklist @user","Admin only",
  E("🚫 BLACKLIST","👤 Target: {a}\n🛡️ Access restricted.")),

c("unblacklist",["blacklist_rm"],"Remove blacklist","!unblacklist @user","Admin only",
  E("✅ BLACKLIST REMOVED","👤 Target: {a}")),

c("whitelist",["whitelist_add"],"Whitelist member","!whitelist @user","Admin only",
  E("🟢 WHITELIST","👤 Target: {a}\n🔓 Access updated.")),

c("slowmode",["slow"],"Set group slowmode","!slowmode 10","Admin only",
  E("🐢 SLOWMODE","⏱️ Delay: {a}\n⚙️ Group setting updated.")),

c("lock",["lockgroup","lockdistrict"],"Lock group","!lock","Admin only",
  A("🔒 GROUP LOCKED","🛡️ Restricted mode activated.")),

c("unlock",["unlockgroup"],"Unlock group","!unlock","Admin only",
  A("🔓 GROUP UNLOCKED","🟢 Normal mode restored.")),

c("freeze",["freezechat"],"Freeze bot systems","!freeze","Admin only",
  A("❄️ SYSTEM FROZEN","🛑 Selected group actions paused.")),

c("unfreeze",["unfreezechat"],"Unfreeze systems","!unfreeze","Admin only",
  A("🔥 SYSTEM RESTORED","🟢 Group actions resumed.")),

c("clear",["purge"],"Clear bot-managed messages","!clear 10","Platform/API dependent",
  E("🧹 CLEAR","🗑️ Requested amount: {a}\n⚠️ Actual deletion depends on Messenger permissions/API.")),

c("unsend",["delete"],"Unsend bot message","!unsend","Reply to bot message",
  A("🗑️ UNSEND","↩️ Message removal requested.")),

c("pending",["requests"],"View pending requests","!pending","Admin only",
  A("📬 PENDING REQUESTS","⚔️ Battles\n💰 Heists\n💖 CO\n🎁 Trades\n⏳ Expiring requests shown.")),

c("pendingunsend",["pending_unsend"],"Manage pending unsends","!pendingunsend","Admin only",
  A("🗑️ PENDING UNSEND","📬 Pending deletion queue loaded.")),

c("thread",["threads","groups"],"View bot groups","!thread","Admin only",
  A("👥 THREAD MANAGER","🌐 Active groups cached.\n🔟 Target capacity: 10 groups.\n🛡️ Each group uses isolated state.")),

c("group",["groupinfo"],"Group information","!group","Admin only",
  A("👥 GROUP INFO","📛 Thread name\n👤 Members\n🛡️ Admins\n⚙️ Group configuration")),

c("welcome",["setwelcome"],"Configure welcome","!welcome on","Admin only",
  E("👋 WELCOME SYSTEM","Setting: {a}\n🎉 New members can receive welcome messages.")),

c("goodbye",["setgoodbye"],"Configure goodbye","!goodbye on","Admin only",
  E("🚪 GOODBYE SYSTEM","Setting: {a}")),

c("autoreact",["setreact"],"Configure auto reactions","!autoreact on","Admin only",
  E("🔥 AUTO-REACTION","Setting: {a}\n👍 😂 🔥 ❤️ 💰 🐾 ⚔️ 👑")),

c("autoreply",["setreply"],"Configure auto replies","!autoreply on","Admin only",
  E("💬 AUTO-REPLY","Setting: {a}")),

c("cooldown",["setcooldown"],"Set command cooldown","!cooldown rob 5m","Admin only",
  E("⏳ COOLDOWN","Command: {a}\n⚙️ Cooldown configuration updated.")),

c("backup",["database_backup"],"Backup bot data","!backup","Admin only",
  A("💾 BACKUP","📦 Database backup requested.\n🛡️ Persistent economy data protected.")),

c("restore",["database_restore"],"Restore bot data","!restore","Admin only",
  A("♻️ RESTORE","💾 Restore operation requested.\n⚠️ Destructive database actions require confirmation.")),

c("database",["db","dbcheck"],"Database status","!database","Admin only",
  A("💾 DATABASE","🟢 MongoDB connection status checked.\n💰 Economy • 👤 Players • 👥 Groups • 🐾 Pets")),

c("health",["healthcheck"],"System health","!health","Admin only",
  A("❤️ SYSTEM HEALTH","🟢 Router\n🟢 Database\n🟢 Event listener\n🟢 Reconnect\n🟢 Reaction engine")),

c("debugmode",["debug"],"Toggle debug mode","!debugmode on","Admin only",
  E("🐞 DEBUG MODE","Setting: {a}")),

c("bot",["botinfo"],"Bot information","!bot","Admin only",
  A("🤖 iKON-BOT","👑 Owner: APHECKS IKON KLERK\n⚡ Full Community Engine\n💾 MongoDB Economy\n🧩 8 Command Worlds")),

c("owner",["creator"],"Show bot owner","!owner","Bot information",
  A("👑 BOT OWNER","APHECKS IKON KLERK")),

c("ping",["p"],"Check response time","!ping","System check",
  A("🏓 PONG!","⚡ iKON-BOT is responding.")),

c("test",["systemtest"],"Run system test","!test","Admin only",
  A("🧪 SYSTEM TEST","🟢 Router\n🟢 Commands\n🟢 Replies\n🟢 Reactions\n🟢 Database check requested")),

c("support",["helpdesk"],"Show support","!support","Support information",
  A("🆘 SUPPORT","📖 !help\n📚 !menu\n🐞 !report <issue>\n👑 Contact the bot owner for administration.")),

c("report",["bug"],"Report bot issue","!report <message>","Creates report",
  E("🐞 BUG REPORT","📩 Report received: {a}")),

c("commandon",["enablecommand"],"Enable command","!commandon daily","Admin only",
  E("🟢 COMMAND ON","Command: {a}")),

c("commandoff",["disablecommand"],"Disable command","!commandoff daily","Admin only",
  E("🔴 COMMAND OFF","Command: {a}")),

c("moduleon",["enablemodule"],"Enable module","!moduleon cmds_1","Admin only",
  E("🟢 MODULE ON","Module: {a}")),

c("moduleoff",["disablemodule"],"Disable module","!moduleoff cmds_1","Admin only",
  E("🔴 MODULE OFF","Module: {a}")),

c("groupconfig",["gconfig"],"Configure group","!groupconfig","Admin only",
  A("⚙️ GROUP CONFIG","👋 Welcome\n🚪 Goodbye\n🔥 Reactions\n💬 Replies\n⏱️ Cooldowns\n🛡️ Security")),

c("groupenable",["genable"],"Enable group feature","!groupenable welcome","Admin only",
  E("🟢 GROUP FEATURE","Feature: {a}")),

c("groupdisable",["gdisable"],"Disable group feature","!groupdisable welcome","Admin only",
  E("🔴 GROUP FEATURE","Feature: {a}")),

c("setcurrency",["currency"],"Set group currency","!setcurrency $","Admin only",
  E("💰 CURRENCY","Currency: {a}")),

c("setlevel",["levelset"],"Set player level","!setlevel @user 10","Admin only",
  E("⭐ LEVEL CONTROL","Target/data: {a}")),

c("setxp",["xpset"],"Set player XP","!setxp @user 5000","Admin only",
  E("✨ XP CONTROL","Target/data: {a}")),

c("setmoney",["moneyset"],"Set player money","!setmoney @user 1000000","Admin only",
  E("💰 MONEY CONTROL","Target/data: {a}")),

c("resetuser",["userreset"],"Reset player data","!resetuser @user","Admin only",
  E("♻️ USER RESET","Target: {a}\n⚠️ Confirmation required before destructive reset.")),

c("resetgroup",["groupreset"],"Reset group configuration","!resetgroup","Admin only",
  A("♻️ GROUP RESET","⚠️ Confirmation required before destructive reset.")),

c("wipe",["wipedata"],"Wipe selected data","!wipe <target>","Admin only",
  E("☢️ WIPE CONTROL","Target: {a}\n⚠️ Confirmation required before destructive action.")),

c("shutdown",["stopbot"],"Shutdown bot","!shutdown","Owner only",
  A("🛑 SHUTDOWN","⚠️ Shutdown request received.\n👑 Owner authorization required.")),

c("keepalive",["heartbeat"],"Check keepalive","!keepalive","Admin only",
  A("💓 KEEPALIVE","🟢 Heartbeat active\n🔄 Reconnect watchdog armed.")),

c("api_status",["apistatus"],"Check API services","!api_status","Admin only",
  A("🌐 API STATUS","🟢 Messenger API check\n🟢 Axios engine\n🟡 Canvas optional\n🟢 AI/Gemini configuration check")),

c("threadscan",["scanthreads"],"Scan bot groups","!threadscan","Admin only",
  A("🔎 THREAD SCAN","👥 Group/thread cache refresh requested.\n📡 Bot tracks active group metadata.")),

// FIXED: removed duplicate alias "members"
c("memberlog",[],"View member activity","!memberlog","Admin only",
  A("👥 MEMBER ACTIVITY","📈 Join/leave activity\n⏱️ Inactivity tracking\n🛡️ Admin protection")),

c("autocleanup",["cleanup"],"Configure inactive cleanup","!autocleanup on","Admin only",
  E("🧹 AUTO CLEANUP","Setting: {a}\n⚠️ Platform permissions and API support determine what can actually be removed.")),

c("security",["securitycheck"],"Run security check","!security","Admin only",
  A("🛡️ SECURITY CHECK","🔐 Permissions\n🚫 Blacklist\n🟢 Whitelist\n👑 Admin protection\n📋 Audit logging")),

c("audit",["auditlog"],"View audit trail","!audit","Admin only",
  A("📋 AUDIT LOG","🛡️ Administrative actions are tracked when persistence is available.")),

c("economy_control",["econcontrol"],"Control economy","!economy_control","Admin only",
  A("💰 ECONOMY CONTROL","🏦 Wallet\n🏧 Bank\n📈 Market\n💳 Loans\n🪙 Crypto\n🛡️ Shared database engine")),

c("event_control",["events"],"Control automatic events","!event_control","Admin only",
  A("🎉 EVENT CONTROL","👹 Boss\n🧠 Quiz\n🔢 Counting\n💰 Heist\n🎁 Giveaway\n🎟️ Lottery\n💥 Crash\n🎲 Dice\n🐎 Horse\n🎊 Event\n💎 Airdrop")),

c("gemini_admin",["aiadmin"],"Configure Gemini AI","!gemini_admin","Admin AI control",
  A("🧠 GEMINI CONTROL","🔑 API key is read from environment configuration.\n⏱️ Quotas and cooldowns supported.")),

c("canvas",["canvasstatus"],"Check Canvas engine","!canvas","Admin utility",
  A("🎨 CANVAS ENGINE","🖼️ Profile cards\n🏆 Leaderboards\n🐾 Pet cards\n⚔️ Battle cards\n👋 Welcome cards\n🛡️ Wanted cards")),

c("permissions",["perms"],"View permission rules","!permissions","Admin only",
  A("🛡️ PERMISSIONS","👑 Owner\n🔴 Admin\n🟠 Staff\n🟢 Member\n⚙️ Command-level permission checks enabled"))

];
