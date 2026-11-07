import { useType } from '../components/useType'
import { useVoiceGuide } from './VoiceContext'

// 짧은 이름표 말풍선(사용자 2026-10-20: 말풍선은 정말 중요한 곳에만, 짧게). 음성 안내를 켰을 때만 보인다.
// arrow는 가리키는 쪽: left = 왼쪽에 있는 대상(수량 칸), up = 위에 있는 대상(고른 내용 목록).
// 자리를 차지해 다른 글을 가리지 않는다. id를 주면 그 안내의 화면 위쪽 말풍선을 띄우지 않는다(VoiceOverlay).
export default function ShortTip({ id, text, arrow }: { id?: string; text: string; arrow: 'left' | 'up' }) {
  const voice = useVoiceGuide()
  const t = useType()
  if (!voice.enabled) return null
  return <div className={`voice-guide-panel voice-short-tip points-${arrow}`} data-voice-slot={id} role="note">
    <p style={{ ...t.body, margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>{text}</p>
  </div>
}
