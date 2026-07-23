import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featuresDir = dirname(fileURLToPath(import.meta.url))

const officialWarehousePage = readFileSync(join(featuresDir, 'official-warehouse/OfficialWarehousePage.tsx'), 'utf8')
const officialWarehouseStatistics = readFileSync(
  join(featuresDir, 'official-warehouse/OfficialWarehouseStatisticsPanel.tsx'),
  'utf8'
)
const officialWarehouseStatisticsDomain = readFileSync(
  join(featuresDir, 'official-warehouse/statisticsDomain.ts'),
  'utf8'
)
const officialWarehouseStatisticsApi = readFileSync(
  join(featuresDir, 'official-warehouse/statisticsApi.ts'),
  'utf8'
)
const warehouseDispatch = [
  'WarehouseDispatchWorkbenchPage.tsx',
  'readyDomain.ts',
  'receiptDomain.ts'
].map((fileName) => readFileSync(join(featuresDir, 'warehouse-dispatch', fileName), 'utf8')).join('\n')
const warehouseDispatchApi = readFileSync(join(featuresDir, 'warehouse-dispatch/api.ts'), 'utf8')
const ali1688SkuPurchaseHistory = readFileSync(
  join(featuresDir, 'ali1688-sku-purchase-history/Ali1688SkuPurchaseHistoryPage.tsx'),
  'utf8'
)
const ali1688HistoricalOrders = readFileSync(
  join(featuresDir, 'ali1688-historical-orders/Ali1688HistoricalOrdersPage.tsx'),
  'utf8'
)
const profitCalculator = readFileSync(join(featuresDir, 'profit-calculator/useProfitCalculatorWorkspace.tsx'), 'utf8')
const salesAnalyticsPage = readFileSync(join(featuresDir, 'sales-analytics/SalesAnalyticsPage.tsx'), 'utf8')
const salesAnalyticsApi = readFileSync(join(featuresDir, 'sales-analytics/api.ts'), 'utf8')

assert.doesNotMatch(
  officialWarehousePage,
  /partnerSku \|\| [\w.]*pskuCode/,
  'official warehouse product PSKU display must not fall back to external pskuCode'
)

assert.doesNotMatch(
  officialWarehouseStatistics,
  /partnerSku \|\| [\w?.]*pskuCode/,
  'official warehouse statistics PSKU display must not fall back to external pskuCode'
)

assert.doesNotMatch(
  officialWarehouseStatisticsDomain,
  /row\.partnerSku \|\| '',\n\s*row\.pskuCode/,
  'official warehouse inbound dedupe key must not include external pskuCode as product identity'
)

assert.doesNotMatch(
  officialWarehouseStatistics,
  /!row\.productSiteOfferId/,
  'official warehouse product history must not require legacy productSiteOfferId when partnerSku is available'
)

assert.match(
  officialWarehouseStatistics,
  /partnerSku:\s*row\.partnerSku/,
  'official warehouse product history request must carry stable partnerSku'
)

assert.match(
  officialWarehouseStatisticsApi,
  /filters\.partnerSku/,
  'official warehouse product history API must accept partnerSku as stable product identity'
)

assert.doesNotMatch(
  warehouseDispatch,
  /psku:\s*item\.pskuCode \|\| item\.partnerSku/,
  'warehouse dispatch baseline summary must not generate business PSKU from external pskuCode'
)

assert.doesNotMatch(
  warehouseDispatch,
  /\[item\.pskuCode,\s*item\.partnerSku,\s*item\.skuParent\]/,
  'warehouse dispatch product baseline lookup must not index by external pskuCode'
)

assert.doesNotMatch(
  warehouseDispatchApi,
  /psku:\s*line\.partnerSku \|\| line\.skuParent/,
  'warehouse dispatch plan line PSKU display must not fall back to external skuParent'
)

assert.doesNotMatch(
  warehouseDispatchApi,
  /const psku = item\.partnerSku \|\| item\.skuParent/,
  'warehouse dispatch ready item PSKU display must not fall back to external skuParent'
)

assert.match(
  warehouseDispatch,
  /function readyShipmentBusinessScopeKey\(item: ReadyShipmentRow\)/,
  'warehouse dispatch ready-row key must be scoped by shipping business dimensions'
)

assert.doesNotMatch(
  warehouseDispatch,
  /const key = normalizeProductKey\(item\.psku\) \|\| item\.id/,
  'warehouse dispatch ready rows must not merge only by PSKU'
)

assert.match(
  warehouseDispatch,
  /function readyShipmentBusinessScopeKey[\s\S]*source\.storeCode[\s\S]*normalizeProductKey\(item\.psku\)[\s\S]*item\.siteCode,\s*item\.transportMode[\s\S]*item\.fulfillmentType[\s\S]*item\.specStatus/,
  'warehouse dispatch ready-row key must keep source store, PSKU, site, fulfillment, and spec status'
)

assert.match(
  warehouseDispatch,
  /function receiptProductBusinessScopeKey\(item: PurchaseReceiptItem\)/,
  'warehouse dispatch receipt-row key must be scoped by business dimensions'
)

assert.doesNotMatch(
  warehouseDispatch,
  /const rowId = key/,
  'warehouse dispatch receipt rows must not use PSKU-only row IDs'
)

assert.doesNotMatch(
  ali1688SkuPurchaseHistory,
  /record\.skuParent \|\| record\.partnerSku \|\| record\.pskuCode/,
  '1688 SKU purchase history product key must not prefer external pskuCode as business PSKU fallback'
)

assert.doesNotMatch(
  ali1688SkuPurchaseHistory,
  /displayText\(record\.partnerSku,\s*record\.pskuCode\)/,
  '1688 SKU purchase history visible PSKU must not fall back to external pskuCode'
)

assert.doesNotMatch(
  ali1688HistoricalOrders,
  /productLink\.partnerSku \|\| productLink\.skuParent \|\| productLink\.pskuCode/,
  '1688 historical order link label must not display external pskuCode as PSKU fallback'
)

assert.doesNotMatch(
  ali1688HistoricalOrders,
  /PSKU \{product\.pskuCode\}/,
  '1688 historical order external pskuCode must not be labelled as system PSKU'
)

assert.match(
  ali1688HistoricalOrders,
  /Noon pskuCode \{product\.pskuCode\}/,
  '1688 historical order can show external pskuCode only with its Noon pskuCode label'
)

assert.doesNotMatch(
  profitCalculator,
  /record\.skuParent \|\| record\.partnerSku \|\| record\.pskuCode/,
  'profit calculator product key must not use external pskuCode as product identity fallback'
)

assert.doesNotMatch(
  salesAnalyticsPage,
  /const productRowKey = \(row: SalesProductRow\) => `\$\{row\.partnerSku\}\|\$\{row\.sku\}`/,
  'sales analytics row key must not combine partnerSku with external sku'
)

assert.doesNotMatch(
  salesAnalyticsApi,
  /params\.set\('sku', sku\)/,
  'sales analytics product detail must not filter current product identity by external sku'
)
