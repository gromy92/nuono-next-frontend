import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function read(path) {
  const filePath = join(root, path)
  if (!existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${path}`)
  }
  return readFileSync(filePath, 'utf8')
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label} should include: ${needle}`)
  }
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`${label} should not include: ${needle}`)
  }
}

const panel = read('src/shared/charts/EChartPanel.tsx')
const options = read('src/shared/charts/options.ts')
const chartIndex = read('src/shared/charts/index.ts')
const salesPage = read('src/features/sales-analytics/SalesAnalyticsPage.tsx')
const storeReportPage = read('src/features/system-reports/StoreDataReportPage.tsx')
const noonCallStoreDataPage = read('src/features/system-reports/NoonCallStoreDataPage.tsx')
const noonDataCompletenessPage = read('src/features/system-reports/NoonDataCompletenessPage.tsx')
const noonDataGapPatrolPage = read('src/features/system-reports/NoonDataGapPatrolPage.tsx')
const storeReportApi = read('src/features/system-reports/api.ts')
const workspaceRouting = read('src/features/app-shell/WorkspaceRouting.ts')

assertIncludes(panel, 'export type EChartPanelState', 'EChartPanel')
assertIncludes(panel, "'ready' | 'loading' | 'empty' | 'error'", 'EChartPanel')
assertIncludes(panel, 'echarts.init', 'EChartPanel')
assertIncludes(panel, 'ResizeObserver', 'EChartPanel')
assertIncludes(panel, 'data-testid={testId}', 'EChartPanel')
assertIncludes(panel, 'aria-label={resolvedAriaLabel}', 'EChartPanel')
assertIncludes(panel, 'state === \'loading\'', 'EChartPanel')
assertIncludes(panel, 'state === \'empty\'', 'EChartPanel')
assertIncludes(panel, 'state === \'error\'', 'EChartPanel')

assertIncludes(options, 'export function buildNetUnitsLineOption', 'chart options')
assertIncludes(options, 'export function buildSalesPriceTrendOption', 'chart options')
assertIncludes(options, 'fullDate', 'chart options')
assertIncludes(options, 'yAxisIndex: 1', 'sales price chart options')
assertIncludes(options, "name: '净销量'", 'sales price chart options')
assertIncludes(options, "name: '出单价'", 'sales price chart options')
assertIncludes(options, 'connectNulls: true', 'sales price chart options')
assertIncludes(options, '平均出单价', 'sales price chart tooltip')
assertIncludes(options, '最低/最高', 'sales price chart tooltip')
assertIncludes(options, '订单行数', 'sales price chart tooltip')
assertIncludes(options, '币种', 'sales price chart tooltip')
assertIncludes(chartIndex, "export { EChartPanel }", 'chart index')
assertIncludes(chartIndex, 'buildSalesPriceTrendOption', 'chart index')

assertIncludes(salesPage, "from '../../shared/charts'", 'SalesAnalyticsPage')
assertIncludes(salesPage, 'buildNetUnitsLineOption', 'SalesAnalyticsPage')
assertIncludes(salesPage, 'buildSalesPriceTrendOption', 'SalesAnalyticsPage')
assertIncludes(salesPage, 'priceTrendState?.state === \'ready\'', 'SalesAnalyticsPage')
assertIncludes(salesPage, 'testId="sales-trend-echart"', 'SalesAnalyticsPage')
assertIncludes(salesPage, 'ariaLabel="商品日销量折线图"', 'SalesAnalyticsPage')
assertNotIncludes(salesPage, "from 'echarts/", 'SalesAnalyticsPage')
assertNotIncludes(salesPage, 'echarts.init', 'SalesAnalyticsPage')
assertNotIncludes(salesPage, 'echarts.use', 'SalesAnalyticsPage')

assertIncludes(storeReportPage, "from '../../shared/charts'", 'StoreDataReportPage')
assertNotIncludes(storeReportPage, 'function EChartPanel', 'StoreDataReportPage')
assertNotIncludes(storeReportPage, 'echarts.init', 'StoreDataReportPage')
assertNotIncludes(storeReportPage, 'echarts.use', 'StoreDataReportPage')

assertIncludes(noonCallStoreDataPage, "from '../../shared/charts'", 'NoonCallStoreDataPage')
assertIncludes(noonCallStoreDataPage, 'testId="noon-call-store-data-marker-chart"', 'NoonCallStoreDataPage')
assertNotIncludes(noonCallStoreDataPage, 'echarts.init', 'NoonCallStoreDataPage')
assertNotIncludes(noonCallStoreDataPage, 'echarts.use', 'NoonCallStoreDataPage')

assertIncludes(noonDataCompletenessPage, "from '../../shared/charts'", 'NoonDataCompletenessPage')
assertIncludes(noonDataCompletenessPage, 'testId="noon-data-completeness-category-chart"', 'NoonDataCompletenessPage')
assertNotIncludes(noonDataCompletenessPage, 'echarts.init', 'NoonDataCompletenessPage')
assertNotIncludes(noonDataCompletenessPage, 'echarts.use', 'NoonDataCompletenessPage')

assertIncludes(noonDataGapPatrolPage, "from '../../shared/charts'", 'NoonDataGapPatrolPage')
assertIncludes(noonDataGapPatrolPage, 'testId="noon-data-gap-status-chart"', 'NoonDataGapPatrolPage')
assertNotIncludes(noonDataGapPatrolPage, 'echarts.init', 'NoonDataGapPatrolPage')
assertNotIncludes(noonDataGapPatrolPage, 'echarts.use', 'NoonDataGapPatrolPage')

assertIncludes(storeReportApi, "import { apiFetch } from '../../shared/api'", 'system reports api')
assertIncludes(storeReportApi, 'apiFetch(url)', 'system reports api')
assertIncludes(storeReportApi, "apiFetch(url, { method: 'POST' })", 'system reports api')

assertIncludes(workspaceRouting, "'devOwner'", 'WorkspaceRouting dev query preservation')
assertIncludes(workspaceRouting, "'devAccount'", 'WorkspaceRouting dev query preservation')

console.log('shared charts contract check passed')
