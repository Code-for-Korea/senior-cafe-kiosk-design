/* 메뉴 찾기 · 입력 중인 글자로 메뉴 이름을 찾는다 (자동완성) */
import type { MenuItem } from './menuData'
import { isConsonantChar, searchJamo, splitSyllable } from './hangul'
import type { Unit } from './hangul'

export interface MenuMatch {
  item: MenuItem
  from: number // 이름에서 맞은 부분의 시작 글자 위치
  to: number   // 끝 글자 위치 (포함)
}

function indexOfSequence(haystack: string[], needle: string[]) {
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((ch, i) => haystack[start + i] === ch)) return start
  }
  return -1
}

function matchName(name: string, query: string[]): { from: number; to: number } | null {
  const jamo: string[] = []   // 이름을 낱자로 푼 것
  const owner: number[] = []  // 각 낱자가 이름의 몇 번째 글자에서 왔는지
  const initials: string[] = []
  const initialOwner: number[] = []
  ;[...name].forEach((ch, index) => {
    const parts = splitSyllable(ch)
    parts.forEach((part) => { jamo.push(part); owner.push(index) })
    if (parts.length > 0) { initials.push(parts[0]); initialOwner.push(index) }
  })

  // '카ㅍ', '캎'처럼 글자를 다 만들기 전에도 찾아진다
  const at = indexOfSequence(jamo, query)
  if (at >= 0) return { from: owner[at], to: owner[at + query.length - 1] }

  // 자음만 눌렀으면 첫소리로도 찾는다 (ㅋㅍ → 카페)
  if (query.every(isConsonantChar)) {
    const initialAt = indexOfSequence(initials, query)
    if (initialAt >= 0) return { from: initialOwner[initialAt], to: initialOwner[initialAt + query.length - 1] }
  }
  return null
}

/* 이름의 앞쪽에서 맞은 메뉴가 먼저 나온다 */
export function searchMenu(items: MenuItem[], units: Unit[]): MenuMatch[] {
  const query = searchJamo(units)
  if (query.length === 0) return []
  return items
    .flatMap((item) => {
      const range = matchName(item.name, query)
      return range ? [{ item, ...range }] : []
    })
    .sort((a, b) => a.from - b.from)
}
