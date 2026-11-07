import { priceNumber } from './menuData'
import type { MenuItem } from './menuData'
import type { OrderState, SizeCode, Temperature } from './types'
import type { CartEntry } from './screens/CartScreen'

// 개인컵으로 받는 음료 한 잔당 할인액.
export const PERSONAL_CUP_DISCOUNT = 500

// 기존 시연 상태 코드 S/M/L은 작은 컵부터의 순서를 뜻한다. 화면은 기본/대/특대로 표시한다.
export const sizeOptions = [
  { key: 'S', label: '기본', extra: 0 },
  { key: 'M', label: '대', extra: 600 },
  { key: 'L', label: '특대', extra: 1400 },
] as const

// 온도에 관계없이 세 크기를 제공한다. null은 크기를 고르기 전의 상태다.
export function sizeAvailable(size: SizeCode, _temperature: Temperature) {
  return size === null || sizeOptions.some(option => option.key === size)
}

// 메뉴 기본 가격(할인 없음). 이용방법은 더 이상 가격에 영향을 주지 않는다.
export function basePrice(product: MenuItem) {
  return priceNumber(product.price)
}

export function unitPrice(product: MenuItem, order: OrderState) {
  const extra = product.kind === '디저트' ? 0 : sizeOptions.find(size => size.key === order.sizeCode)?.extra ?? 0
  return basePrice(product) + extra
}

// 개인컵으로 받는 음료만 한 잔당 할인한다. 디저트는 제외.
export function cupDiscount(entry: { product: MenuItem; personalCup?: boolean }) {
  return entry.personalCup && entry.product.kind !== '디저트' ? PERSONAL_CUP_DISCOUNT : 0
}

// 할인까지 반영한 한 개 가격(크기 추가금 포함, 개인컵 할인 차감).
export function entryUnitPrice(entry: CartEntry) {
  return Math.max(0, unitPrice(entry.product, entry.order) - cupDiscount(entry))
}

export const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`
