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

function readOptional(path) {
  const filePath = join(root, path)
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : null
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
const storeReportPage = readOptional('src/features/system-reports/StoreDataReportPage.tsx')
const noonCallStoreDataPage = read('src/features/system-reports/NoonCallStoreDataPage.tsx')
const noonDataCompletenessPage = read('src/features/system-reports/NoonDataCompletenessPage.tsx')
const noonDataGapPatrolPage = read('src/features/system-reports/NoonDataGapPatrolPage.tsx')
const storeReportApi = read('src/features/system-reports/api.ts')
const competitorPage = read('src/features/competitor-analysis/CompetitorAnalysisPage.tsx')
const competitorDashboard = read('src/features/competitor-analysis/CompetitorDashboardTab.tsx')
const competitorPriceChangeTab = read('src/features/competitor-analysis/CompetitorPriceChangeTab.tsx')
const competitorDashboardPriorityPanels = read('src/features/competitor-analysis/CompetitorDashboardPriorityPanels.tsx')
const competitorDashboardCommon = read('src/features/competitor-analysis/CompetitorDashboardCommon.tsx')
const competitorRankDetailModal = read('src/features/competitor-analysis/CompetitorRankChangeDetailModal.tsx')
const competitorDashboardCharts = read('src/features/competitor-analysis/dashboardCharts.ts')
const competitorDashboardShared = read('src/features/competitor-analysis/dashboardShared.ts')

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

if (storeReportPage) {
  assertIncludes(storeReportPage, "from '../../shared/charts'", 'StoreDataReportPage')
  assertNotIncludes(storeReportPage, 'function EChartPanel', 'StoreDataReportPage')
  assertNotIncludes(storeReportPage, 'echarts.init', 'StoreDataReportPage')
  assertNotIncludes(storeReportPage, 'echarts.use', 'StoreDataReportPage')
}

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

assertIncludes(competitorDashboard, 'RankChangePanel', 'CompetitorDashboardTab rank change panel composition')
assertIncludes(competitorPriceChangeTab, 'CompetitorAttributeChangePanel', 'CompetitorPriceChangeTab attribute change panel composition')
assertNotIncludes(competitorDashboard, 'DashboardChartCard', 'CompetitorDashboardTab removed old dashboard chart area')
assertIncludes(competitorDashboard, 'selfRankDirection', 'CompetitorDashboardTab self rank direction state')
assertIncludes(competitorDashboard, 'competitorRankDirection', 'CompetitorDashboardTab competitor rank direction state')
assertIncludes(competitorDashboard, "key === 'selfRank'", 'CompetitorDashboardTab self rank direction API query')
assertIncludes(competitorDashboard, "key === 'competitorRank'", 'CompetitorDashboardTab competitor rank direction API query')
assertIncludes(competitorDashboard, 'testId="competitor-dashboard-self-rank-change-chart"\n          fullWidth', 'self rank change panel should use full width layout')
assertIncludes(competitorDashboard, 'testId="competitor-dashboard-competitor-rank-change-chart"\n          fullWidth', 'competitor rank change panel should use full width layout')
assertIncludes(competitorDashboardPriorityPanels, '最近详情变化的竞品', 'CompetitorDashboardPriorityPanels detail change panel')
assertIncludes(competitorDashboardPriorityPanels, 'title="价格变化"', 'CompetitorDashboardPriorityPanels price change table')
assertIncludes(competitorDashboardPriorityPanels, 'title="标题变化"', 'CompetitorDashboardPriorityPanels title change table')
assertIncludes(competitorDashboardPriorityPanels, 'buildPriceChangeDisplayModel', 'CompetitorDashboardPriorityPanels price list display model')
assertIncludes(competitorDashboardPriorityPanels, 'codeHref: buildNoonProductSearchUrl(item.noonProductCode, siteCode)', 'CompetitorDashboardPriorityPanels competitor Z code links to Noon search')
assertIncludes(competitorDashboardPriorityPanels, '当前价格：${selfCurrentPrice}', 'CompetitorDashboardPriorityPanels self side shows current price')
assertIncludes(competitorDashboardPriorityPanels, 'underImageLines: [selfRankText(item)]', 'CompetitorDashboardPriorityPanels self side shows current self rank under image')
assertIncludes(competitorDashboardPriorityPanels, '关键词：${selfKeyword}', 'CompetitorDashboardPriorityPanels self side shows keyword')
assertIncludes(competitorDashboardPriorityPanels, 'lineHrefs: [undefined, selfKeywordHref]', 'CompetitorDashboardPriorityPanels self keyword links to Noon search')
assertIncludes(competitorDashboardPriorityPanels, 'isPriorityPriceChange(item)', 'CompetitorDashboardPriorityPanels prioritizes risky price changes')
assertNotIncludes(competitorDashboardPriorityPanels, '变化金额', 'CompetitorDashboardPriorityPanels must not show price amount delta')
assertNotIncludes(competitorDashboardPriorityPanels, '变化百分比', 'CompetitorDashboardPriorityPanels must not show price percent delta')
assertIncludes(competitorDashboardPriorityPanels, 'RankDirectionSelector', 'CompetitorDashboardPriorityPanels rank direction selector')
assertIncludes(competitorDashboardPriorityPanels, 'competitor-dashboard-detail-change-tables', 'CompetitorDashboardPriorityPanels detail change tables test id')
assertIncludes(competitorDashboardCommon, 'function DashboardChartCard', 'CompetitorDashboardCommon')
assertIncludes(competitorDashboardCommon, 'function ChartDaysSelector', 'CompetitorDashboardCommon')
assertIncludes(competitorDashboardCommon, 'function RankDirectionSelector', 'CompetitorDashboardCommon')
assertIncludes(competitorRankDetailModal, '复制内容', 'CompetitorRankChangeDetailModal')
assertIncludes(competitorRankDetailModal, '打开商品明细', 'CompetitorRankChangeDetailModal')
assertIncludes(competitorRankDetailModal, 'competitor-analysis-rank-detail-copyable', 'CompetitorRankChangeDetailModal copyable content')
assertNotIncludes(competitorDashboard, '每个图表可独立选择时间', 'CompetitorDashboardTab removed redundant dashboard subtitle')
assertNotIncludes(competitorDashboard, '竞品变化类型', 'CompetitorDashboardTab should not render old competitor change type chart')
assertNotIncludes(competitorDashboard, '商品变化 Top', 'CompetitorDashboardTab should not render old changed product top chart')
assertIncludes(competitorDashboardCharts, 'const RANK_CHANGE_DISPLAY_LIMIT = 100', 'competitor rank change top 100')
assertNotIncludes(competitorDashboardCharts, 'items.slice(0, RANK_CHANGE_DISPLAY_LIMIT).reverse()', 'competitor rank change should keep largest deltas on the left')
assertNotIncludes(competitorDashboardPriorityPanels, 'items.slice(0, 100).reverse()', 'competitor rank click mapping should keep chart order')
assertNotIncludes(competitorDashboardCharts, "name: '昨日竞品详情变化'", 'competitor price change list replaces attribute bar chart')
assertNotIncludes(competitorDashboardCharts, 'buildAttributeChangeChartOption', 'competitor price changes should be rendered as a simple list, not a delta chart')
assertNotIncludes(competitorDashboardCharts, 'attributeChangeDelta', 'competitor price changes should not compute amount deltas')
assertIncludes(competitorDashboardShared, "label: '昨天'", 'competitor dashboard yesterday range option')
assertIncludes(competitorDashboardShared, 'value: 1', 'competitor dashboard yesterday range value')
assertIncludes(competitorDashboardShared, "'detailChange'", 'competitor dashboard detail price changes have independent days')
assertNotIncludes(competitorDashboardShared, "'changeType'", 'competitor dashboard should not request old change type chart')
assertNotIncludes(competitorDashboardShared, "'changedProduct'", 'competitor dashboard should not request old changed product chart')
assertIncludes(competitorDashboard, 'chartDays.detailChange', 'CompetitorDashboardTab uses independent price change days')
assertIncludes(competitorPage, "label: '数据看板'", 'CompetitorAnalysisPage dashboard tab')
assertIncludes(competitorPage, "label: '明细维护'", 'CompetitorAnalysisPage detail maintenance tab')
assertIncludes(competitorPage, "title: '商品基线'", 'CompetitorAnalysisPage keeps production detail list baseline column')
assertIncludes(competitorPage, "title: '候选/监控中'", 'CompetitorAnalysisPage keeps production detail candidate column')
assertIncludes(competitorPage, "title: '近7日竞品变化'", 'CompetitorAnalysisPage keeps production detail change column')
assertIncludes(competitorPage, "title: '排名摘要'", 'CompetitorAnalysisPage keeps production detail rank column')

console.log('shared charts contract check passed')
