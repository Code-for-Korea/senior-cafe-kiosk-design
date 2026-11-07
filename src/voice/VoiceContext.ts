import { createContext, useContext } from 'react'
import type { SpeechStatus } from './speech'
export const VoiceContext = createContext({ volume: 5, setVolume: (_value: number) => {}, enabled: false, toggle: () => {}, available: false, focusTarget: null as string | null,
  replay: () => {}, status: 'ready' as SpeechStatus,
  warningVisible: false, dismissWarning: () => {} })
export const useVoiceGuide = () => useContext(VoiceContext)
