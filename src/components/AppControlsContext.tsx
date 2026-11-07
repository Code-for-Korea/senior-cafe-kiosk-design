import { createContext, useContext, type ReactNode } from 'react'
import type { OrderMethod } from '../orderMethod'
import type { Language } from './LanguageBar'
import VoiceGuideProvider from '../voice/VoiceGuideProvider'

interface AppControls {
  orderMethod?: OrderMethod
  language?: Language
  onLanguageChange?: (language: Language) => void
  lowScreen?: boolean
  toggleLowScreen?: () => void
  lowOptions?: boolean
  onExitLowScreen?: () => void
  onLowProduct?: () => void
  onHome: () => void
  // 대기 화면에서는 이미 처음이라 ‘처음으로’를 흐리게 막는다.
  homeDisabled?: boolean
  onStaff: () => void
  staffPending: boolean
  // 부른 지 오래됨: 아래 알림 줄이 ‘아직 직원이 오지 않았어요’로 바뀐다.
  staffLate?: boolean
  // 결제를 기계가 처리하는 동안: 기능바는 ‘직원 부르기’만 누를 수 있다(기획 D-20).
  utilityLocked?: boolean
  highContrast: boolean
  toggleHighContrast: () => void
  largeText: boolean
  toggleLargeText: () => void
  // 새 주문마다 바뀌는 번호. 바뀌면 음성 안내를 끄고 음량을 기본으로 되돌린다.
  orderSession?: number
}

const AppControlsContext = createContext<AppControls>({
  onHome: () => undefined,
  onStaff: () => undefined,
  staffPending: false,
  highContrast: false,
  toggleHighContrast: () => undefined,
  largeText: false,
  toggleLargeText: () => undefined,
})

export function AppControlsProvider({ value, children }: { value: AppControls; children: ReactNode }) {
  return <AppControlsContext.Provider value={value}><VoiceGuideProvider staffLate={value.staffLate} orderSession={value.orderSession}>{children}</VoiceGuideProvider></AppControlsContext.Provider>
}
export const useAppControls = () => useContext(AppControlsContext)
