import type { CSSProperties } from 'react'
import tokens from './color-tokens.json'

// 사용자 제공 토큰. 2026-10-06 개정 MD의 순수 Gray/Primary-95 값을 반영했다.
const gray = tokens.Color.Gray
const light = tokens.Color.Light
const hc = tokens.Color.HC
const g = (step: keyof typeof gray) => gray[step].$value
const gold = (step: keyof typeof light.primary) => light.primary[step].$value
const red = (step: keyof typeof light.secondary) => light.secondary[step].$value
const yellow = (step: keyof typeof hc.primary) => hc.primary[step].$value

export const lightColors = {
  // 주 화면과 장바구니 컨테이너의 배경을 Gray-0으로 통일한다.
  'bg-page': g('0'), 'bg-surface': g('0'), 'bg-muted': g('5'),
  // 하단 고정 영역이 목록 위에 드리우는 그림자. 안내 버튼의 불투명 배경과는 분리한다.
  'scroll-shadow': 'rgba(0, 0, 0, 0.22)',
  'bg-disabled': g('10'), 'bg-brand-tint': gold('5'), 'bg-dark': g('100'),
  'text-primary': g('100'), 'text-secondary': g('50'), 'text-disabled': g('60'),
  'text-on-dark': g('0'), 'text-brand-on-dark': gold('50'),
  // primary-60 / Cream 대비 실측 4.57:1.
  'text-brand': gold('60'), 'icon-brand': gold('50'), 'icon-neutral': g('50'),
  'border-default': g('20'), 'border-subtle': g('20'), 'border-brand': gold('20'),
  'accent': red('60'), 'accent-hover': red('40'), 'accent-pressed': red('70'),
  'accent-text': red('70'), 'text-on-accent': g('0'),
  'action-neutral': g('90'), 'text-on-neutral': g('0'),
  'state-current': gold('50'), 'text-on-current': g('100'),
  // 기존 골드보다 연한 면으로 현재·완료를 구분하고 예정 단계는 배경에 섞는다.
  'progress-current': gold('30'), 'progress-completed': gold('5'), 'progress-other': 'transparent',
  'state-selected': red('5'), 'state-selected-border': red('60'), 'state-selected-text': red('70'),
  'filter-selected-border': red('30'),
  'option-selected': gold('5'), 'option-selected-border': gold('70'),
  'option-selected-secondary': g('60'), 'option-check': g('0'),
  'option-original-bg': gold('20'), 'option-original-text': gold('80'),
  'step-done': gold('10'), 'step-done-text': g('60'), 'step-done-mark': gold('70'), 'step-upcoming': g('5'),
  'utility-bg': g('10'), 'utility-surface': g('5'),
  'utility-selected': g('100'), 'utility-selected-text': g('0'),
  'utility-pending': g('20'), 'utility-pending-text': g('70'), 'utility-pending-pressed': g('20'),
  'utility-pressed': g('20'), 'utility-selected-pressed': g('80'),
  'success': light.positive['70'].$value, 'error': light.negative['70'].$value,
  // 담기 알림의 체크 면과 체크. 연한 초록 면 + 진한 초록 체크(사용자 2026-10-21 3안).
  'success-bg': light.positive['10'].$value, 'success-mark': light.positive['70'].$value,
  'warning-bg': gold('5'), 'warning-text': gold('80'), 'warning-border': gold('50'),
  'destructive': light.negative['70'].$value, 'text-on-destructive': g('0'),
  // 온도는 기존 아이콘/문구로 식별. 브랜드 팔레트 안의 따뜻한 면/중립 면을 사용한다.
  'badge-hot-bg': gold('10'), 'badge-hot-text': g('100'),
  'badge-cold-bg': g('10'), 'badge-cold-text': g('100'),
  // 음성 안내가 읽는 곳을 두르는 형광펜 같은 노랑 테두리 한 겹. 팔레트 밖 색(사용자 결정 2026-10-19, 주황에서 바꿈).
  // 흰 바탕 대비는 1.6이라 대비 검사 쌍에 넣지 않는다(알려 드림, 검정 선 두 겹은 쓰지 않기로).
  'voice-ring': '#FFC400',
  // 음성 안내 말풍선. 고른 옵션과 같은 연한 골드 면 + 골드 테두리, 그림자 없음(사용자 결정 2026-10-21 ‘골드 A’).
  'voice-bubble-bg': gold('5'), 'voice-bubble-border': gold('50'),
}

