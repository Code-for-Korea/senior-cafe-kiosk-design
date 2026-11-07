import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
async function moduleAt(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
const { createGuideSpeaker, heardKey, unheardLines, forgetGuide } = await moduleAt('../src/voice/speech.ts')
const { orderGuide, paymentGuide, paymentMethodGuide, dialogVoice, staffLateNotice, nextButtonLine } = await moduleAt('../src/voice/guides.ts')
const { voiceWarningState } = await moduleAt('../src/voice/warning.ts')
let warning = voiceWarningState('hidden', 'failed')
assert.equal(warning, 'visible')
warning = voiceWarningState(warning, 'dismiss')
assert.equal(voiceWarningState(warning, 'failed'), 'dismissed', 'Automatic narration failures on later screens do not reopen a dismissed alert')
assert.equal(voiceWarningState(voiceWarningState(warning, 'retry'), 'failed'), 'visible', 'An explicit retry can report a new failure')
assert.equal(voiceWarningState('visible', 'speaking'), 'hidden', 'Successful playback clears the failure alert')
const { relativeGuideRect, mergeGuideHighlights, placeGuide, intersects } = await moduleAt('../src/voice/placement.ts')
let voices = [{ lang: 'en-US', localService: true }, { lang: 'ko-KR', localService: true }]
const events = new Map(), spoken = [], statuses = []
const synth = { getVoices: () => voices, speak: line => { spoken.push(line); line.onstart() }, cancel: () => {}, addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) }
const settle = () => new Promise(resolve => setTimeout(resolve, 20))
const speaker = createGuideSpeaker(synth, () => ({}), 5)
speaker.speak('첫 안내', x => statuses.push(x))
const first = spoken[0]
assert.equal(first.voice.lang, 'ko-KR')
assert.equal(first.volume, 0.5, 'Initial guide volume is 5 of 10')
// 이미 넘긴 문장은 음량을 바꿔도 그대로라서, 누르기가 멈추면 읽던 문장을 새 음량으로 다시 읽는다.
speaker.setVolume(0.6, '음량 6')
speaker.setVolume(0.7, '음량 7')
assert.equal(spoken.length, 1, 'Volume presses wait until the user stops pressing')
await settle()
assert.deepEqual(spoken.slice(1).map(line => [line.text, line.volume]), [['첫 안내', 0.7]], 'The sentence being read restarts once at the final volume')
speaker.setVolume(3); await settle()
assert.equal(spoken.at(-1).volume, 1, 'Volume clamps to the upper boundary')
speaker.setVolume(-1); await settle()
assert.equal(spoken.at(-1).volume, 0, 'Volume clamps to the lower boundary')
const beforeInvalid = spoken.length
speaker.setVolume(Number.NaN); await settle()
assert.equal(spoken.length, beforeInvalid, 'Invalid volume cannot corrupt speech')
speaker.setVolume(0.6)

