import { Tag } from 'antd'
import type {
  NoonAdvertisingCampaignDiagnostic,
  NoonAdvertisingCampaignRow,
  NoonAdvertisingProductDiagnostic,
  NoonAdvertisingProductDiagnosisType,
  NoonAdvertisingProductRow,
  NoonAdvertisingQueryRow
} from '../types'
import type {
  NoonAdsExportColumn,
  ProductFilterKey
} from '../model/pageModel'

export function siteCodeFromStoreCode(storeCode: string) {
  const normalized = storeCode.toUpperCase()
  if (normalized.includes('AE') || normalized.includes('UAE') || normalized.includes('DB')) return 'AE'
  return 'SA'
}

export function statusTag(value?: string | null) {
  if (!value) return <Tag>未知</Tag>
  const normalized = value.toLowerCase()
  const color = normalized.includes('active') || normalized.includes('enable') ? 'green' : normalized.includes('pause') ? 'orange' : 'default'
  return <Tag color={color}>{value}</Tag>
}

export function queryRowKey(row: NoonAdvertisingQueryRow) {
  return [row.campaignCode || 'NO_CAMPAIGN', advertisingIdentityKeyOf(row), row.queryText || 'NO_QUERY', row.queryKind || 'unknown'].join('::')
}

export function partnerSkuOf(row: { partnerSku?: string | null; primaryPartnerSku?: string | null }) {
  return row.partnerSku || row.primaryPartnerSku || ''
}

export function displaySkuOf(row: {
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  sku?: string | null
  primarySku?: string | null
}) {
  return partnerSkuOf(row) || row.adSkuCode || row.primaryAdSkuCode || row.sku || row.primarySku || ''
}

export function secondarySkuOf(row: {
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  sku?: string | null
  primarySku?: string | null
}) {
  const primary = displaySkuOf(row)
  const secondary = row.adSkuCode || row.primaryAdSkuCode || ''
  return secondary && secondary !== primary ? secondary : ''
}

export function searchableProductTextOf(row: NoonAdvertisingProductRow) {
  return [
    displaySkuOf(row),
    secondarySkuOf(row),
    row.partnerSku,
    row.adSkuCode,
    row.sku,
    row.storeCode,
    row.siteCode
  ].filter(Boolean).join(' ').toLowerCase()
}

export function productMatchesFilter(diagnostic: NoonAdvertisingProductDiagnostic | undefined, filter: ProductFilterKey) {
  if (filter === 'all') return true
  return (diagnostic?.diagnosisType || 'INSUFFICIENT_DATA') === filter
}

export function primaryDiagnosticReason(diagnostic?: NoonAdvertisingProductDiagnostic | null) {
  return diagnostic?.labels?.find((label) => label !== '搜索排名未接入') || '样本不足'
}

export function planTypeCountText(diagnostic?: NoonAdvertisingProductDiagnostic | null) {
  return `核心 ${formatNumber(diagnostic?.coreCampaignCount || 0)} / 探索 ${formatNumber(diagnostic?.explorationCampaignCount || 0)} / 未分类 ${formatNumber(diagnostic?.unclassifiedCampaignCount || 0)}`
}

export function productDiagnosisTagColor(diagnosisType?: NoonAdvertisingProductDiagnosisType | null) {
  if (diagnosisType === 'STOP_LOSS') return 'red'
  if (diagnosisType === 'PROMOTE_TO_CORE') return 'green'
  if (diagnosisType === 'CORE_OBSERVE') return 'blue'
  if (diagnosisType === 'STRUCTURE_REVIEW') return 'gold'
  return 'default'
}

export function diagnosticLabelTagColor(label: string) {
  if (label.includes('消耗') || label.includes('走弱') || label.includes('零订单')) return 'warning'
  if (label.includes('稳定') || label.includes('收获') || label.includes('高转化')) return 'green'
  if (label.includes('待确认') || label.includes('无法归类')) return 'default'
  return 'blue'
}

export function countRowsByCampaign(rows: Array<{ campaignCode: string }>) {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    counts.set(row.campaignCode, (counts.get(row.campaignCode) || 0) + 1)
  })
  return counts
}

