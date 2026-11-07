import { devParams } from '../devParams'
import { resolveTypography } from '../design-system/typography'
import { useAppControls } from './AppControlsContext'

export function useType() {
  const { largeText } = useAppControls()
  return resolveTypography(largeText, devParams.typography)
}
