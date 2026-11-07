import { useCallback, useEffect, useRef, useState } from 'react'
import { InactivityTimer } from '../inactivityTimer'

export function useInactivity({ enabled, suspended, initialWarning = false, onExpire }: {
  enabled: boolean; suspended: boolean; initialWarning?: boolean; onExpire: () => void
}) {
  const [timer] = useState(() => new InactivityTimer(Date.now(), initialWarning))
  const [remaining, setRemaining] = useState<number | null>(initialWarning ? 30 : null)
  const expireRef = useRef(onExpire)
  useEffect(() => { expireRef.current = onExpire }, [onExpire])
  const resume = useCallback(() => { timer.reset(Date.now()); setRemaining(null) }, [timer])

  useEffect(() => {
    if (!enabled || suspended) {
      timer.pause()
      setRemaining(null)
      return
    }
    timer.resume(Date.now())
    const activity = () => timer.activity(Date.now())
    // 외부 시연 탭을 떠난 동안에는 주문을 지우지 않는다. 돌아오면 새 유예 시간을 준다.
    const visibility = () => {
      if (document.hidden) { timer.pause(); setRemaining(null) }
      else { timer.reset(Date.now()); setRemaining(null) }
    }
    if (document.hidden) visibility()
    const interval = window.setInterval(() => {
      const next = timer.poll(Date.now())
      setRemaining(next)
      if (next === 0) {
        window.clearInterval(interval)
        expireRef.current()
      }
    }, 250)
    const events = ['pointerdown', 'keydown', 'wheel', 'scroll'] as const
    events.forEach(event => document.addEventListener(event, activity, { capture: true, passive: true }))
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.clearInterval(interval)
      events.forEach(event => document.removeEventListener(event, activity, true))
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [enabled, suspended, timer])
  return { remaining, resume }
}
