import OptionChoiceCard from '../components/OptionChoiceCard'
import { useOptionProduct } from '../components/OptionProductContext'
import { useOptionEdit } from '../components/OptionEditContext'
import KioskLayout from '../components/KioskLayout'
import type { IconName } from '../components/Icon'
import { optionSteps } from '../selectionSummary'
import type { CaffeineType, IceAmount, SizeCode, Temperature } from '../types'

interface Props {
  productName: string
  value: CaffeineType
  temperature: Temperature
  sizeCode: SizeCode
  iceAmount: IceAmount
  onChange: (v: CaffeineType) => void
  onNext: () => void
  onPrev: () => void
  onEditTemp: () => void
  onEditSize: () => void
  onEditIce: () => void
  isEditMode?: boolean
}

const options: { key: CaffeineType; label: string; sub: string; icon: IconName }[] = [
  { key: 'CAFFEINATED', label: '카페인 있음', sub: '일반 커피',       icon: 'bean' },
  { key: 'DECAF',       label: '디카페인',    sub: '카페인을 줄였어요', icon: 'beanOff' },
]

export default function CaffeineScreen({ productName, value, temperature, sizeCode, iceAmount, onChange, onNext, onPrev, onEditTemp, onEditSize, onEditIce, isEditMode }: Props) {
  const product = useOptionProduct()?.item
  const edit = useOptionEdit()
  const isCold = temperature === 'COLD'

  const steps = optionSteps(
    { temperature, sizeCode, caffeineType: value, iceAmount },
    { product, current: 'caffeine', onEdit: { temperature: onEditTemp, size: onEditSize, ice: onEditIce } },
  )

  return (
    <KioskLayout
      question="카페인을 원하세요?"
      productName={productName}
      nextEnabled={!!value}
      nextLabel={isCold ? '다음 · 얼음 선택' : '다음 · 선택 확인'}
      prevLabel="이전 · 크기"
      onNext={onNext}
      onPrev={onPrev}
      steps={steps}
      isEditMode={isEditMode}
    >
      <div style={{ display: 'flex', gap: 32 }}>
        {options.map(opt => <OptionChoiceCard key={opt.key!} choice={{ option: 'caffeine', label: opt.label, description: opt.sub, icon: opt.icon }}
          selected={value === opt.key} original={!!edit.before && edit.before.caffeineType === opt.key}
          showOriginalSlot={!!edit.before} onSelect={() => onChange(opt.key)}
        />)}
      </div>
    </KioskLayout>
  )
}
