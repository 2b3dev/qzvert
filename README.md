# QzVert

AI-powered Micro-SaaS that transforms raw content (PDF, Video links, Text) into gamified **Learning Quests** and **Smart Quizzes**.

## Features

- **AI-Powered Generation** - Transform any content into interactive quizzes using Google Gemini
- **Smart Quiz** - Quick quiz generation from your content
- **Quest Mode** - Multi-stage learning journey with lessons and quizzes
- **Gamification** - Lives system, timer mode, score tracking, streaks
- **Visual Progress** - Learning map with stage progression and star ratings
- **Dark/Light Theme** - System preference or manual toggle
- **Image Upload** - Thumbnail support via Supabase Storage

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start)
- **Routing:** [TanStack Router](https://tanstack.com/router) (file-based)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Rich Text:** [TipTap](https://tiptap.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Database/Auth:** [Supabase](https://supabase.com/)
- **AI:** [Google Gemini API](https://ai.google.dev/)
- **State:** [Zustand](https://zustand-demo.pmnd.rs/)

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) or npm/yarn
- Node.js 18+
- Supabase project
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd qzvert

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

Configure your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_API_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Database Setup

See [CLAUDE.md](CLAUDE.md) for database and storage setup SQL.

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Lint and format
pnpm check
```

## Project Structure

```
src/
├── components/     # React components (UI, Header, Footer, etc.)
├── routes/         # File-based routing
├── server/         # Server functions (Gemini, CRUD, Storage)
├── stores/         # Zustand state stores
├── lib/            # Utilities
└── types/          # TypeScript types
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests with Vitest |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm check` | Format and lint fix |
| `pnpm clean` | Clean build artifacts |
