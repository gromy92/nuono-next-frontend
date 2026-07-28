import { message } from 'antd'
import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { normalizeError } from '../../../shared/api'
import { addPurchaseOrderItems, loadPurchaseOrders } from '../../purchase-order/api'
import type { PurchaseOrder, PurchaseOrderItemCommand } from '../../purchase-order/types'
import { fetchReplenishmentPlanOverview } from '../api'
import { buildPurchaseDrafts, filterBatchPurchaseDrafts, type PurchaseDraftRow } from '../purchaseDrafts'
import { formatPurchaseDuplicateNotice } from '../purchaseDuplicateNotice'
import { summarizeMissingEta } from '../summary'
import { summarizePurchasePlanProgress } from '../purchaseProgress'
import type { ReplenishmentPlanItem, ReplenishmentPlanOverview, ReplenishmentPlanQuery } from '../types'
import type { ProductImagePreview, ReplenishmentPlanTabProps, SuggestionFilter } from '../pageTypes'
import { siteCodeFromStoreCode } from '../pageTypes'
import {
  editablePurchaseOrders, matchesSuggestionFilter, purchaseDraftLines, purchaseOpeningKey,
  purchaseOrderTransportQuantities, purchaseOrderTransportSources, purchasePlanningScopeOrders,
  replacePurchaseOrder, summarizeBlockingReasons, summarizeSuggestions
} from '../replenishmentDomain'
import { formatDate, todayIsoDate } from '../replenishmentFormatting'

