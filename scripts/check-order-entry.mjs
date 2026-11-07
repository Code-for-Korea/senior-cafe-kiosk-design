import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const directory = mkdtempSync(join(tmpdir(), 'kiosk-order-entry-check-'))
try {
  for (const name of ['orderDefaults', 'orderEntry', 'menuData', 'orderPricing', 'selectionSummary', 'cartOptionEdit', 'productInfoPages']) {
    const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
    writeFileSync(join(directory, `${name}.js`), outputText)
  }
  const require = createRequire(import.meta.url)
  const { entryTemperature, beginOrder } = require(join(directory, 'orderEntry.js'))
  const { menuItems, menuImage, menuTemperatures, hasIceChoice, nutritionRows, availableKindFilters, availableDessertFilters } = require(join(directory, 'menuData.js'))
  const { optionSteps, reviewOptionChanges } = require(join(directory, 'selectionSummary.js'))
  const { cartOrderReady, selectCartOption } = require(join(directory, 'cartOptionEdit.js'))
  const coffee = menuItems.find(item => item.name === '아메리카노')
  assert.deepEqual(menuTemperatures(coffee), ['hot', 'cold'])
  assert.deepEqual(menuTemperatures(coffee, 'HOT'), ['hot'])
  assert.deepEqual(menuTemperatures(coffee, 'COLD'), ['cold'])
  assert.deepEqual(menuTemperatures(menuItems.find(item => item.kind === '디저트')), [])
  for (const temperature of [null, 'COLD', 'HOT']) {
    const entry = entryTemperature(coffee, temperature)
    assert.equal(entry, temperature)
    for (const mode of ['default', 'custom']) {
      const result = beginOrder(mode, entry)
      assert.equal(result.order.temperature, temperature)
      assert.equal(result.screen, temperature === null ? 'temperature' : mode === 'default' ? 'review' : 'size')
      assert.equal(cartOrderReady(result.order), mode === 'default' && temperature !== null)
      assert.equal(result.order.iceAmount, mode === 'default' && temperature === 'COLD' ? 'NORMAL' : null)
      if (mode === 'custom') {
        assert.equal(result.order.sizeCode, null)
        assert.equal(result.order.caffeineType, null)
      }
    }
  }
  // 크기부터 시작해도 온도 값과 바꾸기 경로가 단계 목록에 남는다.
  const editTemperature = () => {}
  const cold = beginOrder('custom', entryTemperature(coffee, 'COLD'))
  const steps = optionSteps(cold.order, { current: 'size', onEdit: { temperature: editTemperature } })
  assert.equal(steps[0].value, '차갑게')
  assert.equal(steps[0].state, 'done')
  assert.equal(steps[0].onEdit, editTemperature)
  assert.equal(steps[1].state, 'current')
  assert.ok(steps.some(step => step.key === 'ice'))
  const hot = beginOrder('custom', 'HOT')
  assert.ok(!optionSteps(hot.order, { current: 'size', onEdit: {} }).some(step => step.key === 'ice'))
  // 다른 메뉴·전체·검색으로 진입하면 앞 주문의 온도와 옵션은 전달하지 않는다.
  cold.order.sizeCode = 'L'
  assert.equal(entryTemperature(coffee), null)
  assert.deepEqual(beginOrder('custom', entryTemperature(coffee)).order, {
    temperature: null, sizeCode: null, sizeMl: null, caffeineType: null, iceAmount: null,
  })
  assert.equal(beginOrder('default', 'COLD').order.sizeCode, 'S')
  assert.equal(entryTemperature({ ...coffee, temp: ['cold'] }), 'COLD')
  assert.equal(entryTemperature({ ...coffee, temp: ['hot'] }, 'COLD'), 'HOT')
  assert.equal(entryTemperature(menuItems.find(item => item.kind === '디저트'), 'COLD'), null)
  // 실제 메뉴·사진·단일 온도·상품별 필수 옵션을 함께 검증한다.
  assert.deepEqual(menuItems.map(item => item.name), ['아메리카노', '카페라떼', '녹차 스무디', '딸기 스무디', '오렌지 루이보스', '딸기케이크'])
  assert.deepEqual(availableKindFilters('전체'), ['모든 종류', '커피', '차·티', '스무디'])
  assert.deepEqual(availableKindFilters('따뜻함'), ['모든 종류', '커피', '차·티'])
  assert.deepEqual(availableKindFilters('차가움'), ['모든 종류', '커피', '차·티', '스무디'])
  assert.deepEqual(availableDessertFilters(), ['조각케이크'])
  assert.deepEqual(availableKindFilters('전체', []), ['모든 종류'])
  assert.deepEqual(availableDessertFilters([]), [])
  const tea = menuItems.find(item => item.name === '오렌지 루이보스')
  assert.equal(tea.kind, '차·티')
  assert.equal(tea.price, '5,100원')
  assert.deepEqual(nutritionRows(tea.nutrition), [
    { label: '열량 (칼로리)', value: '0 kcal' }, { label: '당류', value: '0 g' },
    { label: '단백질', value: '0 g' }, { label: '포화지방', value: '0 g' },
    { label: '나트륨', value: '25 mg' }, { label: '카페인', value: '0 mg' },
  ])
  for (const temperature of ['HOT', 'COLD']) {
    assert.equal(menuImage(tea, temperature), `./assets/menu/rooibos-${temperature === 'HOT' ? 'hot' : 'iced'}.png`)
    const result = beginOrder('default', temperature, tea)
    assert.equal(result.order.temperature, temperature)
    assert.equal(result.order.caffeineType, null)
    assert.equal(result.order.iceAmount, temperature === 'COLD' ? 'NORMAL' : null)
    assert.equal(cartOrderReady(result.order, tea), true)
  }
  for (const item of menuItems) {
    for (const image of [item.imageUrl, ...Object.values(item.temperatureImages ?? {})]) {
      assert.ok(existsSync(new URL(`../public/${image}`, import.meta.url)), image)
    }
    if (item.kind === '커피') {
      assert.match(menuImage(item), /-hot.jpg$/)
      assert.match(menuImage(item, 'HOT'), /-hot.jpg$/)
      assert.match(menuImage(item, 'COLD'), /-iced.jpg$/)
    }
  }
  const green = menuItems.find(item => item.name === '녹차 스무디')
  const smoothie = menuItems.find(item => item.name === '딸기 스무디')
  assert.equal(green.price, '6,100원')
  assert.deepEqual(smoothie.nutrition, { servingNote: '1회 제공량 기준 입니다.', calories: 280, sugarsG: 59, proteinG: 5, fatG: 11 })
  assert.match(smoothie.info.find(row => row.label === '영양 정보').value, /당류\u00a059\u00a0g/)
  assert.equal(coffee.nutrition.proteinG, undefined)
  const { productInfoPages } = require(join(directory, 'productInfoPages.js'))
  for (const item of menuItems) {
    const pages = productInfoPages(item)
    assert.equal(pages[0].kind, 'description')
    assert.equal(pages[0].value, item.description)
    assert.deepEqual(pages.filter(page => page.kind === 'details').flatMap(page => page.rows), item.info.filter(row => row.label !== '영양 정보'))
    assert.deepEqual(pages.filter(page => page.kind === 'nutrition').flatMap(page => page.rows), nutritionRows(item.nutrition))
    assert.equal(pages.filter(page => page.kind === 'nutrition').length, item === tea ? 2 : 1)
    assert.ok(pages.filter(page => page.kind === 'details').every(page => page.rows.length > 0 && page.rows.length <= 2))
  }
  assert.equal(productInfoPages(smoothie).length, 3)
  assert.equal(productInfoPages(coffee).length, 3)
  assert.equal(productInfoPages({ ...coffee, description: undefined, info: [], nutrition: undefined }).length, 1)
  assert.equal(smoothie.price, '6,900원')
  assert.equal(hasIceChoice(green), false)
  assert.equal(hasIceChoice(smoothie), false)
  for (const item of [green, smoothie]) {
    for (const requested of [null, 'HOT', 'COLD']) {
      const result = beginOrder('default', requested, item)
      assert.equal(result.order.temperature, 'COLD')
      assert.equal(result.screen, 'review')
      assert.equal(result.order.caffeineType, null)
      assert.equal(cartOrderReady(result.order, item), true)
      assert.equal(cartOrderReady({ ...result.order, temperature: 'HOT' }, item), false)
      assert.equal(cartOrderReady({ ...result.order, caffeineType: 'DECAF' }, item), false)
      assert.equal(selectCartOption(result.order, result.order, { option: 'temperature', value: 'HOT' }, item), result.order)
      assert.equal(selectCartOption(result.order, result.order, { option: 'caffeine', value: 'DECAF' }, item), result.order)
      const rows = optionSteps(result.order, { current: 'review', product: item, onEdit: { temperature: () => {}, size: () => {} } })
      assert.ok(!rows.some(row => row.key === 'caffeine'))
      assert.equal(rows[0].onEdit, undefined)
      assert.equal(rows.some(row => row.key === 'ice'), hasIceChoice(item))
    }
    const custom = beginOrder('custom', null, item)
    assert.equal(custom.screen, 'size')
    assert.equal(cartOrderReady(custom.order, item), false)
    const sized = selectCartOption(custom.order, custom.order, { option: 'size', value: 'M' }, item)
    assert.equal(cartOrderReady(sized, item), !hasIceChoice(item))
    const ready = hasIceChoice(item) ? selectCartOption(sized, sized, { option: 'ice', value: 'LESS' }, item) : sized
    assert.equal(cartOrderReady(ready, item), true)
    const { unitPrice } = require(join(directory, 'orderPricing.js'))
    assert.equal(unitPrice(item, ready), Number(item.price.replace(/\D/g, '')) + 600)
  }
  console.log('새 메뉴 가격·사진 파일, 온도별 이미지, 차가운 전용 메뉴·상품별 옵션·크기 가격: 통과')
  // 최종 확인 최초값이 기준: 여러 번 수정해도 직전값이 기준이 되지 않는다.
  const original = Object.freeze({ temperature: 'HOT', sizeCode: 'S', sizeMl: null, caffeineType: 'CAFFEINATED', iceAmount: null })
  assert.deepEqual(reviewOptionChanges(original, original), {})
  const large = { ...original, sizeCode: 'M' }
  assert.equal(reviewOptionChanges(original, large).size.kind, 'changed')
  assert.equal(reviewOptionChanges(original, large).size.previous, '기본')
  const largest = { ...large, sizeCode: 'L' }
  assert.equal(reviewOptionChanges(original, largest).size.previous, '기본')
  assert.deepEqual(reviewOptionChanges(original, { ...largest, sizeCode: 'S' }), {})
  const newCold = { ...original, temperature: 'COLD', iceAmount: 'NORMAL' }
  assert.deepEqual(reviewOptionChanges(original, newCold), {
    temperature: { kind: 'changed', previous: '따뜻하게' }, ice: { kind: 'added' },
  })
  assert.deepEqual(reviewOptionChanges(original, { ...newCold, iceAmount: 'LESS' }).ice, { kind: 'added' })
  assert.deepEqual(reviewOptionChanges(original, { ...newCold, temperature: 'HOT', iceAmount: null }), {})
  // 원래 차가운 주문이면 얼음 재등장은 신규 옵션이 아니며, 원래 얼음값과 비교한다.
  const originalCold = Object.freeze({ ...original, temperature: 'COLD', iceAmount: 'NORMAL' })
  assert.deepEqual(reviewOptionChanges(originalCold, { ...originalCold, iceAmount: 'LESS' }).ice,
    { kind: 'changed', previous: '얼음 보통' })
  assert.deepEqual(reviewOptionChanges(originalCold, originalCold), {})
  assert.equal(reviewOptionChanges(originalCold, { ...originalCold, temperature: 'HOT', iceAmount: null }).ice, undefined)
  assert.equal(original.temperature, 'HOT')
  assert.equal(original.sizeCode, 'S')
  console.log('최초 확인값 비교·반복 변경·원복·조건부 신규 옵션·얼음 원래값 판정: 통과')
  console.log('온도별 두 주문 경로, 기본 얼음, 온도 바꾸기 표시, 새 주문 초기화, 단일 온도·디저트: 통과')
} finally {
  rmSync(directory, { recursive: true, force: true })
}
