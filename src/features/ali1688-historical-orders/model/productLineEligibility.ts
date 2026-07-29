import type { ProductLineRow } from './pageTypes'
import { assignmentMaxQuantity } from './assignmentQuantities'
import { isProductLinkBlockedAssignmentType } from './assignmentTargets'

export function isAssignableProductLine(row: ProductLineRow) {
  if (!row.item?.id) {
    return false
  }
  if (row.item.assignmentStatus === 'quantity_missing') {
    return false
  }
  return assignmentMaxQuantity(row) > 0
}

export function isSelectableProductLine(row: ProductLineRow) {
  return isAssignableProductLine(row) || canLinkProductLine(row)
}

export function canLinkProductLine(row: ProductLineRow) {
  return Boolean(
    row.item?.assignmentId &&
    row.item.assignmentStatus === 'assigned' &&
    !isProductLinkBlockedAssignmentType(row.item.assignmentTargetType) &&
    row.item.assignmentTargetStoreCode
  )
}

export function canMarkDiscontinuedProductLine(row: ProductLineRow) {
  return Boolean(
    row.item?.id &&
    row.item.assignmentId &&
    row.item.assignmentStatus === 'assigned' &&
    row.item.assignmentTargetStoreCode &&
    !isProductLinkBlockedAssignmentType(row.item.assignmentTargetType)
  )
}

export function canBatchLinkProductLines(rows: ProductLineRow[]) {
  if (!rows.length || !rows.every(canLinkProductLine)) {
    return false
  }
  const first = rows[0]?.item
  if (!first?.assignmentTargetStoreCode) {
    return false
  }
  return rows.every((row) =>
    row.item?.assignmentTargetStoreCode === first.assignmentTargetStoreCode &&
    (row.item?.assignmentTargetSiteCode || '') === (first.assignmentTargetSiteCode || '')
  )
}

export function canOpenProductLinkActionForRows(rows: ProductLineRow[]) {
  if (!rows.length) {
    return false
  }
  if (canBatchLinkProductLines(rows)) {
    return true
  }
  return rows.every(isAssignableProductLine)
}
