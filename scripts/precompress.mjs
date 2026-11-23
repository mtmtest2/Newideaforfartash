// Write .br and .gz copies of text assets next to the originals so Caddy's `file_server { precompressed br gzip }`
// can serve them (standard Caddy has no on-the-fly Brotli). Used by the Docker build. usage: node scripts/precompress.mjs dist
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const root = path.resolve(process.argv[2] || 'dist')
const EXT = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.xml', '.txt', '.json', '.webmanifest'])
let files = 0, saved = 0
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { walk(p); continue }
    if (!EXT.has(path.extname(e.name)) || e.name.startsWith('.')) continue
    const src = fs.readFileSync(p)
    if (src.length < 1024) continue
    const br = zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: src.length } })
    const gz = zlib.gzipSync(src, { level: 9 })
    if (br.length < src.length) fs.writeFileSync(p + '.br', br)
    if (gz.length < src.length) fs.writeFileSync(p + '.gz', gz)
    files++; saved += src.length - br.length
  }
}
walk(root)
console.log(`precompressed ${files} files (brotli saves ${Math.round(saved / 1024)} KiB)`)
