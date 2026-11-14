import { useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  ChevronRight,
  Download,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getAQICategory } from '../../lib/analytics/aqiCalculator';

export default function ScreenOverview({
  analytics,
  setActiveSection,
  onExport
}) {
  const aqi = analytics?.aqi || { aqi: 0, category: 'Good', dominantPollutant: 'pm25' };
  const pm25Stats = analytics?.pollutantStats?.pm25 || { mean: 0, max: 0, min: 0 };
  const pm10Stats = analytics?.pollutantStats?.pm10 || { mean: 0, max: 0, min: 0 };
  const no2Stats = analytics?.pollutantStats?.no2 || { mean: 0, max: 0, min: 0 };

  const topHotspots = useMemo(() => {
    return (analytics?.hotspots || []).slice(0, 3);
  }, [analytics]);

  // Generate SVG Sparkline Path from real diurnal points
  const sparklineData = useMemo(() => {
    const trends = analytics?.diurnalTrends || [];
    if (trends.length < 2) return 'M0,15 L100,15';
    const max = Math.max(...trends.map(t => t.mean || 0), 10);
    const min = Math.min(...trends.map(t => t.mean || 0), 0);
    const range = max - min || 1;

    return trends.map((t, idx) => {
      const x = (idx / (trends.length - 1)) * 100;
      const y = 28 - (((t.mean || 0) - min) / range) * 24;
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [analytics]);

  const severityColor = useMemo(() => {
    switch (aqi.category) {
      case 'Good': return '#10b981';
      case 'Satisfactory': return '#34d399';
      case 'Moderate': return '#ffb95f';
      case 'Poor': return '#f97316';
      case 'Very Poor': return '#a855f7';
      case 'Severe':
      default: return '#ef4444';
    }
  }, [aqi.category]);

  return (
    <div className="stitch-screen-container">
      {/* Top Level Command Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Municipal Air Intelligence</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Executive Overview</span>
          </div>
          <h1 className="header-main-title">Metropolitan Air Quality Command</h1>
          <p className="header-subtitle">
            Consolidated telemetry across {analytics?.totalRows || 0} observations.
            Active standard: <strong className="text-primary">CPCB NAAQS 2026</strong>.
          </p>
        </div>

        <div className="header-actions-group">
          <div className="timeframe-pill-selector">
            <button type="button" className="timeframe-btn">1H</button>
            <button type="button" className="timeframe-btn">6H</button>
            <button type="button" className="timeframe-btn active">24H Active</button>
            <button type="button" className="timeframe-btn">7D</button>
          </div>
          <button
            type="button"
            className="btn-glass-primary"
            onClick={onExport}
          >
            <Download size={15} />
            <span>Export Briefing</span>
          </button>
        </div>
      </section>

      {/* Hero AQI Visual Showstopper */}
      <section className="hero-aqi-showstopper">
        <div className="hero-ambient-glow" style={{ background: `${severityColor}15` }}></div>

        <div className="hero-grid-layout">
          {/* Left Column: Big AQI Readout & Scale */}
          <div className="hero-left-column">
            <div className="hero-status-pill-group">
              <span
                className="status-pill-ambient"
                style={{
                  backgroundColor: `${severityColor}20`,
                  color: severityColor,
                  borderColor: `${severityColor}40`
                }}
              >
                <span className="status-ping-dot" style={{ backgroundColor: severityColor }}></span>
                {aqi.category.toUpperCase()} AIR EPISODE
              </span>
              <span className="source-sync-badge">
                <ShieldCheck size={12} className="text-primary" />
                {analytics?.isBenchmark ? 'BENCHMARK CALIBRATED' : 'SENSORS SYNCHRONIZED'}
              </span>
            </div>

            <div className="hero-aqi-digits-row">
              <span className="hero-aqi-number" style={{ color: severityColor }}>
                {aqi.aqi}
              </span>
              <div className="hero-aqi-unit-block">
                <span className="hero-aqi-label">NAAQS AQI</span>
                <span className="hero-aqi-subtext">Dominant: {aqi.dominantPollutant?.toUpperCase()}</span>
              </div>
            </div>

            {/* Radial Scale Progress Strip */}
            <div className="aqi-scale-strip-container">
              <div className="aqi-scale-track">
                <div className="scale-seg bg-emerald" style={{ width: '10%' }}></div>
                <div className="scale-seg bg-cyan" style={{ width: '10%' }}></div>
                <div className="scale-seg bg-amber" style={{ width: '20%' }}></div>
                <div className="scale-seg bg-orange" style={{ width: '20%' }}></div>
                <div className="scale-seg bg-purple" style={{ width: '20%' }}></div>
                <div className="scale-seg bg-crimson" style={{ width: '20%' }}></div>
              </div>
              <div className="aqi-scale-labels">
                <span>0 Good</span>
                <span>100 Mod</span>
                <span>200 Poor</span>
                <span>300 V.Poor</span>
                <span className="font-bold text-error">400+ Severe</span>
              </div>
            </div>

            {/* Benchmark vs WHO Guidelines */}
            <div className="hero-comparative-stats">
              <div className="stat-card-glass">
                <span className="stat-label">Primary Pollutant</span>
                <span className="stat-value">
                  {aqi.dominantPollutant?.toUpperCase()} · {pm25Stats.mean || '—'} µg/m³
                </span>
              </div>
              <div className="stat-card-glass">
                <span className="stat-label">Temporal Confidence</span>
                <span className="stat-value text-secondary">
                  {analytics?.hoursCovered || 0} Hours ({analytics?.confidenceTier || 'NORMAL'})
                </span>
              </div>
            </div>

            {/* Immediate Advisory Strip */}
            <div className="hero-advisory-strip">
              <AlertTriangle size={18} className="text-tertiary shrink-0" />
              <p className="advisory-text">
                {aqi.aqi > 300 ? (
                  <>
                    <strong>Emergency Atmospheric Protocol Active:</strong> Suspend all outdoor school assemblies,
                    halt construction earthworks, and activate mechanical dust sweeping in affected wards.
                  </>
                ) : aqi.aqi > 100 ? (
                  <>
                    <strong>Precautionary Public Advisory:</strong> Sensitive groups (children, asthmatics, elderly)
                    should limit strenuous outdoor exercise during peak morning inversion.
                  </>
                ) : (
                  <>
                    <strong>Ambient Air Optimal:</strong> Atmospheric dispersion is favorable across municipal corridors.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right Column: 4 Vital Indicator Cards */}
          <div className="hero-right-metrics-matrix">
            {/* Metric 1: PM2.5 */}
            <div className="metric-card-glass">
              <div className="metric-card-top">
                <div>
                  <span className="metric-category">Fine Particulate</span>
                  <h3 className="metric-title">PM2.5</h3>
                </div>
                <span className="metric-badge-pill text-error bg-error-subtle">
                  Peak {pm25Stats.max || '—'}
                </span>
              </div>
              <div className="metric-value-row">
                <span className="metric-hero-num">{pm25Stats.mean || '—'}</span>
                <span className="metric-unit">µg/m³</span>
              </div>
              <div className="metric-sparkline-box">
                <svg className="sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
                  <path d={sparklineData} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Metric 2: PM10 */}
            <div className="metric-card-glass">
              <div className="metric-card-top">
                <div>
                  <span className="metric-category">Coarse Dust</span>
                  <h3 className="metric-title">PM10</h3>
                </div>
                <span className="metric-badge-pill text-tertiary bg-amber-subtle">
                  Peak {pm10Stats.max || '—'}
                </span>
              </div>
              <div className="metric-value-row">
                <span className="metric-hero-num">{pm10Stats.mean || '—'}</span>
                <span className="metric-unit">µg/m³</span>
              </div>
              <div className="metric-sparkline-box">
                <svg className="sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
                  <path d={sparklineData} fill="none" stroke="#ffb95f" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Metric 3: NO2 */}
            <div className="metric-card-glass">
              <div className="metric-card-top">
                <div>
                  <span className="metric-category">Combustion Gas</span>
                  <h3 className="metric-title">NO₂</h3>
                </div>
                <span className="metric-badge-pill text-secondary bg-cyan-subtle">
                  Peak {no2Stats.max || '—'}
                </span>
              </div>
              <div className="metric-value-row">
                <span className="metric-hero-num">{no2Stats.mean || '—'}</span>
                <span className="metric-unit">µg/m³</span>
              </div>
              <div className="metric-sparkline-box">
                <svg className="sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
                  <path d={sparklineData} fill="none" stroke="#4cd7f6" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Metric 4: Peak Exposure Window */}
            <div className="metric-card-glass highlight-border">
              <div className="metric-card-top">
                <div>
                  <span className="metric-category">Temporal Exposure</span>
                  <h3 className="metric-title">Peak Inversion</h3>
                </div>
                <span className="metric-badge-pill text-primary bg-emerald-subtle">
                  Diurnal High
                </span>
              </div>
              <div className="metric-value-row">
                <span className="metric-hero-num text-primary">
                  {analytics?.peakExposureWindow || '08:00 - 10:00'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                Boundary layer thermal compression concentrates ground particulates during early morning freight hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Hotspot Enclaves & Fast Nav */}
      <section className="overview-hotspots-grid">
        <div className="section-title-strip">
          <div className="title-with-icon">
            <Flame size={18} className="text-error" />
            <h2 className="section-title">Critical Spatial Hotspots Ranking</h2>
          </div>
          <button
            type="button"
            className="link-btn-emerald"
            onClick={() => setActiveSection('map-intelligence')}
          >
            <span>Open Geospatial Map Explorer</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="hotspots-cards-matrix">
          {topHotspots.map((hotspot, idx) => {
            const hotCat = getAQICategory(hotspot.meanPM25 || 0, 'pm25');
            return (
              <div key={idx} className="hotspot-rank-card-glass">
                <div className="hotspot-rank-indicator">
                  <span className="rank-number">0{idx + 1}</span>
                  <span className="rank-ward-name">{hotspot.ward}</span>
                </div>

                <div className="hotspot-kpi-row">
                  <div>
                    <span className="kpi-label">Mean PM2.5</span>
                    <span className="kpi-value text-error">{hotspot.meanPM25 || '—'} µg/m³</span>
                  </div>
                  <div>
                    <span className="kpi-label">Peak PM2.5</span>
                    <span className="kpi-value text-on-surface">{hotspot.maxPM25 || '—'} µg/m³</span>
                  </div>
                  <div>
                    <span className="kpi-label">Severe Exceedances</span>
                    <span className="kpi-value text-tertiary">{hotspot.severeExceedances}</span>
                  </div>
                </div>

                <div className="hotspot-card-footer">
                  <span
                    className="category-chip"
                    style={{
                      color: hotCat.category === 'Severe' ? '#ef4444' : '#ffb95f',
                      backgroundColor: `${hotCat.category === 'Severe' ? '#ef4444' : '#ffb95f'}15`
                    }}
                  >
                    {hotCat.category}
                  </span>
                  <button
                    type="button"
                    className="view-ward-btn"
                    onClick={() => setActiveSection('hotspots')}
                  >
                    <span>Inspect Ward</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Action Grid: Navigate to AI Briefing & Role Directives */}
      <section className="overview-workflow-shortcuts">
        <div className="shortcut-card-glass" onClick={() => setActiveSection('ai-briefing')}>
          <div className="shortcut-icon-box bg-primary-subtle text-primary">
            <Sparkles size={22} />
          </div>
          <div className="shortcut-text-block">
            <h3>Generate AI Briefing Note</h3>
            <p>Synthesize evidence-grounded municipal briefings and bilingual public advisories with Gemini 1.5 Flash.</p>
          </div>
          <ArrowRight size={18} className="shortcut-arrow text-primary" />
        </div>

        <div className="shortcut-card-glass" onClick={() => setActiveSection('directives')}>
          <div className="shortcut-icon-box bg-secondary-subtle text-secondary">
            <ShieldCheck size={22} />
          </div>
          <div className="shortcut-text-block">
            <h3>Operational Directives & Protocols</h3>
            <p>Execute calibrated mitigation playbooks for Ward Officers, School Admins, and Housing Managers.</p>
          </div>
          <ArrowRight size={18} className="shortcut-arrow text-secondary" />
        </div>
      </section>
    </div>
  );
}
