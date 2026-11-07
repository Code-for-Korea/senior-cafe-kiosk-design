import { useOrderPricing } from './useOrderPricing'
import { useState } from 'react'
import type { CartEntry } from '../screens/CartScreen'
import type { OrderState } from '../types'
import { optionSteps, reviewOptionChanges, type OptionStepKey } from '../selectionSummary'
import { cartOptionValue, cartOrderChanged, cartOrderReady, selectCartOption, type CartOptionSelection } from '../cartOptionEdit'
import { canEditOption, hasIceChoice } from '../menuData'
import { sizeOptions, sizeAvailable, won } from '../orderPricing'
import { colors } from '../tokens'
import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import type { IconName } from './Icon'
import OptionChoiceCard from './OptionChoiceCard'
import { useType } from './useType'
import { dialogVoice } from '../voice/guides'
import { sameItemMessage } from '../cartSelection'
import { MAX_QUANTITY } from './QuantityStepper'

type Choice = CartOptionSelection & { label: string; description: string; icon: IconName; iconSize?: number }
const choices: Record<OptionStepKey, Choice[]> = {
  temperature: [
    { option: 'temperature', value: 'HOT', label: '따뜻하게', description: 'HOT', icon: 'hotCup' },
    { option: 'temperature', value: 'COLD', label: '차갑게', description: 'COLD', icon: 'snowflake' },
  ],
  size: sizeOptions.map((size, index) => ({ option: 'size', value: size.key, label: size.label,
    description: size.extra ? `+${won(size.extra)}` : '추가 금액 없음',
    icon: ['cupS', 'cupM', 'cupL'][index] as IconName, iconSize: [124, 140, 156][index] })),
  caffeine: [
    { option: 'caffeine', value: 'CAFFEINATED', label: '카페인 있음', description: '일반 커피', icon: 'bean' },
    { option: 'caffeine', value: 'DECAF', label: '디카페인', description: '카페인을 줄였어요', icon: 'beanOff' },
  ],
  ice: [
    { option: 'ice', value: 'NORMAL', label: '얼음 보통', description: '기본 양', icon: 'iceCupFull' },
    { option: 'ice', value: 'LESS', label: '얼음 적게', description: '기본보다 적게', icon: 'iceCupLess' },
    { option: 'ice', value: 'NONE', label: '얼음 없이', description: '얼음을 빼요', icon: 'iceCupNone' },
  ],
}
const questions: Record<OptionStepKey, string> = {
  temperature: '온도를 골라 주세요', size: '어떤 크기로 드릴까요?', caffeine: '카페인을 원하세요?', ice: '얼음은 얼마나 드릴까요?',
}

