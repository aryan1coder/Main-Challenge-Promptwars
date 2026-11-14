# AGENTS.md — Engineering Constitution & Operating Manual

> **Repository:** [https://github.com/aryan1coder/warm-up](https://github.com/aryan1coder/warm-up)  
> **Project:** Civic Air Quality Briefing Studio  
> **Competition:** PromptWars — Warm-up Challenge  
> **Target Audience:** All AI coding agents, autonomous contributors, and human developers operating within this repository.

---

## 1. Project Identity

**Civic Air Quality Briefing Studio** is an AI-driven civic intelligence platform designed to transform raw, noisy, and heterogeneous air-quality datasets into traceable scientific findings, role-tailored administrative interventions, historical comparative assessments, and multilingual public advisories.

The platform bridges environmental data science with frontline municipal and community governance. It ingests messy sensor tables, applies rigorous mathematical and unit normalization, identifies spatial-temporal pollution hotspots, and leverages Google Gemini 1.5 Flash to synthesize targeted briefings without ever substituting live model output with fabricated or canned text.

---

## 2. Official Problem Statement Requirements

Every architectural decision and feature implementation must directly advance the following 15 core requirements:

1. **Flexible Ingestion:** Support uploading CSV files or directly pasting raw, messy tabular air-quality data.
2. **Format & Unit Normalization:** Robustly interpret inconsistent column headers, timestamps, and measurement units (e.g., $\mu\text{g}/\text{m}^3$, $\text{ppm}$, $\text{ppb}$, AQI sub-indices).
3. **Data Quality & Anomaly Detection:** Programmatically detect missing readings, sensor dropouts, flatlining, and physically implausible values.
4. **Trend Analysis:** Compute summary statistics, diurnal variances, baseline drift, and rolling averages.
5. **Hotspot Identification:** Isolate spatial micro-climates, vulnerable monitoring wards, and peak exposure windows.
6. **Evidence-Grounded Explanations:** Provide explanations where every narrative insight links explicitly to mathematical aggregations or raw sensor observations.
7. **Role-Tailored Interventions:** Generate actionable, domain-appropriate recommendations calibrated for specific operational jurisdictions.
8. **Primary Stakeholder Personas:** Explicitly support:
   - **Ward Officers:** Operational enforcement, mechanical sweeping, dust suppression, traffic diversion, and construction halts.
   - **Housing Society Managers:** HVAC filtration schedules, outdoor activity advisories for children/seniors, and indoor air safety.
   - **School Administrators:** Morning assembly adjustments, physical education suspensions, and sensitive student notifications.
9. **Internal Briefing Notes:** Generate formal, data-dense technical reports for administrative coordination.
10. **Public Citizen Advisories:** Generate easily comprehensible public notices with clear health risk indicators.
11. **Multilingual & Multi-Reading Level Support:** Deliver briefings across multiple languages (e.g., Hindi, English) and reading levels (executive, layman, community elder).
12. **Briefing Persistence:** Store briefings, parsed datasets, and evaluation metrics in Cloud Firestore / local cache for persistence.
13. **Historical Trend Comparison:** Enable delta comparisons between historical briefings and live data to assess intervention efficacy.
14. **Uncertainty & Gap Flagging:** Explicitly articulate data gaps, low-confidence sensors, and unmonitored periods rather than smoothing them away.
15. **Vulnerable Population Protection:** Emphasize targeted protective protocols for children, asthmatics, outdoor laborers, and the elderly using evidence-based guidelines.

---

## 3. Six Judging Parameters

All engineering work is evaluated against six weighted criteria. No category may be neglected:

| Weight | Parameter | Core Expectations |
| :--- | :--- | :--- |
| **HIGH IMPACT** | **1. Code Quality** | Modular architecture, reusable components, strict TypeScript/ESLint hygiene, clear naming conventions, low cyclomatic complexity, zero dead code. |
| **HIGH IMPACT** | **2. Problem Statement Alignment** | Direct solution to the civic air briefing brief. Every feature must serve the 15 requirements. Zero unrelated vanity features. |
| **MEDIUM IMPACT**| **3. Security** | Complete key protection, strict input sanitization, safe error handling, least-privilege Firestore rules, no exposed service secrets. |
| **MEDIUM IMPACT**| **4. Efficiency** | Minimal client bundle size, optimized Gemini API token usage, response caching, sub-second deterministic calculations in JS, efficient re-renders. |
| **LOW IMPACT** | **5. Testing** | Unit tests for math/parsers, integration tests for API workflows, component testing, real assertions, reproducible test commands. |
| **LOW IMPACT** | **6. Accessibility** | WCAG 2.1 AA compliance, keyboard navigation, semantic HTML (`main`, `nav`, `section`, `header`), aria live regions for streaming, accessible color contrast. |

---

## 4. Zero-Disqualification Policy

Evaluators conduct hands-on testing with adversarial inputs and network inspection. Violation of these rules triggers immediate disqualification:

1. **No Static or Hardcoded Mockups:** Every button, tab, and slider must execute real logic. Never render dummy stats or static SVG charts claiming to be live calculations.
2. **No Fabricated Production Data:** Do not seed fake readings and present them as live sensor data. If synthetic test sets are provided, label them explicitly as `Benchmark Dataset`.
3. **No Hallucinated or Canned AI Outputs:** Every AI-powered briefing must invoke the genuine Google Gemini API. Never fall back to pre-written hardcoded responses to simulate success during network drops.
4. **Honest Failure States:** When an API rate limit or validation failure occurs, surface a clean, transparent, informative error banner with actionable recovery steps.
5. **No False-Positive Test Assertions:** Never write superficial tests like `expect(true).toBe(true)` to inflate test metrics. Test actual boundary conditions and parser failures.
6. **No Staged Demonstrations:** If a feature cannot handle an arbitrary valid CSV uploaded by a judge, it is considered broken.

---

## 5. Mandatory Engineering Standards

- **Think and Audit First:** Never write code before inspecting existing file dependencies, configurations, and test runners.
- **Strict Separation of Concerns:**
  - `src/lib/parsers/`: Deterministic CSV, table, and unit parsing.
  - `src/lib/analytics/`: Deterministic statistics, AQI index computation, and hotspot algorithms.
  - `src/lib/services/`: External API calls (Gemini, Firebase) with schemas and error wrappers.
  - `src/components/`: Modular, accessible React UI components.
- **Deterministic Math First:** Calculate averages, peaks, percentiles, missing counts, and sub-indices in deterministic JavaScript. Feed these calculated metrics into Gemini prompts as grounded facts; **never ask LLMs to calculate averages or find mathematical maximums from raw tables**.
- **No Unused Code or Bloat:** Audit imports regularly. Remove dead CSS and unused packages.

---

## 6. AI Engineering Rules

1. **Model Selection:** Use `gemini-1.5-flash` for high-throughput, low-latency reasoning and multilingual extraction.
2. **Strict System Instructions:** Anchor Gemini with role-specific system prompts defining tone, schema, and evidentiary constraints.
3. **Structured Outputs:** Enforce structured JSON schemas (`responseMimeType: "application/json"`) for programmatic consumption, paired with runtime schema validation (e.g., Zod or type guards).
4. **Evidence Grounding:** Prompts must require the model to cite the exact metric, location name, or timestamp corresponding to every factual assertion.
5. **Temperature Discipline:** Keep `temperature` low ($\le 0.2$) for analytical summaries and compliance briefings to minimize variance.
6. **Token & Rate Management:** Truncate inputs systematically after statistical preprocessing rather than dumping thousands of raw CSV rows into the context window.
7. **Streaming User Experience:** Use `generateContentStream` for streaming public advisories, keeping the user informed with visible token delivery.

---

## 7. Data Integrity Rules

The application enforces a strict operational taxonomy across six distinct data tiers:

```
[ Tier 1: Raw Observed ] ──> [ Tier 2: Normalized ] ──> [ Tier 3: Calculated Metrics ]
                                                                   │
                                                                   ▼
[ Tier 5: Recommendations ] <── [ Tier 4: AI Interpretations ] <───┘
```

- **Tier 1 (Raw Observed):** Immutable original user inputs (CSV strings, pasted text).
- **Tier 2 (Normalized):** Sanitized readings converted to standard SI units ($\mu\text{g}/\text{m}^3$ for $\text{PM}_{2.5}/\text{PM}_{10}$, $\text{ppm}$ for gases, ISO-8601 for time).
- **Tier 3 (Calculated Metrics):** Programmatic counts, min/max, rolling averages, and EPA/NAAQS AQI sub-indices.
- **Tier 4 (AI Interpretations):** Natural language synthesis generated by Gemini from Tier 2 & 3 facts.
- **Tier 5 (Role Recommendations):** Prescriptive interventions generated for specific stakeholders.
- **Tier 6 (Data Gaps / Quality Flags):** Explicit records of missing timestamps, NaN values, sensor saturation, or zero-variance runs.

**Absolute Prohibitions:**
- Never replace missing values (`null`, `NaN`) with `0`. A reading of $0\,\mu\text{g}/\text{m}^3$ implies perfectly clean air, corrupting safety assessments.
- Never invent coordinates or timestamps.
- Never mix raw $\text{ppm}$ and $\mu\text{g}/\text{m}^3$ values into an unweighted arithmetic mean.

---

## 8. Security Rules

1. **Environment Variables:**
   - Keys required on the client side must use the `VITE_` prefix and be documented in `.env.example`.
   - Never commit `.env`, `.env.local`, or any private keys to Git.
   - Regularly verify `.gitignore` covers `.env*` exceptions.
2. **Input Sanitization:**
   - Sanitize against script injection and prototype pollution.
   - Do NOT aggressively strip `<>` characters if it damages valid code or mathematical formulas; instead, use safe string escaping and React's built-in JSX rendering protections.
3. **Cloud Firestore Rules:**
   - Disallow unauthenticated writes to production collections if deployed.
   - Scope user-saved briefings to authenticated user IDs or segregated session namespaces.

---

## 9. Testing & Quality Verification Rules

No feature is marked complete without documented verification:

1. **Unit Testing:** Vitest test suites covering parsing logic, unit normalization, AQI math, and sanitization edge cases.
2. **Parser Boundary Tests:** Verify parser behavior when fed:
   - Empty files.
   - Files with only headers.
   - Mixed delimiters (comma, tab, semicolon).
   - Extra/missing columns.
   - Extreme out-of-range sensor values (e.g., negative readings, $>1000\,\mu\text{g}/\text{m}^3$).
3. **Build Health:** The project must build cleanly with zero fatal errors via `npm run build`.
4. **Honest Reporting:** Every testing report must clearly label tests as `Passed`, `Failed`, or `Unverified`.

---

## 10. Git & Contribution Workflow

- **Branch Discipline:** All work occurs on `main` or clean feature branches as designated.
- **Commit Format:** Conventional Commits:
  - `feat: <description>`
  - `fix: <description>`
  - `docs: <description>`
  - `test: <description>`
  - `refactor: <description>`
- **Strict Prohibition on Force Push:** Never run `git push --force` or overwrite Git history.
- **Approval Gate:** Never push to the GitHub remote without explicit authorization from the lead engineer. Always output the exact commands for human verification.
