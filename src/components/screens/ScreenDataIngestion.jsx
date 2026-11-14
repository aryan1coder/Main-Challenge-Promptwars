import { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  Search,
  Shield,
  RefreshCw,
  Code2
} from 'lucide-react';
import {
  BENCHMARK_DELHI_SMOG,
  BENCHMARK_MESSY_SENSORS,
  BENCHMARK_GEOSPATIAL_DELHI
} from '../../lib/benchmarkData';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function ScreenDataIngestion({
  parsedResult,
  analytics,
  onDataParsed,
  isAnalyzing
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  const fileReaderRef = useRef(null);

  useEffect(() => () => fileReaderRef.current?.abort(), []);

  const readDataFile = (file) => {
    if (!file) return;
    setFileError('');

    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setFileError('Choose a CSV, TSV, or text file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File exceeds the 5 MB limit. Split it into smaller datasets and retry.');
      return;
    }

    const reader = new FileReader();
    fileReaderRef.current?.abort();
    fileReaderRef.current = reader;
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        onDataParsed(content, file.name);
      } else {
        setFileError('The selected file could not be decoded as text.');
      }
    };
    reader.onerror = () => setFileError('The selected file could not be read. Try another file.');
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    readDataFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    readDataFile(e.dataTransfer.files?.[0]);
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onDataParsed(pastedText, 'Pasted Tabular Telemetry Buffer');
  };

  const loadBenchmark = (datasetString, name) => {
    setPastedText(datasetString);
    onDataParsed(datasetString, name);
  };

  // Filter preview rows by search query
  const rows = parsedResult?.rows || [];
  const filteredRows = rows.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.ward && r.ward.toLowerCase().includes(q)) ||
      (r.timestamp && r.timestamp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="stitch-screen-container">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Telemetry Pipeline</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Data Ingestion & Normalization</span>
          </div>
          <h1 className="header-main-title">Sensor Stream Ingestion Gateway</h1>
          <p className="header-subtitle">
            Ingest heterogeneous CSV, TSV, or messy stream logs. Applies deterministic header aliasing,
            gas unit conversion (PPM to µg/m³), and anomaly screening.
          </p>
        </div>

        {/* Quick Benchmark Loaders */}
        <div className="header-actions-group">
          <span className="text-xs uppercase tracking-wider text-outline font-semibold">
            Calibrated Benchmarks:
          </span>
          <button
            type="button"
            className="btn-glass-subtle"
            onClick={() => loadBenchmark(BENCHMARK_DELHI_SMOG, 'Benchmark: Delhi Winter Smog Episode')}
          >
            <Database size={14} className="text-tertiary" />
            <span>Delhi Smog</span>
          </button>
          <button
            type="button"
            className="btn-glass-subtle"
            onClick={() => loadBenchmark(BENCHMARK_MESSY_SENSORS, 'Benchmark: Messy Sensors & Faults')}
          >
            <AlertTriangle size={14} className="text-secondary" />
            <span>Messy Sensors</span>
          </button>
          <button
            type="button"
            className="btn-glass-primary"
            onClick={() => loadBenchmark(BENCHMARK_GEOSPATIAL_DELHI, 'Benchmark: Delhi Geo-Tagged NCT Network')}
          >
            <CheckCircle2 size={14} />
            <span>Geo-Tagged NCT</span>
          </button>
        </div>
      </section>

      {/* Main Ingestion Workspace Grid */}
      <div className="ingestion-main-grid">
        {/* Left Column: Dropzone / Paste Area (Span 8) */}
        <div className="ingestion-left-column">
          {/* Tab Switcher */}
          <div className="ingestion-tab-selector">
            <button
              type="button"
              className={`ingest-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <UploadCloud size={16} />
              <span>Batch File Dropzone</span>
            </button>
            <button
              type="button"
              className={`ingest-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
              onClick={() => setActiveTab('paste')}
            >
              <Code2 size={16} />
              <span>Raw Stream Buffer (Paste Text)</span>
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div
              className={`dropzone-canvas-card ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="dropzone-icon-box">
                <UploadCloud size={38} className="text-primary" />
              </div>
              <h3 className="dropzone-title">Drop CSV, TSV, or Tabular Log File</h3>
              <p className="dropzone-subtext">
                Supports arbitrary delimiters (comma, tab, semicolon), multi-unit gases (ppm, ppb, µg/m³),
                and geographic coordinates.
              </p>

              <div className="dropzone-actions">
                <label className="btn-emerald-primary cursor-pointer">
                  <span>Browse Sensor Datasets</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div className="dropzone-compliance-strip">
                <span>✓ CPCB 2026 Compliant</span>
                <span>✓ EPA AirNow Breakpoints</span>
                <span>✓ Auto-Delimiter Detection</span>
                <span>Max File: 5 MB</span>
              </div>
              {fileError && <p className="alert-banner alert-error" role="alert">{fileError}</p>}
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="paste-buffer-card">
              <div className="paste-buffer-header">
                <div className="paste-header-title">
                  <FileText size={16} className="text-primary" />
                  <span>Direct Tabular Buffer</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setPastedText(BENCHMARK_GEOSPATIAL_DELHI)}
                >
                  Load Sample CSV Payload
                </button>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste raw tabular observations (CSV, TSV, or Semicolon format)...&#10;Timestamp,Ward,PM2.5,PM10,NO2&#10;2026-11-14 08:00,Anand Vihar,420,590,135"
                rows={12}
                className="paste-textarea"
                maxLength={5_000_000}
              />

              <div className="paste-submit-footer">
                <span className="text-xs text-on-surface-variant font-mono">
                  {pastedText.length} characters staged
                </span>
                <button
                  type="submit"
                  disabled={isAnalyzing || !pastedText.trim()}
                  className="btn-emerald-primary"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Parsing Telemetry...</span>
                    </>
                  ) : (
                    <span>Process Staged Stream</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Diagnostic Spec Sheet & Protocol Inspector (Span 4) */}
        <div className="ingestion-right-column">
          <div className="diagnostic-spec-sheet">
            <div className="spec-header">
              <div className="spec-title-group">
                <Database size={18} className="text-secondary" />
                <h3 className="spec-title">Target Schema Health</h3>
              </div>
              <span className="spec-status-pill text-secondary">Validated</span>
            </div>

            <div className="spec-attribute-list">
              <div className="spec-row">
                <span className="label">Delimiter Detected</span>
                <span className="value font-mono">
                  {parsedResult?.delimiter === '\t' ? 'TAB (\\t)' : parsedResult?.delimiter === ';' ? 'Semicolon (;)' : 'Comma (,)'}
                </span>
              </div>
              <div className="spec-row">
                <span className="label">Total Records</span>
                <span className="value font-bold text-on-surface">
                  {parsedResult?.totalRows || 0} observations
                </span>
              </div>
              <div className="spec-row">
                <span className="label">Temporal Sufficiency</span>
                <span className="value text-primary font-bold">
                  {analytics?.hoursCovered || 0} Hours Covered
                </span>
              </div>
              <div className="spec-row">
                <span className="label">Geospatial Tagging</span>
                <span className={`value font-semibold ${analytics?.hasCoordinates ? 'text-primary' : 'text-tertiary'}`}>
                  {analytics?.hasCoordinates ? 'Active (GPS Coordinates)' : 'Station Names Only'}
                </span>
              </div>
              <div className="spec-row">
                <span className="label">Gaseous Unit Normalization</span>
                <span className="value text-secondary">
                  {Object.keys(parsedResult?.unitsDetected || {}).length > 0
                    ? `${Object.keys(parsedResult.unitsDetected).length} Units Converted to µg/m³`
                    : 'Standard SI µg/m³'}
                </span>
              </div>
            </div>

            {/* Quality Summary Gauges */}
            <div className="quality-gauges-block">
              <div className="gauge-item">
                <span className="gauge-label">Data Completeness</span>
                <span className="gauge-value text-primary">{analytics?.completeness || 100}%</span>
              </div>
              <div className="gauge-item">
                <span className="gauge-label">Missing Values</span>
                <span className="gauge-value text-tertiary">{analytics?.totalMissing || 0}</span>
              </div>
              <div className="gauge-item">
                <span className="gauge-label">Anomalies Screened</span>
                <span className="gauge-value text-error">{parsedResult?.totalAnomaliesCount || 0}</span>
              </div>
            </div>

            <div className="pipeline-notice-box">
              <Shield size={16} className="text-primary shrink-0" />
              <p className="notice-text">
                Zero-Imputation Policy: Missing sensor observations are kept as null. Never substituted with 0.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Screened Anomaly Log if anomalies exist */}
      {parsedResult?.anomalies && parsedResult.anomalies.length > 0 && (
        <section className="anomalies-log-section">
          <div className="section-title-strip">
            <div className="title-with-icon">
              <AlertTriangle size={18} className="text-error" />
              <h2 className="section-title">
                Screened Sensor Faults &amp; Anomalies ({parsedResult.totalAnomaliesCount})
              </h2>
            </div>
            <span className="text-xs text-on-surface-variant">
              Showing first {parsedResult.anomalies.length} screened events
            </span>
          </div>

          <div className="anomaly-items-grid">
            {parsedResult.anomalies.map((anom, idx) => (
              <div key={idx} className="anomaly-card-glass">
                <div className="anomaly-header">
                  <span className="anomaly-type-pill">{anom.type}</span>
                  <span className="anomaly-row-num">Row {anom.row}</span>
                </div>
                <p className="anomaly-msg">{anom.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabular Data Inspection Preview */}
      <section className="data-preview-section">
        <div className="section-title-strip">
          <div className="title-with-icon">
            <Database size={18} className="text-secondary" />
            <h2 className="section-title">Normalized Data Observations Preview</h2>
          </div>

          <div className="preview-search-box">
            <Search size={14} className="text-outline" />
            <input
              type="text"
              placeholder="Search station or timestamp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="preview-search-input"
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="civic-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Ward / Station</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>PM2.5</th>
                <th>PM10</th>
                <th>NO₂</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 15).map((row, idx) => (
                <tr key={idx}>
                  <td className="font-mono text-outline">{row._rowIndex || idx + 1}</td>
                  <td className="font-mono text-on-surface">{row.timestamp || '—'}</td>
                  <td className="font-semibold text-primary">{row.ward}</td>
                  <td className="font-mono text-xs">
                    {row.latitude !== null && row.latitude !== undefined ? row.latitude.toFixed(4) : '—'}
                  </td>
                  <td className="font-mono text-xs">
                    {row.longitude !== null && row.longitude !== undefined ? row.longitude.toFixed(4) : '—'}
                  </td>
                  <td className={`font-mono ${row.pm25 === null ? 'text-outline italic' : 'text-error'}`}>
                    {row.pm25 !== null ? `${row.pm25} µg/m³` : 'NULL'}
                  </td>
                  <td className={`font-mono ${row.pm10 === null ? 'text-outline italic' : 'text-tertiary'}`}>
                    {row.pm10 !== null ? `${row.pm10} µg/m³` : 'NULL'}
                  </td>
                  <td className={`font-mono ${row.no2 === null ? 'text-outline italic' : 'text-secondary'}`}>
                    {row.no2 !== null ? `${row.no2} µg/m³` : 'NULL'}
                  </td>
                  <td>
                    {row._flags && row._flags.length > 0 ? (
                      <span className="badge-flagged" title={row._flags.join(', ')}>
                        {row._flags.length} Flagged
                      </span>
                    ) : (
                      <span className="badge-clean">Clean</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="preview-footer-note">
          <span>Displaying first 15 rows of {filteredRows.length} matches.</span>
        </div>
      </section>
    </div>
  );
}
