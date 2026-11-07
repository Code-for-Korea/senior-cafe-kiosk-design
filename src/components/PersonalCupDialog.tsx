import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import CartCheckbox from './CartCheckbox'
import { useType } from './useType'
import { colors, space } from '../tokens'
import { won, entryUnitPrice, PERSONAL_CUP_DISCOUNT } from '../orderPricing'
import { cartTotals } from '../cartSelection'
import { cartOptionLabels } from '../selectionSummary'
import { dialogVoice } from '../voice/guides'
import type { CartEntry } from '../screens/CartScreen'

// 포장 결제에서 '개인컵 있어요'를 고른 뒤, 개인컵으로 받을 음료를 체크박스로 고르는 모달.
// 디저트는 할인 대상이 아니라 목록에 넣지 않는다. 고른 음료는 한 잔당 500원 할인된다.
export default function PersonalCupDialog({ items, lowScreen, onToggle, onConfirm, onCancel }: {
  items: CartEntry[]; lowScreen: boolean; onToggle: (id: number, checked: boolean) => void; onConfirm: () => void; onCancel: () => void
}) {
  const t = useType()
  const drinks = items.filter(item => item.product.kind !== '디저트')
  const totals = cartTotals(items)
  return <DialogFrame titleId="personal-cup-select-title" title="개인컵으로 받을 음료를 골라 주세요"
    message="고른 음료는 한 잔마다 500원 할인돼요." width={952} lowScreen={lowScreen} onDismiss={onCancel}
    voice={{ ...dialogVoice.personalCupSelect, target: '[data-dialog-actions]' }}>
    <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: space.md }}>
      <ul data-cup-list role="group" aria-label="개인컵으로 받을 음료" style={{ listStyle: 'none', margin: 0, padding: 0, minHeight: 0, maxHeight: lowScreen ? 480 : 760, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {drinks.map((item, index) => {
          const unit = entryUnitPrice(item)
          const options = cartOptionLabels(item.product, item.order).join(' · ')
          return <li key={item.id} data-cup-line={item.id} style={{ borderTop: index ? '1px solid var(--border-subtle)' : undefined, padding: '4px 0' }}>
            <CartCheckbox label={`${item.product.name} 개인컵으로 받기`} checked={!!item.personalCup} onChange={checked => onToggle(item.id, checked)}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 24, pointerEvents: 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...t.bodyButton, margin: 0, color: colors.textPrimary }}>{item.product.name}</p>
                  {options && <p style={{ ...t.body, margin: '4px 0 0', color: colors.textSecondary, wordBreak: 'keep-all' }}>{options}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {item.personalCup && <p style={{ ...t.body, margin: '0 0 4px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>개인컵 할인 −{won(PERSONAL_CUP_DISCOUNT * item.quantity)}</p>}
                  <strong style={{ ...t.primary, fontWeight: 700, color: colors.textPrimary, whiteSpace: 'nowrap' }}>{won(unit * item.quantity)}</strong>
                </div>
              </div>
            </CartCheckbox>
          </li>
        })}
        {drinks.length === 0 && <li style={{ ...t.body, color: colors.textSecondary, padding: '20px 0' }}>개인컵 할인을 받을 음료가 없어요.</li>}
      </ul>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, paddingTop: space.md, borderTop: '1px solid var(--border-subtle)', color: colors.textPrimary }}>
        <span style={t.bodyButton}>총 {totals.count}개 · 결제 금액</span>
        <strong style={{ ...t.title, fontWeight: 700, whiteSpace: 'nowrap' }}>{won(totals.total)}</strong>
      </div>
    </div>
    <div data-dialog-actions style={{ display: 'flex', gap: 24 }}>
      <Button purpose="support" variant="Tertiary" onClick={onCancel} style={{ width: 240, height: 128 }}>이전</Button>
      <Button purpose="support" variant="Primary" onClick={onConfirm} style={{ flex: 1, height: 128 }}>선택 완료 · 결제하기</Button>
    </div>
  </DialogFrame>
}
