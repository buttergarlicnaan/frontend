import { useCallback, useState } from 'react'
import Header from './components/Header.jsx'
import MapView from './components/MapView.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import { createEnhancementJob } from './api/client.js'

function formatBounds(bounds) {
  if (!bounds) return null
  return {
    north: bounds.getNorth().toFixed(4),
    south: bounds.getSouth().toFixed(4),
    east: bounds.getEast().toFixed(4),
    west: bounds.getWest().toFixed(4),
  }
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedBounds, setSelectedBounds] = useState(null)
  const [locationTarget, setLocationTarget] = useState(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [activeJobId, setActiveJobId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSearchSelect = useCallback((place) => {
    setLocationTarget({
      lat: Number(place.lat),
      lon: Number(place.lon),
      key: Date.now(),
    })
    setLocationLabel(place.display_name)
  }, [])

  const handleBoundsChange = useCallback((bounds) => {
    setSelectedBounds(bounds)
    setErrorMsg(null)
  }, [])

  const handleDrawFinish = useCallback(() => {
    setSelectMode(false)
  }, [])

  const handleEnhance = async () => {
    if (!selectedBounds) {
      setErrorMsg('Please select an area on the map first.')
      return
    }
    
    setErrorMsg(null)

    const north = selectedBounds.getNorth()
    const south = selectedBounds.getSouth()
    const east = selectedBounds.getEast()
    const west = selectedBounds.getWest()

    const geometry = {
      type: 'Polygon',
      coordinates: [[
        [west, north],
        [west, south],
        [east, south],
        [east, north],
        [west, north]
      ]]
    }

    try {
      setView('loading')
      const job = await createEnhancementJob(geometry)
      setActiveJobId(job.jobId)
    } catch (err) {
      setErrorMsg(`Failed to start job: ${err.message}`)
      setView('dashboard')
    }
  }

  const handleProcessingDone = useCallback((result) => {
    setView('results')
    setActiveJobId(null)
  }, [])

  const handleProcessingError = useCallback((message) => {
    setErrorMsg(message)
    setView('dashboard')
    setActiveJobId(null)
  }, [])

  const handleBackToMap = () => {
    setView('dashboard')
  }

  const handleNewSelection = () => {
    setSelectedBounds(null)
    setSelectMode(false)
    setView('dashboard')
  }

  if (view === 'loading') {
    return <LoadingScreen jobId={activeJobId} onDone={handleProcessingDone} onError={handleProcessingError} />
  }

  if (view === 'results') {
    return (
      <ResultScreen
        bounds={formatBounds(selectedBounds)}
        locationLabel={locationLabel}
        onBack={handleBackToMap}
        onNewSelection={handleNewSelection}
      />
    )
  }

  return (
    <div className="app-shell">
      <Header />
      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}
      <div className="workspace">
        <ControlPanel
          selectMode={selectMode}
          selectedBounds={formatBounds(selectedBounds)}
          locationLabel={locationLabel}
          onSearchSelect={handleSearchSelect}
          onToggleSelectMode={() => setSelectMode((value) => !value)}
          onEnhance={handleEnhance}
          onClearSelection={() => {
            setSelectedBounds(null)
            setSelectMode(false)
            setErrorMsg(null)
          }}
        />
        <MapView
          selectMode={selectMode}
          selectedBounds={selectedBounds}
          locationTarget={locationTarget}
          onBoundsChange={handleBoundsChange}
          onDrawFinish={handleDrawFinish}
        />
      </div>
    </div>
  )
}
