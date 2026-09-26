import { useEffect, useState } from 'react'
import { getJobStatus } from '../api/client.js'

const STATUS_MESSAGES = {
  QUEUED: 'Preparing your request...',
  SEARCHING_IMAGERY: 'Finding suitable satellite imagery...',
  DOWNLOADING_IMAGERY: 'Downloading satellite imagery...',
  PREPARING_INPUT: 'Preparing imagery...',
  ENHANCING: 'Enhancing satellite imagery...',
  GENERATING_PREVIEW: 'Preparing result...',
  COMPLETED: 'Complete',
  TIFFS_RETRIEVED: 'Raster data retrieved',
  UPLOADING_INPUTS: 'Uploading to cloud storage...',
  INPUTS_UPLOADED: 'Ready for processing',
  FAILED: 'Processing failed'
}

export default function LoadingScreen({ jobId, onDone, onError }) {
  const [message, setMessage] = useState('Initializing...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!jobId) return
    
    let isMounted = true
    let timerId
    let fakeProgress = 5

    const poll = async () => {
      try {
        const job = await getJobStatus(jobId)
        if (!isMounted) return

        setMessage(STATUS_MESSAGES[job.status] || `Status: ${job.status}`)
        fakeProgress = Math.min(fakeProgress + 10, 95)
        const isFinished = job.status === 'COMPLETED' || job.status === 'INPUTS_UPLOADED';
        setProgress(isFinished ? 100 : fakeProgress)

        if (isFinished) {
          setTimeout(() => {
            if (isMounted) onDone(job.result)
          }, 500)
        } else if (job.status === 'FAILED') {
          onError(job.warning || 'Processing failed on the server')
        } else {
          timerId = setTimeout(poll, 1000)
        }
      } catch (err) {
        if (!isMounted) return
        onError(err.message || 'Failed to check status')
      }
    }

    poll()

    return () => {
      isMounted = false
      clearTimeout(timerId)
    }
  }, [jobId, onDone, onError])

  return (
    <div className="screen-center">
      <div className="loading-card">
        <div className="spinner" aria-hidden="true" />
        <h1>Enhancing area</h1>
        <p>{message}</p>
        <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="muted">This is a simulated process. Copernicus and ML will be added later.</p>
      </div>
    </div>
  )
}
