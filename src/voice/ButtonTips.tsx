import { useType } from '../components/useType'
import { useVoiceGuide } from './VoiceContext'

// 음성 안내를 켜면 버튼마다 바로 위에 짧은 말풍선을 둔다(왼쪽 버튼부터, 사용자 2026-10-20).
// 버튼 줄과 같은 칸(columns·gap)으로 그려 꼬리가 각 버튼 가운데를 가리킨다. 자리를 차지해 버튼을 가리지 않는다.
// data-voice-slot이 있으면 화면 위쪽 말풍선은 띄우지 않는다(VoiceOverlay).
export default function ButtonTips({ id, tips, columns, gap }: { id: string; tips?: string[]; columns: string; gap: number | string }) {
  const voice = useVoiceGuide()
  const t = useType()
  if (!voice.enabled || !tips?.length) return null
  return <div className="voice-button-tips" data-voice-slot={id} role="region" aria-label="음성 안내 말풍선" style={{ gridTemplateColumns: columns, gap }}>
    {tips.map(tip => <div key={tip} className="voice-guide-panel voice-guide-slot points-down">
      <div className="voice-guide-message"><p style={{ ...t.body, margin: 0, fontWeight: 600, textAlign: 'center' }}>{tip}</p></div>
    </div>)}
  </div>
}
