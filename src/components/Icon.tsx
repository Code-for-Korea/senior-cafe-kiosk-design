/* 아이콘 모음
   공통 동작 아이콘: 제공된 Figma 배리어프리 시스템 원본 SVG.
   음료 전용 그림: 기존 KRDS / Elastic UI / 직접 그림 유지.
   색은 currentColor 대신 값을 직접 넣는다 (Figma 캡처에서 색이 빠지지 않도록). */
import { colors, font } from '../tokens'
import { useId, type CSSProperties } from 'react'
import { assetUrl } from '../assetUrl'

export type IconName =
  | 'home' | 'search'                 // Figma / KRDS
  | 'bell' | 'contrast' | 'snowflake' // Figma / Elastic UI
  | 'plus' | 'minus'
  | 'speaker'                         // Figma
  | 'lowScreen' | 'hotCup' | 'close'  // Figma / 음료 전용 그림
  | 'trash' | 'chevronRight'          // 직접 그림 / Figma
  | 'bean' | 'beanOff'                // 직접 그림 · 카페인 있음 / 디카페인
  | 'cupSize' | 'iceCube' | 'pencil'  // 직접 그림 · 선택한 것 줄, 수정 모드
  | 'iceCupFull' | 'iceCupLess' | 'iceCupNone' // 직접 그림 · 얼음 양
  | 'cupS' | 'cupM' | 'cupL'          // 와이어프레임의 컵 그림 (public/assets/*.svg)
  | 'dineIn' | 'takeOut' | 'personalCup'              // 사용자 제공 머그 / 자체 제작 포장 봉투
  | 'info'                            // 원형 정보 안내
  | 'textSize'                        // 글자로 표시

interface Props {
  name: IconName
  size?: number
  color?: string
  optical?: 'choice' | 'summary' | 'utility'
}

// 비교 개선안 전용 광학 보정. 바깥 상자 크기는 역할별로 고정하고,
// 그림의 실제 외곽·원본 여백·무게중심에 맞춰 내부 좌표만 보정한다.
// 컵 S/M/L은 용량 차이를 설명하므로 원래 그림 크기의 차이를 유지한다.
const opticalViewBoxes: Partial<Record<IconName, string>> = {
  hotCup: '-0.2 -0.6 24.5 24.5',
  snowflake: '-1.5 -1.5 19 19',
  bean: '0.5 0.5 23 23',
  beanOff: '0.5 0.5 23 23',
  cupSize: '0.5 1.15 23 23',
  iceCube: '0 0 24 24',
  iceCupFull: '0.5 -1 23 23',
  iceCupLess: '0.5 -1 23 23',
  iceCupNone: '0.5 -1 23 23',
}

