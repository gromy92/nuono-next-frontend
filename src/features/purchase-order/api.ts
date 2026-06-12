import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  AddPurchaseOrderItemsPayload,
  CreatePurchaseOrderPayload,
  ProductOption,
  PurchaseOrderAli1688HistoryView,
  PurchaseOrderLogisticsPlan,
  PurchaseOrder,
  UpdatePurchaseOrderItemPayload,
  UpdatePurchaseOrderPayload,
  UpdatePurchaseOrderItemSourcingRequirementPayload
} from './types'

type ListPurchaseOrdersRequest = {
  storeCode?: string
  keyword?: string
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