speaker.speak('두 번째 안내', x => statuses.push(x))
const second = spoken.at(-1)
assert.equal(second.volume, 0.6, 'Volume persists for the next guide')
await settle()
assert.equal(spoken.at(-1), second, 'A new guide replaces the pending volume replay')
const count = statuses.length
first.onend()
first.onerror()
assert.equal(statuses.length, count, 'Old callbacks cannot change current playback state')
speaker.stop()
second.onend()
assert.equal(statuses.length, count)
// 쉬는 중에 누르면 바뀐 음량을 한 번 말해 준다. 안내 상태(말하는 중 표시)는 바꾸지 않는다.
speaker.speak('세 번째 안내', x => statuses.push(x))
spoken.at(-1).onend()
const idleCount = statuses.length
speaker.setVolume(0.4, '음량 4'); await settle()
assert.deepEqual([spoken.at(-1).text, spoken.at(-1).volume], ['음량 4', 0.4], 'When idle, pressing volume says the new level once')
assert.equal(statuses.length, idleCount, 'The level announcement does not change guide status')
speaker.setVolume(0.5, '음량 5'); await settle()
assert.equal(spoken.at(-1).text, '음량 5', 'Pressing during an announcement says the newest level')
speaker.setVolume(0.3, '음량 3'); speaker.stop(); await settle()
assert.equal(spoken.at(-1).text, '음량 5', 'Turning the guide off cancels a pending volume replay')
// 여러 문장 안내는 읽던 문장부터 다시 읽고, 문장 번호(강조 위치)는 그대로 이어진다.
const resumeQueue = [], resumeStarts = []
const resumeSpeaker = createGuideSpeaker({ ...synth, speak: line => resumeQueue.push(line) }, () => ({}), 5)
resumeSpeaker.speak(['하나', '둘', '셋'], () => {}, i => resumeStarts.push(i))
resumeQueue[0].onstart(); resumeQueue[0].onend(); resumeQueue[1].onstart()
resumeSpeaker.setVolume(0.8); await settle()
assert.deepEqual(resumeQueue.slice(3).map(line => [line.text, line.volume]), [['둘', 0.8], ['셋', 0.8]], 'Volume replay resumes from the sentence being read')
resumeQueue[3].onstart()
assert.deepEqual(resumeStarts, [0, 1, 1], 'Resumed sentences keep their original numbers')
resumeQueue[3].onend()
resumeSpeaker.setVolume(0.9); await settle()
assert.deepEqual(resumeQueue.slice(5).map(line => line.text), ['셋'], 'Between sentences, replay starts at the next one')
resumeSpeaker.stop()
// 새 주문: 읽던 것과 기다리던 음량 다시 읽기를 멈추고, 아무 말 없이 음량만 기본으로 돌린다.
resumeSpeaker.speak(['넷', '다섯'], () => {})
resumeQueue.at(-2).onstart()
resumeSpeaker.setVolume(0.9, '음량 9')
const beforeReset = resumeQueue.length
resumeSpeaker.reset(0.5); await settle()
assert.equal(resumeQueue.length, beforeReset, 'A new order cancels the pending volume replay and says nothing')
resumeSpeaker.speak('대기 화면', () => {})
assert.equal(resumeQueue.at(-1).volume, 0.5, 'The next customer hears the default volume')
resumeSpeaker.reset(Number.NaN)
resumeSpeaker.speak('그대로', () => {})
assert.equal(resumeQueue.at(-1).volume, 0.5, 'An invalid reset volume keeps the current volume')
resumeSpeaker.stop()
voices = []
speaker.speak('음성 준비', x => statuses.push(x))
assert.ok(events.has('voiceschanged'))
voices = [{lang:'ko-KR',localService:true}]
events.get('voiceschanged')()
assert.equal(spoken.at(-1).text, '음성 준비')
assert.equal(events.size, 0)
voices = []
speaker.speak('중단된 안내', () => {})
speaker.stop()
assert.equal(events.size, 0, 'Disable removes the delayed-voice listener')
speaker.speak('재생 불가', x => statuses.push(x))
await new Promise(resolve => setTimeout(resolve, 1850))
assert.equal(statuses.at(-1), 'unavailable')
speaker.stop()
// Sentence emphasis follows actual playback starts, never an elapsed-time estimate.
voices = [{ lang: 'ko-KR', localService: true }]
const queuedLines = [], startedLines = [], sequenceStatuses = []
let cancelCount = 0
const sequenceSpeaker = createGuideSpeaker({ ...synth, speak: line => queuedLines.push(line), cancel: () => cancelCount++ }, () => ({}))
sequenceSpeaker.speak(['지폐를 한 장씩 넣어 주세요.', '넣은 금액은 아래에서 확인할 수 있어요.'], s => sequenceStatuses.push(s), i => startedLines.push(i))
assert.deepEqual(queuedLines.map(line => line.text), ['지폐를 한 장씩 넣어 주세요.', '넣은 금액은 아래에서 확인할 수 있어요.'], 'Both sentences use the native speech queue in order')
assert.deepEqual(startedLines, [], 'Queued speech does not highlight the amount before playback')
const firstLine = queuedLines[0]
firstLine.onstart()
assert.deepEqual(startedLines, [0])
firstLine.onend()
assert.equal(queuedLines.length, 2)
assert.deepEqual(startedLines, [0], 'Wait for the second sentence to actually start')
const amountLine = queuedLines[1]
amountLine.onstart()
assert.deepEqual(startedLines, [0, 1])
firstLine.onend()
assert.equal(queuedLines.length, 2, 'Duplicate completion must not replay the next sentence')
amountLine.onend()
assert.equal(sequenceStatuses.at(-1), 'ready')
amountLine.onerror()
assert.equal(sequenceStatuses.at(-1), 'ready', 'Late errors on completed sentences are ignored')
sequenceSpeaker.speak(['다시 듣기 첫 문장', '취소하면 읽지 않을 문장'], () => {}, i => startedLines.push(i))
const cancelledLine = queuedLines.at(-1), queuedCount = queuedLines.length, startedCount = startedLines.length, beforeCancel = cancelCount
sequenceSpeaker.stop()
assert.equal(cancelCount, beforeCancel + 1, 'Hiding the guide cancels the native queue')
cancelledLine.onstart()
cancelledLine.onend()
assert.equal(queuedLines.length, queuedCount, 'Hiding or leaving the guide cancels the remaining sentences')
assert.equal(startedLines.length, startedCount, 'Cancelled speech cannot restore an old highlight')
sequenceSpeaker.speak(['오류 발생 문장', '읽지 않을 문장'], s => sequenceStatuses.push(s), i => startedLines.push(i))
const failedLine = queuedLines.at(-2), remainingLine = queuedLines.at(-1), beforeFailureCancel = cancelCount
failedLine.onerror()
failedLine.onend()
remainingLine.onstart()
remainingLine.onend()
assert.equal(cancelCount, beforeFailureCancel + 1, 'Speech errors cancel the remaining native queue')
assert.equal(startedLines.length, startedCount, 'Late starts after an error cannot highlight the amount')
assert.equal(sequenceStatuses.at(-1), 'error')
sequenceSpeaker.stop()
// Play the real product script: focus follows each sentence and stale explanations
// cannot restore focus after the user chooses an ordering path.
const productGuide = orderGuide('product'), productFocus = []
sequenceSpeaker.speak(productGuide.narration.map(line => line.text), () => {}, i => productFocus.push(productGuide.narration[i].target))
const [defaultExplanation, customExplanation] = queuedLines.slice(-productGuide.narration.length)
assert.equal(productFocus.length, 0)
defaultExplanation.onstart()
assert.match(productFocus.at(-1), /order-default/)
customExplanation.onstart()
assert.match(productFocus.at(-1), /order-custom/)
const focusCount = productFocus.length
sequenceSpeaker.speak(orderGuide('temperature').narration.map(line => line.text), () => {})
customExplanation.onstart()
assert.equal(productFocus.length, focusCount, 'Choosing an ordering path invalidates the old button emphasis')
sequenceSpeaker.stop()
assert.notEqual(orderGuide('size', false).target, orderGuide('size', true).target)
assert.equal(orderGuide('cart-empty').target, '[data-voice-action="cart-empty-menu"]')
assert.equal(orderGuide('size', true).nextLabelTarget, orderGuide('size', true).target)
assert.equal(paymentGuide('cardProcessing').quiet, true)
assert.match(paymentGuide('unknown').text, /다시 결제하지 말고/)
// 음성 길잡이 범위(기획 D-04): 다음 행동과 위치만. 이름·가격·고른 내용·금액은 읽지 않고, 숫자는 주문번호만.
const spokenText = g => (g.narration ? g.narration.map(line => line.text) : [g.text]).join(' ')
// 이용 방법의 ‘개인컵은 한 잔마다 500원 할인’은 바뀌지 않는 원래 안내라 뺀다.
const orderScreens = ['attract', 'menu', 'menu-loading', 'menu-failed', 'menu-empty', 'product', 'dessert', 'review', 'cart', 'cart-soldout', 'cart-empty', 'cart-delete']
for (const screen of orderScreens) assert.doesNotMatch(spokenText(orderGuide(screen, false, { sizes: ['기본', '대', '특대'], cartHasItems: true })), /\d|원이에요/, screen + ' reads no numbers')
for (const step of ['temperature', 'size', 'caffeine', 'ice']) for (const ready of [false, true]) assert.doesNotMatch(spokenText(orderGuide(step, ready, { sizes: ['기본', '대', '특대'] })), /\d/, step + ' reads no numbers')
const paymentScenes = ['card', 'cardReading', 'cardProcessing', 'success', 'declined', 'unread', 'device', 'unknown', 'cashInsert', 'cashCounting', 'cashMore', 'cashRejected', 'cashComplete', 'cashChangePaying', 'cashChangeReady', 'cashCancel', 'cashCancelReturned', 'cashError', 'mobileChoice', 'mobileScan', 'mobileTap', 'mobileHelp', 'mobileNaver', 'mobileProcessing', 'mobileSuccess', 'receipt', 'printing', 'printingSlip', 'receiptError', 'slipError', 'completeReceipt', 'complete']
for (const scene of paymentScenes) {
  const text = spokenText(paymentGuide(scene, { orderNumber: '27', personalCup: true }))
  // 바뀌는 숫자는 읽지 않는다. 주문번호를 넘겨받아도 끝 화면은 번호를 읽지 않는다(사용자 2026-10-28).
  assert.doesNotMatch(text, /\d/, scene + ' reads no numbers')
}
assert.equal(orderGuide('size', false, { sizes: ['기본', '대', '특대'] }).narration[0].text, '원하는 크기를 기본, 대, 특대 중에서 골라 주세요. 추가 금액은 각 버튼에 적혀 있어요.')
assert.equal(orderGuide('menu', false, { cartHasItems: true }).narration.at(-1).text, '결제하려면, 장바구니 보기를 눌러 주세요.')
assert.equal(orderGuide('menu').narration.length, 2, 'An empty cart adds no line')
assert.deepEqual(paymentMethodGuide(['신용·체크카드', '현금', '모바일 결제']).narration.map(line => line.text), ['결제할 금액은 결제 방법 버튼 위에 있어요.', '신용·체크카드, 현금, 모바일 결제 중에서 골라 주세요.'])
assert.equal(paymentMethodGuide([], '현금으로 결제하기').text, '선택을 확인한 뒤, 현금으로 결제하기 버튼을 눌러 주세요.', 'The real button label, without repeating the choice')
const pay = (scene, info) => spokenText(paymentGuide(scene, info))
assert.equal(pay('card'), '결제 금액은 카드 그림 아래에 있어요. 금색 칩이 위로 보이게 카드를 투입구에 넣어 주세요.')
assert.equal(pay('success'), '결제가 완료됐어요. 카드를 꺼내 챙긴 뒤, 카드를 챙겼어요 버튼을 눌러 주세요.')
assert.equal(pay('complete', { orderNumber: '27' }), '결제가 완료됐어요. 출력된 주문번호표를 챙긴 뒤, 처음으로 버튼을 눌러 주세요.')
assert.equal(pay('completeReceipt', { orderNumber: '27', personalCup: true }), '결제가 완료됐어요. 개인 컵을 카운터에 가져다주세요. 출력된 주문번호표와 영수증을 챙긴 뒤, 처음으로 버튼을 눌러 주세요.')
assert.equal(pay('complete'), '결제가 완료됐어요. 출력된 주문번호표를 챙긴 뒤, 처음으로 버튼을 눌러 주세요.', 'Without a number the final screen still says the payment is done')
// 출력 실패: 번호는 읽지 않고 자리를 알린 뒤, 마치기와 직원 부르기를 왼쪽부터(사용자 2026-10-28).
assert.equal(pay('slipError', { orderNumber: '27' }), '결제가 완료됐어요. 주문번호는 화면에 크게 적혀 있어요. 주문번호표를 출력하지 못했어요. 그냥 마치려면, 번호표 없이 마치기를 눌러 주세요. 주문번호표가 필요하면, 직원 부르기를 눌러 주세요.')
assert.equal(pay('receiptError', { orderNumber: '27', personalCup: true }), '결제가 완료됐어요. 주문번호는 화면에 크게 적혀 있어요. 개인 컵을 카운터에 가져다주세요. 영수증과 주문번호표를 출력하지 못했어요. 그냥 마치려면, 번호표 없이 마치기를 눌러 주세요. 주문번호표가 필요하면, 직원 부르기를 눌러 주세요.')
assert.ok(paymentGuide('slipError').always, 'A print failure is read every time')
const cashMore = paymentGuide('cashMore')
assert.equal(spokenText(cashMore), '넣은 금액과 남은 금액은 지폐 그림 아래에 있어요. 지폐를 한 장씩 넣어 주세요.')
assert.deepEqual(cashMore.lineFocus, { line: 0, target: 'cash-deposited' }, 'The deposited row lights up while its place is described')
assert.equal(pay('receipt'), '주문번호표는 영수증을 받지 않아도 나와요. 영수증이 필요 없으면, 받지 않기를 눌러 주세요. 영수증이 필요하면, 받기를 눌러 주세요.')
// 화면당 음성은 버튼 위치를 알리는 줄 위주(사용자 2026-10-28). 장바구니·확인·디저트는 줄마다 버튼 하나에 테두리를 두른다.
for (const screen of ['cart', 'review', 'dessert']) for (const line of orderGuide(screen).narration) assert.match(line.target, /data-voice-action|button/, screen + ' reads only lines that point at a button: ' + line.text)
// 대화상자: 다음 행동과 버튼 이름만. 메뉴 이름·개수·남은 초 같은 숫자는 읽지 않는다.
const dialogEntries = [...Object.values(dialogVoice).filter(value => typeof value !== 'function'), dialogVoice.menuReturn('계속 고르기'), dialogVoice.cartOptionList(true), dialogVoice.cartOptionList(false), dialogVoice.cartOptionStep('temperature', '다음, 얼음 선택'), dialogVoice.cartOptionStep('size', '선택 완료', ['기본', '대', '특대'])]
const dialogTexts = dialogEntries.flatMap(entry => entry.narration.map(line => line.text))
// 버튼마다 한 문장, 그 문장을 읽는 동안 그 버튼에 테두리(사용자 2026-10-20). 'button:글자'의 글자는 그 문장에 그대로 나온다.
for (const entry of dialogEntries) {
  assert.equal(entry.text, entry.narration.map(line => line.text).join(' '), 'Dialog text is its lines joined')
  for (const line of entry.narration) {
    assert.ok(line.target, 'Every dialog line rings something: ' + line.text)
    if (line.target.startsWith('button:')) assert.ok(line.text.includes(line.target.slice('button:'.length)), 'The ringed button is named in its line: ' + line.text)
  }
}
for (const text of dialogTexts) assert.doesNotMatch(text, /\d/, 'Dialog copy reads no numbers: ' + text)
assert.deepEqual(dialogVoice.menuReturn('계속 바꾸기').narration.map(line => [line.text, line.target]), [['메뉴로 돌아가면 지금 고르던 내용은 취소돼요.', '[data-dialog-copy]'], ['돌아가려면 메뉴로 돌아가기를 눌러 주세요.', 'button:메뉴로 돌아가기'], ['계속하려면 계속 바꾸기를 눌러 주세요.', 'button:계속 바꾸기']])
assert.match(dialogVoice.idle.text, /곧 첫 화면으로/, 'The idle warning says “soon” instead of the countdown')
assert.match(orderGuide('attract').announce, /^화면 아무 곳이나 누르면 주문이 시작돼요\. 음성 안내가 필요하면 아래 음성 안내를 눌러 주세요\.$/, 'The attract screen announces once even with the guide off (S00)')
assert.ok(!orderGuide('menu').announce, 'Only the attract screen announces itself')
assert.notEqual(dialogVoice.cartOptionList(true).text, dialogVoice.cartOptionList(false).text, 'The cart option dialog names the button it shows')
// 같은 상황은 같은 문장(사용자 2026-10-28): 고르기 질문·다음 버튼·바꾸기 버튼은 주문 화면과 장바구니 창이 같은 문장을 쓴다.
assert.equal(nextButtonLine('다음, 크기 선택'), '다음, 크기 선택 버튼을 눌러 주세요.', 'After choosing, the next button is named by its own label')
for (const changed of [true, false]) assert.equal(dialogVoice.cartOptionList(changed).narration.at(-1).text, nextButtonLine(changed ? '변경 적용' : '기존 선택 유지'))
for (const step of ['temperature', 'size', 'caffeine', 'ice']) {
  const sizes = ['기본', '대', '특대']
  assert.equal(dialogVoice.cartOptionStep(step, '선택 완료', sizes).narration[0].text, orderGuide(step, false, { sizes }).text, 'The cart dialog asks the same question as the order screen: ' + step)
}
assert.equal(dialogVoice.cartOptionStep('temperature', '다음, 얼음 선택').narration[1].text, nextButtonLine('다음, 얼음 선택'))
// 직원을 기다리는 말, 다시 부르기, 호출 취소, 계속 주문하기는 어느 창에서나 같은 문장.
assert.equal(dialogVoice.staffWaiting.narration[0].text, orderGuide('menu-failed', false, { staffPending: true }).narration.at(-1).text)
assert.equal(dialogVoice.staffLate.narration[1].text, dialogVoice.idleCalled.narration.at(-1).text)
assert.equal(dialogVoice.staffWaiting.narration[2].text, dialogVoice.staffCancel.narration[1].text)
assert.equal(dialogVoice.idle.narration[0].text, dialogVoice.home.narration[2].text)
// 조건 말머리: ‘아니면’ 대신 무엇을 하려는지 말한다.
for (const text of dialogTexts) assert.doesNotMatch(text, /^아니면/, 'Each choice says what it is for: ' + text)
// 처음으로 확인: 카드가 꽂혀 있을 수 있으면 카드부터, 출력 실패 화면은 주문번호가 사라진다고 알린다(사용자 2026-10-28 M1·H1).
assert.equal(dialogVoice.homeCard.narration[0].text, '꽂혀 있는 카드를 꺼내 주세요.')
assert.equal(dialogVoice.homeCard.narration[0].text, dialogVoice.idleCard.narration[0].text)
assert.match(dialogVoice.homePrintFail.text, /주문번호가 화면에서 사라져요.*계속 보기/)
assert.equal(paymentGuide('cashRejected', { copy: ['지폐를 읽지 못했어요', '', '나온 지폐를 펴서 다시 넣거나\n다른 지폐를 넣어 주세요.'] }).text, '지폐를 읽지 못했어요. 나온 지폐를 펴서 다시 넣거나 다른 지폐를 넣어 주세요.', 'Changing reasons read the screen title and description as sentences')
assert.ok(paymentGuide('card').existing, 'Controls still sit by the on-screen text')
// 상품 화면(음료·디저트)은 마지막에 오른쪽 위 ‘← 메뉴’ 자리를 알린다(사용자 2026-10-19).
assert.deepEqual(orderGuide('product').narration.at(-1), { text: '메뉴로 돌아가려면, 오른쪽 위 메뉴 버튼을 눌러 주세요.', target: '[data-voice-action="menu-back"]' }, 'The drink screen ends with the menu button')
assert.ok(!orderGuide('dessert').narration.some(line => line.target.includes('menu-back')), 'Dessert points at its own back button instead of repeating the top menu button')
// 말풍선 글은 강제 줄바꿈 없이 한 줄로(사용자 2026-10-19). 화면 폭을 넘는 긴 문장만 저절로 줄이 바뀐다.
for (const slot of ['product', 'dessert', 'cart', 'review']) assert.doesNotMatch(orderGuide(slot).text, /\n/, slot + ' bubble has no forced line break')
const reviewBefore = ['고른 내용은 차갑게예요.', '수량은 1개, 모두 4,700원이에요.', '바꾸려면, …', '담으려면, …']
// 같은 문장은 한 주문에 한 번만 저절로 읽는다(사용자 2026-10-19). 다시 듣기·켤 때는 모두 읽는다(VoiceGuideProvider).
const heardReview = new Set(reviewBefore.map(line => heardKey('review', line)))
assert.deepEqual(unheardLines(heardReview, 'review', reviewBefore.with(1, '수량은 2개, 모두 9,400원이에요.')), [1], 'A changed line on the same screen is read')
assert.deepEqual(unheardLines(heardReview, 'review', reviewBefore), [], 'Coming back to a screen in the same order reads nothing')
assert.deepEqual(unheardLines(heardReview, 'cart', ['a', 'b']), [0, 1], 'A new screen reads every line')
assert.deepEqual(unheardLines(heardReview, 'size-next', [reviewBefore[0]]), [0], 'The same sentence on another screen is still read')
assert.deepEqual(unheardLines(new Set(), 'review', reviewBefore), [0, 1, 2, 3], 'A new order reads every line')
// 기획 D-04: 켜진 채 7초 동안 누르지 않으면 지금 화면 안내를 한 번 더(사용자 2026-10-21). 한 화면에 한 번, 누르면 끝.
const { IdleRepeat, IDLE_REPEAT_MS } = await moduleAt('../src/voice/idleRepeat.ts')
assert.ok(IDLE_REPEAT_MS >= 6000 && IDLE_REPEAT_MS <= 8000, 'The repeat waits 6 to 8 seconds as planned')
const idle = new IdleRepeat()
idle.enter('menu'); idle.quiet(0)
assert.equal(idle.due(IDLE_REPEAT_MS - 1), false, 'No repeat before the wait')
idle.speaking(); idle.quiet(3000)
assert.equal(idle.due(IDLE_REPEAT_MS + 2999), false, 'The wait counts from the end of the guide, not from entering')
assert.equal(idle.due(IDLE_REPEAT_MS + 3000), true, 'A still screen repeats the guide')
idle.repeated(); idle.speaking(); idle.quiet(20000)
assert.equal(idle.due(60000), false, 'Only one repeat per screen visit')
idle.enter('menu'); idle.quiet(61000)
assert.equal(idle.due(90000), false, 'The same screen re-reported is not a new visit')
idle.enter('cart'); idle.quiet(100000)
assert.equal(idle.due(100000 + IDLE_REPEAT_MS), true, 'A revisited or new screen gets its own single repeat even if nothing was read on entry')
idle.enter('review'); idle.quiet(200000); idle.input()
assert.equal(idle.due(300000), false, 'A press or key on the screen ends the repeat for that visit')
idle.restart(); idle.quiet(400000)
assert.equal(idle.due(400000 + IDLE_REPEAT_MS), true, 'Turning the guide on again counts the screen afresh')
// 경고·오류는 다시 나타나면 처음부터 읽는다(사용자 2026-10-19). 다른 안내의 기억은 그대로.
const heardMixed = new Set([heardKey('unread', '카드를 읽지 못했어요.'), heardKey('card', '카드를 넣어 주세요.')])
forgetGuide(heardMixed, 'unread')
assert.deepEqual([...heardMixed], [heardKey('card', '카드를 넣어 주세요.')], 'Forgetting an alert keeps other screens heard')
const alertScenes = ['unread', 'declined', 'unknown', 'device', 'cashRejected', 'cashError', 'receiptError', 'slipError']
// 영수증 출력 실패: 버튼마다 말풍선, 음성도 왼쪽 버튼부터 한 줄씩(사용자 A안 2026-10-20).
const receiptError = paymentGuide('receiptError')
assert.deepEqual(receiptError.tips, ['그냥 마치려면', '주문번호표가 필요하면'], 'Each print failure button gets its own bubble, left first')
assert.deepEqual(receiptError.narration.slice(-2).map(line => line.target), ['[data-voice-action="payment-secondary"]', '[data-voice-action="payment-primary"]'], 'Each button is ringed while its line is read')
// 버튼이 두 개인 화면은 버튼마다 말풍선, 음성도 버튼마다 한 줄(왼쪽부터). 말풍선 수 = 버튼 줄 수(사용자 2026-10-20).
const tipped = ['receipt', 'unread', 'declined', 'receiptError', 'device'].map(scene => [scene, paymentGuide(scene)])
// 말풍선은 정말 중요한 곳에만(사용자 2026-10-20): 상품·디저트·장바구니·결제 화면은 말풍선 없이 음성·테두리만. 조건 말풍선이 있는 결제 화면만 예외.
for (const screen of ['dessert', 'cart']) assert.ok(!orderGuide(screen).tips, screen + ' has no button bubbles')
assert.ok(orderGuide('product').noBubble && orderGuide('dessert').noBubble, 'Product screens use no sentence bubble')
// 음료 두 주문 길·기기 문제·휴대폰 결제 방법: 버튼마다 조건 말풍선, 그 말풍선 글로 그 버튼 줄을 시작한다(사용자 2026-10-21).
assert.deepEqual(orderGuide('product').tips, ['온도만 고르고 담으려면', '직접 하나씩 고르려면'], 'A drink offers each order path with its own bubble')
assert.deepEqual(orderGuide('product', false, { chooseTemperature: false }).tips[0], '기본 그대로 담으려면', 'With nothing to choose, the quick path says so')
assert.deepEqual(paymentGuide('device').tips, ['도움이 필요하면', '다른 방법으로 결제하려면'])
assert.ok(!paymentGuide('device', { canChangeMethod: false }).tips, 'With only staff left there is one button and no button bubbles')
assert.deepEqual(paymentGuide('mobileChoice').tips, ['바코드·QR로 결제하려면', '휴대폰을 대서 결제하려면'])
for (const [g, targets] of [
  [orderGuide('product'), ['[data-voice-action="order-default"]', '[data-voice-action="order-custom"]']],
  [paymentGuide('mobileChoice'), ['[data-voice-action="payment-choice-mobileScan"]', '[data-voice-action="payment-choice-mobileTap"]']],
  [paymentGuide('device'), ['[data-voice-action="payment-secondary"]', '[data-voice-action="payment-primary"]']],
]) targets.forEach((target, i) => assert.ok(g.narration.find(line => line.target === target).text.startsWith(g.tips[i] + ','), g.id + ' line ' + i + ' starts with its bubble'))
// 메뉴를 받는 중은 말만(결제 처리 중처럼), 받지 못함은 오류라 매번 읽고 다시 불러오기 → 직원 부르기 순서(사용자 L1·F 2026-10-20).
assert.equal(orderGuide('menu-loading').quiet, true, 'Waiting for the menu only speaks')
assert.ok(orderGuide('menu-failed').always && orderGuide('menu-failed').noBubble, 'A menu load failure is read every time, without a bubble')
assert.deepEqual(orderGuide('menu-failed').narration.map(line => line.target), ['[data-menu-load-failed] > div', '[data-voice-action="menu-retry"]', '[data-voice-utility] button[aria-label="직원 부르기"]'])
// 직원을 부른 뒤에는 ‘직원 부르기를 눌러’ 대신 기다리라고 하고, 바뀐 버튼(직원 호출 중)에 테두리를 두른다.
assert.deepEqual(orderGuide('menu-failed', false, { staffPending: true }).narration.at(-1), { text: '직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.', target: '[data-voice-utility] button[data-pending]' })
assert.deepEqual(dialogVoice.idleCalled.narration.map(line => line.target).at(-1), 'button:다시 부르기', 'A late call offers calling again in the timeout warning')
// 직원을 이미 불렀으면 ‘직원 부르기를 눌러’ 대신 기다리라고 말한다(버튼 이름이 ‘직원 호출 중’으로 바뀜, 사용자 2026-10-20).
for (const scene of ['device', 'unknown', 'receiptError']) assert.doesNotMatch(paymentGuide(scene, { staffPending: true }).narration.map(line => line.text).join(' '), /직원 부르기/, scene + ' does not ask to call again')
assert.equal(paymentGuide('device', { staffPending: true }).narration.find(line => line.target === '[data-voice-action="payment-secondary"]').text, '직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.')
assert.equal(paymentGuide('device', { staffPending: true, canChangeMethod: false }).narration.at(-1).text, '직원을 불렀어요. 이 자리에서 잠시 기다려 주세요.')
// 기기 문제: 다른 방법이 남아 있으면 왼쪽(직원)부터, 할 일(결제 방법 다시 고르기)이 마지막. 남은 방법이 없으면 직원만(사용자 2026-10-20).
assert.deepEqual(paymentGuide('device').narration.map(line => line.target).slice(1), ['[data-voice-action="payment-secondary"]', '[data-voice-action="payment-primary"]'])
assert.match(paymentGuide('device').narration.at(-1).text, /결제 방법 다시 고르기/)
assert.doesNotMatch(spokenText(paymentGuide('device', { canChangeMethod: false })), /결제 방법/, 'With no method left, only staff is offered')
assert.match(paymentGuide('device').narration.find(line => line.target === '[data-voice-action="payment-secondary"]').text, /직원 부르기를 눌러/, 'Before calling, the button is named')
// 직원이 오래 안 옴(기획 G01-LATE): 상태 → 다시 부르기 → 주문 화면 보기, 숫자(90초)는 읽지 않는다(D-04).
assert.deepEqual(dialogVoice.staffLate.narration.map(line => line.target), ['[data-dialog-copy]', 'button:다시 부르기', 'button:주문 화면 보기'])
assert.doesNotMatch(dialogVoice.staffLate.text, /\d/, 'The late notice reads no numbers')
// 창을 닫은 채 오래되면 한 번: 상태와 다시 부르는 자리(아래 알림 줄)만, 숫자 없이.
assert.equal(staffLateNotice, '아직 직원이 오지 않았어요. 다시 부르려면 화면 아래 알림 줄을 눌러 주세요.')
// 현금 장치를 쓸 수 없으면 숨기지 않고 알린 뒤, 고를 수 있는 것만 읽는다(기획 D-19, 사용자 A안 2026-10-20).
const cashOff = paymentMethodGuide(['신용·체크카드', '모바일 결제'], undefined, [{ name: '현금', id: 'cash' }])
assert.deepEqual(cashOff.narration.map(line => line.text), ['결제할 금액은 결제 방법 버튼 위에 있어요.', '현금은 지금 쓸 수 없어요.', '신용·체크카드, 모바일 결제 중에서 골라 주세요.'])
assert.equal(cashOff.narration[1].target, '[data-payment-method="cash"]')
assert.equal(paymentMethodGuide(['신용·체크카드', '현금', '모바일 결제']).narration.length, 2, 'With cash on, nothing extra is read')
assert.equal(paymentMethodGuide(['현금', '모바일 결제'], undefined, [{ name: '신용·체크카드', id: 'card' }]).narration[1].text, '신용·체크카드는 지금 쓸 수 없어요.', 'A method with a device problem is named as unavailable')
assert.equal(paymentMethodGuide(['현금', '모바일 결제'], undefined, [{ name: '신용·체크카드', id: 'card' }]).narration[1].target, '[data-payment-method="card"]')
// 빈 장바구니: 글 → 메뉴 보러 가기, 말풍선 없음(사용자 2026-10-20).
assert.ok(orderGuide('cart-empty').noBubble, 'An empty cart has no bubble')
assert.deepEqual(orderGuide('cart-empty').narration.map(line => line.target), ['[data-cart-empty] h2', '[data-voice-action="cart-empty-menu"]'])
// 뺄 메뉴 고르기: 목록 → 선택한 메뉴 빼기 → 선택 취소, 말풍선 없음(사용자 2026-10-20).
assert.ok(orderGuide('cart-delete').noBubble, 'Picking items to remove has no bubble')
assert.deepEqual(orderGuide('cart-delete').narration.map(line => line.target), ['[data-cart-list-viewport]', '[data-voice-action="cart-remove-selected"]', '[data-voice-action="cart-remove-cancel"]'])
for (const scene of paymentScenes) { const g = paymentGuide(scene); assert.ok(g.tips || g.noBubble, scene + ' shows no sentence bubble unless it has button bubbles') }
assert.ok(paymentMethodGuide(['현금']).noBubble && paymentMethodGuide(['현금'], '현금으로 결제하기').noBubble, 'The payment method screen shows no bubble')
for (const [name, g] of tipped) {
  assert.equal(g.tips?.length, 2, name + ' has a bubble per button')
  const buttonLines = g.narration.filter(line => /data-voice-action="(payment-secondary|payment-primary)"/.test(line.target))
  assert.equal(buttonLines.length, 2, name + ' reads one line per button')
}
for (const scene of paymentScenes) assert.equal(!!paymentGuide(scene).always, alertScenes.includes(scene), scene + (alertScenes.includes(scene) ? ' is read every time' : ' is read once per order'))
const targets = [{x:64,y:900,width:952,height:400}]
// A native scrolling layer retains its coordinates at the top, after a swipe,
// and when remeasured while scrolled. No screen-position catch-up is needed.
const localTitle = { x: 96, y: 40, width: 500, height: 70 }
for (const scroll of [0, 50, 450, 800]) {
  const origin = { x: 64, y: 320 - scroll, width: 952, height: 1600 }
  const title = { ...localTitle, x: origin.x + localTitle.x, y: origin.y + localTitle.y }
  assert.deepEqual(relativeGuideRect(title, origin), localTitle, 'Title/mask keep the same content coordinates even offscreen')
}
// Rings are drawn 20px outside each card (12px gap + 8px line). Choices 24px apart
// then overlap and share one ring instead of two touching ones.
const ringOutset = 20, ring = r => ({ x: r.x - ringOutset, y: r.y - ringOutset, width: r.width + ringOutset * 2, height: r.height + ringOutset * 2 })
assert.deepEqual(mergeGuideHighlights([{x:96,y:94,width:416,height:400}, {x:536,y:94,width:416,height:400}].map(ring)),
  [{x:76,y:74,width:896,height:440}], 'Neighbouring choices share one ring')
