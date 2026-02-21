# Re:Chat

A daily puzzle built around a text conversation. Read a chat, pick up on the clues, and answer one question — one guess, no sign-up, new puzzle every day.

---

## How it works

Each puzzle presents a realistic-looking chat thread and asks you a multiple-choice question about it. The question can be anything: *who started the argument*, *what was actually planned*, *why did someone go quiet* — whatever fits the conversation. You pick from three options (A, B, or C). One try. Then you see whether you got it right, the correct answer, and an explanation.

Puzzles can optionally hide (redact) one or more messages as an extra layer of mystery, but it's not required — the conversation itself is always the primary clue source.

---

## Puzzle format

Each puzzle has:

| Field | Description |
|---|---|
| **Chat name** | The name shown in the chat header (e.g. *"Maya's Bday 🎂"*) |
| **Title** | Internal name used in the admin list |
| **Premise** | Setup and question shown to the player. The last sentence (the actual question) is shown bold. |
| **Messages** | The chat thread — each has a sender, text, optional timestamp, and an optional "hide content" flag |
| **Options** | Three answer choices (A, B, C) — can be names, phrases, anything |
| **Correct answer** | Which option index (0–2) is correct |
| **Explanation** | Revealed after the player submits — explains the reasoning |

---

## Getting started

**Prerequisites:** Node.js 18+, npm

```bash
npm install
```

### Run in development

```bash
npm run dev:all
```

Starts both the API server (`localhost:3001`) and the Vite frontend (`localhost:5173`) together.

Or run them separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

### Seed starter puzzles

With the server running:

```bash
npm run seed
```

Inserts two sample puzzles into the database — one dated today, one tomorrow. Edit `server/seed.js` to add your own puzzles, then re-run the command.

### Build for production

```bash
npm run build
NODE_ENV=production npm run server
```

The server serves both the static frontend and the API. Deploy to Railway, Render, Fly.io, etc. Make sure `server/data/` is persisted across deploys — that's where the SQLite database lives.

---

## Creating puzzles

Puzzle creation is available in **dev mode only** (not exposed in production).

Enable it by setting `VITE_DEV_MODE=true` in your `.env` file:

```
VITE_DEV_MODE=true
```

This adds a **Puzzle** link to the top of the app, which opens the admin dashboard at `/puzzle`. From there you can:

- **Create** a new puzzle at `/puzzle/new` — live preview updates as you type
- **Edit** an existing puzzle at `/puzzle/:id`
- **Delete** a puzzle from the edit screen

The editor includes a side-by-side live preview of exactly how the puzzle will look to players.

**The "Hide message content" toggle** on each message blacks out that message's text for players. Use it to add mystery — it's optional and not required for the puzzle to work.

**Release date** controls which puzzle appears on a given day. The API serves the puzzle whose date matches today, falling back to the most recent dated puzzle if none matches.

---

## Routes

| Path | Description |
|---|---|
| `/` | Daily puzzle (home) |
| `/puzzle` | Admin puzzle list *(dev mode only)* |
| `/puzzle/new` | Create a new puzzle *(dev mode only)* |
| `/puzzle/:id` | Edit a puzzle *(dev mode only)* |

---

## Project structure

```
re-chat/
├── src/
│   ├── api/
│   │   └── puzzles.ts          # API client (fetch daily puzzle, submit answer, CRUD)
│   ├── components/
│   │   ├── ChatThread.tsx       # iMessage-style chat bubble renderer
│   │   ├── AnswerOptions.tsx    # A/B/C answer buttons with reveal states
│   │   ├── DailyPuzzleView.tsx  # Composes the full puzzle screen
│   │   ├── ResultReveal.tsx     # Post-answer outcome, explanation, streak, countdown
│   │   └── OnboardingOverlay.tsx # First-time "How to play" sheet
│   ├── pages/
│   │   ├── DailyPuzzle.tsx      # Home page — loads puzzle, manages state
│   │   ├── DailyPuzzleForm.tsx  # Create / edit puzzle (dev mode)
│   │   └── DailyPuzzlesList.tsx # Admin puzzle list (dev mode)
│   ├── types/
│   │   └── puzzle.ts            # TypeScript types (DailyPuzzle, ChatMessage, PuzzleResult, etc.)
│   └── utils/
│       └── chatColors.ts        # Sender color assignment logic
├── server/
│   ├── index.js                 # Express API (daily puzzle, answer submission, CRUD)
│   ├── seed.js                  # Seed script — edit and run to populate puzzles
│   └── data/
│       └── puzzles.db           # SQLite database (gitignored)
└── package.json
```

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Mantine UI
- **Backend:** Express, sql.js (SQLite), nanoid

---

## License

MIT. See [LICENSE](LICENSE).
