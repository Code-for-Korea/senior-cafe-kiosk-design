import { useOrderPricing } from './useOrderPricing'
import { layer, scrollMetrics } from '../design-system/metrics'
import { useEffect, useRef, useState } from 'react'
import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import { useType } from './useType'
import { dialogVoice } from '../voice/guides'
import { colors, radius } from '../tokens'
import { menuImage } from '../menuData'
import { won, entryUnitPrice } from '../orderPricing'
import { optionSteps } from '../selectionSummary'
import type { CartEntry } from '../screens/CartScreen'

export default function PaymentDetailsDialog({ items, lowScreen, onClose }: {
  items: CartEntry[]
  lowScreen: boolean
  onClose: () => void
}) {
  const { cartTotals } = useOrderPricing()
  const t = useType()
  const contentPaddingX = 40
  const totals = cartTotals(items)
  const listRef = useRef<HTMLDivElement>(null)
  const [moreBelow, setMoreBelow] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const updateScrollHint = () => {
    const list = listRef.current
    if (list) {
      if (list.scrollTop > 8) setHasScrolled(true)
      setMoreBelow(list.scrollHeight - list.clientHeight - list.scrollTop > 4)
    }
  }
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new ResizeObserver(updateScrollHint)
    observer.observe(list)
    if (list.firstElementChild) observer.observe(list.firstElementChild)
    updateScrollHint()
    return () => observer.disconnect()
  }, [items, lowScreen, t.largeText])

  return <DialogFrame titleId="payment-details-title" title="결제 금액 내역" width={952} contentPaddingX={contentPaddingX} lowScreen={lowScreen} onDismiss={onClose} voice={{ ...dialogVoice.paymentDetails, target: '[data-voice-action="dialog-close"]' }}>
    <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={listRef} data-payment-details-list role="region" aria-label="메뉴별 결제 내역" tabIndex={0} onScroll={updateScrollHint}
        style={{ minHeight: 0, maxHeight: lowScreen ? 540 : 840, overflowY: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable', paddingRight: 12 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item, index) => {
            const price = entryUnitPrice(item)
            const options = optionSteps(item.order, { product: item.product, current: 'review', onEdit: {} })
              .map(option => option.value?.replace(/\u00a0/g, ' ')).filter(Boolean).join(' / ')
            const image = menuImage(item.product, item.order.temperature)
            return <li key={item.id} data-payment-line={item.id} style={{ padding: '24px 0', borderTop: index ? '1px solid var(--border-subtle)' : undefined, display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              {image && <img data-payment-thumbnail src={image} alt="" width={144} height={144}
                style={{ width: 144, height: 144, flexShrink: 0, objectFit: 'contain', objectPosition: item.product.imagePosition ?? 'center' }} />}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24 }}>
                  <h2 style={{ ...t.primary, margin: 0, color: colors.textPrimary, wordBreak: 'keep-all' }}>{item.product.name}</h2>
                  <strong data-payment-line-total style={{ ...t.primary, fontWeight: 700, color: colors.textPrimary, whiteSpace: 'nowrap' }}>{won(price * item.quantity)}</strong>
                </div>
                {options && <p style={{ ...t.body, margin: 0, color: colors.textSecondary, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{options}</p>}
                <p style={{ ...t.body, margin: 0, color: colors.textPrimary }}>1개 {won(price)} × {item.quantity}개</p>
              </div>
            </li>
          })}
          {items.length === 0 && <li style={{ ...t.body, color: colors.textSecondary }}>담은 메뉴가 없어요.</li>}
        </ul>
      </div>
      <div data-payment-details-summary style={{ position: 'relative', flexShrink: 0, paddingTop: 24, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, color: colors.textPrimary }}>
        {moreBelow && <div data-payment-scroll-more style={{
          // 목록과 합계 사이 간격 없이, 그림자를 모달 양끝까지 잇는다.
          position: 'absolute', bottom: '100%', left: -contentPaddingX, right: -contentPaddingX, height: scrollMetrics.menuShadeHeight, zIndex: layer.scrollShade,
          background: 'linear-gradient(to bottom, transparent 5%, var(--scroll-shadow) 100%)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 20,
          boxSizing: 'border-box', pointerEvents: 'none',
        }}>
          {!hasScrolled && <span data-scroll-instruction style={{
            ...t.body, color: colors.textSecondary,
            background: colors.bgPage, padding: '12px 28px', borderRadius: radius.pill,
            minHeight: 80, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: 12,
          }}>아래로 내리면 내역이 더 보여요 <span aria-hidden="true">↓</span></span>}
        </div>}
        <span style={t.bodyButton}>총 {totals.count}개 · 결제 금액</span>
        <strong data-payment-details-total style={{ ...t.title, fontWeight: 700, whiteSpace: 'nowrap' }}>{won(totals.total)}</strong>
      </div>
    </div>
    <Button purpose="support" variant="Primary" voiceAction="dialog-close" onClick={onClose} style={{ width: '100%', height: 128, flexShrink: 0 }}>확인</Button>
  </DialogFrame>
}
