import { useState } from 'react';
import { ShieldAlert, Building2, School, CheckSquare, FileCheck2 } from 'lucide-react';

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

  // Deterministic rule-based baseline fallback (calibrated strictly by AQI)
  const fallbackDirectives = {
    ward: {
      title: 'Ward Municipal Enforcement Officer',
      priority: aqi > 300 ? 'CRITICAL EMERGENCY' : aqi > 200 ? 'HIGH ENFORCEMENT' : 'ROUTINE MONITORING',
      actions: aqi > 300 ? [
        `Deploy anti-smog mist guns along main transit arteries in ${primaryWard}`,
        `Halt non-essential construction and demolition activities in high-exceedance corridors`,
        `Mandate mechanical sweeping and water sprinkling along unpaved road shoulders`,
        `Reroute heavy commercial diesel transport away from sensitive residential sectors`
      ] : [
        `Routine dust suppression along major commercial corridors in ${primaryWard}`,
        `Verify emission compliance of local diesel backup generators`,
        `Inspect localized waste burning hotspots`
      ],
      directive: aqi > 300 
        ? `Invoke Graded Response Action Plan (GRAP Stage IV). Issue immediate work-suspension notices to active construction sites in ${primaryWard}.`
        : `Enforce municipal dust control bylaws. Maintain continuous surveillance on road sweeping schedules.`,
      evidence: `Triggered by Mean PM2.5 of ${meanVal} µg/m³ and Peak concentration of ${peakVal} µg/m³ recorded in ${primaryWard}.`
    },
    housing: {
      title: 'Housing Society & Facility Manager',
      priority: aqi > 300 ? 'HIGH HAZARD' : aqi > 200 ? 'ELEVATED' : 'STANDARD',
      actions: aqi > 200 ? [
        `Seal fresh-air ventilation dampers during peak morning hours (${analytics.peakExposureWindow})`,
        `Inspect and replace central HVAC filters with MERV-13 or HEPA standard media`,
        `Issue circular advising vulnerable residents (seniors, asthmatics) to remain indoors`,
        `Suspend outdoor maintenance, landscaping, and leaf-blowing operations`
      ] : [
        `Schedule outdoor recreation outside of peak morning pollution windows`,
        `Maintain HVAC air filtration at standard efficiency`,
        `Keep common area windows closed during early morning hours`
      ],
      directive: aqi > 200
        ? `Enforce indoor air quality protection protocols across residential towers. Operate indoor air purifiers in community halls and gyms.`
        : `Standard residential ventilation schedule. Inform residents of current air quality status.`,
      evidence: `Calibrated for diurnal peak window of ${analytics.peakExposureWindow} with ambient AQI ${aqi} (${aqiCat}).`
    },
    school: {
      title: 'School Administrator & Principal',
      priority: aqi > 300 ? 'CRITICAL - HEALTH EMERGENCY' : aqi > 200 ? 'HIGH RESTRICTION' : 'NORMAL SCHEDULE',
      actions: aqi > 250 ? [
        `Cancel all outdoor morning assemblies and physical education classes immediately`,
        `Confine all student athletic and recreational activities to enclosed, air-filtered spaces`,
        `Mandate N95 or well-fitting protective masks for students during commute hours`,
        `Alert school nurse and first-aid staff for proactive respiratory symptom monitoring`
      ] : [
        `Limit strenuous outdoor sports for students with diagnosed asthma or respiratory history`,
        `Conduct morning assembly in shaded or sheltered areas`,
        `Provide hydration and regular indoor rest intervals`
      ],
      directive: aqi > 250
        ? `Adopt emergency student protection protocols. Suspend outdoor exposure until ambient PM2.5 falls below 120 µg/m³.`
        : `Standard operational protocol with precautionary advisories for sensitive student groups.`,
      evidence: `Mandated by Ambient PM2.5 exceeding ${meanVal} µg/m³ during school operating hours.`
    }
  };

  const currentRoleData = aiData ? {
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
  }[activeRole] : fallbackDirectives[activeRole];

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
              {aiData ? '✨ Synthesized via Google Gemini 1.5 Flash' : '⚙️ Calibrated by Deterministic Exposure Formula'}
            </span>
          </div>
          <span className={`priority-badge priority-${currentRoleData.priority.toLowerCase().includes('critical') ? 'critical' : 'high'}`}>
            Priority: {currentRoleData.priority}
          </span>
        </div>

        <div className="action-checklist-box">
          <h4 className="checklist-heading">
            <CheckSquare size={16} className="text-civic-blue" aria-hidden="true" />
            Prescribed Intervention Protocols:
          </h4>
          <ul className="action-list">
            {currentRoleData.actions.map((act, i) => (
              <li key={i} className="action-item">
                <span className="action-check">✔</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="directive-quote-box">
          <h4 className="directive-label">Administrative Mandate / Directive:</h4>
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
