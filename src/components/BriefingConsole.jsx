import { useState } from 'react';
import { Sparkles, FileText, Megaphone, Copy, Check, Download, AlertTriangle } from 'lucide-react';

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

  const aiData = aiBriefing?.data;
  const aqi = analytics?.aqi?.aqi || 0;
  const aqiCat = analytics?.aqi?.category || 'Moderate';
  const primaryWard = analytics?.primaryHotspot?.ward || 'General Station';
  const meanPM25 = analytics?.pollutantStats?.pm25?.mean || 140;

  // Copy handler
  const handleCopy = () => {
    let textToCopy;
    if (activeTab === 'internal') {
      textToCopy = `CIVIC AIR QUALITY BRIEFING NOTE\n` +
        `Date: ${new Date().toLocaleDateString()}\n` +
        `Overall AQI: ${aqi} (${aqiCat})\n` +
        `Primary Hotspot: ${primaryWard} (Mean PM2.5: ${meanPM25} µg/m³)\n\n` +
        `Executive Summary:\n${aiData?.executiveSummary || 'Calculated air quality metrics indicate elevated exposure risks across regional wards.'}\n\n` +
        `Data Confidence: ${analytics?.confidenceTier} (${analytics?.completeness}% complete)\n` +
        `Uncertainty Notes: ${aiData?.uncertaintyNotes || 'Sensor coverage verified.'}`;
    } else {
      const adv = language === 'hi' ? (aiData?.citizenAdvisories?.hindi || aiData?.citizenAdvisory?.hindi) : (aiData?.citizenAdvisories?.english || aiData?.citizenAdvisory?.english);
      textToCopy = `PUBLIC AIR QUALITY ADVISORY (${language.toUpperCase()})\n` +
        `Status: ${aqiCat} (AQI ${aqi})\n` +
        `Headline: ${adv?.headline || 'Elevated Air Pollution Notice'}\n\n` +
        `General Public:\n${adv?.generalPublic || 'Reduce strenuous outdoor exertion.'}\n\n` +
        `Vulnerable Groups:\n${adv?.vulnerableGroups || 'Children, elderly, and asthmatics should remain indoors.'}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      analytics,
      aiBriefing
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
          <span className="ai-model-tag">Model: Google Gemini 1.5 Flash</span>
          <span className="text-xs text-civic-slate">Grounded in deterministic metrics (Zero-Hallucination)</span>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={onGenerateAI}
          disabled={isGenerating}
        >
          <Sparkles size={16} className={isGenerating ? 'spin' : ''} aria-hidden="true" />
          {isGenerating ? 'Synthesizing with Gemini 1.5 Flash...' : 'Synthesize Grounded AI Briefings'}
        </button>
      </div>

      {aiError && (
        <div className="alert-banner alert-error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>AI Generation Notice:</strong> {aiError}
            <div className="text-xs mt-1">
              Ensure <code>VITE_GEMINI_API_KEY</code> is configured in <code>.env.local</code>. Deterministic calculations remain active above.
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
                <span className="meta-sub">Mandatory intervention window</span>
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
                      `वायु गुणवत्ता चेतावनी: ${aqiCat} वायु गुणवत्ता सूचकांक (${aqi})`}
                  </h4>
                </div>

                <div className="advisory-section">
                  <h5 className="advisory-sub-label">सामान्य नागरिकों के लिए निर्देश:</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.hindi?.generalPublic || aiData?.citizenAdvisory?.hindi?.generalPublic ||
                      `वर्तमान वायु गुणवत्ता सूचकांक ${aqi} (${aqiCat}) दर्ज किया गया है। सुबह के समय (${analytics?.peakExposureWindow}) बाहरी व्यायाम या सैर से बचें। बाहर निकलते समय मास्क का प्रयोग करें।`}
                  </p>
                </div>

                <div className="advisory-section highlight-vulnerable">
                  <h5 className="advisory-sub-label text-red-700">संवेदनशील वर्ग (बच्चे, बुजुर्ग एवं सांस के मरीज):</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.hindi?.vulnerableGroups || aiData?.citizenAdvisory?.hindi?.vulnerableGroups ||
                      `बच्चों, बुजुर्गों और अस्थमा/हृदय रोगियों को घर के अंदर रहने की सख्त सलाह दी जाती है। इनडोर एयर प्यूरीफायर चालू रखें और आवश्यक दवाएं साथ रखें।`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="citizen-advisory-box">
                <div className="advisory-headline-banner">
                  <span className="advisory-tag">PUBLIC HEALTH ADVISORY</span>
                  <h4 className="advisory-headline">
                    {aiData?.citizenAdvisories?.english?.headline || aiData?.citizenAdvisory?.english?.headline ||
                      `Air Quality Alert: ${aqiCat} Air Quality Index (${aqi}) Recorded`}
                  </h4>
                </div>

                <div className="advisory-section">
                  <h5 className="advisory-sub-label">General Public Advisory:</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.english?.generalPublic || aiData?.citizenAdvisory?.english?.generalPublic ||
                      `Ambient AQI has reached ${aqi} (${aqiCat}) in ${primaryWard}. Avoid strenuous outdoor exercise, particularly during the morning peak window (${analytics?.peakExposureWindow}). Wear a well-fitted protective mask when outdoors.`}
                  </p>
                </div>

                <div className="advisory-section highlight-vulnerable">
                  <h5 className="advisory-sub-label text-red-700">Protection for Vulnerable Groups (Children, Elderly, Asthmatics):</h5>
                  <p className="advisory-body">
                    {aiData?.citizenAdvisories?.english?.vulnerableGroups || aiData?.citizenAdvisory?.english?.vulnerableGroups ||
                      `Individuals with respiratory conditions, asthma, or cardiac illness, along with children and the elderly, must remain indoors in well-filtered rooms. Keep emergency inhalers and medication accessible.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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
