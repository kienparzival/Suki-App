/* eslint-disable no-console */
const fs = require('fs'); const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');
const en = require('../src/i18n/en.json'); const vi = require('../src/i18n/vi.json');
const used = new Set(); const literals = [];
function walk(d){ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); const s=fs.statSync(p);
  if(s.isDirectory()) walk(p); else if(/\.[jt]sx?$/.test(f)){ const c=fs.readFileSync(p,'utf8');
    // collect t()/ <T k=...>
    for (const re of [/t\(\s*['"`]([^'"`]+)['"`]/g, /<T\s+[^>]*k\s*=\s*['"`]([^'"`]+)['"`]/g]) { let m; while((m=re.exec(c))) used.add(m[1]); }
    // naive literal detector in JSX text & placeholders
    const litRe = />([^<{]*[A-Za-z][^<{]*)<|placeholder\s*=\s*['"][^"']*[A-Za-z][^"']*['"]/g;
    let m2; while((m2=litRe.exec(c))) literals.push({file:p, snippet:m2[0]});
} } }
walk(SRC);
console.log('Found keys used:', used.size);
const missEn=[...used].filter(k=>en[k]===undefined);
const missVi=[...used].filter(k=>vi[k]===undefined);
console.log('Missing EN:', missEn.length); if(missEn.length) console.log(missEn.join('\n'));
console.log('Missing VI:', missVi.length); if(missVi.length) console.log(missVi.join('\n'));
console.log('Literal candidates (manual fix to t()):', literals.length);
if (literals.length) console.log(literals.map(l=>l.file+': '+l.snippet.replace(/\s+/g,' ').slice(0,160)).join('\n'));