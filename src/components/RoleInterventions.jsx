import { useState } from 'react';
import { ShieldAlert, Building2, School, CheckSquare, FileCheck2, AlertCircle } from 'lucide-react';

export default function RoleInterventions({ aiBriefing, analytics }) {
  const [activeRole, setActiveRole] = useState('ward'); // 'ward' | 'housing' | 'school'

  if (!analytics) return null;

  const aqi = analytics.aqi?.aqi || 0;
  const aqiCat = analytics.aqi?.category || 'Moderate';
  const primaryWard = analytics.primaryHotspot?.ward || 'Target Municipal Ward';
  const peakVal = analytics.pollutantStats?.pm25?.max || 250;
  const meanVal = analytics.pollutantStats?.pm25?.mean || 140;

  // AI-generated data if available
  const aiData = aiBriefing?.data;
  const isAIGenerated = !!aiData;

  // Deterministic rule-based baseline fallback (calibrated strictly by AQI)
  const fallbackDirectives = {
    ward: {
      title: 'Ward Municipal Enforcement Officer',
      priority: aqi > 300 ? 'SUGGESTED ESCALATION - HIGH' : aqi > 200 ? 'ELEVATED SURVEILLANCE' : 'ROUTINE MONITORING',
      actions: aqi > 300 ? [
        `Consider deploying anti-smog mist guns along main transit corridors in ${primaryWard}`,
        `Recommend temporary construction dust control inspections and sweeping intensifying`,
        `Mandate water sprinkling along unpaved road shoulders and transit crossings`,
        `Evaluate heavy commercial diesel transport diversions in coordination with traffic police`
      ] : [
        `Routine dust suppression along major commercial corridors in ${primaryWard}`,
        `Verify emission compliance of local commercial diesel generators`,
        `Maintain localized waste burning surveillance in open sectors`
      ],
      directive: aqi > 300 
        ? `Suggested Graded Response Action Plan (GRAP Stage IV) Escalation Consideration. Requires formal competent-authority verification prior to issuing statutory work-suspension orders.`
        : `Enforce standard municipal dust control bylaws. Maintain routine mechanical sweeping schedules.`,
      evidence: `Triggered by Mean PM2.5 of ${meanVal} µg/m³ and Peak concentration of ${peakVal} µg/m³ recorded in ${primaryWard}.`
    },
    housing: {
      title: 'Housing Society & Facility Manager',
      priority: aqi > 300 ? 'HIGH EXPOSURE ADVISORY' : aqi > 200 ? 'ELEVATED PRECAUTION' : 'STANDARD SCHEDULE',
      actions: aqi > 200 ? [
        `Seal fresh-air ventilation dampers during peak diurnal window (${analytics.peakExposureWindow})`,
        `Inspect and service central HVAC filters (recommend MERV-13 media where supported)`,
        `Issue resident circular advising vulnerable groups (seniors, asthmatics) to minimize outdoor exposure`,
        `Suspend outdoor leaf-blowing and motorized landscaping during morning peak hours`
      ] : [
        `Schedule outdoor recreation outside of peak morning pollution windows`,
        `Maintain HVAC air filtration at standard building efficiency`,
        `Keep common area windows closed during early morning hours`
      ],
      directive: aqi > 200
        ? `Advisory facility guidance: operate indoor filtration units in community halls and common areas. Inform residents of current air quality status.`
        : `Standard residential ventilation schedule. Maintain general environmental awareness.`,
      evidence: `Calibrated for diurnal peak window of ${analytics.peakExposureWindow} with ambient AQI ${aqi} (${aqiCat}).`
    },
    school: {
      title: 'School Administrator & Principal',
      priority: aqi > 300 ? 'URGENT HEALTH ADVISORY' : aqi > 200 ? 'ACTIVITY RESTRICTION' : 'NORMAL SCHEDULE',
      actions: aqi > 250 ? [
        `Consider shifting outdoor morning assembly and physical education classes indoors`,
        `Restrict strenuous outdoor sports and athletic exertion for all students`,
        `Advise well-fitting protective masks for students during commute intervals`,
        `Alert school nursing staff for proactive observation of students with respiratory history`
      ] : [
        `Permit voluntary indoor alternative for students with diagnosed asthma`,
        `Conduct morning assembly in shaded or sheltered areas`,
        `Provide adequate hydration and regular indoor rest intervals`
      ],
      directive: aqi > 250
        ? `Precautionary student welfare guidance: limit outdoor exertion while ambient PM2.5 exceeds 120 µg/m³. Decisions subject to local education board directives.`
        : `Standard operational protocol with precautionary advisories for sensitive student groups.`,
      evidence: `Triggered by Ambient PM2.5 exceeding ${meanVal} µg/m³ during school operating hours.`
    }
  };

  const roleMap = aiData ? {
    ward: {
      title: 'Ward Municipal Enforcement Officer',
      priority: aiData.wardOfficer?.priority || fallbackDirectives.ward.priority,
      actions: aiData.wardOfficer?.actions || fallbackDirectives.ward.actions,
      directive: aiData.wardOfficer?.enforcementDirectives || fallbackDirectives.ward.directive,
      evidence: aiData.wardOfficer?.evidenceMetric || fallbackDirectives.ward.evidence
    },
    housing: {
      title: 'Housing Society & Facility Manager',
      priority: aiData.housingSociety?.priority || fallbackDirectives.housing.priority,
      actions: aiData.housingSociety?.actions || fallbackDirectives.housing.actions,
      directive: aiData.housingSociety?.residentAdvisory || fallbackDirectives.housing.directive,
      evidence: aiData.housingSociety?.evidenceMetric || fallbackDirectives.housing.evidence
    },
    school: {
      title: 'School Administrator & Principal',
      priority: aiData.schoolAdmin?.priority || fallbackDirectives.school.priority,
      actions: aiData.schoolAdmin?.actions || fallbackDirectives.school.actions,
      directive: aiData.schoolAdmin?.activityRestrictions || fallbackDirectives.school.directive,
      evidence: aiData.schoolAdmin?.evidenceMetric || fallbackDirectives.school.evidence
    }
  } : null;

  const currentRoleData = (roleMap && roleMap[activeRole]) || fallbackDirectives[activeRole] || fallbackDirectives.ward;

  return (
    <section className="civic-card interventions-card" aria-labelledby="roles-heading">
      <div className="card-header">
        <div className="card-title-group">
          <ShieldAlert size={20} className="card-icon text-civic-blue" aria-hidden="true" />
          <h2 id="roles-heading" className="card-title">3. Role-Tailored Operational Directives</h2>
        </div>
        <div className="role-tabs" role="tablist" aria-label="Stakeholder Personas">
          <button
            type="button"
            role="tab"
            aria-selected={activeRole === 'ward'}
            className={`role-tab-btn ${activeRole === 'ward' ? 'active' : ''}`}
            onClick={() => setActiveRole('ward')}
          >
            <ShieldAlert size={16} aria-hidden="true" />
            Ward Officer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRole === 'housing'}
            className={`role-tab-btn ${activeRole === 'housing' ? 'active' : ''}`}
            onClick={() => setActiveRole('housing')}
          >
            <Building2 size={16} aria-hidden="true" />
            Housing Society
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRole === 'school'}
            className={`role-tab-btn ${activeRole === 'school' ? 'active' : ''}`}
            onClick={() => setActiveRole('school')}
          >
            <School size={16} aria-hidden="true" />
            School Principal
          </button>
        </div>
      </div>

      <div className="role-content-body">
        <div className="role-top-banner">
          <div>
            <h3 className="role-heading">{currentRoleData.title}</h3>
            <span className="role-source-tag">
              {isAIGenerated ? '✨ AI-Generated Advisory Consideration (Grounded Synthesis)' : '⚙️ Deterministic Threshold Trigger (CPCB Breakpoint Rule)'}
            </span>
          </div>
          <span className={`priority-badge priority-${String(currentRoleData?.priority || '').toLowerCase().includes('critical') || String(currentRoleData?.priority || '').toLowerCase().includes('escalation') ? 'critical' : 'high'}`}>
            Priority: {currentRoleData?.priority || 'STANDARD'}
          </span>
        </div>

        {/* Competent-Authority Notice */}
        <div className="competent-authority-banner">
          <AlertCircle size={14} className="text-civic-slate" aria-hidden="true" />
          <span>
            <strong>Operational Governance:</strong> Prescribed actions represent advisory decision-support considerations. Competent-authority verification is required prior to initiating official regulatory enforcement, school schedule revisions, or traffic diversions.
          </span>
        </div>

        <div className="action-checklist-box">
          <h4 className="checklist-heading">
            <CheckSquare size={16} className="text-civic-blue" aria-hidden="true" />
            Operational Checklist & Escalation Considerations:
          </h4>
          <ul className="action-list">
            {(Array.isArray(currentRoleData.actions) ? currentRoleData.actions : [currentRoleData.actions]).map((act, i) => (
              <li key={i} className="action-item">
                <span className="action-check">✔</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="directive-quote-box">
          <h4 className="directive-label">Administrative Guidance / Policy Consideration:</h4>
          <p className="directive-text">"{currentRoleData.directive}"</p>
        </div>

        <div className="evidence-citation-footer">
          <FileCheck2 size={15} className="text-emerald-700" aria-hidden="true" />
          <span className="evidence-text">
            <strong>Verifiable Grounding Metric:</strong> {currentRoleData.evidence}
          </span>
        </div>
      </div>
    </section>
  );
}
