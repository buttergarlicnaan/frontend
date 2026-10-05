import { useEffect, useState, useRef } from 'react'
import { getJobStatus, connectJobWebSocket } from '../api/client.js'

export default function LoadingScreen({ jobId, onDone, onError }) {
  const [logs, setLogs] = useState([
    { time: '00:00:01', text: 'Initializing GeoEnhance pipeline session...', active: false },
    { time: '00:00:02', text: 'Connecting to satellite telemetry service...', active: true },
  ])
  const [progress, setProgress] = useState(8)
  const logsEndRef = useRef(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    if (!jobId) return

    let isMounted = true
    let pollTimer = null

    const addLog = (msg, active = false) => {
      const now = new Date()
      const timeStr = now.toTimeString().split(' ')[0]
      setLogs((prev) => [...prev, { time: timeStr, text: msg, active }])
    }

    // Connect to WebSocket stream
    const disconnectWs = connectJobWebSocket(jobId, {
      onLog: (line) => {
        if (!isMounted) return
        addLog(line, true)
      },
      onProgress: (pct) => {
        if (!isMounted) return
        setProgress(pct)
      },
      onComplete: (result) => {
        if (!isMounted) return
        setProgress(100)
        addLog('Super-resolution inference complete.', true)
        setTimeout(() => onDone(result), 600)
      },
      onError: () => {
        // Fallback silently to HTTP polling
      }
    })

    // Parallel HTTP Polling fallback
    const pollStatus = async () => {
      try {
        const job = await getJobStatus(jobId)
        if (!isMounted) return

        if (job.status === 'SEARCHING_IMAGERY') {
          setProgress((p) => Math.max(p, 20))
          addLog('Querying Copernicus STAC Catalog for Sentinel-2 L2A tiles...')
        } else if (job.status === 'DOWNLOADING_IMAGERY') {
          setProgress((p) => Math.max(p, 45))
          addLog('Downloading 19-band multi-temporal Float32 GeoTIFFs...')
        } else if (job.status === 'UPLOADING_INPUTS') {
          setProgress((p) => Math.max(p, 65))
          addLog('Staging multi-temporal inputs to Supabase Cloud Storage...')
        } else if (job.status === 'INFERENCE_PROCESSING') {
          setProgress((p) => Math.max(p, 80))
          addLog('Executing PyTorch Multi-Temporal Super-Resolution model...', true)
        } else if (job.status === 'COMPLETED' || job.status === 'INPUTS_UPLOADED') {
          setProgress(100)
          addLog('Processing complete. Finalizing output rasters.')
          setTimeout(() => {
            if (isMounted) onDone(job)
          }, 600)
          return
        } else if (job.status === 'FAILED') {
          onError(job.warning || 'Pipeline execution failed')
          return
        }

        pollTimer = setTimeout(pollStatus, 1500)
      } catch (err) {
        pollTimer = setTimeout(pollStatus, 2500)
      }
    }

    pollTimer = setTimeout(pollStatus, 1000)

    return () => {
      isMounted = false
      clearTimeout(pollTimer)
      disconnectWs()
    }
  }, [jobId, onDone, onError])

  return (
    <div className="loading-fullscreen">
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="window-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="terminal-title">geoenhance-telemetry :: {jobId ? jobId.slice(0, 8) : 'init'}</span>
          <span style={{ width: '40px' }} />
        </div>

        <div className="terminal-logs">
          {logs.map((l, i) => (
            <div key={i} className="terminal-line">
              <span className="terminal-time">[{l.time}]</span>
              <span className={`terminal-text ${l.active ? 'active' : ''}`}>
                {l.text}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        <div className="terminal-progress-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            <span>PROGRESS</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="terminal-progress-bar">
            <div className="terminal-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
