import { Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { ProductClassificationOptionPayload } from '../../product-domain/productClassificationApi'
import type { SalesForecastDailyForecast } from '../../sales-forecast/types'
import type {
  DailySalesFact,
  SalesPriceTrendBucket,
  SalesProductRow
} from '../types'
import type { DateRangeValue } from '../model/pageTypes'

const { Text } = Typography

const missingFieldLabelByCode: Readonly<Record<string, string>> = {
  product_dimension_missing: '商品主档未匹配',
  brand_missing: '品牌缺失',
  backend_fulltype_missing: '后台类目缺失'
}

export function missingFieldLabels(row?: SalesProductRow) {
  if (!row) return []
  const codes = new Set(row.dataQualityCodes || [])
  if (row.dimensionMatched === false) codes.add('product_dimension_missing')
  return Object.entries(missingFieldLabelByCode)
    .filter(([code]) => codes.has(code))
    .map(([, label]) => label)
}

export function missingFieldTags(row?: SalesProductRow) {
  const labels = missingFieldLabels(row)
  const tags: ReactNode[] = labels.map((label) => (
    <Tag key={label} color={label === '商品主档未匹配' ? 'red' : 'gold'}>{label}</Tag>
  ))
  return tags.length ? tags : <Text type="secondary">—</Text>
}

export function latestDateFromProducts(products: SalesProductRow[]) {
  return products
    .map((product) => product.latestFactDate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
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

export function formatPercent(value?: number | null) {
  return typeof value === 'number' ? `${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}%` : '-'
}

export function activityTypeLabel(type?: string) {
  if (type === 'holiday') return '节日'
  if (type === 'promotion') return '平台活动'
  if (type === 'salary_day') return '薪酬日'
  return type || '-'
}
