import { useEffect, useState } from 'react'

const STEPS = [
  'Preparing the selected region…',
  'Simulating satellite image fetch…',
  'Running enhancement pipeline…',
  'Building comparison view…',
]

export default function LoadingScreen({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, STEPS.length - 1))
    }, 900)

    const progressTimer = setInterval(() => {
      setProgress((current) => Math.min(current + 6, 100))
    }, 180)

    const doneTimer = setTimeout(() => {
      onDone()
    }, 3800)

    return () => {
      clearInterval(stepTimer)
      clearInterval(progressTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div className="screen-center">
      <div className="loading-card">
        <div className="spinner" aria-hidden="true" />
        <h1>Enhancing area</h1>
        <p>{STEPS[stepIndex]}</p>
        <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="muted">This is a simulated process. Copernicus and ML will be added later.</p>
      </div>
    </div>
  )
}
