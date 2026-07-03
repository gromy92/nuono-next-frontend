import { strict as assert } from 'node:assert'
import { mapDashboard } from './api'
import {
  buildDashboardBarOption,
  buildIssueSummaryOption,
  buildRankChangeChartOption
} from './dashboardCharts'
import { DASHBOARD_DAYS_OPTIONS, DEFAULT_COMPETITOR_RANK_CHANGE_DIRECTION } from './dashboardShared'
import {
  buildAttributeChangeDisplayModel,
  isPriorityPriceChange,
  splitAttributeChangeItems
} from './CompetitorDashboardPriorityPanels'
import { rankChangeCopyText } from './CompetitorRankChangeDetailModal'

const dashboard = mapDashboard({
  storeCode: 'STR108065-NSA',
  siteCode: 'SA',
  days: 7,
  competitorAttributeChangeDate: '2026-06-24',
  competitorAttributeSnapshotCount: 3,
  issueSummary: [{ issueType: 'PENDING_CANDIDATE', label: '待确认候选', value: 4 }],
  issueTrend: [],
  coverageTopProducts: [
    {
      issueType: 'MONITORING_SHORTAGE',
      partnerSku: 'SKU-1',
      productSiteOfferId: 91001,
      targetValue: 3,
      title: '商品1',
      value: 1,
      watchProductId: 180001
    }
  ],
  rankIssueTopProducts: [],
  changeTypeDistribution: [],
  changedProductTop: [],
  selfRankChanges: [
    {
      watchProductId: 180001,
      partnerSku: 'SKU-1',
      title: '商品1',
      imageUrl: 'https://img.example.com/rank-change.jpg',
      keyword: 'sticky notes',
      trackedProductType: 'SELF',
      noonProductCode: 'Z-SELF',
      previousRankStatus: 'ranked',
      previousRankNo: 19,
      rankStatus: 'ranked',
      rankNo: 11,
      rankDelta: 8
    }
  ],
  competitorRankChanges: [],
  competitorAttributeChanges: [
    {
      watchProductId: 180001,
      partnerSku: 'SKU-1',
      title: '商品1',
      productImageUrl: 'https://img.example.com/self-product.jpg',
      selfPreviousValue: '30.00',
      selfCurrentValue: '28.00',
      selfCurrentDate: '2026-06-28',
      selfSnapshotCount: 3,
      selfLatestValue: '28.00',
      selfLatestDate: '2026-06-29',
      noonProductCode: 'Z-COMP',
      competitorTitle: '竞品1',
      competitorImageUrl: 'https://img.example.com/competitor-product.jpg',
      changeType: 'PRICE',
      label: '价格变化',
      previousValue: '29.00',
      currentValue: '24.00',
      currentDate: '2026-06-29',
      latestRankKeyword: 'sticky notes',
      changeDateRankNo: 8,
      latestRankNo: 15,
      selfLatestRankKeyword: 'sticky notes',
      selfLatestRankStatus: 'not_in_scan_depth',
      selfLatestScanDepth: 100
    }
  ]
})

assert.equal(dashboard.storeCode, 'STR108065-NSA')
assert.equal(dashboard.days, 7)
assert.equal(dashboard.issueSummary[0].issueType, 'PENDING_CANDIDATE')
assert.equal(dashboard.coverageTopProducts[0].watchProductId, '180001')
assert.equal(dashboard.coverageTopProducts[0].productSiteOfferId, '91001')
assert.equal(dashboard.selfRankChanges[0].imageUrl, 'https://img.example.com/rank-change.jpg')
assert.deepEqual(DASHBOARD_DAYS_OPTIONS[0], { label: '昨天', value: 1 })
assert.equal(DEFAULT_COMPETITOR_RANK_CHANGE_DIRECTION, 'UP')

const pieOption = buildIssueSummaryOption(dashboard.issueSummary)
assert.equal(Array.isArray(pieOption.series), true)

const barOption = buildDashboardBarOption(dashboard.coverageTopProducts, '缺口')
assert.equal(Array.isArray(barOption.series), true)

