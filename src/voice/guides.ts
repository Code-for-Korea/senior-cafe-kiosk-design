export interface Guide {
  id: string; text: string; target: string; quiet?: boolean
  // 다시 듣기·숨기기를 이 화면 글 옆에 둔다.
  existing?: string
  // 고른 뒤 화면: 이 버튼 이름을 붙여 ‘○○ 버튼을 눌러 주세요.’로 읽는다(nextButtonLine).
  nextLabelTarget?: string
  lineFocus?: { line: number; target: string }; narration?: { text: string; target: string }[]
  // 대화상자 안의 안내. 말풍선 없이 테두리만 대화상자 위에 그린다.
  dialog?: boolean
  // 음성 안내가 꺼져 있어도 이 화면에 올 때마다 한 번 말한다(대기 화면, 기획 S00·D-04).
  announce?: string
  // 경고·오류: 같은 주문에서 다시 나와도 나타날 때마다 처음부터 읽는다(사용자 2026-10-19). 다른 안내는 한 주문에 한 번.
  always?: boolean
  // 버튼마다 바로 위에 붙는 짧은 말풍선(왼쪽 버튼부터). 화면 위쪽 말풍선 대신 쓴다(영수증 출력 실패, 사용자 A안 2026-10-20).
  tips?: string[]
  // 말풍선 없이 음성과 테두리만(사용자 2026-10-20: 말풍선은 정말 중요한 곳에만). 화면 글이 이미 같은 말을 할 때.
  noBubble?: boolean
}
const guide = (id: string, text: string, target: string, quiet = false): Guide => ({ id, text, target, quiet })

// 음성 길잡이 범위(기획 D-04, 2026-10-19 다시 확인): 다음 행동과 버튼·영역의 위치만 알린다.
// 이름·가격·고른 내용·금액은 읽지 않고 ‘○○은 ○○ 아래에 있어요’처럼 위치를 말한 뒤 그 칸에 테두리를 두른다.
// 바뀌는 숫자(주문번호·음량)는 읽지 않는다. 주문번호는 큰 글자와 주문번호표가 맡는다(사용자 2026-10-28). 버튼 이름은 화면 글자 그대로.
// 이 파일은 다른 모듈을 불러오지 않는다(디자인 시스템 내보내기가 따로 읽음).
// 마지막 글자에 받침이 있는지. 숫자는 읽는 소리 기준(영·일·삼·육·칠·팔).
function hasFinal(word: string) {
  const last = word.trim().slice(-1), code = last.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0
  return '013678'.includes(last)
}
const eul = (word: string) => word + (hasFinal(word) ? '을' : '를')
// 고른 뒤 다음 버튼 안내. 버튼 이름이 할 일을 말하므로 이름만 읽는다(사용자 2026-10-28).
// 바꾸는 중의 두 버튼은 장바구니 ‘선택 바꾸기’ 창과 같은 문장으로 읽는다.
export function nextButtonLine(label: string) {
  if (label === '변경 적용') return '바꾼 대로 하려면, 변경 적용을 눌러 주세요.'
  if (label === '기존 선택 유지') return '그대로 두려면, 기존 선택 유지를 눌러 주세요.'
  return `${label} 버튼을 눌러 주세요.`
}
// 고르기 질문. 주문 화면과 장바구니 ‘선택 바꾸기’ 창이 같은 문장을 쓴다. 고를 것은 버튼 이름 그대로 읽는다.
export function optionPrompt(step: string, sizes?: string[]) {
  const prompts: Record<string, string> = {
    temperature: '따뜻하게 드실지, 차갑게 드실지 골라 주세요.',
    size: sizes?.length ? `원하는 크기를 ${sizes.join(', ')} 중에서 골라 주세요. 추가 금액은 각 버튼에 적혀 있어요.` : '원하는 음료 크기를 골라 주세요.',
    caffeine: '카페인 있음과, 카페인을 줄인 디카페인 중에서 골라 주세요.',
    ice: '얼음 보통, 얼음 적게, 얼음 없이 중에서 골라 주세요.',
  }
  return prompts[step]
}
// 결제 코드 도움말 창의 안내. 도움말 화면과 창이 같은 문장을 쓴다.
const mobileHelpLine = '네이버페이, 카카오페이, 토스페이 중에서 사용하는 앱을 골라 주세요.'

export interface OrderVoiceInfo {
  sizes?: string[]          // 크기 이름(기본·대·특대). 추가 금액은 읽지 않고 버튼에 적혀 있다고 알린다.
  cartHasItems?: boolean    // 메뉴 화면 아래에 장바구니 보기가 있을 때
  staffPending?: boolean    // 직원을 이미 불렀을 때: ‘직원 부르기를 눌러’ 대신 기다리라고 한다
  chooseTemperature?: boolean // 상품 화면: 기본 주문에서 온도를 골라야 하는지(온도가 둘이고 미리 고른 온도가 없을 때). false면 고를 것 없이 확인 화면으로
}

