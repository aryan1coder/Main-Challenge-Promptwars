# Civic Air Quality Briefing Studio — Phased Development Roadmap

> **Document Version:** 1.0.0  
> **Status:** Active Roadmap  
> **Rule:** Never mark a future phase as completed until all acceptance criteria are built, tested, and verified with evidence.

---

## Roadmap Overview & Phase Status Tracker

| Phase | Phase Name | Status | Target Deliverable |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Repository Foundation & Standards** | **IN PROGRESS** | AGENTS.md, complete `/docs`, `.env.example`, audit baseline. |
| **Phase 1** | **Product UI & Design System** | **PLANNED** | High-fidelity civic dashboard, accessible layout, responsive panels. |
| **Phase 2** | **Data Import & Validation Engine** | **PLANNED** | Ingestion for CSV/tables, header mapping, anomaly detection, AQI math. |
| **Phase 3** | **Backend & Persistence Layer** | **PLANNED** | LocalStorage persistence, Cloud Firestore sync, session handling. |
| **Phase 4** | **Genuine AI Intelligence Engine** | **PLANNED** | Grounded Gemini 1.5 Flash integration, structured schemas, streaming. |
| **Phase 5** | **Role-Based Recommendation Engine**| **PLANNED** | Dedicated modules for Ward Officers, Housing Societies, Schools. |
| **Phase 6** | **Briefing & Multilingual Generator**| **PLANNED** | Hindi/English toggle, executive vs citizen reading levels. |
| **Phase 7** | **Historical Comparison System** | **PLANNED** | Delta ($\Delta$) comparison engine between past and current briefings. |
| **Phase 8** | **Integration & End-to-End Testing** | **PLANNED** | Full workflow tests, parser edge case suites, failure simulations. |
| **Phase 9** | **Security, Optimization & a11y** | **PLANNED** | WCAG 2.1 AA audit, bundle optimization, security policy check. |
| **Phase 10**| **Deployment & Judge-Ready Submission**| **PLANNED** | Firebase/Vercel live deployment, evaluator test guide, final video/demo. |

---

## Detailed Phase Specifications

---

### Phase 0: Repository Foundation & Standards
- **Status:** **IN PROGRESS**
- **Objectives:** Establish the technical constitution, documentation architecture, engineering rules, and verification standards for the repository.
- **Deliverables:**
  - `AGENTS.md` (Constitutional master instructions).
  - Complete `docs/` repository suite (8 technical documents).
  - Cleaned `.env.example` with exact variable documentation.
  - Comprehensive root `README.md` reflecting verified reality.
- **Dependencies:** Initial repository setup.
- **Acceptance Criteria:**
  - Zero hallucinated feature claims in documentation.
  - All Markdown links resolve correctly.
  - Clean `git status` with zero untracked scratch files.
- **Verification Requirements:**
  - `npm test` passes cleanly.
  - `npm run build` succeeds.

---

### Phase 1: Product UI & Design System
- **Status:** **PLANNED**
- **Objectives:** Construct a responsive, modern, and accessible civic dashboard interface replacing the bare starter layout.
- **Deliverables:**
  - Top navigation with project branding, live status indicator, and language selector.
  - Two-column / multi-panel workspace: Ingestion sidebar & Main Briefing console.
  - Role-selector tabs (Ward Officer, Housing Society, School Principal).
  - Accessible design system with CSS custom properties for high-contrast visibility.
- **Dependencies:** Phase 0.
- **Acceptance Criteria:**
  - Responsive across desktop (1440px), tablet (768px), and mobile (375px).
  - Zero non-functional or dead buttons.
  - Semantic HTML markup (`<main>`, `<header>`, `<nav>`, `<article>`).
- **Verification Requirements:**
  - Component rendering tests with Vitest.
  - Manual keyboard tab-navigation check.

---

### Phase 2: Data Import & Validation Engine
- **Status:** **PLANNED**
- **Objectives:** Build a high-performance, deterministic browser-side parsing and statistical analysis engine.
- **Deliverables:**
  - File uploader supporting `.csv`, `.tsv`, and `.txt` drag-and-drop.
  - Tabular text paste box with dynamic delimiter detection.
  - Dynamic header aliasing algorithm (`pm25`, `pm_25` $\to$ canonical `pm25`).
  - Unit normalization ($\text{ppm} \to \mu\text{g}/\text{m}^3$).
  - Anomaly filter detecting negative values, flatlining, and missing intervals.
  - Deterministic statistical engine calculating mean, median, 95th percentile, and NAAQS/EPA AQI sub-indices.
- **Dependencies:** Phase 1.
- **Acceptance Criteria:**
  - 10,000-row CSV processed in $< 300\text{ms}$.
  - Missing values counted and preserved without converting to $0$.
  - Informative error banners on malformed inputs.
- **Verification Requirements:**
  - Comprehensive unit test suite covering 10+ edge-case CSVs.

---

### Phase 3: Backend & Persistence Layer
- **Status:** **PLANNED**
- **Objectives:** Implement robust client-side storage with optional Cloud Firestore synchronization for persistent briefing records.
- **Deliverables:**
  - `storageService.js` managing LocalStorage / IndexedDB persistence.
  - Real-time Cloud Firestore integration when credentials are provided.
  - History drawer allowing users to load and review previous sessions.
