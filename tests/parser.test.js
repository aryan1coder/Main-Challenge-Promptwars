import { describe, it, expect } from 'vitest';
import {
  parseAirQualityData,
  detectDelimiter,
  matchHeaderAlias
} from '../src/lib/parsers/dataParser.js';

describe('Data Parser & Normalizer', () => {
  it('correctly autodetects delimiters for CSV, TSV, and Semicolon tables', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
  });

  it('accurately maps inconsistent header aliases to canonical names', () => {
    expect(matchHeaderAlias('PM 2.5')).toBe('pm25');
    expect(matchHeaderAlias('pm_25')).toBe('pm25');
    expect(matchHeaderAlias('Station Name')).toBe('ward');
    expect(matchHeaderAlias('location')).toBe('ward');
    expect(matchHeaderAlias('recorded_at')).toBe('timestamp');
    expect(matchHeaderAlias('Nitrogen Dioxide')).toBe('no2');
  });

  it('normalizes gaseous ppm units to ug/m3 using molecular weights', () => {
    const rawTSV = `timestamp\tward\tpm25\tno2 (ppm)\n2026-11-14 08:00\tWard 1\t120\t0.05`;
    const result = parseAirQualityData(rawTSV);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].pm25).toBe(120);
    // 0.05 ppm * 1881.8 = 94.09 ug/m3
    expect(result.rows[0].no2).toBeCloseTo(94.09, 1);
  });

  it('preserves missing values as null and NEVER converts them to zero', () => {
    const rawCSV = `Timestamp,Ward,PM2.5,PM10\n2026-11-14 08:00,Ward 1,NA,\n2026-11-14 09:00,Ward 1,-,N/A`;
    const result = parseAirQualityData(rawCSV);

    expect(result.rows[0].pm25).toBeNull();
    expect(result.rows[0].pm10).toBeNull();
    expect(result.rows[1].pm25).toBeNull();
    expect(result.rows[1].pm10).toBeNull();
    expect(result.missingCounts.pm25).toBe(2);
    expect(result.missingCounts.pm10).toBe(2);
  });

  it('detects and rejects physically impossible negative sensor readings', () => {
    const rawCSV = `Timestamp,Ward,PM2.5\n2026-11-14 08:00,Ward 1,-45.5\n2026-11-14 09:00,Ward 1,150.0`;
    const result = parseAirQualityData(rawCSV);

    expect(result.rows[0].pm25).toBeNull();
    expect(result.rows[1].pm25).toBe(150.0);
    expect(result.anomalies.length).toBeGreaterThan(0);
    expect(result.anomalies[0].type).toBe('NEGATIVE_VALUE');
  });

  it('rejects partial numeric values instead of silently parsing a numeric prefix', () => {
    const result = parseAirQualityData(
      'Timestamp,Ward,PM2.5\n2026-11-14 08:00,Ward 1,120ppm'
    );
    expect(result.rows[0].pm25).toBeNull();
    expect(result.rows[0]._flags[0]).toContain('Non-numeric');
  });

  it('enforces input-size and observation-count limits before analytics', () => {
    expect(() => parseAirQualityData('a'.repeat(5_000_001))).toThrow('5 MB text limit');
    const tooManyRows = `Timestamp,Ward,PM2.5\n${'2026-11-14 08:00,Ward 1,20\n'.repeat(50_001)}`;
    expect(() => parseAirQualityData(tooManyRows)).toThrow('50000 observation limit');
  });

  it('flags sensor flatlining when identical values repeat 5+ times', () => {
    let tsv = `Timestamp\tWard\tPM2.5\n`;
    for (let i = 0; i < 6; i++) {
      tsv += `2026-11-14 0${i}:00\tWard 1\t85.0\n`;
    }
    const result = parseAirQualityData(tsv);
    const flatlineAlert = result.anomalies.find(a => a.type === 'SENSOR_FLATLINE');
    expect(flatlineAlert).toBeDefined();
  });

  it('throws an informative error on empty input or header-only data', () => {
    expect(() => parseAirQualityData('')).toThrow('Input data is empty');
    expect(() => parseAirQualityData('Timestamp,Ward,PM2.5')).toThrow('at least a header row and one row');
  });
});