export function orderGuide(screen: string, ready = false, info: OrderVoiceInfo = {}): Guide {
  const next = '[data-voice-next] button:last-child, [data-low-options-actions] button:last-child'
  const choices = '[data-voice-choice]:not(:disabled)'
  const prompts: Record<string, string> = Object.fromEntries(['temperature', 'size', 'caffeine', 'ice'].map(step => [step, optionPrompt(step, info.sizes)]))
  const optionQuestion = '[data-voice-heading] > p:first-child, [data-low-option-question] > span:last-child'
  if (prompts[screen]) return ready
    ? { ...guide(screen + '-next', '아래 버튼을 눌러 주세요.', next), nextLabelTarget: next, existing: optionQuestion }
    : { ...guide(screen + '-choose', prompts[screen], choices), existing: optionQuestion, narration: [{ text: prompts[screen], target: choices }] }
  const dessertTarget = '[aria-label="수량 선택과 담기"] [role="group"], [data-voice-action="dessert-add"]'
  // 상품 화면 오른쪽 위 ‘← 메뉴’. 음료·디저트 모두 같은 자리라 같은 문장(사용자 2026-10-19).
  const menuBack = { text: '메뉴로 돌아가려면, 오른쪽 위 메뉴 버튼을 눌러 주세요.', target: '[data-voice-action="menu-back"]' }
  // 상품 화면 기본 주문 길: 온도만 고르고(온도가 하나뿐이거나 미리 골랐으면 고를 것 없이) 확인 화면에서 담는다.
  const quickOrder = info.chooseTemperature === false ? '기본 그대로 담으려면' : '온도만 고르고 담으려면'
  const menuCart = info.cartHasItems ? [{ text: '결제하려면, 장바구니 보기를 눌러 주세요.', target: '[data-menu-cart-actions] button, [data-low-menu-cart] button' }] : []
  // 화면당 음성은 버튼 위치를 알리는 줄 위주로 둔다. ‘○○을 확인해 주세요’처럼 버튼을 가리키지 않는 줄은 뺀다(사용자 2026-10-28).
  // 노년층이 어려워하는 것은 무엇이 어디에 있는지 찾는 일이라, 버튼마다 한 줄씩 그 버튼에 테두리를 두르는 방식은 그대로 둔다.
  const guides: Record<string, Guide> = {
    method: { ...guide('method', '매장이용과 포장 중에서 골라 주세요.', '[data-voice-method-options]'), existing: '#method-question', narration: [{ text: '매장이용과 포장 중에서 골라 주세요.', target: '[data-voice-method-options]' }] },
    menu: { ...guide('menu', '원하는 메뉴를 눌러 주세요.', '[aria-label="메뉴 목록"]'), existing: '[data-voice-menu-question]', narration: [
      { text: '원하는 메뉴를 눌러 주세요.', target: '[aria-label="메뉴 목록"]' },
      { text: '이름으로 찾으려면 검색하기를 눌러 주세요.', target: '[data-voice-action="search"]' },
      ...menuCart,
    ] },
    // 메뉴를 받는 동안(사용자 L1 2026-10-20). 기다리기만 하면 돼서 결제 처리 중처럼 테두리·말풍선 없이 말만 한다.
    'menu-loading': guide('menu-loading', '메뉴를 불러오고 있어요. 잠시 기다려 주세요.', '[data-menu-loading]', true),
    // 메뉴를 받지 못함(사용자 F). 오류라 나타날 때마다 처음부터 읽고, 화면 글이 같은 말을 해 말풍선은 두지 않는다.
    'menu-failed': { ...guide('menu-failed', '다시 불러오기를 눌러 주세요.', '[data-menu-load-failed]'), existing: '[data-voice-menu-question]', always: true, noBubble: true, narration: [
      { text: '메뉴를 불러오지 못했어요.', target: '[data-menu-load-failed] > div' },
      { text: '다시 불러오려면, 다시 불러오기를 눌러 주세요.', target: '[data-voice-action="menu-retry"]' },
      info.staffPending
        ? { text: '직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.', target: '[data-voice-utility] button[data-pending]' }
        : { text: '계속 안 되면, 아래 직원 부르기를 눌러 주세요.', target: '[data-voice-utility] button[aria-label="직원 부르기"]' },
    ] },
    // 조건에 맞는 메뉴 없음(사용자 E1, 기획 S20-EMPTY). 화면 글이 같은 말을 해 말풍선은 두지 않는다.
    'menu-empty': { ...guide('menu-empty', '전체 메뉴 보기를 눌러 주세요.', '[data-menu-empty]'), existing: '[data-voice-menu-question]', noBubble: true, narration: [
      { text: '조건에 맞는 메뉴가 없어요.', target: '[data-menu-empty] > div' },
      { text: '다른 메뉴를 보려면, 전체 메뉴 보기를 눌러 주세요.', target: '[data-voice-action="menu-show-all"]' },
    ] },
    // 두 주문 길: 음성을 켜면 버튼마다 조건 말풍선, 음성도 버튼마다 한 줄(왼쪽부터). 말풍선 글 = 그 줄의 조건(사용자 3안 2026-10-21).
    product: { ...guide('product', '기본 값으로 주문하거나, 직접 하나씩 고를 수 있어요.', '[data-voice-action="order-default"], [data-voice-action="order-custom"]'), narration: [
      { text: `${quickOrder}, 기본 값으로 주문을 눌러 주세요.`, target: '[data-voice-action="order-default"]' },
      { text: '직접 하나씩 고르려면, 내 입맛에 맞게 주문을 눌러 주세요.', target: '[data-voice-action="order-custom"]' },
      menuBack,
    ], tips: [quickOrder, '직접 하나씩 고르려면'], noBubble: true },
    // 디저트는 아래 메뉴로 돌아가기에 말풍선·문장이 있어 오른쪽 위 ‘← 메뉴’ 줄은 두지 않는다(같은 안내가 두 번 나오지 않게).
    dessert: { ...guide('dessert', '수량을 확인하고, 담기 버튼을 눌러 주세요.', dessertTarget), narration: [
      { text: '다른 메뉴를 보려면, 메뉴로 돌아가기를 눌러 주세요.', target: '[data-voice-action="item-back"]' },
      { text: '주문에 담으려면, 담기를 눌러 주세요.', target: '[data-voice-action="dessert-add"]' },
    ], noBubble: true },
    review: { ...guide('review', '고른 내용과 수량을 확인한 뒤, 담기 버튼을 눌러 주세요.', '[data-voice-review-options], [data-voice-review-quantity], [data-voice-action="review-add"]'), existing: '[data-voice-heading] > p:first-child, [data-low-review] h1', narration: [
      { text: '바꾸려면, 각 항목의 바꾸기를 눌러 주세요.', target: '[data-voice-review-options] button' },
      { text: '주문에 담으려면, 담기를 눌러 주세요.', target: '[data-voice-action="review-add"]' },
    ] },
    cart: { ...guide('cart', '담은 메뉴를 확인하고, 결제 방법 고르기를 눌러 주세요.', '[data-cart-actions], [data-low-cart-actions]'), existing: '[data-cart-header] h1, [data-low-cart-heading] h1', narration: [
      { text: '더 담으려면, 메뉴 더 고르기를 눌러 주세요.', target: '[data-voice-action="cart-more"]' },
      { text: '주문을 마치려면, 결제 방법 고르기를 눌러 주세요.', target: '[data-voice-action="cart-pay"]' },
    ] },
    // 대기 화면(S00). 화면 아무 곳이나 누르면 이용 방법으로(사용자 결정).
    attract: { ...guide('attract', '화면을 누르면 주문이 시작돼요.', '[data-attract-prompt]'), existing: '[data-attract-title]', narration: [
      // 글자가 커서 테두리는 두르지 않는다(사용자 2026-10-20). 대상이 빈 줄은 읽기만 한다.
      { text: '화면 아무 곳이나 누르면 주문이 시작돼요.', target: '' },
    ], announce: '화면 아무 곳이나 누르면 주문이 시작돼요. 음성 안내가 필요하면 아래 음성 안내를 눌러 주세요.' },
    // 담은 뒤 품절(S40-SOLDOUT). 뺄 때까지 결제 방법 고르기는 잠겨 있다.
    'cart-soldout': { ...guide('cart-soldout', '주문할 수 없는 메뉴를 빼 주세요.', '[data-cart-soldout]'), existing: '[data-cart-header] h1, [data-low-cart-heading] h1', narration: [
      { text: '주문할 수 없는 메뉴가 있어요.', target: '[data-cart-soldout]' },
      { text: '결제하려면, 먼저 빼기를 눌러 주세요.', target: '[data-voice-action="soldout-remove"]' },
    ] },
    // 장바구니가 빔·뺄 메뉴 고르기(사용자 2026-10-20 말풍선 정리). 화면 글이 같은 말을 해 말풍선 없이 줄마다 테두리.
    'cart-empty': { ...guide('cart-empty', '메뉴 보러 가기를 눌러 메뉴를 담아 주세요.', '[data-voice-action="cart-empty-menu"]'), noBubble: true, narration: [
      { text: '장바구니가 비어 있어요.', target: '[data-cart-empty] h2' },
      { text: '메뉴를 담으려면, 메뉴 보러 가기를 눌러 주세요.', target: '[data-voice-action="cart-empty-menu"]' },
    ] },
    'cart-delete': { ...guide('cart-delete', '뺄 메뉴를 선택한 뒤, 선택한 메뉴 빼기를 눌러 주세요.', '[data-cart-list-viewport], [data-cart-actions]'), noBubble: true, narration: [
      { text: '뺄 메뉴를 선택해 주세요.', target: '[data-cart-list-viewport]' },
      { text: '고른 메뉴를 빼려면, 선택한 메뉴 빼기를 눌러 주세요.', target: '[data-voice-action="cart-remove-selected"]' },
      { text: '빼지 않으려면, 선택 취소를 눌러 주세요.', target: '[data-voice-action="cart-remove-cancel"]' },
    ] },
  }
  return guides[screen] ?? guide('general', '화면의 안내에 따라 선택해 주세요.', 'main')
}

