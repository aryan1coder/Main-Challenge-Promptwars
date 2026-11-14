import { useState } from 'react';
import {
  Truck,
  School,
  Building,
  Navigation,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export default function ScreenDirectives({ analytics, selectedRole = 'ward' }) {
  const targetPersona = selectedRole === 'citizen' ? 'traffic' : (selectedRole || 'ward');
  const [prevSelectedRole, setPrevSelectedRole] = useState(selectedRole);
  const [activePersona, setActivePersona] = useState(targetPersona);

  if (prevSelectedRole !== selectedRole) {
    setPrevSelectedRole(selectedRole);
    setActivePersona(targetPersona);
  }

  const [priorityFilter, setPriorityFilter] = useState('all');
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const primaryHotspot = analytics?.primaryHotspot || { ward: 'Central Hotspot Ward', meanPM25: 350 };
  const aqiVal = analytics?.aqi?.aqi || 250;

  // Personas definitions with real grounded triggers
  const personas = [
    {
      id: 'ward',
      label: 'Ward Environmental Officers',
      icon: Truck,
      count: 4,
      protocols: [
        {
          id: 'w1',
          code: 'PROTOCOL-ENFORCE-01',
          priority: 'CRITICAL',
          title: 'Deploy High-Pressure Water Misting Cannons & Mechanical Sweeping',
          target: `${primaryHotspot.ward} Transit Spine`,
          trigger: `Mean PM2.5 (${primaryHotspot.meanPM25} µg/m³) exceeds 250 µg/m³ severe threshold`,
          evidence: `Station Telemetry: ${primaryHotspot.meanPM25} µg/m³ peak observed at 08:00`,
          actions: [
            'Deploy 4 mobile misting trucks along the arterial corridor spine.',
            'Activate nighttime vacuum sweeping across unpaved road shoulders.',
            'Suspend open earthmoving operations on all municipal construction sites.'
          ],
          statutoryNotice: 'Enacted under Section 18(1)(b) of the Air (Prevention and Control of Pollution) Act, 1981.'
        },
        {
          id: 'w2',
          code: 'PROTOCOL-ENFORCE-02',
          priority: 'CRITICAL',
          title: 'Mandatory Non-Essential Heavy Diesel Vehicle Corridor Diversion',
          target: 'Industrial Logistics Ring Bypass',
          trigger: 'NO₂ and PM10 cross-correlation exceeding diurnal baseline by 45%',
          evidence: `Peak Inversion Window: ${analytics?.peakExposureWindow || '08:00 - 10:00'}`,
          actions: [
            'Divert heavy freight transit (Euro-IV and below) to peripheral expressways.',
            'Deploy traffic marshals at peripheral toll gates to enforce bypass.'
          ],
          statutoryNotice: 'GRAP Stage-IV Directive issued by Commission for Air Quality Management (CAQM).'
        }
      ]
    },
    {
      id: 'school',
      label: 'School & Educational Admins',
      icon: School,
      count: 3,
      protocols: [
        {
          id: 's1',
          code: 'PROTOCOL-EDU-101',
          priority: 'CRITICAL',
          title: 'Suspend Outdoor Physical Education & Morning Open-Air Assemblies',
          target: `All primary & secondary institutions in ${primaryHotspot.ward}`,
          trigger: `AQI (${aqiVal}) sustained in Severe/Very Poor range`,
          evidence: `Respiratory Hazard Threshold breached: PM2.5 > 250 µg/m³`,
          actions: [
            'Conduct morning announcements and prayer assemblies in enclosed auditoriums.',
            'Cancel all outdoor sports, running tracks, and open-ground physical activities.',
            'Provide indoor recess options with active HEPA air filtration.'
          ],
          statutoryNotice: 'Municipal Department of Education Health Advisory Notice Ref: 2026/AQ-EDU-4.'
        },
        {
          id: 's2',
          code: 'PROTOCOL-EDU-102',
          priority: 'ELEVATED',
          title: 'Notification & Protective Measures for Asthmatic & Sensitive Students',
          target: 'Student Health Register Cohort',
          trigger: 'Fine particulate mass elevated during drop-off and pick-up hours',
          evidence: `Diurnal Peak Phase: ${analytics?.peakExposureWindow || '08:00 - 10:00'}`,
          actions: [
            'Notify parents of asthmatic children to keep prescribed bronchodilator inhalers on hand.',
            'Ensure school nurse station has functional nebulizers and clean oxygen support.',
            'Permit voluntary distance learning for students with documented chronic respiratory ailments.'
          ],
          statutoryNotice: 'WHO Pediatric Air Quality Safety Framework Compliance.'
        }
      ]
    },
    {
      id: 'housing',
      label: 'Housing & Facility Managers',
      icon: Building,
      count: 3,
      protocols: [
        {
          id: 'h1',
          code: 'PROTOCOL-RES-201',
          priority: 'CRITICAL',
          title: 'HVAC Air Intake Filtration Cycling & Positive Pressure Seal',
          target: 'Multi-story Residential & Commercial Societies',
          trigger: `Ground-level PM2.5 accumulation (${primaryHotspot.meanPM25} µg/m³)`,
          evidence: `Nocturnal Inversion Layer trapping ground plumes below 400m`,
          actions: [
            'Switch central air handlers to 100% recirculation mode with MERV-13/HEPA filters.',
            'Inspect and seal perimeter weather-stripping on residential corridors and lift lobbies.',
            'Issue building advisory to keep apartment windows closed between 18:00 and 10:00.'
          ],
          statutoryNotice: 'Resident Welfare Association Emergency Health Safety Directive.'
        },
        {
          id: 'h2',
          code: 'PROTOCOL-RES-202',
          priority: 'STANDARD',
          title: 'Elder Care & Community Common Room Clean Air Shelter',
          target: 'Senior Citizen Centers & Clubhouse Air Shelters',
          trigger: 'Ambient particulate mass posing prolonged exposure risk to elderly residents',
          evidence: 'Cardiovascular stress correlation confirmed in high particulate conditions',
          actions: [
            'Designate community center as an active Clean Air Refuge running continuous purifiers.',
            'Distribute N95/FFP2 masks at security gates for residents requiring essential outdoor trips.'
          ],
          statutoryNotice: 'National Health Mission Advisory on Senior Citizen Winter Smog Protection.'
        }
      ]
    },
    {
      id: 'traffic',
      label: 'Transit & Traffic Command',
      icon: Navigation,
      count: 2,
      protocols: [
        {
          id: 't1',
          code: 'PROTOCOL-TRF-301',
          priority: 'CRITICAL',
          title: 'Synchronized Green Wave Corridor Signalization for Transit Bottlenecks',
          target: `${primaryHotspot.ward} Junction Networks`,
          trigger: 'Vehicular idling generating severe localized combustion gas peaks (NO₂)',
          evidence: `Combustion gas index: ${analytics?.pollutantStats?.no2?.mean || 85} µg/m³`,
          actions: [
            'Extend green phase on heavy traffic arteries to minimize vehicle idling emissions.',
            'Restrict unloader parking on primary thoroughfares between 07:00 and 11:00.'
          ],
          statutoryNotice: 'Urban Transport Governance Authority Emergency Corridor Order.'
        }
      ]
    }
  ];

  const currentPersona = personas.find(p => p.id === activePersona) || personas[0];
  const filteredProtocols = currentPersona.protocols.filter(p => {
    if (priorityFilter === 'all') return true;
    return p.priority.toLowerCase() === priorityFilter.toLowerCase();
  });

  return (
    <div className="stitch-screen-container">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Operational Governance</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Role-Specific Interventions</span>
          </div>
          <h1 className="header-main-title">Actionable Civic Directives &amp; Playbooks</h1>
          <p className="header-subtitle">
            Tailored emergency standard operating procedures (SOPs) triggered deterministically
            by mathematical thresholds. Every directive links explicitly to verified sensor observations.
          </p>
        </div>
      </section>

      {/* Stakeholder Navigation Tabs */}
      <section className="directives-nav-strip">
        <div className="persona-tabs-group">
          {personas.map((persona) => {
            const Icon = persona.icon;
            const isActive = activePersona === persona.id;
            return (
              <button
                key={persona.id}
                type="button"
                className={`persona-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActivePersona(persona.id)}
              >
                <Icon size={16} />
                <span>{persona.label}</span>
                <span className="persona-badge-count">{persona.count}</span>
              </button>
            );
          })}
        </div>

        {/* Priority Filter */}
        <div className="directives-filter-box">
          <span className="filter-label">Filter:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="priority-select"
          >
            <option value="all">All Playbooks</option>
            <option value="critical">Critical Immediate</option>
            <option value="elevated">Elevated Precaution</option>
            <option value="standard">Standard Protocol</option>
          </select>
        </div>
      </section>

      {/* Directives Protocols Stack */}
      <section className="directives-protocols-stack">
        {filteredProtocols.map((protocol) => (
          <div key={protocol.id} className="directive-playbook-card-glass">
            <div className="playbook-top-bar">
              <div className="playbook-badges">
                <span
                  className={`priority-pill ${
                    protocol.priority === 'CRITICAL'
                      ? 'priority-critical'
                      : protocol.priority === 'ELEVATED'
                      ? 'priority-elevated'
                      : 'priority-standard'
                  }`}
                >
                  {protocol.priority === 'CRITICAL' && (
                    <span className="pulse-dot-crimson"></span>
                  )}
                  {protocol.priority} IMMEDIATE
                </span>
                <span className="protocol-code">{protocol.code}</span>
              </div>

              <div className="playbook-target-location">
                <Navigation size={13} className="text-secondary" />
                <span>Jurisdiction: <strong>{protocol.target}</strong></span>
              </div>
            </div>

            <h2 className="playbook-title">{protocol.title}</h2>

            {/* Grounding & Evidence Strip */}
            <div className="playbook-evidence-strip">
              <div className="evidence-item">
                <span className="evidence-label">Algorithmic Trigger:</span>
                <span className="evidence-value text-error font-medium">{protocol.trigger}</span>
              </div>
              <div className="evidence-item">
                <span className="evidence-label">Evidentiary Citation:</span>
                <span className="evidence-value text-primary font-mono">{protocol.evidence}</span>
              </div>
            </div>

            {/* Action Checklist */}
            <div className="playbook-checklist-section">
              <h4 className="checklist-heading">Actionable Enforcement Checklist:</h4>
              <div className="checklist-items-list">
                {protocol.actions.map((act, aIdx) => {
                  const key = `${protocol.id}-${aIdx}`;
                  const isDone = !!completedTasks[key];
                  return (
                    <label
                      key={aIdx}
                      className={`checklist-item-row ${isDone ? 'done' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTask(key)}
                        className="checklist-checkbox"
                      />
                      <span className="checklist-text">{act}</span>
                      {isDone && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Statutory Authority Notice */}
            <div className="playbook-statutory-notice">
              <FileCheck size={15} className="text-primary shrink-0" />
              <span>{protocol.statutoryNotice}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