const line = (c: string, width: number) => ({
  stroke: c, strokeWidth: width, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

// 원본 프레임/내부 여백을 보존하고 단색 마스크로 기본·고대비 색을 적용한다.
const systemIcons = {
  plus: assetUrl('assets/figma-system/plus40.svg'),
  minus: assetUrl('assets/figma-system/minus40.svg'),
  chevronRight: assetUrl('assets/figma-system/chevronRight.svg'),
  close: assetUrl('assets/figma-system/close.svg'),
  contrast: assetUrl('assets/figma-system/contrast.svg'),
  home: assetUrl('assets/figma-system/home.svg'),
  speaker: assetUrl('assets/figma-system/speaker.svg'),
  lowScreen: assetUrl('assets/figma-system/lowScreen.svg'),
  bell: assetUrl('assets/figma-system/bell.svg'),
} as const

// dineIn: 사용자 제공 Dine-in.svg의 path/viewBox 유지(편집기 metadata 제외).
// takeOut: NIA 단색 면·32px 프레임 규칙을 참고한 자체 제작 자산.
const customIcons = {
  dineIn: assetUrl('assets/custom-icons/dineIn.svg'),
  takeOut: assetUrl('assets/custom-icons/takeOut.svg'),
  personalCup: assetUrl('assets/custom-icons/personalCup.svg'),
} as const
const assetIcons = { ...systemIcons, ...customIcons }
type AssetIconName = keyof typeof assetIcons
const isAssetIcon = (name: IconName): name is AssetIconName => name in assetIcons

const icons: Record<Exclude<IconName, 'textSize' | AssetIconName>, { viewBox: string; body: (c: string) => React.ReactNode }> = {
  info: {
    viewBox: '0 0 24 24',
    body: c => <>
      <circle cx="12" cy="12" r="9" fill="none" {...line(c, 1.6)} />
      <circle cx="12" cy="7.5" r="1" fill={c} />
      <path d="M12 11V17" {...line(c, 1.8)} />
    </>,
  },
  search: {
    viewBox: '0 0 24 24',
    body: (c) => <path fill={c} fillRule="evenodd" clipRule="evenodd" d="M3.99844 10.9004C3.99844 7.08963 7.08767 4.00039 10.8984 4.00039C14.7092 4.00039 17.7984 7.08963 17.7984 10.9004C17.7984 12.7135 17.0991 14.3632 15.9555 15.5947C15.8799 15.6322 15.809 15.6825 15.746 15.7455C15.6829 15.8086 15.6326 15.8796 15.595 15.9554C14.3633 17.1002 12.7126 17.8004 10.8984 17.8004C7.08767 17.8004 3.99844 14.7112 3.99844 10.9004ZM16.318 17.4489C14.8468 18.6678 12.9582 19.4004 10.8984 19.4004C6.20402 19.4004 2.39844 15.5948 2.39844 10.9004C2.39844 6.20597 6.20402 2.40039 10.8984 2.40039C15.5929 2.40039 19.3984 6.20597 19.3984 10.9004C19.3984 12.9589 18.6667 14.8465 17.4491 16.3173L20.7662 19.6343C21.0786 19.9468 21.0786 20.4533 20.7662 20.7657C20.4538 21.0781 19.9473 21.0781 19.6348 20.7657L16.318 17.4489Z" />,
  },
  snowflake: {
    viewBox: '0 0 16 16',
    body: (c) => <path fill={c} fillRule="evenodd" clipRule="evenodd" transform="translate(0.5 0.5)" d="M7.00667 0.5C7.00667 0.223858 7.23053 0 7.50667 0C7.78282 0 8.00667 0.223858 8.00667 0.5V2.52355C8.10561 2.46642 8.1967 2.39094 8.2749 2.2971L9.30247 1.06401C9.47926 0.851873 9.79454 0.823211 10.0067 0.999993C10.2188 1.17678 10.2475 1.49206 10.0707 1.7042L8.2749 3.85915C8.1967 3.95299 8.10561 4.02847 8.00667 4.0856V6.63398L10.2136 5.35979C10.2136 5.24554 10.2335 5.12891 10.2756 5.01428L11.244 2.38159C11.3393 2.12243 11.6267 1.98961 11.8858 2.08494C12.145 2.18026 12.2778 2.46764 12.1825 2.7268L11.6284 4.23325C11.5862 4.34789 11.5664 4.46451 11.5664 4.57876L13.3188 3.56699C13.558 3.42892 13.8638 3.51085 14.0018 3.75C14.1399 3.98915 14.058 4.29494 13.8188 4.43301L12.0664 5.44479C12.1653 5.50191 12.2762 5.54305 12.3966 5.56385L13.9783 5.83721C14.2504 5.88424 14.4329 6.14295 14.3858 6.41506C14.3388 6.68717 14.0801 6.86963 13.808 6.82261L11.0438 6.34488C10.9235 6.32408 10.8126 6.28293 10.7136 6.22581L8.50668 7.5L10.7136 8.77419C10.8126 8.71707 10.9235 8.67592 11.0438 8.65512L13.808 8.17739C14.0801 8.13037 14.3388 8.31283 14.3858 8.58494C14.4329 8.85705 14.2504 9.11576 13.9783 9.16279L12.3966 9.43615C12.2763 9.45695 12.1653 9.49809 12.0664 9.55521L13.8188 10.567C14.058 10.7051 14.1399 11.0109 14.0018 11.25C13.8638 11.4891 13.558 11.5711 13.3188 11.433L11.5664 10.4212C11.5664 10.5355 11.5862 10.6521 11.6284 10.7667L12.1825 12.2732C12.2778 12.5324 12.145 12.8197 11.8858 12.9151C11.6267 13.0104 11.3393 12.8776 11.244 12.6184L10.2756 9.98572C10.2335 9.87109 10.2136 9.75446 10.2136 9.64021L8.00667 8.36602V10.9144C8.10561 10.9715 8.1967 11.047 8.2749 11.1408L10.0707 13.2958C10.2475 13.5079 10.2188 13.8232 10.0067 14C9.79454 14.1768 9.47926 14.1481 9.30247 13.936L8.2749 12.7029C8.1967 12.6091 8.10561 12.5336 8.00667 12.4765V14.5C8.00667 14.7761 7.78282 15 7.50667 15C7.23053 15 7.00667 14.7761 7.00667 14.5V12.4765C6.90774 12.5336 6.81665 12.6091 6.73845 12.7029L5.71088 13.936C5.5341 14.1481 5.21881 14.1768 5.00668 14C4.79454 13.8232 4.76588 13.5079 4.94266 13.2958L6.73845 11.1408C6.81665 11.047 6.90774 10.9715 7.00667 10.9144V8.36603L4.79972 9.64022C4.79971 9.75446 4.77989 9.87109 4.73772 9.98572L3.76937 12.6184C3.67405 12.8776 3.38667 13.0104 3.12751 12.9151C2.86834 12.8197 2.73552 12.5324 2.83085 12.2732L3.38495 10.7668C3.42711 10.6521 3.44694 10.5355 3.44694 10.4212L1.6945 11.433C1.45535 11.5711 1.14955 11.4891 1.01148 11.25C0.873411 11.0109 0.955349 10.7051 1.1945 10.567L2.94694 9.55522C2.848 9.4981 2.73708 9.45695 2.61673 9.43615L1.03505 9.16279C0.762938 9.11576 0.580475 8.85705 0.627503 8.58494C0.674531 8.31283 0.933243 8.13037 1.20535 8.1774L3.9695 8.65513C4.08986 8.67593 4.20077 8.71707 4.29971 8.77419L6.50668 7.5L4.29972 6.22581C4.20077 6.28293 4.08986 6.32407 3.9695 6.34487L1.20535 6.8226C0.933245 6.86963 0.674534 6.68717 0.627505 6.41506C0.580477 6.14295 0.76294 5.88424 1.03505 5.83721L2.61673 5.56385C2.73709 5.54305 2.848 5.5019 2.94694 5.44478L1.1945 4.43301C0.955351 4.29494 0.873413 3.98915 1.01149 3.75C1.14956 3.51085 1.45535 3.42891 1.6945 3.56699L3.44694 4.57876C3.44694 4.46451 3.42711 4.34788 3.38495 4.23325L2.83085 2.7268C2.73552 2.46763 2.86834 2.18026 3.12751 2.08493C3.38667 1.9896 3.67405 2.12242 3.76937 2.38159L4.73772 5.01428C4.77989 5.12891 4.79971 5.24554 4.79972 5.35978L7.00667 6.63397V4.0856C6.90774 4.02847 6.81665 3.95299 6.73845 3.85915L4.94266 1.7042C4.76588 1.49206 4.79454 1.17678 5.00668 0.999993C5.21881 0.823211 5.5341 0.851874 5.71088 1.06401L6.73845 2.2971C6.81665 2.39094 6.90774 2.46642 7.00667 2.52354V0.5Z" />,
  },
  trash: {
    viewBox: '0 0 24 24',
    // 내부 세로선을 생략한 단순 실루엣: 뚜껑과 몸통만 구분한다.
    body: (c) => <path fill={c} d="M9 3H15V5H20V7H4V5H9V3ZM6 9H18L17.2 19.2C17.1 20.2 16.3 21 15.3 21H8.7C7.7 21 6.9 20.2 6.8 19.2L6 9Z" />,
  },
  bean: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <ellipse cx="12" cy="12" rx="6.2" ry="9" transform="rotate(-32 12 12)" {...line(c, 2)} />
        <path {...line(c, 2)} d="M8.4 5.6C12.4 8.6 10.6 14.6 15.6 18.4" />
      </>
    ),
  },
  beanOff: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <ellipse cx="12" cy="12" rx="6.2" ry="9" transform="rotate(-32 12 12)" {...line(c, 2)} />
        <path {...line(c, 2)} d="M8.4 5.6C12.4 8.6 10.6 14.6 15.6 18.4" />
        <path {...line(c, 2.4)} d="M3.5 20.5L20.5 3.5" />
      </>
    ),
  },
  cupSize: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 2)} d="M6.4 8L8 20C10.6 21.2 13.4 21.2 16 20L17.6 8" />
        <path {...line(c, 2)} d="M4.8 8H19.2L18 4.4H6L4.8 8Z" />
      </>
    ),
  },
  iceCube: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 2)} d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
        <path {...line(c, 2)} d="M12 12L20 7.5M12 12L4 7.5M12 12V21" />
      </>
    ),
  },
  pencil: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 2)} d="M4 20L8.5 19L19.5 8L16 4.5L5 15.5L4 20Z" />
        <path {...line(c, 2)} d="M13.5 7L17 10.5" />
      </>
    ),
  },
  /* 얼음 양 · 빨대를 꽂은 유리잔에 얼음이 많이 / 조금 / 없이 */
  iceCupFull: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 1.6)} d="M5.5 4.5L7.3 20.6C10.4 21.8 13.6 21.8 16.7 20.6L18.5 4.5" />
        <path {...line(c, 1.6)} d="M4.6 4.5H19.4" />
        <path {...line(c, 1.6)} d="M16.6 1.4L13.4 9.6" />
        <path {...line(c, 1.4)} d="M6.4 9.4C8.2 8.4 10 8.4 12 9.4S15.8 10.4 17.6 9.4" />
        <rect x="8.0" y="10.8" width="3.4" height="3.4" rx="0.7" transform="rotate(8 9.7 12.5)" {...line(c, 1.4)} />
        <rect x="12.6" y="10.6" width="3.4" height="3.4" rx="0.7" transform="rotate(8 14.299999999999999 12.299999999999999)" {...line(c, 1.4)} />
        <rect x="9.4" y="14.9" width="3.4" height="3.4" rx="0.7" transform="rotate(8 11.1 16.6)" {...line(c, 1.4)} />
        <rect x="13.8" y="15.1" width="3.4" height="3.4" rx="0.7" transform="rotate(8 15.5 16.8)" {...line(c, 1.4)} />
      </>
    ),
  },
  iceCupLess: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 1.6)} d="M5.5 4.5L7.3 20.6C10.4 21.8 13.6 21.8 16.7 20.6L18.5 4.5" />
        <path {...line(c, 1.6)} d="M4.6 4.5H19.4" />
        <path {...line(c, 1.6)} d="M16.6 1.4L13.4 9.6" />
        <path {...line(c, 1.4)} d="M6.4 9.4C8.2 8.4 10 8.4 12 9.4S15.8 10.4 17.6 9.4" />
        <rect x="9.0" y="12.4" width="3.4" height="3.4" rx="0.7" transform="rotate(8 10.7 14.1)" {...line(c, 1.4)} />
        <rect x="13.2" y="15.0" width="3.4" height="3.4" rx="0.7" transform="rotate(8 14.899999999999999 16.7)" {...line(c, 1.4)} />
      </>
    ),
  },
  iceCupNone: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 1.6)} d="M5.5 4.5L7.3 20.6C10.4 21.8 13.6 21.8 16.7 20.6L18.5 4.5" />
        <path {...line(c, 1.6)} d="M4.6 4.5H19.4" />
        <path {...line(c, 1.6)} d="M16.6 1.4L13.4 9.6" />
        <path {...line(c, 1.4)} d="M6.4 9.4C8.2 8.4 10 8.4 12 9.4S15.8 10.4 17.6 9.4" />
      </>
    ),
  },
  cupS: {
    viewBox: '0 0 174 252',
    body: (c) => <path {...line(c, 3.3)} d="M25.6857 46.4571L38.1143 232.886C70.7048 239.514 103.295 239.514 135.886 232.886L148.314 46.4571M30.6571 29.8857L36.4571 11.6571H137.543L143.343 29.8857M17.4 46.4571H156.6L150.8 29.8857H23.2L17.4 46.4571Z" />,
  },
  cupM: {
    viewBox: '0 0 192 279',
    body: (c) => <path {...line(c, 3.66)} d="M28.3429 51.7286L42.0571 257.443C78.019 264.757 113.981 264.757 149.943 257.443L163.657 51.7286M33.8286 33.4429L40.2286 13.3286H151.771L158.171 33.4429M19.2 51.7286H172.8L166.4 33.4429H25.6L19.2 51.7286Z" />,
  },
  cupL: {
    viewBox: '0 0 207 300',
    body: (c) => <path {...line(c, 3.94)} d="M30.5571 55.3714L45.3429 277.157C84.1143 285.043 122.886 285.043 161.657 277.157L176.443 55.3714M36.4714 35.6571L43.3714 13.9714H163.629L170.529 35.6571M20.7 55.3714H186.3L179.4 35.6571H27.6L20.7 55.3714Z" />,
  },
  hotCup: {
    viewBox: '0 0 24 24',
    body: (c) => (
      <>
        <path {...line(c, 2)} d="M3.5 10H16.5V15.5C16.5 18.2614 14.2614 20.5 11.5 20.5H8.5C5.73858 20.5 3.5 18.2614 3.5 15.5V10Z" />
        <path {...line(c, 2)} d="M16.5 11.8H18C19.6569 11.8 21 13.1431 21 14.8C21 16.4569 19.6569 17.8 18 17.8H16" />
        <path {...line(c, 2)} d="M7.5 2.8C7.5 4.2 8.7 4.5 8.7 5.9C8.7 6.6 8.3 7.1 7.9 7.4M12 2.8C12 4.2 13.2 4.5 13.2 5.9C13.2 6.6 12.8 7.1 12.4 7.4" />
      </>
    ),
  },
}

