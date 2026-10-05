export default function HistoryPanel({ isOpen, onClose, onViewResult }) {
  const history = (() => {
    try { return JSON.parse(localStorage.getItem('geoenhance-history') || '[]') }
    catch { return [] }
  })()

  const formatDate = (iso) => {
    if (!iso) return '-'
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    } catch { return iso }
  }

  const handleClearAll = () => {
    localStorage.removeItem('geoenhance-history')
    window.location.reload()
  }

  return (
    <>
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px', zIndex: 201,
        background: 'rgba(13,16,26,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(32px)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Enhancement History</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {history.length > 0 && (
              <button type="button" onClick={handleClearAll} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.7)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}>
                Clear All
              </button>
            )}
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ padding: '10px 20px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {history.length} SAVED SESSION{history.length !== 1 ? 'S' : ''}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px 20px' }}>
          {history.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '14px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>No sessions yet</div>
                <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>Complete an enhancement to see it recorded here.</div>
              </div>
            </div>
          ) : (
            [...history].reverse().map((entry, i) => (
              <div key={entry.jobId || i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.locationLabel || 'Unknown Location'}
                </div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                  {formatDate(entry.savedAt)}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {entry.bounds && (
                    <span style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', borderRadius: '5px', padding: '2px 7px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                      {Number(entry.bounds.north).toFixed(3)}N, {Number(entry.bounds.east).toFixed(3)}E
                    </span>
                  )}
                  {entry.frameCount && (
                    <span style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', borderRadius: '5px', padding: '2px 7px', fontSize: '0.68rem' }}>
                      {entry.frameCount} frames
                    </span>
                  )}
                  <span style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', borderRadius: '5px', padding: '2px 7px', fontSize: '0.68rem' }}>
                    Completed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewResult(entry)}
                  style={{ width: '100%', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.4)', color: '#60a5fa', borderRadius: '8px', padding: '7px 12px', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  View Results
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
