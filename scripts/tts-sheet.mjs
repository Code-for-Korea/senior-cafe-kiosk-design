// TTS 요청용 문장 목록을 만든다(docs/tts/). 음성 문장을 바꾸면 다시 실행한다.
// 쓰는 법: npm run voice:tts            → docs/tts/TTS-문장목록.csv(전체), TTS-문장목록-성공흐름.csv를 새로 씀
//          node scripts/tts-sheet.mjs --check  → 파일이 지금 코드와 같은지만 검사(npm run check에 포함)
// 파일 이름은 문장 글자로 만든 이름표(src/voice/lineId.ts)다. 문장을 고치면 그 줄의 이름만 바뀐다.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const check = process.argv.includes('--check')
const listed = spawnSync(process.execPath, [root + 'scripts/list-voice-lines.mjs'], { encoding: 'utf8', maxBuffer: 1 << 24 })
if (listed.status !== 0) { process.stderr.write(listed.stderr); process.exit(1) }

// 따옴표가 든 CSV 칸을 읽는다.
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}
const [head, ...body] = parseCsv(listed.stdout.replace(/^﻿/, ''))
const col = name => head.indexOf(name)
const lines = body.map(r => ({ id: r[col('ID')], group: r[col('구분')], when: r[col('언제')], text: r[col('문장')], note: r[col('비고')] }))

