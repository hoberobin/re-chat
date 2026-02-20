// New types for the redacted mystery puzzle format.

export interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  is_redacted: boolean;
  timestamp: string;
  show_timestamp: boolean;
}

export interface DailyPuzzle {
  id: string;
  date: string;
  title: string;
  premise: string;
  chat_name: string;
  is_group: boolean;
  messages: ChatMessage[];
  options: string[];
  stats?: {
    total_plays: number;
    correct_plays: number;
  };
}

export interface PuzzleResult {
  correct: boolean;
  correct_option_index: number;
  explanation: string;
  stats: {
    total_plays: number;
    correct_plays: number;
  };
}

/** Payload for creating a daily puzzle (dev mode). Includes answer and explanation. */
export interface DailyPuzzleCreatePayload {
  id?: string;
  date: string;
  title: string;
  premise: string;
  chat_name: string;
  is_group: boolean;
  messages: ChatMessage[];
  options: string[];
  correct_option_index: number;
  explanation: string;
}

// Re-export legacy types so existing imports from this file still resolve.
export type { Message, Puzzle } from "./legacy";
