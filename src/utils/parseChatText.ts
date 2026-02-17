export interface ParsedMessage {
  speaker: string;
  text: string;
}

/**
 * Parse raw text (from paste or OCR) into messages.
 * Handles: Name: message, Name - message, timestamps, alternating lines.
 * OCR-friendly: skips timestamp-only lines, normalizes whitespace, handles "You"/contact names.
 */
export function parseChatText(raw: string): ParsedMessage[] {
  // Preprocess: normalize whitespace, split into lines
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Skip lines that are only timestamps (common OCR noise)
  const isTimestampOnly = (s: string) =>
    /^\d{1,2}:\d{2}(?:\s*[AP]M)?$/i.test(s) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s) ||
    /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d+/i.test(s);

  const result: ParsedMessage[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip timestamp-only lines (common in chat OCR)
    if (isTimestampOnly(line)) continue;

    // Pattern 1: "Speaker: message" (colon after name)
    const colonMatch = line.match(/^([^:]{1,30}):\s*(.+)$/);
    if (colonMatch) {
      const [, speaker, text] = colonMatch;
      const s = speaker.trim();
      const t = text.trim();
      if (t && s.length > 0) {
        const speakerNorm = /^(you|me|i)$/i.test(s) ? "A" : s.slice(0, 20);
        result.push({ speaker: speakerNorm, text: t });
      }
      continue;
    }

    // Pattern 2: "Speaker - message" or "Speaker — message"
    const dashMatch = line.match(/^([^-—]{1,30})\s*[-—]\s*(.+)$/);
    if (dashMatch) {
      const [, speaker, text] = dashMatch;
      const t = text?.trim();
      if (t) {
        const s = speaker.trim();
        const speakerNorm = /^(you|me|i)$/i.test(s) ? "A" : s.slice(0, 20);
        result.push({ speaker: speakerNorm, text: t });
      }
      continue;
    }

    // Pattern 3: [10:30] or [10:30 AM] at start – rest is message
    const bracketTime = line.match(/^\[\d{1,2}:\d{2}(?:\s*[AP]M)?\]\s*(.+)$/i);
    if (bracketTime) {
      const text = bracketTime[1].trim();
      if (text) {
        const speaker = result.length % 2 === 0 ? "A" : "B";
        result.push({ speaker, text });
      }
      continue;
    }

    // Pattern 4: "10:30 AM" at start (iMessage/WhatsApp style)
    const leadTime = line.match(/^\d{1,2}:\d{2}(?:\s*[AP]M)?\s+(.+)$/i);
    if (leadTime) {
      const text = leadTime[1].trim();
      if (text) {
        const speaker = result.length % 2 === 0 ? "A" : "B";
        result.push({ speaker, text });
      }
      continue;
    }

    // Pattern 5: Alternating lines – no clear label
    const speaker = result.length % 2 === 0 ? "A" : "B";
    result.push({ speaker, text: line });
  }

  return result;
}
