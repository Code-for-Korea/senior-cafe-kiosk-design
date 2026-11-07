/* 한글 글자 조합 · 천지인 자판으로 누른 것을 글자로 바꾼다.
   누른 내용은 '낱자 목록'으로 들고 있다가, 화면에 보일 때마다 처음부터 다시 조합한다.
   (중간 상태를 따로 기억하지 않아 지우기와 되돌리기가 단순하다) */

const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

/* 겹받침 · 받침 두 개가 하나로 합쳐지는 경우 */
const JONG_PAIR: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ',
}
const JONG_SPLIT: Record<string, string[]> = Object.fromEntries(
  Object.entries(JONG_PAIR).map(([pair, jong]) => [jong, [...pair]]),
)

const SYLLABLE_START = 0xAC00
const SYLLABLE_END = 0xD7A3

/* ── 천지인 자판 ── */

/* 자음 칸 · 같은 칸을 다시 누르면 다음 글자로 바뀐다 (ㄱ → ㅋ → ㄲ → ㄱ) */
export const consonantKeys = {
  'ㄱ': ['ㄱ', 'ㅋ', 'ㄲ'],
  'ㄴ': ['ㄴ', 'ㄹ'],
  'ㄷ': ['ㄷ', 'ㅌ', 'ㄸ'],
  'ㅂ': ['ㅂ', 'ㅍ', 'ㅃ'],
  'ㅅ': ['ㅅ', 'ㅎ', 'ㅆ'],
  'ㅈ': ['ㅈ', 'ㅊ', 'ㅉ'],
  'ㅇ': ['ㅇ', 'ㅁ'],
} as const
export type ConsonantKey = keyof typeof consonantKeys
export type VowelKey = 'ㅣ' | 'ㆍ' | 'ㅡ'

/* 모음 · ㅣ ㆍ ㅡ 를 차례로 눌러 만든다. 'ㆍ'와 'ㆍㆍ'는 아직 완성되지 않은 모음이다. */
const VOWEL_STEP: Record<string, string> = {
  'ㅣ+ㆍ': 'ㅏ', 'ㅏ+ㆍ': 'ㅑ', 'ㅏ+ㅣ': 'ㅐ', 'ㅑ+ㅣ': 'ㅒ',
  'ㆍ+ㆍ': 'ㆍㆍ', 'ㆍ+ㅣ': 'ㅓ', 'ㆍㆍ+ㅣ': 'ㅕ', 'ㅓ+ㅣ': 'ㅔ', 'ㅕ+ㅣ': 'ㅖ',
  'ㆍ+ㅡ': 'ㅗ', 'ㆍㆍ+ㅡ': 'ㅛ', 'ㅗ+ㅣ': 'ㅚ', 'ㅚ+ㆍ': 'ㅘ', 'ㅘ+ㅣ': 'ㅙ',
  'ㅡ+ㆍ': 'ㅜ', 'ㅜ+ㆍ': 'ㅠ', 'ㅜ+ㅣ': 'ㅟ', 'ㅠ+ㅣ': 'ㅝ', 'ㅝ+ㅣ': 'ㅞ',
  'ㅡ+ㅣ': 'ㅢ',
}

export type Unit =
  | { kind: 'consonant'; ch: string; key: ConsonantKey }
  | { kind: 'vowel'; ch: string }
  | { kind: 'space' }

export function pressConsonant(units: Unit[], key: ConsonantKey): Unit[] {
  const cycle: readonly string[] = consonantKeys[key]
  const last = units[units.length - 1]
  if (last?.kind === 'consonant' && last.key === key) {
    const next = cycle[(cycle.indexOf(last.ch) + 1) % cycle.length]
    return [...units.slice(0, -1), { kind: 'consonant', ch: next, key }]
  }
  return [...units, { kind: 'consonant', ch: cycle[0], key }]
}

export function pressVowel(units: Unit[], key: VowelKey): Unit[] {
  const last = units[units.length - 1]
  if (last?.kind === 'vowel') {
    const combined = VOWEL_STEP[`${last.ch}+${key}`]
    if (combined) return [...units.slice(0, -1), { kind: 'vowel', ch: combined }]
  }
  return [...units, { kind: 'vowel', ch: key }]
}

