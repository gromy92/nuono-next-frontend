import {
  CalculatorOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  TruckOutlined
} from '@ant-design/icons'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Drawer,
  Empty,
  Input,
  Modal,
  Popover,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PRODUCT_SPECS_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import type { AuthSession } from '../auth/session'
import { fetchProductListDataset } from '../product-management/api'
import type { ProductListRowPayload } from '../product-management/types'
import { normalizeNoonImageUrl } from '../product-management/utils'
import { WarehouseShippingOrderPanel } from '../warehouse-shipping-order/WarehouseShippingOrderPage'
import {
  createShippingBatchFromDispatchPlan,
  issueShippingBatch,
  loadDispatchPlanShippingRouteOptions,
  loadDispatchPlans,
  loadReadyShipmentItems,
  loadShippingBatch,
  loadWarehouseReceiptOrders,
  updateReadyItemDispatchTarget
} from './api'
import type {
  DispatchPlan,
  DispatchPlanLine,
  DispatchPlanStatus,
  ProductSpecStatus,
  PurchaseReceiptItem,
  PurchaseReceiptOrder,
  ReadyShipmentItem,
  ReceiptStatus,
  RouteGroup,
  ShippingBatch,
  ShippingCostComponent,
  ShippingRouteOption,
  ShippingSuggestionLine,
  ShippingSuggestionOption,
  WarehouseFulfillmentType,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './types'
import { WarehousePackingListPanel } from './WarehousePackingListPanel'
import './WarehouseDispatchWorkbenchPage.css'

const { Text } = Typography

type WarehouseDispatchTabKey = 'warehouse-order' | 'receipt-list' | 'ship-ready' | 'dispatch-plan' | 'packing-list'

type WarehouseDispatchWorkbenchPageProps = {
  session?: AuthSession | null
}

type ReceiptOrderSummary = {
  itemCount: number
  pskuCount: number
  expectedQty: number
  receivedQty: number
  remainingQty: number
  readyQty: number
  plannedQty: number
  missingSpecCount: number
  status: ReceiptStatus
}

type ReadyFilterKey = 'all' | 'SA-AIR' | 'SA-SEA' | 'AE-AIR' | 'AE-SEA' | 'missing'

type ReceiptSiteFilterKey = 'all' | WarehouseSiteCode
type ReceiptScopeFilterKey = 'todo' | 'all'
type ReceiptDetailScopeFilterKey = 'all' | 'pending' | 'completed'

type ReceiptStoreOption = {
  label: string
  value: string
}

type ProductBaselineSummary = {
  psku: string
  skuParent?: string
  title?: string
  imageUrl?: string
  productFulltype?: string
  detailBaselineStatus?: string
}

type ReadyShipmentRow = ReadyShipmentItem & {
  items: ReadyShipmentItem[]
}

type DispatchTargetTransportMode = Exclude<WarehouseTransportMode, 'UNSPECIFIED'>

type DispatchTargetModalState = {
  source: ReadyShipmentItem
  targetSiteCode: WarehouseSiteCode
  targetTransportMode: DispatchTargetTransportMode
}

type ReceiptOrderMeta = {
  title: string
  createdAt: string
}

type WarehouseDataset = {
  orders: PurchaseReceiptOrder[]
  readyItems: ReadyShipmentRow[]
  dispatchPlans: DispatchPlan[]
}

type ShippingForwarderChoice = {
  forwarderCode: string
  forwarderName: string
  routes: ShippingRouteOption[]
}

type ShippingAmountTotal = {
  currency: string
  amount: number
}

type ShippingForwarderCostComponentSummary = {
  key: string
  componentType?: string
  componentName: string
  amounts: ShippingAmountTotal[]
}

type ShippingForwarderCostBreakdown = {
  key: string
  forwarderCode?: string
  forwarderName?: string
  routeNames: string[]
  lines: ShippingSuggestionLine[]
  pskuCount: number
  totalQuantity: number
  actualWeightKg?: number
  volumeCbm?: number
  chargeableWeightKg?: number
  amounts: ShippingAmountTotal[]
  pendingAmountLineCount: number
  costComponents: ShippingForwarderCostComponentSummary[]
}

const SITE_LABELS: Record<WarehouseSiteCode, string> = {
  SA: 'SA',
  AE: 'AE'
}

const TRANSPORT_LABELS: Record<WarehouseTransportMode, string> = {
  AIR: '空运',
  SEA: '海运',
  UNSPECIFIED: '未定'
}

const FULFILLMENT_LABELS: Record<WarehouseFulfillmentType, string> = {
  WAREHOUSE_RECEIPT: '到仓收货',
  FACTORY_DIRECT: '厂家直发'
}

const RECEIPT_STATUS_META: Record<ReceiptStatus, { label: string; color: string }> = {
  pending: { label: '待收货', color: 'gold' },
  partial: { label: '部分收货', color: 'blue' },
  ready: { label: '已收待发运', color: 'green' },
  planned: { label: '已进计划', color: 'purple' },
  exception: { label: '收货异常', color: 'red' }
}

const DISPATCH_STATUS_META: Record<DispatchPlanStatus, { label: string; color: string }> = {
  draft: { label: '待生成物流计划', color: 'gold' },
  ready_for_logistics: { label: '已生成物流计划', color: 'blue' },
  handoff_failed: { label: '交接失败', color: 'red' },
  logistics_requested: { label: '已下发发货单', color: 'green' },
  cancelled: { label: '已取消', color: 'default' }
}

const READY_FILTER_OPTIONS: Array<{ label: string; value: ReadyFilterKey }> = [
  { label: '全部', value: 'all' },
  { label: 'SA 空', value: 'SA-AIR' },
  { label: 'SA 海', value: 'SA-SEA' },
  { label: 'AE 空', value: 'AE-AIR' },
  { label: 'AE 海', value: 'AE-SEA' },
  { label: '规格缺失', value: 'missing' }
]

const DISPATCH_TARGET_SITE_OPTIONS: Array<{ label: string; value: WarehouseSiteCode }> = [
  { label: 'SA', value: 'SA' },
  { label: 'AE', value: 'AE' }
]

const DISPATCH_TARGET_TRANSPORT_OPTIONS: Array<{ label: string; value: DispatchTargetTransportMode }> = [
  { label: '空运', value: 'AIR' },
  { label: '海运', value: 'SEA' }
]

const RECEIPT_ORDER_TABLE_PAGINATION = {
  pageSize: 30,
  showSizeChanger: true,
  pageSizeOptions: [20, 30, 50, 100],
  showTotal: (total: number) => `共 ${total} 行`,
  size: 'small' as const
}

const RECEIPT_ITEM_TABLE_PAGINATION = {
  pageSize: 30,
  showSizeChanger: true,
  pageSizeOptions: [20, 30, 50, 100],
  showTotal: (total: number) => `共 ${total} 行`,
  size: 'small' as const
}

const READY_ITEM_TABLE_PAGINATION = {
  pageSize: 50,
  showSizeChanger: true,
  pageSizeOptions: [30, 50, 100],
  showTotal: (total: number) => `共 ${total} 行`,
  size: 'small' as const
}

const DISPATCH_PLAN_TABLE_PAGINATION = {
  pageSize: 20,
  showSizeChanger: true,
  pageSizeOptions: [20, 30, 50, 100],
  showTotal: (total: number) => `共 ${total} 张申请单`,
  size: 'small' as const
}

const DISPATCH_PLAN_LINE_TABLE_PAGINATION = {
  pageSize: 30,
  showSizeChanger: true,
  pageSizeOptions: [20, 30, 50, 100],
  showTotal: (total: number) => `共 ${total} 行`,
  size: 'small' as const
}

export function WarehouseDispatchWorkbenchPage({ session }: WarehouseDispatchWorkbenchPageProps) {
  const [orders, setOrders] = useState<PurchaseReceiptOrder[]>([])
  const [readyItems, setReadyItems] = useState<ReadyShipmentRow[]>([])
  const [activeTab, setActiveTab] = useState<WarehouseDispatchTabKey>('warehouse-order')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [receiptKeyword, setReceiptKeyword] = useState('')
  const [receiptStoreFilter, setReceiptStoreFilter] = useState('all')
  const [receiptSiteFilter, setReceiptSiteFilter] = useState<ReceiptSiteFilterKey>('all')
  const [receiptScopeFilter, setReceiptScopeFilter] = useState<ReceiptScopeFilterKey>('todo')
  const [receiptDetailOpen, setReceiptDetailOpen] = useState(false)
  const [receiptDetailKeyword, setReceiptDetailKeyword] = useState('')
  const [receiptDetailScopeFilter, setReceiptDetailScopeFilter] = useState<ReceiptDetailScopeFilterKey>('all')
  const [productBaselineByPsku, setProductBaselineByPsku] = useState<Record<string, ProductBaselineSummary>>({})
  const [productBaselineLoading, setProductBaselineLoading] = useState(false)
  const [productBaselineError, setProductBaselineError] = useState<string>()
  const [readyFilter, setReadyFilter] = useState<ReadyFilterKey>('all')
  const [dispatchPlans, setDispatchPlans] = useState<DispatchPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>()
  const [dispatchPlanDetailOpen, setDispatchPlanDetailOpen] = useState(false)
  const [selectedRouteGroupKey, setSelectedRouteGroupKey] = useState<string>()
  const [generatedShippingBatch, setGeneratedShippingBatch] = useState<ShippingBatch>()
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string>()
  const [shippingCostDrawerOpen, setShippingCostDrawerOpen] = useState(false)
  const [shippingCostDetailOptionId, setShippingCostDetailOptionId] = useState<string>()
  const [shippingBatchLoadingId, setShippingBatchLoadingId] = useState<string>()
  const shippingBatchLoadRequestRef = useRef(0)
  const [logisticsPlanModalOpen, setLogisticsPlanModalOpen] = useState(false)
  const [shippingRouteOptions, setShippingRouteOptions] = useState<ShippingRouteOption[]>([])
  const [shippingRouteOptionsLoading, setShippingRouteOptionsLoading] = useState(false)
  const [selectedLogisticsForwarderCodes, setSelectedLogisticsForwarderCodes] = useState<string[]>([])
  const [logisticsPlanError, setLogisticsPlanError] = useState<string>()
  const [dispatchTargetModal, setDispatchTargetModal] = useState<DispatchTargetModalState>()
  const [packingListRefreshKey, setPackingListRefreshKey] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string>()
  const [readyItemsLoaded, setReadyItemsLoaded] = useState(false)
  const [dispatchPlansLoaded, setDispatchPlansLoaded] = useState(false)
  const [logisticsSubmitting, setLogisticsSubmitting] = useState(false)
  const [dispatchTargetSubmitting, setDispatchTargetSubmitting] = useState(false)
  const [outboundSubmitting, setOutboundSubmitting] = useState(false)

  const orderSummaries = useMemo(() => {
    return new Map(orders.map((order) => [order.id, summarizeReceiptOrder(order)] as const))
  }, [orders])
  const receiptStoreOptions = useMemo(
    () => buildReceiptStoreOptions(orders, session?.userStores, session?.currentStore),
    [orders, session?.currentStore, session?.userStores]
  )
  const receiptSiteOptions = useMemo(() => buildReceiptSiteOptions(orders), [orders])
  const filteredReceiptOrders = useMemo(
    () => filterReceiptOrders(orders, receiptKeyword, receiptStoreFilter, receiptSiteFilter),
    [orders, receiptKeyword, receiptSiteFilter, receiptStoreFilter]
  )
  const filteredOrderSummaries = useMemo(() => {
    return new Map(filteredReceiptOrders.map((order) => [order.id, summarizeReceiptOrder(order)] as const))
  }, [filteredReceiptOrders])
  const visibleReceiptOrders = useMemo(() => {
    if (receiptScopeFilter === 'all') {
      return filteredReceiptOrders
    }
    return filteredReceiptOrders.filter((order) => {
      const status = filteredOrderSummaries.get(order.id)?.status ?? summarizeReceiptOrder(order).status
      return isReceiptTodoStatus(status)
    })
  }, [filteredOrderSummaries, filteredReceiptOrders, receiptScopeFilter])
  const visibleOrderSummaries = useMemo(() => {
    return new Map(visibleReceiptOrders.map((order) => [order.id, summarizeReceiptOrder(order)] as const))
  }, [visibleReceiptOrders])
  const selectedReceiptOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId]
  )
  const selectedReceiptSummary = useMemo(
    () => selectedReceiptOrder ? summarizeReceiptOrder(selectedReceiptOrder) : undefined,
    [selectedReceiptOrder]
  )
  const receiptDetailItems = useMemo(
    () => filterReceiptDetailItems(
      selectedReceiptOrder?.items || [],
      receiptDetailKeyword,
      receiptDetailScopeFilter
    ),
    [receiptDetailKeyword, receiptDetailScopeFilter, selectedReceiptOrder]
  )
  const receiptOrderMetaById = useMemo(
    () =>
      new Map(
        orders.map((order) => [
          order.id,
          {
            title: order.title || order.orderNo,
            createdAt: order.createdAt
          }
        ] as const)
      ),
    [orders]
  )

  const allReadyItems = useMemo(() => mergeReadyShipmentRowsByBusinessScope(readyItems), [readyItems])
  const visibleReadyItems = useMemo(
    () => filterReadyItems(allReadyItems, readyFilter),
    [allReadyItems, readyFilter]
  )
  const selectedPlan = useMemo(
    () => dispatchPlans.find((plan) => plan.id === selectedPlanId) || dispatchPlans[0],
    [dispatchPlans, selectedPlanId]
  )
  const selectedPlanRouteGroups = useMemo(
    () => selectedPlan ? buildRouteGroups(selectedPlan.lines) : [],
    [selectedPlan]
  )
  const selectedShippingOption = useMemo(
    () => generatedShippingBatch?.options.find((option) => option.id === selectedShippingOptionId),
    [generatedShippingBatch, selectedShippingOptionId]
  )
  const shippingCostDetailOption = useMemo(
    () => generatedShippingBatch?.options.find((option) => option.id === shippingCostDetailOptionId)
      || selectedShippingOption,
    [generatedShippingBatch, selectedShippingOption, shippingCostDetailOptionId]
  )
  const logisticsForwarderChoices = useMemo(
    () => buildShippingForwarderChoices(shippingRouteOptions),
    [shippingRouteOptions]
  )
  const totalSummary = useMemo(() => summarizeAllOrders(filteredReceiptOrders), [filteredReceiptOrders])
  const productBaselineOwnerUserId = session?.defaultOwnerUserId || session?.userId
  const productBaselineStoreCode = session?.currentStore?.storeCode
  const productBaselineStoreCodes = useMemo(
    () =>
      buildProductBaselineStoreCodes({
        activeTab,
        currentStoreCode: productBaselineStoreCode,
        selectedPlan,
        visibleReadyItems
      }),
    [activeTab, productBaselineStoreCode, selectedPlan, visibleReadyItems]
  )

  useEffect(() => {
    let cancelled = false
    setDataLoading(true)
    setDataError(undefined)
    loadWarehouseReceiptOrders()
      .then((nextOrders) => {
        if (cancelled) {
          return
        }
        setOrders(nextOrders)
      })
      .catch((error) => {
        if (!cancelled) {
          setDataError(error instanceof Error ? error.message : '仓库发运数据读取失败')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDataLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'ship-ready' || readyItemsLoaded) {
      return
    }
    let cancelled = false
    setDataLoading(true)
    setDataError(undefined)
    loadReadyShipmentItems()
      .then((nextReadyItems) => {
        if (cancelled) {
          return
        }
        setReadyItems(nextReadyItems)
        setReadyItemsLoaded(true)
      })
      .catch((error) => {
        if (!cancelled) {
          setDataError(error instanceof Error ? error.message : '库存读取失败')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDataLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, readyItemsLoaded])

  useEffect(() => {
    if (activeTab !== 'dispatch-plan' || dispatchPlansLoaded) {
      return
    }
    let cancelled = false
    setDataLoading(true)
    setDataError(undefined)
    loadDispatchPlans()
      .then((nextPlans) => {
        if (cancelled) {
          return
        }
        setDispatchPlans(nextPlans)
        setDispatchPlansLoaded(true)
      })
      .catch((error) => {
        if (!cancelled) {
          setDataError(error instanceof Error ? error.message : '发货申请单读取失败')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDataLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, dispatchPlansLoaded])

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId('')
      return
    }
    if (!orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id)
    }
  }, [orders, selectedOrderId])

  useEffect(() => {
    if (!dispatchPlans.length) {
      setSelectedPlanId(undefined)
      return
    }
    if (!selectedPlanId || !dispatchPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(dispatchPlans[0].id)
    }
  }, [dispatchPlans, selectedPlanId])

  useEffect(() => {
    if (!selectedPlanRouteGroups.length) {
      setSelectedRouteGroupKey(undefined)
      return
    }
    if (!selectedRouteGroupKey || !selectedPlanRouteGroups.some((group) => group.key === selectedRouteGroupKey)) {
      setSelectedRouteGroupKey(selectedPlanRouteGroups[0].key)
    }
  }, [selectedPlanRouteGroups, selectedRouteGroupKey])

  function handleSelectDispatchPlan(planId: string) {
    const plan = dispatchPlans.find((candidate) => candidate.id === planId)
    shippingBatchLoadRequestRef.current += 1
    setShippingBatchLoadingId(undefined)
    setShippingCostDrawerOpen(false)
    setShippingCostDetailOptionId(undefined)
    setGeneratedShippingBatch(undefined)
    setSelectedShippingOptionId(undefined)
    setSelectedPlanId(planId)
    setDispatchPlanDetailOpen(true)
    if (plan?.currentShippingBatch) {
      void hydrateShippingBatch(plan, 'detail')
    }
  }

  async function hydrateShippingBatch(plan: DispatchPlan, purpose: 'detail' | 'cost') {
    const batch = plan.currentShippingBatch
    if (!batch) {
      return
    }
    const requestId = shippingBatchLoadRequestRef.current + 1
    shippingBatchLoadRequestRef.current = requestId
    setShippingBatchLoadingId(batch.id)
    try {
      const detail = await loadShippingBatch(batch.id)
      if (shippingBatchLoadRequestRef.current !== requestId) {
        return
      }
      const option = resolveShippingBatchOption(detail)
      setGeneratedShippingBatch(detail)
      setSelectedShippingOptionId(option?.id)
      if (purpose === 'cost') {
        if (!option) {
          message.warning('当前发货申请单还没有可对比的物流方案。')
          return
        }
        setShippingCostDetailOptionId(option.id)
        setShippingCostDrawerOpen(true)
      }
    } catch (error) {
      if (shippingBatchLoadRequestRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '读取物流方案详情失败')
      }
    } finally {
      if (shippingBatchLoadRequestRef.current === requestId) {
        setShippingBatchLoadingId(undefined)
      }
    }
  }

  function openShippingCostComparison(plan: DispatchPlan) {
    const batch = plan.currentShippingBatch
    if (!batch || batch.optionCount <= 0) {
      message.warning('当前发货申请单还没有可对比的物流方案。')
      return
    }
    setSelectedPlanId(plan.id)
    setShippingCostDrawerOpen(false)
    setShippingCostDetailOptionId(undefined)
    void hydrateShippingBatch(plan, 'cost')
  }

  function selectShippingOptionFromCostComparison(optionId: string) {
    if (generatedShippingBatch?.status === 'OUTBOUND_CREATED') {
      message.warning('发货单已经下发，不能再修改物流方案。')
      return
    }
    setSelectedShippingOptionId(optionId)
    setShippingCostDetailOptionId(optionId)
  }

  useEffect(() => {
    let cancelled = false
    if (!productBaselineOwnerUserId || !productBaselineStoreCodes.length) {
      setProductBaselineByPsku({})
      setProductBaselineLoading(false)
      setProductBaselineError(undefined)
      return
    }
    setProductBaselineLoading(true)
    setProductBaselineError(undefined)
    Promise.allSettled(
      productBaselineStoreCodes.map((storeCode) =>
        fetchProductListDataset({
          ownerUserId: productBaselineOwnerUserId,
          storeCode
        })
      )
    )
      .then((results) => {
        if (cancelled) {
          return
        }
        const items = results.flatMap((result) =>
          result.status === 'fulfilled' ? result.value.items || [] : []
        )
        setProductBaselineByPsku(buildProductBaselineMap(items))
        const failedCount = results.filter((result) => result.status === 'rejected').length
        setProductBaselineError(items.length > 0 || failedCount === 0 ? undefined : '商品基线读取失败')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setProductBaselineByPsku({})
        setProductBaselineError(error instanceof Error ? error.message : '商品基线读取失败')
      })
      .finally(() => {
        if (!cancelled) {
          setProductBaselineLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [productBaselineOwnerUserId, productBaselineStoreCodes])

  async function refreshWarehouseData() {
    const dataset = await loadWarehouseDataset()
    applyWarehouseDataset(dataset)
    return dataset
  }

  function applyWarehouseDataset(dataset: WarehouseDataset) {
    setOrders(dataset.orders)
    setReadyItems(dataset.readyItems)
    setDispatchPlans(dataset.dispatchPlans)
    setReadyItemsLoaded(true)
    setDispatchPlansLoaded(true)
  }

  const receiptOrderColumns: ColumnsType<PurchaseReceiptOrder> = [
    {
      title: '仓库单',
      dataIndex: 'title',
      render: (_value, order) => (
        <div className="warehouse-dispatch-receipt-order-main">
          <Text strong>{order.title || order.orderNo}</Text>
          <Text type="secondary">{order.orderNo} · {order.createdAt}</Text>
        </div>
      )
    },
    {
      title: '店铺',
      dataIndex: 'storeName',
      render: (_value, order) => receiptOrderDisplayStoreName(order)
    },
    {
      title: '商品',
      render: (_value, order) => visibleOrderSummaries.get(order.id)?.pskuCount ?? summarizeReceiptOrder(order).pskuCount
    },
    {
      title: '应收',
      render: (_value, order) => visibleOrderSummaries.get(order.id)?.expectedQty ?? summarizeReceiptOrder(order).expectedQty
    },
    {
      title: '已收',
      render: (_value, order) => visibleOrderSummaries.get(order.id)?.receivedQty ?? summarizeReceiptOrder(order).receivedQty
    },
    {
      title: '未收',
      render: (_value, order) => formatReceiptQuantity(
        sum(order.items.map((item) => receiptRemainingQuantity(item)))
      )
    },
    {
      title: '状态',
      render: (_value, order) => renderReceiptStatus(visibleOrderSummaries.get(order.id)?.status ?? summarizeReceiptOrder(order).status)
    },
    {
      title: '操作',
      width: 108,
      render: (_value, order) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={(event) => {
            event.stopPropagation()
            openReceiptDetail(order)
          }}
        >
          查看详情
        </Button>
      )
    }
  ]

  const receiptDetailColumns: ColumnsType<PurchaseReceiptItem> = [
    {
      title: '商品',
      width: 360,
      render: (_value, item) => renderWarehouseProductCell({
        psku: item.psku,
        title: item.title,
        imageUrl: item.imageUrl
      })
    },
    {
      title: '来源采购单',
      width: 170,
      render: (_value, item) => (
        <div className="warehouse-dispatch-receipt-source">
          <Text strong>{item.purchaseOrderTitle || item.orderNo || '-'}</Text>
          <Text className="warehouse-dispatch-receipt-source-date" type="secondary">{item.orderNo || '-'}</Text>
        </div>
      )
    },
    {
      title: '计划',
      width: 130,
      render: (_value, item) => (
        <Space size={4} wrap>
          <Tag>{SITE_LABELS[item.siteCode]}</Tag>
          {renderTransportMode(item.transportMode)}
        </Space>
      )
    },
    {
      title: '应收',
      width: 84,
      align: 'right',
      render: (_value, item) => <span className="warehouse-dispatch-receipt-quantity">{formatReceiptQuantity(item.expectedQty)}</span>
    },
    {
      title: '已收',
      width: 84,
      align: 'right',
      render: (_value, item) => <span className="warehouse-dispatch-receipt-quantity is-received">{formatReceiptQuantity(item.receivedQty)}</span>
    },
    {
      title: '未收',
      width: 84,
      align: 'right',
      render: (_value, item) => <span className="warehouse-dispatch-receipt-quantity is-remaining">{formatReceiptQuantity(receiptRemainingQuantity(item))}</span>
    },
    {
      title: '状态',
      width: 104,
      render: (_value, item) => renderReceiptItemStatus(item)
    }
  ]

  const readyItemColumns: ColumnsType<ReadyShipmentRow> = [
    {
      title: '商品',
      dataIndex: 'psku',
      render: (_value, item) => renderReadyProductCell(item, productBaselineByPsku)
    },
    {
      title: '来源',
      render: (_value, item) => renderReadySourceCell(
        item,
        receiptOrderMetaById,
        openDispatchTargetModal
      )
    },
    {
      title: '报价',
      width: 116,
      render: (_value, item) => renderReadyQuoteCell(item)
    },
    {
      title: '履约',
      width: 96,
      render: (_value, item) => renderReadyFulfillmentCell(item)
    },
    {
      title: '站点',
      render: (_value, item) => renderReadySiteCell(item)
    },
    {
      title: '规格',
      width: 112,
      render: (_value, item) => renderReadySpecAction(item)
    },
    { title: '可发', dataIndex: 'availableQty' }
  ]

  const dispatchPlanColumns: ColumnsType<DispatchPlan> = [
    {
      title: '发货申请单',
      dataIndex: 'planNo',
      width: 180,
      fixed: 'left',
      render: (_value, plan) => (
        <Space direction="vertical" size={0}>
          <Text strong>{plan.planNo}</Text>
          <Text type="secondary">{plan.createdAt || '-'}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      width: 140,
      fixed: 'left',
      render: (_value, plan) => renderDispatchStatus(plan.status)
    },
    {
      title: '来源采购单',
      width: 120,
      render: (_value, plan) => countPlanSourceOrders(plan)
    },
    {
      title: '店铺',
      width: 90,
      render: (_value, plan) => countPlanStores(plan)
    },
    {
      title: 'PSKU',
      width: 90,
      render: (_value, plan) => plan.lines.length
    },
    {
      title: '数量',
      width: 90,
      render: (_value, plan) => sumPlanQuantity(plan)
    },
    {
      title: '站点 / 运输方式',
      width: 180,
      render: (_value, plan) => {
        const labels = buildPlanSiteTransportLabels(plan.lines)
        return labels.length > 0 ? (
          <Space size={[4, 4]} wrap>
            {labels.map((label) => (
              <Tag color="blue" key={label}>{label}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      }
    },
    {
      title: '物流计划',
      width: 150,
      render: (_value, plan) => plan.currentShippingBatch ? (
        <Space direction="vertical" size={0}>
          <Text strong>{plan.currentShippingBatch.batchNo}</Text>
          <Text type="secondary">{plan.currentShippingBatch.optionCount} 个方案</Text>
        </Space>
      ) : (
        <Text type="secondary">未生成</Text>
      )
    },
    {
      title: '整批重量',
      width: 130,
      align: 'right',
      fixed: 'right',
      render: (_value, plan) => formatDispatchPlanBatchMetric(plan, 'weight')
    },
    {
      title: '整批体积',
      width: 130,
      align: 'right',
      fixed: 'right',
      render: (_value, plan) => formatDispatchPlanBatchMetric(plan, 'volume')
    },
    {
      title: '操作',
      width: 190,
      fixed: 'right',
      render: (_value, plan) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(event) => {
              event.stopPropagation()
              handleSelectDispatchPlan(plan.id)
            }}
          >
            查看明细
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CalculatorOutlined />}
            loading={shippingBatchLoadingId === plan.currentShippingBatch?.id}
            disabled={!plan.currentShippingBatch || plan.currentShippingBatch.optionCount <= 0}
            onClick={(event) => {
              event.stopPropagation()
              openShippingCostComparison(plan)
            }}
          >
            费用对比
          </Button>
        </Space>
      )
    }
  ]

  const dispatchPlanLineColumns: ColumnsType<DispatchPlanLine> = [
    {
      title: 'PSKU',
      dataIndex: 'psku',
      render: (_value, line) => (
        <Space direction="vertical" size={0}>
          <Text strong>{line.psku}</Text>
          <Text type="secondary">{line.title}</Text>
        </Space>
      )
    },
    { title: '总数量', dataIndex: 'totalQuantity' },
    { title: '站点', dataIndex: 'siteCode', render: (site: WarehouseSiteCode) => <Tag color="blue">{site}</Tag> },
    { title: '运输', dataIndex: 'transportMode', render: renderTransportMode },
    {
      title: '履约',
      render: (_value, line) => renderFulfillmentType(line.fulfillmentType)
    },
    {
      title: '来源分摊',
      render: (_value, line) => (
        <div className="warehouse-dispatch-source-list">
          {line.sources.map((source) => (
            <div key={`${source.sourceItemId}-${source.quantity}`}>
              {source.orderNo} / {source.storeName}: {source.quantity}
            </div>
          ))}
        </div>
      )
    },
    {
      title: '规格',
      dataIndex: 'specStatus',
      render: renderSpecStatus
    }
  ]

  function handleReceiptStoreFilterChange(value: string) {
    setReceiptStoreFilter(value)
    const nextOrders = filterReceiptOrders(orders, '', value, receiptSiteFilter)
    if (!nextOrders.length) {
      return
    }
    if (!nextOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(nextOrders[0].id)
    }
  }

  function openReceiptDetail(order: PurchaseReceiptOrder) {
    setSelectedOrderId(order.id)
    setReceiptDetailKeyword('')
    setReceiptDetailScopeFilter('all')
    setReceiptDetailOpen(true)
  }

  function closeReceiptDetail() {
    setReceiptDetailOpen(false)
  }

  function openProductSpecsForReadyItem(item: ReadyShipmentRow) {
    const params = new URLSearchParams()
    if (item.psku) {
      params.set('keyword', item.psku)
    }
    const targetPath = withCurrentWorkspaceDevQuery(`${PRODUCT_SPECS_PATH}?${params.toString()}`)
    window.location.assign(targetPath)
  }

  function renderReadySpecAction(item: ReadyShipmentRow) {
    return (
      <Space direction="vertical" size={4}>
        {renderSpecStatus(item.specStatus)}
        <Button
          aria-label={`编辑 ${item.psku} 规格`}
          icon={<EditOutlined />}
          size="small"
          type={item.specStatus === 'missing' ? 'primary' : 'default'}
          onClick={() => openProductSpecsForReadyItem(item)}
        >
          编辑规格
        </Button>
      </Space>
    )
  }

  function openDispatchTargetModal(source: ReadyShipmentItem) {
    setDispatchTargetModal({
      source,
      targetSiteCode: source.targetSiteCode || source.siteCode,
      targetTransportMode: toDispatchTargetTransportMode(source.targetTransportMode || source.transportMode)
    })
  }

  function closeDispatchTargetModal() {
    if (dispatchTargetSubmitting) {
      return
    }
    setDispatchTargetModal(undefined)
  }

  function updateDispatchTargetModal(patch: Partial<Omit<DispatchTargetModalState, 'source'>>) {
    setDispatchTargetModal((current) => current ? { ...current, ...patch } : current)
  }

  async function confirmDispatchTargetOverride() {
    if (!dispatchTargetModal) {
      return
    }
    const { source, targetSiteCode, targetTransportMode } = dispatchTargetModal
    if (!source.fulfillmentBalanceId) {
      message.error('缺少库存来源身份，不能调整发货目标。')
      return
    }
    setDispatchTargetSubmitting(true)
    try {
      await updateReadyItemDispatchTarget(source.fulfillmentBalanceId, {
        targetSiteCode,
        targetTransportMode
      })
      setDispatchTargetModal(undefined)
      try {
        await refreshWarehouseData()
      } catch {
        message.warning('库存计划已保存，列表刷新失败，可稍后手动刷新。')
      }
      message.success('库存计划已保存。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存库存计划失败')
    } finally {
      setDispatchTargetSubmitting(false)
    }
  }

  async function openLogisticsPlanModal() {
    if (!selectedPlan) {
      return
    }
    if (!selectedPlan.lines.length) {
      message.warning('发货申请单中还没有商品。')
      return
    }
    setShippingRouteOptions([])
    setSelectedLogisticsForwarderCodes([])
    setLogisticsPlanError(undefined)
    setLogisticsPlanModalOpen(true)
    setShippingRouteOptionsLoading(true)
    try {
      const options = await loadDispatchPlanShippingRouteOptions(selectedPlan.id)
      setShippingRouteOptions(options)
      setSelectedLogisticsForwarderCodes(buildShippingForwarderChoices(options).map((choice) => choice.forwarderCode))
    } catch (error) {
      setShippingRouteOptions([])
      setSelectedLogisticsForwarderCodes([])
      const errorMessage = error instanceof Error ? error.message : '读取物流渠道失败'
      setLogisticsPlanError(errorMessage)
      message.error(errorMessage)
    } finally {
      setShippingRouteOptionsLoading(false)
    }
  }

  function closeLogisticsPlanModal() {
    if (logisticsSubmitting) {
      return
    }
    setLogisticsPlanError(undefined)
    setLogisticsPlanModalOpen(false)
  }

  async function generateLogisticsPlan() {
    if (!selectedPlan) {
      return
    }
    if (!selectedLogisticsForwarderCodes.length) {
      message.warning('请选择至少一个物流渠道。')
      return
    }
    setLogisticsPlanError(undefined)
    setLogisticsSubmitting(true)
    try {
      const batch = await createShippingBatchFromDispatchPlan(selectedPlan.id, {
        selectedForwarderCodes: selectedLogisticsForwarderCodes
      })
      const recommendedOption = chooseShippingOption(batch.options)
      setGeneratedShippingBatch(batch)
      setSelectedShippingOptionId(recommendedOption?.id)
      setLogisticsPlanModalOpen(false)
      await refreshWarehouseData()
      setSelectedPlanId(selectedPlan.id)
      message.success('已生成物流计划，请选择物流方案后进入装箱。')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成物流计划失败'
      setLogisticsPlanError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLogisticsSubmitting(false)
    }
  }

  async function confirmLogisticsAndCreateOutbound() {
    if (!generatedShippingBatch || !selectedShippingOptionId) {
      message.warning('请先选择物流方案。')
      return
    }
    setOutboundSubmitting(true)
    try {
      await issueShippingBatch(generatedShippingBatch.id, selectedShippingOptionId)
      setPackingListRefreshKey((current) => current + 1)
      await refreshWarehouseData()
      setShippingCostDrawerOpen(false)
      setDispatchPlanDetailOpen(false)
      setActiveTab('packing-list')
      message.success('已下发发货单和装箱单，仓库可以开始装箱。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '下发仓库单失败')
    } finally {
      setOutboundSubmitting(false)
    }
  }

  const tabItems = [
    {
      key: 'warehouse-order',
      label: buildTabLabel('仓库单', 0, 'operations'),
      children: <WarehouseShippingOrderPanel embedded session={session} />
    },
    {
      key: 'receipt-list',
      label: buildTabLabel('采购收货', totalSummary.receiptTodoOrderCount),
      children: (
        <div className="warehouse-dispatch-panel">
          <div className="warehouse-dispatch-toolbar warehouse-dispatch-receipt-toolbar">
            <div className="warehouse-dispatch-toolbar-left">
              <Input
                className="warehouse-dispatch-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索仓库单 / 采购单 / PSKU / 商品"
                value={receiptKeyword}
                onChange={(event) => setReceiptKeyword(event.target.value)}
              />
              <Select
                className="warehouse-dispatch-filter-select warehouse-dispatch-store-filter"
                value={receiptStoreFilter}
                options={[{ label: '全部店铺', value: 'all' }, ...receiptStoreOptions]}
                onChange={(value) => setReceiptStoreFilter(value)}
              />
              <Select
                className="warehouse-dispatch-filter-select warehouse-dispatch-site-filter"
                value={receiptSiteFilter}
                options={[{ label: '全部站点', value: 'all' }, ...receiptSiteOptions]}
                onChange={(value) => setReceiptSiteFilter(value as ReceiptSiteFilterKey)}
              />
              <Segmented<ReceiptScopeFilterKey>
                className="warehouse-dispatch-receipt-scope"
                size="small"
                value={receiptScopeFilter}
                options={[
                  { label: `待处理 ${totalSummary.receiptTodoOrderCount}`, value: 'todo' },
                  { label: `全部 ${totalSummary.orderCount}`, value: 'all' }
                ]}
                onChange={(value) => setReceiptScopeFilter(value)}
              />
              {renderReceiptQuickFilters(filteredOrderSummaries)}
              {dataError ? <Tag color="red">{dataError}</Tag> : null}
            </div>
          </div>
          <Table
            rowKey={receiptOrderBusinessScopeKey}
            size="small"
            columns={receiptOrderColumns}
            dataSource={visibleReceiptOrders}
            loading={dataLoading}
            pagination={RECEIPT_ORDER_TABLE_PAGINATION}
            rowClassName="warehouse-dispatch-clickable-row"
            onRow={(order) => ({
              onClick: () => openReceiptDetail(order)
            })}
          />
        </div>
      )
    },
    {
      key: 'ship-ready',
      label: buildTabLabel('库存', allReadyItems.length),
      children: (
        <div className="warehouse-dispatch-panel">
          <div className="warehouse-dispatch-toolbar">
            <div className="warehouse-dispatch-toolbar-left">
              <Segmented
                size="small"
                value={readyFilter}
                options={READY_FILTER_OPTIONS.map((option) => ({ ...option, label: option.label }))}
                onChange={(value) => setReadyFilter(value as ReadyFilterKey)}
              />
            </div>
          </div>
          <Table
            rowKey="id"
            size="small"
            columns={readyItemColumns}
            dataSource={visibleReadyItems}
            loading={dataLoading}
            pagination={READY_ITEM_TABLE_PAGINATION}
            locale={{ emptyText: <Empty description="暂无库存" /> }}
          />
        </div>
      )
    },
    {
      key: 'dispatch-plan',
      label: buildTabLabel('发货申请单', dispatchPlans.length, 'operations'),
      children: (
        <div className="warehouse-dispatch-panel">
          <div className="warehouse-dispatch-toolbar">
            <div className="warehouse-dispatch-toolbar-left">
              <Text strong>发货申请单列表</Text>
              {dataError ? <Tag color="red">{dataError}</Tag> : null}
            </div>
            <div className="warehouse-dispatch-toolbar-right">
              <Button icon={<ReloadOutlined />} loading={dataLoading} onClick={() => { void refreshWarehouseData() }}>
                刷新
              </Button>
            </div>
          </div>
          <Table
            className="warehouse-dispatch-plan-table"
            rowKey="id"
            size="small"
            columns={dispatchPlanColumns}
            dataSource={dispatchPlans}
            loading={dataLoading}
            pagination={DISPATCH_PLAN_TABLE_PAGINATION}
            scroll={{ x: 1500 }}
            rowClassName={(plan) => (plan.id === selectedPlan?.id ? 'warehouse-dispatch-selected-row' : '')}
            locale={{ emptyText: <Empty description="暂无发货申请单，请先在仓管 APP 发起" /> }}
            onRow={(plan) => ({
              onClick: () => handleSelectDispatchPlan(plan.id)
            })}
          />
        </div>
      )
    },
    {
      key: 'packing-list',
      label: buildTabLabel('装箱单', 0),
      children: <WarehousePackingListPanel key={packingListRefreshKey} />
    }
  ]

  return (
    <div className="warehouse-dispatch-page">
      <div className="warehouse-dispatch-header">
        {renderSummaryGrid(
          [
            ['待处理', totalSummary.receiptTodoOrderCount],
            ['全部仓库单', totalSummary.orderCount],
            ['应收件数', totalSummary.expectedQty],
            ['已收件数', totalSummary.receivedQty],
            ['可发运', totalSummary.readyQty],
            ['规格缺失', totalSummary.missingSpecCount]
          ],
          'warehouse-dispatch-header-summary'
        )}
      </div>

      <div className="warehouse-dispatch-workbench">
        <Tabs
          className="warehouse-dispatch-tabs"
          activeKey={activeTab}
          destroyInactiveTabPane
          items={tabItems}
          onChange={(key) => setActiveTab(key as WarehouseDispatchTabKey)}
        />
      </div>

      <Modal
        className="warehouse-dispatch-plan-detail-modal"
        title={selectedPlan ? `${selectedPlan.planNo} 发货申请单详情` : '发货申请单详情'}
        open={dispatchPlanDetailOpen}
        width="min(1520px, 96vw)"
        footer={null}
        onCancel={() => setDispatchPlanDetailOpen(false)}
      >
        {selectedPlan ? (
          <div className="warehouse-dispatch-plan-detail is-modal">
            <div className="warehouse-dispatch-detail-header">
              <Space size={8} wrap>
                <Text strong>商品明细</Text>
                {renderDispatchStatus(selectedPlan.status)}
                {generatedShippingBatch ? <Tag color="blue">{generatedShippingBatch.batchNo}</Tag> : null}
                <Tag>{sumPlanQuantity(selectedPlan)} 件</Tag>
                <Tag>{selectedPlan.lines.length} PSKU</Tag>
              </Space>
              {shippingBatchLoadingId === selectedPlan.currentShippingBatch?.id ? (
                <Tag color="processing">物流方案加载中</Tag>
              ) : !selectedPlan.currentShippingBatch ? (
                <Button
                  type="primary"
                  icon={<TruckOutlined />}
                  disabled={!['draft', 'handoff_failed'].includes(selectedPlan.status)}
                  loading={shippingRouteOptionsLoading || logisticsSubmitting}
                  onClick={() => { void openLogisticsPlanModal() }}
                >
                  生成物流计划
                </Button>
              ) : null}
            </div>
            {generatedShippingBatch ? (
              <div className="warehouse-dispatch-shipping-selection-bar">
                <div className="warehouse-dispatch-shipping-selection-control">
                  <Text strong>提交物流方案</Text>
                  <Select
                    className="warehouse-dispatch-shipping-option-select"
                    aria-label="提交物流方案"
                    value={selectedShippingOptionId}
                    placeholder="请选择最终提交方案"
                    options={generatedShippingBatch.options.map((option) => ({
                      value: option.id,
                      label: `${option.optionName} · ${formatShippingOptionAmount(option)}`
                    }))}
                    onChange={setSelectedShippingOptionId}
                  />
                  {selectedShippingOption ? (
                    selectedShippingOption.warningCount > 0 || selectedShippingOption.blockedReasons.length > 0
                      ? <Tag color="gold">需复核</Tag>
                      : <Tag color="green">可提交</Tag>
                  ) : null}
                  {selectedShippingOption ? (
                    <Text className="warehouse-dispatch-shipping-option-amount" strong>
                      {formatShippingOptionAmount(selectedShippingOption)}
                    </Text>
                  ) : null}
                </div>
                <Space className="warehouse-dispatch-shipping-selection-actions" size={8} wrap>
                  <Button
                    type="primary"
                    ghost
                    icon={<CheckCircleOutlined />}
                    disabled={!selectedShippingOptionId}
                    loading={outboundSubmitting}
                    onClick={confirmLogisticsAndCreateOutbound}
                  >
                    {generatedShippingBatch.status === 'OUTBOUND_CREATED' ? '同步发货单' : '确认物流并下发发货单'}
                  </Button>
                </Space>
              </div>
            ) : null}
            <div className={`warehouse-dispatch-plan-layout${generatedShippingBatch ? ' is-generated' : ''}`}>
              <div>
                <Table
                  rowKey="id"
                  size="small"
                  columns={dispatchPlanLineColumns}
                  dataSource={selectedPlan.lines}
                  loading={dataLoading}
                  pagination={DISPATCH_PLAN_LINE_TABLE_PAGINATION}
                  locale={{ emptyText: <Empty description="当前发货申请单还没有商品" /> }}
                />
              </div>
              {!generatedShippingBatch ? (
                <div className="warehouse-dispatch-route-list">
                  <div className="warehouse-dispatch-route-list-title">申请单物流分组</div>
                  {selectedPlanRouteGroups.length ? (
                    selectedPlanRouteGroups.map((group) =>
                      renderRouteGroup(group, selectedRouteGroupKey, setSelectedRouteGroupKey)
                    )
                  ) : (
                    <Empty description="暂无物流分组" />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <Empty description="暂无发货申请单" />
        )}
      </Modal>

      <Drawer
        title="物流方案费用对比"
        open={shippingCostDrawerOpen}
        width="min(1480px, 96vw)"
        onClose={() => setShippingCostDrawerOpen(false)}
        footer={generatedShippingBatch ? (
          <div className="warehouse-dispatch-cost-drawer-footer">
            <div className="warehouse-dispatch-cost-drawer-selection">
              <Text type="secondary">
                {generatedShippingBatch.status === 'OUTBOUND_CREATED' ? '已下发物流方案' : '最终物流方案'}
              </Text>
              {selectedShippingOption ? (
                <Space size={8} wrap>
                  <Text strong>{selectedShippingOption.optionName}</Text>
                  <Text>{formatShippingOptionAmount(selectedShippingOption)}</Text>
                  {generatedShippingBatch.status === 'OUTBOUND_CREATED' ? <Tag>方案已锁定</Tag> : null}
                  {selectedShippingOption.warningCount > 0 || selectedShippingOption.blockedReasons.length > 0
                    ? <Tag color="gold">需复核</Tag>
                    : <Tag color="green">可提交</Tag>}
                </Space>
              ) : <Text type="warning">尚未选择</Text>}
            </div>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={!selectedShippingOptionId}
              loading={outboundSubmitting}
              onClick={confirmLogisticsAndCreateOutbound}
            >
              {generatedShippingBatch.status === 'OUTBOUND_CREATED' ? '同步发货单' : '确认物流并下发发货单'}
            </Button>
          </div>
        ) : null}
      >
        {generatedShippingBatch && shippingCostDetailOption ? (
          <div className="warehouse-dispatch-cost-drawer">
            {renderShippingOptionCostComparison(
              generatedShippingBatch.options,
              selectedShippingOptionId,
              shippingCostDetailOption.id,
              setShippingCostDetailOptionId,
              selectShippingOptionFromCostComparison,
              generatedShippingBatch.status === 'OUTBOUND_CREATED'
            )}
            {renderShippingCostBreakdown(shippingCostDetailOption)}
          </div>
        ) : <Empty description="请先选择物流方案" />}
      </Drawer>

      <Drawer
        title={selectedReceiptOrder ? `${selectedReceiptOrder.title || selectedReceiptOrder.orderNo} 收货详情` : '收货详情'}
        open={receiptDetailOpen}
        width={1080}
        onClose={closeReceiptDetail}
      >
        {selectedReceiptOrder ? (
          <div className="warehouse-dispatch-receipt-detail">
            {renderReceiptOrderSummary(selectedReceiptOrder, selectedReceiptSummary)}
            <div className="warehouse-dispatch-receipt-detail-toolbar">
              <Segmented<ReceiptDetailScopeFilterKey>
                value={receiptDetailScopeFilter}
                options={buildReceiptDetailScopeOptions(selectedReceiptOrder.items)}
                onChange={(value) => setReceiptDetailScopeFilter(value)}
              />
              <Input
                className="warehouse-dispatch-receipt-detail-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索 PSKU / 商品 / 采购单"
                value={receiptDetailKeyword}
                onChange={(event) => setReceiptDetailKeyword(event.target.value)}
              />
            </div>
            <Table<PurchaseReceiptItem>
              rowKey={receiptProductBusinessScopeKey}
              size="small"
              columns={receiptDetailColumns}
              dataSource={receiptDetailItems}
              pagination={RECEIPT_ITEM_TABLE_PAGINATION}
              scroll={{ x: 1020 }}
              locale={{ emptyText: <Empty description="没有符合条件的收货明细" /> }}
            />
          </div>
        ) : (
          <Empty description="未找到收货详情" />
        )}
      </Drawer>

      <Modal
        title="选择物流渠道"
        open={logisticsPlanModalOpen}
        confirmLoading={logisticsSubmitting}
        okText="生成物流计划"
        cancelText="取消"
        onCancel={closeLogisticsPlanModal}
        onOk={() => { void generateLogisticsPlan() }}
        okButtonProps={{ disabled: !selectedLogisticsForwarderCodes.length || shippingRouteOptionsLoading }}
      >
        <Space direction="vertical" size={12} className="warehouse-dispatch-logistics-modal">
          {logisticsPlanError ? (
            <Alert type="error" showIcon message={logisticsPlanError} />
          ) : null}
          <Text type="secondary">
            选择本次参与比较的货代，系统会生成单货代和两两组合方案，并按商品行选择最低费用。
          </Text>
          {shippingRouteOptionsLoading ? (
            <Text type="secondary">正在读取可用渠道...</Text>
          ) : logisticsForwarderChoices.length ? (
            <Checkbox.Group
              className="warehouse-dispatch-forwarder-choice-list"
              value={selectedLogisticsForwarderCodes}
              onChange={(values) => setSelectedLogisticsForwarderCodes(values.map(String))}
            >
              {logisticsForwarderChoices.map((choice) => (
                <label className="warehouse-dispatch-forwarder-choice" key={choice.forwarderCode}>
                  <Checkbox value={choice.forwarderCode} />
                  <span className="warehouse-dispatch-forwarder-choice-body">
                    <Text strong>{choice.forwarderName}</Text>
                    <Text type="secondary">
                      {choice.routes.map((route) =>
                        `${SITE_LABELS[route.siteCode]} ${TRANSPORT_LABELS[route.transportMode]} · ${route.routeName}`
                      ).join('；')}
                    </Text>
                  </span>
                </label>
              ))}
            </Checkbox.Group>
          ) : (
            <Empty description="当前申请单没有可用物流渠道" />
          )}
        </Space>
      </Modal>

      <Modal
        title="调整发货目标"
        open={Boolean(dispatchTargetModal)}
        confirmLoading={dispatchTargetSubmitting}
        okText="保存计划"
        cancelText="取消"
        onCancel={closeDispatchTargetModal}
        onOk={() => { void confirmDispatchTargetOverride() }}
        okButtonProps={{ disabled: !dispatchTargetModal }}
      >
        {dispatchTargetModal ? (
          <Space direction="vertical" size={12} className="warehouse-dispatch-target-modal">
            <div className="warehouse-dispatch-target-summary">
              <div className="warehouse-dispatch-target-summary-psku">
                <Text type="secondary">PSKU</Text>
                <Text strong>{dispatchTargetModal.source.psku}</Text>
              </div>
              <div>
                <Text type="secondary">来源</Text>
                <Text strong>{dispatchTargetModal.source.orderTitle || dispatchTargetModal.source.orderNo || '-'}</Text>
              </div>
              <div>
                <Text type="secondary">原计划</Text>
                <Text strong>
                  {SITE_LABELS[dispatchTargetModal.source.originalSiteCode || dispatchTargetModal.source.siteCode]} / {TRANSPORT_LABELS[dispatchTargetModal.source.originalTransportMode || dispatchTargetModal.source.transportMode]}
                </Text>
              </div>
              <div>
                <Text type="secondary">当前可发</Text>
                <Text strong>{dispatchTargetModal.source.availableQty}</Text>
              </div>
            </div>
            <div className="warehouse-dispatch-target-section">
              <Text strong className="warehouse-dispatch-target-section-title">发货目标</Text>
              <div className="warehouse-dispatch-target-fields">
                <label className="warehouse-dispatch-target-field">
                  <span className="warehouse-dispatch-field-label">目标站点</span>
                  <Select<WarehouseSiteCode>
                    value={dispatchTargetModal.targetSiteCode}
                    options={DISPATCH_TARGET_SITE_OPTIONS}
                    onChange={(targetSiteCode) => updateDispatchTargetModal({ targetSiteCode })}
                  />
                </label>
                <label className="warehouse-dispatch-target-field">
                  <span className="warehouse-dispatch-field-label">运输方式</span>
                  <Select<DispatchTargetTransportMode>
                    value={dispatchTargetModal.targetTransportMode}
                    options={DISPATCH_TARGET_TRANSPORT_OPTIONS}
                    onChange={(targetTransportMode) => updateDispatchTargetModal({ targetTransportMode })}
                  />
                </label>
              </div>
            </div>
          </Space>
        ) : null}
      </Modal>

    </div>
  )
}

async function loadWarehouseDataset(): Promise<WarehouseDataset> {
  const [orders, readyItems, dispatchPlans] = await Promise.all([
    loadWarehouseReceiptOrders(),
    loadReadyShipmentItems(),
    loadDispatchPlans()
  ])
  return { orders, readyItems, dispatchPlans }
}

function buildTabLabel(label: string, count: number, tone?: 'operations') {
  return (
    <span className={`warehouse-dispatch-tab-label${tone === 'operations' ? ' is-operations' : ''}`}>
      {label}
      <Badge count={count} overflowCount={9999} size="small" offset={[6, -2]} />
    </span>
  )
}

function renderReceiptQuickFilters(orderSummaries: Map<string, ReceiptOrderSummary>) {
  const statusCounts = Array.from(orderSummaries.values()).reduce<Record<ReceiptStatus, number>>(
    (counts, summary) => ({ ...counts, [summary.status]: counts[summary.status] + 1 }),
    { pending: 0, partial: 0, ready: 0, planned: 0, exception: 0 }
  )
  const visibleStatuses: ReceiptStatus[] = ['pending', 'partial', 'exception', 'ready']
  return (
    <>
      {visibleStatuses.map((status) => (
        <Tag key={status} color={RECEIPT_STATUS_META[status].color}>
          {RECEIPT_STATUS_META[status].label} {statusCounts[status]}
        </Tag>
      ))}
    </>
  )
}

function buildReceiptStoreOptions(
  orders: PurchaseReceiptOrder[],
  userStores?: AuthSession['userStores'],
  currentStore?: AuthSession['currentStore']
): ReceiptStoreOption[] {
  const optionMap = new Map<string, ReceiptStoreOption>()
  ;[...(userStores || []), currentStore].forEach((store) => {
    if (!store?.storeCode || store.authorized === false) {
      return
    }
    const labelParts = [
      store.projectName || store.projectCode || store.storeCode,
      store.site
    ].filter(Boolean)
    optionMap.set(store.storeCode, {
      value: store.storeCode,
      label: labelParts.join(' / ')
    })
  })
  orders.forEach((order) => {
    const value = receiptStoreFilterValue(order)
    if (!value) {
      return
    }
    const orderLabel = receiptOrderDisplayStoreName(order)
    const currentOption = optionMap.get(value)
    if (currentOption && !shouldPreferOrderStoreLabel(currentOption.label, orderLabel)) {
      return
    }
    optionMap.set(value, {
      value,
      label: orderLabel || value
    })
  })
  return Array.from(optionMap.values())
}

function buildReceiptSiteOptions(orders: PurchaseReceiptOrder[]) {
  const siteCodes = new Set<WarehouseSiteCode>()
  orders.forEach((order) => {
    order.items.forEach((item) => siteCodes.add(item.siteCode))
  })
  return Array.from(siteCodes)
    .sort()
    .map((siteCode) => ({ label: SITE_LABELS[siteCode], value: siteCode }))
}

function filterReceiptOrders(
  orders: PurchaseReceiptOrder[],
  keyword: string,
  storeFilter: string,
  siteFilter: ReceiptSiteFilterKey
) {
  const normalizedKeyword = normalizeSearchText(keyword)
  return orders.flatMap((order) => {
    if (storeFilter !== 'all' && receiptStoreFilterValue(order) !== storeFilter) {
      return []
    }
    const siteScopedItems = siteFilter === 'all'
      ? order.items
      : order.items.filter((item) => item.siteCode === siteFilter)
    if (!siteScopedItems.length) {
      return []
    }
    if (!normalizedKeyword) {
      return [{ ...order, items: siteScopedItems }]
    }
    if (receiptOrderMatchesKeyword(order, normalizedKeyword)) {
      return [{ ...order, items: siteScopedItems }]
    }
    const matchedItems = siteScopedItems.filter((item) => receiptItemMatchesKeyword(item, normalizedKeyword))
    return matchedItems.length ? [{ ...order, items: matchedItems }] : []
  })
}

function receiptOrderMatchesKeyword(order: PurchaseReceiptOrder, normalizedKeyword: string) {
  return [
    order.orderNo,
    order.title,
    order.storeName,
    order.storeCode
  ].some((value) => includesSearchText(value, normalizedKeyword))
}

function receiptItemMatchesKeyword(item: PurchaseReceiptItem, normalizedKeyword: string) {
  return [
    item.psku,
    item.title,
    item.orderNo,
    item.purchaseOrderTitle,
    item.siteCode,
    item.transportMode
  ].some((value) => includesSearchText(value, normalizedKeyword))
}

function filterReceiptDetailItems(
  items: PurchaseReceiptItem[],
  keyword: string,
  scopeFilter: ReceiptDetailScopeFilterKey
) {
  const normalizedKeyword = normalizeSearchText(keyword)
  return items.filter((item) => {
    const remainingQty = receiptRemainingQuantity(item)
    if (scopeFilter === 'pending' && remainingQty <= 0) {
      return false
    }
    if (scopeFilter === 'completed' && remainingQty > 0) {
      return false
    }
    return !normalizedKeyword || receiptItemMatchesKeyword(item, normalizedKeyword)
  })
}

function buildReceiptDetailScopeOptions(items: PurchaseReceiptItem[]) {
  const pendingCount = items.filter((item) => receiptRemainingQuantity(item) > 0).length
  return [
    { label: `全部 ${items.length}`, value: 'all' as const },
    { label: `待收 ${pendingCount}`, value: 'pending' as const },
    { label: `已完成 ${items.length - pendingCount}`, value: 'completed' as const }
  ]
}

function receiptRemainingQuantity(item: PurchaseReceiptItem) {
  return Math.max(0, item.expectedQty - item.receivedQty)
}

function formatReceiptQuantity(value: number) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function receiptStoreFilterValue(order: PurchaseReceiptOrder) {
  return String(order.storeCode || order.storeName || '').trim()
}

function receiptOrderDisplayStoreName(order: PurchaseReceiptOrder) {
  return formatWarehouseStoreDisplayName(order.storeName, order.title || order.orderNo, order.storeCode)
}

function formatWarehouseStoreDisplayName(storeName?: string, sourceName?: string, fallback?: string) {
  const rawName = String(storeName || '').trim()
  const inferredName = inferStoreNameFromSourceName(sourceName)
  if (isProjectCodeLike(rawName) && inferredName) {
    return inferredName
  }
  return rawName || inferredName || String(fallback || '').trim() || '-'
}

function inferStoreNameFromSourceName(sourceName?: string) {
  const text = String(sourceName || '').trim()
  const match = /^([A-Za-z][A-Za-z0-9_-]*?)-\d{4,}/.exec(text)
  return match?.[1]
}

function isProjectCodeLike(value?: string) {
  return /^PRJ\d+$/i.test(String(value || '').trim())
}

function shouldPreferOrderStoreLabel(currentLabel: string, orderLabel: string) {
  const normalizedCurrent = String(currentLabel || '').trim()
  const normalizedOrderLabel = String(orderLabel || '').trim()
  if (!normalizedOrderLabel) {
    return false
  }
  return isProjectCodeLike(normalizedCurrent) || normalizedCurrent.length > 24
}

function includesSearchText(value: unknown, normalizedKeyword: string) {
  return normalizeSearchText(value).includes(normalizedKeyword)
}

function normalizeSearchText(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function renderSummaryGrid(items: Array<[string, ReactNode]>, className?: string) {
  return (
    <div className={['warehouse-dispatch-summary-grid', className].filter(Boolean).join(' ')}>
      {items.map(([label, value]) => (
        <div className="warehouse-dispatch-metric" key={label}>
          <span className="warehouse-dispatch-metric-value">{value}</span>
          <span className="warehouse-dispatch-metric-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

function renderReceiptOrderSummary(order: PurchaseReceiptOrder, summary?: ReceiptOrderSummary) {
  const safeSummary = summary ?? summarizeReceiptOrder(order)
  return (
    <div className="warehouse-dispatch-receipt-summary-card">
      {renderReceiptSummaryItem('仓库单', `${order.title || order.orderNo} · ${order.orderNo}`, true)}
      {renderReceiptSummaryItem('商品', `${safeSummary.pskuCount} PSKU`)}
      {renderReceiptSummaryItem('应收', formatReceiptQuantity(safeSummary.expectedQty))}
      {renderReceiptSummaryItem('已收', formatReceiptQuantity(safeSummary.receivedQty))}
      {renderReceiptSummaryItem('未收', formatReceiptQuantity(safeSummary.remainingQty))}
      {renderReceiptSummaryItem('收货状态', renderReceiptStatus(safeSummary.status))}
    </div>
  )
}

function renderReceiptSummaryItem(label: string, value: ReactNode, strong = false) {
  return (
    <div className="warehouse-dispatch-receipt-summary-item">
      <span className="warehouse-dispatch-receipt-summary-label">{label}</span>
      <span className={strong ? 'warehouse-dispatch-receipt-summary-value is-strong' : 'warehouse-dispatch-receipt-summary-value'}>
        {value}
      </span>
    </div>
  )
}

function renderReceiptStatus(status: ReceiptStatus) {
  const meta = RECEIPT_STATUS_META[status]
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function renderReceiptItemStatus(item: PurchaseReceiptItem) {
  const remainingQty = receiptRemainingQuantity(item)
  if (remainingQty <= 0) {
    return <Tag color="green">已完成</Tag>
  }
  if (item.receivedQty > 0) {
    return <Tag color="blue">部分收货</Tag>
  }
  return <Tag color="gold">待收货</Tag>
}

function renderDispatchStatus(status: DispatchPlanStatus) {
  const meta = DISPATCH_STATUS_META[status]
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function renderTransportMode(mode: WarehouseTransportMode) {
  if (mode === 'UNSPECIFIED') {
    return <Tag>{TRANSPORT_LABELS[mode]}</Tag>
  }
  return <Tag color={mode === 'AIR' ? 'geekblue' : 'cyan'}>{TRANSPORT_LABELS[mode]}</Tag>
}

function renderFulfillmentType(type?: WarehouseFulfillmentType) {
  const fulfillmentType = type || 'WAREHOUSE_RECEIPT'
  return (
    <Tag color={fulfillmentType === 'FACTORY_DIRECT' ? 'purple' : 'blue'}>
      {FULFILLMENT_LABELS[fulfillmentType]}
    </Tag>
  )
}

function renderSpecStatus(status: ProductSpecStatus) {
  return status === 'complete' ? <Tag color="green">完整</Tag> : <Tag color="gold">规格缺失</Tag>
}

function renderReadyProductCell(
  item: ReadyShipmentItem,
  productBaselineByPsku: Record<string, ProductBaselineSummary>
) {
  return renderWarehouseProductCell({
    psku: item.psku,
    title: item.title,
    imageUrl: item.imageUrl,
    baseline: productBaselineByPsku[normalizeProductKey(item.psku)]
  })
}

function renderWarehouseProductCell({
  psku,
  title: fallbackTitle,
  imageUrl: fallbackImageUrl,
  baseline
}: {
  psku: string
  title?: string
  imageUrl?: string
  baseline?: ProductBaselineSummary
}) {
  const imageUrl = normalizeNoonImageUrl(baseline?.imageUrl || fallbackImageUrl)
  const title = selectWarehouseProductTitle(fallbackTitle, baseline?.title)
  return (
    <div className="warehouse-dispatch-product-cell">
      {renderWarehouseProductThumb(imageUrl, title || psku, psku)}
      <div className="warehouse-dispatch-product-main">
        <div className="warehouse-dispatch-product-title-line">
          <Text strong>{psku}</Text>
          {baseline?.detailBaselineStatus ? (
            <Tag color={baseline.detailBaselineStatus === 'ready' ? 'green' : 'gold'}>
              基线{baselineStatusLabel(baseline.detailBaselineStatus)}
            </Tag>
          ) : null}
        </div>
        <Text className="warehouse-dispatch-product-title" type="secondary">
          {title || '未命名商品'}
        </Text>
      </div>
    </div>
  )
}

function renderWarehouseProductThumb(imageUrl: string | undefined, alt: string, psku: string) {
  const thumb = (
    <div className={`warehouse-dispatch-product-thumb${imageUrl ? ' is-previewable' : ''}`}>
      {imageUrl ? <img src={imageUrl} alt={alt} loading="lazy" decoding="async" /> : <span>{psku.slice(0, 2)}</span>}
    </div>
  )

  if (!imageUrl) {
    return thumb
  }

  return (
    <Popover
      placement="right"
      mouseEnterDelay={0.12}
      styles={{ body: { padding: 6 } }}
      content={
        <img
          src={imageUrl}
          alt={alt}
          style={{
            width: 240,
            maxWidth: '60vw',
            maxHeight: 320,
            objectFit: 'contain',
            display: 'block'
          }}
        />
      }
    >
      {thumb}
    </Popover>
  )
}

function selectWarehouseProductTitle(primaryTitle?: string, fallbackTitle?: string) {
  if (hasCjkText(primaryTitle)) {
    return primaryTitle
  }
  return primaryTitle || fallbackTitle
}

function hasCjkText(value?: string) {
  return /[\u3400-\u9fff]/.test(String(value || ''))
}

function renderReadySourceCell(
  item: ReadyShipmentRow,
  orderMetaById: Map<string, ReceiptOrderMeta>,
  onModifyPlan: (source: ReadyShipmentItem) => void
) {
  return (
    <div className="warehouse-dispatch-source-list">
      {buildReadySourceRows(item.items.length ? item.items : [item], orderMetaById).map((source) => (
        <div className="warehouse-dispatch-ready-source-row" key={source.key}>
          <span className="warehouse-dispatch-ready-source-main">
            <Text strong>{source.orderTitle || source.orderNo}</Text>
            <span className="warehouse-dispatch-ready-source-separator">/</span>
            <Text type="secondary">{formatReceiptSourceDate(source.orderCreatedAt)}</Text>
          </span>
          <span className="warehouse-dispatch-ready-source-meta">
            <Tag color="blue">{source.targetSiteCode}</Tag>
            {renderLogisticsQuoteStatus(source.logisticsQuoteStatus, source.logisticsShippingSubmitStatus)}
            <span className="warehouse-dispatch-source-qty">可发 {source.availableQty}</span>
            <span className="warehouse-dispatch-source-qty">
              当前计划 {TRANSPORT_LABELS[source.targetTransportMode]}
            </span>
            <span className="warehouse-dispatch-source-qty">
              原计划 {source.originalSiteCode}/{TRANSPORT_LABELS[source.plannedTransportMode]}
            </span>
            <Button
              className="warehouse-dispatch-ready-source-action"
              size="small"
              type="link"
              disabled={!source.item.fulfillmentBalanceId || source.item.availableQty <= 0}
              onClick={(event) => {
                event.stopPropagation()
                onModifyPlan(source.item)
              }}
            >
              修改计划
            </Button>
          </span>
        </div>
      ))}
    </div>
  )
}

function renderReadyQuoteCell(item: ReadyShipmentRow) {
  const blockingCount = item.items.filter((source) => source.logisticsQuoteBlocking).length
  return (
    <Space direction="vertical" size={2}>
      {renderLogisticsQuoteStatus(item.logisticsQuoteStatus, item.logisticsShippingSubmitStatus)}
      {blockingCount ? <Text type="secondary">{blockingCount} 个来源待处理</Text> : null}
    </Space>
  )
}

function renderLogisticsQuoteStatus(quoteStatus?: string, shippingSubmitStatus?: string) {
  if (quoteStatus !== 'CONFIRMED') {
    return <Tag color="gold">待报价</Tag>
  }
  if (shippingSubmitStatus !== 'SUBMITTED') {
    return <Tag color="orange">未提交发货</Tag>
  }
  return <Tag color="green">可装箱</Tag>
}

function renderReadyFulfillmentCell(item: ReadyShipmentRow) {
  const fulfillmentTypes = uniqueFulfillmentTypes(item.items.map((source) => source.fulfillmentType || item.fulfillmentType))
  if (fulfillmentTypes.length <= 1) {
    return renderFulfillmentType(fulfillmentTypes[0])
  }
  return (
    <Space size={0} wrap>
      {fulfillmentTypes.map((fulfillmentType) => renderFulfillmentType(fulfillmentType))}
    </Space>
  )
}

function renderReadySiteCell(item: ReadyShipmentRow) {
  return (
    <Space size={0} wrap>
      {uniqueReadySiteCodes(item).map((siteCode) => (
        <Tag color="blue" key={siteCode}>{siteCode}</Tag>
      ))}
    </Space>
  )
}

function baselineStatusLabel(status: string) {
  if (status === 'ready') {
    return '完整'
  }
  if (status === 'missing') {
    return '缺失'
  }
  if (status === 'preparing') {
    return '准备中'
  }
  if (status === 'failed') {
    return '失败'
  }
  return status
}

function renderRouteGroup(
  group: RouteGroup,
  selectedRouteGroupKey?: string,
  onSelect?: (routeGroupKey: string) => void
) {
  const selected = group.key === selectedRouteGroupKey
  return (
    <button
      type="button"
      className={`warehouse-dispatch-route-card${selected ? ' is-selected' : ''}`}
      key={group.key}
      onClick={() => onSelect?.(group.key)}
    >
      <div className="warehouse-dispatch-route-title">
        <span>
          {SITE_LABELS[group.siteCode]} {TRANSPORT_LABELS[group.transportMode]}
        </span>
        {selected ? <Tag color="blue">已选择</Tag> : group.issueCount > 0 ? <Tag color="gold">需处理</Tag> : <Tag color="green">可生成</Tag>}
      </div>
      <div className="warehouse-dispatch-route-meta">商品 {group.lineCount} 个，数量 {group.totalQuantity}</div>
      <div className="warehouse-dispatch-route-meta">
        拆分规则：站点 + 运输方式 + 发货仓库 + 货物属性
      </div>
    </button>
  )
}

function buildShippingForwarderCostBreakdowns(option: ShippingSuggestionOption): ShippingForwarderCostBreakdown[] {
  type MutableForwarderBreakdown = {
    key: string
    forwarderCode?: string
    forwarderName?: string
    routeNames: Set<string>
    lines: ShippingSuggestionLine[]
    amounts: Map<string, number>
    pendingAmountLineCount: number
    costComponents: Map<string, {
      key: string
      componentType?: string
      componentName: string
      amounts: Map<string, number>
    }>
  }

  const breakdowns: MutableForwarderBreakdown[] = []
  const breakdownsByCode = new Map<string, MutableForwarderBreakdown>()
  const breakdownsByName = new Map<string, MutableForwarderBreakdown>()

  const ensureBreakdown = (forwarderCode?: string, forwarderName?: string) => {
    const normalizedCode = normalizeShippingForwarderIdentity(forwarderCode)
    const normalizedName = normalizeShippingForwarderIdentity(forwarderName)
    let breakdown = normalizedCode ? breakdownsByCode.get(normalizedCode) : undefined
    if (!breakdown && normalizedName) {
      breakdown = breakdownsByName.get(normalizedName)
    }
    if (!breakdown) {
      breakdown = {
        key: normalizedCode ? `code:${normalizedCode}` : normalizedName ? `name:${normalizedName}` : 'unassigned',
        forwarderCode: forwarderCode?.trim() || undefined,
        forwarderName: forwarderName?.trim() || undefined,
        routeNames: new Set<string>(),
        lines: [],
        amounts: new Map<string, number>(),
        pendingAmountLineCount: 0,
        costComponents: new Map()
      }
      breakdowns.push(breakdown)
    }
    if (!breakdown.forwarderCode && forwarderCode?.trim()) {
      breakdown.forwarderCode = forwarderCode.trim()
    }
    if (!breakdown.forwarderName && forwarderName?.trim()) {
      breakdown.forwarderName = forwarderName.trim()
    }
    if (normalizedCode) {
      breakdownsByCode.set(normalizedCode, breakdown)
    }
    if (normalizedName) {
      breakdownsByName.set(normalizedName, breakdown)
    }
    return breakdown
  }

  const declaredForwarderCount = Math.max(option.targetForwarderCodes.length, option.targetForwarderNames.length)
  for (let index = 0; index < declaredForwarderCount; index += 1) {
    ensureBreakdown(option.targetForwarderCodes[index], option.targetForwarderNames[index])
  }

  option.lines.forEach((line) => {
    const breakdown = ensureBreakdown(line.targetForwarderCode, line.targetForwarderName)
    breakdown.lines.push(line)
    const routeName = line.routeName?.trim() || line.routeCode?.trim()
    if (routeName) {
      breakdown.routeNames.add(routeName)
    }
    if (line.estimatedAmount === undefined) {
      breakdown.pendingAmountLineCount += 1
    } else {
      addShippingAmount(breakdown.amounts, line.currency || option.currency, line.estimatedAmount)
    }
    line.costComponents.forEach((component) => {
      const componentKey = [component.componentType || 'OTHER', component.componentName].join(':')
      let componentSummary = breakdown.costComponents.get(componentKey)
      if (!componentSummary) {
        componentSummary = {
          key: componentKey,
          componentType: component.componentType,
          componentName: component.componentName,
          amounts: new Map<string, number>()
        }
        breakdown.costComponents.set(componentKey, componentSummary)
      }
      if (component.amount !== undefined) {
        addShippingAmount(componentSummary.amounts, component.currency || line.currency || option.currency, component.amount)
      }
    })
  })

  return breakdowns.map((breakdown) => ({
    key: breakdown.key,
    forwarderCode: breakdown.forwarderCode,
    forwarderName: breakdown.forwarderName,
    routeNames: [...breakdown.routeNames],
    lines: breakdown.lines,
    pskuCount: new Set(breakdown.lines.map((line) => normalizeShippingForwarderIdentity(line.partnerSku))).size,
    totalQuantity: sum(breakdown.lines.map((line) => line.quantity)),
    actualWeightKg: sumCompleteShippingMetric(breakdown.lines, (line) => line.actualWeightKg),
    volumeCbm: sumCompleteShippingMetric(breakdown.lines, (line) => line.volumeCbm),
    chargeableWeightKg: sumCompleteShippingMetric(breakdown.lines, (line) => line.chargeableWeightKg),
    amounts: shippingAmountTotals(breakdown.amounts),
    pendingAmountLineCount: breakdown.pendingAmountLineCount,
    costComponents: [...breakdown.costComponents.values()].map((component) => ({
      key: component.key,
      componentType: component.componentType,
      componentName: component.componentName,
      amounts: shippingAmountTotals(component.amounts)
    }))
  }))
}

function normalizeShippingForwarderIdentity(value?: string) {
  return String(value || '').trim().toUpperCase()
}

function normalizeShippingCurrency(currency?: string) {
  const normalized = String(currency || 'CNY').trim().toUpperCase()
  return normalized === 'RMB' ? 'CNY' : (normalized || 'CNY')
}

function addShippingAmount(amounts: Map<string, number>, currency: string | undefined, amount: number) {
  const normalizedCurrency = normalizeShippingCurrency(currency)
  amounts.set(normalizedCurrency, (amounts.get(normalizedCurrency) || 0) + amount)
}

function shippingAmountTotals(amounts: Map<string, number>): ShippingAmountTotal[] {
  return [...amounts.entries()].map(([currency, amount]) => ({ currency, amount }))
}

function sumCompleteShippingMetric(
  lines: ShippingSuggestionLine[],
  readMetric: (line: ShippingSuggestionLine) => number | undefined
) {
  if (!lines.length) {
    return undefined
  }
  const values = lines.map(readMetric)
  if (values.some((value) => value === undefined || !Number.isFinite(value))) {
    return undefined
  }
  return sum(values as number[])
}

function isCombinationShippingOption(option: ShippingSuggestionOption) {
  const declaredForwarderCount = Math.max(
    option.targetForwarderCodes.filter(Boolean).length,
    option.targetForwarderNames.filter(Boolean).length
  )
  const assignedForwarderCount = buildShippingForwarderCostBreakdowns(option)
    .filter((breakdown) => breakdown.lines.length > 0)
    .length
  return option.optionType?.toUpperCase() === 'COMBINATION'
    || declaredForwarderCount > 1
    || assignedForwarderCount > 1
}

function renderShippingForwarderCostBreakdown(option: ShippingSuggestionOption) {
  const breakdowns = buildShippingForwarderCostBreakdowns(option)
  const columns: ColumnsType<ShippingForwarderCostBreakdown> = [
    {
      title: '货代 / 线路',
      key: 'forwarder',
      width: 220,
      render: (_, breakdown) => (
        <div className="warehouse-dispatch-cost-name">
          <Text strong>{breakdown.forwarderName || breakdown.forwarderCode || '货代待确认'}</Text>
          <Text type="secondary" ellipsis={{ tooltip: breakdown.routeNames.join(' / ') }}>
            {breakdown.routeNames.join(' / ') || (breakdown.lines.length ? '线路待确认' : '未分配商品')}
          </Text>
        </div>
      )
    },
    {
      title: 'PSKU',
      dataIndex: 'pskuCount',
      width: 90,
      align: 'right',
      render: (value: number) => `${value} 个`
    },
    {
      title: '商品数量',
      dataIndex: 'totalQuantity',
      width: 110,
      align: 'right',
      render: (value: number) => `${value.toLocaleString()} 件`
    },
    {
      title: '实际重量',
      dataIndex: 'actualWeightKg',
      width: 120,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 3, 'kg')
    },
    {
      title: '体积',
      dataIndex: 'volumeCbm',
      width: 115,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 4, 'm³')
    },
    {
      title: '计费重量',
      dataIndex: 'chargeableWeightKg',
      width: 120,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 3, 'kg')
    },
    {
      title: '货代费用',
      key: 'amount',
      width: 180,
      align: 'right',
      render: (_, breakdown) => renderShippingAmountTotals(breakdown.amounts, breakdown.pendingAmountLineCount)
    },
    {
      title: '费用组成',
      key: 'components',
      width: 280,
      render: (_, breakdown) => breakdown.costComponents.length ? (
        <div className="warehouse-dispatch-forwarder-cost-components">
          {breakdown.costComponents.map((component) => (
            <div className="warehouse-dispatch-forwarder-cost-row" key={component.key}>
              <span>{component.componentName || shippingCostTypeLabel(component.componentType)}</span>
              <span>{formatShippingAmountTotals(component.amounts)}</span>
            </div>
          ))}
        </div>
      ) : <Text type="secondary">费用分项待复核</Text>
    }
  ]

  return (
    <div className="warehouse-dispatch-forwarder-breakdown">
      <div className="warehouse-dispatch-route-list-title">组合货代分项</div>
      <Table
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={breakdowns}
        pagination={false}
        scroll={{ x: 1235 }}
      />
    </div>
  )
}

function renderShippingAmountTotals(amounts: ShippingAmountTotal[], pendingLineCount: number) {
  return (
    <div className="warehouse-dispatch-forwarder-amount">
      <Text strong>{formatShippingAmountTotals(amounts)}</Text>
      {pendingLineCount > 0 ? <Text type="warning">{pendingLineCount} 行待复核</Text> : null}
    </div>
  )
}

function formatShippingAmountTotals(amounts: ShippingAmountTotal[]) {
  if (!amounts.length) {
    return '费用待复核'
  }
  return amounts.map(({ amount, currency }) => formatShippingMoney(amount, currency)).join(' + ')
}

function renderShippingOptionCostComparison(
  options: ShippingSuggestionOption[],
  selectedSubmissionOptionId: string | undefined,
  detailOptionId: string,
  onView: (optionId: string) => void,
  onSelect: (optionId: string) => void,
  selectionLocked: boolean
) {
  const columns: ColumnsType<ShippingSuggestionOption> = [
    {
      title: '物流方案',
      dataIndex: 'optionName',
      width: 210,
      render: (_, option) => (
        <Space size={6} wrap>
          <Text strong>{option.optionName}</Text>
          {isCombinationShippingOption(option) ? <Tag color="purple">组合方案</Tag> : null}
          {option.id === selectedSubmissionOptionId ? <Tag color="blue">已选方案</Tag> : null}
          {option.id === detailOptionId ? <Tag color="cyan">查看中</Tag> : null}
        </Space>
      )
    },
    {
      title: '货代',
      key: 'forwarders',
      width: 180,
      render: (_, option) => option.targetForwarderNames.join(' / ') || '未指定货代'
    },
    {
      title: '整批重量',
      dataIndex: 'actualWeightKg',
      width: 115,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 3, 'kg')
    },
    {
      title: '整批体积',
      dataIndex: 'volumeCbm',
      width: 115,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 4, 'm³')
    },
    {
      title: '整批费用',
      key: 'amount',
      width: 145,
      align: 'right',
      render: (_, option) => <Text strong>{formatShippingMoney(option.estimatedTotalAmount, option.currency)}</Text>
    },
    {
      title: '状态',
      key: 'reviewStatus',
      width: 90,
      fixed: 'right',
      render: (_, option) => option.warningCount > 0 || option.blockedReasons.length
        ? <Tag color="gold">需复核</Tag>
        : <Tag color="green">可用</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 230,
      fixed: 'right',
      render: (_, option) => (
        <Space size={6}>
          <Button
            size="small"
            type={option.id === selectedSubmissionOptionId ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            disabled={selectionLocked || option.id === selectedSubmissionOptionId}
            title={selectionLocked ? '发货单已下发，物流方案不能修改' : undefined}
            onClick={() => onSelect(option.id)}
          >
            {option.id === selectedSubmissionOptionId ? '已选择' : '选择此方案'}
          </Button>
          <Button
            size="small"
            type={option.id === detailOptionId ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={() => onView(option.id)}
          >
            {option.id === detailOptionId ? '正在查看' : '查看明细'}
          </Button>
        </Space>
      )
    }
  ]
  return (
    <section className="warehouse-dispatch-cost-comparison">
      <div className="warehouse-dispatch-route-list-title">全部物流方案</div>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={options}
        pagination={false}
        scroll={{ x: 1140 }}
        rowClassName={(option) => [
          option.id === selectedSubmissionOptionId ? 'warehouse-dispatch-cost-selected-row' : '',
          option.id === detailOptionId ? 'warehouse-dispatch-cost-viewing-row' : ''
        ].filter(Boolean).join(' ')}
        expandable={{
          defaultExpandAllRows: true,
          rowExpandable: isCombinationShippingOption,
          expandedRowRender: renderShippingForwarderCostBreakdown
        }}
      />
    </section>
  )
}

function renderShippingCostBreakdown(option: ShippingSuggestionOption) {
  const componentColumns: ColumnsType<ShippingCostComponent> = [
    {
      title: '费用项',
      dataIndex: 'componentName',
      width: 230,
      render: (_, component) => (
        <div className="warehouse-dispatch-cost-name">
          <Text strong>{component.componentName}</Text>
          <Text type="secondary">{shippingCostTypeLabel(component.componentType)}</Text>
        </div>
      )
    },
    {
      title: '录入报价',
      key: 'quote',
      width: 190,
      render: (_, component) => formatShippingUnitQuote(component)
    },
    {
      title: '整批计费量',
      key: 'billableQuantity',
      width: 150,
      align: 'right',
      render: (_, component) => formatBillableQuantity(component.billableQuantity, component.billingUnit)
    },
    {
      title: '涉及商品',
      dataIndex: 'productLineCount',
      width: 110,
      align: 'right',
      render: (value: number) => `${value} 行`
    },
    {
      title: '费用小计',
      key: 'amount',
      width: 160,
      align: 'right',
      render: (_, component) => (
        <Text strong>{formatShippingMoney(component.amount, component.currency)}</Text>
      )
    }
  ]
  const productColumns: ColumnsType<ShippingSuggestionLine> = [
    {
      title: '商品',
      key: 'product',
      width: 300,
      fixed: 'left',
      render: (_, line) => (
        <div className="warehouse-dispatch-cost-product">
          <Text strong copyable>{line.partnerSku}</Text>
          <Text type="secondary" ellipsis={{ tooltip: line.productTitle }}>{line.productTitle}</Text>
        </div>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 80,
      align: 'right',
      render: (value: number) => `${value} 件`
    },
    {
      title: '货代 / 线路',
      key: 'route',
      width: 240,
      render: (_, line) => (
        <div className="warehouse-dispatch-cost-name">
          <Text>{line.targetForwarderName || line.targetForwarderCode || '-'}</Text>
          <Text type="secondary" ellipsis={{ tooltip: line.routeName || line.routeCode }}>
            {line.routeName || line.routeCode || '线路待确认'}
          </Text>
        </div>
      )
    },
    {
      title: '整行重量',
      dataIndex: 'actualWeightKg',
      width: 115,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 3, 'kg')
    },
    {
      title: '整行体积',
      dataIndex: 'volumeCbm',
      width: 120,
      align: 'right',
      render: (value?: number) => formatShippingMetric(value, 4, 'm³')
    },
    {
      title: '计费量',
      key: 'billing',
      width: 170,
      align: 'right',
      render: (_, line) => (
        <div className="warehouse-dispatch-cost-billing">
          <Text strong>{formatBillableQuantity(line.billableQuantity, line.billingUnit)}</Text>
          {line.minimumNotMet && line.minimumBillableUnit !== undefined ? (
            <Text type="warning">最低计费 {formatBillableQuantity(line.minimumBillableUnit, line.billingUnit)}</Text>
          ) : null}
        </div>
      )
    },
    {
      title: '按报价计算',
      key: 'components',
      width: 330,
      render: (_, line) => line.costComponents.length ? (
        <div className="warehouse-dispatch-product-cost-components">
          {line.costComponents.map((component, index) => (
            <div className="warehouse-dispatch-product-cost-row" key={`${component.componentType}-${component.sourceId || index}`}>
              <span>{component.componentName}</span>
              <span>{formatShippingComponentCalculation(component)}</span>
            </div>
          ))}
        </div>
      ) : <Text type="secondary">费用待复核</Text>
    },
    {
      title: '商品费用',
      key: 'estimatedAmount',
      width: 150,
      fixed: 'right',
      align: 'right',
      render: (_, line) => <Text strong>{formatShippingMoney(line.estimatedAmount, line.currency)}</Text>
    }
  ]

  return (
    <section className="warehouse-dispatch-cost-breakdown">
      <div className="warehouse-dispatch-cost-heading">
        <div>
          <Text strong>{option.optionName} 方案明细</Text>
          <Text type="secondary">按录入报价和当前计费规则估算</Text>
        </div>
        {option.blockedReasons.length ? <Tag color="gold">{option.warningCount} 项需复核</Tag> : <Tag color="green">费用可核对</Tag>}
      </div>
      <div className="warehouse-dispatch-cost-summary">
        {renderShippingCostSummaryItem('整批商品', `${option.totalQuantity.toLocaleString()} 件`)}
        {renderShippingCostSummaryItem('整批重量', formatShippingMetric(option.actualWeightKg, 3, 'kg'))}
        {renderShippingCostSummaryItem('整批体积', formatShippingMetric(option.volumeCbm, 4, 'm³'))}
        {renderShippingCostSummaryItem('计费重量', formatShippingMetric(option.chargeableWeightKg, 3, 'kg'))}
        {renderShippingCostSummaryItem('商品均摊', formatShippingMoney(option.avgUnitAmount, option.currency))}
        {renderShippingCostSummaryItem('整批费用', formatShippingMoney(option.estimatedTotalAmount, option.currency), true)}
      </div>
      {isCombinationShippingOption(option) ? renderShippingForwarderCostBreakdown(option) : null}
      {option.costComponents.length ? (
        <div className="warehouse-dispatch-cost-table-block">
          <div className="warehouse-dispatch-route-list-title">整批费用组成</div>
          <Table
            rowKey={(component) => [
              component.componentType,
              component.componentName,
              component.sourceId,
              component.unitPrice,
              component.billingUnit
            ].join('-')}
            size="small"
            columns={componentColumns}
            dataSource={option.costComponents}
            pagination={false}
            scroll={{ x: 840 }}
          />
        </div>
      ) : null}
      <div className="warehouse-dispatch-cost-table-block">
        <div className="warehouse-dispatch-route-list-title">逐商品费用</div>
        {option.lines.length ? (
          <Table
            rowKey="id"
            size="small"
            columns={productColumns}
            dataSource={option.lines}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `共 ${total} 行商品` }}
            scroll={{ x: 1505 }}
          />
        ) : (
          <Alert type="warning" showIcon message="当前物流方案没有商品费用快照，请刷新后重新查看。" />
        )}
      </div>
    </section>
  )
}

function renderShippingCostSummaryItem(label: string, value: ReactNode, strong = false) {
  return (
    <div className={`warehouse-dispatch-cost-summary-item${strong ? ' is-strong' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function shippingCostTypeLabel(componentType?: string) {
  switch (componentType) {
    case 'HEADHAUL':
      return '干线费'
    case 'LAST_MILE':
    case 'FBN_DELIVERY':
      return '送仓费'
    case 'WAREHOUSE_PICKING':
      return '拣货费'
    case 'WAREHOUSE_INBOUND':
      return '上架费'
    default:
      return '附加费'
  }
}

function formatShippingUnitQuote(component: ShippingCostComponent) {
  if (component.unitPrice === undefined) {
    return '-'
  }
  return `${formatShippingMoney(component.unitPrice, component.currency)} / ${shippingBillingUnitLabel(component.billingUnit)}`
}

function formatShippingComponentCalculation(component: ShippingCostComponent) {
  const amount = formatShippingMoney(component.amount, component.currency)
  if (component.unitPrice === undefined || component.billableQuantity === undefined) {
    return amount
  }
  return `${formatShippingNumber(component.unitPrice, 4)} × ${formatBillableQuantity(component.billableQuantity, component.billingUnit)} = ${amount}`
}

function formatBillableQuantity(value?: number, billingUnit?: string) {
  if (value === undefined) {
    return '-'
  }
  return `${formatShippingNumber(value, billingUnit === 'KG' ? 3 : 4)} ${shippingBillingUnitLabel(billingUnit)}`
}

function shippingBillingUnitLabel(billingUnit?: string) {
  switch (String(billingUnit || '').toUpperCase()) {
    case 'CBM':
      return 'm³'
    case 'KG':
      return 'kg'
    case 'PIECE':
    case 'PCS':
      return '件'
    case 'SHIPMENT':
      return '票'
    default:
      return billingUnit || '计费单位'
  }
}

function formatShippingMetric(value: number | undefined, maximumFractionDigits: number, unit: string) {
  return value === undefined ? '-' : `${formatShippingNumber(value, maximumFractionDigits)} ${unit}`
}

function formatDispatchPlanBatchMetric(plan: DispatchPlan, metric: 'weight' | 'volume') {
  const batch = plan.currentShippingBatch
  if (!batch) {
    return <Text type="secondary">待生成</Text>
  }
  const value = metric === 'weight' ? batch.actualWeightKg : batch.volumeCbm
  if (value === undefined) {
    return <Text type="warning">规格缺失</Text>
  }
  return formatShippingMetric(value, metric === 'weight' ? 3 : 4, metric === 'weight' ? 'kg' : 'm³')
}

function formatShippingMoney(value?: number, currency?: string) {
  if (value === undefined) {
    return '待复核'
  }
  const displayCurrency = normalizeShippingCurrency(currency)
  return `${displayCurrency} ${formatShippingNumber(value, 2)}`
}

function formatShippingNumber(value: number, maximumFractionDigits: number) {
  return value.toLocaleString('zh-CN', { maximumFractionDigits })
}

function chooseShippingOption(options: ShippingSuggestionOption[]) {
  return options.find((option) => option.autoRecommended && option.estimatedTotalAmount !== undefined)
    || options.find((option) => option.estimatedTotalAmount !== undefined)
    || options[0]
}

function resolveShippingBatchOption(batch?: ShippingBatch) {
  if (!batch) {
    return undefined
  }
  return batch.options.find((option) => option.id === batch.selectedOptionId)
    || batch.options.find((option) => option.selectedFlag)
    || chooseShippingOption(batch.options)
}

function formatShippingOptionAmount(option: ShippingSuggestionOption) {
  if (option.estimatedTotalAmount === undefined) {
    return '费用待复核'
  }
  return `${option.currency || 'CNY'} ${option.estimatedTotalAmount.toLocaleString()}`
}

function summarizeReceiptOrder(order: PurchaseReceiptOrder): ReceiptOrderSummary {
  const itemCount = order.items.length
  const pskuCount = new Set(order.items.map((item) => item.psku)).size
  const expectedQty = sum(order.items.map((item) => item.expectedQty))
  const receivedQty = sum(order.items.map((item) => item.receivedQty))
  const remainingQty = sum(order.items.map(receiptRemainingQuantity))
  const plannedQty = sum(order.items.map((item) => item.plannedQty))
  const readyQty = sum(order.items.map((item) => Math.max(0, item.receivedQty - item.plannedQty)))
  const missingSpecCount = order.items.filter((item) => item.specStatus === 'missing').length
  const hasShortage = order.items.some((item) => item.receivedQty > 0 && item.receivedQty < item.expectedQty)
  return {
    itemCount,
    pskuCount,
    expectedQty,
    receivedQty,
    remainingQty,
    readyQty,
    plannedQty,
    missingSpecCount,
    status: resolveReceiptStatus(expectedQty, receivedQty, readyQty, plannedQty, hasShortage)
  }
}

function summarizeAllOrders(orders: PurchaseReceiptOrder[]) {
  const summaries = orders.map(summarizeReceiptOrder)
  const receiptTodoPskus = new Set<string>()
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.receivedQty >= item.expectedQty) {
        return
      }
      const psku = normalizeProductKey(item.psku)
      if (psku) {
        receiptTodoPskus.add(psku)
      }
    })
  })
  const statusCounts = summaries.reduce<Record<ReceiptStatus, number>>(
    (counts, summary) => ({ ...counts, [summary.status]: counts[summary.status] + 1 }),
    { pending: 0, partial: 0, ready: 0, planned: 0, exception: 0 }
  )
  return {
    orderCount: orders.length,
    receiptTodoOrderCount: statusCounts.pending + statusCounts.partial + statusCounts.exception,
    receiptTodoPskuCount: receiptTodoPskus.size,
    pendingOrderCount: statusCounts.pending,
    partialOrderCount: statusCounts.partial,
    exceptionOrderCount: statusCounts.exception,
    readyOrderCount: statusCounts.ready,
    plannedOrderCount: statusCounts.planned,
    expectedQty: sum(summaries.map((summary) => summary.expectedQty)),
    receivedQty: sum(summaries.map((summary) => summary.receivedQty)),
    readyQty: sum(summaries.map((summary) => summary.readyQty)),
    missingSpecCount: sum(summaries.map((summary) => summary.missingSpecCount))
  }
}

function isReceiptTodoStatus(status: ReceiptStatus) {
  return status === 'pending' || status === 'partial' || status === 'exception'
}

function buildProductBaselineMap(items: ProductListRowPayload[]) {
  const result: Record<string, ProductBaselineSummary> = {}
  items.forEach((item) => {
    const imageUrl = normalizeNoonImageUrl(item.imageUrl || item.galleryImages?.[0])
    const summary: ProductBaselineSummary = {
      psku: item.partnerSku || item.skuParent,
      skuParent: item.skuParent,
      title: item.title,
      imageUrl,
      productFulltype: item.productFulltype,
      detailBaselineStatus: item.detailBaselineStatus
    }
    ;[item.partnerSku, item.skuParent].forEach((key) => {
      const normalizedKey = normalizeProductKey(key)
      if (normalizedKey && !result[normalizedKey]) {
        result[normalizedKey] = summary
      }
    })
  })
  return result
}

function formatReceiptSourceDate(value?: string) {
  const text = String(value || '').trim()
  return text.length >= 10 ? text.slice(0, 10) : text || '-'
}

function toDispatchTargetTransportMode(mode: WarehouseTransportMode): DispatchTargetTransportMode {
  return mode === 'SEA' ? 'SEA' : 'AIR'
}

function mergeReadyShipmentRowsByBusinessScope(items: ReadyShipmentRow[]) {
  const rowMap = new Map<string, ReadyShipmentRow>()
  items.forEach((item) => {
    const key = readyShipmentBusinessScopeKey(item)
    const sourceItems = item.items.length ? item.items : [item]
    const current = rowMap.get(key)
    if (current) {
      current.expectedQty += item.expectedQty
      current.receivedQty += item.receivedQty
      current.plannedQty += item.plannedQty
      current.availableQty += item.availableQty
      current.items.push(...sourceItems)
      current.specStatus = current.specStatus === 'missing' || item.specStatus === 'missing' ? 'missing' : 'complete'
      current.transportMode = inferReadyDominantTransport(current.items)
      current.logisticsQuoteBlocking = Boolean(current.logisticsQuoteBlocking || item.logisticsQuoteBlocking)
      current.logisticsQuoteStatus = mergeReadyQuoteStatus(current.logisticsQuoteStatus, item.logisticsQuoteStatus)
      current.logisticsShippingSubmitStatus = mergeReadyShippingSubmitStatus(
        current.logisticsShippingSubmitStatus,
        item.logisticsShippingSubmitStatus
      )
      if (!hasCjkText(current.title) && hasCjkText(item.title)) {
        current.title = item.title
      }
      if (!current.imageUrl && item.imageUrl) {
        current.imageUrl = item.imageUrl
      }
      return
    }
    rowMap.set(key, {
      ...item,
      id: `ready-scope__${key}`,
      items: [...sourceItems]
    })
  })
  return Array.from(rowMap.values())
}

function readyShipmentBusinessScopeKey(item: ReadyShipmentRow) {
  const sourceItems = item.items.length ? item.items : [item]
  const sourceStoreScope = Array.from(
    new Set(sourceItems.map((source) => normalizeProductKey(source.storeCode)).filter(Boolean))
  ).sort().join('+')
  const productScope = normalizeProductKey(item.psku) || normalizeProductKey(item.id)
  const fulfillmentScope = item.fulfillmentType || 'WAREHOUSE_RECEIPT'
  return [
    sourceStoreScope || 'STORE',
    productScope,
    item.siteCode,
    item.transportMode,
    fulfillmentScope,
    item.specStatus
  ].join('__')
}

function receiptOrderBusinessScopeKey(order: PurchaseReceiptOrder) {
  const itemScope = order.items.map(receiptProductBusinessScopeKey).sort().join('+')
  return [
    normalizeProductKey(order.storeCode) || normalizeProductKey(order.storeName) || 'STORE',
    normalizeProductKey(order.orderNo) || normalizeProductKey(order.id),
    itemScope || 'NO_ITEMS'
  ].join('__')
}

function receiptProductBusinessScopeKey(item: PurchaseReceiptItem) {
  const sourceStoreScope = normalizeProductKey(item.storeCode) || normalizeProductKey(item.storeName) || 'STORE'
  const productScope = normalizeProductKey(item.psku) || normalizeProductKey(item.id)
  const fulfillmentScope = item.fulfillmentType || 'WAREHOUSE_RECEIPT'
  return [
    sourceStoreScope,
    productScope,
    item.siteCode,
    item.transportMode,
    fulfillmentScope,
    item.specStatus,
    normalizeProductKey(item.orderNo) || normalizeProductKey(item.orderId)
  ].join('__')
}

function buildReadySourceRows(items: ReadyShipmentItem[], orderMetaById: Map<string, ReceiptOrderMeta>) {
  return items.map((item) => {
    const orderMeta = orderMetaById.get(item.orderId)
    const orderTitle = item.orderTitle || orderMeta?.title || item.orderNo
    const orderCreatedAt = item.orderCreatedAt || orderMeta?.createdAt || ''
    const originalSiteCode = item.originalSiteCode || item.siteCode
    const plannedTransportMode = item.originalTransportMode || item.transportMode
    const targetSiteCode = item.targetSiteCode || item.siteCode
    const targetTransportMode = item.targetTransportMode || item.transportMode
    const key = [
      item.fulfillmentBalanceId ? `balance:${item.fulfillmentBalanceId}` : `item:${item.id}`,
      item.orderId,
      item.orderNo,
      item.storeCode,
      targetSiteCode,
      targetTransportMode
    ].join('__')
    return {
      key,
      item,
      orderNo: item.orderNo,
      orderTitle,
      orderCreatedAt,
      siteCode: targetSiteCode,
      originalSiteCode,
      targetSiteCode,
      plannedTransportMode,
      targetTransportMode,
      availableQty: item.availableQty,
      logisticsQuoteStatus: item.logisticsQuoteStatus,
      logisticsShippingSubmitStatus: item.logisticsShippingSubmitStatus,
      logisticsQuoteBlocking: item.logisticsQuoteBlocking
    }
  })
}

function mergeReadyQuoteStatus(current?: string, next?: string) {
  return current === 'PENDING_QUOTE' || next === 'PENDING_QUOTE' ? 'PENDING_QUOTE' : 'CONFIRMED'
}

function mergeReadyShippingSubmitStatus(current?: string, next?: string) {
  return current === 'NOT_SUBMITTED' || next === 'NOT_SUBMITTED' ? 'NOT_SUBMITTED' : 'SUBMITTED'
}

function uniqueReadySiteCodes(item: ReadyShipmentRow) {
  const siteCodes = item.items.map((source) => source.siteCode || item.siteCode)
  return siteCodes.filter((siteCode, index, values) => values.indexOf(siteCode) === index)
}

function uniqueFulfillmentTypes(types: Array<WarehouseFulfillmentType | undefined>) {
  const normalizedTypes = types.map((type) => type || 'WAREHOUSE_RECEIPT')
  return normalizedTypes.filter((type, index, values) => values.indexOf(type) === index)
}

function inferReadyDominantTransport(items: ReadyShipmentItem[]): WarehouseTransportMode {
  const seaQty = items
    .filter((item) => item.transportMode === 'SEA')
    .reduce((total, item) => total + item.availableQty, 0)
  const airQty = items
    .filter((item) => item.transportMode === 'AIR')
    .reduce((total, item) => total + item.availableQty, 0)
  return seaQty > airQty ? 'SEA' : 'AIR'
}

function normalizeProductKey(value?: string | null) {
  return String(value || '').trim().toUpperCase()
}

function buildProductBaselineStoreCodes({
  activeTab,
  currentStoreCode,
  selectedPlan,
  visibleReadyItems
}: {
  activeTab: WarehouseDispatchTabKey
  currentStoreCode?: string
  selectedPlan?: DispatchPlan
  visibleReadyItems: ReadyShipmentRow[]
}) {
  if (activeTab === 'receipt-list') {
    return []
  }
  if (activeTab === 'ship-ready') {
    if (!visibleReadyItems.length) {
      return []
    }
    const storeCodes = visibleReadyItems.flatMap((item) => [
      item.storeCode,
      ...item.items.map((source) => source.storeCode)
    ])
    return uniqueStoreCodes(storeCodes.length ? storeCodes : [currentStoreCode])
  }
  if (!selectedPlan?.lines.length) {
    return []
  }
  const storeCodes = selectedPlan.lines.flatMap((line) => line.sources.map((source) => source.storeCode))
  return uniqueStoreCodes(storeCodes.length ? storeCodes : [currentStoreCode])
}

function uniqueStoreCodes(storeCodes: Array<string | undefined>) {
  return storeCodes
    .map((storeCode) => String(storeCode || '').trim())
    .filter(Boolean)
    .filter((storeCode, index, values) => values.indexOf(storeCode) === index)
}

function resolveReceiptStatus(
  expectedQty: number,
  receivedQty: number,
  readyQty: number,
  plannedQty: number,
  hasShortage: boolean
): ReceiptStatus {
  if (receivedQty <= 0) {
    return 'pending'
  }
  if (hasShortage) {
    return 'exception'
  }
  if (plannedQty > 0 && readyQty <= 0) {
    return 'planned'
  }
  if (receivedQty < expectedQty) {
    return 'partial'
  }
  return 'ready'
}

function filterReadyItems(items: ReadyShipmentRow[], filter: ReadyFilterKey) {
  if (filter === 'all') {
    return items
  }
  if (filter === 'missing') {
    return items.filter((item) => item.specStatus === 'missing')
  }
  const [siteCode, transportMode] = filter.split('-') as [WarehouseSiteCode, WarehouseTransportMode]
  return items.filter((item) =>
    item.items.some((source) => source.siteCode === siteCode && source.transportMode === transportMode)
  )
}

function buildRouteGroups(lines: DispatchPlanLine[]): RouteGroup[] {
  const groupMap = new Map<string, RouteGroup>()
  lines.forEach((line) => {
    const key = [line.siteCode, line.transportMode, line.specStatus].join('__')
    const current = groupMap.get(key)
    if (current) {
      current.lineCount += 1
      current.totalQuantity += line.totalQuantity
      current.issueCount += line.specStatus === 'missing' ? 1 : 0
      return
    }
    groupMap.set(key, {
      key,
      siteCode: line.siteCode,
      transportMode: line.transportMode,
      specStatus: line.specStatus,
      lineCount: 1,
      totalQuantity: line.totalQuantity,
      issueCount: line.specStatus === 'missing' ? 1 : 0
    })
  })
  return Array.from(groupMap.values())
}

function buildPlanSiteTransportLabels(lines: DispatchPlanLine[]): string[] {
  return Array.from(new Set(lines.map((line) => (
    `${SITE_LABELS[line.siteCode]} / ${TRANSPORT_LABELS[line.transportMode]}`
  ))))
}

function buildShippingForwarderChoices(options: ShippingRouteOption[]): ShippingForwarderChoice[] {
  const choiceMap = new Map<string, ShippingForwarderChoice>()
  options.forEach((option) => {
    if (!option.forwarderCode) {
      return
    }
    const current = choiceMap.get(option.forwarderCode)
    if (current) {
      current.routes.push(option)
      return
    }
    choiceMap.set(option.forwarderCode, {
      forwarderCode: option.forwarderCode,
      forwarderName: option.forwarderName || option.forwarderCode,
      routes: [option]
    })
  })
  return Array.from(choiceMap.values())
}

function countPlanSourceOrders(plan: DispatchPlan) {
  return new Set(plan.lines.flatMap((line) => line.sources.map((source) => source.orderNo))).size
}

function countPlanStores(plan: DispatchPlan) {
  return new Set(plan.lines.flatMap((line) => line.sources.map((source) => source.storeName))).size
}

function sumPlanQuantity(plan: DispatchPlan) {
  return sum(plan.lines.map((line) => line.totalQuantity))
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
