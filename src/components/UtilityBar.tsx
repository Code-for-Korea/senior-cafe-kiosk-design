import { colors, space, radius } from '../tokens'
import { useAppControls } from './AppControlsContext'
import { useType } from './useType'
import { useTheme } from './ThemeContext'
import Icon from './Icon'
import type { IconName } from './Icon'
import { devParams } from '../devParams'
import UtilityBarVariant from './UtilityBarVariant'
import { useVoiceGuide } from '../voice/VoiceContext'
import VoiceWarning from '../voice/VoiceWarning'

/* 이름의 \n은 큰 글씨 모드에서만 줄바꿈이 된다. 기본 화면에서는 한 줄로 이어 쓴다. */
const items: { label: string; icon: IconName }[] = [
  { label: '큰 글씨',     icon: 'textSize' },
  { label: '고대비',     icon: 'contrast' },
  { label: '낮은 화면',   icon: 'lowScreen' },
  { label: '음성 안내',   icon: 'speaker' },
  { label: '직원\n부르기', icon: 'bell' },
  { label: '처음으로',    icon: 'home' },
]

const LABEL_LINE_HEIGHT = 1.25

/* 카드 형태는 유지한다. 동작하는 설정은 이름 아래 현재 상태를 표시한다.
   실행 버튼과 아직 미구현인 기능에는 켜짐/꺼짐 상태를 붙이지 않는다. */
export default function UtilityBar({ showDivider = true, lowScreen: lowOverride, onToggleLowScreen: toggleOverride }: { showDivider?: boolean; lowScreen?: boolean; onToggleLowScreen?: () => void }) {
  const { onHome, homeDisabled = false, onStaff, staffPending, staffLate = false, utilityLocked = false, highContrast, toggleHighContrast, toggleLargeText, lowScreen: sharedLow, toggleLowScreen } = useAppControls()
  const lowScreen = lowOverride ?? sharedLow ?? false
  const onToggleLowScreen = toggleOverride ?? toggleLowScreen
  const voice = useVoiceGuide()
  const t = useType()
  const theme = useTheme()
  // 이름+상태 또는 두 줄 이름이 들어갈 같은 높이를 확보한다.
  const labelLines = 2

  const controls = items.map((item) => ({
    ...item,
    label: item.icon === 'bell' && staffPending ? '직원 호출 중' : t.largeText ? item.label : item.label.replace('\n', ' '),
    pending: item.icon === 'bell' && staffPending,
    disabled: (item.icon === 'home' && homeDisabled) || (utilityLocked && item.icon !== 'bell'),
    pressed: item.icon === 'speaker' ? voice.enabled : item.icon === 'contrast' ? highContrast : item.icon === 'textSize' ? t.largeText : item.icon === 'lowScreen' && onToggleLowScreen ? lowScreen : undefined,
    onClick: item.icon === 'speaker' ? voice.toggle : item.icon === 'contrast' ? toggleHighContrast
      : item.icon === 'textSize' ? toggleLargeText
      : item.icon === 'lowScreen' ? onToggleLowScreen
      : item.icon === 'home' ? onHome
      : item.icon === 'bell' ? onStaff
      : undefined,
  }))

  // 부른 지 오래되면(staffLate) ‘아직 직원이 오지 않았어요’로 바뀐다(기획 G01-LATE, 사용자 2026-10-20).
  const waitingNotice = staffPending ? <div role="status" aria-live="polite" style={{ flexShrink: 0 }}>
    <button type="button" onClick={onStaff} aria-label={staffLate ? '아직 직원이 오지 않았어요. 다시 부르기 안내 보기' : '직원 도움을 기다리고 있어요. 대기 안내 다시 보기'} data-staff-waiting data-staff-late={staffLate || undefined}
      style={{ ...t.readable(t.body), width: '100%', minHeight: 80, padding: `16px ${space.page}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, border: 0, background: 'var(--bg-muted)', color: colors.textPrimary, cursor: 'pointer' }}>
      <span>{staffLate ? '아직 직원이 오지 않았어요' : '직원 도움을 기다리고 있어요'}</span><span aria-hidden="true">›</span>
    </button>
  </div> : null

  if (lowScreen) return <>
    {waitingNotice}
    <div className="low-menu-utility"><UtilityBarVariant grouped variant="vertical" controls={controls.map(item => ({ ...item, label: item.label.replace('\n', ' ') }))} showDivider={false} /></div>
  </>

  if (devParams.utilityVariant) return (
    <>
      {waitingNotice}
      <UtilityBarVariant grouped variant={devParams.utilityVariant} controls={controls} showDivider={showDivider} />
    </>
  )

  return (
    <>
    {waitingNotice}
    <VoiceWarning />
    <div data-voice-utility style={{
      flexShrink: 0,
      background: colors.bgPage,
      borderTop: showDivider ? `2px solid ${colors.borderDefault}` : 0,
      display: 'grid', gridTemplateColumns: `repeat(${controls.length}, 1fr)`,
      padding: `${space.lg}px`, gap: 8,
    }}>
      {controls.map((item) => {
        const color = item.pending ? 'var(--utility-pending-text)' : item.pressed ? theme.stateSelectedText : colors.textPrimary
        return (
          <button key={item.icon} onClick={item.onClick} aria-label={item.label.replace('\n', ' ')} aria-pressed={item.pressed} style={{
            minWidth: 0,
            // 테두리가 2px에서 3px로 굵어져도 버튼 크기가 변하지 않게 안쪽 여백으로 맞춘다
            padding: item.pressed ? '23px 3px' : '24px 4px',
            background: item.pending ? 'var(--utility-pending)' : item.pressed ? theme.stateSelected : theme.surface,
            border: item.pressed ? `3px solid ${theme.stateSelectedBorder}` : `2px solid ${theme.borderNeutral}`,
            borderRadius: radius.utility,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, cursor: 'pointer',
          }}>
            <Icon name={item.icon} size={44} color={color} optical={devParams.compactCards ? 'utility' : undefined} />
            {/* 첫 줄 기준선을 맞춰 한 줄 이름도 아이콘과 8px 간격을 유지한다 */}
            <span style={{
              ...t.bodyButton, lineHeight: LABEL_LINE_HEIGHT,
              height: t.bodyButton.fontSize * LABEL_LINE_HEIGHT * labelLines,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              color, textAlign: 'center', whiteSpace: t.largeText ? 'pre-line' : 'nowrap',
            }}>
              <span>{item.label}</span>
              {item.pressed !== undefined && (
                <span aria-hidden="true" style={{ fontWeight: t.body.fontWeight }}>
                  {item.pressed ? '켜짐' : '꺼짐'}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
    </>
  )
}
