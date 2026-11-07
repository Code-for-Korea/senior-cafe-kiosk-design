// 받은 녹음 파일의 이름을 문장 이름표로 바꿔 public/voice/에 넣는다(사용자 2026-10-29).
// 쓰는 법: node scripts/voice-rename.mjs <받은 파일 폴더> [docs/tts/TTS-문장목록-성공흐름.csv]
//   파일 이름이 CSV의 번호(01, 1, 성공_01 …)이거나 문장 그대로이면 맞춰 준다. 못 맞춘 파일은 알려 주고 그대로 둔다.
//   끝나면 npm run voice:files를 실행해 목록을 새로 만든다.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const [, , from, csvPath = 'docs/tts/TTS-문장목록-성공흐름.csv'] = process.argv
if (!from || !existsSync(from)) { console.error('받은 파일 폴더를 적어 주세요. 예: node scripts/voice-rename.mjs ~/Downloads/tts'); process.exit(1) }

function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') quoted = false; else cell += ch }
    else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}
const [head, ...body] = parseCsv(readFileSync(join(root, csvPath), 'utf8').replace(/^﻿/, ''))
const col = name => head.indexOf(name)
const lines = body.filter(r => r.length > 2).map(r => ({ no: r[col('번호')], id: r[col('파일 이름')], text: r[col('문장')] }))
// 띄어쓰기·문장부호를 빼고 비교한다. 파일 이름에는 쉼표·물음표가 빠지기 쉽다.
const squash = s => s.replace(/[\s.,?!·'"“”‘’()]/g, '')
const byNo = new Map(lines.map(l => [String(Number(l.no)), l])), byText = new Map(lines.map(l => [squash(l.text), l]))

const outDir = join(root, 'public/voice'); mkdirSync(outDir, { recursive: true })
const files = readdirSync(from).filter(name => /\.(mp3|wav|ogg|m4a)$/i.test(name)).sort()
const done = [], unmatched = []
for (const name of files) {
  const stem = basename(name, extname(name)), ext = extname(name).toLowerCase()
  let line = byText.get(squash(stem))
  if (!line) { const m = stem.match(/(\d+)(?!.*\d)/); if (m) line = byNo.get(String(Number(m[1]))) }
  if (!line) { unmatched.push(name); continue }
  copyFileSync(join(from, name), join(outDir, line.id + ext))
  done.push(`${name} → ${line.id}${ext}  ${line.text.slice(0, 30)}`)
}
console.log(`이름을 맞춘 파일 ${done.length}개 → public/voice/`)
for (const d of done) console.log('  ' + d)
if (unmatched.length) console.log(`못 맞춘 파일 ${unmatched.length}개 (번호나 문장을 찾지 못함): ${unmatched.join(', ')}`)
console.log('이제 npm run voice:files 를 실행해 주세요.')
