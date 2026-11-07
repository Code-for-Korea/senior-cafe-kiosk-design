import { mustResolveBeforeHome, paymentView, type PaymentScene, type CashRejectReason, type CashErrorReason } from './paymentFlow'

export type PaymentMethodId = 'card' | 'cash' | 'mobile'
export interface PaymentSession {
  step: 'method' | PaymentScene
  method: PaymentMethodId | null
  deposited: number
  rejected: CashRejectReason
  error: CashErrorReason
  // 이번 주문에서 기계 문제가 난 결제방법. 결제 방법 화면에서 잠긴다. 직원 조치가 끝나면 풀린다(사용자 2026-10-20).
  unavailable: PaymentMethodId[]
}
export const initialPaymentSession: PaymentSession = { step: 'method', method: null, deposited: 0, rejected: 'unsupported', error: 'change', unavailable: [] }
export interface DemoEvent { id: string; label: string; to: PaymentScene | 'method'; bill?: number; error?: CashErrorReason; rejected?: CashRejectReason }

// Explicit operator controls only: no timers, hardware requests, or payment approvals.
export function paymentDemoEvents(state: PaymentSession): DemoEvent[] {
  const step = state.step
  const next: Partial<Record<PaymentScene, [string, PaymentScene]>> = {
    card: ['카드 삽입 감지', 'cardReading'], cardReading: ['카드 읽기 완료', 'cardProcessing'], cardProcessing: ['승인 성공', 'success'],
    cashInsert: ['지폐 감지', 'cashCounting'], cashMore: ['다음 지폐 감지', 'cashCounting'], cashRejected: ['지폐 감지', 'cashCounting'],
    cashChangePaying: ['거스름돈 지급 완료', 'cashChangeReady'], cashCancel: ['전액 반환 확인', 'cashCancelReturned'],
    mobileScan: ['코드 인식', 'mobileProcessing'], mobileTap: ['휴대폰 인식', 'mobileProcessing'], mobileProcessing: ['승인 성공', 'mobileSuccess'],
    printing: ['출력 완료', 'completeReceipt'], printingSlip: ['출력 완료', 'complete'],
  }
  const event = step === 'method' ? undefined : next[step]
  const events: DemoEvent[] = event ? [{ id: 'next', label: event[0], to: event[1] }] : []
  if (step === 'cashCounting') events.push(
    ...[1000, 5000, 10000].map(bill => ({ id: 'bill-' + bill, label: bill.toLocaleString('ko-KR') + '원 확인', to: 'cashMore' as const, bill })),
    { id: 'unread', label: '지폐 읽기 실패 · 돌아옴', to: 'cashRejected', rejected: 'unread' },
    { id: 'unsupported', label: '지원하지 않는 지폐 · 돌아옴', to: 'cashRejected', rejected: 'unsupported' },
    { id: 'retained', label: '지폐 회수 미확인', to: 'cashError', error: 'retained' },
  )
  if (step === 'cardReading') events.push({ id: 'unread', label: '카드 읽기 실패', to: 'unread' })
  if (step === 'cardProcessing') events.push({ id: 'declined', label: '승인 거절', to: 'declined' })
  if (step === 'cardProcessing' || step === 'mobileProcessing') events.push(
    { id: 'unknown', label: '결제 결과 미확인', to: 'unknown' }, { id: 'device', label: '기기 오류 · 미결제', to: 'device' },
  )
  if (step === 'cashChangePaying' || step === 'cashCancel') events.push({ id: 'cash-error', label: '돈 지급 문제', to: 'cashError', error: step === 'cashCancel' ? 'return' : 'change' })
  if (step === 'printing') events.push({ id: 'receipt-error', label: '영수증 출력 실패', to: 'receiptError' })
  if (step === 'printingSlip') events.push({ id: 'slip-error', label: '주문번호표 출력 실패', to: 'slipError' })
  if (step === 'device' || step === 'unknown' || step === 'cashError') events.push({ id: 'resolved', label: '직원 조치 완료 · 결제방법으로', to: 'method' })
  return events
}

export type PaymentSessionAction = { type: 'reset' } | { type: 'select'; method: PaymentMethodId; total: number }
  | { type: 'navigate'; to: PaymentScene | 'method'; total: number }
  | { type: 'demo'; id: string; total: number }

export function paymentSessionReducer(state: PaymentSession, action: PaymentSessionAction): PaymentSession {
  if (action.type === 'reset') return { ...initialPaymentSession }
  if (!Number.isFinite(action.total) || action.total <= 0) return state
  if (action.type === 'select') return state.step !== 'method' || state.unavailable.includes(action.method) ? state : {
    ...initialPaymentSession, unavailable: state.unavailable, method: action.method, step: action.method === 'card' ? 'card' : action.method === 'cash' ? 'cashInsert' : 'mobileChoice',
  }
  if (action.type === 'navigate') {
    if (state.step === 'method') return state
    const view = paymentView(state.step, action.total, state.deposited, state.rejected, state.error)
    // 화면 버튼이 가리키는 곳과, 시간이 다 되면 저절로 가는 곳(autoNext)만 갈 수 있다.
    if (![view.primary, view.secondary, ...(view.choices ?? []), view.autoNext].some(button => button?.to === action.to)) return state
    return { ...state, step: action.to, deposited: action.to === 'method' ? 0 : state.deposited }
  }
  const event = paymentDemoEvents(state).find(event => event.id === action.id)
  if (!event) return state
  // 직원 조치 완료: 기계가 고쳐졌으니 잠금도 푼다.
  if (event.to === 'method') return { ...initialPaymentSession, method: state.method }
  // 결제 기계 문제: 그 방법을 이번 주문에서 잠근다.
  const unavailable = event.to === 'device' && state.method && !state.unavailable.includes(state.method) ? [...state.unavailable, state.method] : state.unavailable
  const deposited = state.deposited + (event.bill ?? 0)
  const step = event.bill ? deposited < action.total ? 'cashMore' : deposited === action.total ? 'cashComplete' : 'cashChangePaying' : event.to
  return { ...state, step, deposited, unavailable, rejected: event.rejected ?? state.rejected, error: event.error ?? state.error }
}

export function paymentBlocksHome(state: PaymentSession): boolean {
  return state.step !== 'method' && mustResolveBeforeHome(state.step, state.error)
}
export function paymentIsPaid(state: PaymentSession): boolean {
  return ['cashComplete', 'mobileSuccess', 'receipt', 'receiptError', 'slipError', 'completeReceipt', 'complete'].includes(state.step)
}
// 주문 화면처럼 시간 초과로 첫 화면에 돌아가도 되는 결제 화면: 결제 전·미결제(결제 방법, 카드 넣기 안내, 거절·못 읽음, 현금 넣기 전, 모바일 고르기·도움말).
// 돈·카드·처리 중·결과 모름은 ‘처음으로’도 막는 화면이라 멈춘다(기획 S54, 직원이 처리). 결제가 끝난 화면은 완료 자동 복귀(기획 D-13)로 따로 한다(사용자 2026-10-21).
// 출력 실패(영수증·주문번호표)는 결제가 끝났지만 저절로 넘어가기 대신 주문 화면과 같은 경고 창을 거친다(사용자 2026-10-28).
export function paymentAllowsTimeout(state: PaymentSession): boolean {
  if (state.step === 'receiptError' || state.step === 'slipError') return true
  return !paymentBlocksHome(state) && !paymentIsPaid(state)
}
