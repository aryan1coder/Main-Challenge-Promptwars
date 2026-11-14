import { useState } from 'react';
import { History, BookmarkCheck, ArrowDownRight, ArrowUpRight, Trash2, CheckCircle2 } from 'lucide-react';
import {
  saveBriefingRecord,
  getSavedBriefings,
  deleteBriefingRecord,
  compareWithHistoricalBaseline
} from '../lib/services/storageService';

export default function HistoricalComparison({ analytics, aiBriefing, datasetTitle }) {
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

  if (!analytics) return null;

  return (
    <section className="civic-card history-card" aria-labelledby="history-heading">
      <div className="card-header">
        <div className="card-title-group">
          <History size={20} className="card-icon text-civic-blue" aria-hidden="true" />
          <h2 id="history-heading" className="card-title">5. Historical Comparison & Trend Observation</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleSave}
        >
          {saveSuccess ? <CheckCircle2 size={15} className="text-emerald-600" aria-hidden="true" /> : <BookmarkCheck size={15} aria-hidden="true" />}
          {saveSuccess ? 'Saved to Local Archive' : 'Save Current Briefing to Archive'}
        </button>
      </div>

      <div className="history-content">
        <div className="baseline-selector-row">
          <label htmlFor="baseline-select" className="baseline-label">
            Select Historical Baseline to Inspect Empirical Shifts:
          </label>
          <select
            id="baseline-select"
            className="civic-select"
            value={selectedBaselineId}
            onChange={(e) => handleCompare(e.target.value)}
          >
            <option value="">-- Choose Historical Briefing to Compare --</option>
            {history.map(item => (
              <option key={item.id} value={item.id}>
                {item.title} ({new Date(item.savedAt).toLocaleDateString()} {new Date(item.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) — AQI: {item.analytics?.aqi?.aqi || 'N/A'}
              </option>
            ))}
          </select>
        </div>

        {comparisonResult ? (
          <div className="delta-comparison-box" role="region" aria-label="Delta Comparison Results">
            <h3 className="delta-title">
              Observed Empirical Shift ($\Delta$) vs Baseline ({new Date(comparisonResult.baselineDate).toLocaleDateString()})
            </h3>

            <div className="delta-metrics-grid">
              {/* Delta Mean PM2.5 */}
              <div className="delta-metric-card">
                <span className="delta-label">$\Delta$ Mean PM2.5 Concentration</span>
                <div className="delta-value-row">
                  <span className={`delta-number ${comparisonResult.deltaMeanPM25 < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparisonResult.deltaMeanPM25 > 0 ? `+${comparisonResult.deltaMeanPM25}` : comparisonResult.deltaMeanPM25} µg/m³
                  </span>
                  {comparisonResult.percentChangePM25 !== null && (
                    <span className={`delta-pct-pill ${comparisonResult.percentChangePM25 < 0 ? 'pct-improved' : 'pct-worsened'}`}>
                      {comparisonResult.percentChangePM25 < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {comparisonResult.percentChangePM25}%
                    </span>
                  )}
                </div>
                <span className="delta-sub">
                  Current: {comparisonResult.currPM25} µg/m³ | Baseline: {comparisonResult.histPM25} µg/m³
                </span>
              </div>

              {/* Delta AQI */}
              <div className="delta-metric-card">
                <span className="delta-label">$\Delta$ AQI Sub-Index</span>
                <div className="delta-value-row">
                  <span className={`delta-number ${comparisonResult.deltaAQI < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparisonResult.deltaAQI > 0 ? `+${comparisonResult.deltaAQI}` : comparisonResult.deltaAQI} pts
                  </span>
                </div>
                <span className="delta-sub">
                  Current AQI: {comparisonResult.currAQI} | Baseline AQI: {comparisonResult.histAQI}
                </span>
              </div>

              {/* Trend Assessment (Strictly Non-Causal Disclosure) */}
              <div className="delta-metric-card">
                <span className="delta-label">Observed Comparative Shift</span>
                <div className="delta-value-row">
                  <span className={`status-eval-tag ${comparisonResult.trendDirection === 'Observed Reduction' ? 'eval-success' : comparisonResult.trendDirection === 'Observed Increase' ? 'eval-danger' : 'eval-neutral'}`}>
                    {comparisonResult.trendDirection}
                  </span>
                </div>
                <span className="delta-sub">
                  {comparisonResult.trendDirection === 'Observed Reduction'
                    ? 'Observed concentration decline between recorded periods. Note: Does not constitute causal proof; meteorological factors must be factored.'
                    : 'Higher pollutant concentrations observed relative to the comparative baseline period.'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="history-empty-hint">
            {history.length === 0 ? (
              <p className="text-sm text-civic-slate">
                No historical briefings saved yet. Click <strong>"Save Current Briefing to Archive"</strong> above to store this incident and enable trend comparisons on subsequent runs.
              </p>
            ) : (
              <p className="text-sm text-civic-slate">
                Select a saved incident from the dropdown above to compute the mathematical delta ($\Delta$) and view empirical shifts across monitoring episodes.
              </p>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="saved-list-accordion">
            <h4 className="text-xs font-semibold text-civic-slate uppercase mb-2">Stored Incident History ({history.length} records):</h4>
            <div className="saved-tags-flex">
              {history.map(item => (
                <div key={item.id} className="saved-incident-chip">
                  <span className="chip-name">{item.title}</span>
                  <span className="chip-aqi">AQI {item.analytics?.aqi?.aqi || 'N/A'}</span>
                  <button
                    type="button"
                    className="btn-chip-delete"
                    onClick={(e) => handleDelete(item.id, e)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
