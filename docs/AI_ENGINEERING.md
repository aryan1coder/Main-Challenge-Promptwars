# Civic Air Quality Briefing Studio — AI Engineering & Integration Protocols

> **Document Version:** 1.0.0  
> **Status:** Active Engineering Protocol

---

## 1. Real Model Integration Mandate

In adherence to the **PromptWars Zero-Disqualification Policy**, all AI-powered synthesis within this platform relies on authentic, live calls to the configured Google Gemini API. 

**Prohibited Practices:**
- Simulating AI generation via client-side `setTimeout` delays.
- Substituting pre-compiled strings or canned responses during API failures.
- Fabricating citations or referencing imaginary monitoring stations.

---

## 2. Model Selection Rationale

- **Primary Model:** `gemini-1.5-flash` (`@google/generative-ai` SDK)
- **Selection Criteria:**
  1. **Low Latency:** Average First-Token Latency under 800ms enables responsive streaming in the browser.
  2. **High Free-Tier Rate Limits:** Adequate RPM (Requests Per Minute) and TPM (Tokens Per Minute) for multi-persona generation.
  3. **Multilingual Proficiency:** Native fluency in Indic languages (including Hindi, Devanagari script, and Hinglish transliterations) as well as global languages.
  4. **Strict Schema Following:** Reliable output adhering to `responseMimeType: "application/json"`.

---

## 3. Evidence Grounding & Hallucination Prevention

To eliminate hallucination risks, the AI is treated strictly as an **interpreter and communicator**, never as a mathematical calculator:

```
[Raw Tabular Data]
       │
       ▼
[Deterministic JS Engine] ──(Computes: Average, Peak, Hotspot Ward, Uptime %)
       │
       ▼
[Structured Fact Object]
       │
       ▼
[Gemini 1.5 Flash Prompt] ──(Rules: Do NOT calculate; ONLY summarize & advise based on Fact Object)
       │
       ▼
[Evidence-Grounded Briefing]
```

### System Prompt Design Principles
Every prompt injected into Gemini contains:
1. **Persona Definition:** An authoritative, objective civic environmental intelligence officer.
2. **Grounding Directive:** *"Every statement regarding pollution severity must cite the specific measured value provided in the context."*
3. **Negative Constraint:** *"Do not invent new sensor locations, dates, or measurements. If data for a ward is missing in the input, state that it is unmonitored."*

---

## 4. Structured Output Schemas

When programmatic components consume Gemini's output, structured JSON generation is enforced:

```json
{
  "incidentOverview": {
    "summary": "String: concise 2-sentence summary of the pollution episode",
    "primaryPollutant": "PM2.5",
    "overallAQICategory": "Very Poor",
    "dataConfidence": "HIGH | MODERATE | LOW",
    "dataGapsNote": "String: explicit note of missing intervals or unmonitored areas"
  },
  "roleInterventions": {
    "wardOfficers": [
      {
        "priority": "HIGH | MEDIUM | LOW",
        "action": "Immediate dust suppression via mist cannons along Sector 4 corridor",
        "evidenceMetric": "Peak PM2.5 of 340 µg/m³ recorded at Ward 4 sensor"
      }
    ],
    "housingSocieties": [
      {
        "priority": "HIGH | MEDIUM | LOW",
        "action": "Seal building ventilation intake between 06:00 and 10:00; replace MERV filters",
        "evidenceMetric": "Diurnal morning peak exceeding 250 µg/m³"
      }
    ],
    "schools": [
      {
        "priority": "CRITICAL",
        "action": "Cancel outdoor sports and morning assembly; conduct classes indoors",
        "evidenceMetric": "AQI exceeds 300 during school operating hours"
      }
    ]
  },
  "citizenAdvisories": {
    "english": {
      "headline": "Severe Air Quality Advisory for Ward 4 Residents",
      "generalPublic": "Avoid outdoor aerobic exercise...",
      "vulnerableGroups": "Children, the elderly, and asthmatic individuals must stay indoors..."
    },
    "hindi": {
      "headline": "वार्ड 4 के निवासियों के लिए गंभीर वायु गुणवत्ता चेतावनी",
      "generalPublic": "सुबह के समय बाहर व्यायाम करने से बचें...",
      "vulnerableGroups": "बच्चों, बुजुर्गों और सांस के मरीजों को घर के अंदर रहने की सलाह दी जाती है..."
    }
  }
}
```

---

## 5. Token Efficiency & Context Management

Raw CSV files often contain tens of thousands of rows ($> 500{,}000$ tokens). Passing raw tables into the context window causes latency spikes, rate limit exhaustion, and higher probability of attention drift.

**Optimization Strategy:**
1. The deterministic JS engine pre-aggregates time series into:
   - Hourly rolling averages.
   - Sensor min/max/median tables.
   - Hotspot rankings (top 3 highest wards).
   - Anomaly counts.
2. Only the aggregated summary tables ($\approx 800 - 1500$ tokens) are passed into Gemini's context window.
3. This reduces token consumption by **$> 95\%$**, accelerates generation to sub-second responses, and avoids rate limit hits.

---

## 6. Resilience, Timeouts & Error Management

- **Request Timeout:** Gemini calls are wrapped with a 15-second abort controller.
- **Rate Limit (HTTP 429) Handling:** Exponential backoff with jitter (initial retry at 1s, second retry at 2s).
- **Graceful Error Surfacing:** If the API fails after retries, the UI exposes the exact failure message with a clear retry CTA:
  ```
  [!] Gemini AI service temporarily unavailable (Quota / Rate Limit).
      Calculated metrics remain verified below. Click 'Retry Synthesis'.
  ```
- Under no circumstance will the client fabricate output or simulate successful AI generation.
