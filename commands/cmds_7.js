// commands/cmds_7.js
const fs=require("fs"),path=require("path");

const S={
 warn:new Map(),role:new Map(),mute:new Set(),ban:new Set(),
 freeze:new Set(),black:new Set(),white:new Set(),staff:new Set(),
 logs:[],pending:[],pendingGC:new Set(),cd:new Map(),slow:new Map()
};

const r=(c,x)=>c.reply(`🛡️ ${x}`);
const adm=c=>c.isAdmin?1:r(c,"❌ Admin only.");
const id=c=>Object.keys(c.event.mentions||{})[0]||c.args[0]||c.event.senderID;
const log=(c,a,x="")=>{
 S.logs.push({a,id:c.event.senderID,x,t:Date.now()});
 if(S.logs.length>300)S.logs.shift();
};

const C={};
const A=(n,fn)=>C[n]={name:n,execute:async c=>{if(!adm(c))return;log(c,n);return fn(c)}};
const U=(n,fn)=>C[n]={name:n,execute:async c=>fn(c)};

/* 👑 ADMIN */
A("admin",c=>r(c,`👑 ADMIN PANEL

🔑 Master: ${c.adminID}
👥 Staff: ${S.staff.size}
🚫 Banned: ${S.ban.size}
🔇 Muted: ${S.mute.size}
📥 Pending GC: ${S.pendingGC.size}
📜 Logs: ${S.logs.length}`));

A("admins",c=>r(c,`👑 ADMINS

🔑 Master Admin: ${c.adminID}
🛡️ Staff: ${S.staff.size}`));

A("addadmin",c=>{S.staff.add(id(c));return r(c,`👑 ${id(c)} added as staff.`)});
A("removeadmin",c=>{S.staff.delete(id(c));return r(c,`👤 ${id(c)} removed from staff.`)});
A("promote",c=>{S.staff.add(id(c));return r(c,`⬆️ ${id(c)} promoted.`)});
A("demote",c=>{S.staff.delete(id(c));return r(c,`⬇️ ${id(c)} demoted.`)});
A("mod",c=>{S.role.set(id(c),"moderator");return r(c,`🛡️ ${id(c)} is now moderator.`)});
A("unmod",c=>{S.role.delete(id(c));return r(c,`🛡️ ${id(c)} is no longer moderator.`)});

A("permissions",c=>r(c,
`🔐 PERMISSIONS

👑 Master Admin = FULL CONTROL
🛡️ Staff = Moderation
👤 Members = Normal commands`));

A("grant",c=>{
 let x=id(c),p=c.args[1]||"moderator";
 S.role.set(x,p);
 return r(c,`🔓 ${p} granted to ${x}.`);
});

A("revoke",c=>{
 S.role.delete(id(c));
 return r(c,"🔒 Permissions revoked.");
});

A("role",c=>r(c,`🎭 ${id(c)} = ${S.role.get(id(c))||"member"}`));
A("roles",c=>r(c,"🎭 ROLES\n\n👑 Master Admin\n🛡️ Moderator\n⭐ Staff\n👤 Member"));

A("give_role",c=>{
 let x=id(c),p=c.args[1]||"member";
 S.role.set(x,p);
 return r(c,`🎭 ${p} assigned to ${x}.`);
});

/* ⚙️ GROUP / COMMAND CONTROL */
A("group_config",c=>r(c,`⚙️ GC CONFIG\n\n🆔 ${c.event.threadID}\n🟢 Configuration loaded.`));

A("group_enable",c=>{
 c.config.groups=c.config.groups||{};
 c.config.groups[c.event.threadID]={...(c.config.groups[c.event.threadID]||{}),enabled:true};
 c.saveConfig?.();
 return r(c,"🟢 This GC is enabled.");
});

A("group_disable",c=>{
 c.config.groups=c.config.groups||{};
 c.config.groups[c.event.threadID]={...(c.config.groups[c.event.threadID]||{}),enabled:false};
 c.saveConfig?.();
 return r(c,"🔴 This GC is disabled.");
});

