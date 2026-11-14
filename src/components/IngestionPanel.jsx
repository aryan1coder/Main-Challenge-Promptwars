import { useState } from 'react';
import { UploadCloud, FileText, Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { BENCHMARK_DELHI_SMOG, BENCHMARK_MESSY_SENSORS } from '../lib/benchmarkData';

export default function IngestionPanel({ onDataParsed, isAnalyzing }) {
  const [mode, setMode] = useState('paste'); // 'upload' | 'paste'
  const [rawText, setRawText] = useState(BENCHMARK_DELHI_SMOG);
  const [fileName, setFileName] = useState('');
  const [inputError, setInputError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setInputError('File exceeds 5MB size limit.');
      return;
    }

    setFileName(file.name);
    setInputError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        onDataParsed(content, file.name);
      }
    };
    reader.onerror = () => {
      setInputError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleProcessText = () => {
    if (!rawText.trim()) {
      setInputError('Please enter or paste tabular air quality data.');
      return;
    }
    setInputError('');
    onDataParsed(rawText, fileName || 'Pasted Tabular Stream');
  };

  const loadBenchmark = (type) => {
    setInputError('');
    if (type === 'delhi') {
      setRawText(BENCHMARK_DELHI_SMOG);
      setFileName('Delhi_Winter_Smog_Incident.csv');
      onDataParsed(BENCHMARK_DELHI_SMOG, 'Benchmark: Delhi Winter Smog Episode');
    } else {
      setRawText(BENCHMARK_MESSY_SENSORS);
      setFileName('Messy_Industrial_Sensors.tsv');
      onDataParsed(BENCHMARK_MESSY_SENSORS, 'Benchmark: Messy Industrial Sensor Drops');
    }
  };

  return (
    <section className="civic-card ingestion-card" aria-labelledby="ingestion-heading">
      <div className="card-header">
        <div className="card-title-group">
          <Database size={20} className="card-icon text-civic-blue" aria-hidden="true" />
          <h2 id="ingestion-heading" className="card-title">1. Data Ingestion & Normalization</h2>
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Ingestion Input Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'paste'}
            className={`toggle-btn ${mode === 'paste' ? 'active' : ''}`}
            onClick={() => setMode('paste')}
          >
            <FileText size={15} aria-hidden="true" />
            Paste Table
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'upload'}
            className={`toggle-btn ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            <UploadCloud size={15} aria-hidden="true" />
            Upload CSV
          </button>
        </div>
      </div>

      <div className="benchmark-bar">
        <span className="benchmark-label">Evaluation Benchmarks:</span>
        <button
          type="button"
          className="btn-benchmark"
          onClick={() => loadBenchmark('delhi')}
          title="Load 24-hr severe winter smog dataset with multiple wards"
        >
          Delhi Severe Episode (Benchmark)
        </button>
        <button
          type="button"
          className="btn-benchmark"
          onClick={() => loadBenchmark('messy')}
          title="Load dataset with negative readings, sensor flatlining, and missing intervals"
        >
          Messy Sensors & Anomalies (Benchmark)
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="file-dropzone">
          <input
            type="file"
            id="csv-file-input"
            accept=".csv, .tsv, .txt"
            onChange={handleFileUpload}
            className="file-input-hidden"
          />
          <label htmlFor="csv-file-input" className="file-dropzone-label">
            <UploadCloud size={36} className="text-civic-slate" aria-hidden="true" />
            <span className="dropzone-text">
              {fileName ? <strong>Selected: {fileName}</strong> : 'Choose a .CSV or .TSV file or drag it here'}
            </span>
            <span className="dropzone-hint">Supports comma, tab, semicolon delimiters (up to 5MB)</span>
          </label>
        </div>
      ) : (
        <div className="paste-area-wrapper">
          <label htmlFor="raw-data-textarea" className="sr-only">Raw Tabular Air Quality Data</label>
          <textarea
            id="raw-data-textarea"
            className="raw-textarea"
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste CSV, TSV, or spreadsheet table (e.g. Timestamp, Ward, PM2.5, PM10, NO2)..."
          />
        </div>
      )}

      {inputError && (
        <div className="alert-banner alert-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{inputError}</span>
        </div>
      )}

      <div className="ingestion-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleProcessText}
          disabled={isAnalyzing}
        >
          <RefreshCw size={16} className={isAnalyzing ? 'spin' : ''} aria-hidden="true" />
          {isAnalyzing ? 'Processing Metrics...' : 'Run Deterministic Parsing & Analysis'}
        </button>
      </div>
    </section>
  );
}
