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

No server required. From the repo root:

```bash
npm run seed
```

Writes two sample puzzles to `server/data/puzzles.json` — one dated today, one tomorrow. Edit `server/seed.js` to add your own puzzles, then re-run. The server loads puzzles from this file on each request.

### Build for production

```bash
npm run build
NODE_ENV=production npm run server
```

The server serves both the static frontend and the API. Deploy to Railway, Render, Fly.io, etc. Puzzles live in `server/data/puzzles.json` (committed); play stats are stored in `server/data/results.json` (gitignored). No database to provision or migrate.

---

## Creating puzzles

Puzzle creation is available in **dev mode** (with `VITE_DEV_MODE=true`) or in **production** when you set an admin secret.

**Dev:** Set `VITE_DEV_MODE=true` in `.env`. This adds a **Puzzle** link and the admin dashboard at `/puzzle`.

**Production:** Set `ADMIN_SECRET` in the server environment. Then send that value on admin API requests via the `Authorization: Bearer <ADMIN_SECRET>` header or `X-Admin-Secret: <ADMIN_SECRET>`. The frontend does not send this by default; use it for scripts or a separate admin tool, or add a simple login that sends the header.

From the admin dashboard you can:

- **Create** a new puzzle at `/puzzle/new` — live preview updates as you type
- **Edit** an existing puzzle at `/puzzle/:id`
- **Delete** a puzzle from the edit screen

The editor includes a side-by-side live preview of exactly how the puzzle will look to players.

**The "Hide message content" toggle** on each message blacks out that message's text for players. Use it to add mystery — it's optional and not required for the puzzle to work.

**Scheduling:** Each puzzle has a **date** (YYYY-MM-DD). The API serves the puzzle whose date matches today, falling back to the most recent dated puzzle if none matches. To publish a puzzle for a given day, create or edit it and set its date to that day. Only one puzzle per day is used; if multiple share a date, the API picks one deterministically.

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
│   ├── seed.js                  # Seed script — writes puzzles.json (no server required)
│   └── data/
│       ├── puzzles.json         # Puzzle roster (committed)
│       └── results.json         # Play stats (gitignored)
└── package.json
```

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Mantine UI
- **Backend:** Express, file-based JSON storage (puzzles.json, results.json), nanoid

---

## License

MIT. See [LICENSE](LICENSE).
