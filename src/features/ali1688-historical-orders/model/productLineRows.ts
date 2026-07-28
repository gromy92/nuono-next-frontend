import type {
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderRow
} from '../types'
import type { ProductLineRow } from './pageTypes'
import { canLinkProductLine } from './productLineEligibility'
import { parseAssignmentTargetValue } from './assignmentTargets'
import { parseAssignmentBreakdownTargets } from '../presentation/orderText'

export function assignmentFilterQuery(
  assignmentFilter?: string
): Pick<Ali1688HistoricalOrderQuery, 'assignmentState' | 'assignmentTargetStoreCode' | 'assignmentTargetSiteCode'> {
  if (assignmentFilter === 'state:unassigned') {
    return { assignmentState: 'unassigned' }
  }
  if (assignmentFilter === 'state:consumable') {
    return { assignmentState: 'consumable' }
  }
  if (assignmentFilter === 'state:discontinued') {
    return { assignmentState: 'discontinued' }
  }
  if (assignmentFilter?.startsWith('target:')) {
    const target = parseAssignmentTargetValue(assignmentFilter.slice('target:'.length))
    return {
      assignmentTargetStoreCode: target.targetStoreCode || undefined,
      assignmentTargetSiteCode: target.targetSiteCode || undefined
    }
  }
  return {}
}

export function productLinkFilterQuery(
  productLinkFilter?: string
): Pick<Ali1688HistoricalOrderQuery, 'productLinkState'> {
  if (productLinkFilter === 'linked' || productLinkFilter === 'unlinked') {
    return { productLinkState: productLinkFilter }
  }
  return {}
}

export function filterProductLineRowsByAssignment(rows: ProductLineRow[], assignmentFilter?: string) {
  if (!assignmentFilter) {
    return rows
  }
  if (assignmentFilter === 'state:unassigned') {
    return rows.filter((row) => row.item?.assignmentStatus === 'unassigned')
  }
  if (assignmentFilter === 'state:consumable') {
    return rows.filter((row) =>
      parseAssignmentBreakdownTargets(row.item?.assignmentBreakdownText).some((entry) => entry.targetType === 'CONSUMABLE')
    )
  }
  if (assignmentFilter === 'state:discontinued') {
    return rows.filter((row) =>
      parseAssignmentBreakdownTargets(row.item?.assignmentBreakdownText).some((entry) => entry.targetType === 'DISCONTINUED')
    )
  }
  if (assignmentFilter.startsWith('target:')) {
    const target = parseAssignmentTargetValue(assignmentFilter.slice('target:'.length))
    if (!target.targetStoreCode) {
      return rows
    }
    return rows.filter((row) =>
      parseAssignmentBreakdownTargets(row.item?.assignmentBreakdownText).some((entry) =>
        entry.targetStoreCode === target.targetStoreCode &&
        (!target.targetSiteCode || entry.targetSiteCode === target.targetSiteCode)
      )
    )
  }
  return rows
}

export function filterProductLineRowsByProductLink(rows: ProductLineRow[], productLinkFilter?: string) {
  if (!productLinkFilter) {
    return rows
  }
  if (productLinkFilter === 'linked') {
    return rows.filter((row) => Boolean(row.item?.productLink?.skuParent))
  }
  if (productLinkFilter === 'unlinked') {
    return rows.filter((row) => canLinkProductLine(row) && !row.item?.productLink?.skuParent)
  }
  return rows
}

export function buildProductLineRows(orders: Ali1688HistoricalOrderRow[]): ProductLineRow[] {
  return orders.flatMap((order, orderIndex) => {
    if (!order.items?.length) {
      return [{
        lineKey: `${order.id || order.orderNo || 'order'}:${orderIndex}:empty`,
        order,
        lineNo: 1
      }]
    }
    return order.items.map((item, index) => ({
      lineKey: [
        order.id || order.orderNo || 'order',
        orderIndex,
        item.id || item.offerId || 'item',
        item.assignmentId || 'assignment',
        index,
        item.assignmentBreakdownText || item.assignmentStatus || 'raw',
        item.quantity ?? 'missing'
      ].join(':'),
      order,
      item,
      lineNo: index + 1
    }))
  })
}
