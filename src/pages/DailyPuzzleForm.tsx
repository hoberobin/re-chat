import { useState, useCallback, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { DailyPuzzleView } from "../components/DailyPuzzleView";
import {
  createDailyPuzzle,
  getDailyPuzzleForEdit,
  updateDailyPuzzle,
  deleteDailyPuzzle,
} from "../api/puzzles";
import type { DailyPuzzleCreatePayload } from "../types/puzzle";
import type { ChatMessage } from "../types/puzzle";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

function getTodayDateString(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function defaultMessage(i: number): ChatMessage {
  return {
    id: i + 1,
    sender: i % 2 === 0 ? "A" : "B",
    text: "",
    is_redacted: false,
    timestamp: "12:00 PM",
    show_timestamp: i === 0,
  };
}

function defaultDraft(): DailyPuzzleCreatePayload {
  return {
    date: getTodayDateString(),
    title: "",
    premise: "",
    chat_name: "",
    is_group: true,
    messages: [
      defaultMessage(0),
      defaultMessage(1),
      defaultMessage(2),
    ],
    options: ["Option A", "Option B", "Option C"],
    correct_option_index: 0,
    explanation: "",
  };
}

function draftToPuzzle(draft: DailyPuzzleCreatePayload): Parameters<typeof DailyPuzzleView>[0]["puzzle"] {
  return {
    id: "draft",
    date: draft.date,
    title: draft.title || "Untitled",
    premise: draft.premise || "Premise",
    chat_name: draft.chat_name || "Chat",
    is_group: draft.is_group,
    messages: draft.messages,
    options: draft.options.filter(Boolean).length ? draft.options : ["A", "B", "C"],
  };
}

const MIN_MESSAGES = 2;
const MAX_MESSAGES = 50;

export function DailyPuzzleForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCreate = id === undefined || id === "new";
  const isPreview = searchParams.get("preview") === "true";

  const [draft, setDraft] = useState<DailyPuzzleCreatePayload | null>(isCreate ? defaultDraft() : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{ id: string; date: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isCreate) return;
    let cancelled = false;
    setLoadError(null);
    getDailyPuzzleForEdit(id!)
      .then((p) => {
        if (!cancelled) setDraft(p);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => { cancelled = true; };
  }, [id, isCreate]);

  const update = useCallback(<K extends keyof DailyPuzzleCreatePayload>(
    key: K,
    value: DailyPuzzleCreatePayload[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : null));
    setPublishError(null);
    setPublishSuccess(null);
  }, []);

  const updateMessage = useCallback((index: number, field: keyof ChatMessage, value: string | number | boolean) => {
    setDraft((prev) => {
      if (!prev) return null;
      const next = prev.messages.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      );
      return { ...prev, messages: next };
    });
    setPublishError(null);
    setPublishSuccess(null);
  }, []);

  const addMessage = useCallback(() => {
    setDraft((prev) => {
      if (!prev || prev.messages.length >= MAX_MESSAGES) return prev;
      return { ...prev, messages: [...prev.messages, defaultMessage(prev.messages.length)] };
    });
  }, []);

  const removeMessage = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev || prev.messages.length <= MIN_MESSAGES) return prev;
      const next = prev.messages.filter((_, i) => i !== index).map((m, i) => ({ ...m, id: i + 1 }));
      return { ...prev, messages: next };
    });
  }, []);

  const moveMessage = useCallback((index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      if (!prev) return null;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.messages.length) return prev;
      const next = [...prev.messages];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return { ...prev, messages: next.map((m, i) => ({ ...m, id: i + 1 })) };
    });
  }, []);

  const validationErrors = (): string[] => {
    if (!draft) return [];
    const errs: string[] = [];
    if (!draft.title.trim()) errs.push("Title is required");
    if (!draft.premise.trim()) errs.push("Premise is required");
    if (!draft.chat_name.trim()) errs.push("Chat name is required");
    if (draft.messages.length < MIN_MESSAGES) errs.push("At least 2 messages required");
    draft.messages.forEach((m, i) => {
      if (!m.sender.trim()) errs.push(`Message ${i + 1}: sender required`);
      if (!m.text.trim()) errs.push(`Message ${i + 1}: text required`);
    });
    const filledOptions = draft.options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) errs.push("At least 2 options required");
    if (draft.correct_option_index < 0 || draft.correct_option_index >= draft.options.length)
      errs.push("Correct answer must be one of the options");
    if (!draft.explanation.trim()) errs.push("Explanation is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errs.push("Release date must be YYYY-MM-DD");
    return errs;
  };

  const buildPayload = (): DailyPuzzleCreatePayload | null => {
    if (!draft) return null;
    return {
      ...draft,
      messages: draft.messages.map((m, i) => ({
        ...m,
        id: i + 1,
        sender: m.sender.trim(),
        text: m.text.trim(),
        timestamp: m.timestamp?.trim() || "12:00 PM",
      })),
      options: draft.options.map((o) => o.trim()).filter(Boolean),
      title: draft.title.trim(),
      premise: draft.premise.trim(),
      chat_name: draft.chat_name.trim(),
      explanation: draft.explanation.trim(),
    };
  };

  const handleSave = async () => {
    const errs = validationErrors();
    if (errs.length) {
      setPublishError(errs.join(". "));
      return;
    }
    const payload = buildPayload();
    if (!payload) return;
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      if (isCreate) {
        const result = await createDailyPuzzle(payload);
        setPublishSuccess(result);
      } else {
        const result = await updateDailyPuzzle(id!, payload);
        setPublishSuccess(result);
      }
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to save puzzle");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isCreate) return;
    if (!window.confirm("Delete this puzzle? This cannot be undone.")) return;
    setDeleting(true);
    setPublishError(null);
    try {
      await deleteDailyPuzzle(id);
      navigate("/puzzle");
      return;
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!isCreate && draft === null && !loadError) {
    return (
      <div style={{ padding: 24, fontFamily: FONT, textAlign: "center" }}>
        <p>Loading puzzle…</p>
      </div>
    );
  }

  if (loadError && !draft) {
    return (
      <div style={{ padding: 24, fontFamily: FONT }}>
        <p style={{ color: "#FF3B30" }}>{loadError}</p>
        <Link to="/puzzle" style={{ color: "#007AFF", marginTop: 8, display: "inline-block" }}>
          Back to list
        </Link>
      </div>
    );
  }

  const previewPuzzle = draft ? draftToPuzzle(draft) : null;

  if (isPreview && draft && previewPuzzle) {
    return (
      <div style={{ minHeight: "100vh", background: "#e5e5ea", fontFamily: FONT, padding: 16 }}>
        <div style={{ maxWidth: 430, margin: "0 auto", position: "relative" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link to={id ? `/puzzle/${id}` : "/puzzle/new"} style={{ color: "#007AFF", textDecoration: "none", fontSize: 15 }}>
              Edit
            </Link>
            <Link to="/puzzle" style={{ color: "#007AFF", textDecoration: "none", fontSize: 15 }}>
              Back to list
            </Link>
          </div>
          <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", background: "#fff", height: 700 }}>
            <DailyPuzzleView puzzle={previewPuzzle} subtitle="Preview" />
          </div>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#e5e5ea", fontFamily: FONT, padding: "16px 0" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          gap: 24,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 400px",
            minWidth: 0,
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            {isCreate ? "Create daily puzzle" : "Edit puzzle"}
          </h1>
          <p style={{ fontSize: 13, color: "#6b6b70", marginBottom: 20 }}>
            Edit below; preview updates live. When ready, set the release date and save.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. The Surprise"
                style={{ padding: "8px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d1d6" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Chat name</span>
              <input
                type="text"
                value={draft.chat_name}
                onChange={(e) => update("chat_name", e.target.value)}
                placeholder="e.g. Maya's Bday"
                style={{ padding: "8px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d1d6" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Premise</span>
              <textarea
                value={draft.premise}
                onChange={(e) => update("premise", e.target.value)}
                placeholder="e.g. You're reading a group chat..."
                rows={3}
                style={{ padding: "8px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d1d6", resize: "vertical" }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={draft.is_group} onChange={(e) => update("is_group", e.target.checked)} />
              <span style={{ fontSize: 13 }}>Group chat</span>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Release date</span>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => update("date", e.target.value)}
                style={{ padding: "8px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d1d6" }}
              />
            </label>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Messages</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {draft.messages.map((msg, i) => (
              <div
                key={msg.id}
                style={{
                  padding: 12,
                  border: "1px solid #e5e5ea",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6b6b70" }}>Message {i + 1}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => moveMessage(i, "up")}
                      disabled={i === 0}
                      style={{ padding: "4px 8px", fontSize: 12, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.5 : 1 }}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMessage(i, "down")}
                      disabled={i === draft.messages.length - 1}
                      style={{ padding: "4px 8px", fontSize: 12, cursor: i === draft.messages.length - 1 ? "default" : "pointer", opacity: i === draft.messages.length - 1 ? 0.5 : 1 }}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMessage(i)}
                      disabled={draft.messages.length <= MIN_MESSAGES}
                      style={{ padding: "4px 8px", fontSize: 12, cursor: draft.messages.length <= MIN_MESSAGES ? "default" : "pointer", color: "#FF3B30", opacity: draft.messages.length <= MIN_MESSAGES ? 0.5 : 1 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={msg.sender}
                  onChange={(e) => updateMessage(i, "sender", e.target.value)}
                  placeholder="Sender name"
                  style={{ padding: "6px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d1d6" }}
                />
                <textarea
                  value={msg.text}
                  onChange={(e) => updateMessage(i, "text", e.target.value)}
                  placeholder="Message text"
                  rows={2}
                  style={{ padding: "6px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #d1d1d6", resize: "vertical" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="text"
                    value={msg.timestamp}
                    onChange={(e) => updateMessage(i, "timestamp", e.target.value)}
                    placeholder="12:00 PM"
                    style={{ width: 80, padding: "4px 8px", fontSize: 13, borderRadius: 6, border: "1px solid #d1d1d6" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={msg.show_timestamp}
                      onChange={(e) => updateMessage(i, "show_timestamp", e.target.checked)}
                    />
                    Show timestamp
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMessage}
              disabled={draft.messages.length >= MAX_MESSAGES}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                border: "1px dashed #d1d1d6",
                borderRadius: 8,
                background: "#f9f9f9",
                cursor: draft.messages.length >= MAX_MESSAGES ? "default" : "pointer",
              }}
            >
              + Add message
            </button>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Answer options</h2>
          <p style={{ fontSize: 12, color: "#6b6b70", marginBottom: 8 }}>
            The three names players choose from. One must be correct.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.options.map((opt, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, fontWeight: 600 }}>{["A", "B", "C"][i]}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...draft.options];
                    next[i] = e.target.value;
                    update("options", next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  style={{ flex: 1, padding: "8px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d1d6" }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <input
                    type="radio"
                    name="correct"
                    checked={draft.correct_option_index === i}
                    onChange={() => update("correct_option_index", i)}
                  />
                  Correct
                </label>
              </label>
            ))}
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Explanation (shown after submit)</span>
            <textarea
              value={draft.explanation}
              onChange={(e) => update("explanation", e.target.value)}
              placeholder="Why this answer is correct..."
              rows={4}
              style={{ padding: "8px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d1d6", resize: "vertical" }}
            />
          </label>

          {publishError && <p style={{ color: "#FF3B30", fontSize: 13, marginTop: 16 }}>{publishError}</p>}
          {publishSuccess && (
            <div style={{ marginTop: 16, padding: 12, background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
              <p style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>Puzzle saved</p>
              <p style={{ color: "#166534", fontSize: 12, marginTop: 4 }}>
                Release date: {publishSuccess.date}. Id: {publishSuccess.id}. It will appear on the home page when that date is today.
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={publishing}
              style={{
                padding: "10px 20px",
                fontSize: 15,
                fontWeight: 600,
                background: "#007AFF",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: publishing ? "wait" : "pointer",
              }}
            >
              {publishing ? "Saving…" : isCreate ? "Publish to database" : "Update"}
            </button>
            {!isCreate && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  fontSize: 15,
                  color: "#FF3B30",
                  background: "transparent",
                  border: "1px solid #FF3B30",
                  borderRadius: 10,
                  cursor: deleting ? "wait" : "pointer",
                }}
              >
                {deleting ? "Deleting…" : "Delete puzzle"}
              </button>
            )}
            <Link
              to="/puzzle"
              style={{
                padding: "10px 20px",
                fontSize: 15,
                color: "#007AFF",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to list
            </Link>
            <Link
              to="/"
              style={{
                fontSize: 15,
                color: "#6b6b70",
                textDecoration: "none",
              }}
            >
              Today&apos;s puzzle
            </Link>
          </div>
        </div>

        <div
          style={{
            flex: "0 0 auto",
            width: "100%",
            maxWidth: 430,
            height: 700,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            background: "#fff",
          }}
        >
          <DailyPuzzleView puzzle={draftToPuzzle(draft)} subtitle="Preview" />
        </div>
      </div>
    </div>
  );
}
