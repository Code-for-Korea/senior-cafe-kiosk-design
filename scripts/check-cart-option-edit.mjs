import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

// 의존성을 설치하지 않고 실제 옵션 편집 로직을 임시 폴더에서 실행한다.
const directory = mkdtempSync(join(tmpdir(), 'kiosk-cart-option-check-'))
try {
  for (const name of ['orderDefaults', 'menuData', 'orderPricing', 'cartOptionEdit', 'selectionSummary', 'cartSelection']) {
    const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
    writeFileSync(join(directory, `${name}.js`), outputText)
  }
  const require = createRequire(import.meta.url)
  const { selectCartOption, cartOrderReady, cartOrderChanged } = require(join(directory, 'cartOptionEdit.js'))
  const { unitPrice, cupDiscount, entryUnitPrice } = require(join(directory, 'orderPricing.js'))
  const { menuItems } = require(join(directory, 'menuData.js'))
  const original = Object.freeze({ temperature: 'COLD', sizeCode: 'M', sizeMl: 480, caffeineType: 'CAFFEINATED', iceAmount: 'LESS' })
  const small = selectCartOption(original, original, { option: 'size', value: 'S' })
  assert.deepEqual(small, { ...original, sizeCode: 'S', sizeMl: null })
  const decaf = selectCartOption(original, original, { option: 'caffeine', value: 'DECAF' })
  assert.deepEqual(decaf, { ...original, caffeineType: 'DECAF' })
  const noIce = selectCartOption(original, original, { option: 'ice', value: 'NONE' })
  assert.deepEqual(noIce, { ...original, iceAmount: 'NONE' })
  const hot = selectCartOption(original, original, { option: 'temperature', value: 'HOT' })
  assert.equal(hot.iceAmount, null)
  assert.equal(cartOrderReady(hot), true)
  const restored = selectCartOption(hot, original, { option: 'temperature', value: 'COLD' })
  assert.deepEqual(restored, original)
  assert.equal(cartOrderChanged(original, restored), false)
  const coldDraft = selectCartOption(hot, hot, { option: 'temperature', value: 'COLD' })
  assert.equal(cartOrderReady(coldDraft), false)
  const readyDraft = selectCartOption(coldDraft, hot, { option: 'ice', value: 'NORMAL' })
  assert.equal(cartOrderReady(readyDraft), true)
  assert.deepEqual(readyDraft, { ...hot, temperature: 'COLD', iceAmount: 'NORMAL' })
  assert.equal(hot.temperature, 'HOT')
  assert.equal(hot.iceAmount, null)
  assert.equal(original.iceAmount, 'LESS')
  assert.equal(cartOrderChanged(original, decaf), true)
  const americano = menuItems.find(item => item.id === '1')
  const venti = selectCartOption(original, original, { option: 'size', value: 'L' })
  assert.equal(unitPrice(americano, small), 4700)
  assert.equal(unitPrice(americano, original), 5300)
  assert.equal(unitPrice(americano, venti), 6100)
  assert.equal(unitPrice(americano, venti) * 2, 12200)
  // 크기 변경 시 추가금은 누적되지 않고 새 크기 기준으로 다시 계산한다.
  const backToRegular = selectCartOption(venti, original, { option: 'size', value: 'S' })
  assert.equal(unitPrice(americano, backToRegular) * 2, 9400)
  // 특대도 HOT/COLD 모두 주문 가능하고, 온도 변경은 얼음만 초기화한다.
  const hotLarge = selectCartOption(venti, venti, { option: 'temperature', value: 'HOT' })
  assert.deepEqual(hotLarge, { ...venti, temperature: 'HOT', iceAmount: null })
  assert.equal(cartOrderReady(hotLarge), true)
  assert.equal(unitPrice(americano, hotLarge), 6100)
  const hotUpsized = selectCartOption(hot, hot, { option: 'size', value: 'L' })
  assert.deepEqual(hotUpsized, { ...hot, sizeCode: 'L', sizeMl: venti.sizeMl })
  assert.equal(cartOrderReady(hotUpsized), true)
  assert.deepEqual(selectCartOption(hotLarge, venti, { option: 'temperature', value: 'COLD' }), venti)
  const coldLarge = selectCartOption(hotLarge, hotLarge, { option: 'temperature', value: 'COLD' })
  assert.equal(coldLarge.sizeCode, 'L')
  assert.equal(cartOrderReady(coldLarge), false)
  assert.equal(cartOrderReady(selectCartOption(coldLarge, hotLarge, { option: 'ice', value: 'NORMAL' })), true)
  assert.equal(cartOrderReady({ ...small, sizeCode: null }), false)
  assert.equal(cartOrderReady({ ...small, caffeineType: null }), false)
  assert.equal(cartOrderReady({ ...small, iceAmount: null }), false)
  const dessert = menuItems.find(item => item.kind === '디저트')
  assert.equal(unitPrice(dessert, venti), Number(dessert.price.replace(/\D/g, '')))
  const { cartTotals, cartRemovalSelection, removeCartItems } = require(join(directory, 'cartSelection.js'))
  const latte = menuItems.find(item => item.id === '2')
  const latteEntry = { id: 1, product: latte, order: venti, quantity: 3 }
  // 이전 시연에서 남은 selected=false도 전체 결제 금액에 포함한다.
  const americanoEntry = { id: 2, product: americano, order: small, quantity: 1, selected: false }
  const basket = [latteEntry, americanoEntry]
  assert.deepEqual(cartTotals(basket), { count: 4, total: 24500 })
  assert.deepEqual(cartRemovalSelection(basket, []), { selectedIds: [], selectedCount: 0, allSelected: false, partiallySelected: false })
  assert.deepEqual(cartRemovalSelection(basket, [1]), { selectedIds: [1], selectedCount: 1, allSelected: false, partiallySelected: true })
  assert.deepEqual(cartRemovalSelection(basket, [1, 2]), { selectedIds: [1, 2], selectedCount: 2, allSelected: true, partiallySelected: false })
  assert.deepEqual(cartRemovalSelection(basket, [1, 1, 999]).selectedIds, [1])
  assert.equal(cartRemovalSelection([], []).allSelected, false)
  assert.equal(cartRemovalSelection([latteEntry], [1]).allSelected, true)
  assert.deepEqual(cartTotals(removeCartItems(basket, [1])), { count: 1, total: 4700 })
  assert.deepEqual(cartTotals(removeCartItems(basket, [1, 2])), { count: 0, total: 0 })
  assert.deepEqual(removeCartItems(basket, []), basket)
  assert.deepEqual(removeCartItems(basket, [999]), basket)
  const duplicateProduct = { ...latteEntry, id: 3, quantity: 2 }
  assert.deepEqual(removeCartItems([...basket, duplicateProduct], [1]), [americanoEntry, duplicateProduct])
  assert.deepEqual(cartTotals([{ ...latteEntry, order: small, quantity: 2 }, americanoEntry]), { count: 3, total: 15100 })
  assert.equal(basket.length, 2)
  assert.equal(latteEntry.quantity, 3)
  // 가격은 이용방법과 무관하다. 개인컵 할인은 장바구니 줄의 personalCup 플래그로만 적용(한 잔당 500원, 디저트 제외).
  assert.equal(unitPrice(americano, small), 4700)
  assert.equal(unitPrice(americano, original), 5300)
  assert.equal(unitPrice(americano, venti), 6100)
  assert.equal(cupDiscount({ product: americano, personalCup: true }), 500)
  assert.equal(cupDiscount({ product: americano, personalCup: false }), 0)
  assert.equal(cupDiscount({ product: dessert, personalCup: true }), 0)
  assert.equal(entryUnitPrice({ id: 1, product: americano, order: small, quantity: 1, personalCup: true }), 4200)
  assert.equal(entryUnitPrice({ id: 1, product: americano, order: venti, quantity: 1, personalCup: true }), 5600)
  assert.equal(entryUnitPrice({ id: 1, product: americano, order: small, quantity: 1 }), 4700)
  assert.equal(entryUnitPrice({ id: 1, product: dessert, order: small, quantity: 1, personalCup: true }), Number(dessert.price.replace(/\D/g, '')))
  const dessertPrice = Number(dessert.price.replace(/\D/g, ''))
  const cupBasket = [{ ...americanoEntry, quantity: 2, personalCup: true }, { id: 3, product: dessert, order: small, quantity: 1 }]
  const noCupBasket = [{ ...americanoEntry, quantity: 2 }, { id: 3, product: dessert, order: small, quantity: 1 }]
  assert.equal(cartTotals(cupBasket).total, 8400 + dessertPrice)   // (4700-500)×2 + 디저트
  assert.equal(cartTotals(noCupBasket).total, 9400 + dessertPrice) // 4700×2 + 디저트 (할인 없음)
  assert.equal(americano.price, '4,700원')
  assert.equal(cartTotals([]).total, 0)
  // 할인이 가격을 음수로 만들지 않는다. 중복 할인 없이 한 번만 500원.
  assert.equal(entryUnitPrice({ id: 1, product: { ...americano, price: '300원' }, order: small, quantity: 1, personalCup: true }), 0)
  // 같은 메뉴·같은 옵션을 또 담으면 묻고, 더 담으면 그 줄 수량에 더한다.
  const { findSameCartItem, addToCartItem, sameItemMessage } = require(join(directory, 'cartSelection.js'))
  const rooibos = menuItems.find(item => item.id === '6')
  const coldBasic = { temperature: 'COLD', sizeCode: 'S', sizeMl: null, caffeineType: null, iceAmount: 'NORMAL' }
  const rooibosEntry = { id: 7, product: rooibos, order: coldBasic, quantity: 1 }
  const sameBasket = [latteEntry, rooibosEntry]
  assert.equal(findSameCartItem(sameBasket, rooibos, { ...coldBasic }), rooibosEntry, 'Same menu and options are found')
  assert.equal(findSameCartItem(sameBasket, rooibos, { ...coldBasic, iceAmount: 'LESS' }), undefined, 'A different ice amount is a different line')
  assert.equal(findSameCartItem(sameBasket, rooibos, { ...coldBasic, sizeCode: 'M' }), undefined, 'A different size is a different line')
  assert.equal(findSameCartItem(sameBasket, americano, coldBasic), undefined, 'A different menu is a different line')
  const hotRooibos = { ...rooibosEntry, order: { ...coldBasic, temperature: 'HOT', iceAmount: null } }
  assert.equal(findSameCartItem([hotRooibos], rooibos, { ...coldBasic, temperature: 'HOT', iceAmount: 'NORMAL' }), hotRooibos, 'Hidden ice on a hot drink does not make it different')
  const cakeEntry = { id: 8, product: dessert, order: { temperature: null, sizeCode: null, sizeMl: null, caffeineType: null, iceAmount: null }, quantity: 2 }
  assert.equal(findSameCartItem([cakeEntry], dessert, cakeEntry.order), cakeEntry, 'The same dessert is found')
  assert.deepEqual(addToCartItem(sameBasket, 7, 2, 9).map(item => item.quantity), [3, 3], 'Adding more raises only that line')
  assert.equal(addToCartItem([{ ...rooibosEntry, quantity: 8 }], 7, 3, 9)[0].quantity, 9, 'Quantity stops at the stepper maximum')
  assert.equal(rooibosEntry.quantity, 1, 'The original cart is not changed')
  // 어르신이 읽기 쉽게 한 줄에 한 문장, 메뉴 이름·옵션 목록 없이 '똑같이 고른'으로.
  assert.deepEqual(sameItemMessage(rooibosEntry, 1, 9), ['장바구니에 똑같이 고른 메뉴가 1개 있어요.', '더 담으면 모두 2개가 돼요.'])
  assert.deepEqual(sameItemMessage(cakeEntry, 1, 9), ['장바구니에 똑같이 고른 메뉴가 2개 있어요.', '더 담으면 모두 3개가 돼요.'])
  assert.deepEqual(sameItemMessage({ ...latteEntry, quantity: 2 }, 3, 9), ['장바구니에 똑같이 고른 메뉴가 2개 있어요.', '더 담으면 모두 5개가 돼요.'])
  assert.deepEqual(sameItemMessage({ ...latteEntry, quantity: 8 }, 2, 9), ['장바구니에 똑같이 고른 메뉴가 8개 있어요.', '더 담으면 모두 9개가 돼요.', '한 메뉴는 9개까지예요.'])
  // 담은 뒤 알림(F-1): 메뉴 이름 + 을/를, 아래 줄은 장바구니 카드와 같은 고른 내용 + 수량. 더 담으면 합친 수.
  const { addedNoticeCopy } = require(join(directory, 'cartSelection.js'))
  assert.deepEqual(addedNoticeCopy(rooibosEntry), { title: '오렌지 루이보스를 담았어요', detail: '차갑게 · 크기-기본 · 얼음 보통 · 1개' })
  assert.deepEqual(addedNoticeCopy({ ...rooibosEntry, quantity: 3 }, true), { title: '오렌지 루이보스를 더 담았어요', detail: '차갑게 · 크기-기본 · 얼음 보통 · 모두 3개' })
  assert.deepEqual(addedNoticeCopy(cakeEntry), { title: '딸기케이크를 담았어요', detail: '2개' }, 'A dessert shows only the quantity')
  assert.equal(addedNoticeCopy({ ...cakeEntry, product: { ...dessert, name: '크루아상' } }).title, '크루아상을 담았어요', 'A final consonant takes 을')
  // 장바구니 ‘선택 바꾸기’로 다른 줄과 똑같아지면 고친 줄 하나로 합친다(2026-10-21 사용자 B).
  const { applyCartEdit } = require(join(directory, 'cartSelection.js'))
  const lessIce = { ...rooibosEntry, id: 9, order: { ...coldBasic, iceAmount: 'LESS' }, quantity: 2 }
  const editBasket = [rooibosEntry, latteEntry, lessIce]
  assert.equal(findSameCartItem(editBasket, rooibos, lessIce.order, lessIce.id), undefined, 'The line being edited is not its own match')
  assert.equal(findSameCartItem(editBasket, rooibos, coldBasic, lessIce.id), rooibosEntry, 'Editing into another line finds that line')
  const merged = applyCartEdit(editBasket, lessIce.id, { ...coldBasic }, 9)
  assert.deepEqual(merged.map(item => [item.id, item.quantity]), [[latteEntry.id, latteEntry.quantity], [9, 3]], 'The other line goes away and the edited line keeps its place with both quantities')
  assert.equal(merged[1].order.iceAmount, 'NORMAL', 'The merged line has the new choice')
  assert.deepEqual(merged[1].optionHistory, { ice: '얼음 적게' }, 'The merged line remembers what was changed')
  assert.equal(editBasket.length, 3, 'The original cart is not changed by an edit')
  assert.equal(applyCartEdit([{ ...rooibosEntry, quantity: 6 }, { ...lessIce, quantity: 5 }], lessIce.id, { ...coldBasic }, 9)[0].quantity, 9, 'A merge stops at the stepper maximum')
  const plain = applyCartEdit(editBasket, lessIce.id, { ...coldBasic, iceAmount: 'NONE' }, 9)
  assert.deepEqual(plain.map(item => [item.id, item.quantity, item.order.iceAmount ?? null]), [[7, 1, 'NORMAL'], [latteEntry.id, latteEntry.quantity, latteEntry.order.iceAmount ?? null], [9, 2, 'NONE']], 'Without a matching line only the edited line changes')
  assert.equal(applyCartEdit(editBasket, 99, coldBasic, 9), editBasket, 'An unknown line leaves the cart alone')
  assert.deepEqual(sameItemMessage(rooibosEntry, 2, 9, '합치면'), ['장바구니에 똑같이 고른 메뉴가 1개 있어요.', '합치면 모두 3개가 돼요.'])
  // 모든 메뉴 × 고를 수 있는 모든 옵션 조합: 똑같으면 같은 줄로 찾고, 하나라도 다르면(다른 메뉴 포함) 따로 담는다.
  const combos = product => {
    if (product.kind === '디저트') return [{ temperature: null, sizeCode: null, sizeMl: null, caffeineType: null, iceAmount: null }]
    const result = []
    for (const temperature of product.temp.map(value => value.toUpperCase()))
      for (const sizeCode of ['S', 'M', 'L'])
        for (const caffeineType of product.kind === '커피' ? ['CAFFEINATED', 'DECAF'] : [null])
          for (const iceAmount of temperature === 'COLD' && product.iceChoice !== false ? ['NORMAL', 'LESS', 'NONE'] : [null])
            result.push({ temperature, sizeCode, sizeMl: null, caffeineType, iceAmount })
    return result
  }
  const everyLine = menuItems.flatMap(product => combos(product).map(order => ({ product, order })))
  let sameChecks = 0
  for (const [index, line] of everyLine.entries()) {
    const entry = { id: index + 100, product: line.product, order: line.order, quantity: 1 }
    for (const other of everyLine) {
      const same = other === line
      const found = findSameCartItem([entry], other.product, { ...other.order, sizeMl: 999 })
      assert.equal(found, same ? entry : undefined, `${line.product.name} ${JSON.stringify(line.order)} vs ${other.product.name} ${JSON.stringify(other.order)}`)
      sameChecks++
    }
  }
  console.log(`같은 메뉴 다시 담기: 메뉴 ${menuItems.length}개 · 옵션 조합 ${everyLine.length}개 · 비교 ${sameChecks}번 — 똑같을 때만 같은 줄, 그 줄 수량만 더하기, 최대 9, 확인창 문구, 담은 뒤 알림 문구: 통과`)
  console.log('개인컵: 줄별 음료당 할인·수량·추가금·디저트 제외·음수 방지·이용방법 무관: 통과')
  console.log('전체 금액·실제 수량, 삭제 카드 수·전체/부분/0개 선택, ID별 삭제·삭제 후 합계: 통과')
  console.log('사이즈별 추가금·수량 합계·크기 재변경, 특대 HOT/COLD 전환, 미완료 담기 차단: 통과')
  console.log('옵션별 독립 수정, 원본 보존, 원래 온도·얼음 복원, 얼음 선택 전 저장 차단: 통과')
} finally {
  rmSync(directory, { recursive: true, force: true })
}
