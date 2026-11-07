import Icon from './Icon'
import GroupedUtilityBar from './GroupedUtilityBar'
import { useVoiceGuide } from '../voice/VoiceContext'
import type { IconName } from './Icon'
import { useType } from './useType'
import VoiceWarning from '../voice/VoiceWarning'
import './utility-bar-variants.css'

export type UtilityVariant = 'vertical' | 'horizontal' | 'compact'
export interface UtilityControl {
  label: string
  icon: IconName
  pressed?: boolean
  pending?: boolean
  disabled?: boolean
  onClick?: () => void
}

export default function UtilityBarVariant({ variant, controls, showDivider = true, grouped = false }: { variant: UtilityVariant; controls: UtilityControl[]; showDivider?: boolean; grouped?: boolean }) {
  const t = useType()
  const voice = useVoiceGuide()
  if (grouped) return <><VoiceWarning /><GroupedUtilityBar lowScreen={variant === 'vertical'} controls={controls.map(control => control.icon === 'speaker' && voice.available ? { ...control, pressed: voice.enabled, onClick: voice.toggle } : control)} /></>
  return <><VoiceWarning />
    <div className={`utility-study utility-study--${variant}`} style={showDivider ? undefined : { borderTop: 0 }} role="group" aria-label="화면 보조 기능" data-utility-variant={variant}>
      {controls.map(control => {
        const item = control.icon === 'speaker' && voice.available ? { ...control, pressed: voice.enabled, onClick: voice.toggle } : control
        const selected = item.pressed === true
        const label = variant !== 'vertical' ? item.label.replace('\n', ' ') : item.label
        const check = item.pressed !== undefined ? (
          <svg className="utility-study-check" aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ visibility: selected ? 'visible' : 'hidden' }}>
            <path d="m4 12 5 5L20 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null
        return (
          <button key={item.icon} type="button" className="utility-study-button" onClick={item.onClick} disabled={item.disabled}
            aria-label={item.label.replace('\n', ' ')} aria-pressed={item.pressed} data-pending={item.pending || undefined}>
            {variant === 'horizontal' && selected && check}
            <Icon name={item.icon} size={variant === 'compact' ? 40 : 44} color="currentColor" optical="utility" />
            <span className="utility-study-label" style={{ ...t.bodyButton, lineHeight: t.figmaTypography ? 1.2 : 1.25 }}>
              {variant === 'vertical' && check}
              <span>{label}</span>
            </span>
            {variant === 'compact' && selected && <span className="utility-study-state-line" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  </>
}
