# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QzVert** - An AI-powered Micro-SaaS that transforms raw content (PDF, Video links, Text) into gamified "Learning Quests" and "Smart Quizzes" using TanStack Start.

## Commands

```bash
pnpm dev      # Start development server on port 3000
pnpm build    # Build for production
pnpm preview  # Preview production build
pnpm test     # Run tests with Vitest
pnpm install  # Install dependencies
```

## Tech Stack

- **Framework:** TanStack Start (@tanstack/start)
- **Routing/SSR:** TanStack Router + Server Functions
- **Data Fetching:** TanStack Query
- **Styling:** Tailwind CSS v4 + Custom shadcn-style components
- **Rich Text:** TipTap editor
- **Animations:** Framer Motion
- **Database/Auth:** Supabase (PostgreSQL + Storage)
- **AI Engine:** Google Gemini API (via Server Functions)
- **State:** Zustand
- **Notifications:** Sonner (toast)

## Architecture

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── image-input.tsx    # Image upload with Supabase Storage
│   │   └── rich-text-editor.tsx
│   ├── icon/           # Custom icons
│   ├── Header.tsx      # App header with navigation & auth
│   ├── Footer.tsx      # App footer
│   ├── QuestCreator.tsx    # Content input and quest generation
│   ├── QuizSettings.tsx    # Quiz configuration (lives, timer)
│   ├── LearningMap.tsx     # Visual stage progression map
│   └── QuizPlayer.tsx      # Gamified quiz interface
├── routes/             # File-based routing (TanStack Router)
│   ├── __root.tsx      # Root layout with theme
│   ├── index.tsx       # Landing page
│   ├── explore.tsx     # Discover public activities
│   ├── creator.tsx     # User's activities dashboard
│   ├── login.tsx       # Authentication
│   ├── about.tsx       # About page
│   ├── contact.tsx     # Contact page
│   ├── pricing.tsx     # Pricing page
│   ├── privacy.tsx     # Privacy policy
│   └── activity/
│       ├── new.tsx     # Create new quiz/quest
│       ├── me.tsx      # User's activities list
│       ├── edit.$id.tsx  # Edit existing activity
│       └── play.$id.tsx  # Play quiz/quest
├── server/             # Server functions
│   ├── gemini.ts       # AI content generation
│   ├── activities.ts   # CRUD for activities, stages, questions
│   ├── storage.ts      # Image upload/delete to Supabase Storage
│   └── theme.ts        # Theme preference (dark/light)
├── stores/             # Zustand state stores
│   ├── auth-store.ts   # Authentication state
│   ├── activity-store.ts # Current activity state
│   └── profile-store.ts  # User profile state
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
  .inputValidator((data: InputType) => data)
  .handler(async ({ data }) => { /* server code */ })
```

### Routes
File-based routing with `createFileRoute`:
```typescript
export const Route = createFileRoute('/path')({ component: MyComponent })
```

### State Management
Zustand stores in `src/stores/` for client-side state (auth, activity progress, profiles).

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_API_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `GEMINI_API_KEY` - Google Gemini API key (server-side only)

## Database Schema (Supabase)

### Tables
- `activities` - Activity metadata (title, description, thumbnail, tags, theme_config, type)
- `stages` - Learning stages with lesson summaries (references activity_id)
- `questions` - Quiz questions with options and explanations
- `profiles` - User profiles with display name and avatar
- `activity_pending_invites` - Email invites for private group activities

### Storage Buckets
- `thumbnails` - Activity thumbnail images (public, max 5MB)

### Types
- `quiz` - Single quiz with multiple questions
- `quest` - Multi-stage learning journey with lessons and quizzes
- `flashcard` - Flashcard deck (future)
- `roleplay` - Role-play scenario (future)

## Gamification Features

- Lives system (configurable 1-5 or unlimited)
- Timer mode (optional, per-question countdown)
- Score tracking with time bonuses
- Visual progression through learning map
- Stage completion with star ratings
- Streak tracking
