import { selectionMetrics as metrics, motion } from '../design-system/metrics'
import type { ReactNode } from 'react'
import { colors, radius, font, badgeMetrics } from '../tokens'
import { useTheme } from './ThemeContext'
import { useType } from './useType'
import { selectionCardStyle, type SelectionState, type SelectionAppearance } from './selectionCardStyles'

/* 선택 카드의 배치와 조작을 담당한다.
   상태별 면/선/여백 보정: selectionCardStyles.ts
   옵션 이름·설명·아이콘: OptionChoiceCard.tsx
   원래 선택과 현재 선택은 별개이며, disabled는 클릭만 차단하고 선택값은 지우지 않는다.
   일반/고대비 색은 의미 토큰을 공유한다. 누르는 중 표현은 별도 확정 전이다. */
export type SelectionAccent = 'primary' | 'hot' | 'cold' | 'gold'

interface Props extends SelectionState {
  voiceChoice?: boolean
  onClick: () => void
  accent?: SelectionAccent
  children: ReactNode
  height?: number | 'auto'
  equalWidth?: boolean
  balancedContent?: boolean
  appearance?: SelectionAppearance
  reserveOriginalSpace?: boolean
  reserveCheckSpace?: boolean
  /** 고른 표시 자리와 그림 영역 사이 간격(px, 음수 가능). reserveCheckSpace일 때만 쓴다. */
  checkGap?: number
}

// 옵션 카드 공통 간격: 그림 영역 아래에서 이름까지 20px(illustrationGap).
// 그림 파일은 상자 안에 위·아래 빈 여백(8~24px, 그림마다 다름)을 갖고 있어, 그 값(inkInset)으로 실제 그림의 선을 맞춘다.
// - align 'bottom': 그림의 실제 끝선을 영역 아래에 맞춘다. 크기 화면처럼 그림 크기 차이를 보여 줄 때.
// - align 'top': 그림의 실제 윗선을 영역 위에서 topGap 아래에 맞춘다. 같은 크기 그림이 나란한 화면에서 위로 모아 보이게.
// 그림 영역의 높이는 한 화면 안에서 같게 유지해 이름·설명의 기준선도 맞춘다(사용자 2026-11-03).
export function BalancedCardContent({ illustration, illustrationHeight, inkInset = { top: 0, bottom: 0 }, align = 'bottom', topGap = 0, children }: {
  illustration: ReactNode
  /** 그림 영역 높이. align 'top'이면 topGap을 더한 값이 영역 높이다. */
  illustrationHeight: number
  /** 그림 파일 상자 안 위·아래 빈 여백(px) */
  inkInset?: { top: number; bottom: number }
  align?: 'bottom' | 'top'
  topGap?: number
  children: ReactNode
}) {
  const top = align === 'top'
  return (
    <div data-balanced-card-content style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: metrics.illustrationGap }}>
      <div data-card-illustration style={{ width: '100%', height: illustrationHeight + (top ? topGap : 0), flexShrink: 0, display: 'flex', alignItems: top ? 'flex-start' : 'flex-end', justifyContent: 'center' }}>
        <span style={{ display: 'flex', ...(top ? { marginTop: topGap - inkInset.top } : { marginBottom: -inkInset.bottom }) }}>{illustration}</span>
      </div>
      {children}
    </div>
  )
}

/* 고른 상태의 세 가지 색 · 카드와 그 안의 글자·아이콘이 같이 쓴다 */
export function useSelectionAccent(accent: SelectionAccent = 'primary') {
  const theme = useTheme()
  if (accent === 'gold') return { color: 'var(--option-selected-border)', light: 'var(--option-selected)', text: colors.textPrimary }
  if (accent === 'cold') return { color: theme.cold, light: theme.coldLight, text: theme.coldText }
  if (accent === 'hot') return { color: theme.hot, light: theme.hotLight, text: theme.hotText }
  return { color: theme.stateSelectedBorder, light: theme.stateSelected, text: theme.stateSelectedText }
}

export function selectionIconColor(selected: boolean, accentColor: string) {
  return selected ? accentColor : colors.iconNeutral
}

