import type { Language } from './LanguageBar'
import './auxiliary-bar.css'

// 배리어프리 키오스크 디자인 시스템(Community)의 원형 국기 · 영어는 지구본
const flagAssets: Record<Language, string> = {
  ko: '/assets/figma-system/flag-ko.png',
  en: '/assets/figma-system/flag-en.svg',
  zh: '/assets/figma-system/flag-zh.png',
  ja: '/assets/figma-system/flag-ja.png',
}

export default function LanguageFlag({ language }: { language: Language }) {
  return <span className={`language-flag language-flag--${language}`} aria-hidden="true">
    <img src={flagAssets[language]} alt="" />
  </span>
}
