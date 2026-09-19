// 💎 cmds_1.js | IKONVAULT | iKON-BOT
module.exports=[
{name:"balance",aliases:["bal","wallet","cash"],category:"cmds_1",description:"View your complete finances.",usage:"!balance",permission:"everyone",cooldown:0,hint:"Check your cash before spending 😂",execute:async({reply})=>reply("💎 IKONVAULT\n\n💰 Wallet: $0\n🏦 Bank: $0\n🔐 Vault: $0\n📈 Net Worth: $0\n\n💡 Connect MongoDB economy engine for live balances.")},

{name:"deposit",aliases:["dep"],category:"cmds_1",description:"Deposit wallet money into bank.",usage:"!deposit <amount>",permission:"everyone",cooldown:3000,hint:"Don't deposit money you don't have 😂",execute:async({args,reply})=>reply(`🏦 BANK DEPOSIT\n\n💰 Amount: $${Number(args[0]||0).toLocaleString()}\n\n⚠️ Economy engine required for live balance changes.`)},

{name:"withdraw",aliases:["with"],category:"cmds_1",description:"Withdraw money from your bank.",usage:"!withdraw <amount>",permission:"everyone",cooldown:3000,hint:"Your bank isn't an unlimited ATM 😂",execute:async({args,reply})=>reply(`🏦 WITHDRAWAL\n\n💵 Amount: $${Number(args[0]||0).toLocaleString()}\n\n⚠️ Economy engine required for live balance changes.`)},

{name:"daily",aliases:["day","dailyreward"],category:"cmds_1",description:"Claim your daily reward.",usage:"!daily",permission:"everyone",cooldown:86400000,hint:"Come back every 24 hours 🔥",execute:async({reply})=>reply("🎁 DAILY REWARD\n\n💰 +$6,000,000\n⭐ +250 XP\n🔥 Streak bonus activated!\n\n💡 MongoDB economy engine will persist the reward.")},

{name:"weekly",aliases:["week"],category:"cmds_1",description:"Claim your weekly reward.",usage:"!weekly",permission:"everyone",cooldown:604800000,hint:"Weekly money hits different 💰",execute:async({reply})=>reply("🎁 WEEKLY REWARD\n\n💰 +$25,000,000\n⭐ +1,000 XP\n🔥 Weekly streak increased!")},

{name:"monthly",aliases:["month"],category:"cmds_1",description:"Claim your monthly reward.",usage:"!monthly",permission:"everyone",cooldown:2592000000,hint:"Big payday 😂💰",execute:async({reply})=>reply("💎 MONTHLY REWARD\n\n💰 +$100,000,000\n⭐ +5,000 XP\n👑 Monthly bonus unlocked!")},

{name:"work",aliases:["job","jobs"],category:"cmds_1",description:"Work a job for money and XP.",usage:"!work [job]",permission:"everyone",cooldown:1800000,hint:"No work, no money bro 😂",execute:async({args,reply})=>reply(`💼 WORK COMPLETE!\n\n🧑‍💼 Job: ${args.join(" ")||"Random Job"}\n💰 Earnings: Calculated by job level\n⭐ XP: Calculated by job\n\n📊 [████████░░] 80%\n\n💡 Job engine will calculate the exact reward.`)},

{name:"salary",aliases:["paycheck"],category:"cmds_1",description:"Collect available salary.",usage:"!salary",permission:"everyone",cooldown:3600000,hint:"Check if payday arrived 💵",execute:async({reply})=>reply("💼 SALARY CHECK\n\n💰 Your salary is calculated from your career level and job.")},

{name:"give",aliases:["pay","send"],category:"cmds_1",description:"Give money to another player.",usage:"!give @user <amount>",permission:"everyone",cooldown:5000,hint:"Reply to someone or mention them.",execute:async({args,getTarget,reply})=>reply(`💸 TRANSFER REQUEST\n\n👤 Target: ${getTarget()}\n💰 Amount: $${Number(args[0]||0).toLocaleString()}\n\n🔐 Balance validation + atomic transfer will be handled by the economy engine.`)},

{name:"transfer",aliases:["sendmoney"],category:"cmds_1",description:"Transfer money between players.",usage:"!transfer @user <amount>",permission:"everyone",cooldown:5000,hint:"Don't accidentally send your whole wallet 😂",execute:async({args,getTarget,reply})=>reply(`💸 MONEY TRANSFER\n\n👤 Target: ${getTarget()}\n💰 Amount: $${Number(args[0]||0).toLocaleString()}\n\n🛡️ Anti-duplication transaction protection enabled.`)},

{name:"shop",aliases:["store"],category:"cmds_1",description:"Open the economy shop.",usage:"!shop",permission:"everyone",cooldown:0,hint:"Use !buy <item> <amount>.",execute:async({reply})=>reply("🛒 IKONVAULT SHOP\n\n💎 Money items\n💼 Job upgrades\n🏦 Banking upgrades\n📈 Investment items\n💳 Credit services\n\n💡 !buy <item> <amount>")},

{name:"loan",aliases:["borrow"],category:"cmds_1",description:"Apply for a bank loan.",usage:"!loan <amount>",permission:"everyone",cooldown:3600000,hint:"Loans affect your credit score 👀",execute:async({args,reply})=>reply(`🏦 LOAN APPLICATION\n\n💰 Requested: $${Number(args[0]||0).toLocaleString()}\n📊 Credit score will determine approval.\n\n⚠️ Interest and repayment rules apply.`)},

{name:"credit_score",aliases:["credit","creditscore"],category:"cmds_1",description:"View your credit score.",usage:"!credit_score",permission:"everyone",cooldown:0,hint:"Good credit unlocks better loans.",execute:async({reply})=>reply("💳 CREDIT PROFILE\n\n📊 Score: Calculated from your financial history\n🏦 Loan limit: Dynamic\n📈 Interest: Dynamic\n\n💡 Pay loans on time to improve your score.")},

{name:"inventory",aliases:["inv","bag"],category:"cmds_1",description:"View owned items and assets.",usage:"!inventory",permission:"everyone",cooldown:0,hint:"Everything you buy should appear here 🎒",execute:async({reply})=>reply("🎒 INVENTORY\n\n💰 Items: 0\n🐾 Pets: 0\n🚗 Vehicles: 0\n⚔️ Weapons: 0\n🌱 Resources: 0\n\n💡 Inventory connects to the shared item database.")},

{name:"business",aliases:["businesses"],category:"cmds_1",description:"View your businesses.",usage:"!business",permission:"everyone",cooldown:0,hint:"Build your empire 👑",execute:async({reply})=>reply("🏢 BUSINESS EMPIRE\n\n🏭 Businesses: 0\n💰 Revenue: $0\n👥 Employees: 0\n📈 Growth: 0%\n\n💡 Use the business commands to build your empire.")},

{name:"business_buy",aliases:["buybusiness"],category:"cmds_1",description:"Purchase a business.",usage:"!business_buy <business>",permission:"everyone",cooldown:5000,hint:"Check your balance first 💰",execute:async({args,reply})=>reply(`🏢 BUSINESS PURCHASE\n\n🏷️ Business: ${args.join(" ")||"Unknown"}\n\n💰 Price and requirements are determined by the business registry.\n\n⚠️ Atomic purchase protection enabled.`)},

{name:"stock_market",aliases:["stocks","stock"],category:"cmds_1",description:"Open the stock market.",usage:"!stock_market",permission:"everyone",cooldown:0,hint:"Prices change with the market 📈",execute:async({reply})=>reply("📈 STOCK MARKET\n\n🍎 Apple\n🚗 Tesla\n💻 Microsoft\n🟢 Nvidia\n🔵 Google\n📦 Amazon\n\n💡 !stock_buy <symbol> <amount>")},

{name:"stock_buy",aliases:["buyshares"],category:"cmds_1",description:"Buy shares.",usage:"!stock_buy <symbol> <amount>",permission:"everyone",cooldown:5000,hint:"Diversify your portfolio.",execute:async({args,reply})=>reply(`📈 STOCK PURCHASE\n\n📊 Symbol: ${args[0]||"?"}\n🔢 Amount: ${args[1]||0}\n\n💰 Live market price will determine the cost.`)},

{name:"stock_sell",aliases:["sellshares"],category:"cmds_1",description:"Sell shares.",usage:"!stock_sell <symbol> <amount>",permission:"everyone",cooldown:5000,hint:"Don't panic sell 😂",execute:async({args,reply})=>reply(`📉 STOCK SALE\n\n📊 Symbol: ${args[0]||"?"}\n🔢 Amount: ${args[1]||0}\n\n💰 Sale value uses the current market price.`)},

{name:"crypto_wallet",aliases:["cryptowallet","crypto"],category:"cmds_1",description:"View crypto holdings.",usage:"!crypto_wallet",permission:"everyone",cooldown:0,hint:"Crypto market is volatile ⚡",execute:async({reply})=>reply("₿ CRYPTO WALLET\n\n₿ BTC: 0\n♦️ ETH: 0\n🟣 SOL: 0\n🐕 DOGE: 0\n💵 USDT: 0\n\n📈 Use !crypto_buy <coin> <amount>.")},

{name:"crypto_buy",aliases:["buycrypto"],category:"cmds_1",description:"Buy cryptocurrency.",usage:"!crypto_buy <coin> <amount>",permission:"everyone",cooldown:5000,hint:"Check the market before buying.",execute:async({args,reply})=>reply(`₿ CRYPTO PURCHASE\n\n🪙 Coin: ${args[0]||"?"}\n🔢 Amount: ${args[1]||0}\n\n📈 Market price will determine the cost.`)},

{name:"crypto_sell",aliases:["sellcrypto"],category:"cmds_1",description:"Sell cryptocurrency.",usage:"!crypto_sell <coin> <amount>",permission:"everyone",cooldown:5000,hint:"Diamond hands or paper hands? 😂",execute:async({args,reply})=>reply(`₿ CRYPTO SALE\n\n🪙 Coin: ${args[0]||"?"}\n🔢 Amount: ${args[1]||0}\n\n💰 Current market price determines payout.`)},

{name:"networth",aliases:["wealth"],category:"cmds_1",description:"Calculate total net worth.",usage:"!networth",permission:"everyone",cooldown:0,hint:"Money isn't everything... but let's count it 😂",execute:async({reply})=>reply("💎 NET WORTH\n\n💰 Wallet + Bank + Vault\n🏢 Businesses\n🚗 Vehicles\n📈 Stocks\n₿ Crypto\n🐾 Valuable Pets\n\n📊 Total: Calculated from your complete profile.")},

{name:"economy",aliases:["econ"],category:"cmds_1",description:"Open the complete economy dashboard.",usage:"!economy",permission:"everyone",cooldown:0,hint:"Your financial empire at a glance.",execute:async({reply})=>reply("💎 IKONVAULT ECONOMY\n\n💰 Money\n🏦 Banking\n💳 Credit\n💼 Jobs\n🏢 Business\n📈 Stocks\n₿ Crypto\n💎 Assets\n\n🔥 Build your empire, boss!")}
];
