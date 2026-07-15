import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))
const apiSource = readFileSync(join(featureDir, 'api.ts'), 'utf8')

assert.match(
  apiSource,
  /export async function importProductImageAsset\(imageUrl: string/,
  '商品图 API 必须提供外部图片转存函数'
)

assert.match(
  apiSource,
  /apiFetch\('\/api\/product-master\/image-assets\/import'/,
  '外部图片转存必须调用后端 import endpoint'
)

assert.match(
  apiSource,
  /body:\s*JSON\.stringify\(\{\s*imageUrl/s,
  '外部图片转存请求必须提交 imageUrl'
)

assert.match(
  apiSource,
  /normalizeImageUrlForImport\(imageUrl\)/,
  '外部图片转存前必须清理不可见字符和换行，避免域名解析失败'
)

assert.match(
  apiSource,
  /[\s\S]*replace\(\s*\/\[\\u0000-\\u001F\\u007F\\s\\u200B\\u200C\\u200D\\uFEFF\]\+\/g/,
  'URL 清理必须覆盖控制字符、空白和零宽字符'
)

assert.match(
  apiSource,
  /readBackendError\(response,\s*'转存图片失败'\)/,
  '外部图片转存失败必须透出后端错误'
)