// 음료 선택용 신규 그림: Figma 공통 아이콘의 단색 면 표현을 따른다.
// Figma 원본 자산과 구분하며, 요약 줄의 작은 아이콘은 기존 형태를 유지한다.
const filledCup = (c: string) => <path fill={c} d="M8 11H24L22.2 27.1C22.1 28.2 21.2 29 20.1 29H11.9C10.8 29 9.9 28.2 9.8 27.1L8 11ZM7 6H25L26 9H6L7 6ZM10 3H22L23 4.5H9L10 3Z" />
const filledBean = (c: string) => <g fill={c}>
  <path d="M20.6 3.4C15.5 1.9 9.7 5.4 6.6 10.7C2.9 17 4 24 8.7 27C11.8 23.5 12.6 20.1 13.1 16.9C13.8 11.9 15.8 7.9 20.6 3.4Z" />
  <path d="M23.1 5C19.5 8.5 16.4 12.2 15.9 17.4C15.4 21.4 14.3 24.8 11.3 28.3C16.5 30 22.2 26.2 25.3 21C29 14.7 27.9 8 23.1 5Z" />
</g>
const iceGlass = (c: string, holes: string) => <path fill={c} fillRule="evenodd" d={
  'M6 5H26L23.9 27.2C23.8 28.2 23 29 22 29H10C9 29 8.2 28.2 8.1 27.2L6 5Z ' + holes
} />
const filledChoices: Partial<Record<IconName, (c: string, id: string) => React.ReactNode>> = {
  hotCup: c => <g fill={c}>
    <path fillRule="evenodd" d="M4 13H23V14H25C28.3 14 30 16 30 19S27.7 24 24.5 24H22.2C21 27.1 18.2 29 15 29H12C7.6 29 4 25.4 4 21V13ZM23 17V21H24.5C26 21 27 20.3 27 19S26.3 17 25 17H23Z" />
    <path d="M9 3H11.5C10.2 4.7 10.5 5.2 11.5 6.4C12.8 8.1 12.7 9.7 11.2 11H8.6C10.3 9.5 10.4 9 9.4 7.7C8.2 6.2 7.6 4.7 9 3ZM16 3H18.5C17.2 4.7 17.5 5.2 18.5 6.4C19.8 8.1 19.7 9.7 18.2 11H15.6C17.3 9.5 17.4 9 16.4 7.7C15.2 6.2 14.6 4.7 16 3Z" />
  </g>,
  bean: filledBean,
  beanOff: (c, id) => <>
    <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
      <rect width="32" height="32" fill="white" />
      <path fill="black" d="M0 26L26 0L32 6L6 32Z" />
    </mask></defs>
    <g mask={`url(#${id})`}>{filledBean(c)}</g>
    <path fill={c} d="M2 27.8L27.8 2L30 4.2L4.2 30Z" />
  </>,
  cupS: filledCup, cupM: filledCup, cupL: filledCup,
  iceCupFull: c => iceGlass(c, 'M9.8 10H14.6V14.8H9.8Z M17.4 10H22.2V14.8H17.4Z M13.6 18H18.4V22.8H13.6Z'),
  iceCupLess: c => iceGlass(c, 'M13.6 18H18.4V22.8H13.6Z'),
  iceCupNone: c => iceGlass(c, ''),
}

