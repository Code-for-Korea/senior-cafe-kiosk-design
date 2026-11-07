// 기획 D-04: 음성 안내가 켜진 채 6~8초 동안 아무것도 누르지 않으면 지금 화면 안내를 한 번 더 읽는다(사용자 2026-10-21).
// 한 화면에 들어올 때마다 한 번만. 누르거나 스크롤하면 그 화면에서는 다시 읽지 않는다.
// ‘같은 문장은 한 주문에 한 번’ 규칙은 화면에 들어올 때 읽기에만 적용한다. 다시 온 화면이라 읽지 않았어도 머뭇거리면 한 번 읽는다.
export const IDLE_REPEAT_MS = 7000

export class IdleRepeat {
  private visit: string | null = null
  private done = false
  // 조용해진 때: 안내를 다 읽었거나, 읽을 것이 없이 화면에 들어온 때.
  private since: number | null = null

  // 새 화면(또는 대화상자)에 들어옴. 같은 화면이면 그대로 둔다.
  enter(visit: string) {
    if (visit === this.visit) return
    this.visit = visit
    this.done = false
    this.since = null
  }
  // 음성 안내를 다시 켬: 지금 화면을 새로 들어온 것처럼 센다.
  restart() {
    this.done = false
    this.since = null
  }
  speaking() { this.since = null }
  quiet(now: number) {
    if (!this.done && this.since === null) this.since = now
  }
  // 누름·키·스크롤: 손님이 움직이고 있으니 이 화면에서는 다시 읽지 않는다.
  input() {
    this.done = true
    this.since = null
  }
  due(now: number) {
    return !this.done && this.since !== null && now - this.since >= IDLE_REPEAT_MS
  }
  repeated() {
    this.done = true
    this.since = null
  }
}
