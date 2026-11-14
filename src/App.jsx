import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthPage from './components/auth/AuthPage';
import WorkspaceSelection from './components/auth/WorkspaceSelection';
import { parseAirQualityData } from './lib/parsers/dataParser';
import { analyzeAirQualityDataset } from './lib/analytics/statsEngine';
import { generateGroundedBriefings } from './lib/services/geminiService';
import { auth, signOutUser } from './lib/googleServices';
import { onAuthStateChanged } from 'firebase/auth';
import { BENCHMARK_DELHI_SMOG } from './lib/benchmarkData';
import { Shield, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import './App.css';

const ScreenOverview = lazy(() => import('./components/screens/ScreenOverview'));
const ScreenDataIngestion = lazy(() => import('./components/screens/ScreenDataIngestion'));
const ScreenAnalytics = lazy(() => import('./components/screens/ScreenAnalytics'));
const ScreenMapIntelligence = lazy(() => import('./components/screens/ScreenMapIntelligence'));
const ScreenHotspots = lazy(() => import('./components/screens/ScreenHotspots'));
const ScreenDirectives = lazy(() => import('./components/screens/ScreenDirectives'));
const ScreenAIBriefing = lazy(() => import('./components/screens/ScreenAIBriefing'));
const ScreenHistory = lazy(() => import('./components/screens/ScreenHistory'));

function getSavedDemoUser() {
  try {
    if (sessionStorage.getItem('civic_demo_session') !== 'true') return null;
    const user = JSON.parse(sessionStorage.getItem('civic_current_user') || 'null');
    return user?.isDemo === true ? user : null;
  } catch {
    return null;
  }
}

// Lazy initial load of the benchmark dataset to avoid cascading renders
function getInitialBenchmarkState() {
  const parsed = parseAirQualityData(BENCHMARK_DELHI_SMOG);
  const computed = analyzeAirQualityDataset(parsed, {
    title: 'Benchmark: Delhi Winter Smog Episode',
    isBenchmark: true
  });
  return {
    parsed,
    analytics: computed,
    status: { type: 'success', message: `${parsed.totalRows} observations verified` }
  };
}

export default function App() {
  const [initialState] = useState(getInitialBenchmarkState);
  const [demoUser] = useState(getSavedDemoUser);
  const [language, setLanguage] = useState('en');
  const [datasetTitle, setDatasetTitle] = useState('Benchmark: Delhi Winter Smog Episode');
  const [parsedResult, setParsedResult] = useState(initialState.parsed);
  const [analytics, setAnalytics] = useState(initialState.analytics);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Authentication & Operational Workspace Flow ('auth' | 'workspace' | 'app')
  const [authView, setAuthView] = useState(() => {
    if (!demoUser) return 'auth';
    return sessionStorage.getItem('civic_auth_view') === 'app' ? 'app' : 'workspace';
  });
  const [currentUser, setCurrentUser] = useState(demoUser);

  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('civic_selected_role') || 'ward';
    }
    return 'ward';
  });

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authorized User',
          isDemo: false
        });
        setAuthView((current) => current === 'auth' ? 'workspace' : current);
      } else if (!getSavedDemoUser()) {
        setCurrentUser(null);
        setAuthView('auth');
      }
    });
  }, []);

  // Active Screen: 8 connected screens in Stitch architecture
  // 'overview' | 'data-ingestion' | 'analytics' | 'map-intelligence' | 'hotspots' | 'directives' | 'ai-briefing' | 'history' | 'standards'
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Authentication & Workspace Navigation Callbacks
  const handleLoginSuccess = useCallback((user) => {
    setCurrentUser(user);
    setAuthView('workspace');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('civic_demo_session');
      sessionStorage.removeItem('civic_current_user');
      sessionStorage.setItem('civic_auth_view', 'workspace');
    }
  }, []);

  const handleExploreDemo = useCallback(() => {
    const demoUser = {
      email: 'evaluator@promptwars.org',
      name: 'Evaluation Commissioner',
      isDemo: true
    };
    setCurrentUser(demoUser);
    setAuthView('workspace');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('civic_demo_session', 'true');
      sessionStorage.setItem('civic_current_user', JSON.stringify(demoUser));
      sessionStorage.setItem('civic_auth_view', 'workspace');
    }
  }, []);

  const handleSelectWorkspace = useCallback((roleId, defaultSection) => {
    setSelectedRole(roleId);
    if (defaultSection) {
      setActiveSection(defaultSection);
    }
    setAuthView('app');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('civic_selected_role', roleId);
      sessionStorage.setItem('civic_auth_view', 'app');
    }
  }, []);

  const handleOpenWorkspace = useCallback(() => {
    setAuthView('workspace');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('civic_auth_view', 'workspace');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign-out failed:', error);
      return;
    }
    setCurrentUser(null);
    setAuthView('auth');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('civic_demo_session');
      sessionStorage.removeItem('civic_current_user');
      sessionStorage.setItem('civic_auth_view', 'auth');
    }
  }, []);

  // AI Briefing State
  const [aiBriefing, setAiBriefing] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Status indicator
  const [status, setStatus] = useState(initialState.status);

  // Ingestion handler
  const handleDataParsed = useCallback((rawText, title = 'Custom Air Quality Data') => {
    setIsAnalyzing(true);
    setParseError('');
    setDatasetTitle(title);
    setStatus({ type: 'working', message: 'Parsing & Normalizing Telemetry...' });

    try {
      const isBenchmark = title.toLowerCase().includes('benchmark');
      const parsed = parseAirQualityData(rawText);
      const computedAnalytics = analyzeAirQualityDataset(parsed, { title, isBenchmark });

      setParsedResult(parsed);
      setAnalytics(computedAnalytics);
      setAiBriefing(null);
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

  // Gemini AI generation handler
  const handleGenerateAI = async () => {
    if (!analytics) return;
    setIsGeneratingAI(true);
    setAiError('');
    setStatus({ type: 'working', message: 'Preparing grounded briefing...' });

    try {
      const result = await generateGroundedBriefings(analytics, { title: datasetTitle });
      setAiBriefing(result);
      setStatus({
        type: 'success',
        message: result.source === 'rule-based-fallback'
          ? 'Rule-based fallback briefing generated'
          : 'Gemini briefing synthesized'
      });
    } catch (err) {
      console.error('Gemini Synthesis Error:', err);
      setAiError(err.message || 'Failed to communicate with Google Gemini API.');
      setStatus({ type: 'warning', message: 'AI Synthesis Quota/Key Notice' });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportBriefing = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      datasetTitle,
      analytics,
      aiBriefing,
      compliance: {
        standard: 'CPCB NAAQS 2026',
        sufficientHoursRule: analytics?.hoursCovered >= 16,
        confidenceTier: analytics?.confidenceTier
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civic_air_briefing_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Canonicalize section names for backwards compatibility
  const canonicalSection = (() => {
    if (activeSection === 'ingestion') return 'data-ingestion';
    if (activeSection === 'briefings') return 'ai-briefing';
    return activeSection;
  })();

  if (authView === 'auth') {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        onExploreDemo={handleExploreDemo}
      />
    );
  }

  if (authView === 'workspace') {
    return (
      <WorkspaceSelection
        currentUser={currentUser}
        onSelectWorkspace={handleSelectWorkspace}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="civic-command-shell">
      {/* Fixed Left Navigation Sidebar (Stitch Aetheris OS) */}
      <Sidebar
        activeSection={canonicalSection}
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
          selectedRole={selectedRole}
          currentUser={currentUser}
          onOpenWorkspace={handleOpenWorkspace}
          onSignOut={handleSignOut}
        />

        {/* Scrollable Main Workspace Canvas */}
        <main className="workspace-scroll-canvas" role="main">
          {/* Fictional Benchmark Evaluation Disclaimer */}
          {analytics?.isBenchmark && (
            <div className="alert-banner alert-benchmark-disclaimer" role="note" aria-label="Benchmark Disclaimer">
              <AlertCircle size={16} className="text-tertiary" aria-hidden="true" />
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

          {/* 8 Connected Screen Router */}
          <Suspense fallback={<div className="screen-loading-state" role="status">Loading workspace…</div>}>
          {canonicalSection === 'overview' && (
            <ScreenOverview
              analytics={analytics}
              setActiveSection={setActiveSection}
              onExport={handleExportBriefing}
            />
          )}

          {canonicalSection === 'data-ingestion' && (
            <ScreenDataIngestion
              parsedResult={parsedResult}
              analytics={analytics}
              onDataParsed={handleDataParsed}
              isAnalyzing={isAnalyzing}
            />
          )}

          {canonicalSection === 'analytics' && (
            <ScreenAnalytics
              analytics={analytics}
              parsedResult={parsedResult}
            />
          )}

          {canonicalSection === 'map-intelligence' && (
            <ScreenMapIntelligence
              analytics={analytics}
              onDataParsed={handleDataParsed}
            />
          )}

          {canonicalSection === 'hotspots' && (
            <ScreenHotspots
              analytics={analytics}
              setActiveSection={setActiveSection}
            />
          )}

          {canonicalSection === 'directives' && (
            <ScreenDirectives
              analytics={analytics}
              aiBriefing={aiBriefing}
              selectedRole={selectedRole}
            />
          )}

          {canonicalSection === 'ai-briefing' && (
            <ScreenAIBriefing
              aiBriefing={aiBriefing}
              analytics={analytics}
              language={language}
              setLanguage={setLanguage}
              onGenerateAI={handleGenerateAI}
              isGenerating={isGeneratingAI}
              aiError={aiError}
            />
          )}

          {canonicalSection === 'history' && (
            <ScreenHistory
              analytics={analytics}
              aiBriefing={aiBriefing}
              datasetTitle={datasetTitle}
            />
          )}

          {canonicalSection === 'standards' && (
            <section id="standards" className="civic-card standards-reference-card" aria-labelledby="standards-heading">
              <div className="card-header">
                <div className="card-title-group">
                  <BookOpen size={20} className="card-icon text-primary" aria-hidden="true" />
                  <h2 id="standards-heading" className="card-title">Regulatory Framework &amp; Scientific Standards</h2>
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
                  <h4>Temporal Sufficiency (&ge;16h Rule)</h4>
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
          )}
          </Suspense>

          {/* Command Center Footer */}
          <footer className="civic-command-footer" role="contentinfo">
            <div className="footer-content">
              <div className="footer-left">
                <Shield size={16} className="text-primary" aria-hidden="true" />
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
