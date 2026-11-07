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
