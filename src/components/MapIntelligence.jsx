import { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Official MapLibre GL worker configuration for Vite
if (typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl(maplibreglWorkerUrl || '/maplibre-gl-worker.mjs');
}
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Compass,
  Database
} from 'lucide-react';
import { getAQICategory } from '../lib/analytics/aqiCalculator';
import { BENCHMARK_GEOSPATIAL_DELHI } from '../lib/benchmarkData';

// OpenFreeMap Dark Vector Tile Style
const OPENFREEMAP_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';

// Local Fallback Style for offline / network firewall environments
const FALLBACK_DARK_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#080e1d' }
    }
  ]
};

// CPCB Severity Color Mapping
function getSeverityColor(category) {
  switch (category) {
    case 'Good':
      return '#10b981';
    case 'Satisfactory':
      return '#34d399';
    case 'Moderate':
      return '#ffb95f';
    case 'Poor':
      return '#f97316';
    case 'Very Poor':
      return '#a855f7';
    case 'Severe':
    default:
      return '#ef4444';
  }
}

export default function MapIntelligence({ analytics, onDataParsed }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [pollutantFilter, setPollutantFilter] = useState('pm25'); // 'pm25' | 'pm10' | 'no2'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  const hotspots = useMemo(() => analytics?.hotspots || [], [analytics]);
  const hasCoordinates = useMemo(() => {
    return hotspots.some(h => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));
  }, [hotspots]);

  // Filtered hotspots based on user controls
  const filteredHotspots = useMemo(() => {
    return hotspots.filter(h => {
      if (severityFilter === 'all') return true;
      const val = pollutantFilter === 'pm10' ? h.meanPM10 : pollutantFilter === 'no2' ? h.meanNO2 : h.meanPM25;
      if (!Number.isFinite(val)) return false;
      const cat = getAQICategory(val, pollutantFilter).category;
      return cat.toLowerCase() === severityFilter.toLowerCase();
    });
  }, [hotspots, severityFilter, pollutantFilter]);

  // Initial / selected center coordinates
  const defaultCenter = useMemo(() => {
    const valid = hotspots.filter(h => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));
    if (valid.length > 0) {
      const avgLat = valid.reduce((s, h) => s + h.latitude, 0) / valid.length;
      const avgLon = valid.reduce((s, h) => s + h.longitude, 0) / valid.length;
      return [avgLon, avgLat];
    }
    return null;
  }, [hotspots]);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || !hasCoordinates || !defaultCenter) return;

    let map = null;
    let resizeObserver = null;

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OPENFREEMAP_DARK_STYLE,
        center: defaultCenter,
        zoom: 11,
        attributionControl: false
      });

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }),
        'bottom-right'
      );

      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      map.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
        requestAnimationFrame(() => {
          if (mapRef.current) mapRef.current.resize();
        });
      });

      map.on('error', (e) => {
        const msg = e?.error?.message || e?.message || '';
        if (msg.includes('Worker') || msg.includes('Failed to fetch worker')) {
          console.error('MapLibre Critical Error:', e);
          setMapError(msg || 'Map engine failed to initialize worker.');
        } else if (msg.includes('style') || msg.includes('Failed to fetch style')) {
          console.warn('MapLibre Style Fallback activated:', e);
          try {
            map.setStyle(FALLBACK_DARK_STYLE);
          } catch {
            // ignore style error
          }
        } else {
          console.warn('MapLibre Tile Notice:', e);
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.error('MapLibre GL Initialization Error:', err);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (map) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        map.remove();
        mapRef.current = null;
      }
    };
  }, [defaultCenter, hasCoordinates]);

  // Update map markers when filteredHotspots or mapLoaded changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!hasCoordinates) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasValidPoints = false;

    filteredHotspots.forEach(hotspot => {
      if (!Number.isFinite(hotspot.latitude) || !Number.isFinite(hotspot.longitude)) return;

      hasValidPoints = true;
      bounds.extend([hotspot.longitude, hotspot.latitude]);

      const currentVal = pollutantFilter === 'pm10' ? hotspot.meanPM10 : pollutantFilter === 'no2' ? hotspot.meanNO2 : hotspot.meanPM25;
      if (!Number.isFinite(currentVal)) return;
      const aqiCat = getAQICategory(currentVal, pollutantFilter);
      const color = getSeverityColor(aqiCat.category);
      const isSevere = aqiCat.category === 'Severe' || aqiCat.category === 'Very Poor';

      // Create Custom Pin HTML Element
      const el = document.createElement('div');
      el.className = 'custom-map-marker-pin';
      el.style.cursor = 'pointer';
      el.style.position = 'relative';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      el.innerHTML = `
        ${isSevere ? `<span style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
        <div style="width: 24px; height: 24px; border-radius: 9999px; background: #0d1322; border: 2px solid ${color}; box-shadow: 0 0 12px ${color}88; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
          <span style="width: 8px; height: 8px; border-radius: 9999px; background: ${color};"></span>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedHotspot(hotspot);
        map.flyTo({
          center: [hotspot.longitude, hotspot.latitude],
          zoom: 13,
          duration: 1000
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hotspot.longitude, hotspot.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (hasValidPoints && !bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 13.5,
        duration: 800
      });
    }
  }, [filteredHotspots, mapLoaded, hasCoordinates, pollutantFilter]);

  // Controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetView = () => {
    if (!mapRef.current || !defaultCenter) return;
    mapRef.current.flyTo({
      center: defaultCenter,
      zoom: 11,
      duration: 800
    });
    setSelectedHotspot(null);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLoadGeoBenchmark = () => {
    if (typeof onDataParsed === 'function') {
      onDataParsed(BENCHMARK_GEOSPATIAL_DELHI, 'Benchmark: Delhi Geo-Tagged NCT Network');
    }
  };

  return (
    <div className={`map-intelligence-workspace ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Controls Bar */}
      <div className="map-toolbar-glass">
        <div className="map-toolbar-left">
          <div className="map-title-badge">
            <span className="pulse-indicator-emerald"></span>
            <span className="map-title-text">Atmospheric GIS Telemetry</span>
            <span className="crs-tag">EPSG:4326</span>
          </div>

          {/* Pollutant Filter */}
          <div className="map-filter-group">
            <span className="filter-label">Parameter:</span>
            <button
              type="button"
              className={`filter-pill ${pollutantFilter === 'pm25' ? 'active' : ''}`}
              onClick={() => setPollutantFilter('pm25')}
            >
              PM2.5
            </button>
            <button
              type="button"
              className={`filter-pill ${pollutantFilter === 'pm10' ? 'active' : ''}`}
              onClick={() => setPollutantFilter('pm10')}
            >
              PM10
            </button>
            <button
              type="button"
              className={`filter-pill ${pollutantFilter === 'no2' ? 'active' : ''}`}
              onClick={() => setPollutantFilter('no2')}
            >
              NO₂
            </button>
          </div>

          {/* Severity Filter */}
          <div className="map-filter-group">
            <span className="filter-label">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="severity-select"
            >
              <option value="all">All Breakpoints</option>
              <option value="good">Good (0-50)</option>
              <option value="moderate">Moderate (51-100)</option>
              <option value="poor">Poor (101-200)</option>
              <option value="very poor">Very Poor (201-300)</option>
              <option value="severe">Severe (301+)</option>
            </select>
          </div>
        </div>

        {/* Top Right Map Controls */}
        <div className="map-toolbar-right">
          <button
            type="button"
            className="map-control-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="map-control-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className="map-control-btn"
            onClick={handleResetView}
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            className="map-control-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="map-canvas-container">
        {/* MapLibre DOM Node */}
        <div ref={mapContainerRef} className="maplibre-host-node" />

        {/* Error notification if tile load fails */}
        {mapError && (
          <div className="map-error-toast">
            <AlertTriangle size={16} />
            <span>{mapError}</span>
          </div>
        )}

        {/* Fallback Banner when coordinates are unavailable in the active dataset */}
        {!hasCoordinates && (
          <div className="map-fallback-overlay-card">
            <div className="fallback-header">
              <div className="fallback-icon-box">
                <Compass size={22} className="text-tertiary" />
              </div>
              <div>
                <h3 className="fallback-title">Geospatial coordinates unavailable for this dataset.</h3>
                <p className="fallback-desc">
                  This dataset contains station observations without explicit latitude/longitude columns.
                  In accordance with the <strong>Zero-Disqualification Scientific Integrity Policy</strong>,
                  coordinates are never fabricated or simulated.
                </p>
              </div>
            </div>

            <div className="fallback-actions">
              <button
                type="button"
                className="btn-emerald-sm"
                onClick={handleLoadGeoBenchmark}
              >
                <Database size={15} />
                <span>Load Geo-Tagged NCT Benchmark</span>
              </button>
              <span className="fallback-hint">
                Or inspect ward observations in the telemetry table below.
              </span>
            </div>

            {/* Fallback Ward Telemetry Table */}
            <div className="fallback-table-wrapper">
              <table className="fallback-ward-table">
                <thead>
                  <tr>
                    <th>Ward / Station</th>
                    <th>Mean PM2.5</th>
                    <th>Max PM2.5</th>
                    <th>Exceedances (&gt;120)</th>
                    <th>CPCB Category</th>
                  </tr>
                </thead>
                <tbody>
                  {hotspots.map((h, idx) => {
                    const cat = getAQICategory(h.meanPM25 || 0, 'pm25');
                    return (
                      <tr
                        key={idx}
                        className={selectedHotspot?.ward === h.ward ? 'row-selected' : ''}
                        onClick={() => setSelectedHotspot(h)}
                      >
                        <td className="font-semibold text-on-surface">{h.ward}</td>
                        <td>{h.meanPM25 !== null ? `${h.meanPM25} µg/m³` : 'N/A'}</td>
                        <td>{h.maxPM25 !== null ? `${h.maxPM25} µg/m³` : 'N/A'}</td>
                        <td className="text-error font-mono">{h.severeExceedances}</td>
                        <td>
                          <span
                            className="status-pill-subtle"
                            style={{ color: getSeverityColor(cat.category) }}
                          >
                            {cat.category}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Station Telemetry Card (Floating Bottom-Left) */}
        {selectedHotspot && (
          <div className="selected-station-card-floating">
            <div className="station-card-header">
              <div className="station-title-group">
                <MapPin size={16} className="text-secondary" />
                <h4 className="station-name">{selectedHotspot.ward}</h4>
              </div>
              <button
                type="button"
                className="station-close-btn"
                onClick={() => setSelectedHotspot(null)}
                aria-label="Close Station Details"
              >
                ✕
              </button>
            </div>

            <div className="station-meta-strip">
              <span>
                Coordinates:{' '}
                {selectedHotspot.latitude && selectedHotspot.longitude
                  ? `${selectedHotspot.latitude.toFixed(4)}°N, ${selectedHotspot.longitude.toFixed(4)}°E`
                  : 'Coordinates Unavailable'}
              </span>
              <span>Readings: {selectedHotspot.readingsCount}</span>
            </div>

            <div className="station-metric-grid">
              <div className="station-metric-box">
                <span className="label">Mean PM2.5</span>
                <span className="value text-error">
                  {selectedHotspot.meanPM25 !== null ? `${selectedHotspot.meanPM25} µg/m³` : '—'}
                </span>
              </div>
              <div className="station-metric-box">
                <span className="label">Peak PM2.5</span>
                <span className="value text-on-surface">
                  {selectedHotspot.maxPM25 !== null ? `${selectedHotspot.maxPM25} µg/m³` : '—'}
                </span>
              </div>
              <div className="station-metric-box">
                <span className="label">Mean PM10</span>
                <span className="value text-secondary">
                  {selectedHotspot.meanPM10 !== null ? `${selectedHotspot.meanPM10} µg/m³` : '—'}
                </span>
              </div>
              <div className="station-metric-box">
                <span className="label">Severe Breaches</span>
                <span className="value text-tertiary">
                  {selectedHotspot.severeExceedances} ({selectedHotspot.exceedanceRate}%)
                </span>
              </div>
            </div>

            <div className="station-advisory-note">
              {selectedHotspot.meanPM25 > 250 ? (
                <div className="advisory-danger">
                  <Flame size={14} />
                  <span>Immediate dust-suppression & mechanical sweeping priority zone.</span>
                </div>
              ) : (
                <div className="advisory-normal">
                  <CheckCircle2 size={14} />
                  <span>Continuous ambient telemetry within monitored range.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Atmospheric Legend (Bottom-Right) */}
        <div className="map-legend-floating">
          <div className="legend-header">
            <Layers size={13} />
            <span>CPCB Severity Index</span>
          </div>
          <div className="legend-items">
            <div className="legend-row">
              <span className="legend-swatch" style={{ background: '#10b981' }}></span>
              <span>Good (0-50)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ background: '#34d399' }}></span>
              <span>Satisfactory (51-100)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ background: '#ffb95f' }}></span>
              <span>Moderate (101-200)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ background: '#f97316' }}></span>
              <span>Poor (201-300)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ background: '#a855f7' }}></span>
              <span>Very Poor (301-400)</span>
            </div>
            <div className="legend-row">
              <span className="legend-swatch" style={{ background: '#ef4444' }}></span>
              <span>Severe (401-500)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
