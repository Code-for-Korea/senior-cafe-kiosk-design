import { layout, layer, motion, scrollMetrics, progressMetrics } from '../design-system/metrics'
import MenuCard from '../components/MenuCard'
import { useEffect, useRef, useState } from 'react'
import { colors, radius, space } from '../tokens'
import { useType } from '../components/useType'
import { useAppControls } from '../components/AppControlsContext'
import UtilityBar from '../components/UtilityBar'
import Icon from '../components/Icon'
import ProgressStep from '../components/ProgressStep'
import SearchPanel from '../components/SearchPanel'
import Button from '../components/Button'
import FilterChip from '../components/FilterChip'
import { useTheme } from '../components/ThemeContext'
import { temperatureFilters, temperatureFilterLabels, temperatureFilterWidths, availableKindFilters, availableDessertFilters } from '../menuData'
import type { DessertFilter, KindFilter, MenuItem, TemperatureFilter } from '../menuData'
import type { Temperature } from '../types'
import { menuCatalog, useMenuLoad } from '../menuLoad'
import { MenuEmpty, MenuLoadFailed, MenuLoadingNotice, MenuSkeletonCards, MenuSkeletonChips } from '../components/MenuListStates'
import GuideCue from '../voice/GuideCue'
import { orderGuide } from '../voice/guides'

export type { MenuItem }

const CURRENT_STEP = 2

/* ── 공통 스타일 ── */
const TOP_PADDING = layout.progressTop
const GRID_ROW_GAP = 28
/* 사진은 열 너비를 채우고, 더 있는 메뉴는 목록 하단의 스크롤 안내로 알린다. */
const SHADOW_ROOM = 24 // 그림자(blur 20)가 잘리지 않을 만큼
/* 카드 눌림 애니메이션과 같은 시간 뒤에 상품 정보로 넘어간다. */
const PICK_HOLD_MS = motion.menuPress

/* 글자 크기에 딸린 칸 높이. 글자 크기 자체는 역할(useType)에서 가져온다.
   종류 칩은 글자가 두 모드 모두 32라 높이도 하나(84)로 둔다 — 모드를 바꿀 때 칩 높이가 흔들리지 않게 */
const CHIP_HEIGHT = 84

interface Props {
  onSelectItem?: (item: MenuItem, temperature?: Temperature) => void
  cartCount?: number
  cartTotal?: number
  onOpenCart?: () => void
  searchOpenAtStart?: boolean  // 캡처용 · 검색 창을 연 채로 시작
  searchTextAtStart?: string
  searchPickAtStart?: string | null
  cardPickAtStart?: string | null // 캡처용 · 카드를 누른 상태로 멈춰 둔다
}

