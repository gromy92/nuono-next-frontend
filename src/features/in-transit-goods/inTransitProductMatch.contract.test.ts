import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))
const api = readFileSync(join(featureDir, 'api.ts'), 'utf8')
const panel = readFileSync(join(featureDir, 'InTransitProductMatchPanel.tsx'), 'utf8')
const detail = readFileSync(join(featureDir, 'InTransitBoxDetailView.tsx'), 'utf8')
const officialPreparation = readFileSync(
  join(featureDir, '../official-warehouse/productMatchPreparation.ts'),
  'utf8'
)

assert.match(
  api,
  /batches\/\$\{batchId\}\/product-match-candidates/
)
assert.match(
  api,
  /product-match-candidates\/rematch[\s\S]*method: 'POST'/
)
assert.match(panel, /待匹配/)
assert.match(panel, /重新匹配/)
assert.match(panel, /创建 ASN 前需先完成商品匹配/)
assert.match(detail, /<InTransitProductMatchPanel/)
assert.match(officialPreparation, /product-matches\/prepare/)
assert.match(officialPreparation, /loadOfficialWarehouseShippingBatches/)
