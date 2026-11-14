import { Flame, Clock, ShieldCheck, TrendingUp, Activity, Wind } from 'lucide-react';
import { getHealthAdvisory } from '../lib/analytics/aqiCalculator';

export default function MetricsGrid({ analytics, language = 'en' }) {
  if (!analytics) return null;

  const {
    totalRows,
    aqi,
    pollutantStats,
    primaryHotspot,
    peakExposureWindow,
    completeness,
    consistency,
    sensorReliability,
    sourceAuthenticity,
    totalMissing,
    anomaliesSummary
  } = analytics;

  const pm25Stats = pollutantStats?.pm25 || { mean: 'N/A', max: 'N/A', min: 'N/A', stdDev: 'N/A', p95: 'N/A' };
  const pm10Stats = pollutantStats?.pm10 || { mean: 'N/A', max: 'N/A', min: 'N/A' };
  const healthNote = getHealthAdvisory(aqi?.category || 'Moderate', language);

  return (
    <section className="metrics-section" id="overview" aria-labelledby="metrics-heading">
      <div className="section-header-compact">
        <div>
          <h2 id="metrics-heading" className="section-title">Command Overview & Key Performance Indicators</h2>
          <p className="section-subtitle">Real-time deterministic summary derived directly from validated sensor telemetry</p>
        </div>
        <span className="badge badge-verified">
          <ShieldCheck size={14} aria-hidden="true" />
          100% Programmatic Math (Zero Hallucination)
        </span>
      </div>

      <div className="telemetry-grid">
        {/* Card 1: Official AQI vs Sub-Index */}
        <div className="telemetry-card aqi-card" style={{ borderTopColor: aqi?.color || '#2563eb' }}>
          <div className="card-top">
            <span className="telemetry-label">
              {aqi?.isCompleteOfficialAQI ? 'Official CPCB National AQI' : 'CPCB AQI Sub-Index (Indicative)'}
            </span>
            <span
              className="aqi-category-pill"
              style={{
                backgroundColor: `${aqi?.color || '#2563eb'}20`,
                color: aqi?.color || '#2563eb',
                borderColor: aqi?.color || '#2563eb'
              }}
            >
              {aqi?.category || 'Moderate'}
            </span>
          </div>
          <div className="aqi-display">
            <span className="aqi-value" style={{ color: aqi?.color || '#2563eb' }}>{aqi?.aqi ?? 0}</span>
            <span className="aqi-scale">/ 500 Index</span>
          </div>
          <p className="aqi-advisory">{healthNote}</p>
          <div className="card-meta">
            Dominant: <strong>{aqi?.dominantPollutant?.toUpperCase()}</strong> | {aqi?.coverageNote}
          </div>
          <div className="card-meta-secondary">
            Methodology: <em>{aqi?.calculationMethodology}</em> ({aqi?.temporalQualification})
          </div>
        </div>

        {/* Card 2: PM2.5 Concentration Mean & Distribution */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">PM2.5 (Fine Particulates)</span>
            <TrendingUp size={16} className="text-civic-blue" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-number">{pm25Stats.mean !== null ? pm25Stats.mean : 'N/A'}</span>
            <span className="stat-unit">µg/m³ Mean</span>
          </div>
          <div className="stat-sub-row">
            <span>Peak: <strong>{pm25Stats.max ?? 'N/A'} µg/m³</strong></span>
            <span>Min: <strong>{pm25Stats.min ?? 'N/A'} µg/m³</strong></span>
          </div>
          <div className="card-meta">
            Std Dev: ±{pm25Stats.stdDev ?? 0} µg/m³ (95th Pctl: {pm25Stats.p95 ?? 'N/A'})
          </div>
        </div>

        {/* Card 3: PM10 Coarse Particulates */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">PM10 (Coarse Particulates)</span>
            <Wind size={16} className="text-civic-slate" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-number">{pm10Stats.mean !== 'N/A' && pm10Stats.mean !== null ? pm10Stats.mean : 'N/A'}</span>
            <span className="stat-unit">µg/m³ Mean</span>
          </div>
          <div className="stat-sub-row">
            <span>Peak: <strong>{pm10Stats.max !== 'N/A' && pm10Stats.max !== null ? `${pm10Stats.max} µg/m³` : 'N/A'}</strong></span>
            <span>Min: <strong>{pm10Stats.min !== 'N/A' && pm10Stats.min !== null ? `${pm10Stats.min} µg/m³` : 'N/A'}</strong></span>
          </div>
          <div className="card-meta">
            {pm10Stats.mean !== 'N/A' ? 'Coarse particulate respirable fraction' : 'Unmonitored in current dataset'}
          </div>
        </div>

        {/* Card 4: Primary Spatial Hotspot */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Primary Spatial Hotspot</span>
            <Flame size={16} className="text-amber-600" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-text-highlight">{primaryHotspot?.ward || 'General Station'}</span>
          </div>
          <div className="stat-sub-row">
            <span>Hotspot Mean: <strong>{primaryHotspot?.meanPM25 ?? 'N/A'} µg/m³</strong></span>
            <span>Peak: <strong>{primaryHotspot?.maxPM25 ?? 'N/A'} µg/m³</strong></span>
          </div>
          <div className="card-meta text-red-600">
            {primaryHotspot?.severeExceedances || 0} readings above severe threshold (&gt;120 µg/m³)
          </div>
        </div>

        {/* Card 5: Observation Count & Exposure Window */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Exposure Window & Count</span>
            <Clock size={16} className="text-civic-blue" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-subtext-window">{peakExposureWindow}</span>
          </div>
          <div className="stat-sub-row">
            <span>Verified Count: <strong>{totalRows} observations</strong></span>
            <span>Hours: <strong>~{analytics?.hoursCovered || 24}h</strong></span>
          </div>
          <div className="card-meta">
            Peak diurnal window derived from hourly grouping
          </div>
        </div>

        {/* Card 6: Data Completeness & Sensor Fidelity */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Completeness & Sensor Quality</span>
            <Activity size={16} className="text-emerald-600" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-number">{completeness}%</span>
            <span className="stat-unit">Completeness</span>
          </div>
          <div className="stat-sub-row">
            <span>Missing: <strong>{totalMissing} points</strong></span>
            <span>Hardware Faults: <strong>{anomaliesSummary?.total || 0}</strong></span>
          </div>
          <div className="card-meta">
            Sensor anomalies screened (Never converted to 0)
          </div>
        </div>
      </div>

      {/* 4 Distinct Data Confidence Dimensions Bar */}
      <div className="confidence-breakdown-bar" role="region" aria-label="Data Confidence Dimensions">
        <div className="confidence-dim">
          <span className="dim-label">1. Completeness:</span>
          <span className="dim-val"><strong>{completeness}%</strong> continuous intervals</span>
        </div>
        <div className="confidence-dim">
          <span className="dim-label">2. Consistency:</span>
          <span className="dim-val">{consistency}</span>
        </div>
        <div className="confidence-dim">
          <span className="dim-label">3. Sensor Reliability:</span>
          <span className="dim-val">{sensorReliability}</span>
        </div>
        <div className="confidence-dim">
          <span className="dim-label">4. Source Authenticity:</span>
          <span className={`dim-val ${analytics.isBenchmark ? 'text-amber-700 font-semibold' : 'text-emerald-700'}`}>
            {sourceAuthenticity}
          </span>
        </div>
      </div>
    </section>
  );
}
