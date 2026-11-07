import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useType } from './useType'
import { useVoiceGuide } from '../voice/VoiceContext'
import Icon from './Icon'
import './auxiliary-bar.css'

// 다시 듣기와 음량. 음성 안내를 켜면 모든 화면에서 맨 아래 줄 같은 자리에 있다(기획 D-04 ‘항상 같은 위치’).
export function VoiceBarControls({ mirror = false, style }: { mirror?: boolean; style?: CSSProperties }) {
  const voice = useVoiceGuide()
  return <div className={mirror ? 'auxiliary-voice dialog-voice-bar' : 'auxiliary-voice'} {...(mirror ? { 'data-voice-mirror': '' } : { 'data-voice-bar': '' })} style={style}>
    <button type="button" className="voice-replay" data-voice-replay onClick={voice.replay}>
      <span aria-hidden="true" className="voice-replay-icon">↻</span>다시 듣기
    </button>
    <div className="auxiliary-volume" role="group" aria-label="음성 안내 음량">
      <span aria-hidden="true">음량</span>
      <div className="volume-pill" data-volume-controls>
        <button type="button" aria-label="음량 줄이기" aria-disabled={voice.volume === 0}
          onClick={() => voice.setVolume(voice.volume - 1)}>
          <Icon name="minus" size={40} color="currentColor" />
        </button>
        <div className="volume-value">
          <Icon name="speaker" size={40} color="currentColor" optical="utility" />
          <output aria-live="polite" aria-atomic="true" aria-label={`음량 ${voice.volume}, 최대 10`}>{voice.volume}</output>
        </div>
        <button type="button" aria-label="음량 높이기" aria-disabled={voice.volume === 10}
          onClick={() => voice.setVolume(voice.volume + 1)}>
          <Icon name="plus" size={40} color="currentColor" />
        </button>
      </div>
    </div>
  </div>
}

// 대화상자가 열리면 뒤 화면은 눌리지 않는다. 대화상자 안, 아래 줄과 같은 자리에 다시 듣기·음량을 한 벌 더 둔다(사용자 2026-10-19).
export function DialogVoiceBar() {
  const voice = useVoiceGuide()
  const t = useType()
  const ref = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<CSSProperties | null>(null)
  useLayoutEffect(() => {
    if (!voice.enabled) return
    const measure = () => {
      const real = document.querySelector<HTMLElement>('#kiosk-canvas [data-voice-bar]')
      const frame = ref.current?.offsetParent as HTMLElement | null
      if (!real || !frame) { setPlace(null); return }
      const canvas = document.getElementById('kiosk-canvas'), scale = canvas ? canvas.getBoundingClientRect().width / canvas.offsetWidth || 1 : 1
      const r = real.getBoundingClientRect(), f = frame.getBoundingClientRect(), pad = 8
      setPlace({ left: (r.left - f.left) / scale - pad, top: (r.top - f.top) / scale - pad, width: r.width / scale + pad * 2, height: r.height / scale + pad * 2, paddingInline: pad })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [voice.enabled, t.largeText])
  if (!voice.enabled) return null
  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {place && <VoiceBarControls mirror style={{ ...place, pointerEvents: 'auto', ...t.bodyButton, fontSize: t.largeText ? 36 : 32, lineHeight: 1.4 }} />}
  </div>
}
