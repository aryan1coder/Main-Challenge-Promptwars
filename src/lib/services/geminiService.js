import { getHealthAdvisory } from '../analytics/aqiCalculator.js';
import { getAuthenticatedIdToken } from '../googleServices.js';

const POLLUTANTS = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'];
const FALLBACK_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);

function compactAnalytics(analytics) {
  const pollutantStats = Object.fromEntries(
    POLLUTANTS
      .filter((pollutant) => analytics.pollutantStats?.[pollutant])
      .map((pollutant) => {
        const stats = analytics.pollutantStats[pollutant];
        return [pollutant, {
          mean: stats.mean,
          max: stats.max,
          p95: stats.p95
        }];
      })
  );
  const compactHotspot = (hotspot) => hotspot ? {
    ward: hotspot.ward,
    meanPM25: hotspot.meanPM25,
    maxPM25: hotspot.maxPM25,
    severeExceedances: hotspot.severeExceedances,
    exceedanceRate: hotspot.exceedanceRate
  } : null;

  return {
    totalRows: analytics.totalRows,
    aqi: {
      aqi: analytics.aqi?.aqi,
      category: analytics.aqi?.category,
      dominantPollutant: analytics.aqi?.dominantPollutant,
      isCompleteOfficialAQI: analytics.aqi?.isCompleteOfficialAQI,
      hasSufficientTemporalData: analytics.aqi?.hasSufficientTemporalData
    },
    completeness: analytics.completeness,
    confidenceTier: analytics.confidenceTier,
    totalMissing: analytics.totalMissing,
    anomaliesSummary: { total: analytics.anomaliesSummary?.total || 0 },
    primaryHotspot: compactHotspot(analytics.primaryHotspot),
    hotspots: (analytics.hotspots || []).slice(0, 3).map(compactHotspot),
    peakExposureWindow: analytics.peakExposureWindow,
    pollutantStats
  };
}

function formatNumber(value) {
  return Number.isFinite(value) ? String(value) : 'not available';
}

