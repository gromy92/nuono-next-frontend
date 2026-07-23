import type { IssuedShippingBatch } from './types'
import { getFile, getJson, sendJson } from './apiClient'
import type {
  ApiDispatchPlan,
  ApiPurchaseReceiptOrder,
  ApiReadyItem,
  ApiReadySource,
  UpdateDispatchTargetPayload
} from './dispatchApiTypes'
import { mapDispatchPlan, mapReadyItem, mapReceiptOrder } from './dispatchApiMappers'
import type {
  ApiIssuedShippingBatch,
  ApiOutboundOrder,
  ApiPackingList,
  ApiShippingBatch
} from './shippingApiTypes'
import { mapOutboundOrder, mapPackingList, mapShippingBatch } from './shippingApiMappers'

export function loadWarehouseReceiptOrders(keyword?: string) {
  return getJson<ApiPurchaseReceiptOrder[]>(
    `/api/warehouse/dispatch/receipt-orders${keywordSuffix(keyword)}`,
    '读取采购收货失败'
  ).then((orders) => orders.map(mapReceiptOrder))
}

export function loadReadyShipmentItems(keyword?: string) {
  return getJson<ApiReadyItem[]>(
    `/api/warehouse/dispatch/ready-items${keywordSuffix(keyword)}`,
    '读取可发运商品失败'
  ).then((items) => items.map(mapReadyItem))
}

export function loadDispatchPlans() {
  return getJson<ApiDispatchPlan[]>('/api/warehouse/dispatch/dispatch-plans', '读取发货申请单失败')
    .then((plans) => plans.map(mapDispatchPlan))
}

export function updateReadyItemDispatchTarget(
  fulfillmentBalanceId: number,
  payload: UpdateDispatchTargetPayload
) {
  return sendJson<ApiReadySource>(
    `/api/warehouse/dispatch/ready-items/${encodeURIComponent(String(fulfillmentBalanceId))}/dispatch-target`,
    'PUT',
    payload,
    '保存库存计划失败'
  )
}

export function loadShippingBatches() {
  return getJson<ApiShippingBatch[]>('/api/warehouse/dispatch/shipping-batches', '读取发货单失败')
    .then((batches) => batches.map(mapShippingBatch))
}

export function loadShippingBatch(batchId: string) {
  return getJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}`,
    '读取发货单详情失败'
  ).then(mapShippingBatch)
}

export function downloadShippingBatchPackingList(
  batchId: string,
  selection: { forwarderCode: string; routeCode: string }
) {
  const params = new URLSearchParams(selection)
  return getFile(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/packing-list-export?${params}`,
    '导出装箱单失败',
    '装箱单.xlsx'
  )
}

export function selectShippingOption(batchId: string, optionId: string) {
  return sendJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/options/${encodeURIComponent(optionId)}/select`,
    'POST',
    {},
    '选择物流渠道失败'
  ).then(mapShippingBatch)
}

export function createOutboundOrders(batchId: string) {
  return sendJson<ApiOutboundOrder[]>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/outbound-orders`,
    'POST',
    {},
    '生成发货单失败'
  ).then((orders) => orders.map(mapOutboundOrder))
}

export function issueShippingBatch(batchId: string, optionId: string): Promise<IssuedShippingBatch> {
  return sendJson<ApiIssuedShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/issue`,
    'POST',
    { optionId },
    '下发仓库单失败'
  ).then((issued) => ({
    shippingBatch: mapShippingBatch(issued.shippingBatch || {}),
    outboundOrders: (issued.outboundOrders || []).map(mapOutboundOrder),
    packingLists: (issued.packingLists || []).map(mapPackingList)
  }))
}

export function loadOutboundOrders(batchId: string) {
  return getJson<ApiOutboundOrder[]>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/outbound-orders`,
    '读取发货单明细失败'
  ).then((orders) => orders.map(mapOutboundOrder))
}

export function createPackingList(outboundOrderId: string) {
  return sendJson<ApiPackingList>(
    `/api/warehouse/dispatch/outbound-orders/${encodeURIComponent(outboundOrderId)}/packing-lists`,
    'POST',
    {},
    '生成装箱单失败'
  ).then(mapPackingList)
}

export function loadPackingLists(outboundOrderId: string) {
  return getJson<ApiPackingList[]>(
    `/api/warehouse/dispatch/outbound-orders/${encodeURIComponent(outboundOrderId)}/packing-lists`,
    '读取装箱单失败'
  ).then((packingLists) => packingLists.map(mapPackingList))
}

function keywordSuffix(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  return params.toString() ? `?${params.toString()}` : ''
}
