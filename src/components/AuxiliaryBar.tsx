import { useType } from './useType'
import { useVoiceGuide } from '../voice/VoiceContext'
import LanguageTrigger from './LanguageTrigger'
import { VoiceBarControls } from './VoiceBarControls'
import './auxiliary-bar.css'

export default function AuxiliaryBar() {
  const t = useType()
  const voice = useVoiceGuide()
  return <div className="auxiliary-bar" data-voice-utility data-auxiliary-bar
    style={{ ...t.bodyButton, fontSize: t.largeText ? 36 : 32, lineHeight: 1.4 }}>
    <LanguageTrigger />
    {voice.enabled && <VoiceBarControls />}
  </div>
}
