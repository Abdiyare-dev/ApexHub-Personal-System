# ApexHub Personal System

A personal development system for managing tasks, projects, habits, finances, goals, and visual roadmaps.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript
- **Database & Auth:** Supabase (Postgres + Auth + Realtime)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Export:** jspdf, xlsx
- **PWA:** Installable progressive web app

## Getting Started

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd ApexHub-Personal-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and fill in your Supabase project URL and anon key.

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── components/     # UI components (Dashboard, Finance, Productivity)
├── context/        # React context providers (Auth, Finance, Productivity, Theme)
├── lib/            # Supabase client configuration
└── data/           # Static data and constants
```
