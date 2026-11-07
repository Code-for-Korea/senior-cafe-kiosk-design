import { orderMethodLabels } from '../orderMethod'
import { layout, shadow as shadows } from '../design-system/metrics'
import { lowScreenActionLayout as actionLayout } from '../components/lowScreenActionStyles'
import { useLowScreenUtilities } from '../components/useLowScreenUtilities'
import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { AppControlsProvider, useAppControls } from '../components/AppControlsContext'
import { useType } from '../components/useType'
import { useTheme } from '../components/ThemeContext'
import { useKioskScale } from '../hooks/useKioskScale'
import { lightColorVariables, highContrastColorVariables } from '../colorSystem'
import { devParams } from '../devParams'
import { menuItems } from '../menuData'
import { defaultOrder } from '../orderDefaults'
import { applyCartEdit, cartTotals, findSameCartItem } from '../cartSelection'
import { MAX_QUANTITY } from '../components/QuantityStepper'
import { won } from '../orderPricing'
import CartItemCard from '../components/CartItemCard'
import CartEmpty from '../components/CartEmpty'
import ScrollBottomShade from '../components/ScrollBottomShade'
import type { CartEntry } from '../screens/CartScreen'
import LowScreenHeader from '../components/LowScreenHeader'
import UtilityBarVariant from '../components/UtilityBarVariant'
import CartOptionDialog from '../components/CartOptionDialog'
import OrderMethodDialog, { type OrderMethod } from '../components/OrderMethodDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import Button from '../components/Button'
import './low-screen-menu.css'
import GuideCue from '../voice/GuideCue'
import CartSoldOutBox from '../components/CartSoldOutBox'
import { useSoldOut } from '../soldOut'
import { dialogVoice, orderGuide } from '../voice/guides'
import { chevronGlyphEndInset } from '../components/Icon'

function sampleCart(): CartEntry[] {
  const product = (id: string) => menuItems.find(item => item.id === id)!
  return [
    { id: 1, product: product('2'), quantity: 2, order: { ...defaultOrder, temperature: 'COLD', sizeCode: 'L', caffeineType: 'DECAF', iceAmount: 'LESS' } },
    { id: 2, product: product('5'), quantity: 1, order: { ...defaultOrder, temperature: 'COLD' } },
    { id: 3, product: product('4'), quantity: 1, order: { ...defaultOrder } },
  ]
}

