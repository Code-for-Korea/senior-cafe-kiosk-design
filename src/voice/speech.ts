export type SpeechStatus = 'ready' | 'speaking' | 'unavailable' | 'error'
type Report = (status: SpeechStatus) => void
// 음량 버튼을 연달아 누르는 동안은 기다렸다가, 멈추면 이만큼 뒤에 새 음량으로 들려준다.
export const VOLUME_SETTLE_MS = 500
// 한국어 음성을 찾는 시간. 넘으면 ‘음성 안내를 쓸 수 없어요’.
const VOICE_WAIT_MS = 1800
// 녹음 파일 틀기(사용자 2026-10-29). 문장에 파일이 있으면 그 파일을, 없으면 브라우저 음성 합성을 쓴다.
// 틀 때 쓰는 기능만 적어 두어 검사 스크립트에서 가짜로 바꿔 끼울 수 있게 한다.
export interface VoiceFileSource {
  has(text: string): boolean
  create(text: string): VoiceAudio
}
export interface VoiceAudio {
  volume: number
  currentTime: number
  play(): Promise<void> | void
  pause(): void
  // HTMLAudioElement와 맞추되 검사용 가짜에서도 쓸 수 있게 넓게 둔다.
  onplay: ((this: any, event: any) => any) | null
  onended: ((this: any, event: any) => any) | null
  onerror: ((this: any, event: any) => any) | null
}
// Each new guide invalidates the previous callbacks; speech never advances the order.
// filesOnly: 녹음 파일만 쓰고 브라우저 음성(speechSynthesis)은 쓰지 않는다. 파일 없는 줄은 조용히 건너뛴다.
// 기본값 false라 검사 스크립트(브라우저 음성 동작 검증)는 그대로 통과한다. 앱에서만 true로 켠다.
export function createGuideSpeaker(synth: SpeechSynthesis, utterance: () => SpeechSynthesisUtterance, settleMs = VOLUME_SETTLE_MS, files: VoiceFileSource | null = null, filesOnly = false) {
  let volume = 0.5
  let generation = 0
  let pending: (() => void) | null = null
  let timeout: ReturnType<typeof setTimeout> | undefined
  let volumeTimer: ReturnType<typeof setTimeout> | undefined
  let activeLines: SpeechSynthesisUtterance[] = []
  let activeAudio: VoiceAudio | null = null
  // 지금 읽고 있는 안내와 문장 위치. 이미 넘긴 문장에는 음량을 바꿔도 반영되지 않아서 이 문장부터 다시 읽는다.
  let current: { lines: readonly string[]; report: Report; onLineStart?: (index: number) => void; line: number } | null = null
  const stop = () => {
    generation++
    activeLines = []
    current = null
    if (pending) synth.removeEventListener('voiceschanged', pending)
    pending = null
    clearTimeout(timeout)
    clearTimeout(volumeTimer)
    if (activeAudio) { const audio = activeAudio; activeAudio = null; audio.onplay = audio.onended = audio.onerror = null; audio.pause() }
    synth.cancel()
  }
  const koreanVoices = () => synth.getVoices().filter(v => /^ko(?:[-_]|$)/i.test(v.lang))
  // 한국어 음성이 준비되면 ready를 부른다. 1.8초 안에 없으면 ‘쓸 수 없음’.
  const whenVoices = (token: number, report: Report, ready: (voices: SpeechSynthesisVoice[]) => void) => {
    const attempt = () => {
      if (token !== generation) return true
      const voices = koreanVoices()
      if (!voices.length) return false
      ready(voices)
      return true
    }
    if (attempt()) return
    pending = () => {
      if (!attempt()) return
      if (pending) synth.removeEventListener('voiceschanged', pending)
      pending = null
      clearTimeout(timeout)
    }
    synth.addEventListener('voiceschanged', pending)
    timeout = setTimeout(() => {
      if (pending) synth.removeEventListener('voiceschanged', pending)
      pending = null
      if (token === generation) report('unavailable')
    }, VOICE_WAIT_MS)
  }
  const makeLine = (text: string, voices: SpeechSynthesisVoice[]) => {
    const line = utterance()
    line.text = text
    line.lang = 'ko-KR'
    line.voice = voices.find(v => v.localService) ?? voices[0]
    // 보통 빠르기(사용자 2026-10-28). 녹음 파일(TTS 요청서)도 보통 빠르기로 만든다.
    line.rate = 1
    line.volume = volume
    return line
  }
  const play = (lines: readonly string[], report: Report, onLineStart: ((index: number) => void) | undefined, from: number, resumable: boolean) => {
    stop()
    const token = generation
    const session = resumable ? { lines, report, onLineStart, line: from } : null
    current = session
    const queue = lines.slice(from)
    report('ready')
    // 녹음 파일 전용: 파일이 있는 줄만 틀고 없는 줄은 건너뛴다. 브라우저 음성으로는 읽지 않는다.
    if (filesOnly) { playInTurn(token, queue, from, session, report, onLineStart); return }
    if (files && queue.some(text => files.has(text))) { playInTurn(token, queue, from, session, report, onLineStart); return }
    // 모두 브라우저 음성: 문장을 한꺼번에 넘기고 브라우저가 차례로 읽게 둔다.
    whenVoices(token, report, voices => {
      activeLines = queue.map((text, offset) => {
        const index = from + offset
        const line = makeLine(text, voices)
        let ended = false
        line.onstart = () => {
          if (token !== generation || ended) return
          if (session) session.line = index
          onLineStart?.(index)
          report('speaking')
        }
        line.onend = () => {
          if (token !== generation || ended) return
          ended = true
          if (session) session.line = index + 1
          if (offset === queue.length - 1) { activeLines = []; current = null; report('ready') }
        }
        line.onerror = () => {
          if (token !== generation || ended) return
          ended = true
          stop()
          report('error')
        }
        return line
      })
      for (const line of activeLines) {
        if (token !== generation) break
        try { synth.speak(line) } catch {
          if (token === generation) { stop(); report('error') }
          break
        }
      }
    })
  }
  // 파일이 섞여 있을 때: 한 줄씩 차례로. 파일이 있는 줄은 파일을, 없는 줄은 브라우저 음성을 쓴다. 파일을 못 틀면 그 줄만 브라우저 음성으로.
  const playInTurn = (token: number, queue: readonly string[], from: number, session: typeof current, report: Report, onLineStart?: (index: number) => void) => {
    let cursor = 0
    const finish = () => { activeLines = []; activeAudio = null; current = null; report('ready') }
    const next = () => {
      if (token !== generation) return
      if (cursor >= queue.length) { finish(); return }
      const index = from + cursor, text = queue[cursor]
      cursor++
      if (files && files.has(text)) playFile(index, text)
      else if (filesOnly) ended(index) // 녹음 없는 줄은 조용히 건너뛴다(브라우저 음성 안 씀)
      else speakOne(index, text)
    }
    const started = (index: number) => {
      if (session) session.line = index
      onLineStart?.(index)
      report('speaking')
    }
    const ended = (index: number) => {
      if (session) session.line = index + 1
      next()
    }
    const playFile = (index: number, text: string) => {
      let audio: VoiceAudio
      try { audio = files!.create(text) } catch { speakOne(index, text); return }
      let done = false
      activeAudio = audio
      audio.volume = volume
      audio.currentTime = 0
      audio.onplay = () => { if (token === generation && !done) started(index) }
      audio.onended = () => { if (token !== generation || done) return; done = true; activeAudio = null; ended(index) }
      // 파일을 못 불러오거나 못 틀면 그 줄은 브라우저 음성으로 읽는다.
      const fallback = () => { if (token !== generation || done) return; done = true; activeAudio = null; audio.onplay = audio.onended = audio.onerror = null; audio.pause(); if (filesOnly) ended(index); else speakOne(index, text) }
      audio.onerror = fallback
      try {
        const result = audio.play()
        if (result && typeof (result as Promise<void>).catch === 'function') (result as Promise<void>).catch(fallback)
      } catch { fallback() }
    }
    const speakOne = (index: number, text: string) => {
      whenVoices(token, report, voices => {
        const line = makeLine(text, voices)
        let done = false
        line.onstart = () => { if (token === generation && !done) started(index) }
        line.onend = () => { if (token !== generation || done) return; done = true; ended(index) }
        line.onerror = () => { if (token !== generation || done) return; done = true; stop(); report('error') }
        activeLines = [line]
        try { synth.speak(line) } catch { if (token === generation) { stop(); report('error') } }
      })
    }
    next()
  }
  const speak = (text: string | readonly string[], report: Report, onLineStart?: (index: number) => void) =>
    play(typeof text === 'string' ? [text] : text, report, onLineStart, 0, true)
  // 읽는 중이면 읽던 문장부터 새 음량으로 다시 읽고, 쉬는 중이면 idleText(예: '음량 6')를 짧게 들려준다.
  const setVolume = (value: number, idleText?: string) => {
    if (!Number.isFinite(value)) return
    volume = Math.max(0, Math.min(1, value))
    // 지금 재생 중인 녹음 파일에는 음량을 바로 반영한다(문장을 다시 틀지 않고 즉시 커지고 작아진다).
    if (activeAudio) activeAudio.volume = volume
    clearTimeout(volumeTimer)
    volumeTimer = setTimeout(() => {
      const resume = current
      if (resume) play(resume.lines, resume.report, resume.onLineStart, resume.line, true)
      else if (idleText) play([idleText], () => {}, undefined, 0, false)
    }, settleMs)
  }
  // 새 주문: 읽던 것을 멈추고 음량만 바꾼다. 음량을 바꿀 때처럼 다시 읽거나 ‘음량 N’을 들려주지 않는다.
  const reset = (value: number) => {
    stop()
    if (Number.isFinite(value)) volume = Math.max(0, Math.min(1, value))
  }
  return { speak, stop, setVolume, reset }
}

// 한 주문 안에서 같은 화면의 같은 문장은 처음 한 번만 저절로 읽는다(사용자 2026-10-19). 다시 듣기와 켤 때는 모두 읽는다.
// 같은 화면에서 문장이 바뀌면(결제 방법을 바꿔 버튼 이름이 달라짐, 담은 메뉴 줄이 생김) 그 줄만 읽는다.
export const heardKey = (id: string, line: string) => `${id}\n${line}`
export function unheardLines(heard: ReadonlySet<string>, id: string, lines: readonly string[]) {
  return lines.flatMap((line, index) => heard.has(heardKey(id, line)) ? [] : [index])
}
// 경고·오류 안내가 새로 나타나면 그 안내를 읽은 기억만 지워 처음부터 읽게 한다.
export function forgetGuide(heard: Set<string>, id: string) {
  for (const key of heard) if (key.startsWith(id + '\n')) heard.delete(key)
}
