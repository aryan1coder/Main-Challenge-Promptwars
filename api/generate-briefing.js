/* global process */

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_REQUESTS_PER_WINDOW = 12;
const RATE_WINDOW_MS = 60 * 1000;
const PROVIDER_TIMEOUT_MS = 12 * 1000;
const RATE_LIMITS = new Map();
const CATEGORIES = new Set([
  'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe', 'Severe (Emergency)'
]);
const POLLUTANTS = new Set(['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']);
const CONFIDENCE_TIERS = new Set(['HIGH', 'MODERATE', 'LOW']);

const SYSTEM_INSTRUCTIONS = `
Create a concise, evidence-grounded civic air-quality briefing using only the supplied calculated facts.
Do not infer pollution sources, weather, causes, coordinates, or measurements. Cite only supplied values.
Recommendations are advisory, not legal orders or medical diagnoses. State uncertainty and data gaps.
Return only valid JSON with this shape:
{
  "executiveSummary": "string",
  "airQualityStatus": "string",
  "confidenceAssessment": "string",
  "wardOfficer": {
    "priority": "HIGH | MEDIUM | LOW",
    "actions": ["string"],
    "enforcementDirectives": "string",
    "evidenceMetric": "string"
  },
  "housingSociety": {
    "priority": "HIGH | MEDIUM | LOW",
    "actions": ["string"],
    "residentAdvisory": "string",
    "evidenceMetric": "string"
  },
  "schoolAdmin": {
    "priority": "CRITICAL | HIGH | MEDIUM",
    "actions": ["string"],
    "activityRestrictions": "string",
    "evidenceMetric": "string"
  },
  "citizenAdvisory": {
    "english": { "headline": "string", "generalPublic": "string", "vulnerableGroups": "string" },
    "hindi": { "headline": "string", "generalPublic": "string", "vulnerableGroups": "string" }
  },
  "uncertaintyNotes": "string"
}`;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteInRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isOptionalMeasurement(value) {
  return value === null || isFiniteInRange(value, 0, 1_000_000);
}

function validateHotspot(hotspot) {
  return isObject(hotspot) &&
    typeof hotspot.ward === 'string' && hotspot.ward.length > 0 && hotspot.ward.length <= 120 &&
    isOptionalMeasurement(hotspot.meanPM25) &&
    isOptionalMeasurement(hotspot.maxPM25) &&
    Number.isInteger(hotspot.severeExceedances) && hotspot.severeExceedances >= 0 &&
    isFiniteInRange(hotspot.exceedanceRate, 0, 100);
}

export function validateBriefingPayload(body) {
  if (!isObject(body) || !isObject(body.analytics)) return 'Missing valid analytics payload.';
  const { analytics, datasetMetadata } = body;
  const aqi = analytics.aqi;

  if (!Number.isInteger(analytics.totalRows) || analytics.totalRows < 1 || analytics.totalRows > 1_000_000) {
    return 'Observation count is outside the supported range.';
  }
  if (!isObject(aqi) || !isFiniteInRange(aqi.aqi, 0, 500) ||
      !CATEGORIES.has(aqi.category) || !POLLUTANTS.has(aqi.dominantPollutant)) {
    return 'AQI metrics are invalid.';
  }
  if (!isFiniteInRange(analytics.completeness, 0, 100) ||
      !CONFIDENCE_TIERS.has(analytics.confidenceTier) ||
      !Number.isInteger(analytics.totalMissing) ||
      analytics.totalMissing < 0 ||
      analytics.totalMissing > analytics.totalRows * POLLUTANTS.size) {
    return 'Data-quality metrics are invalid.';
  }
  if (!isObject(analytics.anomaliesSummary) ||
      !Number.isInteger(analytics.anomaliesSummary.total) ||
      analytics.anomaliesSummary.total < 0 ||
      analytics.anomaliesSummary.total > analytics.totalRows * 10) {
    return 'Anomaly summary is invalid.';
  }
  if (typeof analytics.peakExposureWindow !== 'string' || analytics.peakExposureWindow.length > 80) {
    return 'Exposure-window summary is invalid.';
  }
  if (!isObject(analytics.pollutantStats) ||
      Object.keys(analytics.pollutantStats).some((key) => !POLLUTANTS.has(key))) {
    return 'Pollutant summary is invalid.';
  }
  for (const stats of Object.values(analytics.pollutantStats)) {
    if (!isObject(stats) ||
        !isOptionalMeasurement(stats.mean) ||
        !isOptionalMeasurement(stats.max) ||
        !isOptionalMeasurement(stats.p95)) {
      return 'Pollutant statistics are invalid.';
    }
  }
  if (!Array.isArray(analytics.hotspots) || analytics.hotspots.length > 3 ||
      analytics.hotspots.some((hotspot) => !validateHotspot(hotspot))) {
    return 'Hotspot summary is invalid.';
  }
  if (analytics.primaryHotspot !== null && !validateHotspot(analytics.primaryHotspot)) {
    return 'Primary hotspot is invalid.';
  }
  if (!isObject(datasetMetadata) ||
      (datasetMetadata.title !== undefined &&
       (typeof datasetMetadata.title !== 'string' || datasetMetadata.title.length > 120))) {
    return 'Dataset metadata is invalid.';
  }
  return null;
}

