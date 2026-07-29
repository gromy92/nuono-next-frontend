import { message } from 'antd'
import { useState } from 'react'
import {
  adjustAli1688HistoricalOrderAssignment,
  loadAli1688HistoricalOrderItemAssignments,
  revokeAli1688HistoricalOrderAssignment
} from '../api'
import type {
  Ali1688HistoricalOrderAssignmentRecord,
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderQuery
} from '../types'
import { buildAssignmentRecordQuantityState } from '../model/assignmentTargets'

export function useAli1688AssignmentRecords({
  selectedDetailItem,
  query,
  reloadWorkbench
}: {
  selectedDetailItem?: Ali1688HistoricalOrderItem
  query: Ali1688HistoricalOrderQuery
  reloadWorkbench: (query: Ali1688HistoricalOrderQuery) => Promise<unknown>
}) {
  const [assignmentRecords, setAssignmentRecords] = useState<
    Ali1688HistoricalOrderAssignmentRecord[]
  >([])
  const [assignmentRecordsLoading, setAssignmentRecordsLoading] =
    useState(false)
  const [assignmentRecordQuantities, setAssignmentRecordQuantities] = useState<
    Record<string, number | null>
  >({})
  const [assignmentRecordUpdatingId, setAssignmentRecordUpdatingId] =
    useState<number>()

  async function loadAssignmentRecords(itemId: string) {
    setAssignmentRecordsLoading(true)
    try {
      const records = await loadAli1688HistoricalOrderItemAssignments(itemId)
      setAssignmentRecords(records)
      setAssignmentRecordQuantities(
        buildAssignmentRecordQuantityState(records)
      )
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '读取 1688 分配记录失败'
      )
      setAssignmentRecords([])
      setAssignmentRecordQuantities({})
    } finally {
      setAssignmentRecordsLoading(false)
    }
  }

  function updateAssignmentRecordQuantity(
    assignmentId: number | undefined,
    value: number | string | null
  ) {
    if (!assignmentId) return
    const parsed = typeof value === 'string' ? Number(value) : value
    setAssignmentRecordQuantities((current) => ({
      ...current,
      [assignmentId]:
        typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
    }))
  }

  async function submitAssignmentRecordAdjustment(
    record: Ali1688HistoricalOrderAssignmentRecord
  ) {
    if (!record.assignmentId || !selectedDetailItem?.id) return
    const quantity = assignmentRecordQuantities[record.assignmentId]
    if (!quantity || quantity <= 0) {
      message.error('请填写调整后的分配数量')
      return
    }
    setAssignmentRecordUpdatingId(record.assignmentId)
    try {
      await adjustAli1688HistoricalOrderAssignment(record.assignmentId, {
        quantity
      })
      message.success('分配记录已调整')
      await loadAssignmentRecords(selectedDetailItem.id)
      await reloadWorkbench(query)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '调整 1688 分配记录失败'
      )
    } finally {
      setAssignmentRecordUpdatingId(undefined)
    }
  }

  async function submitAssignmentRecordRevoke(
    record: Ali1688HistoricalOrderAssignmentRecord
  ) {
    if (!record.assignmentId || !selectedDetailItem?.id) return
    setAssignmentRecordUpdatingId(record.assignmentId)
    try {
      await revokeAli1688HistoricalOrderAssignment(record.assignmentId)
      message.success('分配记录已撤回')
      await loadAssignmentRecords(selectedDetailItem.id)
      await reloadWorkbench(query)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '撤回 1688 分配记录失败'
      )
    } finally {
      setAssignmentRecordUpdatingId(undefined)
    }
  }

  function resetAssignmentRecords() {
    setAssignmentRecords([])
    setAssignmentRecordQuantities({})
    setAssignmentRecordUpdatingId(undefined)
  }

  return {
    assignmentRecords,
    assignmentRecordsLoading,
    assignmentRecordQuantities,
    assignmentRecordUpdatingId,
    loadAssignmentRecords,
    updateAssignmentRecordQuantity,
    submitAssignmentRecordAdjustment,
    submitAssignmentRecordRevoke,
    resetAssignmentRecords
  }
}
