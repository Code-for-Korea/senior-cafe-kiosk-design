import { readFileSync, writeFileSync } from 'node:fs'

const source = JSON.parse(readFileSync(new URL('../src/design-system/tokens.json', import.meta.url), 'utf8'))
const target = new URL('../src/design-system/tokens.css', import.meta.url)
const kebab = value => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
const declarations = []
function visit(value, path = []) {
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) visit(child, [...path, key])
    return
  }
  const unitless = ['opacity', 'layer', 'font'].includes(path[0]) || path.includes('lineHeight') || path.at(-1) === 'fontWeight'
  const unit = path[0] === 'motion' ? 'ms' : 'px'
  const cssValue = typeof value === 'number' && !unitless ? `${value}${unit}` : value
  declarations.push(`  --${path.map(kebab).join('-')}: ${cssValue};`)
}
visit(source)
const css = `/* Generated from tokens.json. Run npm run tokens:generate; do not edit by hand. */\n:root {\n${declarations.join('\n')}\n}\n`
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== css) throw new Error('Design tokens CSS is stale. Run npm run tokens:generate.')
  console.log(`Design tokens: ${declarations.length} CSS variables match the source.`)
} else {
  writeFileSync(target, css)
  console.log(`Generated ${declarations.length} design token CSS variables.`)
}
