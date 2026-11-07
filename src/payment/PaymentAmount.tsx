import { useType } from '../components/useType'
import { won } from '../orderPricing'
import { font } from '../tokens'

export function PaymentAmount({ label, amount }: { label: string; amount: number }) {
  const t = useType()
  return <div className="payment-amount"><span style={t.bodyButton}>{label}</span><strong style={t.title}>{won(amount)}</strong></div>
}

export function PaymentMoneySummary({ rows, focusedLabel }: { rows: [string, number][]; focusedLabel?: string }) {
  const t = useType()
  return <dl className="payment-money" aria-live="polite">{rows.map(([label, value]) => {
    const focused = focusedLabel === label
    return <div key={label} className={focused ? 'is-voice-focus' : undefined}>
      <dt style={{ ...t.readable(t.body), ...(focused ? { fontWeight: font.semibold } : {}) }}>{label}</dt>
      <dd style={{ ...t.primary, ...(focused ? { fontWeight: font.bold } : {}) }}>{won(value)}</dd>
    </div>
  })}</dl>
}
