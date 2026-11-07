/* 개발·캡처용 주소 옵션. 예: ?screen=size&product=1&temp=COLD&capture=1 */
const params = new URLSearchParams(window.location.search)

function pick<T extends string>(key: string, allowed: readonly T[]): T | null {
  const value = params.get(key)
  return allowed.includes(value as T) ? (value as T) : null
}

export const devParams = {
  // 로컬 경고 배너 검증 전용. 공개 빌드에서는 오류를 강제로 만들지 않는다.
  voiceFailure: import.meta.env.DEV && params.get('voiceFailure') === '1',
  // 기본 주소도 같은 시연 프레임을 사용한다. 개발용 화면 탭은 명시적으로만 연다.
  previewFrame: params.get('preview') !== 'dev',
  languageBar: pick('languageBar', ['gray', 'charcoal']),
  // 채택한 2안은 일반 주소에서도 기본 사용. 다른 안은 명시적 비교 주소에서만 표시한다.
  utilityVariant: pick('utility', ['vertical', 'horizontal', 'compact']) ?? 'horizontal',
  // 채택한 아이콘·한 줄 배치를 기본으로, 과거 안은 비교 화면에서만 명시한다.
  compactCards: params.get('cards') !== 'classic',
  // Figma 캡처 주소(#figmacapture=…)로 열면 자동으로 캡처 모드가 된다.
  capture: params.has('capture') || window.location.hash.includes('figmacapture'),
  screen: pick('screen', ['attract', 'method', 'menu', 'product', 'temperature', 'size', 'caffeine', 'ice', 'review', 'cart']),
  productId: params.get('product'),
  // 채택한 상품상세 가로 배치 2안. 이전 세로 배치는 비교 주소에서만 표시한다.
  productLayout: pick('productLayout', ['stacked', 'split']) ?? 'split',
  temperature: pick('temp', ['HOT', 'COLD']),
  sizeCode: pick('size', ['S', 'M', 'L']),
  caffeineType: pick('caffeine', ['CAFFEINATED', 'DECAF']),
  iceAmount: pick('ice', ['NORMAL', 'LESS', 'NONE']),
  // 기본 글씨로 시작한다(기획 사용자 흐름 ‘글자 크기 기본 = 기본 글자’, 사용자 2026-10-21). 큰 글씨로 시작하려면 ?large=1.
  largeText: params.get('large') === '1',
  // 채택한 B안을 큰 글씨 기본으로 사용. 이전 A안은 명시적 비교 주소에서만 표시.
  typography: pick('typography', ['figma', 'legacy']) ?? 'figma',
  cartOption: pick('cartOption', ['temperature', 'size', 'caffeine', 'ice']),
  // 기본값으로 주문하는 흐름으로 시작 (?mode=default)
  orderMode: pick('mode', ['default', 'custom']),
  // 장바구니에 미리 담아 둘 메뉴 번호 (?cart=1,3) · 메뉴 화면의 장바구니 막대를 캡처할 때 쓴다
  cartIds: (params.get('cart') ?? '').split(',').filter(Boolean),
  // 품절로 시작할 메뉴 번호 (?soldout=2) · 화면 밖 '시연: 카페라떼 품절'로도 켜고 끈다
  soldOutIds: (params.get('soldout') ?? '').split(',').filter(Boolean),
  // 메뉴를 받는 상태로 시작 (?menuload=loading · 10초 뒤 불러오지 못함 / failed · 바로 불러오지 못함)
  menuLoad: pick('menuload', ['loading', 'failed']),
  // 디저트가 하나도 없는 날처럼 보이기 (?empty=dessert · 디저트 탭의 ‘조건에 맞는 메뉴가 없어요’)
  emptyDessert: params.get('empty') === 'dessert',
  // 직원을 부른 지 오래된 상태로 시작 (?staff=late · ‘아직 직원이 오지 않았어요’ 창)
  staffLate: params.get('staff') === 'late',
  // 현금 장치를 쓸 수 없는 상태로 시작 (?cash=off · 결제 방법의 현금 칸이 잠긴다)
  cashOff: params.get('cash') === 'off',
  // 메뉴 검색 창을 연 채로 시작 (?search=1), 검색어를 미리 넣기 (?q=카페)
  searchOpen: params.has('search'),
  searchText: params.get('q') ?? '',
  // 찾은 메뉴를 고른 상태로 시작 (?pick=2 · 메뉴 번호)
  searchPick: params.get('pick'),
  // 메뉴 카드를 누른 상태로 멈춰 둔다 (?card=2 · 메뉴 번호)
  cardPick: params.get('card'),
  // 옵션 화면을 ‘선택을 바꾸고 있어요’ 수정 모드로 열기 (?edit=1 · 화면 확인용, 끝내면 장바구니로)
  editMode: params.has('edit'),
  // 대화상자를 연 채로 시작 (?dialog=home · 처음으로 / method · 식사 장소 / cancel · 변경 취소 / staff · 직원 호출 / idle · 시간 초과 경고)
  dialog: pick('dialog', ['home', 'method', 'cancel', 'staff', 'idle']),
  // 스크롤 구역을 끝까지 내린 채로 시작 (?scroll=end · 상품 정보의 아래쪽 안내를 캡처할 때)
  scrollEnd: params.get('scroll') === 'end',
  // 고대비(?hc=1)·낮은 화면(?low=1)으로 시작. 새 주문이 되면 큰 글씨(largeText)와 함께 이 시작 값으로 돌아간다(App returnHome).
  highContrast: params.get('hc') === '1',
  lowScreen: params.get('low') === '1' || params.get('compare') === 'low-method',
  // 카드 결제를 Toss 테스트 결제창으로 연결한다. ?toss=off 면 기존 카드 시뮬레이터로 되돌린다(오프라인·키 없는 점검용).
  tossCard: params.get('toss') !== 'off',
}
