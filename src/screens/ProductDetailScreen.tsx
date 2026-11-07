import { useOrderPricing } from '../components/useOrderPricing'
import { layout, menuCardMetrics, progressMetrics } from '../design-system/metrics'
import { useEffect, useRef } from 'react'
import { colors, space } from '../tokens'
import { devParams } from '../devParams'
import { menuImage, type MenuItem } from '../menuData'
import type { Temperature } from '../types'
import ProgressStep from '../components/ProgressStep'
import UtilityBar from '../components/UtilityBar'
import ItemOrderControls from '../components/ItemOrderControls'
import ScrollBottomShade from '../components/ScrollBottomShade'
import Button from '../components/Button'
import ShortTip from '../voice/ShortTip'
import ButtonTips from '../voice/ButtonTips'
import { orderGuide } from '../voice/guides'
import { useVoiceGuide } from '../voice/VoiceContext'
import MenuTemperatureLabel from '../components/MenuTemperatureLabel'
import { useType } from '../components/useType'
import ProductInformation from '../components/ProductInformation'

/* 상품 정보 화면 · 메뉴를 누르면 가장 먼저 열린다.
   음료는 '기본 값으로 주문'과 '내 입맛에 맞게 주문' 중에서 고르고,
   옵션이 없는 디저트는 바로 장바구니에 담는다. */
interface Props {
  item: MenuItem
  temperature?: Temperature
  onBack: () => void
  onAddToCart: () => void      // 디저트
  onOrderDefault?: () => void  // 음료 · 기본 값으로 주문
  onOrderCustom: () => void    // 음료 · 내 입맛에 맞게 주문
  quantity: number             // 디저트는 고를 옵션이 없어서 여기서 수량을 묻는다
  onChangeQuantity: (quantity: number) => void
}

const MENU_STEP = 2
const PHOTO_HEIGHT = 720
const SPLIT_PHOTO_SIZE = 480
// 음성 안내를 켜면 사진을 360으로 줄인다. 칸 폭도 사진에 맞춰 줄여, 오른쪽 위 ‘← 메뉴’ 옆 이름 칸을 넓힌다(긴 이름이 한 줄에 들어가게, 2026-10-22).
const COMPACT_PHOTO_SIZE = 360
const PRODUCT_SECTION_PADDING = space.lg + 4 // 상품 정보 구역과 같은 36 (2026-11-03)

