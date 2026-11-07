import { layout, optionStepMetrics, shadow as shadows } from '../design-system/metrics'
import { useLowScreenUtilities } from '../components/useLowScreenUtilities'
import { useRef, useState } from 'react'
import type { OptionStepRow } from '../selectionSummary'
import ItemOrderButtons from '../components/ItemOrderButtons'
import { useAppControls } from '../components/AppControlsContext'
import { useOptionProduct } from '../components/OptionProductContext'
import { useType } from '../components/useType'
import { useTheme } from '../components/ThemeContext'
import LowScreenHeader from '../components/LowScreenHeader'
import UtilityBarVariant from '../components/UtilityBarVariant'
import QuantityStepper from '../components/QuantityStepper'
import Button from '../components/Button'
import { won } from '../orderPricing'
import { useVoiceGuide } from '../voice/VoiceContext'
import ScrollBottomShade from '../components/ScrollBottomShade'
import { chevronGlyphEndInset } from '../components/Icon'
import './low-screen-menu.css'

interface Props {
  question: string
  description?: string
  productName?: string
  steps: OptionStepRow[]
}

// 최종 확인값·변경 이력·담기 가능 여부는 기존 ReviewScreen/App에서 전달받는다.
export default function LowScreenReview({ question, description, productName, steps }: Props) {
  const t = useType()
  const voice = useVoiceGuide()
  const theme = useTheme()
  const controls = useAppControls()
  const product = useOptionProduct()
  const [notice, setNotice] = useState('')
  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const utility = useLowScreenUtilities({ onVoiceUnavailable: () => setNotice('음성 안내는 현재 시안에서 지원하지 않아요.') })
  if (!product) return null
  return <div data-low-review style={{ width: layout.width, height: layout.height, display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
    <LowScreenHeader current={3} description="아래에서 고른 내용을 확인해 주세요." />
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
    <main ref={mainRef} data-voice-scroll-viewport tabIndex={0} aria-label="선택 확인" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
    {/* 기본 4개 옵션은 수량까지 한 화면에 담고, 변경 이력 등 긴 내용만 스크롤한다. */}
    <div ref={contentRef} data-voice-scroll-content style={{ minHeight: '100%', boxSizing: 'border-box', padding: '16px 64px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div data-low-product-heading style={{ minHeight: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <p style={{ ...t.primary, margin: 0, minWidth: 0, color: 'var(--text-primary)' }}>{productName}</p>
          {product && <Button purpose="support" variant="Utility" size="small" ariaLabel={`${productName} 상품정보 보기`} onClick={product.onViewProduct} style={{ height: 80, padding: '0 16px', flexShrink: 0, background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>상품정보</Button>}
        </div>
        {product && <span data-low-base-price aria-label={`기본 가격 ${product.basePrice}`} style={{ ...t.inlinePrice, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{product.basePrice}</span>}
      </div>
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ ...t.title, margin: 0 }}>{question}</h1>
        {description && <p style={{ ...t.body, margin: voice.enabled ? '24px 0 0' : '8px 0 0', color: 'var(--text-secondary)', wordBreak: 'keep-all' }}>{description}</p>}
      </div>
      <ol aria-label="고른 옵션" data-low-review-options data-voice-review-options style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', flexShrink: 0 }}>
        {steps.map(step => <li key={step.key} data-review-option={step.key} style={{ display: 'grid', gridTemplateColumns: '56px 128px minmax(0, 1fr) 160px', columnGap: 24, alignItems: 'center', minHeight: optionStepMetrics.summaryRowHeight, padding: '8px 0' }}>
          <span aria-hidden="true" style={{ ...t.caption, fontWeight: 600, width: 56, height: 56, borderRadius: '50%', border: `2px solid ${theme.borderNeutral}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>{step.number}</span>
          <span style={{ ...t.readable(t.caption), color: 'var(--text-secondary)' }}>{step.title}</span>
          <div style={{ minWidth: 0 }}>
            <span style={{ ...t.info, display: 'block', wordBreak: 'keep-all' }}>{step.value ?? '선택 전'}</span>
            {step.change && <span style={{ ...t.caption, display: 'block', color: 'var(--text-secondary)' }}>{step.change.kind === 'changed' ? `이전: ${step.change.previous}` : '새로 선택'}</span>}
          </div>
          {step.onEdit ? <button aria-label={`${step.title} 바꾸기`} onClick={step.onEdit} style={{ ...t.bodyButton, height: 80, padding: `0 ${chevronGlyphEndInset}px 0 8px`, border: 0, background: 'transparent', color: 'var(--text-primary)', textAlign: 'right', cursor: 'pointer' }}>바꾸기 ›</button> : <span />}
        </li>)}
      </ol>
      <div data-low-review-quantity data-voice-review-quantity style={{ marginTop: 12, marginBottom: 'auto', minHeight: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <QuantityStepper value={product.quantity} onChange={product.onChangeQuantity} />
        <p aria-live="polite" aria-atomic="true" style={{ ...t.inlinePrice, margin: 0 }}>{product.canAdd ? `${won(product.unitPrice)} × ${product.quantity}개` : '선택을 완료해 주세요'}</p>
      </div>
    </div>
    </main>
    <ScrollBottomShade viewportRef={mainRef} contentRef={contentRef} />
    </div>
    <section aria-label="장바구니 담기" data-low-review-actions style={{ padding: '36px 64px', flexShrink: 0, display: 'flex', gap: 24, background: theme.surface, boxShadow: (controls.highContrast ? shadows.actionBarHighContrast : shadows.actionBar) }}>
      <ItemOrderButtons {...product} lowScreen appearance="lowReview" />
    </section>
    <div className="low-menu-utility" style={{ position: 'relative' }}>
      {notice && <p role="status" style={{ ...t.body, position: 'absolute', bottom: '100%', margin: 0, padding: 16, width: '100%', textAlign: 'center', background: theme.surface }}>{notice}</p>}
      <UtilityBarVariant grouped variant="vertical" controls={utility} showDivider={false} />
    </div>
  </div>
}
