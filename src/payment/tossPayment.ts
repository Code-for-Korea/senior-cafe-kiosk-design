// Toss 페이먼츠 테스트 결제(카드, 클라이언트 전용 데모) 연결.
// 이 앱의 카드 결제는 원래 화면 밖 `시연:` 버튼으로 결과를 고르는 시뮬레이터였다.
// 여기서는 카드만 Toss 테스트 결제창으로 대체한다. 승인(confirm) API는 서버가 필요해
// 호출하지 않는다 — 결제창 인증 후 successUrl로 돌아온 것을 그대로 '완료'로 간주하는 데모다.
//
// Toss 실결제 SDK는 성공/실패 시 리다이렉트 방식이라, 이 앱은 새로고침하면 상태가 초기화된다.
// 그래서 결제창으로 떠나기 전에 복원에 필요한 최소 상태를 sessionStorage에 저장했다가,
// 돌아왔을 때(App 부트스트랩) 복원해 결제 완료/거절 화면을 보여 준다.
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { menuItems } from '../menuData'
import type { CartEntry } from '../screens/CartScreen'
import type { OrderMethod } from '../orderMethod'
import type { OrderState } from '../types'

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY
// Toss 테스트 클라이언트 키가 설정돼 있는지. 없으면 카드도 기존 시뮬레이터로 간다(순수 UI 데모).
export const hasTossKey = !!CLIENT_KEY
const SNAPSHOT_KEY = 'cafe-toss-snapshot'
// Toss가 리다이렉트로 돌려주는 쿼리와 우리 표식. 돌아온 뒤 URL에서 지운다.
const REDIRECT_KEYS = ['toss', 'paymentKey', 'orderId', 'amount', 'code', 'message'] as const

export interface PaymentView {
  largeText: boolean
  highContrast: boolean
  lowScreen: boolean
}

// 직렬화 가능한 장바구니 한 줄. product는 id만 저장하고 복원 때 menuData에서 되살린다.
interface CartLineSnapshot {
  id: number
  productId: string
  order: OrderState
  quantity: number
  // 개인컵 할인 여부. 저장해 두어야 복원한 금액이 토스로 보낸 금액과 같아진다.
  personalCup?: boolean
}

export interface PaymentSnapshot {
  cart: CartLineSnapshot[]
  orderMethod: OrderMethod
  orderNumber: number
  view: PaymentView
  // 이 결제에 보낸 주문번호와 금액. 돌아온 Toss 결과의 orderId·amount와 같은지 확인해 성공을 신뢰한다.
  orderId: string
  total: number
}

export type TossRedirect =
  | { result: 'success'; paymentKey: string; orderId: string; amount: number }
  | { result: 'fail'; code: string; message: string }

function makeOrderId(orderNumber: number): string {
  // 6~64자, 영문·숫자·`-`·`_`·`=`만. 각 요청마다 고유해야 한다.
  return `cafe-${orderNumber}-${Date.now()}`
}

function makeOrderName(cart: CartEntry[]): string {
  const first = cart[0]?.product.name ?? '주문'
  const name = cart.length > 1 ? `${first} 외 ${cart.length - 1}건` : first
  return name.slice(0, 100) // Toss orderName 최대 100자
}

function saveSnapshot(snapshot: PaymentSnapshot): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // sessionStorage를 못 쓰는 환경이면 복원만 포기한다(결제창은 그대로 뜬다).
  }
}

// 저장된 스냅샷을 읽고 바로 지운다(한 번만 복원).
export function restoreSnapshot(): PaymentSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY)
    sessionStorage.removeItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as PaymentSnapshot) : null
  } catch {
    return null
  }
}

// 스냅샷의 장바구니를 실제 CartEntry[]로 되살린다(개인컵 할인 표시까지).
export function snapshotToCart(snapshot: PaymentSnapshot): CartEntry[] {
  return snapshot.cart.flatMap(line => {
    const product = menuItems.find(item => item.id === line.productId)
    return product ? [{ id: line.id, product, order: line.order, quantity: line.quantity, personalCup: line.personalCup }] : []
  })
}

