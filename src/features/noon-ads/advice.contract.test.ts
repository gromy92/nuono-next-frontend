import { buildNoonAdvertisingAdviceGroups } from './advice'
import type { NoonAdvertisingDashboardView } from './types'

const dashboard: NoonAdvertisingDashboardView = {
  adSummary: {
    campaignCount: 4,
    queryCount: 4,
    views: 1000,
    clicks: 120,
    ordersCount: 18,
    assistedOrders: 0,
    atcCount: 40,
    spendAmount: 300,
    adRevenue: 1200,
    ctrPercentage: 0.12,
    roas: 4,
    cpc: 2.5,
    cps: 16.67,
    cvrPercentage: 0.15,
    zeroOrderSpendAmount: 190,
    zeroOrderSpendShare: 0.63
  },
  salesSummary: {
    netUnits: 120,
    revenueShipped: 5000,
    adSpendShareOfSales: 0.06
  },
  campaignRows: [
    campaign('C_LOW', '低效 campaign', 96, 1, 96, 1, 0.82),
    campaign('C_RISK', '零订单占比高', 88, 12, 760, 8.64, 0.91),
    campaign('C_SCALE', '可放量 campaign', 75, 15, 1040, 13.87, 0.22, 'PSKU-C-SCALE'),
    campaign('C_OK', '正常 campaign', 24, 5, 120, 5, 0.2)
  ],
  productRows: [],
  productDiagnostics: [],
  campaignDiagnostics: [],
  zeroOrderQueries: [
    query('C_LOW', '低效 campaign', 'SKU-1', 'waste highest', 45.25, 0, 0, 0),
    query('C_RISK', '零订单占比高', 'SKU-2', 'waste lower', 18.5, 0, 0, 0),
    query('C_OK', '正常 campaign', 'SKU-3', 'below threshold', 4.99, 0, 0, 0)
  ],
  winningQueries: [
    query('C_SCALE', '可放量 campaign', 'SKU-4', 'scale high roas', 12.5, 4, 205, 16.4, 'latin_search_term'),
    query('C_RISK', '零订单占比高', 'SKU-5', 'scale noisy', 0.9, 1, 80, 88.88),
    query('C_OK', '正常 campaign', 'SKU-6', 'scale low roas', 15, 5, 90, 6)
  ],
  dataStatus: {
    batchCount: 1,
    campaignRowCount: 4,
    queryRowCount: 6,
    dataAvailable: true
  }
}

const groups = buildNoonAdvertisingAdviceGroups(dashboard)
assertEqual(groups.length, 4, 'advice should expose four stable groups')

const stopLoss = group('stopLoss')
assertEqual(stopLoss.items[0].title, 'waste highest', 'stop-loss group should sort zero-order queries by spend')
assertEqual(stopLoss.items.length, 2, 'stop-loss group should ignore low-spend zero-order queries')
assertEqual(stopLoss.items[0].spendAmount, 45.25, 'stop-loss item should preserve spend evidence')

const scale = group('scaleCandidates')
assertEqual(scale.items.length, 3, 'scale group should include strong query and high-ROAS campaign rows')
assertEqual(scale.items[0].title, 'scale high roas', 'scale group should sort the strongest query first')
assertEqual(scale.items[0].roas, 16.4, 'scale item should preserve ROAS evidence')
if (scale.items.some((item) => item.title === 'scale noisy' || item.title === 'scale low roas')) {
  throw new Error('scale group should ignore noisy low-spend and low-ROAS query rows')
}

const campaignScaleGroups = buildNoonAdvertisingAdviceGroups({ ...dashboard, winningQueries: [] })
const campaignScale = campaignScaleGroups.find((item) => item.key === 'scaleCandidates')
if (!campaignScale) throw new Error('missing campaign-scale advice group')
assertEqual(campaignScale.items[0].title, '可放量 campaign', 'scale group should fall back to high-ROAS campaign rows')
assertEqual(
  campaignScale.items[0].subtitle,
  '广告计划 C_SCALE · PSKU PSKU-C-SCALE',
  'campaign advice should show both campaign code and product PSKU when available'
)

const lowEfficiency = group('lowEfficiency')
assertEqual(lowEfficiency.items[0].title, '低效 campaign', 'low-efficiency group should flag high-spend low-ROAS campaign')
assertEqual(lowEfficiency.items.length, 1, 'low-efficiency group should not flag healthy high-ROAS campaigns')

const structureRisk = group('structureRisk')
assertEqual(structureRisk.items[0].title, '零订单占比高', 'structure-risk group should sort by zero-order spend share')
assertEqual(structureRisk.items.length, 2, 'structure-risk group should include high zero-order share campaigns')

