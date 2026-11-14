# Civic Air Quality Briefing Studio — Data Integrity Policy & Methodology

> **Document Version:** 1.0.0  
> **Status:** Active Policy

---

## 1. Core Principles of Data Integrity

In civic environmental monitoring, decisions directly impact public health and municipal liability. The **Civic Air Quality Briefing Studio** enforces mathematical and statistical transparency above all else:

1. **Never Invent Data:** An unrecorded sensor value must never be fabricated, interpolated blindly, or substituted with historical estimates without clear labeling.
2. **Never Treat Missing Values as Zero:** Missing sensor values (`null`, `NaN`, empty string, `N/A`) must never be transformed to $0$. A zero reading indicates pure, contaminant-free air, dangerously underreporting exposure risk.
3. **Traceability (Provenance):** Every calculation and every natural-language assertion made by the AI model must link back to verifiable source rows or deterministic statistical aggregates.

---

## 2. Ingestion & CSV Parsing Standards

Raw data collected from municipal IoT devices and low-cost monitors is notoriously dirty. The ingestion engine adheres to these specifications:

- **Delimiter Agnosticism:** Automatically detect and support commas (`,`), tabs (`\t`), semicolons (`;`), and pipes (`|`).
- **Encoding & Header Cleanup:** Strip Byte Order Marks (UTF-8 BOM `\uFEFF`), trim whitespace, and normalize case.
- **Dynamic Header Aliasing:**
  | Target Metric | Accepted Header Aliases |
  | :--- | :--- |
  | **Timestamp** | `datetime`, `date_time`, `timestamp`, `time`, `recorded_at`, `date` |
  | **Location / Ward** | `location`, `station`, `ward`, `site`, `sensor_id`, `area` |
  | **$\text{PM}_{2.5}$** | `pm25`, `pm_25`, `pm2.5`, `pm 2.5`, `particulate_matter_2_5` |
  | **$\text{PM}_{10}$** | `pm10`, `pm_10`, `pm 10`, `particulate_matter_10` |
  | **$\text{NO}_2$** | `no2`, `no_2`, `nitrogen_dioxide` |
  | **$\text{CO}$** | `co`, `carbon_monoxide` |
  | **$\text{SO}_2$** | `so2`, `so_2`, `sulfur_dioxide` |
  | **$\text{O}_3$** | `o3`, `ozone` |

---

## 3. Unit Normalization & Standard Conversions

Environmental monitors frequently mix volumetric ratios ($\text{ppm}$, $\text{ppb}$) with mass concentration ($\mu\text{g}/\text{m}^3$):

- **Mass Concentrations:** All particulate matter ($\text{PM}_{2.5}$, $\text{PM}_{10}$) must be standardized to micrograms per cubic meter ($\mu\text{g}/\text{m}^3$).
- **Gaseous Concentrations:** When converting gases from $\text{ppm}$ to $\mu\text{g}/\text{m}^3$ at standard temperature and pressure ($25^\circ\text{C}$, $101.325\,\text{kPa}$):
  $$\text{Concentration } (\mu\text{g}/\text{m}^3) = \frac{\text{ppm} \times \text{Molecular Weight} \times 1000}{24.45}$$
  - $\text{NO}_2$ ($\text{MW} = 46.01\,\text{g/mol}$): $1\,\text{ppm} \approx 1880\,\mu\text{g}/\text{m}^3$
  - $\text{SO}_2$ ($\text{MW} = 64.07\,\text{g/mol}$): $1\,\text{ppm} \approx 2620\,\mu\text{g}/\text{m}^3$
  - $\text{CO}$ ($\text{MW} = 28.01\,\text{g/mol}$): $1\,\text{ppm} \approx 1145\,\mu\text{g}/\text{m}^3$
- If gas ambient temperature/pressure is unknown, the platform retains the original $\text{ppm}$ values and alerts the user rather than applying an inaccurate conversion factor.

---

## 4. Anomaly Detection & Sensor Quality Screening

Prior to mathematical aggregation, raw streams pass through three automated anomaly filters:

1. **Physically Impossible Values:**
   - $\text{PM}_{2.5} < 0\,\mu\text{g}/\text{m}^3$ $\to$ Flagged as uncalibrated sensor error; excluded from statistical average.
   - $\text{PM}_{2.5} > 1500\,\mu\text{g}/\text{m}^3$ $\to$ Flagged as severe anomaly or optical chamber contamination.
2. **Sensor Flatlining:**
   - Five or more consecutive identical non-zero readings (e.g., $45.2, 45.2, 45.2, 45.2, 45.2$) are flagged as frozen sensor state.
3. **Temporal Gaps:**
   - Chronological gaps exceeding $2\times$ the detected sampling interval are counted and documented as an uncertainty factor.

---

## 5. Air Quality Index (AQI) Calculation Methodology

The system computes sub-indices using the piecewise linear interpolation formula:

$$I_p = \frac{I_{hi} - I_{lo}}{BP_{hi} - BP_{lo}} \times (C_p - BP_{lo}) + I_{lo}$$

Where:
- $I_p$ = Air Quality Sub-index for pollutant $p$
- $C_p$ = Observed truncated concentration
- $BP_{hi}$ / $BP_{lo}$ = Breakpoint concentration bracket
- $I_{hi}$ / $I_{lo}$ = Corresponding index category range

### Standard Compatibility
The platform supports both:
1. **Indian National Air Quality Index (NAAQS - CPCB Breakpoints):**
   - Good ($0-50$), Satisfactory ($51-100$), Moderate ($101-200$), Poor ($201-300$), Very Poor ($301-400$), Severe ($401-500+$).
2. **US-EPA AQI Breakpoints:**
   - Good ($0-50$), Moderate ($51-100$), Unhealthy for Sensitive Groups ($101-150$), Unhealthy ($151-200$), Very Unhealthy ($201-300$), Hazardous ($301-500$).

---

## 6. Uncertainty & Confidence Scoring

Every generated briefing must be assigned a **Data Confidence Level**:

- **HIGH CONFIDENCE ($\ge 90\%$ Complete):** Sensor coverage is continuous; gaps represent $< 10\%$ of the scheduled time frame; no significant sensor flatlines detected.
- **MODERATE CONFIDENCE ($70\% - 89\%$ Complete):** Some missing intervals; peak estimates may be slightly conservative.
- **LOW CONFIDENCE ($< 70\%$ Complete or High Variance):** Sensor dropouts exceed $30\%$; briefings must feature a prominent banner: *"Caution: Briefing generated from sparse monitoring coverage. Findings should be cross-verified."*

---

## 7. Historical Comparison Reliability

When comparing a current briefing with a previous baseline:
- Compare like-for-like time intervals (e.g., identical 24-hour periods or diurnal windows).
- Explicitly report the delta ($\Delta$) with percentage change and absolute concentration shift:
  $$\Delta = \text{Current Metric} - \text{Baseline Metric}$$
- Never declare a municipal intervention "successful" unless the statistical reduction exceeds the known sensor variance threshold ($\pm 10\,\mu\text{g}/\text{m}^3$).
