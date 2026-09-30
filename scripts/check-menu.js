const menu = require("../bot/utils/menuFormatter");

console.log("=== bare .menu (page 1) ===");
console.log(menu.renderPage(1));
console.log("\n=== .menu ⑭ (page 14, first 12 lines) ===");
console.log(menu.renderPage(14).split("\n").slice(0, 12).join("\n"));
console.log("\n=== .menu (no arg → index) ===");
console.log(menu.renderIndex().split("\n").slice(0, 8).join("\n"));
console.log("\n=== parsing ===");
for (const raw of [undefined, "", "3", "③", "menu7", "menu ⑩", "99", "banana"]) {
  console.log(JSON.stringify(raw), "→", JSON.stringify(menu.parsePage(raw)));
}
console.log("pages:", menu.getPages().length);
console.log("no box chars leaked:", !/╭|│|╰|─{3,}/.test(menu.renderPage(1) + menu.renderIndex()));
console.log("command counts per page:", menu.getPages().map((p) => p.commands.length).join(","));
console.log("total bullets:", menu.getPages().reduce((n, p) => n + p.commands.length, 0));
