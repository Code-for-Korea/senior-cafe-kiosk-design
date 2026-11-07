import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import ts from 'typescript'

const root = fileURLToPath(new URL('../', import.meta.url))
const readJSON = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const catalog = readJSON('src/design-system/catalog.json')
const directory = mkdtempSync(join(tmpdir(), 'kiosk-design-export-'))
try {
  // These are pure source modules. UI and browser side effects are never loaded.
  for (const path of ['colorSystem', 'payment/paymentFlow', 'payment/paymentSession', 'voice/guides', 'staffCall']) {
    const target = join(directory, path + '.js')
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, ts.transpileModule(readFileSync(join(root, 'src', path + '.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText)
  }
  copyFileSync(join(root, 'src/color-tokens.json'), join(directory, 'color-tokens.json'))
  const require = createRequire(import.meta.url)
  const { lightColors, highContrastColors } = require(join(directory, 'colorSystem.js'))
  const { paymentScenes, paymentView, cashRejectReasons, cashErrorReasons, demoDeposit } = require(join(directory, 'payment/paymentFlow.js'))
  const { paymentDemoEvents } = require(join(directory, 'payment/paymentSession.js'))
  const { orderGuide, paymentGuide } = require(join(directory, 'voice/guides.js'))
  const { initialStaffCall, staffCallReducer } = require(join(directory, 'staffCall.js'))
  for (const component of catalog.components) {
    if (!existsSync(join(root, component.source))) throw new Error(`Missing component source: ${component.source}`)
  }
  const payment = Object.entries(paymentScenes).flatMap(([scene, name]) => {
    const rejectedCases = scene === 'cashRejected' ? Object.keys(cashRejectReasons) : ['unsupported']
    const errors = scene === 'cashError' ? Object.keys(cashErrorReasons) : ['change']
    return rejectedCases.flatMap(rejected => errors.flatMap(error => {
      // Symbolic examples are used only to resolve labels/actions; money values
      // and order numbers are deliberately omitted from the export.
      const total = 26600
      const deposits = scene === 'cashRejected' ? [0, 10000] : [demoDeposit(scene, total, error)]
      return deposits.map(deposited => {
        const v = paymentView(scene, total, deposited, rejected, error)
        const { moneyRows, ...view } = v
        return { scene, name, rejected, error, hasDeposit: deposited > 0, view: { ...view, moneyLabels: moneyRows?.map(([label]) => label) },
          guide: paymentGuide(scene),
          simulationEvents: paymentDemoEvents({ step: scene, method: null, deposited, rejected, error }),
        }
      })
    }))
  })
  const staffStates = [initialStaffCall, { pending: false, late: false, dialog: 'confirm' }, { pending: true, late: false, dialog: 'waiting' }, { pending: true, late: false, dialog: null }, { pending: true, late: false, dialog: 'cancel' }, { pending: true, late: true, dialog: 'waiting' }, { pending: true, late: true, dialog: null }]
  const staff = staffStates.flatMap(from => ['open', 'close', 'request', 'late', 'askCancel', 'cancel', 'reset'].map(action => ({ from, action, to: staffCallReducer(from, action) })))
  const artifact = {
    schemaVersion: 1,
    status: 'Code inventory synchronized with the existing Figma library; see figma-migration-status.json and the latest approved-sync handoff for verified node mappings and prototype scope.',
    ...catalog,
    tokens: readJSON('src/design-system/tokens.json'),
    colors: { primitives: readJSON('src/color-tokens.json'), modes: { light: lightColors, highContrast: highContrastColors } },
    cssBinding: 'Token paths use --kebab-case; semantic colors use their existing --name. See tokens.css and colorSystem.ts.',
    guides: [...catalog.orderScreens, 'dessert', 'cart-empty'].flatMap(screen => [false, true].map(ready => ({ screen, ready, ...orderGuide(screen, ready) }))),
    payment, staff,
    flowNotes: [
      'User actions and simulationEvents are separate. Actual device/payment/staff integrations are absent.',
      'cashCounting bill events have a nominal to value; paymentSessionReducer chooses cashMore/cashComplete/cashChangePaying from the accumulated amount.',
      'Mobile help is a dialog over mobileScan. Its internal app selection is not a payment-method branch.',
      'Order option steps depend on the product and temperature. App/orderEntry/selectionSummary are authoritative.',
      'Text-to-speech timing, clipping, focus trapping, and scroll behavior must also be tested in the web application.'
    ],
  }
  const target = join(root, 'docs/design-system/figma-handoff.json')
  const output = JSON.stringify(artifact, null, 2) + '\n'
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== output) throw new Error('Figma handoff is stale. Run npm run design:export.')
  } else {
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, output)
  }
  console.log(`Figma handoff: ${catalog.components.length} component mappings, ${Object.keys(paymentScenes).length} payment scenes / ${payment.length} cases.`)
} finally {
  rmSync(directory, { recursive: true, force: true })
}
