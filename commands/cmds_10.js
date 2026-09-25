// commands/cmds_10.js
// 👥 SOCIALHUB — iKON-BOT • 25 Commands
module.exports = ({api,event,user,reply,users,profile,fun,bar})=>{
const replyx=t=>api.sendMessage(t,event.threadID,()=>{},event.messageID);
const fmt=n=>Number(n||0).toLocaleString();
const money=u=>Math.floor(Number(u.wallet||0));
const setMoney=(u,n)=>u.wallet=Math.max(0,Math.floor(n));
const xp=(u,n=10)=>{u.xp=(u.xp||0)+n; u.level=Math.floor((u.xp||0)/1000)+1;};
const ensure=u=>{
  u.social=u.social||{friends:[],requests:[],blocked:[],married:null,marriageDate:0,likes:0,likedBy:[],bio:"",status:"",reputation:0,level:1,xp:0,posts:0,comments:0,shares:0};
  u.inventory=u.inventory||{}; u.level=u.level||1; u.xp=u.xp||0;
};
const rand=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()*100<p;

const cmds=[
{name:"profile",aliases:["me","myprofile"],description:"View your profile",run:async()=>{
  ensure(user); let s=user.social;
  replyx(`👤 ${user.name}'s PROFILE
━━━━━━━━━━━━
⭐ Level ${user.level} • XP ${fmt(user.xp)}
💬 Bio: ${s.bio||"No bio set! Use!setbio"}
📝 Posts: ${s.posts} • ❤️ Likes: ${s.likes}
💍 Married: ${s.married?users.get(s.married)?.name||s.married:"Single"}
👥 Friends: ${s.friends.length} • Rep: ${s.reputation}
${bar?bar(user.xp%1000,1000,10):""}
${fun?fun():""}`)
}},

{name:"setbio",aliases:["bio"],description:"Set bio",run:async({args})=>{
  ensure(user); let t=args.join(" ").slice(0,100); if(!t) return replyx("Usage:!setbio <text>"); user.social.bio=t; replyx(`✅ Bio set!\n💬 "${t}"`)
}},

{name:"status",aliases:["mystatus"],description:"Set status",run:async({args})=>{
  ensure(user); let t=args.join(" ").slice(0,80); if(!t) return replyx(`📝 Status: ${user.social.status||"None"}\nUse!status <text>`); user.social.status=t; replyx(`✅ Status: ${t}`)
}},

{name:"friend",aliases:["friends"],description:"Friend list",run:async()=>{
  ensure(user); let f=user.social.friends; if(!f.length) return replyx("👥 No friends yet. Use!addfriend @user");
  replyx(`👥 FRIENDS (${f.length})\n${f.map(id=>`• ${users.get(id)?.name||id}`).join("\n")}`)
}},

{name:"addfriend",aliases:["friendadd"],description:"Add friend",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("👥 Tag someone to add friend!"); let other=users.get(target); if(!other) return replyx("❌ User not found"); ensure(user); ensure(other);
  if(user.social.friends.includes(target)) return replyx("✅ Already friends!"); if(user.uid===target) return replyx("❌ Can't add yourself");
  other.social.requests=other.social.requests||[]; if(other.social.requests.includes(user.uid)) return replyx("⏳ Request already sent");
  other.social.requests.push(user.uid); replyx(`👥 Friend request sent to ${other.name}!\n💡 They need!acceptfriend @you`)
}},

{name:"acceptfriend",aliases:["accept"],description:"Accept friend",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; ensure(user); let reqs=user.social.requests||[]; if(!reqs.length) return replyx("📭 No friend requests");
  let id=target||reqs[0]; let other=users.get(id); if(!other) return replyx("❌ User not found"); ensure(other);
  user.social.requests=user.social.requests.filter(x=>x!==id); if(!user.social.friends.includes(id)) user.social.friends.push(id); if(!other.social.friends.includes(user.uid)) other.social.friends.push(user.uid);
  xp(user,20); xp(other,20); replyx(`✅ You and ${other.name} are now friends!\n⭐ +20 XP each`)
}},

{name:"unfriend",aliases:["removefriend"],description:"Unfriend",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("Tag someone to unfriend"); ensure(user); let other=users.get(target); if(!other) return replyx("❌ User not found");
  user.social.friends=user.social.friends.filter(x=>x!==target); other.social=other.social||{friends:[]}; other.social.friends=(other.social.friends||[]).filter(x=>x!==user.uid);
  replyx(`💔 Unfriended ${other.name}`)
}},

