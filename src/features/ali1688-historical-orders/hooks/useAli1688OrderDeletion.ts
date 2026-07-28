import { message } from 'antd'
import { useState } from 'react'
import { deleteAli1688HistoricalOrder } from '../api'
import type {
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderRow
} from '../types'

export function useAli1688OrderDeletion({
  query,
  reloadWorkbench,
  clearSelectedLines
}: {
  query: Ali1688HistoricalOrderQuery
  reloadWorkbench: (query: Ali1688HistoricalOrderQuery) => Promise<unknown>
  clearSelectedLines: () => void
}) {
  const [deleteOrderTarget, setDeleteOrderTarget] =
    useState<Ali1688HistoricalOrderRow | null>(null)
  const [deleteOrderReason, setDeleteOrderReason] =
    useState('不属于任何店铺')
  const [deleteOrderSubmitting, setDeleteOrderSubmitting] = useState(false)

  function openDeleteOrderModal(order: Ali1688HistoricalOrderRow) {
    setDeleteOrderTarget(order)
    setDeleteOrderReason('不属于任何店铺')
  }

  async function submitDeleteOrder() {
    if (!deleteOrderTarget?.id) return
    setDeleteOrderSubmitting(true)
    try {
      await deleteAli1688HistoricalOrder(deleteOrderTarget.id, {
        reason: deleteOrderReason.trim()
      })
      message.success('1688 历史订单已删除')
      setDeleteOrderTarget(null)
      setDeleteOrderReason('不属于任何店铺')
      clearSelectedLines()
      await reloadWorkbench(query)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '删除 1688 历史订单失败'
      )
    } finally {
      setDeleteOrderSubmitting(false)
    }
  }

  return {
    deleteOrderTarget,
    setDeleteOrderTarget,
    deleteOrderReason,
    setDeleteOrderReason,
    deleteOrderSubmitting,
    openDeleteOrderModal,
    submitDeleteOrder
  }
}
