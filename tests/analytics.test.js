import { describe, it, expect } from 'vitest';
import {
  computeSeriesStats,
  analyzeAirQualityDataset
} from '../src/lib/analytics/statsEngine.js';
import {
  calculateSubIndex,
  determineOverallAQI
} from '../src/lib/analytics/aqiCalculator.js';
import {
  compareWithHistoricalBaseline
} from '../src/lib/services/storageService.js';

describe('Statistical Analytics & AQI Engine', () => {
  it('computes accurate parametric summary statistics ignoring nulls', () => {
    const data = [10, 20, 30, 40, null, 50, undefined];
    const stats = computeSeriesStats(data);

    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(30);
    expect(stats.median).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
  });

  it('calculates Indian NAAQS sub-indices according to official CPCB breakpoints', () => {
    // PM2.5 = 25 ug/m3 -> Good (0-50)
    const good = calculateSubIndex(25, 'pm25');
    expect(good.category).toBe('Good');
    expect(good.subIndex).toBeLessThanOrEqual(50);

    // PM2.5 = 75 ug/m3 -> Moderate (101-200)
    const moderate = calculateSubIndex(75, 'pm25');
    expect(moderate.category).toBe('Moderate');
    expect(moderate.subIndex).toBeGreaterThanOrEqual(101);
    expect(moderate.subIndex).toBeLessThanOrEqual(200);

    // PM2.5 = 350 ug/m3 -> Severe (401-500)
    const severe = calculateSubIndex(350, 'pm25');
    expect(severe.category).toBe('Severe');
    expect(severe.subIndex).toBeGreaterThanOrEqual(401);
  });

  it('determines overall AQI by identifying dominant pollutant maximum', () => {
    const averages = {
      pm25: 180, // Very Poor (>300 sub-index)
      pm10: 80,  // Satisfactory (<100 sub-index)
      no2: 30    // Good (<50 sub-index)
    };
    const overall = determineOverallAQI(averages);

    expect(overall.dominantPollutant).toBe('pm25');
    expect(overall.category).toBe('Very Poor');
    expect(overall.aqi).toBeGreaterThan(300);
  });

  it('ranks spatial hotspots by mean concentration and counts severe exceedances', () => {
    const mockParsed = {
      rows: [
        { ward: 'Ward Alpha', pm25: 350, timestamp: '2026-11-14 08:00' },
        { ward: 'Ward Alpha', pm25: 300, timestamp: '2026-11-14 09:00' },
        { ward: 'Ward Beta', pm25: 60, timestamp: '2026-11-14 08:00' },
        { ward: 'Ward Beta', pm25: 70, timestamp: '2026-11-14 09:00' }
      ],
      totalRows: 4,
      missingCounts: { pm25: 0 },
      anomalies: [],
      totalAnomaliesCount: 0
    };

    const analytics = analyzeAirQualityDataset(mockParsed);
    expect(analytics.hotspots.length).toBe(2);
    expect(analytics.primaryHotspot.ward).toBe('Ward Alpha');
    expect(analytics.primaryHotspot.meanPM25).toBe(325);
    expect(analytics.primaryHotspot.severeExceedances).toBe(2);
  });

  it('calculates mathematical delta (Δ) accurately against a historical baseline', () => {
    const currentAnalytics = {
      pollutantStats: {
        pm25: { mean: 120, max: 200 }
      },
      aqi: { aqi: 280 }
    };

    const historicalRecord = {
      title: 'Yesterday Incident',
      savedAt: '2026-11-13T10:00:00Z',
      analytics: {
        pollutantStats: {
          pm25: { mean: 180, max: 320 }
        },
        aqi: { aqi: 360 }
      }
    };

    const delta = compareWithHistoricalBaseline(currentAnalytics, historicalRecord);
    expect(delta.deltaMeanPM25).toBe(-60); // 120 - 180 = -60
    expect(delta.percentChangePM25).toBeCloseTo(-33.3, 1);
    expect(delta.deltaAQI).toBe(-80); // 280 - 360 = -80
    expect(delta.trendDirection).toBe('Observed Reduction');
  });
});