export default function ProductDetailScreen({ item, temperature = null, onBack, onAddToCart, onOrderDefault, onOrderCustom, quantity, onChangeQuantity }: Props) {
  const { priceText, basePrice } = useOrderPricing()
  const t = useType()
  const splitProduct = devParams.productLayout === 'split'
  const isDessert = item.kind === '디저트'
  const voice = useVoiceGuide()
  const compactInformation = splitProduct && voice.enabled
  const coldOnly = item.temp.length === 1 && item.temp[0] === 'cold'
  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  useEffect(() => { if (devParams.scrollEnd && mainRef.current) mainRef.current.scrollTop = mainRef.current.scrollHeight }, [])

  return (
    <div style={{
      width: layout.width, height: layout.height, overflow: 'hidden', background: colors.bgPage,
      display: 'flex', flexDirection: 'column', margin: '0 auto',
    }}>
      <header data-order-header style={{ flexShrink: 0, padding: `${layout.progressTop}px ${space.page}px ${progressMetrics.spaceBelow}px` }}>
        <ProgressStep current={MENU_STEP} />
      </header>

      {/* 2안은 사진과 요약을 나란히 둔다. 상세정보와 주문 흐름은 공통으로 사용한다. */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <main ref={mainRef} data-voice-scroll-viewport className="kiosk-scroll-list" aria-label="상품 상세정보" tabIndex={0} style={{
          height: '100%', overflowY: 'auto', overflowX: 'hidden',
          background: colors.bgSurface,
        }}>
          <article ref={contentRef} data-voice-scroll-content aria-label={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
            <div data-product-hero data-layout={splitProduct ? 'split' : 'stacked'} style={{
              display: splitProduct ? 'grid' : 'flex', flexDirection: 'column',
              gridTemplateColumns: splitProduct ? `${compactInformation ? COMPACT_PHOTO_SIZE : SPLIT_PHOTO_SIZE}px minmax(0, 1fr)` : undefined,
            }}>
              <div style={{ height: splitProduct ? (compactInformation ? COMPACT_PHOTO_SIZE : SPLIT_PHOTO_SIZE) : PHOTO_HEIGHT, position: 'relative', background: menuCardMetrics.imageBackground, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.imageUrl ? (
                  <img src={menuImage(item, temperature)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: splitProduct && !compactInformation ? 'cover' : 'contain', objectPosition: item.imagePosition ?? 'center' }} />
                ) : (
                  <span style={{ fontSize: 180 }} aria-hidden="true">{item.emoji}</span>
                )}
              </div>
              <div data-product-summary style={{ minWidth: 0, padding: splitProduct ? `${compactInformation ? space.md : PRODUCT_SECTION_PADDING}px ${space.page}px ${compactInformation ? space.md : PRODUCT_SECTION_PADDING}px ${space.xl}px` : `${PRODUCT_SECTION_PADDING}px ${space.page}px`, display: 'flex', flexDirection: 'column', justifyContent: splitProduct ? 'center' : undefined, gap: space.sm }}>
                <h1 style={{ ...t.title, margin: 0, maxWidth: compactInformation ? 'calc(100% - 192px)' : undefined, color: colors.textPrimary }}>{item.name}</h1>
                {!isDessert && !coldOnly && temperature && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: space.sm }}>
                    <span style={{ ...t.body, color: colors.textSecondary }}>온도</span>
                    <span style={{ ...t.info, color: colors.textPrimary }}>{temperature === 'COLD' ? '차갑게' : '따뜻하게'}</span>
                  </div>
                )}
                <p data-product-price style={{ ...t.title, margin: `${space.xs}px 0 0`, color: colors.textPrimary }}>{priceText(item)}</p>
                {!isDessert && <div aria-label="제공 가능한 온도" style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm }}>
                  {item.temp.map(temp => <MenuTemperatureLabel key={temp} temp={temp} />)}
                </div>}
              </div>
            </div>
            <ProductInformation item={item} compact={compactInformation} />
          </article>
        </main>
        <ScrollBottomShade viewportRef={mainRef} contentRef={contentRef} />
        <Button purpose="support" variant="Utility" size="small" ariaLabel="메뉴로 돌아가기" voiceAction="menu-back" onClick={onBack} style={{
          position: 'absolute', top: space.md, right: space.page, width: 176, minWidth: 176, height: 80, padding: '0 16px',
        }}>
          <span aria-hidden="true">←</span>메뉴
        </Button>
      </div>

      {/* ── 하단 행동 ── */}
      <section aria-label={isDessert ? '수량 선택과 담기' : '주문 방식 선택'} data-product-actions style={{
        flexShrink: 0, background: colors.bgSurface,
        padding: `${isDessert ? space.md : space.lg}px ${space.page}px ${space.lg}px`,
        display: 'flex', flexDirection: 'column', gap: isDessert ? space.md : space.sm,
      }}>
        {/* 음성 안내 말풍선: 디저트는 수량 칸 오른쪽 ‘수량 확인’(사용자 2026-10-20), 음료는 두 주문 버튼마다 조건(사용자 3안 2026-10-21). */}
        {isDessert ? (
          <ItemOrderControls quantity={quantity} unitPrice={basePrice(item)} onChangeQuantity={onChangeQuantity} onReturnToMenu={onBack} onAdd={onAddToCart} voiceAction="dessert-add"
            quantityTip={<ShortTip id="dessert" text="수량 확인" arrow="left" />} />
        ) : (
          <>
            {onOrderDefault && <ButtonTips id="product" tips={orderGuide('product', false, { chooseTemperature: temperature === null }).tips} columns="minmax(0, 1fr) minmax(0, 1fr)" gap={24} />}
            {/* 주문 방식은 한 줄로 표시하고 직접 선택 경로를 채움형으로 강조한다. */}
            <div style={{ display: 'grid', gridTemplateColumns: onOrderDefault ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', gap: 24 }}>
              {onOrderDefault && (
                <Button purpose="decision" variant="Tertiary" voiceAction="order-default" onClick={onOrderDefault} style={{ borderColor: 'var(--text-secondary)' }}>
                  기본 값으로 주문
                </Button>
              )}
              <Button purpose="decision" variant="Primary" voiceAction="order-custom" onClick={onOrderCustom}>
                내 입맛에 맞게 주문
              </Button>
            </div>
          </>
        )}
      </section>

      <UtilityBar />
    </div>
  )
}