// sameItem: 고친 결과와 똑같은 다른 줄. 있으면 ‘변경 적용’ 전에 이 창 안에서 합칠지 묻는다(창을 겹치지 않음).
export default function CartOptionDialog({ item, option, onCancel, onApply, sameItem, lowScreen = false }: {
  item: CartEntry; option?: OptionStepKey; lowScreen?: boolean; onCancel: () => void; onApply: (order: OrderState) => void
  sameItem?: (order: OrderState) => CartEntry | undefined
}) {
  const { unitPrice } = useOrderPricing()
  const t = useType()
  const [draft, setDraft] = useState<OrderState>({ ...item.order })
  const [step, setStep] = useState<OptionStepKey | null>(option ?? null)
  const [stepOriginal, setStepOriginal] = useState<OrderState>({ ...item.order })
  const [cancel, setCancel] = useState(false)
  const [linkedIce, setLinkedIce] = useState(false)
  const [merging, setMerging] = useState(false)
  const changed = cartOrderChanged(item.order, draft)
  const merge = merging ? sameItem?.(draft) : undefined
  const apply = () => { if (!changed) onCancel(); else if (sameItem?.(draft)) setMerging(true); else onApply(draft) }
  const ready = cartOrderReady(draft, item.product)
  const requestCancel = () => changed ? setCancel(true) : onCancel()
  const back = () => { setDraft(stepOriginal); setStep(null); setLinkedIce(false) }
  const needsIce = step === 'temperature' && hasIceChoice(item.product) && draft.temperature === 'COLD' && !draft.iceAmount
  const completeStep = () => {
    if (needsIce) { setLinkedIce(true); setStep('ice'); return }
    setLinkedIce(false)
    setStep(null)
  }
  const rows = optionSteps(draft, { product: item.product, current: 'review', onEdit: {} })
  // 모달 진입 시 주문과 비교하므로 취소하거나 원래 값으로 되돌리면 변경 표시도 사라진다.
  const changes = reviewOptionChanges(item.order, draft)
  if (merge) return <DialogFrame lowScreen={lowScreen} width={952} titleId="cart-review-merge"
    title="같은 메뉴와 합칠까요?"
    message={sameItemMessage(merge, item.quantity, MAX_QUANTITY, '합치면').map(line => <span key={line} style={{ display: 'block' }}>{line}</span>)}
    onDismiss={() => setMerging(false)} voice={dialogVoice.mergeItem}>
    <div data-dialog-actions style={{ display: 'flex', gap: 24 }}>
      <Button purpose="decision" variant="Tertiary" onClick={() => setMerging(false)} style={{ flex: 1 }}>계속 바꾸기</Button>
      <Button purpose="decision" variant="Primary" onClick={() => onApply(draft)} style={{ flex: 1 }}>합치기</Button>
    </div>
  </DialogFrame>
  return <DialogFrame lowScreen={lowScreen} width={952} titleId={`cart-review-${cancel ? 'cancel' : step ?? 'list'}`}
    title={cancel ? '변경을 취소할까요?' : step ? questions[step] : '고른 내용을 확인해 주세요'}
    message={cancel ? '바꾼 내용은 저장되지 않아요.' : `${item.product.name} · ${item.quantity}개${item.quantity > 1 ? ' 모두 함께 바뀌어요' : ''}`}
    onDismiss={cancel ? () => setCancel(false) : step ? back : requestCancel}
    voice={cancel ? dialogVoice.cancelEdit : step ? dialogVoice.cartOptionStep(step, needsIce ? '다음, 얼음 선택' : '선택 완료', sizeOptions.map(size => size.label)) : dialogVoice.cartOptionList(changed)}>
    {cancel ? <div data-dialog-actions style={{ display: 'flex', gap: 24 }}>
      <Button purpose="decision" variant="Tertiary" onClick={() => setCancel(false)} style={{ flex: 1 }}>계속 바꾸기</Button>
      <Button purpose="decision" variant="Primary" onClick={onCancel} style={{ flex: 1 }}>변경 취소</Button>
    </div> : step ? <>
      {linkedIce && <p style={{ ...t.body, color: colors.textSecondary, margin: 0 }}>차가운 음료의 얼음양도 골라 주세요.</p>}
      <div data-dialog-choices style={{ display: 'flex', gap: 32 }}>
        {choices[step].filter(choice => canEditOption(item.product, choice.option) && (choice.option !== 'temperature' || item.product.temp.includes(choice.value === 'HOT' ? 'hot' : 'cold')) && (choice.option !== 'size' || sizeAvailable(choice.value, draft.temperature))).map(choice => <OptionChoiceCard key={choice.value} choice={choice}
          original={cartOptionValue(item.order, step) === choice.value} selected={cartOptionValue(draft, step) === choice.value}
          onSelect={() => setDraft(current => selectCartOption(current, item.order, choice, item.product))} />)}
      </div>
      {step === 'temperature' && draft.temperature === 'HOT' && <p style={{ ...t.body, color: colors.textSecondary, margin: 0 }}>따뜻한 음료에는 얼음이 들어가지 않아요.</p>}
      <div data-dialog-actions style={{ display: 'flex', gap: 24, marginTop: 8 }}>
        <Button purpose="decision" variant="Tertiary" onClick={back} style={{ flex: 1 }}>선택 취소 · 목록</Button>
        <Button purpose="decision" variant="Primary" onClick={completeStep} disabled={!cartOptionValue(draft, step)} style={{ flex: 1 }}>{needsIce ? '다음 · 얼음 선택' : '선택 완료'}</Button>
      </div>
    </> : <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(row => {
          const change = changes[row.key]
          return <div key={row.key} data-cart-option-row={row.key} style={{ display: 'flex', alignItems: 'center', gap: 24, minHeight: 104, paddingBlock: 8 }}>
          <span style={{ ...t.body, color: colors.textSecondary, width: 120 }}>{row.title}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              <span style={{ ...t.bodyButton, color: colors.textPrimary }}>{row.value ?? '선택해 주세요'}</span>
              {change && <span data-cart-option-change style={{ ...t.caption, color: colors.textSecondary }}>{change.kind === 'added' ? '새로 선택' : '변경'}</span>}
            </div>
            {change && <p style={{ ...t.caption, color: colors.textSecondary, margin: '4px 0 0' }}>이전: {change.kind === 'added' ? '해당 없음' : change.previous}</p>}
          </div>
          {canEditOption(item.product, row.key) && <Button purpose="support" variant="Utility" size="small" ariaLabel={`${row.title} 바꾸기`} onClick={() => { setStepOriginal({ ...draft }); setStep(row.key) }}>바꾸기 ›</Button>}
        </div>})}
      </div>
      {!ready && <p role="status" style={{ ...t.body, color: colors.textSecondary, margin: 0 }}>차가운 음료의 얼음양도 선택해 주세요.</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
        <span style={{ ...t.body, color: colors.textSecondary }}>{changed ? '변경 후 상품 금액' : '상품 금액'}</span>
        <strong style={{ ...t.primary, color: colors.textPrimary }}>{won(unitPrice(item.product, draft) * item.quantity)}</strong>
      </div>
      <div data-dialog-actions style={{ display: 'flex', gap: 24 }}>
        <Button purpose="decision" variant="Tertiary" onClick={requestCancel} style={{ flex: 1 }}>취소</Button>
        <Button purpose="decision" variant="Primary" disabled={!ready} onClick={apply} style={{ flex: 1 }}>{changed ? '변경 적용' : '기존 선택 유지'}</Button>
      </div>
    </>}
  </DialogFrame>
}