{name:"block",aliases:["blockuser"],description:"Block user",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("Tag someone to block"); ensure(user); if(!user.social.blocked.includes(target)) user.social.blocked.push(target); replyx(`🚫 Blocked ${users.get(target)?.name||target}`)
}},

{name:"unblock",aliases:["unblockuser"],description:"Unblock",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("Tag to unblock"); ensure(user); user.social.blocked=user.social.blocked.filter(x=>x!==target); replyx(`✅ Unblocked ${users.get(target)?.name||target}`)
}},

{name:"marry",aliases:["marriage","propose"],description:"Propose marriage",cooldown:60,run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("💍 Tag someone to propose!"); let other=users.get(target); if(!other) return replyx("❌ User not found"); ensure(user); ensure(other);
  if(user.social.married) return replyx("💍 Already married!"); if(other.social.married) return replyx("💍 They are already married!"); if(user.uid===target) return replyx("❌ Can't marry yourself!");
  if(money(user)<50000) return replyx("💸 Need $50,000 for wedding ring!");
  setMoney(user,money(user)-50000); other.social.requestsMarriage=other.social.requestsMarriage||[]; other.social.requestsMarriage.push(user.uid);
  replyx(`💍 You proposed to ${other.name}!\n💸 Ring cost $50,000\n💡 ${other.name} use!acceptmarry @you`)
}},

{name:"acceptmarry",aliases:["acceptmarriage"],description:"Accept marriage",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; ensure(user); let reqs=user.social.requestsMarriage||[]; if(!reqs.length) return replyx("💌 No proposals");
  let id=target||reqs[0]; let other=users.get(id); if(!other) return replyx("❌ User not found"); ensure(other);
  user.social.requestsMarriage=user.social.requestsMarriage.filter(x=>x!==id); user.social.married=id; other.social.married=user.uid; user.social.marriageDate=Date.now(); other.social.marriageDate=Date.now();
  xp(user,100); xp(other,100); let bonus=20000; setMoney(user,money(user)+bonus); setMoney(other,money(other)+bonus);
  replyx(`💒 MARRIED! ${user.name} ❤️ ${other.name}\n💰 Wedding gift +$${fmt(bonus)} each\n⭐ +100 XP\n${fun?fun():""}`)
}},

{name:"divorce",aliases:["breakup"],description:"Divorce",run:async()=>{
  ensure(user); if(!user.social.married) return replyx("💔 Not married"); let other=users.get(user.social.married); let fee=25000; if(money(user)<fee) return replyx(`Need $${fmt(fee)} for divorce fee`); setMoney(user,money(user)-fee);
  if(other){ other.social=other.social||{}; other.social.married=null; } user.social.married=null; replyx(`💔 Divorced! Fee $${fmt(fee)}\nSingle again.`)
}},

{name:"couple",aliases:["couples"],description:"View couple",run:async()=>{
  ensure(user); if(!user.social.married) return replyx("💔 Not married"); let other=users.get(user.social.married); let days=Math.floor((Date.now()-user.social.marriageDate)/86400000);
  replyx(`💑 COUPLE: ${user.name} ❤️ ${other?.name||"Unknown"}\n📅 Married ${days} days\n💍 Since ${new Date(user.social.marriageDate).toLocaleDateString()}`)
}},

{name:"like",aliases:["likes"],description:"Like someone",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("❤️ Tag someone to like!"); let other=users.get(target); if(!other) return replyx("❌ User not found"); ensure(user); ensure(other);
  if(other.social.likedBy.includes(user.uid)) return replyx("❤️ Already liked!"); other.social.likedBy.push(user.uid); other.social.likes++; other.social.reputation+=5; xp(other,5);
  replyx(`❤️ You liked ${other.name}!\n💖 They have ${other.social.likes} likes`)
}},

{name:"reputation",aliases:["rep"],description:"Reputation",run:async()=>{
  ensure(user); replyx(`⭐ Reputation: ${user.social.reputation}\nLikes: ${user.social.likes}\nFriends: ${user.social.friends.length}\n${bar?bar(user.social.reputation%500,500,10):""}`)
}},

