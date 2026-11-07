import { badgeMetrics, font } from '../tokens'
import { useType } from './useType'
import Icon from './Icon'

// 제공 온도 안내(아이콘+따뜻한/차가운). 메뉴 카드와 상품상세가 함께 쓴다.
// 누를 수 있는 칩으로 보이지 않도록 배경을 두지 않는다.
export default function MenuTemperatureLabel({ temp, low = false }: { temp: 'hot' | 'cold'; low?: boolean }) {
  const t = useType()
  const d = badgeMetrics[t.largeText ? 'large' : 'normal']
  const hot = temp === 'hot'
  const color = hot ? 'var(--text-brand)' : 'var(--text-secondary)'
  return <span data-menu-temperature-label={temp} style={{
    ...t.caption, fontWeight: font.semibold, color, height: d.height,
    display: 'inline-flex', alignItems: 'center', gap: badgeMetrics.iconGap,
    whiteSpace: 'nowrap', flexShrink: 0,
    ...(!low ? { lineHeight: t.largeText ? 1.4 : 1, ...(t.largeText ? { letterSpacing: '-0.02em' } : {}) } : {}),
  }}><Icon name={hot ? 'hotCup' : 'snowflake'} size={d.icon} color={color} />{hot ? '따뜻한' : '차가운'}</span>
}
