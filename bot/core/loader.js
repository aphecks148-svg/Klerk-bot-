const fs = require("fs");
const path = require("path");
const { safeRequire } = require("./safeRequire");

const registry = { commands: new Map(), categories: [], totalCommands: 0, disabled: new Set() };

function loadPlugin(pluginDir) {
  const manifestResult = safeRequire(path.join(pluginDir, "manifest.json"), path.basename(pluginDir));
  const pluginResult = safeRequire(path.join(pluginDir, "index.js"), path.basename(pluginDir));
  if (!manifestResult.ok || !pluginResult.ok) return null;
  const manifest = manifestResult.value;
  const plugin = pluginResult.value;
  const commands = Array.isArray(plugin.commands) ? plugin.commands : [];
  const category = {
    key: manifest.key || path.basename(pluginDir),
    label: manifest.label || path.basename(pluginDir),
    emoji: manifest.emoji || "🧩",
    commands,
  };
  registry.categories.push(category);
  for (const command of commands) {
    const names = [command.name, ...(command.aliases || [])].filter(Boolean);
    for (const name of names) registry.commands.set(name.toLowerCase(), { ...command, category: category.key });
  }
  registry.totalCommands += commands.length;
  console.log(`[ONLINE] ${category.emoji} ${category.label} — ${commands.length} commands`);
  return category;
}

function loadPlugins(pluginsDir) {
  registry.commands.clear();
  registry.categories.length = 0;
  registry.totalCommands = 0;
  registry.disabled.clear();
  if (!fs.existsSync(pluginsDir)) return registry;
  for (const entry of fs.readdirSync(pluginsDir).sort()) {
    const pluginDir = path.join(pluginsDir, entry);
    if (fs.statSync(pluginDir).isDirectory()) {
      if (!fs.existsSync(path.join(pluginDir, "manifest.json")) || !fs.existsSync(path.join(pluginDir, "index.js"))) continue;
      try { loadPlugin(pluginDir); } catch (error) {
        console.error(`[FAILED] ${entry}: ${error.message}`);
      }
    }
  }
  return registry;
}

function reloadPlugin(pluginsDir, categoryName) {
  const pluginDir = path.join(pluginsDir, categoryName);
  for (const file of [path.join(pluginDir, "index.js"), path.join(pluginDir, "manifest.json")]) {
    delete require.cache[require.resolve(file)];
  }
  const old = registry.categories.findIndex((item) => item.key === categoryName);
  if (old >= 0) {
    const removed = registry.categories.splice(old, 1)[0];
    for (const command of removed.commands) registry.commands.delete(command.name);
    registry.totalCommands -= removed.commands.length;
  }
  return loadPlugin(pluginDir);
}

function getRegistry() {
  return registry;
}

function setPluginEnabled(category, enabled) {
  if (enabled) registry.disabled.delete(category);
  else registry.disabled.add(category);
  return !registry.disabled.has(category);
}

function isPluginEnabled(category) {
  return !registry.disabled.has(category);
}

module.exports = { loadPlugins, reloadPlugin, getRegistry, setPluginEnabled, isPluginEnabled };