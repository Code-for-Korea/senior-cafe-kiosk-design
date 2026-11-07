import { hasCaffeineChoice, hasIceChoice, type MenuItem } from './menuData'
import type { OrderState, Temperature } from './types'
import { defaultOrder, DEFAULT_ICE } from './orderDefaults'

// 검색·전체 목록은 온도 의사가 없으며, 한 온도로만 제공되는 음료는 그 값을 사용한다.
export function entryTemperature(item: MenuItem, requested: Temperature = null): Temperature {
  if (item.kind === '디저트') return null
  if (requested && item.temp.includes(requested === 'HOT' ? 'hot' : 'cold')) return requested
  if (item.temp.length === 1) return item.temp[0] === 'hot' ? 'HOT' : 'COLD'
  return null
}

export function beginOrder(mode: 'default' | 'custom', temperature: Temperature, item?: MenuItem) {
  if (item) temperature = entryTemperature(item, temperature)
  const order: OrderState = mode === 'default'
    ? { ...defaultOrder, temperature, iceAmount: temperature === 'COLD' ? DEFAULT_ICE : null }
    : { temperature, sizeCode: null, sizeMl: null, caffeineType: null, iceAmount: null }
  if (!hasCaffeineChoice(item)) order.caffeineType = null
  if (!hasIceChoice(item)) order.iceAmount = null
  const screen = !temperature ? 'temperature' : mode === 'default' ? 'review' : 'size'
  return { order, screen } as const
}
