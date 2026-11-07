import { useEffect, useRef, type ReactNode } from 'react'
import { colors, space } from '../tokens'
import { useTheme } from './ThemeContext'
import { useType } from './useType'

/* 실제 checkbox를 사용해 키보드·스크린리더에도 부분 선택 상태를 전달한다.
   children을 주면 보이는 내용으로 그걸 쓰고, label은 화면낭독기용 이름(aria-label)으로만 쓴다. */
export default function CartCheckbox({ label, checked, mixed = false, disabled = false, overlay = false, onChange, children }: {
  label: string; checked: boolean; mixed?: boolean; disabled?: boolean; overlay?: boolean; onChange: (checked: boolean) => void; children?: ReactNode
}) {
  const theme = useTheme()
  const t = useType()
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (input.current) input.current.indeterminate = mixed }, [mixed])
  return <label style={overlay ? { position: 'absolute', inset: 0, cursor: 'pointer' } : {
    position: 'relative', display: children ? 'flex' : 'inline-flex', alignItems: 'center', gap: space.sm, width: children ? '100%' : undefined,
    minHeight: 64, padding: '8px', cursor: disabled ? 'default' : 'pointer',
  }}>
    <input ref={input} className="cart-selection-input" type="checkbox" aria-label={label}
      checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'inherit' }} />
    <span className="cart-selection-mark" aria-hidden="true" style={{
      ...(overlay ? { position: 'absolute', top: 16, left: 16, boxShadow: `0 0 0 4px ${theme.surface}` } : {}),
      width: 32, height: 32, boxSizing: 'border-box', borderRadius: 4, flexShrink: 0, pointerEvents: 'none',
      background: checked || mixed ? theme.actionPrimary : theme.surface,
      border: `2px solid ${checked || mixed ? theme.actionPrimary : colors.textSecondary}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {(checked || mixed) && <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={mixed ? 'M5 12H19' : 'M5 12L10 17L19 7'} stroke={theme.actionPrimaryText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>}
    </span>
    {!overlay && (children ?? <span style={{ ...t.bodyButton, color: colors.textPrimary, pointerEvents: 'none' }}>{label}</span>)}
  </label>
}
