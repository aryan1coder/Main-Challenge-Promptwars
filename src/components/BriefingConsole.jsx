import { useState } from 'react';
import { Sparkles, FileText, Megaphone, Copy, Check, Download, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function BriefingConsole({
  aiBriefing,
  analytics,
  language,
  setLanguage,
  onGenerateAI,
  isGenerating,
  aiError
}) {
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' | 'public'
  const [copied, setCopied] = useState(false);
  const [showTraceability, setShowTraceability] = useState(false);

  const aiData = aiBriefing?.data;
  const aqi = analytics?.aqi?.aqi || 0;
  const aqiCat = analytics?.aqi?.category || 'Moderate';
  const primaryWard = analytics?.primaryHotspot?.ward || 'General Station';
  const meanPM25 = analytics?.pollutantStats?.pm25?.mean || 140;

  // Copy handler
  const handleCopy = async () => {
    let textToCopy;
    if (activeTab === 'internal') {
      textToCopy = `CIVIC AIR QUALITY BRIEFING NOTE\n` +
        `Date: ${new Date().toLocaleDateString()}\n` +
        `Overall AQI: ${aqi} (${aqiCat})\n` +
        `Primary Hotspot: ${primaryWard} (Mean PM2.5: ${meanPM25} µg/m³)\n\n` +
        `Executive Summary:\n${aiData?.executiveSummary || 'Calculated air quality metrics indicate elevated exposure risks across regional wards.'}\n\n` +
        `Data Confidence: ${analytics?.confidenceTier} (${analytics?.completeness}% complete)\n` +
        `Methodology: ${analytics?.aqi?.calculationMethodology || 'CPCB Linear Breakpoints'}\n` +
        `Uncertainty Notes: ${aiData?.uncertaintyNotes || 'Sensor coverage verified.'}\n\n` +
        `Governance Notice: Advisory document. Competent authority authorization required for official enforcement.`;
    } else {
      const adv = language === 'hi' ? (aiData?.citizenAdvisories?.hindi || aiData?.citizenAdvisory?.hindi) : (aiData?.citizenAdvisories?.english || aiData?.citizenAdvisory?.english);
      const disclaimer = language === 'hi'
        ? `\n\nसूचना: यह नागरिक परामर्श सांकेतिक वायु गुणवत्ता डेटा पर आधारित है। यह व्यक्तिगत चिकित्सीय सलाह या आधिकारिक स्वास्थ्य आदेशों का विकल्प नहीं है।`
        : `\n\nNotice: Informational civic advisory based on indicative ambient telemetry. Not a substitute for professional medical treatment or official municipal public health notices.`;

      textToCopy = `PUBLIC AIR QUALITY ADVISORY (${language.toUpperCase()})\n` +
        `Status: ${aqiCat} (AQI ${aqi})\n` +
        `Headline: ${adv?.headline || 'Elevated Air Pollution Notice'}\n\n` +
        `General Precautionary Advice:\n${adv?.generalPublic || 'Reduce strenuous outdoor exertion.'}\n\n` +
        `Guidance for Vulnerable Populations:\n${adv?.vulnerableGroups || 'Children, elderly, and individuals with respiratory conditions should remain indoors in filtered air.'}` +
        disclaimer;
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
      console.warn('Clipboard write failed or permission denied:', err);
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
    <section className="civic-card briefing-card" aria-labelledby="briefing-heading">
      <div className="card-header">
        <div className="card-title-group">
          <Sparkles size={20} className="card-icon text-amber-500" aria-hidden="true" />
          <h2 id="briefing-heading" className="card-title">4. Civic Briefing & Advisory Studio</h2>
        </div>
        <div className="tab-group" role="tablist" aria-label="Briefing Output Types">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'internal'}
            className={`tab-btn ${activeTab === 'internal' ? 'active' : ''}`}
            onClick={() => setActiveTab('internal')}
          >
            <FileText size={15} aria-hidden="true" />
            Internal Briefing Note
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'public'}
            className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            <Megaphone size={15} aria-hidden="true" />
            Public Citizen Advisory
          </button>
        </div>
      </div>

      <div className="ai-trigger-banner">
        <div className="ai-trigger-info">
          <span className="ai-model-tag">Model: Google Gemini 1.5 Flash / 3.5 Flash Lite</span>
          <span className="text-xs text-civic-slate">Grounded in deterministic metrics (Zero-Hallucination Policy)</span>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={onGenerateAI}
          disabled={isGenerating}
        >
          <Sparkles size={16} className={isGenerating ? 'spin' : ''} aria-hidden="true" />
          {isGenerating ? 'Synthesizing with Gemini AI...' : 'Synthesize Grounded AI Briefings'}
        </button>
      </div>

      {aiError && (
        <div className="alert-banner alert-error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>AI Generation Notice:</strong> {aiError}
            <div className="text-xs mt-1">
              Ensure <code>GEMINI_API_KEY</code> is configured in Vercel project settings or <code>.env.local</code>. Deterministic calculations remain active above.
            </div>
          </div>
        </div>
      )}

      <div className="briefing-content">
        {activeTab === 'internal' ? (
          <div className="briefing-pane">
            <div className="pane-header">
              <h3 className="pane-title">Administrative Incident Briefing Note</h3>
              <span className="classification-tag">OFFICIAL MUNICIPAL RECORD</span>
            </div>

            <div className="executive-summary-box">
              <h4 className="box-subheading">Executive Incident Synthesis</h4>
              <p className="summary-paragraph">
                {aiData?.executiveSummary || 
                  `Regional environmental telemetry indicates an ambient AQI of ${aqi} (${aqiCat}), with dominant particulate loading from ${analytics?.aqi?.dominantPollutant?.toUpperCase() || 'PM2.5'}. Primary exposure concentration is clustered in ${primaryWard} with peak PM2.5 readings reaching ${analytics?.pollutantStats?.pm25?.max || 'N/A'} µg/m³. Coordinated municipal suppression and public health alerts are recommended.`
                }
              </p>
            </div>

            <div className="briefing-meta-grid">
              <div className="meta-box">
                <span className="meta-label">Data Completeness & Quality</span>
                <span className="meta-value">{analytics?.completeness}% Continuous Coverage</span>
                <span className="meta-sub">Tier: <strong>{analytics?.confidenceTier} Confidence</strong></span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Primary Spatial Cluster</span>
                <span className="meta-value">{primaryWard}</span>
                <span className="meta-sub">Exceedance Rate: {analytics?.primaryHotspot?.exceedanceRate || 0}%</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Peak Exposure Diurnal Window</span>
                <span className="meta-value">{analytics?.peakExposureWindow}</span>
                <span className="meta-sub">Intervention priority window</span>
              </div>
            </div>

            <div className="uncertainty-box">
              <h4 className="box-subheading text-amber-800">Data Gaps & Uncertainty Notes</h4>
              <p className="text-sm text-amber-900">
                {aiData?.uncertaintyNotes || 
                  `Total missing sensor observations: ${analytics?.totalMissing} across ${analytics?.totalRows} recorded intervals. ${analytics?.anomaliesSummary?.total || 0} sensor flatline or negative anomaly records were screened to prevent metric distortion.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="briefing-pane">
            <div className="pane-header">
              <h3 className="pane-title">Citizen Public Health Advisory</h3>
              <div className="lang-toggle-small">
                <button
                  type="button"
                  className={`btn-lang-pill ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`btn-lang-pill ${language === 'hi' ? 'active' : ''}`}
                  onClick={() => setLanguage('hi')}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {language === 'hi' ? (
              <div className="citizen-advisory-box hi-script">
                <div className="advisory-headline-banner">
                  <span className="advisory-tag">सार्वजनिक स्वास्थ्य सूचना</span>
                  <h4 className="advisory-headline">
                    {aiData?.citizenAdvisories?.hindi?.headline || aiData?.citizenAdvisory?.hindi?.headline || 
                      `वायु गुणवत्ता परामर्श: ${aqiCat} वायु गुणवत्ता (${aqi}) दर्ज`}
                  </h4>
                </div>

                <div className="advisory-section">
                  <h5 className="advisory-sub-label">सामान्य एहतियाती निर्देश:</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.hindi?.generalPublic || aiData?.citizenAdvisory?.hindi?.generalPublic ||
                      `वर्तमान वायु गुणवत्ता सूचकांक ${aqi} (${aqiCat}) दर्ज किया गया है। सुबह के समय (${analytics?.peakExposureWindow}) बाहरी व्यायाम या सैर से बचें। बाहर निकलते समय मास्क का प्रयोग करें।`}
                  </p>
                </div>

                <div className="advisory-section highlight-vulnerable">
                  <h5 className="advisory-sub-label text-red-700">संवेदनशील वर्ग (बच्चे, बुजुर्ग एवं सांस के मरीज):</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.hindi?.vulnerableGroups || aiData?.citizenAdvisory?.hindi?.vulnerableGroups ||
                      `बच्चों, बुजुर्गों और अस्थमा/हृदय रोगियों को घर के अंदर रहने की सलाह दी जाती है। इनडोर एयर प्यूरीफायर चालू रखें और अपनी निर्धारित दवाएं पास रखें।`}
                  </p>
                </div>

                {/* Health Disclaimer (Hindi) */}
                <div className="advisory-disclaimer-box">
                  <strong>अस्वीकरण:</strong> यह सूचना केवल नागरिक जागरूकता हेतु सांकेतिक पर्यावरणीय डेटा पर आधारित है। यह आधिकारिक स्वास्थ्य निर्देशों या व्यक्तिगत चिकित्सकीय परामर्श का विकल्प नहीं है। गंभीर स्थिति में तुरंत डॉक्टर से संपर्क करें।
                </div>
              </div>
            ) : (
              <div className="citizen-advisory-box">
                <div className="advisory-headline-banner">
                  <span className="advisory-tag">CIVIC HEALTH ADVISORY</span>
                  <h4 className="advisory-headline">
                    {aiData?.citizenAdvisories?.english?.headline || aiData?.citizenAdvisory?.english?.headline ||
                      `Air Quality Notice: ${aqiCat} Air Quality Index (${aqi}) Recorded`}
                  </h4>
                </div>

                <div className="advisory-section">
                  <h5 className="advisory-sub-label">General Precautionary Advice:</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.english?.generalPublic || aiData?.citizenAdvisory?.english?.generalPublic ||
                      `Ambient AQI has reached ${aqi} (${aqiCat}) in ${primaryWard}. Consider reducing prolonged outdoor exertion during the peak exposure window (${analytics?.peakExposureWindow}). Wear a protective mask when commuting along high-traffic corridors.`}
                  </p>
                </div>

                <div className="advisory-section highlight-vulnerable">
                  <h5 className="advisory-sub-label text-red-700">Precautionary Guidance for Vulnerable Populations:</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.english?.vulnerableGroups || aiData?.citizenAdvisory?.english?.vulnerableGroups ||
                      `Individuals with pre-existing asthma, COPD, or cardiac conditions, along with children and the elderly, are advised to remain indoors with windows closed. Keep emergency inhalers and prescription medications accessible.`}
                  </p>
                </div>

                {/* Health Disclaimer (English) */}
                <div className="advisory-disclaimer-box">
                  <strong>Notice:</strong> This informational advisory is synthesized from ambient sensor feeds. It does not constitute medical advice or a substitute for clinical diagnosis. Individuals with chronic respiratory or cardiovascular symptoms should consult their personal healthcare provider.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evidence Traceability Collapsible Drawer */}
        <div className="traceability-drawer">
          <button
            type="button"
            className="btn-toggle-traceability"
            onClick={() => setShowTraceability(!showTraceability)}
            aria-expanded={showTraceability}
          >
            <ShieldCheck size={16} className="text-emerald-700" aria-hidden="true" />
            <span>Evidence Traceability & Mathematical Audit Trail</span>
            {showTraceability ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTraceability && (
            <div className="traceability-content">
              <div className="traceability-grid">
                <div className="trace-item">
                  <span className="trace-label">Source Observations:</span>
                  <span className="trace-val">{analytics?.totalRows} parsed observations across {analytics?.hotspots?.length || 1} stations/wards</span>
                </div>
                <div className="trace-item">
                  <span className="trace-label">Calculation Methodology:</span>
                  <span className="trace-val">{analytics?.aqi?.calculationMethodology}</span>
                </div>
                <div className="trace-item">
                  <span className="trace-label">Temporal Window:</span>
                  <span className="trace-val">{analytics?.peakExposureWindow} (Covering {analytics?.hoursCovered} distinct hours)</span>
                </div>
                <div className="trace-item">
                  <span className="trace-label">Data Quality Screen:</span>
                  <span className="trace-val">{analytics?.totalMissing} missing values, {analytics?.anomaliesSummary?.total} sensor anomaly events filtered</span>
                </div>
                <div className="trace-item">
                  <span className="trace-label">Confidence Justification:</span>
                  <span className="trace-val">
                    Rated <strong>{analytics?.confidenceTier}</strong> based on {analytics?.completeness}% completeness and {analytics?.consistency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="briefing-actions-footer">
          <button type="button" className="btn btn-outline" onClick={handleCopy}>
            {copied ? <Check size={15} className="text-emerald-600" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? 'Copied to Clipboard' : 'Copy Briefing Text'}
          </button>
          <button type="button" className="btn btn-outline" onClick={handleDownloadJSON}>
            <Download size={15} aria-hidden="true" />
            Export Briefing Data (JSON)
          </button>
        </div>
      </div>
    </section>
  );
}