A("command_enable",c=>{
 let n=c.args[0]?.toLowerCase();
 if(!n)return r(c,"Usage: !command_enable <command>");
 c.config.commands=c.config.commands||{};
 c.config.commands[n]=true;
 c.saveConfig?.();
 return r(c,`🟢 !${n} enabled.`);
});

A("command_disable",c=>{
 let n=c.args[0]?.toLowerCase();
 if(!n)return r(c,"Usage: !command_disable <command>");
 c.config.commands=c.config.commands||{};
 c.config.commands[n]=false;
 c.saveConfig?.();
 return r(c,`🔴 !${n} disabled.`);
});

A("command_toggle",c=>{
 let n=c.args[0]?.toLowerCase();
 if(!n)return r(c,"Usage: !command_toggle <command>");
 c.config.commands=c.config.commands||{};
 c.config.commands[n]=c.config.commands[n]===false;
 c.saveConfig?.();
 return r(c,`${c.config.commands[n]?"🟢":"🔴"} !${n}`);
});

A("module_enable",c=>{
 let n=c.args[0]?.toLowerCase();
 if(!n)return r(c,"Usage: !module_enable <module>");
 c.config.modules=c.config.modules||{};
 c.config.modules[n]=true;
 c.saveConfig?.();
 return r(c,`🟢 ${n} enabled.`);
});

A("module_disable",c=>{
 let n=c.args[0]?.toLowerCase();
 if(!n)return r(c,"Usage: !module_disable <module>");
 c.config.modules=c.config.modules||{};
 c.config.modules[n]=false;
 c.saveConfig?.();
 return r(c,`🔴 ${n} disabled.`);
});

A("module_toggle",c=>{
 let n=c.args[0]?.toLowerCase();
 if(!n)return r(c,"Usage: !module_toggle <module>");
 c.config.modules=c.config.modules||{};
 c.config.modules[n]=c.config.modules[n]===false;
 c.saveConfig?.();
 return r(c,`${c.config.modules[n]?"🟢":"🔴"} ${n}`);
});

/* 💰 ECONOMY */
A("economy_enable",c=>{
 c.config.modules=c.config.modules||{};
 c.config.modules.finance=true;
 c.saveConfig?.();
 return r(c,"💰 Economy 🟢 ON");
});

A("economy_disable",c=>{
 c.config.modules=c.config.modules||{};
 c.config.modules.finance=false;
 c.saveConfig?.();
 return r(c,"💰 Economy 🔴 OFF");
});

A("set_balance",c=>r(c,`💰 Balance set for ${id(c)}: ${Number(c.args[1]||c.args[0]||0).toLocaleString()}`));
A("set_xp",c=>r(c,`⭐ XP set for ${id(c)}: ${c.args[1]||c.args[0]||0}`));
A("set_level",c=>r(c,`📈 Level set for ${id(c)}: ${c.args[1]||1}`));
A("set_rank",c=>r(c,`🏆 Rank set for ${id(c)}: ${c.args[1]||"Member"}`));
A("set_pet",c=>r(c,`🐾 Pet set for ${id(c)}: ${c.args[1]||"apex_overlord"}`));
A("set_item",c=>r(c,`📦 Item set for ${id(c)}: ${c.args[1]||"item"} ×${c.args[2]||1}`));
A("grant_item",c=>r(c,`🎁 Granted ${c.args[1]||"item"} ×${c.args[2]||1} to ${id(c)}.`));
A("remove_item",c=>r(c,`🗑️ Removed ${c.args[1]||"item"} from ${id(c)}.`));
A("reset_economy",c=>r(c,"♻️ Economy reset requested."));
A("reset_user",c=>r(c,`♻️ Reset requested for ${id(c)}.`));
A("reset_group",c=>r(c,"♻️ Group reset requested."));
A("reset_cooldown",c=>{S.cd.delete(id(c));return r(c,`⏱️ Cooldowns reset for ${id(c)}.`)});
A("set_cooldown",c=>{
 let n=c.args[0],s=Number(c.args[1]||0);
 if(!n)return r(c,"Usage: !set_cooldown <command> <seconds>");
 S.cd.set(n,s);
 return r(c,`⏱️ !${n} = ${s}s`);
});

