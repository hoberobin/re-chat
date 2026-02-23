import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
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

  db.run(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

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

// GET /api/health — for deploy health checks
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: db ? "ok" : "not initialized" });
});

// GET /api/daily — today's mystery puzzle
app.get("/api/daily", (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    let stmt = db.prepare(
      "SELECT id, data FROM puzzles WHERE json_extract(data, '$.date') = ? ORDER BY id ASC LIMIT 1"
    );
    stmt.bind([today]);
    let puzzleRow = null;
    if (stmt.step()) {
      puzzleRow = stmt.getAsObject();
    }
    stmt.free();

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
    db.run("INSERT OR REPLACE INTO puzzles (id, data) VALUES (?, ?)", [
      result.payload.id,
      JSON.stringify(result.payload),
    ]);
    saveDb();
    res.status(201).json({ id: result.payload.id, date: result.payload.date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create puzzle" });
  }
});

// GET /api/daily/puzzles — list all daily puzzles (dev or admin-secret)
app.get("/api/daily/puzzles", guardDevOnly, (req, res) => {
  try {
    const stmt = db.prepare(
      "SELECT id, data FROM puzzles WHERE json_extract(data, '$.date') IS NOT NULL ORDER BY json_extract(data, '$.date') DESC"
    );
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const data = JSON.parse(row.data);
      rows.push({ id: row.id, date: data.date, title: data.title || "Untitled" });
    }
    stmt.free();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list puzzles" });
  }
});

// GET /api/daily/puzzles/:id — get one daily puzzle for editing (dev or admin-secret)
app.get("/api/daily/puzzles/:id", guardDevOnly, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("SELECT id, data FROM puzzles WHERE id = ?");
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: "Puzzle not found" });
    }
    const row = stmt.getAsObject();
    stmt.free();
    const data = JSON.parse(row.data);
    if (data.date == null) {
      return res.status(404).json({ error: "Not a daily puzzle" });
    }
    res.json({ id: row.id, ...data });
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
    db.run("INSERT OR REPLACE INTO puzzles (id, data) VALUES (?, ?)", [
      result.payload.id,
      JSON.stringify(result.payload),
    ]);
    saveDb();
    res.json({ id: result.payload.id, date: result.payload.date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update puzzle" });
  }
});

// DELETE /api/daily/puzzles/:id — delete daily puzzle (dev or admin-secret)
app.delete("/api/daily/puzzles/:id", guardDevOnly, (req, res) => {
  try {
    const { id } = req.params;
    db.run("DELETE FROM puzzles WHERE id = ?", [id]);
    saveDb();
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete puzzle" });
  }
});

// POST /api/generate-puzzle — generate puzzle from topic via OpenAI (dev or admin-secret)
const OPENAI_SYSTEM_PROMPT = `You generate Re:Chat daily puzzles. Each puzzle is a text chat conversation where players must deduce one answer from clues.

Return ONLY a single JSON object, no markdown, no explanation. The JSON must have exactly these fields:
- date: string, YYYY-MM-DD (use today's date)
- title: string, short puzzle title
- premise: string, 2-3 sentences setting up the scenario. The LAST sentence must be the question players answer (e.g. "Who spoiled the surprise?")
- chat_name: string, name of the chat thread (e.g. "Maya's Bday")
- is_group: true
- messages: array of 6-15 objects, each with: id (number, 1-based), sender (string), text (string), is_redacted (false), timestamp (e.g. "12:00 PM"), show_timestamp (true only for first message)
- options: array of exactly 3 strings (the answer choices; usually names of chat participants)
- correct_option_index: number, 0 or 1 or 2 (which option is correct)
- explanation: string, 1-3 sentences explaining why that answer is correct

The chat must contain clues so a careful reader can deduce the correct answer. Make the conversation natural and the mystery fair.`;

app.post("/api/generate-puzzle", guardDevOnly, async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(503).json({ error: "OpenAI API key not configured. Set OPENAI_API_KEY." });
    }
    const { topic } = req.body || {};
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "topic (string) required in body" });
    }
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const openai = new OpenAI({ apiKey: apiKey.trim() });
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: OPENAI_SYSTEM_PROMPT },
        { role: "user", content: `Generate a Re:Chat puzzle for the following topic: ${topic.trim()}\n\nReturn only the JSON object, no markdown or extra text.` },
      ],
      temperature: 0.7,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(422).json({ error: "AI returned no content" });
    }
    let jsonStr = raw;
    const codeFence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeFence) {
      jsonStr = codeFence[1].trim();
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Generate-puzzle JSON parse failed:", e.message);
      return res.status(422).json({ error: "AI returned invalid JSON" });
    }
    if (!parsed.date || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      parsed.date = new Date().toISOString().slice(0, 10);
    }
    const result = validateAndNormalizeDailyPuzzle(parsed, null);
    if (result.error) {
      return res.status(422).json({ error: result.error });
    }
    const payload = result.payload;
    const { id: _id, ...payloadWithoutId } = payload;
    res.json(payloadWithoutId);
  } catch (err) {
    console.error(err);
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again in a moment." });
    }
    res.status(500).json({ error: err.message || "Failed to generate puzzle" });
  }
});

// Global error handler (uncaught errors in route handlers)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
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
