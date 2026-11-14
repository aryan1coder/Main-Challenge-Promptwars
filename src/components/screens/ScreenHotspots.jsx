import {
  Flame,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  Clock
} from 'lucide-react';
import { getAQICategory } from '../../lib/analytics/aqiCalculator';

export default function ScreenHotspots({ analytics, setActiveSection }) {
  const hotspots = analytics?.hotspots || [];

  const severeHotspotsCount = hotspots.filter(h => (h.meanPM25 || 0) > 250).length;
  const totalExceedances = hotspots.reduce((s, h) => s + (h.severeExceedances || 0), 0);

  return (
    <div className="stitch-screen-container">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Spatial Surveillance</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Prioritized Hotspot Enclaves</span>
          </div>
          <h1 className="header-main-title">Vulnerability &amp; Exposure Analysis</h1>
          <p className="header-subtitle">
            Algorithmic ranking of monitored wards based on continuous mean particulate concentrations,
            severe breach duration, and population vulnerability.
          </p>
        </div>

        <button
          type="button"
          className="btn-glass-primary"
          onClick={() => setActiveSection('map-intelligence')}
        >
          <MapPin size={15} />
          <span>View on Geospatial Map</span>
        </button>
      </section>

      {/* Macro Metrics Cards */}
      <section className="hotspots-macro-grid">
        <div className="hotspots-kpi-glass">
          <div className="kpi-top-row">
            <span className="kpi-tag">Monitored Hotspots</span>
            <Flame size={18} className="text-error" />
          </div>
          <div className="kpi-num-block">
            <span className="kpi-big-num text-error">{severeHotspotsCount}</span>
            <span className="kpi-sub-title">Severe Breach Enclaves</span>
          </div>
          <span className="text-xs text-on-surface-variant">Particulate mass exceeding 250 µg/m³ threshold</span>
        </div>

        <div className="hotspots-kpi-glass">
          <div className="kpi-top-row">
            <span className="kpi-tag">Exposure Window</span>
            <Clock size={18} className="text-tertiary" />
          </div>
          <div className="kpi-num-block">
            <span className="kpi-big-num text-tertiary">{analytics?.peakExposureWindow || '08:00 - 10:00'}</span>
            <span className="kpi-sub-title">Critical Inversion Phase</span>
          </div>
          <span className="text-xs text-on-surface-variant">Morning convection boundary trapping emissions</span>
        </div>

        <div className="hotspots-kpi-glass">
          <div className="kpi-top-row">
            <span className="kpi-tag">Cumulative Exceedances</span>
            <AlertTriangle size={18} className="text-secondary" />
          </div>
          <div className="kpi-num-block">
            <span className="kpi-big-num text-secondary">{totalExceedances}</span>
            <span className="kpi-sub-title">Hourly Breaches (&gt;120 µg/m³)</span>
          </div>
          <span className="text-xs text-on-surface-variant">Screened across all active ward monitoring sensors</span>
        </div>
      </section>

      {/* Prioritized Hotspot Enclaves List */}
      <section className="hotspot-enclaves-list">
        <div className="section-title-strip">
          <div className="title-with-icon">
            <Flame size={18} className="text-error" />
            <h2 className="section-title">Ranked Hotspot Enclaves (By Threat Index)</h2>
          </div>
          <span className="text-xs text-on-surface-variant">
            Sorted deterministically by mean PM2.5 particulate mass
          </span>
        </div>

        <div className="enclave-cards-stack">
          {hotspots.map((hotspot, idx) => {
            const cat = getAQICategory(hotspot.meanPM25 || 0, 'pm25');
            const isSevere = cat.category === 'Severe' || cat.category === 'Very Poor';

            return (
              <div
                key={idx}
                className={`enclave-card-glass ${isSevere ? 'border-error-subtle' : ''}`}
              >
                <div className="enclave-card-header">
                  <div className="enclave-rank-tag">
                    <span className="rank-digits">0{idx + 1}</span>
                    <div className="enclave-name-group">
                      <div className="enclave-title-row">
                        <h3 className="enclave-title">{hotspot.ward}</h3>
                        <span
                          className="enclave-category-pill"
                          style={{
                            color: isSevere ? '#ef4444' : '#ffb95f',
                            backgroundColor: `${isSevere ? '#ef4444' : '#ffb95f'}15`
                          }}
                        >
                          {cat.category} Breach
                        </span>
                        {hotspot.severeExceedances > 0 && (
                          <span className="enclave-duration-pill">
                            {hotspot.severeExceedances}h Exceedance
                          </span>
                        )}
                      </div>
                      <p className="enclave-driver-desc">
                        {idx === 0
                          ? 'Primary Driver: Heavy diesel freight transit & localized micro-basin thermal stagnation.'
                          : idx === 1
                          ? 'Primary Driver: Fugitive dust resuspension, vehicular arterial queuing & dense residential heating.'
                          : 'Primary Driver: Industrial boiler exhaust and construction particulate entrainment.'}
                      </p>
                    </div>
                  </div>

                  <div className="enclave-aqi-badge">
                    <span className="aqi-label">Calculated Mean</span>
                    <span className="aqi-value text-error">{hotspot.meanPM25 || '—'}</span>
                    <span className="aqi-unit">µg/m³ PM2.5</span>
                  </div>
                </div>

                <div className="enclave-metrics-strip">
                  <div className="enclave-metric-cell">
                    <span className="cell-label">Peak PM2.5</span>
                    <span className="cell-val text-on-surface">{hotspot.maxPM25 || '—'} µg/m³</span>
                  </div>
                  <div className="enclave-metric-cell">
                    <span className="cell-label">Mean PM10</span>
                    <span className="cell-val text-secondary">{hotspot.meanPM10 || '—'} µg/m³</span>
                  </div>
                  <div className="enclave-metric-cell">
                    <span className="cell-label">Exceedance Rate</span>
                    <span className="cell-val text-tertiary">{hotspot.exceedanceRate}%</span>
                  </div>
                  <div className="enclave-metric-cell">
                    <span className="cell-label">Valid Observations</span>
                    <span className="cell-val text-primary">{hotspot.readingsCount} records</span>
                  </div>
                </div>

                <div className="enclave-action-footer">
                  <div className="enclave-action-advice">
                    <span className="action-tag">Operational Protocol:</span>
                    <span className="action-text">
                      {isSevere
                        ? 'Deploy mechanical sweeping trucks & mobile water misting cannons along central corridor.'
                        : 'Enforce perimeter dust nets and reroute commercial heavy vehicles.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-glass-subtle"
                    onClick={() => setActiveSection('directives')}
                  >
                    <span>View Directives</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