function validateBriefingResponse(data) {
  const requiredText = [
    data?.executiveSummary,
    data?.airQualityStatus,
    data?.confidenceAssessment,
    data?.wardOfficer?.enforcementDirectives,
    data?.wardOfficer?.evidenceMetric,
    data?.housingSociety?.residentAdvisory,
    data?.housingSociety?.evidenceMetric,
    data?.schoolAdmin?.activityRestrictions,
    data?.schoolAdmin?.evidenceMetric,
    data?.citizenAdvisory?.english?.headline,
    data?.citizenAdvisory?.english?.generalPublic,
    data?.citizenAdvisory?.english?.vulnerableGroups,
    data?.citizenAdvisory?.hindi?.headline,
    data?.citizenAdvisory?.hindi?.generalPublic,
    data?.citizenAdvisory?.hindi?.vulnerableGroups,
    data?.uncertaintyNotes
  ];
  const validText = (value) => typeof value === 'string' && value.length > 0 && value.length <= 4000;
  const validActions = (value) =>
    Array.isArray(value) && value.length > 0 && value.length <= 8 && value.every(validText);

  return requiredText.every(validText) &&
    validActions(data.wardOfficer?.actions) &&
    validActions(data.housingSociety?.actions) &&
    validActions(data.schoolAdmin?.actions);
}

function allowRequest(ip, now = Date.now()) {
  if (RATE_LIMITS.size > 1000) {
    for (const [key, value] of RATE_LIMITS) {
      if (now - value.start >= RATE_WINDOW_MS) RATE_LIMITS.delete(key);
    }
  }
  const entry = RATE_LIMITS.get(ip);
  if (!entry || now - entry.start >= RATE_WINDOW_MS) {
    RATE_LIMITS.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return req.socket?.remoteAddress || 'unknown';
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

async function requestGemini(apiKey, facts, signal) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
        contents: [{
          role: 'user',
          parts: [{ text: JSON.stringify(facts) }]
        }],
        generationConfig: {
          temperature: 0.15,
          responseMimeType: 'application/json'
        }
      }),
      signal
    }
  );
  return response;
}

