export type Temperature = 'HOT' | 'COLD' | null
export type SizeCode = 'S' | 'M' | 'L' | null
export type CaffeineType = 'CAFFEINATED' | 'DECAF' | null
export type IceAmount = 'NORMAL' | 'LESS' | 'NONE' | null

export interface OrderState {
  temperature: Temperature
  sizeCode: SizeCode
  sizeMl: number | null
  caffeineType: CaffeineType
  iceAmount: IceAmount
}

export type ScreenId =
  | 'temperature'
  | 'size'
  | 'caffeine'
  | 'ice'
  | 'review'
  | 'cart'
