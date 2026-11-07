import { useState } from 'react'
import { colors, space } from '../tokens'
import Button from './Button'
import { useType } from './useType'
import { dialogVoice } from '../voice/guides'
import Icon from './Icon'
import type { IconName } from './Icon'
import SelectionCard, { useSelectionAccent } from './SelectionCard'
import { DialogFrame } from './ConfirmDialog'

import type { OrderMethod } from '../orderMethod'
export type { OrderMethod } from '../orderMethod'

// 장바구니의 이용 방법 변경. 카드 선택은 임시 상태이며 확인할 때만 적용한다.
const methods: { value: OrderMethod; icon: IconName; label: string; description?: string }[] = [
  { value: 'DINE_IN', icon: 'dineIn', label: '매장이용', description: '매장에서 먹기' },
  { value: 'TAKE_OUT', icon: 'takeOut', label: '포장', description: '가지고 가기' },
]

export default function OrderMethodDialog({ value, onApply, onCancel, lowScreen = false }: {
  lowScreen?: boolean; value: OrderMethod; onApply: (method: OrderMethod) => void; onCancel: () => void
}) {
  const [draft, setDraft] = useState<OrderMethod>(value)
  const t = useType()
  const accent = useSelectionAccent('gold')
  return (
    <DialogFrame width={952} lowScreen={lowScreen} titleId="order-method-title" title="이용 방법을 골라 주세요" onDismiss={onCancel} voice={dialogVoice.orderMethod}>
      <div data-dialog-choices style={{ display: 'flex', gap: 24 }}>
        {methods.map((method) => {
          const sel = draft === method.value
          return (
            <SelectionCard key={method.value} selected={sel} original={value === method.value} appearance="dialog" reserveOriginalSpace={false} accent="gold" onClick={() => setDraft(method.value)} height={400} equalWidth>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={method.icon} size={104} color={colors.iconBrand} />
              </div>
              <span style={{ ...t.primary, flexShrink: 0, color: sel ? accent.text : colors.textPrimary }}>{method.label}</span>
              <span style={{ ...t.caption, width: '100%', minHeight: 90, marginTop: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-line', color: colors.textSecondary, wordBreak: 'keep-all' }}>{method.description}</span>
            </SelectionCard>
          )
        })}
      </div>
      <div data-dialog-actions style={{ display: 'flex', gap: space.md }}>
        <Button purpose="decision" variant="Text" onClick={onCancel} style={{ width: 240 }}>취소</Button>
        <Button purpose="decision" variant="Primary" onClick={() => onApply(draft)} style={{ flex: 1 }}>확인</Button>
      </div>
    </DialogFrame>
  )
}
