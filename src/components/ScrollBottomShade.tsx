import { scrollMetrics, opacity, layer } from '../design-system/metrics'
import { useLayoutEffect, useState, type RefObject } from 'react'

// 상품 상세·옵션 화면이 공유하는 하단 스크롤 안내. 고정된 주문 버튼 위에서 끝난다.
export default function ScrollBottomShade({ viewportRef, contentRef }: {
  viewportRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
}) {
  const [moreBelow, setMoreBelow] = useState(false)
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const update = () => setMoreBelow(viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - scrollMetrics.endTolerance)
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(content)
    viewport.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); viewport.removeEventListener('scroll', update) }
  }, [viewportRef, contentRef])

  return moreBelow ? <div data-scroll-bottom-shade aria-hidden="true" style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: scrollMetrics.shadeHeight, zIndex: layer.scrollShade,
    background: 'linear-gradient(to bottom, transparent 5%, var(--scroll-shadow) 100%)',
    opacity: opacity.scrollShade, pointerEvents: 'none',
  }} /> : null
}
