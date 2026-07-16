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
  /placeholder="入仓差异"/,
  'product inbound receipt details should expose a discrepancy filter'
)
assert.match(pageSource, /label: '少入仓', value: 'SHORT'/, 'discrepancy filter should support short receipts')
assert.match(pageSource, /label: '超入仓', value: 'OVER'/, 'discrepancy filter should support over receipts')
assert.match(
  pageSource,
  /inboundDiscrepancyFilter === 'SHORT'[\s\S]{0,200}row\.shortQuantity[\s\S]{0,250}inboundDiscrepancyFilter === 'OVER'[\s\S]{0,200}row\.overQuantity/,
  'short and over receipt filters should use the corresponding product-level discrepancy quantities'
)
assert.match(
  pageSource,
  /dataSource=\{visibleInboundLines\}/,
  'the product inbound receipt table should render the discrepancy-filtered rows'
)
assert.match(
  pageSource,
  /mode="multiple"[\s\S]{0,300}placeholder="约仓状态"/,
  'ASN list should expose a multi-select appointment status filter in the top toolbar'
)
assert.match(
  pageSource,
  /mode="multiple"[\s\S]{0,300}placeholder="入仓状态"/,
  'ASN list should expose a multi-select inbound status filter in the top toolbar'
)
assert.match(
  pageSource,
  /matchesOfficialWarehouseAsnFilters\([\s\S]{0,200}asnAppointmentStatusFilters[\s\S]{0,100}asnInboundStatusFilters/,
  'ASN list and summary should be driven by both status filters'
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
