import { useEffect, useState } from 'react';
import {
  Building,
  CheckCircle2,
  FileCheck,
  Globe,
  School,
  Truck
} from 'lucide-react';
import { getHealthAdvisory } from '../../lib/analytics/aqiCalculator';

const PERSONAS = [
  { id: 'ward', label: 'Ward Environmental Officer', icon: Truck },
  { id: 'school', label: 'School Administrator', icon: School },
  { id: 'housing', label: 'Housing Society Manager', icon: Building },
  { id: 'citizen', label: 'Public Citizen', icon: Globe }
];

function getPersonaActions(role, analytics, aqi) {
  const hotspot = analytics?.primaryHotspot;
  const category = analytics?.aqi?.category;
  const elevated = Number.isFinite(aqi) && aqi > 100;
  const sourceReview = 'Confirm current conditions with an authorized monitoring source before taking formal action.';

  if (!Number.isFinite(aqi)) {
    return ['Upload valid observations to calculate an AQI and evidence-linked guidance.'];
  }

  switch (role) {
    case 'ward':
      return [
        hotspot
          ? `Review the station ranked highest by mean PM2.5: ${hotspot.ward} (${hotspot.meanPM25 ?? 'N/A'} µg/m³).`
          : 'Review station-level records; no spatial hotspot was identified.',
        elevated ? 'Review applicable local dust-control and monitoring procedures.' : 'Continue routine monitoring and retain the underlying observations.',
        sourceReview
      ];
    case 'school':
      return [
        elevated ? `Review outdoor activity plans against the calculated ${category} category.` : 'Continue to check current local air-quality advisories before outdoor activities.',
        'Follow school health procedures for students with respiratory conditions.',
        sourceReview
      ];
    case 'housing':
      return [
        elevated ? 'Share the calculated air-quality category with residents and review indoor filtration readiness.' : 'Share the current dataset summary with residents.',
        'Check that residents can access the current official local health advisory.',
        sourceReview
      ];
    case 'citizen':
      return [
        getHealthAdvisory(category, 'en'),
        'Children, older adults, and people with heart or lung conditions should follow local health guidance.',
        'This dataset is not a substitute for current official alerts or personal medical advice.'
      ];
    default:
      return [sourceReview];
  }
}

export default function ScreenDirectives({ analytics, selectedRole = 'ward' }) {
  const initialRole = PERSONAS.some((persona) => persona.id === selectedRole) ? selectedRole : 'ward';
  const [activePersona, setActivePersona] = useState(initialRole);
  const [reviewedTasks, setReviewedTasks] = useState({});
  useEffect(() => {
    if (PERSONAS.some((item) => item.id === selectedRole)) setActivePersona(selectedRole);
  }, [selectedRole]);
  const persona = PERSONAS.find((item) => item.id === activePersona) || PERSONAS[0];
  const Icon = persona.icon;
  const aqi = Number.isFinite(analytics?.aqi?.aqi) ? analytics.aqi.aqi : null;
  const category = analytics?.aqi?.category || 'Unavailable';
  const hotspot = analytics?.primaryHotspot;
  const confidence = analytics?.confidenceTier || 'Unavailable';
  const actions = getPersonaActions(activePersona, analytics, aqi);
  const evidence = [
    `AQI: ${aqi ?? 'N/A'} (${category})`,
    `Confidence: ${confidence}`,
    hotspot
      ? `Highest-ranked station: ${hotspot.ward}; mean PM2.5 ${hotspot.meanPM25 ?? 'N/A'} µg/m³`
      : 'Spatial hotspot: not identified'
  ];

  const toggleReviewed = (actionIndex) => {
    const key = `${activePersona}-${actionIndex}`;
    setReviewedTasks((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="stitch-screen-container">
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald" />
            <span className="breadcrumb-root">Operational Governance</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Role-Specific Guidance</span>
          </div>
          <h1 className="header-main-title">Role-Tailored Decision Support</h1>
          <p className="header-subtitle">
            Review evidence-linked considerations for each audience. These are advisory prompts, not executed tasks,
            statutory orders, or a substitute for current official guidance.
          </p>
        </div>
      </section>

      <section className="directives-nav-strip" aria-label="Select stakeholder audience">
        <div className="persona-tabs-group" role="tablist" aria-label="Stakeholder audiences">
          {PERSONAS.map((item) => {
            const PersonaIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activePersona === item.id}
                className={`persona-tab-btn ${activePersona === item.id ? 'active' : ''}`}
                onClick={() => setActivePersona(item.id)}
              >
                <PersonaIcon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="directives-protocols-stack" aria-labelledby="guidance-heading">
        <article className="directive-playbook-card-glass">
          <div className="playbook-top-bar">
            <div className="playbook-badges">
              <span className={`priority-pill ${aqi !== null && aqi > 300 ? 'priority-critical' : 'priority-standard'}`}>
                {aqi !== null && aqi > 300 ? 'HIGH-READING REVIEW' : 'ADVISORY REVIEW'}
              </span>
              <span className="protocol-code">CALCULATED AQI SCREENING</span>
            </div>
            <div className="playbook-target-location">
              <Icon size={14} className="text-secondary" aria-hidden="true" />
              <span>Audience: <strong>{persona.label}</strong></span>
            </div>
          </div>

          <h2 id="guidance-heading" className="playbook-title">{persona.label} considerations</h2>
          <div className="playbook-evidence-strip">
            <div className="evidence-item">
              <span className="evidence-label">Calculated evidence:</span>
              <span className="evidence-value text-primary font-mono">{evidence.join(' · ')}</span>
            </div>
            <div className="evidence-item">
              <span className="evidence-label">Observed peak window:</span>
              <span className="evidence-value">{analytics?.peakExposureWindow || 'Unavailable'}</span>
            </div>
          </div>

          <div className="playbook-checklist-section">
            <h3 className="checklist-heading">Review checklist (marking an item does not execute an action)</h3>
            <div className="checklist-items-list">
              {actions.map((action, index) => {
                const key = `${activePersona}-${index}`;
                return (
                  <label key={key} className={`checklist-item-row ${reviewedTasks[key] ? 'done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(reviewedTasks[key])}
                      onChange={() => toggleReviewed(index)}
                      className="checklist-checkbox"
                    />
                    <span className="checklist-text">{action}</span>
                    {reviewedTasks[key] && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="playbook-statutory-notice" role="note">
            <FileCheck size={15} className="text-primary shrink-0" aria-hidden="true" />
            <span>
              AQI qualification: {analytics?.aqi?.coverageNote || 'No calculated AQI qualification is available.'}
              {' '}Historical association does not establish cause or intervention effectiveness.
            </span>
          </div>
        </article>
      </section>
    </div>
  );
}
