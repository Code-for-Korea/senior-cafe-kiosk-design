// Local presentation states only. No payment, printer, or cash-device requests are made here.
export const paymentScenes = {
  card: '카드 · 삽입 안내', cardReading: '카드 · 읽는 중', cardProcessing: '카드 · 결제 처리 중',
  success: '카드 · 결제 완료 / 카드 회수', declined: '카드 · 승인 거절', unread: '카드 · 읽기 실패',
  device: '공통 · 기기 오류 / 미결제', unknown: '공통 · 결제 결과 미확인',
  cashInsert: '현금 · 투입 안내', cashCounting: '현금 · 금액 확인 중', cashMore: '현금 · 추가 투입',
  cashRejected: '현금 · 돌아온 지폐 안내', cashComplete: '현금 · 정확한 금액 결제 완료',
  cashChangePaying: '현금 · 거스름돈 지급 중', cashChangeReady: '현금 · 거스름돈 회수',
  cashCancel: '현금 · 취소 / 돈 반환 중', cashCancelReturned: '현금 · 돌려받은 돈 회수', cashError: '현금 · 공통 오류',
  mobileChoice: '모바일 · 방법 선택', mobileScan: '모바일 · 바코드·QR 보여주기', mobileTap: '모바일 · 휴대폰 대기',
  mobileHelp: '모바일 · 도움말 앱 선택', mobileNaver: '모바일 · 네이버페이 도움말',
  mobileKakao: '모바일 · 카카오페이 도움말', mobileToss: '모바일 · 토스페이 도움말',
  mobileProcessing: '모바일 · 결제 처리 중', mobileSuccess: '모바일 · 결제 완료',
  receipt: '영수증 · 받기 선택', printing: '영수증 · 출력 중(주문번호표 함께)', receiptError: '영수증 · 출력 실패(주문번호표 함께)',
  printingSlip: '주문번호표 · 출력 중', slipError: '주문번호표 · 출력 실패',
  completeReceipt: '완료 · 주문번호표·영수증 회수', complete: '완료 · 주문번호표 회수',
} as const
export type PaymentScene = keyof typeof paymentScenes
export const mobilePaymentHelp = {
  mobileNaver: { name: '네이버페이', steps: ['Npay 앱을 열어 주세요.', '현장결제에서 ‘QR결제’를 선택해 주세요.', '결제에 사용할 수단을 확인하고\nQR코드를 화면에 띄워 주세요.'] },
  mobileKakao: { name: '카카오페이', steps: ['카카오페이 앱을 열어 주세요.', '‘결제’를 선택해 주세요.', '결제에 사용할 수단을 확인하고\n바코드나 QR코드를 화면에 띄워 주세요.'] },
  mobileToss: { name: '토스페이', steps: ['토스 앱을 열어 주세요.', '홈 화면에서 ‘결제’를 눌러 주세요.', 'QR코드를 눌러 결제할 카드나 계좌를\n확인해 주세요.'] },
} as const
export type MobileHelpApp = keyof typeof mobilePaymentHelp
export type MobileHelpScene = 'mobileHelp' | MobileHelpApp
export function isMobileHelpScene(scene: string): scene is MobileHelpScene {
  return scene === 'mobileHelp' || Object.prototype.hasOwnProperty.call(mobilePaymentHelp, scene)
}
export type PaymentDestination = PaymentScene | 'method' | 'staff' | 'home'
export type PaymentAction = { label: string; to: PaymentDestination }
export type CashRejectReason = 'unread' | 'unsupported'
export type CashErrorReason = 'change' | 'return' | 'unknown' | 'retained' | 'returned' | 'noDeposit'
export const cashRejectReasons: Record<CashRejectReason, string> = { unread: '지폐 읽기 실패', unsupported: '외화·지원하지 않는 지폐 등' }
export const cashErrorReasons: Record<CashErrorReason, string> = {
  change: '거스름돈이 모두 나오지 않음', return: '취소 중 돈이 모두 나오지 않음', unknown: '결제 결과 미확인',
  retained: '거부된 지폐 회수 미확인', returned: '미결제·전액 반환 확인', noDeposit: '미결제·보관 금액 없음',
}
export type PaymentArt = 'card' | 'cash' | 'scan' | 'tap' | 'receipt' | 'success' | 'error' | 'unknown'
export interface PaymentView {
  title: string
  description?: string
  emphasis?: string
  singleLine?: boolean
  layout?: 'insertion' | 'processing' | 'mobile' | 'cashResult' | 'complete'
  tasks?: string[]  // 마친 뒤 할 일 · 결제 완료 화면에서 주문번호 아래에 크게
  art?: PaymentArt
  busy?: boolean
  orderNumber?: boolean
  amountLabel?: string
  moneyRows?: [string, number][]
  primary?: PaymentAction
  secondary?: PaymentAction
  neutralActions?: boolean
  choices?: PaymentAction[]
  steps?: string[]
  supported?: string[]
  help?: PaymentAction
  // 손대지 않으면 저절로 넘어가는 곳과 남은 시간 문구(‘N초 후 …’). 화면을 누르면 처음부터 다시 센다.
  autoNext?: PaymentAutoNext
}
export interface PaymentAutoNext { seconds: number; to: PaymentDestination; text: string }
// 결제가 끝난 화면은 저절로 넘어간다. 완료는 20초 뒤 첫 화면(기획 S60·D-13, 화면을 누르면 다시).
// 영수증을 고르기 전이면 30초 뒤 ‘받지 않기’처럼 주문번호표만 출력한다(사용자 2026-10-21 가안). 느린 손님도 번호표는 받게.
export const COMPLETE_AUTO_SECONDS = 20
export const RECEIPT_AUTO_SECONDS = 30
const toSlip: PaymentAutoNext = { seconds: RECEIPT_AUTO_SECONDS, to: 'printingSlip', text: '후 영수증 없이 진행해요.' }
const toHome: PaymentAutoNext = { seconds: COMPLETE_AUTO_SECONDS, to: 'home', text: '후 첫 화면으로 돌아가요.' }
const action = (label: string, to: PaymentDestination): PaymentAction => ({ label, to })
const staff = action('직원 부르기', 'staff')
// 화면 안 ‘직원 부르기’는 문제가 생긴 화면(기기 문제·결제 여부 모름·현금 마무리 실패·영수증·주문번호표 출력 실패)에만 둔다.
// 정상 화면과 기다리는 화면은 아래 기능바의 ‘직원 부르기’를 쓴다(기획 S54·D-20, 사용자 C안 2026-10-20).
// 기계가 멈추면 버튼을 늘리는 대신 오류 화면으로 넘긴다: 실제 기기를 연결할 때 응답 대기 시간을 정해, 넘으면 device·unknown·cashError로 보낸다.
// 시안은 기기 신호가 없어 화면 밖 시연 버튼으로 넘긴다.
// 결제 방법 화면으로 돌아가는 버튼은 어느 화면에서나 같은 이름(사용자 2026-10-28 M2). 넣은 돈이 있을 때의 ‘결제 취소’만 다르다(돈을 돌려준 뒤 돌아감).
const method = action('결제 방법 다시 고르기', 'method')
const mobileBack = action('← 이전 · 휴대폰 결제방법', 'mobileChoice')
const paidTitle = '결제가 완료됐어요'
// 출력 실패 화면 두 곳의 안내와 마치기 버튼. 영수증뿐 아니라 번호표도 없으므로 ‘번호표 없이 마치기’.
const finishWithoutSlip = action('번호표 없이 마치기', 'home')
const printFailNote = (staffPending: boolean) => staffPending ? '직원이 주문번호표를 가져다드릴 때까지\n이 자리에서 기다려 주세요.' : '직원을 부르면 주문번호표를 대신 드려요.'

