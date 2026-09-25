import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import RectangleDrawer from './RectangleDrawer.jsx'

function FlyToLocation({ location }) {
  const map = useMap()

  useEffect(() => {
    if (!location) return
    map.flyTo([location.lat, location.lon], 12, { duration: 1.2 })
  }, [location, map])

  return null
}

export default function MapView({
  selectMode,
  selectedBounds,
  locationTarget,
  onBoundsChange,
  onDrawFinish,
}) {
  return (
    <div className="map-wrap">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        minZoom={2}
        worldCopyJump
        className="map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToLocation location={locationTarget} />
        <RectangleDrawer
          active={selectMode}
          onChange={onBoundsChange}
          onFinish={onDrawFinish}
        />
        {!selectMode && selectedBounds && (
          <Rectangle
            bounds={selectedBounds}
            pathOptions={{ color: '#22d3ee', weight: 2, fillOpacity: 0.18 }}
          />
        )}
      </MapContainer>
    </div>
  )
}
