import { useState, type ReactNode } from "react";
import { builtinPuzzles } from "../data/puzzles";
import type { Difficulty } from "../types/puzzle";
import type { DevToolsContextValue } from "../context/DevToolsContext";

const CODE = "strawberry";
const STORAGE_KEY = "rechat-access";

export interface UseDevToolsReturn {
  unlocked: boolean;
  checkCode: (input: string) => boolean;
  DevPanel: ReactNode;
  devContextValue: DevToolsContextValue;
}

export function useDevTools(): UseDevToolsReturn {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  const [seedPuzzleId, setSeedPuzzleId] = useState<string>("");
  const [forceRevealOrder, setForceRevealOrder] = useState(false);
  const [forceSkipWin, setForceSkipWin] = useState(false);
  const [forceShowHints, setForceShowHints] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");

  const checkCode = (input: string): boolean => {
    if (input.trim().toLowerCase() === CODE) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const filteredPuzzles = difficultyFilter
    ? builtinPuzzles.filter((p) => p.difficulty === difficultyFilter)
    : builtinPuzzles;

  const devContextValue: DevToolsContextValue = unlocked
    ? {
        seedPuzzleId: seedPuzzleId || undefined,
        forceRevealOrder,
        forceSkipWin,
        forceShowHints,
      }
    : {
        forceRevealOrder: false,
        forceSkipWin: false,
        forceShowHints: false,
      };

  const DevPanel = unlocked ? (
    <div
      className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-xl shadow-lg text-sm"
      style={{ maxWidth: "320px" }}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-2 text-left font-medium hover:bg-gray-800 rounded-t-xl flex items-center justify-between"
      >
        Dev Panel
        <span className="text-gray-400">{collapsed ? "\u25BC" : "\u25B2"}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3 border-t border-gray-700">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Puzzle (filter by difficulty)
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as Difficulty | "")
              }
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm mb-2"
            >
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={seedPuzzleId}
              onChange={(e) => setSeedPuzzleId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="">Random</option>
              {filteredPuzzles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setForceRevealOrder((v) => !v)}
              className={`px-3 py-1 rounded text-xs ${
                forceRevealOrder ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              View correct order
            </button>
            <button
              type="button"
              onClick={() => setForceSkipWin((v) => !v)}
              className={`px-3 py-1 rounded text-xs ${
                forceSkipWin ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Skip to win
            </button>
            <button
              type="button"
              onClick={() => setForceShowHints((v) => !v)}
              className={`px-3 py-1 rounded text-xs ${
                forceShowHints ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Show hints
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return {
    unlocked,
    checkCode,
    DevPanel,
    devContextValue,
  };
}
