import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'
import type {
  AddPurchaseOrderItemsPayload,
  CreateShippingOrderPayload,
  CreatePurchaseOrderPayload,
  LogisticsBill,
  ProductOption,
  PurchaseOrderLogisticsQuoteExportSelection,
  PurchaseOrderAli1688HistoryView,
  PurchaseOrderLogisticsQuoteImportResult,
  PurchaseOrderLogisticsQuoteOptions,
  PurchaseOrderLogisticsPlan,
  PurchaseOrder,
  PurchaseOrderShippingSubmitResult,
  ShippingOrder,
  ShippingOrderSubmitResult,
  UpdateShippingOrderLineYiteMaterialPayload,
  UpdatePurchaseOrderItemPayload,
  UpdateShippingOrderPayload,
  UpdatePurchaseOrderPayload,
  UpdatePurchaseOrderItemSourcingRequirementPayload
} from './types'

type ListPurchaseOrdersRequest = {
  storeCode?: string
  keyword?: string
  submittedOnly?: boolean
  shippingAvailableOnly?: boolean
}

type ProductOptionsRequest = {
  storeCode: string
  keyword?: string
}

export function loadPurchaseOrders(request: ListPurchaseOrdersRequest) {
  const params = new URLSearchParams()
  if (request.storeCode) {
    params.set('storeCode', request.storeCode)
  }
  if (request.keyword?.trim()) {
    params.set('keyword', request.keyword.trim())
  }
  if (request.submittedOnly) {
    params.set('submittedOnly', 'true')
  }
  if (request.shippingAvailableOnly) {
    params.set('shippingAvailableOnly', 'true')
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<PurchaseOrder[]>(`/api/procurement/purchase-orders${suffix}`, '读取采购单失败')
}

export function loadPurchaseOrderAli1688History(orderId: string) {
  return getJson<PurchaseOrderAli1688HistoryView>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/ali1688-history`,
    '读取 1688 采购历史失败'
  )
}

export function createPurchaseOrder(payload: CreatePurchaseOrderPayload) {
  return sendJson<PurchaseOrder>('/api/procurement/purchase-orders', 'POST', payload, '创建采购单失败')
}

export function updatePurchaseOrder(orderId: string, payload: UpdatePurchaseOrderPayload) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}`,
    'PUT',
    payload,
    '保存采购单失败'
  )
}

export function submitPurchaseOrder(orderId: string) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/submit`,
    'POST',
    {},
    '提交采购单失败'
  )
}

export function deletePurchaseOrder(orderId: string) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}`,
    'DELETE',
    undefined,
    '删除采购单失败'
  )
}

export function deletePurchaseOrderItem(orderId: string, itemId: string) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
    'DELETE',
    undefined,
    '删除商品失败'
  )
}

export function addPurchaseOrderItems(orderId: string, payload: AddPurchaseOrderItemsPayload) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items`,
    'POST',
    payload,
    '添加商品失败'
  )
}

export function updatePurchaseOrderItem(orderId: string, itemId: string, payload: UpdatePurchaseOrderItemPayload) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
    'PUT',
    payload,
    '保存商品失败'
  )
}

export function collectPurchaseOrder(orderId: string) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/collect`,
    'POST',
    {},
    '发起整单采集失败'
  )
}

export function generatePurchaseOrderLogisticsPlan(orderId: string) {
  return sendJson<PurchaseOrderLogisticsPlan>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-plan`,
    'POST',
    {},
    '生成物流计划失败'
  )
}

export function previewPurchaseOrderLogisticsPlan(orderId: string) {
  return getJson<PurchaseOrderLogisticsPlan>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-plan/preview`,
    '物流计划预检失败'
  )
}

export function loadPurchaseOrderLogisticsQuoteOptions(orderId: string) {
  return getJson<PurchaseOrderLogisticsQuoteOptions>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-quote-options`,
    '读取可导出货代渠道失败'
  )
}

export async function exportPurchaseOrderLogisticsQuoteReport(
  orderId: string,
  selection: PurchaseOrderLogisticsQuoteExportSelection
) {
  const params = new URLSearchParams({
    forwarderCode: selection.forwarderCode,
    routeCode: selection.routeCode
  })
  const response = await apiFetch(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-quote-report?${params.toString()}`
  )
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '导出物流报价表失败'))
  }
  return {
    blob: await response.blob(),
    filename: readDownloadFilename(response.headers.get('content-disposition')) || '物流报价确认表.xls'
  }
}

export async function importPurchaseOrderLogisticsQuoteReport(orderId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return parseApiResponse<PurchaseOrderLogisticsQuoteImportResult>(
    await apiFetch(`/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-quote-report/import`, {
      method: 'POST',
      body: formData
    }),
    '回传物流报价表失败'
  )
}

export function submitPurchaseOrderShipping(orderId: string) {
  return sendJson<PurchaseOrderShippingSubmitResult>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/submit-shipping`,
    'POST',
    {},
    '提交发货失败'
  )
}

export function loadShippingOrders(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<ShippingOrder[]>(`/api/procurement/purchase-orders/shipping-orders${suffix}`, '读取发货单失败')
}

export function loadShippingOrder(shippingOrderId: string) {
  return getJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}`,
    '读取发货单失败'
  )
}

