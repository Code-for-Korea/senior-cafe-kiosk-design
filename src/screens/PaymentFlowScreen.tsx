import { useAppControls } from '../components/AppControlsContext'
import LowScreenHeader from '../components/LowScreenHeader'
import { PaymentAmount, PaymentMoneySummary } from '../payment/PaymentAmount'
import GuideCue from '../voice/GuideCue'
import ButtonTips from '../voice/ButtonTips'
import { paymentGuide } from '../voice/guides'
import { useVoiceGuide } from '../voice/VoiceContext'
import { useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import Icon from '../components/Icon'
import ProgressStep from '../components/ProgressStep'
import UtilityBar from '../components/UtilityBar'
import { useType } from '../components/useType'
import { font } from '../tokens'
import PaymentIllustration from '../payment/PaymentIllustration'
import MobilePaymentHelpDialog from '../payment/MobilePaymentHelpDialog'
import { isMobileHelpScene, paymentView, type CashErrorReason, type CashRejectReason, type PaymentDestination, type PaymentScene } from '../payment/paymentFlow'
import { useCountdown } from '../hooks/useCountdown'
import { devParams } from '../devParams'
import '../previews/low-screen-menu.css'
import '../payment/payment-flow.css'

export default function PaymentFlowScreen({ scene, lowScreen, onToggleLowScreen, total, deposited = 0, rejected = 'unsupported', cashError = 'change', orderNumber, onNavigate, canChangeMethod = true, autoPaused = false, personalCup = false }: {
  // 고장 나지 않은 다른 결제방법이 남아 있는지(기기 문제 화면).
  canChangeMethod?: boolean
  // 창이 열려 있거나 직원이 오는 중이면 저절로 넘어가기를 멈춘다.
  autoPaused?: boolean
  // 장바구니에 개인컵으로 받는 음료가 있으면 완료 화면에 '개인 컵을 카운터에 가져다주세요'를 보여 준다.
  personalCup?: boolean
  scene: PaymentScene; lowScreen: boolean; onToggleLowScreen: () => void; total: number; deposited?: number;
  rejected?: CashRejectReason; cashError?: CashErrorReason; orderNumber?: string; onNavigate: (to: PaymentDestination) => void
}) {
  const t = useType()
  const { staffPending } = useAppControls()
  // 직원을 이미 불렀으면 화면 안 버튼도 아래 기능바처럼 ‘직원 호출 중’(누르면 기다리는 창). 두 번 부르는 것처럼 보이지 않게(사용자 2026-10-20).
  const actionLabel = (a: { label: string; to: string }) => a.to === 'staff' && staffPending ? '직원 호출 중' : a.label
  const { focusTarget, warningVisible } = useVoiceGuide()
  const [helpOpen, setHelpOpen] = useState(false)
  // Existing preview links also open help over the scanner, never a payment-like page.
  const helpPreview = isMobileHelpScene(scene) ? scene : null
  const displayScene = helpPreview ? 'mobileScan' : scene
  const v = paymentView(displayScene, total, deposited, rejected, cashError, canChangeMethod, staffPending)
  const personalCupNotice = personalCup && (displayScene === 'complete' || displayScene === 'completeReceipt' || displayScene === 'slipError' || displayScene === 'receiptError')
    ? '개인 컵을 카운터에 가져다주세요.' : null
  const complete = v.layout === 'complete'
  // 큰 글씨에서는 결제 완료 글자를 공통 크기표보다 한 단계 더 키운다(기본 글씨와 차이가 보이게, 2026-10-18 사용자). 주문번호 숫자는 두 모드 같음.
  const completeLarge = complete && t.largeText ? { label: 44, task: 48, closing: 36 } : null
  const tasks = [...(v.tasks ?? []), ...(personalCupNotice ? [personalCupNotice] : [])]
  const completionGuide = paymentGuide(displayScene, { orderNumber, personalCup: !!personalCupNotice, staffPending, canChangeMethod, copy: [v.title, v.emphasis ?? '', v.description ?? ''] })
  const guideId = displayScene + '-' + rejected + '-' + cashError
  // 결제 끝 화면: 손대지 않으면 저절로 넘어간다(완료 20초·영수증 고르기 전 30초). 캡처 주소에서는 멈춘 채 처음 값을 보인다.
  const autoLeft = useCountdown(v.autoNext?.seconds ?? 0, !!v.autoNext && !autoPaused && !devParams.capture, () => { if (v.autoNext) onNavigate(v.autoNext.to) })
  const closeHelp = () => { setHelpOpen(false); if (helpPreview) onNavigate('mobileScan') }
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => { title.current?.focus({ preventScroll: true }) }, [scene, rejected, cashError])
  const insertion = v.layout === 'insertion'
  // 현금 화면(금액 줄이 있는 화면)은 큰 글씨에서 설명도 금액 줄과 같이 36(사용자 2026-10-20).
  const cashCopy = v.moneyRows ? t.readable(t.body) : t.body
  const description = v.description && <p data-payment-description className={v.singleLine ? 'payment-single-line' : ''} style={{ ...cashCopy, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>{v.description}</p>
  const spinner = <div className="payment-spinner" role="img" aria-label="처리 중" />
  const pill = insertion || (v.layout === 'mobile' && !v.primary)
  return <><div className={'payment-flow-screen' + (lowScreen ? ' is-low' : '') + (warningVisible ? ' has-voice-warning' : '')} data-payment-scene={displayScene}>
    <GuideCue guide={{ ...completionGuide, id: guideId }} />
    {lowScreen ? <LowScreenHeader current={5} description="아래 안내에 따라 진행해 주세요." descriptionTone="primary" className="payment-flow-low-header" /> : <header className="payment-flow-header"><ProgressStep current={5} /></header>}
    <main className={'payment-flow-content' + (scene.startsWith('cash') ? ' is-cash' : '')} data-layout={v.layout ?? 'result'}>
      {v.layout === 'processing' && spinner}
      <div className="payment-flow-copy">
        <h1 ref={title} tabIndex={-1} style={{ ...t.title, margin: 0, outline: 'none' }}>{v.title}</h1>
        {v.emphasis && <p style={{ ...cashCopy, fontWeight: font.semibold, margin: 0, whiteSpace: 'pre-line' }}>{v.emphasis}</p>}
        {!insertion && !complete && description}
      </div>
      {v.supported && <p className="payment-supported" style={t.body}>{v.supported.join('  ·  ')}</p>}
      {v.help && <div className="payment-code-help"><Button purpose="support" size="small" variant="Tertiary" ariaHasPopup="dialog" ariaExpanded={helpOpen || !!helpPreview} onClick={() => setHelpOpen(true)} style={{ width: 'fit-content', paddingInline: 16, border: 0, background: 'transparent' }}>
        <Icon name="info" size={32} color="var(--text-primary)" />
        {v.help.label}
        <Icon name="chevronRight" size={28} color="var(--text-primary)" />
      </Button></div>}
      {v.orderNumber && !complete && <div className="payment-order-number"><span style={t.body}>주문번호</span><strong style={t.title}>{orderNumber ?? '[주문번호]'}</strong></div>}
      {/* 결제 완료: 음료를 받을 때 필요한 주문번호를 가장 크게, 그 아래 할 일, 인사는 맨 아래 작게 */}
      {complete && <>
        <div className="payment-order-hero"><span style={{ ...t.primary, ...(completeLarge && { fontSize: completeLarge.label }), margin: 0 }}>주문번호</span><strong>{orderNumber ?? '[주문번호]'}</strong></div>
        {tasks.length > 0 && <ol className={'payment-tasks' + (tasks.length > 1 ? ' is-numbered' : '') + (completeLarge ? ' is-large' : '')} style={{ ...t.primary, ...(completeLarge && { fontSize: completeLarge.task }), fontWeight: font.semibold }}>
          {tasks.map(task => <li key={task} data-personal-cup-reminder={task === personalCupNotice || undefined}>{task}</li>)}
        </ol>}
        {v.description && <div className="payment-flow-copy"><p data-payment-description style={{ ...t.body, ...(completeLarge && { fontSize: completeLarge.closing }), color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>{v.description}</p></div>}
      </>}
      {/* 버튼마다 조건 말풍선이 있는 고르기(휴대폰 결제 방법): 음성 안내를 켜면 버튼 바로 위에 하나씩. */}
      {v.choices && <ButtonTips id={guideId} tips={completionGuide.tips} columns={`repeat(${v.choices.length}, minmax(0, 1fr))`} gap="var(--space-md)" />}
      {v.choices && <div className="payment-choice-grid" style={{ gridTemplateColumns: `repeat(${v.choices.length}, 1fr)` }}>{v.choices.map(choice => <Button purpose="decision" key={choice.to} variant="Tertiary" voiceAction={'payment-choice-' + choice.to} onClick={() => onNavigate(choice.to)} style={{ width: '100%', height: v.choices!.length === 2 ? 256 : 160 }}><span style={{ whiteSpace: 'normal' }}>{choice.label}</span></Button>)}</div>}
      {v.steps && <ol className="payment-help-steps" style={t.body}>{v.steps.map(step => <li key={step}>{step}</li>)}</ol>}
      {v.layout !== 'processing' && <>
        {v.busy ? spinner : v.art && <div className="payment-figure"><PaymentIllustration kind={v.art} lowScreen={lowScreen} insertion={insertion} />{insertion && description}</div>}
      </>}
      {v.amountLabel && <PaymentAmount label={v.amountLabel} amount={total} />}
      {v.moneyRows && <PaymentMoneySummary rows={v.moneyRows} focusedLabel={focusTarget === 'cash-deposited' ? '넣은 금액' : undefined} />}
      {/* 음성 안내를 켜면 버튼마다 바로 위에 말풍선(왼쪽 버튼부터). 자리를 차지해 버튼을 가리지 않는다. */}
      {v.primary && v.secondary && <ButtonTips id={guideId} tips={completionGuide.tips} columns="minmax(0, 1fr) minmax(0, 1fr)" gap="var(--space-md)" />}
      {(v.primary || v.secondary) && <div className={'payment-actions' + (pill ? ' is-pill' : '')}>
        {v.secondary && <Button purpose="decision" variant="Tertiary" voiceAction="payment-secondary" onClick={() => onNavigate(v.secondary!.to)} style={{ flex: pill ? undefined : 1, width: pill ? 'fit-content' : undefined, paddingInline: 32 }}><span style={{ whiteSpace: 'pre-line' }}>{actionLabel(v.secondary)}</span></Button>}
        {v.primary && <Button purpose="decision" variant={v.neutralActions || (v.primary.to === 'staff' && staffPending) ? 'Tertiary' : 'Primary'} voiceAction="payment-primary" onClick={() => onNavigate(v.primary!.to)} style={{ flex: 1 }}><span style={{ whiteSpace: 'pre-line' }}>{actionLabel(v.primary)}</span></Button>}
      </div>}
      {v.autoNext && <p role="timer" aria-live="off" data-payment-auto style={{ ...t.body, color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}><strong style={{ fontWeight: font.bold, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{autoLeft}초</strong> {v.autoNext.text}</p>}
    </main>
    <UtilityBar lowScreen={lowScreen} onToggleLowScreen={onToggleLowScreen} />
  </div>
    {(helpOpen || helpPreview) && <MobilePaymentHelpDialog lowScreen={lowScreen} initialApp={helpPreview && helpPreview !== 'mobileHelp' ? helpPreview : null} onClose={closeHelp} />}
  </>
}
