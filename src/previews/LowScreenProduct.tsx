import { useOrderPricing } from '../components/useOrderPricing'
import { layout, shadow as shadows } from '../design-system/metrics'
import { useLowScreenUtilities } from '../components/useLowScreenUtilities'
import { useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import type ProductDetailScreen from '../screens/ProductDetailScreen'
import { menuImage } from '../menuData'
import { productInfoPages } from '../productInfoPages'
import { useAppControls } from '../components/AppControlsContext'
import { useType } from '../components/useType'
import { productInfoStyles } from '../components/productInfoStyles'
import { useTheme } from '../components/ThemeContext'
import LowScreenHeader from '../components/LowScreenHeader'
import UtilityBarVariant from '../components/UtilityBarVariant'
import Button from '../components/Button'
import ShortTip from '../voice/ShortTip'
import ButtonTips from '../voice/ButtonTips'
import { orderGuide } from '../voice/guides'
import ItemOrderControls from '../components/ItemOrderControls'
import ScrollBottomShade from '../components/ScrollBottomShade'
import MenuTemperatureLabel from '../components/MenuTemperatureLabel'
import NutritionMetrics from '../components/NutritionMetrics'
import Icon from '../components/Icon'
import { colors, font, radius } from '../tokens'
import './low-screen-menu.css'

type Props = ComponentProps<typeof ProductDetailScreen> & { onExitLowScreen: () => void }

// 상품상세만 낮은 화면으로 비교한다. 주문·수량·직원 호출은 App의 기존 상태를 사용한다.
export default function LowScreenProduct({ item, temperature = null, onBack, onAddToCart, onOrderDefault, onOrderCustom, quantity, onChangeQuantity, onExitLowScreen }: Props) {
  const { priceText, basePrice } = useOrderPricing()
  const t = useType()
  const infoStyles = productInfoStyles(t)
  const theme = useTheme()
  const controls = useAppControls()
  const [page, setPage] = useState(0)
  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isDessert = item.kind === '디저트'
  const pages = productInfoPages(item)
  const pageCount = pages.length
  const currentPage = Math.min(page, pageCount - 1)
  const infoPage = pages[currentPage]
  const heading = { ...t.info, fontWeight: font.bold, margin: 0 }
  const utility = useLowScreenUtilities({ onExitLowScreen })
  const pagingStyle = { ...t.bodyButton, height: 80, minWidth: 200, padding: '0 24px', border: `1px solid ${theme.borderNeutral}`, borderRadius: radius.pill, background: theme.surface, color: 'var(--text-primary)', cursor: 'pointer' }
  const shadow = (controls.highContrast ? shadows.actionBarHighContrast : shadows.actionBar)

  return <div data-low-product style={{ width: layout.width, height: layout.height, display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
    <LowScreenHeader current={2} description="아래에서 상품을 확인해 주세요." />

    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
    <main ref={mainRef} data-voice-scroll-viewport className="kiosk-scroll-list" tabIndex={0} aria-label="상품 상세정보" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
    <div ref={contentRef} data-voice-scroll-content style={{ minHeight: '100%', boxSizing: 'border-box', padding: '0 64px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section aria-label={item.name} data-low-product-summary style={{ position: 'relative', flexShrink: 0, height: 376, margin: '0 -64px', display: 'grid', gridTemplateColumns: '392px minmax(0, 1fr)', background: theme.surface }}>
        <img src={menuImage(item, temperature)} alt="" style={{ width: '100%', height: '100%', minHeight: 0, objectFit: 'cover', objectPosition: item.imagePosition ?? 'center', borderRadius: 0 }} />
        <div style={{ minWidth: 0, padding: '48px 216px 32px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <h1 style={{ ...t.primary, fontSize: t.figmaTypography ? t.title.fontSize : t.primary.fontSize, margin: 0 }}>{item.name}</h1>
          <p data-product-price style={{ ...t.price, margin: 0 }}>{priceText(item)}</p>
          {!isDessert && <div style={{ marginTop: 16 }}>
            <div aria-label="제공 가능한 온도" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {item.temp.map(temp => <MenuTemperatureLabel key={temp} temp={temp} low />)}
            </div>
          </div>}
        </div>
        <Button purpose="support" variant="Utility" size="small" ariaLabel="메뉴로 돌아가기" voiceAction="menu-back" onClick={onBack} style={{ position: 'absolute', top: 24, right: 24, width: 176, minWidth: 176, height: 80, padding: '0 16px' }}><span aria-hidden="true">←</span>메뉴</Button>
      </section>
      <div aria-hidden="true" style={{ height: 24, margin: '-16px -64px 0', flexShrink: 0, background: 'var(--bg-muted)' }} />
      <section id="low-product-info" aria-label={infoPage.title} data-low-product-info data-info-kind={infoPage.kind} style={{ flex: '1 0 auto', paddingTop: 24 }}>
        {infoPage.kind === 'description' && <>
          <h2 style={heading}>상품설명</h2>
          <p style={{ ...infoStyles.value, fontWeight: font.medium, margin: '24px 0 0' }}>{infoPage.value}</p>
        </>}
        {infoPage.kind === 'details' && <dl style={{ margin: 0 }}>
          {infoPage.rows.map((row, index) => <div key={row.label} style={{
            display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 24, alignItems: 'baseline',
            padding: `${index === 0 ? 0 : 24}px 0 ${index === infoPage.rows.length - 1 ? 0 : 24}px`,
            borderBottom: index === infoPage.rows.length - 1 ? undefined : `1px solid ${colors.borderDefault}`,
          }}>
            <dt style={{ ...infoStyles.label, margin: 0 }}>{row.label}</dt>
            <dd style={{ ...infoStyles.value, minWidth: 0, margin: 0 }}>{row.value}</dd>
          </div>)}
        </dl>}
        {infoPage.kind === 'nutrition' && <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 16 }}>
            <h2 style={{ ...heading, flexShrink: 0 }}>영양정보</h2>
            <p style={{ ...t.body, margin: 0, color: colors.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, textAlign: 'right' }}>
              <Icon name="info" size={t.body.fontSize} color={colors.textSecondary} />
              <span>{infoPage.servingNote}</span>
            </p>
          </div>
          <NutritionMetrics rows={infoPage.rows} />
        </>}
      </section>
      <nav aria-label="상세 안내 페이지" style={{ flexShrink: 0, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <button aria-controls="low-product-info" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} style={{ ...pagingStyle, background: currentPage === 0 ? theme.disabledBg : theme.surface, color: currentPage === 0 ? theme.disabledText : 'var(--text-primary)' }}>‹ 이전</button>
        <div style={{ textAlign: 'center' }}>
          <span aria-live="polite" aria-atomic="true" style={t.body}>상세 안내 {currentPage + 1} / {pageCount}</span>
        </div>
        <button aria-controls="low-product-info" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} style={{ ...pagingStyle, background: currentPage + 1 >= pageCount ? theme.disabledBg : theme.surface, color: currentPage + 1 >= pageCount ? theme.disabledText : 'var(--text-primary)' }}>다음 설명 ›</button>
      </nav>
    </div>
    </main>
    <ScrollBottomShade viewportRef={mainRef} contentRef={contentRef} />
    </div>

    <section aria-label={isDessert ? '수량 선택과 담기' : '주문 방식 선택'} data-low-product-actions style={{ flexShrink: 0, padding: '36px 64px', display: 'flex', flexDirection: 'column', gap: isDessert ? 24 : 16, background: theme.surface, boxShadow: shadow, position: 'relative' }}>
      {isDessert ? <ItemOrderControls quantity={quantity} unitPrice={basePrice(item)} onChangeQuantity={onChangeQuantity} onReturnToMenu={onBack} onAdd={onAddToCart} voiceAction="dessert-add" lowScreen
        quantityTip={<ShortTip id="dessert" text="수량 확인" arrow="left" />} /> : <>
      {onOrderDefault && <ButtonTips id="product" tips={orderGuide('product', false, { chooseTemperature: temperature === null }).tips} columns="minmax(0, 1fr) minmax(0, 1fr)" gap={24} />}
      <div style={{ display: 'grid', gridTemplateColumns: onOrderDefault ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', gap: 24 }}>
        {onOrderDefault && <Button purpose="decision" variant="Tertiary" voiceAction="order-default" onClick={onOrderDefault} style={{ height: 128, padding: '0 16px', borderColor: 'var(--text-secondary)' }}>기본 값으로 주문</Button>}
        <Button purpose="decision" variant="Primary" voiceAction="order-custom" onClick={onOrderCustom} style={{ height: 128, padding: '0 16px' }}>내 입맛에 맞게 주문</Button>
      </div></>}
    </section>
    <div className="low-menu-utility" style={{ position: 'relative' }}>
      <UtilityBarVariant grouped variant="vertical" controls={utility} showDivider={false} />
    </div>
  </div>
}
