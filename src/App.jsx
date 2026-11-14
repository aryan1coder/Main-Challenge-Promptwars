import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import AnalyticsCharts from './components/AnalyticsCharts';
import IngestionPanel from './components/IngestionPanel';
import HotspotTable from './components/HotspotTable';
import DataPreviewTable from './components/DataPreviewTable';
import RoleInterventions from './components/RoleInterventions';
import BriefingConsole from './components/BriefingConsole';
import HistoricalComparison from './components/HistoricalComparison';
import { parseAirQualityData } from './lib/parsers/dataParser';
import { analyzeAirQualityDataset } from './lib/analytics/statsEngine';
import { generateGroundedBriefings } from './lib/services/geminiService';
import { BENCHMARK_DELHI_SMOG } from './lib/benchmarkData';
import { Shield, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import './App.css';

// Lazy initial load of the benchmark dataset to avoid cascading renders
function getInitialBenchmarkState() {
  try {
    const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    const computed = analyzeAirQualityDataset(parsed, { title: 'Benchmark: Delhi Winter Smog Episode', isBenchmark: true });
    return {
      parsed,
      analytics: computed,
      status: { type: 'success', message: `${parsed.totalRows} benchmark observations loaded` }
    };
  } catch {
    return {
      parsed: null,
      analytics: null,
      status: { type: 'ready', message: 'System Ready' }
    };
  }
}

export default function App() {
  const [initialState] = useState(getInitialBenchmarkState);
  const [language, setLanguage] = useState('en');
  const [datasetTitle, setDatasetTitle] = useState('Benchmark: Delhi Winter Smog Episode');
  const [parsedResult, setParsedResult] = useState(initialState.parsed);
  const [analytics, setAnalytics] = useState(initialState.analytics);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseError, setParseError] = useState('');
  
  // Navigation & Shell State
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // AI Briefing State
  const [aiBriefing, setAiBriefing] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // App status indicator
  const [status, setStatus] = useState(initialState.status);

  // Handler for parsing incoming tabular data
  const handleDataParsed = useCallback((rawText, title = 'Custom Air Quality Data') => {
    setIsAnalyzing(true);
    setParseError('');
    setDatasetTitle(title);
    setStatus({ type: 'working', message: 'Parsing & Computing Metrics...' });

    try {
      const isBenchmark = title.toLowerCase().includes('benchmark');
      const parsed = parseAirQualityData(rawText);
      const computedAnalytics = analyzeAirQualityDataset(parsed, { title, isBenchmark });

      setParsedResult(parsed);
      setAnalytics(computedAnalytics);
      setAiBriefing(null); // Reset AI briefing on new data ingestion
      setAiError('');

      setStatus({
        type: 'success',
        message: `${parsed.totalRows} observations verified`
      });
    } catch (err) {
      console.error('Ingestion Error:', err);
      setParseError(err.message || 'Failed to parse tabular data. Please verify column formats.');
      setStatus({ type: 'error', message: 'Data Parsing Error' });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Handler for live Gemini AI generation
  const handleGenerateAI = async () => {
    if (!analytics) return;
    setIsGeneratingAI(true);
    setAiError('');
    setStatus({ type: 'working', message: 'Synthesizing with Gemini 1.5 Flash...' });

    try {
      const result = await generateGroundedBriefings(analytics, { title: datasetTitle });
      setAiBriefing(result);
      setStatus({ type: 'success', message: 'AI Briefing Synthesized' });
    } catch (err) {
      console.error('Gemini Synthesis Error:', err);
      setAiError(err.message || 'Failed to communicate with Google Gemini API.');
      setStatus({ type: 'warning', message: 'AI Synthesis Quota/Key Error' });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="civic-command-shell">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        totalObservations={parsedResult?.totalRows || 0}
        confidenceTier={analytics?.confidenceTier}
      />

      {/* Main Full-Width Operational Workspace */}
      <div className={`workspace-viewport ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        {/* Sticky Command Bar Header */}
        <Header
          language={language}
          setLanguage={setLanguage}
          status={status}
          confidenceTier={analytics?.confidenceTier}
          datasetTitle={datasetTitle}
        />

        {/* Scrollable Main Workspace Canvas */}
        <main className="workspace-scroll-canvas" role="main">
          {/* Fictional Benchmark Evaluation Disclaimer */}
          {analytics?.isBenchmark && (
            <div className="alert-banner alert-benchmark-disclaimer" role="note" aria-label="Benchmark Disclaimer">
              <AlertCircle size={16} className="text-amber-700" aria-hidden="true" />
              <span>
                <strong>Evaluation Disclaimer:</strong> Benchmark observations are fictional and intended for software evaluation only.
              </span>
            </div>
          )}

          {parseError && (
            <div className="alert-banner alert-error" role="alert">
              <strong>Data Ingestion Failure:</strong> {parseError}
            </div>
          )}

          {/* Section 1: Command Overview & KPI Grid */}
          {analytics && (
            <MetricsGrid
              analytics={analytics}
              language={language}
            />
          )}

          {/* Section 2: Data Ingestion & Stream Normalization */}
          <div id="ingestion">
            <IngestionPanel
              onDataParsed={handleDataParsed}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Section 3: Visual Analytics & Time-Series Telemetry */}
          {analytics && (
            <AnalyticsCharts
              analytics={analytics}
              parsedResult={parsedResult}
            />
          )}

          {/* Section 4: Spatial Hotspots & Raw Data Inspection */}
          {analytics && (
            <div id="hotspots" className="hotspots-section-wrapper">
              <div className="civic-grid-two-col">
                <HotspotTable
                  hotspots={analytics.hotspots}
                  anomalies={analytics.anomaliesSummary.recent}
                />
                <DataPreviewTable
                  parsedResult={parsedResult}
                />
              </div>
            </div>
          )}

          {/* Section 5: Role-Tailored Operational Directives */}
          {analytics && (
            <div id="directives">
              <RoleInterventions
                aiBriefing={aiBriefing}
                analytics={analytics}
              />
            </div>
          )}

          {/* Section 6: AI Briefing Console & Bilingual Advisories */}
          {analytics && (
            <div id="briefings">
              <BriefingConsole
                aiBriefing={aiBriefing}
                analytics={analytics}
                language={language}
                setLanguage={setLanguage}
                onGenerateAI={handleGenerateAI}
                isGenerating={isGeneratingAI}
                aiError={aiError}
              />
            </div>
          )}

          {/* Section 7: Historical Comparison & Trend Baseline */}
          {analytics && (
            <div id="history">
              <HistoricalComparison
                analytics={analytics}
                aiBriefing={aiBriefing}
                datasetTitle={datasetTitle}
              />
            </div>
          )}

          {/* Section 8: Regulatory Standards & CPCB Compliance Architecture */}
          <section id="standards" className="civic-card standards-reference-card" aria-labelledby="standards-heading">
            <div className="card-header">
              <div className="card-title-group">
                <BookOpen size={20} className="card-icon text-civic-blue" aria-hidden="true" />
                <h2 id="standards-heading" className="card-title">Regulatory Framework & Scientific Standards</h2>
              </div>
              <span className="badge badge-verified">
                <CheckCircle2 size={14} aria-hidden="true" />
                CPCB NAAQS 2026 Reference
              </span>
            </div>

            <div className="standards-grid">
              <div className="standard-box">
                <h4>Linear Interpolation Formula</h4>
                <p>Calculates sub-indices deterministically across Indian National Ambient Air Quality Standards breakpoints:</p>
                <code>Ip = [ (Ihi - Ilo) / (BPhi - BPlo) ] * (Cp - BPlo) + Ilo</code>
              </div>
              <div className="standard-box">
                <h4>Temporal Sufficiency (≥16h Rule)</h4>
                <p>CPCB regulatory guidelines require a minimum of 16 hourly data points in a 24-hour cycle. Datasets under 16 hours are classified as indicative sub-indices.</p>
              </div>
              <div className="standard-box">
                <h4>Multi-Parameter Rule</h4>
                <p>An official National AQI mandates at least 3 criteria pollutants (with at least PM2.5 or PM10). Datasets with fewer parameters are explicitly labeled Indicative Sub-Indices.</p>
              </div>
              <div className="standard-box">
                <h4>Empirical Non-Causal Grounding</h4>
                <p>Historical shifts reflect observed sensor differences between monitoring sessions. They do not claim definitive causal proof of municipal intervention efficacy.</p>
              </div>
            </div>
          </section>

          {/* Command Center Footer */}
          <footer className="civic-command-footer" role="contentinfo">
            <div className="footer-content">
              <div className="footer-left">
                <Shield size={16} className="text-civic-blue" aria-hidden="true" />
                <span>Civic Air Quality Briefing Studio | PromptWars Evaluation Platform</span>
              </div>
              <div className="footer-right">
                <span>Deterministic Science Engine v2.4 + Google Gemini 1.5 Flash</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
