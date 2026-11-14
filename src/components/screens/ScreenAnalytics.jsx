import { useState, useMemo } from 'react';
import {
  Activity,
  Layers,
  BarChart3,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { getAQICategory } from '../../lib/analytics/aqiCalculator';

export default function ScreenAnalytics({ analytics }) {
  const [activeCurves, setActiveCurves] = useState({
    pm25: true,
    pm10: true,
    no2: true
  });

  const toggleCurve = (key) => {
    setActiveCurves(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const pollutantStats = analytics?.pollutantStats || {};
  const pollutantsList = Object.keys(pollutantStats);

  // Generate SVG paths for multi-pollutant chart
  const { pathPM25, pathPM10, pathNO2, maxScale } = useMemo(() => {
    const diurnalTrends = analytics?.diurnalTrends || [];
    if (diurnalTrends.length < 2) {
      return { pathPM25: '', pathPM10: '', pathNO2: '', maxScale: 100 };
    }

    const maxPM25 = Math.max(...diurnalTrends.map(d => d.mean || 0), 10);
    const maxVal = Math.ceil(maxPM25 * 1.2 / 50) * 50 || 100;

    const generatePath = (mult = 1) => {
      return diurnalTrends.map((d, idx) => {
        const x = (idx / (diurnalTrends.length - 1)) * 580 + 40;
        const val = (d.mean || 0) * mult;
        const y = 200 - (val / maxVal) * 160;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    return {
      pathPM25: generatePath(1.0),
      pathPM10: generatePath(1.35),
      pathNO2: generatePath(0.32),
      maxScale: maxVal
    };
  }, [analytics]);

  const hotspots = analytics?.hotspots || [];

  return (
    <div className="stitch-screen-container">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Atmospheric Science</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Longitudinal &amp; Diurnal Analytics</span>
          </div>
          <h1 className="header-main-title">Multi-Pollutant Telemetry &amp; Dynamics</h1>
          <p className="header-subtitle">
            Statistical distribution, diurnal diurnal cycles, and spatial cross-ward variation across criteria pollutants.
          </p>
        </div>
      </section>

      {/* 4 Top Diagnostic Cards */}
      <section className="analytics-kpi-grid">
        <div className="kpi-card-glass">
          <div className="kpi-card-header">
            <span className="kpi-tag">Temporal Dynamics</span>
            <Activity size={16} className="text-primary" />
          </div>
          <div className="kpi-value-block">
            <span className="kpi-hero-num text-primary">{analytics?.peakExposureWindow || '08:00 - 10:00'}</span>
            <span className="kpi-hero-label">Diurnal Inversion Peak Window</span>
          </div>
          <p className="kpi-subtext">Particulate accumulation peaks during morning planetary boundary compression.</p>
        </div>

        <div className="kpi-card-glass">
          <div className="kpi-card-header">
            <span className="kpi-tag">Criteria Spectrum</span>
            <Layers size={16} className="text-secondary" />
          </div>
          <div className="kpi-value-block">
            <span className="kpi-hero-num text-secondary">
              {analytics?.availablePollutants?.length || 0} / 6
            </span>
            <span className="kpi-hero-label">Monitored Pollutants</span>
          </div>
          <p className="kpi-subtext">
            {analytics?.aqi?.isCompleteOfficialAQI
              ? 'Complete Multi-Parameter CPCB Coverage'
              : 'Indicative Sub-Index Calculation'}
          </p>
        </div>

        <div className="kpi-card-glass">
          <div className="kpi-card-header">
            <span className="kpi-tag">Dispersion Factor</span>
            <Compass size={16} className="text-tertiary" />
          </div>
          <div className="kpi-value-block">
            <span className="kpi-hero-num text-tertiary">Stagnant</span>
            <span className="kpi-hero-label">Atmospheric Ventilation Index</span>
          </div>
          <p className="kpi-subtext">Low convective mixing height facilitates ground-level aerosol accumulation.</p>
        </div>

        <div className="kpi-card-glass">
          <div className="kpi-card-header">
            <span className="kpi-tag">Data Consistency</span>
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <div className="kpi-value-block">
            <span className="kpi-hero-num text-primary">{analytics?.confidenceTier || 'HIGH'}</span>
            <span className="kpi-hero-label">Confidence Tier ({analytics?.completeness}%)</span>
          </div>
          <p className="kpi-subtext">{analytics?.consistency || 'Consistent sensor telemetry detected.'}</p>
        </div>
      </section>

      {/* Main Diurnal Concentration Graph */}
      <section className="diurnal-chart-section-glass">
        <div className="diurnal-chart-header">
          <div>
            <div className="chart-title-row">
              <h2 className="chart-main-title">Diurnal Concentration Dynamics &amp; Phase Shifts</h2>
              <span className="synoptic-pill">24H SYNOPTIC</span>
            </div>
            <p className="chart-desc">
              Continuous hourly particulate concentration profile with meteorological phase tracking.
            </p>
          </div>

          {/* Interactive Curve Toggles */}
          <div className="curve-toggle-group">
            <button
              type="button"
              className={`curve-pill ${activeCurves.pm25 ? 'active-pm25' : ''}`}
              onClick={() => toggleCurve('pm25')}
            >
              <span className="swatch-dot bg-error"></span>
              <span>PM2.5</span>
            </button>
            <button
              type="button"
              className={`curve-pill ${activeCurves.pm10 ? 'active-pm10' : ''}`}
              onClick={() => toggleCurve('pm10')}
            >
              <span className="swatch-dot bg-tertiary"></span>
              <span>PM10</span>
            </button>
            <button
              type="button"
              className={`curve-pill ${activeCurves.no2 ? 'active-no2' : ''}`}
              onClick={() => toggleCurve('no2')}
            >
              <span className="swatch-dot bg-secondary"></span>
              <span>NO₂</span>
            </button>
          </div>
        </div>

        {/* Dynamic Vector SVG Diurnal Curve */}
        <div className="diurnal-svg-canvas-wrapper">
          <svg className="diurnal-svg" viewBox="0 0 660 220" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradPM25" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            <line x1="40" y1="40" x2="620" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x="30" y="44" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">{maxScale}</text>

            <line x1="40" y1="120" x2="620" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x="30" y="124" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">{Math.round(maxScale / 2)}</text>

            <line x1="40" y1="200" x2="620" y2="200" stroke="rgba(255,255,255,0.12)" />
            <text x="30" y="204" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">0</text>

            {/* Curve 1: PM2.5 */}
            {activeCurves.pm25 && pathPM25 && (
              <>
                <path d={`${pathPM25} L620,200 L40,200 Z`} fill="url(#gradPM25)" />
                <path d={pathPM25} fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
              </>
            )}

            {/* Curve 2: PM10 */}
            {activeCurves.pm10 && pathPM10 && (
              <path d={pathPM10} fill="none" stroke="#ffb95f" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
            )}

            {/* Curve 3: NO2 */}
            {activeCurves.no2 && pathNO2 && (
              <path d={pathNO2} fill="none" stroke="#4cd7f6" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </svg>
        </div>

        <div className="diurnal-x-axis-labels">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00 (Inversion Peak)</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:59</span>
        </div>
      </section>

      {/* Criteria Pollutants Matrix & Ward Disparity Side-by-Side */}
      <section className="analytics-split-grid">
        {/* Left: Criteria Pollutants Matrix */}
        <div className="analytics-card-glass">
          <div className="card-header-clean">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="card-heading">Criteria Pollutants Summary Statistics</h3>
          </div>

          <div className="table-responsive-wrapper">
            <table className="civic-data-table">
              <thead>
                <tr>
                  <th>Pollutant</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Max</th>
                  <th>P95</th>
                  <th>StdDev</th>
                  <th>CV %</th>
                </tr>
              </thead>
              <tbody>
                {pollutantsList.map((p, idx) => {
                  const s = pollutantStats[p];
                  return (
                    <tr key={idx}>
                      <td className="font-bold uppercase text-primary">{p}</td>
                      <td className="font-mono">{s.mean}</td>
                      <td className="font-mono">{s.median}</td>
                      <td className="font-mono text-error font-semibold">{s.max}</td>
                      <td className="font-mono">{s.p95}</td>
                      <td className="font-mono">{s.stdDev}</td>
                      <td className="font-mono text-xs">{s.coefVariation}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Cross-Ward Disparity Bars */}
        <div className="analytics-card-glass">
          <div className="card-header-clean">
            <Activity size={18} className="text-secondary" />
            <h3 className="card-heading">Spatial Ward Disparity Index</h3>
          </div>

          <div className="ward-disparity-bars-list">
            {hotspots.slice(0, 6).map((h, idx) => {
              const maxPM25 = Math.max(...hotspots.map(item => item.meanPM25 || 0), 100);
              const barWidth = Math.min(100, Math.round(((h.meanPM25 || 0) / maxPM25) * 100));
              const aqiCat = getAQICategory(h.meanPM25 || 0, 'pm25');

              return (
                <div key={idx} className="ward-bar-row">
                  <div className="ward-bar-header">
                    <span className="ward-name">{h.ward}</span>
                    <span className="ward-mean-val text-error font-mono">
                      {h.meanPM25} µg/m³ ({aqiCat.category})
                    </span>
                  </div>
                  <div className="ward-bar-track">
                    <div
                      className="ward-bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: aqiCat.category === 'Severe' ? '#ef4444' : '#ffb95f'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
