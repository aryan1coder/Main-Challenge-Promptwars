import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  TrendingUp,
  Flame,
  ShieldAlert,
  Sparkles,
  History,
  Info,
  ChevronLeft,
  ChevronRight,
  Wind,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({
  activeSection,
  setActiveSection,
  isCollapsed,
  setIsCollapsed,
  totalObservations = 0,
  confidenceTier = 'HIGH'
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    { id: 'ingestion', label: 'Data Ingestion', icon: Database },
    { id: 'analytics', label: 'Analytics & Trends', icon: TrendingUp },
    { id: 'hotspots', label: 'Spatial Hotspots', icon: Flame },
    { id: 'directives', label: 'Operational Directives', icon: ShieldAlert },
    { id: 'briefings', label: 'AI Briefing Workspace', icon: Sparkles },
    { id: 'history', label: 'Historical Archive', icon: History },
    { id: 'standards', label: 'CPCB Standards', icon: Info }
  ];

  const handleNavClick = (id) => {
    setActiveSection(id);
    setMobileOpen(false);

    // Smooth scroll to the target element if on page
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Mobile Toggle Button */}
      <button
        type="button"
        className="mobile-nav-toggle-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Navigation Menu"
        aria-expanded={mobileOpen}
      >
        <Wind size={18} />
        <span>Menu</span>
      </button>

      {/* Sidebar Container */}
      <aside
        className={`civic-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Primary Platform Navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-badge-container">
            <div className="brand-icon-box">
              <Wind size={20} className="text-civic-blue-light" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="brand-text-block">
                <span className="brand-core-title">CIVIC AIR</span>
                <span className="brand-core-subtitle">Command Center</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Live Operational Status Capsule */}
        {!isCollapsed && (
          <div className="sidebar-status-capsule">
            <div className="status-live-pulse">
              <span className="pulse-dot"></span>
              <span className="pulse-label">Telemetry Live</span>
            </div>
            <div className="status-sub-metric">
              <span>{totalObservations} observations</span>
              <span className={`capsule-tier-tag tier-${confidenceTier.toLowerCase()}`}>
                {confidenceTier}
              </span>
            </div>
          </div>
        )}

        {/* Primary Navigation Links */}
        <nav className="sidebar-nav-list" role="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} className="nav-icon" aria-hidden="true" />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {!isCollapsed && isActive && <span className="nav-active-pill" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Regulatory & Engine Specs */}
        {!isCollapsed && (
          <div className="sidebar-footer-specs">
            <div className="specs-row">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>CPCB NAAQS 2026 Engine</span>
            </div>
            <div className="specs-subtext">
              Deterministic Math + Gemini 1.5 Flash
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