// 결제 방법 화면. methods는 말로 읽을 이름(예: 현금(지폐) → 현금). 금액은 읽지 않고 자리를 알린다.
// 고른 뒤에는 옵션 화면과 같이 고른 것을 되읽지 않고, 실제 버튼 이름(예: 카드로 결제하기)만 알린다.
// 결제 방법 화면은 제목·버튼이 같은 말을 하므로 말풍선 없이 음성·테두리만(사용자 2026-10-20).
// unavailable: 장치를 쓸 수 없는 방법(현금 장치 꺼짐, 기계 문제가 난 방법). 고를 수 있는 것 앞에 ‘○○은 지금 쓸 수 없어요’를 알리고 그 칸에 테두리(기획 D-19).
export function paymentMethodGuide(methods: string[], actionLabel?: string, unavailable: { name: string; id: string }[] = []): Guide {
  if (actionLabel) return { ...guide('payment-method-next', `선택을 확인한 뒤, ${actionLabel} 버튼을 눌러 주세요.`, '[data-payment-actions]'), noBubble: true }
  // 하나만 남으면 ‘중에서’를 쓰지 않는다(예: 현금을 골라 주세요.).
  const pick = methods.length === 1 ? `${eul(methods[0])} 골라 주세요.` : `${methods.join(', ')} 중에서 골라 주세요.`
  return { ...guide('payment-method-choose', pick, '[aria-label="결제 방법"]'), noBubble: true, narration: [
    { text: '결제할 금액은 결제 방법 버튼 위에 있어요.', target: '[aria-label="결제 금액"]' },
    ...unavailable.map(({ name, id }) => ({ text: `${name + (hasFinal(name) ? '은' : '는')} 지금 쓸 수 없어요.`, target: `[data-payment-method="${id}"]` })),
    { text: pick, target: '[aria-label="결제 방법"]' },
  ] }
}

