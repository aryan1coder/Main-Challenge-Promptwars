import { Wind, Globe, Activity } from 'lucide-react';

export default function Header({ language, setLanguage, status, confidenceTier }) {
  return (
    <header className="civic-header" role="banner">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <Wind size={26} className="brand-icon" aria-hidden="true" />
        </div>
        <div>
          <h1 className="brand-title">Civic Air Quality Briefing Studio</h1>
          <p className="brand-subtitle">Municipal Environmental Intelligence & Role-Tailored Interventions</p>
        </div>
      </div>

      <div className="header-controls">
        {confidenceTier && (
          <div className={`confidence-pill confidence-${confidenceTier.toLowerCase()}`} title="Data Completeness & Reliability Tier">
            <Activity size={14} aria-hidden="true" />
            <span>Data Confidence: <strong>{confidenceTier}</strong></span>
          </div>
        )}

        <div className="status-indicator" role="status" aria-live="polite">
          <span className={`status-dot status-${status.type}`}></span>
          <span className="status-label">{status.message}</span>
        </div>

        <div className="lang-switcher">
          <Globe size={16} aria-hidden="true" />
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
