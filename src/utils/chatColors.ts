// Shared sender colors — must match between ChatThread (message labels) and AnswerOptions (choice labels)
// Darker, more saturated tones for better contrast and accessibility on light backgrounds
const SENDER_COLORS = ["#C24141", "#0D9488", "#2563EB", "#15803D"];

export function getSenderColor(sender: string): string {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = (hash << 5) - hash + sender.charCodeAt(i);
    hash |= 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

/** Extract the name from an option string like "Jordan — she organized..." or plain "Jordan". */
export function getOptionSenderName(option: string): string | null {
  const match = option.match(/^([^—\-]+?)\s*[—\-]/);
  if (match) return match[1].trim();
  const trimmed = option.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Split option into [namePart, restPart] for display (name in sender color). */
export function splitOptionText(option: string): { namePart: string; restPart: string } {
  const match = option.match(/^([^—\-]+?)\s*[—\-]\s*(.*)$/);
  if (match) return { namePart: match[1].trim(), restPart: match[2].trim() };
  return { namePart: "", restPart: option };
}
