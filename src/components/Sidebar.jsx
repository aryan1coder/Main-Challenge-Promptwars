import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  TrendingUp,
  MapPin,
  Flame,
  ShieldAlert,
  Sparkles,
  History,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Wind
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navModules = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, tag: '01' },
    { id: 'data-ingestion', label: 'Data Ingestion', icon: UploadCloud, tag: '02' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, tag: '03' },
    { id: 'map-intelligence', label: 'Map Intelligence', icon: MapPin, tag: '04' },
    { id: 'hotspots', label: 'Hotspots', icon: Flame, tag: '05' },
    { id: 'directives', label: 'Directives', icon: ShieldAlert, tag: '06' },
    { id: 'ai-briefing', label: 'AI Briefing', icon: Sparkles, tag: '07' },
    { id: 'history', label: 'History', icon: History, tag: '08' },
    { id: 'standards', label: 'CPCB Standards', icon: BookOpen, tag: 'REG' }
  ];

  const handleNavClick = (id) => {
    setActiveSection(id);
    setMobileOpen(false);
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

      {/* Stitch Aetheris OS Sidebar */}
      <aside
        className={`civic-sidebar-stitch ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Platform Navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-cluster">
            <div className="brand-pulse-logo">
              <Wind size={22} className="text-primary" />
            </div>
            {!isCollapsed && (
              <div className="brand-title-group">
                <span className="brand-name">CIVIC AIR</span>
                <span className="brand-subline">Urban Intelligence OS</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Modules */}
        <div className="sidebar-nav-scroll">
          <div className="nav-group-header">
            {!isCollapsed && <span>Operational Modules</span>}
          </div>

          <nav className="sidebar-nav-items">
            {navModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-module-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} className="nav-icon shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-tag font-mono">{item.tag}</span>
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Status Footer */}
        {!isCollapsed && (
          <div className="sidebar-footer-telemetry">
            <div className="telemetry-box-glass">
              <div className="telemetry-status-row">
                <span className="telemetry-ping"></span>
                <span className="telemetry-text">Sensor Net v4.2</span>
                <span className="telemetry-badge-secure">SECURE</span>
              </div>
              <div className="telemetry-metrics-line">
                <span>{totalObservations} Staged Records</span>
                <span className="confidence-pill">{confidenceTier}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
