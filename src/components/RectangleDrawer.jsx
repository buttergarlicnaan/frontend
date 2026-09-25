import { useEffect, useRef, useState } from 'react'
import { Rectangle, useMap } from 'react-leaflet'
import L from 'leaflet'

export default function RectangleDrawer({ active, onChange, onFinish }) {
  const map = useMap()
  const drawingRef = useRef(false)
  const startRef = useRef(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!active) {
      map.dragging.enable()
      map.boxZoom.enable()
      map.getContainer().style.cursor = ''
      drawingRef.current = false
      startRef.current = null
      setPreview(null)
      return undefined
    }

    map.dragging.disable()
    map.boxZoom.disable()
    map.getContainer().style.cursor = 'crosshair'

    const handleDown = (event) => {
      drawingRef.current = true
      startRef.current = event.latlng
      setPreview(L.latLngBounds(event.latlng, event.latlng))
      L.DomEvent.preventDefault(event.originalEvent)
    }

    const handleMove = (event) => {
      if (!drawingRef.current || !startRef.current) return
      setPreview(L.latLngBounds(startRef.current, event.latlng))
    }

    const finishDraw = (latlng) => {
      if (!drawingRef.current || !startRef.current) return
      drawingRef.current = false
      const bounds = L.latLngBounds(startRef.current, latlng)
      startRef.current = null
      setPreview(null)

      const tooSmall = bounds.getNorth() === bounds.getSouth() || bounds.getEast() === bounds.getWest()
      if (tooSmall) return

      onChange(bounds)
      onFinish()
    }

    const handleUp = (event) => {
      finishDraw(event.latlng)
    }

    const handleDocUp = (event) => {
      if (!drawingRef.current) return
      finishDraw(map.mouseEventToLatLng(event))
    }

    map.on('mousedown', handleDown)
    map.on('mousemove', handleMove)
    map.on('mouseup', handleUp)
    document.addEventListener('mouseup', handleDocUp)

    return () => {
      map.off('mousedown', handleDown)
      map.off('mousemove', handleMove)
      map.off('mouseup', handleUp)
      document.removeEventListener('mouseup', handleDocUp)
      map.dragging.enable()
      map.boxZoom.enable()
      map.getContainer().style.cursor = ''
    }
  }, [active, map, onChange, onFinish])

  if (!preview) return null

  return (
    <Rectangle
      bounds={preview}
      pathOptions={{ color: '#22d3ee', weight: 2, dashArray: '6 4', fillOpacity: 0.12 }}
    />
  )
}
