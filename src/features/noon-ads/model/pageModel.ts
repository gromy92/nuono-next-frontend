import dayjs, { type Dayjs } from 'dayjs'
import type { AuthSession } from '../../auth/session'
import type {
  NoonAdvertisingDashboardQuery,
  NoonAdvertisingDashboardView,
  NoonAdvertisingLatestReportWindow,
  NoonAdvertisingProductDiagnosisType
} from '../types'

export type DateRangeValue = [Dayjs, Dayjs]
export type ProductFilterKey = 'all' | NoonAdvertisingProductDiagnosisType
export type NoonAdvertisingPageProps = { session: AuthSession }
export type NoonAdsExportColumn<T> = {
  title: string
  text?: boolean
  value: (row: T) => string | number | null | undefined
}

export const diagnosisFilterOptions: Array<{
  label: string
  value: ProductFilterKey
}> = [
  { label: '全部', value: 'all' },
  { label: '优先止损', value: 'STOP_LOSS' },
  { label: '可沉淀核心', value: 'PROMOTE_TO_CORE' },
  { label: '核心可观察', value: 'CORE_OBSERVE' },
  { label: '结构待整理', value: 'STRUCTURE_REVIEW' },
  { label: '样本不足', value: 'INSUFFICIENT_DATA' }
]

export function initialDateRange(): DateRangeValue {
  const end = dayjs().subtract(1, 'day')
  return [end.subtract(29, 'day'), end]
}

export function dateRangeFromLatestWindow(
  latestWindow: NoonAdvertisingLatestReportWindow
): DateRangeValue | null {
  if (!latestWindow.dataAvailable || !latestWindow.dateFrom || !latestWindow.dateTo) {
    return null
  }
  const from = dayjs(latestWindow.dateFrom)
  const to = dayjs(latestWindow.dateTo)
  return from.isValid() && to.isValid() ? [from, to] : null
}

export function trendQueryFromDashboardQuery(
  query: NoonAdvertisingDashboardQuery
): NoonAdvertisingDashboardQuery {
  const trendTo = dayjs(query.dateTo)
  return {
    ...query,
    dateFrom: trendTo.subtract(6, 'day').format('YYYY-MM-DD'),
    dateTo: trendTo.format('YYYY-MM-DD')
  }
}

export const emptyDashboard: NoonAdvertisingDashboardView = {
  adSummary: {
    campaignCount: 0,
    queryCount: 0,
    views: 0,
    clicks: 0,
    ordersCount: 0,
    assistedOrders: 0,
    atcCount: 0,
    spendAmount: 0,
    adRevenue: 0,
    ctrPercentage: 0,
    roas: 0,
    cpc: 0,
    cps: 0,
    cvrPercentage: 0,
    zeroOrderSpendAmount: 0,
    zeroOrderSpendShare: 0
  },
  salesSummary: {
    netUnits: 0,
    revenueShipped: 0,
    adSpendShareOfSales: 0
  },
  campaignRows: [],
  productRows: [],
  productDiagnostics: [],
  campaignDiagnostics: [],
  zeroOrderQueries: [],
  winningQueries: [],
  dataStatus: {
    batchCount: 0,
    campaignRowCount: 0,
    queryRowCount: 0,
    dataAvailable: false
  }
}
