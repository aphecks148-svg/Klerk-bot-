const U=new Map();
function u(id){if(!U.has(id))U.set(id,{cash:1000000,bank:0,vault:0,savings:0,inv:[],salary:25000,credit:500,loan:0,business:[],stocks:{},crypto:{},properties:[],market:[]});return U.get(id)}
function r(c,s){c.reply(`╭━━ 💰 ECONOMY ━━╮\n${s}\n╰━━━━━━━━━━━━━━╯`)}
function cmd(name,description,fn,aliases=[]){return{name,description,execute:fn,aliases,reaction:"💰"}}
function money(n){return "$"+Number(n||0).toLocaleString()}
const C={};

// ============================================================
// 💰 WALLET / BANK
// ============================================================

C.balance=cmd("balance","View wallet, bank and vault",c=>{
 const x=u(c.event.senderID);r(c,`💵 Wallet: ${money(x.cash)}\n🏦 Bank: ${money(x.bank)}\n🔐 Vault: ${money(x.vault)}\n💎 Savings: ${money(x.savings)}`);
},["bal","b"]);

C.deposit=cmd("deposit","Deposit cash into bank",c=>{
 const x=u(c.event.senderID),n=+(c.args[0]||0);
 if(n<=0||n>x.cash)return r(c,"❌ Invalid amount.");
 x.cash-=n;x.bank+=n;r(c,`🏦 Deposited ${money(n)}.\n💵 Wallet: ${money(x.cash)}`);
});

C.withdraw=cmd("withdraw","Withdraw money from bank",c=>{
 const x=u(c.event.senderID),n=+(c.args[0]||0);
 if(n<=0||n>x.bank)return r(c,"❌ Invalid amount.");
 x.bank-=n;x.cash+=n;r(c,`💵 Withdrawn ${money(n)}.`);
});

C.transfer=cmd("transfer","Transfer game money",c=>r(c,`💸 Transfer request: ${money(+(c.args[0]||0))}\n📌 Mention the player to transfer to.`),["pay"]);
C.give=cmd("give","Give game money to another player",c=>r(c,"💸 Mention the player and amount to send."));
C.daily=cmd("daily","Daily game money reward",c=>{let x=u(c.event.senderID);x.cash+=6000000;r(c,`🎁 DAILY REWARD\n💰 +$6,000,000\n💵 Wallet: ${money(x.cash)}`)});
C.weekly=cmd("weekly","Weekly money reward",c=>{let x=u(c.event.senderID);x.cash+=20000000;r(c,"🎁 WEEKLY REWARD\n💰 +$20,000,000")});
C.monthly=cmd("monthly","Monthly money reward",c=>{let x=u(c.event.senderID);x.cash+=50000000;r(c,"🎁 MONTHLY REWARD\n💰 +$50,000,000")});

C.shop=cmd("shop","Open economy shop",c=>r(c,"🛒 SHOP\n🍎 Food\n🛠️ Tools\n🎒 Items\n💎 Rare items\n🏠 Property items\n🚗 Vehicle items"));
C.inventory=cmd("inventory","View inventory",c=>{let x=u(c.event.senderID);r(c,x.inv.length?x.inv.map((v,i)=>`${i+1}. ${v}`).join("\n"):"🎒 Inventory empty.")},["inv"]);

