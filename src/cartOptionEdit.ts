import { canEditOption, hasCaffeineChoice, hasIceChoice, type MenuItem } from './menuData'
import type { OrderState } from './types'
import type { OptionStepKey } from './selectionSummary'
import { sizeMlMap } from './orderDefaults'
import { sizeAvailable } from './orderPricing'

export type CartOptionSelection =
  | { option: 'temperature'; value: NonNullable<OrderState['temperature']> }
  | { option: 'size'; value: NonNullable<OrderState['sizeCode']> }
  | { option: 'caffeine'; value: NonNullable<OrderState['caffeineType']> }
  | { option: 'ice'; value: NonNullable<OrderState['iceAmount']> }

// 항목 하나의 임시 선택. 원본 주문을 바꾸지 않고, 원래 온도로 돌아오면 얼음양도 복원한다.
export function selectCartOption(draft: OrderState, original: OrderState, selection: CartOptionSelection, item?: MenuItem): OrderState {
  if (item && !canEditOption(item, selection.option)) return draft
  if (selection.option === 'temperature' && item && !item.temp.includes(selection.value === 'HOT' ? 'hot' : 'cold')) return draft
  if (selection.option === 'temperature' && !sizeAvailable(draft.sizeCode, selection.value)) return draft
  if (selection.option === 'size' && !sizeAvailable(selection.value, draft.temperature)) return draft
  switch (selection.option) {
    case 'temperature': return { ...draft, temperature: selection.value, iceAmount: selection.value === original.temperature ? original.iceAmount : selection.value === draft.temperature ? draft.iceAmount : null }
    case 'size': return { ...draft, sizeCode: selection.value, sizeMl: sizeMlMap[selection.value] }
    case 'caffeine': return { ...draft, caffeineType: selection.value }
    case 'ice': return { ...draft, iceAmount: selection.value }
  }
}

export function cartOptionValue(order: OrderState, option: OptionStepKey) {
  return option === 'temperature' ? order.temperature : option === 'size' ? order.sizeCode : option === 'caffeine' ? order.caffeineType : order.iceAmount
}

export function cartOrderChanged(original: OrderState, draft: OrderState) {
  return original.temperature !== draft.temperature || original.sizeCode !== draft.sizeCode || original.sizeMl !== draft.sizeMl || original.caffeineType !== draft.caffeineType || original.iceAmount !== draft.iceAmount
}

export function cartOrderReady(order: OrderState, item?: MenuItem) {
  if (item?.kind === '디저트') return true
  const validTemperature = order.temperature && (!item || item.temp.includes(order.temperature === 'HOT' ? 'hot' : 'cold'))
  const validCaffeine = hasCaffeineChoice(item) ? !!order.caffeineType : order.caffeineType === null
  const validIce = hasIceChoice(item) ? order.temperature === 'HOT' || !!order.iceAmount : order.iceAmount === null
  return !!(validTemperature && order.sizeCode && sizeAvailable(order.sizeCode, order.temperature) && validCaffeine && validIce)
}
