import { useState } from 'react'
import { DialogFrame } from '../components/ConfirmDialog'
import Button from '../components/Button'
import { useType } from '../components/useType'
import { dialogVoice } from '../voice/guides'
import { useSelectionAccent } from '../components/SelectionCard'
import { radius } from '../tokens'
import { mobilePaymentHelp, type MobileHelpApp } from './paymentFlow'

export default function MobilePaymentHelpDialog({ lowScreen, initialApp = null, onClose }: {
  lowScreen: boolean
  initialApp?: MobileHelpApp | null
  onClose: () => void
}) {
  const [app, setApp] = useState<MobileHelpApp | null>(initialApp)
  const t = useType()
  const accent = useSelectionAccent('gold')
  const help = app ? mobilePaymentHelp[app] : null
  return <DialogFrame titleId="mobile-payment-help-title" title="결제 코드 여는 방법"
    message="휴대폰에서 사용하는 앱을 골라 주세요." width={952} lowScreen={lowScreen} onDismiss={onClose} voice={{ ...dialogVoice.mobileHelp, target: '[aria-label="결제 코드 도움말 앱"]' }}>
    <div role="group" aria-label="결제 코드 도움말 앱" style={{ display: 'flex', gap: 16 }}>
      {(Object.keys(mobilePaymentHelp) as MobileHelpApp[]).map(id => <button key={id} type="button" aria-pressed={app === id}
        aria-controls="mobile-payment-help-steps" onClick={() => setApp(id)} style={{
          ...t.bodyButton, flex: 1, minWidth: 0, minHeight: 96, padding: '16px 12px', borderRadius: radius.pill,
          border: `2px solid ${app === id ? accent.color : 'var(--border-default)'}`,
          background: app === id ? accent.light : 'var(--bg-surface)', color: app === id ? accent.text : 'var(--text-primary)', cursor: 'pointer',
        }}>{mobilePaymentHelp[id].name}</button>)}
    </div>
    <div id="mobile-payment-help-steps" role="region" aria-label={help ? `${help.name} 코드 여는 순서` : '앱 선택 안내'} aria-live="polite"
      style={{ minHeight: 336, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'var(--text-primary)' }}>
      {help ? <ol style={{ ...t.body, listStyleType: 'decimal', margin: 0, padding: '0 0 0 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {help.steps.map(step => <li key={step} style={{ paddingLeft: 8, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{step}</li>)}
      </ol> : <p style={{ ...t.body, textAlign: 'center', margin: 0, color: 'var(--text-secondary)' }}>앱을 선택하면<br />결제 코드를 여는 순서를 알려드려요.</p>}
    </div>
    <Button purpose="support" variant="Tertiary" onClick={onClose} style={{ width: '100%', borderRadius: radius.pill }}>닫기</Button>
  </DialogFrame>
}
