export interface Message {
  id: string;
  speaker: string;
  text: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export type PuzzleType =
  | "misunderstanding"
  | "emotional"
  | "informational"
  | "workplace"
  | "timing"
  | "assumption"
  | "clarification"
  | "other";

export interface Puzzle {
  id: string;
  messages: Message[];
  correctOrder: string[];
  constraints: string[];
  difficulty?: Difficulty;
  types?: PuzzleType[];
  tags?: string[];
  group?: string;
  source?: "builtin" | "user";
  createdAt?: number;
}
