import { describe, it, expect } from 'vitest';
import { parseAirQualityData } from '../src/lib/parsers/dataParser.js';
import { analyzeAirQualityDataset } from '../src/lib/analytics/statsEngine.js';
import { BENCHMARK_GEOSPATIAL_DELHI, BENCHMARK_DELHI_SMOG } from '../src/lib/benchmarkData.js';

describe('Map Intelligence & Coordinate Processing', () => {
  it('correctly parses latitude and longitude from geo-tagged tabular datasets', () => {
    const parsed = parseAirQualityData(BENCHMARK_GEOSPATIAL_DELHI);
    expect(parsed.totalRows).toBe(24);
    
    // First row is Anand Vihar
    const r1 = parsed.rows[0];
    expect(r1.latitude).toBeCloseTo(28.6469, 4);
    expect(r1.longitude).toBeCloseTo(77.3160, 4);
    expect(r1.pm25).toBe(342.0);
  });

  it('aggregates station coordinates onto hotspots and sets hasCoordinates flag to true', () => {
    const parsed = parseAirQualityData(BENCHMARK_GEOSPATIAL_DELHI);
    const analytics = analyzeAirQualityDataset(parsed, { title: 'Geo-Tagged NCT' });

    expect(analytics.hasCoordinates).toBe(true);
    expect(analytics.hotspots.length).toBe(8);

    const anandVihar = analytics.hotspots.find(h => h.ward.includes('Anand Vihar'));
    expect(anandVihar).toBeDefined();
    expect(anandVihar.latitude).toBeCloseTo(28.6469, 3);
    expect(anandVihar.longitude).toBeCloseTo(77.3160, 3);
    expect(anandVihar.meanPM25).toBeGreaterThan(300);
  });

  it('sets hasCoordinates flag to false when dataset does not include coordinates (never fabricates)', () => {
    const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    const analytics = analyzeAirQualityDataset(parsed, { title: 'Standard Smog' });

    expect(analytics.hasCoordinates).toBe(false);
    analytics.hotspots.forEach(h => {
      expect(h.latitude).toBeNull();
      expect(h.longitude).toBeNull();
    });
  });

  it('rejects invalid out-of-range coordinates gracefully', () => {
    const invalidCoordsCSV = `timestamp,ward,latitude,longitude,pm25\n2026-11-14 08:00,Invalid Station,120.5,-250.0,85.0`;
    const parsed = parseAirQualityData(invalidCoordsCSV);

    expect(parsed.rows[0].latitude).toBeNull();
    expect(parsed.rows[0].longitude).toBeNull();
    expect(parsed.rows[0]._flags.some(f => f.includes('Latitude out of valid range'))).toBe(true);
    expect(parsed.rows[0]._flags.some(f => f.includes('Longitude out of valid range'))).toBe(true);
  });
});
