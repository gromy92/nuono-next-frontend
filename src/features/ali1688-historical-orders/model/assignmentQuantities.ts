import {
  CONSUMABLE_ASSIGNMENT_VALUE,
  type ProductLineRow
} from './pageTypes'

export function assignmentMaxQuantity(row: ProductLineRow) {
  const remaining = row.item?.remainingQuantity
  if (remaining !== undefined && remaining !== null) {
    return Math.max(0, remaining)
  }
  return Math.max(0, row.item?.quantity ?? 0)
}

export function assignmentQuantityKey(targetValue: string, row: ProductLineRow) {
  return `${targetValue}::${row.lineKey}`
}

export function buildAutoAssignmentTargetQuantities(
  rows: ProductLineRow[],
  targetValues: string[]
) {
  if (!targetValues.length) {
    return {}
  }
  return rows.reduce<Record<string, number | null>>((next, row) => {
    const maxQuantity = assignmentMaxQuantity(row)
    targetValues.forEach((targetValue, index) => {
      const key = assignmentQuantityKey(targetValue, row)
      next[key] = autoDistributedAssignmentQuantity(maxQuantity, targetValues.length, index)
    })
    return keepAssignmentRowWithinLimit(next, targetValues, row)
  }, {})
}

export function autoDistributedAssignmentQuantity(maxQuantity: number, targetCount: number, targetIndex: number) {
  if (targetCount <= 1) {
    return maxQuantity
  }
  const baseQuantity = Math.floor(maxQuantity / targetCount)
  const remainder = maxQuantity % targetCount
  return baseQuantity + (targetIndex < remainder ? 1 : 0)
}

export function adjustAssignmentTargetQuantities(
  current: Record<string, number | null>,
  targetValues: string[],
  targetValue: string,
  row: ProductLineRow,
  value: number | null
) {
  const maxQuantity = assignmentMaxQuantity(row)
  const next = {
    ...current,
    [assignmentQuantityKey(targetValue, row)]: value === null ? null : Math.min(Math.max(0, value), maxQuantity)
  }
  return keepAssignmentRowWithinLimit(next, targetValues, row, targetValue)
}

export function keepAssignmentRowWithinLimit(
  quantities: Record<string, number | null>,
  targetValues: string[],
  row: ProductLineRow,
  changedTargetValue?: string
) {
  const maxQuantity = assignmentMaxQuantity(row)
  let overflow = assignmentRowTotalQuantity(quantities, targetValues, row) - maxQuantity
  if (overflow <= 0) {
    return quantities
  }
  const adjustableTargets = targetValues.filter((targetValue) => targetValue !== changedTargetValue).reverse()
  adjustableTargets.forEach((targetValue) => {
    if (overflow <= 0) {
      return
    }
    const key = assignmentQuantityKey(targetValue, row)
    const currentQuantity = quantities[key] || 0
    const reduction = Math.min(currentQuantity, overflow)
    quantities[key] = currentQuantity - reduction
    overflow -= reduction
  })
  return quantities
}

export function assignmentRowTotalQuantity(
  quantities: Record<string, number | null>,
  targetValues: string[],
  row: ProductLineRow
) {
  return targetValues.reduce((sum, targetValue) => {
    const quantity = quantities[assignmentQuantityKey(targetValue, row)]
    return sum + (typeof quantity === 'number' ? quantity : 0)
  }, 0)
}

export function canSubmitAssignment(
  rows: ProductLineRow[],
  targetValues: string[],
  targetQuantities: Record<string, number | null>
) {
  if (!targetValues.length || !rows.length) {
    return false
  }
  if (!rows.every((row) => Boolean(row.item?.id))) {
    return false
  }
  const hasStorelessFullLineTarget = targetValues.some(
    (targetValue) => targetValue === CONSUMABLE_ASSIGNMENT_VALUE
  )
  if (hasStorelessFullLineTarget) {
    return targetValues.length === 1 && rows.every((row) => assignmentMaxQuantity(row) > 0)
  }
  return rows.every((row) => {
    const maxQuantity = assignmentMaxQuantity(row)
    const totalQuantity = assignmentRowTotalQuantity(targetQuantities, targetValues, row)
    return (
      maxQuantity > 0 &&
      totalQuantity > 0 &&
      totalQuantity <= maxQuantity &&
      targetValues.every((targetValue) => {
        const quantity = targetQuantities[assignmentQuantityKey(targetValue, row)]
        return quantity === null || quantity === undefined || (typeof quantity === 'number' && quantity >= 0 && quantity <= maxQuantity)
      })
    )
  })
}
