import type {
  OfficialWarehouseApiProblem,
  OfficialWarehouseMissingBatch,
  OfficialWarehouseProductCandidate,
  OfficialWarehouseShippingBatchCandidate
} from './api'

export const PRODUCT_IMAGE_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2284%22 height=%2284%22 viewBox=%220 0 84 84%22%3E%3Crect width=%2284%22 height=%2284%22 rx=%2210%22 fill=%22%23f8fafc%22/%3E%3Cpath d=%22M18 58h48L51 39 40 51l-7-8-15 15z%22 fill=%22%23cbd5e1%22/%3E%3Ccircle cx=%2231%22 cy=%2230%22 r=%226%22 fill=%22%23cbd5e1%22/%3E%3C/svg%3E'

export function toNumber(value?: string | number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function formatDimension(row: Pick<OfficialWarehouseProductCandidate, 'productLengthCm' | 'productWidthCm' | 'productHeightCm'>) {
  if (!row.productLengthCm || !row.productWidthCm || !row.productHeightCm) {
    return '-'
  }
  return `${row.productLengthCm} x ${row.productWidthCm} x ${row.productHeightCm} cm`
}

export function displayPsku(row: Pick<OfficialWarehouseProductCandidate, 'partnerSku' | 'skuParent' | 'childSku'>) {
  return row.partnerSku || row.skuParent || row.childSku || '-'
}

export function officialWarehouseCandidateKey(row: OfficialWarehouseProductCandidate) {
  const store = row.storeCode?.trim() || ''
  const site = row.siteCode?.trim() || ''
  const partnerSku = row.partnerSku?.trim() || ''
  if (store && site && partnerSku) {
    return `${store}::${site}::psku:${partnerSku}`
  }
  return `legacy-row:${row.productVariantId || row.productSiteOfferId || row.noonSku || row.pskuCode}`
}

export function missingBatchesFromProblem(problem?: OfficialWarehouseApiProblem): OfficialWarehouseMissingBatch[] {
  const value = problem?.details?.missingBatches
  return Array.isArray(value) ? value as OfficialWarehouseMissingBatch[] : []
}

export function formatCubicFeet(value?: number) {
  if (value == null || Number.isNaN(Number(value))) {
    return '-'
  }
  return `${Number(value).toFixed(5).replace(/\.?0+$/, '')} ft³`
}

export function shippingBatchStatusText(status?: string) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'shipped') return '已出库'
  if (normalized === 'in_transit') return '运输中'
  if (normalized === 'customs_clearance') return '清关中'
  if (normalized === 'delivering') return '派送中'
  if (normalized === 'warehouse_received') return '已到海外仓'
  if (normalized === 'completed') return '已完成'
  if (normalized === 'cancelled') return '已取消'
  if (normalized === 'departed_origin') return '已离港'
  if (normalized === 'arrived_port') return '已到港'
  if (normalized === 'customs_released') return '已放行'
  const legacy = (status || '').toUpperCase()
  if (legacy === 'OUTBOUND_CREATED') return '已出库'
  if (legacy === 'OPTION_SELECTED') return '已选方案'
  return status || '-'
}

export function shippingBatchOptionText(row: OfficialWarehouseShippingBatchCandidate) {
  const remainingQuantity = Number(row.remainingQuantity ?? row.storeSiteQuantity ?? 0).toLocaleString()
  const reusableQuantity = Number(row.storeSiteQuantity ?? row.totalQuantity ?? 0).toLocaleString()
  const linkedQuantity = Number(row.linkedQuantity || 0)
  const scheduledAppointmentQuantity = Number(row.scheduledAppointmentQuantity || 0)
  const appointedQuantity = row.alreadyAppointed ? Math.max(scheduledAppointmentQuantity, 0) : 0
  const asnOnlyQuantity = row.batchUsedByAsn ? Math.max(linkedQuantity - appointedQuantity, 0) : 0
  const skuCount = Number(row.skuCount || 0).toLocaleString()
  const poCount = Number(row.purchaseOrderCount || 0).toLocaleString()
  const batchNo = shippingBatchDisplayNo(row)
  const forwarder = row.forwarderName ? ` · ${row.forwarderName}` : ''
  const transport = row.transportMode ? ` · ${row.transportMode === 'AIR' ? '空运' : row.transportMode === 'SEA' ? '海运' : row.transportMode}` : ''
  const purchaseText = poCount === '0' ? '' : ` · ${poCount} PO`
  const usageParts = [
    row.alreadyAppointed ? `已约仓 ${Number(appointedQuantity || linkedQuantity || 0).toLocaleString()}件` : '',
    row.batchUsedByAsn && asnOnlyQuantity > 0 ? `已建ASN ${asnOnlyQuantity.toLocaleString()}件` : ''
  ].filter(Boolean)
  const fallbackUsageText = row.batchUsageLabel && row.batchUsageLabel !== '可约仓' ? ` · ${row.batchUsageLabel}` : ''
  const appointmentText = usageParts.length ? ` · ${usageParts.join(' · ')}` : fallbackUsageText
  const availabilityText = row.alreadyAppointed ? `可再次约仓 ${reusableQuantity}件` : `待约仓 ${remainingQuantity}件`
  return `${batchNo}${forwarder}${transport} · ${shippingBatchStatusText(row.latestNodeStatus || row.status)}${appointmentText} · ${availabilityText} · ${skuCount} SKU${purchaseText}`
}

export function shippingBatchDisplayNo(row: OfficialWarehouseShippingBatchCandidate) {
  return row.batchNo || row.trackingNo || row.externalShipmentNo || row.id
}
