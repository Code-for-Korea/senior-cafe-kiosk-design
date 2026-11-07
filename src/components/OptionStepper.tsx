import { optionStepMetrics } from '../design-system/metrics'
import type { ReactNode } from 'react'
import { colors, font, space } from '../tokens'
import { useType } from './useType'
import { useTheme } from './ThemeContext'
import type { OptionStepRow } from '../selectionSummary'
import Icon, { TrailingChevron } from './Icon'
import type { IconName } from './Icon'
import { devParams } from '../devParams'

/* OptionStepper · 추가 선택의 단계를 세로 선으로 잇는 목록. 지금 고르는 단계의 칸 안에 그 화면의 내용(질문·카드·버튼)이 들어간다
   (Hers 의 단계 목록 꼴 · 2026-10-01 사용자 레퍼런스 — 목록과 내용이 따로 놀지 않게).
   내용을 흰 카드로 한 번 더 감싸지 않는다 — 선택 카드가 이미 흰색이라 겹친다는 사용자 판단. 대신 동그라미와 내용 사이를 넓게 둔다.
   왼쪽 동그라미가 상태를 말한다:
     done     회색 선 + 회색 숫자 · 실제 선택값과 오른쪽 바꾸기로 완료를 표현
     current  파란 선 + 파란 숫자 · 그 칸에 내용 (currentContent) · 확인 화면처럼 내용이 없으면 제목만
     upcoming 회색 선 + 회색 숫자 · 제목만 회색으로
     default  upcoming 과 같은 동그라미 · 기본값으로 담길 값 + '기본값'
   동그라미 사이는 회색 선으로 잇는다 */
const CIRCLE = optionStepMetrics.circle
const ROW_GAP = optionStepMetrics.rowGap            // 제목만 있는 칸 사이
const CURRENT_GAP = optionStepMetrics.currentGap        // 내용이 든 칸의 위아래
const COLUMN_GAP = optionStepMetrics.columnGap         // 동그라미와 내용 사이 · 여유 있게 (사용자 요청)

function StepCircle({ row }: { row: OptionStepRow }) {
  const t = useType()
  const theme = useTheme()
  const ring = row.state === 'current' ? `3px solid ${theme.stateSelectedBorder}` : `2px solid ${theme.borderNeutral}`
  return (
    <div data-voice-step-number style={{
      width: CIRCLE, height: CIRCLE, borderRadius: '50%', border: ring, background: theme.surface, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ ...t.caption, fontWeight: font.semibold, color: row.state === 'current' ? theme.stateSelectedText : colors.textSecondary }}>
        {row.number}
      </span>
    </div>
  )
}

function EditStepAction({ row }: { row: OptionStepRow }) {
  const t = useType()
  return <button type="button" onClick={row.onEdit} aria-label={`${row.title} 바꾸기`} style={{
    ...t.bodyButton, color: colors.textPrimary, background: 'transparent', border: 0,
    width: 160, minHeight: 80, padding: '16px 0 16px 12px', borderRadius: 8, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, cursor: 'pointer',
  }}>
    바꾸기<TrailingChevron color={colors.textPrimary} />
  </button>
}

function stepIcon(row: OptionStepRow): IconName {
  if (row.key === 'temperature') return row.value === '따뜻하게' ? 'hotCup' : 'snowflake'
  if (row.key === 'size') return 'cupSize'
  if (row.key === 'caffeine') return 'bean'
  return 'iceCube'
}

function StepValue({ row }: { row: OptionStepRow }) {
  const t = useType()
  const theme = useTheme()
  return <span data-option-value style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 12px' }}>
      <span style={{ ...t.info, color: colors.textPrimary }}>
        {row.value}
        {row.state === 'default' && <span style={{ ...t.body, color: colors.textSecondary }}> · 기본값</span>}
        {row.note && <span style={{ ...t.body, color: colors.textSecondary }}> {row.note}</span>}
      </span>
      {row.change && <span style={{ ...t.caption, color: theme.stateSelectedText, whiteSpace: 'nowrap' }}>{row.change.kind === 'added' ? '새로 선택' : '변경'}</span>}
    </span>
    {row.change?.kind === 'changed' && <span style={{ ...t.caption, color: colors.textSecondary }}>이전: {row.change.previous}</span>}
  </span>
}