export function createRuleBasedBriefing(analytics, reason = 'Gemini service is unavailable.') {
  const aqiValue = analytics?.aqi?.aqi;
  const category = analytics?.aqi?.category || 'Unclassified';
  const pollutant = analytics?.aqi?.dominantPollutant?.toUpperCase() || 'unavailable pollutant';
  const hotspot = analytics?.primaryHotspot;
  const hotspotName = hotspot?.ward || 'No hotspot identified';
  const meanPM25 = analytics?.pollutantStats?.pm25?.mean;
  const advisory = getHealthAdvisory(category, 'en');
  const hindiAdvisory = getHealthAdvisory(category, 'hi');
  const evidence = `Calculated AQI ${formatNumber(aqiValue)} (${category}); dominant pollutant: ${pollutant}.`;
  const riskIsElevated = Number.isFinite(aqiValue) && aqiValue > 100;
  const criticalRisk = Number.isFinite(aqiValue) && aqiValue > 300;
  const observedGaps = [];

  if ((analytics?.totalMissing || 0) > 0) {
    observedGaps.push(`${analytics.totalMissing} pollutant readings are missing`);
  }
  if ((analytics?.anomaliesSummary?.total || 0) > 0) {
    observedGaps.push(`${analytics.anomaliesSummary.total} sensor anomalies were flagged`);
  }
  if (analytics?.confidenceTier && analytics.confidenceTier !== 'HIGH') {
    observedGaps.push(`data confidence is ${analytics.confidenceTier}`);
  }
  if (!analytics?.aqi?.isCompleteOfficialAQI) {
    observedGaps.push('the available pollutant coverage does not meet the full CPCB AQI parameter requirement');
  }
  if (analytics?.aqi?.hasSufficientTemporalData === false) {
    observedGaps.push('temporal coverage is below the CPCB 16-hour qualification');
  }

  const data = {
    executiveSummary: `This ${analytics?.isBenchmark ? 'benchmark' : 'submitted'} dataset contains ${formatNumber(analytics?.totalRows)} observations. ${evidence} This is an analytical summary, not a causal source attribution or official order.`,
    airQualityStatus: `Calculated status: ${category}`,
    confidenceAssessment: `${analytics?.confidenceTier || 'UNAVAILABLE'} confidence; ${formatNumber(analytics?.completeness)}% data completeness.`,
    wardOfficer: {
      priority: criticalRisk ? 'HIGH' : riskIsElevated ? 'MEDIUM' : 'LOW',
      actions: [
        hotspot ? `Review monitoring and dust-control activity for ${hotspotName}; observed mean PM2.5 is ${formatNumber(meanPM25)} µg/m³.` : 'Review station-level records before targeting enforcement.',
        `Use ${evidence} as a screening signal, not as sole legal evidence.`,
        'Confirm conditions with an authorized monitoring source before issuing enforcement orders.'
      ],
      enforcementDirectives: 'This rule-based screening note is advisory only; competent-authority review is required before enforcement.',
      evidenceMetric: evidence
    },
    housingSociety: {
      priority: riskIsElevated ? 'HIGH' : 'LOW',
      actions: [
        'Check indoor filtration and share the current air-quality advisory with residents.',
        `Consider limiting strenuous outdoor activity when the calculated category is ${category}.`
      ],
      residentAdvisory: advisory,
      evidenceMetric: evidence
    },
    schoolAdmin: {
      priority: criticalRisk ? 'CRITICAL' : riskIsElevated ? 'HIGH' : 'MEDIUM',
      actions: [
        `Review outdoor activity plans against the calculated category (${category}).`,
        'Follow school health protocols for students with respiratory conditions.'
      ],
      activityRestrictions: `Use the reported ${category} category and current official local guidance when deciding outdoor activity restrictions.`,
      evidenceMetric: evidence
    },
    citizenAdvisory: {
      english: {
        headline: `Air-quality category: ${category}`,
        generalPublic: advisory,
        vulnerableGroups: 'Children, older adults, and people with heart or lung conditions should follow local health guidance and seek medical care for concerning symptoms.'
      },
      hindi: {
        headline: `वायु गुणवत्ता श्रेणी: ${category}`,
        generalPublic: hindiAdvisory,
        vulnerableGroups: 'बच्चे, बुजुर्ग और हृदय या फेफड़ों की समस्या वाले लोग स्थानीय स्वास्थ्य निर्देशों का पालन करें।'
      }
    },
    uncertaintyNotes: observedGaps.length
      ? `${observedGaps.join('; ')}. Source attribution and causal conclusions are not available from these aggregate readings.`
      : 'No missing readings or flagged anomalies were reported in the supplied aggregate. Source attribution and causal conclusions are not available from these aggregate readings.'
  };

  return {
    success: true,
    source: 'rule-based-fallback',
    modelUsed: 'Deterministic rule-based fallback',
    fallbackReason: reason,
    data,
    timestamp: new Date().toISOString()
  };
}

function isValidBriefingResponse(result) {
  const data = result?.data;
  return result?.success === true &&
    data && typeof data === 'object' &&
    typeof data.executiveSummary === 'string' &&
    typeof data.uncertaintyNotes === 'string';
}

export async function generateGroundedBriefings(analytics, datasetMetadata = {}) {
  if (!analytics || typeof analytics !== 'object' || !analytics.aqi) {
    throw new Error('A valid calculated analytics result is required to generate a briefing.');
  }

  const payload = {
    analytics: compactAnalytics(analytics),
    datasetMetadata: {
      title: typeof datasetMetadata.title === 'string'
        ? datasetMetadata.title.slice(0, 120)
        : 'Regional Air Quality Assessment'
    }
  };
  let idToken;
  try {
    idToken = await getAuthenticatedIdToken();
  } catch {
    return createRuleBasedBriefing(analytics, 'A Firebase authentication token could not be obtained.');
  }
  if (!idToken) {
    return createRuleBasedBriefing(analytics, 'Live Gemini synthesis requires an authenticated Firebase account.');
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/generate-briefing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      let message = `Gemini service returned HTTP ${response.status}.`;
      try {
        const body = await response.json();
        if (typeof body?.error === 'string') message = body.error;
      } catch {
        // Keep the generic status message when the endpoint response is not JSON.
      }
      if (FALLBACK_STATUSES.has(response.status)) {
        return createRuleBasedBriefing(analytics, message);
      }
      throw new Error(message);
    }

    const result = await response.json();
    if (!isValidBriefingResponse(result)) {
      return createRuleBasedBriefing(analytics, 'The synthesis service returned an invalid response.');
    }
    return { ...result, source: 'gemini' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return createRuleBasedBriefing(analytics, 'The Gemini request timed out.');
    }
    if (error instanceof TypeError) {
      return createRuleBasedBriefing(analytics, 'The Gemini service could not be reached.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
