// Legacy types for the original re:chat reorder puzzle format.
// Kept so CreatePuzzle, Play, and PuzzleBySlug pages continue to compile.

export interface Message {
  id: string;
  speaker: string;
  text: string;
}

export interface Puzzle {
  id: string;
  messages: Message[];
  correctOrder: string[];
  constraints: string[];
}
