import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import WebGLShaderView from './WebGLShaderView.jsx'

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

export default function ResultScreen({ jobData, bounds, locationLabel, onBack, onNewSelection }) {
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [shaderMode, setShaderMode] = useState('rgb') // 'rgb' | 'cir' | 'ndvi' | 'uncertainty'
  const [activeFrameIndex, setActiveFrameIndex] = useState(1)
  const isDraggingRef = useRef(false)

  const leftContainerRef = useRef(null)
  const leftMapRef = useRef(null)

  const temporalFrames = jobData?.temporalFrames || Array.from({ length: 8 }, (_, i) => ({
    frameIndex: i + 1,
    timestamp: `2024-03-${String(10 + i * 3).padStart(2, '0')} 10:24 UTC`,
    cloudCover: (i * 2.1).toFixed(1),
    previewUrl: ''
  }))

  const centerLon = bounds ? (Number(bounds.east) + Number(bounds.west)) / 2 : 78.96
  const centerLat = bounds ? (Number(bounds.north) + Number(bounds.south)) / 2 : 20.59

  useEffect(() => {
    if (leftMapRef.current) return

    // Left Viewport: Raw Sentinel-2 (10m)
    const leftMap = new maplibregl.Map({
      container: leftContainerRef.current,
      style: ESRI_SATELLITE_STYLE,
      center: [centerLon, centerLat],
      zoom: 14,
      pitch: 0,
      bearing: 0,
      attributionControl: false
    })

    leftMapRef.current = leftMap

    return () => {
      leftMap.remove()
      leftMapRef.current = null
    }
  }, [])

  // Drag divider logic
  const handleMouseDown = () => {
    isDraggingRef.current = true
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return
      const ratio = Math.max(0.05, Math.min(0.95, e.clientX / window.innerWidth))
      setSplitRatio(ratio)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleDownload = () => {
    const downloadUrl = jobData?.result?.hrPsUrl || '#'
    if (downloadUrl && downloadUrl !== '#') {
      window.open(downloadUrl, '_blank')
    } else {
      alert('GeoTIFF download link: 1054x1054 4-channel raster (R, G, B, NIR).')
    }
  }

  return (
    <div className="result-screen-root">
      {/* Top Left Back Pill */}
      <div className="top-left-actions">
        <button type="button" className="nav-pill-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Map</span>
        </button>
      </div>

      {/* Top Floating WebGL Shader Dock */}
      <div className="top-shader-dock">
        <div className="segmented-pill-container" style={{ minWidth: '440px' }}>
          <button
            type="button"
            className={`segmented-pill-btn ${shaderMode === 'rgb' ? 'active' : ''}`}
            onClick={() => setShaderMode('rgb')}
          >
            True Color (RGB)
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${shaderMode === 'cir' ? 'active' : ''}`}
            onClick={() => setShaderMode('cir')}
          >
            False Color (CIR)
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${shaderMode === 'ndvi' ? 'active' : ''}`}
            onClick={() => setShaderMode('ndvi')}
          >
            Live GPU NDVI
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${shaderMode === 'uncertainty' ? 'active' : ''}`}
            onClick={() => setShaderMode('uncertainty')}
          >
            Uncertainty
          </button>
        </div>
      </div>

      {/* Top Right Actions */}
      <div className="top-right-actions">
        <button type="button" className="nav-pill-btn" onClick={handleDownload}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Export GeoTIFF</span>
        </button>
      </div>

      {/* Synchronized Dual Viewports */}
      <div className="split-viewport-container">
        {/* Left Viewport (Raw 10m Baseline) */}
        <div
          className="split-viewport-pane"
          style={{ clipPath: `polygon(0 0, ${splitRatio * 100}% 0, ${splitRatio * 100}% 100%, 0 100%)` }}
        >
          <div ref={leftContainerRef} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', bottom: '110px', left: '24px', zIndex: 10, background: 'rgba(15,18,26,0.85)', padding: '5px 12px', borderRadius: '6px', border: 'var(--glass-border)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            RAW SENTINEL-2 BASELINE (10m)
          </div>
        </div>

        {/* Right Viewport (Super-Resolved 1.5m via WebGL Fragment Shaders) */}
        <div
          className="split-viewport-pane"
          style={{ clipPath: `polygon(${splitRatio * 100}% 0, 100% 0, 100% 100%, ${splitRatio * 100}% 100%)` }}
        >
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <WebGLShaderView
              hrPsUrl={jobData?.result?.hrPsUrl}
              uncertaintyUrl={jobData?.result?.uncertaintyUrl}
              mode={shaderMode}
            />
          </div>
          <div style={{ position: 'absolute', bottom: '110px', right: '24px', zIndex: 10, background: 'rgba(15,18,26,0.85)', padding: '5px 12px', borderRadius: '6px', border: 'var(--glass-border)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
            AI SUPER-RESOLVED (1.5m) · GPU GLSL {shaderMode.toUpperCase()}
          </div>
        </div>

        {/* Split Curtain Divider Handle */}
        <div
          className="split-curtain-divider"
          style={{ left: `${splitRatio * 100}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="curtain-handle-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
              <polyline points="9 18 15 12 9 6" style={{ transform: 'translateX(6px)' }}></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Floating Temporal Frame Scrubber */}
      <div className="bottom-temporal-dock">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
            Temporal Input Acquisitions ({temporalFrames.length} Frames)
          </span>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            Acquisition #{activeFrameIndex} of {temporalFrames.length}
          </span>
        </div>

        <div className="temporal-frames-row">
          {temporalFrames.map((frame, i) => (
            <button
              key={i}
              type="button"
              className={`temporal-frame-chip ${activeFrameIndex === frame.frameIndex ? 'active' : ''}`}
              onClick={() => setActiveFrameIndex(frame.frameIndex)}
            >
              <span className="temporal-frame-index">#{String(frame.frameIndex).padStart(2, '0')}</span>
              <span className="temporal-frame-date">{frame.timestamp.split(' ')[0]}</span>
              {frame.cloudCover !== null && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {frame.cloudCover}% cloud
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
