import type { OrderState } from './types'

// 공식 자료는 음료별 내용량(g)이다. 임의의 mL 수치를 표시하지 않는다.
export const sizeMlMap: Record<string, number | null> = { S: null, M: null, L: null }

/* 기본값으로 주문할 때 쓰는 값. 온도는 목록에서 이어받거나 직접 고른다.
   차갑게를 고르면 얼음은 '보통'이 기본값이다. 온도 화면의 '기본값으로 담아요' 상자도 이 값을 보여 준다 */
export const defaultOrder: OrderState = {
  temperature: null,
  sizeCode: 'S',
  sizeMl: sizeMlMap.S,
  caffeineType: 'CAFFEINATED',
  iceAmount: null,
}
export const DEFAULT_ICE = 'NORMAL'
