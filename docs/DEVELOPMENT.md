# Civic Air Quality Briefing Studio — Developer Guide & Conventions

> **Document Version:** 1.0.0  
> **Status:** Active Developer Guide

---

## 1. Local Environment Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ LTS recommended)
- **Package Manager:** `npm` v9+ (or `pnpm` / `yarn`)
- **Operating System:** Windows PowerShell, macOS zsh, or Linux bash

---

## 2. Quickstart Setup

### Windows PowerShell:
```powershell
# 1. Clone repository (if not already local)
git clone https://github.com/aryan1coder/warm-up.git
cd warm-up

# 2. Copy environment template
Copy-Item .env.example .env.local

# 3. Configure API Keys in .env.local
# Add your Google AI Studio Gemini API key:
# VITE_GEMINI_API_KEY="your-gemini-key"

# 4. Install dependencies
npm install

# 5. Run test suite
npm test

# 6. Start local development server
npm run dev
```

### macOS / Linux:
```bash
# 1. Clone and navigate
git clone https://github.com/aryan1coder/warm-up.git
cd warm-up

# 2. Copy environment template
cp .env.example .env.local

# 3. Configure API Keys
# Edit .env.local with your keys

# 4. Install dependencies
npm install

# 5. Run tests & dev server
npm test
npm run dev
```

---

## 3. Available Project Scripts

| Command | Action | Details |
| :--- | :--- | :--- |
| `npm run dev` | Starts Vite local dev server | Typically hosted at `http://localhost:5173`. Hot Module Replacement (HMR) active. |
| `npm test` | Runs test runner via Vitest | Runs all unit and integration tests in `tests/` in one pass. |
| `npm run build` | Compiles production assets | Builds bundle into `/dist` with tree-shaking and minification. |
| `npm run lint` | ESLint static analysis | Checks code style, React hooks rules, and potential syntax errors. |
| `npm run preview` | Previews production build | Serves `/dist` locally to verify production build behavior before deployment. |

---

## 4. Architectural & Coding Conventions

### 4.1 Project Directory Structure
```
warm-up/
├── docs/                     # Comprehensive engineering documentation
│   ├── ARCHITECTURE.md
│   ├── AI_ENGINEERING.md
│   ├── DATA_INTEGRITY.md
│   ├── DEVELOPMENT.md
│   ├── PROJECT_SPEC.md
│   ├── ROADMAP.md
│   ├── SECURITY.md
│   └── TESTING.md
├── public/                   # Static assets (favicons, SVG icons)
├── src/
│   ├── assets/               # Bundled images and icons
│   ├── components/           # Reusable React UI components (Phase 1)
│   ├── lib/                  # Business logic, math, parsers, and services
│   │   ├── analytics/        # Deterministic math, AQI, and hotspot algorithms (Phase 2)
│   │   ├── parsers/          # CSV, TSV, and unit normalization engines (Phase 2)
│   │   └── googleServices.js # Gemini and Firebase client integrations
│   ├── App.css               # Component-level styling
│   ├── App.jsx               # Top-level application component
│   ├── index.css             # Global typography, CSS variables, and layout resets
│   └── main.jsx              # React 19 application entrypoint
├── tests/                    # Vitest unit and integration suites
├── .env.example              # Documented environment variable template
├── .gitignore                # Git exclusion patterns
├── AGENTS.md                 # Engineering constitution for AI agents & contributors
├── eslint.config.js          # ESLint flat configuration
├── index.html                # Single-page HTML shell
├── package.json              # Project dependencies and lifecycle scripts
├── README.md                 # Root product overview and documentation
└── vite.config.js            # Vite build configuration
```

### 4.2 Component Design Guidelines
- **Functional Components Only:** Use React 19 functional components and standard hooks.
- **Single Responsibility:** Each component must own a single UI responsibility.
- **Props Validation:** Keep props typed or document object shapes clearly.
- **No Inline Bloat:** Extract repeated inline styles into CSS classes or CSS variables.

---

## 5. Branching & Commit Workflow

- **Branch Naming:**
  - `feat/<feature-name>` (e.g., `feat/csv-parser`)
  - `fix/<bug-name>` (e.g., `fix/aqi-breakpoint-math`)
  - `docs/<doc-name>` (e.g., `docs/update-roadmap`)
- **Conventional Commits:**
  - `feat: implement deterministic AQI breakpoint calculator`
  - `fix: prevent negative PM2.5 readings from corrupting average`
  - `test: add unit tests for mixed delimiter CSV parsing`
  - `docs: update system architecture verification matrix`
- **Git Push Rules:** Never force-push (`--force`). Never commit secrets or `.env.local` files.
