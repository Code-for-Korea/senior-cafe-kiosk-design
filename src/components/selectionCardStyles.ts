import type { CSSProperties } from 'react'
import { selectionMetrics as metrics } from '../design-system/metrics'
import { colors } from '../tokens'
import type { Theme } from '../theme'

/** original은 수정 시작 때의 값이며 현재 선택(selected)과 독립적이다. */
export interface SelectionState {
  selected: boolean
  original?: boolean
  disabled?: boolean
}
export type SelectionAppearance = 'default' | 'dialog'
export interface SelectionAccentColors { color: string; light: string; text: string }

/** 상태별 표현. 배치는 SelectionCard가 담당한다.
 * disabled는 면/선에 우선하고 selected 체크는 보존한다.
 * 이름·아이콘 비활성 색 및 Pressed 표현은 상태 보드에서 검토할 별도 결정이다.
 */
export function selectionCardStyle(
  { selected, original = false, disabled = false }: SelectionState,
  appearance: SelectionAppearance,
  balancedContent: boolean,
  theme: Theme,
  accent: SelectionAccentColors,
): CSSProperties {
  const quiet = appearance === 'dialog'
  const border = selected ? metrics.selectedBorder : metrics.border
  // 테두리가 굵어져도 바깥 높이와 내용 기준선이 움직이지 않도록 보정한다.
  const correction = border - metrics.border
  // 균형 카드(옵션 선택)의 여백 토큰은 카드 바깥 가장자리에서 잰 거리다(Figma의 안쪽 테두리와 같은 기준).
  // 그래서 테두리 두께를 통째로 빼서, 토큰 24가 눈에도 24로 보이게 한다(사용자 2026-11-03).
  const balancedInset = border
  return {
    background: disabled ? theme.disabledBg : selected ? accent.light : original && !quiet ? colors.bgDisabled : theme.surface,
    border: `${border}px solid ${disabled ? theme.disabledBg : selected ? accent.color : quiet ? 'transparent' : theme.borderNeutral}`,
    padding: balancedContent
      ? `${metrics.balancedPaddingY - balancedInset}px ${metrics.balancedPaddingX - balancedInset}px`
      : `${metrics.paddingTop - correction}px ${metrics.paddingX - correction}px ${metrics.paddingBottom - correction}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
