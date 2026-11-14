import { describe, it, expect } from 'vitest';
import { parseAirQualityData } from '../src/lib/parsers/dataParser.js';
import { analyzeAirQualityDataset } from '../src/lib/analytics/statsEngine.js';
import {
  saveBriefingRecord,
  getSavedBriefings,
  compareWithHistoricalBaseline,
  deleteBriefingRecord
} from '../src/lib/services/storageService.js';
import { BENCHMARK_DELHI_SMOG, BENCHMARK_MESSY_SENSORS } from '../src/lib/benchmarkData.js';

describe('Live Demo End-to-End Workflow Verification', () => {
  // Mock localStorage for Vitest environment if not natively present
  const memoryStore = {};
  globalThis.localStorage = {
    getItem: (k) => memoryStore[k] || null,
    setItem: (k, v) => { memoryStore[k] = String(v); },
    removeItem: (k) => { delete memoryStore[k]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
  };

  it('executes the full journey: Ingestion -> Analysis -> Hotspots -> Role Directives -> Save -> Compare', () => {
    // Step 1: Load and Validate Benchmark Dataset
    const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    expect(parsed.totalRows).toBe(24);
    expect(parsed.delimiter).toBe(',');

    // Step 2: Deterministic Analytics & AQI
    const analytics = analyzeAirQualityDataset(parsed);
    expect(analytics.aqi.aqi).toBeGreaterThanOrEqual(400); // Severe smog
    expect(analytics.aqi.category).toBe('Severe');
    expect(analytics.aqi.dominantPollutant).toBe('pm25');

    // Step 3: Hotspot Identification
    expect(analytics.hotspots.length).toBeGreaterThan(1);
    const topHotspot = analytics.primaryHotspot;
    expect(topHotspot.ward).toContain('Anand Vihar');
    expect(topHotspot.meanPM25).toBeGreaterThan(300);

    // Step 4: Persona Directives Grounding
    expect(topHotspot.severeExceedances).toBeGreaterThan(0);
    expect(analytics.peakExposureWindow).toBeDefined();

    // Step 5: Save Briefing to Local Storage
    const saved = saveBriefingRecord({
      title: 'Historical Smog Baseline',
      analytics,
      aiBriefing: null
    });
    expect(saved.id).toBeDefined();
    expect(saved.savedAt).toBeDefined();

    // Step 6: Reload from Storage
    const history = getSavedBriefings();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(saved.id);

    // Step 7: Ingest Second Dataset (Messy / Coastal) and Compare Historical Deltas
    const secondParsed = parseAirQualityData(BENCHMARK_MESSY_SENSORS);
    const secondAnalytics = analyzeAirQualityDataset(secondParsed);
    expect(secondParsed.anomalies.length).toBeGreaterThan(0); // Detected negative sensor values

    const delta = compareWithHistoricalBaseline(secondAnalytics, saved);
    expect(delta).toBeDefined();
    expect(delta.deltaMeanPM25).not.toBeNull();
    expect(delta.trendDirection).toBe('Observed Reduction'); // Lower pollution than Delhi smog baseline

    // Clean up
    deleteBriefingRecord(saved.id);
    expect(getSavedBriefings().length).toBe(0);
  });
});
