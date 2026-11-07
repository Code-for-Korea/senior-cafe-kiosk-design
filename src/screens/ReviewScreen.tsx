import KioskLayout from '../components/KioskLayout'
import QuantityStepper from '../components/QuantityStepper'
import { useType } from '../components/useType'
import { colors, space } from '../tokens'
import { optionSteps, reviewOptionChanges } from '../selectionSummary'
import type { OrderState } from '../types'
import { beginOrder } from '../orderEntry'
import { useOptionProduct } from '../components/OptionProductContext'
import { cartOrderReady } from '../cartOptionEdit'

interface Props {
  productName: string
  originalOrder: OrderState | null
  order: OrderState
  isDefaultOrder?: boolean // 기본값으로 주문: 기본값을 보여주고 확인받는다
  quantity: number         // 담기 직전에 수량을 묻는다 (장바구니에서도 바꿀 수 있다)
  onChangeQuantity: (quantity: number) => void
  onNext: () => void
  onCancelOrder: () => void
  onEditTemp: () => void
  onEditSize: () => void
  onEditCaffeine: () => void
  onEditIce: () => void
}

export default function ReviewScreen({
  productName,
  originalOrder,
  order,
  isDefaultOrder,
  quantity,
  onChangeQuantity,
  onNext,
  onCancelOrder,
  onEditTemp,
  onEditSize,
  onEditCaffeine,
  onEditIce,
}: Props) {
  const t = useType()
  const product = useOptionProduct()
  const defaults = beginOrder('default', order.temperature, product?.item).order
  const usesDefaults = isDefaultOrder && order.sizeCode === defaults.sizeCode && order.caffeineType === defaults.caffeineType && order.iceAmount === defaults.iceAmount
  const changes = originalOrder ? reviewOptionChanges(originalOrder, order) : {}
  const steps = optionSteps(order, {
    current: 'review', isDefaultOrder, product: product?.item,
    onEdit: { temperature: onEditTemp, size: onEditSize, caffeine: onEditCaffeine, ice: onEditIce },
  }).map(row => ({ ...row, change: changes[row.key] }))

  const isComplete = cartOrderReady(order, product?.item)

  return (
    <KioskLayout
      question={usesDefaults ? '기본값으로 담을까요?' : '선택한 내용이 맞나요?'}
      description="바꿀 내용이 있으면 각 항목의 ‘바꾸기’를 눌러 주세요."
      productName={productName}
      nextEnabled={isComplete}
      nextLabel="맞아요, 장바구니 담기"
      hidePrev
      secondaryAction={{ label: '취소 · 메뉴로 돌아가기', onClick: onCancelOrder }}
      onNext={onNext}
      steps={steps}
      stepsAfterQuestion
    >
      {/* 수량 · 담기 직전 */}
      {!product && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.md, padding: `${space.xs}px ${space.xs}px` }}>
        <span style={{ ...t.primary, color: colors.textPrimary }}>몇 개 담을까요?</span>
        <QuantityStepper value={quantity} onChange={onChangeQuantity} />
      </div>}
    </KioskLayout>
  )
}
