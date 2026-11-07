import { layout } from '../design-system/metrics'
import { useState } from 'react'
import PaymentMethodScreen, { type PaymentMethod } from '../screens/PaymentMethodScreen'
import PaymentFlowScreen from '../screens/PaymentFlowScreen'
import Button from '../components/Button'
import { DialogFrame } from '../components/ConfirmDialog'
import { paymentScenes, isPaymentScene, demoDeposit, mustResolveBeforeHome, cashRejectReasons, cashErrorReasons, type PaymentScene, type PaymentDestination, type CashRejectReason, type CashErrorReason } from '../payment/paymentFlow'
import { cartTotals } from '../cartSelection'
import { AppControlsProvider } from '../components/AppControlsContext'
import { useKioskScale } from '../hooks/useKioskScale'
import { devParams } from '../devParams'
import { lightColorVariables, highContrastColorVariables } from '../colorSystem'
import { menuItems } from '../menuData'
import { defaultOrder } from '../orderDefaults'
import type { CartEntry } from '../screens/CartScreen'
import './payment-study.css'

// 승인 전에는 실제 주문 상태와 분리한다. 결제 서버나 단말기를 호출하지 않는다.
const sampleItems: CartEntry[] = [
  { id: 1, product: menuItems.find(item => item.id === '2')!, quantity: 2, order: { ...defaultOrder, temperature: 'COLD', sizeCode: 'L', caffeineType: 'DECAF', iceAmount: 'LESS' } },
  { id: 2, product: menuItems.find(item => item.id === '5')!, quantity: 1, order: { ...defaultOrder, temperature: 'COLD' } },
  { id: 3, product: menuItems.find(item => item.id === '4')!, quantity: 1, order: { ...defaultOrder } },
]

type Step = 'method' | PaymentScene
const initialStep = (): Step => {
  const param = new URLSearchParams(window.location.search).get('paymentStep')
  return isPaymentScene(param) ? param : param === 'cash' ? 'cashInsert' : param === 'mobile' ? 'mobileChoice' : 'method'
}