const emptyGroups = buildNoonAdvertisingAdviceGroups({ ...dashboard, campaignRows: [], zeroOrderQueries: [], winningQueries: [] })
if (!emptyGroups.every((item) => item.items.length === 0)) {
  throw new Error('empty dashboard should keep stable advice groups with no items')
}

const manyCandidatesDashboard: NoonAdvertisingDashboardView = {
  ...dashboard,
  zeroOrderQueries: [
    query('C_LOW', '低效 campaign', 'SKU-A', 'waste 1', 21, 0, 0, 0),
    query('C_LOW', '低效 campaign', 'SKU-B', 'waste 2', 22, 0, 0, 0),
    query('C_LOW', '低效 campaign', 'SKU-C', 'waste 3', 23, 0, 0, 0),
    query('C_LOW', '低效 campaign', 'SKU-D', 'waste 4', 24, 0, 0, 0),
    query('C_LOW', '低效 campaign', 'SKU-E', 'waste 5', 25, 0, 0, 0),
    query('C_LOW', '低效 campaign', 'SKU-F', 'waste 6', 26, 0, 0, 0)
  ]
}
const manyCandidatesStopLoss = buildNoonAdvertisingAdviceGroups(manyCandidatesDashboard).find((item) => item.key === 'stopLoss')
if (!manyCandidatesStopLoss) throw new Error('missing many-candidates stop-loss group')
assertEqual(manyCandidatesStopLoss.items.length, 6, 'advice groups should retain all qualifying items for full-list display')
assertEqual(manyCandidatesStopLoss.items[0].title, 'waste 6', 'full-list display should keep sorted advice order')

const trendDashboard: NoonAdvertisingDashboardView = {
  ...dashboard,
  campaignRows: [
    campaign('C_LOW', '低效 campaign', 36, 4, 160, 4.44, 0.3),
    campaign('C_RISK', '零订单占比高', 28, 2, 56, 2, 0.9),
    campaign('C_SCALE', '可放量 campaign', 30, 6, 390, 13, 0.1)
  ],
  zeroOrderQueries: [
    query('C_LOW', '低效 campaign', 'SKU-1', 'waste highest', 16, 0, 0, 0)
  ],
  winningQueries: [
    query('C_SCALE', '可放量 campaign', 'SKU-4', 'scale high roas', 8, 2, 96, 12)
  ],
  dataStatus: {
    batchCount: 1,
    campaignRowCount: 3,
    queryRowCount: 2,
    dataAvailable: true
  }
}
const trendedGroups = buildNoonAdvertisingAdviceGroups(dashboard, trendDashboard)
const trendedStopLoss = trendedGroups.find((item) => item.key === 'stopLoss')
if (!trendedStopLoss) throw new Error('missing trended stop-loss group')
assertEqual(trendedStopLoss.items[0].trend?.label, '近7天继续消耗', 'stop-loss trend should detect continued zero-order spend')

const trendedScale = trendedGroups.find((item) => item.key === 'scaleCandidates')
if (!trendedScale) throw new Error('missing trended scale group')
assertEqual(trendedScale.items[0].trend?.label, '近7天仍高 ROAS', 'scale trend should detect sustained high ROAS')

const trendedLowEfficiency = trendedGroups.find((item) => item.key === 'lowEfficiency')
if (!trendedLowEfficiency) throw new Error('missing trended low-efficiency group')
assertEqual(trendedLowEfficiency.items[0].trend?.label, '近7天改善', 'low-efficiency trend should detect recovered ROAS')

const missingTrendGroups = buildNoonAdvertisingAdviceGroups(dashboard, {
  ...dashboard,
  campaignRows: [],
  zeroOrderQueries: [],
  winningQueries: [],
  dataStatus: {
    batchCount: 0,
    campaignRowCount: 0,
    queryRowCount: 0,
    dataAvailable: false
  }
})
const missingTrendScale = missingTrendGroups.find((item) => item.key === 'scaleCandidates')
if (!missingTrendScale) throw new Error('missing missing-trend scale group')
assertEqual(missingTrendScale.items[0].trend?.label, '近7天未导入', 'missing 7-day report should be explicit')

