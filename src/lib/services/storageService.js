/**
 * Civic Air Quality Briefing Studio - Persistence & Historical Comparison Service
 * Browser localStorage persistence with mathematical delta comparisons.
 * STRICT POLICY: Historical shifts represent observed empirical differences,
 * not causal proof of intervention efficacy.
 */

const STORAGE_KEY = 'civic_air_briefings_history';

/**
 * Save briefing record to local history.
 */
export function saveBriefingRecord(record) {
  try {
    const existing = getSavedBriefings();
    const newRecord = {
      id: `briefing_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      savedAt: new Date().toISOString(),
      ...record
    };
    const updated = [newRecord, ...existing].slice(0, 30); // Keep last 30 briefings
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  } catch (err) {
    console.error('Failed to save briefing to localStorage:', err);
    return null;
  }
}

/**
 * Retrieve all saved briefings with schema validation against corrupted records.
 */
export function getSavedBriefings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Strict schema filter to ignore corrupted or legacy records
    return parsed.filter(
      item => item && typeof item === 'object' && item.id && item.savedAt && item.analytics && item.analytics.aqi
    );
  } catch {
    return [];
  }
}

/**
 * Delete a specific briefing by ID.
 */
export function deleteBriefingRecord(id) {
  try {
    const existing = getSavedBriefings();
    const filtered = existing.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate mathematical delta (Δ) between current analytics and a historical baseline.
 * Represents observed empirical shift, not definitive causal proof.
 */
export function compareWithHistoricalBaseline(currentAnalytics, historicalRecord) {
  if (!currentAnalytics || !historicalRecord || !historicalRecord.analytics) {
    return null;
  }

  const hist = historicalRecord.analytics;
  const curr = currentAnalytics;

  // PM2.5 Deltas
  const currPM25 = curr.pollutantStats?.pm25?.mean;
  const histPM25 = hist.pollutantStats?.pm25?.mean;

  let deltaMeanPM25 = null;
  let percentChangePM25 = null;
  let trendDirection = 'Unchanged';

  if (currPM25 !== null && currPM25 !== undefined && histPM25 !== null && histPM25 !== undefined) {
    deltaMeanPM25 = parseFloat((currPM25 - histPM25).toFixed(2));
    if (histPM25 > 0) {
      percentChangePM25 = parseFloat(((deltaMeanPM25 / histPM25) * 100).toFixed(1));
    }
    if (deltaMeanPM25 < -5) {
      trendDirection = 'Observed Reduction';
    } else if (deltaMeanPM25 > 5) {
      trendDirection = 'Observed Increase';
    }
  }

  // Peak Deltas
  const currPeak = curr.pollutantStats?.pm25?.max;
  const histPeak = hist.pollutantStats?.pm25?.max;
  const deltaPeak = (currPeak !== null && histPeak !== null) ? parseFloat((currPeak - histPeak).toFixed(2)) : null;

  // AQI Delta
  const currAQI = curr.aqi?.aqi || 0;
  const histAQI = hist.aqi?.aqi || 0;
  const deltaAQI = currAQI - histAQI;

  return {
    baselineTitle: historicalRecord.title || historicalRecord.savedAt,
    baselineDate: historicalRecord.savedAt,
    deltaMeanPM25,
    percentChangePM25,
    deltaPeak,
    deltaAQI,
    trendDirection,
    currAQI,
    histAQI,
    currPM25,
    histPM25
  };
}
