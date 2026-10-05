import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

export default function MapView({
  selectMode,
  selectedBounds,
  locationTarget,
  onBoundsChange,
  onDrawFinish,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const drawRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: ESRI_SATELLITE_STYLE,
      center: [78.9629, 20.5937], // India default center
      zoom: 4.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false
    })

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#2563eb',
            'fill-opacity': 0.22
          }
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#ffffff',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        },
        {
          id: 'gl-draw-polygon-fill-static',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
          paint: {
            'fill-color': '#2563eb',
            'fill-opacity': 0.18
          }
        },
        {
          id: 'gl-draw-polygon-stroke-static',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff'
          }
        }
      ]
    })

    map.addControl(draw)
    mapRef.current = map
    drawRef.current = draw

    const updateGeometry = () => {
      const data = draw.getAll()
      if (data.features.length > 0) {
        const feature = data.features[data.features.length - 1]
        const coords = feature.geometry.coordinates[0]
        if (coords && coords.length > 0) {
          const lats = coords.map((c) => c[1])
          const lons = coords.map((c) => c[0])
          const bounds = {
            getNorth: () => Math.max(...lats),
            getSouth: () => Math.min(...lats),
            getEast: () => Math.max(...lons),
            getWest: () => Math.min(...lons),
          }
          onBoundsChange(bounds, feature.geometry)
        }
      }
    }

    map.on('draw.create', (e) => {
      updateGeometry()
      onDrawFinish?.()
    })
    map.on('draw.update', updateGeometry)
    map.on('draw.delete', () => onBoundsChange(null, null))

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle selectMode toggle
  useEffect(() => {
    if (!drawRef.current) return
    if (selectMode) {
      drawRef.current.deleteAll()
      drawRef.current.changeMode('draw_polygon')
    } else {
      drawRef.current.changeMode('simple_select')
    }
  }, [selectMode])

  // Fly to searched location
  useEffect(() => {
    if (!mapRef.current || !locationTarget) return
    mapRef.current.flyTo({
      center: [locationTarget.lon, locationTarget.lat],
      zoom: 12,
      speed: 1.6,
      curve: 1.4
    })
  }, [locationTarget])

  return (
    <div className="map-fullbleed">
      <div ref={mapContainerRef} className="maplibre-canvas" />
    </div>
  )
}
