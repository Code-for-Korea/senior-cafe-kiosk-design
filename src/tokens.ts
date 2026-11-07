import designTokens from './design-system/tokens.json'

/* 색 값은 colorSystem.ts의 의미 토큰을 따른다. HC도 같은 컴포넌트에서 전환한다. */
export const colors = {
  textPrimary: 'var(--text-primary)', textSecondary: 'var(--text-secondary)',
  textDisabled: 'var(--text-disabled)', textWhite: 'var(--text-on-accent)',
  borderDefault: 'var(--border-default)',
  bgPage: 'var(--bg-page)', bgSurface: 'var(--bg-surface)', bgDisabled: 'var(--bg-disabled)',
  hot: 'var(--state-selected-border)', hotLight: 'var(--state-selected)',
  iconBrand: 'var(--icon-brand)', iconNeutral: 'var(--icon-neutral)', danger: 'var(--error)',
  badgeHotBg: 'var(--badge-hot-bg)', badgeHotText: 'var(--badge-hot-text)',
} as const

// 같은 토큰을 TS 컴포넌트와 생성된 CSS, Figma 인계 자료에서 함께 사용한다.
export const { radius, space, font } = designTokens

// 메뉴 온도 배지와 기존 선택 칩이 공유하는 규격.
export const badgeMetrics = designTokens.badge
