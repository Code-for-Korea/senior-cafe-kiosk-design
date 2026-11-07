import tokens from './tokens.json'

const { font, typography } = tokens
export type TypeRole = keyof typeof typography.normal

// Pure resolver: all existing text modes retain their original metrics.
export function resolveTypography(largeText: boolean, source: 'figma' | 'legacy') {
  const figmaTypography = largeText && source === 'figma'
  const roles = typography[figmaTypography ? 'figma' : largeText ? 'large' : 'normal']
  const style = (role: TypeRole) => ({
    fontFamily: source === 'figma' ? font.figmaFamily : font.family,
    lineHeight: typography.lineHeight[figmaTypography ? 'figma' : 'normal'], ...roles[role],
    ...(figmaTypography && role === 'title' ? { letterSpacing: typography.titleTracking } : null),
  })
  // 큰 글씨에서 36으로 올려 읽는 글(사용자 2026-10-20). 쓰는 곳: 장바구니, 고른 내용 확인의 항목 이름,
  // 직원 부르기·기다리는 창, 현금 금액 줄과 그 위 설명, 메뉴 아래 스크롤 안내, 이용 방법 화면 안내 문구(2026-10-22). 기본 글씨는 원래 크기 그대로.
  const readable = <S extends { fontSize: number }>(s: S): S =>
    largeText ? { ...s, fontSize: Math.max(s.fontSize, typography.largeReadableSize) } : s
  return {
    largeText, figmaTypography, readable,
    title: style('title'), primary: style('primary'), body: style('body'),
    info: style('info'), caption: style('caption'),
    bodyButton: { ...style('body'), fontWeight: font.semibold,
      ...(figmaTypography ? { fontSize: typography.bodyButtonSize, lineHeight: typography.lineHeight.control, letterSpacing: typography.controlTracking } : null) },
    navigation: { ...style('body'), ...(!largeText ? { fontSize: typography.smallNavigationSize } : null),
      ...(figmaTypography ? { fontSize: typography.navigationSize, lineHeight: typography.lineHeight.control, letterSpacing: typography.controlTracking } : null) },
    price: { ...style('primary'), fontWeight: font.medium },
    // 본문 줄 옆에서 강조하는 값(위쪽 가격·수량 줄 가격·장바구니 이용 방법과 총 개수).
    // 기본 글씨는 본문 크기, 큰 글씨는 주요 글자 크기.
    inlineValue: { ...style(largeText ? 'primary' : 'body'), fontWeight: font.semibold },
    inlinePrice: { ...style(largeText ? 'primary' : 'body'), fontWeight: font.medium },
  }
}
