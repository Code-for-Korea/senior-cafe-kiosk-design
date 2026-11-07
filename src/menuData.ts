/* 메뉴 데이터 · 화면 컴포넌트와 분리해 둔다 */

/* 줄이 넘어갈 때 '당류 28 g' 같은 항목이 통째로 넘어가게, 항목 안의 띄어쓰기를 안 끊기는 공백(\u00A0)으로 바꾼다.
   ' · ' 사이에서만 줄이 바뀐다 (2026-10-01 사용자: "단어 하나만 다음 줄로 넘어가지 않게") */
export const nb = (text: string) => text.replace(/ /g, '\u00A0')
const items = (...parts: string[]) => parts.map(nb).join('\u00A0· ') // 줄이 바뀌면 가운뎃점은 앞줄 끝에 남는다 (쉼표처럼)
// 일반/낮은 화면이 같은 필터 키와 순서를 사용한다. 표시 문구는 조건키와 분리한다.
export const temperatureFilters = ['전체', '따뜻함', '차가움', '디저트'] as const
export const temperatureFilterLabels: Record<TemperatureFilter, string> = {
  전체: '전체',
  차가움: '차가운 음료',
  따뜻함: '따뜻한 음료',
  디저트: '디저트',
}
// 952px 메뉴 탭 줄 안에서 문구 길이를 보정한 폭. 모두 8px 배수.
export const temperatureFilterWidths: Record<TemperatureFilter, number> = {
  전체: 176,
  차가움: 280,
  따뜻함: 280,
  디저트: 216,
}
export const kindFilters = ['모든 종류', '커피', '차·티', '스무디', '기타 음료'] as const
export const dessertFilters = ['조각케이크', '홀케이크', '빵·샌드위치'] as const
export type TemperatureFilter = typeof temperatureFilters[number]
export type KindFilter = typeof kindFilters[number]
export type DessertFilter = typeof dessertFilters[number]

export interface NutritionFacts {
  servingNote: string
  calories: number
  sugarsG: number
  proteinG?: number
  fatG?: number
  saturatedFatG?: number
  sodiumMg?: number
  caffeineMg?: number
}

export function nutritionRows(nutrition: NutritionFacts) {
  return [
    { label: '열량 (칼로리)', value: `${nutrition.calories} kcal` },
    { label: '당류', value: `${nutrition.sugarsG} g` },
    ...(nutrition.proteinG === undefined ? [] : [{ label: '단백질', value: `${nutrition.proteinG} g` }]),
    ...(nutrition.fatG === undefined ? [] : [{ label: '지방', value: `${nutrition.fatG} g` }]),
    ...(nutrition.saturatedFatG === undefined ? [] : [{ label: '포화지방', value: `${nutrition.saturatedFatG} g` }]),
    ...(nutrition.sodiumMg === undefined ? [] : [{ label: '나트륨', value: `${nutrition.sodiumMg} mg` }]),
    ...(nutrition.caffeineMg === undefined ? [] : [{ label: '카페인', value: `${nutrition.caffeineMg} mg` }]),
  ]
}

export interface MenuItem {
  id: string
  name: string
  price: string
  temp: ('hot' | 'cold')[]
  kind: KindFilter | '디저트'
  dessertKind?: DessertFilter
  emoji: string
  description?: string
  nutrition?: NutritionFacts // 지정된 시연 수치만 표시하며, 없는 값은 0으로 대체하지 않는다.
  info?: { label: string; value: string }[] // 상품 안내 · 시연용 데이터이며 화면에는 별도 예시 문구를 표시하지 않는다
  imageUrl?: string
  temperatureImages?: Partial<Record<'HOT' | 'COLD', string>>
  iceChoice?: boolean // 블렌딩 음료 등 얼음양을 별도로 고르지 않는 메뉴
  imagePosition?: string // 카드에서 사진을 자르는 위치 (CSS object-position)
}

export function priceNumber(price: string) {
  return Number(price.replace(/[^0-9]/g, '')) || 0
}

/* 사용자 지정 메뉴와 제공 사진을 사용한다.
   커피 기본가는 2026-10-04 파스쿠찌 공식 메뉴 확인값. 기존 설명·영양 안내와 디저트 가격은 시연 예시값.
   오렌지 루이보스는 2026-10-15 사용자 제공 가격·설명·성분표. 사진 출처는 public/assets/menu/CREDITS.md */