C.salary=cmd("salary","Collect salary",c=>{let x=u(c.event.senderID);x.cash+=x.salary;r(c,`💼 Salary: ${money(x.salary)}`)});
C.paytaxes=cmd("paytaxes","Pay fictional game taxes",c=>{let x=u(c.event.senderID),n=Math.min(x.cash,100000);x.cash-=n;r(c,`🏛️ Taxes paid: ${money(n)}`)});
C.vault_lock=cmd("vault_lock","Lock your vault",c=>r(c,"🔐 Vault locked. Extra protection enabled."));
C.loan=cmd("loan","View or request game loan",c=>{let x=u(c.event.senderID);r(c,`🏦 Loan balance: ${money(x.loan)}\n💳 Credit score: ${x.credit}`)});
C.credit_score=cmd("credit_score","View credit score",c=>r(c,`💳 Credit Score: ${u(c.event.senderID).credit}`));
C.wallet_upgrade=cmd("wallet_upgrade","Upgrade wallet",c=>r(c,"👛 Wallet capacity upgraded in the game."));
C.invoice=cmd("invoice","Create game invoice",c=>r(c,"🧾 Invoice created."));
C.charity_fund=cmd("charity_fund","Donate fictional game money",c=>r(c,"❤️ Charity contribution recorded."));
C.pawn=cmd("pawn","Pawn an item",c=>r(c,"🏪 Item sent to the fictional pawn system."));
C.gold_bar=cmd("gold_bar","View gold bars",c=>r(c,"🥇 Gold Bar Value: $5,000,000"));
C.audit=cmd("audit","View personal financial audit",c=>{let x=u(c.event.senderID);r(c,`📊 FINANCIAL AUDIT\n💵 Cash ${money(x.cash)}\n🏦 Bank ${money(x.bank)}\n🔐 Vault ${money(x.vault)}\n🏠 Properties ${x.properties.length}`)});
C.subsidies=cmd("subsidies","View city subsidies",c=>r(c,"🏛️ Available fictional business subsidies are shown here."));
C.bankruptcy=cmd("bankruptcy","Fictional bankruptcy system",c=>r(c,"⚖️ Bankruptcy status: Clear."));
C.insurance_buy=cmd("insurance_buy","Buy fictional financial insurance",c=>r(c,"🛡️ Financial insurance activated."));
C.will_testament=cmd("will_testament","Set game inheritance",c=>r(c,"📜 Game testament updated."));
C.offshore_trust=cmd("offshore_trust","Create fictional game trust",c=>r(c,"🏦 Fictional trust account created."));
C.counterfeit=cmd("counterfeit","Fictional counterfeit game mechanic",c=>r(c,"🎭 Counterfeit mission is a fictional game activity only."));
C.laundering=cmd("laundering","Fictional money-laundering game mechanic",c=>r(c,"🌀 Fictional laundering mission activated."));
C.atm_hack=cmd("atm_hack","Fictional ATM mini-game",c=>r(c,"🖥️ ATM mini-game started."));

// ============================================================
// 🏢 BUSINESS
// ============================================================

const biz=[
"business_buy","business_revenue","hire_npc","fire_npc","upgrade_tech","franchise","supply_chain",
"marketing","bribe_official","corporate_raid","shares_issue","real_estate","permit_apply","headquarters",
"union_negotiate","corporate_bonds","merger","vandalize_rival","business_sell","insure_business"
];
biz.forEach(n=>C[n]=cmd(n,"Business system",c=>{
 const x=u(c.event.senderID);
 if(n==="business_buy"){x.business.push(c.args.join("_")||"Starter Business");return r(c,"🏢 Business purchased.")}
 if(n==="business_sell"){x.business.pop();return r(c,"💵 Business sold.")}
 r(c,`🏢 ${n.replace(/_/g," ").toUpperCase()}\n✅ Business action completed.`);
}));

// ============================================================
// 📈 STOCKS / CRYPTO — FICTIONAL GAME MARKET
// ============================================================