{name:"leaderboard",aliases:["lb","top"],description:"Social leaderboard",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,rep:u.social?.reputation||0})).sort((a,b)=>b.rep-a.rep).slice(0,10);
  replyx(`🏆 SOCIAL LEADERBOARD\n${list.map((x,i)=>`${i+1}. ${x.name} — ⭐ ${x.rep} rep`).join("\n")}`)
}},

{name:"socialstats",aliases:["sstats"],description:"Social stats",run:async()=>{
  ensure(user); let s=user.social; replyx(`📊 SOCIAL STATS\nFriends: ${s.friends.length}\nLikes: ${s.likes}\nPosts: ${s.posts}\nRep: ${s.reputation}\nMarried: ${s.married?"Yes":"No"}`)
}},

{name:"post",aliases:["createpost"],description:"Create post",cooldown:15,run:async({args})=>{
  ensure(user); let text=args.join(" ").slice(0,200); if(!text) return replyx("Usage:!post <text>"); user.social.posts++; xp(user,10); replyx(`📝 ${user.name} posted:\n"${text}"\n❤️ 0 likes • 💬 0 comments\n⭐ +10 XP`)
}},

{name:"comment",aliases:["comments"],description:"Comment",run:async({args})=>{
  ensure(user); let text=args.join(" ").slice(0,150); if(!text) return replyx("Usage:!comment <text>"); user.social.comments++; xp(user,5); replyx(`💬 ${user.name} commented: "${text}"\n⭐ +5 XP`)
}},

{name:"share",aliases:["sharepost"],description:"Share",run:async()=>{
  ensure(user); user.social.shares++; xp(user,5); replyx(`🔁 ${user.name} shared a post!\n⭐ +5 XP`)
}},

{name:"socialrank",aliases:["srank"],description:"Social rank",run:async()=>{
  let list=[...users.values()].map(u=>({name:u.name||u.uid,f:u.social?.friends?.length||0})).sort((a,b)=>b.f-a.f).slice(0,10);
  replyx(`👥 SOCIAL RANK (Friends)\n${list.map((x,i)=>`${i+1}. ${x.name} — ${x.f} friends`).join("\n")}`)
}},

{name:"giftuser",aliases:["giftt","socialgift"],description:"Gift to user",run:async({args})=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("🎁 Tag someone to gift!"); let other=users.get(target); if(!other) return replyx("❌ User not found"); let amt=Number(args.filter(x=>!x.startsWith("@")).join(""))||1000;
  if(money(user)<amt) return replyx(`Need $${fmt(amt)}`); setMoney(user,money(user)-amt); setMoney(other,money(other)+amt); other.social=other.social||{reputation:0}; other.social.reputation+=10; ensure(user);
  replyx(`🎁 Gifted $${fmt(amt)} to ${other.name}!\n⭐ Their rep +10`)
}},

{name:"shoutout",aliases:["shout"],description:"Shoutout",cooldown:30,run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; ensure(user); if(!target){ replyx(`📢 ${user.name} shouts: Hello everyone! 👋\n${fun?fun():""}`); return; }
  let other=users.get(target); if(!other) return replyx("❌ User not found"); other.social=other.social||{reputation:0}; other.social.reputation+=5;
  replyx(`📢 SHOUTOUT to ${other.name}!\n🔥 Everyone check out ${other.name}!\n⭐ +5 Rep for them!`)
}},

{name:"follow",aliases:["follows"],description:"Follow user",run:async()=>{
  let target=event.mentions&&Object.keys(event.mentions)[0]; if(!target) return replyx("Tag to follow"); let other=users.get(target); if(!other) return replyx("❌ User not found"); ensure(user);
  user.social.following=user.social.following||[]; if(!user.social.following.includes(target)) user.social.following.push(target);
  replyx(`✅ Following ${other.name}!`)
}},

{name:"socialhelp",aliases:["shelp"],description:"Social help",run:async()=>{
  replyx(`👥 SOCIALHUB HELP\n👤!profile •!setbio •!status\n👥!friend •!addfriend •!acceptfriend\n❤️!like •!reputation •!leaderboard\n💍!marry •!acceptmarry •!couple •!divorce\n📝!post •!comment •!share •!shoutout\n🎁!giftuser @user <amount>`)
}}
];
return cmds;
};
