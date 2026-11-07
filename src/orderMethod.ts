export type OrderMethod = 'DINE_IN' | 'TAKE_OUT'

export const orderMethodLabels: Record<OrderMethod, string> = {
  DINE_IN: '매장이용',
  TAKE_OUT: '포장',
}