// canChangeMethod: 고장 나지 않은 다른 결제방법이 남아 있는지. 기기 문제 화면에서 ‘결제 방법 다시 고르기’를 둘지 정한다.
// staffPending: 직원을 이미 불렀으면 ‘직원을 불러 주세요’ 대신 기다리라고 쓴다. 음성의 부른 뒤 문장과 같은 말(사용자 2026-10-21).
export function paymentView(scene: PaymentScene, total: number, deposited: number, rejected: CashRejectReason, error: CashErrorReason, canChangeMethod = true, staffPending = false): PaymentView {
  const change = Math.max(0, deposited - total)
  const cashRows: [string, number][] = [['결제할 금액', total], ['넣은 금액', deposited], ['남은 금액', Math.max(0, total - deposited)]]
  const cashBase: PaymentView = { title: '', layout: 'insertion', art: 'cash', moneyRows: cashRows, neutralActions: true }
  // 결제가 끝난 화면은 모두 마지막 완료 화면과 같은 배치: 주문번호 카드 → 할 일(크게) → 안내(2026-10-20 사용자 O1). 그림은 없음.
  const resultBase: PaymentView = { title: paidTitle, layout: 'complete', orderNumber: true }
  switch (scene) {
    case 'card': return { title: '카드를 투입구에 넣어 주세요', description: '금색 칩이 위로 보이도록 넣어 주세요.', layout: 'insertion', art: 'card', amountLabel: '결제 금액', secondary: method }
    case 'cardReading':
    case 'cardProcessing': return { title: '결제를 진행하고 있어요', description: '카드를 빼지 말고 잠시 기다려 주세요.', layout: 'processing', busy: true, amountLabel: '결제 금액' }
    case 'success': return { ...resultBase, tasks: ['투입구에서 카드를 꺼내 챙겨 주세요.'], amountLabel: '결제한 금액', primary: action('카드를 챙겼어요', 'receipt') }
    case 'declined': return { title: '카드 결제가 거절됐어요', description: '결제되지 않았어요.\n카드를 꺼낸 뒤 다른 카드로 결제해 주세요.', art: 'error', amountLabel: '결제할 금액', primary: action('다른 카드로 결제', 'card'), secondary: method }
    case 'unread': return { title: '카드를 읽지 못했어요', description: '카드를 꺼낸 뒤 금색 칩이 위로\n보이도록 다시 넣어 주세요.', art: 'card', amountLabel: '결제할 금액', primary: action('다시 시도', 'card'), secondary: method }
    // 결제 기계 문제: 결제되지 않은 게 확실해 다른 방법이 남아 있으면 고를 수 있게 한다(현금 기계 문제와 같은 배치, 사용자 2026-10-20).
    // 고장 난 방법은 결제 방법 화면에서 잠긴다. 남은 방법이 없을 때만 직원 부르기 하나.
    case 'device': return canChangeMethod
      ? { title: '기기 문제로 이 결제방법을 쓸 수 없어요', description: staffPending ? '결제되지 않았어요.\n다른 결제방법을 고르거나 직원을 기다려 주세요.' : '결제되지 않았어요.\n다른 결제방법을 고르거나 직원을 불러 주세요.', art: 'error', amountLabel: '결제할 금액', primary: method, secondary: staff }
      : { title: '기기 문제로 결제를 진행할 수 없어요', description: staffPending ? '결제되지 않았어요.\n이 자리에서 직원을 기다려 주세요.' : '결제되지 않았어요.\n직원에게 도움을 요청해 주세요.', art: 'error', amountLabel: '결제할 금액', primary: staff }
    case 'unknown': return { title: '결제 여부를 확인하지 못했어요', description: staffPending ? '다시 결제하지 말고\n이 자리에서 직원을 기다려 주세요.' : '다시 결제하지 말고\n직원에게 확인을 요청해 주세요.', art: 'unknown', amountLabel: '확인할 결제 금액', primary: staff }
    case 'cashInsert': return { ...cashBase, title: '지폐를 한 장씩 넣어 주세요', description: '넣은 금액이 확인되면\n화면의 금액이 바뀌어요.', secondary: method }
    case 'cashCounting': return { ...cashBase, title: '넣은 금액을 확인하고 있어요', description: '다음 지폐는 잠시 기다렸다가 넣어 주세요.', singleLine: true }
    case 'cashMore': return { ...cashBase, title: '남은 금액을 넣어 주세요', description: '지폐를 한 장씩 넣어 주세요.\n넣은 금액은 아래에서 확인할 수 있어요.', secondary: action('결제 취소', 'cashCancel') }
    case 'cashRejected': return { ...cashBase,
      title: rejected === 'unread' ? '지폐를 읽지 못했어요' : '처리할 수 없는 지폐예요',
      description: rejected === 'unread' ? '나온 지폐를 펴서 다시 넣거나\n다른 지폐를 넣어 주세요.' : '나온 지폐를 챙기고 다른 지폐를 넣어 주세요.',
      singleLine: rejected === 'unsupported', neutralActions: false,
      primary: action(rejected === 'unread' ? '다시 넣기' : '다른 지폐 넣기', deposited ? 'cashMore' : 'cashInsert'),
      secondary: deposited ? action('결제 취소', 'cashCancel') : method,
    }
    case 'cashComplete': return { ...resultBase, tasks: ['영수증이 필요하신지 선택해 주세요.'], moneyRows: [['결제한 금액', total], ['넣은 금액', deposited], ['거스름돈', change]], primary: action('영수증 선택', 'receipt'), autoNext: toSlip }
    case 'cashChangePaying': return { ...resultBase, tasks: ['거스름돈이 나오고 있어요.'], description: '돈이 모두 나온 뒤 챙겨 주세요.', busy: true, moneyRows: [['넣은 금액', deposited], ['결제한 금액', total], ['받을 거스름돈', change]] }
    case 'cashChangeReady': return { ...resultBase, tasks: ['거스름돈을 챙겨 주세요.'], moneyRows: [['넣은 금액', deposited], ['결제한 금액', total], ['나온 거스름돈', change]], primary: action('거스름돈을 챙겼어요', 'receipt') }
    case 'cashCancel': return { title: '넣은 돈을 돌려드리고 있어요', description: '돈이 모두 나온 뒤 챙겨 주세요.', layout: 'cashResult', busy: true, moneyRows: [['넣은 금액', deposited], ['나온 금액', 0], ['아직 돌려받을 금액', deposited]] }
    case 'cashCancelReturned': return { title: '돌려드린 돈을 챙겨 주세요', description: '결제는 취소됐어요.\n돈을 챙긴 뒤 결제방법을 다시 골라 주세요.', layout: 'cashResult', art: 'cash', moneyRows: [['넣은 금액', deposited], ['나온 금액', deposited], ['아직 돌려받을 금액', 0]], primary: action('돈을 챙겼어요', 'method') }
    case 'cashError': {
      // 넣은 돈이 모두 나온 경우는 돈이 걸려 있지 않아 화면 안 직원 버튼 없이 버튼 하나만 둔다(사용자 2026-10-29). 직원은 아래 기능바로 부른다.
      const base: PaymentView = { title: '현금 결제를 마무리하지 못했어요', description: staffPending ? '돈을 더 넣지 말고\n이 자리에서 직원을 기다려 주세요.' : '돈을 더 넣지 말고 직원을 불러 주세요.', layout: 'cashResult', art: 'error', primary: staff }
      const changeOut = Math.min(2000, change)
      const returned = Math.min(4000, deposited)
      if (error === 'change') return { ...base, emphasis: '거스름돈이 모두 나오지 않았어요.', moneyRows: [['받을 거스름돈', change], ['나온 금액', changeOut], ['아직 받지 못한 금액', change - changeOut]] }
      if (error === 'return') return { ...base, emphasis: '결제를 취소하는 중 넣으신 돈이\n모두 나오지 않았어요.', moneyRows: [['넣은 금액', deposited], ['나온 금액', returned], ['아직 받지 못한 금액', deposited - returned]] }
      if (error === 'unknown' || error === 'retained') return { ...base, emphasis: error === 'unknown' ? '기기에서 결제가 됐는지\n확인하지 못하고 있어요.' : '넣으신 지폐가 돌아왔는지\n확인하지 못하고 있어요.', moneyRows: [['확인된 투입 금액', deposited]] }
      if (error === 'returned') return { ...base, emphasis: '결제되지 않았어요.\n넣으신 돈은 모두 나왔어요.', description: '돈을 챙긴 뒤 결제방법을 다시 골라 주세요.', moneyRows: [['넣은 금액', deposited], ['나온 금액', deposited], ['아직 받지 못한 금액', 0]], primary: action('돈을 챙겼어요 · 결제 방법 다시 고르기', 'method') }
      return { ...base, emphasis: '기기 문제로 결제되지 않았어요.', description: '다른 결제방법을 선택해 주세요.', moneyRows: [['기기에 보관된 금액', 0]], primary: method, secondary: staff }
    }
    case 'mobileChoice': return { title: '휴대폰 결제 방법을 골라 주세요', description: '사용하실 방법을 눌러 주세요.', layout: 'mobile', choices: [action('바코드·QR 보여주기', 'mobileScan'), action('휴대폰 대기', 'mobileTap')], amountLabel: '결제 금액', secondary: method }
    case 'mobileScan': return { title: '결제 바코드나 QR코드를 보여주세요', description: '휴대폰 화면의 코드를 그림에 표시된 곳에 보여주세요.', singleLine: true, layout: 'insertion', art: 'scan', amountLabel: '결제 금액', help: action('결제 코드 여는 방법', 'mobileHelp'), secondary: mobileBack }
    case 'mobileTap': return { title: '휴대폰을 그림에 표시된 곳에 대 주세요', description: '휴대폰에서 결제 앱을 열고 인증한 뒤 대 주세요.', singleLine: true, layout: 'insertion', art: 'tap', amountLabel: '결제 금액', secondary: mobileBack }
    case 'mobileHelp': return { title: '결제 코드 여는 방법', description: '휴대폰에서 사용하는 앱을 골라 주세요.', choices: [action('네이버페이', 'mobileNaver'), action('카카오페이', 'mobileKakao'), action('토스페이', 'mobileToss')] }
    case 'mobileNaver':
    case 'mobileKakao':
    case 'mobileToss': {
      const { name, steps } = mobilePaymentHelp[scene]
      return { title: name + ' 코드 여는 방법', steps: [...steps] }
    }
    case 'mobileProcessing': return { title: '결제를 진행하고 있어요', description: '잠시 기다려 주세요.', layout: 'processing', busy: true, amountLabel: '결제 금액' }
    case 'mobileSuccess': return { ...resultBase, tasks: ['영수증이 필요하신지 선택해 주세요.'], amountLabel: '결제한 금액', primary: action('영수증 선택', 'receipt'), autoNext: toSlip }
    // 주문번호표는 영수증을 받든 안 받든 늘 나온다. 영수증은 고르면 함께 나온다(사용자 2026-10-20). 번호를 외우지 않아도 되게.
    case 'receipt': return { title: '영수증을 받으시겠어요?', description: '주문번호표는 영수증을 받지 않아도 나와요.', art: 'receipt', primary: action('받기', 'printing'), secondary: action('받지 않기', 'printingSlip'), autoNext: toSlip }
    case 'printing': return { title: '영수증을 출력하고 있어요', description: '주문번호표도 함께 나와요.\n출력이 끝나면 챙겨 주세요.', art: 'receipt', busy: true }
    case 'printingSlip': return { title: '주문번호표를 출력하고 있어요', description: '출력이 끝나면 챙겨 주세요.', art: 'receipt', busy: true }
    // 기획 S60-NORECEIPT(S60 주문 완료의 오류 상태)라 마지막 완료 화면과 같은 배치: 주문번호 카드 → 할 일 → 안내(2026-10-20 사용자 R1).
    // 출력기가 멈추면 주문번호표도 나오지 않는다. 직원이 번호표를 대신 주므로 두 실패 화면 모두 직원 부르기를 둔다.
    // 손님에게 남은 기록이 화면의 주문번호뿐이라 20초 뒤 말없이 넘어가지 않고, 주문 화면처럼 90초 뒤 경고 창(30초)을 거친다(사용자 2026-10-28).
    case 'receiptError': return { title: paidTitle, layout: 'complete', orderNumber: true, tasks: ['영수증과 주문번호표를 출력하지 못했어요.'], description: printFailNote(staffPending), primary: staff, secondary: finishWithoutSlip }
    case 'slipError': return { title: paidTitle, layout: 'complete', orderNumber: true, tasks: ['주문번호표를 출력하지 못했어요.'], description: printFailNote(staffPending), primary: staff, secondary: finishWithoutSlip }
    // 결제 완료: 결제됨 → 주문번호(가장 크게) → 할 일 → 인사 순서(2026-10-18 사용자 A안). 할 일 목록이 그림을 대신한다.
    case 'completeReceipt': return { title: paidTitle, layout: 'complete', orderNumber: true, tasks: ['출력된 주문번호표와 영수증을 챙겨 주세요.'], description: '이용해 주셔서 감사합니다.', primary: action('처음으로', 'home'), autoNext: toHome }
    case 'complete': return { title: paidTitle, layout: 'complete', orderNumber: true, tasks: ['출력된 주문번호표를 챙겨 주세요.'], description: '이용해 주셔서 감사합니다.', primary: action('처음으로', 'home'), autoNext: toHome }
  }
}

