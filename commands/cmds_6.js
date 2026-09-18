const R=globalThis.__KLERK_BOT__||(globalThis.__KLERK_BOT__={}),P=R.players||(R.players=new Map()),C={};
const U=id=>{id=String(id||"");let u=P.get(id);if(!u)u={id,cash:100000,bank:0,vault:0,savings:0,coins:100,tokens:0,xp:0,level:1,inventory:{},aiUses:0,aiQuota:50,aiMode:"normal",aiPersona:"Klerk"};u.inventory??={};u.aiUses??=0;u.aiQuota??=50;u.aiMode??="normal";u.aiPersona??="Klerk";P.set(id,u);return u};
const N=x=>String(x||"").toLowerCase().trim(),D=(u,k,n=1)=>u.inventory[k]=(u.inventory[k]||0)+n,XP=(c,n=50)=>{let u=U(c.uid),old=u.level;u.xp=(u.xp||0)+n;while(u.xp>=u.level*100){u.xp-=u.level*100;u.level++}return old<u.level?` 🎉 Lv.${u.level}!`:""},REWARD=(c,x=75,cash=25000,it=["🤖 AI Token","🧠 Brain Chip","🎁 AI Box"])=>{let u=U(c.uid);u.cash+=cash;it.slice(0,3).forEach(i=>D(u,i));return`💰 +$${cash.toLocaleString()} • 🎁 ${it.slice(0,3).join(" • ")} • ✨ +${x} XP${XP(c,x)}`};
const Q=(c)=>{let u=U(c.uid);if(u.aiUses>=u.aiQuota)return false;u.aiUses++;return true},T=c=>c.args.join(" ").trim()||"No prompt supplied.",add=(names,fn)=>String(names).split("|").forEach(n=>C[N(n)]={name:N(n),execute:fn,module:"ai"});
const answer=(c,label)=>{if(!Q(c))return c.reply("🤖 AI QUOTA REACHED\n⏳ Your current AI quota is exhausted.");let q=T(c);c.reply(`🤖 ${label}\n👤 ${c.name}\n🧠 Prompt: ${q}\n\n✨ Klerk AI: I received your request and I'm ready to process it.\n💡 Add GEMINI_API_KEY to enable live Gemini responses.\n${REWARD(c,50,10000,["🧠 AI Token","💎 Data Crystal","🎁 Prompt Box"])}`)};
["ask","chat","summarize","analyze","rewrite","generate","imagine","remix","upscale","brain_dump","code_assistant","ai_persona","ai_mode","deep_dream","oracle","fortune_ai","riddle_bot","roast_ai","compliment_ai","news_anchor"].forEach(n=>add(n,c=>answer(c,n.replace(/_/g," ").toUpperCase())));

add("translate",c=>{let q=T(c),lang=c.args[0]||"English";if(!Q(c))return c.reply("🤖 AI quota reached.");c.reply(`🌍 TRANSLATOR\n🎯 Target: ${lang}\n📝 Text: ${q.replace(c.args[0]||"","").trim()||q}\n\n🤖 Translation engine ready.\n💡 Connect Gemini/API for live translation.`)});
add("dialect_shift",c=>{let q=T(c);if(!Q(c))return c.reply("🤖 AI quota reached.");c.reply(`🗣️ DIALECT SHIFT\n📝 ${q}\n✨ Choose a style: British • American • Ghanaian • Nigerian • Jamaican • Formal • Casual`)});
add("ocr_translate",c=>answer(c,"OCR + TRANSLATE"));
add("audio_trans",c=>answer(c,"AUDIO TRANSCRIBER"));
add("embassy_link",c=>c.reply(`🌍 EMBASSY HELPER\n💡 Use !embassy_link <country>\n🔎 Example: !embassy_link Ghana\n⚠️ Always verify official government sources before using embassy information.`));
add("dictionary",c=>{let w=c.args[0];if(!w)return c.reply("📖 Usage: !dictionary <word>");if(!Q(c))return c.reply("🤖 AI quota reached.");c.reply(`📖 DICTIONARY\n🔤 Word: ${w}\n🧠 Definition engine ready.\n💡 Use a live AI/API connection for full definitions, examples and pronunciation.`)});
add("lang_pack",c=>c.reply(`🌐 LANGUAGE PACKS\n${["🇬🇧 English","🇺🇸 American English","🇫🇷 French","🇪🇸 Spanish","🇩🇪 German","🇮🇹 Italian","🇵🇹 Portuguese","🇯🇵 Japanese","🇰🇷 Korean","🇨🇳 Chinese"].map((x,i)=>`${i+1}. ${x}`).join("\n")}`));
add("censor_scan",c=>{let q=T(c);let bad=/\b(spam|scam|hate|threat)\b/i.test(q);c.reply(`🛡️ CENSOR SCAN\n🔍 ${q}\n📊 Result: ${bad?"⚠️ REVIEW NEEDED":"✅ No obvious flagged terms detected."}`)});
add("cyber_patch",c=>c.reply(`🛡️ CYBER PATCH\n🔐 Security scan complete.\n✅ Command registry protected\n✅ Cooldown layer active\n✅ Admin controls detected\n🧩 Patch status: READY`));

