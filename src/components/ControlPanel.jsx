import { useState } from 'react'
import SearchBar from './SearchBar.jsx'

export default function ControlPanel({
  selectMode,
  selectedBounds,
  locationLabel,
  startDate,
  endDate,
  maxCloudCover,
  onStartDateChange,
  onEndDateChange,
  onMaxCloudCoverChange,
  onSearchSelect,
  onToggleSelectMode,
  onEnhance,
  onClearSelection,
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <button
        type="button"
        className="island-collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand Panel" : "Collapse Panel"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
        </svg>
        <span>{collapsed ? "Controls" : "Hide"}</span>
      </button>

      <aside className={`floating-island ${collapsed ? 'collapsed' : ''}`}>
        <div className="island-content">
          {/* Search Section */}
          <div className="island-section">
            <span className="section-label">Location</span>
            <SearchBar onSelect={onSearchSelect} />
            {locationLabel && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {locationLabel}
              </div>
            )}
          </div>

          {/* Area of Interest Selection */}
          <div className="island-section">
            <span className="section-label">Area of Interest (AOI)</span>
            <div className="segmented-pill-container">
              <button
                type="button"
                className={`segmented-pill-btn ${!selectMode ? 'active' : ''}`}
                onClick={() => selectMode && onToggleSelectMode()}
              >
                Pan Map
              </button>
              <button
                type="button"
                className={`segmented-pill-btn ${selectMode ? 'active' : ''}`}
                onClick={() => !selectMode && onToggleSelectMode()}
              >
                Draw Polygon
              </button>
            </div>
          </div>

          {/* Selected Bounds Telemetry */}
          {selectedBounds && (
            <div className="island-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="section-label">Coordinates Telemetry</span>
                <button
                  type="button"
                  onClick={onClearSelection}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                >
                  Clear
                </button>
              </div>
              <div className="telemetry-card">
                <div className="coord-grid">
                  <div className="coord-cell">
                    <span>NORTH LAT</span>
                    {selectedBounds.north}°
                  </div>
                  <div className="coord-cell">
                    <span>SOUTH LAT</span>
                    {selectedBounds.south}°
                  </div>
                  <div className="coord-cell">
                    <span>EAST LON</span>
                    {selectedBounds.east}°
                  </div>
                  <div className="coord-cell">
                    <span>WEST LON</span>
                    {selectedBounds.west}°
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acquisition Parameters */}
          <div className="island-section">
            <span className="section-label">Acquisition Criteria</span>
            <div className="input-row">
              <div className="input-cell">
                <label>START DATE</label>
                <input type="date" value={startDate} onChange={onStartDateChange} />
              </div>
              <div className="input-cell">
                <label>END DATE</label>
                <input type="date" value={endDate} onChange={onEndDateChange} />
              </div>
            </div>

            <div className="slider-row" style={{ marginTop: '6px' }}>
              <div className="slider-header">
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.74rem' }}>MAX CLOUD COVER</span>
                <span className="val">{maxCloudCover}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={maxCloudCover}
                onChange={onMaxCloudCoverChange}
                className="minimal-slider"
              />
            </div>
          </div>

          {/* Enhance CTA */}
          <button
            type="button"
            className="btn-sapphire"
            onClick={onEnhance}
            disabled={!selectedBounds}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Enhance Resolution (1.5m)</span>
          </button>
        </div>
      </aside>
    </>
  )
}
