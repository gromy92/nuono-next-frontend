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
  'ASN list should show received versus expected progress'
)
const statusColumnStart = pageSource.indexOf("title: '状态'")
const inboundColumnStart = pageSource.indexOf("title: '入仓情况'")
const createdAtColumnStart = pageSource.indexOf("title: '创建时间'", inboundColumnStart)
assert.ok(statusColumnStart >= 0 && inboundColumnStart > statusColumnStart, 'inbound situation should be a separate column after status')
assert.ok(createdAtColumnStart > inboundColumnStart, 'inbound situation column should end before created time')
assert.doesNotMatch(
  pageSource.slice(statusColumnStart, inboundColumnStart),
  /inboundProgress/,
  'status column should not mix inbound receipt progress'
)
const inboundColumnSource = pageSource.slice(inboundColumnStart, createdAtColumnStart)
assert.match(inboundColumnSource, /inboundProgress\(row\.inboundSummary\)/, 'inbound situation column should render receipt progress')
assert.match(inboundColumnSource, /暂无入仓回执/, 'inbound situation column should preserve the missing receipt state')
assert.match(
  inboundColumnSource,
  /onClick=\{\(\) => void openDetail\(row\)\}/,
  'clicking inbound situation should open the ASN inbound detail drawer'
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
