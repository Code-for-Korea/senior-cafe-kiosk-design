import { font } from '../tokens'
import type { useType } from './useType'

// Separate information topics by one body line, rounded to the 8px spacing grid.
// Reference screenshot: visible section whitespace ≈ 1.25 line pitches;
// visible whitespace also includes the font's space inside each line box.
export function productInfoStyles(t: ReturnType<typeof useType>) {
  const lineHeight = 1.4
  return {
    gap: Math.round(t.info.fontSize * lineHeight / 8) * 8,
    label: { ...t.info, lineHeight, fontWeight: font.semibold },
    value: { ...t.info, lineHeight, fontWeight: font.regular, wordBreak: 'keep-all' as const, overflowWrap: 'anywhere' as const },
  }
}
