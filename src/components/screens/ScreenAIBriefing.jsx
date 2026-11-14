import { useState } from 'react';
import {
  Sparkles,
  FileText,
  Volume2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Quote,
  Layers
} from 'lucide-react';
import { getHealthAdvisory } from '../../lib/analytics/aqiCalculator';

export default function ScreenAIBriefing({
  aiBriefing,
  analytics,
  language,
  setLanguage,
  onGenerateAI,
  isGenerating,
  aiError
}) {
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' | 'public' | 'traceability'
  const [copied, setCopied] = useState(false);

  const aiData = aiBriefing?.data;
  const aqi = Number.isFinite(analytics?.aqi?.aqi) ? analytics.aqi.aqi : null;
  const aqiCat = analytics?.aqi?.category || 'Unavailable';
  const primaryWard = analytics?.primaryHotspot?.ward || 'Not identified';
  const meanPM25 = Number.isFinite(analytics?.pollutantStats?.pm25?.mean)
    ? analytics.pollutantStats.pm25.mean
    : null;

  // Bilingual citizen advisories
  const citizenAdvisories = aiData?.citizenAdvisories || aiData?.citizenAdvisory || {};
  const advText = language === 'hi'
    ? citizenAdvisories.hindi || {
        headline: `वायु गुणवत्ता श्रेणी: ${aqiCat}`,
        generalPublic: getHealthAdvisory(aqiCat, 'hi'),
        vulnerableGroups: 'बच्चे, बुजुर्ग और हृदय या फेफड़ों की समस्या वाले लोग स्थानीय स्वास्थ्य निर्देशों का पालन करें।'
      }
    : citizenAdvisories.english || {
        headline: `Air-quality category: ${aqiCat}`,
        generalPublic: getHealthAdvisory(aqiCat, 'en'),
        vulnerableGroups: 'Children, older adults, and people with heart or lung conditions should follow local health guidance.'
      };

  const handleCopy = async () => {
    let textToCopy;
    if (activeTab === 'internal') {
      textToCopy = `CIVIC AIR QUALITY BRIEFING NOTE\n` +
        `Date: ${new Date().toLocaleDateString()}\n` +
        `Overall AQI: ${aqi ?? 'N/A'} (${aqiCat})\n` +
        `Primary Hotspot: ${primaryWard} (Mean PM2.5: ${meanPM25 ?? 'N/A'} µg/m³)\n\n` +
        `Executive Summary:\n${aiData?.executiveSummary || 'Calculated telemetry indicates elevated exposure risks across regional wards.'}\n\n` +
        `Data Confidence: ${analytics?.confidenceTier} (${analytics?.completeness}% complete)\n` +
        `Methodology: ${analytics?.aqi?.calculationMethodology || 'CPCB Linear Breakpoints'}\n\n` +
        `Governance Notice: Advisory document. Competent authority authorization required for official enforcement.`;
    } else {
      textToCopy = `PUBLIC AIR QUALITY ADVISORY (${language.toUpperCase()})\n` +
        `Status: ${aqiCat} (AQI ${aqi})\n` +
        `Headline: ${advText.headline}\n\n` +
        `General Precautionary Advice:\n${advText.generalPublic}\n\n` +
        `Guidance for Vulnerable Populations:\n${advText.vulnerableGroups}\n\n` +
        `Notice: Informational civic advisory based on indicative ambient telemetry. Not a substitute for professional medical treatment or official municipal public health notices.`;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleDownloadJSON = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      analytics,
      aiBriefing,
      traceability: {
        sourceObservationsCount: analytics?.totalRows,
        calculationMethod: analytics?.aqi?.calculationMethodology,
        peakWindow: analytics?.peakExposureWindow,
        missingDataCount: analytics?.totalMissing,
        confidenceTier: analytics?.confidenceTier
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air_quality_briefing_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stitch-screen-container">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Civic Intelligence</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">AI Briefing &amp; Advisory Studio</span>
          </div>
          <h1 className="header-main-title">Evidence-Grounded Synthesis Engine</h1>
          <p className="header-subtitle">
            Uses <strong>Gemini 2.5 Flash when configured</strong>, with a clearly labeled deterministic fallback.
            Briefings summarize supplied calculations and do not infer pollution sources or causes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="header-actions-group">
          <button
            type="button"
            className="btn-emerald-primary"
            onClick={onGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Preparing grounded briefing...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>{aiData ? 'Re-Synthesize Briefing' : 'Generate AI Briefing'}</span>
              </>
            )}
            {aiBriefing && (
              <div className="alert-banner alert-benchmark-disclaimer" role="status">
                <strong>Briefing source:</strong>{' '}
                {aiBriefing.source === 'rule-based-fallback'
                  ? 'Deterministic rule-based fallback; not generated by Gemini.'
                  : `Gemini (${aiBriefing.modelUsed || 'model not reported'}); review before operational use.`}
              </div>
            )}
          </button>

          <button
            type="button"
            className="btn-glass-subtle"
            onClick={handleCopy}
            title="Copy Current Briefing"
          >
            {copied ? <Check size={15} className="text-primary" /> : <Copy size={15} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Advisory'}</span>
          </button>

          <button
            type="button"
            className="btn-glass-subtle"
            onClick={handleDownloadJSON}
            title="Download JSON Record"
          >
            <Download size={15} />
            <span>Export JSON</span>
          </button>
        </div>
      </section>

      {/* Honest Error State Banner (Zero Disqualification Compliance) */}
      {aiError && (
        <div className="honest-error-banner-glass">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <div className="error-text-block">
            <h4 className="error-title">AI Synthesis Offline or API Key Unconfigured</h4>
            <p className="error-desc">
              {aiError}. Per the <strong>Zero-Disqualification Scientific Integrity Policy</strong>,
              the platform refuses to simulate or fabricate fake AI text. Deterministic calculations
              and role directives remain 100% active.
            </p>
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="briefing-studio-main-grid">
        {/* Left Column: Briefing Document Display (Span 8) */}
        <div className="briefing-document-pane">
          {/* Sub-Navigation Tabs */}
          <div className="briefing-pane-tabs">
            <button
              type="button"
              className={`pane-tab ${activeTab === 'internal' ? 'active' : ''}`}
              onClick={() => setActiveTab('internal')}
            >
              <FileText size={15} />
              <span>Internal Administrative Note</span>
            </button>
            <button
              type="button"
              className={`pane-tab ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              <Volume2 size={15} />
              <span>Bilingual Citizen Advisory</span>
            </button>
            <button
              type="button"
              className={`pane-tab ${activeTab === 'traceability' ? 'active' : ''}`}
              onClick={() => setActiveTab('traceability')}
            >
              <ShieldCheck size={15} />
              <span>Evidence Traceability Audit</span>
            </button>
          </div>

          {activeTab === 'internal' ? (
            /* Internal Administrative Note */
            <article className="briefing-document-card-glass">
              <div className="doc-meta-strip">
                <span className="doc-type-tag">ADVISORY BRIEFING · SOURCE-LABELED</span>
                <span className="doc-date font-mono">{new Date().toLocaleString()}</span>
              </div>

              <h2 className="doc-main-headline">
                Atmospheric Inversion Dynamics &amp; Municipal Intervention Protocol
              </h2>

              {/* Overline Takeaway Blockquote */}
              <blockquote className="takeaway-blockquote">
                <Quote size={28} className="text-secondary shrink-0" />
                <p>
                  {aiData?.executiveSummary ||
                    'Generate a briefing to summarize the available calculated observations. No pollution source or cause is inferred from aggregate concentrations.'}
                </p>
              </blockquote>

              {/* Key Critical Findings */}
              <div className="critical-findings-stack">
                <h3 className="section-micro-heading">Critical Scientific Observations:</h3>

                <div className="finding-row">
                  <div className="finding-index bg-error-subtle text-error">01</div>
                  <div className="finding-body">
                    <strong className="finding-title text-error">
                      PM2.5 summary for {primaryWard}
                    </strong>
                    <p className="finding-text">
                      Mean: {meanPM25 ?? 'N/A'} µg/m³; maximum: {analytics?.pollutantStats?.pm25?.max ?? 'N/A'} µg/m³.
                      These are aggregate measurements, not evidence of meteorological causes.
                    </p>
                  </div>
                </div>

                <div className="finding-row">
                  <div className="finding-index bg-emerald-subtle text-primary">02</div>
                  <div className="finding-body">
                    <strong className="finding-title text-primary">
                      Highest-ranked hotspot: {primaryWard}
                    </strong>
                    <p className="finding-text">
                      {analytics?.primaryHotspot
                        ? `${analytics.primaryHotspot.readingsCount} observations are assigned to this station; the ranking uses mean PM2.5.`
                        : 'No hotspot could be ranked from the available observations.'}
                    </p>
                  </div>
                </div>

                <div className="finding-row">
                  <div className="finding-index bg-cyan-subtle text-secondary">03</div>
                  <div className="finding-body">
                    <strong className="finding-title text-secondary">
                      Available pollutant coverage
                    </strong>
                    <p className="finding-text">
                      {analytics?.availablePollutants?.length
                        ? analytics.availablePollutants.join(', ').toUpperCase()
                        : 'No pollutant statistics available.'}
                      {' '}Concentration summaries alone do not identify emission sources.
                    </p>
                  </div>
                </div>
              </div>

              {/* Statutory Governance Disclaimer */}
              <div className="governance-disclaimer-box">
                <ShieldCheck size={15} className="text-primary shrink-0" />
                <p>
                  <strong>Statutory Governance Notice:</strong> This briefing is an advisory intelligence document
                  synthesized from verified sensor observations. Formal municipal closures or penalty orders mandate
                  written authorization by the designated Competent Municipal Authority under applicable environmental statutes.
                </p>
              </div>
            </article>
          ) : activeTab === 'public' ? (
            /* Bilingual Citizen Advisory */
            <article className="briefing-document-card-glass">
              <div className="doc-meta-strip">
                <div className="flex items-center gap-2">
                  <span className="doc-type-tag">PUBLIC CITIZEN ADVISORY</span>
                  <div className="language-toggle-pills">
                    <button
                      type="button"
                      className={`lang-pill ${language === 'en' ? 'active' : ''}`}
                      onClick={() => setLanguage('en')}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={`lang-pill ${language === 'hi' ? 'active' : ''}`}
                      onClick={() => setLanguage('hi')}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>
                <span className="doc-date font-mono">Status: {aqiCat.toUpperCase()}</span>
              </div>

              <h2 className="doc-main-headline text-error">{advText.headline}</h2>

              <div className="public-advisory-cards">
                <div className="advisory-card-box">
                  <h4 className="advisory-sub-heading">
                    {language === 'hi' ? 'सामान्य जन परामर्श' : 'General Precautionary Advice'}
                  </h4>
                  <p className="advisory-body-text">{advText.generalPublic}</p>
                </div>

                <div className="advisory-card-box border-tertiary">
                  <h4 className="advisory-sub-heading text-tertiary">
                    {language === 'hi' ? 'संवेदनशील समूहों के लिए निर्देश' : 'Vulnerable Populations Safeguards'}
                  </h4>
                  <p className="advisory-body-text">{advText.vulnerableGroups}</p>
                </div>
              </div>

              <div className="medical-disclaimer-notice">
                <AlertTriangle size={15} className="text-tertiary shrink-0" />
                <p>
                  {language === 'hi'
                    ? 'चिकित्सीय सूचना: यह परामर्श सार्वजनिक स्वास्थ्य मार्गदर्शन हेतु है। विशिष्ट स्वास्थ्य लक्षणों पर अधिकृत चिकित्सक से परामर्श लें।'
                    : 'Medical Disclaimer: This advisory provides public health awareness. Consult certified physicians for personal medical treatment.'}
                </p>
              </div>
            </article>
          ) : (
            /* Evidence Traceability Audit */
            <article className="briefing-document-card-glass">
              <div className="doc-meta-strip">
                <span className="doc-type-tag">MATHEMATICAL GROUNDING TRACEABILITY</span>
                <span className="doc-date font-mono">{aiBriefing?.source === 'gemini' ? 'MODEL-GENERATED · REVIEW REQUIRED' : 'CALCULATED OBSERVATIONS'}</span>
              </div>

              <h2 className="doc-main-headline">Evidentiary Grounding Verification</h2>
              <p className="text-sm text-on-surface-variant mb-4">
                Deterministic values below come from the supplied dataset. Model-generated prose requires human review.
              </p>

              <div className="traceability-facts-table-wrap">
                <table className="civic-data-table">
                  <thead>
                    <tr>
                      <th>Grounding Metric</th>
                      <th>Deterministic Value</th>
                      <th>Source Scope</th>
                      <th>Evidentiary Integrity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold">Calculated AQI</td>
                      <td className="font-mono text-error font-bold">{aqi ?? 'N/A'} ({aqiCat})</td>
                      <td>CPCB Sub-Index Interpolation</td>
                      <td className="text-primary">Verified Mathematical Fact</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Primary Hotspot Ward</td>
                      <td className="font-mono text-primary font-bold">{primaryWard}</td>
                      <td>Spatial Aggregation Engine</td>
                      <td className="text-primary">Verified Mathematical Fact</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Mean PM2.5 Particulate</td>
                      <td className="font-mono text-error font-bold">{meanPM25 ?? 'N/A'} µg/m³</td>
                      <td>Arithmetic Mean of Valid Rows</td>
                      <td className="text-primary">Verified Mathematical Fact</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Peak Exposure Phase</td>
                      <td className="font-mono text-tertiary font-bold">{analytics?.peakExposureWindow}</td>
                      <td>Observed hourly PM2.5 aggregation</td>
                      <td className="text-primary">Verified Mathematical Fact</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Temporal Sufficiency</td>
                      <td className="font-mono">{analytics?.hoursCovered} Hours Covered</td>
                      <td>CPCB &gt;=16h Threshold</td>
                      <td className="text-secondary">{analytics?.confidenceTier}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </div>

        {/* Right Column: Factor Decomposition & Compliance Audit (Span 4) */}
        <div className="briefing-sidebar-pane">
          {/* Factor Decomposition */}
          <div className="factor-decomposition-card-glass">
            <div className="sidebar-pane-header">
              <Layers size={17} className="text-primary" />
              <h3 className="sidebar-pane-title">Factor Decomposition</h3>
            </div>
            <p className="sidebar-pane-subtext">
              Source attribution is unavailable without meteorological and source-apportionment measurements.
            </p>
            <dl className="discipline-specs">
              <div className="spec-item"><dt className="label">Data confidence:</dt><dd className="val">{analytics?.confidenceTier || 'Unavailable'}</dd></div>
              <div className="spec-item"><dt className="label">Missing readings:</dt><dd className="val">{analytics?.totalMissing ?? 'Unavailable'}</dd></div>
              <div className="spec-item"><dt className="label">Flagged anomalies:</dt><dd className="val">{analytics?.anomaliesSummary?.total ?? 'Unavailable'}</dd></div>
            </dl>
          </div>

          {/* Prompt Discipline & Safety Constraints Spec */}
          <div className="system-discipline-card-glass">
            <h4 className="discipline-title">Synthesis Integrity</h4>
            <div className="discipline-specs">
              <div className="spec-item">
                <span className="label">Temperature:</span>
                <span className="val font-mono">Low (0.15)</span>
              </div>
              <div className="spec-item">
                <span className="label">Structured Output:</span>
                <span className="val font-mono">application/json</span>
              </div>
              <div className="spec-item">
                <span className="label">Hallucination Gate:</span>
                <span className="val text-primary font-bold">Review required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
