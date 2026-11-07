import { paymentDemoEvents, type PaymentSession } from './paymentSession'
import '../previews/payment-study.css'

export default function PaymentDemoControls({ state, onEvent }: { state: PaymentSession; onEvent: (id: string) => void }) {
  return <div className="payment-study-bar" style={{ width: '100%', flexShrink: 0 }}>
    <strong>결제 시연 · 실제 결제·기기·직원 호출 없음 · 주문번호는 자리표시</strong>
    <div className="payment-study-tools" aria-label="결제 시연 조작">
      {paymentDemoEvents(state).map(event => <button key={event.id} onClick={() => onEvent(event.id)}>시연: {event.label}</button>)}
    </div>
    <small>장바구니의 상품·금액으로 진행합니다. 기기 반응은 위 시연 버튼으로 확인해 주세요.</small>
  </div>
}