async function verifyFirebaseToken(token, apiKey, signal) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      signal
    }
  );
  if (response.status === 400 || response.status === 401) return false;
  if (!response.ok) throw new Error('Firebase token verification is unavailable.');
  const result = await response.json();
  return Array.isArray(result?.users) && result.users.some((user) => typeof user.localId === 'string');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed.');
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return sendError(res, 413, 'Request payload exceeds the 32 KB limit.');
  }

  const body = typeof req.body === 'string'
    ? (() => {
        try {
          return JSON.parse(req.body);
        } catch {
          return null;
        }
      })()
    : req.body;
  if (!body || Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return sendError(res, 413, 'Request payload exceeds the 32 KB limit or is malformed.');
  }

  const validationError = validateBriefingPayload(body);
  if (validationError) return sendError(res, 400, validationError);

  const apiKey = process.env.GEMINI_API_KEY;
  const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || !firebaseApiKey) {
    return sendError(res, 503, 'Gemini or Firebase server configuration is unavailable. A grounded rule-based briefing will be used.');
  }

  if (!allowRequest(getClientIp(req))) {
    return sendError(res, 429, 'Briefing request limit reached. Try again in about one minute.');
  }

  const authorization = req.headers?.authorization;
  const tokenMatch = typeof authorization === 'string'
    ? authorization.match(/^Bearer ([A-Za-z0-9._-]{20,4096})$/)
    : null;
  if (!tokenMatch) return sendError(res, 401, 'A valid Firebase sign-in is required for live Gemini synthesis.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const isAuthenticated = await verifyFirebaseToken(tokenMatch[1], firebaseApiKey, controller.signal);
    if (!isAuthenticated) {
      clearTimeout(timeoutId);
      return sendError(res, 401, 'Firebase sign-in is invalid or expired.');
    }
  } catch {
    clearTimeout(timeoutId);
    return sendError(res, 503, 'Firebase token verification is temporarily unavailable.');
  }

  const analytics = body.analytics;
  const promptFacts = {
    incidentTitle: body.datasetMetadata?.title || 'Regional Air Quality Assessment',
    totalObservations: analytics.totalRows,
    overallAQI: analytics.aqi.aqi,
    aqiCategory: analytics.aqi.category,
    dominantPollutant: analytics.aqi.dominantPollutant,
    isCompleteOfficialAQI: analytics.aqi.isCompleteOfficialAQI === true,
    hasSufficientTemporalData: analytics.aqi.hasSufficientTemporalData === true,
    dataCompletenessPercent: analytics.completeness,
    dataConfidenceTier: analytics.confidenceTier,
    totalMissingValues: analytics.totalMissing,
    anomaliesDetectedCount: analytics.anomaliesSummary.total,
    primaryHotspot: analytics.primaryHotspot || 'None identified',
    hotspotsRanking: analytics.hotspots,
    peakExposureWindow: analytics.peakExposureWindow,
    pollutantsSummary: analytics.pollutantStats
  };
  let providerResponse;

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      providerResponse = await requestGemini(apiKey, promptFacts, controller.signal);
      if (providerResponse.ok || (providerResponse.status < 500 && providerResponse.status !== 429)) break;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (!providerResponse.ok) {
      if (providerResponse.status === 429) {
        return sendError(res, 429, 'Gemini is temporarily rate-limited. A grounded rule-based briefing will be used.');
      }
      if (providerResponse.status === 401 || providerResponse.status === 403) {
        return sendError(res, 503, 'Gemini credentials are not authorized. A grounded rule-based briefing will be used.');
      }
      return sendError(res, 503, 'Gemini could not complete the request. A grounded rule-based briefing will be used.');
    }

    let providerBody;
    try {
      providerBody = await providerResponse.json();
    } catch {
      return sendError(res, 502, 'Gemini returned an unreadable response. A grounded rule-based briefing will be used.');
    }
    const text = providerBody?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return sendError(res, 502, 'Gemini returned an invalid structured response. A grounded rule-based briefing will be used.');
    }
    if (!validateBriefingResponse(data)) {
      return sendError(res, 502, 'Gemini response did not match the required schema. A grounded rule-based briefing will be used.');
    }

    return res.status(200).json({
      success: true,
      source: 'gemini',
      modelUsed: MODEL_NAME,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return sendError(res, 503, 'Gemini request timed out. A grounded rule-based briefing will be used.');
    }
    return sendError(res, 503, 'Gemini service is temporarily unavailable. A grounded rule-based briefing will be used.');
  } finally {
    clearTimeout(timeoutId);
  }
}
