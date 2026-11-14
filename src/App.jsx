import { useState, useCallback } from 'react';
import Header from './components/Header';
import IngestionPanel from './components/IngestionPanel';
import MetricsGrid from './components/MetricsGrid';
import HotspotTable from './components/HotspotTable';
import DataPreviewTable from './components/DataPreviewTable';
import RoleInterventions from './components/RoleInterventions';
import BriefingConsole from './components/BriefingConsole';
import HistoricalComparison from './components/HistoricalComparison';
import { parseAirQualityData } from './lib/parsers/dataParser';
import { analyzeAirQualityDataset } from './lib/analytics/statsEngine';
import { generateGroundedBriefings } from './lib/services/geminiService';
import { BENCHMARK_DELHI_SMOG } from './lib/benchmarkData';
import { Shield } from 'lucide-react';
import './App.css';

// Lazy initial load of the benchmark dataset to avoid cascading renders
function getInitialBenchmarkState() {
  try {
    const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
    const computed = analyzeAirQualityDataset(parsed);
    return {
      parsed,
      analytics: computed,
      status: { type: 'success', message: `${parsed.totalRows} benchmark observations verified` }
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
      const parsed = parseAirQualityData(rawText);
      const computedAnalytics = analyzeAirQualityDataset(parsed);

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
    <div className="civic-app-container">
      <Header
        language={language}
        setLanguage={setLanguage}
        status={status}
        confidenceTier={analytics?.confidenceTier}
      />

      <main className="civic-main" role="main">
        {/* Top Ingestion Section */}
        <IngestionPanel
          onDataParsed={handleDataParsed}
          isAnalyzing={isAnalyzing}
        />

        {parseError && (
          <div className="alert-banner alert-error" role="alert">
            <strong>Data Ingestion Failure:</strong> {parseError}
          </div>
        )}

        {/* Deterministic Telemetry & Metrics */}
        {analytics && (
          <>
            <MetricsGrid
              analytics={analytics}
              language={language}
            />

            <div className="civic-grid-two-col">
              <HotspotTable
                hotspots={analytics.hotspots}
                anomalies={analytics.anomaliesSummary.recent}
              />
              <DataPreviewTable
                parsedResult={parsedResult}
              />
            </div>

            {/* Role-Tailored Operational Directives */}
            <RoleInterventions
              aiBriefing={aiBriefing}
              analytics={analytics}
            />

            {/* AI Briefing & Multilingual Citizen Advisory */}
            <BriefingConsole
              aiBriefing={aiBriefing}
              analytics={analytics}
              language={language}
              setLanguage={setLanguage}
              onGenerateAI={handleGenerateAI}
              isGenerating={isGeneratingAI}
              aiError={aiError}
            />

            {/* Historical Trend Delta & Intervention Efficacy */}
            <HistoricalComparison
              analytics={analytics}
              aiBriefing={aiBriefing}
              datasetTitle={datasetTitle}
            />
          </>
        )}
      </main>

      <footer className="civic-footer" role="contentinfo">
        <div className="footer-content">
          <div className="footer-left">
            <Shield size={16} className="text-civic-blue" aria-hidden="true" />
            <span>Civic Air Quality Briefing Studio | PromptWars Warm-up Challenge</span>
          </div>
          <div className="footer-right">
            <span>Powered by <strong>Google Gemini 1.5 Flash</strong> & Deterministic Environmental Science</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
