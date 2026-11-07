import { basePrice, unitPrice, won } from '../orderPricing'
import { cartTotals } from '../cartSelection'
import type { MenuItem } from '../menuData'
import type { OrderState } from '../types'
import type { CartEntry } from '../screens/CartScreen'

// 가격 표시·계산용 얇은 래퍼. 이용방법은 더 이상 가격에 영향을 주지 않고, 개인컵 할인은 장바구니 줄 단위로 반영된다.
export function useOrderPricing() {
  return {
    priceText: (product: MenuItem) => won(basePrice(product)),
    basePrice: (product: MenuItem) => basePrice(product),
    unitPrice: (product: MenuItem, order: OrderState) => unitPrice(product, order),
    cartTotals: (items: CartEntry[]) => cartTotals(items),
  }
}
