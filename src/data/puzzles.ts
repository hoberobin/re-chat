import type { Difficulty, Puzzle } from "../types/puzzle";

const STORAGE_KEY = "rechat-puzzles";

export const builtinPuzzles: Puzzle[] = [
  {
    id: "1",
    source: "builtin",
    difficulty: "medium",
    types: ["clarification", "emotional"],
    tags: ["agreement", "tension"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "That's not what I meant." },
      { id: "m2", speaker: "B", text: "Then what did you mean?" },
      { id: "m3", speaker: "A", text: "I thought we agreed on this." },
      { id: "m4", speaker: "B", text: "You changed it without telling me." },
    ],
    correctOrder: ["m3", "m4", "m2", "m1"],
    constraints: [
      "Conversation began neutral.",
      "An action caused tension.",
      "Clarification occurred before resolution.",
    ],
  },
  {
    id: "2",
    source: "builtin",
    difficulty: "easy",
    types: ["informational"],
    tags: ["reading", "realization"],
    group: "Informational",
    messages: [
      { id: "m1", speaker: "A", text: "Oh. I didn't see that part." },
      { id: "m2", speaker: "B", text: "It was in the second paragraph." },
      { id: "m3", speaker: "A", text: "I only read the first section." },
      { id: "m4", speaker: "B", text: "That explains it." },
    ],
    correctOrder: ["m3", "m2", "m1", "m4"],
    constraints: [
      "The misunderstanding was informational, not emotional.",
      "Tone remained calm throughout.",
      "Realization occurred before closure.",
    ],
  },
  {
    id: "3",
    source: "builtin",
    difficulty: "medium",
    types: ["assumption", "clarification"],
    tags: ["upset", "defensive"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "You sounded upset." },
      { id: "m2", speaker: "B", text: "I wasn't upset." },
      { id: "m3", speaker: "A", text: "You left early." },
      { id: "m4", speaker: "B", text: "I had another call." },
    ],
    correctOrder: ["m3", "m1", "m2", "m4"],
    constraints: [
      "An assumption was made before clarification.",
      "Tone briefly defensive.",
      "Final message resolved the assumption.",
    ],
  },
  {
    id: "4",
    source: "builtin",
    difficulty: "easy",
    types: ["timing", "workplace"],
    tags: ["deadline", "resolution"],
    group: "Workplace",
    messages: [
      { id: "m1", speaker: "B", text: "It was due yesterday." },
      { id: "m2", speaker: "A", text: "I thought it was today." },
      { id: "m3", speaker: "B", text: "That's why I followed up." },
      { id: "m4", speaker: "A", text: "Okay, I'll send it now." },
    ],
    correctOrder: ["m1", "m2", "m3", "m4"],
    constraints: [
      "Conversation began with correction.",
      "A misunderstanding about timing occurred.",
      "Resolution ended the exchange.",
    ],
  },
  {
    id: "5",
    source: "builtin",
    difficulty: "hard",
    types: ["emotional", "clarification"],
    tags: ["interpretation", "defensiveness"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "That wasn't the intention." },
      { id: "m2", speaker: "B", text: "It came across that way." },
      { id: "m3", speaker: "A", text: "What did I say?" },
      { id: "m4", speaker: "B", text: "You said it was obvious." },
    ],
    correctOrder: ["m4", "m3", "m2", "m1"],
    constraints: [
      "An interpretation triggered defensiveness.",
      "Clarification was requested before denial.",
      "Tone softened by the end.",
    ],
  },
  {
    id: "6",
    source: "builtin",
    difficulty: "easy",
    types: ["informational", "clarification"],
    tags: ["request", "confirmation"],
    group: "Workplace",
    messages: [
      { id: "m1", speaker: "A", text: "Can you send the report?" },
      { id: "m2", speaker: "B", text: "Which one?" },
      { id: "m3", speaker: "A", text: "The Q3 summary." },
      { id: "m4", speaker: "B", text: "Sent." },
    ],
    correctOrder: ["m1", "m2", "m3", "m4"],
    constraints: [
      "A request was made first.",
      "Clarification was needed before action.",
      "Confirmation ended the exchange.",
    ],
  },
  {
    id: "7",
    source: "builtin",
    difficulty: "medium",
    types: ["informational"],
    tags: ["offer", "declined"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "Want to grab dinner tonight?" },
      { id: "m2", speaker: "B", text: "I have a conflict." },
      { id: "m3", speaker: "A", text: "Maybe next week?" },
      { id: "m4", speaker: "B", text: "Sure, that works." },
    ],
    correctOrder: ["m1", "m2", "m3", "m4"],
    constraints: [
      "An offer was made first.",
      "A reason was given for declining.",
      "Alternative was proposed before acceptance.",
    ],
  },
  {
    id: "8",
    source: "builtin",
    difficulty: "medium",
    types: ["emotional", "clarification"],
    tags: ["complaint", "apology"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "You never told me about the change." },
      { id: "m2", speaker: "B", text: "I'm sorry, I should have." },
      { id: "m3", speaker: "A", text: "It caused a lot of extra work." },
      { id: "m4", speaker: "B", text: "I'll loop you in earlier next time." },
    ],
    correctOrder: ["m1", "m2", "m3", "m4"],
    constraints: [
      "Complaint came first.",
      "Apology followed quickly.",
      "Resolution offered at the end.",
    ],
  },
  {
    id: "9",
    source: "builtin",
    difficulty: "hard",
    types: ["emotional", "assumption"],
    tags: ["accusation", "denial", "concession"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "I didn't take it." },
      { id: "m2", speaker: "B", text: "Then where did it go?" },
      { id: "m3", speaker: "A", text: "Maybe I moved it by accident." },
      { id: "m4", speaker: "B", text: "Just let me know when you find it." },
    ],
    correctOrder: ["m2", "m1", "m3", "m4"],
    constraints: [
      "Confusion prompted the first message.",
      "Denial came before concession.",
      "Tone softened by the end.",
    ],
  },
  {
    id: "10",
    source: "builtin",
    difficulty: "hard",
    types: ["emotional", "misunderstanding"],
    tags: ["tone", "escalation", "de-escalation"],
    group: "Personal",
    messages: [
      { id: "m1", speaker: "A", text: "I was just joking." },
      { id: "m2", speaker: "B", text: "It didn't come across that way." },
      { id: "m3", speaker: "A", text: "Why are you being so sensitive?" },
      { id: "m4", speaker: "B", text: "Okay, let's drop it." },
    ],
    correctOrder: ["m3", "m2", "m1", "m4"],
    constraints: [
      "Tone was misread before clarification.",
      "Escalation occurred in the middle.",
      "De-escalation ended the exchange.",
    ],
  },
];

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getAllPuzzles(): Puzzle[] {
  const user = loadUserPuzzles();
  return [...builtinPuzzles, ...user];
}

export function loadUserPuzzles(): Puzzle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserPuzzle(puzzle: Puzzle): void {
  const user = loadUserPuzzles();
  const exists = user.findIndex((p) => p.id === puzzle.id);
  const updated =
    exists >= 0
      ? user.map((p) => (p.id === puzzle.id ? puzzle : p))
      : [...user, puzzle];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function pickRandomPuzzle(filter?: { difficulty?: Difficulty }): Puzzle {
  const all = getAllPuzzles();
  const filtered = filter?.difficulty
    ? all.filter((p) => p.difficulty === filter.difficulty)
    : all;
  const pool = filtered.length > 0 ? filtered : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPuzzleById(id: string): Puzzle | undefined {
  return getAllPuzzles().find((p) => p.id === id);
}
