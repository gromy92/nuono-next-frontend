import {
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Segmented,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Key } from 'react'
import type { AuthSession } from '../auth/session'
import {
  createShippingOrder,
  exportShippingOrderLogisticsQuoteReport,
  importShippingOrderLogisticsQuoteReport,
  loadShippingOrder,
  loadPurchaseOrders,
  loadShippingOrderLogisticsQuoteOptions,
  loadShippingOrderLogisticsQuoteOptionsForScope,
  loadShippingOrders,
  submitShippingOrder,
  updateShippingOrderLineQuote,
  updateShippingOrderLineQuotes,
  updateShippingOrder
} from '../purchase-order/api'
import type {
  PurchaseOrder,
  PurchaseOrderLogisticsQuoteChannelOption,
  PurchaseOrderLogisticsQuoteForwarderOption,
  PurchaseOrderLogisticsQuoteImportResult,
  PurchaseOrderLogisticsQuoteOptions,
  ShippingOrder,
  ShippingOrderSegment,
  ShippingOrderLine
} from '../purchase-order/types'
import { buildYiteMaterialCellModel } from './WarehouseShippingOrderPage.models'
import './WarehouseShippingOrderPage.css'

const { Text, Title } = Typography

type WarehouseShippingOrderPageProps = {
  session?: AuthSession | null
}

type WarehouseShippingOrderPanelProps = WarehouseShippingOrderPageProps & {
  embedded?: boolean
}

type QuoteExportSelection = {
  forwarderCode?: string
  routeCode?: string
}

type QuoteImportResultState = {
  orderId: string
  segmentIds: string[]
  result: PurchaseOrderLogisticsQuoteImportResult
}

type DetailLineFilter = 'ALL' | 'MISSING_MATERIAL' | 'PENDING_QUOTE'

type LineQuoteDraft = {
  unitPrice?: string
  yiteMaterial?: string
}

const YITE_MATERIAL_OPTIONS = ['塑料', '陶瓷', '金属', '纸', '纺织', '木制'].map((value) => ({
  label: value,
  value
}))

export function WarehouseShippingOrderPage(props: WarehouseShippingOrderPageProps) {
  return <WarehouseShippingOrderPanel {...props} />
}

