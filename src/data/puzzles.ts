import type { Puzzle } from "../types/puzzle";

/** Friendly learning example for the homepage */
export const learningPuzzle: Puzzle = {
  id: "learning",
  messages: [
    { id: "m1", speaker: "A", text: "Hey, want to grab coffee later?" },
    { id: "m2", speaker: "B", text: "Sure! When works for you?" },
    { id: "m3", speaker: "A", text: "How about 3pm?" },
    { id: "m4", speaker: "B", text: "Perfect, see you then ☕" },
  ],
  correctOrder: ["m1", "m2", "m3", "m4"],
  constraints: [
    "One person suggests meeting up first.",
    "The other asks for a time.",
    "They agree on a plan.",
  ],
};

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
