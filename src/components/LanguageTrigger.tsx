import { useState } from 'react'
import Icon from './Icon'
import { languages, type Language } from './LanguageBar'
import LanguageFlag from './LanguageFlag'
import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import { useAppControls } from './AppControlsContext'
import { useType } from './useType'
import './auxiliary-bar.css'

// 다국어 화면 번역은 아직 준비 중이라, 언어를 누르면 '준비 중입니다' 안내만 띄우고 언어는 바꾸지 않는다.
export default function LanguageTrigger({ value, lowScreen: lowOverride }: {
  value?: Language; onChange?: (value: Language) => void; lowScreen?: boolean
}) {
  const controls = useAppControls()
  const [open, setOpen] = useState(false)
  const t = useType()
  const selected = value ?? controls.language ?? 'ko'
  const language = languages.find(item => item.id === selected)!
  return <>
    <button type="button" className="language-trigger auxiliary-language" aria-haspopup="dialog" aria-expanded={open}
      aria-label={`언어 선택, 현재 ${language.label}`} disabled={controls.utilityLocked} onClick={() => setOpen(true)}
      style={{ ...t.bodyButton, fontSize: t.largeText ? 36 : 32, lineHeight: 1.4 }}>
      <LanguageFlag language={selected} />
      <span lang={language.lang}>{language.label}</span>
      <Icon name="chevronRight" size={40} color="currentColor" optical="utility" />
    </button>
    {open && <DialogFrame titleId="language-wip-title" title="준비 중입니다"
      message="다른 언어는 아직 준비 중이에요. 지금은 한국어로 이용해 주세요."
      lowScreen={lowOverride ?? controls.lowScreen ?? false} onDismiss={() => setOpen(false)}>
      <Button purpose="support" variant="Primary" onClick={() => setOpen(false)} style={{ width: '100%', height: 128 }}>확인</Button>
    </DialogFrame>}
  </>
}