function CompactStepList({ rows, currentContent, readableTitles = false }: { rows: OptionStepRow[]; currentContent?: ReactNode; readableTitles?: boolean }) {
  const t = useType()
  const questionLineHeight = Math.max(optionStepMetrics.summaryRowHeight, t.title.fontSize * t.title.lineHeight)
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
      {rows.map((row, index) => {
        const isCurrent = row.state === 'current' && currentContent !== undefined
        if (isCurrent) return (
          <li key={row.key} data-voice-options aria-current="step" style={{ display: 'grid', gridTemplateColumns: `${CIRCLE}px minmax(0, 1fr)`, columnGap: COLUMN_GAP, paddingBottom: index < rows.length - 1 ? optionStepMetrics.afterNavigationGap : 0 }}>
            <div style={{ height: questionLineHeight, display: 'flex', alignItems: 'center' }}>
              <StepCircle row={row} />
            </div>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: space.md }}>{currentContent}</div>
          </li>
        )
        return (
          <li key={row.key} aria-current={row.state === 'current' ? 'step' : undefined} data-option-summary={row.key} style={{
            display: 'grid', gridTemplateColumns: `${CIRCLE}px 40px 128px minmax(0, 1fr) 160px`, columnGap: 16, alignItems: 'center',
            minHeight: optionStepMetrics.summaryRowHeight, padding: '12px 0',
          }}>
            <StepCircle row={row} />
            <Icon name={stepIcon(row)} size={40} color={colors.iconNeutral} optical="summary" />
            <span style={{ ...(readableTitles ? t.readable(t.caption) : t.caption), fontWeight: font.semibold, color: colors.textSecondary, whiteSpace: 'nowrap' }}>{row.title}</span>
            <StepValue row={row} />
            {row.onEdit ? (
              <EditStepAction row={row} />
            ) : row.state === 'upcoming' ? (
              <span style={{ ...t.body, color: colors.textSecondary, textAlign: 'center' }}>선택 전</span>
            ) : <span />}
          </li>
        )
      })}
    </ol>
  )
}

// readableTitles: 큰 글씨에서 항목 이름(온도·크기·카페인·얼음양)을 36으로. 고른 내용 확인 화면만(사용자 2026-10-20).
export default function OptionStepper({ rows, currentContent, readableTitles = false }: { rows: OptionStepRow[]; currentContent?: ReactNode; readableTitles?: boolean }) {
  const t = useType()
  const theme = useTheme()
  if (rows.length === 0) return null
  if (devParams.compactCards) return <CompactStepList rows={rows} currentContent={currentContent} readableTitles={readableTitles} />
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
      {rows.map((row, i) => {
        const last = i === rows.length - 1
        const showContent = row.state === 'current' && currentContent !== undefined
        const nextHasContent = rows[i + 1]?.state === 'current' && currentContent !== undefined
        const gapBelow = last ? 0 : showContent ? optionStepMetrics.afterNavigationGap : nextHasContent ? CURRENT_GAP : ROW_GAP
        return (
          <li key={row.key} data-voice-options={showContent || undefined} aria-current={row.state === 'current' ? 'step' : undefined} style={{ display: 'flex', gap: COLUMN_GAP, alignItems: 'stretch' }}>
            {/* 동그라미와 다음 칸으로 잇는 선 · 내용 칸에서는 동그라미가 내용의 첫 줄 높이에 선다 */}
            <div style={{ width: CIRCLE, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: showContent ? Math.max(0, (t.title.fontSize * t.title.lineHeight - CIRCLE) / 2) : 0 }}>
              <StepCircle row={row} />
              {!last && <div style={{ flex: 1, width: 2, minHeight: ROW_GAP, background: theme.borderSubtle, margin: '4px 0' }} />}
            </div>

            {showContent ? (
              <div style={{ flex: 1, minWidth: 0, paddingBottom: gapBelow, display: 'flex', flexDirection: 'column', gap: space.md }}>
                {currentContent}
              </div>
            ) : (
              <div style={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: space.md,
                paddingBottom: gapBelow,
              }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, minHeight: CIRCLE, justifyContent: 'center' }}>
                  <span style={{ ...t.caption, fontWeight: font.semibold, color: row.state === 'current' ? colors.textPrimary : colors.textSecondary }}>
                    {row.title}
                    {row.note && row.state !== 'default' && <span style={{ fontWeight: t.caption.fontWeight }}> {row.note}</span>}
                  </span>
                  {row.value && <StepValue row={{ ...row, note: row.state === 'default' ? row.note : undefined }} />}
                </div>
                {row.onEdit ? <EditStepAction row={row} /> : row.state === 'upcoming' && <span style={{ ...t.body, color: colors.textSecondary, width: 160, flexShrink: 0, textAlign: 'right', paddingRight: 12 }}>선택 전</span>}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
