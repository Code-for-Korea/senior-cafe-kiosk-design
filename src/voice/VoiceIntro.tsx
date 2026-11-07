import { useLayoutEffect, useRef, useState } from 'react'
import { useType } from '../components/useType'

// 음성 안내를 켤 때 한 번 말하고, 맨 아래 줄의 다시 듣기·음량 자리를 말풍선으로 가리킨다(2026-10-19 사용자).
export const INTRO_LINE = '음성 안내를 켰어요. 다시 듣기와 음량은 화면 맨 아래에 있어요.'
export const INTRO_TARGET = '[data-voice-bar]'

export default function VoiceIntro({ canvas }: { canvas: HTMLElement }) {
  const t = useType()
  const ref = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<{ right: number; bottom: number; arrow: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const bar = canvas.querySelector<HTMLElement>(INTRO_TARGET), replay = bar?.querySelector<HTMLElement>('[data-voice-replay]')
      const row = bar?.closest<HTMLElement>('[data-auxiliary-bar]')
      if (!bar || !replay || !row || !ref.current) { setPlace(null); return }
      const base = canvas.getBoundingClientRect(), scale = base.width / canvas.offsetWidth || 1
      const b = bar.getBoundingClientRect(), r = replay.getBoundingClientRect(), self = ref.current.getBoundingClientRect()
      const right = (base.right - b.right) / scale
      const bottom = (base.bottom - row.getBoundingClientRect().top) / scale + 20
      const left = canvas.offsetWidth - right - self.width / scale
      const next = { right, bottom, arrow: (r.left + r.width / 2 - base.left) / scale - left - 10 }
      setPlace(old => old && old.right === next.right && old.bottom === next.bottom && old.arrow === next.arrow ? old : next)
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(canvas)
    const bar = canvas.querySelector(INTRO_TARGET)
    if (bar) resize.observe(bar)
    if (ref.current) resize.observe(ref.current)
    return () => resize.disconnect()
  }, [canvas, t.largeText])
  return <div ref={ref} data-voice-overlay data-voice-intro role="note" className="voice-guide-panel points-down voice-intro"
    style={{ right: place?.right ?? 24, bottom: place?.bottom ?? 124, visibility: place ? 'visible' : 'hidden', ['--arrow-x' as string]: `${place?.arrow ?? 0}px` }}>
    <div className="voice-guide-message"><p style={{ ...t.body, margin: 0, fontWeight: 600 }}>다시 듣기와 음량은 여기에서 바꿀 수 있어요.</p></div>
  </div>
}