export default function PaymentStudy({ initialLow = false }: { initialLow?: boolean }) {
  const total = cartTotals(sampleItems).total
  const [low, setLow] = useState(initialLow)
  const [step, setStep] = useState<Step>(initialStep)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [largeText, setLargeText] = useState(devParams.largeText)
  const [highContrast, setHighContrast] = useState(devParams.highContrast)
  const [rejected, setRejected] = useState<CashRejectReason>('unsupported')
  const [cashError, setCashError] = useState<CashErrorReason>('change')
  const [deposited, setDeposited] = useState(() => { const first = initialStep(); return first === 'method' ? 0 : demoDeposit(first, total, 'change') })
  const [dialog, setDialog] = useState<'staff' | 'resolve' | null>(null)
  const [notice, setNotice] = useState('로컬 시연 · 실제 결제·기기·직원 호출 없음 · 주문번호는 자리표시')
  const { scale } = useKioskScale(128)
  const selectScenario = (next: Step, error: CashErrorReason = cashError) => {
    setStep(next)
    setDialog(null)
    setDeposited(next === 'method' ? 0 : demoDeposit(next, total, error))
  }
  const navigate = (to: PaymentDestination) => {
    if (to === 'staff') { setDialog('staff'); return }
    if (to === 'home') {
      if (step !== 'method' && mustResolveBeforeHome(step, cashError)) { setDialog('resolve'); return }
      setStep('method'); setDeposited(0); setSelectedMethod(null)
      setNotice('시연을 마쳤어요. 결제방법 선택 화면으로 돌아왔어요.')
      return
    }
    if (to === 'method') setDeposited(0)
    setStep(to)
  }
  const bill = (amount: number) => {
    const sum = deposited + amount
    setDeposited(sum)
    setStep(sum < total ? 'cashMore' : sum === total ? 'cashComplete' : 'cashChangePaying')
  }
  const nextEvent: Partial<Record<Step, [string, PaymentScene]>> = {
    card: ['카드 삽입 감지', 'cardReading'], cardReading: ['카드 읽기 완료', 'cardProcessing'], cardProcessing: ['승인 성공', 'success'],
    cashInsert: ['지폐 감지', 'cashCounting'], cashMore: ['다음 지폐 감지', 'cashCounting'], cashChangePaying: ['거스름돈 지급 완료', 'cashChangeReady'], cashCancel: ['전액 반환 확인', 'cashCancelReturned'],
    mobileScan: ['코드 인식', 'mobileProcessing'], mobileTap: ['휴대폰 인식', 'mobileProcessing'], mobileProcessing: ['승인 성공', 'mobileSuccess'], printing: ['출력 완료', 'completeReceipt'],
  }
  const next = nextEvent[step]
  return <AppControlsProvider value={{ largeText, highContrast, toggleLargeText: () => setLargeText(value => !value), toggleHighContrast: () => setHighContrast(value => !value), onHome: () => navigate('home'), onStaff: () => navigate('staff'), staffPending: false }}>
    <div className="payment-study-bar">
      <div className="payment-study-tools">
        <label>화면 확인 <select aria-label="결제 시연 화면" value={step} onChange={event => selectScenario(event.target.value as Step)}><option value="method">결제방법 선택</option>{Object.entries(paymentScenes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <button onClick={() => setLow(value => !value)}>{low ? '기본 배치 보기' : '낮은 배치 보기'}</button>
        {next && <button onClick={() => setStep(next[1])}>시연: {next[0]}</button>}
        {step === 'cashCounting' && <>{[1000, 5000, 10000].map(amount => <button key={amount} onClick={() => bill(amount)}>시연: {amount.toLocaleString()}원 확인</button>)}</>}
        {step === 'cashCounting' && <button onClick={() => setStep('cashRejected')}>시연: 지폐 거부·돌아옴</button>}
        {(step === 'cashChangePaying' || step === 'cashCancel') && <button onClick={() => { setCashError(step === 'cashCancel' ? 'return' : 'change'); setStep('cashError') }}>시연: 돈 지급 문제</button>}
        {step === 'mobileProcessing' && <button onClick={() => setStep('unknown')}>시연: 결과 미확인</button>}
        {step === 'cardReading' && <button onClick={() => setStep('unread')}>시연: 읽기 실패</button>}
        {step === 'cardProcessing' && <button onClick={() => setStep('declined')}>시연: 승인 거절</button>}
        {step === 'printing' && <button onClick={() => setStep('receiptError')}>시연: 출력 실패</button>}
        {step === 'cashRejected' && <select aria-label="지폐 안내 사유" value={rejected} onChange={event => setRejected(event.target.value as CashRejectReason)}>{Object.entries(cashRejectReasons).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>}
        {step === 'cashError' && <select aria-label="현금 오류 사유" value={cashError} onChange={event => { const reason = event.target.value as CashErrorReason; setCashError(reason); selectScenario('cashError', reason) }}>{Object.entries(cashErrorReasons).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>}
      </div>
      <span role="status">{notice}</span>
      <small>금액은 시연 예시입니다. 현금·모바일 그림의 실제 위치와 지원 앱은 단말기 확정 후 맞춥니다.</small>
    </div>
    <div style={{ minHeight: 'calc(100dvh - 128px)', display: 'flex', justifyContent: 'center', background: '#202020' }}>
      <div style={{ width: layout.width * scale, height: layout.height * scale }}>
        <div id="kiosk-canvas" data-typography="figma" data-color-mode={highContrast ? 'hc' : 'light'} style={{ ...(highContrast ? highContrastColorVariables : lightColorVariables), width: layout.width, height: layout.height, position: 'relative', transform: 'scale(' + scale + ')', transformOrigin: 'top left', overflow: 'hidden' }}>
          {step === 'method' ? <PaymentMethodScreen lowScreen={low} onToggleLowScreen={() => setLow(value => !value)} items={sampleItems} initialSelected={selectedMethod}
            onBack={() => setNotice('현재는 결제 화면 시안입니다. 장바구니 연결은 기존 주문 흐름 통합 시 적용합니다.')}
            onContinue={method => { setSelectedMethod(method); setDeposited(0); setStep(method === 'card' ? 'card' : method === 'cash' ? 'cashInsert' : 'mobileChoice') }} />
            : <PaymentFlowScreen key={step} scene={step} lowScreen={low} onToggleLowScreen={() => setLow(value => !value)} total={total} deposited={deposited} rejected={rejected} cashError={cashError} orderNumber="27" onNavigate={navigate} />}
          {dialog && <DialogFrame titleId="payment-preview-dialog" lowScreen={low} onDismiss={() => setDialog(null)} title={dialog === 'staff' ? '직원 도움 안내' : '먼저 결제 상태를 확인해 주세요'} message={dialog === 'staff' ? '시연용 안내입니다. 실제 직원 호출은 연결되지 않았어요.' : '진행 중인 결제나 돌려받을 돈을 확인한 뒤 마쳐 주세요. 도움이 필요하면 직원을 불러 주세요.'}>
            <Button purpose="support" variant="Primary" onClick={() => setDialog(null)}>안내로 돌아가기</Button>
          </DialogFrame>}
        </div>
      </div>
    </div>
  </AppControlsProvider>
}
