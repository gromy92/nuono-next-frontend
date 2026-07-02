import type {
  NoonAdvertisingCampaignRow,
  NoonAdvertisingDashboardView,
  NoonAdvertisingQueryRow
} from './types'

export type NoonAdvertisingAdviceGroupKey =
  | 'stopLoss'
  | 'scaleCandidates'
  | 'lowEfficiency'
  | 'structureRisk'

export type NoonAdvertisingAdviceTone = 'danger' | 'success' | 'warning' | 'processing'

export type NoonAdvertisingAdviceTrendStatus =
  | 'continuedRisk'
  | 'improving'
  | 'stillStrong'
  | 'cooling'
  | 'reducedSpend'
  | 'sampleInsufficient'

export type NoonAdvertisingAdviceTrend = {
  status: NoonAdvertisingAdviceTrendStatus
  label: string
  detail: string
}

export type NoonAdvertisingAdviceItem = {
  key: string
  title: string
  subtitle: string
  spendAmount: number
  ordersCount: number
  adRevenue: number
  roas: number
  evidence: string
  trend?: NoonAdvertisingAdviceTrend
}

export type NoonAdvertisingAdviceGroup = {
  key: NoonAdvertisingAdviceGroupKey
  title: string
  subtitle: string
  tone: NoonAdvertisingAdviceTone
  items: NoonAdvertisingAdviceItem[]
}

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

type TrendRow = NoonAdvertisingCampaignRow | NoonAdvertisingQueryRow

type TrendLookup = {
  dataAvailable: boolean
  queryRows: Map<string, NoonAdvertisingQueryRow>
  queryRowsByText: Map<string, NoonAdvertisingQueryRow>
  campaignRows: Map<string, NoonAdvertisingCampaignRow>
}

function buildTrendLookup(trendDashboard?: NoonAdvertisingDashboardView): TrendLookup {
  const dataAvailable = Boolean(trendDashboard?.dataStatus?.dataAvailable)
  const queryRows = new Map<string, NoonAdvertisingQueryRow>()
  const queryRowsByText = new Map<string, NoonAdvertisingQueryRow>()
  const campaignRows = new Map<string, NoonAdvertisingCampaignRow>()
  ;[...(trendDashboard?.zeroOrderQueries || []), ...(trendDashboard?.winningQueries || [])].forEach((row) => {
    queryRows.set(queryTrendKey(row), row)
    queryRowsByText.set(queryTrendTextKey(row), row)
  })
  ;(trendDashboard?.campaignRows || []).forEach((row) => {
    campaignRows.set(campaignTrendKey(row), row)
  })
  return { dataAvailable, queryRows, queryRowsByText, campaignRows }
}

function trendForQuery(
  groupKey: NoonAdvertisingAdviceGroupKey,
  row: NoonAdvertisingQueryRow,
  trends: TrendLookup
): NoonAdvertisingAdviceTrend {
  if (!trends.dataAvailable) return trendUnavailable('近7天未导入', '没有近7天独立报表窗口')
  const trendRow = trends.queryRows.get(queryTrendKey(row)) || trends.queryRowsByText.get(queryTrendTextKey(row))
  if (!trendRow) {
    const campaignTrendRow = trends.campaignRows.get(campaignTrendKey(row))
    if (campaignTrendRow) return classifyTrend(groupKey, campaignTrendRow)
    return trendUnavailable('近7天无匹配', '近7天报表中没有匹配到同一广告计划、商品和关键词/搜索词')
  }
  return classifyTrend(groupKey, trendRow)
}

function trendForCampaign(
  groupKey: NoonAdvertisingAdviceGroupKey,
  row: NoonAdvertisingCampaignRow,
  trends: TrendLookup
): NoonAdvertisingAdviceTrend {
  if (!trends.dataAvailable) return trendUnavailable('近7天未导入', '没有近7天独立报表窗口')
  const trendRow = trends.campaignRows.get(campaignTrendKey(row))
  if (!trendRow) return trendUnavailable('近7天无匹配', '近7天报表中没有匹配到同一广告计划和商品')
  return classifyTrend(groupKey, trendRow)
}

