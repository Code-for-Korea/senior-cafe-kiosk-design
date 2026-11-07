import type { MenuItem } from '../menuData'
import { space } from '../tokens'
import Icon from './Icon'
import { useType } from './useType'

/** 제공 온도 안내. 선택하거나 눌러야 하는 버튼이 아니다. */
export default function ColdOnlyNotice({ item }: { item: MenuItem }) {
  const t = useType()
  if (item.temp.length !== 1 || item.temp[0] !== 'cold') return null

  return (
    <p data-cold-only-notice style={{
      ...t.body, margin: 0, padding: `${space.sm}px ${space.md}px`,
      display: 'flex', alignItems: 'center', gap: space.sm,
      background: 'var(--badge-cold-bg)', color: 'var(--badge-cold-text)',
      borderRadius: 12,
    }}>
      <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>
        <Icon name="snowflake" size={32} color="var(--badge-cold-text)" />
      </span>
      <span>차가운 음료만 가능해요</span>
    </p>
  )
}
