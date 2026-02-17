import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPuzzle } from "../api/puzzles";
import type { Puzzle } from "../types/puzzle";
import { Play } from "./Play";

export function EmbedPuzzle() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getPuzzle(id)
      .then((p) => {
        setPuzzle(p ?? null);
        if (!p) setError("Puzzle not found");
      })
      .catch(() => setError("Failed to load puzzle"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Puzzle not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[500px]">
      <Play previewPuzzle={puzzle} />
    </div>
  );
}