// Isolated layout study; no live cart, checkout, or staff request is changed.
export default function LowScreenCartStudy() {
  const [largeText, setLargeText] = useState(devParams.largeText)
  const [highContrast, setHighContrast] = useState(devParams.highContrast)
  const [notice, setNotice] = useState('배치 시안 · 실제 주문 흐름에는 아직 연결하지 않았어요.')
  const [revision, setRevision] = useState(0)
  const { scale } = useKioskScale(64)
  const previewOnly = () => setNotice('배치 시안에서 확인 중이에요. 이 기능의 연결은 다음 단계에서 진행해요.')
  return <AppControlsProvider value={{ largeText, highContrast, toggleLargeText: () => setLargeText(value => !value), toggleHighContrast: () => setHighContrast(value => !value), staffPending: false, onHome: previewOnly, onStaff: previewOnly }}>
    <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 12px', background: '#fff', color: '#222', fontSize: 14 }}>
      <strong>낮은 장바구니 시안</strong>
      <span role="status" style={{ flex: '0 1 auto' }}>{notice}</span>
      <button onClick={() => { setRevision(value => value + 1); setNotice('처음 시안으로 돌아왔어요.') }}>시안 초기화</button>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', background: '#202020', minHeight: 'calc(100dvh - 64px)' }}>
      <div style={{ width: layout.width * scale, height: layout.height * scale }}>
        <div id="kiosk-canvas" data-typography="figma" data-color-mode={highContrast ? 'hc' : 'light'} style={{ ...(highContrast ? highContrastColorVariables : lightColorVariables), position: 'relative', width: layout.width, height: layout.height, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', background: 'var(--bg-page)' }}>
          <CartStudy key={revision} onPreviewAction={previewOnly} onCheckout={() => setNotice('결제 연결 전 시안이에요. 고른 메뉴는 그대로 유지돼요.')} />
        </div>
      </div>
    </div>
  </AppControlsProvider>
}

function CartStudy({ onPreviewAction, onCheckout }: { onPreviewAction: () => void; onCheckout: () => void }) {
  const [items, setItems] = useState(sampleCart)
  const [method, setMethod] = useState<OrderMethod>('DINE_IN')
  return <LowCartScreen items={items} setItems={setItems} method={method} onMethodChange={setMethod} onBack={onPreviewAction} onExitLowScreen={onPreviewAction} onCheckout={onCheckout} />
}

export function LowCartScreen({ items, setItems, method, onMethodChange, onBack, onExitLowScreen, onCheckout, focusItemId }: {
  items: CartEntry[]; setItems: Dispatch<SetStateAction<CartEntry[]>>; method: OrderMethod; onMethodChange: (method: OrderMethod) => void;
  onBack: () => void; onExitLowScreen: () => void; onCheckout: () => void;
  focusItemId?: number  // 같은 메뉴를 더 담았으면 그 메뉴 쪽을 먼저 보여 준다
}) {
  const t = useType()
  const theme = useTheme()
  const controls = useAppControls()
  const [page, setPage] = useState(() => Math.max(0, items.findIndex(entry => entry.id === focusItemId)))
  const [methodOpen, setMethodOpen] = useState(false)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const [editing, setEditing] = useState<{ id: number } | null>(null)
  const currentPage = Math.min(page, Math.max(0, items.length - 1))
  const item = items[currentPage]
  const removing = items.find(entry => entry.id === removeId)
  const edited = items.find(entry => entry.id === editing?.id)
  const isSoldOut = useSoldOut()
  const soldOutItems = items.filter(entry => isSoldOut(entry.product.id))
  const { count, total } = cartTotals(items)
  const textAction = { ...t.bodyButton, minHeight: 72, border: 0, padding: '0 8px', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }
  const utility = useLowScreenUtilities({ onExitLowScreen })
  return <>
    <GuideCue guide={orderGuide(soldOutItems.length ? 'cart-soldout' : items.length ? 'cart' : 'cart-empty')} />
    <div data-low-cart style={{ width: layout.width, height: layout.height, display: 'flex', flexDirection: 'column', background: theme.page, color: 'var(--text-primary)' }}>
      {/* 메뉴 화면과 같은 상단 여백으로 기본 카드의 25px 초과를 해소한다. 긴 옵션은 계속 스크롤한다. */}
      <LowScreenHeader current={4} description="아래에서 주문 내용을 확인해 주세요." height={layout.lowHeaderHeight - 32} />
      <main aria-label="장바구니" data-low-cart-main style={{ flex: 1, minHeight: 0, padding: '16px 64px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div data-low-cart-heading style={{ minHeight: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 32 }}>
          <h1 style={{ ...t.title, margin: 0, flexShrink: 0 }}>장바구니</h1>
          <div role="group" aria-label="이용 방법" data-low-cart-method style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ ...t.inlineValue, whiteSpace: 'nowrap' }}>{orderMethodLabels[method]}</span>
            <button style={{ ...textAction, ...t.readable(t.caption), fontWeight: 600, minWidth: 128, padding: `0 ${chevronGlyphEndInset}px 0 0`, textAlign: 'right', flexShrink: 0 }} onClick={() => setMethodOpen(true)} aria-label="이용 방법 바꾸기">바꾸기 ›</button>
          </div>
        </div>
        {/* 낮은 화면은 메뉴를 한 장씩 넘겨 보므로, 품절 메뉴가 있으면 그 칸을 먼저 보여 주고 뺀 뒤 원래 페이지로. */}
        {soldOutItems.length > 0 ? <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}><CartSoldOutBox items={soldOutItems} onRemove={id => setItems(current => current.filter(entry => entry.id !== id))} /></div> : item ? <>
          <LowCartItem key={item.id} item={item}
            onEdit={item.product.kind === '디저트' ? undefined : () => setEditing({ id: item.id })}
            onRemove={() => setRemoveId(item.id)}
            onChangeQuantity={quantity => setItems(current => current.map(entry => entry.id === item.id ? { ...entry, quantity } : entry))} />
          {/* 메뉴 화면처럼 한 페이지뿐이면 넘김 줄을 숨긴다. */}
          {items.length > 1 && <nav aria-label="장바구니 메뉴 페이지" style={{ height: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <Button purpose="support" variant="Tertiary" size="small" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} style={{ height: 80, minWidth: 200 }}>‹ 이전</Button>
            <span style={t.readable(t.body)} aria-live="polite" aria-atomic="true">메뉴 {currentPage + 1} / {items.length}</span>
            <Button purpose="support" variant="Tertiary" size="small" disabled={currentPage === items.length - 1} onClick={() => setPage(currentPage + 1)} style={{ height: 80, minWidth: 200 }}>다음 ›</Button>
          </nav>}
        </> : <div style={{ flex: 1, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
          <CartEmpty onShowMenu={onBack} />
        </div>}
      </main>
      <section aria-label="전체 주문 합계와 결제" data-low-cart-actions style={{ flexShrink: 0, padding: `${actionLayout.paddingY}px ${actionLayout.paddingX}px`, background: theme.surface, boxShadow: controls.highContrast ? shadows.actionBarHighContrast : shadows.actionBar }}>
        <div aria-live="polite" aria-atomic="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, minHeight: 70 }}>
          <span style={t.inlineValue}>총 {count}개</span><strong style={t.title}>{won(total)}</strong>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {items.length > 0 && <Button purpose="decision" variant="Tertiary" voiceAction="cart-more" onClick={onBack} style={{ width: 320, height: actionLayout.buttonHeight }}>메뉴 더 고르기</Button>}
          <Button purpose="decision" variant="Primary" voiceAction="cart-pay" disabled={!items.length || soldOutItems.length > 0} onClick={onCheckout} style={{ flex: 1, height: actionLayout.buttonHeight }}>{won(total)} · 결제 방법 고르기</Button>
        </div>
      </section>
      <div className="low-menu-utility"><UtilityBarVariant grouped variant="vertical" controls={utility} showDivider={false} /></div>
    </div>
    {edited && editing && <CartOptionDialog key={edited.id} lowScreen item={edited} onCancel={() => setEditing(null)}
      sameItem={order => findSameCartItem(items, edited.product, order, edited.id)}
      onApply={order => {
        // 다른 줄과 합쳐지면 그 줄이 빠져 쪽 번호가 당겨질 수 있다. 고친 메뉴 쪽을 그대로 보여 준다.
        const next = applyCartEdit(items, edited.id, order, MAX_QUANTITY)
        setItems(next)
        setPage(Math.max(0, next.findIndex(entry => entry.id === edited.id)))
        setEditing(null)
      }} />}
    {methodOpen && <OrderMethodDialog lowScreen value={method} onCancel={() => setMethodOpen(false)} onApply={value => { onMethodChange(value); setMethodOpen(false) }} />}
    {removing && <ConfirmDialog lowScreen titleId="low-cart-remove" voice={dialogVoice.remove} title={`${removing.product.name} ${removing.quantity}개를 뺄까요?`} message="고른 내용과 수량도 함께 지워져요." cancelLabel="아니요" confirmLabel="빼기" destructive onCancel={() => setRemoveId(null)} onConfirm={() => {
      setItems(current => current.filter(entry => entry.id !== removing.id))
      setPage(currentPage)
      setRemoveId(null)
    }} />}
  </>
}

// 카드 내부의 크기·선·여백은 기본 화면과 공유하고, 낮은 화면은 보이는 영역만 제한한다.
function LowCartItem({ item, onEdit, onRemove, onChangeQuantity }: {
  item: CartEntry; onEdit?: () => void; onRemove: () => void; onChangeQuantity: (quantity: number) => void
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  return <div data-low-cart-item style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
    <div ref={viewport} data-cart-scroll data-voice-scroll-viewport className="kiosk-scroll-list" role="region"
      aria-label={`${item.product.name} 주문`} tabIndex={0}
      style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <div ref={content} data-voice-scroll-content>
        <CartItemCard item={item} onEdit={onEdit} onRemove={onRemove} onChangeQuantity={onChangeQuantity} />
      </div>
    </div>
    <ScrollBottomShade viewportRef={viewport} contentRef={content} />
  </div>
}
