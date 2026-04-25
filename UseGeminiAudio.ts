// ─────────────────────────────────────────────────────────────────────────────
// useGeminiAudio.ts — React hook for GeminiAudioCapture
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { GeminiAudioCapture, type GeminiServerMessage, type CaptureStatus } from './GeminiAudioCapture'

export interface UseGeminiAudioOptions {
  wsUrl: string
  onMessage: (data: GeminiServerMessage) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  model?: string
}

export interface UseGeminiAudioReturn {
  start: () => Promise<void>
  stop: () => void
  status: CaptureStatus
  error: string | null
  audioLevel: number
}

export function useGeminiAudio({
  wsUrl,
  onMessage,
  onToolCall,
  model,
}: UseGeminiAudioOptions) {
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setLevel] = useState(0)
  
  const captureRef = useRef<GeminiAudioCapture | null>(null)
  const levelPoll = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    setStatus('connecting')
    setError(null)

    const instance = new GeminiAudioCapture({
      wsUrl,
      onMessage,
      onToolCall,
      model,
      onError: (e) => {
        setError(e.message)
        setStatus('error')
      },
      onStatusChange: setStatus,
    })

    captureRef.current = instance

    try {
      await instance.start()
      // We still poll the class for the level to keep UI updates decoupled from native events
      levelPoll.current = setInterval(() => {
        setLevel(instance.getAudioLevel())
      }, 60)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }, [wsUrl, onMessage, onToolCall, model])

  const stop = useCallback(() => {
    if (levelPoll.current) clearInterval(levelPoll.current)
    captureRef.current?.stop()
    captureRef.current = null
    setStatus('idle')
    setLevel(0)
  }, [])

  useEffect(() => {
    return () => {
      if (levelPoll.current) clearInterval(levelPoll.current)
      captureRef.current?.stop()
    }
  }, [])

  return { start, stop, status, error, audioLevel }
}