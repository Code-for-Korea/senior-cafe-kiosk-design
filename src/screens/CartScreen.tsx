import { orderMethodLabels, type OrderMethod } from '../orderMethod'
import { layout, layer, scrollMetrics, progressMetrics } from '../design-system/metrics'
import GuideCue from '../voice/GuideCue'
import CartSoldOutBox from '../components/CartSoldOutBox'
import { useSoldOut } from '../soldOut'
import { dialogVoice, orderGuide } from '../voice/guides'
import { useEffect, useRef, useState } from 'react'
import { colors, font, radius, space } from '../tokens'
import type { OrderState } from '../types'
import { canEditOption, type MenuItem } from '../menuData'
import { won } from '../orderPricing'
import { cartTotals, cartRemovalSelection, eul, findSameCartItem } from '../cartSelection'
import CartItemCard from '../components/CartItemCard'
import CartEmpty from '../components/CartEmpty'
import CartCheckbox from '../components/CartCheckbox'
import type { OptionChangeHistory, OptionStepKey } from '../selectionSummary'
import CartOptionDialog from '../components/CartOptionDialog'
import Icon, { TrailingChevron } from '../components/Icon'
import ProgressStep from '../components/ProgressStep'
import UtilityBar from '../components/UtilityBar'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import { useTheme } from '../components/ThemeContext'
import { useType } from '../components/useType'
import { devParams } from '../devParams'

export interface CartEntry {
  id: number
  product: MenuItem
  order: OrderState
  quantity: number
  optionHistory?: OptionChangeHistory
  // 포장 결제 시 '개인컵으로 받기'로 고른 음료 줄. true면 한 잔당 500원 할인(디저트 제외).
  personalCup?: boolean
}

interface Props {
  items: CartEntry[]
  editResult?: { id: number; changes: string[] } | null
  onPrev: () => void
  onUpdateItemOrder: (id: number, order: OrderState) => void
  onChangeQuantity: (id: number, quantity: number) => void
  onRemove: (id: number) => void
  onRemoveMany: (ids: number[]) => void
  onConfirm: () => void
  orderMethod: OrderMethod
  onChangeOrderMethod: () => void
}

const CART_STEP = 4
/* 간격은 Elastic UI 크기 토큰(s 8 · m 12 · base 16 · l 24 · xl 32 · xxl 40)을 키오스크 글자 비율(약 2배)로 키운 것
   줄 안 요소 사이 24(l), 줄 위아래 32(xl), 구역 사이 32(xl), 판 안쪽 40(xxl) */
const ROW_GAP = 24


/* 빼기 확인 · 잘못 눌러 메뉴가 사라지지 않게 한 번 더 묻는다 */
function RemoveConfirm({ item, onCancel, onConfirm }: { item: CartEntry; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      titleId="remove-confirm-title"
      voice={dialogVoice.remove}
      title={<>{eul(`${item.product.name}${item.quantity > 1 ? ` ${item.quantity}개` : ''}`)}<br />장바구니에서 뺄까요?</>}
      message="고른 내용과 수량도 함께 지워져요."
      cancelLabel="아니요" confirmLabel="빼기" destructive
      onCancel={onCancel} onConfirm={onConfirm}
    />
  )
}