assert.deepEqual(mergeGuideHighlights([...targets, {x:64,y:1200,width:952,height:80}]), targets, 'A description inside its picture shares the picture ring')
assert.deepEqual(mergeGuideHighlights([{x:64,y:900,width:952,height:200}, {x:64,y:1200,width:952,height:100}, {x:64,y:1080,width:952,height:150}]), targets, 'Overlapping rings merge transitively without crossing separate areas')
assert.equal(mergeGuideHighlights([...targets, {x:64,y:1400,width:952,height:100}]).length, 2, 'Separate areas keep separate rings')
const buttons = [{x:64,y:1500,width:952,height:128}]
const p = placeGuide(1080,1920,120,640,1736,targets,buttons)
assert.ok(p && p.y >= 640 && p.y + p.height <= 1736)
assert.equal(p.x, 64)
assert.equal(p.width, 952, 'Bubbles share the content edges instead of following target text width')
assert.equal([...targets, ...buttons].some(r => intersects(p,r)), false)
assert.equal(placeGuide(1080,1920,120,640,1736,[{x:0,y:0,width:1080,height:1920}],[]), null)
const amount = {x:64,y:1300,width:952,height:120}
const action = {x:64,y:1454,width:952,height:128}
const resultBubble = placeGuide(1080,1920,124,32,1736,[action],[amount])
assert.ok(resultBubble && !intersects(resultBubble,amount), 'Result guidance must never cover the payment amount')
// 녹음 파일 틀기(사용자 2026-10-29): 파일이 있는 줄은 파일을, 없는 줄은 브라우저 음성을 차례로. 파일을 못 틀면 그 줄만 브라우저 음성으로.
{
  const plays = [], synthQueue = []
  const fakeAudio = (text, fail = false) => ({ text, volume: 0, currentTime: 0, onplay: null, onended: null, onerror: null,
    play() { plays.push(this); if (fail) return Promise.reject(new Error('no file')); this.onplay?.(); return Promise.resolve() }, pause() { this.paused = true } })
  const have = new Map([['하나', false], ['셋', false], ['넷', true]])
  const files = { has: text => have.has(text), create: text => fakeAudio(text, have.get(text)) }
  const fileSynth = { ...synth, speak: line => { synthQueue.push(line); line.onstart() } }
  const starts = [], statusLog = []
  const mixed = createGuideSpeaker(fileSynth, () => ({}), 5, files)
  mixed.setVolume(0.7); await settle()
  mixed.speak(['하나', '둘', '셋', '넷'], x => statusLog.push(x), i => starts.push(i))
  assert.deepEqual(plays.map(a => a.text), ['하나'], 'Only the first line plays until it ends')
  assert.equal(plays[0].volume, 0.7, 'A file plays at the guide volume')
  assert.deepEqual(starts, [0])
  plays[0].onended()
  assert.deepEqual(synthQueue.map(l => l.text), ['둘'], 'A line without a file is read by the browser voice, after the file ends')
  assert.equal(synthQueue[0].rate, 1, 'Normal speed')
  synthQueue[0].onend()
  assert.deepEqual(plays.map(a => a.text), ['하나', '셋'], 'The next file plays after the browser line ends')
  plays[1].onended()
  await settle()
  assert.deepEqual(synthQueue.map(l => l.text), ['둘', '넷'], 'A file that fails to play falls back to the browser voice for that line')
  assert.deepEqual(starts, [0, 1, 2, 3], 'Line numbers stay in order for the highlights')
  synthQueue[1].onend()
  assert.equal(statusLog.at(-1), 'ready', 'Finishing the last line reports ready')
  // 음량을 바꾸면 읽던 줄(파일)부터 다시 튼다.
  mixed.speak(['하나', '셋'], () => {}, i => starts.push(i))
  plays.at(-1).onended()
  mixed.setVolume(0.3); await settle()
  assert.deepEqual([plays.at(-1).text, plays.at(-1).volume], ['셋', 0.3], 'Volume replay restarts the current file at the new volume')
  mixed.stop()
  assert.ok(plays.at(-1).paused, 'Stopping pauses the file')
  // 파일이 하나도 없는 안내는 예전처럼 한꺼번에 넘긴다.
  const before = synthQueue.length
  mixed.speak(['둘', '다섯'], () => {})
  assert.equal(synthQueue.length - before, 2, 'Without files, all lines are queued at once')
  mixed.stop()
}
console.log('Voice guide checks passed: Korean voice selection, volume replay, stale callback cancellation, delayed voices, unavailable fallback, static copy, collision-free bubbles, and one repeat after 7 idle seconds.')

const progress = {x:64,y:480,width:952,height:112}
const headerBubble = placeGuide(1080,1920,124,32,1736,targets,[...buttons,progress])
assert.ok(headerBubble && !intersects(headerBubble,progress), 'The progress strip is an obstacle, not free space')
