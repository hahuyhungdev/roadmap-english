# Roadmap English AI

AI-powered English practice app focused on speaking, shadowing, and sentence-by-sentence training.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Mantine UI + Tailwind CSS
- Drizzle ORM + Neon Postgres
- Soniox (speech-to-text) integration via client hook
- Google TTS + AI feedback endpoints

## Main Features

- Script shadowing practice (paste text, split into sentences, practice step by step)
- YouTube shadowing flow with transcript/translation support
- Voice recording per sentence with instant replay
- AI coaching endpoints for speaking feedback
- Caching for TTS, transcripts, and parsed script sessions

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local`:

```bash
DATABASE_URL=postgresql://...

DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat

GOOGLE_TTS_API_KEY=...
SUPADATA_API_KEY=...
```

## Database

```bash
npm run db:generate
npm run db:push
```

Optional migration runner:

```bash
npm run db:migrate
```

## Script Shadowing Controls

Current keyboard controls in script mode:

- `A` or `ArrowLeft`: previous sentence
- `D` or `ArrowRight`: next sentence
- `S` or `Space`: listen current sentence
- `ArrowDown`: listen current sentence
- `R` or `ArrowUp`: toggle recording

Recording behavior:

- Press once: start recording
- Press again: stop + submit transcript/audio turn
- After each completed recording, your voice auto replays after 1 second (1 time)

Sentence editing behavior:

- Edit the active sentence directly from the sentence card (pencil icon)
- `Ctrl/Cmd + Enter`: save edit
- `Esc`: cancel edit

## Useful Scripts

- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: run production build
- `npm run lint`: run lint checks
- `npm run clean:transcript`: clean transcript text via script
- `npm run db:generate`: generate Drizzle files
- `npm run db:push`: push schema to DB
- `npm run db:migrate`: run custom migration script

## API Routes (High Level)

- `/api/tts`: TTS generation/caching
- `/api/coach`: speaking coach flow
- `/api/voice`: speaking/voice assistant endpoint
- `/api/ai`: general AI helper endpoint
- `/api/shadowing/script`: script sentence cache endpoint
- `/api/shadowing/youtube/*`: YouTube transcript/translate/usage endpoints

## Project Structure (High Level)

- `app/`: routes, pages, API handlers
- `src/features/learning`: lesson and speaking coach UI
- `src/features/shadowing`: script/youtube shadowing flows
- `src/lib`: DB, cache, schema, server utilities
- `content/`: session markdown content
