import { useEffect, useState } from 'react'
import {
  loadDispatchPlans,
  loadReadyShipmentItems,
  loadWarehouseReceiptOrders
} from './api'
import type { DispatchPlan, PurchaseReceiptOrder } from './types'
import type { ReadyShipmentRow, WarehouseDataset, WarehouseDispatchTabKey } from './workbenchModels'

export function useWarehouseDispatchData(activeTab: WarehouseDispatchTabKey) {
  const [orders, setOrders] = useState<PurchaseReceiptOrder[]>([])
  const [readyItems, setReadyItems] = useState<ReadyShipmentRow[]>([])
  const [dispatchPlans, setDispatchPlans] = useState<DispatchPlan[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string>()
  const [readyItemsLoaded, setReadyItemsLoaded] = useState(false)
  const [dispatchPlansLoaded, setDispatchPlansLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDataLoading(true)
    setDataError(undefined)
    loadWarehouseReceiptOrders()
      .then((nextOrders) => {
        if (!cancelled) setOrders(nextOrders)
      })
      .catch((error) => {
        if (!cancelled) setDataError(error instanceof Error ? error.message : '仓库发运数据读取失败')
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'ship-ready' || readyItemsLoaded) return
    let cancelled = false
    setDataLoading(true)
    setDataError(undefined)
    loadReadyShipmentItems()
      .then((items) => {
        if (!cancelled) {
          setReadyItems(items)
          setReadyItemsLoaded(true)
        }
      })
      .catch((error) => {
        if (!cancelled) setDataError(error instanceof Error ? error.message : '库存读取失败')
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, readyItemsLoaded])

  useEffect(() => {
    if (activeTab !== 'dispatch-plan' || dispatchPlansLoaded) return
    let cancelled = false
    setDataLoading(true)
    setDataError(undefined)
    loadDispatchPlans()
      .then((plans) => {
        if (!cancelled) {
          setDispatchPlans(plans)
          setDispatchPlansLoaded(true)
        }
      })
      .catch((error) => {
        if (!cancelled) setDataError(error instanceof Error ? error.message : '发货申请单读取失败')
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, dispatchPlansLoaded])

  function applyDataset(dataset: WarehouseDataset) {
    setOrders(dataset.orders)
    setReadyItems(dataset.readyItems)
    setDispatchPlans(dataset.dispatchPlans)
    setReadyItemsLoaded(true)
    setDispatchPlansLoaded(true)
  }

  async function refresh() {
    setDataLoading(true)
    setDataError(undefined)
    try {
      const [nextOrders, nextReadyItems, nextDispatchPlans] = await Promise.all([
        loadWarehouseReceiptOrders(),
        loadReadyShipmentItems(),
        loadDispatchPlans()
      ])
      const dataset = { orders: nextOrders, readyItems: nextReadyItems, dispatchPlans: nextDispatchPlans }
      applyDataset(dataset)
      return dataset
    } catch (error) {
      setDataError(error instanceof Error ? error.message : '仓库发运数据读取失败')
      throw error
    } finally {
      setDataLoading(false)
    }
  }

  return {
    orders,
    readyItems,
    dispatchPlans,
    dataLoading,
    dataError,
    refresh
  }
}
