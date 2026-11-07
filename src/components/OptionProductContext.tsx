import type { MenuItem } from '../menuData'
import { createContext, useContext } from 'react'

interface OptionProductActions {
  item: MenuItem
  basePrice: string
  unitPrice: number
  quantity: number
  canAdd: boolean
  onChangeQuantity: (quantity: number) => void
  onAdd: () => void
  onViewProduct: () => void
  onReturnToMenu: () => void
}

const OptionProductContext = createContext<OptionProductActions | null>(null)
export const OptionProductProvider = OptionProductContext.Provider
export const useOptionProduct = () => useContext(OptionProductContext)
