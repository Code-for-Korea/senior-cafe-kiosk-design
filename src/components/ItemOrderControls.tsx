import type { ReactNode } from 'react'
import { colors, space } from '../tokens'
import { won } from '../orderPricing'
import ItemOrderButtons from './ItemOrderButtons'
import QuantityStepper from './QuantityStepper'
import { useType } from './useType'

// 옵션 유무에 관계없이 수량·금액·메뉴 복귀·담기를 같은 순서로 제공한다.
export default function ItemOrderControls({ quantity, unitPrice, canAdd = true, primary = true, lowScreen = false, showPrice = false, voiceAction = 'review-add', guide, quantityTip, onChangeQuantity, onReturnToMenu, onAdd }: {
  quantity: number
  unitPrice: number
  canAdd?: boolean
  primary?: boolean
  lowScreen?: boolean
  showPrice?: boolean
  voiceAction?: string
  // 음성 안내 말풍선. 수량과 담기 버튼 사이에 놓아 담기 버튼을 가리킨다.
  guide?: ReactNode
  // 수량 칸 오른쪽 빈 곳의 짧은 이름표(‘수량 확인’, 화살표는 왼쪽). 수량 칸 테두리와 겹치지 않게 띄운다.
  quantityTip?: ReactNode
  onChangeQuantity: (quantity: number) => void
  onReturnToMenu: () => void
  onAdd: () => void
}) {
  const t = useType()
  return <>
    <div data-voice-review-quantity style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
      <QuantityStepper value={quantity} onChange={onChangeQuantity} showUnit={false} />
      {quantityTip && <div style={{ marginLeft: 40, marginRight: 'auto', display: 'flex' }}>{quantityTip}</div>}
      <div aria-live="polite" aria-atomic="true" style={{ textAlign: 'right' }}>
        {(canAdd || showPrice) && <span style={{ ...t.inlinePrice, color: colors.textPrimary, whiteSpace: 'nowrap' }}>{won(unitPrice)} × {quantity}개</span>}
      </div>
    </div>
    {guide}
    <div style={{ display: 'flex', gap: space.md }}>
      <ItemOrderButtons {...{ quantity, unitPrice, canAdd, primary, lowScreen, voiceAction, showPrice, onReturnToMenu, onAdd }} />
    </div>
  </>
}
