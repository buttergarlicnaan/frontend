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
  return (
    <aside className="control-panel">
      <SearchBar onSelect={onSearchSelect} />

      {locationLabel && (
        <p className="location-label">
          <strong>Centered on:</strong> {locationLabel}
        </p>
      )}

      <div className="panel-section">
        <h2>Search Parameters</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Start Date</label>
          <input type="date" value={startDate} onChange={onStartDateChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>End Date</label>
          <input type="date" value={endDate} onChange={onEndDateChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Max Cloud Cover: {maxCloudCover}%
          </label>
          <input type="range" min="0" max="100" step="5" value={maxCloudCover} onChange={onMaxCloudCoverChange} style={{ width: '100%' }} />
        </div>
      </div>

      <div className="panel-section">
        <h2>Area selection</h2>
        <p className="hint">
          {selectMode
            ? 'Click and drag on the map to draw a rectangle.'
            : 'Choose a region on the map to enhance.'}
        </p>
        <button
          type="button"
          className={selectMode ? 'btn btn-active' : 'btn'}
          onClick={onToggleSelectMode}
        >
          {selectMode ? 'Cancel selection' : 'Select area'}
        </button>
      </div>

      {selectedBounds && (
        <div className="panel-section bounds-card">
          <h2>Selected bounds</h2>
          <ul className="bounds-list">
            <li>North: {selectedBounds.north}</li>
            <li>South: {selectedBounds.south}</li>
            <li>East: {selectedBounds.east}</li>
            <li>West: {selectedBounds.west}</li>
          </ul>
          <div className="button-row">
            <button type="button" className="btn btn-primary" onClick={onEnhance}>
              Enhance this area
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClearSelection}>
              Clear
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
