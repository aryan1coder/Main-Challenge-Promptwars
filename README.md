# Civic Air Quality Briefing Studio

> **AI-Driven Civic Intelligence for Urban Environmental Governance**  
> *Developed for the PromptWars Warm-up Challenge*  
> **Repository:** [https://github.com/aryan1coder/warm-up](https://github.com/aryan1coder/warm-up)

---

## 1. Project Title
**Civic Air Quality Briefing Studio**  
*Turning Messy Environmental Sensor Data into Defensible, Role-Specific Civic Interventions*

---

## 2. Professional Project Overview
**Civic Air Quality Briefing Studio** is an open-source civic intelligence workbench for transforming noisy sensor datasets into traceable, role-specific findings. The browser performs deterministic parsing and calculations; when deployed with a server-side Gemini key, a Vercel function can synthesize a structured briefing. If that service is unavailable, the application clearly labels its deterministic rule-based briefing.

---

## 3. Problem Statement
During severe air pollution episodes, municipal ward officers, residential facility managers, and school principals are inundated with fragmented, heterogeneous data from low-cost monitors and regulatory stations. These datasets arrive in inconsistent formats ($\mu\text{g}/\text{m}^3$, $\text{ppm}$, sub-indices), suffer from sensor dropouts and flatlining, and lack contextual interpretation. Frontline decision-makers are left without actionable, defensible guidance to protect public health and manage municipal enforcement.

---

## 4. The Problem We Solve
- **Data Fragmentation & Messiness:** Raw CSVs from varied monitors have conflicting column headers, timestamps, and incompatible units.
- **Hallucination Risk in LLMs:** Standard AI dashboards frequently hallucinate statistical averages and peak measurements when given raw tables.
- **Generic City-Wide Alerts:** Broad advisory notices fail to inform specific operational jurisdictions (e.g., whether to dispatch mist cannons to Ward 4 or suspend morning assemblies at local schools).
- **Language & Comprehension Barriers:** Technical metrics ($\text{PM}_{2.5}$ at $340\,\mu\text{g}/\text{m}^3$) confuse everyday citizens who require clear, culturally accessible advice in their native language (e.g., Hindi).

---

## 5. Our Proposed Solution
A dual-layer hybrid architecture:
1. **Deterministic Statistical Core:** Browser-side JavaScript algorithms execute unit normalization, anomaly detection, statistical aggregation, and National Air Quality Index (NAAQS/EPA) calculations with 100% mathematical precision.
2. **Grounded AI Synthesis Engine:** A bounded set of calculated metrics is sent to the server-side Gemini 2.5 Flash endpoint. Provider failures produce a clearly labeled deterministic fallback, never a successful-looking simulated AI response.

---

## 6. Target Users
1. **Ward Municipal Officers:** Operational enforcement (road dust suppression, mechanical sweeping, traffic rerouting, diesel generator bans).
2. **Housing Society Managers:** Facility protection (HVAC filtration cycles, outdoor activity windows for children and seniors).
3. **School Administrators:** Student health (morning assembly cancellations, athletic suspensions, indoor air safety).
4. **General Citizens:** Actionable personal exposure management in plain language (Hindi and English).

---

## 7. Core Features

| Feature Module | Description | Implementation Status |
| :--- | :--- | :--- |
| **Tabular Data Ingestion** | Upload `.csv`/`.tsv`/`.txt` or paste data; 5 MB / 50,000-row limits and delimiter detection. | `Implemented` |
| **Unit Normalization Engine** | Normalizes supported gas units and maps common headers. | `Implemented; validate source units before use` |
| **Data Quality & Anomaly Filter** | Preserves missing values, flags negative values and sensor flatlines. | `Implemented` |
| **Deterministic AQI Calculator** | Computes CPCB sub-indices and identifies indicative versus qualified AQI. | `Implemented` |
| **Input Security** | Validates file size/type, bounds parser input, and relies on React text escaping. | `Implemented` |
| **Grounded AI Briefing Synthesis** | Server-side Gemini 2.5 Flash endpoint with strict request/output validation and labeled rule-based fallback. | `Implemented when server key is configured` |
| **Role-Specific Directives** | Provides tailored recommendations for Ward Officers, Housing Societies, Schools, and Citizens. | `Implemented; advisory only` |
| **Bilingual NLP Engine** | Produces English and Hindi advisories. | `Implemented` |
| **Briefing Persistence** | Stores briefing history in browser LocalStorage. | `Implemented locally; Firestore sync is not wired into the UI` |
| **Historical Delta Comparison** | Computes statistical shifts ($\Delta$) between past and present briefings. | `Planned (Phase 7)` |

---

## 8. Complete Application Workflow

```
[Messy CSV / Pasted Table]
           │
           ▼
[Deterministic Parser & Sanitizer] ──> Extracts columns, normalizes units, flags anomalies
           │
           ▼
[Deterministic Analytics Engine]  ──> Calculates Mean, Peaks, Missing %, NAAQS AQI
           │
           ▼
[Grounded Prompt Construction]    ──> Bundles calculated facts into structured schema
           │
           ▼
[Server-side Gemini 2.5 Flash]   ──> Structured synthesis (optional)
           │
           ▼
[Multi-Persona Briefing Studio]   ──> Ward Officer / Housing / School / Citizen Tabs
           │
           ▼
[Persistence & Comparison]        ──> Save to LocalStorage/Firestore; Compare Historical Deltas
```

---

## 9. AI Capabilities
- **Model:** `gemini-2.5-flash` through the server-side `/api/generate-briefing` endpoint.
- **Grounding:** The endpoint accepts only compact, validated aggregate metrics; model output is still labeled as generated and requires review.
- **Fallback:** When Gemini is unconfigured or unavailable, the UI labels a deterministic rule-based advisory and cites only available metrics.
- **Structured Output:** Provider JSON is schema-checked before being returned.

---

## 10. Evidence & Data Traceability
Every recommendation generated by the system includes an explicit evidentiary citation. For example:
> *"Recommendation: Suspend outdoor physical education."*  
> **Source Metric:** `PM2.5 Peak: 342 µg/m³ recorded at Station Ward-4 at 08:30 (AQI: Severe, >300).`

---

## 11. Role-Based Intelligence
- **Ward Officer:** Regulatory enforcement, mechanical sweeper dispatch, construction work stoppage mandates.
- **Housing Society:** Air purifier filter replacement cycles, HVAC fresh air intake dampers, resident advisories.
- **School Principal:** Modification of school hours, indoor physical education protocols, parental notifications.

---

## 12. Historical Comparison
The platform tracks sequential briefings across pollution episodes. Users can select an earlier baseline briefing to compute mathematical deltas ($\Delta$ Mean $\text{PM}_{2.5}$, $\Delta$ Peak Concentration) and receive an AI evaluation of intervention efficacy.

---

## 13. Multilingual Communication
Provides native bilingual communication:
- **English:** Executive technical briefing and public advisory.
- **Hindi (हिंदी):** Culturally localized public advisories and administrative notices rendered in Devanagari script.

---

## 14. Technology Stack

### Core Technologies
- **Runtime & Build Tool:** Node.js, [Vite 8.3.6](https://vite.dev/)
- **Frontend Framework:** [React 19.3.1](https://react.dev/) + React DOM
- **AI / LLM Integration:** Google Gemini 1.5 Flash via [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) (`^0.24.1`)
- **Cloud Persistence & Auth:** [Firebase v13.3.0](https://firebase.google.com/) (Auth, Firestore)
- **Icons:** [lucide-react](https://lucide.dev/) (`^1.72.0`)
- **Testing Framework:** [Vitest 5.1.0](https://vitest.dev/)
- **Code Hygiene:** [ESLint 10.14.0](https://eslint.org/) with Flat Config

---

## 15. System Architecture
For detailed system flowcharts, component hierarchies, and data tiering, consult the permanent architecture document:  
👉 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 16. Repository Structure

```
warm-up/
├── docs/                     # Comprehensive engineering documentation suite
│   ├── ARCHITECTURE.md       # Target vs verified architecture blueprint
│   ├── AI_ENGINEERING.md     # Gemini integration protocols and grounding rules
│   ├── DATA_INTEGRITY.md     # Ingestion, unit conversions, and AQI formulas
│   ├── DEVELOPMENT.md        # Developer setup, conventions, and workflows
│   ├── PROJECT_SPEC.md       # Official problem statement and requirements
│   ├── ROADMAP.md            # Phased development plan (Phases 0-10)
│   ├── SECURITY.md           # Secret management and vulnerability controls
│   └── TESTING.md            # Testing strategy, verification guidelines, and reports
├── public/                   # Static assets (favicons, SVG icons)
├── src/
│   ├── assets/               # Bundled static images
│   ├── lib/
│   │   └── googleServices.js # Gemini and Firebase client service module
│   ├── App.css               # Component styles
│   ├── App.jsx               # Current application component
│   ├── index.css             # Global typography and layout resets
│   └── main.jsx              # React 19 application entrypoint
├── tests/
│   └── app.test.js           # Vitest unit test suite
├── .env.example              # Documented environment variable template
├── .gitignore                # Git exclusion patterns
├── AGENTS.md                 # Constitutional operating manual for AI coding agents
├── eslint.config.js          # ESLint flat configuration
├── index.html                # Single-page HTML shell
├── package.json              # Project dependencies and lifecycle scripts
├── README.md                 # Root product overview and documentation
└── vite.config.js            # Vite build configuration
```

---

## 17. Installation Requirements
- **Node.js:** v18.0.0 or higher (v20+ LTS recommended)
- **npm:** v9.0.0 or higher

---

## 18. Local Development Setup

### Windows PowerShell:
```powershell
# 1. Clone the repository
git clone https://github.com/aryan1coder/warm-up.git
cd warm-up

# 2. Copy the environment configuration template
Copy-Item .env.example .env.local

# 3. For live Gemini locally, use the Vercel CLI and set GEMINI_API_KEY server-side.
#    Plain `npm run dev` uses the labeled deterministic fallback.

# 4. Install dependencies
npm install

# 5. Run the test suite
npm test

# 6. Start the local development server
npm run dev
```

### macOS / Linux:
```bash
# 1. Clone the repository
git clone https://github.com/aryan1coder/warm-up.git
cd warm-up

# 2. Copy the environment configuration template
cp .env.example .env.local

# 3. For live Gemini locally, use the Vercel CLI and set GEMINI_API_KEY server-side.
#    Plain `npm run dev` uses the labeled deterministic fallback.

# 4. Install dependencies
npm install

# 5. Run tests and start dev server
npm test
npm run dev
```

---

## 19. Environment Variables
Only Firebase web configuration uses client-side `VITE_` variables. Gemini credentials must remain server-side:

| Variable | Required? | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | Server-only Google AI Studio key for the Vercel endpoint. Never prefix it with `VITE_`. |
| `VITE_FIREBASE_API_KEY` | Optional | Firebase Web API key for cloud storage and authentication. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase project authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Firebase project ID for Cloud Firestore. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Optional | Firebase storage bucket identifier. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase Web application identifier. |

> [!NOTE]  
> If Firebase variables are omitted, real account sign-in is disabled and the explicitly labeled demo remains available. Local briefing history uses browser `localStorage`.

---

## 20. Google Gemini Integration Setup
1. Visit [Google AI Studio](https://aistudio.google.com/) and generate an API key.
2. Configure `GEMINI_API_KEY` in Vercel project settings. For local serverless testing, use the Vercel CLI and its server-side environment configuration.
   ```env
   GEMINI_API_KEY="your_actual_key"
   ```
3. The browser sends compact calculated summaries to `/api/generate-briefing`; the Gemini key is never bundled into browser code.

---

## 21. Database Configuration
- **Local Fallback:** By default, all briefings and uploaded datasets persist locally in browser storage.
- **Cloud Firestore (Optional):** Firebase configuration enables the service integration, but the current briefing-history UI persists locally. Configure restrictive Firestore security rules before using cloud writes; never use test-mode rules in production.

---

## 22. Running the Application
```powershell
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 23. Running Tests
The project uses Vitest for lightning-fast unit and boundary testing:
```powershell
# Run the test suite once
npm test

# Run tests in watch mode during development
npx vitest
```

---

## 24. Build and Deployment

### Production Build:
```powershell
npm run build
```
This compiles optimized static assets into the `/dist` directory.

### Preview Production Build:
```powershell
npm run preview
```

### Deployment Targets:
- **Firebase Hosting:**
  ```powershell
  npm run build
  firebase deploy --only hosting
  ```
- **Vercel / Netlify:** Connect repository and set build command to `npm run build` with output directory `dist`. Ensure `VITE_GEMINI_API_KEY` is configured in deployment environment variables.

---

## 25. Security Practices
- **No Secret Commits:** `.gitignore` strictly excludes `.env` and `.env.local`.
- **Input Sanitization:** User prompts and tables are sanitized to prevent XSS.
- **Client Security:** No service-account private keys are present in frontend bundles.
- Read full security guidelines: 👉 [docs/SECURITY.md](docs/SECURITY.md)

---

## 26. Data Integrity Policy
- **No Zero Substitution:** Missing readings remain `null` or are flagged as data gaps; they are never converted to zero.
- **Traceable Grounding:** AI interpretations must cite specific measured metrics.
- Read full data integrity standards: 👉 [docs/DATA_INTEGRITY.md](docs/DATA_INTEGRITY.md)

---

## 27. Known Limitations (Current State)
1. **Starter UI:** The current UI ([src/App.jsx](src/App.jsx)) is a raw input prompt runner; dedicated CSV upload, multi-column analytics grids, and tabbed persona views are scheduled for Phases 1 & 2.
2. **Batch Generation:** AI generation currently waits for complete model response; streaming responses (`generateContentStream`) are scheduled for Phase 4.
3. **Firebase Cloud Sync:** Firebase credentials fallback to demo keys if unconfigured, operating in offline-first mode.

---

## 28. Development Roadmap
Development follows a strict 10-phase roadmap:
- **Phase 0:** Repository Foundation & Standards (`IN PROGRESS`)
- **Phase 1:** Product UI & Design System (`PLANNED`)
- **Phase 2:** Data Import & Validation Engine (`PLANNED`)
- **Phase 3:** Backend & Persistence Layer (`PLANNED`)
- **Phase 4:** Genuine AI Intelligence Engine (`PLANNED`)
- **Phase 5:** Role-Based Recommendation Engine (`PLANNED`)
- **Phase 6:** Briefing & Multilingual Generator (`PLANNED`)
- **Phase 7:** Historical Comparison System (`PLANNED`)
- **Phase 8:** Integration & End-to-End Testing (`PLANNED`)
- **Phase 9:** Security, Optimization & Accessibility (`PLANNED`)
- **Phase 10:** Deployment & Judge-Ready Submission (`PLANNED`)

Read full roadmap details: 👉 [docs/ROADMAP.md](docs/ROADMAP.md)

---

## 29. Contribution Guidelines
1. Read the constitutional instructions in [AGENTS.md](AGENTS.md) before writing code.
2. Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`).
3. Ensure `npm test` and `npm run build` pass before requesting code reviews.
4. Read the developer workflow: 👉 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## 30. License and Credits
- **License:** MIT License. Free for open civic environmental governance use.
- **Created By:** Aryan Saxena ([@aryan1coder](https://github.com/aryan1coder)) for the **PromptWars Warm-up Challenge**.
