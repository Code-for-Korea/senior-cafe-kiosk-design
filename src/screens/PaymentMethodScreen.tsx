import { useOrderPricing } from '../components/useOrderPricing'
import { layout, progressMetrics } from '../design-system/metrics'
import LowScreenHeader from '../components/LowScreenHeader'
import GuideCue from '../voice/GuideCue'
import { paymentMethodGuide } from '../voice/guides'
import { useState } from 'react'
import Button from '../components/Button'
import PaymentDetailsDialog from '../components/PaymentDetailsDialog'
import Icon from '../components/Icon'
import type { CartEntry } from './CartScreen'
import ProgressStep from '../components/ProgressStep'
import UtilityBar from '../components/UtilityBar'
import { useType } from '../components/useType'
import PaymentMethodChoice from '../payment/PaymentMethodChoice'
import { colors } from '../tokens'
import { won } from '../orderPricing'
import '../previews/low-screen-menu.css'

// voiceLabel: 음성 안내가 읽는 이름(괄호 속 보충 설명은 읽지 않는다).
const paymentMethods = [
  { id: 'card', label: '신용·체크카드', voiceLabel: '신용·체크카드', actionLabel: '카드로 결제하기' },
  { id: 'cash', label: '현금(지폐)', voiceLabel: '현금', actionLabel: '현금으로 결제하기' },
  { id: 'mobile', label: '모바일 결제', voiceLabel: '모바일 결제', actionLabel: '모바일로 결제하기' },
] as const
export type PaymentMethod = typeof paymentMethods[number]['id']

export default function PaymentMethodScreen({ lowScreen, onToggleLowScreen, items, onBack, onContinue, initialSelected = null, unavailableMethods = [] }: {
  initialSelected?: PaymentMethod | null
  // 쓸 수 없는 결제방법(현금 장치 꺼짐, 이번 주문에서 기계 문제가 난 방법). 숨기지 않고 잠근 뒤 이유를 보인다(기획 D-19).
  unavailableMethods?: readonly PaymentMethod[]
  lowScreen: boolean
  onToggleLowScreen: () => void
  items: CartEntry[]
  onBack: () => void
  onContinue: (method: PaymentMethod) => void
}) {
  const { cartTotals } = useOrderPricing()
  const t = useType()
  const { count, total } = cartTotals(items)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [picked, setSelected] = useState<PaymentMethod | null>(initialSelected)
  const unavailable = (id: PaymentMethod) => unavailableMethods.includes(id)
  // 고른 뒤 장치가 꺼지면 고른 것을 지운다.
  const selected = picked && unavailable(picked) ? null : picked
  const selectedMethod = paymentMethods.find(method => method.id === selected)
  return <><div data-payment-screen={lowScreen ? 'low' : 'normal'} style={{ width: layout.width, height: layout.height, display: 'flex', flexDirection: 'column', background: colors.bgPage, color: colors.textPrimary }}>
    <GuideCue guide={paymentMethodGuide(paymentMethods.filter(method => !unavailable(method.id)).map(method => method.voiceLabel), selectedMethod?.actionLabel, paymentMethods.filter(method => unavailable(method.id)).map(method => ({ name: method.voiceLabel, id: method.id })))} />
    {lowScreen ? <LowScreenHeader current={5} description="아래에서 결제 방법을 골라 주세요." /> : <header data-order-header style={{ padding: `${layout.progressTop}px ${layout.pageInset}px ${progressMetrics.spaceBelow}px`, flexShrink: 0 }}><ProgressStep current={5} /></header>}
    <main data-payment-content style={{ flex: 1, minHeight: 0, padding: lowScreen ? '32px 64px 36px' : '48px 64px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: lowScreen ? 40 : 56 }}>
      <div>
        <h1 style={{ ...t.title, margin: '0 0 16px' }}>결제 방법을 골라 주세요</h1>
        <p style={{ ...t.body, margin: 0, color: colors.textSecondary }}>결제할 금액을 확인해 주세요.</p>
      </div>
      <section aria-label="결제 금액">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '24px 32px', minHeight: 120, borderRadius: 12, background: colors.bgDisabled }}>
          <button type="button" onClick={() => setDetailsOpen(true)} aria-haspopup="dialog" aria-expanded={detailsOpen}
            className="payment-method-choice" style={{ ...t.bodyButton, minHeight: 72, padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: 8, border: 0, background: 'transparent', color: colors.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            결제 금액 확인<Icon name="chevronRight" size={28} color={colors.textPrimary} />
          </button>
          <strong style={{ ...t.title, fontWeight: 700 }}>{won(total)}</strong>
        </div>
      </section>
      <div role="group" aria-label="결제 방법" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
        {paymentMethods.map(method => <PaymentMethodChoice key={method.id} method={method} lowScreen={lowScreen}
          active={selected === method.id} disabled={count === 0 || unavailable(method.id)} unavailable={unavailable(method.id) ? '지금 쓸 수 없어요' : undefined} autoFocus={initialSelected === method.id && !unavailable(method.id)} onSelect={() => setSelected(method.id)} />)}
      </div>
      <div data-payment-actions style={{ flexShrink: 0, marginTop: 8, display: 'flex', gap: 24 }}>
        <Button purpose="decision" variant="Tertiary" onClick={onBack} style={{ width: 320, height: 128 }}>이전 · 장바구니</Button>
        <Button purpose="decision" variant="Primary" disabled={!selectedMethod || count === 0}
          onClick={() => { if (selectedMethod && count > 0) onContinue(selectedMethod.id) }}
          style={{ flex: 1, minWidth: 0, height: 128 }}>
          {selectedMethod ? selectedMethod.actionLabel : '결제 방법을 골라 주세요'}
        </Button>
      </div>
    </main>
    <UtilityBar lowScreen={lowScreen} onToggleLowScreen={onToggleLowScreen} />
  </div>
    {detailsOpen && <PaymentDetailsDialog items={items} lowScreen={lowScreen} onClose={() => setDetailsOpen(false)} />}
  </>
}
