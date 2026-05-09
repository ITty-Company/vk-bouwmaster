#!/usr/bin/env bash
# Упаковать только файлы из public/uploads/, на которые ссылается src/lib/works-data.json
# Затем залить архив на Render и распаковать в /var/data/uploads/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LIST="$ROOT/.referenced-uploads-list.txt"
OUT="${1:-$ROOT/referenced-uploads-$(date +%Y%m%d-%H%M).tar.gz}"

export LIST_FILE="$LIST"
node <<'NODE'
const fs = require('fs')
const path = require('path')
const works = JSON.parse(fs.readFileSync('src/lib/works-data.json', 'utf8'))
const refs = new Set()
function walk(o) {
  if (!o) return
  if (typeof o === 'string' && o.includes('/uploads/')) refs.add(o.replace(/^.*\/uploads\//, ''))
  else if (typeof o === 'object') for (const k of Object.keys(o)) walk(o[k])
}
works.forEach((w) => walk(w))
const missing = []
for (const name of refs) {
  const p = path.join('public', 'uploads', name)
  if (!fs.existsSync(p)) missing.push(name)
}
if (missing.length) {
  console.error('Нет локально (public/uploads):', missing.length)
  missing.slice(0, 30).forEach((m) => console.error(' -', m))
  process.exit(1)
}
fs.writeFileSync(process.env.LIST_FILE, [...refs].sort().join('\n'))
console.log('Файлов в архив:', refs.size)
NODE

tar -czvf "$OUT" -C "$ROOT/public/uploads" -T "$LIST"
rm -f "$LIST"
echo ""
echo "Готово: $OUT"
echo "На Render распакуйте в /var/data/uploads/ (те же имена файлов)."
