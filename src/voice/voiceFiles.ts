import { voiceLineId } from './lineId'

// 녹음 파일(TTS)로 읽기(사용자 2026-10-29). public/voice/ 폴더의 파일 목록(manifest.json)을 한 번 받아 두고,
// 문장 글자로 만든 이름표(voiceLineId)와 같은 이름의 파일이 있으면 그 파일을 튼다. 없으면 브라우저 음성 합성으로 읽는다.
// 목록은 scripts/voice-files.mjs(npm run voice:files)가 만든다.
export interface VoiceFilePlayer {
  has(text: string): boolean
  create(text: string): HTMLAudioElement
  // 화면에 들어올 때 미리 받아 둔다. 처음 틀 때 늦게 나오지 않게.
  preload(texts: readonly string[]): void
}

export const VOICE_FILE_DIR = 'voice/'

// 음량 배율. HTMLAudioElement.volume은 1.0에서 막혀 원본 녹음보다 더 키울 수 없다. Web Audio 이득으로 증폭한다.
// 설정 음량 0~1(음량 레벨/10)에 이 값을 곱한 이득을 쓴다. 레벨 5(0.5)=원음, 레벨 10(1.0)=2배까지.
const AMPLIFY = 2

let audioCtx: AudioContext | null | undefined // undefined=아직 안 만듦, null=쓸 수 없음
const amplified = new WeakSet<HTMLAudioElement>()

// 브라우저는 사용자가 한 번 누르기 전에는 오디오 컨텍스트를 멈춰 둔다. 누르면 깨운다.
const unlock = () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {}) }

// 녹음 파일 요소의 volume을 Web Audio 이득으로 바꿔 1.0보다 크게 키울 수 있게 한다.
// 한 요소에 한 번만 설정한다. Web Audio를 쓸 수 없으면 그대로 두고 요소 기본 volume(최대 1.0)을 쓴다.
function amplify(el: HTMLAudioElement): void {
  if (amplified.has(el)) return
  amplified.add(el)
  if (audioCtx === undefined) {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      audioCtx = Ctx ? new Ctx() : null
      if (audioCtx) {
        window.addEventListener('pointerdown', unlock, true)
        window.addEventListener('keydown', unlock, true)
      }
    } catch { audioCtx = null }
  }
  if (!audioCtx) return
  try {
    const source = audioCtx.createMediaElementSource(el) // 요소당 한 번만 만들 수 있다.
    const gain = audioCtx.createGain()
    source.connect(gain)
    gain.connect(audioCtx.destination)
    el.volume = 1 // 원음은 그대로 두고, 아래 재정의한 volume이 이득만 조절한다.
    Object.defineProperty(el, 'volume', {
      configurable: true,
      get() { return gain.gain.value / AMPLIFY },
      set(value: number) { gain.gain.value = Math.max(0, Number(value) || 0) * AMPLIFY; unlock() },
    })
  } catch { /* Web Audio 불가 → 요소 기본 volume 사용 */ }
}

export async function loadVoiceFiles(base: string, fetchFn: typeof fetch = fetch): Promise<VoiceFilePlayer | null> {
  const dir = base.replace(/\/?$/, '/') + VOICE_FILE_DIR
  let names: unknown
  try {
    const response = await fetchFn(dir + 'manifest.json', { cache: 'no-cache' })
    if (!response.ok) return null
    names = await response.json()
  } catch {
    return null
  }
  if (!Array.isArray(names)) return null
  return createVoiceFilePlayer(dir, names.filter((name): name is string => typeof name === 'string'))
}

// 이름표 → 파일 이름(확장자 포함). 같은 이름표의 파일이 여럿이면 먼저 적힌 것.
export function createVoiceFilePlayer(dir: string, names: readonly string[], audio: (url: string) => HTMLAudioElement = url => new Audio(url)): VoiceFilePlayer {
  const byId = new Map<string, string>()
  for (const name of names) { const id = name.replace(/\.[^.]+$/, ''); if (!byId.has(id)) byId.set(id, name) }
  const cache = new Map<string, HTMLAudioElement>()
  const element = (text: string) => {
    const name = byId.get(voiceLineId(text))!
    let item = cache.get(name)
    if (!item) {
      item = audio(dir + name)
      item.preload = 'auto'
      amplify(item)
      // 너무 많이 쌓이지 않게 오래된 것부터 비운다.
      if (cache.size >= 40) cache.delete(cache.keys().next().value!)
      cache.set(name, item)
    }
    return item
  }
  return {
    has: text => byId.has(voiceLineId(text)),
    create: text => element(text),
    preload: texts => { for (const text of texts) if (byId.has(voiceLineId(text))) element(text) },
  }
}
