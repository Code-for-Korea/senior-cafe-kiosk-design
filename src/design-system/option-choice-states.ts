import type { SelectionState } from '../components/selectionCardStyles'

/** 대표 검수 사례. 모든 지원 조합이나 실제 화면 사용 여부를 뜻하지 않는다. */
export const optionChoiceReviewStates: ReadonlyArray<SelectionState & { name: string; slot: boolean; note: string }> = [
  { name: '01 선택 전', selected: false, original: false, disabled: false, slot: false, note: '누를 수 있음 · 체크 없음' },
  { name: '02 현재 선택', selected: true, original: false, disabled: false, slot: false, note: '선택색 + 테두리 + 체크' },
  { name: '03 사용 불가', selected: false, original: false, disabled: true, slot: false, note: '컴포넌트 지원 · 실제 사용 조건 미정' },
  { name: '04 기존 선택', selected: false, original: true, disabled: false, slot: true, note: '수정 시작 때의 값 · 현재는 다른 값을 선택' },
  { name: '05 기존 + 현재 선택', selected: true, original: true, disabled: false, slot: true, note: '처음 값이 현재 선택과 같음' },
]
