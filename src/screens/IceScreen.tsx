import OptionChoiceCard from '../components/OptionChoiceCard'
import { useOptionProduct } from '../components/OptionProductContext'
import { hasCaffeineChoice } from '../menuData'
import { useOptionEdit } from '../components/OptionEditContext'
import KioskLayout from '../components/KioskLayout'
import type { IconName } from '../components/Icon'
import { optionSteps } from '../selectionSummary'
import type { CaffeineType, IceAmount, SizeCode, Temperature } from '../types'

interface Props {
  productName: string
  value: IceAmount
  temperature: Temperature
  sizeCode: SizeCode
  caffeineType: CaffeineType
  onChange: (v: IceAmount) => void
  onNext: () => void
  onPrev: () => void
  onEditTemp: () => void
  onEditSize: () => void
  onEditCaffeine: () => void
  isEditMode?: boolean
}

const options: { key: IceAmount; label: string; sub: string; icon: IconName }[] = [
  { key: 'NORMAL', label: '얼음 보통', sub: '기본 양',        icon: 'iceCupFull' },
  { key: 'LESS',   label: '얼음 적게', sub: '기본보다 적게',   icon: 'iceCupLess' },
  { key: 'NONE',   label: '얼음 없이', sub: '얼음을 빼요',     icon: 'iceCupNone' },
]

export default function IceScreen({ productName, value, temperature, sizeCode, caffeineType, onChange, onNext, onPrev, onEditTemp, onEditSize, onEditCaffeine, isEditMode }: Props) {
  const product = useOptionProduct()?.item
  const edit = useOptionEdit()

  const steps = optionSteps(
    { temperature, sizeCode, caffeineType, iceAmount: value },
    { product, current: 'ice', onEdit: { temperature: onEditTemp, size: onEditSize, caffeine: onEditCaffeine } },
  )

  return (
    <KioskLayout
      question="얼음은 얼마나 드릴까요?"
      productName={productName}
      nextEnabled={!!value}
      nextLabel="다음 · 선택 확인"
      prevLabel={hasCaffeineChoice(product) ? '이전 · 카페인' : '이전 · 크기'}
      onNext={onNext}
      onPrev={onPrev}
      steps={steps}
      isEditMode={isEditMode}
    >
      <div style={{ display: 'flex', gap: 32 }}>
        {options.map(opt => <OptionChoiceCard key={opt.key!} choice={{ option: 'ice', label: opt.label, description: opt.sub, icon: opt.icon }}
          selected={value === opt.key} original={!!edit.before && edit.before.iceAmount === opt.key}
          showOriginalSlot={!!edit.before} onSelect={() => onChange(opt.key)}
        />)}
      </div>
    </KioskLayout>
  )
}
