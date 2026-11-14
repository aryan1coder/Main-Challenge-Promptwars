# Civic Air Quality Briefing Studio — System Architecture

> **Document Version:** 1.0.0  
> **Status:** Architecture Blueprint (distinguishing Verified Implementation from Target Architecture)

---

## 1. System Overview & Implementation Status

The **Civic Air Quality Briefing Studio** combines deterministic browser-side mathematical computation with cloud-based generative AI and serverless persistence.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT (React 19)                       │
│                                                                        │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
│  │ Ingestion & Parsers  │  │ Deterministic Stats   │  │ UI State &  │  │
│  │ (CSV, TSV, Units)    │─>│ (AQI, Peaks, Gaps)    │─>│ Components  │  │
│  └──────────────────────┘  └───────────────────────┘  └──────┬──────┘  │
└──────────────────────────────────────────────────────────────┼─────────┘
                                                               │
                       HTTPS / WSS                             │
           ┌───────────────────────────────────────────────────┼───────────┐
           │                                                   │           │
           ▼                                                   ▼           ▼
┌─────────────────────────┐                         ┌─────────────────────────┐
│   Google Gemini API     │                         │   Firebase Services     │
│   (gemini-1.5-flash)    │                         │   (Auth & Firestore)    │
│  • Grounded Briefings   │                         │  • Google OAuth         │
│  • Role Interventions   │                         │  • Briefing Storage     │
│  • Bilingual NLP        │                         │  • Historical Deltas    │
└─────────────────────────┘                         └─────────────────────────┘
```

### Verification Matrix: Implemented vs. Target Architecture

| Subsystem | Target Architecture | Current Verified Implementation (Repository State) |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 + CSS Modules / Tailwind | React 19 + Vite 8.3.6 (Starter baseline with inline styles). |
| **Data Ingestion** | Flexible CSV/TSV parser with auto-header mapping | Textarea with basic length limiter (in progress). |
| **Math / Statistical Engine**| Deterministic calculation of AQI, peaks, and gaps | Not yet extracted into dedicated modules. |
| **AI Integration** | Gemini 1.5 Flash streaming via `@google/generative-ai` | Single-turn batch generation in `src/lib/googleServices.js`. |
| **Data Persistence** | Cloud Firestore + LocalStorage fallback | Basic Firestore write stub in `src/lib/googleServices.js`. |
| **Authentication** | Firebase Google Auth with user sessions | `loginWithGoogle` helper defined but not active in UI. |

---

## 2. Frontend Architecture

The frontend is constructed as a responsive Single Page Application (SPA) utilizing React 19:

- **Component Hierarchy:**
  - `App.jsx`: Global provider wrapper, theme manager, and top-level layout.
  - `Header`: Navigation, authentication status, and language switcher.
  - `IngestionPanel`: Dual-mode input (drag-and-drop CSV file uploader or raw text paste area) with real-time format validation.
  - `MetricsDashboard`: Deterministic telemetry grid displaying calculated metrics (mean $\text{PM}_{2.5}$, peak ward, sensor uptime %, data gap count).
  - `BriefingConsole`: Tabbed output container rendering:
    - *Internal Briefing Note* (Executive overview).
    - *Role Interventions* (Ward Officer / Housing / School).
    - *Citizen Advisory* (Simplified health alert).
  - `HistoryDrawer`: Visual log of saved historical briefings with one-click comparison triggers.

- **State Management:**
  - Local state managed via React hooks (`useState`, `useReducer`, `useMemo`).
  - Strict memoization of heavy tabular parsing computations to keep the UI at 60 FPS.

---

## 3. Data Processing Pipeline (Deterministic Core)

To guarantee scientific accuracy and prevent LLM hallucinations, all mathematical operations are performed deterministically in JavaScript before calling the AI model:

```
[Raw Input Stream]
       │
       ▼
[1. Lexical Tokenizer] ──> Extracts delimiters (comma, tab, semicolon), strips BOM
       │
       ▼
