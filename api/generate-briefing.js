/* global process */
/**
 * Vercel Serverless Function: Secure Server-Side Gemini Briefing Synthesis
 * Prevents client-side exposure of API keys in production.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Uses server-side GEMINI_API_KEY (or VITE_GEMINI_API_KEY fallback for local dev)
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

const MODEL_CANDIDATES = ['gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.5-flash'];

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server-side GEMINI_API_KEY is not configured in environment variables.'
    });
  }

  const { analytics, datasetMetadata = {} } = req.body || {};
  if (!analytics || !analytics.aqi) {
    return res.status(400).json({ error: 'Missing valid analytics payload.' });
  }

  const promptFacts = {
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

  const systemInstructions = `
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

  const promptContent = `
System Instructions:
${systemInstructions}

Deterministic Input Facts:
${JSON.stringify(promptFacts, null, 2)}

Produce the complete structured JSON response:`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.15,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(promptContent);
      const responseText = result.response.text();

      let parsedJSON;
      try {
        parsedJSON = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJSON = JSON.parse(cleaned);
      }

      return res.status(200).json({
        success: true,
        modelUsed: modelName,
        data: parsedJSON,
        rawFacts: promptFacts,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('no longer available'))) {
        continue;
      }
      return res.status(500).json({ error: err.message || 'Gemini API Error' });
    }
  }

  return res.status(500).json({ error: lastError?.message || 'Model candidate generation failed' });
}