/* 🚨 MODERATION */
A("callpolice",c=>r(c,"🚔 Police called in the fictional bot world."));
A("wanted",c=>r(c,`🚨 Wanted check: ${id(c)}`));
A("bail",c=>r(c,`🔓 Bail processed for ${id(c)}.`));
A("jail",c=>{S.role.set(id(c),"jailed");return r(c,`🚔 ${id(c)} jailed.`)});
A("court",c=>r(c,"⚖️ Fictional court opened."));
A("bounty",c=>r(c,"🎯 Bounty administration opened."));
A("ban",c=>{S.ban.add(id(c));log(c,"ban",id(c));return r(c,`🔨 ${id(c)} banned.`)});
A("unban",c=>{S.ban.delete(id(c));return r(c,`🔓 ${id(c)} unbanned.`)});
A("kick",c=>r(c,`👢 ${id(c)} marked for removal.`));
A("mute",c=>{S.mute.add(id(c));return r(c,`🔇 ${id(c)} muted.`)});
A("unmute",c=>{S.mute.delete(id(c));return r(c,`🔊 ${id(c)} unmuted.`)});

A("warn",c=>{
 let x=id(c),n=(S.warn.get(x)||0)+1;
 S.warn.set(x,n);
 return r(c,`⚠️ ${x}: warning #${n}`);
});

A("clearwarns",c=>{
 S.warn.delete(id(c));
 return r(c,"✅ Warnings cleared.");
});

A("blacklist",c=>{S.black.add(id(c));return r(c,`🚫 ${id(c)} blacklisted.`)});
A("whitelist_add",c=>{S.white.add(id(c));return r(c,`✅ ${id(c)} whitelisted.`)});
A("whitelist_rm",c=>{S.white.delete(id(c));return r(c,`🗑️ ${id(c)} removed from whitelist.`)});
A("jail_user",c=>{S.role.set(id(c),"jailed");return r(c,`🚔 ${id(c)} jailed.`)});
A("release_user",c=>{S.role.delete(id(c));return r(c,`🔓 ${id(c)} released.`)});
A("freeze_wallet",c=>{S.freeze.add(id(c));return r(c,`❄️ Wallet frozen for ${id(c)}.`)});

A("inspect_user",c=>{
 let x=id(c);
 return r(c,`🔎 USER

🆔 ${x}
🎭 ${S.role.get(x)||"member"}
⚠️ Warnings: ${S.warn.get(x)||0}
🔇 Muted: ${S.mute.has(x)?"YES":"NO"}
🚫 Banned: ${S.ban.has(x)?"YES":"NO"}
❄️ Frozen: ${S.freeze.has(x)?"YES":"NO"}`);
});

A("fine_user",c=>r(c,`💸 Fine for ${id(c)}: $${Number(c.args[1]||0).toLocaleString()}`));
A("strip_role",c=>{S.role.delete(id(c));return r(c,"🎭 Role stripped.")});
A("warn_staff",c=>r(c,`⚠️ Staff warning issued to ${id(c)}.`));
A("clear_staff",c=>{S.staff.clear();return r(c,"🧹 Staff list cleared.")});
A("district_move",c=>r(c,`🗺️ ${id(c)} moved to ${c.args[1]||"Central"}.`));
A("shadow_mute",c=>{S.mute.add(id(c));return r(c,`👻 Shadow mute: ${id(c)}`)});
A("slowmode",c=>{S.slow.set(c.event.threadID,Number(c.args[0]||5));return r(c,`🐢 Slowmode: ${c.args[0]||5}s`)});
A("lockdistrict",c=>r(c,"🔒 District locked."));
A("purge",c=>r(c,"🧹 Purge requested."));
A("mass_warn",c=>r(c,"⚠️ Mass warning prepared."));
A("mass_kick",c=>r(c,"👢 Mass kick prepared."));
A("mass_mute",c=>r(c,"🔇 Mass mute prepared."));
A("staff_chat",c=>r(c,"🛡️ Staff chat opened."));

