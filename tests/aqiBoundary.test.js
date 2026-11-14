import { describe, it, expect } from 'vitest';
import {
  calculateSubIndex,
  determineOverallAQI,
  getHealthAdvisory
} from '../src/lib/analytics/aqiCalculator.js';

describe('CPCB National AQI Boundary & Edge Cases Suite', () => {
  describe('PM2.5 Breakpoints and Category Transitions', () => {
    it('evaluates lower and upper bounds of Good category (0 - 30 µg/m³)', () => {
      const minGood = calculateSubIndex(0, 'pm25');
      expect(minGood.subIndex).toBe(0);
      expect(minGood.category).toBe('Good');

      const maxGood = calculateSubIndex(30, 'pm25');
      expect(maxGood.subIndex).toBe(50);
      expect(maxGood.category).toBe('Good');
    });

    it('evaluates lower and upper bounds of Satisfactory category (31 - 60 µg/m³)', () => {
      const minSat = calculateSubIndex(31, 'pm25');
      expect(minSat.subIndex).toBe(51);
      expect(minSat.category).toBe('Satisfactory');

      const maxSat = calculateSubIndex(60, 'pm25');
      expect(maxSat.subIndex).toBe(100);
      expect(maxSat.category).toBe('Satisfactory');
    });

    it('evaluates lower and upper bounds of Moderate category (61 - 90 µg/m³)', () => {
      const minMod = calculateSubIndex(61, 'pm25');
      expect(minMod.subIndex).toBe(101);
      expect(minMod.category).toBe('Moderate');

      const maxMod = calculateSubIndex(90, 'pm25');
      expect(maxMod.subIndex).toBe(200);
      expect(maxMod.category).toBe('Moderate');
    });

    it('evaluates lower and upper bounds of Poor category (91 - 120 µg/m³)', () => {
      const minPoor = calculateSubIndex(91, 'pm25');
      expect(minPoor.subIndex).toBe(201);
      expect(minPoor.category).toBe('Poor');

      const maxPoor = calculateSubIndex(120, 'pm25');
      expect(maxPoor.subIndex).toBe(300);
      expect(maxPoor.category).toBe('Poor');
    });

    it('evaluates lower and upper bounds of Very Poor category (121 - 250 µg/m³)', () => {
      const minVPoor = calculateSubIndex(121, 'pm25');
      expect(minVPoor.subIndex).toBe(301);
      expect(minVPoor.category).toBe('Very Poor');

      const maxVPoor = calculateSubIndex(250, 'pm25');
      expect(maxVPoor.subIndex).toBe(400);
      expect(maxVPoor.category).toBe('Very Poor');
    });

    it('evaluates lower and upper bounds of Severe category (251 - 500 µg/m³)', () => {
      const minSevere = calculateSubIndex(251, 'pm25');
      expect(minSevere.subIndex).toBe(401);
      expect(minSevere.category).toBe('Severe');

      const maxSevere = calculateSubIndex(500, 'pm25');
      expect(maxSevere.subIndex).toBe(500);
      expect(maxSevere.category).toBe('Severe');
    });

    it('clamps concentrations above 500 µg/m³ to Severe (Emergency)', () => {
      const emergency = calculateSubIndex(650, 'pm25');
      expect(emergency.subIndex).toBe(500);
      expect(emergency.category).toBe('Severe (Emergency)');
    });
  });

  describe('PM10 Breakpoints and Category Transitions', () => {
    it('evaluates lower and upper bounds across PM10 categories', () => {
      expect(calculateSubIndex(0, 'pm10')).toEqual(expect.objectContaining({ subIndex: 0, category: 'Good' }));
      expect(calculateSubIndex(50, 'pm10')).toEqual(expect.objectContaining({ subIndex: 50, category: 'Good' }));
      expect(calculateSubIndex(51, 'pm10')).toEqual(expect.objectContaining({ subIndex: 51, category: 'Satisfactory' }));
      expect(calculateSubIndex(100, 'pm10')).toEqual(expect.objectContaining({ subIndex: 100, category: 'Satisfactory' }));
      expect(calculateSubIndex(101, 'pm10')).toEqual(expect.objectContaining({ subIndex: 101, category: 'Moderate' }));
      expect(calculateSubIndex(250, 'pm10')).toEqual(expect.objectContaining({ subIndex: 200, category: 'Moderate' }));
      expect(calculateSubIndex(251, 'pm10')).toEqual(expect.objectContaining({ subIndex: 201, category: 'Poor' }));
      expect(calculateSubIndex(350, 'pm10')).toEqual(expect.objectContaining({ subIndex: 300, category: 'Poor' }));
      expect(calculateSubIndex(351, 'pm10')).toEqual(expect.objectContaining({ subIndex: 301, category: 'Very Poor' }));
      expect(calculateSubIndex(430, 'pm10')).toEqual(expect.objectContaining({ subIndex: 400, category: 'Very Poor' }));
      expect(calculateSubIndex(431, 'pm10')).toEqual(expect.objectContaining({ subIndex: 401, category: 'Severe' }));
      expect(calculateSubIndex(600, 'pm10')).toEqual(expect.objectContaining({ subIndex: 500, category: 'Severe' }));
      expect(calculateSubIndex(750, 'pm10')).toEqual(expect.objectContaining({ subIndex: 500, category: 'Severe (Emergency)' }));
    });
  });

  describe('NO2 Breakpoints and Category Transitions', () => {
    it('evaluates lower and upper bounds across NO2 categories', () => {
      expect(calculateSubIndex(0, 'no2')).toEqual(expect.objectContaining({ subIndex: 0, category: 'Good' }));
      expect(calculateSubIndex(40, 'no2')).toEqual(expect.objectContaining({ subIndex: 50, category: 'Good' }));
      expect(calculateSubIndex(41, 'no2')).toEqual(expect.objectContaining({ subIndex: 51, category: 'Satisfactory' }));
      expect(calculateSubIndex(80, 'no2')).toEqual(expect.objectContaining({ subIndex: 100, category: 'Satisfactory' }));
      expect(calculateSubIndex(81, 'no2')).toEqual(expect.objectContaining({ subIndex: 101, category: 'Moderate' }));
      expect(calculateSubIndex(180, 'no2')).toEqual(expect.objectContaining({ subIndex: 200, category: 'Moderate' }));
      expect(calculateSubIndex(181, 'no2')).toEqual(expect.objectContaining({ subIndex: 201, category: 'Poor' }));
      expect(calculateSubIndex(280, 'no2')).toEqual(expect.objectContaining({ subIndex: 300, category: 'Poor' }));
      expect(calculateSubIndex(281, 'no2')).toEqual(expect.objectContaining({ subIndex: 301, category: 'Very Poor' }));
      expect(calculateSubIndex(400, 'no2')).toEqual(expect.objectContaining({ subIndex: 400, category: 'Very Poor' }));
      expect(calculateSubIndex(401, 'no2')).toEqual(expect.objectContaining({ subIndex: 401, category: 'Severe' }));
      expect(calculateSubIndex(800, 'no2')).toEqual(expect.objectContaining({ subIndex: 500, category: 'Severe' }));
      expect(calculateSubIndex(900, 'no2')).toEqual(expect.objectContaining({ subIndex: 500, category: 'Severe (Emergency)' }));
    });
  });

  describe('Invalid and Extreme Inputs', () => {
    it('returns null for negative, null, undefined, and NaN inputs', () => {
      expect(calculateSubIndex(-10, 'pm25')).toBeNull();
      expect(calculateSubIndex(null, 'pm25')).toBeNull();
      expect(calculateSubIndex(undefined, 'pm25')).toBeNull();
      expect(calculateSubIndex(NaN, 'pm25')).toBeNull();
      expect(calculateSubIndex(50, 'unsupported_pollutant')).toBeNull();
    });
  });

  describe('Official Multi-Parameter vs Indicative Sub-Index Qualification', () => {
    it('labels single pollutant coverage strictly as Indicative AQI Sub-Index', () => {
      const result = determineOverallAQI({ pm25: 150 });
      expect(result.isCompleteOfficialAQI).toBe(false);
      expect(result.coverageNote).toContain('Indicative AQI sub-index');
      expect(result.coverageNote).toContain('Official regulatory CPCB index requires ≥3 parameters');
      expect(result.calculatedPollutants).toEqual(['PM25']);
    });

    it('labels 3 criteria pollutants with PM as Official CPCB National AQI', () => {
      const result = determineOverallAQI({ pm25: 150, pm10: 200, no2: 60 });
      expect(result.isCompleteOfficialAQI).toBe(true);
      expect(result.coverageNote).toContain('Multi-parameter official AQI calculated from PM25, PM10, NO2');
      expect(result.calculatedPollutants).toHaveLength(3);
    });

    it('correctly picks the dominant pollutant by maximum sub-index', () => {
      // PM2.5 = 20 (Good, subIndex ~ 33)
      // PM10 = 300 (Poor, subIndex ~ 250)
      // NO2 = 50 (Satisfactory, subIndex ~ 62)
      const result = determineOverallAQI({ pm25: 20, pm10: 300, no2: 50 });
      expect(result.dominantPollutant).toBe('pm10');
      expect(result.category).toBe('Poor');
      expect(result.aqi).toBeGreaterThanOrEqual(201);
      expect(result.aqi).toBeLessThanOrEqual(300);
    });
  });

  describe('CPCB Temporal Sufficiency Verification (≥16h Rule)', () => {
    it('qualifies dataset as insufficient when hours covered is under 16', () => {
      const result = determineOverallAQI({ pm25: 120 }, { hoursCovered: 8, totalObservations: 8 });
      expect(result.hasSufficientTemporalData).toBe(false);
      expect(result.temporalQualification).toContain('Limited temporal coverage (~8h recorded; CPCB regulatory standards require ≥16h of 24h cycle)');
    });

    it('validates temporal sufficiency when hours covered is 16 or more', () => {
      const result = determineOverallAQI({ pm25: 120 }, { hoursCovered: 24, totalObservations: 24 });
      expect(result.hasSufficientTemporalData).toBe(true);
      expect(result.temporalQualification).toContain('Sufficient 24-hr duration verified (≥16h)');
    });
  });

  describe('Bilingual Public Health Advisories', () => {
    it('returns exact English advisory strings for all categories', () => {
      expect(getHealthAdvisory('Good', 'en')).toContain('Air quality is considered satisfactory');
      expect(getHealthAdvisory('Poor', 'en')).toContain('Breathing discomfort to most people');
      expect(getHealthAdvisory('Severe', 'en')).toContain('Avoid outdoor exertion');
      expect(getHealthAdvisory('Severe (Emergency)', 'en')).toContain('Public health emergency');
    });

    it('returns exact Hindi advisory strings for all categories', () => {
      expect(getHealthAdvisory('Good', 'hi')).toContain('वायु गुणवत्ता संतोषजनक है');
      expect(getHealthAdvisory('Poor', 'hi')).toContain('सांस लेने में असुविधा');
      expect(getHealthAdvisory('Severe', 'hi')).toContain('बाहर जाने से बचें');
      expect(getHealthAdvisory('Severe (Emergency)', 'hi')).toContain('सार्वजनिक स्वास्थ्य आपातकाल');
    });
  });
});
