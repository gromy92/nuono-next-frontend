import { apiRequestJson } from '../../../shared/api'

export type WarehouseOrderPurchaseCandidate = {
  id: string
  orderNo: string
  title: string
  storeName: string
  storeCode: string
  createdAt: string
  items: Array<{
    partnerSku: string
    skuParent: string
    productTitle: string
    sourceTitle: string
    sourceTitleCn?: string
    totalQuantity: number
    allocations: Array<{ pskuCode?: string }>
  }>
}

export function loadWarehouseOrderPurchaseCandidates() {
  const params = new URLSearchParams({
    submittedOnly: 'true',
    shippingAvailableOnly: 'false'
  })
  return apiRequestJson<WarehouseOrderPurchaseCandidate[]>(
    `/api/procurement/purchase-orders?${params.toString()}`,
    undefined,
    '读取已提交采购单失败'
  )
}
