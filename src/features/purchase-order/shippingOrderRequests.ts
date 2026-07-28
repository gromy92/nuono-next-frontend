import type {
  CreateShippingOrderPayload,
  LogisticsBill,
  PurchaseOrderLogisticsQuoteExportSelection,
  PurchaseOrderLogisticsQuoteImportResult,
  PurchaseOrderLogisticsQuoteOptions,
  ShippingOrder,
  ShippingOrderSubmitResult,
  UpdateShippingOrderLineQuotePayload,
  UpdateShippingOrderLineQuotesPayload,
  UpdateShippingOrderLineYiteMaterialPayload,
  UpdateShippingOrderPayload
} from './types'
import {
  downloadPurchaseOrderFile,
  getPurchaseOrderJson,
  sendPurchaseOrderJson,
  uploadPurchaseOrderForm
} from './purchaseOrderApiClient'

export function loadShippingOrders(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getPurchaseOrderJson<ShippingOrder[]>(`/api/procurement/purchase-orders/shipping-orders${suffix}`, '读取仓库单失败')
}

export function loadAssignedShippingPurchaseOrderIds() {
  return getPurchaseOrderJson<string[]>(
    '/api/procurement/purchase-orders/shipping-orders/assigned-purchase-order-ids',
    '读取仓库单占用失败'
  )
}

export function loadShippingOrder(shippingOrderId: string) {
  return getPurchaseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}`,
    '读取仓库单失败'
  )
}

export function createShippingOrder(payload: CreateShippingOrderPayload) {
  return sendPurchaseOrderJson<ShippingOrder>(
    '/api/procurement/purchase-orders/shipping-orders',
    'POST',
    payload,
    '创建仓库单失败'
  )
}

export function updateShippingOrder(shippingOrderId: string, payload: UpdateShippingOrderPayload) {
  return sendPurchaseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}`,
    'PUT',
    payload,
    '保存仓库单失败'
  )
}

export function updateShippingOrderLineYiteMaterial(
  shippingOrderId: string,
  lineId: string,
  payload: UpdateShippingOrderLineYiteMaterialPayload
) {
  return sendPurchaseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/${encodeURIComponent(lineId)}/yite-material`,
    'PUT',
    payload,
    '保存义特材质失败'
  )
}

export function updateShippingOrderLineQuote(
  shippingOrderId: string,
  lineId: string,
  payload: UpdateShippingOrderLineQuotePayload
) {
  return sendPurchaseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/${encodeURIComponent(lineId)}/quote`,
    'PUT',
    payload,
    '保存商品报价失败'
  )
}

export function updateShippingOrderLineQuotes(
  shippingOrderId: string,
  payload: UpdateShippingOrderLineQuotesPayload
) {
  return sendPurchaseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/quotes`,
    'PUT',
    payload,
    '批量保存商品报价失败'
  )
}

export function loadShippingOrderLogisticsQuoteOptions(shippingOrderId: string) {
  return loadShippingOrderLogisticsQuoteOptionsForScope(shippingOrderId)
}

export function loadShippingOrderLogisticsQuoteOptionsForScope(shippingOrderId: string, segmentIds?: string[]) {
  const params = new URLSearchParams()
  for (const segmentId of segmentIds || []) params.append('segmentIds', segmentId)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getPurchaseOrderJson<PurchaseOrderLogisticsQuoteOptions>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-options${suffix}`,
    '读取可导出货代渠道失败'
  )
}

export function exportShippingOrderLogisticsQuoteReport(
  shippingOrderId: string,
  selection: PurchaseOrderLogisticsQuoteExportSelection & { segmentIds?: string[]; missingOnly?: boolean }
) {
  const params = new URLSearchParams({
    forwarderCode: selection.forwarderCode,
    routeCode: selection.routeCode
  })
  for (const segmentId of selection.segmentIds || []) params.append('segmentIds', segmentId)
  if (selection.missingOnly) params.set('missingOnly', 'true')
  return downloadPurchaseOrderFile(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-report?${params.toString()}`,
    '导出物流报价表失败',
    '物流报价确认表.xls'
  )
}

export function importShippingOrderLogisticsQuoteReport(shippingOrderId: string, file: File, segmentIds?: string[]) {
  const formData = new FormData()
  formData.append('file', file)
  for (const segmentId of segmentIds || []) formData.append('segmentIds', segmentId)
  return uploadPurchaseOrderForm<PurchaseOrderLogisticsQuoteImportResult>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-report/import`,
    formData,
    '回传物流报价表失败'
  )
}

export function submitShippingOrder(shippingOrderId: string) {
  return sendPurchaseOrderJson<ShippingOrderSubmitResult>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/submit-shipping`,
    'POST',
    {},
    '提交发货失败'
  )
}

export function loadLogisticsBills(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getPurchaseOrderJson<LogisticsBill[]>(`/api/procurement/purchase-orders/logistics-bills${suffix}`, '读取物流账单失败')
}

export function loadLogisticsBill(expectedBillId: string) {
  return getPurchaseOrderJson<LogisticsBill>(
    `/api/procurement/purchase-orders/logistics-bills/${encodeURIComponent(expectedBillId)}`,
    '读取物流账单失败'
  )
}
