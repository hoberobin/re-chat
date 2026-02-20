import type { Puzzle } from "../types/legacy";
import type { DailyPuzzle, PuzzleResult } from "../types/puzzle";

const API_BASE =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? "" : "http://localhost:3001");

// ---------------------------------------------------------------------------
// Legacy API (reorder puzzle format) — keep as-is for CreatePuzzle / Play
// ---------------------------------------------------------------------------

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

// Legacy daily response shape (old reorder format)
export interface LegacyDailyResponse {
  date: string;
  puzzle: Puzzle;
  initialOrder: string[];
}

/** Fetches the daily puzzle in the legacy reorder format. Used by Landing (classic) and Practice. */
export async function getDailyPuzzleLegacy(
  date?: string
): Promise<LegacyDailyResponse> {
  const url = date
    ? `${API_BASE}/api/daily?date=${encodeURIComponent(date)}`
    : `${API_BASE}/api/daily`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error ?? `Failed to fetch daily puzzle (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// New mystery puzzle API
// ---------------------------------------------------------------------------

/** Returns a stable session ID stored in localStorage (generated once per browser). */
export function getSessionId(): string {
  const key = "rechat-session-id";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
    return id;
  } catch {
    // localStorage unavailable — return a temporary ID
    return Math.random().toString(36).slice(2);
  }
}

/** Fetches today's daily mystery puzzle (without correct_option_index or explanation). */
export async function getDailyPuzzle(): Promise<DailyPuzzle> {
  const res = await fetch(`${API_BASE}/api/daily`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error ?? `Failed to fetch daily puzzle (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

/** Checks whether this session has already played the puzzle for the given date. */
export async function checkAlreadyPlayed(date: string): Promise<{
  played: boolean;
  guessed_index: number | null;
  correct: boolean | null;
}> {
  const sessionId = getSessionId();
  const res = await fetch(
    `${API_BASE}/api/daily/result/${encodeURIComponent(date)}?session_id=${encodeURIComponent(sessionId)}`
  );
  if (!res.ok) return { played: false, guessed_index: null, correct: null };
  return res.json();
}

/** Submits the player's answer and returns the full result including explanation. */
export async function submitAnswer(
  puzzle_date: string,
  guessed_index: number
): Promise<PuzzleResult> {
  const session_id = getSessionId();
  const res = await fetch(`${API_BASE}/api/daily/result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ puzzle_date, guessed_index, session_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Failed to submit answer (${res.status})`);
  }
  return res.json();
}
