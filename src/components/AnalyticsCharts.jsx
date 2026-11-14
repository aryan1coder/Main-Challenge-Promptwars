import { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 260;
const CHART_PADDING = { top: 25, right: 30, bottom: 40, left: 55 };

export default function AnalyticsCharts({ analytics, parsedResult }) {
  const [activePollutant, setActivePollutant] = useState('pm25'); // 'pm25' | 'pm10' | 'no2'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const hotspots = analytics?.hotspots || [];
  const diurnalTrends = analytics?.diurnalTrends || [];
  const pollutantStats = analytics?.pollutantStats || {};

  // Extract time-series data for the selected pollutant
  const timeSeriesData = useMemo(() => {
    const rawRows = parsedResult?.rows || [];
    if (!rawRows.length) return [];
    return rawRows
      .filter(r => r[activePollutant] !== null && r[activePollutant] !== undefined && !isNaN(r[activePollutant]))
      .map((r, idx) => ({
        index: idx,
        timestamp: r.timestamp || `Obs #${idx + 1}`,
        value: r[activePollutant],
        ward: r.ward || 'General Station'
      }));
  }, [parsedResult?.rows, activePollutant]);

  const { pointsString, areaString, dataPoints, yMax, yMin } = useMemo(() => {
    if (!timeSeriesData.length) {
      return { pointsString: '', areaString: '', dataPoints: [], yMax: 100, yMin: 0 };
    }

    const values = timeSeriesData.map(d => d.value);
    const maxVal = Math.max(...values, 50);
    const minVal = Math.min(...values, 0);
    // Add 10% breathing room to max
    const max = Math.ceil(maxVal * 1.1);
    const min = minVal < 0 ? minVal : 0;

    const chartWidth = SVG_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight = SVG_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    const coords = timeSeriesData.map((d, i) => {
      const x = CHART_PADDING.left + (i / Math.max(1, timeSeriesData.length - 1)) * chartWidth;
      const y = CHART_PADDING.top + chartHeight - ((d.value - min) / (max - min || 1)) * chartHeight;
      return { ...d, x, y };
    });

    const ptsStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const firstX = coords[0]?.x || CHART_PADDING.left;
    const lastX = coords[coords.length - 1]?.x || (SVG_WIDTH - CHART_PADDING.right);
    const bottomY = CHART_PADDING.top + chartHeight;
    const areaStr = `${ptsStr} ${lastX.toFixed(1)},${bottomY.toFixed(1)} ${firstX.toFixed(1)},${bottomY.toFixed(1)}`;

    return {
      pointsString: ptsStr,
      areaString: areaStr,
      dataPoints: coords,
      yMax: max,
      yMin: min
    };
  }, [timeSeriesData]);

  // CPCB 24-hr threshold lines for reference
  const thresholdValue = activePollutant === 'pm25' ? 60 : activePollutant === 'pm10' ? 100 : 80;
  const chartHeight = SVG_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const thresholdY = CHART_PADDING.top + chartHeight - ((thresholdValue - yMin) / (yMax - yMin || 1)) * chartHeight;

  // Diurnal Bar Chart calculation
  const diurnalMax = useMemo(() => {
    const vals = (analytics?.diurnalTrends || []).map(d => d.meanPM25 || 0);
    return Math.max(...vals, 100);
  }, [analytics?.diurnalTrends]);

  return (
    <div className="analytics-visualizations-section" id="analytics" aria-labelledby="analytics-visuals-heading">
      <div className="section-header-compact">
        <div>
          <h2 id="analytics-visuals-heading" className="section-title">
            Analytical Telemetry & Environmental Dynamics
          </h2>
          <p className="section-subtitle">
            Deterministic spatial-temporal trends, diurnal curves, and parameter distributions
          </p>
        </div>
      </div>

      <div className="charts-main-grid">
        {/* Chart A: Multi-Pollutant Chronological Trend */}
        <div className="civic-card chart-card-trend">
          <div className="chart-card-header">
            <div className="flex-row items-center gap-2">
              <TrendingUp size={18} className="text-civic-blue" aria-hidden="true" />
              <div>
                <h3 className="chart-card-title">Chronological Pollution Series</h3>
                <span className="chart-card-meta">Continuous monitoring trend with CPCB threshold references</span>
              </div>
            </div>

            <div className="series-selector-group" role="group" aria-label="Select Pollutant Series">
              <button
                type="button"
                className={`series-pill ${activePollutant === 'pm25' ? 'active-pm25' : ''}`}
                onClick={() => setActivePollutant('pm25')}
              >
                PM2.5 (Fine)
              </button>
              <button
                type="button"
                className={`series-pill ${activePollutant === 'pm10' ? 'active-pm10' : ''}`}
                onClick={() => setActivePollutant('pm10')}
                disabled={!pollutantStats.pm10}
              >
                PM10 (Coarse)
              </button>
              <button
                type="button"
                className={`series-pill ${activePollutant === 'no2' ? 'active-no2' : ''}`}
                onClick={() => setActivePollutant('no2')}
                disabled={!pollutantStats.no2}
              >
                NO2 (Gas)
              </button>
            </div>
          </div>

          {timeSeriesData.length === 0 ? (
            <div className="chart-empty-state">
              <Info size={24} className="text-civic-slate" />
              <p>No valid numerical observations recorded for {activePollutant.toUpperCase()} in this dataset.</p>
            </div>
          ) : (
            <div className="chart-svg-wrapper">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="responsive-svg-chart"
                aria-label={`Time series chart of ${activePollutant.toUpperCase()} concentrations`}
              >
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = CHART_PADDING.top + chartHeight * (1 - pct);
                  const val = Math.round(yMin + pct * (yMax - yMin));
                  return (
                    <g key={idx}>
                      <line
                        x1={CHART_PADDING.left}
                        y1={y}
                        x2={SVG_WIDTH - CHART_PADDING.right}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={CHART_PADDING.left - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="chart-axis-label"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* CPCB 24-hr Standard Threshold line */}
                {thresholdY >= CHART_PADDING.top && thresholdY <= CHART_PADDING.top + chartHeight && (
                  <g>
                    <line
                      x1={CHART_PADDING.left}
                      y1={thresholdY}
                      x2={SVG_WIDTH - CHART_PADDING.right}
                      y2={thresholdY}
                      stroke="#dc2626"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <text
                      x={SVG_WIDTH - CHART_PADDING.right}
                      y={thresholdY - 6}
                      textAnchor="end"
                      className="threshold-label"
                    >
                      CPCB 24h Threshold ({thresholdValue} µg/m³)
                    </text>
                  </g>
                )}

                {/* Shaded Area */}
                <polygon points={areaString} fill="url(#trendGradient)" />

                {/* Trend Polyline */}
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {dataPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.index === idx ? 6 : 3.5}
                    className={`chart-data-dot ${pt.value > thresholdValue ? 'dot-exceedance' : ''}`}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {/* X-axis time marks */}
                {dataPoints
                  .filter((_, idx) => idx % Math.ceil(dataPoints.length / 6) === 0 || idx === dataPoints.length - 1)
                  .map((pt, idx) => {
                    // Extract time portion if string has timestamp
                    const displayTime = pt.timestamp.includes(' ')
                      ? pt.timestamp.split(' ')[1]
                      : pt.timestamp.includes('T')
                        ? pt.timestamp.split('T')[1].slice(0, 5)
                        : pt.timestamp;

                    return (
                      <text
                        key={idx}
                        x={pt.x}
                        y={SVG_HEIGHT - 12}
                        textAnchor="middle"
                        className="chart-axis-label chart-x-label"
                      >
                        {displayTime}
                      </text>
                    );
                  })}
              </svg>

              {/* Interactive Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="chart-floating-tooltip"
                  style={{
                    left: `${(hoveredPoint.x / SVG_WIDTH) * 100}%`,
                    top: `${(hoveredPoint.y / SVG_HEIGHT) * 100}%`
                  }}
                >
                  <div className="tooltip-title">{hoveredPoint.ward}</div>
                  <div className="tooltip-value">
                    <strong>{hoveredPoint.value} µg/m³</strong> ({activePollutant.toUpperCase()})
                  </div>
                  <div className="tooltip-time">{hoveredPoint.timestamp}</div>
                </div>
              )}
            </div>
          )}

          <div className="chart-legend-row">
            <div className="legend-item">
              <span className="legend-dot bg-civic-blue"></span>
              <span>Observed {activePollutant.toUpperCase()} (µg/m³)</span>
            </div>
            <div className="legend-item">
              <span className="legend-line border-red"></span>
              <span>CPCB Safe 24-hr Ceiling ({thresholdValue} µg/m³)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-amber"></span>
              <span>Values &gt; Safe Limit</span>
            </div>
          </div>
        </div>

        {/* Chart B: Ranked Spatial Hotspots Comparison */}
        <div className="civic-card chart-card-hotspots">
          <div className="chart-card-header">
            <div className="flex-row items-center gap-2">
              <BarChart3 size={18} className="text-amber-600" aria-hidden="true" />
              <div>
                <h3 className="chart-card-title">Ward Exposure Disparity</h3>
                <span className="chart-card-meta">Mean PM2.5 concentrations ranked across monitoring wards</span>
              </div>
            </div>
          </div>

          <div className="hotspot-bars-container">
            {hotspots.length === 0 ? (
              <p className="text-civic-slate text-sm">No ward distribution available in this dataset.</p>
            ) : (
              hotspots.map((h, idx) => {
                const maxHotspotMean = Math.max(...hotspots.map(s => s.meanPM25), 100);
                const pct = Math.min(100, (h.meanPM25 / maxHotspotMean) * 100);
                const isPrimary = idx === 0;

                return (
                  <div key={h.ward} className={`hotspot-bar-row ${isPrimary ? 'primary-hotspot-row' : ''}`}>
                    <div className="hotspot-bar-meta">
                      <div className="hotspot-bar-name">
                        {isPrimary && <span className="hotspot-badge-star">★ Primary Hotspot: </span>}
                        <strong>{h.ward}</strong>
                      </div>
                      <div className="hotspot-bar-numbers">
                        <span className="mean-tag">Mean: <strong>{h.meanPM25} µg/m³</strong></span>
                        <span className="peak-tag">Peak: {h.maxPM25} µg/m³</span>
                        <span className="exceed-tag text-red-600 font-semibold">{h.severeExceedances} severe flags</span>
                      </div>
                    </div>
                    <div className="hotspot-bar-track">
                      <div
                        className={`hotspot-bar-fill ${isPrimary ? 'fill-primary-hotspot' : 'fill-regular-hotspot'}`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={h.meanPM25}
                        aria-valuemin={0}
                        aria-valuemax={maxHotspotMean}
                        aria-label={`${h.ward}: Mean PM2.5 ${h.meanPM25} µg/m³`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Second Grid: Observed Diurnal Profile + Multi-Pollutant Distribution + Confidence Grid */}
      <div className="charts-secondary-grid">
        {/* Chart D: Diurnal Exposure Profile (24-Hour Inversion Curve) */}
        <div className="civic-card diurnal-card">
          <div className="chart-card-header">
            <div className="flex-row items-center gap-2">
              <Clock size={18} className="text-civic-blue" aria-hidden="true" />
              <div>
                <h3 className="chart-card-title">Observed Hourly PM2.5 Profile</h3>
                <span className="chart-card-meta">Hourly means calculated from the supplied observations</span>
              </div>
            </div>
            <span className="peak-window-pill">
              Peak: <strong>{analytics?.peakExposureWindow}</strong>
            </span>
          </div>

          <div className="diurnal-chart-bars">
            {diurnalTrends.map((d) => {
              const heightPct = diurnalMax > 0 ? (d.meanPM25 / diurnalMax) * 100 : 0;
              const isPeakHour = d.meanPM25 === diurnalMax && d.meanPM25 > 0;
              const hasData = d.count > 0;

              return (
                <div key={d.hour} className="diurnal-bar-col" title={`Hour ${d.hour}:00: ${d.meanPM25} µg/m³ (${d.count} obs)`}>
                  <div className="diurnal-bar-height-wrapper">
                    <div
                      className={`diurnal-bar-stem ${isPeakHour ? 'stem-peak' : hasData ? 'stem-active' : 'stem-empty'}`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                  <span className={`diurnal-hour-label ${isPeakHour ? 'font-bold text-red-600' : ''}`}>
                    {d.hour % 3 === 0 ? String(d.hour).padStart(2, '0') : ''}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="diurnal-explanation-note">
            <Info size={14} className="text-civic-blue" aria-hidden="true" />
            <span>
              This chart shows the supplied hourly readings only. Weather and emissions-source data are not included, so it does not identify causes.
            </span>
          </div>
        </div>

        {/* Chart C & E: Multi-Pollutant Spectrum & Fidelity Gauges */}
        <div className="civic-card pollutant-spectrum-card">
          <div className="chart-card-header">
            <div className="flex-row items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-700" aria-hidden="true" />
              <div>
                <h3 className="chart-card-title">Pollutant Spectrum & Telemetry Coverage</h3>
                <span className="chart-card-meta">Monitored criteria gases & particulate parameters normalized to µg/m³</span>
              </div>
            </div>
          </div>

          <div className="spectrum-grid">
            {['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'].map(pol => {
              const stats = pollutantStats[pol];
              const isMonitored = !!stats && stats.count > 0;
              const label = pol === 'pm25' ? 'PM2.5 (Fine)' : pol === 'pm10' ? 'PM10 (Coarse)' : pol.toUpperCase();

              return (
                <div key={pol} className={`spectrum-item ${isMonitored ? 'item-active' : 'item-unmonitored'}`}>
                  <div className="spectrum-item-header">
                    <span className="spectrum-pol-name">{label}</span>
                    <span className={`spectrum-status-pill ${isMonitored ? 'status-monitored' : 'status-missing'}`}>
                      {isMonitored ? 'Active Sensor' : 'Unmonitored'}
                    </span>
                  </div>
                  {isMonitored ? (
                    <div className="spectrum-stats-body">
                      <div className="spectrum-mean">
                        <span className="num">{stats.mean}</span>
                        <span className="unit">µg/m³</span>
                      </div>
                      <div className="spectrum-sub-stats">
                        <span>Max: <strong>{stats.max}</strong></span>
                        <span>P95: {stats.p95}</span>
                        <span>Obs: {stats.count}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="spectrum-missing-body">
                      <AlertTriangle size={14} className="text-amber-600 inline mr-1" />
                      <span>Missing from stream. CPCB multi-parameter AQI requires ≥3 criteria pollutants.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
