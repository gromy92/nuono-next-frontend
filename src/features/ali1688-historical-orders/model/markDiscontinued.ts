import {
  assignAli1688HistoricalOrderLines,
  revokeAli1688HistoricalOrderAssignment
} from '../api'
import type { ProductLineRow } from './pageTypes'
import {
  canMarkDiscontinuedProductLine
} from './productLineEligibility'
import { assignmentMaxQuantity } from './assignmentQuantities'

export async function markAli1688RowsDiscontinued(
  sourceRows: ProductLineRow[]
) {
  const rows = sourceRows.filter(canMarkDiscontinuedProductLine)
  const assignmentIds = Array.from(
    new Set(
      rows
        .map((row) => row.item?.assignmentId)
        .filter((id): id is number => Boolean(id))
    )
  )
  const targetGroups = new Map<
    string,
    {
      targetStoreCode: string
      targetSiteCode?: string
      lines: { itemId: string; quantity: number }[]
    }
  >()
  rows.forEach((row) => {
    const itemId = row.item?.id
    const targetStoreCode = row.item?.assignmentTargetStoreCode?.trim()
    const targetSiteCode = row.item?.assignmentTargetSiteCode?.trim()
    const quantity =
      row.item?.assignedQuantity ??
      row.item?.quantity ??
      assignmentMaxQuantity(row)
    if (!itemId || !targetStoreCode || !quantity || quantity <= 0) return
    const key = `${targetStoreCode}::${targetSiteCode || ''}`
    const group = targetGroups.get(key) || {
      targetStoreCode,
      targetSiteCode:
        targetSiteCode && targetSiteCode !== '*' ? targetSiteCode : undefined,
      lines: []
    }
    group.lines.push({ itemId, quantity })
    targetGroups.set(key, group)
  })
  if (!assignmentIds.length || !targetGroups.size) return 0
  for (const assignmentId of assignmentIds) {
    await revokeAli1688HistoricalOrderAssignment(assignmentId)
  }
  for (const group of targetGroups.values()) {
    await assignAli1688HistoricalOrderLines({
      targetType: 'DISCONTINUED',
      targetStoreCode: group.targetStoreCode,
      targetSiteCode: group.targetSiteCode,
      lines: group.lines
    })
  }
  return rows.length
}
