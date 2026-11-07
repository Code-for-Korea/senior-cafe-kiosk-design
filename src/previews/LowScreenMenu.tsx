import LowMenuCard from '../components/LowMenuCard'
import Button from '../components/Button'
import { lowScreenActionLayout as actionLayout } from '../components/lowScreenActionStyles'
import { layout, shadow as shadows } from '../design-system/metrics'
import { useLowScreenUtilities } from '../components/useLowScreenUtilities'
import { useState } from 'react'
import { AppControlsProvider, useAppControls } from '../components/AppControlsContext'
import { useType } from '../components/useType'
import { useTheme } from '../components/ThemeContext'
import UtilityBarVariant from '../components/UtilityBarVariant'
import './low-screen-menu.css'
import LowScreenHeader from '../components/LowScreenHeader'
import FilterChip from '../components/FilterChip'
import Icon from '../components/Icon'
import { lightColorVariables, highContrastColorVariables } from '../colorSystem'
import { radius, space } from '../tokens'
import { devParams } from '../devParams'
import { temperatureFilters, temperatureFilterLabels, temperatureFilterWidths, availableKindFilters, availableDessertFilters } from '../menuData'
import type { KindFilter, DessertFilter, TemperatureFilter } from '../menuData'
import { useKioskScale } from '../hooks/useKioskScale'
import SearchPanel from '../components/SearchPanel'
import type { MenuItem } from '../menuData'
import type { Temperature } from '../types'
import { won } from '../orderPricing'
import { menuCatalog, useMenuLoad } from '../menuLoad'
import { MenuEmpty, MenuLoadFailed, MenuLoadingNotice, MenuSkeletonCards, MenuSkeletonChips } from '../components/MenuListStates'
import GuideCue from '../voice/GuideCue'
import { orderGuide } from '../voice/guides'

