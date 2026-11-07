import { filterMetrics, motion } from '../design-system/metrics'
import type { ReactNode } from 'react'
import { colors, radius, space } from '../tokens'
import { useType } from './useType'
import { useTheme } from './ThemeContext'

/* 1차 필터는 검정 글자와 선택된 브랜드색 밑줄, 2차 필터는 둥근 칩.
   색은 의미 토큰을 사용해 고대비 모드에서도 같은 선택 구조를 유지한다. */
interface Props {
  kind: 'tab' | 'chip'
  selected: boolean
  onClick: () => void
  accent?: 'primary' | 'hot' | 'cold'
  height?: number
  width?: number
  children: ReactNode
}

export default function FilterChip({ kind, selected, onClick, accent = 'primary', height, width, children }: Props) {
  const t = useType()
  const theme = useTheme()
  const light = accent === 'cold' ? theme.coldLight : accent === 'hot' ? theme.hotLight : theme.stateSelected
  const text = accent === 'cold' ? theme.coldText : accent === 'hot' ? theme.hotText : theme.stateSelectedText
  const h = height ?? (kind === 'tab' ? filterMetrics.tabHeight : filterMetrics.chipHeight)
  const isTab = kind === 'tab'
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      data-filter-kind={kind}
      style={{
        height: h, flex: isTab ? (width === undefined ? 1 : `0 0 ${width}px`) : undefined, padding: isTab ? 0 : `0 ${filterMetrics.chipPaddingX}px`,
        borderRadius: isTab ? 0 : radius.pill,
        position: isTab ? 'relative' : undefined,
        background: isTab ? 'transparent' : selected ? light : theme.surface,
        border: isTab ? 'none' : `${filterMetrics.border}px solid ${selected ? theme.filterSelectedBorder : theme.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: `all ${motion.selection}`, whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        ...(isTab ? t.primary : { ...t.bodyButton, fontSize: t.caption.fontSize }),
        color: selected ? (isTab ? theme.actionPrimary : text) : colors.textPrimary,
        ...(isTab ? { height: '100%', padding: `0 ${space.sm}px`, display: 'flex', alignItems: 'center' } : {}),
      }}>
        {children}
      </span>
      {isTab && <span aria-hidden="true" data-filter-indicator style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: selected ? filterMetrics.selectedBorder : filterMetrics.border,
          background: selected ? theme.actionPrimary : theme.borderSubtle,
        }} />}
    </button>
  )
}
