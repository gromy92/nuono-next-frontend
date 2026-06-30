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
const warehouseDispatch = readFileSync(join(featuresDir, 'warehouse-dispatch/WarehouseDispatchWorkbenchPage.tsx'), 'utf8')
const ali1688SkuPurchaseHistory = readFileSync(
  join(featuresDir, 'ali1688-sku-purchase-history/Ali1688SkuPurchaseHistoryPage.tsx'),
  'utf8'
)
const ali1688HistoricalOrders = readFileSync(
  join(featuresDir, 'ali1688-historical-orders/Ali1688HistoricalOrdersPage.tsx'),
  'utf8'
)
const profitCalculator = readFileSync(join(featuresDir, 'profit-calculator/useProfitCalculatorWorkspace.tsx'), 'utf8')
const salesForecastPage = readFileSync(join(featuresDir, 'sales-forecast/SalesForecastPage.tsx'), 'utf8')
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
  salesForecastPage,
  /sku:\s*row\.sku/,
  'sales forecast follow-up identity must not post external sku'
)

assert.doesNotMatch(
  salesForecastPage,
  /item\.partnerSku === result\.partnerSku && item\.sku === result\.sku/,
  'sales forecast follow-up optimistic update must match by partnerSku only'
)

assert.doesNotMatch(
  salesForecastPage,
  /row\.partnerSku\}\|\$\{row\.sku/,
  'sales forecast row key must not combine partnerSku with external sku'
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