export function WarehouseShippingOrderPanel({ session, embedded = false }: WarehouseShippingOrderPanelProps) {
  const [shippingOrders, setShippingOrders] = useState<ShippingOrder[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedSourceOrderIds, setSelectedSourceOrderIds] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [sourceKeyword, setSourceKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editShippingOrderTarget, setEditShippingOrderTarget] = useState<ShippingOrder | null>(null)
  const [editShippingOrderTitle, setEditShippingOrderTitle] = useState('')
  const [editShippingOrderRemark, setEditShippingOrderRemark] = useState('')
  const [detailShippingOrderTarget, setDetailShippingOrderTarget] = useState<ShippingOrder | null>(null)
  const [detailLineFilter, setDetailLineFilter] = useState<DetailLineFilter>('ALL')
  const [lineQuoteDrafts, setLineQuoteDrafts] = useState<Record<string, LineQuoteDraft>>({})
  const [selectedQuoteLineIds, setSelectedQuoteLineIds] = useState<string[]>([])
  const [bulkQuoteModalOpen, setBulkQuoteModalOpen] = useState(false)
  const [bulkQuoteUnitPrice, setBulkQuoteUnitPrice] = useState('')
  const [bulkQuoteYiteMaterial, setBulkQuoteYiteMaterial] = useState<string>()
  const [activeSegmentQuoteOptions, setActiveSegmentQuoteOptions] = useState<PurchaseOrderLogisticsQuoteOptions | null>(null)
  const [activeSegmentQuoteOptionsLoading, setActiveSegmentQuoteOptionsLoading] = useState(false)
  const [selectedSegmentQuoteOption, setSelectedSegmentQuoteOption] = useState<QuoteExportSelection>({})
  const [selectedDetailSegmentIds, setSelectedDetailSegmentIds] = useState<string[]>([])
  const [lastQuoteImportResult, setLastQuoteImportResult] = useState<QuoteImportResultState | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionKey, setActionKey] = useState<string>()
  const [quoteExportTarget, setQuoteExportTarget] = useState<ShippingOrder | null>(null)
  const [quoteExportSegmentIds, setQuoteExportSegmentIds] = useState<string[]>([])
  const [quoteExportOptions, setQuoteExportOptions] = useState<PurchaseOrderLogisticsQuoteOptions | null>(null)
  const [quoteExportSelection, setQuoteExportSelection] = useState<QuoteExportSelection>({})
  const [quoteExportMissingOnly, setQuoteExportMissingOnly] = useState(false)
  const [quoteExportLoading, setQuoteExportLoading] = useState(false)

  const selectedSourceOrders = useMemo(
    () => selectedSourceOrderIds
      .map((orderId) => purchaseOrders.find((order) => order.id === orderId))
      .filter((order): order is PurchaseOrder => Boolean(order)),
    [purchaseOrders, selectedSourceOrderIds]
  )
  const visibleShippingOrders = useMemo(
    () => filterShippingOrders(shippingOrders, keyword),
    [keyword, shippingOrders]
  )
  const visiblePurchaseOrders = useMemo(
    () => filterPurchaseOrders(purchaseOrders, sourceKeyword),
    [purchaseOrders, sourceKeyword]
  )
  const quoteExportableOptions = useMemo(
    () => filterQuoteOptionsWithTemplates(quoteExportOptions),
    [quoteExportOptions]
  )
  const quoteForwarderOptions = useMemo(
    () => buildQuoteForwarderSelectOptions(quoteExportableOptions),
    [quoteExportableOptions]
  )
  const quoteSelectedForwarder = useMemo(
    () => findQuoteForwarderOption(quoteExportableOptions, quoteExportSelection.forwarderCode),
    [quoteExportableOptions, quoteExportSelection.forwarderCode]
  )
  const quoteChannelOptions = useMemo(
    () => buildQuoteChannelSelectOptions(quoteSelectedForwarder),
    [quoteSelectedForwarder]
  )
  const quoteSelectedChannel = useMemo(
    () => findQuoteChannelOption(quoteSelectedForwarder, quoteExportSelection.routeCode),
    [quoteExportSelection.routeCode, quoteSelectedForwarder]
  )
  const detailLines = useMemo(
    () => detailShippingOrderTarget?.lines || [],
    [detailShippingOrderTarget]
  )
  const detailSegments = useMemo(
    () => detailShippingOrderTarget?.segments || [],
    [detailShippingOrderTarget]
  )
  const sortedDetailSegments = useMemo(
    () => sortShippingOrderSegments(detailSegments),
    [detailSegments]
  )
  const activeDetailSegment = useMemo(() => {
    const selectedSegmentId = selectedDetailSegmentIds[0]
    if (selectedSegmentId) {
      const selectedSegment = detailSegments.find((segment) => String(segment.id) === String(selectedSegmentId))
      if (selectedSegment) {
        return selectedSegment
      }
    }
    return sortedDetailSegments[0]
  }, [detailSegments, selectedDetailSegmentIds, sortedDetailSegments])
  const activeDetailSegmentIds = useMemo(
    () => (activeDetailSegment ? [activeDetailSegment.id] : []),
    [activeDetailSegment]
  )
  const activeDetailSegmentSubmitted = activeDetailSegment?.shippingSubmitStatus === 'SUBMITTED'
  const warehouseOrderSubmitted = detailShippingOrderTarget?.shippingSubmitStatus === 'SUBMITTED'
  const warehouseOrderSubmitDisabled = warehouseOrderSubmitted || !detailLines.length
  const activeDetailLines = useMemo(
    () => detailLines.filter((line) => (activeDetailSegment ? line.shippingOrderSegmentId === activeDetailSegment.id : true)),
    [activeDetailSegment, detailLines]
  )
  const activeSegmentQuoteForwarder = useMemo(
    () => findQuoteForwarderOption(activeSegmentQuoteOptions, selectedSegmentQuoteOption.forwarderCode),
    [activeSegmentQuoteOptions, selectedSegmentQuoteOption.forwarderCode]
  )
  const selectedSegmentQuoteChannel = useMemo(
    () => findQuoteChannelOption(activeSegmentQuoteForwarder, selectedSegmentQuoteOption.routeCode),
    [activeSegmentQuoteForwarder, selectedSegmentQuoteOption.routeCode]
  )
  const activeSegmentQuoteForwarderSelectOptions = useMemo(
    () => buildQuoteForwarderSelectOptions(activeSegmentQuoteOptions),
    [activeSegmentQuoteOptions]
  )
  const activeSegmentQuoteChannelSelectOptions = useMemo(
    () => buildQuoteChannelSelectOptions(activeSegmentQuoteForwarder),
    [activeSegmentQuoteForwarder]
  )
  const activeQuoteMaintenanceKey = [
    selectedSegmentQuoteOption.forwarderCode || '',
    selectedSegmentQuoteOption.routeCode || ''
  ].join(':')
  const activeDetailLinesWithSelectedQuote = useMemo(
    () => activeDetailLines.map((line) => applySelectedChannelQuoteToLine(line, selectedSegmentQuoteChannel)),
    [activeDetailLines, selectedSegmentQuoteChannel]
  )
  const showYiteQuoteFields = isYiteQuoteForwarder(activeSegmentQuoteForwarder)
  const activeDetailMissingMaterialCount = useMemo(
    () => showYiteQuoteFields ? activeDetailLinesWithSelectedQuote.filter(isMissingYiteQuoteMaterial).length : 0,
    [activeDetailLinesWithSelectedQuote, showYiteQuoteFields]
  )
  const computedActiveDetailConfirmedQuoteCount = useMemo(
    () => activeDetailLinesWithSelectedQuote.filter(isLineQuoteConfirmed).length,
    [activeDetailLinesWithSelectedQuote]
  )
  const activeDetailConfirmedQuoteCount = useMemo(
    () => selectedSegmentQuoteChannel?.confirmedLineCount == null
      ? computedActiveDetailConfirmedQuoteCount
      : Number(selectedSegmentQuoteChannel.confirmedLineCount || 0),
    [computedActiveDetailConfirmedQuoteCount, selectedSegmentQuoteChannel?.confirmedLineCount]
  )
  const activeDetailPendingQuoteCount = useMemo(
    () => selectedSegmentQuoteChannel?.pendingLineCount == null
      ? Math.max(0, activeDetailLinesWithSelectedQuote.length - activeDetailConfirmedQuoteCount)
      : Number(selectedSegmentQuoteChannel.pendingLineCount || 0),
    [activeDetailConfirmedQuoteCount, activeDetailLinesWithSelectedQuote.length, selectedSegmentQuoteChannel?.pendingLineCount]
  )
  const visibleQuoteImportResult = useMemo(() => {
    if (!detailShippingOrderTarget || !lastQuoteImportResult) {
      return null
    }
    if (lastQuoteImportResult.orderId !== detailShippingOrderTarget.id) {
      return null
    }
    return sameStringSet(lastQuoteImportResult.segmentIds, activeDetailSegmentIds)
      ? lastQuoteImportResult.result
      : null
  }, [activeDetailSegmentIds, detailShippingOrderTarget, lastQuoteImportResult])
  const quoteExportScopeLines = useMemo(() => {
    const lines = quoteExportTarget?.lines || []
    if (!quoteExportSegmentIds.length) {
      return lines
    }
    const segmentIdSet = new Set(quoteExportSegmentIds)
    return lines.filter((line) => line.shippingOrderSegmentId ? segmentIdSet.has(line.shippingOrderSegmentId) : false)
  }, [quoteExportSegmentIds, quoteExportTarget])
  const quoteExportTotalCount = Number(quoteSelectedChannel?.totalLineCount
    ?? quoteSelectedChannel?.lineQuotes?.length
    ?? quoteExportScopeLines.length
    ?? quoteExportOptions?.pendingLineCount
    ?? 0)
  const quoteExportPendingCount = Number(quoteSelectedChannel?.pendingLineCount
    ?? Math.max(0, quoteExportScopeLines.length - quoteExportScopeLines.filter((line) => line.quoteStatus === 'CONFIRMED').length)
    ?? quoteExportOptions?.pendingLineCount
    ?? 0)
  const quoteExportConfirmedCount = Number(quoteSelectedChannel?.confirmedLineCount
    ?? Math.max(0, quoteExportTotalCount - quoteExportPendingCount)
    ?? 0)
  const visibleDetailLines = useMemo(
    () => activeDetailLinesWithSelectedQuote
      .filter((line) => (showYiteQuoteFields && detailLineFilter === 'MISSING_MATERIAL' ? isMissingYiteQuoteMaterial(line) : true))
      .filter((line) => (detailLineFilter === 'PENDING_QUOTE' ? !isLineQuoteConfirmed(line) : true)),
    [activeDetailLinesWithSelectedQuote, detailLineFilter, showYiteQuoteFields]
  )
  const selectedQuoteLines = useMemo(() => {
    const selectedIds = new Set(selectedQuoteLineIds)
    return activeDetailLinesWithSelectedQuote.filter((line) => selectedIds.has(line.id))
  }, [activeDetailLinesWithSelectedQuote, selectedQuoteLineIds])

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      const nextShippingOrders = await loadShippingOrders()
      setLoadError(undefined)
      setShippingOrders(nextShippingOrders)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '读取仓库单失败'
      setLoadError(messageText)
      message.error(messageText)
    } finally {
      setLoading(false)
    }
    try {
      const nextPurchaseOrders = await loadPurchaseOrders({ submittedOnly: true, shippingAvailableOnly: false })
      setPurchaseOrders(nextPurchaseOrders)
      setSelectedSourceOrderIds((current) => current.filter((orderId) => nextPurchaseOrders.some((order) => order.id === orderId)))
    } catch {
      setPurchaseOrders([])
      setSelectedSourceOrderIds([])
    }
  }, [])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  useEffect(() => {
    if (!detailShippingOrderTarget) {
      return
    }
    const segmentIds = sortedDetailSegments.map((segment) => segment.id)
    setSelectedDetailSegmentIds((current) => {
      const currentId = current[0]
      if (currentId && segmentIds.includes(currentId)) {
        return current.length === 1 ? current : [currentId]
      }
      const firstUnsubmitted = sortedDetailSegments.find((segment) => segment.shippingSubmitStatus !== 'SUBMITTED')
      return firstUnsubmitted ? [firstUnsubmitted.id] : (segmentIds[0] ? [segmentIds[0]] : [])
    })
  }, [detailShippingOrderTarget, sortedDetailSegments])

  useEffect(() => {
    if (!detailShippingOrderTarget?.id || !activeDetailSegmentIds.length) {
      setActiveSegmentQuoteOptions(null)
      setSelectedSegmentQuoteOption({})
      setActiveSegmentQuoteOptionsLoading(false)
      return
    }
    let cancelled = false
    setActiveSegmentQuoteOptionsLoading(true)
    loadShippingOrderLogisticsQuoteOptionsForScope(detailShippingOrderTarget.id, activeDetailSegmentIds)
      .then((options) => {
        if (cancelled) {
          return
        }
        setActiveSegmentQuoteOptions(options)
        setSelectedSegmentQuoteOption(defaultSegmentQuoteSelection(options, activeDetailSegment))
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setActiveSegmentQuoteOptions(null)
        setSelectedSegmentQuoteOption({})
        message.error(error instanceof Error ? error.message : '读取货代渠道选项失败')
      })
      .finally(() => {
        if (!cancelled) {
          setActiveSegmentQuoteOptionsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeDetailSegment, activeDetailSegmentIds, detailShippingOrderTarget?.id])

  useEffect(() => {
    if (!showYiteQuoteFields && detailLineFilter === 'MISSING_MATERIAL') {
      setDetailLineFilter('ALL')
    }
  }, [detailLineFilter, showYiteQuoteFields])

  useEffect(() => {
    const selectableIds = new Set(
      activeDetailLinesWithSelectedQuote
        .filter((line) => line.shippingSubmitStatus !== 'SUBMITTED')
        .map((line) => line.id)
    )
    setSelectedQuoteLineIds((current) => {
      const next = current.filter((lineId) => selectableIds.has(lineId))
      return next.length === current.length ? current : next
    })
  }, [activeDetailLinesWithSelectedQuote])

  async function handleCreateShippingOrder() {
    if (!selectedSourceOrderIds.length) {
      message.warning('请选择要合并的采购单。')
      return
    }
    setActionKey('create-shipping-order')
    try {
      const nextShippingOrder = await createShippingOrder({
        purchaseOrderIds: selectedSourceOrderIds
      })
      setSelectedSourceOrderIds([])
      setCreateModalOpen(false)
      await loadPage()
      message.success(`已创建仓库单 ${nextShippingOrder.shippingOrderNo}。`)
      for (const warning of nextShippingOrder.warnings || []) {
        message.warning(warning)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建仓库单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  function openEditShippingOrderModal(order: ShippingOrder) {
    setEditShippingOrderTarget(order)
    setEditShippingOrderTitle(order.title || order.shippingOrderNo || '')
    setEditShippingOrderRemark(order.remark || '')
  }

  function closeEditShippingOrderModal() {
    setEditShippingOrderTarget(null)
    setEditShippingOrderTitle('')
    setEditShippingOrderRemark('')
  }

  async function handleUpdateShippingOrderTitle() {
    if (!editShippingOrderTarget) {
      return
    }
    const title = editShippingOrderTitle.trim()
    if (!title) {
      message.warning('请输入仓库单名。')
      return
    }
    setActionKey(`update-shipping-order:${editShippingOrderTarget.id}`)
    try {
      const nextOrder = await updateShippingOrder(editShippingOrderTarget.id, {
        title,
        remark: editShippingOrderRemark.trim() || undefined
      })
      setShippingOrders((current) => current.map((order) => (order.id === nextOrder.id ? { ...order, ...nextOrder } : order)))
      closeEditShippingOrderModal()
      message.success('已保存仓库单名。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存仓库单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function openShippingOrderDetail(order: ShippingOrder) {
    setDetailShippingOrderTarget({ ...order, lines: [] })
    setDetailLineFilter('ALL')
    setLineQuoteDrafts({})
    setSelectedQuoteLineIds([])
    setBulkQuoteModalOpen(false)
    setBulkQuoteUnitPrice('')
    setBulkQuoteYiteMaterial(undefined)
    setSelectedDetailSegmentIds([])
    setLastQuoteImportResult(null)
    setDetailLoading(true)
    try {
      const detail = await loadShippingOrder(order.id)
      setDetailShippingOrderTarget(detail)
      setShippingOrders((current) => current.map((item) => (item.id === detail.id ? { ...item, ...detail, lines: item.lines } : item)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取仓库单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeShippingOrderDetail() {
    setDetailShippingOrderTarget(null)
    setDetailLineFilter('ALL')
    setLineQuoteDrafts({})
    setSelectedQuoteLineIds([])
    setBulkQuoteModalOpen(false)
    setBulkQuoteUnitPrice('')
    setBulkQuoteYiteMaterial(undefined)
    setSelectedDetailSegmentIds([])
    setLastQuoteImportResult(null)
    setDetailLoading(false)
  }

  function readLineQuoteDraft(line: ShippingOrderLine): LineQuoteDraft {
    return {
      unitPrice: lineQuoteDrafts[line.id]?.unitPrice ?? formatQuoteInputValue(line.unitPrice),
      yiteMaterial: lineQuoteDrafts[line.id]?.yiteMaterial ?? line.yiteMaterial ?? undefined
    }
  }

  function updateLineQuoteDraft(lineId: string, patch: LineQuoteDraft) {
    setLineQuoteDrafts((current) => ({
      ...current,
      [lineId]: {
        ...current[lineId],
        ...patch
      }
    }))
  }

  async function handleSaveLineQuote(line: ShippingOrderLine) {
    const order = detailShippingOrderTarget
    if (!order) {
      return
    }
    if (!selectedSegmentQuoteOption.forwarderCode || !selectedSegmentQuoteOption.routeCode) {
      message.warning('请先选择上方货代渠道。')
      return
    }
    const draft = readLineQuoteDraft(line)
    if (showYiteQuoteFields && !draft.yiteMaterial?.trim()) {
      message.warning('请选择义特材质。')
      return
    }
    const unitPriceText = String(draft.unitPrice || '').trim()
    const unitPrice = Number(unitPriceText)
    if (!unitPriceText || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      message.warning('请输入有效单价。')
      return
    }
    const quoteBillingUnit = defaultQuoteBillingUnit(activeDetailSegment?.transportMode || line.plannedTransportMode)
    setActionKey(`line-quote:${line.id}`)
    try {
      const quotePayload = {
        forwarderCode: selectedSegmentQuoteOption.forwarderCode,
        routeCode: selectedSegmentQuoteOption.routeCode,
        unitPrice,
        currency: 'CNY',
        billingUnit: quoteBillingUnit,
        yiteMaterial: showYiteQuoteFields ? draft.yiteMaterial?.trim() : undefined
      }
      const nextOrder = await updateShippingOrderLineQuote(order.id, line.id, quotePayload)
      setDetailShippingOrderTarget(nextOrder)
      setShippingOrders((current) => current.map((item) => (item.id === nextOrder.id ? { ...item, ...nextOrder, lines: item.lines } : item)))
      const nextOptions = await loadShippingOrderLogisticsQuoteOptionsForScope(nextOrder.id, activeDetailSegmentIds)
      setActiveSegmentQuoteOptions(nextOptions)
      setSelectedSegmentQuoteOption((current) => {
        const currentForwarder = findQuoteForwarderOption(nextOptions, current.forwarderCode)
        const currentChannel = findQuoteChannelOption(currentForwarder, current.routeCode)
        return currentForwarder && currentChannel
          ? current
          : defaultSegmentQuoteSelection(nextOptions, activeDetailSegment)
      })
      setLineQuoteDrafts((current) => {
        const next = { ...current }
        delete next[line.id]
        return next
      })
      message.success('已保存商品报价。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存商品报价失败')
    } finally {
      setActionKey(undefined)
    }
  }

  function openBulkQuoteModal() {
    if (!selectedQuoteLineIds.length) {
      message.warning('请选择要批量报价的商品。')
      return
    }
    if ((!selectedSegmentQuoteOption.forwarderCode || !selectedSegmentQuoteOption.routeCode) && activeSegmentQuoteOptions) {
      setSelectedSegmentQuoteOption(firstAvailableSegmentQuoteSelection(activeSegmentQuoteOptions))
    }
    setBulkQuoteUnitPrice('')
    setBulkQuoteYiteMaterial(undefined)
    setBulkQuoteModalOpen(true)
  }

  function closeBulkQuoteModal() {
    setBulkQuoteModalOpen(false)
    setBulkQuoteUnitPrice('')
    setBulkQuoteYiteMaterial(undefined)
  }

  async function handleSaveBulkLineQuotes() {
    const order = detailShippingOrderTarget
    if (!order) {
      return
    }
    if (!selectedQuoteLineIds.length) {
      message.warning('请选择要批量报价的商品。')
      return
    }
    if (!selectedSegmentQuoteOption.forwarderCode || !selectedSegmentQuoteOption.routeCode) {
      message.warning('请先选择上方货代渠道。')
      return
    }
    const unitPriceText = bulkQuoteUnitPrice.trim()
    const unitPrice = Number(unitPriceText)
    if (!unitPriceText || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      message.warning('请输入有效单价。')
      return
    }
    const selectedCount = selectedQuoteLineIds.length
    const quoteBillingUnit = defaultQuoteBillingUnit(activeDetailSegment?.transportMode || selectedQuoteLines[0]?.plannedTransportMode)
    setActionKey(`bulk-line-quote:${order.id}`)
    try {
      const nextOrder = await updateShippingOrderLineQuotes(order.id, {
        lineIds: selectedQuoteLineIds,
        forwarderCode: selectedSegmentQuoteOption.forwarderCode,
        routeCode: selectedSegmentQuoteOption.routeCode,
        unitPrice,
        currency: 'CNY',
        billingUnit: quoteBillingUnit,
        yiteMaterial: showYiteQuoteFields ? bulkQuoteYiteMaterial?.trim() : undefined
      })
      setDetailShippingOrderTarget(nextOrder)
      setShippingOrders((current) => current.map((item) => (item.id === nextOrder.id ? { ...item, ...nextOrder, lines: item.lines } : item)))
      const nextOptions = await loadShippingOrderLogisticsQuoteOptionsForScope(nextOrder.id, activeDetailSegmentIds)
      setActiveSegmentQuoteOptions(nextOptions)
      setSelectedSegmentQuoteOption((current) => {
        const currentForwarder = findQuoteForwarderOption(nextOptions, current.forwarderCode)
        const currentChannel = findQuoteChannelOption(currentForwarder, current.routeCode)
        return currentForwarder && currentChannel
          ? current
          : defaultSegmentQuoteSelection(nextOptions, activeDetailSegment)
      })
      setLineQuoteDrafts((current) => {
        const next = { ...current }
        selectedQuoteLineIds.forEach((lineId) => {
          delete next[lineId]
        })
        return next
      })
      setSelectedQuoteLineIds([])
      closeBulkQuoteModal()
      message.success(`已批量保存 ${selectedCount} 个商品报价。`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量保存商品报价失败')
    } finally {
      setActionKey(undefined)
    }
  }

  function handleSelectSegmentQuoteOption(forwarder: PurchaseOrderLogisticsQuoteForwarderOption, channel: PurchaseOrderLogisticsQuoteChannelOption) {
    setSelectedSegmentQuoteOption({
      forwarderCode: forwarder.forwarderCode,
      routeCode: channel.routeCode
    })
    if (!isYiteQuoteForwarder(forwarder)) {
      setDetailLineFilter('ALL')
    }
    setLineQuoteDrafts({})
    setSelectedQuoteLineIds([])
    setBulkQuoteModalOpen(false)
    setBulkQuoteUnitPrice('')
    setBulkQuoteYiteMaterial(undefined)
  }

  function handleSelectBulkQuoteForwarder(forwarderCode: string) {
    const forwarder = findQuoteForwarderOption(activeSegmentQuoteOptions, forwarderCode)
    const firstChannel = forwarder?.channels?.[0]
    setSelectedSegmentQuoteOption({
      forwarderCode,
      routeCode: firstChannel?.routeCode
    })
    if (!isYiteQuoteForwarder(forwarder)) {
      setBulkQuoteYiteMaterial(undefined)
    }
  }

  function handleSelectBulkQuoteChannel(routeCode: string) {
    setSelectedSegmentQuoteOption((current) => ({
      ...current,
      routeCode
    }))
  }

  async function openCreateShippingOrderModal() {
    setCreateModalOpen(true)
    setSourceKeyword('')
    try {
      const nextPurchaseOrders = await loadPurchaseOrders({ submittedOnly: true, shippingAvailableOnly: false })
      setPurchaseOrders(nextPurchaseOrders)
      setSelectedSourceOrderIds((current) => current.filter((orderId) => nextPurchaseOrders.some((order) => order.id === orderId)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取已提交采购单失败')
    }
  }

  async function openLogisticsQuoteExportModal(order: ShippingOrder, segmentIds?: string[]) {
    if (!order.lineCount) {
      message.warning('当前仓库单还没有商品。')
      return
    }
    setQuoteExportTarget(order)
    setQuoteExportSegmentIds(segmentIds || [])
    setQuoteExportOptions(null)
    setQuoteExportSelection({})
    setQuoteExportMissingOnly(false)
    setQuoteExportLoading(true)
    try {
      const options = segmentIds?.length
        ? await loadShippingOrderLogisticsQuoteOptionsForScope(order.id, segmentIds)
        : await loadShippingOrderLogisticsQuoteOptions(order.id)
      setQuoteExportOptions(options)
      setQuoteExportSelection({})
    } catch (error) {
      setQuoteExportOptions(null)
      message.error(error instanceof Error ? error.message : '读取可导出货代渠道失败')
    } finally {
      setQuoteExportLoading(false)
    }
  }

  async function handleExportLogisticsQuoteReport() {
    const order = quoteExportTarget
    if (!order?.id) {
      return
    }
    if (!quoteExportSelection.forwarderCode || !quoteExportSelection.routeCode) {
      message.warning('请选择货代和渠道。')
      return
    }
    setActionKey(`logistics-quote-export:${order.id}`)
    try {
      const report = await exportShippingOrderLogisticsQuoteReport(order.id, {
        forwarderCode: quoteExportSelection.forwarderCode,
        routeCode: quoteExportSelection.routeCode,
        segmentIds: quoteExportSegmentIds,
        missingOnly: quoteExportMissingOnly
      })
      saveBlobFile(report.blob, report.filename)
      closeLogisticsQuoteExportModal()
      await loadPage()
      message.success('已导出物流报价表。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出物流报价表失败')
    } finally {
      setActionKey(undefined)
    }
  }

  function handleQuoteExportForwarderChange(forwarderCode: string) {
    const forwarder = findQuoteForwarderOption(quoteExportableOptions, forwarderCode)
    setQuoteExportSelection({
      forwarderCode,
      routeCode: forwarder?.channels?.length === 1 ? forwarder.channels[0].routeCode : undefined
    })
  }

  function closeLogisticsQuoteExportModal() {
    setQuoteExportTarget(null)
    setQuoteExportSegmentIds([])
    setQuoteExportOptions(null)
    setQuoteExportSelection({})
    setQuoteExportMissingOnly(false)
    setQuoteExportLoading(false)
  }

  async function handleImportLogisticsQuoteReport(order: ShippingOrder, file: File, segmentIds?: string[]) {
    setActionKey(`logistics-quote-import:${order.id}`)
    try {
      const result = await importShippingOrderLogisticsQuoteReport(order.id, file, segmentIds)
      setLastQuoteImportResult({
        orderId: order.id,
        segmentIds: segmentIds || [],
        result
      })
      await loadPage()
      if (detailShippingOrderTarget?.id === order.id) {
        const detail = await loadShippingOrder(order.id)
        setDetailShippingOrderTarget(detail)
      }
      const failedText = result.skippedRows ? `，跳过 ${result.skippedRows} 行` : ''
      if (!result.updatedRows) {
        Modal.warning({
          title: '报价未更新',
          content: quoteImportResultContent(result),
          okText: '知道了'
        })
        return
      }
      message.success(`已回传物流报价 ${result.updatedRows} 行${failedText}。`)
      if (result.errors?.length || result.skippedRows) {
        Modal.warning({
          title: '部分报价未更新',
          content: quoteImportResultContent(result),
          okText: '知道了'
        })
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '回传物流报价表失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function handleSubmitShipping(order: ShippingOrder) {
    const submitted = order.shippingSubmitStatus === 'SUBMITTED'
    const pendingQuoteCount = countShippingOrderPendingQuoteLines(order)
    const yiteSegmentIds = new Set((order.segments || []).filter(isYiteSegment).map((segment) => segment.id))
    const missingMaterialCount = order.lines?.length
      ? order.lines
        .filter((line) => isMissingYiteMaterial(line, yiteSegmentIds)).length
      : (order.segments || []).reduce((sum, segment) => sum + Number(segment.missingYiteMaterialCount || 0), 0)
    if (submitted) {
      Modal.warning({
        title: '仓库单已提交',
        content: '该仓库单已经整体提交，不能重复提交。',
        okText: '知道了'
      })
      return
    }
    if (pendingQuoteCount > 0) {
      Modal.warning({
        title: '报价缺失',
        content: `还有 ${pendingQuoteCount} 个商品缺少物流报价，补齐后才能提交给仓库装箱。`,
        okText: '知道了'
      })
      return
    }
    if (missingMaterialCount > 0) {
      Modal.warning({
        title: '义特材质缺失',
        content: `还有 ${missingMaterialCount} 个商品材质缺失，补齐后才能提交给仓库装箱。`,
        okText: '知道了'
      })
      return
    }
    setActionKey(`submit-shipping:${order.id}`)
    try {
      const result = await submitShippingOrder(order.id)
      await loadPage()
      if (detailShippingOrderTarget?.id === order.id) {
        const detail = await loadShippingOrder(order.id)
        setDetailShippingOrderTarget(detail)
      }
      Modal.success({
        title: '已提交发货',
        content: `仓库单已整体提交，共 ${result.submittedLineCount} 行。`,
        okText: '知道了'
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交发货失败')
    } finally {
      setActionKey(undefined)
    }
  }

  const sourceOrderSelection = {
    selectedRowKeys: selectedSourceOrderIds,
    onChange: (selectedRowKeys: Key[]) => {
      setSelectedSourceOrderIds(selectedRowKeys.map(String))
    }
  }
  const detailScopeActionDisabled = detailSegments.length ? !activeDetailSegmentIds.length : !detailLines.length

  const warehouseOrderList = (
    <Spin spinning={loading}>
      <div className="warehouse-shipping-order-main">
        <section className="warehouse-shipping-order-list-section">
          <Table<ShippingOrder>
            size="small"
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            columns={[
              {
                title: '仓库单',
                dataIndex: 'title',
                width: 260,
                render: (_, order) => {
                  const status = shippingOrderStatusMeta(order)
                  return (
                    <div className="warehouse-shipping-order-source-name">
                      <Text strong>{order.title || order.shippingOrderNo}</Text>
                      <Text type="secondary">{order.shippingOrderNo}</Text>
                      <div className="warehouse-shipping-order-status-tags">
                        <Tag color={status.color}>{status.label}</Tag>
                      </div>
                    </div>
                  )
                }
              },
              {
                title: '来源采购单',
                dataIndex: 'purchaseOrderCount',
                width: 110,
                render: (value) => `${value || 0} 单`
              },
              {
                title: '商品行',
                dataIndex: 'lineCount',
                width: 90
              },
              {
                title: 'SKU',
                dataIndex: 'skuCount',
                width: 80
              },
              {
                title: '数量',
                dataIndex: 'totalQuantity',
                width: 100,
                align: 'right',
                render: (value) => formatQuantity(Number(value || 0))
              },
              {
                title: '报价',
                dataIndex: 'quoteStatus',
                width: 110,
                render: (_, order) => <Tag color={shippingOrderStatusMeta(order).color}>{shippingOrderStatusMeta(order).label}</Tag>
              },
              {
                title: '问题',
                width: 180,
                render: (_, order) => renderWarehouseOrderIssueTags(order)
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 120,
                render: (value) => formatDate(String(value || ''))
              },
              {
                title: '操作',
                width: 180,
                render: (_, order) => (
                  <div className="warehouse-shipping-order-table-actions" onClick={(event) => event.stopPropagation()}>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      disabled={!order.lineCount}
                      loading={detailLoading && detailShippingOrderTarget?.id === order.id}
                      onClick={() => void openShippingOrderDetail(order)}
                    >
                      查看详情
                    </Button>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      loading={actionKey === `update-shipping-order:${order.id}`}
                      onClick={() => openEditShippingOrderModal(order)}
                    >
                      改名
                    </Button>
                  </div>
                )
              }
            ]}
            dataSource={visibleShippingOrders}
            locale={{
              emptyText: loadError ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={loadError}
                >
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => void loadPage()}>
                    重新读取
                  </Button>
                </Empty>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无仓库单" />
              )
            }}
          />
        </section>
      </div>
    </Spin>
  )

  return (
    <div
      className={`warehouse-shipping-order-page${embedded ? ' warehouse-shipping-order-page--embedded' : ''}`}
      data-testid="warehouse-shipping-order-page"
    >
      <div className="warehouse-shipping-order-toolbar">
        {embedded ? null : (
          <div>
            <Title level={4}>发货单</Title>
            <Text type="secondary">仓库单负责采购合并、报价和提交仓库；实际发运流程在仓库发运中处理。</Text>
          </div>
        )}
        <div className="warehouse-shipping-order-toolbar-actions">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索仓库单 / SKU / 采购单"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          {embedded ? null : (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => void openCreateShippingOrderModal()}>
              新增仓库单
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => void loadPage()} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      {embedded ? (
        warehouseOrderList
      ) : (
        <Tabs
          className="warehouse-shipping-order-workbench-tabs"
          activeKey="warehouse-order"
          items={[
            {
              key: 'warehouse-order',
              label: '仓库单',
              children: warehouseOrderList
            }
          ]}
        />
      )}

      <Modal
        title="修改仓库单名"
        open={Boolean(editShippingOrderTarget)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === `update-shipping-order:${editShippingOrderTarget?.id}` }}
        onOk={() => void handleUpdateShippingOrderTitle()}
        onCancel={closeEditShippingOrderModal}
        width={520}
      >
        <div className="warehouse-shipping-order-edit-form">
          <Form.Item label="仓库单名" required>
            <Input
              value={editShippingOrderTitle}
              onChange={(event) => setEditShippingOrderTitle(event.target.value)}
              maxLength={80}
              showCount
              placeholder="输入仓库单名"
            />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea
              value={editShippingOrderRemark}
              onChange={(event) => setEditShippingOrderRemark(event.target.value)}
              maxLength={160}
              showCount
              autoSize={{ minRows: 3, maxRows: 5 }}
              placeholder="输入备注"
            />
          </Form.Item>
        </div>
      </Modal>

      <Modal
        title={detailShippingOrderTarget ? `${detailShippingOrderTarget.title || detailShippingOrderTarget.shippingOrderNo} 商品明细` : '仓库单商品明细'}
        open={Boolean(detailShippingOrderTarget)}
        footer={null}
        onCancel={closeShippingOrderDetail}
        width={1260}
      >
        <Spin spinning={detailLoading}>
          <div className="warehouse-shipping-order-detail-toolbar">
            <div className="warehouse-shipping-order-detail-route-row">
              {renderDetailSegmentChips(
                sortedDetailSegments,
                activeDetailSegment,
                (segmentId) => {
                  setSelectedDetailSegmentIds([String(segmentId)])
                  setDetailLineFilter('ALL')
                  setLineQuoteDrafts({})
                  setSelectedQuoteLineIds([])
                  setBulkQuoteModalOpen(false)
                  setBulkQuoteUnitPrice('')
                  setBulkQuoteYiteMaterial(undefined)
                }
              )}
              <div className="warehouse-shipping-order-detail-actions">
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  disabled={detailScopeActionDisabled}
                  onClick={() => detailShippingOrderTarget && void openLogisticsQuoteExportModal(detailShippingOrderTarget, activeDetailSegmentIds)}
                >
                  导出审核单
                </Button>
                <Upload
                  accept=".xls,.xlsx"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    if (detailShippingOrderTarget) {
                      void handleImportLogisticsQuoteReport(detailShippingOrderTarget, file as File, activeDetailSegmentIds)
                    }
                    return false
                  }}
                >
                  <Button
                    size="small"
                    icon={<UploadOutlined />}
                    disabled={detailScopeActionDisabled}
                    loading={actionKey === `logistics-quote-import:${detailShippingOrderTarget?.id}`}
                  >
                    回传报价
                  </Button>
                </Upload>
                <Button
                  size="small"
                  icon={<SaveOutlined />}
                  disabled={detailScopeActionDisabled || activeDetailSegmentSubmitted}
                  loading={actionKey === `bulk-line-quote:${detailShippingOrderTarget?.id}`}
                  onClick={openBulkQuoteModal}
                >
                  批量添加报价{selectedQuoteLineIds.length ? ` ${selectedQuoteLineIds.length}` : ''}
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<SendOutlined />}
                  disabled={warehouseOrderSubmitDisabled}
                  loading={actionKey === `submit-shipping:${detailShippingOrderTarget?.id}`}
                  onClick={() => detailShippingOrderTarget && void handleSubmitShipping(detailShippingOrderTarget)}
                >
                  {warehouseOrderSubmitted ? '已提交' : '提交发货'}
                </Button>
              </div>
            </div>
            <div className="warehouse-shipping-order-detail-status-row">
              <div className="warehouse-shipping-order-quote-control-bar">
                {renderActiveSegmentQuoteControls(
                  activeSegmentQuoteOptions,
                  activeSegmentQuoteOptionsLoading,
                  selectedSegmentQuoteOption,
                  handleSelectSegmentQuoteOption
                )}
              </div>
              <div className="warehouse-shipping-order-detail-subbar">
                <Segmented
                  size="small"
                  value={detailLineFilter}
                  options={[
                    { label: `全部 ${activeDetailLines.length}`, value: 'ALL' },
                    ...(showYiteQuoteFields ? [{ label: renderDetailLineFilterLabel('材料缺失', activeDetailMissingMaterialCount), value: 'MISSING_MATERIAL' }] : []),
                    { label: renderDetailLineFilterLabel('缺报价', activeDetailPendingQuoteCount), value: 'PENDING_QUOTE' }
                  ]}
                  onChange={(value) => setDetailLineFilter(value as DetailLineFilter)}
                />
                {activeDetailSegment ? (
                  <div className="warehouse-shipping-order-segment-summary">
                    <Text type="secondary">{activeSegmentQuoteForwarder?.forwarderName || activeSegmentQuoteForwarder?.forwarderCode || '-'}</Text>
                    <Text type="secondary">{formatQuantity(Number(activeDetailSegment.totalQuantity || 0))} 件</Text>
                    <Tag color={activeDetailPendingQuoteCount > 0 ? 'red' : 'green'}>
                      {activeDetailPendingQuoteCount > 0 ? '待报价' : '已报价'}
                    </Tag>
                    <Tag color={activeDetailSegment.shippingSubmitStatus === 'SUBMITTED' ? 'blue' : 'default'}>
                      {shippingSubmitLabel(activeDetailSegment.shippingSubmitStatus)}
                    </Tag>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {visibleQuoteImportResult ? (
            <Alert
              className="warehouse-shipping-order-import-alert"
              type={Number(visibleQuoteImportResult.updatedRows || 0) > 0 && !visibleQuoteImportResult.skippedRows ? 'success' : 'warning'}
              showIcon
              message={quoteImportResultTitle(visibleQuoteImportResult)}
              description={quoteImportResultContent(visibleQuoteImportResult)}
            />
          ) : null}
          <Table<ShippingOrderLine>
            size="small"
            key={activeQuoteMaintenanceKey}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedQuoteLineIds,
              onChange: (selectedRowKeys) => setSelectedQuoteLineIds(selectedRowKeys.map(String)),
              getCheckboxProps: (line) => ({
                disabled: line.shippingSubmitStatus === 'SUBMITTED'
              })
            }}
            scroll={{ x: showYiteQuoteFields ? 1120 : 860 }}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            columns={[
              {
                title: '商品',
                dataIndex: 'productTitle',
                width: 420,
                render: (_, line) => {
                  const imageUrl = shippingOrderLineImageUrl(line)
                  const titleCn = shippingOrderLineTitleCn(line)
                  return (
                    <div className="warehouse-shipping-order-product-cell">
                      {imageUrl ? (
                        <Image
                          className="warehouse-shipping-order-product-image"
                          src={imageUrl}
                          alt={titleCn}
                          width={70}
                          height={70}
                          preview={{ src: imageUrl }}
                        />
                      ) : (
                        <div className="warehouse-shipping-order-product-placeholder" />
                      )}
                      <div>
                        <Text strong className="warehouse-shipping-order-product-title-cn">
                          {titleCn}
                        </Text>
                        <Text type="secondary" className="warehouse-shipping-order-product-title-en">
                          {shippingOrderLineTitleEn(line)}
                        </Text>
                      </div>
                    </div>
                  )
                }
              },
              {
                title: '来源/数量',
                dataIndex: 'lineMeta',
                width: 180,
                render: (_, line) => (
                  <div className="warehouse-shipping-order-line-meta-cell">
                    <Text strong className="warehouse-shipping-order-line-meta-barcode">
                      {line.barcode || '-'}
                    </Text>
                    <Text type="secondary" className="warehouse-shipping-order-line-meta-source">
                      {line.purchaseOrderTitle || line.purchaseOrderNo || '-'}
                    </Text>
                    <Text className="warehouse-shipping-order-line-meta-quantity">
                      {formatQuantity(Number(line.quantity || 0))} 件
                    </Text>
                  </div>
                )
              },
              ...(showYiteQuoteFields ? [
                {
                  title: '义特材质',
                  dataIndex: 'yiteMaterial',
                  width: 150,
                  render: (_: unknown, line: ShippingOrderLine) => {
                    const cellModel = buildYiteMaterialCellModel(line)
                    const draft = readLineQuoteDraft(line)
                    return (
                      <Select
                        size="small"
                        allowClear
                        placeholder="选择材质"
                        options={YITE_MATERIAL_OPTIONS}
                        value={draft.yiteMaterial || cellModel.value}
                        disabled={!cellModel.editable || line.shippingSubmitStatus === 'SUBMITTED'}
                        onChange={(yiteMaterial) => updateLineQuoteDraft(line.id, { yiteMaterial })}
                      />
                    )
                  }
                },
                {
                  title: '义特价格',
                  dataIndex: 'unitPrice',
                  width: 105,
                  render: (_: unknown, line: ShippingOrderLine) => {
                    const cellModel = buildYiteMaterialCellModel(line)
                    return (
                      <Text type="secondary" className="warehouse-shipping-order-yite-price">
                        {cellModel.priceText}
                      </Text>
                    )
                  }
                }
              ] : []),
              {
                title: '报价单价',
                dataIndex: 'unitPrice',
                width: 138,
                render: (_, line) => {
                  const draft = readLineQuoteDraft(line)
                  return (
                    <div className="warehouse-shipping-order-price-cell">
                      <Input
                        className="warehouse-shipping-order-quote-field"
                        size="small"
                        inputMode="decimal"
                        value={draft.unitPrice}
                        placeholder="单价"
                        disabled={line.shippingSubmitStatus === 'SUBMITTED'}
                        onChange={(event) => updateLineQuoteDraft(line.id, { unitPrice: event.target.value })}
                      />
                      <Text type="secondary" className="warehouse-shipping-order-price-unit">
                        {quoteUnitDisplayText(activeDetailSegment?.transportMode || line.plannedTransportMode)}
                      </Text>
                    </div>
                  )
                }
              },
              {
                title: '报价操作',
                width: 112,
                render: (_, line) => (
                  <Button
                    size="small"
                    type={isLineQuoteConfirmed(line) ? 'default' : 'primary'}
                    icon={<SaveOutlined />}
                    loading={actionKey === `line-quote:${line.id}`}
                    disabled={line.shippingSubmitStatus === 'SUBMITTED'}
                    onClick={() => void handleSaveLineQuote(line)}
                  >
                    保存报价
                  </Button>
                )
              }
            ]}
            dataSource={visibleDetailLines}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={detailLineFilter === 'PENDING_QUOTE' ? '暂无缺报价商品' : detailLineFilter === 'MISSING_MATERIAL' ? '暂无材料缺失商品' : '暂无商品'}
                />
              )
            }}
          />
        </Spin>
      </Modal>

      <Modal
        title="批量添加报价"
        open={bulkQuoteModalOpen}
        okText="批量保存"
        cancelText="取消"
        okButtonProps={{
          disabled: !selectedQuoteLineIds.length || !selectedSegmentQuoteChannel,
          loading: actionKey === `bulk-line-quote:${detailShippingOrderTarget?.id}`
        }}
        onOk={() => void handleSaveBulkLineQuotes()}
        onCancel={closeBulkQuoteModal}
        width={520}
      >
        <div className="warehouse-shipping-order-bulk-quote-modal">
          <Alert
            type={selectedSegmentQuoteChannel ? 'info' : 'warning'}
            showIcon
            message={selectedSegmentQuoteChannel
              ? `已选 ${selectedQuoteLineIds.length} 个商品，将写入当前货代渠道。`
              : `已选 ${selectedQuoteLineIds.length} 个商品，请先选择货代渠道。`}
          />
          <div className="warehouse-shipping-order-bulk-quote-scope">
            <Form.Item label="货代渠道" required>
              <Select
                options={activeSegmentQuoteForwarderSelectOptions}
                value={selectedSegmentQuoteOption.forwarderCode}
                placeholder="选择货代"
                onChange={handleSelectBulkQuoteForwarder}
              />
            </Form.Item>
            <Form.Item label="渠道" required>
              <Select
                options={activeSegmentQuoteChannelSelectOptions}
                value={selectedSegmentQuoteOption.routeCode}
                placeholder="选择渠道"
                disabled={!selectedSegmentQuoteOption.forwarderCode}
                onChange={handleSelectBulkQuoteChannel}
              />
            </Form.Item>
          </div>
          <Form.Item label="报价单价" required>
            <div className="warehouse-shipping-order-bulk-quote-price">
              <Input
                inputMode="decimal"
                value={bulkQuoteUnitPrice}
                placeholder="输入统一单价"
                onChange={(event) => setBulkQuoteUnitPrice(event.target.value)}
              />
              <Text type="secondary" className="warehouse-shipping-order-price-unit">
                {quoteUnitDisplayText(activeDetailSegment?.transportMode || selectedQuoteLines[0]?.plannedTransportMode)}
              </Text>
            </div>
          </Form.Item>
          {showYiteQuoteFields ? (
            <Form.Item label="义特材质">
              <Select
                allowClear
                options={YITE_MATERIAL_OPTIONS}
                value={bulkQuoteYiteMaterial}
                placeholder="不修改现有材质"
                onChange={(value) => setBulkQuoteYiteMaterial(value)}
              />
            </Form.Item>
          ) : null}
        </div>
      </Modal>

      <Modal
        title="新增仓库单"
        open={createModalOpen}
        width={860}
        onCancel={() => setCreateModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!selectedSourceOrderIds.length}
            loading={actionKey === 'create-shipping-order'}
            onClick={() => void handleCreateShippingOrder()}
          >
            创建仓库单
          </Button>
        ]}
      >
        <div className="warehouse-shipping-order-create-modal">
          <Alert
            type="info"
            showIcon
            message={`只显示已提交采购单。已选 ${selectedSourceOrders.length} 单，合计 ${formatQuantity(sumPurchaseOrderQuantity(selectedSourceOrders))} 件。`}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索采购单 / SKU"
            value={sourceKeyword}
            onChange={(event) => setSourceKeyword(event.target.value)}
          />
          <Table<PurchaseOrder>
            size="small"
            rowKey="id"
            rowSelection={sourceOrderSelection}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            columns={[
              {
                title: '采购单',
                dataIndex: 'title',
                render: (_, order) => (
                  <div className="warehouse-shipping-order-source-name">
                    <Text strong>{order.title || order.orderNo}</Text>
                    <Text type="secondary">{order.orderNo}</Text>
                  </div>
                )
              },
              {
                title: '店铺',
                dataIndex: 'storeName',
                width: 150,
                render: (_, order) => order.storeName || order.storeCode
              },
              {
                title: 'SKU',
                width: 90,
                render: (_, order) => countPurchaseOrderSku(order)
              },
              {
                title: '数量',
                width: 100,
                render: (_, order) => formatQuantity(sumPurchaseOrderQuantity([order]))
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 120,
                render: (value) => formatDate(String(value || ''))
              }
            ]}
            dataSource={visiblePurchaseOrders}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已提交采购单" /> }}
          />
        </div>
      </Modal>

      <Modal
        title="导出仓库单审核单"
        open={Boolean(quoteExportTarget)}
        okText={quoteSelectedForwarder?.templateName ? `导出 ${quoteSelectedForwarder.templateName}` : '导出'}
        cancelText="取消"
        okButtonProps={{
          disabled: quoteExportLoading
            || !quoteExportSelection.forwarderCode
            || !quoteExportSelection.routeCode
            || (quoteExportMissingOnly && quoteExportPendingCount <= 0),
          loading: actionKey === `logistics-quote-export:${quoteExportTarget?.id}`
        }}
        onOk={() => void handleExportLogisticsQuoteReport()}
        onCancel={closeLogisticsQuoteExportModal}
        width={720}
      >
        <Spin spinning={quoteExportLoading}>
          {quoteExportableOptions?.forwarders?.length ? (
            <div className="warehouse-shipping-quote-export">
              <Alert
                type={quoteSelectedForwarder && quoteSelectedChannel ? 'success' : 'warning'}
                showIcon
                message={
                  quoteSelectedForwarder && quoteSelectedChannel
                    ? (
                      quoteExportMissingOnly
                        ? `将导出报价缺失 ${quoteExportPendingCount} 行：${quoteChannelLabel(quoteSelectedForwarder, quoteSelectedChannel)}`
                        : `将导出全部 ${quoteExportTotalCount} 行：${quoteChannelLabel(quoteSelectedForwarder, quoteSelectedChannel)}（待报价 ${quoteExportPendingCount}，已报价 ${quoteExportConfirmedCount}）`
                    )
                    : `请先选择货代和渠道，待报价 ${quoteExportOptions?.pendingLineCount || 0} 行，已报价商品会一并导出`
                }
              />
              <div className="warehouse-shipping-quote-export-controls">
                <Form.Item label="选择货代" required>
                  <Select
                    options={quoteForwarderOptions}
                    value={quoteExportSelection.forwarderCode}
                    onChange={handleQuoteExportForwarderChange}
                    placeholder="选择货代"
                    allowClear
                  />
                </Form.Item>
                <Form.Item label="选择渠道" required>
                  <Select
                    options={quoteChannelOptions}
                    value={quoteExportSelection.routeCode}
                    onChange={(routeCode) => setQuoteExportSelection((current) => ({ ...current, routeCode }))}
                    placeholder="选择渠道"
                    disabled={!quoteExportSelection.forwarderCode}
                    allowClear
                  />
                </Form.Item>
              </div>
              <Checkbox
                checked={quoteExportMissingOnly}
                disabled={!quoteSelectedChannel}
                onChange={(event) => setQuoteExportMissingOnly(event.target.checked)}
              >
                只导出报价缺失
              </Checkbox>
              {quoteSelectedChannel ? (
                <div className="warehouse-shipping-quote-export-detail">
                  <Tag color="blue">{quoteForwarderLabel(quoteSelectedForwarder)}</Tag>
                  <Tag color="processing">{quoteSelectedChannel.siteCode || '-'}</Tag>
                  <strong>{quoteExportMissingOnly ? `报价缺失 ${quoteExportPendingCount} 行` : `全部 ${quoteExportTotalCount} 行`}</strong>
                </div>
              ) : null}
              {quoteSelectedForwarder?.templateName ? (
                <Text type="secondary">{quoteSelectedForwarder.templateName}</Text>
              ) : null}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={quoteExportOptions ? quoteExportEmptyDescription(quoteExportOptions) : '正在读取可导出渠道'}
            />
          )}
        </Spin>
      </Modal>
    </div>
  )
}

function filterShippingOrders(orders: ShippingOrder[], keyword: string) {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) {
    return orders
  }
  return orders.filter((order) => {
    const text = [
      order.shippingOrderNo,
      order.title,
      order.forwarderName,
      order.routeName,
      order.remark,
      ...(order.lines || []).flatMap((line) => [
        line.partnerSku,
        line.skuParent,
        line.productTitle,
        line.sourceStoreName,
        line.sourceStoreCode,
        line.purchaseOrderNo
      ])
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(normalized)
  })
}

function shippingOrderLineImageUrl(line: ShippingOrderLine) {
  return line.productImageUrl || undefined
}

function shippingOrderLineTitleCn(line: ShippingOrderLine) {
  return line.productTitleCn || line.productTitle || line.partnerSku || line.pskuCode || '-'
}

function shippingOrderLineTitleEn(line: ShippingOrderLine) {
  return line.productTitleEn || line.productTitle || line.partnerSku || line.pskuCode || '-'
}

function isYiteSegment(segment: ShippingOrderSegment) {
  const text = `${segment.forwarderCode || ''} ${segment.forwarderName || ''}`.trim()
  return /义特|YITE|\bYT\b/i.test(text)
}

function isYiteQuoteForwarder(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption | null) {
  const text = `${forwarder?.forwarderCode || ''} ${forwarder?.forwarderName || ''}`.trim()
  return /义特|YITE|\bYT\b/i.test(text)
}

function isMissingYiteQuoteMaterial(line: ShippingOrderLine) {
  return !line.yiteMaterial?.trim()
}

function isMissingYiteMaterial(line: ShippingOrderLine, yiteSegmentIds: Set<string>) {
  return Boolean(line.shippingOrderSegmentId && yiteSegmentIds.has(line.shippingOrderSegmentId) && !line.yiteMaterial?.trim())
}

function filterPurchaseOrders(orders: PurchaseOrder[], keyword: string) {
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
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(normalized)
  })
}

function countPurchaseOrderSku(order: PurchaseOrder) {
  const skus = new Set<string>()
  for (const item of order.items || []) {
    if (item.partnerSku || item.skuParent) {
      skus.add(item.partnerSku || item.skuParent || '')
    }
  }
  return skus.size
}

function sumPurchaseOrderQuantity(orders: PurchaseOrder[]) {
  return orders.reduce((total, order) => total + (order.items || []).reduce((itemTotal, item) => itemTotal + Number(item.totalQuantity || 0), 0), 0)
}

function shippingOrderStatusMeta(order: ShippingOrder) {
  if (order.shippingSubmitStatus === 'SUBMITTED') {
    return { label: '已提交发货', color: 'green' }
  }
  if (order.quoteStatus === 'CONFIRMED') {
    return { label: '报价已确认', color: 'blue' }
  }
  if (order.quoteStatus === 'EXPORTED') {
    return { label: '已导出', color: 'cyan' }
  }
  return { label: '待报价', color: 'gold' }
}

function isLineQuoteConfirmed(line: ShippingOrderLine) {
  return line.quoteStatus === 'CONFIRMED'
}

function applySelectedChannelQuoteToLine(
  line: ShippingOrderLine,
  channel?: PurchaseOrderLogisticsQuoteChannelOption
): ShippingOrderLine {
  const quote = channel?.lineQuotes?.find((item) => (
    (item.shippingOrderLineId && item.shippingOrderLineId === line.id)
    || (item.purchaseOrderItemSiteId && item.purchaseOrderItemSiteId === line.purchaseOrderItemSiteId)
    || (item.partnerSku && sameCode(item.partnerSku, line.partnerSku))
  ))
  if (!quote) {
    return line
  }
  return {
    ...line,
    quoteStatus: quote.quoteStatus || 'PENDING_QUOTE',
    unitPrice: quote.unitPrice ?? null,
    currency: quote.currency,
    billingUnit: quote.billingUnit,
    yiteMaterial: quote.yiteMaterial ?? line.yiteMaterial
  }
}

function countShippingOrderPendingQuoteLines(order: ShippingOrder) {
  return countShippingOrderPendingQuoteLinesForScope(order, order.segments || [])
}

function countShippingOrderPendingQuoteLinesForScope(order: ShippingOrder, selectedSegments: ShippingOrderSegment[], segmentIds?: string[]) {
  const selectedSegmentIdSet = new Set(segmentIds || [])
  const scopedSegments = selectedSegments.length
    ? selectedSegments
    : selectedSegmentIdSet.size
      ? (order.segments || []).filter((segment) => selectedSegmentIdSet.has(segment.id))
      : (order.segments || [])
  const segmentById = new Map((order.segments || []).map((segment) => [segment.id, segment]))
  if (order.lines?.length) {
    return order.lines
      .filter((line) => !selectedSegmentIdSet.size || selectedSegmentIdSet.has(line.shippingOrderSegmentId || ''))
      .filter((line) => isQuoteBlockingShippingLine(line, segmentById))
      .filter((line) => line.quoteStatus !== 'CONFIRMED').length
  }
  if (scopedSegments.length) {
    return scopedSegments
      .filter((segment) => isQuoteBlockingShippingSegment(segment))
      .reduce((total, segment) => total + Number(segment.pendingQuoteLineCount || 0), 0)
  }
  return order.quoteStatus === 'CONFIRMED' ? 0 : Number(order.lineCount || 0)
}

function isQuoteBlockingShippingLine(line: ShippingOrderLine, segmentById: Map<string, ShippingOrderSegment>) {
  const segment = line.shippingOrderSegmentId ? segmentById.get(line.shippingOrderSegmentId) : undefined
  return segment ? isQuoteBlockingShippingSegment(segment) : true
}

function isQuoteBlockingShippingSegment(segment: ShippingOrderSegment) {
  return !isZdShippingForwarder(segment)
}

function isZdShippingForwarder(target: { forwarderCode?: string; forwarderName?: string; routeCode?: string; routeName?: string }) {
  if (sameCode(target.forwarderCode, 'ZD')) {
    return true
  }
  const routeCode = (target.routeCode || '').trim().toUpperCase()
  const text = `${target.forwarderName || ''} ${target.routeName || ''}`.trim()
  return routeCode === 'ZD'
    || routeCode.startsWith('ZD-')
    || /众鸫|众东/.test(text)
}

function quoteMissingTag(count: number) {
  return count > 0 ? `报价缺失 ${formatQuantity(count)}` : '报价缺失'
}

function renderWarehouseOrderIssueTags(order: ShippingOrder) {
  const missingMaterialCount = Number(order.missingYiteMaterialCount || 0)
  const pendingQuoteCount = countShippingOrderPendingQuoteLines(order)
  if (!missingMaterialCount && !pendingQuoteCount) {
    return <Text type="secondary">无</Text>
  }
  return (
    <div className="warehouse-shipping-order-issue-tags">
      {missingMaterialCount > 0 ? <Tag color="red">材料缺失 {formatQuantity(missingMaterialCount)}</Tag> : null}
      {pendingQuoteCount > 0 ? <Tag color="gold">{quoteMissingTag(pendingQuoteCount)}</Tag> : null}
    </div>
  )
}

function renderDetailSegmentChips(
  segments: ShippingOrderSegment[],
  activeSegment: ShippingOrderSegment | undefined,
  onSelect: (segmentId: string) => void
) {
  return (
    <div className="warehouse-shipping-order-chip-group warehouse-shipping-order-chip-group--route">
      <span className="warehouse-shipping-order-chip-label">站点/运输方式</span>
      <div className="warehouse-shipping-order-chip-row">
        {segments.length ? segments.map((segment) => {
          const label = shippingOrderSegmentTabLabel(segment)
          const active = activeSegment?.id === segment.id
          return (
            <button
              key={segment.id}
              type="button"
              className={[
                'warehouse-shipping-order-chip',
                active ? 'warehouse-shipping-order-chip--active' : ''
              ].filter(Boolean).join(' ')}
              onClick={() => onSelect(String(segment.id))}
            >
              {label}
            </button>
          )
        }) : (
          <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted">暂无子仓库单</span>
        )}
      </div>
    </div>
  )
}

function renderActiveSegmentQuoteControls(
  activeSegmentQuoteOptions: PurchaseOrderLogisticsQuoteOptions | null,
  loading: boolean,
  selectedOption: QuoteExportSelection,
  onSelect: (forwarder: PurchaseOrderLogisticsQuoteForwarderOption, channel: PurchaseOrderLogisticsQuoteChannelOption) => void
) {
  const forwarders = activeSegmentQuoteOptions?.forwarders || []
  const selectedForwarder = findQuoteForwarderOption(activeSegmentQuoteOptions, selectedOption.forwarderCode)
  const selectedChannel = findQuoteChannelOption(selectedForwarder, selectedOption.routeCode)
  const chipActiveClassName = 'warehouse-shipping-order-chip--active'
  return (
    <>
      <div className="warehouse-shipping-order-chip-group">
        <span className="warehouse-shipping-order-chip-label">货代</span>
        <div className="warehouse-shipping-order-chip-row">
          {loading ? (
            <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted"><Spin size="small" /></span>
          ) : forwarders.length ? forwarders.map((forwarder) => {
            const nextChannel = forwarder.channels?.[0]
            const active = selectedForwarder?.forwarderCode === forwarder.forwarderCode
            return (
              <button
                key={forwarder.forwarderCode}
                type="button"
                className={[
                  'warehouse-shipping-order-chip',
                  active ? chipActiveClassName : ''
                ].filter(Boolean).join(' ')}
                disabled={!nextChannel}
                onClick={() => {
                  if (nextChannel) {
                    onSelect(forwarder, nextChannel)
                  }
                }}
              >
                {quoteForwarderLabel(forwarder)}
              </button>
            )
          }) : (
            <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted">暂无货代</span>
          )}
        </div>
      </div>
      <div className="warehouse-shipping-order-chip-group warehouse-shipping-order-chip-group--channel">
        <span className="warehouse-shipping-order-chip-label">渠道</span>
        <div className="warehouse-shipping-order-chip-row">
          {loading ? (
            <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted"><Spin size="small" /></span>
          ) : selectedForwarder?.channels?.length ? selectedForwarder.channels.map((channel) => (
            <button
              key={channel.routeCode}
              type="button"
              className={[
                'warehouse-shipping-order-chip',
                'warehouse-shipping-order-chip--channel',
                selectedChannel?.routeCode === channel.routeCode ? chipActiveClassName : ''
              ].filter(Boolean).join(' ')}
              title={quoteChannelDisplayName(selectedForwarder, channel)}
              onClick={() => onSelect(selectedForwarder, channel)}
            >
              {quoteChannelDisplayName(selectedForwarder, channel)}
            </button>
          )) : (
            <span className="warehouse-shipping-order-chip warehouse-shipping-order-chip--muted">暂无渠道</span>
          )}
        </div>
      </div>
    </>
  )
}

function segmentQuoteOptionChoices(options?: PurchaseOrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).flatMap((forwarder) => (
    (forwarder.channels || []).map((channel) => ({
      forwarder,
      channel
    }))
  ))
}

function defaultSegmentQuoteSelection(
  options: PurchaseOrderLogisticsQuoteOptions,
  segment?: ShippingOrderSegment
): QuoteExportSelection {
  const choices = segmentQuoteOptionChoices(options)
  const currentChoice = choices.find(({ forwarder, channel }) => (
    sameCode(forwarder.forwarderCode, segment?.forwarderCode) && sameCode(channel.routeCode, segment?.routeCode)
  ))
  if (currentChoice) {
    return {
      forwarderCode: currentChoice.forwarder.forwarderCode,
      routeCode: currentChoice.channel.routeCode
    }
  }
  if (choices.length === 1) {
    return {
      forwarderCode: choices[0].forwarder.forwarderCode,
      routeCode: choices[0].channel.routeCode
    }
  }
  return {}
}

function firstAvailableSegmentQuoteSelection(options: PurchaseOrderLogisticsQuoteOptions): QuoteExportSelection {
  const firstChoice = segmentQuoteOptionChoices(options)[0]
  return firstChoice
    ? {
      forwarderCode: firstChoice.forwarder.forwarderCode,
      routeCode: firstChoice.channel.routeCode
    }
    : {}
}

function sameCode(left?: string, right?: string) {
  const normalizedLeft = (left || '').trim().toUpperCase()
  const normalizedRight = (right || '').trim().toUpperCase()
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

function formatQuoteInputValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  return String(value)
}

function defaultQuoteBillingUnit(transportMode?: string) {
  switch ((transportMode || '').toUpperCase()) {
    case 'AIR':
      return 'KG'
    case 'SEA':
      return 'CBM'
    default:
      return 'KG'
  }
}

function quoteUnitDisplayText(transportMode?: string) {
  return `CNY / ${defaultQuoteBillingUnit(transportMode)}`
}

function transportModeLabel(value?: string) {
  switch ((value || '').toUpperCase()) {
    case 'SEA':
      return '海运'
    case 'AIR':
      return '空运'
    case 'EXPRESS':
      return '快递'
    default:
      return value || '-'
  }
}

function shippingOrderSegmentTabLabel(segment: ShippingOrderSegment) {
  return [
    segment.siteCode || '-',
    transportModeLabel(segment.transportMode)
  ].join('-')
}

function sortShippingOrderSegments(segments: ShippingOrderSegment[]) {
  return [...segments].sort((left, right) => {
    const siteDiff = segmentSiteRank(left.siteCode) - segmentSiteRank(right.siteCode)
    if (siteDiff !== 0) {
      return siteDiff
    }
    const transportDiff = segmentTransportRank(left.transportMode) - segmentTransportRank(right.transportMode)
    if (transportDiff !== 0) {
      return transportDiff
    }
    return String(left.segmentNo || '').localeCompare(String(right.segmentNo || ''))
  })
}

function segmentSiteRank(siteCode?: string) {
  switch ((siteCode || '').toUpperCase()) {
    case 'SA':
      return 1
    case 'AE':
      return 2
    default:
      return 10
  }
}

function segmentTransportRank(transportMode?: string) {
  switch ((transportMode || '').toUpperCase()) {
    case 'AIR':
      return 1
    case 'SEA':
      return 2
    case 'EXPRESS':
      return 3
    default:
      return 10
  }
}

function shippingSubmitLabel(value?: string) {
  switch ((value || '').toUpperCase()) {
    case 'SUBMITTED':
      return '已提交'
    default:
      return '未提交'
  }
}

function findQuoteForwarderOption(
  options?: PurchaseOrderLogisticsQuoteOptions | null,
  forwarderCode?: string
) {
  if (!forwarderCode) {
    return undefined
  }
  return options?.forwarders?.find((item) => item.forwarderCode === forwarderCode)
}

function filterQuoteOptionsWithTemplates(
  options?: PurchaseOrderLogisticsQuoteOptions | null
): PurchaseOrderLogisticsQuoteOptions | null {
  if (!options) {
    return null
  }
  return {
    ...options,
    forwarders: (options.forwarders || []).filter(hasQuoteExportTemplate)
  }
}

function hasQuoteExportTemplate(forwarder: PurchaseOrderLogisticsQuoteForwarderOption) {
  return Boolean(forwarder.templateType)
}

function quoteExportEmptyDescription(options: PurchaseOrderLogisticsQuoteOptions) {
  return Number(options.unsupportedChannelCount || 0) > 0
    ? '当前只有未配置导出模板的货代渠道，不能导出审核单。'
    : '当前仓库单没有已配置模板的可导出渠道。'
}

function findQuoteChannelOption(
  forwarder?: PurchaseOrderLogisticsQuoteForwarderOption,
  routeCode?: string
) {
  if (!routeCode) {
    return undefined
  }
  return forwarder?.channels?.find((item) => item.routeCode === routeCode)
}

function buildQuoteForwarderSelectOptions(options?: PurchaseOrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).map((forwarder) => ({
    value: forwarder.forwarderCode,
    label: quoteForwarderLabel(forwarder)
  }))
}

function buildQuoteChannelSelectOptions(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption) {
  return (forwarder?.channels || []).map((channel) => ({
    value: channel.routeCode,
    label: quoteChannelLabel(forwarder, channel)
  }))
}

function quoteForwarderLabel(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption) {
  const text = `${forwarder?.forwarderName || ''} ${forwarder?.forwarderCode || ''}`.trim()
  if (/义特|YITE|YT/i.test(text)) {
    return '义特'
  }
  if (/易通|\bET\b/i.test(text)) {
    return '易通'
  }
  if (/CHIC|QI ?KE|启客/i.test(text)) {
    return 'CHIC'
  }
  return forwarder?.forwarderName || forwarder?.forwarderCode || '-'
}

function quoteChannelDisplayName(
  forwarder: PurchaseOrderLogisticsQuoteForwarderOption | undefined,
  channel: PurchaseOrderLogisticsQuoteChannelOption
) {
  const rawName = (channel.routeName || channel.routeCode || '-').trim()
  const forwarderCandidates = [
    quoteForwarderLabel(forwarder),
    forwarder?.forwarderName,
    simplifiedForwarderName(forwarder?.forwarderName),
    forwarder?.forwarderCode
  ].filter((value): value is string => Boolean(value?.trim()))
  for (const candidate of forwarderCandidates) {
    const trimmedCandidate = candidate.trim()
    if (trimmedCandidate && rawName.toUpperCase().startsWith(trimmedCandidate.toUpperCase())) {
      return rawName.slice(trimmedCandidate.length).replace(/^[\s/｜|:：-]+/, '').trim() || rawName
    }
  }
  return rawName
}

function simplifiedForwarderName(value?: string) {
  return value?.replace(/(物流|供应链)$/u, '').trim()
}

function quoteChannelLabel(
  forwarder: PurchaseOrderLogisticsQuoteForwarderOption | undefined,
  channel: PurchaseOrderLogisticsQuoteChannelOption
) {
  return [
    quoteForwarderLabel(forwarder),
    channel.siteCode || channel.routeCode
  ].filter(Boolean).join(' / ')
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function renderDetailLineFilterLabel(label: string, count: number) {
  const countValue = Number(count || 0)
  return (
    <span className={countValue > 0 ? 'warehouse-shipping-order-detail-filter-danger' : undefined}>
      {label} {formatQuantity(countValue)}
    </span>
  )
}

function formatDate(value?: string) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function quoteImportResultContent(result: PurchaseOrderLogisticsQuoteImportResult) {
  const summary = `识别 ${formatQuantity(Number(result.totalRows || 0))} 行，更新 ${formatQuantity(Number(result.updatedRows || 0))} 行，跳过 ${formatQuantity(Number(result.skippedRows || 0))} 行。`
  const errors = (result.errors || [])
    .slice(0, 6)
    .map((error) => `第 ${error.rowNumber || '-'} 行：${error.message || '未更新'}`)
  if (!errors.length) {
    return <Text>{summary}</Text>
  }
  const moreCount = (result.errors || []).length - errors.length
  return (
    <div className="warehouse-shipping-order-import-result">
      <Text>{summary}</Text>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
      {moreCount > 0 ? <Text type="secondary">其余 {moreCount} 条请检查文件。</Text> : null}
    </div>
  )
}

function quoteImportResultTitle(result: PurchaseOrderLogisticsQuoteImportResult) {
  const updatedRows = Number(result.updatedRows || 0)
  const skippedRows = Number(result.skippedRows || 0)
  if (updatedRows > 0 && skippedRows > 0) {
    return `已回传 ${formatQuantity(updatedRows)} 行，跳过 ${formatQuantity(skippedRows)} 行`
  }
  if (updatedRows > 0) {
    return `已回传 ${formatQuantity(updatedRows)} 行`
  }
  return '报价未更新'
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }
  const rightSet = new Set(right)
  return left.every((value) => rightSet.has(value))
}

function saveBlobFile(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
