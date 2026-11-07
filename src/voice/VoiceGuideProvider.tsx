import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { VoiceContext } from './VoiceContext'
import { createGuideSpeaker, forgetGuide, heardKey, unheardLines, type SpeechStatus } from './speech'
import { loadVoiceFiles, type VoiceFilePlayer } from './voiceFiles'
import VoiceOverlay from './VoiceOverlay'
import VoiceIntro, { INTRO_LINE, INTRO_TARGET } from './VoiceIntro'
import { nextButtonLine, orderGuide, staffLateNotice, type Guide } from './guides'
import { voiceWarningState } from './warning'
import { IdleRepeat } from './idleRepeat'
import { devParams } from '../devParams'
import './voice-guide.css'

const DEFAULT_VOLUME = 5

// staffLate: 직원을 부른 지 오래됨(앱 상태). 창이 닫혀 있으면 소리로 한 번 알린다.
// orderSession: 새 주문마다 바뀌는 번호. 바뀌면 음성 안내를 끄고 음량을 기본으로 되돌린다(기획 S00·AC-07, 사용자 2026-10-21).
export default function VoiceGuideProvider({ children, staffLate = false, orderSession = 0 }: { children: ReactNode; staffLate?: boolean; orderSession?: number }) {
  const [enabled, setEnabled] = useState(false)
  const [volume, updateVolume] = useState(DEFAULT_VOLUME)
  const [canvas, setCanvas] = useState<HTMLElement | null>(null)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [status, setStatus] = useState<SpeechStatus>('ready')
  const [warning, updateWarning] = useReducer(voiceWarningState, 'hidden')
  const [spokenLine, setSpokenLine] = useState<{ guideId: string; line: number } | null>(null)
  const [visible, setVisible] = useState(!document.hidden)
  // 녹음 파일 목록(public/voice/manifest.json). 받기 전이나 없으면 브라우저 음성만 쓴다(사용자 2026-10-29).
  const [files, setFiles] = useState<VoiceFilePlayer | null>(null)
  // 목록을 받았거나 없다고 확인한 뒤(true). 대기 화면 첫 안내는 이것을 기다려, 파일이 있는데 브라우저 음성으로 읽지 않게 한다.
  const [filesSettled, setFilesSettled] = useState(false)
  useEffect(() => {
    let alive = true
    loadVoiceFiles(import.meta.env.BASE_URL).then(loaded => { if (!alive) return; if (loaded) setFiles(loaded); setFilesSettled(true) })
    return () => { alive = false }
  }, [])
  // 녹음 파일만 사용한다(filesOnly=true). 브라우저 기본 음성(speechSynthesis)은 쓰지 않고, 녹음 없는 줄은 조용히 건너뛴다.
  const speaker = useMemo(() => !devParams.voiceFailure && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? createGuideSpeaker(window.speechSynthesis, () => new SpeechSynthesisUtterance(), undefined, files, true) : null, [files])
  const reportStatus = useCallback((next: SpeechStatus) => {
    setStatus(next)
    if (next === 'unavailable' || next === 'error') updateWarning('failed')
    else if (next === 'speaking') updateWarning('speaking')
  }, [])
  useEffect(() => {
    const root = document.getElementById('kiosk-canvas')
    setCanvas(root)
    if (!root) return
    const read = () => {
      // 대화상자가 열려 있으면 맨 위 대화상자의 안내만 읽는다. 뒤 화면 안내는 읽지 않는다.
      const modals = root.querySelectorAll<HTMLElement>('[aria-modal="true"]')
      const modal = modals.length ? modals[modals.length - 1] : null
      const scope: HTMLElement = modal ?? root
      const cue = scope.querySelector<HTMLElement>('[data-voice-cue]')
      const fallback = root.querySelector('[data-low-menu-list]') ? orderGuide('menu') : root.querySelector('[data-low-cart]') ? orderGuide('cart') : null
      const existing = cue?.dataset.voiceExisting
      const source = existing ? scope.querySelector<HTMLElement>(existing) : null
      const nextLabel = cue?.dataset.voiceNextLabel ? scope.querySelector<HTMLElement>(cue.dataset.voiceNextLabel)?.innerText.trim().replace(/\s*·\s*/g, ', ') : null
      const lineFocus = cue?.dataset.voiceFocusTarget ? { line: Number(cue.dataset.voiceFocusLine), target: cue.dataset.voiceFocusTarget } : undefined
      const narration: Guide['narration'] = cue?.dataset.voiceNarration ? JSON.parse(cue.dataset.voiceNarration) : undefined
      const candidate: Guide | null = cue ? { id: cue.dataset.voiceCue!, text: nextLabel ? nextButtonLine(nextLabel) : cue.dataset.voiceText!, target: cue.dataset.voiceTarget!, existing: source ? existing : undefined, quiet: cue.dataset.voiceQuiet === 'true', lineFocus, narration, ...(modal ? { dialog: true } : {}), ...(cue.dataset.voiceAnnounce ? { announce: cue.dataset.voiceAnnounce } : {}), ...(cue.dataset.voiceAlways ? { always: true } : {}), ...(cue.dataset.voiceNoBubble ? { noBubble: true } : {}) } : !modal ? fallback : null
      // Suspense keeps old nodes hidden while the next layout loads. Never speak their stale cue.
      const next = candidate && Array.from(root.querySelectorAll(candidate.target)).some(e => e.getBoundingClientRect().height > 0) ? candidate : null
      setGuide(old => JSON.stringify(old) === JSON.stringify(next) ? old : next)
    }
    read()
    const observer = new MutationObserver(records => {
      if (records.some(r => !(r.target instanceof Element ? r.target : r.target.parentElement)?.closest('[data-voice-overlay]'))) read()
    })
    observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-voice-cue', 'data-voice-text', 'data-voice-target', 'data-voice-existing', 'data-voice-announce', 'data-voice-next-label', 'data-voice-quiet', 'data-voice-focus-line', 'data-voice-focus-target', 'data-voice-narration', 'data-voice-always', 'data-voice-no-bubble', 'aria-modal', 'style'] })
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const change = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  // 이번 주문에서 이미 읽은 문장(안내 id + 문장). 같은 화면에 다시 와도 저절로 읽지 않고, 다시 듣기로만 읽는다(사용자 2026-10-19).
  // 대화상자도 같다. 대화상자를 닫고 돌아온 화면도 이미 읽었으니 다시 읽지 않는다(사용자). 대기 화면으로 돌아가면(새 주문) 비운다.
  const heard = useRef(new Set<string>())
  // 켤 때 한 번: 다시 듣기·음량 자리를 먼저 말하고 그 자리에 말풍선을 띄운다. 다음 화면이나 아무 곳을 누르면 사라진다.
  const introPending = useRef(false)
  const introGuideId = useRef<string | null>(null)
  const [introVisible, setIntroVisible] = useState(false)
  // 새 주문: 그리는 중에 바로 바꿔서 대기 화면이 앞사람 설정(테두리·말풍선)으로 한 번도 그려지지 않게 한다.
  const [session, setSession] = useState(orderSession)
  if (session !== orderSession) {
    setSession(orderSession)
    setEnabled(false)
    updateVolume(DEFAULT_VOLUME)
    setIntroVisible(false)
  }
  // 읽던 것 멈추기·음량은 말하는 기계 쪽 일이라 그린 뒤에 한다. 아래 대기 화면 안내보다 먼저 돌도록 이 자리에 둔다.
  const resetSession = useRef(orderSession)
  useEffect(() => {
    if (resetSession.current === orderSession) return
    resetSession.current = orderSession
    speaker?.reset(DEFAULT_VOLUME / 10)
    introPending.current = false
    introGuideId.current = null
  }, [orderSession, speaker])
  const say = useCallback((onlyNew = false) => {
    setSpokenLine(null)
    if (!guide || !enabled || !visible) return
    if (!speaker) { reportStatus('unavailable'); return }
    const lines = guide.narration?.map(line => line.text) ?? (guide.lineFocus ? guide.text.split(/\n+/).map(line => line.trim()).filter(Boolean) : [guide.text])
    // 켤 때는 소개 줄 뒤에 지금 화면 안내를 모두 읽는다. 소개 줄은 -1번 줄로 표시해 그동안 맨 아래 줄에 테두리를 두른다.
    const intro = introPending.current
    if (intro) { introPending.current = false; introGuideId.current = guide.id }
    const picks = onlyNew && !intro ? unheardLines(heard.current, guide.id, lines) : lines.map((_, index) => index)
    for (const index of picks) heard.current.add(heardKey(guide.id, lines[index]))
    const order = intro ? [-1, ...picks] : picks
    if (!order.length) return
    speaker.speak(order.map(index => index < 0 ? INTRO_LINE : lines[index]), reportStatus, line => setSpokenLine({ guideId: guide.id, line: order[line] }))
  }, [guide, enabled, visible, speaker, reportStatus])
  // 새 주문: 대기 화면에 오면 읽은 문장 기억을 비운다.
  // 경고·오류(always)는 새로 나타날 때마다 그 기억만 지운다. 대화상자를 닫고 같은 화면으로 돌아온 것은 새로 나타난 게 아니다.
  // 아래에서 읽기 전에 먼저 지우도록 이 순서를 지킨다.
  const lastScreen = useRef<string | null>(null)
  useEffect(() => {
    if (!guide) return
    if (guide.id === 'attract') heard.current.clear()
    if (guide.always && (guide.dialog || guide.id !== lastScreen.current)) forgetGuide(heard.current, guide.id)
    if (!guide.dialog) lastScreen.current = guide.id
  }, [guide])
  useEffect(() => {
    say(true)
    return () => speaker?.stop()
  }, [say, guide?.id, speaker])
  // 화면에 들어오면 그 화면의 녹음 파일을 미리 받아 둔다. 다시 듣기·7초 뒤 읽기 때 늦지 않게.
  useEffect(() => {
    if (!files || !enabled || !guide) return
    files.preload(guide.narration?.map(line => line.text) ?? [guide.text])
  }, [files, enabled, guide])
  // 대기 화면: 음성 안내가 꺼져 있어도 올 때마다 한 번 말한다. 화면을 떠나면 다음에 다시 말한다.
  // 일반 브라우저는 사람이 한 번도 누르기 전에는 소리를 막을 수 있다(실제 기기는 설정으로 허용).
  const announced = useRef<string | null>(null)
  useEffect(() => {
    if (!guide?.announce) { announced.current = null; return }
    if (enabled || !visible || !speaker || !filesSettled || announced.current === guide.id) return
    announced.current = guide.id
    speaker.speak([guide.announce], () => {})
  }, [guide?.id, guide?.announce, enabled, visible, speaker, filesSettled])
  // 직원이 오래 안 옴: 손님이 창을 닫고 주문을 이어 하는 중이면 알림 줄만 바뀌어 화면을 못 보는 분은 모를 수 있다.
  // 음성이 켜져 있으면 한 번 말한다. 낮은 화면처럼 창이 바로 열리면 창 안내가 읽으므로 말하지 않는다(창이 열릴 틈을 잠깐 둔다).
  const lateNoticed = useRef(false)
  useEffect(() => {
    if (!staffLate) { lateNoticed.current = false; return }
    if (lateNoticed.current) return
    lateNoticed.current = true
    const timer = window.setTimeout(() => {
      if (!enabled || !visible || !speaker || canvas?.querySelector('[aria-modal="true"]')) return
      speaker.speak([staffLateNotice], reportStatus)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [staffLate]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (introVisible && introGuideId.current && guide?.id !== introGuideId.current) setIntroVisible(false)
  }, [guide?.id, introVisible])
  useEffect(() => {
    if (!canvas || !introVisible) return
    // 손가락으로 누를 때와 키보드로 누를 때 모두 닫는다.
    const close = () => setIntroVisible(false)
    canvas.addEventListener('pointerdown', close, true)
    canvas.addEventListener('click', close, true)
    return () => { canvas.removeEventListener('pointerdown', close, true); canvas.removeEventListener('click', close, true) }
  }, [canvas, introVisible])
  useEffect(() => {
    if (!canvas || !enabled) return
    const interrupt = (event: MouseEvent) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (!button || button.closest('[data-voice-replay], [data-voice-warning], [data-volume-controls]') || button.getAttribute('aria-label') === '음성 안내') return
      speaker?.stop()
      setSpokenLine(null)
      setStatus('ready')
    }
    // Choosing or changing something ends the old explanation, including keyboard clicks.
    canvas.addEventListener('click', interrupt, true)
    return () => canvas.removeEventListener('click', interrupt, true)
  }, [canvas, enabled, speaker])
  // 기획 D-04: 켜진 채 머뭇거리면(7초 동안 누르지 않음) 지금 화면 안내를 한 번 더 읽는다(사용자 2026-10-21).
  // 한 화면에 한 번. 기다리기만 하는 화면(quiet: 결제 처리 중·메뉴 받는 중)은 다시 읽지 않는다.
  const idle = useRef(new IdleRepeat())
  useEffect(() => { if (guide) idle.current.enter(guide.id) }, [guide?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (enabled) idle.current.restart() }, [enabled])
  useEffect(() => {
    if (status === 'speaking') idle.current.speaking()
    else idle.current.quiet(Date.now())
  }, [status, guide?.id, enabled])
  useEffect(() => {
    if (!enabled) return
    // 손님이 직접 한 것만 센다. 화면이 스스로 움직이는 스크롤은 넣지 않는다(손가락 스크롤은 누르기로 시작).
    const input = () => idle.current.input()
    const events = ['pointerdown', 'keydown', 'wheel'] as const
    events.forEach(event => document.addEventListener(event, input, { capture: true, passive: true }))
    return () => events.forEach(event => document.removeEventListener(event, input, true))
  }, [enabled])
  useEffect(() => {
    if (!enabled || !visible || !guide || guide.quiet || status === 'speaking' || status === 'error' || status === 'unavailable') return
    const timer = window.setInterval(() => {
      if (!idle.current.due(Date.now())) return
      idle.current.repeated()
      say()
    }, 250)
    return () => window.clearInterval(timer)
  }, [enabled, visible, guide, status, say])
  const enableGuide = () => {
    updateWarning('retry')
    introPending.current = true
    introGuideId.current = null
    setIntroVisible(true)
    setEnabled(true)
  }
  const toggle = () => {
    if (!enabled) { enableGuide(); return }
    speaker?.stop()
    canvas?.querySelector<HTMLButtonElement>('button[aria-label="음성 안내"]')?.focus({ preventScroll: true })
    updateWarning('retry')
    introPending.current = false
    setIntroVisible(false)
    setEnabled(false)
  }
  const setVolume = (value: number) => {
    if (!Number.isFinite(value)) return
    const next = Math.max(0, Math.min(10, Math.round(value)))
    updateVolume(next)
    // 바뀐 크기는 읽던 문장을 다시 읽어 들려준다. 쉬는 중에는 ‘음량 N’을 말하지 않는다(바뀌는 숫자를 읽지 않음, 사용자 2026-10-28).
    speaker?.setVolume(next / 10)
  }
  const replay = () => { updateWarning('retry'); say() }
  const dismissWarning = () => {
    canvas?.querySelector<HTMLButtonElement>('button[aria-label="음성 안내"]')?.focus({ preventScroll: true })
    updateWarning('dismiss')
  }
  const focusTarget = enabled && visible && guide && status !== 'error' && status !== 'unavailable'
    && spokenLine?.guideId === guide.id && spokenLine.line === guide.lineFocus?.line ? guide.lineFocus.target : null
  const speakingTarget = guide && spokenLine?.guideId === guide.id && status !== 'error' && status !== 'unavailable'
    ? spokenLine.line < 0 ? INTRO_TARGET : guide.narration?.[spokenLine.line]?.target : undefined
  return <VoiceContext.Provider value={{ enabled, toggle, volume, setVolume, available: true, focusTarget, replay, status,
    warningVisible: enabled && visible && !!guide && warning === 'visible', dismissWarning }}>
    {children}
    {canvas && enabled && guide && visible && createPortal(<VoiceOverlay canvas={canvas} guide={guide} speakingTarget={speakingTarget} status={status} />, canvas)}
    {canvas && enabled && visible && introVisible && createPortal(<VoiceIntro canvas={canvas} />, canvas)}
  </VoiceContext.Provider>
}
