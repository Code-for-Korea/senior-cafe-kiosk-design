import { useOrderPricing } from './useOrderPricing'
import { menuCardMetrics } from '../design-system/metrics'
import { colors, space } from '../tokens'
import { menuImage, menuTemperatures, type MenuItem } from '../menuData'
import type { Temperature } from '../types'
import { useType } from './useType'
import { useTheme } from './ThemeContext'
import { useAppControls } from './AppControlsContext'
import MenuTemperatureLabel from './MenuTemperatureLabel'
import { useSoldOut } from '../soldOut'

/* ── 메뉴 카드 컴포넌트 ── */
export default function MenuCard({ item, temperature, selected, onSelect }: { item: MenuItem; temperature: Temperature; selected: boolean; onSelect: () => void }) {
  const { priceText } = useOrderPricing()
  const t = useType()
  const theme = useTheme()
  const { highContrast } = useAppControls()
  // 품절: 사진은 흑백, 가운데에 ‘품절’, 글자는 흐리게, 누를 수 없음(기획 MN-05, 사용자 M1).
  const soldOut = useSoldOut()(item.id)
  // 사진의 8px 모서리를 카드의 기존 24px 모서리가 다시 잘라내지 않도록 한다.
  const cardRadius = `${menuCardMetrics.photoRadius}px ${menuCardMetrics.photoRadius}px ${menuCardMetrics.radius}px ${menuCardMetrics.radius}px`

  return (
    <button
      onClick={soldOut ? undefined : onSelect}
      disabled={soldOut}
      aria-label={soldOut ? `${item.name} 품절, 지금은 주문할 수 없어요` : undefined}
      data-picking={selected || undefined}
      data-menu-card
      data-sold-out={soldOut || undefined}
      style={{
        padding: 0,
        background: highContrast ? 'transparent' : theme.surface,
        // 눌림 피드백은 사진과 정보를 포함한 카드의 투명도로 표현한다.
        border: 'none',
        boxShadow: 'none',
        borderRadius: cardRadius, overflow: 'hidden', cursor: soldOut ? 'default' : 'pointer', position: 'relative',
        textAlign: 'left',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* 열 너비에 맞춘 정사각형 사진 · 원본 비율은 유지한다. */}
      <div data-menu-photo style={{
        width: '100%', height: menuCardMetrics.photoHeight, flexShrink: 0, background: menuCardMetrics.imageBackground,
        maxWidth: menuCardMetrics.photoHeight, alignSelf: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderRadius: menuCardMetrics.photoRadius, overflow: 'hidden',
      }}>
        {item.imageUrl ? (
          <img src={menuImage(item, temperature)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: item.imagePosition ?? 'center', ...(soldOut ? { filter: 'grayscale(1)', opacity: 0.45 } : null) }} />
        ) : (
          <span style={{ fontSize: 72, lineHeight: 1 }}>{item.emoji}</span>
        )}
        {soldOut && <SoldOutMark />}
      </div>
      {/* 텍스트 영역 */}
      <div data-menu-description style={{ flexShrink: 0, width: '100%', maxWidth: menuCardMetrics.photoHeight, alignSelf: 'center', padding: `${space.md}px 0 20px`, display: 'flex', flexDirection: 'column', gap: space.micro }}>
        {/* 제공 온도는 사진 밖, 상품명 위에서 먼저 확인한다. */}
        {item.temp.length > 0 && (
          <div data-menu-temperature-badges style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm, marginBottom: space.xs, ...(soldOut ? { opacity: 0.5 } : null) }}>
            {menuTemperatures(item, temperature).map((temp) => <MenuTemperatureLabel key={temp} temp={temp} />)}
          </div>
        )}
        <span style={{ ...t.primary, color: soldOut ? colors.textDisabled : colors.textPrimary }}>
          {item.name}
        </span>
        <span style={{ ...t.price, color: soldOut ? colors.textDisabled : colors.textPrimary }}>
          {priceText(item)}
        </span>
      </div>

    </button>
  )
}

// 사진 가운데 ‘품절’ 표시. 진한 바탕에 흰 글자라 흑백 사진 위에서도 읽힌다.
export function SoldOutMark({ small = false }: { small?: boolean }) {
  return <span data-sold-out-mark style={{
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
    background: 'var(--bg-dark)', color: 'var(--text-on-dark)', borderRadius: 999, whiteSpace: 'nowrap',
    fontSize: small ? 32 : 40, fontWeight: 700, lineHeight: 1, padding: small ? '12px 24px' : '18px 36px',
  }}>품절</span>
}
