import { buttonMetrics } from '../design-system/metrics'

// 낮은 메뉴·장바구니의 결정 버튼은 같은 높이와 하단 기준선을 사용한다.
export const lowScreenActionLayout = {
  buttonHeight: buttonMetrics.order.lowHeight,
  paddingY: 36,
  paddingX: 64,
} as const
