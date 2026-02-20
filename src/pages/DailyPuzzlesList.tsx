import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listDailyPuzzles, deleteDailyPuzzle } from "../api/puzzles";
import type { DailyPuzzleListItem } from "../api/puzzles";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

export function DailyPuzzlesList() {
  const [items, setItems] = useState<DailyPuzzleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listDailyPuzzles();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load puzzles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await deleteDailyPuzzle(id);
      setConfirmDeleteId(null);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f7",
        fontFamily: FONT,
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Daily puzzles</h1>
          <Link
            to="/puzzle/new"
            style={{
              padding: "10px 20px",
              background: "#007AFF",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Create puzzle
          </Link>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              background: "#ffebee",
              color: "#c62828",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#6b6b70" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              background: "#fff",
              borderRadius: 12,
              border: "1px dashed #d1d1d6",
            }}
          >
            <p style={{ color: "#6b6b70", marginBottom: 16 }}>No puzzles yet.</p>
            <Link
              to="/puzzle/new"
              style={{
                padding: "10px 20px",
                background: "#007AFF",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Create your first puzzle
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #e5e5ea" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>ID</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>{p.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b6b70", fontFamily: "monospace" }}>{p.id}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <Link
                        to={`/puzzle/${p.id}?preview=true`}
                        style={{ marginRight: 8, fontSize: 13, color: "#007AFF", textDecoration: "none" }}
                      >
                        Preview
                      </Link>
                      <Link
                        to={`/puzzle/${p.id}`}
                        style={{ marginRight: 8, fontSize: 13, color: "#007AFF", textDecoration: "none" }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        style={{
                          fontSize: 13,
                          color: confirmDeleteId === p.id ? "#fff" : "#FF3B30",
                          background: confirmDeleteId === p.id ? "#FF3B30" : "transparent",
                          border: "1px solid #FF3B30",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: deletingId === p.id ? "wait" : "pointer",
                        }}
                      >
                        {confirmDeleteId === p.id ? "Confirm delete?" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
