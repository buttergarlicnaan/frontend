const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export function getHealth() {
  return apiRequest('/api/health')
}

export function createEnhancementJob(geometry) {
  return apiRequest('/api/enhance', {
    method: 'POST',
    body: JSON.stringify({ geometry }),
  })
}

export function getJobStatus(jobId) {
  return apiRequest(`/api/jobs/${jobId}`)
}

export { API_BASE_URL, apiRequest }
