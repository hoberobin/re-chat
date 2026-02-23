import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const dataDir = join(__dirname, "data");
const puzzlesPath = join(dataDir, "puzzles.json");
const resultsPath = join(dataDir, "results.json");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Ensure puzzles.json exists on startup
if (!existsSync(puzzlesPath)) {
  writeFileSync(puzzlesPath, "[]", "utf8");
}

function loadPuzzles() {
  try {
    const raw = readFileSync(puzzlesPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePuzzles(puzzles) {
  writeFileSync(puzzlesPath, JSON.stringify(puzzles, null, 2), "utf8");
}

function loadResults() {
  try {
    const raw = readFileSync(resultsPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveResults(results) {
  writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf8");
}

function getStatsForDate(puzzleDate) {
  const results = loadResults();
  const forDate = results.filter((r) => r.puzzle_date === puzzleDate);
  const total_plays = forDate.length;
  const correct_plays = forDate.filter((r) => r.correct === 1).length;
  return { total_plays, correct_plays };
}

// GET /api/daily — today's mystery puzzle
app.get("/api/daily", (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const puzzles = loadPuzzles().filter((p) => p.date != null);

    // Try puzzle for today (deterministic: first by id if multiple)
    let puzzle = puzzles.find((p) => p.date === today);
    if (!puzzle) {
      // Fallback: most recent by date
      puzzles.sort((a, b) => (b.date < a.date ? -1 : 1));
      puzzle = puzzles[0];
    }

    if (!puzzle) {
      return res.status(503).json({ error: "No daily puzzles available" });
    }

    const puzzleDate = puzzle.date;
    const stats = getStatsForDate(puzzleDate);

    const { correct_option_index: _coi, explanation: _exp, ...safePuzzle } = puzzle;
    res.json({ ...safePuzzle, id: puzzle.id, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get daily puzzle" });
  }
});

// POST /api/daily/result — submit answer
app.post("/api/daily/result", (req, res) => {
  try {
    const { puzzle_date, guessed_index, session_id } = req.body;
    if (
      !puzzle_date ||
      guessed_index === undefined ||
      guessed_index === null ||
      !session_id
    ) {
      return res
        .status(400)
        .json({ error: "Missing puzzle_date, guessed_index, or session_id" });
    }

    const puzzles = loadPuzzles();
    const puzzle = puzzles.find((p) => p.date === puzzle_date);
    if (!puzzle) {
      return res.status(404).json({ error: "Puzzle not found for this date" });
    }

    const correct = guessed_index === puzzle.correct_option_index ? 1 : 0;
    const results = loadResults();
    results.push({
      puzzle_date,
      session_id,
      guessed_index,
      correct,
      played_at: Math.floor(Date.now() / 1000),
    });
    saveResults(results);

    const stats = getStatsForDate(puzzle_date);

    res.json({
      correct: correct === 1,
      correct_option_index: puzzle.correct_option_index,
      explanation: puzzle.explanation,
      stats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit result" });
  }
});

// GET /api/daily/result/:date — check if session already played
app.get("/api/daily/result/:date", (req, res) => {
  try {
    const { date } = req.params;
    const { session_id } = req.query;

    if (!session_id) {
      return res.json({ played: false, guessed_index: null, correct: null });
    }

    const results = loadResults();
    const played = results
      .filter((r) => r.puzzle_date === date && r.session_id === session_id)
      .sort((a, b) => (b.played_at || 0) - (a.played_at || 0))[0];

    if (played) {
      return res.json({
        played: true,
        guessed_index: played.guessed_index,
        correct: played.correct === 1,
      });
    }
    res.json({ played: false, guessed_index: null, correct: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check play status" });
  }
});

function guardDevOnly(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return res.status(403).json({ error: "Not allowed in production" });
  }
  const auth = req.headers.authorization;
  const headerSecret = req.headers["x-admin-secret"];
  const bearer = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer !== secret && headerSecret !== secret) {
    return res.status(403).json({ error: "Admin authentication required" });
  }
  next();
}

// POST /api/daily/puzzles — create one daily puzzle (dev or admin-secret)
app.post("/api/daily/puzzles", guardDevOnly, (req, res) => {
  try {
    const result = validateAndNormalizeDailyPuzzle(req.body, null);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    const payload = result.payload;
    const puzzles = loadPuzzles();
    const idx = puzzles.findIndex((p) => p.id === payload.id);
    if (idx >= 0) {
      puzzles[idx] = payload;
    } else {
      puzzles.push(payload);
    }
    savePuzzles(puzzles);
    res.status(201).json({ id: payload.id, date: payload.date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create puzzle" });
  }
});

// GET /api/daily/puzzles — list all daily puzzles (dev or admin-secret)
app.get("/api/daily/puzzles", guardDevOnly, (req, res) => {
  try {
    const puzzles = loadPuzzles()
      .filter((p) => p.date != null)
      .sort((a, b) => (b.date < a.date ? -1 : 1))
      .map((p) => ({ id: p.id, date: p.date, title: p.title || "Untitled" }));
    res.json(puzzles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list puzzles" });
  }
});

// GET /api/daily/puzzles/:id — get one daily puzzle for editing (dev or admin-secret)
app.get("/api/daily/puzzles/:id", guardDevOnly, (req, res) => {
  try {
    const { id } = req.params;
    const puzzles = loadPuzzles();
    const puzzle = puzzles.find((p) => p.id === id);
    if (!puzzle || puzzle.date == null) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    res.json({ id: puzzle.id, ...puzzle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch puzzle" });
  }
});

function validateAndNormalizeDailyPuzzle(puzzle, idFromUrl) {
  if (!puzzle || typeof puzzle !== "object") {
    return { error: "Body must be a puzzle object" };
  }
  const {
    date,
    title,
    premise,
    chat_name,
    is_group,
    messages,
    options,
    correct_option_index,
    explanation,
  } = puzzle;

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Valid date (YYYY-MM-DD) required" };
  }
  if (!title || typeof title !== "string" || !title.trim()) {
    return { error: "Title required" };
  }
  if (!premise || typeof premise !== "string" || !premise.trim()) {
    return { error: "Premise required" };
  }
  if (!chat_name || typeof chat_name !== "string" || !chat_name.trim()) {
    return { error: "Chat name required" };
  }
  if (!Array.isArray(messages) || messages.length < 2) {
    return { error: "At least 2 messages required" };
  }
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m.sender !== "string" || typeof m.text !== "string") {
      return { error: `Message ${i + 1}: sender and text required` };
    }
  }
  if (!Array.isArray(options) || options.length < 2) {
    return { error: "At least 2 options required" };
  }
  const idx = Number(correct_option_index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
    return { error: "correct_option_index must be 0 to options.length - 1" };
  }
  if (explanation === undefined || explanation === null || String(explanation).trim() === "") {
    return { error: "Explanation required" };
  }

  const id = idFromUrl || (puzzle.id && String(puzzle.id).trim()) || nanoid(10);
  return {
    payload: {
      id,
      date,
      title: String(title).trim(),
      premise: String(premise).trim(),
      chat_name: String(chat_name).trim(),
      is_group: Boolean(is_group),
      messages: messages.map((m) => ({
        id: m.id ?? messages.indexOf(m) + 1,
        sender: String(m.sender).trim(),
        text: String(m.text).trim(),
        is_redacted: Boolean(m.is_redacted),
        timestamp: String(m.timestamp ?? "").trim() || "12:00 PM",
        show_timestamp: Boolean(m.show_timestamp),
      })),
      options: options.map((o) => String(o).trim()).filter(Boolean),
      correct_option_index: idx,
      explanation: String(explanation).trim(),
    },
  };
}

// PUT /api/daily/puzzles/:id — update daily puzzle (dev or admin-secret)
app.put("/api/daily/puzzles/:id", guardDevOnly, (req, res) => {
  try {
    const { id } = req.params;
    const result = validateAndNormalizeDailyPuzzle(req.body, id);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    const payload = result.payload;
    const puzzles = loadPuzzles();
    const idx = puzzles.findIndex((p) => p.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    puzzles[idx] = payload;
    savePuzzles(puzzles);
    res.json({ id: payload.id, date: payload.date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update puzzle" });
  }
});

// DELETE /api/daily/puzzles/:id — delete daily puzzle (dev or admin-secret)
app.delete("/api/daily/puzzles/:id", guardDevOnly, (req, res) => {
  try {
    const { id } = req.params;
    const all = loadPuzzles();
    const puzzles = all.filter((p) => p.id !== id);
    if (puzzles.length === all.length) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    savePuzzles(puzzles);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete puzzle" });
  }
});

// In production, serve static client
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  const path = await import("path");
  const clientPath = path.join(__dirname, "..", "dist");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
