import type { UtilityControl } from './UtilityBarVariant'
import Icon from './Icon'
import { useType } from './useType'
import AuxiliaryBar from './AuxiliaryBar'
import './grouped-utility-bar.css'

export default function GroupedUtilityBar({ lowScreen, controls }: { lowScreen: boolean; controls: UtilityControl[] }) {
  const t = useType()
  return <>
    <div className={`grouped-utility ${lowScreen ? 'grouped-utility--low' : 'grouped-utility--two-row'}`}
      role="group" aria-label="화면 보조 기능" data-voice-utility data-grouped-utility={lowScreen ? 'low' : 'normal'}
      style={{ ...t.bodyButton, fontSize: t.largeText ? 36 : 32, lineHeight: lowScreen ? 1.2 : 1.4 }}>
      {controls.map(item => <button key={item.icon} type="button" onClick={item.onClick} disabled={item.disabled}
        aria-label={item.label.replace('\n', ' ')} aria-pressed={item.pressed} data-pending={item.pending || undefined}>
        <Icon name={item.icon} size={t.largeText ? 60 : 40} color="currentColor" optical="utility" />
        <span className="grouped-utility-label">{item.label.replace('\n', ' ')}</span>
        {item.pressed && <svg className="grouped-utility-check" aria-hidden="true" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="14" fill="var(--utility-selected-text)" />
          <path d="m6 14 5 5 11-11" fill="none" stroke="var(--utility-selected)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </button>)}
    </div>
    <AuxiliaryBar />
  </>
}
