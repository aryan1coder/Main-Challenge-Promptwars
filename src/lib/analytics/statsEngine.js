/**
 * Civic Air Quality Briefing Studio - Statistical Analytics Engine
 * Deterministic mathematical computation of air-quality metrics, hotspots, and trends.
 */

import { determineOverallAQI } from './aqiCalculator.js';

/**
 * Calculate basic parametric and non-parametric stats for an array of numbers.
 */
export function computeSeriesStats(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      p95: null,
      min: null,
      max: null,
      stdDev: null
    };
  }

  valid.sort((a, b) => a - b);

  const sum = valid.reduce((acc, val) => acc + val, 0);
  const mean = parseFloat((sum / valid.length).toFixed(2));

  // Median
  const mid = Math.floor(valid.length / 2);
  const median = valid.length % 2 !== 0 
    ? valid[mid] 
    : parseFloat(((valid[mid - 1] + valid[mid]) / 2).toFixed(2));

  // 95th Percentile
  const p95Idx = Math.floor(valid.length * 0.95);
  const p95 = valid[Math.min(p95Idx, valid.length - 1)];

  // Variance & StdDev
  const variance = valid.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / valid.length;
  const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

  return {
    count: valid.length,
    mean,
    median,
    p95,
    min: valid[0],
    max: valid[valid.length - 1],
    stdDev
  };
}

/**
 * Analyze an entire parsed dataset and extract all civic intelligence metrics.
 */
export function analyzeAirQualityDataset(parsedResult) {
  const { rows, totalRows, missingCounts, anomalies, totalAnomaliesCount } = parsedResult;

  const pollutants = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'];
  const availablePollutants = [];
  const pollutantStats = {};

  pollutants.forEach(p => {
    const vals = rows.map(r => r[p]).filter(v => v !== null && v !== undefined);
    if (vals.length > 0) {
      availablePollutants.push(p);
      pollutantStats[p] = computeSeriesStats(vals);
    }
  });

  // Calculate overall AQI based on available means
  const meansMap = {};
  Object.keys(pollutantStats).forEach(p => {
    meansMap[p] = pollutantStats[p].mean;
  });
  const aqiResult = determineOverallAQI(meansMap);

  // Group by Ward/Station to identify spatial Hotspots
  const wardGroups = {};
  rows.forEach(r => {
    const ward = r.ward || 'General Station';
    if (!wardGroups[ward]) {
      wardGroups[ward] = {
        name: ward,
        pm25Vals: [],
        pm10Vals: [],
        no2Vals: [],
        totalReadings: 0,
        severeExceedances: 0 // PM2.5 > 120 ug/m3
      };
    }
    wardGroups[ward].totalReadings++;
    if (r.pm25 !== null && r.pm25 !== undefined) {
      wardGroups[ward].pm25Vals.push(r.pm25);
      if (r.pm25 > 120) {
        wardGroups[ward].severeExceedances++;
      }
    }
    if (r.pm10 !== null && r.pm10 !== undefined) {
      wardGroups[ward].pm10Vals.push(r.pm10);
    }
    if (r.no2 !== null && r.no2 !== undefined) {
      wardGroups[ward].no2Vals.push(r.no2);
    }
  });

  const hotspots = Object.values(wardGroups).map(w => {
    const stats = computeSeriesStats(w.pm25Vals);
    return {
      ward: w.name,
      meanPM25: stats.mean,
      maxPM25: stats.max,
      readingsCount: w.totalReadings,
      severeExceedances: w.severeExceedances,
      exceedanceRate: stats.count > 0 ? parseFloat(((w.severeExceedances / stats.count) * 100).toFixed(1)) : 0
    };
  });

  // Sort hotspots by highest mean PM2.5
  hotspots.sort((a, b) => (b.meanPM25 || 0) - (a.meanPM25 || 0));

  // Diurnal / Hourly Trend Analysis
  const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, vals: [] }));
  rows.forEach(r => {
    if (r.timestamp && r.pm25 !== null && r.pm25 !== undefined) {
      // Parse hour from ISO string or time string
      const match = r.timestamp.match(/(\d{1,2}):\d{2}/) || r.timestamp.match(/T(\d{2}):/);
      if (match) {
        const hr = parseInt(match[1], 10);
        if (hr >= 0 && hr < 24) {
          hourlyBuckets[hr].vals.push(r.pm25);
        }
      }
    }
  });

  const diurnalTrends = hourlyBuckets.map(b => ({
    hour: b.hour,
    count: b.vals.length,
    mean: b.vals.length > 0 ? parseFloat((b.vals.reduce((s, v) => s + v, 0) / b.vals.length).toFixed(1)) : null
  })).filter(b => b.mean !== null);

  // Peak exposure window
  let peakHour = null;
  let maxHourlyMean = 0;
  diurnalTrends.forEach(d => {
    if (d.mean && d.mean > maxHourlyMean) {
      maxHourlyMean = d.mean;
      peakHour = d.hour;
    }
  });

  // Data completeness & Uncertainty Flagging
  const totalExpectedCells = totalRows * (availablePollutants.length || 1);
  const totalMissing = availablePollutants.reduce((sum, p) => sum + (missingCounts[p] || 0), 0);
  const completeness = totalExpectedCells > 0 
    ? Math.max(0, parseFloat((((totalExpectedCells - totalMissing) / totalExpectedCells) * 100).toFixed(1)))
    : 100;

  let confidenceTier = 'HIGH';
  if (completeness < 70 || totalAnomaliesCount > 10) {
    confidenceTier = 'LOW';
  } else if (completeness < 88) {
    confidenceTier = 'MODERATE';
  }

  return {
    totalRows,
    availablePollutants,
    pollutantStats,
    aqi: aqiResult,
    hotspots,
    primaryHotspot: hotspots[0] || null,
    diurnalTrends,
    peakExposureWindow: peakHour !== null ? `${String(peakHour).padStart(2, '0')}:00 - ${String(peakHour + 1).padStart(2, '0')}:00` : 'Insufficient hourly timestamps',
    completeness,
    confidenceTier,
    totalMissing,
    missingCounts,
    anomaliesSummary: {
      total: totalAnomaliesCount,
      recent: anomalies
    }
  };
}