// '바꾸기 ›'의 눈에 보이는 끝을 가격 글자 끝(오른쪽 빈 곳 약 3px)에 맞추는 보정.
// 꺾쇠 그림(24px)은 오른쪽 7px이 비어 있어 4px 당기고, › 글자는 오른쪽 빈 곳이 약 1px이라 2px 띄운다.
const chevronIconEndInset = 4
export const chevronGlyphEndInset = 2

export function TrailingChevron({ color }: { color: string }) {
  return <span style={{ display: 'inline-flex', flexShrink: 0, marginRight: -chevronIconEndInset }}><Icon name="chevronRight" size={24} color={color} /></span>
}

// 선택 카드 그림(optical="choice")의 상자 안 빈 여백(위·아래). 그림 상자(size) 기준 px.
// 그림마다 달라서 카드는 이 값으로 실제 그림의 윗선·끝선을 맞춘다(SelectionCard BalancedCardContent).
// 2026-11-03 실제 화면에서 잰 값(컵 124/140/156, 콩 128, 나머지 156 기준).
const choiceInkInsets: Partial<Record<IconName, { top: number; bottom: number }>> = {
  cupS: { top: 12, bottom: 12 }, cupM: { top: 13, bottom: 13 }, cupL: { top: 15, bottom: 15 },
  hotCup: { top: 15, bottom: 15 }, snowflake: { top: 16, bottom: 16 },
  bean: { top: 12, bottom: 13 }, beanOff: { top: 8, bottom: 8 },
  iceCupFull: { top: 24, bottom: 15 }, iceCupLess: { top: 24, bottom: 15 }, iceCupNone: { top: 24, bottom: 15 },
}
export function choiceInkInset(name: IconName) { return choiceInkInsets[name] ?? { top: 0, bottom: 0 } }

