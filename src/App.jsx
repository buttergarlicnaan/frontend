import { useCallback, useState } from 'react'
import Header from './components/Header.jsx'
import MapView from './components/MapView.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'

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
  }, [])

  const handleDrawFinish = useCallback(() => {
    setSelectMode(false)
  }, [])

  const handleEnhance = () => {
    if (!selectedBounds) return
    setView('loading')
  }

  const handleProcessingDone = useCallback(() => {
    setView('results')
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
    return <LoadingScreen onDone={handleProcessingDone} />
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
