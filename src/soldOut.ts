import { createContext, useContext } from 'react'

// 품절 메뉴 번호. 시안에서는 개발 주소(?soldout=2)와 화면 밖 '시연: 카페라떼 품절'로 정한다.
// 실제 매장에서는 주문 시스템이 알려 준다. 품절 메뉴는 메뉴·검색에서 누를 수 없고(MN-05),
// 장바구니에 이미 담겼으면 맨 위 '주문할 수 없는 메뉴' 칸에 모아 빼기 전까지 결제를 막는다(S40-SOLDOUT, 사용자 P2).
export const SoldOutContext = createContext<ReadonlySet<string>>(new Set())
export function useSoldOut() {
  const ids = useContext(SoldOutContext)
  return (productId: string) => ids.has(productId)
}
