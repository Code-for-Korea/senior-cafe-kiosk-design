import { voiceMetrics, layout as layoutMetrics } from '../design-system/metrics'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useType } from '../components/useType'
import type { Guide } from './guides'
import type { SpeechStatus } from './speech'
import { mergeGuideHighlights, placeGuide, relativeGuideRect, type GuideRect } from './placement'

// Shared visual defaults.
const appearance = voiceMetrics
const obstacleSelector = 'button, input, nav, [role="textbox"], h1, h2, h3, p, img, dt, dd, [data-order-progress], [aria-label="추가 선택 순서"], [data-low-cart-quantity], .payment-flow-copy, .payment-figure, .payment-amount, .payment-money, .payment-order-number, .payment-order-hero, .payment-tasks, .payment-help-steps, [data-voice-heading], [data-option-summary]'
// Each coordinate layer (the screen, or one native scrolling list) draws its own rings,
// so a ring around a list item scrolls with the item.
type Surface = { host: HTMLElement; extent: GuideRect; rings: GuideRect[] }
// 화면 글이 따로 없는 안내만 글 말풍선을 띄운다. 다시 듣기·음량은 맨 아래 줄(모든 화면 같은 자리).
type Panel = { host: HTMLElement; rect: GuideRect; pointsDown: boolean }
type Layout = { surfaces: Surface[]; panel: Panel | null }
const pad = (r: GuideRect, amount: number): GuideRect => ({ x: r.x - amount, y: r.y - amount, width: r.width + amount * 2, height: r.height + amount * 2 })

function sameLayout(a: Layout, b: Layout) {
  return a.surfaces.length === b.surfaces.length && a.surfaces.every((s, i) => s.host === b.surfaces[i].host)
    && a.panel?.host === b.panel?.host
    && JSON.stringify(a, (key, value) => key === 'host' ? undefined : value) === JSON.stringify(b, (key, value) => key === 'host' ? undefined : value)
}

// Only the part being read gets a ring, and only while it is being read.
// The rest of the screen keeps its normal look, so nothing seems switched off.
function RingSurface({ surface }: { surface: Surface }) {
  const { extent, rings } = surface
  const inset = appearance.ringWidth / 2
  return <svg data-voice-ring-surface className="voice-guide-rings" aria-hidden="true"
    viewBox={`${extent.x} ${extent.y} ${extent.width} ${extent.height}`}
    style={{ left: extent.x, top: extent.y, width: extent.width, height: extent.height }}>
    {rings.map((r, i) => <rect data-voice-ring key={i} x={r.x + inset} y={r.y + inset}
      width={Math.max(0, r.width - inset * 2)} height={Math.max(0, r.height - inset * 2)} rx={appearance.radius} />)}
  </svg>
}

