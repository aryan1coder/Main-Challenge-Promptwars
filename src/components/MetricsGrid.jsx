import { Flame, Clock, ShieldCheck, TrendingUp } from 'lucide-react';
import { getHealthAdvisory } from '../lib/analytics/aqiCalculator';

export default function MetricsGrid({ analytics, language = 'en' }) {
  if (!analytics) return null;

  const { aqi, pollutantStats, primaryHotspot, peakExposureWindow, completeness, totalMissing, anomaliesSummary } = analytics;
  const pm25Stats = pollutantStats?.pm25 || { mean: 'N/A', max: 'N/A', min: 'N/A', stdDev: 'N/A' };
  const healthNote = getHealthAdvisory(aqi.category, language);

  return (
    <section className="metrics-section" aria-labelledby="metrics-heading">
      <div className="section-header-compact">
        <h2 id="metrics-heading" className="section-title">2. Deterministic Telemetry & Evidence Base</h2>
        <span className="badge badge-verified">
          <ShieldCheck size={14} aria-hidden="true" />
          100% Programmatic Math (No Hallucinations)
        </span>
      </div>

      <div className="telemetry-grid">
        {/* Card 1: Official AQI vs Sub-Index */}
        <div className="telemetry-card aqi-card" style={{ borderTopColor: aqi.color }}>
          <div className="card-top">
            <span className="telemetry-label">
              {aqi.isCompleteOfficialAQI ? 'Official CPCB National AQI' : 'CPCB AQI Sub-Index (Indicative)'}
            </span>
            <span className="aqi-category-pill" style={{ backgroundColor: `${aqi.color}20`, color: aqi.color, borderColor: aqi.color }}>
              {aqi.category}
            </span>
          </div>
          <div className="aqi-display">
            <span className="aqi-value" style={{ color: aqi.color }}>{aqi.aqi}</span>
            <span className="aqi-scale">/ 500 Sub-Index</span>
          </div>
          <p className="aqi-advisory">{healthNote}</p>
          <div className="card-meta">
            Dominant: <strong>{aqi.dominantPollutant.toUpperCase()}</strong> | {aqi.coverageNote}
          </div>
        </div>

        {/* Card 2: PM2.5 Concentration Stats */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">PM2.5 Concentration</span>
            <TrendingUp size={16} className="text-civic-slate" aria-hidden="true" />
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

        {/* Card 3: Primary Spatial Hotspot */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Primary Spatial Hotspot</span>
            <Flame size={16} className="text-amber-600" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-text-highlight">{primaryHotspot?.ward || 'General Area'}</span>
          </div>
          <div className="stat-sub-row">
            <span>Hotspot Mean: <strong>{primaryHotspot?.meanPM25 ?? 'N/A'} µg/m³</strong></span>
            <span>Peak: <strong>{primaryHotspot?.maxPM25 ?? 'N/A'} µg/m³</strong></span>
          </div>
          <div className="card-meta text-red-600">
            {primaryHotspot?.severeExceedances || 0} readings above severe threshold (&gt;120 µg/m³)
          </div>
        </div>

        {/* Card 4: Exposure Window & Data Integrity */}
        <div className="telemetry-card">
          <div className="card-top">
            <span className="telemetry-label">Exposure Window & Sensor Quality</span>
            <Clock size={16} className="text-civic-blue" aria-hidden="true" />
          </div>
          <div className="stat-main">
            <span className="stat-subtext-window">{peakExposureWindow}</span>
          </div>
          <div className="stat-sub-row">
            <span>Completeness: <strong>{completeness}%</strong></span>
            <span>Missing: <strong>{totalMissing} points</strong></span>
          </div>
          <div className="card-meta">
            Anomalies/Faults: <strong>{anomaliesSummary.total} detected</strong> (Never converted to 0)
          </div>
        </div>
      </div>
    </section>
  );
}
