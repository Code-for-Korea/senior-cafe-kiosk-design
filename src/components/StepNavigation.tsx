import { buttonMetrics } from '../design-system/metrics'
import { space } from '../tokens'
import Button from './Button'
import type { ButtonPurpose } from './buttonStyles'

interface Action {
  label: string
  onClick?: () => void
}

interface Props {
  purpose: ButtonPurpose
  previous?: Action
  next: Action & { enabled: boolean }
  secondaryAction?: Action
  layout?: 'normal' | 'low'
  marginTop?: number
  voiceTarget?: boolean
}

// 버튼 묶음의 배치만 담당한다. 선택 데이터, 이동할 화면, 확정/취소 동작은 호출부가 소유한다.
// 기본/낮은 화면의 기존 이전 버튼 너비(280/320px)는 의도적인 배치 차이다.
export default function StepNavigation({ purpose, previous, next, secondaryAction,
  layout = 'normal', marginTop = 0, voiceTarget = false }: Props) {
  return <div data-step-navigation={layout} data-voice-next={voiceTarget || undefined}
    style={{ display: 'flex', gap: space.md, height: buttonMetrics.large.height,
      flexShrink: 0, width: '100%', marginTop }}>
    {secondaryAction && <Button purpose={purpose} variant="Tertiary" onClick={secondaryAction.onClick} style={{ flex: 1 }}>
      {secondaryAction.label}
    </Button>}
    {previous && <Button purpose={purpose} variant="Tertiary" onClick={previous.onClick}
      style={{ width: layout === 'low' ? 320 : 280 }}>
      {previous.label}
    </Button>}
    <Button purpose={purpose} variant="Primary" disabled={!next.enabled} onClick={next.onClick} style={{ flex: 1 }}>
      {next.label}
    </Button>
  </div>
}
