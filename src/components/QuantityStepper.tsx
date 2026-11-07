import { quantityMetrics } from '../design-system/metrics'
import { colors, font, radius } from '../tokens'
import { useType } from './useType'
import { useTheme } from './ThemeContext'

/* QuantityStepper · [ − ] N개 [ + ] 가 한 덩어리로 보이게 한 틀(회색 선) 안에 넣는다.
   상태: Default · MinusDisabled(1개) · PlusDisabled(최대). 파란색은 쓰지 않는다 — Primary와 겨루지 않게. */
interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  showUnit?: boolean
  disabled?: boolean
  // 큰 글씨에서 숫자를 36으로(장바구니, 사용자 2026-10-20). 고른 내용 확인·디저트는 그대로.
  readable?: boolean
}

export const MAX_QUANTITY = 9
const HEIGHT = quantityMetrics.height

export default function QuantityStepper({ value, onChange, min = 1, max = MAX_QUANTITY, showUnit = true, disabled = false, readable = false }: Props) {
  const t = useType()
  const theme = useTheme()
  const key = (label: string, ariaLabel: string, disabled: boolean, next: number) => (
    <button
      onClick={disabled ? undefined : () => onChange(next)}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        width: HEIGHT, height: HEIGHT - quantityMetrics.border * 2, border: 'none', padding: 0, flexShrink: 0,
        background: disabled ? theme.disabledBg : theme.surface,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ ...t.primary, lineHeight: 1, color: disabled ? colors.textDisabled : colors.textPrimary }}>{label}</span>
    </button>
  )
  return (
    <div role="group" aria-label="수량" style={{
      display: 'flex', alignItems: 'center', height: HEIGHT, flexShrink: 0,
      border: `${quantityMetrics.border}px solid ${theme.borderNeutral}`, borderRadius: radius.quantity, overflow: 'hidden', background: theme.surface,
    }}>
      {key('−', '수량 하나 줄이기', disabled || value <= min, value - 1)}
      {/* 숫자는 Body 크기 Medium · 38px은 너무 커 보인다는 사용자 판단 */}
      <span aria-label={`${value}개`} style={{
        ...(readable ? t.readable(t.body) : t.body), fontWeight: font.medium, minWidth: quantityMetrics.valueMinWidth, textAlign: 'center', color: colors.textPrimary,
        borderLeft: `${quantityMetrics.border}px solid ${theme.borderNeutral}`, borderRight: `${quantityMetrics.border}px solid ${theme.borderNeutral}`,
        height: HEIGHT - quantityMetrics.border * 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${quantityMetrics.valuePaddingX}px`,
      }}>
        {value}{showUnit ? '개' : ''}
      </span>
      {key('+', '수량 하나 늘리기', disabled || value >= max, value + 1)}
    </div>
  )
}
