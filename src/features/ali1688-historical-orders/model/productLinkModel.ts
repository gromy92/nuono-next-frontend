import { loadAli1688HistoricalOrderDetail } from '../api'
import type {
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderProductLinkCandidate,
  Ali1688HistoricalOrderWorkbench
} from '../types'
import type { ProductLineRow, ProductLinkStatusFilter } from './pageTypes'
import { buildProductLineRows } from './productLineRows'
import { compactJoin } from '../presentation/orderText'

export function findAssignedRowsAfterAssignment(
  workbench: Ali1688HistoricalOrderWorkbench,
  sourceRows: ProductLineRow[]
) {
  const sourceItemIds = new Set(
    sourceRows
      .map((row) => row.item?.id)
      .filter((itemId): itemId is string => Boolean(itemId))
  )
  if (!sourceItemIds.size) {
    return []
  }
  return buildProductLineRows(workbench.orders || [])
    .filter((row) => sourceItemIds.has(row.item?.id || '') && Boolean(row.item?.assignmentId))
}

export async function loadAssignedRowsAfterAssignment(
  workbench: Ali1688HistoricalOrderWorkbench,
  sourceRows: ProductLineRow[]
) {
  const currentPageRows = findAssignedRowsAfterAssignment(workbench, sourceRows)
  const sourceItemIds = new Set(
    sourceRows
      .map((row) => row.item?.id)
      .filter((itemId): itemId is string => Boolean(itemId))
  )
  if (!sourceItemIds.size) {
    return currentPageRows
  }
  const resolvedItemIds = new Set(currentPageRows.map((row) => row.item?.id).filter(Boolean))
  if (resolvedItemIds.size >= sourceItemIds.size) {
    return currentPageRows
  }
  const orderIds = Array.from(new Set(
    sourceRows
      .map((row) => row.order.id)
      .filter((orderId): orderId is string => Boolean(orderId))
  ))
  if (!orderIds.length) {
    return currentPageRows
  }
  const detailResults = await Promise.allSettled(
    orderIds.map((orderId) => loadAli1688HistoricalOrderDetail(orderId))
  )
  const detailRows = detailResults
    .flatMap((result) => result.status === 'fulfilled' ? buildProductLineRows([result.value]) : [])
    .filter((row) => sourceItemIds.has(row.item?.id || '') && Boolean(row.item?.assignmentId))

  const mergedRows = [...currentPageRows]
  const seen = new Set(mergedRows.map(productLinkRowIdentity))
  detailRows.forEach((row) => {
    const key = productLinkRowIdentity(row)
    if (!seen.has(key)) {
      seen.add(key)
      mergedRows.push(row)
    }
  })
  return mergedRows
}

export function productLinkRowIdentity(row: ProductLineRow) {
  return [
    row.item?.id || row.lineKey,
    row.item?.assignmentId || '',
    row.item?.assignmentTargetStoreCode || '',
    row.item?.assignmentTargetSiteCode || ''
  ].join(':')
}

export function canRoleMutateProductLinks(roleName?: string) {
  const normalizedRoleName = roleName?.trim()
  if (!normalizedRoleName) {
    return true
  }
  return ['老板', '运营主管', '运营管理', '运营'].includes(normalizedRoleName)
}

export function productLinkTargetLabel(item?: Ali1688HistoricalOrderItem) {
  if (!item?.assignmentTargetStoreCode) {
    return undefined
  }
  const siteCode = item.assignmentTargetSiteCode && item.assignmentTargetSiteCode !== '*'
    ? item.assignmentTargetSiteCode
    : undefined
  return compactJoin([item.assignmentTargetStoreCode, siteCode], ' · ')
}

export function filterProductLinkCandidates(products: Ali1688HistoricalOrderProductLinkCandidate[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  return products.filter((product) => {
    if (!normalizedKeyword) {
      return true
    }
    return [
      product.skuParent,
      product.partnerSku,
      product.pskuCode,
      product.offerCode,
      product.productTitle
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword)
  })
}

export function productLinkEmptyText(linkStatus: ProductLinkStatusFilter) {
  if (linkStatus === 'linked') {
    return '当前筛选下没有已关联商品'
  }
  if (linkStatus === 'unlinked') {
    return '当前筛选下没有未关联商品'
  }
  return '当前店铺暂无可关联商品'
}
