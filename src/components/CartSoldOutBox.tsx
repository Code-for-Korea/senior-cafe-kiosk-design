import { menuCardMetrics } from '../design-system/metrics'
import { menuImage } from '../menuData'
import { colors, font, radius, space } from '../tokens'
import type { CartEntry } from '../screens/CartScreen'
import Button from './Button'
import Icon from './Icon'
import { useType } from './useType'

/* 담은 뒤 품절된 메뉴를 장바구니 맨 위 한 칸에 모은다(기획 S40-SOLDOUT, 사용자 P2 2026-10-20).
   문제와 해결 동작(빼기)을 한곳에 두고, 나머지 장바구니는 평소 그대로 둔다. 사진은 흑백(사용자). */
export default function CartSoldOutBox({ items, onRemove }: { items: CartEntry[]; onRemove: (id: number) => void }) {
  const t = useType()
  if (!items.length) return null
  return <section data-cart-soldout aria-label="주문할 수 없는 메뉴" style={{
    flexShrink: 0, display: 'flex', flexDirection: 'column', gap: space.md,
    padding: `${space.md}px ${space.lg}px`, borderRadius: radius.card,
    background: 'var(--warning-bg)', border: '2px solid var(--warning-border)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <Icon name="info" size={40} color="var(--warning-text)" />
      <h2 style={{ ...t.primary, fontWeight: font.bold, margin: 0, color: colors.textPrimary }}>주문할 수 없는 메뉴 {items.length}개</h2>
    </div>
    {items.map(item => <div key={item.id} data-cart-soldout-item style={{
      display: 'flex', alignItems: 'center', gap: space.md, padding: `${space.sm}px ${space.md}px`,
      borderRadius: 16, background: 'var(--bg-surface)',
    }}>
      <img src={menuImage(item.product, item.order.temperature)} alt="" style={{
        width: 112, height: 112, flexShrink: 0, borderRadius: 12, objectFit: 'contain', background: menuCardMetrics.imageBackground,
        filter: 'grayscale(1)', opacity: 0.45,
      }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.xs }}>
        <span style={{ ...t.primary, fontWeight: font.semibold, color: colors.textDisabled }}>{item.product.name}</span>
        <span style={{ ...t.readable(t.body), color: colors.textSecondary }}>품절 · 지금은 주문할 수 없어요</span>
      </div>
      <Button purpose="decision" variant="Tertiary" size="small" voiceAction="soldout-remove" ariaLabel={`${item.product.name} 빼기`}
        onClick={() => onRemove(item.id)} style={{ width: 200, minWidth: 200, flexShrink: 0 }}>빼기</Button>
    </div>)}
  </section>
}
