/**
 * Creates a clean, emoji-rich chat-friendly box for Messenger replies.
 * Replaces the old ASCII-art boxes (╭─╮│╰) with simple, readable formatting.
 */
function box(title, lines = []) {
  const content = [title, ...(Array.isArray(lines) ? lines : [lines])];
  return content.map((line, i) => i === 0 ? `✨ ${line} ✨` : `  ${line}`).join("\n");
}

/**
 * Legacy LINE constant kept for backward compatibility.
 */
const LINE = "━━━━━━━━━━━━━━━━━━";

module.exports = { box, LINE };