/* 📥 PENDING GC */
A("pending_gc",async c=>{
 if(!c.api.getThreadList)return r(c,"⚠️ GC list API unavailable.");

 return new Promise(resolve=>{
  c.api.getThreadList(100,0,[],(err,list)=>{
   if(err){
    r(c,`❌ Pending GC error: ${err.message}`);
    return resolve();
   }

   let pending=(list||[]).filter(x=>{
    let f=String(x.folder||"").toLowerCase();
    let t=String(x.threadType||"").toLowerCase();
    return f.includes("pending")||t.includes("pending");
   });

   pending.forEach(x=>S.pendingGC.add(x.threadID));

   if(!pending.length){
    r(c,"📭 No pending GC found.");
    return resolve();
   }

   let out="╭─〔 📥 PENDING GC 〕─╮\n";
   pending.slice(0,30).forEach((g,i)=>{
    out+=`│ ${i+1}. ${g.name||"Unnamed GC"}\n│ 🆔 ${g.threadID}\n`;
   });
   out+="╰────────────────╯";

   r(c,out);
   resolve();
  });
 });
});

A("pending_gcs",c=>C.pending_gc.execute(c));
A("pendinggc",c=>C.pending_gc.execute(c));

A("pending_gc_add",c=>{
 let x=c.args[0];
 if(!x)return r(c,"Usage: !pending_gc_add <threadID>");
 S.pendingGC.add(x);
 return r(c,`📥 GC ${x} added to pending control.`);
});

A("pending_gc_remove",c=>{
 let x=c.args[0];
 if(!x)return r(c,"Usage: !pending_gc_remove <threadID>");
 S.pendingGC.delete(x);
 return r(c,`🗑️ GC ${x} removed from pending control.`);
});

A("pending_gc_clear",c=>{
 S.pendingGC.clear();
 return r(c,"🧹 Pending GC control list cleared.");
});

/* 🗑️ UNSEND */
U("unsend",c=>{
 try{
  c.api.unsendMessage(c.event.messageID,err=>{
   if(err)return r(c,"❌ Could not unsend.");
   r(c,"🗑️ Message unsent.");
  });
 }catch(e){r(c,"❌ Unsend unavailable.")}
});

A("force_unsend",c=>{
 let m=c.args[0]||c.event.messageID;
 try{
  c.api.unsendMessage(m,err=>{
   r(c,err?"❌ Unsend failed.":`🗑️ ${m} unsent.`);
  });
 }catch(e){r(c,"❌ Unsend unavailable.")}
});

A("pending_unsend",c=>{
 if(!S.pending.length)return r(c,"📭 No pending unsend messages.");
 return r(c,"📬 PENDING UNSEND\n\n"+
  S.pending.slice(-15).map((x,i)=>`${i+1}. ${x}`).join("\n"));
});

/* 📜 AUDIT */
A("audit_log",c=>{
 if(!S.logs.length)return r(c,"📭 Audit log empty.");
 return r(c,"📜 AUDIT LOG\n\n"+
  S.logs.slice(-15).map(x=>`${x.a} • ${x.id}`).join("\n"));
});

/* 📢 COMMUNICATION */
A("broadcast",c=>r(c,`📢 ${c.args.join(" ")||"No message."}`));
A("system_message",c=>r(c,`⚙️ ${c.args.join(" ")||"No message."}`));
A("announcement",c=>r(c,`📢 ${c.args.join(" ")||"No announcement."}`));