const rankChangeOption = buildRankChangeChartOption(dashboard.selfRankChanges, '我的关键词排名变化')
assert.equal(Array.isArray(rankChangeOption.series), true)
assert.equal((rankChangeOption.xAxis as { type?: string }).type, 'category')
assert.deepEqual((rankChangeOption.xAxis as { data?: unknown[] }).data, ['sticky notes'])
assert.equal((rankChangeOption.yAxis as { type?: string }).type, 'value')
const rankChangeTooltip = (rankChangeOption.tooltip as { formatter?: (params: unknown) => string }).formatter?.([{ dataIndex: 0 }]) || ''
assert.equal(rankChangeTooltip.includes('Z-SELF'), false)
assert.equal(rankChangeTooltip.includes('sticky notes'), true)
const rankChangeCopy = rankChangeCopyText({
  ...dashboard.selfRankChanges[0],
  priceChangeSummary: '24.80 -> 28.50 · 2026-06-30',
  titleChangeSummary: '有变化 · 2026-06-29',
  adChangeSummary: '06-29，06-28'
})
assert.equal(rankChangeCopy.includes('SKU:'), false)
assert.equal(rankChangeCopy.includes('标题:'), false)
assert.equal(rankChangeCopy.includes('Noon 编码:'), false)
assert.equal(rankChangeCopy.includes('范围变化: 价格：24.80 -> 28.50 · 2026-06-30'), true)
assert.equal(rankChangeCopy.includes('标题：有变化 · 2026-06-29'), true)
assert.equal(rankChangeCopy.includes('广告：06-29，06-28'), true)
assert.equal(dashboard.competitorAttributeChanges[0].productImageUrl, 'https://img.example.com/self-product.jpg')
assert.equal(dashboard.competitorAttributeChanges[0].selfPreviousValue, '30.00')
assert.equal(dashboard.competitorAttributeChanges[0].selfCurrentValue, '28.00')
assert.equal(dashboard.competitorAttributeChanges[0].selfCurrentDate, '2026-06-28')
assert.equal(dashboard.competitorAttributeChanges[0].selfSnapshotCount, 3)
assert.equal(dashboard.competitorAttributeChanges[0].selfLatestValue, '28.00')
assert.equal(dashboard.competitorAttributeChanges[0].selfLatestDate, '2026-06-29')
assert.equal(dashboard.competitorAttributeChanges[0].competitorImageUrl, 'https://img.example.com/competitor-product.jpg')
assert.equal(dashboard.competitorAttributeChanges[0].changeType, 'PRICE')
assert.equal(dashboard.competitorAttributeChanges[0].currentDate, '2026-06-29')
assert.equal(dashboard.competitorAttributeChanges[0].latestRankKeyword, 'sticky notes')
assert.equal(dashboard.competitorAttributeChanges[0].changeDateRankNo, 8)
assert.equal(dashboard.competitorAttributeChanges[0].latestRankNo, 15)
assert.equal(dashboard.competitorAttributeChanges[0].selfLatestRankKeyword, 'sticky notes')
assert.equal(dashboard.competitorAttributeChanges[0].selfLatestRankStatus, 'not_in_scan_depth')
assert.equal(dashboard.competitorAttributeChanges[0].selfLatestScanDepth, 100)

const priceChangeDisplay = buildAttributeChangeDisplayModel(dashboard.competitorAttributeChanges[0])
assert.equal(Object.prototype.hasOwnProperty.call(priceChangeDisplay.self, 'title'), false)
assert.equal(Object.prototype.hasOwnProperty.call(priceChangeDisplay.competitor, 'title'), false)
assert.deepEqual(priceChangeDisplay.self.underImageLines, ['未进前100'])
assert.equal(priceChangeDisplay.self.primaryLine, '当前价格：28.00')
assert.deepEqual(priceChangeDisplay.self.lines, [
  '价格变化：30.00 -> 28.00 · 2026-06-28',
  '关键词：sticky notes'
])
assert.deepEqual(priceChangeDisplay.self.lineHrefs, [
  undefined,
  'https://www.noon.com/saudi-en/search/?q=sticky%20notes'
])
assert.deepEqual(priceChangeDisplay.competitor.underImageLines, ['第 15 名'])
assert.equal(priceChangeDisplay.competitor.primaryLine, '价格变化：29.00 -> 24.00')
assert.deepEqual(priceChangeDisplay.competitor.lines, [
  '排名变化：#8 -> #15',
  '日期：2026-06-29'
])
assert.equal(priceChangeDisplay.competitor.lines.join(' ').includes('sticky notes'), false)
assert.equal(priceChangeDisplay.competitor.code, 'Z-COMP')
assert.equal(priceChangeDisplay.competitor.codeHref, 'https://www.noon.com/saudi-en/search/?q=Z-COMP')
assert.equal(
  buildAttributeChangeDisplayModel(dashboard.competitorAttributeChanges[0], 'AE').competitor.codeHref,
  'https://www.noon.com/uae-en/search/?q=Z-COMP'
)
const unrankedCompetitorDisplay = buildAttributeChangeDisplayModel({
  ...dashboard.competitorAttributeChanges[0],
  changeDateRankNo: 18,
  latestRankNo: undefined
})
assert.deepEqual(unrankedCompetitorDisplay.competitor.underImageLines, ['未进榜'])
assert.deepEqual(unrankedCompetitorDisplay.competitor.lines, [
  '排名变化：#18 -> 未进榜',
  '日期：2026-06-29'
])
assert.equal(isPriorityPriceChange(dashboard.competitorAttributeChanges[0]), true)
assert.equal(
  isPriorityPriceChange({
    ...dashboard.competitorAttributeChanges[0],
    currentValue: '35.00',
    latestRankNo: 1,
    selfLatestRankStatus: 'ranked',
    selfLatestRankNo: 10
  }),
  true
)
assert.equal(
  isPriorityPriceChange({
    ...dashboard.competitorAttributeChanges[0],
    currentValue: '35.00',
    latestRankNo: undefined,
    selfLatestRankStatus: 'ranked',
    selfLatestRankNo: 10
  }),
  false
)

