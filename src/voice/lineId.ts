// 음성 문장 이름표(사용자 2026-10-28). 녹음 파일 이름으로 쓴다.
// 문장 글자에서 만들므로 다른 문장이 늘거나 줄어도 이 이름은 그대로이고,
// 이 문장을 고치면 이름도 바뀌어 다시 녹음할 파일이 바로 드러난다.
// 계산: 앞뒤 공백을 뺀 문장의 FNV-1a 32비트 값을 16진수 8자리로. 예: v_3f9a1c2e
// 이 파일은 다른 모듈을 불러오지 않는다(scripts/tts-sheet.mjs가 따로 읽음).
export function voiceLineId(text: string): string {
  let hash = 0x811c9dc5
  for (const ch of text.trim()) {
    const code = ch.codePointAt(0)!
    hash ^= code
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return 'v_' + hash.toString(16).padStart(8, '0')
}
