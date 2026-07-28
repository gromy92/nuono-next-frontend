import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const componentDir = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(componentDir, 'ProductImageAssetPreview.tsx'), 'utf8')

assert.match(
  source,
  /isProductImageAssetUrl/,
  '本地商品图资产必须识别为受保护 API 地址'
)

assert.match(
  source,
  /useState\(\(\) => initialDisplaySrc\(src\)\)/,
  '本地商品图资产不能先用原始 /api 地址渲染，否则 img 请求不会带开发会话头'
)

assert.match(
  source,
  /setDisplaySrc\(fallbackSrc\)/,
  '本地商品图资产读取失败时也不能回退到原始 /api 地址导致裂图'
)

assert.match(
  source,
  /role="img"/,
  '本地商品图 blob 解析完成前需要显示稳定占位'
)
