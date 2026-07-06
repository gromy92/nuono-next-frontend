import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))

const apiSource = readFileSync(join(featureDir, 'api.ts'), 'utf8')
const typesSource = readFileSync(join(featureDir, 'types.ts'), 'utf8')

function functionSource(functionName: string) {
  const match = apiSource.match(new RegExp(`export function ${functionName}\\(query: SalesForecastQuery\\) \\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${functionName} must be exported with query: SalesForecastQuery`)
  return match[0]
}

function typeBlock(typeName: string) {
  const match = typesSource.match(new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${typeName} must be declared as an exported object type`)
  return match[1]
}

function assertTypeHasFields(typeName: string, fields: string[]) {
  const block = typeBlock(typeName)
  for (const field of fields) {
    assert.match(block, new RegExp(`\\b${field}\\??:`), `${typeName} must define ${field}`)
  }
}

const fetchReplenishmentPlanOverviewSource = functionSource('fetchReplenishmentPlanOverview')
const replenishmentPlanOverviewBlock = typeBlock('ReplenishmentPlanOverview')
const replenishmentPlanItemBlock = typeBlock('ReplenishmentPlanItem')

assert.match(
  fetchReplenishmentPlanOverviewSource,
  /export function fetchReplenishmentPlanOverview\(query: SalesForecastQuery\)/,
  'api.ts must export fetchReplenishmentPlanOverview(query: SalesForecastQuery)'
)
assert.match(
  fetchReplenishmentPlanOverviewSource,
  /getJson<ReplenishmentPlanOverview>/,
  'fetchReplenishmentPlanOverview must call getJson with ReplenishmentPlanOverview'
)
assert.match(
  fetchReplenishmentPlanOverviewSource,
  /\/api\/replenishment-plan\/overview/,
  'fetchReplenishmentPlanOverview must call the replenishment plan overview endpoint'
)
assert.match(fetchReplenishmentPlanOverviewSource, /storeCode: query\.storeCode/, 'overview API must serialize storeCode')
assert.match(fetchReplenishmentPlanOverviewSource, /siteCode: query\.siteCode/, 'overview API must serialize siteCode')

assert.match(
  typesSource,
  /export type ReplenishmentQuantity = number \| string/,
  'types.ts must expose reusable number-or-string replenishment quantities'
)
typeBlock('ReplenishmentPlanConfigSnapshot')
typeBlock('ReplenishmentPlanDailyProjection')
typeBlock('ReplenishmentPlanMissingEtaBatch')

assert.match(
  replenishmentPlanOverviewBlock,
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
  'calculationVersion',
  'configSnapshot',
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
  replenishmentPlanItemBlock,
  /currentStockUnits: ReplenishmentQuantity \| null/,
  'currentStockUnits must allow missing stock facts'
)
assert.match(
  replenishmentPlanItemBlock,
  /fbnStockUnits: ReplenishmentQuantity \| null/,
  'fbnStockUnits must allow missing stock facts'
)
assert.match(
  replenishmentPlanItemBlock,
  /supermallStockUnits: ReplenishmentQuantity \| null/,
  'supermallStockUnits must allow missing stock facts'
)
assert.match(replenishmentPlanItemBlock, /firstStockoutDay: number \| null/, 'firstStockoutDay must be nullable')

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
