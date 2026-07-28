import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  TruckOutlined
} from '@ant-design/icons'
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Progress,
  Alert,
  Select,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message
} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { withPublicBasePath } from '../../runtimePaths'
import { firstFormValidationMessage, normalizeError } from '../../shared/api'
import type { AuthSession } from '../auth/session'
import { fetchProductSpecDetail, saveProductSpecSource } from '../product-specs/api'
import { fetchProductLogisticsProfiles, saveProductLogisticsProfile } from '../product-specs/logisticsProfileApi'
import type {
  ProductLogisticsProfilePayload,
  ProductVariantSpecDetailPayload,
  ProductVariantSpecPayload,
  ProductVariantSpecSourcePayload
} from '../product-specs/types'
import {
  addPurchaseOrderItems,
  createPurchaseOrder,
  createShippingOrder,
  deletePurchaseOrder,
  deletePurchaseOrderItem,
  loadAssignedShippingPurchaseOrderIds,
  loadPurchaseOrderAli1688History,
  loadProductOptions,
  loadPurchaseOrders,
  submitPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderItem,
  updatePurchaseOrderItemSourcingRequirement
} from './api'
import {
  buildProductDataCompletionContext,
  createDefaultProductDataCompletionValues,
  createProductDataLogisticsProfilePayload,
  normalizeOptionalText,
  productDataHasAnyConfirmedLogisticsValue,
  productDataHasAnyProductSpecValue,
  productDataHasCompleteLogisticsValues,
  productDataHasCompleteProductSpecValues,
  productDataLogisticsValuesFromProfile,
  productDataSourcingValuesFromItem,
  productDataSpecValuesFromDetail,
  shouldSaveProductDataLogistics,
  shouldSaveProductDataSourcing,
  shouldSaveProductDataSpec,
  validateProductDataAttributeField,
  validateProductDataNumberField
} from './model/productDataCompletionModel'
import {
  ali1688HistoryEntriesForItem,
  buildAli1688HistoryEntriesFromView,
  displayShortText,
  formatPurchaseAmount,
  latestAli1688Batch,
  recentAli1688OrderNo,
  recentAli1688UnitPrice,
  sortedAli1688History
} from './model/purchaseOrderAli1688Model'
import { summarizeOrderAllocations } from './model/purchaseOrderAllocationModel'
import {
  buildItemTitlePair,
  sameDisplayText
} from './model/purchaseOrderDisplayModel'
import {
  emptyIssueSummary,
  hasSealBlockingIssues,
  isProductDataCompletionIssue,
  issueTagColor,
  itemIssues,
  summarizeOrderIssues
} from './model/purchaseOrderIssueModel'
import {
  allocationDisplayLabel,
  duplicatePskuSiteMessage,
  fulfillmentTypeLabel,
  normalizeFulfillmentType,
  normalizePskuEntries,
  normalizeSiteCode,
  normalizeSiteQuantityEntries,
  normalizeTransportMode
} from './model/purchaseOrderItemCommandModel'
import {
  buildCreateStoreOptions,
  buildProductAutoCompleteOptions,
  createEmptyPskuEntry,
  createEmptySiteQuantityEntry,
  defaultCreateStoreCode,
  defaultCreateStoreSite,
  getCreateStoreSiteOptions,
  getOrderSiteOptions,
  siteCodesFromPskuRows
} from './model/purchaseOrderStoreModel'
import {
  allocationFilterKey,
  buildActiveItemFilter,
  buildItemFilterOptions,
  emptySummary,
  filterOrderItems,
  formatAllocationQuantitySummary,
  formatOrderQuantitySummary,
  isOrderAvailableForShippingMerge,
  isSubmittedOrder,
  summarizeOrder
} from './model/purchaseOrderSummaryModel'
import {
  DEFAULT_SITE_CODES,
  FULFILLMENT_TYPE_OPTIONS,
  ITEM_STATUS_META,
  ORDER_STATUS_META,
  PRODUCT_DATA_CARTON_SPEC_FIELDS,
  PRODUCT_DATA_LOGISTICS_FIELDS,
  PRODUCT_DATA_PRODUCT_SPEC_FIELDS,
  PURCHASE_ORDER_SEAL_WARNING,
  TRANSPORT_MODE_OPTIONS
} from './model/purchaseOrderUiMeta'
import type {
  AddItemsFormValues,
  CreateOrderFormValues,
  DeleteItemTarget,
  ProductDataCompletionFormValues,
  ProductDataCompletionIssue,
  ProductDataCompletionTarget,
  PskuEntryFormValue,
  PurchaseOrderAli1688HistoryEntry,
  UpdateItemFormValues,
  UpdateOrderFormValues
} from './model/purchaseOrderViewTypes'
import { normalizeProductDataNumber } from './productDataCompletionNumbers'
import type {
  PurchaseCollectionStatus,
  PurchaseOrder,
  PurchaseOrderFulfillmentType,
  PurchaseOrderItem,
  PurchaseOrderItemCommand,
  PurchaseOrderItemSiteQuantityCommand,
  ProductOption,
  PurchaseOrderAli1688HistoryBatch,
  PurchaseOrderAli1688HistoryRecord,
  PurchaseOrderAli1688HistorySource,
  PurchaseOrderAli1688HistoryView,
  PurchaseOrderStatus,
  PurchaseSiteCode,
  PurchaseTransportMode
} from './types'
import './PurchaseOrderPage.css'

const { Text } = Typography
type PurchaseOrderPageProps = {
  session?: AuthSession | null
  purchaseOrdersRevision?: number
  onPurchaseOrdersChanged?: () => void
}

