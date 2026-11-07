import { useState } from 'react'
import { colors, space } from '../tokens'
import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import { languages, type Language } from './LanguageBar'
import LanguageFlag from './LanguageFlag'
import { useSelectionAccent } from './SelectionCard'
import { useType } from './useType'
import { dialogVoice } from '../voice/guides'

// 선택은 임시 저장하고 적용할 때만 부모의 언어 상태를 바꾼다.
export default function LanguageDialog({ value, lowScreen, onApply, onCancel }: {
  value: Language
  lowScreen: boolean
  onApply: (language: Language) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  const t = useType()
  const accent = useSelectionAccent('gold')
  return (
    <DialogFrame titleId="language-dialog-title" title="언어 선택" voice={dialogVoice.language}
      message={<span lang="en">Select language</span>} lowScreen={lowScreen} onDismiss={onCancel}>
      <div role="group" aria-labelledby="language-dialog-title" data-dialog-choices style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {languages.map(language => {
          const selected = draft === language.id
          return (
            <button key={language.id} type="button" lang={language.lang}
              aria-pressed={selected} onClick={() => setDraft(language.id)}
              className="language-dialog-option"
              style={{ ...t.primary, height: 104, flexShrink: 0, padding: '0 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: 0, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: selected ? accent.light : 'transparent',
                color: selected ? accent.text : colors.textPrimary }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                <LanguageFlag language={language.id} />
                <span>{language.label}</span>
              </span>
              {selected && <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: accent.color }}>
                <path d="m4 12 5 5L20 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>}
            </button>
          )
        })}
      </div>
      <div data-dialog-actions style={{ display: 'flex', gap: space.md }}>
        <Button purpose="decision" variant="Text" onClick={onCancel} style={{ width: 240 }}>취소</Button>
        <Button purpose="decision" variant="Primary" onClick={() => onApply(draft)} style={{ flex: 1 }}>적용</Button>
      </div>
    </DialogFrame>
  )
}