export function isPaymentScene(value: string | null): value is PaymentScene {
  return value !== null && Object.prototype.hasOwnProperty.call(paymentScenes, value)
}

// Explicit scenario selection supplies example amounts; customer navigation preserves them.
export function demoDeposit(scene: PaymentScene, total: number, error: CashErrorReason): number {
  if (scene === 'cashComplete') return total
  if (scene === 'cashChangePaying' || scene === 'cashChangeReady' || (scene === 'cashError' && error === 'change')) return Math.ceil(total / 10000) * 10000
  if (scene === 'cashInsert' || scene === 'cashCounting' || (scene === 'cashError' && error === 'noDeposit')) return 0
  return Math.min(10000, total)
}

// 기계가 처리하는 동안 손님은 기다리기만 하는 화면. 이때 기능바는 ‘직원 부르기’만 누를 수 있다(기획 S54·D-20, 사용자 2026-10-20).
// 잘못 눌러 화면이 바뀌거나 처음으로 가는 일을 막는다. 다시 듣기·음량은 배치를 바꾸지 않아 그대로 둔다.
export const utilityLockScenes: readonly PaymentScene[] = ['cardReading', 'cardProcessing', 'mobileProcessing', 'cashCounting', 'cashChangePaying', 'cashCancel', 'printing', 'printingSlip']
export const paymentLocksUtility = (scene: PaymentScene) => utilityLockScenes.includes(scene)

// 결제는 끝났지만 주문번호표가 아직 나오지 않은 화면. 여기서 ‘처음으로’를 누르면 번호표를 먼저 출력하고 끝낸다(사용자 2026-10-28 H1).
export const homePrintsSlipFirst = (scene: PaymentScene) => scene === 'cashComplete' || scene === 'mobileSuccess' || scene === 'receipt'
// 출력에 실패해 손님에게 남은 기록이 화면의 주문번호뿐인 화면. ‘처음으로’를 누르면 주문번호가 사라진다고 한 번 더 묻는다(H1).
export const homeLosesOrderNumber = (scene: PaymentScene) => scene === 'receiptError' || scene === 'slipError'

export function mustResolveBeforeHome(scene: PaymentScene, error: CashErrorReason): boolean {
  return ['cardReading', 'cardProcessing', 'success', 'device', 'unknown', 'cashCounting', 'cashMore', 'cashRejected', 'cashCancel', 'cashCancelReturned', 'cashChangePaying', 'cashChangeReady', 'mobileProcessing', 'printing', 'printingSlip'].includes(scene)
    || (scene === 'cashError' && error !== 'noDeposit')
}