export function campaignExportColumns(
  campaignDiagnosticsByCode: Map<string, NoonAdvertisingCampaignDiagnostic>
): Array<NoonAdsExportColumn<NoonAdvertisingCampaignRow>> {
  return [
    { title: '商品标识', text: true, value: displaySkuOf },
    { title: '广告侧商品码', text: true, value: (row) => row.primaryAdSkuCode || '' },
    { title: 'Campaign Code', text: true, value: (row) => row.campaignCode },
    { title: 'Campaign 名称', text: true, value: (row) => row.campaignName || '' },
    { title: '计划类型', text: true, value: (row) => campaignDiagnosticsByCode.get(row.campaignCode)?.planTypeLabel || '未分类' },
    { title: '结构标签', text: true, value: (row) => campaignDiagnosticsByCode.get(row.campaignCode)?.labels?.join(' / ') || '' },
    { title: '状态', text: true, value: (row) => row.campaignStatus || '' },
    { title: 'QC 状态', text: true, value: (row) => row.qcStatus || '' },
    { title: '花费', value: (row) => row.spendAmount },
    { title: '广告收入', value: (row) => row.adRevenue },
    { title: '订单', value: (row) => row.ordersCount },
    { title: '曝光', value: (row) => row.views },
    { title: '点击', value: (row) => row.clicks },
    { title: 'ROAS', value: (row) => row.roas },
    { title: 'CPC', value: (row) => row.cpc },
    { title: 'CTR', value: (row) => row.ctrPercentage },
    { title: 'CVR', value: (row) => row.cvrPercentage },
    { title: '零订单花费', value: (row) => row.zeroOrderSpendAmount },
    { title: '零订单占比', value: (row) => row.zeroOrderSpendShare }
  ]
}

export function queryExportColumns(): Array<NoonAdsExportColumn<NoonAdvertisingQueryRow>> {
  return [
    { title: '商品标识', text: true, value: displaySkuOf },
    { title: '广告侧商品码', text: true, value: (row) => row.adSkuCode || '' },
    { title: 'Campaign Code', text: true, value: (row) => row.campaignCode },
    { title: 'Campaign 名称', text: true, value: (row) => row.campaignName || '' },
    { title: '关键词/搜索词', text: true, value: (row) => row.queryText || '' },
    { title: '类型', text: true, value: (row) => row.queryKind || '' },
    { title: '花费', value: (row) => row.spendAmount },
    { title: '广告收入', value: (row) => row.adRevenue },
    { title: '订单', value: (row) => row.ordersCount },
    { title: '曝光', value: (row) => row.views },
    { title: '点击', value: (row) => row.clicks },
    { title: 'ROAS', value: (row) => row.roas },
    { title: 'CPC', value: (row) => row.cpc },
    { title: 'CTR', value: (row) => row.ctrPercentage },
    { title: 'CVR', value: (row) => row.cvrPercentage }
  ]
}

export function downloadNoonAdsRowsAsExcel<T>({
  filename,
  sheetName,
  columns,
  rows
}: {
  filename: string
  sheetName: string
  columns: Array<NoonAdsExportColumn<T>>
  rows: T[]
}) {
  if (!rows.length) return 0
  const header = columns
    .map((column) => `<th style="mso-number-format:'\\@';">${escapeExcelHtml(column.title)}</th>`)
    .join('')
  const body = rows
    .map((row) => (
      `<tr>${columns.map((column) => {
        const value = column.value(row)
        const style = column.text ? " style=\"mso-number-format:'\\@';\"" : ''
        return `<td${style}>${escapeExcelHtml(value ?? '')}</td>`
      }).join('')}</tr>`
    ))
    .join('')
  const html = [
    '<!doctype html>',
    '<html>',
    '<head><meta charset="UTF-8"></head>',
    '<body>',
    `<table><caption>${escapeExcelHtml(sheetName)}</caption><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`,
    '</body>',
    '</html>'
  ].join('')
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  return rows.length
}

export function escapeExcelHtml(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function sanitizeFilePart(value: string) {
  return value
    .trim()
    .replace(/[^\w\u4e00-\u9fa5.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'export'
}

export function advertisingIdentityKeyOf(row: {
  advertisingIdentityKey?: string | null
  productIdentityKey?: string | null
  storeCode?: string | null
  siteCode?: string | null
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  sku?: string | null
  primarySku?: string | null
}) {
  return row.advertisingIdentityKey || row.productIdentityKey || [
    row.storeCode || '',
    row.siteCode || '',
    partnerSkuOf(row) || `ADSKU:${row.adSkuCode || row.primaryAdSkuCode || row.sku || row.primarySku || 'NO_SKU'}`
  ].join('|')
}

export function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString('zh-CN')
}

export function formatMoney(value?: number | null) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatDecimal(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatRate(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${(Number(value || 0) * 100).toFixed(2)}%`
}
