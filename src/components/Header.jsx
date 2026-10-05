export default function Header({ onHistoryToggle, historyOpen }) {
  return (
    <>
      {/* Brand pill — centered at top via CSS class */}
      <div className="floating-brand-pill">
        <div className="brand-dot" aria-hidden="true" />
        <span className="brand-title">GeoEnhance</span>
        <span className="brand-tag">v2.0 SR</span>
      </div>

      {/* History button — fixed top-right corner */}
      <button
        type="button"
        id="history-toggle-btn"
        onClick={onHistoryToggle}
        title="Enhancement History"
        style={{
          position: 'fixed',
          top: '16px',
          right: '60px',
          zIndex: 50,
          display: 'flex', alignItems: 'center', gap: '6px',
          background: historyOpen ? 'rgba(37,99,235,0.25)' : 'rgba(13,16,26,0.82)',
          border: historyOpen ? '1px solid rgba(96,165,250,0.6)' : '1px solid rgba(255,255,255,0.12)',
          color: historyOpen ? '#60a5fa' : 'rgba(255,255,255,0.7)',
          borderRadius: '999px',
          padding: '7px 16px 7px 12px',
          fontSize: '0.78rem', fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(16px)',
          boxShadow: historyOpen ? '0 0 16px rgba(96,165,250,0.25)' : '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'all 0.25s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        History
      </button>
    </>
  )
}