const menuDefinitions: MenuItem[] = [
  {
    id: '1', name: '아메리카노', price: '4,700원', temp: ['hot','cold'], kind: '커피', emoji: '☕',
    imageUrl: './assets/menu/americano-hot.jpg',
    temperatureImages: { HOT: './assets/menu/americano-hot.jpg', COLD: './assets/menu/americano-iced.jpg' },
    description: '에스프레소에 물을 더해 깔끔하게 마시는 커피예요.',
    nutrition: { servingNote: '1회 제공량(기본 크기) 기준 입니다.', calories: 10, sugarsG: 0 },
    info: [
      { label: '알레르기 안내', value: '알레르기를 일으키는 재료가 들어 있지 않아요.' },
    ],
  },
  {
    id: '2', name: '카페라떼', price: '5,200원', temp: ['hot','cold'], kind: '커피', emoji: '🥛',
    imageUrl: './assets/menu/cafe-latte-hot.jpg',
    temperatureImages: { HOT: './assets/menu/cafe-latte-hot.jpg', COLD: './assets/menu/cafe-latte-iced.jpg' },
    description: '에스프레소에 우유를 넣어 부드럽게 마시는 커피예요.',
    nutrition: { servingNote: '1회 제공량(기본 크기) 기준 입니다.', calories: 180, sugarsG: 13 },
    info: [
      { label: '알레르기 안내', value: '우유가 들어 있어요.' },
    ],
  },
  {
    id: '3', name: '녹차 스무디', price: '6,100원', temp: ['cold'], kind: '스무디', emoji: '🍵',
    imageUrl: './assets/menu/green-tea-granita.jpg', iceChoice: false,
    description: '녹차와 얼음을 곱게 갈아 시원하게 즐기는 음료예요.',
    // 상세 화면 구성을 위한 더미값. 실제 제품의 원재료·영양 정보가 아니다.
    nutrition: { servingNote: '1회 제공량(기본 크기) 기준 입니다.', calories: 320, sugarsG: 38 },
    info: [
      { label: '주요 재료', value: '녹차, 우유, 얼음, 휘핑크림' },
      { label: '알레르기 안내', value: '우유가 들어 있어요.' },
    ],
  },
  {
    id: '5', name: '딸기 스무디', price: '6,900원', temp: ['cold'], kind: '스무디', emoji: '🍓',
    imageUrl: './assets/menu/strawberry-smoothie.jpg', iceChoice: false,
    description: '이탈리아식 딸기 얼음 음료 위에 쫀득한 딸기 아이스크림을 올린 메뉴 입니다.',
    // 상세 화면 구성을 위한 더미값. 실제 제품의 원재료·영양 정보가 아니다.
    nutrition: { servingNote: '1회 제공량 기준 입니다.', calories: 280, sugarsG: 59, proteinG: 5, fatG: 11 },
    info: [
      { label: '주요 재료', value: '딸기, 우유, 얼음' },
      { label: '알레르기 안내', value: '우유가 들어 있어요.' },
    ],
  },
  {
    id: '6', name: '오렌지 루이보스', price: '5,100원', temp: ['hot', 'cold'], kind: '차·티', emoji: '🍵',
    imageUrl: './assets/menu/rooibos-hot.png',
    temperatureImages: { HOT: './assets/menu/rooibos-hot.png', COLD: './assets/menu/rooibos-iced.png' },
    description: '오렌지 껍질과 초콜릿 향이 어우러져 달콤하게 즐기는 카페인 없는 루이보스 티',
    nutrition: { servingNote: '총 내용량 350 g 기준 입니다.', calories: 0, sugarsG: 0, proteinG: 0, saturatedFatG: 0, sodiumMg: 25, caffeineMg: 0 },
    info: [{ label: '알레르기 유발성분', value: '-' }],
  },
  {
    id: '4', name: '딸기케이크', price: '6,500원', temp: [], kind: '디저트', dessertKind: '조각케이크', emoji: '🍰',
    imageUrl: './assets/menu/strawberry-cake-new.jpg',
    description: '부드러운 생크림과 상큼한 딸기를 올린 조각케이크예요.',
    nutrition: { servingNote: '1회 제공량(1조각 · 120 g) 기준 입니다.', calories: 385, sugarsG: 26 },
    info: [
      { label: '알레르기 안내', value: '우유, 계란, 밀, 대두가 들어 있어요.' },
      { label: '원산지', value: items('밀가루(밀: 미국·캐나다산)', '딸기(국산)') },
    ],
  },
]

// 낮은 화면·상품정보 모달의 기존 요약도 같은 영양 데이터에서 만든다.
export const menuItems: MenuItem[] = menuDefinitions.map(item => ({
  ...item,
  info: [
    ...(item.info ?? []),
    ...(item.nutrition ? [{
      label: '영양 정보',
      value: items(item.nutrition.servingNote, ...nutritionRows(item.nutrition).map(row => `${row.label} ${row.value}`)),
    }] : []),
  ],
}))

// 전체·검색 목록에서는 대표 사진(커피는 손잡이 컵), 온도가 정해지면 그 온도의 사진.
export function menuImage(item: MenuItem, temperature: 'HOT' | 'COLD' | null = null) {
  return (temperature && item.temperatureImages?.[temperature]) || item.imageUrl
}

// 전체·검색에서는 제공 온도를 모두, 온도별 목록에서는 해당 온도만 표시한다.
export function menuTemperatures(item: MenuItem, temperature: 'HOT' | 'COLD' | null = null) {
  return item.temp.filter(temp => !temperature || temp === (temperature === 'HOT' ? 'hot' : 'cold'))
}

export function hasCaffeineChoice(item?: MenuItem) {
  return !item || item.kind === '커피'
}

export function hasIceChoice(item?: MenuItem) {
  return !item || (item.kind !== '디저트' && item.iceChoice !== false)
}

export function canEditOption(item: MenuItem, option: 'temperature' | 'size' | 'caffeine' | 'ice') {
  if (item.kind === '디저트') return false
  if (option === 'temperature') return item.temp.length > 1
  if (option === 'caffeine') return hasCaffeineChoice(item)
  if (option === 'ice') return hasIceChoice(item)
  return true
}

// 선택한 온도에서 실제 주문할 메뉴가 있는 하위 카테고리만 표시한다.
export function availableKindFilters(temperature: TemperatureFilter, catalog: readonly MenuItem[] = menuItems) {
  return kindFilters.filter(kind => kind === '모든 종류' || catalog.some(item =>
    item.kind === kind && (temperature === '따뜻함' ? item.temp.includes('hot') : temperature === '차가움' ? item.temp.includes('cold') : true),
  ))
}

export function availableDessertFilters(catalog: readonly MenuItem[] = menuItems) {
  return dessertFilters.filter(kind => catalog.some(item => item.kind === '디저트' && item.dessertKind === kind))
}