export default function Icon({ name, size = 36, color = colors.textPrimary, optical }: Props) {
  const illustrationId = useId()
  const utilityNames = ['textSize', 'contrast', 'lowScreen', 'speaker', 'bell', 'home', 'chevronRight', 'close', 'search']
  if (optical === 'utility' && utilityNames.includes(name)) {
    const metric = size >= 60 && name !== 'chevronRight' ? 60 : 40
    const mask = `url("${assetUrl(`assets/figma-system/utility-${name}-${metric}.svg`)}") center / contain no-repeat`
    return <span aria-hidden="true" data-icon-name={name} data-icon-optical="utility" data-icon-system="figma" style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, backgroundColor: color, mask, WebkitMask: mask }} />
  }
  const filledChoice = optical === 'choice' ? filledChoices[name] : undefined
  if (filledChoice) return <svg aria-hidden="true" data-icon-name={name} data-icon-optical={optical} data-icon-style="filled" width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
    {filledChoice(color, illustrationId)}
  </svg>
  if (isAssetIcon(name)) {
    const mask = `url("${assetIcons[name]}") center / contain no-repeat`
    return <span aria-hidden="true" data-icon-name={name} data-icon-system={name in customIcons ? 'custom' : 'figma'} style={{
      display: 'inline-block', width: size, height: size, flexShrink: 0,
      backgroundColor: color, mask, WebkitMask: mask,
    }} />
  }

  if (name === 'textSize') {
    if (optical) return (
      <span aria-hidden="true" data-icon-name={name} data-icon-optical={optical} style={{ width: size, height: size, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: font.family, fontWeight: font.bold, lineHeight: 1 }}>
          <span style={{ fontSize: size * 0.35 }}>가</span>
          <span style={{ fontSize: size * 0.60 }}>가</span>
        </span>
      </span>
    )
    return (
      <span aria-hidden="true" style={{ display: 'flex', alignItems: 'baseline', gap: 2, fontFamily: font.family, fontWeight: font.bold, color, lineHeight: 1, flexShrink: 0 }}>
        <span style={{ fontSize: size * 0.58 }}>가</span>
        <span style={{ fontSize: size * 0.92 }}>가</span>
      </span>
    )
  }

  const icon = icons[name]
  const viewBox = optical ? opticalViewBoxes[name] ?? icon.viewBox : icon.viewBox
  const viewBoxSize = Math.max(...viewBox.split(' ').slice(2).map(Number))
  // SVG 좌표를 화면 px로 환산한다. 촘촘한 이중 뚜껑이 있는 컵은
  // 같은 굵기를 적용하면 선이 뭉치므로 밀도를 고려해 더 가늘게 보정한다.
  const isSizeCup = name === 'cupS' || name === 'cupM' || name === 'cupL'
  const strokePx = optical === 'choice' ? (isSizeCup ? 7 : 12) : optical === 'summary' ? 2.5 : 2.4
  const opticalStyle = optical ? { '--optical-stroke-width': strokePx * viewBoxSize / size } as CSSProperties : undefined
  return (
    <svg aria-hidden="true" data-icon-name={name} data-icon-optical={optical} width={size} height={size} viewBox={viewBox} fill="none" style={{ flexShrink: 0, ...opticalStyle }}>
      {icon.body(color)}
    </svg>
  )
}
