import { useEffect, useRef, useState } from 'react'

// 남은 초를 세다가 0이 되면 onDone(결제 끝 화면의 저절로 넘어가기, 기획 S60·D-13).
// 화면을 누르거나 키를 누르면 처음부터 다시 센다. active가 꺼져 있으면 멈추고, 다시 켜지면 처음부터.
// 다른 탭을 보는 동안은 세지 않는다(시연 화면을 떠났다 와도 바로 넘어가지 않게).
export function useCountdown(seconds: number, active: boolean, onDone: () => void) {
  const [remaining, setRemaining] = useState(seconds)
  const doneRef = useRef(onDone)
  useEffect(() => { doneRef.current = onDone }, [onDone])
  useEffect(() => {
    setRemaining(seconds)
    if (!active || seconds <= 0) return
    const full = seconds * 1000
    let deadline = Date.now() + full
    const restart = () => { deadline = Date.now() + full; setRemaining(seconds) }
    const timer = window.setInterval(() => {
      if (document.hidden) { deadline = Date.now() + full; return }
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) { window.clearInterval(timer); doneRef.current() }
    }, 250)
    const events = ['pointerdown', 'keydown', 'wheel'] as const
    events.forEach(event => document.addEventListener(event, restart, { capture: true, passive: true }))
    return () => {
      window.clearInterval(timer)
      events.forEach(event => document.removeEventListener(event, restart, true))
    }
  }, [seconds, active])
  return remaining
}
