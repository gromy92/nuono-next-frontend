import assert from 'node:assert/strict'
import { apiSource, typesSource } from './replenishmentPlanContractSources'

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

assert.match(apiSource, /export (?:async )?function fetchReplenishmentPlanOverview\(query: ReplenishmentPlanQuery\)/, 'neutral API must export fetchReplenishmentPlanOverview(query)')
assert.match(apiSource, /\/api\/replenishment-plan\/overview/, 'neutral API must call the replenishment overview endpoint')
assert.match(apiSource, /storeCode: query\.storeCode/, 'overview API must serialize storeCode')
assert.match(apiSource, /siteCode: query\.siteCode/, 'overview API must serialize siteCode')

assert.match(typesSource, /export type ReplenishmentQuantity = number \| string/, 'types must expose number-or-string quantities')
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
  'imageUrl',
  'listingAt',
  'latestFactDate',
  'observedDays',
  'historyUnits7',
  'historyUnits30',
  'historyUnits60',
  'historyUnits90',
  'adjustedHistoryUnits7',
  'adjustedHistoryUnits30',
  'adjustedHistoryUnits60',
  'adjustedHistoryUnits90',
  'forecastUnits30',
  'forecastUnits60',
  'forecastUnits90',
  'forecastUnits100',
  'confidenceLabel',
  'shortReason',
  'currentStockUnits',
  'fbnStockUnits',
  'supermallStockUnits',
  'knownInboundUnits',
  'inboundBatches',
  'nearestInboundEtaDate',
  'missingEtaInboundQty',
  'missingEtaBatchCount',
  'missingEtaBatches',
  'firstStockoutDay',
  'airWindowForecastUnits',
  'airCalculatedUnits',
  'airSuggestedUnits',
  'seaWindowForecastUnits',
  'seaCalculatedUnits',
  'seaSuggestedUnits',
  'calculationBlocked',
  'warnings'
])
assertTypeHasFields('ReplenishmentPlanInboundBatch', [
  'batchId',
  'batchReferenceNo',
  'transportMode',
  'batchStatus',
  'etaDate',
  'remainingQuantity',
  'destinationCode',
  'coverageIncluded',
  'etaReviewRequired'
])
assertTypeHasFields('ReplenishmentPlanMissingEtaBatch', [
  'batchId',
  'batchReferenceNo',
  'transportMode',
  'batchStatus',
  'remainingQuantity',
  'destinationCode'
])
