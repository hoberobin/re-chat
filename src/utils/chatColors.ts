// Shared sender colors — must match between ChatThread (message labels) and AnswerOptions (choice labels)
// Darker, more saturated tones for better contrast and accessibility on light backgrounds
const SENDER_COLORS = ["#C24141", "#0D9488", "#2563EB", "#15803D", "#B45309", "#7C3AED"];

/** Order of first appearance of senders in messages. Pass to getSenderColor so each person gets a unique color. */
export function getOrderedSenders(messages: { sender: string }[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const m of messages) {
    if (!seen.has(m.sender)) {
      seen.add(m.sender);
      order.push(m.sender);
    }
  }
  return order;
}

export function getSenderColor(sender: string, orderedSenders?: string[]): string {
  if (orderedSenders?.length) {
    const index = orderedSenders.indexOf(sender);
    if (index !== -1) return SENDER_COLORS[index % SENDER_COLORS.length];
  }
  // Fallback when no ordered list (e.g. CreatePuzzle): hash so same name is consistent
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = (hash << 5) - hash + sender.charCodeAt(i);
    hash |= 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

/** Returns true only if `name` is one of the actual senders in the chat. */
export function isKnownSender(name: string | null, orderedSenders?: string[]): boolean {
  if (!name || !orderedSenders?.length) return false;
  return orderedSenders.includes(name);
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
