import { useOrderPricing } from './useOrderPricing'
import { menuCardMetrics } from '../design-system/metrics'
import { menuImage, nutritionRows, type MenuItem } from '../menuData'
import type { Temperature } from '../types'
import { colors, space } from '../tokens'
import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import { useType } from './useType'
import { dialogVoice } from '../voice/guides'
import NutritionMetrics from './NutritionMetrics'

export default function ProductInfoDialog({ item, temperature = null, onClose }: { item: MenuItem; temperature?: Temperature; onClose: () => void }) {
  const { priceText } = useOrderPricing()
  const t = useType()
  const details = (item.info ?? []).filter(row => row.label !== '영양 정보')
  const sectionStyle = { paddingTop: 32, borderTop: `1px solid ${colors.borderDefault}`, display: 'flex' as const, flexDirection: 'column' as const, gap: 24, flexShrink: 0 }
  const headingStyle = { ...t.info, fontWeight: 600, margin: 0, color: colors.textPrimary }
  return (
    <DialogFrame titleId="product-info-title" title={null} onDismiss={onClose} voice={{ ...dialogVoice.productInfo, target: '[data-voice-action="dialog-close"]' }}>
      <div data-product-info-scroll role="region" aria-label={`${item.name} 상세 안내`} tabIndex={0} style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 40, paddingRight: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexShrink: 0 }}>
          <div style={{ width: 176, height: 176, flexShrink: 0, overflow: 'hidden', borderRadius: 16, background: menuCardMetrics.imageBackground, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.imageUrl
              ? <img src={menuImage(item, temperature)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: item.imagePosition ?? 'center' }} />
              : <span aria-hidden="true" style={{ fontSize: 120 }}>{item.emoji}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, minWidth: 0 }}>
            <h2 id="product-info-title" style={{ ...t.primary, color: colors.textPrimary, margin: 0, wordBreak: 'keep-all' }}>{item.name}</h2>
            <span style={{ ...t.price, color: colors.textSecondary }}>{priceText(item)}</span>
          </div>
        </div>
        {item.description && <section aria-label="상품설명" style={sectionStyle}>
          <h3 style={headingStyle}>상품설명</h3>
          <p style={{ ...t.info, lineHeight: 1.5, color: colors.textPrimary, margin: 0, wordBreak: 'keep-all' }}>{item.description}</p>
        </section>}
        {details.length > 0 && <section aria-label="재료와 알레르기 안내" style={sectionStyle}>
          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {details.map((row) => <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <dt style={headingStyle}>{row.label}</dt>
              <dd style={{ ...t.info, lineHeight: 1.5, color: colors.textPrimary, margin: 0, wordBreak: 'keep-all' }}>{row.value}</dd>
            </div>)}
          </dl>
        </section>}
        {item.nutrition && <section aria-label="영양정보" style={sectionStyle}>
          <h3 style={headingStyle}>영양정보</h3>
          <p style={{ ...t.body, color: colors.textSecondary, margin: 0 }}>{item.nutrition.servingNote}</p>
          <NutritionMetrics rows={nutritionRows(item.nutrition)} />
        </section>}
      </div>
      <Button purpose="support" variant="Primary" voiceAction="dialog-close" onClick={onClose} style={{ flexShrink: 0 }}>닫기</Button>
    </DialogFrame>
  )
}
