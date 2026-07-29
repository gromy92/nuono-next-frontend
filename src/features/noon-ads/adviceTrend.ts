import type {
  NoonAdvertisingCampaignRow,
  NoonAdvertisingDashboardView,
  NoonAdvertisingQueryRow
} from './types'
import type {
  NoonAdvertisingAdviceGroupKey,
  NoonAdvertisingAdviceTrend
} from './adviceTypes'

const SCALE_MIN_ROAS = 8
const LOW_EFFICIENCY_MAX_ROAS = 3
const STRUCTURE_RISK_MIN_ZERO_ORDER_SHARE = 0.75
const TREND_MIN_SPEND = 5

type TrendRow = NoonAdvertisingCampaignRow | NoonAdvertisingQueryRow

type TrendLookup = {
  dataAvailable: boolean
  queryRows: Map<string, NoonAdvertisingQueryRow>
  queryRowsByText: Map<string, NoonAdvertisingQueryRow>
  campaignRows: Map<string, NoonAdvertisingCampaignRow>
}

export function buildTrendLookup(trendDashboard?: NoonAdvertisingDashboardView): TrendLookup {
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

export function trendForQuery(
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

export function trendForCampaign(
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

export function queryTrendKey(row: NoonAdvertisingQueryRow) {
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

export function campaignTrendKey(row: ProductIdentityCarrier & Pick<NoonAdvertisingCampaignRow, 'campaignCode' | 'campaignName'>) {
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

export function displaySkuOf(row: ProductIdentityCarrier) {
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

export function value(input?: number | null) {
  return Number(input || 0)
}

export function formatMoney(input?: number | null) {
  return value(input).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatDecimal(input?: number | null) {
  return value(input).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatRate(input?: number | null) {
  return `${(value(input) * 100).toFixed(2)}%`
}
