import type { ReactNode } from 'react'
import { dialogMetrics } from '../design-system/metrics'
import { colors, radius, space } from '../tokens'
import { DialogFrame } from './ConfirmDialog'
import Button from './Button'
import { useType } from './useType'
import { dialogVoice } from '../voice/guides'



export function StaffCallDialog({ called, late = false, onCall, onClose, onCancelCall }: {
  called: boolean; late?: boolean; onCall: () => void; onClose: () => void; onCancelCall: () => void
}) {
  const t = useType()
  // 부른 지 오래됐는데 끝나지 않음(기획 G01-LATE·D-21). 다시 부르거나 카운터로 가는 길을 준다. 주문 내용은 그대로.
  // 카운터 위치 칸은 두지 않는다(매장마다 달라서, 사용자 2026-10-20).
  if (called && late) return (
    <DialogFrame width={dialogMetrics.sessionWidth} titleId="staff-late-title" voice={{ ...dialogVoice.staffLate, always: true }}
      title="아직 직원이 오지 않았어요" message="다시 부르거나 카운터에 말씀해 주세요." messageReadable onDismiss={onClose}>
      <div data-dialog-actions style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: space.md }}>
        <Button purpose="decision" variant="Text" onClick={onClose} style={{ width: '100%', minWidth: 0, padding: '0 16px' }}>주문 화면 보기</Button>
        <Button purpose="decision" variant="Primary" onClick={onCall} style={{ width: '100%', minWidth: 0, padding: '0 16px' }}>다시 부르기</Button>
      </div>
    </DialogFrame>
  )
  return (
    <DialogFrame width={dialogMetrics.sessionWidth} titleId={called ? "staff-called-title" : "staff-call-title"} voice={called ? dialogVoice.staffWaiting : dialogVoice.staffCall}
      title={called ? '직원 도움을 기다리고 있어요' : '직원을 불러드릴까요?'}
      message={called ? <>이 자리에서 잠시 기다려 주세요.<br />고른 메뉴는 그대로 보관돼요.</> : '직원을 기다리는 동안 고른 메뉴는 그대로 보관돼요.'} messageReadable onDismiss={onClose}>
      <div style={{ background: 'var(--bg-muted)', borderRadius: radius.card, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm }}>
        <p style={{ ...t.readable(t.body), color: colors.textSecondary, margin: 0 }}>호출 위치</p>
        <p style={{ ...t.primary, color: colors.textPrimary, margin: 0 }}>키오스크 2번</p>
      </div>
      {called ? <div data-dialog-actions style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: space.md }}>
        <Button purpose="decision" variant="Text" onClick={onCancelCall} style={{ width: '100%', minWidth: 0, padding: '0 16px' }}>호출 취소</Button>
        <Button purpose="decision" variant="Primary" onClick={onClose} style={{ width: '100%', minWidth: 0, padding: '0 16px' }}>주문 화면 보기</Button>
      </div> : <div data-dialog-actions style={{ display: 'flex', gap: space.md }}>
        <Button purpose="decision" variant="Text" onClick={onClose} style={{ flex: 1 }}>돌아가기</Button>
        <Button purpose="decision" variant="Primary" onClick={onCall} style={{ flex: 1.25 }}>직원 부르기</Button>
      </div>}
    </DialogFrame>
  )
}

// staffCalled: 직원을 불렀는데 늦어져 다시 세는 중. 직원 버튼은 ‘다시 부르기’, 첫 화면으로 가면 호출도 취소된다고 알린다(사용자 2026-10-21).
// kind: 넘어가면 무엇을 잃는지에 따라 글을 바꾼다. printFail = 출력 실패 화면(주문번호가 사라짐), card = 카드가 꽂혀 있을 수 있는 화면(사용자 2026-10-28).
export type IdleWarningKind = 'order' | 'printFail' | 'card'
const idleCopy: Record<IdleWarningKind, { title: string; continueLabel: string; note: [ReactNode, ReactNode] }> = {
  order: { title: '아직 주문 중이시죠?', continueLabel: '계속 주문하기', note: [
    <>첫 화면으로 돌아가면 메뉴와 장바구니가 지워져요.<br />계속 주문하거나 직원의 도움을 받을 수 있어요.</>,
    <>첫 화면으로 돌아가면 직원 호출이 취소되고<br />메뉴와 장바구니가 지워져요.</>] },
  printFail: { title: '아직 계시나요?', continueLabel: '계속 보기', note: [
    <>첫 화면으로 돌아가면 주문번호가 화면에서 사라져요.<br />주문번호표가 필요하면 직원 부르기를 눌러 주세요.</>,
    <>첫 화면으로 돌아가면 직원 호출이 취소되고<br />주문번호가 화면에서 사라져요.</>] },
  card: { title: '아직 주문 중이시죠?', continueLabel: '계속 주문하기', note: [
    <><strong style={{ color: colors.textPrimary }}>꽂혀 있는 카드를 꺼내 주세요.</strong><br />첫 화면으로 돌아가면 메뉴와 장바구니가 지워져요.</>,
    <><strong style={{ color: colors.textPrimary }}>꽂혀 있는 카드를 꺼내 주세요.</strong><br />첫 화면으로 돌아가면 직원 호출이 취소돼요.</>] },
}
const idleVoice = (kind: IdleWarningKind, called: boolean) => kind === 'printFail' ? (called ? dialogVoice.idlePrintFailCalled : dialogVoice.idlePrintFail)
  : kind === 'card' ? (called ? dialogVoice.idleCardCalled : dialogVoice.idleCard) : (called ? dialogVoice.idleCalled : dialogVoice.idle)
export function IdleWarningDialog({ remaining, onContinue, onStaff, staffCalled = false, kind = 'order' }: {
  remaining: number; onContinue: () => void; onStaff: () => void; staffCalled?: boolean; kind?: IdleWarningKind
}) {
  const t = useType()
  const copy = idleCopy[kind]
  return (
    <DialogFrame width={dialogMetrics.sessionWidth} titleId="idle-warning-title" title={copy.title} onDismiss={onContinue} voice={{ ...idleVoice(kind, staffCalled), always: true }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: space.sm }}>
        <p role="timer" aria-live="off" style={{ ...t.body, fontSize: 36, margin: 0, color: colors.textPrimary }}><strong style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{remaining}초</strong> 후 첫 화면으로 돌아가요.</p>
        <p data-idle-note style={{ ...t.body, fontSize: 36, margin: 0, color: colors.textSecondary, wordBreak: 'keep-all' }}>{copy.note[staffCalled ? 1 : 0]}</p>
      </div>
      <div data-dialog-actions style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: space.md, marginTop: space.md }}>
        <Button purpose="decision" variant="Text" onClick={onContinue} style={{ width: '100%', minWidth: 0, padding: '0 16px' }}>{copy.continueLabel}</Button>
        <Button purpose="decision" variant="Primary" onClick={onStaff} style={{ width: '100%', minWidth: 0, padding: '0 16px' }}>{staffCalled ? '다시 부르기' : '직원 부르기'}</Button>
      </div>
    </DialogFrame>
  )
}
