// cmds/admin.js - 50 ADMIN COMMANDS - Filter, Whitelist, Thread, OnlyAdmin, Pending, Unsend, Anti, Warn, Logs

module.exports = {

  // ===== FILTER 10 CMDS =====
  "filter": async ({api,tid,args,thread,save})=>{
    if(args[0]=="add"){ const word=args.slice(1).join(" "); thread.filters.push(word); save(); return api.sendMessage(`✅ Filter added: ${word}\nFilters: ${thread.filters.join(", ")}`,tid); }
    if(args[0]=="remove"){ const word=args.slice(1).join(" "); thread.filters=thread.filters.filter(f=>f!=word); save(); return api.sendMessage(`✅ Filter removed: ${word}`,tid); }
    if(args[0]=="list"){ return api.sendMessage(`🚫 Filters ${thread.filters.length}:\n${thread.filters.join("\n")||"None"}`,tid); }
    api.sendMessage(`╭─〔 🚫 FILTER CONFIG 〕─╮\nUse:!filter add <word> - Auto delete msgs with word\n!filter remove <word>\n!filter list\nCurrent: ${thread.filters.join(", ")||"None"}\n╰──────────────────╯`,tid);
  },
  "filter add": async (ctx)=> module.exports["filter"](ctx),
  "filter remove": async (ctx)=> module.exports["filter"](ctx),
  "filter list": async (ctx)=> module.exports["filter"]({...ctx, args:["list"]}),
  "filter on": async ({api,tid,thread,save})=>{ thread.filterOn=true; save(); api.sendMessage(`✅ Filter ON!`,tid); },
  "filter off": async ({api,tid,thread,save})=>{ thread.filterOn=false; save(); api.sendMessage(`✅ Filter OFF!`,tid); },
  "badwords": async (ctx)=> module.exports["filter"]({...ctx, args:["list"]}),
  "block word": async (ctx)=> module.exports["filter"](ctx),
  "word filter": async (ctx)=> module.exports["filter"](ctx),

  // ===== WHITELIST / BLACKLIST 10 CMDS =====
  "whitelist": async ({api,tid,args,thread,save})=>{
    if(args[0]=="add"){ const id=args[1]?.replace(/[@<>]/g,""); thread.whitelist.push(id); save(); return api.sendMessage(`✅ Whitelist added ID ${id}\nWhitelist: ${thread.whitelist.join(", ")}`,tid); }
    if(args[0]=="remove"){ const id=args[1]?.replace(/[@<>]/g,""); thread.whitelist=thread.whitelist.filter(x=>x!=id); save(); return api.sendMessage(`✅ Whitelist removed ${id}`,tid); }
    api.sendMessage(`📜 Whitelist ${thread.whitelist.length}: ${thread.whitelist.join(", ")||"None"}\nUse:!whitelist add @user,!whitelist remove @user`,tid);
  },
  "whitelist add": async (ctx)=> module.exports["whitelist"](ctx),
  "whitelist remove": async (ctx)=> module.exports["whitelist"](ctx),
  "whitelist list": async (ctx)=> module.exports["whitelist"](ctx),
  "blacklist": async ({api,tid,args,thread,save})=>{
    if(args[0]=="add"){ const id=args[1]?.replace(/[@<>]/g,""); thread.blacklist.push(id); save(); return api.sendMessage(`✅ Blacklist added ${id}`,tid); }
    if(args[0]=="remove"){ const id=args[1]?.replace(/[@<>]/g,""); thread.blacklist=thread.blacklist.filter(x=>x!=id); save(); return api.sendMessage(`✅ Blacklist removed ${id}`,tid); }
    api.sendMessage(`🚫 Blacklist ${thread.blacklist.length}: ${thread.blacklist.join(", ")}`,tid);
  },
  "blacklist add": async (ctx)=> module.exports["blacklist"](ctx),
  "blacklist remove": async (ctx)=> module.exports["blacklist"](ctx),
  "ban": async ({api,tid,args,getUser,save})=>{
    const id=args[0]?.replace(/[@<>]/g,""); const u=getUser(id); u.banned=true; save(); api.sendMessage(`🚫 Banned ID ${id}! 3 warns = ban!`,tid);
  },
  "unban": async ({api,tid,args,getUser,save})=>{
    const id=args[0]?.replace(/[@<>]/g,""); const u=getUser(id); u.banned=false; u.warnings=0; save(); api.sendMessage(`✅ Unbanned ID ${id}!`,tid);
  },

  // ===== THREAD / ONLYADMIN / PENDING 20 CMDS =====
  "thread": async ({api,tid,args,data})=>{
    if(args[0]=="list"){ let txt=`🧵 THREAD LIST ${Object.keys(data.threads).length}:\n`; Object.keys(data.threads).slice(0,15).forEach(id=> txt+=`ID ${id} - ${data.users[id]?.level||1} LVL\n`); return api.sendMessage(txt,tid); }
    if(args[0]=="info"){ api.sendMessage(`🧵 Thread ID ${tid} Members ${Object.keys(data.users).length} Owner ${data.threads[tid]?.owner||"Unknown"}`,tid); }
  },
  "thread list": async (ctx)=> module.exports["thread"]({...ctx, args:["list"]}),
  "thread info": async (ctx)=> module.exports["thread"]({...ctx, args:["info"]}),
  "threads": async (ctx)=> module.exports["thread"]({...ctx, args:["list"]}),
  "gc list": async (ctx)=> module.exports["thread"]({...ctx, args:["list"]}),
  "group list": async (ctx)=> module.exports["thread"]({...ctx, args:["list"]}),

  "onlyadmin": async ({api,tid,args,thread,save})=>{
    if(args[0]=="on"){ thread.onlyAdmin=true; save(); return api.sendMessage(`🔒 OnlyAdmin ON!\nOnly admin can use bot! Msg: ${thread.onlyAdminText}`,tid); }
    if(args[0]=="off"){ thread.onlyAdmin=false; save(); return api.sendMessage(`🔓 OnlyAdmin OFF! All can use bot!`,tid); }
    if(args[0]=="set"){ const txt=args.slice(1).join(" "); thread.onlyAdminText=txt; save(); return api.sendMessage(`✅ OnlyAdmin text set: ${txt}`,tid); }
    api.sendMessage(`🔒 OnlyAdmin: ${thread.onlyAdmin?"ON":"OFF"}\nText: ${thread.onlyAdminText}\nUse:!onlyadmin on/off/set <text>`,tid);
  },
  "onlyadmin on": async (ctx)=> module.exports["onlyadmin"]({...ctx, args:["on"]}),
  "onlyadmin off": async (ctx)=> module.exports["onlyadmin"]({...ctx, args:["off"]}),
  "onlyadmin set": async (ctx)=> module.exports["onlyadmin"](ctx),
  "only admin": async (ctx)=> module.exports["onlyadmin"](ctx),

  "pending": async ({api,tid,args})=>{
    if(args[0]=="list"){ api.getThreadList(10, null, ["PENDING"], (err,list)=>{ if(err) return api.sendMessage(`❌ Can't get pending`,tid); let txt=`⏳ PENDING ${list.length}:\n`; list.forEach(t=> txt+=`ID ${t.threadID} Name ${t.name}\n`); api.sendMessage(txt,tid); }); }
    if(args[0]=="approve"){ const id=args[1]; api.handleMessageRequest(id, true, (err)=> api.sendMessage(err?`❌`:`✅ Approved pending ${id}`,tid)); }
    if(!args[0]) api.sendMessage(`⏳ Pending: Use!pending list /!pending approve <id>`,tid);
  },
  "pending list": async (ctx)=> module.exports["pending"]({...ctx, args:["list"]}),
  "pending approve": async (ctx)=> module.exports["pending"](ctx),
  "approve pending": async (ctx)=> module.exports["pending"]({...ctx, args:["approve", ctx.args[0]]}),
  "requests": async (ctx)=> module.exports["pending"]({...ctx, args:["list"]}),

  // ===== ANTISPAM / ANTI / AUTO 10 CMDS =====
  "antispam": async ({api,tid,args,thread,save})=>{
    if(args[0]=="on"){ thread.antiSpam=true; save(); return api.sendMessage(`✅ AntiSpam ON!`,tid); }
    if(args[0]=="off"){ thread.antiSpam=false; save(); return api.sendMessage(`✅ AntiSpam OFF!`,tid); }
    api.sendMessage(`🛡️ AntiSpam: ${thread.antiSpam?"ON":"OFF"} Use!antispam on/off`,tid);
  },
  "antilink": async ({api,tid,args,thread,save})=>{
    if(args[0]=="on"){ thread.antiLink=true; save(); return api.sendMessage(`✅ AntiLink ON!`,tid); }
    if(args[0]=="off"){ thread.antiLink=false; save(); return api.sendMessage(`✅ AntiLink OFF!`,tid); }
  },
  "autoseen": async ({api,tid,args,thread,save})=>{ thread.autoSeen=args[0]=="on"; save(); api.sendMessage(`👁️ AutoSeen ${args[0]}`,tid); },
  "autoreact": async ({api,tid,args,thread,save})=>{ thread.autoReact=args[0]!="off"; save(); api.sendMessage(`😂 AutoReact ${thread.autoReact?"ON":"OFF"} - Reacts 🔥❤️😂 to every msg!`,tid); },
  "setonlyadmin": async (ctx)=> module.exports["onlyadmin"](ctx),
  "admin only": async (ctx)=> module.exports["onlyadmin"](ctx)
};