[2. Header Aliasing]   ──> Maps synonyms ('pm_25', 'pm-2.5', 'pm25') to canonical keys
       │
       ▼
[3. Unit Normalizer]   ──> Converts ppm/ppb to µg/m³; standardizes timestamps to ISO-8601
       │
       ▼
[4. Anomaly Filter]    ──> Rejects negative values, flags sensor flatlines (>5 equal consecutive readings)
       │
       ▼
[5. Stats Aggregator]  ──> Computes mean, median, 95th percentile, missing count, AQI category
       │
       ▼
[6. Grounding Context] ──> Synthesizes structured factual context object for Gemini prompt
```

---

## 4. AI Integration Architecture

The AI layer is strictly an **evidence-grounded reasoning and synthesis agent**, not a mathematical calculator.

- **Model:** `gemini-1.5-flash` via `@google/generative-ai`.
- **System Instructions:** Custom system prompts injected into every session establishing:
  1. Professional environmental scientist persona.
  2. Strict prohibition against inventing unrecorded values.
  3. Mandatory citation of provided metrics for every recommendation.
- **Structured Schema:** Responses are requested with strict JSON structures defining fields for:
  - `executiveSummary`
  - `airQualityStatus` (Good, Moderate, Unhealthy, Severe, Hazardous)
  - `confidenceScore` (High, Medium, Low based on missing data percentage)
  - `wardOfficerDirectives` (Array of specific enforcement actions)
  - `housingSocietyDirectives` (Array of resident safety steps)
  - `schoolDirectives` (Array of student safety steps)
  - `citizenAdvisory` (Multilingual public copy)
  - `uncertaintyNotes` (Data gaps and unmonitored wards)

---

## 5. Persistence & Database Architecture

Persistence utilizes a dual-tier approach:
1. **Local Tier (Client-First):** `localStorage` stores the active draft, recent uploads, and offline historical cache.
2. **Cloud Tier (Cloud Firestore):** When Firebase credentials are supplied:
   - Collection `/briefings`:
     ```json
     {
       "id": "briefing_xyz123",
       "createdAt": "2026-11-14T10:30:00Z",
       "userId": "firebase_auth_uid_or_anonymous",
       "datasetMetadata": {
         "rowCount": 1440,
         "missingCount": 32,
         "dateRange": "2026-11-13 to 2026-11-14",
         "primaryPollutant": "PM2.5"
       },
       "calculatedMetrics": {
         "averagePM25": 142.5,
         "peakPM25": 312.0,
         "aqiCategory": "Very Poor"
       },
       "aiBriefing": { ... }
     }
     ```

---

## 6. Failure & Resilience Handling

- **Malformed Data / CSV Error:** The parser flags row-level errors without crashing the entire dataset. A summary banner informs the user: *"12 rows skipped due to invalid date formats"*.
- **Gemini API Rate Limit (HTTP 429) / Quota Exhaustion:** The client surfaces an explicit warning banner with a countdown timer or retry trigger. It **never** displays fake pre-written briefings.
- **Firebase Network Drop:** Seamlessly falls back to local browser storage with an unobtrusive indicator: *"Saved locally. Cloud sync pending."*

---

## 7. Architectural Decisions & Trade-Offs

| Decision | Selected Option | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Compute Location** | Browser-side client parsing | Serverless backend API | Zero latency, works offline, eliminates backend hosting costs, 100% free-tier compliant. |
| **AI Model** | Gemini 1.5 Flash | Gemini 1.5 Pro | Flash offers sub-2s latency, high rate limits, low token cost, and ample context capacity for tabular summaries. |
| **Styling Strategy** | Clean CSS System / CSS Modules | Heavy UI Component Library | Minimizes bundle size, eliminates dependency rot, ensures fast load times. |
| **Math Execution** | Deterministic JS Algorithms | LLM-based calculations | LLMs frequently hallucinate averages and maximums; deterministic JS math guarantees 100% mathematical truth. |
