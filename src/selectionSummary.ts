/* 추가 선택의 단계 목록 · 온도·크기·카페인·얼음 화면과 확인 화면이 같은 목록(OptionStepper)을 쓴다.
   고른 것은 값으로 설명한다. 말은 각 화면의 카드와 같게 */
import { nb, hasCaffeineChoice, hasIceChoice, canEditOption, type MenuItem } from './menuData'
import { DEFAULT_ICE, defaultOrder } from './orderDefaults'
import { sizeOptions } from './orderPricing'
import type { CaffeineType, IceAmount, SizeCode, Temperature } from './types'

export const sizeText: Record<'S' | 'M' | 'L', string> = Object.fromEntries(sizeOptions.map(size => [size.key, nb(`${size.label}${size.extra ? ` · +${size.extra.toLocaleString('ko-KR')}원` : ''}`)])) as Record<'S' | 'M' | 'L', string>
const caffeineText: Record<'CAFFEINATED' | 'DECAF', string> = { CAFFEINATED: '카페인 있음', DECAF: '디카페인' }
const iceText: Record<'NORMAL' | 'LESS' | 'NONE', string> = { NORMAL: '얼음 보통', LESS: '얼음 적게', NONE: '얼음 없이' }
const temperatureText: Record<'HOT' | 'COLD', string> = { HOT: '따뜻하게', COLD: '차갑게' }

export type OptionStepKey = 'temperature' | 'size' | 'caffeine' | 'ice'
export type OptionChangeHistory = Partial<Record<OptionStepKey, string>>
export type ReviewOptionChange = { kind: 'changed'; previous: string } | { kind: 'added' }

// 최종 확인 최초 진입값과 비교한다. 반복 수정·원복에도 기준값은 바뀌지 않는다.
export function reviewOptionChanges(original: OptionValues, current: OptionValues): Partial<Record<OptionStepKey, ReviewOptionChange>> {
  const changes: Partial<Record<OptionStepKey, ReviewOptionChange>> = {}
  for (const key of ['temperature', 'size', 'caffeine', 'ice'] as const) {
    const previous = optionValue(original, key)
    const value = optionValue(current, key)
    if (!value || value === previous) continue
    changes[key] = key === 'ice' && original.temperature === 'HOT'
      ? { kind: 'added' }
      : { kind: 'changed', previous: previous ?? '선택 전' }
  }
  return changes
}

function optionValue(values: OptionValues, key: OptionStepKey): string | null {
  if (key === 'temperature') return values.temperature ? temperatureText[values.temperature] : null
  if (key === 'size') return values.sizeCode ? sizeText[values.sizeCode] : null
  if (key === 'caffeine') return values.caffeineType ? caffeineText[values.caffeineType] : null
  return values.temperature === 'HOT' ? null : values.iceAmount ? iceText[values.iceAmount] : null
}

// 항목마다 마지막으로 적용하기 직전의 값을 보관한다. 유지·취소는 이 기록을 바꾸지 않는다.
export function mergeOptionChanges(history: OptionChangeHistory, before: OptionValues, after: OptionValues): OptionChangeHistory {
  const result = { ...history }
  for (const key of ['temperature', 'size', 'caffeine', 'ice'] as const) {
    const previous = optionValue(before, key)
    const next = optionValue(after, key)
    if (!next) delete result[key]
    else if (previous !== next) result[key] = previous ?? (key === 'ice' && before.temperature === 'HOT' ? '해당 없음' : '선택 전')
  }
  return result
}

/* done 고름 · current 지금 고르는 중 · upcoming 아직 · default 기본값으로 담김(기본값 주문) */
export type OptionStepState = 'done' | 'current' | 'upcoming' | 'default'

export interface OptionStepRow {
  key: OptionStepKey
  change?: ReviewOptionChange // 최초 확인값과의 차이 · 장바구니로 전달하지 않음
  number: number
  title: string        // 온도
  state: OptionStepState
  value?: string       // 고른 값 · 차갑게 (done · default)
  note?: string        // (차갑게 선택 시)
  onEdit?: () => void  // done 이면 바꾸기
}

const STEP_TITLE: Record<OptionStepKey, string> = { temperature: '온도', size: '크기', caffeine: '카페인', ice: '얼음양' }

interface OptionValues {
  temperature: Temperature
  sizeCode: SizeCode
  caffeineType: CaffeineType
  iceAmount: IceAmount
}

interface StepsOptions {
  product?: MenuItem
  current: OptionStepKey | 'review'  // 지금 화면 · 확인 화면이면 모두 고른 상태
  isDefaultOrder?: boolean           // 기본값으로 주문 · 온도 말고는 기본값으로 담긴다
  onEdit: Partial<Record<OptionStepKey, () => void>>
}

export function optionSteps(values: OptionValues, { current, isDefaultOrder = false, onEdit, product }: StepsOptions): OptionStepRow[] {
  // 얼음 단계는 차갑게일 때만 · 온도를 아직 안 골랐으면 '(차갑게 선택 시)'라고 달아 둔다
  if (product?.kind === '디저트') return []
  const keys: OptionStepKey[] = ['temperature', 'size']
  if (hasCaffeineChoice(product)) keys.push('caffeine')
  if (values.temperature !== 'HOT' && hasIceChoice(product)) keys.push('ice')

  const valueOf = (key: OptionStepKey): string | null => {
    if (key === 'temperature') return values.temperature ? temperatureText[values.temperature] : null
    if (key === 'size') return values.sizeCode ? sizeText[values.sizeCode] : null
    if (key === 'caffeine') return values.caffeineType ? caffeineText[values.caffeineType] : null
    return values.iceAmount ? iceText[values.iceAmount] : null
  }
  const defaultOf = (key: OptionStepKey): string => {
    if (key === 'size') return sizeText[defaultOrder.sizeCode!]
    if (key === 'caffeine') return caffeineText[defaultOrder.caffeineType!]
    return iceText[DEFAULT_ICE]
  }

  return keys.map((key, index) => {
    const base = { key, number: index + 1, title: STEP_TITLE[key] }
    const note = key === 'ice' && !values.temperature ? '(차갑게 선택 시)' : undefined

    if (key === current) return { ...base, state: 'current', note }
    // 기본값 주문 · 온도 화면에서는 나머지가 '기본값으로 담김', 확인 화면에서는 고른 것과 같게 보여 준다
    if (isDefaultOrder && current !== 'review' && key !== 'temperature' && (!valueOf(key) || valueOf(key) === defaultOf(key))) return { ...base, state: 'default', value: valueOf(key) ?? defaultOf(key), note }
    const value = valueOf(key)
    if (value) return { ...base, state: 'done', value, onEdit: !product || canEditOption(product, key) ? onEdit[key] : undefined }
    return { ...base, state: 'upcoming', note }
  })
}

/** 장바구니 줄에 보이는 옵션 글자 · 예: 차갑게 / 크기-기본 / 얼음 보통. 디저트는 없음. */
export function cartOptionLabels(product: MenuItem, values: OptionValues): string[] {
  return optionSteps(values, { product, current: 'review', onEdit: {} }).map(option =>
    option.key === 'size' ? `크기-${sizeOptions.find(size => size.key === values.sizeCode)?.label ?? '선택 전'}` : option.value ?? '')
}