export default function VoiceOverlay({ canvas, guide, speakingTarget, status }: { canvas: HTMLElement; guide: Guide; speakingTarget?: string; status: SpeechStatus }) {
  const t = useType()
  const panelRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>({ surfaces: [], panel: null })
  const unavailable = status === 'unavailable' || status === 'error'
  const speaking = status === 'speaking'
  useLayoutEffect(() => {
    if (guide.quiet) return
    let frame = 0
    const observed = new Set<Element>()
    const observe = (element: Element) => { if (!observed.has(element)) { observed.add(element); resize.observe(element) } }
    const measure = () => {
      const base = canvas.getBoundingClientRect(), scale = base.width / canvas.offsetWidth
      if (!scale) return
      const rect = (element: Element, text = false): GuideRect => {
        const range = text ? document.createRange() : null
        range?.selectNodeContents(element)
        const r = range ? range.getBoundingClientRect() : element.getBoundingClientRect()
        return { x: (r.left - base.left) / scale, y: (r.top - base.top) / scale, width: r.width / scale, height: r.height / scale }
      }
      const select = (selector: string) => Array.from(canvas.querySelectorAll<HTMLElement>(selector))
        .filter(e => !e.closest('[data-voice-overlay]') && e.getBoundingClientRect().height > 0)
      // 테두리 대상. 대화상자 안내는 맨 위 대화상자 안에서만 찾는다(뒤 화면에 같은 글자의 버튼이 있어도).
      // 'button:글자'는 그 글자가 적힌 버튼. 띄어쓰기·가운뎃점·쉼표·꺾쇠는 빼고 비교한다(‘다음 · 얼음 선택’ = ‘다음, 얼음 선택’).
      const modals = canvas.querySelectorAll<HTMLElement>('[aria-modal="true"]')
      const scope = guide.dialog && modals.length ? modals[modals.length - 1] : canvas
      const plain = (text: string) => text.replace(/[\s·,›‹]+/g, '')
      const pick = (selector: string) => (selector.startsWith('button:')
        ? Array.from(scope.querySelectorAll<HTMLElement>('button')).filter(button => plain(button.innerText) === plain(selector.slice('button:'.length)))
        : Array.from(scope.querySelectorAll<HTMLElement>(selector)))
        .filter(e => !e.closest('[data-voice-overlay]') && e.getBoundingClientRect().height > 0)
      const hosts = [canvas, ...select('[data-voice-scroll-content]')]
      const origins = new Map(hosts.map(host => [host, rect(host)]))
      const owner = (element: Element) => element.closest<HTMLElement>('[data-voice-scroll-content]') ?? canvas
      const bounds = (element: Element, host: HTMLElement, text = false) => relativeGuideRect(rect(element, text), origins.get(host)!)
      const surfaces: Surface[] = hosts.map(host => {
        if (host === canvas) return { host, extent: { x: 0, y: 0, width: canvas.offsetWidth, height: canvas.offsetHeight }, rings: [] }
        const viewport = host.parentElement!, position = bounds(viewport, host)
        // Subtract scroll offsets once to get a stable content origin. These
        // values do not change during scrolling, including when a resize occurs midway.
        const x = position.x + viewport.clientLeft - viewport.scrollLeft
        const y = position.y + viewport.clientTop - viewport.scrollTop
        const bottomPadding = parseFloat(getComputedStyle(viewport).paddingBottom) || 0
        return { host, extent: { x, y, width: viewport.clientWidth, height: Math.max(viewport.clientHeight, host.offsetHeight - y + bottomPadding) }, rings: [] }
      })
      const layer = (host: HTMLElement) => surfaces.find(s => s.host === host)!
      for (const host of hosts.slice(1)) observe(host.parentElement!)
      // The bubble is placed around the guide's own target, so it stays put while each sentence is read.
      const targets = pick(guide.target)
      const ringSelector = speakingTarget ?? (guide.target === 'main' ? null : guide.target)
      const outset = appearance.ringGap + appearance.ringWidth
      for (const element of speaking && ringSelector ? pick(ringSelector) : []) {
        const content = element.querySelector<HTMLElement>('[data-voice-scroll-content]'), viewport = content?.parentElement
        if (content && viewport) {
          // A whole scrolling list gets one ring around its content column. Where the
          // content runs past the visible edge, the ring stops at that edge.
          const host = owner(viewport), port = bounds(viewport, host), body = bounds(content, host)
          const top = port.y + viewport.clientTop, bottom = top + viewport.clientHeight
          const shown = { ...body, y: Math.max(top, body.y), height: Math.min(bottom, body.y + body.height) - Math.max(top, body.y) }
          if (shown.height <= 0) continue
          const ring = pad(shown, outset)
          if (body.y < top) { ring.height -= top - ring.y; ring.y = top }
          if (body.y + body.height > bottom) ring.height = bottom - ring.y
          layer(host).rings.push(ring)
        } else {
          const host = owner(element)
          layer(host).rings.push(pad(bounds(element, host), outset))
        }
        observe(element)
      }
      for (const surface of surfaces) surface.rings = mergeGuideHighlights(surface.rings)
      const utility = select('[data-voice-utility], [data-utility-variant], [data-voice-warning]')
      const rootBottom = Math.min(canvas.offsetHeight, ...utility.map(e => rect(e).y))
      const slot = select(`[data-voice-slot="${guide.id}"]`)[0]
      const low = !!canvas.querySelector('.is-low, [data-payment-screen="low"], [data-method-screen="low"], [data-low-options], [data-low-review], [data-low-product], [data-low-cart], [data-low-menu-list]')
      const obstacles = select(obstacleSelector)
      let panel: Panel | null = null
      // 화면에 이미 안내 글이 있거나(existing) 말풍선을 쓰지 않는 안내(noBubble)는 테두리만 두른다.
      if (!slot && !guide.existing && !guide.noBubble && !guide.dialog) {
        const host = canvas
        const safeTop = low ? layoutMetrics.lowHeaderHeight : 32
        const localObstacles = obstacles.filter(e => owner(e) === host).map(e => bounds(e, host, e.matches('p, h1, h2')))
        const localTargets = targets.filter(e => owner(e) === host).map(e => bounds(e, host))
        const height = panelRef.current?.offsetHeight ?? 124
        const position = placeGuide(host.offsetWidth, host.offsetHeight, height, safeTop, rootBottom, localTargets, localObstacles)
          ?? placeGuide(host.offsetWidth, host.offsetHeight, height, 32, rootBottom, localTargets, localObstacles)
        if (position) panel = { host, rect: position, pointsDown: position.y + position.height < (localTargets[0]?.y ?? 0) }
      }
      const next = { surfaces, panel }
      setLayout(old => sameLayout(old, next) ? old : next)
      ;[...hosts, ...targets, ...obstacles, ...utility, ...(slot ? [slot] : [])].forEach(observe)
      if (panelRef.current) observe(panelRef.current)
      // Drop observations of old routes and lazy layouts.
      for (const element of observed) if (!canvas.contains(element)) { resize.unobserve(element); observed.delete(element) }
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure) }
    const resize = new ResizeObserver(schedule)
    const changes = new MutationObserver(records => {
      if (records.some(r => !(r.target instanceof Element ? r.target : r.target.parentElement)?.closest('[data-voice-overlay]'))) schedule()
    })
    changes.observe(canvas, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ['class', 'style', 'data-color-mode'] })
    measure()
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); changes.disconnect(); window.removeEventListener('resize', schedule) }
  }, [canvas, guide, speakingTarget, speaking, t.largeText, unavailable])

  if (guide.quiet) return null
  // Keyed by layer position, so a ring appearing or leaving never remounts the bubble.
  return <>{layout.surfaces.map((surface, index) => canvas.contains(surface.host) && (surface.rings.length > 0 || layout.panel?.host === surface.host) && createPortal(
    <div data-voice-overlay data-voice-layer={surface.host === canvas ? 'fixed' : 'scroll'} className={'voice-guide-overlay' + (guide.dialog ? ' is-dialog' : '')}>
      {surface.rings.length > 0 && <RingSurface surface={surface} />}
      {layout.panel?.host === surface.host && <div ref={panelRef} role="region" aria-label="음성 안내 말풍선" data-voice-status={status}
        className={`voice-guide-panel ${layout.panel.pointsDown ? 'points-down' : 'points-up'}`}
        style={{ left: layout.panel.rect.x, top: layout.panel.rect.y, width: layout.panel.rect.width }}>
        <div className="voice-guide-message"><p style={{ ...t.body, margin: 0, fontWeight: 600 }}>{guide.text}</p></div>
      </div>}
    </div>, surface.host, String(index)))}</>
}