export function PurchaseOrderPage({
  session,
  purchaseOrdersRevision,
  onPurchaseOrdersChanged
}: PurchaseOrderPageProps) {
  const { modal, message: appMessage } = AntdApp.useApp()
  const [createOrderForm] = Form.useForm<CreateOrderFormValues>()
  const [editOrderForm] = Form.useForm<UpdateOrderFormValues>()
  const [addItemsForm] = Form.useForm<AddItemsFormValues>()
  const [editItemForm] = Form.useForm<UpdateItemFormValues>()
  const [productDataCompletionForm] = Form.useForm<ProductDataCompletionFormValues>()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editOrderTarget, setEditOrderTarget] = useState<PurchaseOrder | null>(null)
  const [addItemsOrderId, setAddItemsOrderId] = useState<string | null>(null)
  const [editItemTarget, setEditItemTarget] = useState<DeleteItemTarget | null>(null)
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<PurchaseOrder | null>(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState<DeleteItemTarget | null>(null)
  const [actionKey, setActionKey] = useState<string>()
  const [shippingMergeMode, setShippingMergeMode] = useState(false)
  const [selectedShippingMergeOrderIds, setSelectedShippingMergeOrderIds] = useState<string[]>([])
  const [shippingMergeAssignedOrderIds, setShippingMergeAssignedOrderIds] = useState<string[]>([])
  const [shippingMergeAssignmentLoading, setShippingMergeAssignmentLoading] = useState(false)
  const [shippingMergeErrorMessage, setShippingMergeErrorMessage] = useState<string>()
  const [createErrorMessage, setCreateErrorMessage] = useState<string>()
  const [addItemsErrorMessage, setAddItemsErrorMessage] = useState<string>()
  const [editItemErrorMessage, setEditItemErrorMessage] = useState<string>()
  const [productDataCompletionTarget, setProductDataCompletionTarget] = useState<ProductDataCompletionTarget | null>(null)
  const [productDataCompletionLoading, setProductDataCompletionLoading] = useState(false)
  const [productDataCompletionError, setProductDataCompletionError] = useState<string>()
  const [productSearchOptions, setProductSearchOptions] = useState<ProductOption[]>([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const [itemFilterKey, setItemFilterKey] = useState('all')
  const [ali1688HistoryByKey, setAli1688HistoryByKey] = useState<Record<string, PurchaseOrderAli1688HistoryEntry>>({})
  const [ali1688HistoryLoading, setAli1688HistoryLoading] = useState(false)
  const [ali1688HistoryError, setAli1688HistoryError] = useState<string>()
  const productSearchRequestIdRef = useRef(0)
  const ali1688HistoryRequestIdRef = useRef(0)
  const productDataCompletionRequestIdRef = useRef(0)

  const storeCode = session?.currentStore?.storeCode
  const createStoreCode = Form.useWatch('storeCode', createOrderForm)
  const createStoreOptions = useMemo(() => buildCreateStoreOptions(session), [session])
  const createSiteOptions = useMemo(
    () => getCreateStoreSiteOptions(session, createStoreCode),
    [createStoreCode, session]
  )
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
  const addItemsOrder = addItemsOrderId ? orders.find((order) => order.id === addItemsOrderId) : undefined
  const productAutoCompleteOptions = useMemo(
    () => buildProductAutoCompleteOptions(productSearchOptions),
    [productSearchOptions]
  )
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

  function notifyPurchaseOrdersChanged() {
    onPurchaseOrdersChanged?.()
  }

  useEffect(() => {
    setItemFilterKey('all')
  }, [selectedOrder?.id])

  useEffect(() => {
    const requestId = ali1688HistoryRequestIdRef.current + 1
    ali1688HistoryRequestIdRef.current = requestId
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
        if (ali1688HistoryRequestIdRef.current !== requestId) {
          return
        }
        setAli1688HistoryByKey(buildAli1688HistoryEntriesFromView(selectedOrder, view))
      })
      .catch((error) => {
        if (ali1688HistoryRequestIdRef.current !== requestId) {
          return
        }
        setAli1688HistoryByKey({})
        setAli1688HistoryError(error instanceof Error ? error.message : '读取 1688 采购历史失败')
      })
      .finally(() => {
        if (ali1688HistoryRequestIdRef.current === requestId) {
          setAli1688HistoryLoading(false)
        }
      })
  }, [selectedOrder])

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
  const submittedVisibleOrders = useMemo(
    () => visibleOrders.filter(isSubmittedOrder),
    [visibleOrders]
  )
  const shippingMergeAssignedOrderIdSet = useMemo(
    () => new Set(shippingMergeAssignedOrderIds),
    [shippingMergeAssignedOrderIds]
  )
  const availableShippingMergeOrders = useMemo(
    () => visibleOrders.filter((order) => isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)),
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
    () => selectedShippingMergeOrders.reduce((sum, order) => sum + summarizeOrder(order).totalQuantity, 0),
    [selectedShippingMergeOrders]
  )

  useEffect(() => {
    setSelectedShippingMergeOrderIds((current) => current.filter((orderId) => {
      const order = orders.find((candidate) => candidate.id === orderId)
      return order && isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)
    }))
  }, [orders, shippingMergeAssignedOrderIdSet])

  function handleSelectOrder(order: PurchaseOrder) {
    setSelectedOrderId(order.id)
    if (!shippingMergeMode) {
      return
    }
    if (!isSubmittedOrder(order)) {
      message.warning('采购单封存后才可合并为仓库单。')
      return
    }
    if (shippingMergeAssignedOrderIdSet.has(order.id)) {
      message.warning('该采购单已在仓库单中，不能重复合并。')
      return
    }
    setSelectedShippingMergeOrderIds((current) => current.includes(order.id)
      ? current.filter((orderId) => orderId !== order.id)
      : [...current, order.id])
  }

  function handleOrderCardKeyDown(event: KeyboardEvent<HTMLElement>, order: PurchaseOrder) {
    if (event.target !== event.currentTarget) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelectOrder(order)
    }
  }

  function openCreateOrderModal() {
    const defaultStoreCode = defaultCreateStoreCode(session) || storeCode || ''
    const defaultSite = defaultCreateStoreSite(session, defaultStoreCode)
    createOrderForm.setFieldsValue({
      storeCode: defaultStoreCode,
      title: '',
      remark: '',
      items: [createEmptyPskuEntry(defaultSite)]
    })
    clearProductSearchOptions()
    setCreateErrorMessage(undefined)
    setCreateModalOpen(true)
  }

  async function openShippingMergeMode() {
    if (!submittedVisibleOrders.length) {
      message.warning('当前列表没有已封存采购单。')
      return
    }
    setShippingMergeAssignmentLoading(true)
    setShippingMergeErrorMessage(undefined)
    let assignedOrderIds = new Set(shippingMergeAssignedOrderIds)
    try {
      assignedOrderIds = await loadShippingMergeAssignedOrderIds()
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
      return selectedOrder && nextAvailableOrders.some((order) => order.id === selectedOrder.id) ? [selectedOrder.id] : []
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
      setActionKey((current) => (current === 'create-shipping-order-selection' ? undefined : current))
    }
  }

  async function loadShippingMergeAssignedOrderIds() {
    return new Set(await loadAssignedShippingPurchaseOrderIds())
  }

  function handleCreateStoreChange(nextStoreCode: string) {
    const nextSite = defaultCreateStoreSite(session, nextStoreCode)
    const currentItems = createOrderForm.getFieldValue('items') as PskuEntryFormValue[] | undefined
    createOrderForm.setFieldsValue({
      items: currentItems?.length
        ? currentItems.map((item) => ({ ...item, site: nextSite }))
        : [createEmptyPskuEntry(nextSite)]
    })
    clearProductSearchOptions()
    setCreateErrorMessage(undefined)
  }

  function closeCreateOrderModal() {
    setCreateModalOpen(false)
    setCreateErrorMessage(undefined)
    clearProductSearchOptions()
    createOrderForm.resetFields()
  }

  function openEditOrderModal(order: PurchaseOrder) {
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    editOrderForm.setFieldsValue({
      title: order.title,
      remark: order.remark || ''
    })
    setEditOrderTarget(order)
  }

  function closeEditOrderModal() {
    setEditOrderTarget(null)
    editOrderForm.resetFields()
  }

  async function handleCreateOrder() {
    try {
      const values = await createOrderForm.validateFields()
      if (!values.storeCode) {
        message.warning('请先选择店铺。')
        return
      }
      const items = normalizePskuEntries(values.items)
      const duplicateMessage = duplicatePskuSiteMessage(items)
      if (duplicateMessage) {
        setCreateErrorMessage(duplicateMessage)
        message.warning(duplicateMessage)
        return
      }
      setCreateErrorMessage(undefined)
      setActionKey('create-order')
      const nextOrder = await createPurchaseOrder({
        storeCode: values.storeCode,
        title: values.title.trim(),
        remark: values.remark?.trim() || undefined,
        siteCodes: siteCodesFromPskuRows(values.items),
        items
      })
      setOrders((current) => [nextOrder, ...current.filter((order) => order.id !== nextOrder.id)])
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      closeCreateOrderModal()
      message.success('已创建采购单。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      if (validationMessage) {
        setCreateErrorMessage(validationMessage)
        message.warning(validationMessage)
      } else {
        const errorMessage = normalizeError(error, '创建采购单失败')
        setCreateErrorMessage(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      setActionKey((current) => (current === 'create-order' ? undefined : current))
    }
  }

  async function handleSaveOrderHeader() {
    if (!editOrderTarget) {
      return
    }
    const currentActionKey = `edit-order:${editOrderTarget.id}`
    setActionKey(currentActionKey)
    try {
      const values = await editOrderForm.validateFields()
      const nextOrder = await updatePurchaseOrder(editOrderTarget.id, {
        title: values.title.trim(),
        remark: values.remark?.trim() || undefined
      })
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      closeEditOrderModal()
      message.success('已保存采购单。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      message.error(validationMessage || normalizeError(error, '保存采购单失败'))
    } finally {
      setActionKey((current) => (current === currentActionKey ? undefined : current))
    }
  }

  function handleSubmitOrder(order: PurchaseOrder) {
    if (!order.items?.length) {
      appMessage.warning('当前采购单还没有商品。')
      return
    }
    const issueSummary = summarizeOrderIssues(order)
    if (hasSealBlockingIssues(issueSummary)) {
      appMessage.warning('请先补齐采购单的站点运输和数量信息后再封存。')
      return
    }
    const incompleteItems = order.items.filter((item) => (
      item.productSpecComplete === false || item.logisticsAttributeComplete === false
    ))
    if (incompleteItems.length) {
      const firstItem = incompleteItems[0]
      appMessage.warning(`还有 ${incompleteItems.length} 个商品缺少产品规格或商品属性，请先补齐后再封存。示例：${firstItem.partnerSku || firstItem.skuParent}`)
      return
    }
    const sealWarning = issueSummary.missingCartonSpecCount
      ? `${PURCHASE_ORDER_SEAL_WARNING} 当前有 ${issueSummary.missingCartonSpecCount} 个商品箱规缺失；箱规缺失仅提示，不阻塞本次封存。`
      : PURCHASE_ORDER_SEAL_WARNING
    modal.confirm({
      title: '封存采购单',
      content: sealWarning,
      okText: '确认封存',
      cancelText: '取消',
      onOk: () => sealPurchaseOrder(order)
    })
  }

  async function sealPurchaseOrder(order: PurchaseOrder) {
    setActionKey(`submit-order:${order.id}`)
    try {
      const nextOrder = await submitPurchaseOrder(order.id)
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      appMessage.success('采购单已封存。')
    } catch (error) {
      appMessage.error(normalizeError(error, '封存采购单失败'))
    } finally {
      setActionKey((current) => (current === `submit-order:${order.id}` ? undefined : current))
    }
  }

  function openFirstProductDataIssue(issue: ProductDataCompletionIssue) {
    if (!selectedOrder) {
      return
    }
    const firstItem = (selectedOrder.items || []).find((item) => itemIssues(item).includes(issue))
    if (!firstItem) {
      return
    }
    openProductDataCompletionModal(selectedOrder, firstItem, issue)
  }

  function openProductDataCompletionModal(
    order: PurchaseOrder,
    item: PurchaseOrderItem,
    issue?: string
  ) {
    if (!isProductDataCompletionIssue(issue)) {
      return
    }
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改商品资料。')
      return
    }
    const target: ProductDataCompletionTarget = { order, item, focusIssue: issue }
    setProductDataCompletionTarget(target)
    setProductDataCompletionError(undefined)
    productDataCompletionForm.setFieldsValue({
      ...createDefaultProductDataCompletionValues(),
      ...productDataSourcingValuesFromItem(item)
    })
    void loadProductDataCompletionSnapshot(target)
  }

  function closeProductDataCompletionModal() {
    productDataCompletionRequestIdRef.current += 1
    setProductDataCompletionTarget(null)
    setProductDataCompletionLoading(false)
    setProductDataCompletionError(undefined)
    productDataCompletionForm.resetFields()
  }

  async function loadProductDataCompletionSnapshot(target: ProductDataCompletionTarget) {
    const requestId = productDataCompletionRequestIdRef.current + 1
    productDataCompletionRequestIdRef.current = requestId
    const context = buildProductDataCompletionContext(target.order, target.item, session)
    if (!context.storeCode || !context.partnerSku) {
      setProductDataCompletionError('缺少店铺或 PSKU，暂不能读取当前商品资料。')
      return
    }
    setProductDataCompletionLoading(true)
    const errors: string[] = []
    try {
      const [specResult, logisticsResult] = await Promise.allSettled([
        fetchProductSpecDetail(context),
        context.ownerUserId
          ? fetchProductLogisticsProfiles({
            ownerUserId: context.ownerUserId,
            storeCode: context.storeCode,
            partnerSku: context.partnerSku,
            currentZCode: context.currentZCode,
            skuParent: context.currentZCode
          })
          : Promise.resolve(undefined)
      ])
      if (productDataCompletionRequestIdRef.current !== requestId) {
        return
      }
      const nextValues: ProductDataCompletionFormValues = {}
      if (specResult.status === 'fulfilled') {
        Object.assign(nextValues, productDataSpecValuesFromDetail(specResult.value))
      } else {
        errors.push(normalizeError(specResult.reason, '产品规格读取失败'))
      }
      if (logisticsResult.status === 'fulfilled') {
        Object.assign(nextValues, productDataLogisticsValuesFromProfile(logisticsResult.value?.items?.[0]))
      } else {
        errors.push(normalizeError(logisticsResult.reason, '商品属性读取失败'))
      }
      productDataCompletionForm.setFieldsValue({
        ...createDefaultProductDataCompletionValues(),
        ...productDataSourcingValuesFromItem(target.item),
        ...nextValues
      })
      setProductDataCompletionError(errors.length ? errors.join('；') : undefined)
    } finally {
      if (productDataCompletionRequestIdRef.current === requestId) {
        setProductDataCompletionLoading(false)
      }
    }
  }

  async function handleSaveProductDataCompletion() {
    if (!productDataCompletionTarget) {
      return
    }
    const target = productDataCompletionTarget
    const action = `product-data-completion:${target.item.id}`
    const context = buildProductDataCompletionContext(target.order, target.item, session)
    if (!context.storeCode || !context.partnerSku) {
      appMessage.warning('缺少店铺或 PSKU，不能保存商品资料。')
      return
    }
    setActionKey(action)
    try {
      const values = await productDataCompletionForm.validateFields()
      if (productDataHasAnyProductSpecValue(values) && !productDataHasCompleteProductSpecValues(values)) {
        appMessage.warning('产品规格需要完整填写商品长宽高重。')
        return
      }
      if (productDataHasAnyConfirmedLogisticsValue(values) && !productDataHasCompleteLogisticsValues(values)) {
        appMessage.warning('商品属性需要七项全部选择明确值。')
        return
      }
      const saveSpec = shouldSaveProductDataSpec(values)
      const saveLogistics = shouldSaveProductDataLogistics(target.item, values)
      const saveSourcing = shouldSaveProductDataSourcing(target.item, values)
      if (!saveSourcing && !saveSpec && !saveLogistics) {
        appMessage.warning('没有需要保存的商品资料。')
        return
      }
      if (saveSourcing) {
        const nextOrder = await updatePurchaseOrderItemSourcingRequirement(target.order.id, target.item.id, {
          sourcingSpec: normalizeOptionalText(values.sourcingSpec),
          sourcingSize: normalizeOptionalText(values.sourcingSize),
          sourcingColor: normalizeOptionalText(values.sourcingColor)
        })
        replaceOrder(nextOrder)
      }
      if (saveSpec) {
        const source = await saveProductSpecSource({
          ownerUserId: context.ownerUserId,
          storeCode: context.storeCode,
          variantId: context.variantId,
          partnerSku: context.partnerSku,
          currentZCode: context.currentZCode,
          skuParent: context.currentZCode,
          sourceType: 'ali1688',
          productLengthCm: normalizeProductDataNumber(values.productLengthCm),
          productWidthCm: normalizeProductDataNumber(values.productWidthCm),
          productHeightCm: normalizeProductDataNumber(values.productHeightCm),
          productWeightG: normalizeProductDataNumber(values.productWeightG),
          cartonLengthCm: normalizeProductDataNumber(values.cartonLengthCm),
          cartonWidthCm: normalizeProductDataNumber(values.cartonWidthCm),
          cartonHeightCm: normalizeProductDataNumber(values.cartonHeightCm),
          cartonWeightKg: normalizeProductDataNumber(values.cartonWeightKg),
          cartonQuantity: normalizeProductDataNumber(values.cartonQuantity),
          cartonSourceType: 'factory_carton'
        })
        if (!source.sourceId) {
          throw new Error('商品规格保存后缺少来源编号。')
        }
      }
      if (saveLogistics) {
        await saveProductLogisticsProfile({
          ...createProductDataLogisticsProfilePayload(target.order, target.item, values),
          ownerUserId: context.ownerUserId,
          storeCode: context.storeCode,
          variantId: context.variantId,
          partnerSku: context.partnerSku,
          currentZCode: context.currentZCode
        })
      }
      await loadOrders()
      setSelectedOrderId(target.order.id)
      closeProductDataCompletionModal()
      appMessage.success('商品资料已保存。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      appMessage.error(validationMessage || normalizeError(error, '保存商品资料失败'))
    } finally {
      setActionKey((current) => (current === action ? undefined : current))
    }
  }

  function openAddItemsModal(order: PurchaseOrder) {
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    const defaultSite = getOrderSiteOptions(order, session)[0]?.value || DEFAULT_SITE_CODES[0]
    addItemsForm.setFieldsValue({
      items: [createEmptyPskuEntry(defaultSite)]
    })
    clearProductSearchOptions()
    setAddItemsErrorMessage(undefined)
    setAddItemsOrderId(order.id)
  }

  function closeAddItemsModal() {
    setAddItemsOrderId(null)
    setAddItemsErrorMessage(undefined)
    clearProductSearchOptions()
    addItemsForm.resetFields()
  }

  function clearProductSearchOptions() {
    productSearchRequestIdRef.current += 1
    setProductSearchOptions([])
    setProductSearchLoading(false)
  }

  const handleProductSearch = useCallback(async (targetStoreCode: string | undefined, keywordValue: string) => {
    const requestId = productSearchRequestIdRef.current + 1
    productSearchRequestIdRef.current = requestId
    const nextKeyword = keywordValue.trim()
    if (!targetStoreCode || !nextKeyword) {
      setProductSearchOptions([])
      setProductSearchLoading(false)
      return
    }

    setProductSearchLoading(true)
    try {
      const options = await loadProductOptions({ storeCode: targetStoreCode, keyword: nextKeyword })
      if (productSearchRequestIdRef.current === requestId) {
        setProductSearchOptions(options)
      }
    } catch (error) {
      if (productSearchRequestIdRef.current === requestId) {
        setProductSearchOptions([])
        message.error(error instanceof Error ? error.message : '读取商品档案失败')
      }
    } finally {
      if (productSearchRequestIdRef.current === requestId) {
        setProductSearchLoading(false)
      }
    }
  }, [])

  function openEditItemModal(order: PurchaseOrder, item: PurchaseOrderItem) {
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    const defaultSite = getOrderSiteOptions(order, session)[0]?.value || DEFAULT_SITE_CODES[0]
    editItemForm.setFieldsValue({
      psku: item.partnerSku,
      fulfillmentType: normalizeFulfillmentType(item.fulfillmentType),
      fulfillmentSourceName: item.fulfillmentSourceName,
      siteQuantities: item.allocations?.length
        ? item.allocations.map((allocation) => ({
          siteCode: allocation.site,
          transportMode: normalizeTransportMode(allocation.transportMode),
          quantity: allocation.quantity
        }))
        : [createEmptySiteQuantityEntry(defaultSite)]
    })
    setEditItemErrorMessage(undefined)
    setEditItemTarget({ order, item })
  }

  function closeEditItemModal() {
    setEditItemTarget(null)
    setEditItemErrorMessage(undefined)
    editItemForm.resetFields()
  }

  async function handleAddItemsToOrder() {
    try {
      if (!addItemsOrder) {
        return
      }
      if (isSubmittedOrder(addItemsOrder)) {
        message.warning('采购单已封存，不能再更改。')
        return
      }
      const values = await addItemsForm.validateFields()
      const items = normalizePskuEntries(values.items)
      if (!items.length) {
        message.warning('请至少添加一行 PSKU、站点、运输方式和数量。')
        return
      }
      const duplicateMessage = duplicatePskuSiteMessage(items, addItemsOrder)
      if (duplicateMessage) {
        setAddItemsErrorMessage(duplicateMessage)
        message.warning(duplicateMessage)
        return
      }
      setAddItemsErrorMessage(undefined)
      setActionKey(`add-items:${addItemsOrder.id}`)
      const nextOrder = await addPurchaseOrderItems(addItemsOrder.id, { items })
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      closeAddItemsModal()
      message.success('已添加商品。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      if (validationMessage) {
        setAddItemsErrorMessage(validationMessage)
        message.warning(validationMessage)
      } else {
        const errorMessage = normalizeError(error, '添加商品失败')
        setAddItemsErrorMessage(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      setActionKey((current) => (current === `add-items:${addItemsOrder?.id}` ? undefined : current))
    }
  }

  async function handleUpdateItem() {
    if (!editItemTarget) {
      return
    }
    const { order, item } = editItemTarget
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      return
    }
    const currentActionKey = `edit-item:${item.id}`
    setActionKey(currentActionKey)
    try {
      const values = await editItemForm.validateFields()
      const siteQuantities = normalizeSiteQuantityEntries(values.siteQuantities)
      if (!siteQuantities.length) {
        message.warning('请至少保留一条站点数量。')
        return
      }
      setEditItemErrorMessage(undefined)
      const nextOrder = await updatePurchaseOrderItem(order.id, item.id, {
        psku: item.partnerSku,
        fulfillmentType: normalizeFulfillmentType(values.fulfillmentType),
        fulfillmentSourceName: values.fulfillmentSourceName?.trim() || undefined,
        siteQuantities
      })
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      closeEditItemModal()
      message.success('已保存商品。')
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error)
      if (validationMessage) {
        setEditItemErrorMessage(validationMessage)
        message.warning(validationMessage)
      } else {
        const errorMessage = normalizeError(error, '保存商品失败')
        setEditItemErrorMessage(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      setActionKey((current) => (current === currentActionKey ? undefined : current))
    }
  }

  async function handleDeleteOrder() {
    if (!deleteTargetOrder) {
      return
    }
    if (isSubmittedOrder(deleteTargetOrder)) {
      message.warning('采购单已封存，不能再更改。')
      setDeleteTargetOrder(null)
      return
    }
    const targetId = deleteTargetOrder.id
    setActionKey(`delete:${targetId}`)
    try {
      await deletePurchaseOrder(targetId)
      setOrders((current) => {
        const nextOrders = current.filter((order) => order.id !== targetId)
        if (selectedOrderId === targetId) {
          setSelectedOrderId(nextOrders[0]?.id)
        }
        return nextOrders
      })
      if (addItemsOrderId === targetId) {
        closeAddItemsModal()
      }
      if (editItemTarget?.order.id === targetId) {
        closeEditItemModal()
      }
      notifyPurchaseOrdersChanged()
      setDeleteTargetOrder(null)
      message.success('已删除采购单。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除采购单失败')
    } finally {
      setActionKey(undefined)
    }
  }

  async function handleDeleteItem() {
    if (!deleteTargetItem) {
      return
    }
    const { order, item } = deleteTargetItem
    if (isSubmittedOrder(order)) {
      message.warning('采购单已封存，不能再更改。')
      setDeleteTargetItem(null)
      return
    }
    const currentActionKey = `delete-item:${item.id}`
    setActionKey(currentActionKey)
    try {
      const nextOrder = await deletePurchaseOrderItem(order.id, item.id)
      replaceOrder(nextOrder)
      setSelectedOrderId(nextOrder.id)
      notifyPurchaseOrdersChanged()
      if (editItemTarget?.item.id === item.id) {
        closeEditItemModal()
      }
      setDeleteTargetItem(null)
      message.success('已删除商品行。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除商品失败')
    } finally {
      setActionKey((current) => (current === currentActionKey ? undefined : current))
    }
  }

  function replaceOrder(nextOrder: PurchaseOrder) {
    setOrders((current) => current.map((order) => (order.id === nextOrder.id ? nextOrder : order)))
  }

  return (
    <div className="purchase-order-page" data-testid="purchase-order-page">
      <Spin spinning={loading}>
        <div className="purchase-order-layout">
          <aside className="purchase-order-sidebar">
            <div className="purchase-order-sidebar-tools">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索采购单 / SKU"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="purchase-order-search"
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateOrderModal} disabled={!createStoreOptions.length}>
                新建采购单
              </Button>
            </div>
            {shippingMergeMode ? (
              <div className="purchase-order-shipping-merge-panel">
                <div className="purchase-order-shipping-merge-summary">
                  <div>
                    <Text strong>已选 {selectedShippingMergeOrders.length} 单</Text>
                    <Text type="secondary"> / 可选 {availableShippingMergeOrders.length} 单</Text>
                  </div>
                  <Text type="secondary">{selectedShippingMergeTotalQuantity} 件</Text>
                </div>
                {shippingMergeErrorMessage ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={shippingMergeErrorMessage}
                    className="purchase-order-shipping-merge-alert"
                  />
                ) : null}
                <div className="purchase-order-shipping-merge-actions">
                  <Button size="small" onClick={closeShippingMergeMode}>
                    取消
                  </Button>
                  <Button
                    size="small"
                    onClick={handleSelectAllVisibleSubmittedOrders}
                    disabled={
                      shippingMergeAssignmentLoading
                      || !availableShippingMergeOrders.length
                      || selectedShippingMergeOrders.length === availableShippingMergeOrders.length
                    }
                  >
                    全选已封存
                  </Button>
                  <Button
                    size="small"
                    onClick={handleClearShippingMergeSelection}
                    disabled={!selectedShippingMergeOrders.length}
                  >
                    清空
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<TruckOutlined />}
                    disabled={shippingMergeAssignmentLoading || !selectedShippingMergeOrders.length}
                    loading={actionKey === 'create-shipping-order-selection'}
                    onClick={() => void handleCreateShippingOrderFromSelection()}
                  >
                    创建仓库单
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                block
                icon={<TruckOutlined />}
                className="purchase-order-shipping-link"
                loading={shippingMergeAssignmentLoading}
                onClick={() => void openShippingMergeMode()}
              >
                多选合并为仓库单
              </Button>
            )}
            {visibleOrders.length ? (
              visibleOrders.map((order) => {
                const summary = orderSummaries.get(order.id) || emptySummary()
                const meta = ORDER_STATUS_META[summary.status] || ORDER_STATUS_META.draft
                const submitted = isSubmittedOrder(order)
                const alreadyAssigned = shippingMergeAssignedOrderIdSet.has(order.id)
                const availableForShippingMerge = isOrderAvailableForShippingMerge(order, shippingMergeAssignedOrderIdSet)
                const selectedForShippingMerge = selectedShippingMergeOrderIds.includes(order.id)
                return (
                  <article
                    className={`purchase-order-card${shippingMergeMode ? ' is-merge-mode' : ''}${order.id === selectedOrder?.id ? ' is-active' : ''}${selectedForShippingMerge ? ' is-merge-selected' : ''}${shippingMergeMode && !availableForShippingMerge ? ' is-merge-disabled' : ''}`}
                    key={order.id}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={order.id === selectedOrder?.id}
                      className="purchase-order-card-select"
                      onClick={() => handleSelectOrder(order)}
                      onKeyDown={(event) => handleOrderCardKeyDown(event, order)}
                    >
                      {shippingMergeMode ? (
                        <div
                          className="purchase-order-merge-row"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            className="purchase-order-merge-checkbox"
                            checked={selectedForShippingMerge}
                            disabled={!availableForShippingMerge}
                            aria-label={`选择${order.title}`}
                            onChange={(event) => handleToggleShippingMergeOrder(order, event.target.checked)}
                          >
                            选择
                          </Checkbox>
                          <Tag color={availableForShippingMerge ? 'blue' : 'default'} className="purchase-order-merge-status">
                            {availableForShippingMerge ? '已封存可合并' : alreadyAssigned ? '已在仓库单' : '未封存不可合并'}
                          </Tag>
                        </div>
                      ) : null}
                      <div className="purchase-order-card-top">
                        <div className="purchase-order-card-titleline">
                          <Text strong ellipsis className="purchase-order-card-title">{order.title}</Text>
                          <Tooltip title={meta.label}>
                            <Tag icon={meta.icon} color={meta.color} className="purchase-order-status-tag" />
                          </Tooltip>
                        </div>
                        <div className="purchase-order-card-tools">
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            aria-label="编辑采购单"
                            title="编辑采购单"
                            disabled={submitted}
                            className="purchase-order-card-icon-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditOrderModal(order)
                            }}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label="删除采购单"
                            title="删除采购单"
                            disabled={submitted}
                            className="purchase-order-card-icon-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteTargetOrder(order)
                            }}
                          />
                        </div>
                      </div>
                      <div className="purchase-order-card-meta">
                        <span>{order.createdAt?.slice(5, 10) || order.orderNo}</span>
                        <span>商品 {summary.itemCount}</span>
                        <span>SKU {summary.skuCount}</span>
                        <span>{summary.totalQuantity} 件</span>
                        <span>{summary.progress}%</span>
                      </div>
                      <Progress percent={summary.progress} size="small" showInfo={false} />
                    </div>
                  </article>
                )
              })
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无采购单" />
            )}
          </aside>

          <main className="purchase-order-workbench">
            <section className="purchase-order-items">
              {selectedOrder ? (
                <div className="purchase-order-detail-toolbar">
                  <div className="purchase-order-detail-main">
                    <div className="purchase-order-detail-summary">
                      <Text strong ellipsis className="purchase-order-detail-title">{selectedOrder.title}</Text>
                      <span>{formatOrderQuantitySummary(selectedOrderSummary)}</span>
                    </div>
                    {selectedOrderAllocationSummary.length ? (
                      <div className="purchase-order-allocation-summary" aria-label="按站点和运输方式汇总">
                        <span className="purchase-order-allocation-summary-label">站点运输</span>
                        {selectedOrderAllocationSummary.map((allocation) => (
                          <button
                            type="button"
                            className={`purchase-site-chip purchase-order-summary-chip${itemFilterKey === allocationFilterKey(allocation.site, allocation.transportMode) ? ' is-active' : ''}`}
                            key={`${allocation.site}:${allocation.transportMode || 'UNSPECIFIED'}`}
                            onClick={() => setItemFilterKey(allocationFilterKey(allocation.site, allocation.transportMode))}
                          >
                            <span>{allocationDisplayLabel(allocation)}</span>
                            <strong>{formatAllocationQuantitySummary(allocation)}</strong>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="purchase-order-detail-actions">
                    {isSubmittedOrder(selectedOrder) ? null : (
                      <Button
                        size="small"
                        type="primary"
                        icon={<SendOutlined />}
                        loading={actionKey === `submit-order:${selectedOrder.id}`}
                        onClick={() => void handleSubmitOrder(selectedOrder)}
                      >
                        封存采购单
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      disabled={isSubmittedOrder(selectedOrder)}
                      onClick={() => openAddItemsModal(selectedOrder)}
                    >
                      添加商品
                    </Button>
                  </div>
                </div>
              ) : null}
              {selectedOrder ? (
                <div className="purchase-order-inspection-panel">
                  <div className="purchase-order-filter-bar" data-testid="purchase-order-filter-bar">
                    {itemFilterOptions.map((option) => (
                      <Button
                        key={option.key}
                        size="small"
                        type={itemFilterKey === option.key ? 'primary' : 'default'}
                        onClick={() => setItemFilterKey(option.key)}
                      >
                        {option.label} {option.count}
                      </Button>
                    ))}
                    {activeItemFilter ? (
                      <Text type="secondary" className="purchase-order-active-filter" data-testid="purchase-order-active-filter">
                        当前 {activeItemFilter.label}
                      </Text>
                    ) : null}
                  </div>
                  <div className="purchase-order-issue-summary" data-testid="purchase-order-issue-summary">
                    {selectedOrderIssueSummary.issueItemCount ? (
                      <>
                        {selectedOrderIssueSummary.missingImageCount ? (
                          <span>缺图片 {selectedOrderIssueSummary.missingImageCount}</span>
                        ) : null}
                        {selectedOrderIssueSummary.missingAllocationCount ? (
                          <span>无站点运输 {selectedOrderIssueSummary.missingAllocationCount}</span>
                        ) : null}
                        {selectedOrderIssueSummary.missingTransportCount ? (
                          <span>运输方式未指定 {selectedOrderIssueSummary.missingTransportCount}</span>
                        ) : null}
                        {selectedOrderIssueSummary.quantityIssueCount ? (
                          <span>数量异常 {selectedOrderIssueSummary.quantityIssueCount}</span>
                        ) : null}
                        {selectedOrderIssueSummary.missingProductSpecCount ? (
                          <button
                            type="button"
                            className="purchase-order-issue-action is-blocking"
                            onClick={() => openFirstProductDataIssue('产品规格缺失')}
                          >
                            产品规格缺失 {selectedOrderIssueSummary.missingProductSpecCount}
                          </button>
                        ) : null}
                        {selectedOrderIssueSummary.missingCartonSpecCount ? (
                          <button
                            type="button"
                            className="purchase-order-issue-action"
                            onClick={() => openFirstProductDataIssue('箱规缺失')}
                          >
                            箱规缺失 {selectedOrderIssueSummary.missingCartonSpecCount}
                          </button>
                        ) : null}
                        {selectedOrderIssueSummary.missingLogisticsAttributeCount ? (
                          <button
                            type="button"
                            className="purchase-order-issue-action is-blocking"
                            onClick={() => openFirstProductDataIssue('商品属性缺失')}
                          >
                            商品属性缺失 {selectedOrderIssueSummary.missingLogisticsAttributeCount}
                          </button>
                        ) : null}
                        {selectedOrderIssueSummary.collectionFailedCount ? (
                          <span>采集失败 {selectedOrderIssueSummary.collectionFailedCount}</span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Tag color="success">基础信息正常</Tag>
                        <span>产品规格和商品属性完整，箱规可按需维护</span>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
              {selectedOrder?.items?.length ? (
                <div className="purchase-item-list">
                  {visibleOrderItems.length ? visibleOrderItems.map((item) => (
                    <PurchaseItemCard
                      key={item.id}
                      item={item}
                      issues={itemIssues(item)}
                      editing={actionKey === `edit-item:${item.id}`}
                      deleting={actionKey === `delete-item:${item.id}`}
                      ali1688HistoryEntries={ali1688HistoryEntriesForItem(selectedOrder, item, ali1688HistoryByKey)}
                      ali1688HistoryLoading={ali1688HistoryLoading}
                      ali1688HistoryError={ali1688HistoryError}
                      locked={isSubmittedOrder(selectedOrder)}
                      onEdit={() => openEditItemModal(selectedOrder, item)}
                      onDelete={() => setDeleteTargetItem({ order: selectedOrder, item })}
                      onOpenTop5={() => openTop5(item, selectedOrder)}
                      onIssueClick={(issue) => openProductDataCompletionModal(selectedOrder, item, issue)}
                    />
                  )) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前筛选没有商品。" />
                  )}
                </div>
              ) : (
                <Empty description={selectedOrder ? '当前采购单还没有商品。' : '请选择或新建采购单。'} />
              )}
            </section>
          </main>
        </div>
      </Spin>

      <Modal
        title="新建采购单"
        open={createModalOpen}
        okText="创建"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === 'create-order' }}
        onOk={() => void handleCreateOrder()}
        onCancel={closeCreateOrderModal}
        width={980}
      >
        <Form form={createOrderForm} layout="vertical" requiredMark={false} className="purchase-create-form">
          {createErrorMessage ? (
            <Alert type="error" showIcon message={createErrorMessage} style={{ marginBottom: 12 }} />
          ) : null}
          <Form.Item
            label="采购单名"
            name="title"
            rules={[{ required: true, whitespace: true, message: '请输入采购单名' }]}
          >
            <Input placeholder="例如 xingyao 6月新品采集单" maxLength={60} showCount />
          </Form.Item>
          <Form.Item
            label="店铺选择"
            name="storeCode"
            rules={[{ required: true, message: '请选择店铺' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={createStoreOptions}
              placeholder="选择店铺"
              onChange={handleCreateStoreChange}
            />
          </Form.Item>
          <PskuRowsFormList
            addButtonText="添加 PSKU"
            siteOptions={createSiteOptions}
            productOptions={productAutoCompleteOptions}
            productSearchLoading={productSearchLoading}
            onProductSearch={(nextKeyword) => {
              void handleProductSearch(createStoreCode || defaultCreateStoreCode(session) || storeCode, nextKeyword)
            }}
          />
          <Form.Item label="备注" name="remark">
            <Input.TextArea placeholder="输入备注" autoSize={{ minRows: 3, maxRows: 5 }} maxLength={160} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加商品"
        open={Boolean(addItemsOrder)}
        okText="添加"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === `add-items:${addItemsOrder?.id}` }}
        onOk={() => void handleAddItemsToOrder()}
        onCancel={closeAddItemsModal}
        width={980}
      >
        <Form form={addItemsForm} layout="vertical" requiredMark={false} className="purchase-create-form">
          {addItemsErrorMessage ? (
            <Alert type="error" showIcon message={addItemsErrorMessage} style={{ marginBottom: 12 }} />
          ) : null}
          <PskuRowsFormList
            addButtonText="添加 PSKU"
            siteOptions={getOrderSiteOptions(addItemsOrder, session)}
            productOptions={productAutoCompleteOptions}
            productSearchLoading={productSearchLoading}
            onProductSearch={(nextKeyword) => {
              void handleProductSearch(addItemsOrder?.storeCode || storeCode, nextKeyword)
            }}
          />
        </Form>
      </Modal>

      <Modal
        title="编辑商品"
        open={Boolean(editItemTarget)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === `edit-item:${editItemTarget?.item.id}` }}
        onOk={() => void handleUpdateItem()}
        onCancel={closeEditItemModal}
        width={820}
      >
        <Form form={editItemForm} layout="vertical" requiredMark={false} className="purchase-create-form purchase-edit-item-form">
          {editItemErrorMessage ? (
            <Alert type="error" showIcon message={editItemErrorMessage} style={{ marginBottom: 12 }} />
          ) : null}
          <div className="purchase-edit-item-header">
            <Form.Item label="PSKU" name="psku">
              <Input disabled />
            </Form.Item>
            <Form.Item label="到货方式" name="fulfillmentType" rules={[{ required: true, message: '请选择到货方式' }]}>
              <Select options={FULFILLMENT_TYPE_OPTIONS} />
            </Form.Item>
          </div>
          <SiteQuantityFormList
            addButtonText="添加站点数量"
            siteOptions={getOrderSiteOptions(editItemTarget?.order, session)}
          />
        </Form>
      </Modal>

      <Modal
        title="补齐商品资料"
        open={Boolean(productDataCompletionTarget)}
        okText="保存商品资料"
        cancelText="取消"
        okButtonProps={{
          loading: Boolean(productDataCompletionTarget && actionKey === `product-data-completion:${productDataCompletionTarget.item.id}`)
        }}
        onOk={() => void handleSaveProductDataCompletion()}
        onCancel={closeProductDataCompletionModal}
        width={880}
      >
        {productDataCompletionTarget ? (
          <Spin spinning={productDataCompletionLoading}>
            <Form
              form={productDataCompletionForm}
              layout="vertical"
              requiredMark={false}
              className="purchase-product-data-form"
            >
              {productDataCompletionError ? (
                <Alert type="warning" showIcon message={productDataCompletionError} />
              ) : null}
              <div className="purchase-product-data-summary">
                <ProductThumbnail
                  imageUrl={productDataCompletionTarget.item.productImageUrl || productDataCompletionTarget.item.sourceImageUrl}
                />
                <div className="purchase-product-data-summary-copy">
                  <Text strong>{productDataCompletionTarget.item.partnerSku || productDataCompletionTarget.item.skuParent}</Text>
                  <Text type="secondary" ellipsis>
                    {productDataCompletionTarget.item.productTitle || productDataCompletionTarget.item.sourceTitle}
                  </Text>
                  <div className="purchase-product-data-summary-tags">
                    <Tag>{productDataCompletionTarget.order.storeName || productDataCompletionTarget.order.storeCode}</Tag>
                    {productDataCompletionTarget.focusIssue ? (
                      <Tag color={productDataCompletionTarget.focusIssue === '箱规缺失' ? 'gold' : 'red'}>
                        {productDataCompletionTarget.focusIssue}
                      </Tag>
                    ) : null}
                  </div>
                </div>
              </div>
              <section className="purchase-product-data-section">
                <div className="purchase-product-data-section-title">
                  <Text strong>采购备注</Text>
                  <Tag>选填</Tag>
                </div>
                <div className="purchase-product-data-sourcing-grid">
                  <Form.Item label="款式/型号" name="sourcingSpec">
                    <Input placeholder="例如 A5 横线" maxLength={80} />
                  </Form.Item>
                  <Form.Item label="尺寸描述" name="sourcingSize">
                    <Input placeholder="例如 21x14cm" maxLength={80} />
                  </Form.Item>
                  <Form.Item label="颜色描述" name="sourcingColor">
                    <Input placeholder="例如 灰色" maxLength={80} />
                  </Form.Item>
                </div>
              </section>
              <section
                className={`purchase-product-data-section${productDataCompletionTarget.focusIssue === '产品规格缺失' ? ' is-focused' : ''}`}
              >
                <div className="purchase-product-data-section-title">
                  <Text strong>1688 产品规格</Text>
                  {productDataCompletionTarget.item.productSpecComplete === false ? <Tag color="red">必填</Tag> : <Tag>已可选维护</Tag>}
                </div>
                <div className="purchase-product-data-spec-grid">
                  {PRODUCT_DATA_PRODUCT_SPEC_FIELDS.map((field) => (
                    <Form.Item
                      key={field.key}
                      label={field.label}
                      name={field.key}
                      rules={[
                        {
                          validator: (_, value) => validateProductDataNumberField(
                            field.label,
                            value,
                            field.min,
                            productDataCompletionTarget.item.productSpecComplete === false
                          )
                        }
                      ]}
                    >
                      <InputNumber
                        min={field.min}
                        precision={field.precision}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  ))}
                </div>
              </section>
              <section
                className={`purchase-product-data-section${productDataCompletionTarget.focusIssue === '箱规缺失' ? ' is-focused' : ''}`}
              >
                <div className="purchase-product-data-section-title">
                  <Text strong>箱规</Text>
                  {productDataCompletionTarget.item.cartonSpecComplete === false ? <Tag color="gold">缺失仅提示</Tag> : <Tag>已可选维护</Tag>}
                </div>
                <div className="purchase-product-data-spec-grid">
                  {PRODUCT_DATA_CARTON_SPEC_FIELDS.map((field) => (
                    <Form.Item
                      key={field.key}
                      label={field.label}
                      name={field.key}
                      rules={[
                        {
                          validator: (_, value) => validateProductDataNumberField(
                            field.label,
                            value,
                            field.min,
                            false
                          )
                        }
                      ]}
                    >
                      <InputNumber
                        min={field.min}
                        precision={field.precision}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  ))}
                </div>
              </section>
              <section
                className={`purchase-product-data-section${productDataCompletionTarget.focusIssue === '商品属性缺失' ? ' is-focused' : ''}`}
              >
                <div className="purchase-product-data-section-title">
                  <Text strong>商品属性</Text>
                  {productDataCompletionTarget.item.logisticsAttributeComplete === false ? <Tag color="red">必填</Tag> : <Tag>已可选维护</Tag>}
                </div>
                <div className="purchase-product-data-logistics-grid">
                  {PRODUCT_DATA_LOGISTICS_FIELDS.map((field) => (
                    <Form.Item
                      key={field.key}
                      label={field.label}
                      name={field.key}
                      rules={[
                        {
                          validator: (_, value) => validateProductDataAttributeField(
                            field.label,
                            value,
                            productDataCompletionTarget.item.logisticsAttributeComplete === false
                          )
                        }
                      ]}
                    >
                      <Select options={field.options} />
                    </Form.Item>
                  ))}
                </div>
              </section>
            </Form>
          </Spin>
        ) : null}
      </Modal>

      <Modal
        title="编辑采购单"
        open={Boolean(editOrderTarget)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === `edit-order:${editOrderTarget?.id}` }}
        onOk={() => void handleSaveOrderHeader()}
        onCancel={closeEditOrderModal}
        width={560}
      >
        <Form form={editOrderForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="采购单名"
            name="title"
            rules={[{ required: true, whitespace: true, message: '请输入采购单名' }]}
          >
            <Input placeholder="输入采购单名" maxLength={60} showCount />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea placeholder="输入备注" autoSize={{ minRows: 3, maxRows: 5 }} maxLength={160} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="删除采购单"
        open={Boolean(deleteTargetOrder)}
        okText="删除"
        okButtonProps={{ danger: true, loading: actionKey === `delete:${deleteTargetOrder?.id}` }}
        cancelText="取消"
        onOk={() => void handleDeleteOrder()}
        onCancel={() => setDeleteTargetOrder(null)}
      >
        <Text>确认删除 {deleteTargetOrder?.title || '该采购单'}？</Text>
      </Modal>

      <Modal
        title="删除商品"
        open={Boolean(deleteTargetItem)}
        okText="删除"
        okButtonProps={{ danger: true, loading: actionKey === `delete-item:${deleteTargetItem?.item.id}` }}
        cancelText="取消"
        onOk={() => void handleDeleteItem()}
        onCancel={() => setDeleteTargetItem(null)}
      >
        <Text>
          确认从 {deleteTargetItem?.order.title || '该采购单'} 删除 {deleteTargetItem?.item.partnerSku || '该商品'}？
        </Text>
      </Modal>

    </div>
  )
}

function PurchaseItemCard({
  item,
  issues,
  editing,
  deleting,
  ali1688HistoryEntries,
  ali1688HistoryLoading,
  ali1688HistoryError,
  locked,
  onEdit,
  onDelete,
  onOpenTop5,
  onIssueClick
}: {
  item: PurchaseOrderItem
  issues: string[]
  editing: boolean
  deleting: boolean
  ali1688HistoryEntries: PurchaseOrderAli1688HistoryEntry[]
  ali1688HistoryLoading: boolean
  ali1688HistoryError?: string
  locked: boolean
  onEdit: () => void
  onDelete: () => void
  onOpenTop5: () => void
  onIssueClick: (issue: string) => void
}) {
  const meta = ITEM_STATUS_META[item.collectionStatus] || ITEM_STATUS_META.not_started
  const imageUrl = item.sourceImageUrl || item.productImageUrl
  const titlePair = buildItemTitlePair(item)
  const showInlinePsku = !sameDisplayText(titlePair.cn, item.partnerSku)
  const fulfillmentType = normalizeFulfillmentType(item.fulfillmentType)
  const fulfillmentLabel = item.fulfillmentTypeLabel || fulfillmentTypeLabel(fulfillmentType)

  return (
    <article className="purchase-item-card">
      <div className="purchase-item-main">
        <ProductThumbnail imageUrl={imageUrl} />
        <div className="purchase-item-copy">
          <div className="purchase-item-title-row">
            <Text strong ellipsis className="purchase-item-title">
              {titlePair.cn}
            </Text>
            <Tag color={fulfillmentType === 'FACTORY_DIRECT' ? 'gold' : 'blue'}>{fulfillmentLabel}</Tag>
            <ProductDetailButton item={item} imageUrl={imageUrl} titlePair={titlePair} />
          </div>
          {showInlinePsku || titlePair.en ? (
            <div className="purchase-item-sub-row">
              {showInlinePsku ? (
                <Text type="secondary" className="purchase-item-psku">{item.partnerSku}</Text>
              ) : null}
              {titlePair.en ? (
                <Text type="secondary" ellipsis className="purchase-item-en-title">{titlePair.en}</Text>
              ) : null}
            </div>
          ) : null}
          {issues.length ? (
            <div className="purchase-item-issue-list">
              {issues.slice(0, 3).map((issue) => {
                if (isProductDataCompletionIssue(issue) && !locked) {
                  return (
                    <button
                      type="button"
                      className="purchase-item-issue-button"
                      key={issue}
                      onClick={() => onIssueClick(issue)}
                    >
                      <Tag color={issueTagColor(issue)}>{issue}</Tag>
                    </button>
                  )
                }
                return <Tag color={issueTagColor(issue)} key={issue}>{issue}</Tag>
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="purchase-sku-cell">
        <div className="purchase-site-list">
          {(item.allocations || []).map((allocation) => (
            <span
              className={`purchase-site-chip${allocation.enabled ? '' : ' is-disabled'}`}
              key={`${item.id}:${allocation.site}:${allocation.transportMode || 'UNSPECIFIED'}`}
            >
              <span>{allocationDisplayLabel(allocation)}</span>
              <strong>{allocation.quantity}</strong>
            </span>
          ))}
        </div>
        <PurchaseAli1688HistoryLine
          entries={ali1688HistoryEntries}
          loading={ali1688HistoryLoading}
          error={ali1688HistoryError}
        />
      </div>

      <button type="button" className="purchase-collection-cell" onClick={onOpenTop5}>
        <div className="purchase-collection-line">
          <Text type="secondary">1688</Text>
          <Tag color={meta.color}>{meta.label}</Tag>
          <Text strong>{item.progress}%</Text>
        </div>
        <div className="purchase-collection-line purchase-collection-progress-line">
          <Progress
            percent={item.progress}
            size="small"
            showInfo={false}
            status={item.collectionStatus === 'failed' ? 'exception' : undefined}
          />
        </div>
      </button>

      <div className="purchase-item-actions">
        <Button
          size="small"
          icon={<EditOutlined />}
          loading={editing}
          disabled={locked}
          aria-label="编辑"
          title="编辑"
          onClick={onEdit}
        />
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          loading={deleting}
          disabled={locked}
          aria-label="删除"
          title="删除"
          onClick={onDelete}
        />
      </div>
    </article>
  )
}

function PurchaseAli1688HistoryLine({
  entries,
  loading,
  error
}: {
  entries: PurchaseOrderAli1688HistoryEntry[]
  loading: boolean
  error?: string
}) {
  const visibleEntries = entries.filter((entry) => Boolean(entry.record))
  if (loading && !visibleEntries.length) {
    return <Text type="secondary" className="purchase-ali1688-history-status">1688历史读取中</Text>
  }
  if (error && !visibleEntries.length) {
    return (
      <Tooltip title={error}>
        <Text type="danger" className="purchase-ali1688-history-status">1688历史读取失败</Text>
      </Tooltip>
    )
  }
  if (!visibleEntries.length) {
    return <Text type="secondary" className="purchase-ali1688-history-status">暂无1688历史</Text>
  }
  return (
    <div className="purchase-ali1688-history-list" aria-label="1688 历史采购">
      {visibleEntries.map((entry) => (
        <Popover
          key={entry.key}
          placement="topLeft"
          title="1688 历史采购"
          content={<PurchaseAli1688HistoryPopover entry={entry} />}
        >
          <button type="button" className="purchase-ali1688-history-chip">
            <span>{normalizeSiteCode(entry.siteCode) || '全部'}历史</span>
            <strong>{formatPurchaseAmount(recentAli1688UnitPrice(entry.record))}</strong>
            <em>{displayShortText(recentAli1688OrderNo(entry.record), '无订单')}</em>
          </button>
        </Popover>
      ))}
    </div>
  )
}

function PurchaseAli1688HistoryPopover({ entry }: { entry: PurchaseOrderAli1688HistoryEntry }) {
  const record = entry.record
  const batches = record?.purchaseBatches || []
  const latestBatch = latestAli1688Batch(record)
  const batchSourceRows = latestBatch?.sources || []
  const historyRows = sortedAli1688History(record?.history || [])
  const hasHistory = historyRows.length > 0
  return (
    <div className="purchase-ali1688-history-popover">
      <div className="purchase-ali1688-history-popover-summary">
        <Text strong>{displayShortText(record?.partnerSku, '未知 PSKU')}</Text>
        <Text type="secondary">
          {displayShortText(record?.storeCode)} · {displayShortText(record?.siteCode || entry.siteCode)}
        </Text>
        <Text type="secondary">
          采购 {record?.purchaseCount || batches.length || 0} 次 · 最近 {formatPurchaseAmount(recentAli1688UnitPrice(record))}
        </Text>
      </div>
      {latestBatch ? (
        <div className="purchase-ali1688-history-popover-batch">
          <Text strong>{displayShortText(latestBatch.label, '最近批次')}</Text>
          <Text type="secondary">
            数量 {displayShortText(latestBatch.countedQuantity)} · 成本 {formatPurchaseAmount(latestBatch.countedCost)}
          </Text>
          {batchSourceRows.map((source, index) => (
            <div className="purchase-ali1688-history-source" key={ali1688HistorySourceKey(source, index)}>
              <Text>{displayShortText(source.orderNo, '无订单号')}</Text>
              <Text type="secondary">{ali1688HistorySourceSummary(source, false)}</Text>
            </div>
          ))}
        </div>
      ) : null}
      {hasHistory ? (
        <div className="purchase-ali1688-history-popover-batch">
          <Text strong>历史订单</Text>
          {historyRows.slice(0, 5).map((source, index) => (
            <div className="purchase-ali1688-history-source" key={ali1688HistorySourceKey(source, index)}>
              <Text>{displayShortText(source.orderNo, '无订单号')}</Text>
              <Text type="secondary">{ali1688HistorySourceSummary(source, true)}</Text>
            </div>
          ))}
        </div>
      ) : !latestBatch ? (
        <Text type="secondary">暂无已维护批次来源</Text>
      ) : null}
    </div>
  )
}

function ali1688HistorySourceKey(source: PurchaseOrderAli1688HistorySource, index: number) {
  return `${source.allocationId || source.assignmentId || source.orderNo || 'source'}:${source.itemId || ''}:${index}`
}

function ali1688HistorySourceSummary(source: PurchaseOrderAli1688HistorySource, includePrice: boolean) {
  const parts = [
    displayShortText(source.orderTime),
    displayShortText(source.supplierName)
  ]
  if (source.sourceLineLabel) {
    parts.push(source.sourceLineLabel)
  }
  if (source.assignedQuantity) {
    parts.push(`数量 ${displayShortText(source.assignedQuantity)}`)
  }
  if (includePrice) {
    parts.push(`成本 ${formatPurchaseAmount(source.allocatedCost)}`)
    parts.push(`单价 ${formatPurchaseAmount(source.unitPrice)}`)
  }
  if (source.allocationBasis) {
    parts.push(source.allocationBasis)
  }
  return parts.join(' · ')
}

function ProductDetailButton({
  item,
  imageUrl,
  titlePair
}: {
  item: PurchaseOrderItem
  imageUrl?: string
  titlePair: { cn: string; en: string }
}) {
  const content = (
    <div className="purchase-product-popover">
      <div className="purchase-thumb-preview-frame">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="purchase-thumb-preview" />
        ) : (
          <div className="purchase-thumb-preview-empty">暂无图片</div>
        )}
      </div>
      <div className="purchase-product-popover-copy">
        <Text strong className="purchase-product-popover-title">{titlePair.cn}</Text>
        {titlePair.en ? (
          <Text type="secondary" className="purchase-product-popover-subtitle">{titlePair.en}</Text>
        ) : null}
        <div className="purchase-product-popover-fields">
          <InfoField label="Z码" value={item.skuParent} />
          <InfoField label="PSKU" value={item.partnerSku} />
          <InfoField label="类目" value={item.productFulltype} />
        </div>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      overlayClassName="purchase-thumb-tooltip"
      placement="topLeft"
    >
      <Button size="small" icon={<SearchOutlined />} aria-label="详情" title="详情" />
    </Popover>
  )
}

function ProductThumbnail({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) {
    return <div className="purchase-thumb" />
  }

  return <img src={imageUrl} alt="" className="purchase-thumb" />
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="purchase-product-popover-field">
      <span>{label}</span>
      <strong>{value?.trim() || '-'}</strong>
    </div>
  )
}

function SiteQuantityFormList({
  addButtonText,
  siteOptions
}: {
  addButtonText: string
  siteOptions: Array<{ label: string; value: PurchaseSiteCode }>
}) {
  const defaultSite = siteOptions[0]?.value || DEFAULT_SITE_CODES[0]

  return (
    <div className="purchase-psku-entry">
      <Form.List name="siteQuantities">
        {(fields, { add, remove }) => (
          <div className="purchase-psku-entry-list">
            {fields.length ? (
              fields.map((field) => (
                <div className="purchase-site-quantity-row" key={field.key}>
                  <Form.Item name={[field.name, 'siteCode']} rules={[{ required: true, message: '请选择站点' }]}>
                    <Select options={siteOptions} placeholder="选择站点" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'transportMode']} rules={[{ required: true, message: '请选择运输方式' }]}>
                    <Select options={TRANSPORT_MODE_OPTIONS} placeholder="运输方式" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'quantity']}
                    rules={[
                      {
                        validator: (_, value: number | null | undefined) =>
                          typeof value === 'number' && value > 0
                            ? Promise.resolve()
                            : Promise.reject(new Error('请输入数量'))
                      }
                    ]}
                  >
                    <InputNumber min={1} precision={0} placeholder="数量" />
                  </Form.Item>
                  <Button aria-label="删除" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
            )}
            <Button icon={<PlusOutlined />} onClick={() => add(createEmptySiteQuantityEntry(defaultSite))}>
              {addButtonText}
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  )
}

function PskuRowsFormList({
  addButtonText,
  siteOptions,
  productOptions,
  productSearchLoading,
  onProductSearch
}: {
  addButtonText: string
  siteOptions: Array<{ label: string; value: PurchaseSiteCode }>
  productOptions?: Array<{ value: string; label: ReactNode }>
  productSearchLoading?: boolean
  onProductSearch?: (keyword: string) => void
}) {
  const defaultSite = siteOptions[0]?.value || DEFAULT_SITE_CODES[0]

  return (
    <div className="purchase-psku-entry">
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <div className="purchase-psku-entry-list">
            {fields.length ? (
              fields.map((field) => (
                <div className="purchase-psku-entry-row" key={field.key}>
                  <Form.Item
                    name={[field.name, 'psku']}
                  >
                    <AutoComplete
                      allowClear
                      filterOption={false}
                      notFoundContent={productSearchLoading ? <Spin size="small" /> : null}
                      options={productOptions}
                      placeholder="输入 PSKU / 标题搜索"
                      onSearch={onProductSearch}
                    />
                  </Form.Item>
                  <Form.Item name={[field.name, 'site']} rules={[{ required: true, message: '请选择站点' }]}>
                    <Select options={siteOptions} placeholder="选择站点" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'transportMode']} rules={[{ required: true, message: '请选择运输方式' }]}>
                    <Select options={TRANSPORT_MODE_OPTIONS} placeholder="运输方式" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'fulfillmentType']} rules={[{ required: true, message: '请选择到货方式' }]}>
                    <Select options={FULFILLMENT_TYPE_OPTIONS} placeholder="到货方式" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'quantity']}
                    rules={[
                      {
                        validator: (_, value: number | null | undefined) =>
                          typeof value === 'number' && value > 0
                            ? Promise.resolve()
                            : Promise.reject(new Error('请输入数量'))
                      }
                    ]}
                  >
                    <InputNumber min={1} precision={0} placeholder="数量" />
                  </Form.Item>
                  <Button aria-label="删除" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
            )}
            <Button icon={<PlusOutlined />} onClick={() => add(createEmptyPskuEntry(defaultSite))}>
              {addButtonText}
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  )
}

function openTop5(item: PurchaseOrderItem, order: PurchaseOrder) {
  const params = new URLSearchParams(window.location.search)
  params.set('psku', item.partnerSku)
  params.set('purchaseOrderItemId', item.id)
  if (order.storeCode) {
    params.set('storeCode', order.storeCode)
  }
  window.location.href = withPublicBasePath(`/purchase/1688-collection?${params.toString()}#top5`)
}
