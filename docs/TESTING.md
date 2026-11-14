# Civic Air Quality Briefing Studio — Testing Strategy & Verification Plan

> **Document Version:** 1.0.0  
> **Status:** Active QA Framework

---

## 1. Testing Philosophy & Zero False-Positive Mandate

In adherence to the **PromptWars Zero-Disqualification Policy**, tests must represent genuine assertions against actual business logic. 

**Prohibitions:**
- Superficial tests written solely to inflate pass rates (e.g. `expect(1).toBe(1)`).
- Mocking out the entire application to the point where actual execution is never validated.
- Claiming test passes without executing the test runner.

---

## 2. Test Pyramid & Tooling

```
            ▲
           / \
          /   \     E2E / Evaluator Manual Tests
         /-----\    (Full ingest-to-briefing journey)
        /       \
       /         \   Integration Tests
      /-----------\  (Gemini API schema validation & Firestore sync)
     /             \
    /               \  Unit & Boundary Tests (Vitest)
   /-----------------\ (CSV parsers, AQI math, sanitization)
```

- **Runner:** `vitest` (`^5.1.0`)
- **Execution Command:** `npm test` or `npx vitest run`

---

## 3. Test Suites Overview

### 3.1 Unit Testing (`tests/`)
1. **Input Sanitization (`tests/app.test.js` - Current Baseline):**
   - Strips malicious script payloads.
   - Handles `null` and undefined inputs gracefully.
   - Enforces length caps.
2. **CSV & Table Parser Tests (Phase 2):**
   - Mixed delimiter detection (comma, tab, semicolon).
   - Dynamic header alias matching (e.g., `PM2.5`, `pm_25`, `Particulate Matter 2.5`).
   - UTF-8 BOM removal.
   - Malformed row handling without throwing fatal exceptions.
3. **Statistical & AQI Engine Tests (Phase 2):**
   - Accurate mean, median, and 95th percentile calculations.
   - Correct breakpoint bracket mapping for Indian NAAQS and US-EPA standards.
   - Non-zero missing value handling (verifying missing items do NOT become zero).

### 3.2 Integration & AI Output Validation (Phase 4)
- Verification that Gemini returns valid JSON conforming to the structured schema.
- Verification that fallback and error states trigger gracefully on API failures.

### 3.3 Accessibility (a11y) Verification
- Automated linting with `eslint-plugin-jsx-a11y`.
- Keyboard tab order and focus-visible states across all interactive elements.
- Semantic HTML tags (`<header>`, `<main>`, `<footer>`, `<section>`, `<article>`).
- ARIA live regions for streaming AI updates (`aria-live="polite"`).

---

## 4. Manual Evaluator Simulation Checklist

To guarantee a judge-ready submission, manual evaluation must follow this reproducible protocol:

1. **Clean Clone Test:**
   - Clone repository into a fresh directory.
   - Verify `npm install` installs with zero dependency conflicts.
   - Verify `npm test` runs and passes.
   - Verify `npm run build` generates production assets without errors.
2. **Adversarial Ingestion Test:**
   - Upload a corrupted CSV (missing headers, negative numbers, blank rows).
   - Verify the UI displays clean validation warnings rather than a white screen of death.
3. **End-to-End Live Briefing Test:**
   - Provide valid sample air quality data.
   - Click *Generate Briefings*.
   - Verify genuine Gemini API call in browser network inspector (inspecting `POST https://generativelanguage.googleapis.com/...`).
   - Verify role-specific outputs (Ward Officer, Housing Society, School).
   - Verify Hindi / English toggle renders accurate bilingual content.

---

## 5. Official Test Report Format

All future development logs and pull requests must record verification using this standard format:

```markdown
### Verification Summary
- **Suite:** Vitest v5.1.0
- **Timestamp:** YYYY-MM-DD HH:mm:ss UTC
- **Result:** [Passed / Failed]

| Test File | Total | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- |
| `tests/app.test.js` | 3 | 3 | 0 | PASS |
| `tests/parser.test.js` | - | - | - | PLANNED (Phase 2) |
| `tests/aqiMath.test.js`| - | - | - | PLANNED (Phase 2) |

**Known Limitations & Unverified Functionality:**
- List any edge cases not yet covered by automated tests.
```
