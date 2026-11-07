import { layout } from '../design-system/metrics'
import { colors, space } from '../tokens'
import ProgressStep from './ProgressStep'
import { useType } from './useType'

// The inactive upper third is shared by every low layout; the message and order
// step belong to each screen. Payment retains its approved primary message tone.
export default function LowScreenHeader({ current, description, descriptionTone = 'secondary', className, height = layout.lowHeaderHeight }: {
  current: number
  description: string
  descriptionTone?: 'primary' | 'secondary'
  className?: string
  height?: number
}) {
  const t = useType()
  return <header className={className} style={{ height, flexShrink: 0,
    padding: `0 ${layout.pageInset}px ${layout.lowHeaderBottom}px`, display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end', gap: layout.lowHeaderGap, background: 'var(--bg-muted)' }}>
    <div style={{ textAlign: 'center', paddingBottom: layout.lowHeaderCopyBottom }}>
      <p style={{ ...t.primary, margin: `0 0 ${space.sm}px` }}>낮은 화면을 사용하고 있어요</p>
      <p style={{ ...t.body, margin: 0, ...(descriptionTone === 'secondary' ? { color: colors.textSecondary } : {}) }}>{description}</p>
    </div>
    <ProgressStep current={current} />
  </header>
}
