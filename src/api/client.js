const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8001'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`
    try {
      const data = await response.json()
      if (data.error) errorMsg = data.error
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export function getHealth() {
  return apiRequest('/api/health')
}

export function createEnhancementJob(payload) {
  // Guarantee clean payload formatting
  const body = payload && payload.geometry ? payload : { geometry: payload }
  return apiRequest('/api/enhance', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getJobStatus(jobId) {
  return apiRequest(`/api/jobs/${jobId}`)
}

/**
 * Connect to FastAPI ML Worker WebSocket for live tile-processing telemetry.
 */
export function connectJobWebSocket(jobId, callbacks = {}) {
  const { onLog, onProgress, onComplete, onError, onClose } = callbacks
  let socket = null
  let isClosed = false

  try {
    const wsUrl = `${WS_BASE_URL}/ws/jobs/${jobId}`
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      onLog?.('Connected to live inference stream')
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.log) onLog?.(data.log)
        if (data.progress !== undefined) onProgress?.(data.progress)
        if (data.status === 'COMPLETED' || data.result) onComplete?.(data.result)
      } catch {
        onLog?.(event.data)
      }
    }

    socket.onerror = (err) => {
      onError?.(err)
    }

    socket.onclose = () => {
      if (!isClosed) {
        onClose?.()
      }
    }
  } catch (err) {
    onError?.(err)
  }

  return () => {
    isClosed = true
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close()
    }
  }
}

export function jobAssetUrl(jobId, filename) {
  if (!jobId || !filename) return ''
  return `${API_BASE_URL}/api/jobs/${jobId}/files/${encodeURIComponent(filename)}`
}

export { API_BASE_URL, WS_BASE_URL, apiRequest }
