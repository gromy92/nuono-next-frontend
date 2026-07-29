import { useEffect, useRef, useState } from 'react'
import { loadPurchaseOrderAli1688History } from '../api'
import type { PurchaseOrder } from '../types'
import { buildAli1688HistoryEntriesFromView } from '../model/purchaseOrderAli1688Model'
import type { PurchaseOrderAli1688HistoryEntry } from '../model/purchaseOrderViewTypes'

export function usePurchaseOrderAli1688History(selectedOrder?: PurchaseOrder) {
  const [ali1688HistoryByKey, setAli1688HistoryByKey] = useState<
    Record<string, PurchaseOrderAli1688HistoryEntry>
  >({})
  const [ali1688HistoryLoading, setAli1688HistoryLoading] = useState(false)
  const [ali1688HistoryError, setAli1688HistoryError] = useState<string>()
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    if (!selectedOrder?.id) {
      setAli1688HistoryByKey({})
      setAli1688HistoryError(undefined)
      setAli1688HistoryLoading(false)
      return
    }
    setAli1688HistoryLoading(true)
    setAli1688HistoryError(undefined)
    loadPurchaseOrderAli1688History(selectedOrder.id)
      .then((view) => {
        if (requestIdRef.current !== requestId) {
          return
        }
        setAli1688HistoryByKey(buildAli1688HistoryEntriesFromView(selectedOrder, view))
      })
      .catch((error) => {
        if (requestIdRef.current !== requestId) {
          return
        }
        setAli1688HistoryByKey({})
        setAli1688HistoryError(error instanceof Error ? error.message : '读取 1688 采购历史失败')
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setAli1688HistoryLoading(false)
        }
      })
  }, [selectedOrder])

  return {
    ali1688HistoryByKey,
    ali1688HistoryLoading,
    ali1688HistoryError
  }
}
