import { useOrderPricing } from './useOrderPricing'
import { menuCardMetrics } from '../design-system/metrics'
import { useEffect, useRef } from 'react'
import { colors, font, radius, space } from '../tokens'
import { menuImage } from '../menuData'
import { won, entryUnitPrice, cupDiscount } from '../orderPricing'
import type { CartEntry } from '../screens/CartScreen'
import CartItemOptions from './CartItemOptions'
import CartCheckbox from './CartCheckbox'
import QuantityStepper from './QuantityStepper'
import Icon from './Icon'
import { useTheme } from './ThemeContext'
import { useType } from './useType'

const PHOTO = 144
const ROW_GAP = 24
const ROW_PADDING = 32
const PANEL_PADDING = 40
// 사진→옵션 글자, 옵션 글자→선택 바꾸기, 선택 바꾸기→수량이 눈에 같은 간격(45)으로 보이게 한 값.
// 옵션 글자 줄 안의 위아래 여백(11·12)만큼 글자 쪽 상자 간격을 줄였다. 큰 글씨에서도 46·46·45로 거의 같다.
const STACK_GAPS = { options: 34, edit: 33, quantity: 45 }

/* 메뉴마다 하나의 surface: 상품 식별·단가 → 옵션 → 수량과 메뉴 소계(구분선 없이 간격으로 나눈다) */
export default function CartItemCard({ item, onEdit, onChangeQuantity, onRemove, onSelect = () => {}, deleteMode = false, checked = false, savedChanges }: {
  item: CartEntry; deleteMode?: boolean; checked?: boolean; onSelect?: (selected: boolean) => void; onEdit?: () => void; onChangeQuantity: (q: number) => void; onRemove: () => void; savedChanges?: string[]
}) {
  const { priceText } = useOrderPricing()
  const t = useType()
  const theme = useTheme()
  const rowRef = useRef<HTMLDivElement>(null)
  const wasEdited = savedChanges !== undefined
  useEffect(() => {
    const row = rowRef.current
    if (!wasEdited || !row) return
    const list = row.closest<HTMLElement>('[data-cart-scroll]')
    // 축소 미리보기의 바깥 문서까지 움직이지 않고, 상품 목록만 이동한다.
    list?.scrollTo({ top: Math.max(0, row.offsetTop - space.md) })
  }, [wasEdited])
  const unit = entryUnitPrice(item)
  const lineTotal = unit * item.quantity
  const cupOff = cupDiscount(item)

  return (
    <div ref={rowRef} data-cart-item={item.id} aria-label={`${item.product.name} 주문`} style={{
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      background: theme.surface, border: theme.panelBorder, borderRadius: radius.card,
      padding: `${ROW_PADDING}px ${PANEL_PADDING}px`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: ROW_GAP }}>
        <div style={{ position: 'relative', width: PHOTO, height: PHOTO, flexShrink: 0, borderRadius: 16, overflow: 'hidden', background: menuCardMetrics.imageBackground }}>
          {item.product.imageUrl && <img src={menuImage(item.product, item.order.temperature)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: item.product.imagePosition ?? 'center' }} />}
          {deleteMode && <CartCheckbox label={`${item.product.name} 삭제 선택`} checked={checked} onChange={onSelect} overlay />}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xs }}>
          <h2 style={{ ...t.title, fontWeight: font.semibold, margin: 0, color: colors.textPrimary }}>{item.product.name}</h2>
          <div data-cart-price-summary style={{ ...t.readable(t.body), color: colors.textSecondary }}>
            기본 가격 <span data-cart-base-price style={{ whiteSpace: 'nowrap' }}>{priceText(item.product)}</span>
          </div>
        </div>
        <button type="button" hidden={deleteMode} onClick={onRemove} aria-label={`${item.product.name} 메뉴 빼기`} style={{
          color: colors.textPrimary, background: colors.bgDisabled, border: 0, borderRadius: '50%',
          width: 64, height: 64, padding: 8, flexShrink: 0, cursor: 'pointer', alignSelf: 'flex-start',
          display: deleteMode ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="close" size={40} color={colors.textPrimary} optical="utility" /></button>
      </div>

      <CartItemOptions item={item} onEdit={onEdit} disabled={deleteMode} gap={STACK_GAPS.edit} style={{ marginTop: STACK_GAPS.options }} />

      <div style={{ marginTop: STACK_GAPS.quantity, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <QuantityStepper value={item.quantity} onChange={onChangeQuantity} disabled={deleteMode} readable />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {cupOff > 0 && <span data-cart-cup-discount style={{ ...t.readable(t.body), color: colors.textSecondary, whiteSpace: 'nowrap' }}>개인컵 할인 −{won(cupOff * item.quantity)}</span>}
          <span data-cart-subtotal aria-label={`메뉴 소계 ${won(lineTotal)}`} aria-live="polite" style={{ ...t.title, color: colors.textPrimary, whiteSpace: 'nowrap' }}>{won(lineTotal)}</span>
        </div>
      </div>
    </div>
  )
}
