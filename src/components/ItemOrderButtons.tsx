import { buttonMetrics } from '../design-system/metrics'
import { won } from '../orderPricing'
import Button from './Button'

interface Props {
  quantity: number
  unitPrice: number
  canAdd?: boolean
  primary?: boolean
  lowScreen?: boolean
  appearance?: 'standard' | 'lowReview'
  voiceAction?: string
  // 담기가 꺼져 있어도 지금까지 고른 내용의 금액을 보여 준다(고르기 화면: 확인 화면에서 담기).
  showPrice?: boolean
  onReturnToMenu: () => void
  onAdd: () => void
}

// Only the two buttons; callers retain quantity placement and scroll boundaries.
// The approved low-review variant has a different label and return-button weight.
export default function ItemOrderButtons({ quantity, unitPrice, canAdd = true, primary = true, lowScreen = false,
  appearance = 'standard', voiceAction = 'review-add', showPrice = false, onReturnToMenu, onAdd }: Props) {
  const review = appearance === 'lowReview'
  const metrics = buttonMetrics.order
  const height = lowScreen ? metrics.lowHeight : metrics.normalHeight
  const total = won(unitPrice * quantity)
  return <>
    <Button purpose="decision" variant={review ? 'Tertiary' : 'Utility'} size={review ? 'large' : 'small'} voiceAction="item-back" onClick={onReturnToMenu}
      style={{ width: lowScreen ? metrics.lowBackWidth : metrics.normalBackWidth, height,
        ...(!review ? { padding: '0 16px' } : {}) }}>메뉴로 돌아가기</Button>
    <Button purpose="decision" voiceAction={voiceAction} variant={primary ? 'Primary' : 'Secondary'} disabled={!canAdd} onClick={onAdd}
      ariaLabel={canAdd ? `${quantity}개 합계 ${total} 장바구니에 담기` : showPrice ? `${quantity}개 합계 ${total}, 선택 확인 후 담기` : '필수 옵션 선택 후 담기'}
      style={{ flex: 1, height, ...(!review ? { minWidth: metrics.addMinWidth, padding: '0 32px' } : {}) }}>
      {canAdd ? `${total}${review ? ' ·' : ''} 담기` : showPrice ? `${total} · 확인 후 담기` : review ? '먼저 선택해 주세요' : '담기'}
    </Button>
  </>
}