- **Dependencies:** Phase 2.
- **Acceptance Criteria:**
  - Saved briefings survive page reloads and browser restarts.
  - Offline-first resilience when Firebase is unreachable.
- **Verification Requirements:**
  - Persistence unit tests verifying serialization and deserialization.

---

### Phase 4: Genuine AI Intelligence Engine
- **Status:** **PLANNED**
- **Objectives:** Connect Google Gemini 1.5 Flash using structured output schemas and factual grounding.
- **Deliverables:**
  - `src/lib/services/geminiService.js` with structured JSON schema support.
  - Grounding payload generator injecting pre-aggregated statistics into prompt context.
  - Real-time response streaming via `generateContentStream`.
  - Transparent error surfacing for rate limits (429) or timeouts.
- **Dependencies:** Phase 2, Phase 3.
- **Acceptance Criteria:**
  - Every AI generation triggers a genuine network request to Google AI Studio.
  - Zero canned responses on failure.
  - Every narrative claim cites a deterministic metric.
- **Verification Requirements:**
  - Live network inspection verifying genuine API payload and responses.

---

### Phase 5: Role-Based Recommendation Engine
- **Status:** **PLANNED**
- **Objectives:** Calibrate AI prompts to produce actionable, jurisdiction-specific interventions.
- **Deliverables:**
  - Ward Officer panel: Dust suppression, mechanical sweeping, traffic management.
  - Housing Society panel: Building HVAC filtration, outdoor exercise advisories.
  - School Administrator panel: Morning assembly cancellation, athletic protocol.
- **Dependencies:** Phase 4.
- **Acceptance Criteria:**
  - Directives reflect realistic civic and operational feasibility.
  - Interventions dynamically adjust based on computed AQI severity.
- **Verification Requirements:**
  - Qualitative verification across varying simulated pollution intensities (Moderate vs Severe vs Hazardous).

---

### Phase 6: Briefing & Multilingual Generator
- **Status:** **PLANNED**
- **Objectives:** Enable bilingual communication across multiple reading levels.
- **Deliverables:**
  - Language toggle supporting Hindi (Devanagari) and English.
  - Reading level switch (Technical Administrative vs Simplified Citizen).
  - Copy-to-clipboard, print-to-PDF, and export-as-Markdown features.
- **Dependencies:** Phase 5.
- **Acceptance Criteria:**
  - High-quality, culturally appropriate Hindi translation without grammatical breakage.
  - Exported briefings contain clean formatting.
- **Verification Requirements:**
  - Verification of Hindi output rendering and character encoding across browsers.

---

### Phase 7: Historical Comparison System
- **Status:** **PLANNED**
- **Objectives:** Build a visual and statistical comparative engine to assess intervention outcomes over time.
- **Deliverables:**
  - Side-by-side briefing comparison view.
  - Delta ($\Delta$) metrics calculation (percentage change in mean $\text{PM}_{2.5}$, peak reduction).
  - AI synthesis of historical trend: *"Intervention Efficacy Assessment"*.
- **Dependencies:** Phase 3, Phase 6.
- **Acceptance Criteria:**
  - Clear visual highlighting of improving vs worsening metrics.
- **Verification Requirements:**
  - Unit tests validating mathematical delta logic.

---

### Phase 8: Integration & End-to-End Testing
- **Status:** **PLANNED**
- **Objectives:** Execute exhaustive integration and automated end-to-end journey tests.
- **Deliverables:**
  - End-to-end test suite simulating full user journeys (Upload $\to$ Parse $\to$ Synthesize $\to$ Compare).
  - Malformed file fuzzing and rate-limit simulation.
- **Dependencies:** Phases 1–7.
- **Acceptance Criteria:**
  - Zero unhandled exceptions or console errors across complete user journeys.
- **Verification Requirements:**
  - Complete automated test suite run via `npm test`.

---

### Phase 9: Security, Optimization & Accessibility
- **Status:** **PLANNED**
- **Objectives:** Harden security policies, optimize performance, and achieve WCAG 2.1 AA compliance.
- **Deliverables:**
  - Code splitting in `vite.config.js` to bring vendor chunk under 300 kB.
  - Lighthouse accessibility audit score $\ge 95$.
  - Security review ensuring zero secret leakage.
- **Dependencies:** Phase 8.
- **Acceptance Criteria:**
  - Clean security checklist pass.
  - Full keyboard navigation functional.
- **Verification Requirements:**
  - Lighthouse audit report and bundle size analysis.

---

### Phase 10: Deployment & Judge-Ready Submission
- **Status:** **PLANNED**
- **Objectives:** Deploy live application to public hosting and prepare evaluator credentials and demo artifacts.
- **Deliverables:**
  - Live production URL (Firebase Hosting / Vercel).
  - Evaluator test kit containing sample CSV datasets (clean, dirty, severe episode).
  - Video walkthrough demonstration.
- **Dependencies:** Phase 9.
- **Acceptance Criteria:**
  - Live URL tested on clean browser environments without developer tools attached.
  - All 15 official problem statement requirements demonstrable.
- **Verification Requirements:**
  - Full hands-on evaluator simulation checklist pass.
