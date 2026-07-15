import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(currentDir, 'OfficialWarehousePage.tsx'), 'utf8')
const apiSource = readFileSync(join(currentDir, 'api.ts'), 'utf8')

assert.match(
  apiSource,
  /asns\/\$\{encodeURIComponent\(asnId\)\}\/inbound-detail/,
  'ASN detail should load the exact read-only inbound receipt endpoint by local ASN id'
)
assert.match(
  apiSource,
  /inboundSummary\?: OfficialWarehouseAsnInboundSummary/,
  'ASN list rows should expose their inbound receipt progress summary'
)
assert.match(
  pageSource,
  /已入仓 \{Number\(summary\.receivedQuantity[\s\S]*?预计 \{Number\(summary\.expectedQuantity/,
  'ASN list status should show received versus expected progress'
)
assert.match(
  pageSource,
  /商品入仓明细/,
  'ASN drawer should expose product-level inbound receipt details'
)
assert.match(
  pageSource,
  /暂未收到 Noon 入仓回执/,
  'missing receipt facts must be shown as missing rather than fake zero quantities'
)
assert.match(
  pageSource,
  /来自 FBN 入仓报表/,
  'Noon backoffice receipt-only products should remain visible with their source labelled'
)
assert.doesNotMatch(
  pageSource,
  /loadOfficialWarehouseInboundStatistics|filterInboundDetailRows/,
  'ASN drawer should no longer use the fuzzy statistics search as its detail source'
)
