/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC = path.resolve(__dirname, '..', 'src')
const en = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/i18n/en.json'), 'utf8'))
const vi = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/i18n/vi.json'), 'utf8'))

const used = new Set()
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const s = fs.statSync(p)
    if (s.isDirectory()) walk(p)
    else if (/\.[jt]sx?$/.test(f)) {
      const c = fs.readFileSync(p, 'utf8')
      for (const re of [
        /t\(\s*['"`]([^'"`]+)['"`]/g,
        /<T\s+[^>]*k\s*=\s*['"`]([^'"`]+)['"`]/g
      ]) { let m; while ((m = re.exec(c))) used.add(m[1]) }
    }
  }
}
walk(SRC)

const missEn = [...used].filter(k => en[k] === undefined)
const missVi = [...used].filter(k => vi[k] === undefined)

console.log('Used keys:', used.size)
console.log('Missing EN:', missEn.length)
if (missEn.length) console.log(missEn.join('\n'))
console.log('Missing VI:', missVi.length)
if (missVi.length) console.log(missVi.join('\n'))