export function createShippingOrder(payload: CreateShippingOrderPayload) {
  return sendJson<ShippingOrder>(
    '/api/procurement/purchase-orders/shipping-orders',
    'POST',
    payload,
    '创建发货单失败'
  )
}

export function updateShippingOrder(shippingOrderId: string, payload: UpdateShippingOrderPayload) {
  return sendJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}`,
    'PUT',
    payload,
    '保存发货单失败'
  )
}

export function updateShippingOrderLineYiteMaterial(
  shippingOrderId: string,
  lineId: string,
  payload: UpdateShippingOrderLineYiteMaterialPayload
) {
  return sendJson<ShippingOrder>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/lines/${encodeURIComponent(lineId)}/yite-material`,
    'PUT',
    payload,
    '保存义特材质失败'
  )
}

export function loadShippingOrderLogisticsQuoteOptions(shippingOrderId: string) {
  return loadShippingOrderLogisticsQuoteOptionsForScope(shippingOrderId)
}

export function loadShippingOrderLogisticsQuoteOptionsForScope(shippingOrderId: string, segmentIds?: string[]) {
  const params = new URLSearchParams()
  for (const segmentId of segmentIds || []) {
    params.append('segmentIds', segmentId)
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<PurchaseOrderLogisticsQuoteOptions>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-options${suffix}`,
    '读取可导出货代渠道失败'
  )
}

export async function exportShippingOrderLogisticsQuoteReport(
  shippingOrderId: string,
  selection: PurchaseOrderLogisticsQuoteExportSelection & { segmentIds?: string[] }
) {
  const params = new URLSearchParams({
    forwarderCode: selection.forwarderCode,
    routeCode: selection.routeCode
  })
  for (const segmentId of selection.segmentIds || []) {
    params.append('segmentIds', segmentId)
  }
  const response = await apiFetch(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-report?${params.toString()}`
  )
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '导出物流报价表失败'))
  }
  return {
    blob: await response.blob(),
    filename: readDownloadFilename(response.headers.get('content-disposition')) || '物流报价确认表.xls'
  }
}

export async function importShippingOrderLogisticsQuoteReport(shippingOrderId: string, file: File, segmentIds?: string[]) {
  const formData = new FormData()
  formData.append('file', file)
  for (const segmentId of segmentIds || []) {
    formData.append('segmentIds', segmentId)
  }
  return parseApiResponse<PurchaseOrderLogisticsQuoteImportResult>(
    await apiFetch(`/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/logistics-quote-report/import`, {
      method: 'POST',
      body: formData
    }),
    '回传物流报价表失败'
  )
}

export function submitShippingOrder(shippingOrderId: string, segmentIds?: string[]) {
  return sendJson<ShippingOrderSubmitResult>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/submit-shipping`,
    'POST',
    { segmentIds: segmentIds || [] },
    '提交发货失败'
  )
}

export function generateShippingOrderExpectedBill(shippingOrderId: string, segmentIds?: string[]) {
  return sendJson<LogisticsBill>(
    `/api/procurement/purchase-orders/shipping-orders/${encodeURIComponent(shippingOrderId)}/expected-bill`,
    'POST',
    { segmentIds: segmentIds || [] },
    '生成预估账单失败'
  )
}

export function loadLogisticsBills(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<LogisticsBill[]>(`/api/procurement/purchase-orders/logistics-bills${suffix}`, '读取物流账单失败')
}

export function loadLogisticsBill(expectedBillId: string) {
  return getJson<LogisticsBill>(
    `/api/procurement/purchase-orders/logistics-bills/${encodeURIComponent(expectedBillId)}`,
    '读取物流账单失败'
  )
}

export function collectPurchaseOrderItem(orderId: string, itemId: string) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/collect`,
    'POST',
    {},
    '发起商品采集失败'
  )
}

export function updatePurchaseOrderItemSourcingRequirement(
  orderId: string,
  itemId: string,
  payload: UpdatePurchaseOrderItemSourcingRequirementPayload
) {
  return sendJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/sourcing-requirement`,
    'PUT',
    payload,
    '保存采集要求失败'
  )
}

export function loadProductOptions(request: ProductOptionsRequest) {
  const params = new URLSearchParams({ storeCode: request.storeCode })
  if (request.keyword?.trim()) {
    params.set('keyword', request.keyword.trim())
  }
  return getJson<ProductOption[]>(
    `/api/procurement/purchase-orders/product-options?${params.toString()}`,
    '读取商品档案失败'
  )
}

async function getJson<TResponse>(url: string, fallback: string) {
  return parseApiResponse<TResponse>(await apiFetch(url), fallback)
}

async function sendJson<TResponse>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  fallback: string
) {
  return parseApiResponse<TResponse>(
    await apiFetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
    fallback
  )
}

function readDownloadFilename(contentDisposition: string | null) {
  if (!contentDisposition) {
    return undefined
  }
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
