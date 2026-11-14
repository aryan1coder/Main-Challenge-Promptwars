import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRuleBasedBriefing,
  generateGroundedBriefings
} from '../src/lib/services/geminiService.js';

vi.mock('../src/lib/googleServices.js', () => ({
  getAuthenticatedIdToken: () => Promise.resolve('test.firebase.id.token')
}));

const analytics = {
  isBenchmark: true,
  totalRows: 3,
  aqi: {
    aqi: 180,
    category: 'Moderate',
    dominantPollutant: 'pm25',
    isCompleteOfficialAQI: false,
    hasSufficientTemporalData: false
  },
  completeness: 90,
  confidenceTier: 'MODERATE',
  totalMissing: 1,
  anomaliesSummary: { total: 0 },
  primaryHotspot: {
    ward: 'Ward A',
    meanPM25: 70,
    maxPM25: 90,
    severeExceedances: 0,
    exceedanceRate: 0,
    readingsCount: 3
  },
  hotspots: [],
  peakExposureWindow: '08:00 - 09:00',
  pollutantStats: {
    pm25: { mean: 70, max: 90, p95: 90 }
  },
  availablePollutants: ['pm25']
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Grounded briefing service', () => {
  it('clearly labels the fallback and cites only supplied measurements', () => {
    const result = createRuleBasedBriefing(analytics);
    expect(result.source).toBe('rule-based-fallback');
    expect(result.data.executiveSummary).toContain('3 observations');
    expect(result.data.wardOfficer.evidenceMetric).toContain('180');
    expect(result.data.wardOfficer.actions.join(' ')).toContain('70 µg/m³');
    expect(result.data.uncertaintyNotes).toContain('below the CPCB 16-hour qualification');
  });

  it('does not replace absent measurements or hotspots with sample values', () => {
    const withoutMeasurements = {
      ...analytics,
      primaryHotspot: null,
      pollutantStats: {},
      aqi: { ...analytics.aqi, aqi: null }
    };
    const result = createRuleBasedBriefing(withoutMeasurements);
    expect(result.data.wardOfficer.evidenceMetric).toContain('not available');
    expect(result.data.wardOfficer.actions.join(' ')).not.toContain('140');
    expect(result.data.wardOfficer.actions.join(' ')).toContain('Review station-level records');
  });

  it('uses the deterministic fallback when the serverless route is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const result = await generateGroundedBriefings(analytics, { title: 'Benchmark case' });
    expect(result.source).toBe('rule-based-fallback');
    expect(result.data.executiveSummary).toContain('Benchmark');
  });

  it('surfaces invalid requests instead of disguising them as a fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid analytics payload.' })
    }));
    await expect(generateGroundedBriefings(analytics)).rejects.toThrow('Invalid analytics payload');
  });
});
