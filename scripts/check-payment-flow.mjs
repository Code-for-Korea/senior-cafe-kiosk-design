import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(new URL('../src/payment/paymentFlow.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const { paymentView: view, paymentScenes, cashErrorReasons, demoDeposit, mustResolveBeforeHome: blocked, isMobileHelpScene, mobilePaymentHelp } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
const total = 26600
const get = (scene, amount = 10000, error = 'change') => view(scene, total, amount, 'unsupported', error)
const destinations = v => [v.primary, v.secondary, v.help, ...(v.choices ?? [])].filter(Boolean).map(a => a.to)
for (const scene of Object.keys(paymentScenes)) {
  const v = get(scene, demoDeposit(scene, total, 'change'))
  assert.ok(v.title)
  for (const to of destinations(v)) assert.ok(to in paymentScenes || ['staff', 'method', 'home'].includes(to))
  for (const [, amount] of v.moneyRows ?? []) assert.ok(amount >= 0)
}
// 기기 문제: 결제되지 않은 게 확실하니 남은 방법이 있으면 고를 수 있고, 없으면 직원만(사용자 2026-10-20).
assert.deepEqual(destinations(get('device')), ['method', 'staff'])
assert.deepEqual(destinations(view('device', total, 0, 'unsupported', 'change', false)), ['staff'])
// Ambiguous outcomes must not offer another charge or abandon a held-money case.
assert.deepEqual(destinations(get('unknown')), ['staff'])
assert.equal(blocked('unknown', 'change'), true)
for (const reason of ['change', 'return', 'unknown', 'retained']) {
  assert.deepEqual(destinations(get('cashError', 30000, reason)), ['staff'])
  assert.equal(blocked('cashError', reason), true)
}
// Only confirmed full return or no retained money can offer method selection.
for (const reason of ['returned', 'noDeposit']) assert.ok(destinations(get('cashError', 10000, reason)).includes('method'))
assert.equal(get('cashRejected', 10000).secondary.to, 'cashCancel')
assert.equal(get('cashRejected', 0).secondary.to, 'method')
assert.equal(get('cashMore', 10000).moneyRows[2][1], 16600)
assert.equal(get('cashChangeReady', 30000).moneyRows[2][1], 3400)
for (const reason of ['change', 'return', 'returned']) {
  const rows = get('cashError', 30000, reason).moneyRows
  assert.equal(rows[0][1] - rows[1][1], rows[2][1])
}
// Receipt failure stays on the successful-payment path. The printer is down, so no slip either: finishing goes home.
assert.deepEqual(destinations(get('receiptError')), ['staff', 'home'])
// 주문번호표는 영수증을 받지 않아도 나온다(사용자 2026-10-20).
assert.deepEqual(destinations(get('receipt')), ['printing', 'printingSlip'])
assert.equal(get('slipError').title, get('complete').title)
assert.deepEqual(destinations(get('slipError')), ['staff', 'home'], 'Both print failures offer staff and finishing without a slip')
assert.match(get('complete').tasks[0], /주문번호표/)
assert.match(get('completeReceipt').tasks[0], /주문번호표와 영수증/)
assert.equal(get('receiptError').title, get('completeReceipt').title)
assert.equal(get('success').primary.to, 'receipt')
assert.equal(get('cashChangeReady').primary.to, 'receipt')
assert.equal(get('mobileSuccess').primary.to, 'receipt')
assert.equal(get('mobileHelp').choices.length, 3)
for (const scene of ['mobileHelp', ...Object.keys(mobilePaymentHelp)]) {
  assert.ok(isMobileHelpScene(scene))
  assert.equal(get(scene).amountLabel, undefined, 'Help is informational, not another payment step')
  assert.equal(get(scene).primary, undefined)
}
assert.equal(isMobileHelpScene('mobileScan'), false)
assert.equal(isMobileHelpScene('mobileProcessing'), false)
assert.ok(Object.keys(cashErrorReasons).length)
assert.deepEqual(destinations(get('cashError', 10000, 'returned')), ['method'], 'Full return: one button back to the method screen')
assert.equal(get('cashError', 10000, 'returned').primary.label, '돈을 챙겼어요 · 결제 방법 다시 고르기')
// 화면 안 ‘직원 부르기’는 문제가 생긴 화면에만 둔다. 정상·기다리는 화면은 아래 기능바를 쓴다(기획 S54, 사용자 C안 2026-10-20).
// 넣은 돈이 모두 나온 현금 오류(returned)는 돈이 걸려 있지 않아 직원 버튼 없이 버튼 하나(사용자 2026-10-29).
const staffScenes = new Set(['device', 'unknown', 'cashError', 'receiptError', 'slipError'])
for (const scene of Object.keys(paymentScenes)) for (const reason of scene === 'cashError' ? Object.keys(cashErrorReasons) : ['change']) {
  const v = view(scene, total, demoDeposit(scene, total, reason), 'unsupported', reason)
  assert.equal(destinations(v).includes('staff'), staffScenes.has(scene) && !(scene === 'cashError' && reason === 'returned'), scene + ' ' + reason + ': staff button only on problem screens')
}
// 기다리기만 하는 화면에서는 기능바를 잠근다(기획 D-20). 할 일이 있는 화면·결제 끝 화면은 잠그지 않는다.
const { paymentLocksUtility: locks } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
for (const scene of ['cardReading', 'cardProcessing', 'mobileProcessing', 'cashCounting', 'cashChangePaying', 'cashCancel', 'printing', 'printingSlip']) assert.ok(locks(scene), scene + ' locks the utility bar')
for (const scene of ['card', 'cashInsert', 'cashMore', 'mobileScan', 'receipt', 'complete', 'device', 'receiptError']) assert.ok(!locks(scene), scene + ' leaves the utility bar open')
// 결제 방법 화면으로 돌아가는 버튼은 어디서나 같은 이름(사용자 2026-10-28 M2). 넣은 돈이 있으면 ‘결제 취소’로 돈부터 돌려준다.
const { homePrintsSlipFirst, homeLosesOrderNumber } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
for (const scene of Object.keys(paymentScenes)) for (const error of Object.keys(cashErrorReasons)) for (const amount of [0, 10000]) for (const canChange of [true, false]) {
  const v = view(scene, total, amount, 'unread', error, canChange)
  for (const a of [v.primary, v.secondary]) if (a?.to === 'method') assert.match(a.label, /^(돈을 챙겼어요( · 결제 방법 다시 고르기)?|결제 방법 다시 고르기)$/, scene + ' names the way back to the method screen the same way')
}
assert.equal(view('cashRejected', total, 3000, 'unread', 'change').secondary.label, '결제 취소', 'With money inside, cancelling returns it first')
// 결제 뒤 ‘처음으로’(사용자 2026-10-28 H1): 번호표가 아직 없으면 번호표부터, 출력 실패면 한 번 더 묻는다. 처리 중·돈·카드 화면은 원래대로 막는다.
for (const scene of ['cashComplete', 'mobileSuccess', 'receipt']) assert.ok(homePrintsSlipFirst(scene) && !blocked(scene, 'change'), scene + ' prints the slip before going home')
for (const scene of ['receiptError', 'slipError']) assert.ok(homeLosesOrderNumber(scene) && !homePrintsSlipFirst(scene), scene + ' asks before the order number disappears')
for (const scene of ['complete', 'completeReceipt', 'card', 'unread']) assert.ok(!homePrintsSlipFirst(scene) && !homeLosesOrderNumber(scene), scene + ' keeps its home rule')
console.log('Payment checks passed: safe retry routes, cash accounting, recovery before reset, shared receipt flow, staff buttons only on problem screens, and a locked bar while waiting.')
