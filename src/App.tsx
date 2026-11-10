import GuideCue from './voice/GuideCue'
import { dialogVoice, orderGuide, type OrderVoiceInfo } from './voice/guides'
import { lightColorVariables, highContrastColorVariables } from './colorSystem'
import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { OrderState, ScreenId, Temperature } from './types'
import TemperatureScreen from './screens/TemperatureScreen'
import SizeScreen from './screens/SizeScreen'
import CaffeineScreen from './screens/CaffeineScreen'
import IceScreen from './screens/IceScreen'
import ReviewScreen from './screens/ReviewScreen'
import CartScreen from './screens/CartScreen'
import type { CartEntry } from './screens/CartScreen'
import MenuScreen from './screens/MenuScreen'
import type { MenuItem } from './screens/MenuScreen'
import ProductDetailScreen from './screens/ProductDetailScreen'
import { useKioskScale } from './hooks/useKioskScale'
import { AppControlsProvider } from './components/AppControlsContext'
import { menuItems, hasCaffeineChoice, hasIceChoice, canEditOption } from './menuData'
import { basePrice, won, unitPrice, sizeAvailable, sizeOptions } from './orderPricing'
import { cartOrderReady } from './cartOptionEdit'
import { addedNoticeCopy, addToCartItem, applyCartEdit, cartTotals, findSameCartItem, removeCartItems, sameItemMessage } from './cartSelection'
import AddedNotice from './components/AddedNotice'
import { MAX_QUANTITY } from './components/QuantityStepper'
import { devParams } from './devParams'
import { DEFAULT_ICE, defaultOrder, sizeMlMap } from './orderDefaults'
import { beginOrder, entryTemperature } from './orderEntry'
import ConfirmDialog, { DialogFrame } from './components/ConfirmDialog'
import Button from './components/Button'
import { space } from './tokens'
import PaymentMethodScreen from './screens/PaymentMethodScreen'
import PaymentFlowScreen from './screens/PaymentFlowScreen'
import PaymentDemoControls from './payment/PaymentDemoControls'
import { initialPaymentSession, paymentSessionReducer, paymentAllowsTimeout, paymentBlocksHome, paymentIsPaid, paymentDemoEvents, type PaymentSession } from './payment/paymentSession'
import { paymentLocksUtility, homePrintsSlipFirst, homeLosesOrderNumber } from './payment/paymentFlow'
import type { PaymentDestination } from './payment/paymentFlow'
import { tossBootstrap, startCardPayment, snapshotToCart, tossOutcome, hasTossKey } from './payment/tossPayment'
import OrderMethodDialog from './components/OrderMethodDialog'
import type { OrderMethod } from './components/OrderMethodDialog'
import PersonalCupDialog from './components/PersonalCupDialog'
import { OptionEditProvider } from './components/OptionEditContext'
import { sizeText } from './selectionSummary'
import { OptionProductProvider } from './components/OptionProductContext'
import ProductInfoDialog from './components/ProductInfoDialog'
import OrderMethodScreen from './screens/OrderMethodScreen'
import AttractScreen from './screens/AttractScreen'
import { initialStaffCall, staffCallReducer, staffCallPausesInactivity, STAFF_LATE_MS } from './staffCall'
import { useInactivity } from './hooks/useInactivity'
import { StaffCallDialog, IdleWarningDialog } from './components/SessionDialogs'
import type { Language } from './components/LanguageBar'
import { SoldOutContext } from './soldOut'
import { MENU_LOAD_TIMEOUT_MS, MenuLoadContext, type MenuLoadStatus } from './menuLoad'

import { LowCartScreen, LowMenuScreen, LowScreenProduct, preloadLowScreens } from './lowScreens'
import ScreenPreparing from './components/ScreenPreparing'

type AppScreenId = 'attract' | 'method' | 'menu' | 'product' | 'payment' | ScreenId
// 온도를 이어받지 않은 경우만 먼저 묻는다. default는 나머지 기본값, custom은 옵션별 선택.
type OrderMode = 'default' | 'custom'

const initialOrder: OrderState = {
  temperature: null,
  sizeCode: null,
  sizeMl: null,
  caffeineType: null,
  iceAmount: null,
}



// 주소 옵션으로 지정한 시작 상태 (개발·캡처용). 옵션이 없으면 평소와 같다.
const DEV_BAR_H = 56
// 화면 밖 개발용 막대(결제 시연 바·화면 전환 탭)는 로컬 개발 서버에서 ?preview=dev 일 때만 보인다.
// 배포(프로덕션) 빌드에서는 import.meta.env.DEV 가 false라 어떤 경우에도 노출되지 않는다.
const devControls = import.meta.env.DEV && !devParams.previewFrame
const startMode: OrderMode = devParams.orderMode ?? 'custom'
const startSize = devParams.sizeCode ?? (startMode === 'default' ? defaultOrder.sizeCode : null)
const startProduct = menuItems.find((item) => item.id === devParams.productId) ?? null
const startTemperature = startProduct ? entryTemperature(startProduct, devParams.temperature) : devParams.temperature
const startOrder: OrderState = {
  temperature: startTemperature,
  sizeCode: startSize,
  sizeMl: startSize ? sizeMlMap[startSize] : null,
  caffeineType: hasCaffeineChoice(startProduct ?? undefined) ? devParams.caffeineType ?? (startMode === 'default' ? defaultOrder.caffeineType : null) : null,
  iceAmount: startTemperature === 'COLD' && hasIceChoice(startProduct ?? undefined) ? devParams.iceAmount ?? (startMode === 'default' ? DEFAULT_ICE : null) : null,
}
const startCart: CartEntry[] = devParams.cartIds.length > 0
  ? devParams.cartIds.flatMap((id, index) => {
    const product = menuItems.find((item) => item.id === id)
    if (!product) return []
    const order = product.kind === '디저트' ? initialOrder : beginOrder('default', entryTemperature(product, 'HOT'), product).order
    return [{ id: index + 1, product, order, quantity: 1 }]
  })
  : devParams.screen === 'cart' && startProduct
    ? [{ id: 1, product: startProduct, order: startOrder, quantity: 1 }]
    : []

// Toss 테스트 결제창에서 돌아왔으면(카드) 저장해 둔 주문을 되살려 결제 결과 화면부터 시작한다.
// snapshot이 있으면 그 장바구니·이용 방법·주문번호·보기 설정으로, redirect 결과로 완료/거절 화면을 연다.
const tossSnapshot = tossBootstrap?.snapshot ?? null
const tossRestoredCart = tossSnapshot ? snapshotToCart(tossSnapshot) : null

const optionLabels = {
  temperature: { HOT: '따뜻하게', COLD: '차갑게', null: '선택 안 함' },
  sizeCode: { ...sizeText, null: '선택 안 함' },
  caffeineType: { CAFFEINATED: '카페인 있음', DECAF: '디카페인 (카페인을 줄였어요)', null: '선택 안 함' },
  iceAmount: { NORMAL: '얼음 보통', LESS: '얼음 적게 (기본보다 적게)', NONE: '얼음 없이', null: '선택 안 함' },
} as const

