import { useState } from 'react';
import {
  History,
  BookmarkCheck,
  TrendingDown,
  TrendingUp,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Info,
  Layers
} from 'lucide-react';
import {
  saveBriefingRecord,
  getSavedBriefings,
  deleteBriefingRecord,
  compareWithHistoricalBaseline
} from '../../lib/services/storageService';

export default function ScreenHistory({ analytics, aiBriefing, datasetTitle }) {
  const [history, setHistory] = useState(() => getSavedBriefings());
  const [selectedBaselineId, setSelectedBaselineId] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    if (!analytics) return;
    const record = saveBriefingRecord({
      title: datasetTitle || 'Air Quality Episode',
      analytics,
      aiBriefing
    });
    if (record) {
      setHistory(getSavedBriefings());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleCompare = (baselineId) => {
    setSelectedBaselineId(baselineId);
    if (!baselineId) {
      setComparisonResult(null);
      return;
    }
    const baseline = history.find(h => h.id === baselineId);
    if (baseline) {
      const res = compareWithHistoricalBaseline(analytics, baseline);
      setComparisonResult(res);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteBriefingRecord(id);
    const updated = getSavedBriefings();
    setHistory(updated);
    if (selectedBaselineId === id) {
      setSelectedBaselineId('');
      setComparisonResult(null);
    }
  };

  // Defaults or computed deltas
  const currentAQI = analytics?.aqi?.aqi || 0;
  const currentPM25 = analytics?.pollutantStats?.pm25?.mean || 0;

  return (
    <div className="stitch-screen-container">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Historical Analytics</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Baseline Trend Comparison</span>
          </div>
          <h1 className="header-main-title">Longitudinal Efficacy &amp; Shift Evaluation</h1>
          <p className="header-subtitle">
            Track observed mathematical shifts against historical reference baselines to evaluate
            air quality trends across municipal jurisdictions.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn-emerald-primary"
            onClick={handleSave}
          >
            {saveSuccess ? <CheckCircle2 size={15} /> : <BookmarkCheck size={15} />}
            <span>{saveSuccess ? 'Saved to Archive!' : 'Save Current Dataset to Baseline'}</span>
          </button>
        </div>
      </section>

      {/* Baseline Selection Toolbar */}
      <section className="history-selector-toolbar-glass">
        <div className="history-selector-left">
          <label htmlFor="baseline-select" className="selector-label">
            Active Comparison Baseline:
          </label>
          <select
            id="baseline-select"
            className="history-baseline-select"
            value={selectedBaselineId}
            onChange={(e) => handleCompare(e.target.value)}
          >
            <option value="">-- Choose Historical Record to Inspect Shifts --</option>
            {history.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({new Date(item.savedAt).toLocaleDateString()}) — AQI: {item.analytics?.aqi?.aqi || 'N/A'}
              </option>
            ))}
          </select>
        </div>

        <div className="history-selector-right">
          <span className="text-xs text-on-surface-variant font-mono">
            {history.length} Saved Baselines in Local Archive
          </span>
        </div>
      </section>

      {/* Non-Causal Empirical Grounding Banner */}
      <section className="non-causal-disclosure-banner">
        <Info size={18} className="text-secondary shrink-0" />
        <div className="disclosure-text">
          <strong>Scientific Disclosure on Empirical Shifts:</strong> Observed differences reflect sensor
          measurements between monitoring episodes. They are empirical observations and do not assert
          definitive causal proof of municipal policy impact without multi-season meteorological normalization.
        </div>
      </section>

      {/* Comparison Results */}
      {comparisonResult ? (
        <section className="historical-deltas-workspace">
          {/* Macro Delta KPI Cards */}
          <div className="history-kpis-grid">
            {/* KPI 1: AQI Shift */}
            <div className="history-kpi-card-glass">
              <div className="kpi-card-top">
                <span className="kpi-label">Net Regional AQI Shift</span>
                {comparisonResult.deltaAQI <= 0 ? (
                  <TrendingDown size={18} className="text-primary" />
                ) : (
                  <TrendingUp size={18} className="text-error" />
                )}
              </div>
              <div className="kpi-digits-row">
                <span
                  className={`kpi-hero-num ${
                    comparisonResult.deltaAQI <= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {comparisonResult.deltaAQI > 0 ? `+${comparisonResult.deltaAQI}` : comparisonResult.deltaAQI}
                </span>
                <span className="kpi-unit">AQI</span>
              </div>
              <div className="kpi-footer-note">
                <span>Baseline: {comparisonResult.baselineAQI} → Current: {currentAQI}</span>
              </div>
            </div>

            {/* KPI 2: PM2.5 Mass Shift */}
            <div className="history-kpi-card-glass">
              <div className="kpi-card-top">
                <span className="kpi-label">Average PM2.5 Shift</span>
                {comparisonResult.deltaPM25 <= 0 ? (
                  <TrendingDown size={18} className="text-primary" />
                ) : (
                  <TrendingUp size={18} className="text-error" />
                )}
              </div>
              <div className="kpi-digits-row">
                <span
                  className={`kpi-hero-num ${
                    comparisonResult.deltaPM25 <= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {comparisonResult.deltaPM25 > 0 ? `+${comparisonResult.deltaPM25}` : comparisonResult.deltaPM25}
                </span>
                <span className="kpi-unit">µg/m³</span>
              </div>
              <div className="kpi-footer-note">
                <span className={comparisonResult.percentDeltaPM25 <= 0 ? 'text-primary' : 'text-error'}>
                  {comparisonResult.percentDeltaPM25 > 0 ? `+${comparisonResult.percentDeltaPM25}%` : `${comparisonResult.percentDeltaPM25}%`}
                </span>
                <span> vs Baseline ({comparisonResult.baselinePM25} µg/m³)</span>
              </div>
            </div>

            {/* KPI 3: Severe Exceedance Days */}
            <div className="history-kpi-card-glass">
              <div className="kpi-card-top">
                <span className="kpi-label">Severe Exceedance Hours</span>
                <ShieldAlert size={18} className="text-tertiary" />
              </div>
              <div className="kpi-digits-row">
                <span className="kpi-hero-num text-tertiary">
                  {analytics?.primaryHotspot?.severeExceedances || 0}
                </span>
                <span className="kpi-unit">Hours</span>
              </div>
              <div className="kpi-footer-note">
                <span>Screened across primary hotspot ward</span>
              </div>
            </div>

            {/* KPI 4: Completeness Comparison */}
            <div className="history-kpi-card-glass">
              <div className="kpi-card-top">
                <span className="kpi-label">Sensor Net Completeness</span>
                <CheckCircle2 size={18} className="text-secondary" />
              </div>
              <div className="kpi-digits-row">
                <span className="kpi-hero-num text-secondary">
                  {analytics?.completeness || 100}%
                </span>
                <span className="kpi-unit">Verified</span>
              </div>
              <div className="kpi-footer-note">
                <span>Confidence: {analytics?.confidenceTier}</span>
              </div>
            </div>
          </div>

          {/* Detailed Parameter Shift Table */}
          <div className="comparison-table-card-glass">
            <div className="card-header-clean">
              <Layers size={18} className="text-primary" />
              <h3 className="card-heading">Parameter Shift Inspection vs Baseline</h3>
            </div>

            <div className="table-responsive-wrapper">
              <table className="civic-data-table">
                <thead>
                  <tr>
                    <th>Environmental Parameter</th>
                    <th>Baseline Value</th>
                    <th>Current Value</th>
                    <th>Absolute Delta (Δ)</th>
                    <th>Percentage Shift</th>
                    <th>Direction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-on-surface">Overall CPCB AQI</td>
                    <td className="font-mono">{comparisonResult.baselineAQI}</td>
                    <td className="font-mono font-bold">{currentAQI}</td>
                    <td className={`font-mono ${comparisonResult.deltaAQI <= 0 ? 'text-primary' : 'text-error'}`}>
                      {comparisonResult.deltaAQI > 0 ? `+${comparisonResult.deltaAQI}` : comparisonResult.deltaAQI}
                    </td>
                    <td className={`font-mono ${comparisonResult.deltaAQI <= 0 ? 'text-primary' : 'text-error'}`}>
                      {comparisonResult.baselineAQI > 0
                        ? `${(((currentAQI - comparisonResult.baselineAQI) / comparisonResult.baselineAQI) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td>
                      <span className={`status-pill-subtle ${comparisonResult.deltaAQI <= 0 ? 'text-primary' : 'text-error'}`}>
                        {comparisonResult.deltaAQI <= 0 ? 'Favorable Improvement' : 'Elevated Exposure'}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="font-bold text-on-surface">Mean PM2.5 (µg/m³)</td>
                    <td className="font-mono">{comparisonResult.baselinePM25}</td>
                    <td className="font-mono font-bold">{currentPM25}</td>
                    <td className={`font-mono ${comparisonResult.deltaPM25 <= 0 ? 'text-primary' : 'text-error'}`}>
                      {comparisonResult.deltaPM25 > 0 ? `+${comparisonResult.deltaPM25}` : comparisonResult.deltaPM25}
                    </td>
                    <td className={`font-mono ${comparisonResult.percentDeltaPM25 <= 0 ? 'text-primary' : 'text-error'}`}>
                      {comparisonResult.percentDeltaPM25 > 0 ? `+${comparisonResult.percentDeltaPM25}%` : `${comparisonResult.percentDeltaPM25}%`}
                    </td>
                    <td>
                      <span className={`status-pill-subtle ${comparisonResult.deltaPM25 <= 0 ? 'text-primary' : 'text-error'}`}>
                        {comparisonResult.deltaPM25 <= 0 ? 'Particulate Dampened' : 'Particulate Surged'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        /* Empty State */
        <div className="history-empty-state-glass">
          <History size={36} className="text-outline mb-2" />
          <h3 className="text-lg font-bold text-on-surface">No Historical Baseline Selected</h3>
          <p className="text-sm text-on-surface-variant max-w-md text-center mt-1">
            Choose a saved session from the dropdown above to compute empirical delta shifts, or save your current dataset.
          </p>
        </div>
      )}

      {/* Saved Baselines List */}
      <section className="saved-baselines-archive-section">
        <h3 className="section-title text-base font-bold mb-3">Saved Baseline Sessions</h3>

        {history.length === 0 ? (
          <div className="p-4 rounded-xl bg-surface-container-low text-on-surface-variant text-sm">
            No baseline records saved yet. Click <strong>"Save Current Dataset to Baseline"</strong> above to record your first reference session.
          </div>
        ) : (
          <div className="saved-records-grid">
            {history.map((item) => (
              <div
                key={item.id}
                className={`saved-record-card-glass ${selectedBaselineId === item.id ? 'active-baseline' : ''}`}
                onClick={() => handleCompare(item.id)}
              >
                <div className="record-header">
                  <h4 className="record-title">{item.title}</h4>
                  <button
                    type="button"
                    className="delete-record-btn"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete Baseline Record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="record-meta">
                  <span>Saved: {new Date(item.savedAt).toLocaleDateString()}</span>
                  <span className="font-mono text-primary">AQI: {item.analytics?.aqi?.aqi || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
