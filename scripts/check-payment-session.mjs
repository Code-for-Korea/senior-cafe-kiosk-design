import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const directory = mkdtempSync(join(tmpdir(), 'kiosk-payment-session-'))
try {
  for (const name of ['paymentFlow', 'paymentSession']) {
    const source = readFileSync(new URL(`../src/payment/${name}.ts`, import.meta.url), 'utf8')
    writeFileSync(join(directory, name + '.js'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)
  }
  const require = createRequire(import.meta.url)
  const { initialPaymentSession: initial, paymentSessionReducer: reduce, paymentBlocksHome: blocked, paymentIsPaid: paid, paymentAllowsTimeout: timesOut } = require(join(directory, 'paymentSession.js'))
  const { paymentView } = require(join(directory, 'paymentFlow.js'))
  const total = 7500
  const select = (method, state = initial) => reduce(state, { type: 'select', method, total })
  const demo = (state, id, amount = total) => reduce(state, { type: 'demo', id, total: amount })
  const go = (state, to) => reduce(state, { type: 'navigate', to, total })
  assert.equal(reduce(initial, { type: 'select', method: 'card', total: 0 }), initial, 'Empty orders cannot enter payment')
  let card = select('card')
  assert.equal(go(card, 'success'), card, 'Customer navigation cannot manufacture approval')
  card = demo(card, 'next')
  assert.ok(blocked(card))
  card = go(demo(card, 'unread'), 'card')
  assert.equal(card.step, 'card', 'Unread card can retry')
  card = demo(demo(card, 'next'), 'next')
  const declined = demo(card, 'declined')
  assert.equal(go(declined, 'method').step, 'method')
  const unknown = demo(card, 'unknown')
  assert.ok(blocked(unknown))
  assert.equal(go(unknown, 'method'), unknown, 'Unknown approval cannot retry without explicit resolution')
  assert.equal(demo(unknown, 'resolved').step, 'method')
  // 기기 문제: 그 방법은 이번 주문에서 잠기고, 다른 방법은 고를 수 있다. 직원 조치가 끝나면 풀린다.
  const device = demo(card, 'device')
  assert.deepEqual(device.unavailable, ['card'])
  const back = go(device, 'method')
  assert.equal(back.step, 'method')
  assert.equal(select('card', back), back, 'A method with a device problem cannot be picked again')
  assert.equal(select('cash', back).step, 'cashInsert')
  assert.deepEqual(select('cash', back).unavailable, ['card'], 'The lock stays for this order')
  assert.deepEqual(demo(device, 'resolved').unavailable, [], 'Staff fixing the device lifts the lock')
  card = demo(card, 'next')
  assert.ok(blocked(card), 'Successful card payment still needs card collection')
  card = go(card, 'receipt')
  assert.ok(paid(card))
  const printing = go(card, 'printing')
  assert.ok(blocked(printing))
  assert.equal(demo(printing, 'next').step, 'completeReceipt')
  const receiptError = demo(printing, 'receipt-error')
  assert.ok(paid(receiptError))
  assert.equal(go(receiptError, 'method'), receiptError, 'Printer failure cannot request a second payment')
  assert.equal(go(receiptError, 'complete'), receiptError, 'After a print failure there is no slip to collect; finishing goes home')
  // 영수증을 받지 않아도 주문번호표는 출력된다.
  const slip = go(card, 'printingSlip')
  assert.equal(slip.step, 'printingSlip')
  assert.ok(blocked(slip))
  assert.equal(demo(slip, 'next').step, 'complete')
  const slipError = demo(slip, 'slip-error')
  assert.equal(slipError.step, 'slipError')
  assert.ok(paid(slipError))
  assert.equal(go(slipError, 'method'), slipError, 'Slip failure cannot request a second payment')

  let cash = demo(select('cash'), 'next')
  const rejected = demo(cash, 'unsupported')
  assert.equal(rejected.deposited, 0)
  assert.equal(rejected.rejected, 'unsupported')
  cash = demo(demo(go(rejected, 'cashInsert'), 'next'), 'bill-5000')
  assert.equal(cash.step, 'cashMore')
  assert.equal(cash.deposited, 5000)
  assert.deepEqual(paymentView(cash.step, total, cash.deposited, cash.rejected, cash.error).moneyRows.at(-1), ['남은 금액', 2500])
  assert.equal(demo(cash, 'bill-5000'), cash, 'Bill credit is accepted only while checking a bill')
  let cancel = go(cash, 'cashCancel')
  assert.ok(blocked(cancel))
  assert.equal(go(cancel, 'method'), cancel, 'Cash cannot be discarded before confirmed return')
  cancel = demo(cancel, 'next')
  assert.equal(cancel.deposited, 5000, 'Show the full returned amount until collected')
  cancel = go(cancel, 'method')
  assert.equal(cancel.deposited, 0)
  cash = demo(demo(cash, 'next'), 'bill-5000')
  assert.equal(cash.step, 'cashChangePaying')
  assert.equal(cash.deposited, 10000)
  const error = demo(cash, 'cash-error')
  assert.ok(blocked(error))
  assert.equal(go(error, 'method'), error)
  assert.equal(demo(error, 'resolved').deposited, 0)
  cash = demo(cash, 'next')
  assert.ok(blocked(cash), 'Change must be collected before finishing')
  assert.equal(go(cash, 'receipt').step, 'receipt')
  const exact = demo(demo(select('cash'), 'next'), 'bill-5000', 5000)
  assert.equal(exact.step, 'cashComplete')
  assert.ok(paid(exact))

  for (const to of ['mobileScan', 'mobileTap']) {
    let mobile = go(select('mobile'), to)
    mobile = demo(demo(mobile, 'next'), 'next')
    assert.equal(mobile.step, 'mobileSuccess')
    // 영수증을 받지 않아도 주문번호표를 출력한 뒤 완료 화면으로.
    assert.equal(demo(go(go(mobile, 'receipt'), 'printingSlip'), 'next').step, 'complete')
  }
  assert.deepEqual(reduce(card, { type: 'reset' }), initial)
  // 시간 초과로 첫 화면에 돌아가도 되는 결제 화면은 결제 전·미결제뿐(사용자 2026-10-21 ①). 돈·카드·처리 중은 멈추고, 결제 끝은 완료 자동 복귀(D-13)로 따로.
  const { paymentScenes } = require(join(directory, 'paymentFlow.js'))
  const timeoutScenes = Object.keys(paymentScenes).filter(step => timesOut({ ...initial, step, error: 'noDeposit' }))
  assert.deepEqual(timeoutScenes.sort(), ['card', 'cashError', 'cashInsert', 'declined', 'mobileChoice', 'mobileHelp', 'mobileKakao', 'mobileNaver', 'mobileScan', 'mobileTap', 'mobileToss', 'receiptError', 'slipError', 'unread'].sort())
  assert.equal(timesOut({ ...initial, step: 'method' }), true, 'Choosing a payment method can time out like the order screens')
  assert.equal(timesOut({ ...initial, step: 'cashError', error: 'change' }), false, 'Money still owed holds the screen')
  for (const step of ['cardProcessing', 'unknown', 'device', 'cashCounting', 'printing']) assert.equal(timesOut({ ...initial, step }), false, step + ' holds the screen')
  for (const step of ['receipt', 'complete']) assert.equal(timesOut({ ...initial, step }), false, step + ' waits for the completion auto-return')
  // 출력 실패는 번호표가 없어 말없이 넘어가지 않고, 주문 화면처럼 90초 뒤 경고 창(30초)을 거친다(사용자 2026-10-28).
  for (const step of ['receiptError', 'slipError']) assert.equal(timesOut({ ...initial, step }), true, step + ' uses the 90+30 second warning')
  // 결제 끝 화면은 저절로 넘어간다: 영수증 고르기 전 30초 → 주문번호표만, 완료 20초 → 첫 화면(기획 S60·D-13, 사용자 2026-10-21).
  const autoScenes = Object.keys(paymentScenes).filter(step => paymentView(step, total, 5000, 'unread', 'change').autoNext)
  assert.deepEqual(autoScenes.sort(), ['cashComplete', 'complete', 'completeReceipt', 'mobileSuccess', 'receipt'].sort())
  for (const step of ['cashComplete', 'mobileSuccess', 'receipt']) {
    assert.deepEqual(paymentView(step, total, 7500, 'unread', 'change').autoNext, { seconds: 30, to: 'printingSlip', text: '후 영수증 없이 진행해요.' }, step)
    assert.equal(reduce({ ...initial, step, deposited: 7500 }, { type: 'navigate', to: 'printingSlip', total }).step, 'printingSlip', step + ' can move on by itself to the order number slip')
  }
  for (const step of ['completeReceipt', 'complete']) assert.deepEqual(paymentView(step, total, 0, 'unread', 'change').autoNext, { seconds: 20, to: 'home', text: '후 첫 화면으로 돌아가요.' }, step)
  for (const step of ['success', 'cashChangeReady', 'printing', 'printingSlip']) assert.equal(paymentView(step, total, 10000, 'unread', 'change').autoNext, undefined, step + ' waits while a card, money or a print is in the way')
  assert.equal(reduce({ ...initial, step: 'cashComplete', deposited: 7500 }, { type: 'navigate', to: 'complete', total }).step, 'cashComplete', 'Only the buttons and the timed step are allowed')
  // 직원을 부른 뒤 문제 화면 글은 ‘불러 주세요’ 대신 기다리라고 한다(음성과 같은 말, 사용자 2026-10-21).
  for (const [scene, error, canChange] of [['device', 'none', true], ['device', 'none', false], ['unknown', 'none', true], ['cashError', 'change', true], ['cashError', 'unknown', true]]) {
    const before = paymentView(scene, total, 5000, 'unread', error, canChange).description
    const after = paymentView(scene, total, 5000, 'unread', error, canChange, true).description
    assert.match(before, /불러 주세요|요청해 주세요/, scene + ' asks to call staff before the call')
    assert.match(after, /기다려 주세요/, scene + ' asks to wait after the call')
    assert.doesNotMatch(after, /불러 주세요|요청해 주세요/, scene + ' no longer asks to call staff')
  }
  for (const scene of ['receiptError', 'slipError']) {
    assert.match(paymentView(scene, total, 0, 'unread', 'change').description, /직원을 부르면 주문번호표를 대신 드려요/, scene + ' says why to call staff')
    assert.match(paymentView(scene, total, 0, 'unread', 'change', true, true).description, /기다려 주세요/, scene + ' asks to wait after the call')
  }
  console.log('Payment flow checks passed: card/cash/mobile, recovery, cash return/collection, printer failure, order number slip, and reset.')
} finally { rmSync(directory, { recursive: true, force: true }) }
