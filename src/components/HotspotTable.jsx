import { Flame, AlertTriangle } from 'lucide-react';

export default function HotspotTable({ hotspots, anomalies }) {
  if (!hotspots || hotspots.length === 0) return null;

  return (
    <div className="hotspots-container">
      <div className="civic-card">
        <div className="card-header-simple">
          <div className="flex-row items-center gap-2">
            <Flame size={18} className="text-amber-600" aria-hidden="true" />
            <h3 className="card-subtitle">Spatial Hotspots & Ward Exposure Ranking</h3>
          </div>
          <span className="text-xs text-civic-slate">Ranked by Mean PM2.5</span>
        </div>

        <div className="table-responsive">
          <table className="civic-table" aria-label="Wards ranked by pollution exposure">
            <thead>
              <tr>
                <th scope="col">Ward / Monitoring Station</th>
                <th scope="col">Mean PM2.5</th>
                <th scope="col">Peak Reading</th>
                <th scope="col">Total Observations</th>
                <th scope="col">Severe Exceedances (&gt;120 µg/m³)</th>
                <th scope="col">Exposure Risk</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((h, i) => {
                const isHighRisk = h.meanPM25 > 250;
                const isModRisk = h.meanPM25 > 120;
                const riskLabel = isHighRisk ? 'Critical Emergency' : isModRisk ? 'High Exceedance' : 'Standard Exposure';
                const badgeClass = isHighRisk ? 'badge-critical' : isModRisk ? 'badge-warning' : 'badge-neutral';

                return (
                  <tr key={h.ward || i} className={i === 0 ? 'row-hotspot-top' : ''}>
                    <td className="font-semibold">
                      {i === 0 && <span className="hotspot-star" title="Highest Exposure Ward">★ </span>}
                      {h.ward}
                    </td>
                    <td><strong>{h.meanPM25 ?? 'N/A'}</strong> µg/m³</td>
                    <td>{h.maxPM25 ?? 'N/A'} µg/m³</td>
                    <td>{h.readingsCount}</td>
                    <td>
                      <span className={h.severeExceedances > 0 ? 'text-red-700 font-bold' : ''}>
                        {h.severeExceedances} ({h.exceedanceRate}%)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{riskLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {anomalies && anomalies.length > 0 && (
          <div className="anomaly-box" role="region" aria-label="Sensor Quality and Anomaly Log">
            <div className="anomaly-box-title">
              <AlertTriangle size={15} className="text-amber-600" aria-hidden="true" />
              <span>Sensor Quality & Anomaly Screening Log ({anomalies.length} Flagged Events)</span>
            </div>
            <ul className="anomaly-list">
              {anomalies.slice(0, 5).map((a, idx) => (
                <li key={idx} className="anomaly-item">
                  <span className="anomaly-type-tag">[{a.type}]</span> {a.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