// staffPending: 직원을 이미 불렀으면 ‘직원 부르기를 눌러’ 대신 기다리라고 말한다(버튼 이름이 ‘직원 호출 중’으로 바뀌므로).
export interface PaymentVoiceInfo { orderNumber?: string; personalCup?: boolean; copy?: string[]; staffPending?: boolean; canChangeMethod?: boolean }
// 화면 글을 읽기 좋은 문장으로: 줄바꿈은 띄어 읽고, 끝맺음 부호가 없으면 마침표를 붙인다.
const sentences = (parts: string[]) => parts.map(part => part.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).map(part => /[.?!]$/.test(part) ? part : part + '.').join(' ')

// 결제 화면은 할 일이 이미 큰 글씨로 있어 말풍선 없이 음성·테두리만. 버튼마다 조건 말풍선(tips)이 있는 화면만 말풍선(사용자 2026-10-20).
export function paymentGuide(scene: string, info: PaymentVoiceInfo = {}): Guide {
  const g = paymentGuideLines(scene, info)
  return g.tips ? g : { ...g, noBubble: true }
}

function paymentGuideLines(scene: string, info: PaymentVoiceInfo): Guide {
  const actions = '.payment-actions'
  const picture = '.payment-figure, .payment-amount, .payment-money'
  const copy = '.payment-flow-copy'
  const copyActions = '.payment-flow-copy, .payment-actions'
  const secondaryButton = '[data-voice-action="payment-secondary"]', primaryButton = '[data-voice-action="payment-primary"]'
  const line = (text: string, target: string) => ({ text, target })
  // 주문번호는 읽지 않는다. 번호표가 나오지 않은 화면에서만 번호가 어디 있는지 알린다.
  const paid = '결제가 완료됐어요.', paidNoSlip = '결제가 완료됐어요. 주문번호는 화면에 크게 적혀 있어요.'
  // 출력 실패 두 화면의 버튼 줄(왼쪽부터). 직원을 부른 뒤에는 기다리라고 한다.
  const printFailButtons = [
    line('그냥 마치려면, 번호표 없이 마치기를 눌러 주세요.', secondaryButton),
    line(info.staffPending ? '직원이 주문번호표를 가져다드릴 때까지 이 자리에서 기다려 주세요.' : '주문번호표가 필요하면, 직원 부르기를 눌러 주세요.', primaryButton)]
  const printFailTips = { always: true, tips: ['그냥 마치려면', '주문번호표가 필요하면'] }
  const cup = info.personalCup ? [line('개인 컵을 카운터에 가져다주세요.', '.payment-tasks')] : []
  // 고를 것·할 일이 있는 화면은 여러 줄로 읽고, 말풍선에는 마지막 줄(할 일)을 보인다.
  const narrated = (id: string, target: string, items: { text: string; target: string }[], extra: Partial<Guide> = {}): Guide =>
    ({ ...guide(id, items.at(-1)!.text, target), narration: items, ...extra })
  const processing: Record<string, string> = {
    cardReading: '카드를 빼지 말고 잠시 기다려 주세요.', cardProcessing: '카드를 빼지 말고 잠시 기다려 주세요.',
    cashCounting: '넣은 금액을 확인하고 있어요. 다음 지폐는 잠시 기다렸다가 넣어 주세요.',
    cashChangePaying: '결제가 완료됐어요. 거스름돈이 나오고 있어요. 돈이 모두 나올 때까지 기다려 주세요.',
    cashCancel: '넣은 돈을 돌려드리고 있어요. 돈이 모두 나올 때까지 기다려 주세요.',
    mobileProcessing: '결제를 진행하고 있어요. 잠시 기다려 주세요.', printing: '영수증과 주문번호표를 출력하고 있어요. 잠시 기다려 주세요.',
    printingSlip: '주문번호표를 출력하고 있어요. 잠시 기다려 주세요.',
  }
  if (processing[scene]) return guide(scene, processing[scene], copy, true)
  // 결제 코드 도움말이 열린 화면. 실제로는 도움말 창의 안내(dialogVoice.mobileHelp)를 읽으므로 같은 문장을 둔다.
  if (['mobileHelp', 'mobileNaver', 'mobileKakao', 'mobileToss'].includes(scene)) return { ...guide(scene, mobileHelpLine, '[aria-label="결제 코드 도움말 앱"]'), noBubble: true }
  // 다시 듣기·숨기기를 둘 화면 글. 읽는 문장은 아래에서 따로 만든다.
  const existing: Record<string, string> = {
    card: '[data-payment-description]', cashInsert: '.payment-flow-copy h1',
    cashMore: '[data-payment-description]', cashRejected: '[data-payment-description]',
    declined: copy, unread: copy, device: copy, unknown: copy,
    cashError: copy, mobileScan: '[data-payment-description]', mobileTap: '[data-payment-description]',
    mobileChoice: '.payment-flow-copy h1', receipt: '.payment-flow-copy h1',
  }
  const at = { existing: existing[scene] }
  const alert = { ...at, always: true }
  switch (scene) {
    case 'card': return narrated(scene, picture, [
      line('결제 금액은 카드 그림 아래에 있어요.', '.payment-amount'),
      line('금색 칩이 위로 보이게 카드를 투입구에 넣어 주세요.', '.payment-figure')], at)
    case 'success': return narrated(scene, actions, [line('결제가 완료됐어요.', copy), line('카드를 꺼내 챙긴 뒤, 카드를 챙겼어요 버튼을 눌러 주세요.', actions)])
    // 버튼마다 말풍선, 음성도 왼쪽 버튼부터 한 줄씩(사용자 2026-10-20).
    case 'receipt': return narrated(scene, actions, [line('주문번호표는 영수증을 받지 않아도 나와요.', copy),
      line('영수증이 필요 없으면, 받지 않기를 눌러 주세요.', secondaryButton),
      line('영수증이 필요하면, 받기를 눌러 주세요.', primaryButton)], { ...at, tips: ['영수증이 필요 없으면', '영수증이 필요하면'] })
    // 주문번호는 마지막 완료 화면에서만 읽는다(사용자 결정).
    case 'completeReceipt': return narrated(scene, actions, [line(paid, '.payment-order-hero'), ...cup, line('출력된 주문번호표와 영수증을 챙긴 뒤, 처음으로 버튼을 눌러 주세요.', actions)])
    case 'complete': return narrated(scene, actions, [line(paid, '.payment-order-hero'), ...cup, line('출력된 주문번호표를 챙긴 뒤, 처음으로 버튼을 눌러 주세요.', actions)])
    // 버튼마다 말풍선 하나, 음성도 왼쪽 버튼부터 한 줄씩(사용자 A안 2026-10-20).
    case 'receiptError': return narrated(scene, copyActions, [line(paidNoSlip, '.payment-order-hero'), ...cup,
      line('영수증과 주문번호표를 출력하지 못했어요.', '.payment-tasks'), ...printFailButtons], printFailTips)
    case 'slipError': return narrated(scene, copyActions, [line(paidNoSlip, '.payment-order-hero'), ...cup,
      line('주문번호표를 출력하지 못했어요.', '.payment-tasks'), ...printFailButtons], printFailTips)
    case 'cashInsert': return narrated(scene, picture, [
      line('결제할 금액은 지폐 그림 아래에 있어요.', '.payment-money'),
      line('지폐를 한 장씩 넣어 주세요.', '.payment-figure')], at)
    case 'cashMore': return narrated(scene, picture, [
      line('넣은 금액과 남은 금액은 지폐 그림 아래에 있어요.', '.payment-money'),
      line('지폐를 한 장씩 넣어 주세요.', '.payment-figure')], { ...at, lineFocus: { line: 0, target: 'cash-deposited' } })
    case 'cashComplete': return narrated(scene, actions, [line('결제가 완료됐어요.', copy), line('영수증 선택 버튼을 눌러 주세요.', actions)])
    case 'cashChangeReady': return guide(scene, '나온 거스름돈을 챙긴 뒤, 거스름돈을 챙겼어요 버튼을 눌러 주세요.', actions)
    case 'cashCancelReturned': return narrated(scene, actions, [
      line('결제는 취소됐어요.', copy),
      line('돌려드린 돈을 챙긴 뒤, 돈을 챙겼어요 버튼을 눌러 주세요.', actions)])
    // 이유가 상황마다 바뀌는 화면은 화면의 제목·설명을 그대로 읽는다.
    case 'cashRejected': return { ...guide(scene, info.copy?.length ? sentences(info.copy) : '나온 지폐를 챙기고, 화면의 안내에 따라 다시 넣어 주세요.', picture), ...alert }
    case 'cashError': return { ...guide(scene, info.copy?.length ? sentences(info.copy) : (info.staffPending ? '화면에서 돈의 상태를 확인해 주세요. 직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.' : '화면에서 돈의 상태를 확인해 주세요. 도움이 필요하면 직원 부르기를 눌러 주세요.'), copyActions), ...alert }
    case 'mobileScan': return { ...guide(scene, '휴대폰 화면의 코드를 그림에 표시된 곳에 보여주세요.', picture + ', .payment-flow-copy, .payment-code-help'), ...at }
    // 버튼마다 조건 말풍선: ‘휴대폰 대기’가 기다리기로 읽히지 않게 뜻을 풀어 준다(사용자 2026-10-21).
    case 'mobileChoice': return narrated(scene, '.payment-choice-grid', [
      line('바코드·QR로 결제하려면, 바코드·QR 보여주기를 눌러 주세요.', '[data-voice-action="payment-choice-mobileScan"]'),
      line('휴대폰을 대서 결제하려면, 휴대폰 대기를 눌러 주세요.', '[data-voice-action="payment-choice-mobileTap"]')], { ...at, tips: ['바코드·QR로 결제하려면', '휴대폰을 대서 결제하려면'] })
    case 'mobileTap': return { ...guide(scene, '휴대폰에서 결제 앱을 열고 인증한 뒤, 그림에 표시된 곳에 휴대폰을 대 주세요.', picture), ...at }
    case 'mobileSuccess': return narrated(scene, actions, [line('결제가 완료됐어요.', copy), line('영수증 선택 버튼을 눌러 주세요.', actions)])
    case 'unread': return narrated(scene, copyActions, [line('카드를 읽지 못했어요.', copy),
      line('현금이나 모바일로 결제하려면, 결제 방법 다시 고르기를 눌러 주세요.', secondaryButton),
      line('이 카드로 다시 하려면, 카드를 꺼낸 뒤 다시 시도를 눌러 주세요.', primaryButton)], { ...alert, tips: ['현금·모바일로 결제하려면', '이 카드로 다시 하려면'] })
    case 'declined': return narrated(scene, copyActions, [line('카드 결제가 거절됐어요. 결제되지 않았어요.', copy),
      line('현금이나 모바일로 결제하려면, 결제 방법 다시 고르기를 눌러 주세요.', secondaryButton),
      line('다른 카드가 있으면, 카드를 꺼낸 뒤 다른 카드로 결제를 눌러 주세요.', primaryButton)], { ...alert, tips: ['현금·모바일로 결제하려면', '다른 카드가 있으면'] })
    case 'unknown': return narrated(scene, copyActions, [line('결제 여부를 확인하지 못했어요.', copy), line(info.staffPending ? '다시 결제하지 말고, 이 자리에서 직원을 기다려 주세요.' : '다시 결제하지 말고, 직원 부르기를 눌러 주세요.', actions)], alert)
    // 다른 방법이 남아 있으면 두 버튼을 왼쪽(직원)부터 한 줄씩, 할 일(결제 방법 다시 고르기)이 마지막. 남은 방법이 없으면 직원만.
    case 'device': return info.canChangeMethod === false
      ? narrated(scene, copyActions, [line('기기 문제로 결제를 진행할 수 없어요. 결제되지 않았어요.', copy), line(info.staffPending ? '직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.' : '직원 부르기를 눌러 도움을 요청해 주세요.', actions)], alert)
      : narrated(scene, copyActions, [line('기기 문제로 이 결제방법을 쓸 수 없어요. 결제되지 않았어요.', copy),
        line(info.staffPending ? '직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.' : '도움이 필요하면, 직원 부르기를 눌러 주세요.', secondaryButton),
        line('다른 방법으로 결제하려면, 결제 방법 다시 고르기를 눌러 주세요.', primaryButton)], { ...alert, tips: ['도움이 필요하면', '다른 방법으로 결제하려면'] })
  }
  return guide(scene, '화면의 안내를 확인해 주세요.', copy)
}

