// 호출 요청의 수명과 고객이 보는 모달을 분리한다. 현재는 로컬 시연 상태다.
// late: 부른 뒤 STAFF_LATE_MS가 지나도 끝나지 않음(기획 G01-LATE·D-21, 사용자 2026-10-20).
// 기다리는 창이 열려 있으면 그 창이 ‘아직 직원이 오지 않았어요’로 바뀌고, 닫혀 있으면 끼어들지 않고 아래 알림 줄만 바뀐다.
export interface StaffCallState {
  pending: boolean
  late: boolean
  dialog: 'confirm' | 'waiting' | 'cancel' | null
}
export type StaffCallAction = 'open' | 'close' | 'request' | 'late' | 'askCancel' | 'cancel' | 'reset'
export const initialStaffCall: StaffCallState = { pending: false, late: false, dialog: null }
// 기획 권장 초안값. 매장 운영 조건에 따라 바꾼다.
export const STAFF_LATE_MS = 90_000
export function staffCallReducer(state: StaffCallState, action: StaffCallAction): StaffCallState {
  switch (action) {
    case 'open': return { ...state, dialog: state.pending ? 'waiting' : 'confirm' }
    case 'close': return { ...state, dialog: null }
    // 다시 부르기도 같은 요청: 기다림을 처음부터 다시 센다.
    case 'request': return { pending: true, late: false, dialog: 'waiting' }
    case 'late': return state.pending ? { ...state, late: true } : state
    case 'askCancel': return state.pending ? { ...state, dialog: 'cancel' } : state
    case 'cancel':
    case 'reset': return initialStaffCall
  }
}
// 직원이 오고 있는 동안(부른 뒤 STAFF_LATE_MS 안)만 시간 초과를 멈춘다(기획 G01·G02 ‘직원 부르기 선택 시 정지’).
// - 늦어지면 화면이 ‘카운터에 말씀해 주세요’라고 안내해 손님이 떠날 수 있다. 그때부터는 창이 열려 있어도 평소처럼 센다.
//   다시 부르면 late가 풀려 다시 멈춘다(사용자 2026-10-21 가안).
// - 부르기 전 ‘직원을 불러드릴까요?’ 창은 멈추지 않는다. 연 채 떠나도 첫 화면으로 돌아가게(사용자 2026-10-21).
export const staffCallPausesInactivity = (state: StaffCallState) => state.pending && !state.late
