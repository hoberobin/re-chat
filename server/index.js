import express from "express";
import cors from "cors";
import initSqlJs from "sql.js";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const dataDir = join(__dirname, "data");
const dbPath = join(dataDir, "puzzles.db");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Puzzles table — stores JSON blob per puzzle (new format includes date, title, premise, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Results table — tracks anonymous plays
  db.run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      puzzle_date TEXT NOT NULL,
      session_id TEXT NOT NULL,
      guessed_index INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      played_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  if (!existsSync(dbPath)) saveDb();
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

await initDb();

// POST /api/puzzles — create puzzle (legacy, keep as-is)
app.post("/api/puzzles", (req, res) => {
  try {
    const { messages, correctOrder, constraints } = req.body;
    if (
      !Array.isArray(messages) ||
      !Array.isArray(correctOrder) ||
      !Array.isArray(constraints)
    ) {
      return res.status(400).json({
        error: "Missing or invalid fields: messages, correctOrder, constraints",
      });
    }
    if (messages.length < 2 || messages.length > 30) {
      return res.status(400).json({
        error: "Puzzle must have between 2 and 30 messages",
      });
    }
    const id = nanoid(10);
    const data = JSON.stringify({ messages, correctOrder, constraints });
    db.run("INSERT INTO puzzles (id, data) VALUES (?, ?)", [id, data]);
    saveDb();
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create puzzle" });
  }
});

// GET /api/puzzles/:id — fetch puzzle by ID (legacy, keep as-is)
app.get("/api/puzzles/:id", (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("SELECT data FROM puzzles WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const puzzle = JSON.parse(row.data);
      stmt.free();
      return res.json({ id, ...puzzle });
    }
    stmt.free();
    res.status(404).json({ error: "Puzzle not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch puzzle" });
  }
});

// GET /api/daily — today's mystery puzzle
app.get("/api/daily", (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Try to find puzzle for today
    let stmt = db.prepare(
      "SELECT id, data FROM puzzles WHERE json_extract(data, '$.date') = ? LIMIT 1"
    );
    stmt.bind([today]);
    let puzzleRow = null;
    if (stmt.step()) {
      puzzleRow = stmt.getAsObject();
    }
    stmt.free();

    // Fallback: most recent puzzle by date
    if (!puzzleRow) {
      stmt = db.prepare(
        "SELECT id, data FROM puzzles WHERE json_extract(data, '$.date') IS NOT NULL ORDER BY json_extract(data, '$.date') DESC LIMIT 1"
      );
      if (stmt.step()) {
        puzzleRow = stmt.getAsObject();
      }
      stmt.free();
    }

    if (!puzzleRow) {
      return res.status(503).json({ error: "No daily puzzles available" });
    }

    const puzzle = JSON.parse(puzzleRow.data);
    const puzzleDate = puzzle.date;

    // Get stats
    const statsStmt = db.prepare(
      "SELECT COUNT(*) as total_plays, SUM(correct) as correct_plays FROM results WHERE puzzle_date = ?"
    );
    statsStmt.bind([puzzleDate]);
    let stats = { total_plays: 0, correct_plays: 0 };
    if (statsStmt.step()) {
      const row = statsStmt.getAsObject();
      stats = {
        total_plays: Number(row.total_plays) || 0,
        correct_plays: Number(row.correct_plays) || 0,
      };
    }
    statsStmt.free();

    // Strip sensitive fields before responding
    const { correct_option_index: _coi, explanation: _exp, ...safePuzzle } = puzzle;

    res.json({ ...safePuzzle, id: puzzleRow.id, stats });
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

    // Find the puzzle for this date
    const stmt = db.prepare(
      "SELECT id, data FROM puzzles WHERE json_extract(data, '$.date') = ? LIMIT 1"
    );
    stmt.bind([puzzle_date]);
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: "Puzzle not found for this date" });
    }
    const puzzleRow = stmt.getAsObject();
    stmt.free();

    const puzzle = JSON.parse(puzzleRow.data);
    const correct = guessed_index === puzzle.correct_option_index ? 1 : 0;

    db.run(
      "INSERT INTO results (puzzle_date, session_id, guessed_index, correct) VALUES (?, ?, ?, ?)",
      [puzzle_date, session_id, guessed_index, correct]
    );
    saveDb();

    // Return updated stats
    const statsStmt = db.prepare(
      "SELECT COUNT(*) as total_plays, SUM(correct) as correct_plays FROM results WHERE puzzle_date = ?"
    );
    statsStmt.bind([puzzle_date]);
    let stats = { total_plays: 0, correct_plays: 0 };
    if (statsStmt.step()) {
      const row = statsStmt.getAsObject();
      stats = {
        total_plays: Number(row.total_plays) || 0,
        correct_plays: Number(row.correct_plays) || 0,
      };
    }
    statsStmt.free();

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

    const stmt = db.prepare(
      "SELECT guessed_index, correct FROM results WHERE puzzle_date = ? AND session_id = ? ORDER BY played_at DESC LIMIT 1"
    );
    stmt.bind([date, session_id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return res.json({
        played: true,
        guessed_index: Number(row.guessed_index),
        correct: Number(row.correct) === 1,
      });
    }
    stmt.free();
    res.json({ played: false, guessed_index: null, correct: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check play status" });
  }
});

// POST /api/puzzles/seed — bulk insert puzzles (dev only)
app.post("/api/puzzles/seed", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Seeding not allowed in production" });
  }
  try {
    const puzzles = req.body;
    if (!Array.isArray(puzzles)) {
      return res.status(400).json({ error: "Body must be an array of puzzles" });
    }
    let inserted = 0;
    for (const puzzle of puzzles) {
      const id = puzzle.id || nanoid(10);
      const data = JSON.stringify({ ...puzzle, id });
      db.run("INSERT OR REPLACE INTO puzzles (id, data) VALUES (?, ?)", [
        id,
        data,
      ]);
      inserted++;
    }
    saveDb();
    res.json({ inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to seed puzzles" });
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