// Isolated layout study: menu selection opens the low-screen product study.
export default function LowScreenMenu() {
  const [largeText, setLargeText] = useState(devParams.largeText)
  const [highContrast, setHighContrast] = useState(devParams.highContrast)
  const [withCart, setWithCart] = useState(!new URLSearchParams(window.location.search).has('cart') || devParams.cartIds.length > 0)
  const { scale } = useKioskScale(64)
  const cart = withCart ? '1,2' : ''
  const openCurrent = (screen: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ screen, large: largeText ? '1' : '0', cart, ...extra })
    if (screen === 'product') { params.set('compare', 'low-product'); params.set('hc', highContrast ? '1' : '0') }
    window.location.assign(`/?${params}`)
  }
  return <AppControlsProvider value={{ largeText, highContrast, toggleLargeText: () => setLargeText(v => !v), toggleHighContrast: () => setHighContrast(v => !v), staffPending: false, onHome: () => openCurrent('method'), onStaff: () => openCurrent('menu', { dialog: 'staff' }) }}>
    <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#fff', color: '#222', fontSize: 16 }}>
      <strong>낮은 화면 · 메뉴 배치 시안</strong>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={withCart} onChange={e => setWithCart(e.target.checked)} />장바구니 2개 예시</label>
      <button onClick={() => openCurrent('menu')} style={{ border: '1px solid #bbb', borderRadius: 8, padding: '6px 12px', background: 'white', cursor: 'pointer' }}>현재 화면 비교 ↗</button>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', background: '#202020', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ width: layout.width * scale, height: layout.height * scale }}>
        <div id="kiosk-canvas" data-typography="figma" data-color-mode={highContrast ? 'hc' : 'light'} style={{ ...(highContrast ? highContrastColorVariables : lightColorVariables), width: layout.width, height: layout.height, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', background: 'var(--bg-page)' }}>
          <LowMenuScreen cartCount={withCart ? 2 : 0} cartTotal={9900} onSelectItem={(item, temperature) => openCurrent('product', { product: item.id, ...(temperature ? { temp: temperature } : {}) })} onOpenCart={() => openCurrent('cart')} onExitLowScreen={() => openCurrent('menu')} />
        </div>
      </div>
    </div>
  </AppControlsProvider>
}

export function LowMenuScreen({ cartCount, cartTotal, onSelectItem, onOpenCart, onExitLowScreen }: {
  cartCount: number; cartTotal: number; onSelectItem: (item: MenuItem, temperature?: Temperature) => void;
  onOpenCart: () => void; onExitLowScreen: () => void;
}) {
  const controls = useAppControls()
  const { largeText, highContrast } = controls
  const withCart = cartCount > 0
  const [searchOpen, setSearchOpen] = useState(false)
  const t = useType()
  const theme = useTheme()
  const [temperature, setTemperature] = useState<TemperatureFilter>('전체')
  const [kind, setKind] = useState<KindFilter>('모든 종류')
  const [dessert, setDessert] = useState<DessertFilter>('조각케이크')
  const [page, setPage] = useState(0)
  // 메뉴를 받는 동안은 골격과 알약, 받지 못하면 다시 불러오기(일반 화면과 같다, menuLoad.ts).
  const menuLoad = useMenuLoad()
  const loading = menuLoad.status === 'loading', failed = menuLoad.status === 'failed', ready = menuLoad.status === 'ready'
  const filtered = menuCatalog.filter(item => {
    if (temperature === '디저트') return item.kind === '디저트' && item.dessertKind === dessert
    if (item.kind === '디저트') return temperature === '전체' && kind === '모든 종류'
    if (temperature === '차가움' && !item.temp.includes('cold')) return false
    if (temperature === '따뜻함' && !item.temp.includes('hot')) return false
    return kind === '모든 종류' || item.kind === kind
  })
  const rows = withCart ? 2 : 3
  const pageSize = rows * 2
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const orderTemperature = temperature === '차가움' ? 'COLD' : temperature === '따뜻함' ? 'HOT' : null
  const utility = useLowScreenUtilities({ largeText, highContrast, onExitLowScreen })
  const pageButton = { ...t.bodyButton, height: 80, minWidth: 200, border: `1px solid ${theme.borderNeutral}`, borderRadius: radius.pill, background: theme.surface, color: 'var(--text-primary)', cursor: 'pointer' }
  return <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', color: 'var(--text-primary)', background: theme.page }}>
    {/* 늘어난 카테고리 간격32px는 상단 안내 여백에서 확보해 목록·장바구니 위치를 유지한다. */}
    <GuideCue guide={orderGuide(loading ? 'menu-loading' : failed ? 'menu-failed' : filtered.length ? 'menu' : 'menu-empty', false, { cartHasItems: withCart, staffPending: controls.staffPending })} />
    <LowScreenHeader current={2} description="아래에서 메뉴를 골라 주세요." height={layout.lowHeaderHeight - space.lg} />
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 64px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div data-voice-heading style={{ height: 72, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 data-voice-menu-question style={{ ...t.title, margin: 0 }}>무엇을 주문하시겠어요?</h1>
        <button data-voice-action="search" disabled={!ready} onClick={() => setSearchOpen(true)} style={{ ...pageButton, minWidth: 208, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, ...(ready ? null : { color: theme.disabledText, background: theme.disabledBg, borderColor: theme.disabledBg, cursor: 'default' }) }}><Icon name="search" size={36} color={ready ? undefined : theme.disabledText} />검색하기</button>
      </div>
      <div style={{ marginTop: space.lg - space.compact, display: 'flex', gap: 0, flexShrink: 0 }}>
        {temperatureFilters.map(value => <FilterChip key={value} kind="tab" height={72} width={temperatureFilterWidths[value]} selected={temperature === value} onClick={() => { setTemperature(value); setKind('모든 종류'); setPage(0) }}>{temperatureFilterLabels[value]}</FilterChip>)}
      </div>
      <div style={{ marginTop: space.md - space.compact, display: 'flex', gap: 16, flexShrink: 0, minHeight: 72, visibility: failed ? 'hidden' : undefined }}>
        {loading ? <MenuSkeletonChips height={72} /> : temperature === '디저트' ? availableDessertFilters(menuCatalog).map(value => <FilterChip key={value} kind="chip" height={72} selected={dessert === value} onClick={() => { setDessert(value); setPage(0) }}>{value}</FilterChip>) : availableKindFilters(temperature, menuCatalog).map(value => <FilterChip key={value} kind="chip" height={72} selected={kind === value} onClick={() => { setKind(value); setPage(0) }}>{value}</FilterChip>)}
      </div>
      {/* 사진 사이 여백 = 카드 내부 위아래24px + 행 간격16px = 좌우 여백64px. */}
      {/* 담기 전후 카드 크기와 첫 두 줄 위치를 고정하고, 셋째 줄만 다음 페이지로 넘긴다. */}
      <div id="low-menu-list" role="region" aria-label="메뉴 목록" data-low-menu-list style={{ flex: '0 0 auto', height: rows * 208 + (rows - 1) * 16 + 12, paddingTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: `repeat(${rows}, 208px)`, gap: 16, alignContent: 'start', position: 'relative' }}>
        {loading && <MenuSkeletonCards count={pageSize} low />}
        {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><MenuLoadingNotice /></div>}
        {failed && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MenuLoadFailed onRetry={menuLoad.retry} /></div>}
        {ready && filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize).map(item => <LowMenuCard key={item.id} item={item} temperature={orderTemperature} onSelect={() => onSelectItem(item, orderTemperature)} />)}
        {ready && !filtered.length && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MenuEmpty onShowAll={() => { setTemperature('전체'); setKind('모든 종류'); setPage(0) }} /></div>}
      </div>
      {ready && pageCount > 1 && <nav aria-label="메뉴 페이지" style={{ height: 88, marginTop: 'auto', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
        <button aria-controls="low-menu-list" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} style={{ ...pageButton, color: currentPage === 0 ? theme.disabledText : 'var(--text-primary)', background: currentPage === 0 ? theme.disabledBg : theme.surface }}>‹ 이전</button>
        <span aria-live="polite" aria-atomic="true" style={{ ...t.body, minWidth: 120, textAlign: 'center' }}>{currentPage + 1} / {pageCount}</span>
        <button aria-controls="low-menu-list" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} style={{ ...pageButton, color: currentPage + 1 >= pageCount ? theme.disabledText : 'var(--text-primary)', background: currentPage + 1 >= pageCount ? theme.disabledBg : theme.surface }}>다음 ›</button>
      </nav>}
    </main>
    <div data-low-menu-cart style={{ height: withCart ? actionLayout.buttonHeight + actionLayout.paddingY * 2 : 32, flexShrink: 0, padding: withCart ? `${actionLayout.paddingY}px ${actionLayout.paddingX}px` : '12px 64px', position: 'relative', background: withCart ? theme.surface : 'transparent', boxShadow: withCart ? (highContrast ? shadows.actionBarHighContrast : shadows.actionBar) : 'none' }}>
      {withCart ? <Button purpose="decision" variant="Primary" onClick={onOpenCart} style={{ width: '100%', height: actionLayout.buttonHeight, padding: '0 32px' }} trailing={`${cartCount}개 · ${won(cartTotal)}`}>장바구니 보기</Button> : null}
    </div>
    <div className="low-menu-utility"><UtilityBarVariant grouped variant="vertical" controls={utility} showDivider={false} /></div>
    {/* 검색 중에는 보조 기능 줄까지 덮어 결과와 자판 공간을 확보한다. 닫으면 다시 드러난다. */}
    {searchOpen && <SearchPanel items={menuCatalog} onClose={() => setSearchOpen(false)} onSelect={item => { setSearchOpen(false); onSelectItem(item) }} />}
  </div>
}
