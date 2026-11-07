import OptionChoiceCard from '../components/OptionChoiceCard'
import { useOptionProduct } from '../components/OptionProductContext'
import { useOptionEdit } from '../components/OptionEditContext'
import KioskLayout from '../components/KioskLayout'
import type { IconName } from '../components/Icon'
import { optionSteps } from '../selectionSummary'
import { sizeAvailable } from '../orderPricing'
import type { CaffeineType, IceAmount, SizeCode, Temperature } from '../types'

interface Props {
  productName: string
  value: Temperature
  sizeCode: SizeCode
  caffeineType: CaffeineType
  iceAmount: IceAmount
  onChange: (v: Temperature) => void
  onNext: () => void
  onPrev: () => void
  isEditMode?: boolean
  isDefaultOrder?: boolean // 기본값으로 주문: 온도만 묻고 나머지는 기본값으로 담는다
  onEditSize: () => void
  onEditCaffeine: () => void
  onEditIce: () => void
}

/* 그림은 메뉴 카드의 온도 배지와 같은 아이콘을 쓴다. 이모지는 기기마다 모양이 달라 쓰지 않는다. */
const options: { key: 'HOT' | 'COLD'; label: string; icon: IconName; desc: string }[] = [
  { key: 'HOT',  label: '따뜻하게', icon: 'hotCup',  desc: 'HOT' },
  { key: 'COLD', label: '차갑게',   icon: 'snowflake', desc: 'COLD' },
]

export default function TemperatureScreen({ productName, value, sizeCode, caffeineType, iceAmount, onChange, onNext, onPrev, isEditMode, isDefaultOrder, onEditSize, onEditCaffeine, onEditIce }: Props) {
  const product = useOptionProduct()?.item
  const edit = useOptionEdit()
  const steps = optionSteps(
    { temperature: value, sizeCode, caffeineType, iceAmount },
    { product, current: 'temperature', isDefaultOrder, onEdit: { size: onEditSize, caffeine: onEditCaffeine, ice: onEditIce } },
  )

  return (
    <KioskLayout
      question="온도를 골라 주세요"
      productName={productName}
      nextEnabled={!!value && sizeAvailable(sizeCode, value)}
      nextLabel={isDefaultOrder ? '다음 · 기본값 확인' : '다음 · 크기 선택'}
      onNext={onNext}
      onPrev={onPrev}
      hidePrev
      steps={steps}
      isEditMode={isEditMode}
    >
      <div style={{ display: 'flex', gap: 32 }}>
        {options.filter(opt => !product || product.temp.includes(opt.key === 'HOT' ? 'hot' : 'cold')).map(opt => <OptionChoiceCard key={opt.key!} choice={{ option: 'temperature', label: opt.label, description: opt.desc, icon: opt.icon }}
          selected={value === opt.key} original={!!edit.before && edit.before.temperature === opt.key}
          showOriginalSlot={!!edit.before} disabled={!sizeAvailable(sizeCode, opt.key)} onSelect={() => onChange(opt.key)}
        />)}
      </div>
    </KioskLayout>
  )
}