// 코드 이름(언제 칸)을 사람이 읽는 화면 이름으로.
const flow = readFileSync(root + 'src/payment/paymentFlow.ts', 'utf8')
const scenes = Object.fromEntries([...flow.slice(flow.indexOf('export const paymentScenes'), flow.indexOf('} as const')).matchAll(/(\w+): '([^']+)'/g)].map(m => [m[1], m[2]]))
const order = {
  method: '이용 방법', menu: '메뉴', 'menu-loading': '메뉴 · 불러오는 중', 'menu-empty': '메뉴 · 조건에 맞는 메뉴 없음',
  dessert: '상품(디저트)', review: '고른 내용 확인', cart: '장바구니', 'cart-soldout': '장바구니 · 품절 메뉴 있음',
  'cart-empty': '장바구니 · 비어 있음', 'cart-delete': '장바구니 · 뺄 메뉴 고르기', 'menu-failed': '메뉴 · 못 불러옴',
  'menu-failed · 직원 부른 뒤': '메뉴 · 못 불러옴(직원 부른 뒤)', 'product · 온도 고름': '상품(음료)',
  'product · 온도 정해짐': '상품(음료) · 온도가 정해져 있을 때', 'temperature · 고르기 전': '온도 고르기',
  'size · 고르기 전': '크기 고르기', 'caffeine · 고르기 전': '카페인 고르기', 'ice · 고르기 전': '얼음 고르기',
}
const dialogs = {
  idle: '시간 초과 경고', idleCalled: '시간 초과 경고(직원 부른 뒤)', idlePrintFail: '시간 초과 경고 · 출력 실패',
  idlePrintFailCalled: '시간 초과 경고 · 출력 실패(직원 부른 뒤)', idleCard: '시간 초과 경고 · 카드 화면',
  idleCardCalled: '시간 초과 경고 · 카드 화면(직원 부른 뒤)', home: '처음으로 확인', homeCard: '처음으로 확인 · 카드 읽기 실패·거절',
  homePrintFail: '처음으로 확인 · 출력 실패', staffCall: '직원 부르기', staffWaiting: '직원 호출 중', staffLate: '직원이 오지 않음',
  staffCancel: '직원 호출 취소', remove: '장바구니에서 빼기', sameItem: '같은 메뉴 다시 담기', mergeItem: '같은 메뉴로 합치기',
  menuReturn: '메뉴로 돌아가기', cancelEdit: '변경 취소', personalCup: '개인컵 안내', orderMethod: '이용 방법 바꾸기',
  language: '언어 선택', cartOptionList: '장바구니 · 선택 바꾸기(목록)', cartOptionStep: '장바구니 · 선택 바꾸기(고르기)',
  productInfo: '상품 정보', paymentDetails: '결제 금액 내역', mobileHelp: '결제 코드 도움말', search: '메뉴 검색',
}
const place = ({ group, when }) => group === '대화상자' ? '대화상자 · ' + (dialogs[when] ?? when)
  : group === '결제 진행' ? (scenes[when] ?? when)
  : group === '결제 방법' ? '결제 방법 · ' + when
  : order[when] ?? when
// 읽는 방식이 갈릴 수 있는 말(요청서 3절).
const pronounce = text => [
  text.includes('500원') && "'500원'은 '오백 원'으로",
  text.includes('신용·체크카드') && "'신용·체크카드'는 '신용 체크카드'로(가운뎃점에서 길게 쉬지 않음)",
  text.includes('바코드·QR') && "'바코드·QR'은 '바코드 큐알'로",
  /^다음, /.test(text) && "버튼 이름 '다음 · ○○'을 읽는 것. 쉼표에서 짧게 쉼",
].filter(Boolean).join(' / ')

const cell = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
// 번호: 만드는 분이 파일 이름을 번호로 붙여도 되게(사용자 2026-10-29). 받은 파일은 scripts/voice-rename.mjs가 이름표로 바꾼다.
// 단계·쓰는 곳은 앞줄과 같으면 비워 둔다(사용자 2026-10-29: 분류와 묶음이 보이게). 문장은 그대로.
const toCsv = (rows, stageOf = () => '') => '﻿번호,단계,쓰는 곳,파일 이름,문장,글자 수,발음 메모,비고\n'
  + rows.map((l, i) => { const stage = stageOf(l), where = place(l); const prev = rows[i - 1]
    return [String(i + 1), prev && stageOf(prev) === stage ? '' : stage, prev && place(prev) === where && stageOf(prev) === stage ? '' : where, l.id, l.text, String(l.text.length), pronounce(l.text), l.note].map(cell).join(',') }).join('\n') + '\n'

const ids = new Set(lines.map(l => l.id))
if (ids.size !== lines.length) { console.error('이름표가 겹치는 문장이 있어요. src/voice/lineId.ts를 확인해 주세요.'); process.exit(1) }

// 성공 흐름만(사용자 2026-10-29): 주문을 끝까지 마치고 카드·현금·휴대폰으로 결제가 되는 길에서 듣는 문장.
// 전체가 너무 많을 때 먼저 만들어 달라고 할 목록. 오류·경고·직원 호출·시간 초과·대화상자·예비 문장은 뺀다.
const successWhen = new Set([
  '음성 안내를 켤 때', '대기 화면 · 음성 꺼짐', '대기 화면 · 음성 켜짐', 'method', 'menu', 'product · 온도 고름', 'product · 온도 정해짐', 'dessert',
  'temperature · 고르기 전', 'size · 고르기 전', 'caffeine · 고르기 전', 'ice · 고르기 전', 'review', 'cart',
  'card', 'cardReading', 'success', 'cashInsert', 'cashCounting', 'cashMore', 'cashComplete', 'cashChangePaying', 'cashChangeReady',
  'mobileChoice', 'mobileScan', 'mobileTap', 'mobileProcessing', 'receipt', 'printing', 'printingSlip', 'completeReceipt', 'complete',
])
const successLine = l => successWhen.has(l.when)
  || (l.when === '고른 뒤' && l.text.startsWith('다음, '))
  || (l.group === '결제 방법' && (l.when === '고른 뒤' || l.text === '신용·체크카드, 현금, 모바일 결제 중에서 골라 주세요.' || l.text === '결제할 금액은 결제 방법 버튼 위에 있어요.'))
// 손님이 만나는 순서대로 묶는다(단계 → 화면).
const successOrder = [
  ['주문', '공통|음성 안내를 켤 때'], ['주문', '주문|대기 화면 · 음성 꺼짐'], ['주문', '주문|대기 화면 · 음성 켜짐'], ['주문', '주문|method'], ['주문', '주문|menu'],
  ['주문', '주문|product · 온도 고름'], ['주문', '주문|product · 온도 정해짐'],
  ['주문', '고르기|temperature · 고르기 전'], ['주문', '고르기|size · 고르기 전'], ['주문', '고르기|caffeine · 고르기 전'], ['주문', '고르기|ice · 고르기 전'], ['주문', '고르기|고른 뒤'],
  ['주문', '주문|review'], ['주문', '주문|dessert'], ['주문', '주문|cart'],
  ['결제 방법', '결제 방법|고르기 전'], ['결제 방법', '결제 방법|고른 뒤'],
  ['카드', '결제 진행|card'], ['카드', '결제 진행|cardReading'], ['카드', '결제 진행|success'],
  ['현금', '결제 진행|cashInsert'], ['현금', '결제 진행|cashCounting'], ['현금', '결제 진행|cashMore'], ['현금', '결제 진행|cashComplete'], ['현금', '결제 진행|cashChangePaying'], ['현금', '결제 진행|cashChangeReady'],
  ['휴대폰', '결제 진행|mobileChoice'], ['휴대폰', '결제 진행|mobileScan'], ['휴대폰', '결제 진행|mobileTap'], ['휴대폰', '결제 진행|mobileProcessing'],
  ['영수증·완료', '결제 진행|receipt'], ['영수증·완료', '결제 진행|printing'], ['영수증·완료', '결제 진행|printingSlip'], ['영수증·완료', '결제 진행|completeReceipt'], ['영수증·완료', '결제 진행|complete'],
]
const orderKey = l => l.group + '|' + l.when
const stageIndex = new Map(successOrder.map(([stage, key], i) => [key, { stage, i }]))
const successLines = lines.filter(l => successLine(l) && !l.text.includes('개인 컵') && stageIndex.has(orderKey(l)))
  .map((l, i) => ({ l, i })).sort((a, b) => stageIndex.get(orderKey(a.l)).i - stageIndex.get(orderKey(b.l)).i || a.i - b.i).map(({ l }) => l)
const successStage = l => stageIndex.get(orderKey(l)).stage
// 전체 목록의 단계는 구분 칸 그대로.
const fullStage = l => l.group
const outputs = {
  'docs/tts/TTS-문장목록.csv': toCsv(lines, fullStage),
  'docs/tts/TTS-문장목록-성공흐름.csv': toCsv(successLines, successStage),
}
for (const [path, text] of Object.entries(outputs)) {
  if (check) {
    if (!existsSync(root + path) || readFileSync(root + path, 'utf8') !== text) { console.error(`${path}가 지금 음성 문장과 달라요. npm run voice:tts로 다시 만들어 주세요.`); process.exit(1) }
  } else writeFileSync(root + path, text)
}
const chars = lines.reduce((sum, l) => sum + l.text.length, 0)
console.log(`TTS 목록: ${lines.length}줄, ${chars}자(띄어쓰기 포함) · 성공 흐름 ${successLines.length}줄, ${successLines.reduce((sum, l) => sum + l.text.length, 0)}자${check ? ' · 최신' : ' → docs/tts/'}`)
