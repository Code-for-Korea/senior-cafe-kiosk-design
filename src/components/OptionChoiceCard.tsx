import { selectionMetrics } from '../design-system/metrics'
import { colors } from '../tokens'
import type { OptionStepKey } from '../selectionSummary'
import Icon, { choiceInkInset } from './Icon'
import type { IconName } from './Icon'
import SelectionCard, { BalancedCardContent, selectionIconColor, useSelectionAccent } from './SelectionCard'
import { useType } from './useType'

interface OptionChoice {
  option: OptionStepKey
  label: string
  description: string
  icon: IconName
  iconSize?: number
}

// 화면(줄)마다 그림 영역 높이 = 그 줄에서 가장 큰 그림의 실제 높이(상자 크기에서 Icon.tsx의 빈 여백을 뺀 값).
// 한 줄의 카드가 같은 영역 높이를 써야 이름·설명 줄이 맞는다.
// 얼음은 실제 117이지만 카드 높이가 짝수가 되게 118로 둔다(사용자 2026-11-03).
const rowInkHeight: Record<OptionStepKey, number> = { size: 141, temperature: 126, caffeine: 112, ice: 118 }

// 장바구니 수정과 주문 전 선택이 공유하는 골드 카드. 원본 판정은 호출 화면에서 전달한다.
export default function OptionChoiceCard({ choice, selected, original, disabled, onSelect, showOriginalSlot = true }: { choice: OptionChoice; selected: boolean; original: boolean; disabled?: boolean; onSelect: () => void; showOriginalSlot?: boolean }) {
  const t = useType()
  const accent = useSelectionAccent('gold')
  // 콩 그림의 시각적 무게를 컵·얼음과 맞추되, 공통 그림 영역과 문구 기준선은 유지한다.
  const iconSize = choice.iconSize ?? (choice.option === 'caffeine' ? selectionMetrics.caffeineIllustrationSize : selectionMetrics.optionIllustrationSize)
  // 크기 화면은 컵 크기 차이를 보여 줘야 해서 그림 끝선을 아래에 맞추고, 체크→가장 큰 컵(특대) 윗선이 checkToIllustration(8)이 되게 체크 자리와의 간격을 뺀다.
  // 다른 화면은 그림을 위에 맞춰 체크 아래 8에서 시작하게 한다(작은 그림이 아래로 쏠려 보이던 것을 바로잡음, 사용자 2026-11-03).
  const bottomAligned = choice.option === 'size'
  const checkGap = bottomAligned ? selectionMetrics.checkToIllustration - choiceInkInset('cupL').top : 0
  // 고른 표시 자리를 위에 두고(아래 기존 선택 칩 자리와 짝), 높이는 내용대로 둔다. 위 여백은 좌우와 같은 24(테두리 포함, 바깥 가장자리 기준).
  // 체크를 겹쳐 두는 방식(PR #20)은 칩이 있는 카드에서 위아래가 어긋나 보여 되돌렸다(사용자 2026-11-03).
  return <SelectionCard voiceChoice selected={selected} original={original} disabled={disabled} onClick={onSelect} accent="gold" appearance="dialog" reserveOriginalSpace={showOriginalSlot}
    height="auto" checkGap={checkGap} equalWidth balancedContent reserveCheckSpace>
    <BalancedCardContent illustrationHeight={rowInkHeight[choice.option]} inkInset={choiceInkInset(choice.icon)} align={bottomAligned ? 'bottom' : 'top'} topGap={selectionMetrics.checkToIllustration}
      illustration={<Icon name={choice.icon} size={iconSize} color={selectionIconColor(selected, accent.color)} optical="choice" />}>
      {/* 이름과 설명은 붙여 둔다(간격 0 → 글자 기준 약 16). 설명과 기존 선택 칩 사이(약 18)와 비슷해 보이게.
          줄 높이는 정수(이름 52 · 큰 글씨 56, 설명 44)로 고정해 카드 높이가 짝수가 되게 한다. 글꼴 토큰(1.4배)으로는 50.4·44.8이 된다. */}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
        <span data-choice-label-row style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span data-choice-name style={{ ...t.primary, lineHeight: t.largeText ? '56px' : '52px', color: selected ? accent.text : colors.textPrimary, whiteSpace: 'nowrap' }}>{choice.label}</span>
        </span>
        <span style={{ ...t.body, lineHeight: '44px', color: selected ? accent.text : colors.textSecondary }}>{choice.description}</span>
      </span>
    </BalancedCardContent>
  </SelectionCard>
}
