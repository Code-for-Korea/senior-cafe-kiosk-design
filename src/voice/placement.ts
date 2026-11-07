export interface GuideRect { x: number; y: number; width: number; height: number }
// Positions belong to the scrolling content, not the screen. Scrolling moves
// both rectangles equally, so it never requires another JS positioning pass.
export function relativeGuideRect(rect: GuideRect, origin: GuideRect): GuideRect {
  return { ...rect, x: rect.x - origin.x, y: rect.y - origin.y }
}
export function intersects(a: GuideRect, b: GuideRect, gap = 12) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y
}

// A description inside its illustration should have one outline, not nested frames.
export function mergeGuideHighlights(rects: GuideRect[]): GuideRect[] {
  const merged: GuideRect[] = []
  for (const rect of rects) {
    let next = { ...rect }
    for (let i = 0; i < merged.length;) {
      const other = merged[i]
      if (!intersects(next, other, 0)) { i++; continue }
      const x = Math.min(next.x, other.x), y = Math.min(next.y, other.y)
      next = { x, y, width: Math.max(next.x + next.width, other.x + other.width) - x, height: Math.max(next.y + next.height, other.y + other.height) - y }
      merged.splice(i, 1)
      i = 0
    }
    merged.push(next)
  }
  return merged
}

export function placeGuide(width: number, height: number, panelHeight: number, safeTop: number, bottom: number, targets: GuideRect[], controls: GuideRect[]) {
  const panelWidth = Math.min(952, width - 128)
  const ys = [safeTop, bottom - panelHeight - 16, ...[...targets, ...controls].flatMap(r => [r.y - panelHeight - 16, r.y + r.height + 16])]
  const candidates = ys.map(y => ({ x: (width - panelWidth) / 2, y, width: panelWidth, height: panelHeight }))
    .filter(r => r.y >= safeTop && r.y + r.height <= Math.min(height, bottom) && ![...targets, ...controls].some(t => intersects(r, t)))
  const anchor = targets[0]
  candidates.sort((a,b) => !anchor ? a.y-b.y : Math.abs(a.y+a.height/2-anchor.y-anchor.height/2)-Math.abs(b.y+b.height/2-anchor.y-anchor.height/2))
  return candidates[0] ?? null
}
