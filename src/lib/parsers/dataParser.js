/**
 * Civic Air Quality Briefing Studio - Data Parser & Normalizer
 * Deterministic ingestion of CSV, TSV, and tabular text.
 */

// Header alias lookup tables (normalized to lowercase, non-alphanumeric stripped)
const HEADER_ALIASES = {
  timestamp: ['timestamp', 'time', 'datetime', 'date', 'recordedat', 'recorded_at', 'readingtime'],
  ward: ['ward', 'location', 'station', 'site', 'area', 'sensorid', 'sensor_id', 'monitor', 'zone'],
  pm25: ['pm25', 'pm25ugm3', 'pm25ugm3', 'pm25conc', 'particulatematter25', 'pm25ppm'],
  pm10: ['pm10', 'pm10ugm3', 'pm10conc', 'particulatematter10'],
  no2: ['no2', 'no2ugm3', 'no2ppm', 'no2ppb', 'nitrogendioxide'],
  so2: ['so2', 'so2ugm3', 'so2ppm', 'so2ppb', 'sulfurdioxide'],
  co: ['co', 'comgm3', 'coppm', 'carbonmonoxide'],
  o3: ['o3', 'ozone', 'o3ugm3', 'o3ppm', 'o3ppb'],
  latitude: ['latitude', 'lat', 'y', 'gpslat', 'coordlat', 'latdeg'],
  longitude: ['longitude', 'lon', 'lng', 'long', 'x', 'gpslon', 'coordlon', 'londeg']
};

// Standard gas molecular weights at 25°C, 101.325 kPa for ppm -> µg/m³
// Formula: µg/m³ = (ppm * MW * 1000) / 24.45
const GAS_CONVERSIONS_PPM_TO_UGM3 = {
  no2: 1881.8,
  so2: 2620.4,
  co: 1145.6,
  o3: 1963.2
};

/**
 * Autodetect delimiter from the first few lines of tabular text.
 */
export function detectDelimiter(text) {
  const sample = text.split(/\r?\n/).filter(line => !line.trim().startsWith('#')).slice(0, 5).join('\n');
  const counts = {
    ',': (sample.match(/,/g) || []).length,
    '\t': (sample.match(/\t/g) || []).length,
    ';': (sample.match(/;/g) || []).length,
    '|': (sample.match(/\|/g) || []).length
  };
  let best = ',';
  let max = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = delim;
    }
  }
  return best;
}

/**
 * Normalize header label to match canonical key.
 */
function cleanKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function matchHeaderAlias(header) {
  const cleaned = cleanKey(header);
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (canonical === cleaned || aliases.includes(cleaned)) {
      return canonical;
    }
    // Substring heuristic (e.g. "Station Name" contains "station", "PM 2.5" contains "pm25")
    for (const alias of aliases) {
      if (cleaned.includes(alias) || alias.includes(cleaned)) {
        return canonical;
      }
    }
  }
  return header.trim();
}

/**
 * Detect unit from header string
 */
function detectHeaderUnit(header) {
  const lower = header.toLowerCase();
  if (lower.includes('ppm')) return 'ppm';
  if (lower.includes('ppb')) return 'ppb';
  if (lower.includes('mg/m3') || lower.includes('mg/m³')) return 'mg/m3';
  if (lower.includes('ug/m3') || lower.includes('µg/m3') || lower.includes('ug/m³')) return 'ug/m3';
  return null;
}

/**
 * Main CSV / TSV Parsing function
 */
