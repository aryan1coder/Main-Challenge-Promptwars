import { Globe, Activity, Layers } from 'lucide-react';

export default function Header({
  language,
  setLanguage,
  status,
  confidenceTier,
  datasetTitle = 'Regional Air Quality Assessment'
}) {
  return (
    <header className="civic-top-header" role="banner">
      <div className="header-left-group">
        <div className="workspace-title-capsule">
          <Layers size={16} className="text-civic-blue" aria-hidden="true" />
          <span className="workspace-label">Incident Session:</span>
          <strong className="workspace-name">{datasetTitle}</strong>
        </div>
      </div>

      <div className="header-right-group">
        {/* Data Confidence Indicator */}
        {confidenceTier && (
          <div
            className={`top-confidence-badge tier-${confidenceTier.toLowerCase()}`}
            title="Data Completeness & Reliability Tier per CPCB Rigor Rules"
          >
            <Activity size={14} aria-hidden="true" />
            <span>Fidelity: <strong>{confidenceTier}</strong></span>
          </div>
        )}

        {/* Operational Status Dot */}
        <div className="top-status-indicator" role="status" aria-live="polite">
          <span className={`status-dot status-${status.type}`}></span>
          <span className="status-label">{status.message}</span>
        </div>

        {/* Bilingual Switcher */}
        <div className="top-lang-switcher" role="group" aria-label="Advisory Language">
          <Globe size={15} className="text-civic-slate" aria-hidden="true" />
          <button
            type="button"
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            aria-label="Switch language to English"
          >
            EN
          </button>
          <span className="lang-divider">|</span>
          <button
            type="button"
            className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => setLanguage('hi')}
            aria-label="Switch language to Hindi"
          >
            हिंदी
          </button>
        </div>
      </div>
    </header>
  );
}
