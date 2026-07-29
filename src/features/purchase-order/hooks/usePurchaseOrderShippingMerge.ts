import { message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { withPublicBasePath } from '../../../runtimePaths'
import { normalizeError } from '../../../shared/api'
import {
  createShippingOrder,
  loadAssignedShippingPurchaseOrderIds
} from '../../warehouse-dispatch/api'
import type { PurchaseOrder } from '../types'
import {
  isOrderAvailableForShippingMerge,
  isSubmittedOrder,
  summarizeOrder
} from '../model/purchaseOrderSummaryModel'

type ShippingMergeOptions = {
  orders: PurchaseOrder[]
  visibleOrders: PurchaseOrder[]
  selectedOrder?: PurchaseOrder
  setActionKey: Dispatch<SetStateAction<string | undefined>>
  setSelectedOrderId: Dispatch<SetStateAction<string | undefined>>
}

export function usePurchaseOrderShippingMerge({
  orders,
  visibleOrders,
  selectedOrder,
  setActionKey,
  setSelectedOrderId
}: ShippingMergeOptions) {
  const [shippingMergeMode, setShippingMergeMode] = useState(false)
  const [selectedShippingMergeOrderIds, setSelectedShippingMergeOrderIds] = useState<string[]>([])
  const [shippingMergeAssignedOrderIds, setShippingMergeAssignedOrderIds] = useState<string[]>([])
  const [shippingMergeAssignmentLoading, setShippingMergeAssignmentLoading] = useState(false)
  const [shippingMergeErrorMessage, setShippingMergeErrorMessage] = useState<string>()
  const submittedVisibleOrders = useMemo(
    () => visibleOrders.filter(isSubmittedOrder),
    [visibleOrders]
  )
  const shippingMergeAssignedOrderIdSet = useMemo(
    () => new Set(shippingMergeAssignedOrderIds),
    [shippingMergeAssignedOrderIds]
  )
  const availableShippingMergeOrders = useMemo(
    () => visibleOrders.filter((order) => (
      isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)
    )),
    [shippingMergeAssignedOrderIdSet, visibleOrders]
  )
  const selectedShippingMergeOrders = useMemo(
    () => orders.filter((order) => (
      selectedShippingMergeOrderIds.includes(order.id)
      && isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)
    )),
    [orders, selectedShippingMergeOrderIds, shippingMergeAssignedOrderIdSet]
  )
  const selectedShippingMergeTotalQuantity = useMemo(
    () => selectedShippingMergeOrders.reduce(
      (sum, order) => sum + summarizeOrder(order).totalQuantity,
      0
    ),
    [selectedShippingMergeOrders]
  )

  useEffect(() => {
    setSelectedShippingMergeOrderIds((current) => current.filter((orderId) => {
      const order = orders.find((candidate) => candidate.id === orderId)
      return order && isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)
    }))
  }, [orders, shippingMergeAssignedOrderIdSet])

  async function openShippingMergeMode() {
    if (!submittedVisibleOrders.length) {
      message.warning('当前列表没有已封存采购单。')
      return
    }
    setShippingMergeAssignmentLoading(true)
    setShippingMergeErrorMessage(undefined)
    let assignedOrderIds = new Set(shippingMergeAssignedOrderIds)
    try {
      assignedOrderIds = new Set(await loadAssignedShippingPurchaseOrderIds())
      setShippingMergeAssignedOrderIds([...assignedOrderIds])
    } catch (error) {
      const errorMessage = normalizeError(error, '读取已有仓库单占用失败')
      setShippingMergeErrorMessage(errorMessage)
      message.error(errorMessage)
    } finally {
      setShippingMergeAssignmentLoading(false)
    }
    const nextAvailableOrders = submittedVisibleOrders.filter((order) => !assignedOrderIds.has(order.id))
    setShippingMergeMode(true)
    setSelectedShippingMergeOrderIds((current) => {
      const validIds = current.filter((orderId) => nextAvailableOrders.some((order) => order.id === orderId))
      if (validIds.length) {
        return validIds
      }
      return selectedOrder && nextAvailableOrders.some((order) => order.id === selectedOrder.id)
        ? [selectedOrder.id]
        : []
    })
    if (!nextAvailableOrders.length) {
      setShippingMergeErrorMessage('当前列表没有可合并采购单；已封存采购单可能已经在仓库单中。')
    }
  }

  function closeShippingMergeMode() {
    setShippingMergeMode(false)
    setSelectedShippingMergeOrderIds([])
    setShippingMergeErrorMessage(undefined)
  }

  function handleSelectAllVisibleSubmittedOrders() {
    setSelectedShippingMergeOrderIds(availableShippingMergeOrders.map((order) => order.id))
  }

  function handleClearShippingMergeSelection() {
    setSelectedShippingMergeOrderIds([])
  }

  function handleToggleShippingMergeOrder(order: PurchaseOrder, checked: boolean) {
    if (!isSubmittedOrder(order)) {
      message.warning('采购单封存后才可合并为仓库单。')
      return
    }
    if (shippingMergeAssignedOrderIdSet.has(order.id)) {
      message.warning('该采购单已在仓库单中，不能重复合并。')
      return
    }
    setShippingMergeErrorMessage(undefined)
    setSelectedShippingMergeOrderIds((current) => {
      if (checked) {
        return current.includes(order.id) ? current : [...current, order.id]
      }
      return current.filter((orderId) => orderId !== order.id)
    })
  }

  function handleSelectOrder(order: PurchaseOrder) {
    setSelectedOrderId(order.id)
    if (!shippingMergeMode) {
      return
    }
    handleToggleShippingMergeOrder(
      order,
      !selectedShippingMergeOrderIds.includes(order.id)
    )
  }

  async function handleCreateShippingOrderFromSelection() {
    const purchaseOrderIds = selectedShippingMergeOrders.map((order) => order.id)
    if (!purchaseOrderIds.length) {
      message.warning('请选择已封存采购单。')
      return
    }
    setActionKey('create-shipping-order-selection')
    setShippingMergeErrorMessage(undefined)
    try {
      const shippingOrder = await createShippingOrder({ purchaseOrderIds })
      closeShippingMergeMode()
      message.success(`已创建仓库单 ${shippingOrder.shippingOrderNo}。`)
      window.location.href = withPublicBasePath('/warehouse/dispatch?devSession=1&grantPurchase=1&grantWarehouse=1')
    } catch (error) {
      const errorMessage = normalizeError(error, '创建仓库单失败')
      setShippingMergeErrorMessage(errorMessage)
      message.error(errorMessage)
    } finally {
      setActionKey((current) => (
        current === 'create-shipping-order-selection' ? undefined : current
      ))
    }
  }

  return {
    shippingMergeMode,
    selectedShippingMergeOrderIds,
    shippingMergeAssignedOrderIdSet,
    shippingMergeAssignmentLoading,
    shippingMergeErrorMessage,
    availableShippingMergeOrders,
    selectedShippingMergeOrders,
    selectedShippingMergeTotalQuantity,
    openShippingMergeMode,
    closeShippingMergeMode,
    handleSelectAllVisibleSubmittedOrders,
    handleClearShippingMergeSelection,
    handleToggleShippingMergeOrder,
    handleSelectOrder,
    handleCreateShippingOrderFromSelection
  }
}
