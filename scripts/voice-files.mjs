// 녹음 파일 폴더(public/voice/)와 음성 문장 목록을 맞춰 본다(사용자 2026-10-29).
// 쓰는 법: npm run voice:files            → public/voice/manifest.json을 새로 쓰고, 없는 파일·안 쓰는 파일을 알려 준다
//          node scripts/voice-files.mjs --check → manifest.json이 폴더와 같은지만 검사(npm run check에 포함). 파일이 없는 것은 실패가 아니다
// 파일 이름은 문장 이름표(src/voice/lineId.ts) + 확장자(mp3, wav, ogg, m4a). 예: v_ec8eeca6.mp3
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = root + 'public/voice/'
const check = process.argv.includes('--check')
const listed = spawnSync(process.execPath, [root + 'scripts/list-voice-lines.mjs'], { encoding: 'utf8', maxBuffer: 1 << 24 })
if (listed.status !== 0) { process.stderr.write(listed.stderr); process.exit(1) }
const rows = listed.stdout.replace(/^﻿/, '').split('\n').slice(1).filter(Boolean)
// 두 번째 칸이 이름표. 문장 칸에 쉼표가 있어도 앞 두 칸은 따옴표가 없다.
const ids = new Map(rows.map(row => { const [, id] = row.split(','); const text = row.replace(/^[^,]*,[^,]*,[^,]*,[^,]*,/, '').replace(/,[^,]*$/, ''); return [id, text] }))

mkdirSync(dir, { recursive: true })
const files = readdirSync(dir).filter(name => /^v_[0-9a-f]{8}\.(mp3|wav|ogg|m4a)$/.test(name)).sort()
const manifest = JSON.stringify(files, null, 0) + '\n'
const manifestPath = dir + 'manifest.json'
if (check) {
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== manifest) { console.error('public/voice/manifest.json이 폴더와 달라요. npm run voice:files로 다시 만들어 주세요.'); process.exit(1) }
} else writeFileSync(manifestPath, manifest)

const have = new Set(files.map(name => name.replace(/\.[^.]+$/, '')))
const missing = [...ids].filter(([id]) => !have.has(id))
const extra = files.filter(name => !ids.has(name.replace(/\.[^.]+$/, '')))
console.log(`녹음 파일: ${have.size}/${ids.size}줄 있음${check ? ' · 목록 최신' : ' → public/voice/manifest.json'}`)
if (missing.length && !check) {
  console.log(`없는 파일 ${missing.length}개 (브라우저 음성으로 읽음):`)
  for (const [id, text] of missing) console.log(`  ${id}  ${text.replace(/^"|"$/g, '').replace(/""/g, '"')}`)
}
if (extra.length) console.log(`더 이상 안 쓰는 파일 ${extra.length}개 (문장이 바뀌어 이름표가 달라짐): ${extra.join(', ')}`)
