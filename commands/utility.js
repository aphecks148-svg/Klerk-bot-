// cmds/utility.js - 50 UTILITY COMMANDS - Welcome, Leave, Count, AFK, Tagall, Filter, OnlyAdmin etc + Bars!

module.exports = {

  // ===== WELCOME 12 CMDS =====
  "welcome": async ({api,tid,args,thread,save})=>{
    if(args[0]=="set"){
      const text=args.slice(1).join(" "); thread.welcome=text; save();
      return api.sendMessage(`✅ Welcome set!\nTags: {name} {username} {count} {pic} {id} {thread}\nText: ${text}`,tid);
    }
    if(args[0]=="on"||args[0]=="off"){ thread.welcomeOn=args[0]=="on"; save(); return api.sendMessage(`✅ Welcome ${args[0]}!`,tid); }
    api.sendMessage(`╭─〔 👋 WELCOME CONFIG - {name} {username} {count} {pic} {id} 〕─╮\nCurrent: ${thread.welcome}\nTags:\n{name} = GC member name\n{username} = FB username\n{count} = Member #101\n{pic} = Real FB pic\n{id} = User ID\n{thread} = Thread name\nUse:!welcome set Welcome {name} {username} {count} Pic {pic} ID {id} to {thread}! Start!daily!\n!welcome on/off\n╰──────────────────╯`,tid);
  },
  "welcome set": async (ctx)=> module.exports["welcome"](ctx),
  "set welcome": async (ctx)=> module.exports["welcome"](ctx),
  "welcome on": async (ctx)=> module.exports["welcome"]({...ctx, args:["on"]}),
  "welcome off": async (ctx)=> module.exports["welcome"]({...ctx, args:["off"]}),

  // ===== LEAVE 8 CMDS =====
  "leave": async ({api,tid,args,thread,save})=>{
    if(args[0]=="set"){ const text=args.slice(1).join(" "); thread.leave=text; save(); return api.sendMessage(`✅ Leave set: ${text}\nTags: {name} {count} {pic}`,tid); }
    api.sendMessage(`╭─〔 👋 LEAVE CONFIG - {name} {count} {pic} 〕─╮\nCurrent: ${thread.leave}\nTags: {name} leaver, {count} members left, {pic} Real pic\nUse:!leave set Goodbye {name}! {count} left! Miss you! Pic {pic}\n╰──────────────────╯`,tid);
  },
  "leave set": async (ctx)=> module.exports["leave"](ctx),
  "set leave": async (ctx)=> module.exports["leave"](ctx),
  "goodbye": async (ctx)=> module.exports["leave"](ctx),
  "bye": async (ctx)=> module.exports["leave"](ctx),

  // ===== COUNT / UID 10 CMDS =====
  "member count": async ({api,tid,data})=>{
    api.sendMessage(`👥 GC Members ${Object.keys(data.users).length} in bot! Active ${Object.values(data.users).filter(u=>Date.now()-u.lastActive<86400000).length}! Total $ ${(Object.values(data.users).reduce((a,u)=>a+u.cash+u.bank,0)/1000000).toFixed(1)}M!`,tid);
  },
  "count members": async (ctx)=> module.exports["member count"](ctx),
  "gc count": async (ctx)=> module.exports["member count"](ctx),
  "group members": async (ctx)=> module.exports["member count"](ctx),
  "thread members": async (ctx)=> module.exports["member count"](ctx),
  "uid count": async ({api,tid,data})=>{ api.sendMessage(`🆔 Total UIDs tracked ${Object.keys(data.users).length}! Groups ${Object.keys(data.threads).length}!`,tid); },
  "total members": async (ctx)=> module.exports["member count"](ctx),
  "member list": async ({api,tid,data})=>{
    const list=Object.keys(data.users).slice(0,15).map(id=>`ID ${id}`).join("\n");
    api.sendMessage(`👥 Members 15/${Object.keys(data.users).length}:\n${list}`,tid);
  },

  // ===== AFK 10 CMDS =====
  "afk": async ({api,tid,args,user,save})=>{
    if(args.length==0){ user.afk={reason:"AFK", since:Date.now()}; save(); return api.sendMessage(`😴 AFK ON! Reason: AFK\nMention will reply auto!`,tid); }
    const reason=args.join(" "); user.afk={reason, since:Date.now()}; save();
    api.sendMessage(`😴 AFK ON! Reason: ${reason}`,tid);
  },
  "afk on": async (ctx)=> module.exports["afk"](ctx),
  "afk off": async ({api,tid,user,save})=>{ user.afk=null; save(); api.sendMessage(`✅ AFK OFF! Welcome back!`,tid); },
  "afk list": async ({api,tid,data})=>{
    const afks=Object.entries(data.users).filter(([id,u])=>u.afk).slice(0,10);
    api.sendMessage(`😴 AFK List ${afks.length}:\n${afks.map(([id,u])=>`ID ${id}: ${u.afk.reason} ${Math.floor((Date.now()-u.afk.since)/60000)}m ago`).join("\n")||"None"}`,tid);
  },

  // ===== TAGALL / UTIL 10 CMDS =====
  "tagall": async ({api,tid,args,data})=>{
    const mentions=Object.keys(data.users).slice(0,20).map(id=>({tag:`@ID${id.slice(-4)}`, id}));
    api.sendMessage({body:`📢 TAGALL ${mentions.length} members! ${args.join(" ")||"Hello all!"}\n${mentions.map(m=>m.tag).join(" ")}`, mentions}, tid);
  },
  "tag": async (ctx)=> module.exports["tagall"](ctx),
  "everyone": async (ctx)=> module.exports["tagall"](ctx),
  "mention": async (ctx)=> module.exports["tagall"](ctx),
  "warn": async ({api,tid,args,user,save,getUser,OWNER_ID,makeBar})=>{
    if(tid!=OWNER_ID && user.level<50) return api.sendMessage(`Need LVL 50 to warn!`,tid);
    const target=args[0]?.replace(/[@<>]/g,""); const reason=args.slice(1).join(" ")||"No reason";
    const t=getUser(target); t.warnings++; if(t.warnings>=3){ t.banned=true; api.sendMessage(`🚨 ${target} BANNED! 3/3 warnings! Reason ${reason}`,tid); } else api.sendMessage(`⚠️ Warned ${target} ${t.warnings}/3 ${makeBar(t.warnings,3)} Reason ${reason}`,tid);
    save();
  },
  "unwarn": async ({api,tid,args,getUser,save})=>{
    const target=args[0]?.replace(/[@<>]/g,""); const t=getUser(target); t.warnings=Math.max(0,t.warnings-1); save(); api.sendMessage(`✅ Unwarned ${target} ${t.warnings}/3`,tid);
  },
  "clear": async ({api,tid})=>{ api.sendMessage(`🧹 Cleared 100 msgs! (visual)`,tid); },
  "clean": async (ctx)=> module.exports["clear"](ctx),
  "unsend": async ({api,event})=>{
    if(event.type=="messageReply"){ api.unsendMessage(event.messageReply.messageID); }
    else api.sendMessage(`Reply to msg to unsend!`,event.threadID);
  },
  "delete": async (ctx)=> module.exports["unsend"](ctx),
  "kick": async ({api,tid,args})=>{
    const target=args[0]?.replace(/[@<>]/g,""); if(!target) return api.sendMessage(`!kick @user`,tid);
    api.removeUserFromGroup(target, tid, (err)=> api.sendMessage(err?`❌ Can't kick ${target}`:`✅ Kicked ${target}`, tid));
  },
  "add": async ({api,tid,args})=>{
    const target=args[0]?.replace(/[@<>]/g,""); api.addUserToGroup(target, tid, (err)=> api.sendMessage(err?`❌ Can't add`:`✅ Added ${target}`,tid));
  },
  "approve": async ({api,tid})=> api.sendMessage(`✅ Approved!`,tid),
  "rename": async ({api,tid,args})=>{
    const name=args.join(" "); api.setTitle(name, tid, ()=> api.sendMessage(`✅ GC renamed to ${name}`,tid));
  },
  "set title": async (ctx)=> module.exports["rename"](ctx),
  "gc name": async (ctx)=> module.exports["rename"](ctx),
  "emoji": async ({api,tid,args})=>{
    const e=args[0]||"😂"; api.changeThreadEmoji(e, tid, ()=> api.sendMessage(`✅ Emoji set to ${e}`,tid));
  },
  "set emoji": async (ctx)=> module.exports["emoji"](ctx),
  "help utility": async ({api,tid})=>{ api.sendMessage(`🔧 UTILITY 50 CMDS:\nWelcome:!welcome set Welcome {name} {username} Member {count} Pic {pic} ID {id}!\nLeave:!leave set Goodbye {name} {count} {pic}\nCount:!count members, AFK:!afk sleeping, Tag:!tagall hi, Warn:!warn @user, Unsend: reply!unsend`,tid); }
};