// successUrl/failUrl에 붙어 돌아온 Toss 결과를 읽고, URL에서 결제 흔적을 지운다(새로고침 재진입 방지).
function readTossRedirect(): TossRedirect | null {
  const params = new URLSearchParams(window.location.search)
  const flag = params.get('toss')
  if (flag !== 'success' && flag !== 'fail') return null

  let redirect: TossRedirect
  if (flag === 'success') {
    redirect = {
      result: 'success',
      paymentKey: params.get('paymentKey') ?? '',
      orderId: params.get('orderId') ?? '',
      amount: Number(params.get('amount') ?? 0),
    }
  } else {
    redirect = {
      result: 'fail',
      code: params.get('code') ?? 'UNKNOWN',
      message: params.get('message') ?? '결제가 완료되지 않았어요.',
    }
  }

  REDIRECT_KEYS.forEach(key => params.delete(key))
  const query = params.toString()
  const cleaned = window.location.pathname + (query ? `?${query}` : '') + window.location.hash
  window.history.replaceState(null, '', cleaned)
  return redirect
}

// 모듈을 불러오는 시점에 한 번만 평가한다. Toss에서 돌아온 경우에만 값이 있다.
export const tossBootstrap: { redirect: TossRedirect; snapshot: PaymentSnapshot | null } | null = (() => {
  const redirect = readTossRedirect()
  if (!redirect) return null
  const snapshot = restoreSnapshot()
  // 디버그: 결제 복귀 시 토스 결과와 스냅샷 복원 여부를 남긴다. (문제 확인용)
  console.info('[toss] 결제 복귀:', redirect, '· 스냅샷:', snapshot ? '복원됨' : '없음')
  return { redirect, snapshot }
})()

// 토스 결과(successUrl/failUrl)로 주문 성공 여부를 판정한다. 결제창에서 성공하면 successUrl,
// 취소·이탈·실패나 결제창 열기 실패는 failUrl로 돌아온다. 클라이언트 전용 데모라 승인 confirm은
// 호출하지 않으므로(실제 승인·청구 없음), 토스가 보낸 결과 플래그 자체를 신뢰한다.
export function tossOutcome(redirect: TossRedirect): 'success' | 'fail' {
  return redirect.result === 'success' ? 'success' : 'fail'
}

// 카드 결제창을 연다. 현재 상태를 저장한 뒤 Toss 테스트 결제창으로 이동한다.
// 성공은 successUrl, 취소·이탈·실패는 failUrl로 토스가 리다이렉트한다. 결제창을 아예 열지 못하면
// (키 종류 오류·네트워크 등) 성공으로 넘어가지 않도록 직접 failUrl로 보내 실패(거절) 화면을 띄운다.
// 호출부는 hasTossKey가 true일 때만 부른다(키가 없으면 카드도 시뮬레이터로 간다).
export async function startCardPayment(input: {
  total: number
  cart: CartEntry[]
  orderMethod: OrderMethod
  orderNumber: number
  view: PaymentView
}): Promise<void> {
  const base = window.location.origin + window.location.pathname
  const orderId = makeOrderId(input.orderNumber)
  saveSnapshot({
    cart: input.cart.map(entry => ({ id: entry.id, productId: entry.product.id, order: entry.order, quantity: entry.quantity, personalCup: entry.personalCup })),
    orderMethod: input.orderMethod,
    orderNumber: input.orderNumber,
    view: input.view,
    orderId,
    total: input.total,
  })

  try {
    if (!CLIENT_KEY) throw new Error('VITE_TOSS_CLIENT_KEY 미설정')
    const tossPayments = await loadTossPayments(CLIENT_KEY)
    const payment = tossPayments.payment({ customerKey: ANONYMOUS })
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: input.total },
      orderId,
      orderName: makeOrderName(input.cart),
      successUrl: `${base}?toss=success`,
      failUrl: `${base}?toss=fail`,
    })
  } catch (error) {
    // 결제창을 열지 못함(키 종류 오류·네트워크 등). 성공으로 넘기지 않고 실패 화면으로 보낸다.
    console.error('[toss] 카드 결제창을 열지 못했어요 · 결제 실패로 처리합니다.', error)
    window.location.assign(`${base}?toss=fail&code=START_FAILED`)
  }
}
