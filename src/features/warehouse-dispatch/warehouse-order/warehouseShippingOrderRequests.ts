import type {
  CreateShippingOrderPayload,
  ShippingOrder,
  ShippingOrderSubmitResult,
  UpdateShippingOrderLineQuotePayload,
  UpdateShippingOrderLineQuotesPayload,
  UpdateShippingOrderLineYiteMaterialPayload,
  UpdateShippingOrderPayload
} from './warehouseShippingOrderTypes'

export type UpdateShippingOrderLineEligibilityPayload = {
  forwarderCode: string
  eligibilityStatus: 'SUPPORTED' | 'INQUIRY_REQUIRED' | 'UNSUPPORTED'
}

export type ReassignShippingOrderLinesPayload = {
  lineIds: string[]
  targetSegmentId?: string
  targetTransportMode: 'AIR' | 'SEA'
}
import {
  apiFetch,
  apiRequestJson,
  readApiErrorMessage
} from '../../../shared/api'
import type {
  OrderLogisticsQuoteExportSelection,
  OrderLogisticsQuoteImportResult,
  OrderLogisticsQuoteOptions
} from '../../logistics-quote/orderLogisticsQuoteTypes'

function getWarehouseOrderJson<TResponse>(url: string, fallback: string) {
  return apiRequestJson<TResponse>(url, undefined, fallback)
}

function sendWarehouseOrderJson<TResponse>(
  url: string,
  method: 'POST' | 'PUT',
  body: unknown,
  fallback: string
) {
  return apiRequestJson<TResponse>(
    url,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    fallback
  )
}

async function downloadWarehouseOrderFile(url: string, fallback: string, defaultFilename: string) {
  const response = await apiFetch(url)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback))
  }
  return {
    blob: await response.blob(),
    filename: readDownloadFilename(response.headers.get('content-disposition')) || defaultFilename
  }
}

function uploadWarehouseOrderForm<TResponse>(url: string, formData: FormData, fallback: string) {
  return apiRequestJson<TResponse>(url, { method: 'POST', body: formData }, fallback)
}

function readDownloadFilename(contentDisposition: string | null) {
  if (!contentDisposition) return undefined
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  }
  return /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1]
}

export function loadShippingOrders(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getWarehouseOrderJson<ShippingOrder[]>(`/api/procurement/purchase-orders/shipping-orders${suffix}`, '读取仓库单失败')
}

export function loadAssignedShippingPurchaseOrderIds() {
  return getWarehouseOrderJson<string[]>(
    '/api/procurement/purchase-orders/shipping-orders/assigned-purchase-order-ids',
    '读取仓库单占用失败'
  )
}

export function loadShippingOrder(shippingOrderId: string) {
  return getWarehouseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}`,
    '读取仓库单失败'
  )
}

export function createShippingOrder(payload: CreateShippingOrderPayload) {
  return sendWarehouseOrderJson<ShippingOrder>(
    '/api/procurement/purchase-orders/shipping-orders',
    'POST',
    payload,
    '创建仓库单失败'
  )
}

export function updateShippingOrder(shippingOrderId: string, payload: UpdateShippingOrderPayload) {
  return sendWarehouseOrderJson<ShippingOrder>(
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
  return sendWarehouseOrderJson<ShippingOrder>(
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
  return sendWarehouseOrderJson<ShippingOrder>(
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
  return sendWarehouseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/quotes`,
    'PUT',
    payload,
    '批量保存商品报价失败'
  )
}

export function updateShippingOrderLineEligibility(
  shippingOrderId: string,
  lineId: string,
  payload: UpdateShippingOrderLineEligibilityPayload
) {
  return sendWarehouseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/${encodeURIComponent(lineId)}/eligibility`,
    'PUT',
    payload,
    '保存承运状态失败'
  )
}

export function reassignShippingOrderLines(
  shippingOrderId: string,
  payload: ReassignShippingOrderLinesPayload
) {
  return sendWarehouseOrderJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/reassign`,
    'POST',
    payload,
    '调整运输方案失败'
  )
}

export function loadShippingOrderLogisticsQuoteOptions(shippingOrderId: string) {
  return loadShippingOrderLogisticsQuoteOptionsForScope(shippingOrderId)
}

export function loadShippingOrderLogisticsQuoteOptionsForScope(shippingOrderId: string, segmentIds?: string[]) {
  const params = new URLSearchParams()
  for (const segmentId of segmentIds || []) params.append('segmentIds', segmentId)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getWarehouseOrderJson<OrderLogisticsQuoteOptions>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-options${suffix}`,
    '读取可导出货代渠道失败'
  )
}

export function exportShippingOrderLogisticsQuoteReport(
  shippingOrderId: string,
  selection: OrderLogisticsQuoteExportSelection & { segmentIds?: string[]; missingOnly?: boolean }
) {
  const params = new URLSearchParams({
    forwarderCode: selection.forwarderCode,
    routeCode: selection.routeCode
  })
  for (const segmentId of selection.segmentIds || []) params.append('segmentIds', segmentId)
  if (selection.missingOnly) params.set('missingOnly', 'true')
  return downloadWarehouseOrderFile(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-report?${params.toString()}`,
    '导出物流报价表失败',
    '物流报价确认表.xls'
  )
}

export function importShippingOrderLogisticsQuoteReport(shippingOrderId: string, file: File, segmentIds?: string[]) {
  const formData = new FormData()
  formData.append('file', file)
  for (const segmentId of segmentIds || []) formData.append('segmentIds', segmentId)
  return uploadWarehouseOrderForm<OrderLogisticsQuoteImportResult>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-report/import`,
    formData,
    '回传物流报价表失败'
  )
}

export function submitShippingOrder(shippingOrderId: string) {
  return sendWarehouseOrderJson<ShippingOrderSubmitResult>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/submit-shipping`,
    'POST',
    {},
    '提交发货失败'
  )
}
