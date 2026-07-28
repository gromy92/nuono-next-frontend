import { message } from 'antd'
import { useMemo, useState } from 'react'
import {
  assignAli1688HistoricalOrderLineBatches,
  assignAli1688HistoricalOrderLines
} from '../api'
import type {
  Ali1688HistoricalOrderAssignmentRequest,
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderWorkbench
} from '../types'
import type {
  AssignmentTargetOption,
  ProductLineRow
} from '../model/pageTypes'
import {
  isStorelessFullLineTarget,
  isStorelessFullLineTargetValue,
  selectedAssignmentTargets
} from '../model/assignmentTargets'
import {
  canBatchLinkProductLines,
  canLinkProductLine,
  isAssignableProductLine,
  isSelectableProductLine
} from '../model/productLineEligibility'
import {
  adjustAssignmentTargetQuantities,
  assignmentQuantityKey,
  buildAutoAssignmentTargetQuantities,
  canSubmitAssignment
} from '../model/assignmentQuantities'
import {
  loadAssignedRowsAfterAssignment
} from '../model/productLinkModel'

export function useAli1688AssignmentWorkflow({
  assignmentTargetOptions,
  canMutateProductLinks,
  query,
  reloadWorkbench,
  clearSelectedLines,
  initializeProductRows,
  continueProductRows,
  resetProductRows
}: {
  assignmentTargetOptions: AssignmentTargetOption[]
  canMutateProductLinks: boolean
  query: Ali1688HistoricalOrderQuery
  reloadWorkbench: (
    query: Ali1688HistoricalOrderQuery
  ) => Promise<Ali1688HistoricalOrderWorkbench>
  clearSelectedLines: () => void
  initializeProductRows: (rows: ProductLineRow[]) => Promise<void>
  continueProductRows: (
    rows: ProductLineRow[],
    fallbackRows: ProductLineRow[]
  ) => Promise<void>
  resetProductRows: () => void
}) {
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [actionProductLineRows, setActionProductLineRows] = useState<
    ProductLineRow[]
  >([])
  const [assignmentTargetValues, setAssignmentTargetValues] = useState<
    string[]
  >([])
  const [assignmentTargetQuantities, setAssignmentTargetQuantities] = useState<
    Record<string, number | null>
  >({})
  const [assigning, setAssigning] = useState(false)
  const selectedAssignmentTargetOptions = useMemo(
    () =>
      selectedAssignmentTargets(
        assignmentTargetOptions,
        assignmentTargetValues
      ),
    [assignmentTargetOptions, assignmentTargetValues]
  )
  const canAssignActionProductRows =
    actionProductLineRows.length > 0 &&
    actionProductLineRows.every(isAssignableProductLine)
  const canLinkActionProductRows =
    canBatchLinkProductLines(actionProductLineRows)
  const canContinueAssignmentToProductLink =
    canMutateProductLinks &&
    canSubmitAssignment(
      actionProductLineRows,
      assignmentTargetValues,
      assignmentTargetQuantities
    ) &&
    selectedAssignmentTargetOptions.length === 1 &&
    !isStorelessFullLineTarget(selectedAssignmentTargetOptions[0])

  async function openProductActionModalForRows(rows: ProductLineRow[]) {
    if (!rows.length) {
      message.warning('请选择要处理的货品行')
      return
    }
    if (!rows.every(isSelectableProductLine)) {
      message.warning('当前货品行没有可分配或可关联的内容')
      return
    }
    setActionProductLineRows(rows)
    setAssignmentTargetValues([])
    setAssignmentTargetQuantities({})
    setAssignmentModalOpen(true)
    await initializeProductRows(rows)
  }

  function updateAssignmentTargetValues(values: string[]) {
    const special = [...values]
      .reverse()
      .find(isStorelessFullLineTargetValue)
    const nextValues = special ? [special] : values
    setAssignmentTargetValues(nextValues)
    setAssignmentTargetQuantities(() =>
      nextValues.some(isStorelessFullLineTargetValue)
        ? {}
        : buildAutoAssignmentTargetQuantities(
            actionProductLineRows,
            nextValues
          )
    )
  }

  function toggleAssignmentTargetValue(value: string) {
    if (assignmentTargetValues.includes(value)) {
      updateAssignmentTargetValues(
        assignmentTargetValues.filter((target) => target !== value)
      )
      return
    }
    updateAssignmentTargetValues(
      isStorelessFullLineTargetValue(value)
        ? [value]
        : [
            ...assignmentTargetValues.filter(
              (target) => !isStorelessFullLineTargetValue(target)
            ),
            value
          ]
    )
  }

  function updateAssignmentTargetQuantity(
    targetValue: string,
    row: ProductLineRow,
    value: number | string | null
  ) {
    const parsed = typeof value === 'string' ? Number(value) : value
    setAssignmentTargetQuantities((current) =>
      adjustAssignmentTargetQuantities(
        current,
        assignmentTargetValues,
        targetValue,
        row,
        typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
      )
    )
  }

  async function submitAssignment(
    options: { keepOpenForLink?: boolean } = {}
  ) {
    const targets = selectedAssignmentTargets(
      assignmentTargetOptions,
      assignmentTargetValues
    )
    if (!targets.length) {
      message.error('请选择目标店铺')
      return
    }
    setAssigning(true)
    try {
      const requests: Ali1688HistoricalOrderAssignmentRequest[] = []
      if (targets.length === 1 && isStorelessFullLineTarget(targets[0])) {
        requests.push({
          targetType: targets[0].targetType,
          lines: actionProductLineRows.map((row) => ({
            itemId: row.item?.id || ''
          }))
        })
      } else {
        for (const target of targets) {
          const lines = actionProductLineRows
            .map((row) => ({
              itemId: row.item?.id || '',
              quantity:
                assignmentTargetQuantities[
                  assignmentQuantityKey(target.value, row)
                ] || 0
            }))
            .filter((line) => line.itemId && line.quantity > 0)
          if (lines.length) {
            requests.push({
              targetType: 'STORE_SITE',
              targetStoreCode: target.targetStoreCode,
              targetSiteCode: target.targetSiteCode,
              lines
            })
          }
        }
      }
      if (!requests.length) {
        message.error('请填写分配数量')
        return
      }
      const result =
        requests.length === 1
          ? await assignAli1688HistoricalOrderLines(requests[0])
          : await assignAli1688HistoricalOrderLineBatches({
              assignments: requests
            })
      message.success(`已分配 ${result.assignedLineCount} 条货品`)
      const nextWorkbench = await reloadWorkbench(query)
      if (options.keepOpenForLink) {
        const nextRows = await loadAssignedRowsAfterAssignment(
          nextWorkbench,
          actionProductLineRows
        )
        await continueProductRows(nextRows, actionProductLineRows)
        setAssignmentTargetValues([])
        setAssignmentTargetQuantities({})
      } else {
        closeActionModal()
        clearSelectedLines()
      }
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : '分配 1688 历史订单货品失败'
      )
    } finally {
      setAssigning(false)
    }
  }

  function closeActionModal() {
    setAssignmentModalOpen(false)
    setActionProductLineRows([])
    setAssignmentTargetValues([])
    setAssignmentTargetQuantities({})
    resetProductRows()
  }

  return {
    assignmentModalOpen, actionProductLineRows, assignmentTargetValues,
    assignmentTargetQuantities, assigning, selectedAssignmentTargetOptions,
    canAssignActionProductRows, canLinkActionProductRows,
    canContinueAssignmentToProductLink, openProductActionModalForRows,
    updateAssignmentTargetValues, toggleAssignmentTargetValue,
    updateAssignmentTargetQuantity, submitAssignment, closeActionModal
  }
}
