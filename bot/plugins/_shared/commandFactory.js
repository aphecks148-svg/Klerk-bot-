function createCommands(names) {
  if (names.length !== 50) throw new Error(`Plugin must expose 50 commands; received ${names.length}`);
  return names.map((name) => ({
    name,
    aliases: [name.replace(/_/g, "")].filter((alias) => alias !== name),
    description: `${name} • iKON-BOT v5.0 Divine`,
  }));
}

module.exports = { createCommands };