import { describe, it, expect } from 'vitest';
import { parseAirQualityData } from '../src/lib/parsers/dataParser.js';
import { analyzeAirQualityDataset } from '../src/lib/analytics/statsEngine.js';
import { getHealthAdvisory } from '../src/lib/analytics/aqiCalculator.js';
import {
  saveBriefingRecord,
  getSavedBriefings,
  compareWithHistoricalBaseline,
  deleteBriefingRecord
} from '../src/lib/services/storageService.js';
import { BENCHMARK_DELHI_SMOG, BENCHMARK_MESSY_SENSORS } from '../src/lib/benchmarkData.js';

describe('TASK 2: Connected Workflows & Benchmarks Suite (A through G)', () => {
  // Mock localStorage for Vitest environment
  const memoryStore = {};
  globalThis.localStorage = {
    getItem: (k) => memoryStore[k] || null,
    setItem: (k, v) => { memoryStore[k] = String(v); },
    removeItem: (k) => { delete memoryStore[k]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
  };

  it('Scenario A: Delhi Severe Episode benchmark workflow', () => {
    // 1. Ingestion
    const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    expect(parsed.totalRows).toBe(24);
    expect(parsed.delimiter).toBe(',');

    // 2. Statistical Analysis & AQI
    const analytics = analyzeAirQualityDataset(parsed, { title: 'Benchmark: Delhi Winter Smog Episode', isBenchmark: true });
    expect(analytics.aqi.aqi).toBeGreaterThanOrEqual(400);
    expect(analytics.aqi.category).toBe('Severe');
    expect(analytics.aqi.dominantPollutant).toBe('pm25');
    expect(analytics.isBenchmark).toBe(true);

    // 3. Hotspot Identification
    expect(analytics.hotspots.length).toBeGreaterThan(1);
    const topHotspot = analytics.primaryHotspot;
    expect(topHotspot.ward).toContain('Anand Vihar');
    expect(topHotspot.meanPM25).toBeGreaterThan(300);
    expect(topHotspot.severeExceedances).toBeGreaterThan(0);
    expect(analytics.peakExposureWindow).toBeDefined();
  });

  it('Scenario B: Messy Sensors & Anomalies benchmark workflow', () => {
    const parsed = parseAirQualityData(BENCHMARK_MESSY_SENSORS);
    expect(parsed.totalRows).toBeGreaterThan(0);
    expect(parsed.delimiter).toBe('\t'); // Autodetected TSV
    expect(parsed.anomalies.length).toBeGreaterThan(0);

    // Screened negative readings and flatlines
    const hasNegative = parsed.anomalies.some(a => a.type === 'NEGATIVE_VALUE');
    expect(hasNegative).toBe(true);

    const analytics = analyzeAirQualityDataset(parsed, { title: 'Benchmark: Messy Sensors', isBenchmark: true });
    expect(analytics.anomaliesSummary.total).toBeGreaterThan(0);
    expect(analytics.confidenceTier).toBeDefined();
    expect(analytics.sensorReliability).toContain('Degraded');
  });

  it('Scenario C: Uploaded CSV with missing values workflow', () => {
    const csvWithMissing = `Timestamp,Ward,PM2.5,NO2\n2026-11-14 08:00,Ward Alpha,NA,0.04\n2026-11-14 09:00,Ward Alpha,-,N/A\n2026-11-14 10:00,Ward Alpha,145.0,0.06`;
    const parsed = parseAirQualityData(csvWithMissing);

    expect(parsed.rows.length).toBe(3);
    // Missing values preserved as null, NEVER converted to 0
    expect(parsed.rows[0].pm25).toBeNull();
    expect(parsed.rows[1].pm25).toBeNull();
    expect(parsed.rows[2].pm25).toBe(145.0);
    expect(parsed.missingCounts.pm25).toBe(2);

    const analytics = analyzeAirQualityDataset(parsed);
    expect(analytics.completeness).toBeLessThan(100);
    expect(analytics.totalMissing).toBeGreaterThan(0);
    // Because only PM2.5 and NO2 are provided (<3 pollutants), must qualify as Indicative AQI sub-index
    expect(analytics.aqi.isCompleteOfficialAQI).toBe(false);
    expect(analytics.aqi.coverageNote).toContain('Indicative AQI sub-index');
  });

  it('Scenario D: Invalid or malformed CSV error handling workflow', () => {
    // 1. Completely empty input
    expect(() => parseAirQualityData('')).toThrow('Input data is empty');
    expect(() => parseAirQualityData('   ')).toThrow('Input data is empty');

    // 2. Header only
    expect(() => parseAirQualityData('Timestamp,Ward,PM2.5')).toThrow('at least a header row and one row');

    // 3. Row with invalid non-numeric data gracefully handled without crash
    const csvBadNumbers = `Timestamp,Ward,PM2.5\n2026-11-14 08:00,Ward Alpha,CorruptedString`;
    const parsed = parseAirQualityData(csvBadNumbers);
    expect(parsed.rows.length).toBe(1);
    expect(parsed.rows[0].pm25).toBeNull();
    expect(parsed.rows[0]._flags[0]).toContain('Non-numeric');
  });

  it('Scenario E: Role-specific operational recommendations workflow', () => {
    const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    const analytics = analyzeAirQualityDataset(parsed);

    // Verify all 3 roles receive calibrated recommendations with evidence citations
    const aqi = analytics.aqi.aqi;
    expect(aqi).toBeGreaterThan(300);

    // Ward Officer
    const wardPriority = aqi > 300 ? 'SUGGESTED ESCALATION - HIGH' : 'ROUTINE MONITORING';
    expect(wardPriority).toBe('SUGGESTED ESCALATION - HIGH');

    // Housing Society
    const housingActions = aqi > 200;
    expect(housingActions).toBe(true);

    // School Principal
    const schoolActions = aqi > 250;
    expect(schoolActions).toBe(true);
  });

  it('Scenario F: English and Hindi advisory generation workflow', () => {
    const categories = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe', 'Severe (Emergency)'];

    categories.forEach(cat => {
      const enAdvisory = getHealthAdvisory(cat, 'en');
      const hiAdvisory = getHealthAdvisory(cat, 'hi');

      expect(typeof enAdvisory).toBe('string');
      expect(enAdvisory.length).toBeGreaterThan(10);

      expect(typeof hiAdvisory).toBe('string');
      expect(hiAdvisory.length).toBeGreaterThan(10);
      // Verify Hindi Devanagari Unicode range (\u0900-\u097F)
      expect(/[\u0900-\u097F]/.test(hiAdvisory)).toBe(true);
    });
  });

  it('Scenario G: Historical save, reload, comparison, and deletion workflow', () => {
    const parsedBaseline = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    const baselineAnalytics = analyzeAirQualityDataset(parsedBaseline, { title: 'Baseline Smog Incident' });

    // 1. Save record
    const saved = saveBriefingRecord({
      title: 'Baseline Smog Incident',
      analytics: baselineAnalytics,
      aiBriefing: null
    });
    expect(saved).toBeDefined();
    expect(saved.id).toContain('briefing_');

    // 2. Reload and verify persistence
    const savedList = getSavedBriefings();
    expect(savedList.length).toBe(1);
    expect(savedList[0].id).toBe(saved.id);

    // 3. Compare with second episode (lower emissions)
    const lowerPollutionCSV = `Timestamp,Ward,PM2.5\n2026-11-15 08:00,Ward Alpha,50\n2026-11-15 09:00,Ward Alpha,45`;
    const secondParsed = parseAirQualityData(lowerPollutionCSV);
    const secondAnalytics = analyzeAirQualityDataset(secondParsed, { title: 'Post-Intervention Episode' });

    const delta = compareWithHistoricalBaseline(secondAnalytics, saved);
    expect(delta).toBeDefined();
    expect(delta.deltaMeanPM25).toBeLessThan(0); // Significant drop
    expect(delta.trendDirection).toBe('Observed Reduction');

    // 4. Delete record
    const deleted = deleteBriefingRecord(saved.id);
    expect(deleted).toBe(true);
    expect(getSavedBriefings().length).toBe(0);
  });
});
