import { buttonMetrics } from '../design-system/metrics'
import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useType } from './useType'
import { useTheme } from './ThemeContext'
import { buttonPurposeStyle, buttonStyle, buttonTextColor } from './buttonStyles'
import type { ButtonPurpose, ButtonSize, ButtonVariant } from './buttonStyles'

/* 공용 버튼 · 큰 버튼은 Primary 글자(38/600), 작은 버튼은 Body 600 글자.
   disabled 를 주면 모양이 Disabled 로 바뀌고 눌리지 않는다. */
interface Props {
  variant: ButtonVariant
  size?: ButtonSize
  purpose: ButtonPurpose // 같은 행동 묶음은 같은 역할을 지정한다.
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaHasPopup?: 'dialog'
  ariaExpanded?: boolean
  voiceAction?: string
  subtitle?: string
  style?: CSSProperties
  trailing?: ReactNode // 오른쪽 끝에 붙는 보조 글자 (예: 장바구니 막대의 "2개 · 10,000원")
  children: ReactNode
}

export default function Button({ variant, size = 'large', purpose, onClick, disabled = false, ariaLabel, ariaDescribedBy, ariaHasPopup, ariaExpanded, voiceAction, subtitle, style, trailing, children }: Props) {
  const t = useType()
  const theme = useTheme()
  const contentId = useId()
  const shown: ButtonVariant = disabled ? 'Disabled' : variant
  const color = buttonTextColor(shown, theme)
  return (
    <button
      className="kiosk-action-button"
      data-button-variant={shown}
      data-voice-action={voiceAction}
      data-button-purpose={purpose}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-haspopup={ariaHasPopup}
      aria-expanded={ariaExpanded}
      aria-labelledby={subtitle && !ariaLabel ? `${contentId}-title` : undefined}
      aria-describedby={[ariaDescribedBy, subtitle ? `${contentId}-subtitle` : undefined].filter(Boolean).join(' ') || undefined}
      style={{ ...buttonStyle(shown, size, theme), ...(subtitle ? { height: 'auto', minHeight: 192, padding: '24px', whiteSpace: 'normal' } : null), ...(trailing ? { justifyContent: 'space-between' } : null), ...style,
        // 명시한 역할은 화면별 style과 비활성 색상 처리 뒤에도 유지한다.
        ...buttonPurposeStyle(purpose),
      }}
    >
      {subtitle ? <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0, width: '100%', color }}>
        <span id={`${contentId}-title`} style={{ ...(size === 'large' ? t.primary : t.bodyButton), whiteSpace: 'nowrap' }}>{children}</span>
        <span id={`${contentId}-subtitle`} style={{ ...t.body, whiteSpace: 'normal', wordBreak: 'keep-all', textAlign: 'center' }}>{subtitle}</span>
      </span> : (
      <span style={{ ...(size === 'large' ? t.primary : t.bodyButton), color, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: buttonMetrics.contentGap }}>
        {children}
      </span>
      )}
      {trailing && <span style={{ ...t.price, color, whiteSpace: 'nowrap' }}>{trailing}</span>}
    </button>
  )
}
