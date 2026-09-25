import { useEffect, useState } from 'react'

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
        setError('Could not search right now. Try again.')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (place) => {
    setQuery(place.display_name)
    setIsOpen(false)
    setResults([])
    onSelect(place)
  }

  return (
    <div className="search-bar">
      <label htmlFor="location-search">Search location</label>
      <input
        id="location-search"
        type="text"
        value={query}
        placeholder="City, landmark, or region"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />
      {isLoading && <p className="search-status">Searching…</p>}
      {error && <p className="search-status error">{error}</p>}
      {isOpen && results.length > 0 && (
        <ul className="search-results">
          {results.map((place) => (
            <li key={`${place.place_id}`}>
              <button type="button" onClick={() => handleSelect(place)}>
                {place.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
