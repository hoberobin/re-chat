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
