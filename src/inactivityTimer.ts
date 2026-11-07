// 원본 와이어프레임: 90초 무조작 후 경고, 경고를 읽고 선택할 30초 보장.
export const IDLE_DELAY_MS = 90_000
export const IDLE_WARNING_MS = 30_000

export class InactivityTimer {
  private phase: 'active' | 'warning' | 'paused' | 'expired' = 'active'
  private deadline: number
  constructor(now: number, warning = false) {
    this.phase = warning ? 'warning' : 'active'
    this.deadline = now + (warning ? IDLE_WARNING_MS : IDLE_DELAY_MS)
  }
  reset(now: number) { this.phase = 'active'; this.deadline = now + IDLE_DELAY_MS }
  activity(now: number) { if (this.phase === 'active') this.deadline = now + IDLE_DELAY_MS }
  pause() { this.phase = 'paused' }
  resume(now: number) { if (this.phase === 'paused') this.reset(now) }
  poll(now: number): number | null {
    if (this.phase === 'paused') return null
    if (this.phase === 'active' && now >= this.deadline) {
      this.phase = 'warning'
      this.deadline = now + IDLE_WARNING_MS
    }
    if (this.phase === 'warning' && now >= this.deadline) this.phase = 'expired'
    if (this.phase === 'expired') return 0
    return this.phase === 'warning' ? Math.ceil((this.deadline - now) / 1000) : null
  }
}
