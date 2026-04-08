# Scholarship Compass Aid

A web application to help students discover, apply for, and track scholarships. Admins can manage listings and review applications.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation
- **Package Manager**: npm

## Project Structure

- `scholarship-compass-aid-main/` — main project directory
  - `src/` — React source code
    - `components/` — reusable UI components (shadcn/ui in `ui/`)
    - `hooks/` — custom hooks (useAuth, use-toast, etc.)
    - `integrations/supabase/` — Supabase client + generated types
    - `pages/` — top-level page components
    - `lib/` — utility functions
  - `supabase/migrations/` — SQL migration files
  - `public/` — static assets

## Environment Variables

The app requires Supabase credentials:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key

## Development

```bash
cd scholarship-compass-aid-main
npm run dev
```

Runs on port 5000.

## Deployment

Configured as a static site. Build output goes to `scholarship-compass-aid-main/dist/`.