export function parseAirQualityData(rawText) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Input data is empty. Please upload a valid CSV or paste data.');
  }

  // Strip UTF-8 BOM if present
  let cleanText = rawText.charCodeAt(0) === 0xFEFF ? rawText.slice(1) : rawText;

  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0 && !line.trim().startsWith('#'));
  if (lines.length < 2) {
    throw new Error('Data must contain at least a header row and one row of observations.');
  }

  const delimiter = detectDelimiter(cleanText);
  const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

  // Map headers to canonical aliases & identify units
  const headerMap = [];
  const unitsDetected = {};

  rawHeaders.forEach((rawH, idx) => {
    const canonical = matchHeaderAlias(rawH);
    const unit = detectHeaderUnit(rawH);
    if (unit) {
      unitsDetected[canonical] = unit;
    }
    headerMap.push({
      original: rawH,
      canonical,
      index: idx,
      unit
    });
  });

  const parsedRows = [];
  const anomalies = [];
  const missingCounts = {
    pm25: 0,
    pm10: 0,
    no2: 0,
    so2: 0,
    co: 0,
    o3: 0,
    ward: 0,
    timestamp: 0
  };

  const consecutiveValues = {};

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    const cells = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.length === 0 || (cells.length === 1 && cells[0] === '')) continue;

    const rowObj = {
      _rowIndex: r,
      _flags: []
    };

    headerMap.forEach(({ canonical, index, unit }) => {
      const val = cells[index];

      // Missing value check: NEVER convert missing to 0!
      if (val === undefined || val === null || val === '' || val.toUpperCase() === 'NA' || val.toUpperCase() === 'N/A' || val === '-') {
        rowObj[canonical] = null;
        if (missingCounts[canonical] !== undefined) {
          missingCounts[canonical]++;
        }
        return;
      }

      // Check coordinates
      if (canonical === 'latitude' || canonical === 'longitude') {
        const num = parseFloat(val);
        if (isNaN(num)) {
          rowObj[canonical] = null;
        } else if (canonical === 'latitude' && (num < -90 || num > 90)) {
          rowObj[canonical] = null;
          rowObj._flags.push(`Latitude out of valid range [-90, 90]: ${num}`);
        } else if (canonical === 'longitude' && (num < -180 || num > 180)) {
          rowObj[canonical] = null;
          rowObj._flags.push(`Longitude out of valid range [-180, 180]: ${num}`);
        } else {
          rowObj[canonical] = num;
        }
        return;
      }

      // Check numeric metrics
      if (['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'].includes(canonical)) {
        const num = parseFloat(val);
        if (isNaN(num)) {
          rowObj[canonical] = null;
          if (missingCounts[canonical] !== undefined) missingCounts[canonical]++;
          rowObj._flags.push(`Non-numeric value in ${canonical}: "${val}"`);
          return;
        }

        // Anomaly: Negative readings
        if (num < 0) {
          rowObj[canonical] = null;
          rowObj._flags.push(`Negative reading rejected for ${canonical}: ${num}`);
          anomalies.push({
            row: r,
            type: 'NEGATIVE_VALUE',
            message: `Row ${r}: Negative ${canonical} reading (${num}) rejected as sensor fault.`
          });
          return;
        }

        // Anomaly: Extreme implausible spikes (> 1500 ug/m3 for PM2.5)
        if (canonical === 'pm25' && num > 1500) {
          rowObj._flags.push(`Extreme spike in PM2.5: ${num} µg/m³`);
          anomalies.push({
            row: r,
            type: 'EXTREME_SPIKE',
            message: `Row ${r}: Extreme PM2.5 spike (${num} µg/m³) flagged.`
          });
        }

        // Unit normalization to µg/m³
        let normalized = num;
        if (unit === 'ppm' && GAS_CONVERSIONS_PPM_TO_UGM3[canonical]) {
          normalized = parseFloat(((num * GAS_CONVERSIONS_PPM_TO_UGM3[canonical])).toFixed(2));
        } else if (unit === 'ppb' && GAS_CONVERSIONS_PPM_TO_UGM3[canonical]) {
          normalized = parseFloat(((num * GAS_CONVERSIONS_PPM_TO_UGM3[canonical]) / 1000).toFixed(2));
        } else if (unit === 'mg/m3') {
          normalized = num * 1000;
        }

        rowObj[canonical] = normalized;

        // Flatlining detection (check if same value repeats 5+ times in a row)
        if (!consecutiveValues[canonical]) {
          consecutiveValues[canonical] = { val: normalized, count: 1 };
        } else if (consecutiveValues[canonical].val === normalized) {
          consecutiveValues[canonical].count++;
          if (consecutiveValues[canonical].count === 5) {
            anomalies.push({
              row: r,
              type: 'SENSOR_FLATLINE',
              message: `Sensor flatline detected for ${canonical} starting at row ${r - 4} (identical reading: ${normalized}).`
            });
            rowObj._flags.push(`Flatline sequence in ${canonical}`);
          }
        } else {
          consecutiveValues[canonical] = { val: normalized, count: 1 };
        }
      } else if (canonical === 'timestamp') {
        // Timestamp handling
        rowObj.timestamp = val;
      } else if (canonical === 'ward') {
        rowObj.ward = val;
      } else {
        rowObj[canonical] = val;
      }
    });

    // Fallback if ward not specified
    if (!rowObj.ward) {
      rowObj.ward = 'General Monitoring Station';
    }

    parsedRows.push(rowObj);
  }

  if (parsedRows.length === 0) {
    throw new Error('No valid rows could be parsed from the provided input.');
  }

  return {
    rows: parsedRows,
    totalRows: parsedRows.length,
    delimiter,
    headers: headerMap,
    unitsDetected,
    missingCounts,
    anomalies: anomalies.slice(0, 20), // Cap at 20 alerts to prevent UI lag
    totalAnomaliesCount: anomalies.length
  };
}
