export default function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <div>
          <h1>GeoEnhance</h1>
          <p>Satellite imagery enhancement dashboard</p>
        </div>
      </div>
      <span className="header-badge">SIH Prototype</span>
    </header>
  )
}