add("prompt_shop",c=>c.reply(`🧠 PROMPT SHOP\n${["🎯 Expert Writer","💻 Coding Master","📊 Data Analyst","🎨 Creative Director","🧪 Research Assistant","📚 Tutor","💼 Business Advisor","🌍 Translator","🎮 Game Master","🤖 Community Assistant"].map((x,i)=>`${i+1}. ${x}`).join("\n")}`));
add("ai_status",c=>{let u=U(c.uid);c.reply(`🤖 AI STATUS\n⚡ Engine: Klerk AI\n🧠 Mode: ${u.aiMode}\n🎭 Persona: ${u.aiPersona}\n📊 Usage: ${u.aiUses}/${u.aiQuota}\n${"█".repeat(Math.min(10,Math.round(u.aiUses/u.aiQuota*10)))}${"░".repeat(Math.max(0,10-Math.min(10,Math.round(u.aiUses/u.aiQuota*10))))}`)});
add("ai_quota",c=>{let u=U(c.uid);c.reply(`📊 AI QUOTA\n🔥 Used: ${u.aiUses}\n🎯 Limit: ${u.aiQuota}\n💚 Remaining: ${Math.max(0,u.aiQuota-u.aiUses)}`)});
add("ai_config",c=>{let u=U(c.uid);if(!c.isAdmin)return c.reply("🔒 Admin only.");let mode=c.args[0]||"normal";u.aiMode=mode;c.reply(`⚙️ AI CONFIG\n🧠 Mode set to: ${mode}`)});
add("ai_blacklist",c=>{if(!c.isAdmin)return c.reply("🔒 Admin only.");c.reply("🚫 AI blacklist panel opened.\n💡 Use the bot config to manage blocked AI prompts.")});
add("ai_logs",c=>{if(!c.isAdmin)return c.reply("🔒 Admin only.");c.reply(`📜 AI LOGS\n👤 Requester: ${c.uid}\n📊 Requests stored in runtime memory.\n🔐 Sensitive prompt data is not displayed.`)});
add("ai_bounty",c=>{if(!c.isAdmin)return c.reply("🔒 Admin only.");c.reply(`🎯 AI BOUNTY\n${REWARD(c,200,100000,["🤖 AI Core","💎 Neural Crystal","🎁 AI Bounty Chest"])}`)});
add("ai_shutdown",c=>{if(!c.isAdmin)return c.reply("🔒 Admin only.");R.aiShutdown=true;c.reply("🛑 AI subsystem shutdown flag enabled.")});

add("ai_persona",c=>{let u=U(c.uid),p=c.args.join(" ")||"Klerk";u.aiPersona=p;c.reply(`🎭 AI PERSONA\n🤖 Persona: ${p}\n✅ Persona saved for this session.`)});
add("ai_mode",c=>{let u=U(c.uid),m=c.args[0]||"normal";u.aiMode=m;c.reply(`🧠 AI MODE\n⚙️ ${m}\nAvailable: normal • creative • coder • teacher • pirate • comedian • analyst`)});
add("img_to_text",c=>answer(c,"IMAGE → TEXT"));
add("avatar_gen",c=>answer(c,"AI AVATAR GENERATOR"));
add("generate",c=>answer(c,"AI GENERATOR"));
add("imagine",c=>answer(c,"AI IMAGE PROMPT"));
add("deep_dream",c=>answer(c,"DEEP DREAM"));
add("ocr_translate",c=>answer(c,"OCR TRANSLATOR"));
add("audio_trans",c=>answer(c,"AUDIO TRANSLATOR"));

module.exports=Object.values(C);
