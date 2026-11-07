import { layout, shadow as shadows } from '../design-system/metrics'
import { useLowScreenUtilities } from '../components/useLowScreenUtilities'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { OptionStepRow } from '../selectionSummary'
import { useAppControls } from '../components/AppControlsContext'
import { useOptionProduct } from '../components/OptionProductContext'
import { useType } from '../components/useType'
import { useTheme } from '../components/ThemeContext'
import LowScreenHeader from '../components/LowScreenHeader'
import UtilityBarVariant from '../components/UtilityBarVariant'
import Button from '../components/Button'
import StepNavigation from '../components/StepNavigation'
import ColdOnlyNotice from '../components/ColdOnlyNotice'
import ScrollBottomShade from '../components/ScrollBottomShade'
import { useVoiceGuide } from '../voice/VoiceContext'
import './low-screen-menu.css'
import './low-screen-options.css'

interface Props {
  isEditMode?: boolean
  question: string
  productName?: string
  steps: OptionStepRow[]
  children: ReactNode
  nextEnabled: boolean
  nextLabel: string
  prevLabel: string
  onNext?: () => void
  onPrev?: () => void
}

// 선택 데이터와 단계 이동은 기존 화면이 담당하고, 낮은 위치의 배치만 제공한다.
export default function LowScreenOptions({ isEditMode = false, question, productName, steps, children, nextEnabled, nextLabel, prevLabel, onNext, onPrev }: Props) {
  const t = useType()
  const theme = useTheme()
  const controls = useAppControls()
  const product = useOptionProduct()
  const voice = useVoiceGuide()
  const [notice, setNotice] = useState('')
  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const currentStep = steps.find(step => step.state === 'current')
  const utility = useLowScreenUtilities({ onVoiceUnavailable: () => setNotice('음성 안내는 현재 시안에서 지원하지 않아요.') })
  return <div data-low-options data-low-edit={isEditMode || undefined} style={{ width: layout.width, height: layout.height, display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
    <LowScreenHeader current={3} description={isEditMode ? '아래에서 바꾼 뒤 적용해 주세요.' : '아래에서 하나씩 골라 주세요.'} />
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
    <main ref={mainRef} data-voice-scroll-viewport tabIndex={0} aria-label={isEditMode ? '선택 바꾸기' : '추가 선택'} style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
    <div ref={contentRef} data-voice-scroll-content style={{ minHeight: '100%', boxSizing: 'border-box', padding: '16px 64px 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div data-low-product-heading style={{ minHeight: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <p style={{ ...t.primary, margin: 0, minWidth: 0, color: 'var(--text-primary)' }}>{productName}</p>
          {product && <Button purpose="support" variant="Utility" size="small" ariaLabel={`${productName} 상품정보 보기`} onClick={product.onViewProduct} style={{ height: 80, padding: '0 16px', flexShrink: 0, background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>상품정보</Button>}
        </div>
        {product && <span data-low-base-price aria-label={`기본 가격 ${product.basePrice}`} style={{ ...t.inlinePrice, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{product.basePrice}</span>}
      </div>
      <ol aria-label="추가 선택 순서" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 24, flexShrink: 0 }}>
        {steps.map(step => <li key={step.key} aria-current={step.state === 'current' ? 'step' : undefined} style={{ ...t.body, fontWeight: step.state === 'current' ? 700 : 500, color: step.state === 'current' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: step.state === 'current' ? '4px solid var(--option-selected-border)' : '4px solid transparent', paddingBottom: 8 }}>
          <span aria-hidden="true">{step.state === 'done' || step.state === 'default' ? '✓ ' : ''}</span>{step.title}
        </li>)}
      </ol>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <h1 data-low-option-question style={{ ...t.title, margin: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
          {currentStep && <span data-low-option-number style={{ ...t.body, fontWeight: 600, width: 56, height: 56, flexShrink: 0, borderRadius: '50%', border: `3px solid ${theme.stateSelectedBorder}`, background: theme.surface, color: theme.stateSelectedText, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{currentStep.number}</span>}
          <span>{question}</span>
        </h1>
        {product && <ColdOnlyNotice item={product.item} />}
      </div>
      <div className="low-options-choices">{children}</div>
    </div>
    </main>
    <ScrollBottomShade viewportRef={mainRef} contentRef={contentRef} />
    </div>
    <section aria-label="선택 단계 이동" data-low-options-actions style={{ padding: '36px 64px', flexShrink: 0, display: 'flex', gap: 24, background: theme.surface, boxShadow: voice.enabled ? 'none' : (controls.highContrast ? shadows.actionBarHighContrast : shadows.actionBar) }}>
      <StepNavigation layout="low" purpose={isEditMode ? 'decision' : 'support'}
        previous={{ label: prevLabel, onClick: onPrev }}
        next={{ label: nextLabel, enabled: nextEnabled, onClick: onNext }} />
    </section>
    <div className="low-menu-utility" style={{ position: 'relative' }}>
      {notice && <p role="status" style={{ ...t.body, position: 'absolute', bottom: '100%', margin: 0, padding: 16, width: '100%', textAlign: 'center', background: theme.surface }}>{notice}</p>}
      <UtilityBarVariant grouped variant="vertical" controls={utility} showDivider={false} />
    </div>
  </div>
}
