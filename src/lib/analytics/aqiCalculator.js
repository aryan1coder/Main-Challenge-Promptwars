/**
 * Civic Air Quality Briefing Studio - AQI Calculator
 * Deterministic computation of sub-indices per Indian NAAQS (CPCB) standards.
 */

// Official CPCB 24-hr average Breakpoints
export const CPCB_BREAKPOINTS = {
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50, category: 'Good', color: '#16a34a' },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200, category: 'Moderate', color: '#eab308' },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, category: 'Good', color: '#16a34a' },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200, category: 'Moderate', color: '#eab308' },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  no2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50, category: 'Good', color: '#16a34a' },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200, category: 'Moderate', color: '#eab308' },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 401, cHigh: 800, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ]
};

/**
 * Linear interpolation formula:
 * Ip = [ (Ihi - Ilo) / (BPhi - BPlo) ] * (Cp - BPlo) + Ilo
 */
export function calculateSubIndex(concentration, pollutant = 'pm25') {
  if (concentration === null || concentration === undefined || isNaN(concentration) || concentration < 0) {
    return null;
  }

  const brackets = CPCB_BREAKPOINTS[pollutant];
  if (!brackets) return null;

  for (const b of brackets) {
    if (concentration >= b.cLow && concentration <= b.cHigh) {
      const subIndex = Math.round(
        ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (concentration - b.cLow) + b.iLow
      );
      return {
        subIndex,
        category: b.category,
        color: b.color,
        pollutant
      };
    }
  }

  const top = brackets[brackets.length - 1];
  if (concentration > top.cHigh) {
    return {
      subIndex: 500,
      category: 'Severe (Emergency)',
      color: '#450a0a',
      pollutant
    };
  }

  return null;
}

/**
 * Determine overall AQI, dominant pollutant, methodology, and CPCB qualifications.
 * 
 * CPCB Rigor Rules:
 * 1. Complete National AQI requires >= 3 criteria pollutants including PM2.5 or PM10.
 * 2. If fewer than 3 are monitored, it is strictly an "Indicative AQI Sub-Index".
 * 3. Temporal qualification: CPCB 24-hr standards require >= 16 hourly data points.
 */
export function determineOverallAQI(averages, options = {}) {
  const { hoursCovered = 24, totalObservations = 24 } = options;

  let maxIndex = 0;
  let dominantPollutant = 'pm25';
  let dominantResult = {
    subIndex: 0,
    category: 'Good',
    color: '#16a34a',
    pollutant: 'pm25'
  };

  const calculatedPollutants = [];
  const individualSubIndices = {};
  const pollutants = ['pm25', 'pm10', 'no2'];

  for (const p of pollutants) {
    if (averages[p] !== undefined && averages[p] !== null) {
      const res = calculateSubIndex(averages[p], p);
      if (res) {
        calculatedPollutants.push(p.toUpperCase());
        individualSubIndices[p] = res;
        if (res.subIndex > maxIndex) {
          maxIndex = res.subIndex;
          dominantPollutant = p;
          dominantResult = res;
        }
      }
    }
  }

  const hasPM = calculatedPollutants.includes('PM25') || calculatedPollutants.includes('PM10');
  const isCompleteOfficialAQI = calculatedPollutants.length >= 3 && hasPM;
  
  // CPCB temporal sufficiency rule: minimum 16 hours of data in a 24-hr monitoring cycle
  const hasSufficientTemporalData = hoursCovered >= 16 || totalObservations >= 16;
  
  let temporalQualification = 'Sufficient 24-hr duration verified (≥16h)';
  if (!hasSufficientTemporalData) {
    temporalQualification = `Limited temporal coverage (~${hoursCovered}h recorded; CPCB regulatory standards require ≥16h of 24h cycle)`;
  }

  const calculationMethodology = `CPCB Linear Breakpoint Interpolation (Max sub-index across ${calculatedPollutants.join(', ') || 'none'})`;

  const coverageNote = isCompleteOfficialAQI
    ? `Multi-parameter official AQI calculated from ${calculatedPollutants.join(', ')}.`
    : `Indicative AQI sub-index derived from ${calculatedPollutants.join(', ')}. Official regulatory CPCB index requires ≥3 parameters including PM.`;

  return {
    aqi: maxIndex,
    category: dominantResult.category,
    color: dominantResult.color,
    dominantPollutant,
    dominantSubIndex: dominantResult.subIndex,
    subIndices: individualSubIndices,
    isCompleteOfficialAQI,
    hasSufficientTemporalData,
    temporalQualification,
    calculationMethodology,
    coverageNote,
    calculatedPollutants
  };
}

/**
 * Get public health advisory text matching AQI category
 */
export function getHealthAdvisory(category, language = 'en') {
  const advisories = {
    Good: {
      en: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
      hi: 'वायु गुणवत्ता संतोषजनक है, और प्रदूषण का स्वास्थ्य पर कोई प्रतिकूल प्रभाव नहीं है।'
    },
    Satisfactory: {
      en: 'Minor breathing discomfort may occur to sensitive individuals.',
      hi: 'संवेदनशील व्यक्तियों को सांस लेने में हल्की असुविधा हो सकती है।'
    },
    Moderate: {
      en: 'Breathing discomfort possible for individuals with asthma, lung, or heart conditions.',
      hi: 'अस्थमा और हृदय रोगियों को सांस लेने में कठिनाई हो सकती है।'
    },
    Poor: {
      en: 'Breathing discomfort to most people on prolonged outdoor exposure.',
      hi: 'लंबे समय तक संपर्क में रहने पर अधिकांश लोगों को सांस लेने में असुविधा हो सकती है।'
    },
    'Very Poor': {
      en: 'Respiratory illness on prolonged exposure. Pronounced effect on vulnerable lung/cardiac groups.',
      hi: 'लंबे समय तक रहने पर श्वसन संबंधी समस्याएं हो सकती हैं। फेफड़ों और हृदय रोगियों पर गंभीर प्रभाव।'
    },
    Severe: {
      en: 'Healthy people may experience respiratory discomfort; serious impacts on vulnerable groups. Avoid outdoor exertion.',
      hi: 'स्वस्थ लोगों को भी श्वसन संबंधी समस्याएं हो सकती हैं। बाहर जाने से बचें और मास्क पहनें।'
    },
    'Severe (Emergency)': {
      en: 'Public health emergency. High exposure risk. Protective indoor staying advised.',
      hi: 'सार्वजनिक स्वास्थ्य आपातकाल। अत्यधिक श्वसन जोखिम। घर के अंदर रहने की सलाह।'
    }
  };

  return advisories[category] ? advisories[category][language] || advisories[category].en : advisories.Moderate[language];
}