const changedOptionSummary = (before: OrderState, after: OrderState) => {
  const changes: string[] = []
  if (before.temperature !== after.temperature) changes.push(`온도: ${optionLabels.temperature[before.temperature ?? 'null']} → ${optionLabels.temperature[after.temperature ?? 'null']}`)
  if (before.sizeCode !== after.sizeCode) changes.push(`크기: ${optionLabels.sizeCode[before.sizeCode ?? 'null']} → ${optionLabels.sizeCode[after.sizeCode ?? 'null']}`)
  if (before.caffeineType !== after.caffeineType) changes.push(`카페인: ${optionLabels.caffeineType[before.caffeineType ?? 'null']} → ${optionLabels.caffeineType[after.caffeineType ?? 'null']}`)
  if (after.temperature === 'COLD' && after.iceAmount && before.iceAmount !== after.iceAmount) changes.push(`얼음: ${before.temperature === 'HOT' ? '해당 없음' : optionLabels.iceAmount[before.iceAmount ?? 'null']} → ${optionLabels.iceAmount[after.iceAmount ?? 'null']}`)
  return changes
}

const screenLabel: Record<AppScreenId, string> = {
  attract: '대기 화면',
  method: '이용 방법',
  menu: '메뉴', product: '상품 정보', temperature: '온도', size: '크기',
  caffeine: '카페인', ice: '얼음', review: '선택 확인', cart: '장바구니',
  payment: '결제',
}

