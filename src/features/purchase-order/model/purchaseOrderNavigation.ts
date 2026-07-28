import { withPublicBasePath } from '../../../runtimePaths'
import type { PurchaseOrder, PurchaseOrderItem } from '../types'

export function openPurchaseOrderTop5(item: PurchaseOrderItem, order: PurchaseOrder) {
  const params = new URLSearchParams(window.location.search)
  params.set('psku', item.partnerSku)
  params.set('purchaseOrderItemId', item.id)
  if (order.storeCode) {
    params.set('storeCode', order.storeCode)
  }
  window.location.href = withPublicBasePath(
    `/purchase/1688-collection?${params.toString()}#top5`
  )
}
