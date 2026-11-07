import type { CSSProperties } from 'react'
import type { CartEntry } from '../screens/CartScreen'
import { cartOptionLabels } from '../selectionSummary'
import { colors, font, space } from '../tokens'
import Button from './Button'
import Icon from './Icon'
import { useType } from './useType'

/** 기본·낮은 장바구니가 공유하는 옵션 요약과 단일 수정 진입점. */
export default function CartItemOptions({ item, onEdit, disabled = false, gap = space.md, style }: {
  item: CartEntry; onEdit?: () => void; disabled?: boolean; gap?: number; style?: CSSProperties
}) {
  const t = useType()
  const labels = cartOptionLabels(item.product, item.order)
  return <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
    <p data-cart-option-summary style={{ ...t.primary, fontWeight: font.medium, color: colors.textPrimary,
      margin: 0, lineHeight: 1.5, display: 'flex', flexWrap: 'wrap', gap: '8px 0' }}>
      {item.product.kind === '디저트' ? item.product.description : labels.map((label, index) => <span key={index} style={{ whiteSpace: 'nowrap' }}>
        {label}
        {index < labels.length - 1 && <span aria-hidden="true" style={{ marginInline: 12 }}>·</span>}
      </span>)}
    </p>
    {onEdit && <Button purpose="support" variant="Utility" size="small" ariaLabel={`${item.product.name} 선택 바꾸기`}
        ariaHasPopup="dialog" disabled={disabled} onClick={onEdit}>
        선택 바꾸기<Icon name="chevronRight" size={24} />
    </Button>}
  </div>
}