/* 띄어쓰기 · 같은 칸의 자음을 이어서 칠 때 글자를 끊는 역할도 한다 (초콜 + 띄어쓰기 + 릿) */
export function pressSpace(units: Unit[]): Unit[] {
  const last = units[units.length - 1]
  if (!last || last.kind === 'space') return units
  return [...units, { kind: 'space' }]
}

export function pressBackspace(units: Unit[]): Unit[] {
  return units.slice(0, -1)
}

/* ── 조합 ── */

const isConsonant = (u?: Unit): u is Extract<Unit, { kind: 'consonant' }> => u?.kind === 'consonant'
const isVowel = (u?: Unit) => u?.kind === 'vowel'
const isFullVowel = (u?: Unit): u is Extract<Unit, { kind: 'vowel' }> => u?.kind === 'vowel' && JUNG.includes(u.ch)

/* 낱자 목록을 화면에 보일 글자로 바꾼다 */
export function compose(units: Unit[]): string {
  let out = ''
  let i = 0
  while (i < units.length) {
    const u = units[i]
    if (u.kind === 'space') { out += ' '; i += 1; continue }
    if (u.kind === 'vowel') { out += u.ch; i += 1; continue }

    const vowel = units[i + 1]
    if (!isFullVowel(vowel)) { out += u.ch; i += 1; continue } // 자음 혼자

    i += 2
    let jong = ''
    const c1 = units[i], c2 = units[i + 1], c3 = units[i + 2]
    // 뒤에 모음이 오는 자음은 받침이 아니라 다음 글자의 첫소리다
    if (isConsonant(c1) && !isVowel(c2) && JONG.includes(c1.ch)) {
      const pair = isConsonant(c2) && !isVowel(c3) ? JONG_PAIR[c1.ch + c2.ch] : undefined
      if (pair) { jong = pair; i += 2 } else { jong = c1.ch; i += 1 }
    }
    out += String.fromCharCode(
      SYLLABLE_START + (CHO.indexOf(u.ch) * 21 + JUNG.indexOf(vowel.ch)) * 28 + JONG.indexOf(jong),
    )
  }
  return out
}

/* ── 분해 ── */

function keyOf(consonant: string): ConsonantKey | null {
  const found = (Object.keys(consonantKeys) as ConsonantKey[])
    .find((key) => (consonantKeys[key] as readonly string[]).includes(consonant))
  return found ?? null
}

/* 글자 하나를 낱자로 나눈다. 한글이 아니면 빈 목록. 겹받침은 둘로 나눈다. */
export function splitSyllable(ch: string): string[] {
  const code = ch.charCodeAt(0)
  if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
    const offset = code - SYLLABLE_START
    const jong = JONG[offset % 28]
    return [
      CHO[Math.floor(offset / 588)],
      JUNG[Math.floor(offset / 28) % 21],
      ...(JONG_SPLIT[jong] ?? (jong ? [jong] : [])),
    ]
  }
  if (CHO.includes(ch) || JUNG.includes(ch)) return [ch]
  return []
}

export function isConsonantChar(ch: string) {
  return CHO.includes(ch)
}

/* 이미 완성된 글자를 낱자 목록으로 되돌린다 (검색어를 미리 넣어 둘 때) */
export function unitsFromText(text: string): Unit[] {
  const units: Unit[] = []
  for (const ch of text) {
    if (ch === ' ') { units.push({ kind: 'space' }); continue }
    for (const jamo of splitSyllable(ch)) {
      const key = keyOf(jamo)
      if (key) units.push({ kind: 'consonant', ch: jamo, key })
      else units.push({ kind: 'vowel', ch: jamo })
    }
  }
  return units
}

/* 찾을 때 쓰는 낱자 · 띄어쓰기와 완성되지 않은 모음은 뺀다 */
export function searchJamo(units: Unit[]): string[] {
  return units.flatMap((u) => (isConsonant(u) || isFullVowel(u) ? [u.ch] : []))
}
