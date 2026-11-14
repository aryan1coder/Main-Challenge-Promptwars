/**
 * Civic Air Quality Briefing Studio - Google Gemini Intelligence Service
 * Hybrid Architecture:
 * 1. Production (Vercel): Routes through serverless /api/generate-briefing endpoint
 *    where GEMINI_API_KEY remains server-side.
 * 2. Local Development / Static Preview: Falls back to @google/generative-ai using
 *    import.meta.env.VITE_GEMINI_API_KEY when /api/generate-briefing is not served.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

function buildPromptFacts(analytics, datasetMetadata = {}) {
  return {
    incidentTitle: datasetMetadata.title || 'Regional Air Quality Assessment',
    totalObservations: analytics.totalRows,
    overallAQI: analytics.aqi.aqi,
    aqiCategory: analytics.aqi.category,
    dominantPollutant: analytics.aqi.dominantPollutant,
    dataCompletenessPercent: analytics.completeness,
    dataConfidenceTier: analytics.confidenceTier,
    totalMissingValues: analytics.totalMissing,
    anomaliesDetectedCount: analytics.anomaliesSummary?.total || 0,
    primaryHotspot: analytics.primaryHotspot ? {
      ward: analytics.primaryHotspot.ward,
      meanPM25: analytics.primaryHotspot.meanPM25,
      maxPM25: analytics.primaryHotspot.maxPM25,
      severeExceedances: analytics.primaryHotspot.severeExceedances
    } : 'None detected',
    hotspotsRanking: (analytics.hotspots || []).slice(0, 3).map(h => ({
      ward: h.ward,
      meanPM25: h.meanPM25,
      maxPM25: h.maxPM25,
      exceedanceRatePercent: h.exceedanceRate
    })),
    peakExposureWindow: analytics.peakExposureWindow,
    pollutantsSummary: Object.entries(analytics.pollutantStats || {}).map(([pol, s]) => ({
      pollutant: pol,
      meanConcentration: s.mean,
      maxConcentration: s.max,
      p95Concentration: s.p95
    }))
  };
}

const SYSTEM_INSTRUCTIONS = `
You are the Chief Environmental Science Intelligence Officer for a municipal metropolitan authority.
Synthesize an evidence-grounded briefing based SOLELY on the provided deterministic mathematical facts.

STRICT CONSTRAINTS (ZERO-HALLUCINATION POLICY):
1. Do NOT calculate or invent measurements. Cite the EXACT metrics, concentrations, wards, and peak windows given in the facts.
2. If data for a ward or pollutant is omitted, do NOT make assumptions. Explicitly list it under uncertaintyNotes.
3. Every recommendation for Ward Officers, Housing Societies, and Schools must directly cite an evidence metric from the facts.
4. Output MUST be valid JSON adhering strictly to the schema below.

JSON SCHEMA:
{
  "executiveSummary": "2-3 sentence administrative summary of incident scale and exposure risk",
  "airQualityStatus": "Short status headline",
  "confidenceAssessment": "Evaluation of data completeness and sensor fidelity",
  "wardOfficer": {
    "priority": "HIGH | MEDIUM | LOW",
    "actions": ["Specific operational enforcement step 1", "Step 2", "Step 3"],
    "enforcementDirectives": "Formal municipal administrative mandate",
    "evidenceMetric": "Specific metric cited as legal/operational justification"
  },
  "housingSociety": {
    "priority": "HIGH | MEDIUM | LOW",
    "actions": ["Specific facility action 1", "Action 2"],
    "residentAdvisory": "Guidance for HVAC filtration, elderly residents, and children",
    "evidenceMetric": "Specific metric cited"
  },
  "schoolAdmin": {
    "priority": "CRITICAL | HIGH | MEDIUM",
    "actions": ["Specific school protocol 1", "Protocol 2"],
    "activityRestrictions": "Assembly cancellation, physical education policy",
    "evidenceMetric": "Specific metric cited"
  },
  "citizenAdvisory": {
    "english": {
      "headline": "Plain language alert headline",
      "generalPublic": "Concise advice for commute and outdoor activities",
      "vulnerableGroups": "Targeted advice for children, asthmatics, and seniors"
    },
    "hindi": {
      "headline": "हिंदी में सरल और स्पष्ट शीर्षक",
      "generalPublic": "आम जनता के लिए सरल स्वास्थ्य निर्देश",
      "vulnerableGroups": "बच्चों, बुजुर्गों और सांस के मरीजों के लिए विशेष सावधानी"
    }
  },
  "uncertaintyNotes": "Explicit note on missing data, sensor flatlines, or unmonitored wards"
}`;

async function clientSideGeminiFallback(analytics, datasetMetadata) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Serverless route /api/generate-briefing returned 404 and VITE_GEMINI_API_KEY is not configured in local environment.'
    );
  }

  const promptFacts = buildPromptFacts(analytics, datasetMetadata);
  const promptContent = `System Instructions:\n${SYSTEM_INSTRUCTIONS}\n\nDeterministic Input Facts:\n${JSON.stringify(promptFacts, null, 2)}\n\nProduce the complete structured JSON response:`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelCandidates = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
  let lastErr = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.15,
          responseMimeType: 'application/json'
        }
      });
      const result = await model.generateContent(promptContent);
      const text = result.response.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }
      return {
        success: true,
        modelUsed: modelName,
        data: parsed,
        rawFacts: promptFacts,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      lastErr = err;
      if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error('Client-side model synthesis failed.');
}

export async function generateGroundedBriefings(analytics, datasetMetadata = {}) {
  try {
    const response = await fetch('/api/generate-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics, datasetMetadata })
    });

    if (response.ok) {
      return await response.json();
    }

    if (response.status !== 404) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errData = await response.json();
        if (errData && errData.error) errorMsg = errData.error;
      } catch {
        // non-JSON error
      }
      throw new Error(errorMsg);
    }
  } catch (err) {
    if (!err.message?.includes('404') && !err.message?.includes('Failed to fetch') && !err.message?.includes('NetworkError')) {
      throw err;
    }
  }

  // 404 / Dev Server Fallback: Use client-side Google SDK with import.meta.env.VITE_GEMINI_API_KEY
  return await clientSideGeminiFallback(analytics, datasetMetadata);
}
