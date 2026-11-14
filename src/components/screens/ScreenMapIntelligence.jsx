import MapIntelligence from '../MapIntelligence';

export default function ScreenMapIntelligence({ analytics, onDataParsed }) {
  return (
    <div className="stitch-screen-container map-intelligence-screen">
      {/* Header Bar */}
      <section className="screen-header-bar">
        <div className="header-meta-group">
          <div className="header-breadcrumbs">
            <span className="pulse-indicator-emerald"></span>
            <span className="breadcrumb-root">Atmospheric GIS</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Spatial Hotspot Intelligence</span>
          </div>
          <h1 className="header-main-title">Interactive Geospatial Command Map</h1>
          <p className="header-subtitle">
            Dark vector GIS projection powered by <strong>OpenFreeMap &amp; MapLibre GL JS</strong>.
            Plots authentic monitoring station coordinates with live CPCB severity classification.
          </p>
        </div>
      </section>

      {/* Embedded Map Intelligence Workspace */}
      <div className="map-embed-wrapper">
        <MapIntelligence
          analytics={analytics}
          onDataParsed={onDataParsed}
        />
      </div>
    </div>
  );
}
