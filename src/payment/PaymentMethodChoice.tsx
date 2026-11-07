import { paymentMethodMetrics as metrics } from '../design-system/metrics'
import { useType } from '../components/useType'
import { CheckMark, useSelectionAccent } from '../components/SelectionCard'
import { colors } from '../tokens'

export default function PaymentMethodChoice({ method, lowScreen, active, disabled, unavailable, autoFocus, onSelect }: {
  method: { id: string; label: string }
  // 장치를 쓸 수 없을 때 칸 안에 보이는 이유(기획 D-19). 있으면 흐리지 않고 회색 칸으로 잠근다.
  unavailable?: string
  lowScreen: boolean
  active: boolean
  disabled: boolean
  autoFocus: boolean
  onSelect: () => void
}) {
  const t = useType()
  const accent = useSelectionAccent('gold')
  const asset = '/assets/figma-payment/' + method.id + (lowScreen ? '-low.svg' : '-normal.svg')
  const iconSize = lowScreen ? metrics.lowIconSize : metrics.iconSize
  // NIA 결제 화면: 큰 글씨 이름은 기본 배치 44/600, 낮은 배치 36/600.
  const methodNameStyle = {
    ...t.bodyButton,
    ...(t.largeText ? { fontSize: lowScreen ? 36 : 44, lineHeight: lowScreen ? 1.2 : 1.4, letterSpacing: lowScreen ? '-0.02em' : '0' } : null),
  }
  return <button type="button" data-payment-method={method.id} autoFocus={autoFocus} aria-pressed={active} disabled={disabled}
            className="payment-method-choice" onClick={onSelect}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
              minWidth: 0, height: lowScreen ? metrics.lowHeight : metrics.height, padding: '32px 10px', border: '2px solid',
              borderColor: active ? accent.color : 'var(--border-default)', borderRadius: metrics.radius,
              background: active ? accent.light : 'var(--bg-surface)', color: colors.textPrimary,
              cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled && !unavailable ? 0.5 : 1,
            ...(unavailable ? { gap: 12, background: 'var(--bg-disabled)', borderColor: 'var(--border-default)' } : null) }}>
            <span aria-hidden="true" data-payment-icon={method.id} style={{ display: 'block', flexShrink: 0, width: iconSize, height: iconSize,
              backgroundColor: active ? accent.color : unavailable ? colors.textDisabled : colors.iconNeutral,
              // 잠긴 칸은 아이콘을 작게: 칸만 줄이면 그림 양옆이 잘리므로 그림도 칸에 맞춘다.
              ...(unavailable ? { width: iconSize * 0.7, height: iconSize * 0.7, maskSize: 'contain', WebkitMaskSize: 'contain' } : null),
              maskImage: 'url("' + asset + '")', WebkitMaskImage: 'url("' + asset + '")',
              maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
            <span data-payment-name style={{ ...methodNameStyle, whiteSpace: 'nowrap', ...(unavailable ? { color: colors.textDisabled } : null) }}>{method.label}</span>
            {unavailable && <span data-payment-unavailable style={{ ...t.readable(t.body), color: colors.textSecondary, wordBreak: 'keep-all', textAlign: 'center' }}>{unavailable}</span>}
            {active && <span aria-hidden="true" style={{ position: 'absolute', top: metrics.checkInset, right: metrics.checkInset, width: metrics.checkSize, height: metrics.checkSize, borderRadius: '50%', background: accent.color, display: 'grid', placeItems: 'center' }}><CheckMark size={metrics.checkMarkSize} color="var(--option-check)" /></span>}
          </button>
}
