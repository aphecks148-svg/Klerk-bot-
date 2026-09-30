function safeRequire(modulePath, label = modulePath) {
  try {
    return { ok: true, value: require(modulePath) };
  } catch (error) {
    console.error(`[FAILED] ${label}: ${error.message}`);
    return { ok: false, error };
  }
}

module.exports = { safeRequire };