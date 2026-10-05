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
  const [drawnGeometry, setDrawnGeometry] = useState(null)
  const [locationTarget, setLocationTarget] = useState(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [activeJobId, setActiveJobId] = useState(null)
  const [completedJob, setCompletedJob] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [maxCloudCover, setMaxCloudCover] = useState(20)

  const handleSearchSelect = useCallback((place) => {
    setLocationTarget({
      lat: Number(place.lat),
      lon: Number(place.lon),
      key: Date.now(),
    })
    setLocationLabel(place.display_name)
  }, [])

  const handleBoundsChange = useCallback((bounds, geometry) => {
    setSelectedBounds(bounds)
    if (geometry) setDrawnGeometry(geometry)
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

    const geometry = drawnGeometry || {
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
      const payload = {
        geometry,
        startDate,
        endDate,
        maxCloudCover
      }
      const job = await createEnhancementJob(payload)
      setActiveJobId(job.jobId)
    } catch (err) {
      setErrorMsg(`Failed to start enhancement: ${err.message}`)
      setView('dashboard')
    }
  }

  const handleProcessingDone = useCallback((job) => {
    setCompletedJob(job)
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
    setDrawnGeometry(null)
    setSelectMode(false)
    setView('dashboard')
  }

  if (view === 'loading') {
    return (
      <LoadingScreen
        jobId={activeJobId}
        onDone={handleProcessingDone}
        onError={handleProcessingError}
      />
    )
  }

  if (view === 'results') {
    return (
      <ResultScreen
        jobData={completedJob}
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
        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(239, 68, 68, 0.92)', color: '#ffffff', padding: '8px 18px', borderRadius: '999px', fontSize: '0.82rem', backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {errorMsg}
        </div>
      )}
      <ControlPanel
        selectMode={selectMode}
        selectedBounds={formatBounds(selectedBounds)}
        locationLabel={locationLabel}
        startDate={startDate}
        endDate={endDate}
        maxCloudCover={maxCloudCover}
        onStartDateChange={(e) => setStartDate(e.target.value)}
        onEndDateChange={(e) => setEndDate(e.target.value)}
        onMaxCloudCoverChange={(e) => setMaxCloudCover(Number(e.target.value))}
        onSearchSelect={handleSearchSelect}
        onToggleSelectMode={() => setSelectMode((v) => !v)}
        onEnhance={handleEnhance}
        onClearSelection={() => {
          setSelectedBounds(null)
          setDrawnGeometry(null)
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
  )
}
