import { useState, useEffect } from 'react';
import {
  Globe,
  Activity,
  Layers,
  Search,
  Clock,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Header({
  language,
  setLanguage,
  status,
  confidenceTier,
  datasetTitle = 'Regional Air Quality Assessment',
  onSearch,
  selectedRole = 'ward',
  currentUser,
  onOpenWorkspace,
  onSignOut
}) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' UTC+05:30'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="civic-header-stitch" role="banner">
      {/* Left: Global Search & Active Incident Capsule */}
      <div className="header-left-cluster">
        <div className="header-search-bar">
          <Search size={15} className="text-on-surface-variant shrink-0" />
          <input
            type="text"
            placeholder="Search stations, wards, pollutants..."
            className="search-input-field"
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>

        <div className="session-title-capsule hidden xl:flex">
          <Layers size={14} className="text-primary shrink-0" />
          <span className="session-prefix">Active Telemetry:</span>
          <strong className="session-name">{datasetTitle}</strong>
        </div>
      </div>

      {/* Right: Telemetry fidelity, Live clock, Language toggle, notifications, profile */}
      <div className="header-right-cluster">
        {/* Real-time Clock */}
        <div className="header-clock-capsule hidden md:flex">
          <Clock size={13} className="text-secondary shrink-0" />
          <span className="font-mono text-xs">{timeString || '14:30:00 UTC+05:30'}</span>
        </div>

        {/* Data Fidelity / Confidence Tier */}
        {confidenceTier && (
          <div
            className={`header-confidence-pill tier-${confidenceTier.toLowerCase()}`}
            title="Statistical completeness & verification level"
          >
            <Activity size={13} />
            <span>Fidelity: <strong>{confidenceTier}</strong></span>
          </div>
        )}

        {/* Operational Status Dot */}
        <div className="header-status-indicator" role="status" aria-live="polite">
          <span className={`status-dot status-${status.type}`}></span>
          <span className="status-label">{status.message}</span>
        </div>

        {/* Bilingual Switcher */}
        <div className="header-language-toggle">
          <Globe size={14} className="text-on-surface-variant shrink-0" />
          <button
            type="button"
            className={`lang-switch-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            aria-label="Switch to English"
          >
            EN
          </button>
          <span className="lang-pipe">/</span>
          <button
            type="button"
            className={`lang-switch-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => setLanguage('hi')}
            aria-label="Switch to Hindi"
          >
            हिन्दी
          </button>
        </div>

        {/* Active Role Workspace Pill */}
        <button
          type="button"
          className="header-workspace-pill"
          onClick={onOpenWorkspace}
          title="Click to switch operational workspace role"
        >
          <span className="workspace-pill-dot"></span>
          <span className="workspace-pill-role">
            {selectedRole === 'ward'
              ? 'Ward Officer'
              : selectedRole === 'school'
              ? 'School Admin'
              : selectedRole === 'housing'
              ? 'Housing Mgr'
              : selectedRole === 'citizen'
              ? 'Citizen Advisory'
              : 'Command'}
          </span>
          <ChevronDown size={12} className="text-on-surface-variant" />
        </button>

        {/* User / Station Operator Badge */}
        <div className="operator-profile-badge hidden lg:flex">
          <div className="operator-avatar">
            <span>{currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'CA'}</span>
          </div>
          <div className="operator-details">
            <span className="operator-name">{currentUser?.name || 'Director of Environment'}</span>
            <span className="operator-role">
              {currentUser?.isDemo ? 'Evaluator Demo' : 'Central Command'}
            </span>
          </div>
        </div>

        {/* Sign Out / Switch Account */}
        <button
          type="button"
          className="header-signout-btn"
          onClick={onSignOut}
          title="Sign Out / Switch Account"
          aria-label="Sign Out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