export default function App({ lowProductStudy = false }: { lowProductStudy?: boolean }) {
  const startLowScreen = lowProductStudy || devParams.lowScreen
  const [lowScreen, setLowScreen] = useState(tossSnapshot?.view.lowScreen ?? startLowScreen)
  const ProductScreen = lowScreen ? LowScreenProduct : ProductDetailScreen
  // 처음은 대기 화면(기획 S00). 개발·캡처 주소의 ?screen=… 은 그 화면에서 바로 시작한다.
  // Toss 결제창에서 돌아왔으면 결제 화면에서 결과(완료·거절)부터 보여 준다.
  const [screen, setScreen] = useState<AppScreenId>(tossBootstrap ? 'payment' : devParams.screen ?? (lowProductStudy ? 'product' : 'attract'))
  const [language, setLanguage] = useState<Language>('ko')
  const [order, setOrder] = useState<OrderState>(startOrder)
  const [reviewOriginal, setReviewOriginal] = useState<OrderState | null>(devParams.screen === 'review' ? { ...startOrder } : null)
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(startProduct)
  const [presetTemperature, setPresetTemperature] = useState<Temperature>(lowProductStudy ? startTemperature : null)
  const [orderMode, setOrderMode] = useState<OrderMode>(startMode)
  const [orderQuantity, setOrderQuantity] = useState(1) // 담기 직전에 묻는 수량
  const [cartItems, setCartItems] = useState<CartEntry[]>(tossRestoredCart ?? startCart)
  const [soldOutIds, setSoldOutIds] = useState<ReadonlySet<string>>(() => new Set(devParams.soldOutIds))
  // 현금 장치 상태(기획 S50-CASHOFF·D-19). 시안은 늘 켜짐, 시연은 ?cash=off와 화면 밖 개발 막대로 끈다.
  const [cashAvailable, setCashAvailable] = useState(!devParams.cashOff)
  // 메뉴를 받는 상태(menuLoad.ts). then은 시연용: 다 받으면 어떻게 될지와 걸리는 시간.
  // 무엇이든 10초 넘게 받지 못하면 ‘불러오지 못했어요’로 바꾼다.
  const [menuLoad, setMenuLoad] = useState<{ status: MenuLoadStatus; then?: { status: 'ready' | 'failed'; after: number } }>({ status: devParams.menuLoad ?? 'ready' })
  useEffect(() => {
    if (menuLoad.status !== 'loading') return
    const timers = [window.setTimeout(() => setMenuLoad({ status: 'failed' }), MENU_LOAD_TIMEOUT_MS)]
    const then = menuLoad.then
    if (then) timers.push(window.setTimeout(() => setMenuLoad({ status: then.status }), then.after))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [menuLoad])
  // 낮은 화면 파일은 앱이 쉬는 틈에 미리 받는다. 처음 켤 때 ‘화면을 준비하고 있어요’를 거의 보지 않게(사용자 R1).
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') { const id = window.requestIdleCallback(preloadLowScreens, { timeout: 3000 }); return () => window.cancelIdleCallback(id) }
    const id = window.setTimeout(preloadLowScreens, 1500); return () => window.clearTimeout(id)
  }, [])
  // 시연에서는 다시 불러오면 받아진다. 실제 매장에서는 주문 시스템에 다시 요청한다.
  const retryMenuLoad = () => setMenuLoad({ status: 'loading', then: { status: 'ready', after: 1500 } })
  const [cartEditResult, setCartEditResult] = useState<{ id: number; changes: string[] } | null>(null)
  // 담은 뒤 장바구니 위에 잠깐 뜨는 알림(F-1). more: 같은 메뉴에 더 담음.
  const [addedNotice, setAddedNotice] = useState<{ id: number; more: boolean } | null>(null)
  // 메뉴·옵션이 똑같은 줄이 이미 있으면 담기 전에 묻는다. 더 담으면 그 줄(id) 수량에 quantity를 더한다.
  const [sameItemPrompt, setSameItemPrompt] = useState<{ id: number; quantity: number } | null>(null)
  // 시연용 주문번호. 실제 매장 연결 때는 주문 시스템이 준 번호로 바뀐다.
  const [orderNumber, setOrderNumber] = useState(tossSnapshot?.orderNumber ?? 27)
  const nextCartItemId = useRef((tossRestoredCart ?? startCart).length + 1)
  // 수정 모드: "바꾸기" 후 돌아올 화면
  const [returnScreen, setReturnScreen] = useState<AppScreenId | null>(devParams.editMode && devParams.screen ? 'cart' : null)
  // 수정 시작 시 선택값. 변경 완료를 누를 때만 현재 선택을 확정한다.
  const [orderBeforeEdit, setOrderBeforeEdit] = useState<OrderState | null>(devParams.editMode ? startOrder : null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(devParams.dialog === 'cancel')
  const [orderMethod, setOrderMethod] = useState<OrderMethod>(tossSnapshot?.orderMethod ?? 'DINE_IN')
  const [showCupQuestion, setShowCupQuestion] = useState(false)
  const [cupModalOpen, setCupModalOpen] = useState(false)
  const [showOrderMethodPicker, setShowOrderMethodPicker] = useState(devParams.dialog === 'method')
  const [showHomeConfirm, setShowHomeConfirm] = useState(devParams.dialog === 'home')
  const [showProductInfo, setShowProductInfo] = useState(false)
  const [showMenuConfirm, setShowMenuConfirm] = useState(false)
  const [staffCall, dispatchStaffCall] = useReducer(staffCallReducer, devParams.staffLate ? { pending: true, late: true, dialog: 'waiting' } : { ...initialStaffCall, dialog: devParams.dialog === 'staff' ? 'confirm' : null })
  // 부른 뒤 오래 지나면 late. 다시 부르면 late가 풀려 처음부터 다시 센다.
  useEffect(() => {
    if (!staffCall.pending || staffCall.late) return
    const timer = window.setTimeout(() => dispatchStaffCall('late'), STAFF_LATE_MS)
    return () => window.clearTimeout(timer)
  }, [staffCall.pending, staffCall.late])
  const [highContrast, setHighContrast] = useState(tossSnapshot?.view.highContrast ?? devParams.highContrast)
  const [largeText, setLargeText] = useState(tossSnapshot?.view.largeText ?? devParams.largeText)
  // 새 주문마다 1씩 는다. 음성 안내(VoiceGuideProvider)가 이것을 보고 켜짐·음량을 되돌린다.
  const [orderSession, setOrderSession] = useState(0)
  // Toss 결제창에서 돌아왔으면 결과를 초기 state로 시드한다(reducer 로직은 건드리지 않는다).
  // 성공 → 'success'(결제 완료·카드 회수), 실패/취소 → 'declined'(카드 결제 거절). 이후 완료 흐름은 기존 코드가 처리한다.
  const [payment, dispatchPayment] = useReducer(paymentSessionReducer, initialPaymentSession, (init): PaymentSession =>
    tossBootstrap ? { ...init, method: 'card', step: tossOutcome(tossBootstrap.redirect) === 'success' ? 'success' : 'declined' } : init)
  const [paymentResolveOpen, setPaymentResolveOpen] = useState(false)
  const paymentActive = screen === 'payment'
  // 쓸 수 없는 결제방법: 현금 장치 꺼짐 + 이번 주문에서 기계 문제가 난 방법(사용자 2026-10-20).
  const unavailableMethods = Array.from(new Set([...(cashAvailable ? [] : ['cash' as const]), ...payment.unavailable]))
  const canChangeMethod = (['card', 'cash', 'mobile'] as const).some(method => !unavailableMethods.includes(method))
  // 낮은 화면의 주문 화면(메뉴·상품·옵션·확인·장바구니)은 알림 줄을 둘 자리가 없다. 오래되면 끼어들어 창을 바로 연다(사용자 2026-10-20).
  // 일반 화면과 결제 화면은 끼어들지 않고 알림 줄만 바뀐다. 닫은 뒤에는 다시 띄우지 않는다.
  const lowOrdering = lowScreen && !paymentActive && screen !== 'attract' && screen !== 'method'
  useEffect(() => {
    if (staffCall.late && staffCall.dialog === null && lowOrdering) dispatchStaffCall('open')
  }, [staffCall.late]) // eslint-disable-line react-hooks/exhaustive-deps
  const paymentTotal = cartTotals(cartItems).total
  // 결제 시연 바는 로컬 개발(devControls)에서만 보인다. 배포본에선 숨기고 높이도 잡지 않는다.
  const demoBarHeight = paymentActive && devControls ? 128 : lowProductStudy ? 64 : 0
  const { scale, designW, designH } = useKioskScale(devParams.capture ? 0 : demoBarHeight + (devControls ? DEV_BAR_H : 0), devParams.capture)
  const MenuView = lowScreen ? LowMenuScreen : MenuScreen
  // 결제 방법을 고르는 동안 담은 메뉴가 품절되면 장바구니로 되돌린다(기획 S50 · M-04). 결제가 시작된 뒤에는 건드리지 않는다.
  const soldOutInCart = cartItems.some(item => soldOutIds.has(item.product.id))
  useEffect(() => {
    if (paymentActive && payment.step === 'method' && soldOutInCart) setScreen('cart')
  }, [paymentActive, payment.step, soldOutInCart])

  // 결제 시연 바가 없는 화면(배포본 등)에서는 기계가 처리/대기하는 단계를 해피패스로 저절로 넘긴다.
  // 선택 화면(결제 방법, 휴대폰 결제방법 고르기)과 결과 화면(완료·거절·영수증 고르기)은 넘길 이벤트가 없어
  // 그대로 손님을 기다린다 — 그래서 모바일은 바코드·QR 보여주기 / 휴대폰 대기를 '누른 뒤에만' 자동 진행된다.
  // 버튼이 있는 대기 화면(카드·현금 투입 등)은 '결제 방법 다시 고르기'로 돌아갈 시간을 넉넉히(3.5초) 주고,
  // 그 사이 뒤로 가면 아래 cleanup이 자동 진행을 취소한다. 버튼 없는 '처리 중' 화면은 짧게(1.5초) 넘긴다.
  useEffect(() => {
    if (!paymentActive || devControls || payment.step === 'method') return
    const events = paymentDemoEvents(payment)
    const happy = events.find(event => event.id === 'next') ?? events.find(event => event.id === 'bill-10000')
    if (!happy) return
    const delay = paymentLocksUtility(payment.step) ? 1500 : 3500
    const timer = window.setTimeout(() => dispatchPayment({ type: 'demo', id: happy.id, total: paymentTotal }), delay)
    return () => window.clearTimeout(timer)
  }, [paymentActive, payment.step, payment.deposited, paymentTotal])


  // 장바구니를 보고 있는 동안 확정한 변경만 알려 준다.
  // 모달은 screen을 바꾸지 않으므로 표시를 유지하고, 실제 화면 이동 때만 지운다.
  useEffect(() => {
    if (screen === 'cart') return
    setCartItems(items => items.some(item => item.optionHistory)
      ? items.map(({ optionHistory: _feedback, ...item }) => item)
      : items)
    setCartEditResult(null)
    setAddedNotice(null)
  }, [screen])

  const isCold = order.temperature === 'COLD'
  const isDefaultOrder = orderMode === 'default'
  const product = selectedProduct ?? menuItems[0]
  const caffeineChoice = hasCaffeineChoice(product)
  const iceChoice = hasIceChoice(product)
  // 상품이 제공하는 옵션만 순서에 포함한다. 단일 온도 메뉴는 온도를 다시 묻지 않는다.
  const flowScreens: AppScreenId[] = ['method', 'menu', 'product']
  if (product.temp.length > 1) flowScreens.push('temperature')
  if (!isDefaultOrder) {
    flowScreens.push('size')
    if (caffeineChoice) flowScreens.push('caffeine')
    if (isCold && iceChoice) flowScreens.push('ice')
  }
  flowScreens.push('review', 'cart')
  // 개발 탭은 얼음 항상 표시 (테스트 편의)
  const allScreens: AppScreenId[] = ['method', 'menu', 'product', 'temperature', 'size', 'caffeine', 'ice', 'review', 'cart']
  // 개발 탭에서 flow 밖의 화면(예: HOT인데 ice 탭)에 있을 경우 가장 가까운 위치로 보정
  const flowIdx = (() => {
    const i = flowScreens.indexOf(screen)
    if (i !== -1) return i
    // ice 화면인데 HOT → 카페인 위치로 간주
    if (screen === 'ice') return flowScreens.indexOf('caffeine')
    return 0
  })()

  const startEdit = (targetScreen: AppScreenId) => {
    if ((targetScreen === 'temperature' || targetScreen === 'size' || targetScreen === 'caffeine' || targetScreen === 'ice') && !canEditOption(product, targetScreen)) return
    if (!returnScreen) {
      setOrderBeforeEdit({ ...order })
      setReturnScreen(screen)
    }
    setScreen(targetScreen)
  }

  const returnToEditOrigin = () => {
    if (returnScreen) {
      let dest = returnScreen
      if (returnScreen === 'ice' && !isCold) dest = 'caffeine'
      if (returnScreen === 'review' && isCold && iceChoice && !order.iceAmount) dest = 'ice'
      setScreen(dest)
      setReturnScreen(null)
    }
  }

  const finishEdit = () => {
    // 확인 화면·장바구니의 온도 수정은 필요한 얼음 선택까지 한 번에 확정한다.
    if ((returnScreen === 'review' || returnScreen === 'cart') && isCold && iceChoice && !order.iceAmount) {
      setScreen('ice')
      return
    }
    setOrderBeforeEdit(null)
    returnToEditOrigin()
  }

  const hasEditChanges = Boolean(orderBeforeEdit && (
    order.temperature !== orderBeforeEdit.temperature
    || order.sizeCode !== orderBeforeEdit.sizeCode
    || order.sizeMl !== orderBeforeEdit.sizeMl
    || order.caffeineType !== orderBeforeEdit.caffeineType
    || order.iceAmount !== orderBeforeEdit.iceAmount
  ))

  const cancelEdit = () => {
    if (hasEditChanges) {
      setShowCancelConfirm(true)
      return
    }
    setOrderBeforeEdit(null)
    returnToEditOrigin()
  }

  const discardEditChanges = () => {
    if (orderBeforeEdit) setOrder({ ...orderBeforeEdit })
    setOrderBeforeEdit(null)
    setShowCancelConfirm(false)
    // 원래 선택값 기준으로 정확히 선택 확인 화면으로 돌아간다.
    if (returnScreen) {
      setScreen(returnScreen)
      setReturnScreen(null)
    }
  }

  const goNext = () => {
    if (returnScreen) {
      finishEdit()
    } else if (flowIdx < flowScreens.length - 1) {
      const nextScreen = flowScreens[flowIdx + 1]
      if (nextScreen === 'review') setReviewOriginal(original => original ?? { ...order })
      setScreen(nextScreen)
    }
  }
  const goPrev = () => {
    if (returnScreen) {
      cancelEdit()
    } else if (flowIdx > 0) {
      setScreen(flowScreens[flowIdx - 1])
    }
  }

  const isEditMode = !!returnScreen
  const needsIceSelection = isCold && iceChoice && !order.iceAmount
  const scaledW = designW * scale
  const scaledH = designH * scale

  // 담은 줄이 보이게(기본: 그 줄까지 내림, 낮은 화면: 그 장) 장바구니를 열고 위에 알림을 띄운다.
  const showAdded = (id: number, more: boolean) => {
    setCartEditResult({ id, changes: [] })
    setAddedNotice({ id, more })
  }
  const closeAddedNotice = useCallback(() => setAddedNotice(null), [])
  const addedItem = addedNotice ? cartItems.find(item => item.id === addedNotice.id) : undefined

  const saveCurrentItemToCart = () => {
    if (!selectedProduct || !cartOrderReady(order, product) || returnScreen) return
    const same = findSameCartItem(cartItems, selectedProduct, order)
    if (same) { setSameItemPrompt({ id: same.id, quantity: orderQuantity }); return }

    const id = nextCartItemId.current++
    setCartItems((items) => [...items, { id, product: selectedProduct, order: { ...order }, quantity: orderQuantity }])
    showAdded(id, false)
    setReviewOriginal(null)
    setScreen('cart')
  }

  const addDessertToCart = () => {
    if (!selectedProduct) return
    const same = findSameCartItem(cartItems, selectedProduct, initialOrder)
    if (same) { setSameItemPrompt({ id: same.id, quantity: orderQuantity }); return }
    const id = nextCartItemId.current++
    setCartItems((items) => [...items, { id, product: selectedProduct, order: { ...initialOrder }, quantity: orderQuantity }])
    showAdded(id, false)
    setScreen('cart')
  }

  // '더 담기': 같은 줄 수량에 더하고, 장바구니에서 그 줄이 보이게 한다. '담지 않기'는 창만 닫고 지금 화면에 머문다.
  const addToSameItem = () => {
    if (!sameItemPrompt) return
    setCartItems(items => addToCartItem(items, sameItemPrompt.id, sameItemPrompt.quantity, MAX_QUANTITY))
    showAdded(sameItemPrompt.id, true)
    setSameItemPrompt(null)
    setReviewOriginal(null)
    setScreen('cart')
  }
  const sameItem = sameItemPrompt ? cartItems.find(item => item.id === sameItemPrompt.id) : undefined

  const startOrderMode = (mode: OrderMode) => {
    const product = selectedProduct ?? menuItems[0]
    const next = beginOrder(mode, entryTemperature(product, presetTemperature), product)
    setSelectedProduct(product)
    setOrderMode(mode)
    setOrder(next.order)
    setReviewOriginal(next.screen === 'review' ? { ...next.order } : null)
    setScreen(next.screen)
  }

  const returnHome = () => {
    // 결제를 마친 주문이 끝나면 다음 주문은 다음 번호를 받는다.
    if (paymentActive && paymentIsPaid(payment)) setOrderNumber(value => value + 1)
    dispatchPayment({ type: 'reset' })
    setPaymentResolveOpen(false)
    setShowCupQuestion(false)
    setCupModalOpen(false)
    dispatchStaffCall('reset')
    setShowOrderMethodPicker(false)
    setShowProductInfo(false)
    setShowMenuConfirm(false)
    setSameItemPrompt(null)
    setOrderQuantity(1)
    nextCartItemId.current = 1
    setPresetTemperature(null)
    setOrder(initialOrder)
    setReviewOriginal(null)
    setOrderMode('custom')
    setSelectedProduct(null)
    setCartItems([])
    setCartEditResult(null)
    setAddedNotice(null)
    setReturnScreen(null)
    setOrderBeforeEdit(null)
    setShowCancelConfirm(false)
    setShowHomeConfirm(false)
    setOrderMethod('DINE_IN')
    setLanguage('ko')
    // 보기 설정도 시작 값으로. 다음 손님이 앞사람 설정을 보지 않게(기획 S00·AC-07, 사용자 2026-10-21).
    setLargeText(devParams.largeText)
    setHighContrast(devParams.highContrast)
    setLowScreen(startLowScreen)
    setOrderSession(value => value + 1)
    setScreen('attract')
  }

  const inactivity = useInactivity({
    // 대기 화면만 시간 제한이 없다. 이용 방법 화면에서 그냥 떠나도 대기 화면으로 돌아온다.
    enabled: screen !== 'attract' && !devParams.capture,
    suspended: staffCallPausesInactivity(staffCall) || (paymentActive && !paymentAllowsTimeout(payment)),
    initialWarning: devParams.dialog === 'idle',
    onExpire: returnHome,
  })
  const openStaffCall = () => dispatchStaffCall('open')
  const closeStaffCall = () => dispatchStaffCall('close')

  const cardMayBeInserted = paymentActive && (payment.step === 'unread' || payment.step === 'declined')
  const requestHome = () => {
    if (paymentActive && paymentBlocksHome(payment)) { setPaymentResolveOpen(true); return }
    // 결제는 끝났는데 주문번호표가 아직 없으면 번호표부터 출력한다(사용자 2026-10-28 H1). 출력이 끝나면 완료 화면에서 마친다.
    if (paymentActive && payment.step !== 'method' && homePrintsSlipFirst(payment.step)) { dispatchPayment({ type: 'navigate', to: 'printingSlip', total: paymentTotal }); return }
    // 출력 실패 화면은 주문번호가 사라진다고 한 번 더 묻는다.
    if (paymentActive && payment.step !== 'method' && homeLosesOrderNumber(payment.step)) { setShowHomeConfirm(true); return }
    if (paymentActive && paymentIsPaid(payment)) { returnHome(); return }
    const hasOrderInProgress = Boolean(selectedProduct || cartItems.length > 0 || order.temperature || order.sizeCode || order.caffeineType || order.iceAmount)
    if (hasOrderInProgress || staffCall.pending) {
      setShowHomeConfirm(true)
      return
    }
    returnHome()
  }

  // 메뉴 목록으로 복귀: 현재 작업만 비우고 기존 장바구니·이용 방법·화면 설정은 유지한다.
  const returnToMenu = () => {
    setPresetTemperature(null)
    setOrder(initialOrder)
    setReviewOriginal(null)
    setOrderMode('custom')
    setOrderQuantity(1)
    setSelectedProduct(null)
    setCartEditResult(null)
    setAddedNotice(null)
    setReturnScreen(null)
    setOrderBeforeEdit(null)
    setShowCancelConfirm(false)
    setShowMenuConfirm(false)
    setSameItemPrompt(null)
    setShowProductInfo(false)
    setScreen('menu')
  }
  const requestMenu = () => {
    if (order.temperature || order.sizeCode || order.caffeineType || order.iceAmount) {
      setShowMenuConfirm(true)
    } else {
      returnToMenu()
    }
  }
  const optionProductActions = ['temperature', 'size', 'caffeine', 'ice', 'review'].includes(screen)
    ? { item: product, basePrice: won(basePrice(product)),
        unitPrice: unitPrice(selectedProduct ?? menuItems[0], order), quantity: orderQuantity,
        // 담기는 확인 화면에서만 켠다. 고르기 화면은 '다음'으로만 앞으로 가고, 금액만 미리 보여 준다.
        canAdd: screen === 'review' && cartOrderReady(order, product) && !returnScreen && !!selectedProduct,
        showPrice: true,
        onChangeQuantity: setOrderQuantity, onAdd: saveCurrentItemToCart,
        onViewProduct: () => setShowProductInfo(true), onReturnToMenu: requestMenu }
    : null

  // 모든 줄의 개인컵 표시를 지운다(할인 해제). 매장이용으로 바꾸거나 "개인컵 없음"을 고를 때 쓴다.
  const clearPersonalCups = () => setCartItems(items => items.some(item => item.personalCup) ? items.map(item => ({ ...item, personalCup: false })) : items)
  const enterCheckout = () => {
    if (!cartItems.length || paymentTotal <= 0) return
    setShowCupQuestion(false)
    setCupModalOpen(false)
    dispatchPayment({ type: 'reset' })
    setScreen('payment')
  }
  const startCheckout = () => {
    if (!cartItems.length || paymentTotal <= 0) return
    // 포장이면 개인컵 여부를 먼저 묻는다(기본·낮은 화면 모두). 매장이용은 바로 결제(개인컵 할인 없음).
    if (orderMethod === 'TAKE_OUT') setShowCupQuestion(true)
    else { clearPersonalCups(); enterCheckout() }
  }
  // 개인컵 선택 모드 조작
  const toggleCup = (id: number, checked: boolean) => setCartItems(items => items.map(item => item.id === id ? { ...item, personalCup: checked } : item))
  const answerCupQuestion = (hasCup: boolean) => {
    setShowCupQuestion(false)
    if (hasCup) setCupModalOpen(true)
    else { clearPersonalCups(); enterCheckout() }
  }
  const navigatePayment = (to: PaymentDestination) => {
    if (to === 'staff') { openStaffCall(); return }
    // 결제 화면의 ‘처음으로’·‘번호표 없이 마치기’는 결제가 끝난 뒤에만 있다. 버튼 이름이 할 일을 말하므로 묻지 않고 마친다.
    if (to === 'home') { if (paymentIsPaid(payment)) returnHome(); else requestHome(); return }
    dispatchPayment({ type: 'navigate', to, total: paymentTotal })
  }
  const runPaymentDemo = (id: string) => {
    if (!paymentDemoEvents(payment).some(event => event.id === id)) return
    if (id === 'resolved') dispatchStaffCall('reset')
    dispatchPayment({ type: 'demo', id, total: paymentTotal })
  }
  // 카드는 Toss 테스트 결제창으로, 현금·모바일은 기존 시연 흐름으로 들어간다.
  // 결제창으로 떠나면 현재 주문을 저장했다가 돌아올 때 복원한다(tossPayment.ts).
  const startPayment = (method: 'card' | 'cash' | 'mobile') => {
    // 카드는 Toss 키가 있을 때만 Toss 테스트 결제창으로. 성공/취소·이탈/실패는 모두 Toss 결과로 판정하며,
    // 결제창을 못 열어도 startCardPayment가 실패 화면으로 보낸다(자동 성공 폴백 없음).
    // 키가 없으면(순수 UI 데모) 카드도 기존 시뮬레이터로 간다. 현금·모바일은 항상 시뮬레이터.
    if (method === 'card' && devParams.tossCard && hasTossKey) {
      startCardPayment({ total: paymentTotal, cart: cartItems, orderMethod, orderNumber, view: { largeText, highContrast, lowScreen } })
        .catch(error => console.error('[toss] 결제 시작 오류', error))
      return
    }
    dispatchPayment({ type: 'select', method, total: paymentTotal })
  }
  const selectMenuItem = (item: MenuItem, temperature?: Temperature) => {
    setPresetTemperature(entryTemperature(item, temperature ?? null))
    setOrder(initialOrder)
    setReviewOriginal(null)
    setReturnScreen(null)
    setSelectedProduct(item)
    setOrderQuantity(1)
    setScreen('product')
  }

  const voiceSelectionReady: Record<string, boolean> = {
    temperature: !!order.temperature && sizeAvailable(order.sizeCode, order.temperature),
    size: !!order.sizeCode, caffeine: !!order.caffeineType, ice: !!order.iceAmount,
  }
  // 음성 길잡이는 위치와 다음 행동만 알린다(D-04). 크기 이름과 장바구니가 비었는지만 넘긴다.
  const voiceInfo: OrderVoiceInfo = { sizes: sizeOptions.map(size => size.label), cartHasItems: cartItems.length > 0,
    chooseTemperature: entryTemperature(selectedProduct ?? menuItems[0], presetTemperature) === null }
  const currentGuide = screen === 'product' && product.kind === '디저트'
    ? orderGuide('dessert', false, voiceInfo)
    : orderGuide(screen, voiceSelectionReady[screen] ?? false, voiceInfo)

  return (
    <div style={devParams.capture ? { width: designW, height: designH } : {
      width: '100vw', height: '100dvh', overflow: 'hidden',
      background: '#1A1A1A', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {!devParams.capture && (paymentActive
        ? (devControls && <PaymentDemoControls state={payment} onEvent={runPaymentDemo} />)
        : lowProductStudy && <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#222', width: '100%', fontSize: 16 }}>낮은 화면 · 주문부터 결제까지 이어서 확인할 수 있어요.</div>)}
      {/* ── 화면 전환 탭 (개발용) · 디자인 화면 밖에 두어 캡처에 찍히지 않는다. 배포본에선 숨긴다 ── */}
      {!devParams.capture && devControls && (
        <div style={{ height: DEV_BAR_H, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* 시연: 카페라떼(2번)를 품절로 바꾼다. 담은 뒤 누르면 장바구니의 '주문할 수 없는 메뉴'를 볼 수 있다. */}
          <button aria-pressed={soldOutIds.has('2')} onClick={() => setSoldOutIds(ids => { const next = new Set(ids); if (next.has('2')) next.delete('2'); else next.add('2'); return next })} style={{
            padding: '6px 14px', borderRadius: 30, border: '1px solid #666', background: soldOutIds.has('2') ? '#B3261E' : 'transparent',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', marginRight: 8,
          }}>시연: 카페라떼 품절 {soldOutIds.has('2') ? '켜짐' : '꺼짐'}</button>
          {/* 시연: 부른 뒤 오래 지남(90초를 기다리지 않고) · 직원이 와서 호출이 끝남. 실제 매장에서는 직원 기기에서 끝낸다. */}
          {([['시연: 직원 90초 지남', 'late'], ['시연: 직원 도착', 'reset']] as const).map(([label, action]) => <button key={action} disabled={!staffCall.pending} onClick={() => dispatchStaffCall(action)} style={{
            padding: '6px 14px', borderRadius: 30, border: '1px solid #666', background: 'transparent',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', marginRight: 8, opacity: staffCall.pending ? 1 : 0.4,
          }}>{label}</button>)}
          {/* 시연: 현금 장치를 끄고 켠다. 결제 방법 화면의 현금 칸이 잠기고 이유가 보인다. */}
          <button aria-pressed={!cashAvailable} onClick={() => setCashAvailable(value => !value)} style={{
            padding: '6px 14px', borderRadius: 30, border: '1px solid #666', background: cashAvailable ? 'transparent' : '#B3261E',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', marginRight: 8,
          }}>시연: 현금 장치 {cashAvailable ? '켜짐' : '꺼짐'}</button>
          {/* 시연: 메뉴를 받는 중(3초 뒤 받음) · 받지 못함(3초 뒤 실패). 메뉴 화면에서 누르면 바로 보인다. */}
          {([['시연: 메뉴 불러오는 중', 'ready'], ['시연: 메뉴 못 불러옴', 'failed']] as const).map(([label, outcome]) => <button key={outcome} onClick={() => setMenuLoad({ status: 'loading', then: { status: outcome, after: 3000 } })} style={{
            padding: '6px 14px', borderRadius: 30, border: '1px solid #666', background: 'transparent',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', marginRight: 8,
          }}>{label}</button>)}
          {allScreens.map((s) => (
            <button key={s} disabled={paymentActive} onClick={() => { setReturnScreen(null); setOrderBeforeEdit(null); setShowCancelConfirm(false); if (s === 'review') setReviewOriginal(original => original ?? { ...order }); setScreen(s) }} style={{
              padding: '6px 14px', borderRadius: 30, border: 'none',
              background: screen === s ? '#0054F1' : 'transparent',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}>
              {screenLabel[s]}
            </button>
          ))}
        </div>
      )}

      <div style={{
        width: `${scaledW}px`, height: `${scaledH}px`,
        position: 'relative', overflow: 'clip',
        borderRadius: scale < 1 ? '12px' : '0',
        boxShadow: scale < 1 ? '0 8px 48px rgba(0,0,0,0.5)' : 'none',
      }}>
        <SoldOutContext.Provider value={soldOutIds}>
        <MenuLoadContext.Provider value={{ status: menuLoad.status, retry: retryMenuLoad }}>
        <AppControlsProvider value={{
          orderMethod, language, onLanguageChange: setLanguage,
          onHome: requestHome, homeDisabled: screen === 'attract', onStaff: openStaffCall, staffPending: staffCall.pending, staffLate: staffCall.late,
          utilityLocked: paymentActive && payment.step !== 'method' && paymentLocksUtility(payment.step),
          lowScreen, toggleLowScreen: () => setLowScreen(value => !value),
          lowOptions: lowScreen, onExitLowScreen: () => setLowScreen(false), onLowProduct: () => setScreen('product'),
          highContrast, toggleHighContrast: () => setHighContrast((current) => !current),
          largeText, toggleLargeText: () => setLargeText((current) => !current),
          orderSession,
        }}>
        <OptionProductProvider value={optionProductActions}>
        <OptionEditProvider value={{
          before: isEditMode ? orderBeforeEdit : null,
          hasChanges: hasEditChanges,
          nextLabel: (returnScreen === 'review' || returnScreen === 'cart') && needsIceSelection && screen === 'temperature' ? '다음 · 얼음 선택' : hasEditChanges ? '변경 적용' : '기존 선택 유지',
        }}>
        <div id="kiosk-canvas" data-typography={devParams.typography === 'figma' ? 'figma' : undefined} data-color-mode={highContrast ? 'hc' : 'light'} style={{
          ...(highContrast ? highContrastColorVariables : lightColorVariables),
          color: 'var(--text-primary)', colorScheme: highContrast ? 'dark' : 'light',
          width: `${designW}px`, height: `${designH}px`,
          transformOrigin: 'top left', transform: devParams.capture ? 'none' : `scale(${scale})`,
          overflow: 'hidden', position: 'relative',
        }}>
          <Suspense fallback={<ScreenPreparing />}>
          {/* 메뉴·장바구니는 화면이 상태(불러오는 중·품절 등)에 맞는 안내를 직접 단다. */}
          {screen !== 'menu' && screen !== 'cart' && screen !== 'payment' && <GuideCue guide={currentGuide} />}
          {screen === 'attract' && <AttractScreen onStart={() => setScreen('method')} />}
          {screen === 'method' && <OrderMethodScreen
            language={language} onLanguageChange={setLanguage}
            onSelect={(method) => { setOrderMethod(method); setScreen('menu') }}
          />}
          {screen === 'menu' && (
            <MenuView onSelectItem={selectMenuItem} onExitLowScreen={() => setLowScreen(false)}
              cartCount={cartItems.reduce((sum, entry) => sum + entry.quantity, 0)}
              cartTotal={cartTotals(cartItems).total}
              onOpenCart={() => setScreen('cart')}
              searchOpenAtStart={devParams.searchOpen}
              searchTextAtStart={devParams.searchText}
              searchPickAtStart={devParams.searchPick}
              cardPickAtStart={devParams.cardPick}
            />
          )}

          {screen === 'product' && (
            <ProductScreen
              key={selectedProduct?.id}
              item={selectedProduct ?? menuItems[0]}
              temperature={entryTemperature(selectedProduct ?? menuItems[0], presetTemperature)}
              onBack={() => setScreen('menu')}
              onExitLowScreen={() => setLowScreen(false)}
              onAddToCart={addDessertToCart}
              quantity={orderQuantity}
              onChangeQuantity={setOrderQuantity}
              onOrderDefault={() => startOrderMode('default')}
              onOrderCustom={() => startOrderMode('custom')}
            />
          )}

          {screen === 'temperature' && (
            <TemperatureScreen
              productName={selectedProduct?.name ?? '아메리카노'}
              value={order.temperature}
              sizeCode={order.sizeCode}
              caffeineType={order.caffeineType}
              iceAmount={order.iceAmount}
              isEditMode={isEditMode}
              isDefaultOrder={isDefaultOrder}
              onChange={(v) => {
                if (!v || !product.temp.includes(v === 'HOT' ? 'hot' : 'cold') || !sizeAvailable(order.sizeCode, v)) return
                // 온도 변경 시 얼음만 초기화 (크기·카페인 유지)
                // 기본값 주문에서는 차갑게를 고르면 얼음을 기본값으로 채운다
                const prevTemp = order.temperature
                const resetIce = isDefaultOrder && v === 'COLD' ? DEFAULT_ICE : null
                const newIce = isEditMode && orderBeforeEdit?.temperature === v
                  ? orderBeforeEdit.iceAmount
                  : (prevTemp !== v) ? resetIce : order.iceAmount
                setOrder({ ...order, temperature: v, iceAmount: newIce })
              }}
              onNext={goNext}
              onPrev={goPrev}
              onEditSize={() => startEdit('size')}
              onEditCaffeine={() => startEdit('caffeine')}
              onEditIce={() => startEdit('ice')}
            />
          )}

          {screen === 'size' && (
            <SizeScreen
              hidePrev={!!entryTemperature(selectedProduct ?? menuItems[0], presetTemperature)}
              productName={selectedProduct?.name ?? '아메리카노'}
              value={order.sizeCode}
              temperature={order.temperature}
              caffeineType={order.caffeineType}
              iceAmount={order.iceAmount}
              isEditMode={isEditMode}
              onChange={(v) => setOrder({ ...order, sizeCode: v, sizeMl: v ? sizeMlMap[v] : null })}
              onNext={goNext}
              onPrev={goPrev}
              onEditTemp={() => startEdit('temperature')}
              onEditCaffeine={() => startEdit('caffeine')}
              onEditIce={() => startEdit('ice')}
            />
          )}

          {screen === 'caffeine' && (
            <CaffeineScreen
              productName={selectedProduct?.name ?? '아메리카노'}
              value={order.caffeineType}
              temperature={order.temperature}
              sizeCode={order.sizeCode}
              iceAmount={order.iceAmount}
              isEditMode={isEditMode}
              onChange={(v) => setOrder({ ...order, caffeineType: v })}
              onNext={goNext}
              onPrev={goPrev}
              onEditTemp={() => startEdit('temperature')}
              onEditSize={() => startEdit('size')}
              onEditIce={() => startEdit('ice')}
            />
          )}

          {screen === 'ice' && (
            <IceScreen
              productName={selectedProduct?.name ?? '아메리카노'}
              value={order.iceAmount}
              temperature={order.temperature}
              sizeCode={order.sizeCode}
              caffeineType={order.caffeineType}
              isEditMode={isEditMode}
              onChange={(v) => setOrder({ ...order, iceAmount: v })}
              onNext={goNext}
              onPrev={goPrev}
              onEditTemp={() => startEdit('temperature')}
              onEditSize={() => startEdit('size')}
              onEditCaffeine={() => startEdit('caffeine')}
            />
          )}

          {screen === 'review' && (
            <ReviewScreen
              originalOrder={reviewOriginal}
              productName={selectedProduct?.name ?? '아메리카노'}
              order={order}
              isDefaultOrder={isDefaultOrder}
              quantity={orderQuantity}
              onChangeQuantity={setOrderQuantity}
              onNext={saveCurrentItemToCart}
              onCancelOrder={requestMenu}
              onEditTemp={() => startEdit('temperature')}
              onEditSize={() => startEdit('size')}
              onEditCaffeine={() => startEdit('caffeine')}
              onEditIce={() => startEdit('ice')}
            />
          )}

          {screen === 'cart' && lowScreen && <LowCartScreen items={cartItems} setItems={setCartItems} method={orderMethod} onMethodChange={setOrderMethod} focusItemId={cartEditResult?.id}
            onBack={returnToMenu} onExitLowScreen={() => setLowScreen(false)} onCheckout={startCheckout} />}
          {screen === 'cart' && !lowScreen && (
            <CartScreen
              items={cartItems}
              onRemoveMany={(ids) => setCartItems(items => removeCartItems(items, ids))}
              editResult={cartEditResult}
              orderMethod={orderMethod}
              onPrev={() => setScreen('menu')}
              onChangeQuantity={(id, quantity) => setCartItems((items) => items.map((item) => item.id === id ? { ...item, quantity } : item))}
              onRemove={(id) => setCartItems((items) => items.filter((item) => item.id !== id))}
              onChangeOrderMethod={() => setShowOrderMethodPicker(true)}
              onUpdateItemOrder={(id, nextOrder) => {
                const entry = cartItems.find(item => item.id === id)
                if (!entry || !cartOrderReady(nextOrder, entry.product)) return
                const before = entry.order
                const changes = changedOptionSummary(before, nextOrder)
                if (changes.length === 0) return
                // 다른 줄과 똑같아졌으면 고친 줄 하나로 합친다(합칠지는 ‘선택 바꾸기’ 창이 먼저 물었다).
                setCartItems(items => applyCartEdit(items, id, nextOrder, MAX_QUANTITY))
                setCartEditResult({ id, changes })
              }}
              onConfirm={startCheckout}
            />
          )}

          {paymentActive && (payment.step === 'method'
            ? <PaymentMethodScreen key="payment-method" lowScreen={lowScreen} onToggleLowScreen={() => setLowScreen(value => !value)} items={cartItems} initialSelected={payment.method} unavailableMethods={unavailableMethods}
                onBack={() => setScreen('cart')} onContinue={startPayment} />
            : <PaymentFlowScreen key={payment.step} scene={payment.step} lowScreen={lowScreen} onToggleLowScreen={() => setLowScreen(value => !value)}
                total={paymentTotal} deposited={payment.deposited} rejected={payment.rejected} cashError={payment.error} orderNumber={String(orderNumber)} onNavigate={navigatePayment} canChangeMethod={canChangeMethod}
                personalCup={cartItems.some(item => item.personalCup)}
                autoPaused={staffCall.dialog !== null || staffCallPausesInactivity(staffCall) || paymentResolveOpen || showHomeConfirm} />)}
          </Suspense>
          {/* 결제 중 ‘처음으로’. 직원을 이미 불렀으면 또 부르라고 하지 않는다(사용자 2026-10-20). */}
          {paymentResolveOpen && <DialogFrame titleId="payment-resolve-title" title="먼저 결제 상태를 확인해 주세요"
            message={staffCall.pending ? '직원을 불렀어요. 직원과 함께 결제 상태를 확인해 주세요.' : '진행 중인 결제나 챙겨야 할 돈·카드를 확인한 뒤 마쳐 주세요. 도움이 필요하면 직원을 불러 주세요.'} onDismiss={() => setPaymentResolveOpen(false)}>
            <div style={{ display: 'grid', gridTemplateColumns: staffCall.pending ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: space.md }}>
              {!staffCall.pending && <Button purpose="support" variant="Tertiary" onClick={() => { setPaymentResolveOpen(false); openStaffCall() }} style={{ width: '100%', minWidth: 0 }}>직원 부르기</Button>}
              <Button purpose="support" variant="Primary" onClick={() => setPaymentResolveOpen(false)} style={{ width: '100%', minWidth: 0 }}>결제로 돌아가기</Button>
            </div>
          </DialogFrame>}

          {showProductInfo && <ProductInfoDialog item={selectedProduct ?? menuItems[0]} temperature={order.temperature} onClose={() => setShowProductInfo(false)} />}

          {showMenuConfirm && <ConfirmDialog
            titleId="menu-return-title"
            voice={dialogVoice.menuReturn(isEditMode ? '계속 바꾸기' : '계속 고르기')}
            title="메뉴로 돌아가시겠어요?"
            // ‘옵션’ 대신 앱이 늘 쓰는 ‘고르다’, 메뉴 이름 없이 한 줄에 한 문장(같은 메뉴 담기 확인창과 같은 규칙, 사용자 2026-10-21).
            message={['지금 고르던 내용은 취소돼요.', '장바구니에 담은 메뉴는 그대로예요.']
              .map(line => <span key={line} style={{ display: 'block' }}>{line}</span>)}
            cancelLabel={isEditMode ? '계속 바꾸기' : '계속 고르기'} confirmLabel="메뉴로 돌아가기"
            onCancel={() => setShowMenuConfirm(false)} onConfirm={returnToMenu}
          />}

          {sameItemPrompt && sameItem && <ConfirmDialog
            titleId="same-item-title"
            voice={dialogVoice.sameItem}
            title="같은 메뉴를 더 담을까요?"
            message={sameItemMessage(sameItem, sameItemPrompt.quantity, MAX_QUANTITY).map(line => <span key={line} style={{ display: 'block' }}>{line}</span>)}
            cancelLabel="담지 않기" confirmLabel="더 담기"
            onCancel={() => setSameItemPrompt(null)} onConfirm={addToSameItem}
          />}

          {screen === 'cart' && addedNotice && addedItem && <AddedNotice {...addedNoticeCopy(addedItem, addedNotice.more)} onClose={closeAddedNotice} />}

          {showCancelConfirm && (
            <ConfirmDialog
              titleId="cancel-edit-title"
              voice={dialogVoice.cancelEdit}
              lowScreen={lowScreen}
              title="변경을 취소하시겠어요?"
              message="지금 바꾼 내용은 저장되지 않아요."
              cancelLabel="계속 바꾸기" confirmLabel="변경 취소"
              onCancel={() => setShowCancelConfirm(false)} onConfirm={discardEditChanges}
            />
          )}

          {screen === 'cart' && showCupQuestion && <DialogFrame
            titleId="cup-question-title" contentPaddingTop={64} contentGap={64} voice={dialogVoice.personalCup}
            title={<>개인컵을 가지고 계신가요?</>}
            message="개인컵에 받으면 음료 한 잔마다 500원 할인돼요."
            onDismiss={() => setShowCupQuestion(false)}>
            <div data-dialog-actions style={{ display: 'flex', gap: 24 }}>
              <Button purpose="decision" variant="Text" onClick={() => answerCupQuestion(false)} style={{ width: 240 }}>아니요</Button>
              <Button purpose="decision" variant="Primary" onClick={() => answerCupQuestion(true)} style={{ flex: 1 }}>예, 개인컵 있어요</Button>
            </div>
          </DialogFrame>}

          {screen === 'cart' && cupModalOpen && <PersonalCupDialog
            items={cartItems} lowScreen={lowScreen}
            onToggle={toggleCup}
            onConfirm={() => { setCupModalOpen(false); enterCheckout() }}
            onCancel={() => setCupModalOpen(false)} />}

          {showOrderMethodPicker && (
            <OrderMethodDialog value={orderMethod}
              onCancel={() => setShowOrderMethodPicker(false)}
              onApply={(method) => { setOrderMethod(method); clearPersonalCups(); setShowOrderMethodPicker(false) }} />
          )}

          {showHomeConfirm && (
            paymentActive && payment.step !== 'method' && homeLosesOrderNumber(payment.step) ? <ConfirmDialog
              titleId="home-print-fail-title"
              voice={dialogVoice.homePrintFail}
              title="처음 화면으로 돌아가시겠어요?"
              message={staffCall.pending ? '직원 호출이 취소되고, 주문번호가 화면에서 사라져요.' : '첫 화면으로 돌아가면 주문번호가 화면에서 사라져요.'}
              cancelLabel="계속 보기" confirmLabel="처음으로 돌아가기"
              onCancel={() => setShowHomeConfirm(false)} onConfirm={returnHome}
            /> : <ConfirmDialog
              titleId="home-confirm-title"
              // 카드 읽기 실패·거절 화면은 카드가 꽂혀 있을 수 있어 카드부터 챙기게 한다(사용자 2026-10-28 M1).
              voice={cardMayBeInserted ? dialogVoice.homeCard : dialogVoice.home}
              title={<>진행 중인 주문이 있어요.<br />처음 화면으로 돌아가시겠어요?</>}
              message={<>{cardMayBeInserted && <strong data-dialog-note style={{ display: 'block', color: 'var(--text-primary)' }}>꽂혀 있는 카드를 꺼내 주세요.</strong>}{staffCall.pending ? '직원 호출이 취소되고, 고른 메뉴와 장바구니가 모두 사라져요.' : '지금 고른 메뉴와 장바구니가 모두 사라져요.'}</>}
              cancelLabel="계속 주문하기" confirmLabel="처음으로 돌아가기"
              onCancel={() => setShowHomeConfirm(false)} onConfirm={returnHome}
            />
          )}

          {/* 시간 초과 경고가 맨 위. 직원이 늦어 다시 셀 때는 늦음 창이 열린 채여도 경고를 띄운다. */}
          {inactivity.remaining !== null && inactivity.remaining > 0 ? <IdleWarningDialog
              remaining={inactivity.remaining} staffCalled={staffCall.pending}
              // 넘어가면 잃는 것에 맞춰 글을 바꾼다: 출력 실패 = 주문번호, 카드 읽기 실패·거절 = 꽂힌 카드.
              kind={paymentActive && (payment.step === 'receiptError' || payment.step === 'slipError') ? 'printFail'
                : paymentActive && (payment.step === 'unread' || payment.step === 'declined') ? 'card' : 'order'}
              onContinue={() => { inactivity.resume(); if (staffCall.dialog !== null) closeStaffCall() }}
              // 경고에서 직원 부르기 확인 창을 열면 시간을 처음부터 다시 센다(경고가 확인 창을 바로 덮지 않게).
              onStaff={staffCall.pending ? () => dispatchStaffCall('request') : () => { inactivity.resume(); openStaffCall() }} />
            : staffCall.dialog === 'cancel' ? <ConfirmDialog
            titleId="staff-cancel-title" title="직원 호출을 취소할까요?" voice={dialogVoice.staffCancel}
            message="고른 메뉴와 장바구니는 그대로 유지돼요."
            cancelLabel="계속 기다리기" confirmLabel="호출 취소"
            onCancel={openStaffCall} onConfirm={() => dispatchStaffCall('cancel')} />
            : staffCall.dialog !== null ? <StaffCallDialog called={staffCall.pending} late={staffCall.late}
            onCall={() => dispatchStaffCall('request')} onClose={closeStaffCall}
            onCancelCall={() => dispatchStaffCall('askCancel')} /> : null}

        </div>
        </OptionEditProvider>
        </OptionProductProvider>
        </AppControlsProvider>
        </MenuLoadContext.Provider>
        </SoldOutContext.Provider>
      </div>
    </div>
  )
}