/* 🔧 BOT */
U("help",c=>r(c,
`📚 KLERK HELP

${c.prefix}menu
${c.prefix}status
${c.prefix}admin
${c.prefix}uid
${c.prefix}pending_gc
${c.prefix}pending_unsend`));

A("prefix",c=>{
 let p=c.args[0];
 if(!p)return r(c,`⌨️ Prefix: ${c.prefix}`);
 c.config.prefix=p;
 c.saveConfig?.();
 return r(c,`⌨️ Prefix changed to: ${p}`);
});

U("keepalive",c=>r(c,"💚 Keepalive active."));

A("backup",c=>{
 try{
  let f=path.join(process.cwd(),"bot-config.json");
  if(!fs.existsSync(f))return r(c,"⚠️ Config not found.");
  let b=path.join(process.cwd(),`bot-config.backup-${Date.now()}.json`);
  fs.copyFileSync(f,b);
  return r(c,"💾 Backup created.");
 }catch(e){return r(c,"❌ Backup failed.")}
});

A("stats",c=>r(c,
`📊 BOT STATS

📜 Logs: ${S.logs.length}
👥 Staff: ${S.staff.size}
🚫 Banned: ${S.ban.size}
🔇 Muted: ${S.mute.size}
📥 Pending GC: ${S.pendingGC.size}`));

U("uptime",c=>r(c,`⏱️ Uptime: ${Math.floor(process.uptime())}s`));

A("config_bot",c=>r(c,
`⚙️ CONFIG

⌨️ Prefix: ${c.prefix}
🤖 Bot: ${c.config.bot===false?"OFF":"ON"}
🔧 Maintenance: ${c.config.maintenance?"ON":"OFF"}
❤️ Reactions: ${c.config.reactions===false?"OFF":"ON"}`));

A("maintenance",c=>{
 c.config.maintenance=!c.config.maintenance;
 c.saveConfig?.();
 return r(c,`🔧 Maintenance ${c.config.maintenance?"🔴 ON":"🟢 OFF"}`);
});

A("maintenance_on",c=>{
 c.config.maintenance=true;
 c.saveConfig?.();
 return r(c,"🔧 Maintenance 🔴 ON");
});

A("maintenance_off",c=>{
 c.config.maintenance=false;
 c.saveConfig?.();
 return r(c,"🔧 Maintenance 🟢 OFF");
});

A("logs",c=>r(c,
S.logs.length
?"📜\n"+S.logs.slice(-10).map(x=>`${x.a} — ${x.id}`).join("\n")
:"📭 No logs."));

A("api_key",c=>r(c,"🔑 API keys must remain inside .env and should never be displayed in chat."));
A("db_query",c=>r(c,"🗄️ Database administration endpoint ready."));
A("server_leave",c=>r(c,"⚠️ Server leave requested."));
A("reboot_system",c=>r(c,"🔄 Reboot requested."));

/* 🏢 BUSINESS CONTROL */
A("seize_business",c=>r(c,`🏢 Business seizure recorded for ${id(c)}.`));

/* 🎪 EVENTS */
A("spawn_event",c=>r(c,`🎪 Event spawned: ${c.args.join(" ")||"Custom Event"}`));
A("end_event",c=>r(c,`🛑 Event ended: ${c.args.join(" ")||"Current Event"}`));
A("force_event",c=>r(c,`⚡ Event forced: ${c.args.join(" ")||"Random Event"}`));

/* 🧩 MODULE SWITCHES */
for(const n of ["pets","casino","pvp","ai","events"])
 A(n+"_enable",c=>{
  c.config.modules=c.config.modules||{};
  c.config.modules[n]=true;
  c.saveConfig?.();
  return r(c,`🟢 ${n.toUpperCase()} ON`);
 });

for(const n of ["pets","casino","pvp","ai","events"])
 A(n+"_disable",c=>{
  c.config.modules=c.config.modules||{};
  c.config.modules[n]=false;
  c.saveConfig?.();
  return r(c,`🔴 ${n.toUpperCase()} OFF`);
 });

module.exports=Object.values(C);
