import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  OfficialWarehouseFbnReportExportCreatePayload,
  OfficialWarehouseFbnReportExportCreateResult,
  OfficialWarehouseFbnReportExportListView,
  OfficialWarehouseFbnReportExportStatusPayload,
  OfficialWarehouseFbnReportExportStatusView,
  OfficialWarehouseFbnReportImportPayload,
  OfficialWarehouseFbnReportImportResult,
  OfficialWarehouseInboundStatisticsView,
  OfficialWarehouseInventorySyncPayload,
  OfficialWarehouseInventorySyncResult,
  OfficialWarehouseProductInboundHistoryView,
  OfficialWarehouseScheduledDeliveryAccuracyRematchPayload,
  OfficialWarehouseScheduledDeliveryAccuracyRematchResult,
  OfficialWarehouseStatisticsFilters,
  OfficialWarehouseStockCorrectionPayload,
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'

export async function loadOfficialWarehouseStockStatistics(filters: OfficialWarehouseStatisticsFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  appendParam(params, 'warehouseCode', filters.warehouseCode)
  appendParam(params, 'stockBucket', filters.stockBucket)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/warehouse/official-warehouse/stock-statistics${suffix}`)
  return parseApiResponse<OfficialWarehouseStockStatisticsView>(response, '读取官方仓库存统计失败')
}

export async function loadOfficialWarehouseInboundStatistics(filters: OfficialWarehouseStatisticsFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  appendParam(params, 'warehouseCode', filters.warehouseCode)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/warehouse/official-warehouse/inbound-statistics${suffix}`)
  return parseApiResponse<OfficialWarehouseInboundStatisticsView>(response, '读取官方仓入仓统计失败')
}

export async function loadOfficialWarehouseProductInboundHistory(filters: {
  storeCode: string
  siteCode: string
  partnerSku?: string
  productSiteOfferId?: string
}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  const productRef = filters.partnerSku?.trim() || filters.productSiteOfferId?.trim() || ''
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/products/${encodeURIComponent(productRef)}/inbound-history?${params.toString()}`
  )
  return parseApiResponse<OfficialWarehouseProductInboundHistoryView>(response, '读取商品入仓历史失败')
}

export async function correctOfficialWarehouseStock(payload: OfficialWarehouseStockCorrectionPayload) {
  const response = await apiFetch('/api/warehouse/official-warehouse/stock-corrections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return parseApiResponse<OfficialWarehouseStockStatisticsRow>(response, '订正官方仓库存失败')
}

export async function syncOfficialWarehouseInventory(payload: OfficialWarehouseInventorySyncPayload) {
  const response = await apiFetch('/api/warehouse/official-warehouse/stock-statistics/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return parseApiResponse<OfficialWarehouseInventorySyncResult>(response, '同步 FBN 库存失败')
}

export async function listOfficialWarehouseFbnReportExports(filters: OfficialWarehouseStatisticsFilters & { page?: number; perPage?: number }) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'page', filters.page)
  appendParam(params, 'perPage', filters.perPage)
  const response = await apiFetch(`/api/warehouse/official-warehouse/fbn-report-exports?${params.toString()}`)
  return parseApiResponse<OfficialWarehouseFbnReportExportListView>(response, '读取 FBN 报表列表失败')
}

export async function createOfficialWarehouseFbnReportExport(payload: OfficialWarehouseFbnReportExportCreatePayload) {
  const response = await apiFetch('/api/warehouse/official-warehouse/fbn-report-exports/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return parseApiResponse<OfficialWarehouseFbnReportExportCreateResult>(response, '创建 FBN 报表失败')
}

export async function loadOfficialWarehouseFbnReportExportStatus(payload: OfficialWarehouseFbnReportExportStatusPayload) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', payload.storeCode)
  appendParam(params, 'siteCode', payload.siteCode)
  appendParam(params, 'log', payload.log)
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/fbn-report-exports/${encodeURIComponent(payload.exportCode)}/status?${params.toString()}`
  )
  return parseApiResponse<OfficialWarehouseFbnReportExportStatusView>(response, '读取 FBN 报表状态失败')
}

export async function importOfficialWarehouseFbnReceivedReport(payload: OfficialWarehouseFbnReportImportPayload) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/fbn-report-exports/${encodeURIComponent(payload.exportCode)}/import-fbn-received`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeCode: payload.storeCode, siteCode: payload.siteCode, logStatus: payload.logStatus ?? true })
    }
  )
  return parseApiResponse<OfficialWarehouseFbnReportImportResult>(response, '导入行级入仓报表失败')
}

export async function importOfficialWarehouseScheduledDeliveryAccuracyReport(payload: OfficialWarehouseFbnReportImportPayload) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/fbn-report-exports/${encodeURIComponent(payload.exportCode)}/import-scheduled-delivery-accuracy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeCode: payload.storeCode, siteCode: payload.siteCode, logStatus: payload.logStatus ?? true })
    }
  )
  return parseApiResponse<OfficialWarehouseFbnReportImportResult>(response, '导入预约到货准确率报表失败')
}

export async function rematchOfficialWarehouseScheduledDeliveryAccuracy(payload: OfficialWarehouseScheduledDeliveryAccuracyRematchPayload) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/fbn-report-imports/${encodeURIComponent(payload.importId)}/rematch-scheduled-delivery-accuracy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeCode: payload.storeCode, siteCode: payload.siteCode })
    }
  )
  return parseApiResponse<OfficialWarehouseScheduledDeliveryAccuracyRematchResult>(response, '重匹配预约到货准确率报表失败')
}

function appendParam(params: URLSearchParams, key: string, value?: string | number | boolean) {
  if (typeof value === 'number' || typeof value === 'boolean') {
    params.set(key, String(value))
    return
  }
  if (value?.trim()) {
    params.set(key, value.trim())
  }
}