function classifyTrend(
  groupKey: NoonAdvertisingAdviceGroupKey,
  row: TrendRow
): NoonAdvertisingAdviceTrend {
  const spendAmount = value(row.spendAmount)
  const ordersCount = value(row.ordersCount)
  const roas = value(row.roas)

  if (spendAmount < TREND_MIN_SPEND) {
    return {
      status: 'reducedSpend',
      label: '近7天消耗降低',
      detail: trendDetail(row)
    }
  }

  if (groupKey === 'stopLoss') {
    return ordersCount === 0
      ? { status: 'continuedRisk', label: '近7天继续消耗', detail: trendDetail(row) }
      : { status: 'improving', label: '近7天已有转化', detail: trendDetail(row) }
  }

  if (groupKey === 'scaleCandidates') {
    if (ordersCount > 0 && roas >= SCALE_MIN_ROAS) {
      return { status: 'stillStrong', label: '近7天仍高 ROAS', detail: trendDetail(row) }
    }
    return { status: 'cooling', label: '近7天回落', detail: trendDetail(row) }
  }

  if (groupKey === 'lowEfficiency') {
    if (ordersCount > 0 && roas >= LOW_EFFICIENCY_MAX_ROAS) {
      return { status: 'improving', label: '近7天改善', detail: trendDetail(row) }
    }
    return { status: 'continuedRisk', label: '近7天仍低效', detail: trendDetail(row) }
  }

  if ('zeroOrderSpendShare' in row && value(row.zeroOrderSpendShare) >= STRUCTURE_RISK_MIN_ZERO_ORDER_SHARE) {
    return { status: 'continuedRisk', label: '近7天结构仍高风险', detail: trendDetail(row) }
  }
  return { status: 'improving', label: '近7天结构改善', detail: trendDetail(row) }
}

function trendUnavailable(label: string, detail: string): NoonAdvertisingAdviceTrend {
  return {
    status: 'sampleInsufficient',
    label,
    detail
  }
}

function queryTrendKey(row: NoonAdvertisingQueryRow) {
  return [
    row.campaignCode || 'NO_CAMPAIGN',
    advertisingIdentityKeyOf(row),
    row.queryText || 'NO_QUERY',
    row.queryKind || 'unknown'
  ].join('::')
}

function queryTrendTextKey(row: NoonAdvertisingQueryRow) {
  return [
    row.campaignCode || 'NO_CAMPAIGN',
    advertisingIdentityKeyOf(row),
    row.queryText || 'NO_QUERY'
  ].join('::')
}

function campaignTrendKey(row: ProductIdentityCarrier & Pick<NoonAdvertisingCampaignRow, 'campaignCode' | 'campaignName'>) {
  return [row.campaignCode || row.campaignName || 'NO_CAMPAIGN', advertisingIdentityKeyOf(row)].join('::')
}

type ProductIdentityCarrier = {
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  sku?: string | null
  primarySku?: string | null
  productIdentityKey?: string | null
  advertisingIdentityKey?: string | null
  productIdentityResolved?: boolean
  storeCode?: string | null
  siteCode?: string | null
}

function partnerSkuOf(row: ProductIdentityCarrier) {
  return row.partnerSku || row.primaryPartnerSku || ''
}

function displaySkuOf(row: ProductIdentityCarrier) {
  return partnerSkuOf(row) || row.adSkuCode || row.primaryAdSkuCode || row.sku || row.primarySku || ''
}

function advertisingIdentityKeyOf(row: ProductIdentityCarrier) {
  return row.advertisingIdentityKey || row.productIdentityKey || [
    row.storeCode || '',
    row.siteCode || '',
    partnerSkuOf(row) || `ADSKU:${row.adSkuCode || row.primaryAdSkuCode || row.sku || row.primarySku || 'NO_SKU'}`
  ].join('|')
}

function trendDetail(row: TrendRow) {
  const zeroOrderShare = 'zeroOrderSpendShare' in row
    ? ` / 零订单占比 ${formatRate(row.zeroOrderSpendShare)}`
    : ''
  return `近7天 ${formatMoney(row.spendAmount)} 花费 / ${value(row.ordersCount)} 订单 / ROAS ${formatDecimal(row.roas)}${zeroOrderShare}`
}

function value(input?: number | null) {
  return Number(input || 0)
}

function formatMoney(input?: number | null) {
  return value(input).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatDecimal(input?: number | null) {
  return value(input).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatRate(input?: number | null) {
  return `${(value(input) * 100).toFixed(2)}%`
}
