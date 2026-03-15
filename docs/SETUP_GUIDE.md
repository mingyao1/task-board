# Setup Guide — From Zero to Development

A step-by-step guide for setting up the Task Board project from creating the GitHub repo through to running locally with Claude Code or GitHub Copilot.

---

## Phase 1: Create the GitHub Repository

### Step 1: Create the repo on GitHub

1. Go to https://github.com/new
2. **Repository name:** `task-board` (or your preferred name)
3. **Visibility:** Private (you can share the link later; switch to public before submission if you prefer)
4. **Initialize with:** check "Add a README file"
5. **Add .gitignore:** select `Node` template
6. Click **Create repository**

### Step 2: Clone locally

```bash
git clone https://github.com/YOUR_USERNAME/task-board.git
cd task-board
```

### Step 3: Set up the folder structure

```bash
# Create documentation directory
mkdir -p docs

# Create frontend structure
mkdir -p frontend/src/{api,components/{layout,board,task,team,labels,filters,ui},hooks,context,types,lib,styles}

# Create backend structure
mkdir -p backend/cmd/server
mkdir -p backend/internal/{config,middleware,handlers,models,services,database}
```

### Step 4: Add the documentation files

Copy the following files into your repo from the generated outputs:

```
task-board/
├── CLAUDE.md              ← Agent instructions (root level for Claude Code)
├── docs/
│   ├── REQUIREMENTS.md    ← Full requirements
│   ├── API.md             ← Go API specification
│   ├── DATABASE.md        ← SQL schema + RLS policies
│   └── FRONTEND.md        ← Frontend architecture + design system
```

> **Important:** `CLAUDE.md` goes at the project root. Claude Code automatically reads this file when you open the project.

### Step 5: Update .gitignore

Replace the GitHub-generated `.gitignore` with a comprehensive one:

```gitignore
# Dependencies
node_modules/
frontend/node_modules/

# Build outputs
frontend/dist/
backend/bin/

# Environment files
.env
.env.local
.env.*.local
frontend/.env
backend/.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Go
backend/vendor/
*.exe
*.exe~
*.dll
*.so
*.dylib

# Logs
*.log
npm-debug.log*
```

### Step 6: Initial commit

```bash
git add .
git commit -m "chore: initial project setup with documentation"
git push origin main
```

---

## Phase 2: Set Up Supabase

### Step 1: Create a Supabase project

1. Go to https://supabase.com and sign in (free tier)
2. Click **New Project**
3. Choose your organization
4. **Project name:** `task-board`
5. **Database password:** generate a strong password and save it
6. **Region:** choose the closest to you (e.g., US East)
7. Wait for the project to provision (~2 minutes)

### Step 2: Enable Anonymous Auth

1. In Supabase dashboard, go to **Authentication > Providers**
2. Scroll to **Anonymous Sign-Ins**
3. Toggle it **ON**
4. Click **Save**

### Step 3: Run the database schema

1. Go to **SQL Editor** in the Supabase dashboard
2. Open `docs/DATABASE.md` from your repo
3. Copy and run each SQL block in order:
   - UUID extension
   - `tasks` table
   - `team_members` table
   - `task_assignees` table
   - `labels` table
   - `task_labels` table
   - `comments` table
   - `activity_logs` table
   - `updated_at` trigger
   - All RLS enable statements
   - All RLS policies
4. Run the verification queries to confirm everything is set up

### Step 4: Get your credentials