/* 장바구니 · 메뉴 목록만 스크롤하고 합계와 다음 행동은 하단에 유지한다. */
export default function CartScreen({ items, editResult, onPrev, onUpdateItemOrder, onChangeQuantity, onRemove, onRemoveMany, onConfirm, orderMethod, onChangeOrderMethod }: Props) {
  const t = useType()
  const theme = useTheme()
  const [removeId, setRemoveId] = useState<number | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [removalIds, setRemovalIds] = useState<number[]>([])
  const [confirmBulkRemoval, setConfirmBulkRemoval] = useState(false)
  // 담은 뒤 품절된 메뉴는 맨 위 칸에 모으고, 뺄 때까지 결제를 막는다(S40-SOLDOUT).
  const isSoldOut = useSoldOut()
  const soldOutItems = items.filter(item => isSoldOut(item.product.id))
  const orderableItems = items.filter(item => !isSoldOut(item.product.id))
  const [editing, setEditing] = useState<{ id: number; option?: OptionStepKey } | null>(() => {
    const option = devParams.cartOption
    const item = option ? items.find(entry => canEditOption(entry.product, option)) : undefined
    return item && option ? { id: item.id, option } : null
  })
  const editingItem = editing ? items.find(item => item.id === editing.id) : undefined
  const { count, total } = cartTotals(items)
  const { selectedIds, selectedCount, allSelected, partiallySelected } = cartRemovalSelection(items, removalIds)
  const exitDeleteMode = () => {
    setConfirmBulkRemoval(false)
    setRemovalIds([])
    setDeleteMode(false)
  }
  const removing = items.find((item) => item.id === removeId) ?? null
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  useEffect(() => {
    const list = scrollRef.current
    const content = contentRef.current
    if (!list || !content) return
    const updateHint = () => {
      const below = list.scrollTop + list.clientHeight < list.scrollHeight - 2
      if (list.scrollTop > 8) setHasScrolled(true)
      setCanScrollDown(below)
    }
    const observer = new ResizeObserver(updateHint)
    observer.observe(list)
    observer.observe(content)
    list.addEventListener('scroll', updateHint, { passive: true })
    updateHint()
    return () => { observer.disconnect(); list.removeEventListener('scroll', updateHint) }
  }, [])

  return (
    <div style={{
      width: layout.width, height: layout.height, overflow: 'hidden', background: theme.page,
      display: 'flex', flexDirection: 'column', margin: '0 auto', position: 'relative',
    }}>
      <GuideCue guide={orderGuide(deleteMode ? 'cart-delete' : soldOutItems.length ? 'cart-soldout' : items.length ? 'cart' : 'cart-empty')} />
      <header data-cart-header style={{
        flexShrink: 0, padding: `${layout.progressTop}px ${space.page}px ${items.length > 0 ? space.xs : space.xl}px`,
        display: 'flex', flexDirection: 'column', gap: space.sm,
      }}>
        <ProgressStep current={CART_STEP} />

        <h1 style={{ ...t.title, margin: `${space.xs + progressMetrics.spaceBelow}px 0 0`, color: colors.textPrimary }}>
          {deleteMode ? '뺄 메뉴를 선택해 주세요' : '주문 내용을 확인해 주세요'}
        </h1>

        {/* 항목명과 현재 값을 묶고 변경 행동은 오른쪽에서 구분한다. */}
        <div data-cart-order-method style={{
          display: 'flex', alignItems: 'center', gap: ROW_GAP,
          minHeight: 112, flexShrink: 0,
        }}>
          <dl style={{ margin: 0, flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: space.md }}>
            <dt style={{ ...t.readable(t.body), color: colors.textSecondary }}>이용 방법</dt>
            <dd style={{ ...t.inlineValue, margin: 0, fontWeight: font.medium, color: colors.textPrimary }}>
              {orderMethodLabels[orderMethod]}
            </dd>
          </dl>
          <button type="button" aria-label="이용 방법 바꾸기" disabled={deleteMode} onClick={onChangeOrderMethod} style={{
            ...t.bodyButton, color: colors.textPrimary, background: 'transparent',
            border: 0,
            minHeight: 80, padding: '12px 0 12px 24px', display: 'inline-flex', alignItems: 'center', gap: 8,
            flexShrink: 0, visibility: deleteMode ? 'hidden' : 'visible', cursor: 'pointer',
          }}>바꾸기<TrailingChevron color={colors.textPrimary} /></button>
        </div>

        {items.length > 0 && <div data-cart-removal-toolbar style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          gap: space.md, minHeight: 96, flexShrink: 0, padding: '8px 0', boxSizing: 'border-box',
          background: 'transparent',
        }}>
          {deleteMode && <CartCheckbox label="전체 선택" checked={allSelected} mixed={partiallySelected}
            onChange={(checked) => setRemovalIds(checked ? items.map(item => item.id) : [])} />}
          <button type="button" data-voice-action={deleteMode ? 'cart-remove-cancel' : undefined} onClick={deleteMode ? exitDeleteMode : () => { setRemovalIds([]); setDeleteMode(true) }} style={{
            ...t.bodyButton, fontSize: deleteMode ? t.bodyButton.fontSize : t.readable(t.body).fontSize,
            color: deleteMode ? colors.textPrimary : colors.textSecondary, background: 'transparent',
            border: 0, borderRadius: 12,
            minHeight: 80, padding: '12px 24px 12px 0', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>{deleteMode && <span aria-hidden="true">×</span>}{deleteMode ? '선택 취소' : '여러 개 빼기'}
            {!deleteMode && <Icon name="chevronRight" size={24} color={colors.textSecondary} />}
          </button>
        </div>}

      </header>

      <div data-cart-list-viewport style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
      <div ref={scrollRef} data-voice-scroll-viewport className="kiosk-scroll-list" id="cart-menu-list" data-cart-scroll role="region" aria-label="담은 메뉴 목록" tabIndex={0} style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', position: 'relative',
        padding: `0 ${space.page - 16}px ${space.md}px ${space.page}px`, scrollPaddingBottom: 144,
      }}>
        {/* 목록은 고정된 합계 영역과 겹치지 않는 별도 스크롤 공간을 사용한다. */}
        <section ref={contentRef} data-voice-scroll-content aria-label="담은 메뉴" style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <CartSoldOutBox items={soldOutItems} onRemove={onRemove} />
          {orderableItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              deleteMode={deleteMode}
              checked={selectedIds.includes(item.id)}
              onSelect={(checked) => setRemovalIds(ids => checked ? [...ids.filter(id => id !== item.id), item.id] : ids.filter(id => id !== item.id))}
              savedChanges={editResult?.id === item.id ? editResult.changes : undefined}
              onEdit={item.product.kind === '디저트' ? undefined : () => setEditing({ id: item.id })}
              onChangeQuantity={(quantity) => onChangeQuantity(item.id, quantity)}
              onRemove={() => setRemoveId(item.id)}
            />
          ))}
        </section>

      </div>

      {canScrollDown && <div data-cart-scroll-more style={{
        // 그림자는 목록 안에서 끝내 하단 고정 영역에 어두운 띠가 생기지 않게 한다.
        position: 'absolute', bottom: 0, left: 0, right: 0, height: scrollMetrics.menuShadeHeight, zIndex: layer.scrollShade,
        background: 'linear-gradient(to bottom, transparent 5%, var(--scroll-shadow) 100%)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 20,
        boxSizing: 'border-box', pointerEvents: 'none',
      }}>
        {!hasScrolled && <span data-scroll-instruction style={{
          ...t.readable(t.body), color: colors.textSecondary,
          background: theme.page, padding: '12px 28px', borderRadius: radius.pill,
          minHeight: 80, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', gap: 12,
        }}>아래로 내리면 메뉴가 더 보여요 <span aria-hidden="true">↓</span></span>}
      </div>}
      {items.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${space.page}px 120px` }}>
        <CartEmpty onShowMenu={onPrev} />
      </div>}
      </div>

      <div data-cart-actions style={{
        flexShrink: 0, padding: `${space.md}px ${space.page}px ${space.lg}px`,
        background: theme.surface,
        display: 'flex', flexDirection: 'column', gap: space.md,
      }}>
        {deleteMode ? <div style={{ minHeight: 72, display: 'flex', alignItems: 'center' }}>
          <p id="cart-removal-help" role="status" style={{ ...t.readable(t.body), margin: 0, color: colors.textSecondary }}>
            {selectedCount === 0 ? '뺄 메뉴를 선택해 주세요.' : `선택한 메뉴 ${selectedCount}개를 뺍니다.`}
          </p>
        </div> : <div style={{ minHeight: 72, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md }}>
          <span style={{ ...t.inlineValue, color: colors.textPrimary }}>총 {count}개</span>
          <span style={{ ...t.title, color: colors.textPrimary }}>{won(total)}</span>
        </div>}
        {/* 말풍선 없음: 제목과 버튼 글자가 같은 말을 한다(사용자 2026-10-20). 음성은 그대로. */}

        {deleteMode ? <Button purpose="decision" variant="Destructive" voiceAction="cart-remove-selected" disabled={selectedCount === 0} ariaDescribedBy="cart-removal-help"
          style={{ minHeight: 128, height: 'auto' }}
          onClick={() => setConfirmBulkRemoval(true)}>선택한 메뉴 빼기 · {selectedCount}개</Button>
        : <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
          {items.length > 0 && <Button purpose="decision" variant="Tertiary" voiceAction="cart-more" onClick={onPrev} style={{ width: 280, height: 'auto', minHeight: 128 }}>메뉴 더 고르기</Button>}
          <Button purpose="decision" variant="Primary" voiceAction="cart-pay" disabled={items.length === 0 || soldOutItems.length > 0} onClick={onConfirm} style={{ flex: 1, minWidth: 0, height: 'auto', minHeight: 128, padding: '20px 24px' }}>
            <span style={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}>{won(total)} · 결제 방법 고르기</span>
          </Button>
        </div>}
      </div>

      <UtilityBar showDivider={false} />

      {editing && editingItem && <CartOptionDialog key={`${editing.id}-${editing.option}`} item={editingItem} option={editing.option}
        onCancel={() => setEditing(null)}
        onApply={(order) => { onUpdateItemOrder(editing.id, order); setEditing(null) }}
        sameItem={order => findSameCartItem(items, editingItem.product, order, editingItem.id)}
      />}

      {confirmBulkRemoval && selectedCount > 0 && <ConfirmDialog
        titleId="bulk-remove-confirm-title"
        voice={dialogVoice.remove}
        title={<>선택한 메뉴 {selectedCount}개를<br />장바구니에서 뺄까요?</>}
        message="고른 내용과 수량도 함께 지워져요."
        cancelLabel="아니요" confirmLabel="빼기" destructive
        onCancel={exitDeleteMode}
        onConfirm={() => { onRemoveMany(selectedIds); exitDeleteMode() }}
      />}

      {removing && (
        <RemoveConfirm item={removing} onCancel={() => setRemoveId(null)} onConfirm={() => { onRemove(removing.id); setRemoveId(null) }} />
      )}
    </div>
  )
}
