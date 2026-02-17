import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPuzzle } from "../api/puzzles";
import type { Puzzle } from "../types/puzzle";
import { Play } from "./Play";

interface PuzzleBySlugProps {
  embed?: boolean;
}

export function PuzzleBySlug({ embed = false }: PuzzleBySlugProps) {
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
      <div className={`w-full flex items-center justify-center ${embed ? "min-h-[400px]" : "min-h-screen"}`}>
        <p className={`text-gray-500 ${embed ? "text-sm" : ""}`}>Loading puzzle…</p>
      </div>
    );
  }

  if (error || !puzzle) {
    if (embed) {
      return (
        <div className="w-full min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Puzzle not found.</p>
        </div>
      );
    }
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600">Puzzle not found.</p>
        <Link to="/" className="text-gray-600 hover:text-gray-900 underline">
          Go home
        </Link>
        <Link
          to="/create"
          className="min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800"
        >
          Create your own
        </Link>
      </div>
    );
  }

  if (embed) {
    return (
      <div className="min-h-[500px]">
        <Play previewPuzzle={puzzle} />
      </div>
    );
  }

  return <Play previewPuzzle={puzzle} />;
}
