import { createContext, useContext } from 'react'
import type { OrderState } from '../types'

interface OptionEditPresentation {
  before: OrderState | null
  hasChanges: boolean
  nextLabel: string
}
const OptionEditContext = createContext<OptionEditPresentation>({ before: null, hasChanges: false, nextLabel: '변경 적용' })
export const OptionEditProvider = OptionEditContext.Provider
export const useOptionEdit = () => useContext(OptionEditContext)
