import { describe, expect, it } from 'vitest';
import handler, { validateBriefingPayload } from '../api/generate-briefing.js';

function validPayload() {
  const hotspot = {
    ward: 'Ward 1',
    meanPM25: 45,
    maxPM25: 60,
    severeExceedances: 0,
    exceedanceRate: 0
  };
  return {
    analytics: {
      totalRows: 20,
      aqi: {
        aqi: 72,
        category: 'Satisfactory',
        dominantPollutant: 'pm25',
        isCompleteOfficialAQI: false,
        hasSufficientTemporalData: true
      },
      completeness: 99,
      confidenceTier: 'HIGH',
      totalMissing: 1,
      anomaliesSummary: { total: 0 },
      primaryHotspot: hotspot,
      hotspots: [hotspot],
      peakExposureWindow: '08:00 - 09:00',
      pollutantStats: {
        pm25: { mean: 45, max: 60, p95: 58 }
      }
    },
    datasetMetadata: { title: 'Test dataset' }
  };
}

function createResponse() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

describe('Gemini briefing endpoint validation', () => {
  it('accepts compact calculated summaries and rejects malformed AQI values', () => {
    expect(validateBriefingPayload(validPayload())).toBeNull();
    const invalid = validPayload();
    invalid.analytics.aqi.aqi = 900;
    expect(validateBriefingPayload(invalid)).toMatch(/AQI metrics are invalid/);
  });

  it('rejects unsupported methods before provider access', async () => {
    const res = createResponse();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
  });

  it('returns a safe configuration error without exposing provider details', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res = createResponse();
    try {
      await handler({
        method: 'POST',
        headers: { 'content-length': '200' },
        body: validPayload(),
        socket: { remoteAddress: 'briefing-test' }
      }, res);
    } finally {
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = originalKey;
    }
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toContain('rule-based briefing');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('rejects oversized payloads before processing their contents', async () => {
    const res = createResponse();
    await handler({
      method: 'POST',
      headers: { 'content-length': String(33 * 1024) },
      body: validPayload()
    }, res);
    expect(res.statusCode).toBe(413);
  });
});
