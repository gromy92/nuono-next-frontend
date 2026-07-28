import type {
  NoonAdvertisingCampaignRow,
  NoonAdvertisingDashboardView,
  NoonAdvertisingQueryRow
} from './types'
import type {
  NoonAdvertisingAdviceGroup,
  NoonAdvertisingAdviceItem,
  NoonAdvertisingAdviceTrend
} from './adviceTypes'
import {
  buildTrendLookup,
  campaignTrendKey,
  displaySkuOf,
  formatDecimal,
  formatMoney,
  formatRate,
  queryTrendKey,
  trendForCampaign,
  trendForQuery,
  value
} from './adviceTrend'

export * from './adviceTypes'

const STOP_LOSS_MIN_SPEND = 10
const SCALE_MIN_SPEND = 5
const SCALE_CAMPAIGN_MIN_SPEND = 50
const SCALE_MIN_ROAS = 8
const LOW_EFFICIENCY_MIN_SPEND = 50
const LOW_EFFICIENCY_MAX_ROAS = 3
const STRUCTURE_RISK_MIN_SPEND = 50
const STRUCTURE_RISK_MIN_ZERO_ORDER_SHARE = 0.75
const TREND_MIN_SPEND = 5

export function buildNoonAdvertisingAdviceGroups(
  dashboard: NoonAdvertisingDashboardView,
  trendDashboard?: NoonAdvertisingDashboardView
): NoonAdvertisingAdviceGroup[] {
  const campaignRows = dashboard.campaignRows || []
  const zeroOrderQueries = dashboard.zeroOrderQueries || []
  const winningQueries = dashboard.winningQueries || []
  const trends = buildTrendLookup(trendDashboard)

  return [
    {
      key: 'stopLoss',
      title: '优先止损',
      subtitle: '零订单且持续消耗的关键词/搜索词',
      tone: 'danger',
      items: zeroOrderQueries
        .filter((row) => value(row.ordersCount) === 0 && value(row.spendAmount) >= STOP_LOSS_MIN_SPEND)
        .sort((left, right) => value(right.spendAmount) - value(left.spendAmount))
        .map((row) => queryAdviceItem(row, trendForQuery('stopLoss', row, trends)))
    },
    {
      key: 'scaleCandidates',
      title: '加码观察',
      subtitle: '有订单、高 ROAS 且花费不低的关键词/搜索词或广告计划',
      tone: 'success',
      items: [
        ...winningQueries
          .filter((row) => value(row.ordersCount) > 0)
          .filter((row) => value(row.spendAmount) >= SCALE_MIN_SPEND)
          .filter((row) => value(row.roas) >= SCALE_MIN_ROAS)
          .map((row) => queryAdviceItem(row, trendForQuery('scaleCandidates', row, trends))),
        ...campaignRows
          .filter((row) => value(row.ordersCount) > 0)
          .filter((row) => value(row.spendAmount) >= SCALE_CAMPAIGN_MIN_SPEND)
          .filter((row) => value(row.roas) >= SCALE_MIN_ROAS)
          .map((row) => campaignAdviceItem(row, trendForCampaign('scaleCandidates', row, trends)))
      ]
        .sort((left, right) => right.roas - left.roas || right.adRevenue - left.adRevenue)
    },
    {
      key: 'lowEfficiency',
      title: '低效消耗',
      subtitle: '花费较高但 ROAS 偏低的广告计划',
      tone: 'warning',
      items: campaignRows
        .filter((row) => value(row.spendAmount) >= LOW_EFFICIENCY_MIN_SPEND)
        .filter((row) => value(row.roas) > 0 && value(row.roas) < LOW_EFFICIENCY_MAX_ROAS)
        .sort((left, right) => value(right.spendAmount) - value(left.spendAmount))
        .map((row) => campaignAdviceItem(row, trendForCampaign('lowEfficiency', row, trends)))
    },
    {
      key: 'structureRisk',
      title: '结构风险',
      subtitle: '零订单花费占比偏高的广告计划',
      tone: 'processing',
      items: campaignRows
        .filter((row) => value(row.spendAmount) >= STRUCTURE_RISK_MIN_SPEND)
        .filter((row) => value(row.zeroOrderSpendShare) >= STRUCTURE_RISK_MIN_ZERO_ORDER_SHARE)
        .sort((left, right) =>
          value(right.zeroOrderSpendShare) - value(left.zeroOrderSpendShare)
          || value(right.spendAmount) - value(left.spendAmount)
        )
        .map((row) => campaignAdviceItem(row, trendForCampaign('structureRisk', row, trends)))
    }
  ]
}

function queryAdviceItem(row: NoonAdvertisingQueryRow, trend?: NoonAdvertisingAdviceTrend): NoonAdvertisingAdviceItem {
  return {
    key: queryTrendKey(row),
    title: row.queryText || '(缺失关键词/搜索词)',
    subtitle: [
      row.campaignName || '未知广告计划',
      labeledValue('广告计划', row.campaignCode),
      labeledValue(row.productIdentityResolved === false ? '广告SKU' : 'PSKU', displaySkuOf(row))
    ].filter(Boolean).join(' · '),
    spendAmount: value(row.spendAmount),
    ordersCount: value(row.ordersCount),
    adRevenue: value(row.adRevenue),
    roas: value(row.roas),
    evidence: `${formatMoney(row.spendAmount)} 花费 / ${value(row.ordersCount)} 订单 / ROAS ${formatDecimal(row.roas)}`,
    trend
  }
}

function campaignAdviceItem(row: NoonAdvertisingCampaignRow, trend?: NoonAdvertisingAdviceTrend): NoonAdvertisingAdviceItem {
  return {
    key: campaignTrendKey(row),
    title: row.campaignName || row.campaignCode || '未知广告计划',
    subtitle: [
      labeledValue('广告计划', row.campaignCode),
      labeledValue(row.productIdentityResolved === false ? '广告SKU' : 'PSKU', displaySkuOf(row))
    ].filter(Boolean).join(' · ') || '无广告计划码',
    spendAmount: value(row.spendAmount),
    ordersCount: value(row.ordersCount),
    adRevenue: value(row.adRevenue),
    roas: value(row.roas),
    evidence: `${formatMoney(row.spendAmount)} 花费 / ${value(row.ordersCount)} 订单 / ROAS ${formatDecimal(row.roas)} / 零订单占比 ${formatRate(row.zeroOrderSpendShare)}`,
    trend
  }
}

function labeledValue(label: string, value?: string | null) {
  return value ? `${label} ${value}` : ''
}
