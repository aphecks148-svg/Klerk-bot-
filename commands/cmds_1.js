// commands/cmds_1.js
// iKON-BOT • MONEYFORGE
// 35 commands • Economy Core
// Uses state supplied by index.js

module.exports = [
  {
    name:"balance",
    aliases:["bal","b"],
    category:"MONEYFORGE",
    description:"View your complete financial profile.",
    usage:"!balance",
    cooldown:1500,
    run:async({api,event,user,reply,bar,fun})=>{
      reply(api,event,
`💰 MONEYFORGE • ${user.name}
━━━━━━━━━━━━━━━━━━
💵 Wallet: $${user.wallet.toLocaleString()}
🏦 Bank: $${user.bank.toLocaleString()}
🔐 Vault: $${user.vault.toLocaleString()}
💎 Savings: $${user.savings.toLocaleString()}
━━━━━━━━━━━━━━━━━━
💰 Net Cash: $${(user.wallet+user.bank+user.vault+user.savings).toLocaleString()}
⭐ Level: ${user.level}
🔥 Prestige: ${user.prestige}
🏆 Credit: ${user.credit}
${fun()}`
      );
    }
  },

  {
    name:"deposit",
    aliases:["dep"],
    category:"MONEYFORGE",
    description:"Move wallet money into your bank.",
    usage:"!deposit <amount>",
    cooldown:2000,
    run:async({api,event,args,user,reply,fun})=>{
      const amount=args[0]==="all"?user.wallet:Number(args[0]);
      if(!Number.isFinite(amount)||amount<=0)
        return reply(api,event,"❌ Usage: !deposit <amount>");
      if(amount>user.wallet)
        return reply(api,event,"💸 You don't have that much cash in your wallet.");
      user.wallet-=amount;
      user.bank+=amount;
      reply(api,event,
`🏦 DEPOSIT SUCCESS
💵 Deposited: $${amount.toLocaleString()}
💰 Wallet: $${user.wallet.toLocaleString()}
🏦 Bank: $${user.bank.toLocaleString()}
${fun()}`
      );
    }
  },

  {
    name:"withdraw",
    aliases:["with"],
    category:"MONEYFORGE",
    description:"Withdraw money from your bank.",
    usage:"!withdraw <amount>",
    cooldown:2000,
    run:async({api,event,args,user,reply})=>{
      const amount=args[0]==="all"?user.bank:Number(args[0]);
      if(!Number.isFinite(amount)||amount<=0)
        return reply(api,event,"❌ Usage: !withdraw <amount>");
      if(amount>user.bank)
        return reply(api,event,"🏦 Your bank balance isn't high enough.");
      user.bank-=amount;
      user.wallet+=amount;
      reply(api,event,
`💵 WITHDRAWAL
💰 Received: $${amount.toLocaleString()}
💵 Wallet: $${user.wallet.toLocaleString()}
🏦 Bank: $${user.bank.toLocaleString()}`
      );
    }
  },

  {
    name:"transfer",
    aliases:["pay","sendmoney"],
    category:"MONEYFORGE",
    description:"Transfer money to another user.",
    usage:"!transfer <uid> <amount>",
    cooldown:5000,
    run:async({api,event,args,user,users,profile,reply})=>{
      const target=String(args[0]||"").replace(/\D/g,"");
      const amount=Number(args[1]);
      if(!target||!Number.isFinite(amount)||amount<=0)
        return reply(api,event,"❌ Usage: !transfer <uid> <amount>");
      if(target===String(event.senderID))
        return reply(api,event,"😂 Bro, you can't transfer money to yourself.");
      if(amount>user.wallet)
        return reply(api,event,"💸 You don't have enough wallet cash.");
      const p=await profile(api,target);
      if(!users.has(target))users.set(target,{
        uid:target,name:p.name,firstName:p.firstName,avatar:p.avatar,
        wallet:0,bank:0,vault:0,savings:0,xp:0,level:1,prestige:0,
        health:100,maxHealth:100,energy:100,maxEnergy:100,
        stamina:100,maxStamina:100,reputation:0,credit:500,wanted:0,
        inventory:{},pets:[],cars:[],weapons:[],businesses:[],achievements:[],
        stats:{}
      });
      user.wallet-=amount;
      users.get(target).wallet+=amount;
      reply(api,event,
`💸 TRANSFER COMPLETE
👤 To: ${p.name}
💰 Amount: $${amount.toLocaleString()}
💵 Your wallet: $${user.wallet.toLocaleString()}
🤝 Money delivered successfully!`
      );
    }
  },

  {
    name:"daily",
    aliases:["d"],
    category:"MONEYFORGE",
    description:"Claim your daily reward.",
    usage:"!daily",
    cooldown:86400000,
    run:async({api,event,user,reply,fun})=>{
      const reward=25000+(user.level*1000);
      user.wallet+=reward;
      user.xp+=100;
      reply(api,event,
`🎁 DAILY REWARD
💰 +$${reward.toLocaleString()}
⭐ +100 XP
💵 Wallet: $${user.wallet.toLocaleString()}
${fun()}`
      );
    }
  },

  {
    name:"weekly",
    aliases:["week"],
    category:"MONEYFORGE",
    description:"Claim your weekly reward.",
    usage:"!weekly",
    cooldown:604800000,
    run:async({api,event,user,reply})=>{
      const reward=150000+(user.level*5000);
      user.wallet+=reward;
      user.xp+=500;
      reply(api,event,
`📅 WEEKLY PAYOUT
💰 +$${reward.toLocaleString()}
⭐ +500 XP
💵 Wallet: $${user.wallet.toLocaleString()}
🔥 Come back next week!`
      );
    }
  },

  {
    name:"monthly",
    aliases:["month"],
    category:"MONEYFORGE",
    description:"Claim your monthly reward.",
    usage:"!monthly",
    cooldown:2592000000,
    run:async({api,event,user,reply})=>{
      const reward=1000000+(user.level*25000);
      user.wallet+=reward;
      user.xp+=2500;
      reply(api,event,
`🗓️ MONTHLY PAYOUT
💰 +$${reward.toLocaleString()}
⭐ +2,500 XP
🏦 Your empire just got richer.`
      );
    }
  },

  {
    name:"work",
    aliases:["w"],
    category:"MONEYFORGE",
    description:"Work your current job for money and XP.",
    usage:"!work",
    cooldown:30000,
    run:async({api,event,user,reply,fun})=>{
      const jobs={
        miner:["⛏️ Miner",12000],
        driver:["🚕 Driver",15000],
        hacker:["💻 Hacker",22000],
        trader:["📈 Trader",30000],
        mercenary:["⚔️ Mercenary",40000]
      };
      const j=jobs[user.job]||["👷 Worker",10000];
      const reward=j[1]+Math.floor(Math.random()*j[1]);
      user.wallet+=reward;
      user.xp+=50;
      reply(api,event,
`💼 WORK COMPLETE
${j[0]}
💰 Earned: $${reward.toLocaleString()}
⭐ +50 XP
💵 Wallet: $${user.wallet.toLocaleString()}
${fun()}`
      );
    }
  },

  {
    name:"job",
    aliases:["career"],
    category:"MONEYFORGE",
    description:"View or choose your current job.",
    usage:"!job <miner|driver|hacker|trader|mercenary>",
    cooldown:2000,
    run:async({api,event,args,user,reply})=>{
      const jobs={
        miner:["⛏️ Miner",12000,1],
        driver:["🚕 Driver",15000,5],
        hacker:["💻 Hacker",22000,15],
        trader:["📈 Trader",30000,30],
        mercenary:["⚔️ Mercenary",40000,50]
      };
      if(!args[0]){
        return reply(api,event,
`💼 JOB BOARD
⛏️ miner — $12K/work — Lv.1
🚕 driver — $15K/work — Lv.5
💻 hacker — $22K/work — Lv.15
📈 trader — $30K/work — Lv.30
⚔️ mercenary — $40K/work — Lv.50

💡 Use !job <name>`
        );
      }
      const key=String(args[0]).toLowerCase(),j=jobs[key];
      if(!j)return reply(api,event,"❌ That job doesn't exist.");
      if(user.level<j[2])
        return reply(api,event,`🔒 You need Level ${j[2]} for ${j[0]}.`);
      user.job=key;
      reply(api,event,`💼 JOB SELECTED\n${j[0]}\n💰 Base pay: $${j[1].toLocaleString()}`);
    }
  },

  {
    name:"jobs",
    aliases:["careers"],
    category:"MONEYFORGE",
    description:"List all available jobs.",
    usage:"!jobs",
    cooldown:1500,
    run:async({api,event,reply})=>{
      reply(api,event,
`💼 MONEYFORGE JOBS
━━━━━━━━━━━━━━━━━━
⛏️ Miner • Lv.1 • $12K
🚕 Driver • Lv.5 • $15K
💻 Hacker • Lv.15 • $22K
📈 Trader • Lv.30 • $30K
⚔️ Mercenary • Lv.50 • $40K
━━━━━━━━━━━━━━━━━━
💡 !job <name> then !work`
      );
    }
  },

  {
    name:"salary",
    aliases:["paycheck"],
    category:"MONEYFORGE",
    description:"Collect your job salary.",
    usage:"!salary",
    cooldown:3600000,
    run:async({api,event,user,reply})=>{
      if(!user.job)return reply(api,event,"💼 You don't have a job yet. Try !jobs.");
      const salary={miner:30000,driver:40000,hacker:60000,trader:90000,mercenary:120000};
      const amount=salary[user.job]||10000;
      user.bank+=amount;
      reply(api,event,
`💳 SALARY PAID
💼 Job: ${user.job}
🏦 +$${amount.toLocaleString()} banked
🏦 Bank: $${user.bank.toLocaleString()}`
      );
    }
  },

  {
    name:"beg",
    aliases:["begmoney"],
    category:"MONEYFORGE",
    description:"Beg for a random amount of money.",
    usage:"!beg",
    cooldown:60000,
    run:async({api,event,user,reply})=>{
      const roll=Math.random();
      if(roll<0.2)return reply(api,event,"😂 Nobody gave you anything. Tough day, boss.");
      const amount=Math.floor(500+Math.random()*9500);
      user.wallet+=amount;
      user.xp+=10;
      reply(api,event,`🥺 BEGGING SUCCESS\n💰 Stranger gave you $${amount.toLocaleString()}\n⭐ +10 XP`);
    }
  },

  {
    name:"invest",
    aliases:["investment"],
    category:"MONEYFORGE",
    description:"Invest money for a later return.",
    usage:"!invest <amount>",
    cooldown:30000,
    run:async({api,event,args,user,reply})=>{
      const amount=Number(args[0]);
      if(!Number.isFinite(amount)||amount<=0)
        return reply(api,event,"❌ Usage: !invest <amount>");
      if(amount>user.wallet)return reply(api,event,"💸 Insufficient wallet funds.");
      user.wallet-=amount;
      const multiplier=0.8+Math.random()*0.7;
      const result=Math.floor(amount*multiplier);
      user.wallet+=result;
      const diff=result-amount;
      reply(api,event,
`📈 INVESTMENT CLOSED
💰 Invested: $${amount.toLocaleString()}
${diff>=0?"🟢 Profit":"🔴 Loss"}: $${Math.abs(diff).toLocaleString()}
💵 Returned: $${result.toLocaleString()}`
      );
    }
  },

  {
    name:"loan",
    aliases:["borrow"],
    category:"MONEYFORGE",
    description:"Take a loan based on your credit.",
    usage:"!loan <amount>",
    cooldown:10000,
    run:async({api,event,args,user,reply})=>{
      const amount=Number(args[0]);
      const limit=Math.max(50000,user.credit*1000);
      if(!Number.isFinite(amount)||amount<=0)
        return reply(api,event,`🏦 Usage: !loan <amount>\n💳 Your limit: $${limit.toLocaleString()}`);
      if(amount>limit)return reply(api,event,"❌ That exceeds your current credit limit.");
      user.wallet+=amount;
      user.loan=(user.loan||0)+Math.ceil(amount*1.1);
      user.credit=Math.max(0,user.credit-25);
      reply(api,event,
`🏦 LOAN APPROVED
💰 Received: $${amount.toLocaleString()}
📄 Debt: $${Math.ceil(amount*1.1).toLocaleString()}
💳 Credit: ${user.credit}`
      );
    }
  },

  {
    name:"credit",
    aliases:["creditscore"],
    category:"MONEYFORGE",
    description:"View your credit score.",
    usage:"!credit",
    cooldown:1500,
    run:async({api,event,user,reply})=>{
      const score=Math.max(0,Math.min(850,user.credit||500));
      const status=score>=750?"💎 Excellent":score>=650?"🟢 Good":score>=550?"🟡 Fair":"🔴 Poor";
      reply(api,event,
`💳 CREDIT PROFILE
📊 Score: ${score}/850
${bar(score,850)} 
📈 Status: ${status}
💡 Pay debts and avoid failed loans to improve it.`
      );
    }
  },

  {
    name:"business",
    aliases:["biz"],
    category:"MONEYFORGE",
    description:"View or manage businesses.",
    usage:"!business",
    cooldown:2000,
    run:async({api,event,user,reply})=>{
      const list=user.businesses||[];
      if(!list.length)
        return reply(api,event,"🏢 You don't own a business yet.\n💡 Use the market/shop system to acquire one.");
      reply(api,event,
`🏢 YOUR BUSINESSES
━━━━━━━━━━━━━━━━━━
${list.map((x,i)=>`${i+1}. 🏢 ${typeof x==="string"?x:x.name||"Business"}`).join("\n")}`
      );
    }
  },

  {
    name:"property",
    aliases:["properties","house"],
    category:"MONEYFORGE",
    description:"View owned properties.",
    usage:"!property",
    cooldown:2000,
    run:async({api,event,user,reply})=>{
      const p=user.properties||[];
      reply(api,event,
`🏠 PROPERTY PORTFOLIO
━━━━━━━━━━━━━━━━━━
${p.length?p.map((x,i)=>`${i+1}. 🏠 ${x.name||x}`).join("\n"):"🏚️ No properties owned yet."}`
      );
    }
  },

  {
    name:"networth",
    aliases:["nw","wealth"],
    category:"MONEYFORGE",
    description:"Calculate total liquid wealth.",
    usage:"!networth",
    cooldown:1500,
    run:async({api,event,user,reply})=>{
      const cash=(user.wallet||0)+(user.bank||0)+(user.vault||0)+(user.savings||0);
      const items=Object.values(user.inventory||{}).reduce((a,x)=>a+(Number(x.value||0)*Number(x.amount||x||0)),0);
      reply(api,event,
`💎 NET WORTH
━━━━━━━━━━━━━━━━━━
💵 Wallet: $${user.wallet.toLocaleString()}
🏦 Bank: $${user.bank.toLocaleString()}
🔐 Vault: $${user.vault.toLocaleString()}
💎 Savings: $${user.savings.toLocaleString()}
📦 Assets: $${items.toLocaleString()}
━━━━━━━━━━━━━━━━━━
👑 TOTAL: $${(cash+items).toLocaleString()}`
      );
    }
  },

  {
    name:"tax",
    aliases:["taxes"],
    category:"MONEYFORGE",
    description:"Pay or calculate your wealth tax.",
    usage:"!tax",
    cooldown:60000,
    run:async({api,event,user,reply})=>{
      const wealth=user.wallet+user.bank+user.vault+user.savings;
      const tax=Math.floor(wealth*0.01);
      if(!tax)return reply(api,event,"🧾 Your current wealth tax is $0.");
      if(tax>user.wallet)
        return reply(api,event,`🧾 Tax due: $${tax.toLocaleString()}\n💡 You need enough wallet cash to pay it.`);
      user.wallet-=tax;
      reply(api,event,`🧾 TAX PAID\n💸 -$${tax.toLocaleString()}\n💰 Wallet: $${user.wallet.toLocaleString()}`);
    }
  },

  {
    name:"payday",
    aliases:["pay"],
    category:"MONEYFORGE",
    description:"Collect a small employment bonus.",
    usage:"!payday",
    cooldown:21600000,
    run:async({api,event,user,reply})=>{
      const amount=10000+(user.level*500);
      user.wallet+=amount;
      reply(api,event,`💸 PAYDAY BONUS\n💰 +$${amount.toLocaleString()}\n⭐ Level bonus included!`);
    }
  },

  {
    name:"bonus",
    aliases:["randomcash"],
    category:"MONEYFORGE",
    description:"Claim a random surprise cash bonus.",
    usage:"!bonus",
    cooldown:3600000,
    run:async({api,event,user,reply,fun})=>{
      const amount=Math.floor(5000+Math.random()*45000);
      user.wallet+=amount;
      reply(api,event,`🎁 SURPRISE BONUS\n💰 +$${amount.toLocaleString()}\n${fun()}`);
    }
  },

  {
    name:"cashdrop",
    aliases:["drop"],
    category:"MONEYFORGE",
    description:"Create a small public cash drop.",
    usage:"!cashdrop <amount>",
    cooldown:60000,
    run:async({api,event,args,user,reply})=>{
      const amount=Number(args[0]);
      if(!Number.isFinite(amount)||amount<100)
        return reply(api,event,"❌ Minimum cash drop is $100.");
      if(amount>user.wallet)
        return reply(api,event,"💸 You don't have enough wallet cash.");
      user.wallet-=amount;
      reply(api,event,
`💰 CASH DROP CREATED
🎁 $${amount.toLocaleString()} is up for grabs!
📍 Thread: ${event.threadID}
💡 The claim mechanic can be connected to the shared drop registry.`
      );
    }
  },

  {
    name:"bankinterest",
    aliases:["interest"],
    category:"MONEYFORGE",
    description:"Collect bank interest.",
    usage:"!bankinterest",
    cooldown:86400000,
    run:async({api,event,user,reply})=>{
      const interest=Math.floor(user.bank*0.01);
      if(interest<=0)return reply(api,event,"🏦 Your bank balance is too low to generate interest.");
      user.bank+=interest;
      reply(api,event,`🏦 BANK INTEREST\n📈 +$${interest.toLocaleString()}\n🏦 New balance: $${user.bank.toLocaleString()}`);
    }
  },

  {
    name:"savings",
    aliases:["save"],
    category:"MONEYFORGE",
    description:"Move money into protected savings.",
    usage:"!savings <deposit|withdraw> <amount>",
    cooldown:2000,
    run:async({api,event,args,user,reply})=>{
      const action=String(args[0]||"").toLowerCase();
      const amount=args[1]==="all"
        ?(action==="deposit"?user.wallet:user.savings)
        :Number(args[1]);

      if(!["deposit","withdraw"].includes(action)||!Number.isFinite(amount)||amount<=0)
        return reply(api,event,"❌ Usage: !savings <deposit|withdraw> <amount>");

      if(action==="deposit"){
        if(amount>user.wallet)return reply(api,event,"💸 Not enough wallet cash.");
        user.wallet-=amount;user.savings+=amount;
      }else{
        if(amount>user.savings)return reply(api,event,"💎 Not enough savings.");
        user.savings-=amount;user.wallet+=amount;
      }

      reply(api,event,
`💎 SAVINGS UPDATED
${action==="deposit"?"📥 Deposited":"📤 Withdrawn"}: $${amount.toLocaleString()}
💎 Savings: $${user.savings.toLocaleString()}
💵 Wallet: $${user.wallet.toLocaleString()}`
      );
    }
  },

  {
    name:"vault",
    aliases:["securevault"],
    category:"MONEYFORGE",
    description:"Store money in your secure vault.",
    usage:"!vault <deposit|withdraw> <amount>",
    cooldown:2000,
    run:async({api,event,args,user,reply})=>{
      const action=String(args[0]||"").toLowerCase();
      const amount=args[1]==="all"
        ?(action==="deposit"?user.wallet:user.vault)
        :Number(args[1]);

      if(!["deposit","withdraw"].includes(action)||!Number.isFinite(amount)||amount<=0)
        return reply(api,event,"❌ Usage: !vault <deposit|withdraw> <amount>");

      if(action==="deposit"){
        if(amount>user.wallet)return reply(api,event,"💸 Not enough wallet cash.");
        user.wallet-=amount;user.vault+=amount;
      }else{
        if(amount>user.vault)return reply(api,event,"🔐 Not enough vault funds.");
        user.vault-=amount;user.wallet+=amount;
      }

      reply(api,event,
`🔐 VAULT UPDATED
${action==="deposit"?"📥 Stored":"📤 Released"}: $${amount.toLocaleString()}
🔐 Vault: $${user.vault.toLocaleString()}
💵 Wallet: $${user.wallet.toLocaleString()}`
      );
    }
  },

  {
    name:"money",
    aliases:["cash"],
    category:"MONEYFORGE",
    description:"Quickly show your wallet.",
    usage:"!money",
    cooldown:1000,
    run:async({api,event,user,reply})=>
      reply(api,event,`💵 ${user.name}'s wallet\n💰 $${user.wallet.toLocaleString()}`)
  },

  {
    name:"richest",
    aliases:["rich"],
    category:"MONEYFORGE",
    description:"Show the richest users currently known.",
    usage:"!richest",
    cooldown:5000,
    run:async({api,event,users,reply})=>{
      const list=[...users.values()]
       .sort((a,b)=>
        ((b.wallet||0)+(b.bank||0)+(b.vault||0))-
        ((a.wallet||0)+(a.bank||0)+(a.vault||0)))
       .slice(0,10);

      reply(api,event,
`👑 MONEYFORGE RICHEST
━━━━━━━━━━━━━━━━━━
${list.length?list.map((u,i)=>
`${i+1}. ${u.name} — $${((u.wallet||0)+(u.bank||0)+(u.vault||0)).toLocaleString()}`
).join("\n"):"No players recorded yet."}`
      );
    }
  },

  {
    name:"economy",
    aliases:["econ"],
    category:"MONEYFORGE",
    description:"Show the economy command guide.",
    usage:"!economy",
    cooldown:1500,
    run:async({api,event,reply})=>
      reply(api,event,
`💰 MONEYFORGE
━━━━━━━━━━━━━━━━━━
💵 !balance
🏦 !deposit / !withdraw
💸 !transfer
🎁 !daily / !weekly / !monthly
💼 !job / !jobs / !work / !salary
📈 !invest
🏦 !loan / !credit
🏢 !business / !property
💎 !networth / !richest
🔐 !vault / !savings
🧾 !tax
🎁 !bonus / !cashdrop
💡 Need details? Use !help <command>`
      )
  }
];
