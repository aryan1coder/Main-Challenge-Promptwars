import {
  Truck,
  School,
  Building,
  Globe,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function WorkspaceSelection({
  currentUser,
  onSelectWorkspace,
  onSignOut
}) {
  const workspaces = [
    {
      id: 'ward',
      title: 'Ward Environmental Officer',
      subtitle: 'Municipal Enforcement & Operations',
      icon: Truck,
      color: '#10b981', // Emerald
      badge: 'Statutory Authority',
      targetScreen: 'directives',
      overviewHeading: 'Enforcement & Suppression',
      description:
        'Frontline municipal control over high-pressure misting cannons, mechanical vacuum sweepers, construction earthwork halts, and heavy freight traffic bypass.',
      protocols: [
        'Deploy 4 mobile misting trucks on arterial corridors',
        'Nighttime vacuum sweeping on unpaved shoulders',
        'Section 18(1)(b) Air Act dust enforcement',
        'Divert Euro-IV diesel freight to peripheral expressways'
      ],
      defaultSection: 'directives'
    },
    {
      id: 'school',
      title: 'School & Educational Administrator',
      subtitle: 'Pediatric Health & Campus Safety',
      icon: School,
      color: '#ffb95f', // Amber / Gold
      badge: 'Vulnerable Cohort',
      targetScreen: 'directives',
      overviewHeading: 'Academic Protocol Calibrator',
      description:
        'Targeted pupil protection: suspension of morning outdoor assemblies, indoor physical education transitions, student asthma registers, and classroom HEPA air safety.',
      protocols: [
        'Suspend outdoor sports and open-ground assemblies',
        'Classroom HEPA air purifier cycling during inversions',
        'Direct notifications for asthmatic pupil registry',
        'Optional distance learning provisions during Severe air'
      ],
      defaultSection: 'directives'
    },
    {
      id: 'housing',
      title: 'Housing Society & Facility Manager',
      subtitle: 'Residential HVAC & Micro-Climate',
      icon: Building,
      color: '#4cd7f6', // Cyan
      badge: 'Community Infrastructure',
      targetScreen: 'directives',
      overviewHeading: 'Residential Air Handler Control',
      description:
        'Multi-story residential tower protection: positive-pressure HVAC filtration schedules, senior citizen clean-air refuges, perimeter window curfews, and N95 distribution.',
      protocols: [
        'Switch central air handlers to 100% recirculation mode',
        'Designate community center as Senior Clean Air Refuge',
        'Seal perimeter door and window sweeps against ground plumes',
        'Distribute certified N95 masks at facility entry gates'
      ],
      defaultSection: 'directives'
    },
    {
      id: 'citizen',
      title: 'Public Citizen & Community Health',
      subtitle: 'Bilingual Civic Advisories',
      icon: Globe,
      color: '#a855f7', // Purple
      badge: 'Civic Transparency',
      targetScreen: 'ai-briefing',
      overviewHeading: 'Multilingual Public Health Notice',
      description:
        'Plain-language civic intelligence: accessible bilingual health warnings (English / हिन्दी), simplified color-coded risk scales, and evidence-grounded citizen precautions.',
      protocols: [
        'Bilingual executive summaries and citizen warnings',
        'Color-coded CPCB health impact guidance',
        'Vulnerable elder & toddler outdoor activity limits',
        'Real-time station sensor telemetry transparency'
      ],
      defaultSection: 'ai-briefing'
    }
  ];

  const handleSelect = (workspace) => {
    if (typeof onSelectWorkspace === 'function') {
      onSelectWorkspace(workspace.id, workspace.defaultSection);
    }
  };

  const handleLaunchButtonClick = (workspace, event) => {
    event.stopPropagation();
    handleSelect(workspace);
  };

  return (
    <div className="workspace-hub-page-shell">
      {/* Background ambient lighting */}
      <div className="hub-ambient-glow" />

      <div className="workspace-hub-content-container">
        {/* Hub Header */}
        <div className="workspace-hub-header">
          <div className="hub-meta-badge">
            <span className="pulse-indicator-emerald"></span>
            <span className="hub-badge-text">CIVIC COMMAND ACCESS // JURISDICTION SELECTION</span>
          </div>

          <h1 className="hub-headline">
            Select Your <span className="text-gradient-cyan">Operational Workspace</span>
          </h1>
          <p className="hub-subtext">
            Calibrate telemetry views, statutory enforcement protocols, and AI briefing syntheses
            specifically tailored to your administrative authority.
          </p>

          {/* User Session Bar */}
          <div className="hub-session-card">
            <div className="session-user-info">
              <span className="session-status-dot"></span>
              <span className="session-label">Active Session:</span>
              <strong className="session-user-name">
                {currentUser?.name || 'Evaluator / Commissioner'}
              </strong>
              <span className="session-email-tag">({currentUser?.email || 'demo.session@civicair.gov.in'})</span>
              {currentUser?.isDemo && (
                <span className="demo-mode-pill">
                  <Sparkles size={12} />
                  <span>Interactive Demo Mode</span>
                </span>
              )}
            </div>

            <button
              type="button"
              className="hub-sign-out-btn"
              onClick={onSignOut}
              title="Return to Login Screen"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>

        {/* 4 Role Cards Grid */}
        <div className="workspace-roles-grid">
          {workspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <div
                key={ws.id}
                className="workspace-role-card"
                onClick={() => handleSelect(ws)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelect(ws);
                  }
                }}
              >
                <div className="role-card-top">
                  <div
                    className="role-icon-box"
                    style={{ borderColor: `${ws.color}44`, backgroundColor: `${ws.color}15` }}
                  >
                    <Icon size={24} style={{ color: ws.color }} />
                  </div>
                  <span
                    className="role-badge"
                    style={{ color: ws.color, borderColor: `${ws.color}33`, backgroundColor: `${ws.color}10` }}
                  >
                    {ws.badge}
                  </span>
                </div>

                <div className="role-card-titles">
                  <h3 className="role-title">{ws.title}</h3>
                  <span className="role-subtitle">{ws.subtitle}</span>
                </div>

                <p className="role-description">{ws.description}</p>

                {/* Key Jurisdictional Actions */}
                <div className="role-protocols-preview">
                  <span className="protocols-label">Targeted Interventions:</span>
                  <ul className="protocols-list">
                    {ws.protocols.map((proto, idx) => (
                      <li key={idx} className="protocol-item">
                        <CheckCircle2 size={13} style={{ color: ws.color }} className="shrink-0" />
                        <span>{proto}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Launch Action */}
                <div className="role-launch-action">
                  <button
                    type="button"
                    className="btn-launch-role-workspace"
                    style={{ '--hover-color': ws.color }}
                    onClick={(event) => handleLaunchButtonClick(ws, event)}
                  >
                    <span>Launch {ws.title.split(' ')[0]} Workspace</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Universal View Option */}
        <div className="hub-footer-navigation">
          <button
            type="button"
            className="btn-universal-overview"
            onClick={() => {
              if (typeof onSelectWorkspace === 'function') {
                onSelectWorkspace('universal', 'overview');
              }
            }}
          >
            <span>Or enter Central Executive Command Overview (All Jurisdictions)</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
