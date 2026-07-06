import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))

const apiSource = readFileSync(join(featureDir, 'api.ts'), 'utf8')
const typesSource = readFileSync(join(featureDir, 'types.ts'), 'utf8')

function assertTypeExists(typeName: string) {
  assert.match(typesSource, new RegExp(`export type ${typeName} = \\{`), `${typeName} must be exported`)
}

function assertTypeHasFields(typeName: string, fields: string[]) {
  const match = typesSource.match(new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${typeName} must be declared as an exported object type`)
  for (const field of fields) {
    assert.match(match[1], new RegExp(`\\b${field}\\??:`), `${typeName} must define ${field}`)
  }
}

assert.match(
  apiSource,
  /export function fetchReplenishmentPlanOverview\(query: SalesForecastQuery\)/,
  'api.ts must export fetchReplenishmentPlanOverview(query: SalesForecastQuery)'
)
assert.match(
  apiSource,
  /getJson<ReplenishmentPlanOverview>/,
  'fetchReplenishmentPlanOverview must call getJson with ReplenishmentPlanOverview'
)
assert.match(
  apiSource,
  /\/api\/replenishment-plan\/overview/,
  'fetchReplenishmentPlanOverview must call the replenishment plan overview endpoint'
)
assert.match(apiSource, /storeCode: query\.storeCode/, 'overview API must serialize storeCode')
assert.match(apiSource, /siteCode: query\.siteCode/, 'overview API must serialize siteCode')

assert.match(
  typesSource,
  /export type ReplenishmentQuantity = number \| string/,
  'types.ts must expose reusable number-or-string replenishment quantities'
)
assertTypeExists('ReplenishmentPlanOverview')
assertTypeExists('ReplenishmentPlanItem')
assertTypeExists('ReplenishmentPlanConfigSnapshot')
assertTypeExists('ReplenishmentPlanDailyProjection')
assertTypeExists('ReplenishmentPlanMissingEtaBatch')

assert.match(
  typesSource,
  /state: 'empty' \| 'ready'/,
  'ReplenishmentPlanOverview.state must be the backend empty/ready union'
)

assertTypeHasFields('ReplenishmentPlanOverview', [
  'state',
  'storeCode',
  'siteCode',
  'calculationVersion',
  'configSnapshot',
  'anchorDate',
  'rows'
])

assertTypeHasFields('ReplenishmentPlanItem', [
  'partnerSku',
  'sku',
  'productTitle',
  'currentStockUnits',
  'fbnStockUnits',
  'supermallStockUnits',
  'knownInboundUnits',
  'missingEtaInboundQty',
  'missingEtaBatchCount',
  'firstStockoutDay',
  'stockoutWindowLabel',
  'airWindowStartDay',
  'airWindowEndDay',
  'airSuggestedUnits',
  'seaWindowStartDay',
  'seaWindowEndDay',
  'seaSuggestedUnits',
  'dailyProjection',
  'missingEtaBatches',
  'warnings',
  'explanation'
])

assert.match(
  typesSource,
  /currentStockUnits: ReplenishmentQuantity \| null/,
  'currentStockUnits must allow missing stock facts'
)
assert.match(
  typesSource,
  /fbnStockUnits: ReplenishmentQuantity \| null/,
  'fbnStockUnits must allow missing stock facts'
)
assert.match(
  typesSource,
  /supermallStockUnits: ReplenishmentQuantity \| null/,
  'supermallStockUnits must allow missing stock facts'
)
assert.match(typesSource, /firstStockoutDay: number \| null/, 'firstStockoutDay must be nullable')

assertTypeHasFields('ReplenishmentPlanConfigSnapshot', [
  'versionNo',
  'airLeadDays',
  'airCoverDays',
  'seaLeadDays',
  'seaCoverDays',
  'forecastHorizonDays',
  'inventorySources',
  'requireInboundEtaDate',
  'airEmergencyOnly',
  'roundingMode'
])

assertTypeHasFields('ReplenishmentPlanDailyProjection', [
  'day',
  'date',
  'forecastDemand',
  'inboundUnits',
  'projectedStock'
])

assertTypeHasFields('ReplenishmentPlanMissingEtaBatch', [
  'batchId',
  'batchReferenceNo',
  'transportMode',
  'batchStatus',
  'remainingQuantity'
])
