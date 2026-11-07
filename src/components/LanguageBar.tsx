import { useState } from 'react'
import { useType } from './useType'
import './language-bar.css'

export type LanguageBarTone = 'gray' | 'charcoal'
export type Language = 'ko' | 'en' | 'zh' | 'ja'
export const languages = [
  { id: 'ko', label: '한국어', lang: 'ko' },
  { id: 'en', label: 'English', lang: 'en' },
  { id: 'zh', label: '中文', lang: 'zh-Hans' },
  { id: 'ja', label: '日本語', lang: 'ja' },
] as const

// 비교 시안의 선택 표시만 바꾼다. 번역·지원 언어는 아직 확정되지 않았다.
export default function LanguageBar({ tone, variant = 'study', value, onChange }: { tone: LanguageBarTone; variant?: 'study' | 'initial' | 'text'; value?: Language; onChange?: (language: Language) => void }) {
  const [localValue, setLocalValue] = useState<Language>('ko')
  const selected = value ?? localValue
  const t = useType()
  return (
    <div className={`language-study language-study--${tone} language-study--${variant}`} role="group" aria-label="언어 선택">
      {languages.map(language => (
        <button key={language.id} type="button" lang={language.lang} aria-pressed={selected === language.id}
          onClick={() => { setLocalValue(language.id); onChange?.(language.id) }} style={{ ...t.bodyButton, lineHeight: 1.25, ...(variant === 'text' ? { fontWeight: selected === language.id ? 700 : 500 } : {}) }}>
          {selected === language.id && <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="m4 12 5 5L20 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>}
          <span>{language.label}</span>
        </button>
      ))}
    </div>
  )
}
