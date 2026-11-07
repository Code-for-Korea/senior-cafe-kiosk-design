// 음성 안내가 실제로 읽는 문장(줄)을 코드에서 모두 뽑아 CSV로 낸다. TTS 요청 목록·문장 수 확인용.
// 쓰는 법: npm run voice:list            → 표준 출력에 CSV
//          npm run voice:list -- out.csv  → 파일로 저장
// ID: 문장 글자로 만든 이름표(src/voice/lineId.ts). 녹음 파일 이름으로 쓴다.
// 화면·결제 장면·대화상자마다 나올 수 있는 경우(직원을 부른 뒤, 개인컵, 쓸 수 없는 결제 방법 조합 등)를 모두 실행하고, 같은 문장은 한 줄로 합친다.
// 고른 뒤 '다음' 버튼 이름은 화면 글자에서 읽으므로, 아래 '고른 뒤' 버튼 이름 목록을 화면과 맞춰 둔다.
const { fileURLToPath } = await import('node:url')
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, ''), out = process.argv[2]
const { createRequire } = await import('node:module')
const { pathToFileURL } = await import('node:url')
const { createServer } = await import(pathToFileURL(createRequire(root + '/package.json').resolve('vite')).href)
const server = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
const G = await server.ssrLoadModule('/src/voice/guides.ts')
const I = await server.ssrLoadModule('/src/voice/VoiceIntro.tsx').catch(() => ({ INTRO_LINE: '음성 안내를 켰어요. 다시 듣기와 음량은 화면 맨 아래에 있어요.' }))
const P = await server.ssrLoadModule('/src/payment/paymentFlow.ts')
const { voiceLineId } = await server.ssrLoadModule('/src/voice/lineId.ts')
await server.close()
const rows = [] // {group, when, line}
const add = (group, when, lines) => lines.forEach(line => line && rows.push({ group, when, line }))
const spoken = g => g.narration?.map(l => l.text) ?? [g.text]
add('공통', '음성 안내를 켤 때', [I.INTRO_LINE])
add('공통', '직원이 90초 안에 오지 않음(창이 닫혀 있을 때)', [G.staffLateNotice])
// 주문 화면
const attract = G.orderGuide('attract'); add('주문', '대기 화면 · 음성 꺼짐', [attract.announce]); add('주문', '대기 화면 · 음성 켜짐', spoken(attract))
for (const s of ['method','menu-loading','menu-empty','dessert','review','cart','cart-soldout','cart-empty','cart-delete']) add('주문', s, spoken(G.orderGuide(s)))
add('주문', 'menu', spoken(G.orderGuide('menu', false, { cartHasItems: true })))
for (const sp of [false, true]) add('주문', 'menu-failed' + (sp ? ' · 직원 부른 뒤' : ''), spoken(G.orderGuide('menu-failed', false, { staffPending: sp })))
for (const ct of [true, false]) add('주문', 'product' + (ct ? ' · 온도 고름' : ' · 온도 정해짐'), spoken(G.orderGuide('product', false, { chooseTemperature: ct })))
add('주문', '안내가 정해지지 않은 주문 화면(예비)', spoken(G.orderGuide('없는화면')))
for (const s of ['temperature','size','caffeine','ice']) add('고르기', s + ' · 고르기 전', spoken(G.orderGuide(s, false, { sizes: ['기본','대','특대'] })))
add('고르기', '고른 뒤(버튼 이름을 못 찾을 때, 예비)', [G.orderGuide('temperature', true).text])
for (const label of ['다음, 기본값 확인','다음, 크기 선택','다음, 카페인 선택','다음, 얼음 선택','다음, 선택 확인','변경 적용','기존 선택 유지']) add('고르기', '고른 뒤', [G.nextButtonLine(label)])
// 결제 방법
const methods = [['card','신용·체크카드'],['cash','현금'],['mobile','모바일 결제']]
for (let mask = 0; mask < 7; mask++) { // 쓸 수 없는 방법 조합(셋 다 못 쓰는 경우 제외)
  const un = methods.filter((_, i) => mask & (1 << i)), ok = methods.filter((_, i) => !(mask & (1 << i)))
  add('결제 방법', '고르기 전', spoken(G.paymentMethodGuide(ok.map(m => m[1]), undefined, un.map(([id, name]) => ({ id, name })))))
}
for (const a of ['카드로 결제하기','현금으로 결제하기','모바일로 결제하기']) add('결제 방법', '고른 뒤', spoken(G.paymentMethodGuide([], a)))
// 결제 진행
const scenes = Object.keys(P.paymentScenes)
for (const scene of scenes) {
  if (P.isMobileHelpScene(scene) && scene !== 'mobileHelp') { /* 도움말 창이 위에 뜨는 스캔 화면 */ }
  const rejectedList = scene === 'cashRejected' ? ['unread','unsupported'] : ['unsupported']
  const errorList = scene === 'cashError' ? ['change','return','unknown','retained','returned','noDeposit'] : ['change']
  for (const rejected of rejectedList) for (const err of errorList) for (const sp of [false, true]) for (const cup of [false, true]) for (const ccm of [true, false]) {
    const display = P.isMobileHelpScene(scene) ? 'mobileScan' : scene
    const v = P.paymentView(display, 5000, 3000, rejected, err, ccm, sp)
    const g = G.paymentGuide(display, { orderNumber: '{N}', personalCup: cup, staffPending: sp, canChangeMethod: ccm, copy: [v.title, v.emphasis ?? '', v.description ?? ''] })
    add('결제 진행', display, spoken(g))
  }
}
add('결제 진행', '안내가 정해지지 않은 결제 화면(예비)', spoken(G.paymentGuide('없는화면')))
// 대화상자
for (const [k, v] of Object.entries(G.dialogVoice)) {
  const variants = typeof v === 'function' ? (k === 'menuReturn' ? [v('계속 고르기'), v('계속 바꾸기')] : k === 'cartOptionList' ? [v(false), v(true)] : k === 'cartOptionStep' ? [v('temperature', '다음, 얼음 선택'), ...['temperature', 'size', 'caffeine', 'ice'].map(step => v(step, '선택 완료', ['기본', '대', '특대']))] : [v()]) : [v]
  for (const d of variants) add('대화상자', k, d.narration.map(n => n.text))
}
const uniq = new Map(); for (const r of rows) { const key = r.line.trim(); if (!uniq.has(key)) uniq.set(key, r) }
const lines = [...uniq.values()]
const spare = new Set(['화면의 안내에 따라 선택해 주세요.', '화면의 안내를 확인해 주세요.', '아래 버튼을 눌러 주세요.'])
const cell = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
const csv = '\ufeff번호,ID,구분,언제,문장,비고\n' + lines.map((r, i) => [i + 1, voiceLineId(r.line), r.group, r.when, r.line, spare.has(r.line) ? '예비(평소에는 나오지 않음)' : ''].map(v => cell(String(v))).join(',')).join('\n') + '\n'
const fs = await import('node:fs')
if (out) { fs.writeFileSync(out, csv); console.error(`음성 문장 ${lines.length}줄 → ${out}`) } else process.stdout.write(csv)