export default function MenuScreen({
  onSelectItem, cartCount = 0, cartTotal = 0, onOpenCart,
  searchOpenAtStart = false, searchTextAtStart = '', searchPickAtStart = null, cardPickAtStart = null,
}: Props) {
  const theme = useTheme()
  const [tempFilter, setTempFilter] = useState<TemperatureFilter>('전체')
  const [kindFilter, setKindFilter] = useState<KindFilter>('모든 종류')
  const [dessertFilter, setDessertFilter] = useState<DessertFilter>('조각케이크')
  const [searchOpen, setSearchOpen] = useState(searchOpenAtStart)
  const [pickedId, setPickedId] = useState<string | null>(cardPickAtStart)
  const holdTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(holdTimer.current), [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  useEffect(() => {
    const list = scrollRef.current
    const content = contentRef.current
    if (!list || !content) return
    // 필터를 바꾸면 새 목록의 처음부터 보여 준다.
    list.scrollTo({ top: 0, behavior: 'instant' })
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
  }, [tempFilter, kindFilter, dessertFilter])


  // 카드를 누르면 무엇을 눌렀는지 먼저 보여 주고 넘어간다. 그동안 다른 카드는 눌리지 않는다.
  const pickCard = (item: MenuItem) => {
    if (pickedId) return
    setPickedId(item.id)
    const temperature = tempFilter === '차가움' ? 'COLD' : tempFilter === '따뜻함' ? 'HOT' : null
    holdTimer.current = window.setTimeout(() => {
      setPickedId(null)
      onSelectItem?.(item, temperature)
    }, PICK_HOLD_MS)
  }
  const t = useType()
  const { staffPending } = useAppControls()
  // 메뉴를 받는 동안은 골격과 알약, 받지 못하면 다시 불러오기(menuLoad.ts). 검색도 메뉴가 있어야 해서 잠근다.
  const menuLoad = useMenuLoad()
  const loading = menuLoad.status === 'loading', failed = menuLoad.status === 'failed', ready = menuLoad.status === 'ready'

  const isDessert = tempFilter === '디저트'

  /* 필터링 */
  const filtered = menuCatalog.filter((item) => {
    if (isDessert) {
      return item.kind === '디저트' && item.dessertKind === dessertFilter
    }
    // 디저트는 '전체 · 모든 종류'에서만 음료와 함께 보인다
    if (item.kind === '디저트') return tempFilter === '전체' && kindFilter === '모든 종류'
    if (tempFilter === '차가움' && !item.temp.includes('cold')) return false
    if (tempFilter === '따뜻함' && !item.temp.includes('hot')) return false
    if (kindFilter !== '모든 종류' && item.kind !== kindFilter) return false
    return true
  })


  return (
    <div style={{
      width: layout.width, height: layout.height, background: theme.page,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <GuideCue guide={orderGuide(loading ? 'menu-loading' : failed ? 'menu-failed' : filtered.length ? 'menu' : 'menu-empty', false, { cartHasItems: cartCount > 0, staffPending })} />

      {/* 검색 창은 이 구역 위에 뜬다 · 아래 보조 기능 줄은 가리지 않는다 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── 본문 · 위에서 아래로 쌓고, 구역 사이 간격은 8px 단위(space)로 맞춘다 ── */}
      <div style={{
        flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        padding: `${TOP_PADDING}px ${space.page}px 0`,
      }}>

        {/* 머리 · 진행 단계와 제목·검색하기를 묶는다. 진행 단계 아래 간격은 머리가 정한다. */}
        <header data-order-header style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: progressMetrics.spaceBelow }}>
        <ProgressStep current={CURRENT_STEP} />

        {/* 제목과 검색하기 · 검색은 필요할 때만 열어, 평소에는 메뉴 사진에 자리를 준다 */}
        <div data-voice-heading style={{
          marginTop: space.lg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md,
        }}>
          <p data-voice-title data-voice-menu-question style={{ ...t.title, margin: 0, color: colors.textPrimary }}>
            무엇을 주문하시겠어요?
          </p>
          <Button purpose="support" voiceAction="search" variant="Utility" size="small" disabled={!ready} onClick={() => setSearchOpen(true)} style={{ height: 88, padding: '0 32px' }}>
            <Icon name="search" size={40} color={ready ? colors.textPrimary : colors.textDisabled} />
            검색하기
          </Button>
        </div>
        </header>

        {/* 1차 필터 탭 (전체 / 따뜻한 음료 / 차가운 음료 / 디저트) */}
        <div style={{ marginTop: space.lg, display: 'flex', gap: 0, flexShrink: 0 }}>
          {temperatureFilters.map((tab) => (
            <FilterChip
              key={tab}
              kind="tab"
              width={temperatureFilterWidths[tab]}
              selected={tempFilter === tab}
              accent={tab === '차가움' ? 'cold' : tab === '따뜻함' ? 'hot' : 'primary'}
              onClick={() => {
                setTempFilter(tab)
                if (tab !== '디저트') setKindFilter('모든 종류')
              }}
            >
              {temperatureFilterLabels[tab]}
            </FilterChip>
          ))}
        </div>

        {/* 2차 필터 칩 */}
        <div style={{ marginTop: space.md, display: 'flex', gap: 16, flexWrap: 'nowrap', flexShrink: 0, minHeight: CHIP_HEIGHT, visibility: failed ? 'hidden' : undefined }}>
          {loading ? <MenuSkeletonChips height={CHIP_HEIGHT} /> : isDessert ? (
            availableDessertFilters(menuCatalog).map((f) => (
              <FilterChip key={f} kind="chip" selected={dessertFilter === f} onClick={() => setDessertFilter(f)} height={CHIP_HEIGHT}>{f}</FilterChip>
            ))
          ) : (
            availableKindFilters(tempFilter, menuCatalog).map((k) => (
              <FilterChip key={k} kind="chip" selected={kindFilter === k} onClick={() => setKindFilter(k)} height={CHIP_HEIGHT}>{k}</FilterChip>
            ))
          )}
        </div>

        {/* 여백은 스크롤 안쪽에 둔다. 목록 바깥의 고정 흰 띠 없이 하단 안내를 겹친다. */}
        <div data-menu-list-viewport style={{
          marginTop: space.xl - SHADOW_ROOM, marginLeft: -space.page, marginRight: -space.page,
          flex: 1, minHeight: 0, position: 'relative', display: 'flex',
        }}>
        <div ref={scrollRef} data-voice-scroll-viewport className="kiosk-scroll-list" id="menu-product-list" role="region" aria-label="메뉴 목록" tabIndex={0} style={{
          flex: 1, minHeight: 0, minWidth: 0,
          padding: `${SHADOW_ROOM}px ${space.page - 16}px ${space.lg}px ${space.page}px`, scrollPaddingBottom: 144,
          overflowY: ready ? 'auto' : 'hidden', overflowX: 'hidden',
        }}>
        <div ref={contentRef} data-voice-scroll-content style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'max-content', alignContent: 'start', rowGap: GRID_ROW_GAP, columnGap: space.page,
        }}>
          {loading && <MenuSkeletonCards count={6} />}
          {ready && filtered.map((item) => (
            <MenuCard key={item.id} item={item} temperature={tempFilter === '차가움' ? 'COLD' : tempFilter === '따뜻함' ? 'HOT' : null} selected={item.id === pickedId} onSelect={() => pickCard(item)} />
          ))}
        </div>
        </div>
        {loading && <div style={{ position: 'absolute', left: 0, right: 0, top: '38%', zIndex: layer.scrollShade, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><MenuLoadingNotice /></div>}
        {ready && filtered.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${space.page}px 120px` }}><MenuEmpty onShowAll={() => { setTempFilter('전체'); setKindFilter('모든 종류') }} /></div>}
        {failed && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${space.page}px 120px` }}><MenuLoadFailed onRetry={menuLoad.retry} /></div>}
        {ready && canScrollDown && <div data-menu-scroll-more style={{
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
        </div>
      </div>

      {/* 담은 메뉴가 있을 때만 장바구니 막대를 표시한다. 빈 상태의 공간은 메뉴 목록에 돌려준다. */}
      {cartCount > 0 && <div data-menu-cart-actions style={{
        flexShrink: 0,
        padding: `${space.lg}px ${space.page}px`,
      }}>
        {/* 담은 것이 있으면 한 줄에 나눠 쓴다: 왼쪽은 할 일, 오른쪽은 개수와 금액 (같은 크기에 굵기만 낮춤) */}
        <Button purpose="decision"
          variant="Primary"
          onClick={onOpenCart}
          style={{ width: '100%', padding: '0 40px' }}
          trailing={`${cartCount}개 · ${cartTotal.toLocaleString('ko-KR')}원`}
        >
          장바구니 보기
        </Button>
      </div>}

      {searchOpen && (
        <SearchPanel
          items={menuCatalog}
          startText={searchTextAtStart}
          startSelectedId={searchPickAtStart}
          onSelect={(item) => onSelectItem?.(item)}
          onClose={() => setSearchOpen(false)}
        />
      )}
      </div>

      <UtilityBar showDivider={false} />
    </div>
  )
}
