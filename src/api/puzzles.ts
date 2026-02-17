import type { Puzzle } from "../types/puzzle";

const API_BASE =
  import.meta.env.VITE_API_URL ?? (typeof window !== "undefined" ? "" : "http://localhost:3001");

export interface CreatePuzzlePayload {
  messages: Puzzle["messages"];
  correctOrder: string[];
  constraints: string[];
}

export async function createPuzzle(
  payload: CreatePuzzlePayload
): Promise<{ id: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/puzzles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error ?? `Failed to create puzzle (${res.status})`;
      throw new Error(msg);
    }
    return res.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      e instanceof TypeError ||
      msg.toLowerCase().includes("failed to fetch") ||
      msg.toLowerCase().includes("network")
    ) {
      throw new Error(
        "Can't reach the server. Run 'npm run dev:all' to start both the app and API (or run 'npm run server' in a separate terminal)."
      );
    }
    throw e;
  }
}

export async function getPuzzle(id: string): Promise<Puzzle | null> {
  const res = await fetch(`${API_BASE}/api/puzzles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch puzzle (${res.status})`);
  }
  return res.json();
}
