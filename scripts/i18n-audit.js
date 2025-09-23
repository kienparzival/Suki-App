/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const GLOB = /\.(jsx?|tsx?)$/

const SRC = path.resolve(__dirname, '..', 'src')
const en = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/i18n/en.json'), 'utf8'))
const vi = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/i18n/vi.json'), 'utf8'))

const used = new Set()

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) walk(p)
    else if (GLOB.test(f)) scan(p)
  }
}

function scan(fp) {
  const s = fs.readFileSync(fp, 'utf8')
  // t('key') / t("key") / t(`key`)
  const reT = /t\(\s*['"`]([^'"`]+)['"`]/g
  const reTK = /<T\s+[^>]*k\s*=\s*['"`]([^'"`]+)['"`]/g
  let m
  while ((m = reT.exec(s))) used.add(m[1])
  while ((m = reTK.exec(s))) used.add(m[1])
}

walk(SRC)

const missingEn = []
const missingVi = []
for (const k of used) {
  if (!(k in en)) missingEn.push(k)
  if (!(k in vi)) missingVi.push(k)
}

console.log('Used keys:', used.size)
console.log('Missing in EN:', missingEn.length)
if (missingEn.length) console.log(missingEn.join('\n'))
console.log('Missing in VI:', missingVi.length)
if (missingVi.length) console.log(missingVi.join('\n'))

// Optional: auto-fill VI with EN to avoid raw keys during dev (we still want real VI)
// Comment out if you don't want this fallback write.
const viOut = { ...vi }
for (const k of missingVi) viOut[k] = en[k] ?? k
fs.writeFileSync(path.resolve(__dirname, '../src/i18n/vi.json'), JSON.stringify(viOut, null, 2))
