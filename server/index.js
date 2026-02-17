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
  db.run(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
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

// POST /api/puzzles - create puzzle
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

// GET /api/puzzles/:id - fetch puzzle
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
