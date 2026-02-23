import type { DailyPuzzle, DailyPuzzleCreatePayload, PuzzleResult } from "../types/puzzle";

const API_BASE =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? "" : "http://localhost:3001");

// ---------------------------------------------------------------------------
// Session ID
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
    return Math.random().toString(36).slice(2);
  }
}

// ---------------------------------------------------------------------------
// Daily puzzle (mystery format)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Admin / dev-only puzzle management
// ---------------------------------------------------------------------------

/** Creates a daily puzzle (dev only). Server rejects in production. */
export async function createDailyPuzzle(
  payload: DailyPuzzleCreatePayload
): Promise<{ id: string; date: string }> {
  const res = await fetch(`${API_BASE}/api/daily/puzzles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Failed to create puzzle (${res.status})`);
  }
  return res.json();
}

export interface DailyPuzzleListItem {
  id: string;
  date: string;
  title: string;
}

/** Lists all daily puzzles (dev only). */
export async function listDailyPuzzles(): Promise<DailyPuzzleListItem[]> {
  const res = await fetch(`${API_BASE}/api/daily/puzzles`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Failed to list puzzles (${res.status})`);
  }
  return res.json();
}

/** Fetches one daily puzzle for editing (dev only). Full payload including correct_option_index and explanation. */
export async function getDailyPuzzleForEdit(id: string): Promise<DailyPuzzleCreatePayload> {
  const res = await fetch(`${API_BASE}/api/daily/puzzles/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Failed to fetch puzzle (${res.status})`);
  }
  return res.json();
}

/** Updates a daily puzzle (dev only). */
export async function updateDailyPuzzle(
  id: string,
  payload: DailyPuzzleCreatePayload
): Promise<{ id: string; date: string }> {
  const res = await fetch(`${API_BASE}/api/daily/puzzles/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Failed to update puzzle (${res.status})`);
  }
  return res.json();
}

/** Deletes a daily puzzle (dev only). */
export async function deleteDailyPuzzle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/daily/puzzles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Failed to delete puzzle (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// AI puzzle generation (dev or admin-secret)
// ---------------------------------------------------------------------------

/** Generates a puzzle from a topic using OpenAI. Returns payload without id (client merges into draft). */
export async function generatePuzzle(topic: string): Promise<Omit<DailyPuzzleCreatePayload, "id">> {
  const res = await fetch(`${API_BASE}/api/generate-puzzle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: topic.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Generation failed (${res.status})`);
  }
  return res.json();
}
