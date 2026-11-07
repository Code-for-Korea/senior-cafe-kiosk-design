import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const directory = mkdtempSync(join(tmpdir(), 'kiosk-color-check-'))
function contrast(a, b) {
  const luminance = hex => {
    const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
  }
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (high + 0.05) / (low + 0.05)
}
try {
  const source = readFileSync(new URL('../src/colorSystem.ts', import.meta.url), 'utf8')
  writeFileSync(join(directory, 'colorSystem.js'), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText)
  copyFileSync(new URL('../src/color-tokens.json', import.meta.url), join(directory, 'color-tokens.json'))
  const require = createRequire(import.meta.url)
  const { lightColors, highContrastColors, lightColorVariables, highContrastColorVariables } = require(join(directory, 'colorSystem.js'))
  const raw = require(join(directory, 'color-tokens.json')).Color
  const document = readFileSync(new URL('../docs/color-system.md', import.meta.url), 'utf8')
  const graySection = document.split('## Gray 그레이 컬러')[1].split('## Primary')[0]
  const grayRows = [...graySection.matchAll(/\| (\d+) \| `(#\w{6})`/g)]
  assert.equal(grayRows.length, Object.keys(raw.Gray).length)
  for (const [, step, value] of grayRows) {
    assert.equal(raw.Gray[step].$value, value, `개정 MD의 gray-${step}`)
    assert.equal(value.slice(1, 3), value.slice(3, 5), `gray-${step} R=G`)
    assert.equal(value.slice(3, 5), value.slice(5, 7), `gray-${step} G=B`)
  }
  assert.equal(raw.Light.primary['95'].$value, '#231916')
  assert.equal(lightColors.accent, raw.Light.secondary['60'].$value)
  assert.equal(lightColors.destructive, raw.Light.negative['70'].$value)
  assert.equal(highContrastColors.accent, raw.HC.primary['40'].$value)
  assert.equal(highContrastColors.destructive, raw.HC.negative['50'].$value)
  assert.equal(highContrastColors['bg-page'], lightColors['bg-dark'])
  assert.equal(lightColors['bg-dark'], '#000000')
  assert.equal(highContrastColors['bg-surface'], raw.Gray['95'].$value)
  assert.deepEqual(Object.keys(lightColorVariables), Object.keys(highContrastColorVariables))
  const pairs = [
    ['text-on-neutral', 'action-neutral'],
    ['text-primary', 'bg-page'], ['text-primary', 'bg-surface'],
    ['text-secondary', 'bg-page'], ['text-secondary', 'bg-surface'], ['text-secondary', 'bg-muted'],
    ['text-disabled', 'bg-disabled'], ['text-primary', 'bg-disabled'],
    ['text-on-accent', 'accent'], ['text-on-accent', 'accent-pressed'], ['accent-text', 'bg-surface'],
    ['state-selected-text', 'state-selected'], ['text-on-current', 'state-current'],
    ['text-primary', 'option-selected'], ['option-selected-secondary', 'option-selected'], ['text-primary', 'voice-bubble-bg'], ['success-mark', 'success-bg'],
    ['option-original-text', 'option-original-bg'],
    ['option-check', 'option-selected-border'], ['option-selected-border', 'option-selected'],
    ['text-primary', 'step-done'], ['step-done-mark', 'step-done'], ['step-done-text', 'step-done'], ['text-secondary', 'step-upcoming'],
    ['utility-pending-text', 'utility-pending'],
    ['utility-pending-text', 'utility-pending-pressed'],
    ['text-primary', 'utility-surface'], ['utility-selected-text', 'utility-selected'],
    ['utility-selected-text', 'utility-selected-pressed'], ['text-on-destructive', 'destructive'],
    ['error', 'bg-surface'], ['success', 'bg-surface'], ['text-brand', 'bg-page'],
    ['warning-text', 'warning-bg'],
    ['text-brand-on-dark', 'bg-dark'], ['text-on-dark', 'bg-dark'],
    ['badge-hot-text', 'badge-hot-bg'], ['badge-cold-text', 'badge-cold-bg'],
  ]
  for (const [mode, colors] of [['기본', lightColors], ['HC', highContrastColors]]) {
    for (const [foreground, background] of pairs) {
      const ratio = contrast(colors[foreground], colors[background])
      assert.ok(ratio >= 4.5, `${mode}: ${foreground}/${background} = ${ratio.toFixed(2)}:1`)
    }
    console.log(`${mode}: 주요 텍스트/배경 ${pairs.length}개 조합 4.5:1 이상 통과`)
  }
  console.log('제공 토큰의 CTA·삭제·HC 배경 값, 모드 간 동일 변수 이름: 통과')
  console.log('primary-60 / Cream:', contrast(raw.Light.primary['60'].$value, '#FCFCFC').toFixed(2))
} finally {
  rmSync(directory, { recursive: true, force: true })
}
