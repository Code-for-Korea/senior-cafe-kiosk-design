export type VoiceWarningState = 'hidden' | 'visible' | 'dismissed'
export type VoiceWarningEvent = 'failed' | 'speaking' | 'dismiss' | 'retry'

// Dismissing an outage stays effective across automatic narration on new screens.
// Only an explicit retry/toggle re-arms the warning.
export function voiceWarningState(state: VoiceWarningState, event: VoiceWarningEvent): VoiceWarningState {
  if (event === 'retry') return 'hidden'
  if (event === 'dismiss') return 'dismissed'
  if (state === 'dismissed') return state
  return event === 'failed' ? 'visible' : 'hidden'
}
