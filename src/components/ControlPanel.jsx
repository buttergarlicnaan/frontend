import SearchBar from './SearchBar.jsx'

export default function ControlPanel({
  selectMode,
  selectedBounds,
  locationLabel,
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
