import { useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../auth/session'
import type { PurchaseReceiptOrder } from './types'
import {
  buildReceiptSiteOptions,
  buildReceiptStoreOptions,
  filterReceiptDetailItems,
  filterReceiptOrders,
  isReceiptTodoStatus,
  summarizeAllOrders,
  summarizeReceiptOrder
} from './receiptDomain'
import type {
  ReceiptDetailScopeFilterKey,
  ReceiptScopeFilterKey,
  ReceiptSiteFilterKey
} from './workbenchModels'

export function useReceiptWorkspace(orders: PurchaseReceiptOrder[], session?: AuthSession | null) {
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [storeFilter, setStoreFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState<ReceiptSiteFilterKey>('all')
  const [scopeFilter, setScopeFilter] = useState<ReceiptScopeFilterKey>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailKeyword, setDetailKeyword] = useState('')
  const [detailScopeFilter, setDetailScopeFilter] = useState<ReceiptDetailScopeFilterKey>('all')

  const storeOptions = useMemo(
    () => buildReceiptStoreOptions(orders, session?.userStores, session?.currentStore),
    [orders, session?.currentStore, session?.userStores]
  )
  const siteOptions = useMemo(() => buildReceiptSiteOptions(orders), [orders])
  const filteredOrders = useMemo(
    () => filterReceiptOrders(orders, keyword, storeFilter, siteFilter),
    [keyword, orders, siteFilter, storeFilter]
  )
  const filteredSummaries = useMemo(
    () => new Map(filteredOrders.map((order) => [order.id, summarizeReceiptOrder(order)] as const)),
    [filteredOrders]
  )
  const visibleOrders = useMemo(() => scopeFilter === 'all'
    ? filteredOrders
    : filteredOrders.filter((order) => isReceiptTodoStatus(
      filteredSummaries.get(order.id)?.status ?? summarizeReceiptOrder(order).status
    )), [filteredOrders, filteredSummaries, scopeFilter])
  const visibleSummaries = useMemo(
    () => new Map(visibleOrders.map((order) => [order.id, summarizeReceiptOrder(order)] as const)),
    [visibleOrders]
  )
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId]
  )
  const selectedSummary = useMemo(
    () => selectedOrder ? summarizeReceiptOrder(selectedOrder) : undefined,
    [selectedOrder]
  )
  const detailItems = useMemo(() => filterReceiptDetailItems(
    selectedOrder?.items || [],
    detailKeyword,
    detailScopeFilter
  ), [detailKeyword, detailScopeFilter, selectedOrder])
  const orderMetaById = useMemo(() => new Map(orders.map((order) => [order.id, {
    title: order.title || order.orderNo,
    createdAt: order.createdAt
  }] as const)), [orders])
  const totalSummary = useMemo(() => summarizeAllOrders(filteredOrders), [filteredOrders])

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId('')
      return
    }
    if (!orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id)
    }
  }, [orders, selectedOrderId])

  function openDetail(order: PurchaseReceiptOrder) {
    setSelectedOrderId(order.id)
    setDetailKeyword('')
    setDetailScopeFilter('all')
    setDetailOpen(true)
  }

  return {
    keyword,
    setKeyword,
    storeFilter,
    setStoreFilter,
    siteFilter,
    setSiteFilter,
    scopeFilter,
    setScopeFilter,
    detailOpen,
    setDetailOpen,
    detailKeyword,
    setDetailKeyword,
    detailScopeFilter,
    setDetailScopeFilter,
    storeOptions,
    siteOptions,
    filteredSummaries,
    visibleOrders,
    visibleSummaries,
    selectedOrder,
    selectedSummary,
    detailItems,
    orderMetaById,
    totalSummary,
    openDetail
  }
}
