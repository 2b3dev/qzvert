# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**qzvert** - An AI-powered Micro-SaaS that transforms raw content (PDF, Video links, Text) into gamified "Learning Quests" using TanStack Start.

## Commands

```bash
bun run dev      # Start development server on port 3000
bun run build    # Build for production
bun run preview  # Preview production build
bun run test     # Run tests with Vitest
bun install      # Install dependencies
```

## Tech Stack

- **Framework:** TanStack Start (@tanstack/start)
- **Routing/SSR:** TanStack Router + Server Functions
- **Data Fetching:** TanStack Query
- **Styling:** Tailwind CSS v4 + Custom shadcn-style components
- **Animations:** Framer Motion
- **Database/Auth:** Supabase (PostgreSQL + Vector)
- **AI Engine:** Google Gemini API (via Server Functions)
- **State:** Zustand

## Architecture

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (Button, Card, Input, Progress)
│   ├── Header.tsx      # App header with navigation
│   ├── QuestCreator.tsx    # Content input and quest generation
│   ├── LearningMap.tsx     # Visual stage progression map
│   └── QuizPlayer.tsx      # Gamified quiz interface
├── routes/             # File-based routing (TanStack Router)
│   ├── __root.tsx      # Root layout
│   ├── index.tsx       # Landing page with quest creator
│   ├── explore.tsx     # Discover existing quests
│   └── quest/
│       ├── preview.tsx # Quest preview with learning map
│       └── play.tsx    # Active quiz gameplay
├── server/             # Server functions
│   └── gemini.ts       # AI quest generation
├── stores/             # Zustand state stores
│   └── quest-store.ts  # Game state management
├── lib/                # Utilities
│   ├── utils.ts        # cn() class merging
│   └── supabase.ts     # Supabase client
└── types/              # TypeScript types
    └── database.ts     # Database schema types
```

## Key Patterns

### Server Functions
Use `createServerFn` from `@tanstack/react-start` for server-side logic:
```typescript
export const myServerFn = createServerFn({ method: 'POST' })
  .validator((data: InputType) => data)
  .handler(async ({ data }) => { /* server code */ })
```

### Routes
File-based routing with `createFileRoute`:
```typescript
export const Route = createFileRoute('/path')({ component: MyComponent })
```

### State Management
Zustand stores in `src/stores/` for client-side state (quest progress, scores, lives).

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_API_KEY` - Supabase API key
- `GEMINI_API_KEY` - Google Gemini API key (server-side only)

## Database Schema (Supabase)

- `quests` - Quest metadata and theme config
- `stages` - Learning stages with lessons
- `quizzes` - Quiz questions per stage
- `embeddings` - Vector data for semantic search

## Gamification Features

- Lives system (configurable)
- Timer mode (optional)
- Score tracking with time bonuses
- Visual progression through learning map
- Stage completion with star ratings
