import { colors, font } from '../tokens'
import { useType } from './useType'

type NutritionRow = { label: string; value: string }

// Share the compact, number-first layout between standard and low product views.
export default function NutritionMetrics({ rows }: { rows: NutritionRow[] }) {
  const t = useType()
  const columns = rows.length > 4 ? 3 : rows.length
  return <dl data-nutrition-metrics style={{ margin: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, rowGap: 24 }}>
    {rows.map((row, index) => {
      const [number, unit] = row.value.split(' ')
      return <div key={row.label} style={{
        minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12,
        padding: index % columns === 0 ? '0 16px 0 0' : '0 16px',
        borderLeft: index % columns === 0 ? undefined : `1px solid ${colors.borderDefault}`,
      }}>
        <dt style={{ ...t.caption, fontWeight: font.medium, color: colors.textSecondary }}>
          {row.label === '열량 (칼로리)' ? '열량' : row.label}
        </dt>
        <dd style={{ margin: 0, order: -1, display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', color: colors.textPrimary }}>
          <span style={{ ...t.title, fontWeight: font.bold, fontVariantNumeric: 'tabular-nums' }}>{number}</span>
          <span style={{ ...t.caption, fontWeight: font.medium, color: colors.textSecondary }}>{unit}</span>
        </dd>
      </div>
    })}
  </dl>
}
