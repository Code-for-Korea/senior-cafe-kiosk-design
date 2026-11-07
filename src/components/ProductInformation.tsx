import { nutritionRows, type MenuItem } from '../menuData'
import { colors, space } from '../tokens'
import Icon from './Icon'
import NutritionMetrics from './NutritionMetrics'
import { productInfoStyles } from './productInfoStyles'
import { useType } from './useType'

function SectionDivider() {
  // 구역 사이 띠 16. 24였을 때 음료 상세가 열량 칸만 38px 잘려 어중간했다(사용자 2026-11-03).
  return <div data-product-section-divider aria-hidden="true" style={{ height: space.sm, flexShrink: 0, background: 'var(--bg-muted)' }} />
}

// 상품설명, 원재료 안내, 영양정보는 서로 다른 구역으로 읽힌다.
export default function ProductInformation({ item, compact = false }: { item: MenuItem; compact?: boolean }) {
  const t = useType()
  const type = productInfoStyles(t)
  const details = (item.info ?? []).filter(row => row.label !== '영양 정보')
  const labelWidth = t.largeText ? 240 : 220
  // 구역 안 위아래 여백 36(간추린 보기 32). 40이면 5번 메뉴·큰 글씨 아메리카노가 7px 넘쳤다. 세 구역 이름(상품설명·알레르기 안내·영양정보)은 같은 굵기(세미볼드)로 맞춘다.
  const section = { padding: `${compact ? space.lg : space.lg + 4}px ${space.page}px` }
  const heading = { ...type.label, margin: 0, color: colors.textPrimary }
  const hasInformation = !!item.description || !!details.length || !!item.nutrition
  if (!hasInformation) return null

  // 상품설명은 알레르기 안내와 같은 '이름 칸 + 본문' 한 줄 구조다. 이름 칸 폭(labelWidth)과 간격이 같아 본문의 왼쪽 선이 맞는다(사용자 2026-11-03).
  const rowStyle = { display: 'flex', alignItems: 'baseline', gap: space.md } as const
  return <>
    <SectionDivider />
    {item.description && <section aria-label="상품설명" style={section}>
      <div data-product-info-row style={rowStyle}>
        <h2 style={{ ...type.label, width: labelWidth, flexShrink: 0, margin: 0, color: colors.textPrimary }}>상품설명</h2>
        <p data-product-description style={{ ...type.value, minWidth: 0, margin: 0, color: colors.textPrimary }}>{item.description}</p>
      </div>
    </section>}
    {!!details.length && <>
      {item.description && <SectionDivider />}
      <section aria-label="재료와 알레르기 안내" style={section}>
        <dl data-product-info-content style={{ margin: 0 }}>
          {details.map((row, index) => <div key={row.label} style={{
            display: 'flex', alignItems: 'baseline', gap: space.md,
            padding: `${index === 0 ? 0 : space.lg}px 0 ${index === details.length - 1 ? 0 : space.lg}px`,
            borderBottom: index === details.length - 1 ? undefined : `1px solid ${colors.borderDefault}`,
          }}>
            <dt style={{ ...type.label, width: labelWidth, flexShrink: 0, color: colors.textPrimary }}>{row.label}</dt>
            <dd style={{ ...type.value, minWidth: 0, margin: 0, color: colors.textPrimary }}>{row.value}</dd>
          </div>)}
        </dl>
      </section>
    </>}
    {item.nutrition && <>
      {(item.description || !!details.length) && <SectionDivider />}
      <section aria-label="영양정보" data-product-nutrition style={section}>
        {/* 제목과 '1회 제공량 기준' 안내를 한 줄에 둔다(사용자 2026-11-03). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.md }}>
          <h2 style={{ ...heading, flexShrink: 0 }}>영양정보</h2>
          <p style={{ ...t.body, margin: 0, minWidth: 0, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: space.xs }}>
            <Icon name="info" size={t.body.fontSize} color={colors.textSecondary} />
            <span>{item.nutrition.servingNote}</span>
          </p>
        </div>
        <NutritionMetrics rows={nutritionRows(item.nutrition)} />
      </section>
    </>}
  </>
}