const stocks=["vanguard","tesla","apple","google","amazon","meta","nvidia","microsoft","spacex","cyberdyne","starkcorp","wayneent","umbrella","robocorp"];
["stock_buy","stock_sell","stock_portfolio","stock_market","stock_vanguard","stock_tesla","stock_apple","stock_google","stock_amazon","stock_meta","stock_nvidia","stock_microsoft","stock_spacex","stock_cyberdyne","stock_starkcorp","stock_wayneent","stock_umbrella","stock_robocorp","stock_insider","stock_options"].forEach(n=>C[n]=cmd(n,"Fictional stock market",c=>{
 const x=u(c.event.senderID),s=n.replace("stock_","");
 if(n==="stock_market")return r(c,"📈 FICTIONAL STOCK MARKET\n"+stocks.map(a=>`• ${a.toUpperCase()} — $${(100+Math.floor(Math.random()*900)).toLocaleString()}`).join("\n"));
 if(n==="stock_portfolio")return r(c,`📊 Portfolio:\n${Object.keys(x.stocks).length?Object.entries(x.stocks).map(([a,b])=>`${a}: ${b}`).join("\n"):"Empty"}`);
 r(c,`📈 ${s.toUpperCase()}\n🎮 Fictional market action completed.`);
}));

const cryptos=["btc","eth","sol","doge","usdt","citycoin","darkcoin","nft"];
["crypto_buy","crypto_sell","crypto_wallet","crypto_exchange","crypto_btc","crypto_eth","crypto_sol","crypto_doge","crypto_usdt","crypto_citycoin","crypto_darkcoin","crypto_nft","crypto_stake","crypto_rig","crypto_ico","crypto_rugpull","crypto_airdrop","crypto_futures","crypto_whale","crypto_hack"].forEach(n=>C[n]=cmd(n,"Fictional crypto game system",c=>{
 const x=u(c.event.senderID);
 if(n==="crypto_wallet")return r(c,Object.keys(x.crypto).length?Object.entries(x.crypto).map(([a,b])=>`${a}: ${b}`).join("\n"):"🪙 Empty crypto wallet.");
 r(c,`🪙 ${n.replace(/_/g," ").toUpperCase()}\n🎮 Fictional game economy action completed.`);
}));

// ============================================================
// 🏪 MARKET / TRADING
// ============================================================

const market=[
"market","market_sell","market_buy","market_search","market_cancel","market_history","market_watch",
"trade","trade_offer","trade_accept","trade_decline","trade_cancel","auction","auction_create",
"auction_bid","auction_end","auction_history","merchant","blackmarket","price_check"
];
market.forEach(n=>C[n]=cmd(n,"Market and trading system",c=>{
 if(n==="market")return r(c,"🏪 PLAYER MARKET\n📦 Buy • Sell • Search • Trade • Auction");
 if(n==="price_check")return r(c,`💹 Item price: ${money(+(c.args[1]||50000))}`);
 r(c,`🏪 ${n.replace(/_/g," ").toUpperCase()}\n✅ Market action completed.`);
}));

// ============================================================
// 🏠 HOUSING / LIFE
// ============================================================

const homes=[
"home","home_upgrade","home_storage","home_enter","home_exit","room_create","room_upgrade","furniture",
"buy_furniture","place_furniture","remove_furniture","house_party","guest_list","neighbor","neighborhood_chat",
"rent","tenant","landlord","property_market","property_tax","home_security","home_alarm"
];

homes.forEach(n=>C[n]=cmd(n,"Housing and life system",c=>{
 const x=u(c.event.senderID);
 if(n==="home")return r(c,`🏠 YOUR HOME\n🏡 Properties: ${x.properties.length}\n🔐 Security: Active`);
 if(n==="home_upgrade"){x.properties.push("Upgraded Home");return r(c,"🏠 Home upgraded.")}
 if(n==="property_market")return r(c,"🏘️ PROPERTY MARKET\n🏠 Apartment — $2M\n🏡 House — $5M\n🏰 Mansion — $25M");
 r(c,`🏠 ${n.replace(/_/g," ").toUpperCase()}\n✅ Home action completed.`);
}));

// ============================================================
// 📦 EXTRA ECONOMY COMMANDS
// ============================================================

[
"wallet_upgrade","stash","unstash","item_info","item_value","item_history"
].forEach(n=>{
 if(!C[n])C[n]=cmd(n,"Economy utility",c=>r(c,`📦 ${n.replace(/_/g," ")} completed.`));
});

module.exports=C;
