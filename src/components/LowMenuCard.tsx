import { useOrderPricing } from './useOrderPricing'
import { menuCardMetrics } from '../design-system/metrics'
import { menuImage, menuTemperatures, type MenuItem } from '../menuData'
import type { Temperature } from '../types'
import { useType } from './useType'
import { useTheme } from './ThemeContext'
import MenuTemperatureLabel from './MenuTemperatureLabel'
import { SoldOutMark } from './MenuCard'
import { useSoldOut } from '../soldOut'

export default function LowMenuCard({ item, temperature, onSelect }: {
  item: MenuItem; temperature: Temperature; onSelect: () => void
}) {
  const { priceText } = useOrderPricing()
  const t = useType()
  const theme = useTheme()
  const soldOut = useSoldOut()(item.id)
  return <button data-low-menu-card data-sold-out={soldOut || undefined} disabled={soldOut} aria-label={soldOut ? `${item.name} 품절, 지금은 주문할 수 없어요` : `${item.name} ${priceText(item)}`} onClick={soldOut ? undefined : onSelect} style={{ border: 0, boxShadow: 'none', borderRadius: menuCardMetrics.lowRadius, background: theme.surface, padding: 0, cursor: soldOut ? 'default' : 'pointer', textAlign: 'left', display: 'grid', gridTemplateColumns: `${menuCardMetrics.lowPhotoWidth}px minmax(0, 1fr)`, columnGap: menuCardMetrics.lowPhotoGap, alignItems: 'center', color: 'var(--text-primary)' }}>
          <span style={{ position: 'relative', display: 'block', width: menuCardMetrics.lowPhotoWidth, height: menuCardMetrics.lowPhotoWidth }}>
            <img data-low-menu-photo src={menuImage(item, temperature)} alt="" style={{ width: menuCardMetrics.lowPhotoWidth, height: menuCardMetrics.lowPhotoWidth, borderRadius: menuCardMetrics.photoRadius, background: menuCardMetrics.imageBackground, objectFit: 'contain', objectPosition: item.imagePosition ?? 'center', ...(soldOut ? { filter: 'grayscale(1)', opacity: 0.45 } : null) }} />
            {soldOut && <SoldOutMark small />}
          </span>
          <div data-low-menu-description style={{ padding: '12px 12px 12px 0', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: item.temp.length > 0 ? 6 : 8, minWidth: 0 }}>
            {item.temp.length > 0 && <div style={{ display: 'flex', gap: 16, alignItems: 'center', ...(soldOut ? { opacity: 0.5 } : null) }}>{menuTemperatures(item, temperature).map(temp => <MenuTemperatureLabel key={temp} temp={temp} low />)}</div>}
            <span style={{ ...t.primary, ...(soldOut ? { color: 'var(--text-disabled)' } : null) }}>{item.name}</span><span style={{ ...t.price, ...(soldOut ? { color: 'var(--text-disabled)' } : null) }}>{priceText(item)}</span>
          </div>
        </button>
}
