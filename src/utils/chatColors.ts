// Shared sender colors — must match between ChatThread (message labels) and AnswerOptions (choice labels)
const SENDER_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

export function getSenderColor(sender: string): string {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = (hash << 5) - hash + sender.charCodeAt(i);
    hash |= 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

/** Extract the name from an option string like "Jordan — she organized..." or "Jordan - she organized..." */
export function getOptionSenderName(option: string): string | null {
  const match = option.match(/^([^—\-]+?)\s*[—\-]/);
  return match ? match[1].trim() : null;
}

/** Split option into [namePart, restPart] for display (name in sender color). */
export function splitOptionText(option: string): { namePart: string; restPart: string } {
  const match = option.match(/^([^—\-]+?)\s*[—\-]\s*(.*)$/);
  if (match) return { namePart: match[1].trim(), restPart: match[2].trim() };
  return { namePart: "", restPart: option };
}