export function useReplenishmentPlanController({
  session, purchaseOrdersRevision, onPurchaseOrdersChanged
}: ReplenishmentPlanTabProps) {
  const currentStore = session?.currentStore
  const [overview, setOverview] = useState<ReplenishmentPlanOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [selectedPurchaseRows, setSelectedPurchaseRows] = useState<ReplenishmentPlanItem[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [openingPurchaseKey, setOpeningPurchaseKey] = useState<string>()
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseDrafts, setPurchaseDrafts] = useState<PurchaseDraftRow[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<ProductImagePreview | null>(null)
  const [purchaseDuplicateNotice, setPurchaseDuplicateNotice] = useState('')

  const query = useMemo<ReplenishmentPlanQuery | null>(() => {
    if (!currentStore?.storeCode) return null
    return {
      storeCode: currentStore.storeCode,
      siteCode: currentStore.site || siteCodeFromStoreCode(currentStore.storeCode)
    }
  }, [currentStore])

  const loadOverview = useCallback(async () => {
    if (!query?.storeCode || !query.siteCode) {
      setOverview(null)
      return
    }
    setLoading(true)
    setErrorMessage('')
    try {
      const nextOverview = await fetchReplenishmentPlanOverview(query)
      setOverview(nextOverview)
      setSelectedRowKeys([])
      setSelectedPurchaseRows([])
    } catch (error) {
      setOverview(null)
      setErrorMessage(normalizeError(error, '补货计划加载失败'))
    } finally {
      setLoading(false)
    }
  }, [query])

  const rows = overview?.rows || []
  const planDate = useMemo(() => todayIsoDate(), [])
  const searchMatchedRows = useMemo(() => {
    const normalized = searchKeyword.trim().toLowerCase()
    if (!normalized) {
      return rows
    }
    return rows.filter((item) => [
      item.partnerSku,
      item.sku,
      item.productTitle
    ].some((value) => (value || '').toLowerCase().includes(normalized)))
  }, [rows, searchKeyword])
  const filteredRows = useMemo(
    () => searchMatchedRows.filter((item) => matchesSuggestionFilter(item, suggestionFilter)),
    [searchMatchedRows, suggestionFilter]
  )
  const suggestionSummary = useMemo(() => summarizeSuggestions(searchMatchedRows), [searchMatchedRows])
  const missingEtaSummary = useMemo(() => summarizeMissingEta(searchMatchedRows), [searchMatchedRows])
  const blockedRows = useMemo(
    () => searchMatchedRows.filter((item) => item.calculationBlocked),
    [searchMatchedRows]
  )
  const pastEtaReviewCount = useMemo(
    () => searchMatchedRows.reduce((count, item) => (
      count + (item.inboundBatches || []).filter((batch) => batch.etaReviewRequired).length
    ), 0),
    [searchMatchedRows]
  )

  const editableOrders = useMemo(
    () => editablePurchaseOrders(purchaseOrders),
    [purchaseOrders]
  )
  const purchasePlanningOrders = useMemo(
    () => purchasePlanningScopeOrders(purchaseOrders),
    [purchaseOrders]
  )
  const purchaseProgressSummary = useMemo(
    () => summarizePurchasePlanProgress(searchMatchedRows, purchasePlanningOrders, query?.siteCode),
    [searchMatchedRows, purchasePlanningOrders, query?.siteCode]
  )

  const selectedPurchaseOrder = useMemo(
    () => editableOrders.find((order) => order.id === selectedOrderId),
    [editableOrders, selectedOrderId]
  )

  const purchaseTransportQuantities = useMemo(
    () => purchaseOrderTransportQuantities(purchasePlanningOrders),
    [purchasePlanningOrders]
  )
  const purchaseTransportSources = useMemo(
    () => purchaseOrderTransportSources(purchasePlanningOrders),
    [purchasePlanningOrders]
  )

  const loadEditablePurchaseOrders = useCallback(async () => {
    if (!query?.storeCode) {
      setPurchaseOrders([])
      return []
    }
    setOrdersLoading(true)
    try {
      const nextOrders = await loadPurchaseOrders({ storeCode: query.storeCode })
      const nextEditableOrders = editablePurchaseOrders(nextOrders)
      setPurchaseOrders(nextOrders)
      setSelectedOrderId((current) => {
        const candidate = nextEditableOrders.find((order) => order.id === current)
        return candidate?.id || nextEditableOrders[0]?.id
      })
      return nextOrders
    } catch (error) {
      message.error(normalizeError(error, '采购单加载失败'))
      setPurchaseOrders([])
      return []
    } finally {
      setOrdersLoading(false)
    }
  }, [query?.storeCode])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    void loadEditablePurchaseOrders()
  }, [loadEditablePurchaseOrders, purchaseOrdersRevision])

  const refreshReplenishmentPlan = useCallback(async () => {
    await Promise.all([
      loadOverview(),
      loadEditablePurchaseOrders()
    ])
  }, [loadOverview, loadEditablePurchaseOrders])

  const openPurchaseModal = async (targetRows: ReplenishmentPlanItem[], source: 'single' | 'batch' = 'single') => {
    if (!query?.siteCode) {
      message.warning('请先选择店铺站点。')
      return
    }
    const calculableRows = targetRows.filter((item) => !item.calculationBlocked)
    if (!calculableRows.length) {
      message.warning('所选商品数据依据不足，当前不可加入采购。')
      return
    }
    if (calculableRows.length !== targetRows.length) {
      message.warning('已跳过数据依据不足的商品。')
    }
    const allDrafts = calculableRows.flatMap((item) => buildPurchaseDrafts(item, query.siteCode))
    const drafts = source === 'batch' ? filterBatchPurchaseDrafts(allDrafts) : allDrafts
    if (!drafts.length) {
      message.warning('当前没有可加入采购的商品。')
      return
    }
    const openingKey = purchaseOpeningKey(targetRows)
    setOpeningPurchaseKey(openingKey)
    try {
      const nextOrders = await loadEditablePurchaseOrders()
      setPurchaseDuplicateNotice(formatPurchaseDuplicateNotice(drafts, purchasePlanningScopeOrders(nextOrders)))
      setPurchaseDrafts(drafts)
      setPurchaseModalOpen(true)
    } finally {
      setOpeningPurchaseKey(undefined)
    }
  }

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false)
    setPurchaseDrafts([])
    setSelectedOrderId(undefined)
    setPurchaseDuplicateNotice('')
  }

  const submitPurchaseDrafts = async () => {
    if (!query?.storeCode) {
      message.warning('请先选择店铺。')
      return
    }
    if (!selectedPurchaseOrder) {
      message.warning('请选择已有采购单。')
      return
    }
    const validDrafts = purchaseDraftLines(purchaseDrafts)
    if (!validDrafts.length) {
      message.warning('请至少保留一个大于 0 的商品数量。')
      return
    }
    const selectedOrderIdSnapshot = selectedPurchaseOrder.id
    setSubmitting(true)
    try {
      const latestOrders = await loadEditablePurchaseOrders()
      const latestEditableOrders = editablePurchaseOrders(latestOrders)
      const latestSelectedPurchaseOrder = latestEditableOrders.find((order) => order.id === selectedOrderIdSnapshot)
      if (!latestSelectedPurchaseOrder) {
        message.warning('采购单状态已变更，请重新选择可编辑采购单。')
        return
      }
      const items: PurchaseOrderItemCommand[] = validDrafts.map((draft) => ({
        psku: draft.partnerSku,
        site: draft.site,
        transportMode: draft.transportMode,
        quantity: Math.ceil(draft.quantity),
        fulfillmentType: 'WAREHOUSE_RECEIPT'
      }))
      const nextOrder = await addPurchaseOrderItems(latestSelectedPurchaseOrder.id, { items })
      setPurchaseOrders((current) => replacePurchaseOrder(current, nextOrder))
      message.success(`采购单已更新：${latestSelectedPurchaseOrder.title}`)
      closePurchaseModal()
      setSelectedRowKeys([])
      setSelectedPurchaseRows([])
      await onPurchaseOrdersChanged?.()
    } catch (error) {
      message.error(normalizeError(error, '加入采购单失败'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSelectedRowsChange(keys: Key[], rows: ReplenishmentPlanItem[]) {
    setSelectedRowKeys(keys)
    setSelectedPurchaseRows(rows)
  }

  return {
    overview, loading, errorMessage, searchKeyword, setSearchKeyword, suggestionFilter, setSuggestionFilter,
    selectedRowKeys, selectedPurchaseRows, purchaseOrders, ordersLoading, openingPurchaseKey,
    purchaseModalOpen, purchaseDrafts, setPurchaseDrafts, selectedOrderId, setSelectedOrderId,
    submitting, previewImage, setPreviewImage, purchaseDuplicateNotice, query, planDate,
    filteredRows, suggestionSummary, missingEtaSummary, blockedRows, pastEtaReviewCount,
    editableOrders, purchasePlanningOrders, purchaseProgressSummary, selectedPurchaseOrder,
    purchaseTransportQuantities, purchaseTransportSources, refreshReplenishmentPlan,
    openPurchaseModal, closePurchaseModal, submitPurchaseDrafts, handleSelectedRowsChange
  }
}