1. Go to **Settings > API** in Supabase dashboard
2. Note these values (you'll need them for `.env` files):
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **JWT Secret** (under "JWT Settings" — used by Go backend)

---

## Phase 3: Initialize the Frontend

### Step 1: Scaffold with Vite

```bash
cd frontend
npm create vite@latest . -- --template react-ts
```

If it asks to overwrite, say yes (since the directory exists).

### Step 2: Install dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @supabase/supabase-js lucide-react date-fns clsx tailwind-merge

npm install -D tailwindcss postcss autoprefixer @types/react @types/react-dom
npx tailwindcss init -p
```

### Step 3: Configure Tailwind

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Update `src/styles/globals.css` (or `src/index.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Create environment file

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8080/api/v1
```

### Step 5: Verify it runs

```bash
npm run dev
```

Open http://localhost:5173 — you should see the Vite + React default page.

---

## Phase 4: Initialize the Go Backend

### Step 1: Initialize Go module

```bash
cd ../backend
go mod init github.com/YOUR_USERNAME/task-board/backend
```

### Step 2: Install dependencies

```bash
go get github.com/go-chi/chi/v5
go get github.com/go-chi/cors
go get github.com/golang-jwt/jwt/v5
go get github.com/joho/godotenv
```

### Step 3: Create environment file

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
PORT=8080
FRONTEND_URL=http://localhost:5173
```

### Step 4: Create entry point

Create `backend/cmd/server/main.go` with a basic health check to verify setup:

```go
package main

import (
    "log"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/go-chi/cors"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{"http://localhost:5173"},
        AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    }))

    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    log.Println("Server starting on :8080")
    http.ListenAndServe(":8080", r)
}
```

### Step 5: Verify it runs

```bash
go run cmd/server/main.go
```

Visit http://localhost:8080/health — should return "ok".

---

## Phase 5: Set Up Your AI Agent

### Option A: Claude Code

1. Open the project root in your terminal
2. Run `claude` to start Claude Code
3. Claude Code automatically reads `CLAUDE.md` at the project root
4. Start with: "Read the docs/ folder and then help me implement the auth flow and basic board layout"

**Tips for Claude Code:**
- Keep `CLAUDE.md` at the root — it's the first thing Claude reads
- Reference specific doc files: "Follow the API spec in docs/API.md to build the tasks handler"
- Work in implementation order from the CLAUDE.md file
- Commit after each major feature

### Option B: GitHub Copilot in VS Code

1. Open the project in VS Code
2. Ensure GitHub Copilot extension is installed and signed in
3. Open Copilot Chat (Ctrl/Cmd + Shift + I)
4. Use `@workspace` to reference project files:
   - `@workspace Read CLAUDE.md and docs/REQUIREMENTS.md, then help me set up the Supabase auth flow`
5. Pin relevant doc files as context in Copilot Chat

**Tips for Copilot:**
- Open the relevant `.md` file in a tab — Copilot uses open files as context
- Use inline completions for boilerplate (components, handlers)
- Use Chat for architectural decisions and complex logic

---

## Phase 6: Development Workflow

### Branch strategy (simple)

```bash
# Feature branches off main
git checkout -b feat/board-layout
# ... work ...
git add .
git commit -m "feat: implement kanban board layout with columns"
git push origin feat/board-layout
# Merge to main when stable
```

### Suggested commit flow

```
chore: initial project setup with documentation
feat: supabase client and anonymous auth flow
feat: go backend skeleton with auth middleware
feat: task CRUD endpoints
feat: board layout with columns
feat: drag-and-drop with dnd-kit
feat: task detail slide-over panel
feat: team members CRUD and assignment
feat: labels CRUD and filtering
feat: task comments
feat: activity log
feat: search and filters
feat: board stats sidebar
feat: due date urgency indicators
feat: loading skeletons and empty states
feat: error handling with toast notifications
feat: responsive layout
chore: deploy frontend to vercel
docs: final assessment document
```

### Running both servers during development

**Terminal 1 (Frontend):**
```bash
cd frontend
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd backend
go run cmd/server/main.go
```

Frontend runs on http://localhost:5173, backend on http://localhost:8080.

---

## Phase 7: Deploy to Vercel

### Step 1: Push all code to GitHub

```bash
git add .
git commit -m "feat: complete task board application"
git push origin main
```

### Step 2: Deploy frontend

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New > Project**
3. Import your `task-board` repo
4. **Framework preset:** Vite
5. **Root directory:** `frontend`
6. **Environment variables:** Add your `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`
7. Click **Deploy**

### Step 3: Backend hosting (optional)

For the assessment, you can either:
- **Skip Go backend hosting** and call Supabase directly from the frontend (simpler)
- Host the Go backend on **Fly.io** or **Railway** (free tier) if you want to demonstrate the API layer

If calling Supabase directly, the frontend API client can use the Supabase JS client instead of your Go API. You can still include the Go backend code in the repo to show your work.

### Step 4: Update Supabase CORS

If going direct-to-Supabase from the frontend, no extra CORS config is needed (Supabase handles it). If using the Go backend, update the `FRONTEND_URL` env var to your Vercel URL.

---

## Quick Reference: Key Commands

| Action | Command |
|--------|---------|
| Start frontend | `cd frontend && npm run dev` |
| Start backend | `cd backend && go run cmd/server/main.go` |
| Build frontend | `cd frontend && npm run build` |
| Build backend | `cd backend && go build -o bin/server cmd/server/main.go` |
| Lint frontend | `cd frontend && npx tsc --noEmit` |
| New Go dependency | `cd backend && go get <package>` |
| New npm dependency | `cd frontend && npm install <package>` |
