import type { CSSProperties } from 'react'
import { buttonMetrics } from '../design-system/metrics'
import { colors, radius } from '../tokens'
import type { Theme } from '../theme'

/* Button 변형 · Figma 컴포넌트 이름과 같게 둔다 (Button / Primary …)
   Primary     강조색 채움 · 대비 글자      — 다음 단계로 가는 행동. 한 결정 묶음에 하나
   Secondary   표면색 바탕 · 강조색 선 · 강조 글자 — Primary 옆의 정상적인 다른 길 (기본값으로 주문 ↔ 내 입맛에 맞게 주문)
   Neutral     짙은 회색 채움 · 흰 글자 — 상품 정보의 기본값 주문 경로
   Tertiary    흰 바탕 · 회색 선 · 검정 글자 — 돌아가기, 보조 이동 (이전, 메뉴로 돌아가기, 메뉴 더 고르기)
   Utility     흰 바탕 · 회색 선 · 검정 글자, 작은 크기 — 화면 안의 조작 (검색하기, 수정하기, 바꾸기, 닫기)
   Destructive 크림슨 채움 · 대비 글자 — 빼기
   Disabled    회색 바탕 · 회색 글자 — 파란색을 쓰지 않는다
   위계는 크기가 아니라 채움·선·색으로 만든다. 같은 자리에 오는 버튼은 높이·둥글기·글자를 같게 둔다.
   일반/HC 모드의 색 값은 공통 의미 토큰에서 온다. */
export type ButtonVariant = 'Primary' | 'Secondary' | 'Tertiary' | 'Utility' | 'Destructive' | 'Disabled' | 'Text' | 'Neutral'
export type ButtonSize = 'large' | 'small' // large 128 · small 72
// 화면/모달의 결정 묶음과, 그 결정을 준비하는 조작을 구분한다.
// 색상 variant나 disabled 여부와 독립적이며 같은 묶음은 같은 purpose를 쓴다.
export type ButtonPurpose = 'decision' | 'support'

function buttonRadius(purpose: ButtonPurpose): string {
  return purpose === 'decision' ? radius.btn : radius.pill
}

export function buttonPurposeStyle(purpose: ButtonPurpose): CSSProperties & { '--button-radius': string } {
  return { '--button-radius': buttonRadius(purpose), borderRadius: 'var(--button-radius)' }
}

function surface(theme: Theme): Record<ButtonVariant, CSSProperties> {
  return {
    Neutral:     { background: 'var(--action-neutral)', border: '2px solid var(--action-neutral)', color: 'var(--text-on-neutral)' },
    Text:        { background: 'transparent', border: '2px solid transparent', color: colors.textSecondary },
    Primary:     { background: `var(--button-pressed-background, ${theme.actionPrimary})`, border: `2px solid var(--button-pressed-background, ${theme.actionPrimary})`, color: theme.actionPrimaryText },
    Secondary:   { background: theme.surface,       border: `2px solid ${theme.actionPrimary}`, color: 'var(--accent-text)' },
    Tertiary:    { background: `var(--button-pressed-background, ${theme.surface})`, border: `2px solid ${theme.borderNeutral}`, color: colors.textPrimary },
    Utility:     { background: theme.surface,       border: `2px solid ${theme.borderNeutral}`, color: colors.textPrimary },
    Destructive: { background: 'var(--destructive)', border: '2px solid var(--destructive)', color: 'var(--text-on-destructive)' },
    Disabled:    { background: theme.disabledBg,    border: `2px solid ${theme.disabledBg}`,    color: theme.disabledText },
  }
}

export function buttonTextColor(variant: ButtonVariant, theme: Theme): string {
  return surface(theme)[variant].color as string
}

export function buttonStyle(variant: ButtonVariant, size: ButtonSize, theme: Theme): CSSProperties {
  const metrics = buttonMetrics[size]
  return {
    ...surface(theme)[variant],
    height: metrics.height,
    minWidth: metrics.minWidth, // 글자가 줄바꿈되지 않게
    padding: `0 ${metrics.paddingX}px`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: buttonMetrics.contentGap,
    cursor: variant === 'Disabled' ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  }
}
