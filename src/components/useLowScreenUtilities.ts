import { useAppControls } from './AppControlsContext'
import { useType } from './useType'
import type { UtilityControl } from './UtilityBarVariant'

// Preserve screen-specific exit and unavailable-voice behavior. Voice playback
// itself is supplied by UtilityBarVariant for every layout.
export function useLowScreenUtilities(overrides: {
  largeText?: boolean
  highContrast?: boolean
  onExitLowScreen?: () => void
  onVoiceUnavailable?: () => void
} = {}): UtilityControl[] {
  const controls = useAppControls()
  const t = useType()
  return [
    { icon: 'textSize', label: '큰 글씨', pressed: overrides.largeText ?? t.largeText, onClick: controls.toggleLargeText },
    { icon: 'contrast', label: '고대비', pressed: overrides.highContrast ?? controls.highContrast, onClick: controls.toggleHighContrast },
    { icon: 'lowScreen', label: '낮은 화면', pressed: true, onClick: overrides.onExitLowScreen ?? controls.onExitLowScreen },
    { icon: 'speaker', label: '음성 안내', onClick: overrides.onVoiceUnavailable ?? (() => {}) },
    { icon: 'bell', label: controls.staffPending ? '직원 호출 중' : '직원 부르기', pending: controls.staffPending, onClick: controls.onStaff },
    { icon: 'home', label: '처음으로', onClick: controls.onHome },
  ]
}
