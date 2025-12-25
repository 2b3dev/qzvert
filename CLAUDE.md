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
│   ├── explore.tsx     # Discover public creations
│   ├── creator.tsx     # User's creations dashboard
│   ├── login.tsx       # Authentication
│   ├── about.tsx       # About page
│   ├── contact.tsx     # Contact page
│   ├── pricing.tsx     # Pricing page
│   ├── privacy.tsx     # Privacy policy
│   └── creation/
│       ├── new.tsx     # Create new quiz/quest
│       ├── edit.$id.tsx  # Edit existing creation
│       └── play.$id.tsx  # Play quiz/quest
├── server/             # Server functions
│   ├── gemini.ts       # AI content generation
│   ├── creations.ts    # CRUD for creations, stages, questions
│   ├── storage.ts      # Image upload/delete to Supabase Storage
│   └── theme.ts        # Theme preference (dark/light)
├── stores/             # Zustand state stores
│   ├── auth-store.ts   # Authentication state
│   ├── creation-store.ts # Current creation state
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
Zustand stores in `src/stores/` for client-side state (auth, creation progress, profiles).

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_API_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `GEMINI_API_KEY` - Google Gemini API key (server-side only)

## Database Schema (Supabase)

### Tables
- `creations` - Creation metadata (title, description, thumbnail, tags, theme_config, type)
- `stages` - Learning stages with lesson summaries
- `questions` - Quiz questions with options and explanations
- `profiles` - User profiles with display name and avatar

### Storage Buckets
- `thumbnails` - Creation thumbnail images (public, max 5MB)

### Types
- `quiz` - Single quiz with multiple questions
- `quest` - Multi-stage learning journey with lessons and quizzes
- `flashcard` - Flashcard deck (future)
- `roleplay` - Role-play scenario (future)

### Database Setup SQL

```sql
-- Creations table
CREATE TABLE creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail text,
  tags text[],
  raw_content text NOT NULL,
  theme_config jsonb DEFAULT '{"theme": "adventure"}',
  is_published boolean DEFAULT false,
  play_count integer DEFAULT 0,
  type text NOT NULL CHECK (type IN ('quiz', 'quest', 'flashcard', 'roleplay'))
);

-- Stages table
CREATE TABLE stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id uuid REFERENCES creations(id) ON DELETE CASCADE,
  title text NOT NULL,
  lesson_summary text,
  order_index integer NOT NULL
);

-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_answer integer NOT NULL,
  explanation text,
  order_index integer NOT NULL
);

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Creations RLS Policies
CREATE POLICY "Users can view own creations" ON creations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own creations" ON creations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creations" ON creations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own creations" ON creations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view published creations" ON creations FOR SELECT USING (is_published = true);
```

### Storage Setup SQL

```sql
-- Create thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Storage policies
CREATE POLICY "Users can upload thumbnails to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own thumbnails" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for thumbnails" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'thumbnails');
```

## Gamification Features

- Lives system (configurable 1-5 or unlimited)
- Timer mode (optional, per-question countdown)
- Score tracking with time bonuses
- Visual progression through learning map
- Stage completion with star ratings
- Streak tracking
