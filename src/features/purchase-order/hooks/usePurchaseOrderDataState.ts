import { message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadPurchaseOrders } from '../api'
import type { PurchaseOrder } from '../types'
import { summarizeOrderAllocations } from '../model/purchaseOrderAllocationModel'
import { emptyIssueSummary, summarizeOrderIssues } from '../model/purchaseOrderIssueModel'
import {
  buildActiveItemFilter,
  buildItemFilterOptions,
  emptySummary,
  filterOrderItems,
  summarizeOrder
} from '../model/purchaseOrderSummaryModel'

type PurchaseOrderDataStateOptions = {
  purchaseOrdersRevision?: number
  onPurchaseOrdersChanged?: () => void
}

export function usePurchaseOrderDataState({
  purchaseOrdersRevision,
  onPurchaseOrdersChanged
}: PurchaseOrderDataStateOptions) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionKey, setActionKey] = useState<string>()
  const [itemFilterKey, setItemFilterKey] = useState('all')
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0],
    [orders, selectedOrderId]
  )
  const selectedOrderSummary = useMemo(
    () => selectedOrder ? summarizeOrder(selectedOrder) : emptySummary(),
    [selectedOrder]
  )
  const selectedOrderAllocationSummary = useMemo(
    () => selectedOrder ? summarizeOrderAllocations(selectedOrder) : [],
    [selectedOrder]
  )
  const selectedOrderIssueSummary = useMemo(
    () => selectedOrder ? summarizeOrderIssues(selectedOrder) : emptyIssueSummary(),
    [selectedOrder]
  )
  const itemFilterOptions = useMemo(
    () => selectedOrder ? buildItemFilterOptions(selectedOrder, selectedOrderIssueSummary) : [],
    [selectedOrder, selectedOrderIssueSummary]
  )
  const visibleOrderItems = useMemo(
    () => selectedOrder ? filterOrderItems(selectedOrder.items || [], itemFilterKey) : [],
    [itemFilterKey, selectedOrder]
  )
  const activeItemFilter = useMemo(
    () => selectedOrder
      ? buildActiveItemFilter(itemFilterKey, selectedOrder, selectedOrderIssueSummary, itemFilterOptions)
      : itemFilterOptions[0],
    [itemFilterKey, itemFilterOptions, selectedOrder, selectedOrderIssueSummary]
  )
  const orderSummaries = useMemo(() => {
    const entries = orders.map((order) => [order.id, summarizeOrder(order)] as const)
    return new Map(entries)
  }, [orders])
  const visibleOrders = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) {
      return orders
    }
    return orders.filter((order) => {
      const text = [
        order.orderNo,
        order.title,
        order.storeName,
        order.storeCode,
        ...(order.items || []).flatMap((item) => [
          item.partnerSku,
          item.skuParent,
          item.productTitle,
          item.sourceTitle,
          item.sourceTitleCn,
          ...(item.allocations || []).map((allocation) => allocation.pskuCode)
        ])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return text.includes(normalized)
    })
  }, [keyword, orders])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const nextOrders = await loadPurchaseOrders({})
      setOrders(nextOrders)
      setSelectedOrderId((current) => {
        if (current && nextOrders.some((order) => order.id === current)) {
          return current
        }
        return nextOrders[0]?.id
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取采购单失败')
      setOrders([])
      setSelectedOrderId(undefined)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders, purchaseOrdersRevision])

  useEffect(() => {
    setItemFilterKey('all')
  }, [selectedOrder?.id])

  function notifyPurchaseOrdersChanged() {
    onPurchaseOrdersChanged?.()
  }

  function replaceOrder(nextOrder: PurchaseOrder) {
    setOrders((current) => current.map((order) => (
      order.id === nextOrder.id ? nextOrder : order
    )))
  }

  return {
    orders,
    setOrders,
    selectedOrderId,
    setSelectedOrderId,
    keyword,
    setKeyword,
    loading,
    actionKey,
    setActionKey,
    itemFilterKey,
    setItemFilterKey,
    selectedOrder,
    selectedOrderSummary,
    selectedOrderAllocationSummary,
    selectedOrderIssueSummary,
    itemFilterOptions,
    visibleOrderItems,
    activeItemFilter,
    orderSummaries,
    visibleOrders,
    loadOrders,
    notifyPurchaseOrdersChanged,
    replaceOrder
  }
}
