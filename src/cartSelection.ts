import type { CartEntry } from './screens/CartScreen'
import type { MenuItem } from './menuData'
import type { OrderState } from './types'
import { entryUnitPrice } from './orderPricing'
import { cartOptionLabels, mergeOptionChanges } from './selectionSummary'

// 결제 대상은 항상 장바구니 전체. 삭제 선택은 금액에 영향을 주지 않는다. 개인컵 할인은 줄별로 반영된다.
export function cartTotals(items: CartEntry[]) {
  return {
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + entryUnitPrice(item) * item.quantity, 0),
  }
}

// 삭제 개수는 수량이 아닌 카드 수. 같은 상품도 주문 ID로 구분한다.
export function cartRemovalSelection(items: CartEntry[], ids: number[]) {
  const selectedIds = items.filter(item => ids.includes(item.id)).map(item => item.id)
  return {
    selectedIds,
    selectedCount: selectedIds.length,
    allSelected: items.length > 0 && selectedIds.length === items.length,
    partiallySelected: selectedIds.length > 0 && selectedIds.length < items.length,
  }
}

export function removeCartItems(items: CartEntry[], ids: number[]) {
  return items.filter(item => !ids.includes(item.id))
}

// 메뉴와 장바구니에 보이는 옵션 글자가 모두 같으면 같은 메뉴로 본다(보이지 않는 값 차이는 무시).
// exceptId: 장바구니에서 고치고 있는 그 줄은 빼고 찾는다.
export function findSameCartItem(items: CartEntry[], product: MenuItem, order: OrderState, exceptId?: number) {
  const options = cartOptionLabels(product, order).join(' · ')
  return items.find(item => item.id !== exceptId && item.product.id === product.id && cartOptionLabels(item.product, item.order).join(' · ') === options)
}

// 장바구니 ‘선택 바꾸기’를 적용한다. 다른 줄과 똑같아지면 한 줄로 합친다(사용자 2026-10-21 B, 묻는 것은 창이 한다).
// 고친 줄 자리에 남겨 손님이 보던 줄이 그대로 보이게 하고, 수량은 더해서 max까지.
export function applyCartEdit(items: CartEntry[], id: number, order: OrderState, max: number) {
  const edited = items.find(item => item.id === id)
  if (!edited) return items
  const same = findSameCartItem(items, edited.product, order, id)
  return items.flatMap(item => same && item.id === same.id ? [] : item.id === id ? [{
    ...item,
    order: { ...order },
    quantity: same ? Math.min(max, item.quantity + same.quantity) : item.quantity,
    optionHistory: mergeOptionChanges(item.optionHistory ?? {}, item.order, order),
  }] : [item])
}

// 같은 메뉴를 하나 더 담으면 그 줄의 수량에 더한다. 수량 버튼과 같은 최대치(max)까지.
export function addToCartItem(items: CartEntry[], id: number, quantity: number, max: number) {
  return items.map(item => item.id === id ? { ...item, quantity: Math.min(max, item.quantity + quantity) } : item)
}

// 확인창 문구(한 줄에 한 문장). 어르신이 읽기 쉽게 메뉴 이름·옵션 목록 없이 '똑같이 고른'으로 말한다(2026-10-18 사용자).
// 수량은 음료도 장바구니 수량 칸과 같은 ‘개’(사용자 2026-10-21).
// 예: 장바구니에 똑같이 고른 메뉴가 1개 있어요. / 더 담으면 모두 2개가 돼요.
// lead: 새로 담을 때 ‘더 담으면’, 장바구니에서 고쳐 같아졌을 때 ‘합치면’.
export function sameItemMessage(item: CartEntry, adding: number, max: number, lead = '더 담으면') {
  const total = Math.min(max, item.quantity + adding)
  return [
    `장바구니에 똑같이 고른 메뉴가 ${item.quantity}개 있어요.`,
    `${lead} 모두 ${total}개가 돼요.`,
    ...(item.quantity + adding > max ? [`한 메뉴는 ${max}개까지예요.`] : []),
  ]
}

// 마지막 글자에 받침이 있으면 ‘을’, 없으면 ‘를’(voice/guides.ts와 같은 규칙. 그 파일은 다른 모듈을 불러오지 않아 따로 둔다).
export function eul(word: string) {
  const last = word.trim().slice(-1), code = last.charCodeAt(0)
  const final = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : '013678'.includes(last)
  return word + (final ? '을' : '를')
}

// 담은 뒤 뜨는 알림 글(F-1). 제목은 메뉴 이름, 아래 줄은 장바구니 카드와 같은 고른 내용 + 수량.
// 같은 메뉴에 더 담았으면 ‘더 담았어요’와 합친 수(‘모두 N개’).
export function addedNoticeCopy(item: CartEntry, more = false) {
  const labels = item.product.kind === '디저트' ? [] : cartOptionLabels(item.product, item.order)
  return {
    title: `${eul(item.product.name)} ${more ? '더 ' : ''}담았어요`,
    detail: [...labels, `${more ? '모두 ' : ''}${item.quantity}개`].join(' · '),
  }
}
