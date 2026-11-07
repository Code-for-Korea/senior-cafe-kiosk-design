import { progressMetrics } from '../design-system/metrics'
import { colors, font, space } from '../tokens'
import { useType } from './useType'
import { useTheme } from './ThemeContext'

// 이동 버튼이 아닌 주문 진행 표시. 번호와 단계명을 한 줄로 읽는다.
// 바깥 여백은 갖지 않는다. 위치(layout.progressTop)와 아래 간격(progress.spaceBelow)은 화면의 머리(header)가 정한다(2026-10-20).
const ORDER_STEPS = ['이용 방법', '메뉴', '추가 선택', '장바구니', '결제']

const CHEVRON_DEPTH = progressMetrics.chevronDepth
const CHEVRON_GAP = progressMetrics.gap

interface Props {
  current: number // 1부터 센 현재 단계
}

export default function ProgressStep({ current }: Props) {
  const t = useType()
  const theme = useTheme()

  return (
    <ol aria-label={`주문 진행, 전체 ${ORDER_STEPS.length}단계 중 ${current}단계`} data-order-progress style={{
      display: 'flex', alignItems: 'flex-start',
      flexShrink: 0, listStyle: 'none', margin: 0, padding: 0,
    }}>
      {ORDER_STEPS.map((name, i) => {
        const isNow = i + 1 === current
        const isDone = i + 1 < current
        const state = isNow ? 'Active' : isDone ? 'Completed' : 'Upcoming'
        const status = isNow ? '현재 단계' : isDone ? '완료' : '예정'
        const fill = isNow ? 'var(--progress-current)' : isDone ? 'var(--progress-completed)' : 'var(--progress-other)'
        return (
          <li key={name} aria-current={isNow ? 'step' : undefined}
            aria-label={`${i + 1}단계 ${name}, ${status}`} data-state={state}
            style={{
              flex: '1 0 auto', height: progressMetrics.height, position: 'relative', boxSizing: 'border-box',
              // 화살촉과 다음 홈을 겹쳐 일정한 3px 구분 간격만 남긴다.
              marginLeft: i === 0 ? 0 : CHEVRON_GAP - CHEVRON_DEPTH,
              padding: `0 ${progressMetrics.insetRight}px 0 ${i === 0 ? progressMetrics.firstInset : progressMetrics.insetLeft}px`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <span aria-hidden="true" data-step-shape style={{
              position: 'absolute', inset: 0, background: fill,
              clipPath: `polygon(0 0, calc(100% - ${CHEVRON_DEPTH}px) 0, 100% 50%, calc(100% - ${CHEVRON_DEPTH}px) 100%, 0 100%${i === 0 ? '' : `, ${CHEVRON_DEPTH}px 50%`})`,
            }} />
            <span aria-hidden="true" data-step-label style={{
              ...t.navigation, position: 'relative', display: 'inline-flex', gap: space.xs,
              alignItems: 'center', whiteSpace: 'nowrap',
              fontWeight: isNow ? font.semibold : t.body.fontWeight,
              color: isNow ? theme.stateCurrentText : colors.textSecondary,
            }}><span>{i + 1}</span><span>{name}</span></span>
          </li>
        )
      })}
    </ol>
  )
}
