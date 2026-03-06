import { useCallback, useRef } from 'react'
import { useWebHaptics } from 'web-haptics/react'

const useHapticFeedback = () => {
  const { trigger } = useWebHaptics()
  const audioContextRef = useRef(null)

  const createAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }
    return audioContextRef.current
  }, [])

  const playClick = useCallback((tone = 'tap') => {
    try {
      const context = createAudioContext()
      if (!context) return
      const playTone = () => {
        const now = context.currentTime
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()
        oscillator.type = tone === 'error' ? 'triangle' : 'sine'
        if (tone === 'success') {
          oscillator.frequency.setValueAtTime(760, now)
          oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.06)
        } else if (tone === 'error') {
          oscillator.frequency.setValueAtTime(420, now)
          oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.08)
        } else {
          oscillator.frequency.setValueAtTime(640, now)
        }
        gainNode.gain.setValueAtTime(0.0001, now)
        gainNode.gain.exponentialRampToValueAtTime(tone === 'error' ? 0.03 : 0.024, now + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (tone === 'success' ? 0.1 : tone === 'error' ? 0.11 : 0.06))
        oscillator.connect(gainNode)
        gainNode.connect(context.destination)
        oscillator.start(now)
        oscillator.stop(now + (tone === 'success' ? 0.11 : tone === 'error' ? 0.12 : 0.07))
      }
      if (context.state === 'suspended') {
        context.resume().then(playTone).catch(() => { })
        return
      }
      playTone()
    } catch { }
  }, [createAudioContext])

  const shouldUseSoundFallback = useCallback(() => {
    const hasFinePointer = typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches
    const hasHoverPointer = typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover)').matches
    const hasNoTouchPoints = typeof navigator !== 'undefined' &&
      typeof navigator.maxTouchPoints === 'number' &&
      navigator.maxTouchPoints === 0
    if (hasFinePointer || hasHoverPointer || hasNoTouchPoints) {
      return true
    }
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return true
    }
    try {
      return navigator.vibrate(0) === false
    } catch {
      return true
    }
  }, [])

  const tap = useCallback((pattern = 'nudge', tone = 'tap') => {
    const useSoundFallback = shouldUseSoundFallback()
    try {
      if (pattern === null) {
        trigger()
      } else if (pattern) {
        trigger(pattern)
      } else {
        trigger()
      }
    } catch {
    } finally {
      if (useSoundFallback) {
        playClick(tone)
      }
    }
  }, [playClick, shouldUseSoundFallback, trigger])

  const selection = useCallback(() => {
    tap('nudge', 'tap')
  }, [tap])

  const success = useCallback(() => {
    tap('success', 'success')
  }, [tap])

  const error = useCallback(() => {
    tap('error', 'error')
  }, [tap])

  return {
    tap,
    selection,
    success,
    error
  }
}

export default useHapticFeedback
