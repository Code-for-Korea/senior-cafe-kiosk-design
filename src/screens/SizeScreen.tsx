import OptionChoiceCard from '../components/OptionChoiceCard'
import { useOptionProduct } from '../components/OptionProductContext'
import { hasCaffeineChoice, hasIceChoice } from '../menuData'
import { useOptionEdit } from '../components/OptionEditContext'
import KioskLayout from '../components/KioskLayout'
import type { IconName } from '../components/Icon'
import { optionSteps } from '../selectionSummary'
import { sizeOptions, sizeAvailable, won } from '../orderPricing'
import type { CaffeineType, IceAmount, SizeCode, Temperature } from '../types'

interface Props {
  productName: string
  value: SizeCode
  temperature: Temperature
  caffeineType: CaffeineType
  iceAmount: IceAmount
  onChange: (v: SizeCode) => void
  onNext: () => void
  onPrev: () => void
  onEditTemp: () => void
  onEditCaffeine: () => void
  onEditIce: () => void
  isEditMode?: boolean
  hidePrev?: boolean
}

/* 컵 그림은 와이어프레임의 것을 그대로 쓰되, 크기 차이가 보이도록 높이를 다르게 둔다 */
const sizes = sizeOptions.map((size, index) => ({ ...size, icon: ['cupS', 'cupM', 'cupL'][index] as IconName, height: [124, 140, 156][index] }))

export default function SizeScreen({ productName, value, temperature, caffeineType, iceAmount, onChange, onNext, onPrev, onEditTemp, onEditCaffeine, onEditIce, isEditMode, hidePrev }: Props) {
  const product = useOptionProduct()?.item
  const edit = useOptionEdit()

  const steps = optionSteps(
    { temperature, sizeCode: value, caffeineType, iceAmount },
    { product, current: 'size', onEdit: { temperature: onEditTemp, caffeine: onEditCaffeine, ice: onEditIce } },
  )

  return (
    <KioskLayout
      question="어떤 크기로 드릴까요?"
      productName={productName}
      nextEnabled={!!value && sizeAvailable(value, temperature)}
      nextLabel={hasCaffeineChoice(product) ? '다음 · 카페인 선택' : temperature === 'COLD' && hasIceChoice(product) ? '다음 · 얼음 선택' : '다음 · 선택 확인'}
      prevLabel="이전 · 온도"
      hidePrev={hidePrev}
      onNext={onNext}
      onPrev={onPrev}
      steps={steps}
      isEditMode={isEditMode}
    >
      <div style={{ display: 'flex', gap: 32 }}>
        {sizes.filter(size => sizeAvailable(size.key, temperature)).map(size => <OptionChoiceCard key={size.key!} choice={{ option: 'size', label: size.label, description: size.extra ? `+${won(size.extra)}` : '추가 금액 없음', icon: size.icon, iconSize: size.height }}
          selected={value === size.key} original={!!edit.before && edit.before.sizeCode === size.key}
          showOriginalSlot={!!edit.before} onSelect={() => onChange(size.key)}
        />)}
      </div>
    </KioskLayout>
  )
}
