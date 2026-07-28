import { Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { ProductClassificationOptionPayload } from '../../product-domain/productClassificationApi'
import type { SalesForecastDailyForecast } from '../../sales-forecast/types'
import type {
  DailySalesFact,
  SalesAnalyticsQuery,
  SalesAnalyticsSummary,
  SalesPriceTrendBucket,
  SalesProductRow
} from '../types'
import type { DateRangeValue } from '../model/pageTypes'

const { Text } = Typography

export function healthTags(row?: SalesProductRow) {
  if (!row) return <Tag>—</Tag>
  const codes = row.dataQualityCodes || []
  const tags: ReactNode[] = []
  if (row.dimensionMatched !== false && !codes.includes('brand_missing') && !codes.includes('backend_fulltype_missing')) {
    tags.push(<Tag key="normal" color="green">经营正常</Tag>)
  }
  for (const code of codes) {
    if (code === 'product_dimension_matched') continue
    tags.push(<Tag key={code} color={dataQualityColor(code)}>{dataQualityLabel(code)}</Tag>)
  }
  return tags.length ? tags : <Tag>—</Tag>
}

export function primaryHealthLabel(row: SalesProductRow) {
  if (row.dataQualityCodes?.includes('brand_missing')) return '品牌缺失'
  if (row.dataQualityCodes?.includes('backend_fulltype_missing')) return '后台类目缺失'
  if (row.dataQualityCodes?.includes('product_dimension_missing')) return '商品主档未匹配'
  return '经营正常'
}

export function latestDateFromProducts(products: SalesProductRow[]) {
  return products
    .map((product) => product.latestFactDate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
}

export function emptySalesDateRangeWarning(
  query: SalesAnalyticsQuery | null,
  products: SalesProductRow[],
  summary: SalesAnalyticsSummary,
  latestSalesDate?: string,
  loading?: boolean
) {
  if (loading || !query || products.length || !latestSalesDate || summaryHasSales(summary)) {
    return null
  }
  const latest = dayjs(latestSalesDate)
  const from = dayjs(query.dateFrom)
  const to = dayjs(query.dateTo)
  if (!latest.isValid() || !from.isValid() || !to.isValid() || !latest.isBefore(to, 'day')) {
    return null
  }
  if (latest.isBefore(from, 'day')) {
    return `当前选择日期范围没有销量事实；本地最新销量日是 ${latestSalesDate}。请把时间范围包含最新销量日，或等待销量同步完成。`
  }
  return `当前范围内暂未查到商品列表；本地最新销量日是 ${latestSalesDate}，所选结束日期晚于最新销量数据。`
}

export function summaryHasSales(summary: SalesAnalyticsSummary) {
  return Boolean(
    Number(summary.netUnits || 0) ||
      Number(summary.grossUnits || 0) ||
      Number(summary.shippedUnits || 0) ||
      Number(summary.cancelledUnits || 0) ||
      Number(summary.revenueShipped || 0) ||
      Number(summary.yourVisitors || 0)
  )
}

export function syncStatusLabel(state?: string) {
  if (state === 'stale' || state === 'STALE_LATEST_SALES') return '数据过期'
  if (state === 'empty_report') return '空报表'
  if (state === 'provider_unavailable') return 'Provider 不可用'
  if (state === 'missing_mapping') return '映射异常'
  return state || 'ready'
}

export function averageOrderValue(revenue?: number | null, units?: number | null) {
  if (typeof revenue !== 'number' || !units) return null
  return revenue / units
}

export function siteCodeFromStoreCode(storeCode: string) {
  if (storeCode.endsWith('-NSA') || storeCode.endsWith('-SAU')) return 'SA'
  if (storeCode.endsWith('-NAE')) return 'AE'
  return 'SA'
}

export function parsePartnerSkuText(value: string) {
  return Array.from(new Set(value.split(/[\n\r,，;；]+/).map((item) => item.trim()).filter(Boolean)))
}

export function classificationSelectOptions(options: ProductClassificationOptionPayload[]) {
  return options
    .filter((option) => option.value || option.label)
    .map((option) => {
      const value = option.value || option.label || ''
      return {
        value,
        label: option.label || value,
        title: option.label || value
      }
    })
}

export function lastCategoryLabel(value?: string | null) {
  if (!value?.trim()) return '后台类目 —'
  return value
    .split(/[>\/|\\-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) || value
}

export function TrafficMetric({
  latestVisitors,
  latestConversion,
  rangeVisitors,
  rangeConversion
}: {
  latestVisitors?: number | null
  latestConversion?: number | null
  rangeVisitors?: number | null
  rangeConversion?: number | null
}) {
  return (
    <Space direction="vertical" size={0} style={{ width: '100%', alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 12 }}>
        访客 {formatNumber(latestVisitors)} / 转化 {formatPercent(latestConversion)}
      </Text>
      <Text style={{ fontSize: 12 }}>
        访客 {formatNumber(rangeVisitors)} / 转化 {formatPercent(rangeConversion)}
      </Text>
    </Space>
  )
}

export function formatNumber(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '-'
}

export function formatForecastUnits(value?: number | null) {
  return typeof value === 'number' ? `${value.toLocaleString('zh-CN')} 件` : '—'
}

export function forecastUnitsForRange(points: SalesForecastDailyForecast[], range: DateRangeValue) {
  let total = 0
  let matched = false
  const start = range[0].startOf('day')
  const end = range[1].startOf('day')
  for (const point of points) {
    if (!point.forecastDate) continue
    const date = dayjs(point.forecastDate)
    if (!date.isValid() || date.isBefore(start, 'day') || date.isAfter(end, 'day')) continue
    total += numericForecastValue(point.forecastUnits)
    matched = true
  }
  return matched ? Math.ceil(total) : null
}

export function actualUnitsForRange(facts: DailySalesFact[], range: DateRangeValue) {
  let total = 0
  let matched = false
  const start = range[0].startOf('day')
  const end = range[1].startOf('day')
  for (const fact of facts) {
    if (!fact.factDate) continue
    const date = dayjs(fact.factDate)
    if (!date.isValid() || date.isBefore(start, 'day') || date.isAfter(end, 'day')) continue
    if (typeof fact.netUnits === 'number') {
      total += fact.netUnits
      matched = true
    }
  }
  return matched ? total : null
}

export function datesBetween(range: DateRangeValue) {
  const start = range[0].startOf('day')
  const end = range[1].startOf('day')
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) {
    return []
  }
  const dates: string[] = []
  for (let cursor = start, index = 0; !cursor.isAfter(end, 'day') && index < 180; cursor = cursor.add(1, 'day'), index++) {
    dates.push(cursor.format('YYYY-MM-DD'))
  }
  return dates
}

export function formatForecastFactor(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—'
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isFinite(numericValue)) return numericValue.toFixed(4)
  return String(value)
}

export function numericForecastValue(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return 0
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export function formatChartUnits(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

export function normalizeProductKey(value?: string | null) {
  return (value || '').trim().toUpperCase()
}

export function forecastRiskColor(severity?: string | null) {
  if (severity === 'danger') return 'red'
  if (severity === 'warning') return 'gold'
  return 'blue'
}

export function numericOrNull(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function formatStockCoverDays(value?: number | null) {
  return typeof value === 'number'
    ? `${value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}天`
    : '—'
}

export function formatMoney(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
}

export function formatDateRange(range: DateRangeValue) {
  return `${range[0].format('YYYY-MM-DD')} 至 ${range[1].format('YYYY-MM-DD')}`
}

export function formatTrendDataRange(facts: DailySalesFact[], priceTrend: SalesPriceTrendBucket[]) {
  const dates = [
    ...facts.map((fact) => fact.factDate),
    ...priceTrend.map((bucket) => bucket.bucketStart)
  ].filter((date): date is string => Boolean(date && dayjs(date).isValid()))

  if (!dates.length) return null
  const sorted = dates.sort()
  return `${sorted[0]} 至 ${sorted.at(-1)}`
}

export function compactRangeText(label: string, dateFrom?: string | null, dateTo?: string | null) {
  if (!dateFrom && !dateTo) return null
  if (dateFrom && dateTo) return `${label} ${dateFrom} 至 ${dateTo}`
  return `${label} ${dateFrom || dateTo}`
}

export function formatPercent(value?: number | null) {
  return typeof value === 'number' ? `${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}%` : '-'
}

export function dataQualityLabel(code?: string) {
  if (code === 'sales_fact_ready') return '销量就绪'
  if (code === 'product_dimension_matched') return '商品已匹配'
  if (code === 'product_dimension_missing') return '商品主档未匹配'
  if (code === 'brand_missing') return '品牌缺失'
  if (code === 'backend_fulltype_missing') return '后台类目缺失'
  return code || '-'
}

export function dataQualityColor(code?: string) {
  if (code === 'sales_fact_ready' || code === 'product_dimension_matched') return 'green'
  if (code === 'product_dimension_missing') return 'red'
  if (code === 'brand_missing' || code === 'backend_fulltype_missing') return 'gold'
  return 'default'
}

export function activityTypeLabel(type?: string) {
  if (type === 'holiday') return '节日'
  if (type === 'promotion') return '平台活动'
  if (type === 'salary_day') return '薪酬日'
  return type || '-'
}
