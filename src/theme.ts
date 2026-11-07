/* 공통 컴포넌트의 색상 역할. 실제 값은 colorSystem.ts에서 일반/HC별로 정한다. */
import { colors } from './tokens'

export interface Theme {
  /* surface */
  page: string             // --color-page
  surface: string          // --color-surface (카드·판)
  /* action */
  actionPrimary: string          // --color-action-primary · Primary CTA 바탕, Secondary 선·글자
  actionPrimaryText: string      // Primary CTA 글자
  /* state */
  stateCurrent: string           // --color-state-current · 진행 단계 현재 칸
  stateCurrentText: string       // 그 위의 글자
  stateSelected: string          // --color-state-selected · 고른 필터·카드·줄의 바탕
  stateSelectedBorder: string    // 그 선
  stateSelectedText: string      // 그 글자
  filterSelectedBorder: string   // 하단 칩의 연한 선택 테두리
  /* 온도 강조 (필터 탭·카드) 와 사진 위 온도 배지 */
  hot: string; hotLight: string; hotText: string
  cold: string; coldLight: string; coldText: string
  badgeHotBg: string; badgeHotText: string; badgeColdBg: string; badgeColdText: string
  /* neutral */
  borderNeutral: string    // --color-border-neutral · 버튼 선
  borderSubtle: string     // --color-border-subtle · 필터처럼 약하게 그을 선
  hairline: string         // --color-hairline · 카드 경계가 모자랄 때만
  panelBorder: string      // 장바구니처럼 흰 판의 가장자리 (1px hairline · 면 차이로 구분)
  shadowCard: string       // --shadow-card
  disabledBg: string
  disabledText: string
}

export const brandTheme: Theme = {
  page: 'var(--bg-page)', surface: 'var(--bg-surface)',
  actionPrimary: 'var(--accent)', actionPrimaryText: 'var(--text-on-accent)',
  stateCurrent: 'var(--state-current)', stateCurrentText: 'var(--text-on-current)',
  stateSelected: 'var(--state-selected)', stateSelectedBorder: 'var(--state-selected-border)', stateSelectedText: 'var(--state-selected-text)',
  filterSelectedBorder: 'var(--filter-selected-border)',
  hot: 'var(--state-selected-border)', hotLight: 'var(--state-selected)', hotText: 'var(--state-selected-text)',
  cold: 'var(--state-selected-border)', coldLight: 'var(--state-selected)', coldText: 'var(--state-selected-text)',
  badgeHotBg: 'var(--badge-hot-bg)', badgeHotText: 'var(--badge-hot-text)',
  badgeColdBg: 'var(--badge-cold-bg)', badgeColdText: 'var(--badge-cold-text)',
  borderNeutral: 'var(--border-default)', borderSubtle: 'var(--border-subtle)', hairline: 'var(--border-subtle)',
  panelBorder: '1px solid var(--border-subtle)',
  shadowCard: '0 0 8px rgba(0, 0, 0, 0.10), 0 6px 20px rgba(0, 0, 0, 0.12)',
  disabledBg: colors.bgDisabled, disabledText: colors.textDisabled,
}
