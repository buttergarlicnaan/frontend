export default function ResultScreen({ bounds, locationLabel, onBack, onNewSelection }) {
  const handleDownload = () => {
    const lines = [
      'GeoEnhance result placeholder',
      locationLabel ? `Location: ${locationLabel}` : '',
      bounds
        ? `Bounds: N ${bounds.north}, S ${bounds.south}, E ${bounds.east}, W ${bounds.west}`
        : '',
      'Enhanced image download will be connected in a later step.',
    ].filter(Boolean)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'geoenhance-result.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="results-page">
      <header className="results-header">
        <div>
          <p className="eyebrow">Processing complete</p>
          <h1>Enhancement preview</h1>
          {locationLabel && <p className="muted">{locationLabel}</p>}
        </div>
        <div className="button-row">
          <button type="button" className="btn" onClick={onBack}>
            Back to map
          </button>
          <button type="button" className="btn btn-ghost" onClick={onNewSelection}>
            New selection
          </button>
        </div>
      </header>

      <div className="compare-grid">
        <article className="image-card">
          <h2>Original image</h2>
          <div className="image-placeholder original">
            <span>Original satellite frame</span>
          </div>
        </article>
        <article className="image-card">
          <h2>Enhanced image</h2>
          <div className="image-placeholder enhanced">
            <span>Enhanced output</span>
          </div>
        </article>
      </div>

      {bounds && (
        <p className="muted bounds-summary">
          Area: N {bounds.north} · S {bounds.south} · E {bounds.east} · W {bounds.west}
        </p>
      )}

      <button type="button" className="btn btn-primary download-btn" onClick={handleDownload}>
        Download
      </button>
    </div>
  )
}