// 직원을 부른 지 오래됐는데 창이 닫혀 있을 때(주문을 이어 하는 중) 한 번 말한다. 창이 열려 있으면 창의 안내(staffLate)가 읽는다(사용자 2026-10-20).
export const staffLateNotice = '아직 직원이 오지 않았어요. 다시 부르려면 화면 아래 알림 줄을 눌러 주세요.'

// 대화상자 음성(2026-10-19 사용자 결정 표). 다음 행동과 버튼 이름만 말하고, 메뉴 이름·개수·남은 초는 읽지 않는다(D-04).
// 버튼마다 한 문장으로 나누고, 그 문장을 읽는 동안 그 버튼에 테두리를 두른다(사용자 2026-10-20).
// 'button:글자'는 맨 위 대화상자 안에서 그 글자가 적힌 버튼(띄어쓰기·가운뎃점·쉼표·꺾쇠는 빼고 비교). 버튼 이름은 화면 글자 그대로.
// 대화상자를 닫으면 원래 화면 안내는 다시 읽지 않는다(사용자).
export interface DialogVoice { text: string; narration: { text: string; target: string }[] }
const press = (label: string) => 'button:' + label
const dialogCopy = '[data-dialog-copy]', dialogChoices = '[data-dialog-choices]'
const lines = (...items: [string, string][]): DialogVoice => ({ text: items.map(([text]) => text).join(' '), narration: items.map(([text, target]) => ({ text, target })) })
export const dialogVoice = {
  idle: lines(['이어서 주문하려면, 계속 주문하기를 눌러 주세요.', press('계속 주문하기')], ['그대로 두면 곧 첫 화면으로 돌아가요.', '[role="timer"]'], ['도움이 필요하면 직원 부르기를 눌러 주세요.', press('직원 부르기')]),
  // 직원을 불렀는데 늦어져 다시 세는 중(사용자 2026-10-21).
  idleCalled: lines(['이어서 주문하려면, 계속 주문하기를 눌러 주세요.', press('계속 주문하기')], ['그대로 두면 곧 첫 화면으로 돌아가요.', '[role="timer"]'], ['직원을 다시 부르려면, 다시 부르기를 눌러 주세요.', press('다시 부르기')]),
  // 출력 실패 화면의 경고: 넘어가면 주문번호가 사라진다고 알린다(사용자 2026-10-28).
  idlePrintFail: lines(['주문번호를 더 보려면 계속 보기를 눌러 주세요.', press('계속 보기')], ['그대로 두면 곧 첫 화면으로 돌아가고, 주문번호가 화면에서 사라져요.', '[role="timer"]'], ['주문번호표가 필요하면 직원 부르기를 눌러 주세요.', press('직원 부르기')]),
  idlePrintFailCalled: lines(['주문번호를 더 보려면 계속 보기를 눌러 주세요.', press('계속 보기')], ['그대로 두면 곧 첫 화면으로 돌아가고, 주문번호가 화면에서 사라져요.', '[role="timer"]'], ['직원을 다시 부르려면, 다시 부르기를 눌러 주세요.', press('다시 부르기')]),
  // 카드가 꽂혀 있을 수 있는 화면(읽기 실패·거절)의 경고: 카드를 먼저 챙기게 한다(사용자 2026-10-28).
  idleCard: lines(['꽂혀 있는 카드를 꺼내 주세요.', '[data-idle-note]'], ['이어서 주문하려면, 계속 주문하기를 눌러 주세요.', press('계속 주문하기')], ['그대로 두면 곧 첫 화면으로 돌아가요.', '[role="timer"]'], ['도움이 필요하면 직원 부르기를 눌러 주세요.', press('직원 부르기')]),
  idleCardCalled: lines(['꽂혀 있는 카드를 꺼내 주세요.', '[data-idle-note]'], ['이어서 주문하려면, 계속 주문하기를 눌러 주세요.', press('계속 주문하기')], ['그대로 두면 곧 첫 화면으로 돌아가요.', '[role="timer"]'], ['직원을 다시 부르려면, 다시 부르기를 눌러 주세요.', press('다시 부르기')]),
  home: lines(['처음 화면으로 돌아가면 고른 메뉴와 장바구니가 모두 사라져요.', dialogCopy], ['돌아가려면 처음으로 돌아가기를 눌러 주세요.', press('처음으로 돌아가기')], ['이어서 주문하려면, 계속 주문하기를 눌러 주세요.', press('계속 주문하기')]),
  // 카드가 꽂혀 있을 수 있는 화면(읽기 실패·거절)에서 처음으로: 카드를 먼저 챙기게 한다(사용자 2026-10-28 M1).
  homeCard: lines(['꽂혀 있는 카드를 꺼내 주세요.', '[data-dialog-note]'], ['처음 화면으로 돌아가면 고른 메뉴와 장바구니가 모두 사라져요.', dialogCopy], ['돌아가려면 처음으로 돌아가기를 눌러 주세요.', press('처음으로 돌아가기')], ['이어서 주문하려면, 계속 주문하기를 눌러 주세요.', press('계속 주문하기')]),
  // 출력 실패 화면에서 처음으로: 주문번호가 사라진다고 알린다(사용자 2026-10-28 H1).
  homePrintFail: lines(['첫 화면으로 돌아가면 주문번호가 화면에서 사라져요.', dialogCopy], ['돌아가려면 처음으로 돌아가기를 눌러 주세요.', press('처음으로 돌아가기')], ['주문번호를 더 보려면 계속 보기를 눌러 주세요.', press('계속 보기')]),
  staffCall: lines(['직원을 불러드릴까요?', dialogCopy], ['부르려면 직원 부르기를 눌러 주세요.', press('직원 부르기')], ['부르지 않으려면, 돌아가기를 눌러 주세요.', press('돌아가기')]),
  staffWaiting: lines(['직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.', dialogCopy], ['주문을 이어 하려면 주문 화면 보기를 눌러 주세요.', press('주문 화면 보기')], ['호출을 취소하려면, 호출 취소를 눌러 주세요.', press('호출 취소')]),
  // 부른 지 오래됨(G01-LATE). 경고라 뜰 때마다 읽는다.
  staffLate: lines(['아직 직원이 오지 않았어요. 다시 부르거나 카운터에 말씀해 주세요.', dialogCopy], ['직원을 다시 부르려면, 다시 부르기를 눌러 주세요.', press('다시 부르기')], ['주문을 이어 하려면 주문 화면 보기를 눌러 주세요.', press('주문 화면 보기')]),
  staffCancel: lines(['직원 호출을 취소할까요?', dialogCopy], ['호출을 취소하려면, 호출 취소를 눌러 주세요.', press('호출 취소')], ['계속 기다리려면 계속 기다리기를 눌러 주세요.', press('계속 기다리기')]),
  remove: lines(['장바구니에서 뺄까요?', dialogCopy], ['빼려면 빼기를 눌러 주세요.', press('빼기')], ['그대로 두려면 아니요를 눌러 주세요.', press('아니요')]),
  sameItem: lines(['똑같이 고른 메뉴가 이미 담겨 있어요.', dialogCopy], ['더 담으려면 더 담기를 눌러 주세요.', press('더 담기')], ['더 담지 않으려면, 담지 않기를 눌러 주세요.', press('담지 않기')]),
  // 장바구니 ‘선택 바꾸기’로 다른 줄과 똑같아졌을 때(사용자 2026-10-21 B). 같은 메뉴 담기와 같은 말투.
  mergeItem: lines(['똑같이 고른 메뉴가 이미 담겨 있어요.', dialogCopy], ['하나로 합치려면 합치기를 눌러 주세요.', press('합치기')], ['합치지 않으려면, 계속 바꾸기를 눌러 주세요.', press('계속 바꾸기')]),
  menuReturn: (keepLabel: string) => lines(['메뉴로 돌아가면 지금 고르던 내용은 취소돼요.', dialogCopy], ['돌아가려면 메뉴로 돌아가기를 눌러 주세요.', press('메뉴로 돌아가기')], [`계속하려면 ${eul(keepLabel)} 눌러 주세요.`, press(keepLabel)]),
  cancelEdit: lines(['바꾼 내용은 저장되지 않아요.', dialogCopy], ['취소하려면 변경 취소를 눌러 주세요.', press('변경 취소')], ['계속하려면 계속 바꾸기를 눌러 주세요.', press('계속 바꾸기')]),
  personalCup: lines(['개인컵을 가지고 계신가요? 개인컵에 받으면 음료 가격이 할인돼요.', dialogCopy], ['개인컵이 있으면 예를, 없으면 아니요를 눌러 주세요.', dialogCopy]),
  personalCupSelect: lines(['개인컵으로 받을 음료를 골라 주세요. 고른 음료는 가격이 할인돼요.', dialogCopy], ['다 고르면 선택 완료 결제하기를 눌러 주세요.', dialogCopy]),
  orderMethod: lines(['매장이용과 포장 중에서 골라 주세요.', dialogChoices], ['고른 뒤 확인을 눌러 주세요.', press('확인')]),
  language: lines(['사용할 언어를 골라 주세요.', dialogChoices], ['고른 뒤 적용을 눌러 주세요.', press('적용')]),
  cartOptionList: (changed: boolean) => lines(['바꿀 항목의 바꾸기를 눌러 주세요.', press('바꾸기')], changed
    ? [nextButtonLine('변경 적용'), press('변경 적용')]
    : [nextButtonLine('기존 선택 유지'), press('기존 선택 유지')]),
  // 질문은 주문 화면의 고르기 질문과 같은 문장, 버튼 안내도 주문 화면과 같은 문장(사용자 2026-10-28).
  cartOptionStep: (step: string, doneLabel: string, sizes?: string[]) => lines([optionPrompt(step, sizes), dialogChoices], [nextButtonLine(doneLabel), press(doneLabel)]),
  productInfo: lines(['다 보셨으면 닫기를 눌러 주세요.', '[data-voice-action="dialog-close"]']),
  paymentDetails: lines(['다 보셨으면 확인을 눌러 주세요.', '[data-voice-action="dialog-close"]']),
  mobileHelp: lines([mobileHelpLine, '[aria-label="결제 코드 도움말 앱"]']),
  search: lines(['아래 자판에서 메뉴 이름의 첫 글자를 눌러 주세요.', '[data-search-keyboard]'], ['메뉴를 고른 뒤 주문으로 넘어가기를 눌러 주세요.', '[data-voice-action="search-go"]']),
}
