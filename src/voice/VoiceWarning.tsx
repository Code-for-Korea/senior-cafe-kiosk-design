import Icon from '../components/Icon'
import { useType } from '../components/useType'
import { useVoiceGuide } from './VoiceContext'

export default function VoiceWarning() {
  const voice = useVoiceGuide()
  const t = useType()
  if (!voice.warningVisible) return null
  return <aside data-voice-warning className="voice-warning" role="alert" aria-atomic="true">
    <svg className="voice-warning-icon" aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6l6 6v6l-6 6H9l-6-6V9Z" /><path d="M12 7v6" /><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
    </svg>
    <div className="voice-warning-copy">
      <p style={{ ...t.body, fontWeight: 700, margin: 0 }}>음성 안내를 재생하지 못했어요</p>
      <p style={{ ...t.body, margin: 0 }}>화면의 글 안내를 따라 이용해 주세요.</p>
    </div>
    <button type="button" className="voice-warning-close" aria-label="음성 안내 경고 닫기" onClick={voice.dismissWarning}>
      <Icon name="close" size={32} color="currentColor" />
    </button>
  </aside>
}
