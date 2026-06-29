import dayjs from 'dayjs'
import type { InTransitGoodsLine } from './types'

const IMPORTED_MILESTONE_NODE_LABELS = new Set(['国内收货', '发往海外', '完成清关', 'ET海外仓入库'])

function milestoneLabelFromDescription(description?: string | null) {
  const normalized = description?.trim()
  return normalized && IMPORTED_MILESTONE_NODE_LABELS.has(normalized) ? normalized : null
}

export function logisticsNodeDisplayLabel(labels: Map<string, string>, status?: string | null, description?: string | null) {
  return milestoneLabelFromDescription(description) || labels.get(status || '') || status || '-'
}

export function shouldShowNodeDescription(description?: string | null) {
  const normalized = description?.trim()
  return Boolean(normalized && !milestoneLabelFromDescription(normalized))
}

export function formatNodeDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

export function formatNodeDate(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 10)
}

export function formatInTransitDuration(domesticReceivedAt?: string | null) {
  if (!domesticReceivedAt) {
    return '在途时间 -'
  }
  const receivedDate = dayjs(domesticReceivedAt).startOf('day')
  if (!receivedDate.isValid()) {
    return '在途时间 -'
  }
  const days = Math.max(dayjs().startOf('day').diff(receivedDate, 'day'), 0)
  return `在途时间 ${days} 天`
}

export function formatCny(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '-'
  }
  return `¥${Number(value).toFixed(2)}`
}

export function formatQuantity(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

export function normalizeNodeDateTime(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return undefined
  }
  return trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
}

export function nodeTimelineColor(status?: string | null) {
  if (status === 'exception') {
    return 'red'
  }
  if (status === 'warehouse_received') {
    return 'green'
  }
  if (status === 'customs_clearance') {
    return 'orange'
  }
  return 'blue'
}

export function importIssueColor(level?: string | null) {
  return level === 'error' ? 'red' : 'gold'
}

function hasChineseText(value?: string | null) {
  return /[\u3400-\u9fff]/.test(value?.trim() || '')
}

export function productDisplayName(source: {
  productName?: string | null
  productTitle?: string | null
  psku?: string | null
}): string {
  const productName = source.productName?.trim()
  const productTitle = source.productTitle?.trim()
  if (hasChineseText(productName)) {
    return productName || '-'
  }
  if (hasChineseText(productTitle)) {
    return productTitle || '-'
  }
  return productName || productTitle || source.psku || '-'
}

export function uniqueBoxSpecValue(
  lines: InTransitGoodsLine[],
  selector: (line: InTransitGoodsLine) => number | string | null | undefined
) {
  const values = Array.from(new Set(lines.map(selector).filter((value) => value !== null && value !== undefined && value !== '')))
  if (!values.length) {
    return '-'
  }
  return values.map(String).join(' / ')
}

export function firstBoxSpecValue(lines: InTransitGoodsLine[], selector: (line: InTransitGoodsLine) => number | string | null | undefined) {
  return uniqueBoxSpecValue(lines, selector)
}

export function formatBoxSize(length: string, width: string, height: string) {
  if (length === '-' && width === '-' && height === '-') {
    return '-'
  }
  return `${length} x ${width} x ${height} cm`
}

export function stripedRowClassName(_record: unknown, index?: number) {
  return (index ?? 0) % 2 === 0 ? 'in-transit-row--odd' : 'in-transit-row--even'
}