/* 고른 표시의 체크 그림 · 선택 카드와 결제 방법 카드가 같이 쓴다 */
export function CheckMark({ size, color, className }: { size: number; color: string; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 26 26" fill="none">
    <path d="M5 13l6 6L21 7" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function OriginalChoiceChip({ original, selected }: { original: boolean; selected: boolean }) {
  const t = useType()
  const metrics = badgeMetrics[t.largeText ? 'large' : 'normal']
  return <span data-original-choice aria-hidden={!original} style={{
    ...t.caption, fontWeight: font.semibold, lineHeight: 1,
    display: 'inline-flex', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap',
    height: metrics.height, padding: badgeMetrics.padding, borderRadius: radius.pill,
    background: selected ? 'var(--option-original-bg)' : colors.bgDisabled,
    color: selected ? 'var(--option-original-text)' : 'var(--option-selected-secondary)',
    visibility: original ? 'visible' : 'hidden',
  }}>기존 선택</span>
}

export default function SelectionCard({
  selected, voiceChoice = false, original = false, disabled = false, onClick, accent = 'primary', children, height = metrics.defaultHeight, equalWidth = false, balancedContent = false, appearance = 'default', reserveOriginalSpace = true, reserveCheckSpace = false, checkGap = 0,
}: Props) {
  const theme = useTheme()
  const a = useSelectionAccent(accent)
  const t = useType()
  const quiet = appearance === 'dialog'
  return (
    <button
      data-selection-appearance={appearance}
      data-voice-choice={voiceChoice || undefined}
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      disabled={disabled}
      style={{
        flex: 1, height, ...(equalWidth ? { minWidth: 0 } : null),
        ...selectionCardStyle({ selected, original, disabled }, appearance, balancedContent, theme, a),
        // 고른 표시 자리를 둔 카드는 위 여백을 좌우 여백과 같게 해, 체크의 위·오른쪽 거리가 같아 보이게 한다(24 = 22 + 테두리). 아래는 따로 정한다.
        // 여백 토큰은 카드 바깥 가장자리에서 잰 거리라 테두리 두께를 뺀다(selectionCardStyles와 같은 기준).
        // 위 여백은 좌우와 같은 24. 아래 여백: 칩 자리가 없는 카드는 balancedPaddingY(48), 칩 자리가 있는 카드는 28로 두어
        // 칩 자리 묶음(8 + 46 + 28 = 82)이 위 묶음(24 + 체크 48 + 8 = 80)과 같아 보이게 한다. 칩이 비어도 위아래 균형이 맞는다(사용자 2026-11-03).
        ...(reserveCheckSpace ? { paddingTop: metrics.balancedPaddingX - (selected ? metrics.selectedBorder : metrics.border) } : {}),
        ...(reserveCheckSpace && quiet && reserveOriginalSpace ? { paddingBottom: metrics.originalSlotPaddingBottom - (selected ? metrics.selectedBorder : metrics.border) } : {}),
        borderRadius: radius.card,
        // 높이를 정한 균형 카드는 위에서부터 쌓고 남는 높이를 아래 여백으로 둔다.
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: balancedContent ? (typeof height === 'number' ? 'flex-start' : 'center') : 'space-between',
        position: 'relative', textAlign: 'center',
        transition: `border-color ${motion.selection}, background ${motion.selection}`,
      }}
    >
      {original && !quiet && <span style={{ ...t.bodyButton, position: 'absolute', top: metrics.checkInset, left: metrics.checkInset, right: metrics.originalRightInset, textAlign: 'left', color: selected ? a.text : colors.textPrimary }}>기존 선택</span>}
      {(selected || reserveCheckSpace) && (
        <div data-selection-check aria-hidden="true" style={{
          // reserveCheckSpace: 고른 표시 자리를 늘 두어, 고르는 순간 내용이 움직이지 않고 그림 위 빈 공간이 아래 칩 자리와 짝을 이룬다.
          ...(reserveCheckSpace ? { alignSelf: 'flex-end', marginBottom: checkGap, flexShrink: 0, visibility: selected ? 'visible' as const : 'hidden' as const } : { position: 'absolute' as const, top: metrics.checkInset, right: metrics.checkInset }),
          width: metrics.checkSize, height: metrics.checkSize, borderRadius: radius.badge,
          background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckMark size={26} color={accent === 'gold' ? 'var(--option-check)' : theme.actionPrimaryText} />
        </div>
      )}
      {children}
      {quiet && reserveOriginalSpace && <span style={{ marginTop: metrics.originalChipGap }}><OriginalChoiceChip original={original} selected={selected} /></span>}
    </button>
  )
}
