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

**First-time setup** (from the repo root):

```bash
npm install
npm run seed
npm run dev:all
```

Copy `.env.example` to `.env` and adjust if needed. The server loads `.env` on startup (via `dotenv`), so put `OPENAI_API_KEY` and other server vars there if you use the AI generator.

### Run in development

```bash
npm run dev:all
```

Starts both the API server (`localhost:3001`) and the Vite frontend (`localhost:5173`). **Use this so the game can load the daily puzzle** — the frontend needs the API; if you only run `npm run dev`, you’ll get 404 on `/api/daily`.

Or run them separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

**If you see 404 on `/api/daily`:** the backend isn’t running. Start it with `npm run server` (or use `npm run dev:all`).

### Seed starter puzzles

No server required. From the repo root:

```bash
npm run seed
```

Creates or overwrites `server/data/puzzles.db` with two sample puzzles — one dated today, one tomorrow. Edit `server/seed.js` to add your own puzzles, then re-run. The server loads puzzles from this SQLite database.

### Build for production

```bash
npm run build
NODE_ENV=production npm run server
```

Then open **http://localhost:3001** — the server serves both the static frontend and the API from the same origin.

To preview the built app locally, run **`npm run preview:all`** (server + Vite preview); open the preview URL and ensure the server is running so `/api` is proxied.

---

## Deploy

1. **Build:** `npm run build`
2. **Run the Node server** with `NODE_ENV=production` and `PORT` set (e.g. `PORT=3001`).
3. **Persist `server/data/`** so `puzzles.db` is kept across restarts (Railway, Render, Fly.io, etc. support persistent disks or volumes).
4. **Optional:** Set `ADMIN_SECRET` in the server environment to enable production puzzle CRUD via `Authorization: Bearer <ADMIN_SECRET>` or `X-Admin-Secret`.
5. **Optional:** Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) if you want the **Generate with AI** feature in production. The server loads env from the process environment (e.g. set in your host’s config; or use a `.env` file and ensure the process is started in that directory so `dotenv` can load it).
6. Point your host at the **Node process** (not only the static build). Platforms like Railway, Render, and Fly.io can run the Node server and serve the app.

**Health check:** `GET /api/health` returns `{ "status": "ok", "db": "ok" }` when the server and database are ready.

---

## Creating puzzles

Puzzle creation is available in **dev mode** (with `VITE_DEV_MODE=true`) or in **production** when you set an admin secret.

**Dev:** Set `VITE_DEV_MODE=true` in `.env`. This adds a **Puzzle** link and the admin dashboard at `/puzzle`.

**Production:** Set `ADMIN_SECRET` in the server environment. Then send that value on admin API requests via the `Authorization: Bearer <ADMIN_SECRET>` header or `X-Admin-Secret: <ADMIN_SECRET>`. The frontend does not send this by default; use it for scripts or a separate admin tool, or add a simple login that sends the header.

From the admin dashboard you can:

- **Create** a new puzzle at `/puzzle/new` — live preview updates as you type
- **Generate with AI** — see the [AI puzzle generator](#ai-puzzle-generator) section below
- **Edit** an existing puzzle at `/puzzle/:id`
- **Delete** a puzzle from the edit screen

The editor includes a side-by-side live preview of exactly how the puzzle will look to players.

---

## AI puzzle generator

On the **create** form (`/puzzle/new`), you can use the **Generate with AI** block to draft a full puzzle from a short description. The server calls the OpenAI API (Chat Completions), so your API key never leaves the server.

**How to use:**

1. Set `OPENAI_API_KEY` in your environment (e.g. in a `.env` file in the project root). The server loads `.env` via `dotenv` on startup.
2. Optionally set `OPENAI_MODEL` (default is `gpt-4o-mini`; use `gpt-4o` for higher quality and higher cost).
3. On the create form, enter a topic in the text area — e.g. *"Three friends plan a surprise party; one of them told the birthday person. Who spoiled it?"*
4. Click **Generate with AI**. The server sends the topic to OpenAI, gets back a structured puzzle (title, premise, chat name, messages, options, correct answer, explanation), validates it, and returns it to the form.
5. The form fills in all fields. You can edit anything before clicking **Publish to database**.

**Details:**

- The **API key is only on the server**. The frontend never sees it. The server exposes `POST /api/generate-puzzle` (same auth as other admin routes: dev mode or `ADMIN_SECRET` in production).
- The model is instructed to return a single JSON object matching the puzzle schema (date, title, premise, messages, options, correct_option_index, explanation). The server parses the response, strips markdown code fences if present, and runs it through the same validation used for manual create. If validation fails, you get an error and can tweak the topic or try again.
- **Cost:** Each generation uses one Chat Completions request. Usage is billed by OpenAI; the app does not impose a rate limit by default.

**Troubleshooting:**

- *"OpenAI API key not configured"* — Add `OPENAI_API_KEY` to `.env` in the project root and restart the server. The server loads `.env` on startup.
- *"AI returned invalid JSON"* — The model sometimes wraps JSON in markdown or adds text. The server strips common patterns; if it still fails, try a simpler or more specific topic.

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
│   ├── index.js                 # Express API (daily puzzle, answer submission, CRUD, POST /api/generate-puzzle)
│   ├── seed.js                  # Seed script — writes puzzles.db (no server required)
│   └── data/
│       └── puzzles.db           # SQLite database (gitignored)
└── package.json
```

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Mantine UI
- **Backend:** Express, SQLite (sql.js), nanoid, dotenv (loads `.env`). Optional: OpenAI (for **Generate with AI** on the create form).

---

## License

MIT. See [LICENSE](LICENSE).
