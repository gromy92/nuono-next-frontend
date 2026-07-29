import type {
  AddPurchaseOrderItemsPayload,
  CreatePurchaseOrderPayload,
  ProductOption,
  PurchaseOrder,
  PurchaseOrderAli1688HistoryView,
  PurchaseOrderLogisticsQuoteExportSelection,
  PurchaseOrderLogisticsQuoteImportResult,
  PurchaseOrderLogisticsQuoteOptions,
  PurchaseOrderShippingSubmitResult,
  UpdatePurchaseOrderItemPayload,
  UpdatePurchaseOrderItemSourcingRequirementPayload,
  UpdatePurchaseOrderPayload
} from './types'
import {
  downloadPurchaseOrderFile,
  getPurchaseOrderJson,
  sendPurchaseOrderJson,
  uploadPurchaseOrderForm
} from './purchaseOrderApiClient'

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
  if (request.storeCode) params.set('storeCode', request.storeCode)
  if (request.keyword?.trim()) params.set('keyword', request.keyword.trim())
  if (request.submittedOnly) params.set('submittedOnly', 'true')
  if (request.shippingAvailableOnly) params.set('shippingAvailableOnly', 'true')
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getPurchaseOrderJson<PurchaseOrder[]>(`/api/procurement/purchase-orders${suffix}`, '读取采购单失败')
}

export function loadPurchaseOrderAli1688History(orderId: string) {
  return getPurchaseOrderJson<PurchaseOrderAli1688HistoryView>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/ali1688-history`,
    '读取 1688 采购历史失败'
  )
}

export function createPurchaseOrder(payload: CreatePurchaseOrderPayload) {
  return sendPurchaseOrderJson<PurchaseOrder>('/api/procurement/purchase-orders', 'POST', payload, '创建采购单失败')
}

export function updatePurchaseOrder(orderId: string, payload: UpdatePurchaseOrderPayload) {
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}`,
    'PUT',
    payload,
    '保存采购单失败'
  )
}

export function submitPurchaseOrder(orderId: string) {
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/submit`,
    'POST',
    {},
    '封存采购单失败'
  )
}

export function deletePurchaseOrder(orderId: string) {
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}`,
    'DELETE',
    undefined,
    '删除采购单失败'
  )
}

export function deletePurchaseOrderItem(orderId: string, itemId: string) {
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
    'DELETE',
    undefined,
    '删除商品失败'
  )
}

export function addPurchaseOrderItems(orderId: string, payload: AddPurchaseOrderItemsPayload) {
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items`,
    'POST',
    payload,
    '添加商品失败'
  )
}

export function updatePurchaseOrderItem(orderId: string, itemId: string, payload: UpdatePurchaseOrderItemPayload) {
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
    'PUT',
    payload,
    '保存商品失败'
  )
}

export function loadPurchaseOrderLogisticsQuoteOptions(orderId: string) {
  return getPurchaseOrderJson<PurchaseOrderLogisticsQuoteOptions>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-quote-options`,
    '读取可导出货代渠道失败'
  )
}

export function exportPurchaseOrderLogisticsQuoteReport(
  orderId: string,
  selection: PurchaseOrderLogisticsQuoteExportSelection
) {
  const params = new URLSearchParams({
    forwarderCode: selection.forwarderCode,
    routeCode: selection.routeCode
  })
  return downloadPurchaseOrderFile(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-quote-report?${params.toString()}`,
    '导出物流报价表失败',
    '物流报价确认表.xls'
  )
}

export function importPurchaseOrderLogisticsQuoteReport(orderId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadPurchaseOrderForm<PurchaseOrderLogisticsQuoteImportResult>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/logistics-quote-report/import`,
    formData,
    '回传物流报价表失败'
  )
}

export function submitPurchaseOrderShipping(orderId: string) {
  return sendPurchaseOrderJson<PurchaseOrderShippingSubmitResult>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/submit-shipping`,
    'POST',
    {},
    '提交发货失败'
  )
}

export function collectPurchaseOrderItem(orderId: string, itemId: string) {
  return sendPurchaseOrderJson<PurchaseOrder>(
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
  return sendPurchaseOrderJson<PurchaseOrder>(
    `/api/procurement/purchase-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/sourcing-requirement`,
    'PUT',
    payload,
    '保存采集要求失败'
  )
}

export function loadProductOptions(request: ProductOptionsRequest) {
  const params = new URLSearchParams({ storeCode: request.storeCode })
  if (request.keyword?.trim()) params.set('keyword', request.keyword.trim())
  return getPurchaseOrderJson<ProductOption[]>(
    `/api/procurement/purchase-orders/product-options?${params.toString()}`,
    '读取商品档案失败'
  )
}