const systemFallbackPriceChangeDisplay = buildAttributeChangeDisplayModel({
  ...dashboard.competitorAttributeChanges[0],
  selfPreviousValue: undefined,
  selfCurrentValue: undefined,
  selfCurrentDate: undefined,
  selfSnapshotCount: 0,
  selfLatestValue: '24.80',
  selfLatestDate: '2026-06-30'
})
assert.equal(systemFallbackPriceChangeDisplay.self.primaryLine, '当前价格：24.80')
assert.deepEqual(systemFallbackPriceChangeDisplay.self.underImageLines, ['未进前100'])
assert.deepEqual(systemFallbackPriceChangeDisplay.self.lines, [
  '价格变化：最近无变化 · 2026-06-30',
  '关键词：sticky notes'
])
assert.deepEqual(systemFallbackPriceChangeDisplay.self.lineHrefs, [
  undefined,
  'https://www.noon.com/saudi-en/search/?q=sticky%20notes'
])

const titleChangeDisplay = buildAttributeChangeDisplayModel({
  ...dashboard.competitorAttributeChanges[0],
  changeType: 'TITLE',
  label: '标题变化',
  previousValue: 'Old competitor title',
  currentValue: 'New competitor title',
  currentDate: '2026-06-30'
})
assert.equal(titleChangeDisplay.competitor.primaryLine, '标题变化')
assert.deepEqual(titleChangeDisplay.competitor.lines, [
  '排名变化：#8 -> #15',
  '原标题：Old competitor title',
  '新标题：New competitor title',
  '日期：2026-06-30'
])
assert.equal(titleChangeDisplay.competitor.lines.join(' ').includes('sticky notes'), false)

const splitAttributeChanges = splitAttributeChangeItems([
  {
    ...dashboard.competitorAttributeChanges[0],
    partnerSku: 'NON-PRIORITY',
    currentValue: '35.00',
    latestRankNo: undefined,
    selfLatestRankStatus: 'ranked',
    selfLatestRankNo: 10
  },
  dashboard.competitorAttributeChanges[0],
  {
    ...dashboard.competitorAttributeChanges[0],
    changeType: 'TITLE',
    label: '标题变化',
    previousValue: 'Old competitor title',
    currentValue: 'New competitor title'
  }
])
assert.equal(splitAttributeChanges.priceItems.length, 2)
assert.equal(splitAttributeChanges.titleItems.length, 1)
assert.equal(splitAttributeChanges.priceItems[0].changeType, 'PRICE')
assert.equal(splitAttributeChanges.priceItems[0].partnerSku, dashboard.competitorAttributeChanges[0].partnerSku)
assert.equal(splitAttributeChanges.priceItems[1].partnerSku, 'NON-PRIORITY')
assert.equal(splitAttributeChanges.titleItems[0].changeType, 'TITLE')

const oneHundredTwentyRankChanges = Array.from({ length: 120 }, (_, index) => ({
  ...dashboard.selfRankChanges[0],
  partnerSku: `SKU-${index + 1}`,
  rankDelta: index % 2 === 0 ? index + 1 : -(index + 1)
}))
const limitedRankChangeOption = buildRankChangeChartOption(oneHundredTwentyRankChanges, '我的关键词排名变化')
assert.equal(((limitedRankChangeOption.xAxis as { data?: unknown[] }).data || []).length, 100)