export const highContrastColors: typeof lightColors = {
  ...lightColors,
  // HC 페이지는 공통 bg-dark(Gray-100)를 따른다. 내부 면은 순수 Gray 단계 사용.
  'bg-page': lightColors['bg-dark'], 'bg-surface': g('95'), 'bg-muted': g('100'),
  'scroll-shadow': 'rgba(0, 0, 0, 0.78)',
  'bg-disabled': g('80'), 'bg-brand-tint': g('95'),
  'text-primary': g('0'), 'text-secondary': g('20'), 'text-disabled': g('20'),
  'text-brand': yellow('40'), 'text-brand-on-dark': yellow('40'),
  'icon-brand': yellow('40'), 'icon-neutral': g('20'),
  'border-default': g('40'), 'border-subtle': g('40'), 'border-brand': yellow('40'),
  'accent': yellow('40'), 'accent-hover': yellow('30'), 'accent-pressed': yellow('50'),
  'accent-text': yellow('40'), 'text-on-accent': g('100'),
  'state-current': yellow('40'), 'text-on-current': g('100'),
  'progress-current': yellow('40'), 'progress-completed': g('95'), 'progress-other': g('95'),
  'state-selected': g('100'), 'state-selected-border': yellow('40'), 'state-selected-text': yellow('40'),
  'filter-selected-border': yellow('40'),
  'option-selected': g('100'), 'option-selected-border': yellow('40'),
  'option-selected-secondary': g('20'), 'option-check': g('100'),
  'option-original-bg': yellow('40'), 'option-original-text': g('100'),
  'step-done': g('95'), 'step-done-text': g('20'), 'step-done-mark': yellow('40'), 'step-upcoming': g('95'),
  'utility-bg': g('100'), 'utility-surface': g('95'),
  'utility-selected': yellow('40'), 'utility-selected-text': g('100'),
  'utility-pending': yellow('40'), 'utility-pending-text': g('100'), 'utility-pending-pressed': yellow('50'),
  'utility-pressed': g('80'), 'utility-selected-pressed': yellow('50'),
  'success': hc.positive['40'].$value, 'error': hc.negative['40'].$value,
  // 고대비는 밝은 초록 면 + 검정 체크(사용자 2026-10-21 A안). 어두운 초록 면은 창 바탕과 1.49:1이라 원이 안 보였다.
  'success-bg': hc.positive['40'].$value, 'success-mark': g('100'),
  'warning-bg': g('95'), 'warning-text': yellow('40'), 'warning-border': yellow('40'),
  'destructive': hc.negative['50'].$value, 'text-on-destructive': g('100'),
  'badge-hot-bg': g('100'), 'badge-hot-text': yellow('40'),
  'badge-cold-bg': g('80'), 'badge-cold-text': g('0'),
  // 고대비는 노란 버튼·켜진 기능과 섞이지 않게 흰색 한 겹(사용자 결정 2026-10-19).
  'voice-ring': g('0'),
  // 고대비 말풍선은 그대로(진회색 면 + 노란 테두리). 노랑 면은 버튼과 헷갈린다.
  'voice-bubble-bg': g('95'), 'voice-bubble-border': yellow('40'),
}

// 원본 팔레트도 Figma 이름과 같은 CSS 변수로 노출한다.
const primitives: Record<string, string> = {}
for (const [step, token] of Object.entries(gray)) primitives[`--gray-${step}`] = token.$value
for (const [group, palette] of Object.entries(light)) {
  for (const [step, token] of Object.entries(palette)) primitives[`--${group}-${step}`] = token.$value
}
for (const [group, palette] of Object.entries(hc)) {
  for (const [step, token] of Object.entries(palette)) primitives[`--hc-${group}-${step}`] = token.$value
}
function variables(values: typeof lightColors): CSSProperties {
  return { ...primitives, ...Object.fromEntries(Object.entries(values).map(([key, value]) => [`--${key}`, value])) } as CSSProperties
}
export const lightColorVariables = variables(lightColors)
export const highContrastColorVariables = variables(highContrastColors)
