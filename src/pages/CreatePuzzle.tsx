import { useState } from "react";
import { Link } from "react-router-dom";
import type { Message, Puzzle, Difficulty, PuzzleType } from "../types/puzzle";
import {
  builtinPuzzles,
  saveUserPuzzle,
} from "../data/puzzles";
import { Play } from "./Play";

const PUZZLE_TYPES: PuzzleType[] = [
  "misunderstanding",
  "emotional",
  "informational",
  "workplace",
  "timing",
  "assumption",
  "clarification",
  "other",
];

function generateId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const blankMessage = (i: number): Message => ({
  id: `m${i + 1}`,
  speaker: i % 2 === 0 ? "A" : "B",
  text: "",
});

export function CreatePuzzle() {
  const [puzzleId, setPuzzleId] = useState(() => generateId());
  const [messages, setMessages] = useState<Message[]>([
    blankMessage(0),
    blankMessage(1),
    blankMessage(2),
    blankMessage(3),
  ]);
  const [correctOrder, setCorrectOrder] = useState<string[]>(["m1", "m2", "m3", "m4"]);
  const [constraints, setConstraints] = useState<string[]>(["", "", ""]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [types, setTypes] = useState<PuzzleType[]>([]);
  const [tags, setTags] = useState("");
  const [group, setGroup] = useState("");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportData, setExportData] = useState("");

  const updateMessage = (index: number, field: keyof Message, value: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addMessage = () => {
    const n = messages.length + 1;
    setMessages((prev) => [...prev, blankMessage(prev.length)]);
    setCorrectOrder((prev) => [...prev, `m${n}`]);
  };

  const removeMessage = (index: number) => {
    if (messages.length <= 2) return;
    const id = messages[index].id;
    setMessages((prev) => prev.filter((_, i) => i !== index));
    setCorrectOrder((prev) => prev.filter((x) => x !== id));
  };

  const moveInOrder = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= correctOrder.length) return;
    setCorrectOrder((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const updateConstraint = (index: number, value: string) => {
    setConstraints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addConstraint = () => {
    setConstraints((prev) => [...prev, ""]);
  };

  const removeConstraint = (index: number) => {
    if (constraints.length <= 1) return;
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  };

  const puzzle: Puzzle = {
    id: puzzleId,
    messages,
    correctOrder,
    constraints: constraints.filter(Boolean),
    difficulty,
    types: types.length > 0 ? types : undefined,
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    group: group || undefined,
    source: "user",
    createdAt: Date.now(),
  };

  const handleSave = () => {
    saveUserPuzzle(puzzle);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    setExportData(JSON.stringify(puzzle, null, 2));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(exportData) as Puzzle;
      if (parsed.messages && parsed.correctOrder && parsed.constraints) {
        setPuzzleId(parsed.id ?? generateId());
        setMessages(parsed.messages);
        setCorrectOrder(parsed.correctOrder);
        setConstraints(
          parsed.constraints.length > 0 ? parsed.constraints : [""]
        );
        setDifficulty(parsed.difficulty ?? "medium");
        setTypes(parsed.types ?? []);
        setTags((parsed.tags ?? []).join(", "));
        setGroup(parsed.group ?? "");
      }
    } catch {
      alert("Invalid JSON");
    }
  };

  const loadTemplate = (p: Puzzle) => {
    setPuzzleId(p.id ?? generateId());
    setMessages(p.messages);
    setCorrectOrder(p.correctOrder);
    setConstraints(
      p.constraints.length > 0 ? p.constraints : ["", "", ""]
    );
    setDifficulty(p.difficulty ?? "medium");
    setTypes(p.types ?? []);
    setTags((p.tags ?? []).join(", "));
    setGroup(p.group ?? "");
  };

  if (preview) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setPreview(false)}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          Back to creator
        </button>
        <Play previewPuzzle={puzzle} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-gray-900">Create Puzzle</h1>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to play
        </Link>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Messages</h2>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className="flex gap-2 items-center"
            >
              <select
                value={msg.speaker}
                onChange={(e) => updateMessage(i, "speaker", e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm w-20"
              >
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
              <input
                type="text"
                value={msg.text}
                onChange={(e) => updateMessage(i, "text", e.target.value)}
                placeholder="Message text"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeMessage(i)}
                disabled={messages.length <= 2}
                className="text-red-600 hover:text-red-800 disabled:opacity-30 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMessage}
          className="mt-2 text-sm text-gray-600 hover:text-gray-900"
        >
          + Add message
        </button>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          Correct order (drag to reorder)
        </h2>
        <div className="space-y-2">
          {correctOrder.map((id, i) => {
            const msg = messages.find((m) => m.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                <span className="flex-1 text-sm">
                  {msg?.text || "(empty)"} — {msg?.speaker}
                </span>
                <button
                  type="button"
                  onClick={() => moveInOrder(i, "up")}
                  disabled={i === 0}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveInOrder(i, "down")}
                  disabled={i === correctOrder.length - 1}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Constraints (hints)</h2>
        <div className="space-y-2">
          {constraints.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={c}
                onChange={(e) => updateConstraint(i, e.target.value)}
                placeholder={`Hint ${i + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeConstraint(i)}
                disabled={constraints.length <= 1}
                className="text-red-600 hover:text-red-800 disabled:opacity-30 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addConstraint}
          className="mt-2 text-sm text-gray-600 hover:text-gray-900"
        >
          + Add constraint
        </button>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Metadata</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Types (hold Ctrl to multi-select)
            </label>
            <select
              multiple
              value={types}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (o) => o.value as PuzzleType
                );
                setTypes(selected);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full h-24"
            >
              {PUZZLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="workplace, deadline, emotional"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Group</label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Workplace conversations"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          Load from built-in
        </h2>
        <div className="flex flex-wrap gap-2">
          {builtinPuzzles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadTemplate(p)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {p.id} ({p.difficulty})
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          className="min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Save to localStorage
        </button>
        {saved && (
          <span className="text-sm text-green-600 self-center">Saved!</span>
        )}
        <button
          onClick={() => setPreview(true)}
          className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={handleExport}
          className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Export JSON
        </button>
      </section>

      {exportData && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Export / Import
          </h2>
          <textarea
            value={exportData}
            onChange={(e) => setExportData(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={handleImport}
            className="mt-2 min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Import from JSON above
          </button>
        </section>
      )}
    </div>
  );
}
