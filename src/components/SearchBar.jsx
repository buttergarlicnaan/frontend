import { useEffect, useState, useRef } from 'react'

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      setError('')
      return undefined
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError('')
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Search failed')
        }
        const data = await response.json()
        setResults(data)
        setIsOpen(true)
      } catch {
        setError('Location search unavailable')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (place) => {
    setQuery(place.display_name.split(',')[0])
    setIsOpen(false)
    setResults([])
    onSelect(place)
  }

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          value={query}
          placeholder="Search city, coordinates, or region..."
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isLoading && (
          <span style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>...</span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((place) => (
            <button
              key={place.place_id}
              type="button"
              className="search-item"
              onClick={() => handleSelect(place)}
            >
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{place.display_name.split(',')[0]}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {place.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