const queryKindAliasTrendGroups = buildNoonAdvertisingAdviceGroups(dashboard, {
  ...dashboard,
  campaignRows: [],
  zeroOrderQueries: [],
  winningQueries: [
    query('C_SCALE', '可放量 campaign', 'SKU-4', 'scale high roas', 8, 2, 96, 12, 'search_term')
  ],
  dataStatus: {
    batchCount: 1,
    campaignRowCount: 0,
    queryRowCount: 1,
    dataAvailable: true
  }
})
const queryKindAliasScale = queryKindAliasTrendGroups.find((item) => item.key === 'scaleCandidates')
if (!queryKindAliasScale) throw new Error('missing query-kind-alias scale group')
assertEqual(
  queryKindAliasScale.items[0].trend?.label,
  '近7天仍高 ROAS',
  'query trend should match the same campaign/sku/query text even when queryKind aliases differ'
)

const campaignFallbackTrendGroups = buildNoonAdvertisingAdviceGroups(dashboard, {
  ...dashboard,
  campaignRows: [
    campaign('C_SCALE', '可放量 campaign', 2.5, 0, 0, 0, 1, 'SKU-4')
  ],
  zeroOrderQueries: [],
  winningQueries: [],
  dataStatus: {
    batchCount: 1,
    campaignRowCount: 1,
    queryRowCount: 0,
    dataAvailable: true
  }
})
const campaignFallbackScale = campaignFallbackTrendGroups.find((item) => item.key === 'scaleCandidates')
if (!campaignFallbackScale) throw new Error('missing campaign-fallback scale group')
assertEqual(
  campaignFallbackScale.items[0].trend?.label,
  '近7天消耗降低',
  'query trend should fall back to campaign-level 7-day data before declaring sample insufficient'
)

const crossStoreTrendGroups = buildNoonAdvertisingAdviceGroups(
  {
    ...dashboard,
    zeroOrderQueries: [
      {
        ...query('C_SHARED', '同 PSKU 广告计划', 'SHARED-PSKU', 'shared keyword', 16, 0, 0, 0),
        storeCode: 'STR-A',
        siteCode: 'SA',
        partnerSku: 'SHARED-PSKU',
        productIdentityKey: 'STR-A|SA|SHARED-PSKU'
      }
    ],
    winningQueries: []
  },
  {
    ...dashboard,
    campaignRows: [],
    zeroOrderQueries: [
      {
        ...query('C_SHARED', '同 PSKU 广告计划', 'SHARED-PSKU', 'shared keyword', 16, 0, 0, 0),
        storeCode: 'STR-B',
        siteCode: 'SA',
        partnerSku: 'SHARED-PSKU',
        productIdentityKey: 'STR-B|SA|SHARED-PSKU'
      }
    ],
    winningQueries: [],
    dataStatus: {
      batchCount: 1,
      campaignRowCount: 0,
      queryRowCount: 1,
      dataAvailable: true
    }
  }
)
const crossStoreStopLoss = crossStoreTrendGroups.find((item) => item.key === 'stopLoss')
if (!crossStoreStopLoss) throw new Error('missing cross-store stop-loss group')
assertEqual(
  crossStoreStopLoss.items[0].trend?.label,
  '近7天无匹配',
  'query trend should not match the same partnerSku from another store'
)

function group(key: string) {
  const target = groups.find((item) => item.key === key)
  if (!target) throw new Error(`missing advice group: ${key}`)
  return target
}

function campaign(
  campaignCode: string,
  campaignName: string,
  spendAmount: number,
  ordersCount: number,
  adRevenue: number,
  roas: number,
  zeroOrderSpendShare: number,
  primarySku?: string
) {
  return {
    campaignCode,
    campaignName,
    primaryPartnerSku: primarySku,
    primarySku,
    campaignStatus: 'live',
    qcStatus: 'live',
    views: 100,
    clicks: 10,
    ordersCount,
    assistedOrders: 0,
    atcCount: 3,
    spendAmount,
    adRevenue,
    ctrPercentage: 0.1,
    roas,
    cpc: spendAmount / 10,
    cps: ordersCount ? spendAmount / ordersCount : 0,
    cvrPercentage: ordersCount / 10,
    zeroOrderSpendAmount: spendAmount * zeroOrderSpendShare,
    zeroOrderSpendShare
  }
}

function query(
  campaignCode: string,
  campaignName: string,
  sku: string,
  queryText: string,
  spendAmount: number,
  ordersCount: number,
  adRevenue: number,
  roas: number,
  queryKind = 'search_term'
) {
  return {
    campaignCode,
    campaignName,
    partnerSku: sku,
    sku,
    queryText,
    queryKind,
    views: 20,
    clicks: 3,
    ordersCount,
    assistedOrders: 0,
    atcCount: 1,
    spendAmount,
    adRevenue,
    ctrPercentage: 0.15,
    roas,
    cpc: spendAmount / 3,
    cps: ordersCount ? spendAmount / ordersCount : 0,
    cvrPercentage: ordersCount / 3
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}`)
  }
}
