import {
  CheckCircleOutlined,
  EditOutlined,
  FileDoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  TruckOutlined
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Empty,
  Input,
  InputNumber,
  Popover,
  Popconfirm,
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
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PRODUCT_SPECS_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import type { AuthSession } from '../auth/session'
import { fetchProductListDataset } from '../product-management/api'
import type { ProductListRowPayload } from '../product-management/types'
import { normalizeNoonImageUrl } from '../product-management/utils'
import {
  createDispatchPlan,
  createFulfillmentConfirmation,
  loadDispatchPlans,
  loadReadyShipmentItems,
  loadWarehouseReceiptOrders,
  markDispatchPlanReadyForLogistics
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
  WarehouseFulfillmentType,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './types'
import './WarehouseDispatchWorkbenchPage.css'

const { Text } = Typography

type WarehouseDispatchTabKey = 'receipt-list' | 'receipt-confirm' | 'ship-ready' | 'dispatch-plan'

type WarehouseDispatchWorkbenchPageProps = {
  session?: AuthSession | null
}

type ReceiptOrderSummary = {
  itemCount: number
  pskuCount: number
  expectedQty: number
  receivedQty: number
  readyQty: number
  plannedQty: number
  missingSpecCount: number
  status: ReceiptStatus
}

type ReadyFilterKey = 'all' | 'SA-AIR' | 'SA-SEA' | 'AE-AIR' | 'AE-SEA' | 'missing'

type ReceiptSiteFilterKey = 'all' | WarehouseSiteCode
type ReceiptScopeFilterKey = 'todo' | 'all'

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

type ReceiptProductRow = {
  id: string
  orderId: string
  orderNo: string
  orderTitle: string
  orderCreatedAt: string
  storeName: string
  psku: string
  title: string
  imageUrl?: string
  expectedQty: number
  receivedQty: number
  plannedQty: number
  specStatus: ProductSpecStatus
  items: PurchaseReceiptItem[]
  baseline?: ProductBaselineSummary
}

type ReadyShipmentRow = ReadyShipmentItem & {
  items: ReadyShipmentItem[]
}

type ReceiptOrderMeta = {
  title: string
  createdAt: string
}

type AddLineDraft = {
  item: ReadyShipmentItem
  quantity: number
  actualTransportMode: WarehouseTransportMode
}

type TransportSplitDraft = Partial<Record<'AIR' | 'SEA', number>>

type ReceiptIssueDraft = {
  returnQty?: number
  damagedQty?: number
  reshipQty?: number
}

type WarehouseDataset = {
  orders: PurchaseReceiptOrder[]
  readyItems: ReadyShipmentRow[]
  dispatchPlans: DispatchPlan[]
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
  draft: { label: '草稿', color: 'gold' },
  ready_for_logistics: { label: '待物流接单', color: 'blue' },
  handoff_failed: { label: '交接失败', color: 'red' },
  logistics_requested: { label: '已提交物流', color: 'green' },
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
  const [activeTab, setActiveTab] = useState<WarehouseDispatchTabKey>('receipt-list')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [receiptKeyword, setReceiptKeyword] = useState('')
  const [receiptConfirmKeyword, setReceiptConfirmKeyword] = useState('')
  const [receiptStoreFilter, setReceiptStoreFilter] = useState('all')
  const [receiptSiteFilter, setReceiptSiteFilter] = useState<ReceiptSiteFilterKey>('all')
  const [receiptScopeFilter, setReceiptScopeFilter] = useState<ReceiptScopeFilterKey>('todo')
  const [receiptDraft, setReceiptDraft] = useState<Record<string, number>>({})
  const [receiptIssueDraft, setReceiptIssueDraft] = useState<Record<string, ReceiptIssueDraft>>({})
  const [receiptIssueEditingIds, setReceiptIssueEditingIds] = useState<string[]>([])
  const [productBaselineByPsku, setProductBaselineByPsku] = useState<Record<string, ProductBaselineSummary>>({})
  const [productBaselineLoading, setProductBaselineLoading] = useState(false)
  const [productBaselineError, setProductBaselineError] = useState<string>()
  const [readyFilter, setReadyFilter] = useState<ReadyFilterKey>('all')
  const [selectedReadyItemIds, setSelectedReadyItemIds] = useState<string[]>([])
  const [readySplitDraft, setReadySplitDraft] = useState<Record<string, TransportSplitDraft>>({})
  const [dispatchPlans, setDispatchPlans] = useState<DispatchPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>()
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string>()
  const [readyItemsLoaded, setReadyItemsLoaded] = useState(false)
  const [dispatchPlansLoaded, setDispatchPlansLoaded] = useState(false)
  const [receiptSubmitting, setReceiptSubmitting] = useState(false)
  const [receiptRowSubmittingId, setReceiptRowSubmittingId] = useState<string>()
  const [planSubmitting, setPlanSubmitting] = useState(false)
  const [logisticsSubmitting, setLogisticsSubmitting] = useState(false)

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

  const selectedReceiptOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0],
    [orders, selectedOrderId]
  )
  const receiptProductRows = useMemo(
    () => selectedReceiptOrder ? buildReceiptProductRows([selectedReceiptOrder], productBaselineByPsku) : [],
    [productBaselineByPsku, selectedReceiptOrder]
  )
  const pendingReceiptProductRows = useMemo(
    () => receiptProductRows.filter(isReceiptRowPending),
    [receiptProductRows]
  )
  const visibleReceiptProductRows = useMemo(
    () => filterReceiptProductRows(pendingReceiptProductRows, receiptConfirmKeyword),
    [pendingReceiptProductRows, receiptConfirmKeyword]
  )

  const allReadyItems = useMemo(() => mergeReadyShipmentRowsByProduct(readyItems), [readyItems])
  const visibleReadyItems = useMemo(
    () => filterReadyItems(allReadyItems, readyFilter),
    [allReadyItems, readyFilter]
  )
  const selectedReadyItems = useMemo(
    () => allReadyItems.filter((item) => selectedReadyItemIds.includes(item.id)),
    [allReadyItems, selectedReadyItemIds]
  )
  const selectedPlan = useMemo(
    () => dispatchPlans.find((plan) => plan.id === selectedPlanId) || dispatchPlans[0],
    [dispatchPlans, selectedPlanId]
  )
  const selectedPlanRouteGroups = useMemo(
    () => selectedPlan ? buildRouteGroups(selectedPlan.lines) : [],
    [selectedPlan]
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
        selectedReceiptOrder,
        visibleReadyItems
      }),
    [activeTab, productBaselineStoreCode, selectedPlan, selectedReceiptOrder, visibleReadyItems]
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
          setDataError(error instanceof Error ? error.message : '可发运商品读取失败')
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
          setDataError(error instanceof Error ? error.message : '发运计划读取失败')
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
    if (!pendingReceiptProductRows.length) {
      setReceiptDraft({})
      setReceiptIssueDraft({})
      setReceiptIssueEditingIds([])
      return
    }
    setReceiptDraft(
      Object.fromEntries(pendingReceiptProductRows.map((row) => [row.id, row.expectedQty]))
    )
    setReceiptIssueDraft({})
    setReceiptIssueEditingIds([])
  }, [pendingReceiptProductRows])

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
      title: '采购单',
      dataIndex: 'title',
      render: (_value, order) => (
        <Space direction="vertical" size={0}>
          <Text strong>{order.title || order.orderNo}</Text>
          <Text type="secondary">{order.createdAt}</Text>
        </Space>
      )
    },
    {
      title: '店铺',
      dataIndex: 'storeName',
      render: (_value, order) => receiptOrderDisplayStoreName(order)
    },
    {
      title: '商品',
      render: (_value, order) => visibleOrderSummaries.get(order.id)?.itemCount ?? summarizeReceiptOrder(order).itemCount
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
      title: '状态',
      render: (_value, order) => renderReceiptStatus(visibleOrderSummaries.get(order.id)?.status ?? summarizeReceiptOrder(order).status)
    },
    {
      title: '操作',
      width: 120,
      render: (_value, order) => (
        <Button
          size="small"
          onClick={() => openReceiptConfirmation(order)}
        >
          收货验收
        </Button>
      )
    }
  ]

  const receiptItemColumns: ColumnsType<ReceiptProductRow> = [
    {
      title: '商品',
      dataIndex: 'psku',
      width: 340,
      render: (_value, row) => renderReceiptProductCell(row)
    },
    {
      title: '来源',
      width: 170,
      render: (_value, row) => renderReceiptSourceCell(row)
    },
    {
      title: '履约',
      width: 78,
      align: 'center',
      render: (_value, row) => renderFulfillmentType(row.items[0]?.fulfillmentType)
    },
    { title: '应收', dataIndex: 'expectedQty', width: 60, align: 'center' },
    {
      title: '实收',
      dataIndex: 'receivedQty',
      width: 92,
      align: 'center',
      render: (_value, row) => (
        <InputNumber
          className="warehouse-dispatch-receipt-number"
          size="small"
          min={0}
          max={row.expectedQty}
          precision={0}
          value={receiptDraft[row.id] ?? row.receivedQty}
          onChange={(value) => updateReceiptDraft(row.id, Number(value || 0))}
        />
      )
    },
    {
      title: '异常/补发',
      width: 250,
      render: (_value, row) => renderReceiptIssueCell(row)
    },
    {
      title: '异常',
      width: 96,
      render: (_value, row) => renderReceiptItemIssue(row, receiptDraft[row.id] ?? row.receivedQty)
    },
    {
      title: '操作',
      width: 150,
      render: (_value, row) => renderReceiptRowActions(row)
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
      render: (_value, item) => renderReadySourceCell(item, receiptOrderMetaById)
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
    { title: '可发', dataIndex: 'availableQty' },
    {
      title: '空运数量',
      width: 130,
      render: (_value, item) => (
        <InputNumber
          min={0}
          max={item.availableQty}
          precision={0}
          value={getReadySplitDraft(item).AIR}
          onChange={(value) => updateReadySplitDraft(item, 'AIR', Number(value || 0))}
        />
      )
    },
    {
      title: '海运数量',
      width: 130,
      render: (_value, item) => (
        <InputNumber
          min={0}
          max={item.availableQty}
          precision={0}
          value={getReadySplitDraft(item).SEA}
          onChange={(value) => updateReadySplitDraft(item, 'SEA', Number(value || 0))}
        />
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

  function updateReceiptDraft(itemId: string, nextValue: number) {
    setReceiptDraft((current) => ({ ...current, [itemId]: Math.max(0, nextValue) }))
  }

  function updateReceiptIssueDraft(itemId: string, field: keyof ReceiptIssueDraft, nextValue: number) {
    setReceiptIssueDraft((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        [field]: Math.max(0, nextValue)
      }
    }))
  }

  function toggleReceiptIssueEditing(rowId: string) {
    setReceiptIssueEditingIds((current) =>
      current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]
    )
  }

  function openReceiptConfirmation(order: PurchaseReceiptOrder) {
    setSelectedOrderId(order.id)
    setReceiptStoreFilter(receiptStoreFilterValue(order))
    setActiveTab('receipt-confirm')
  }

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

  function renderReceiptIssueCell(row: ReceiptProductRow) {
    const issue = receiptIssueDraft[row.id] || {}
    const isEditing = receiptIssueEditingIds.includes(row.id)
    if (!isEditing && !sumReceiptIssueDraft(issue)) {
      return <Text type="secondary">无异常</Text>
    }
    if (!isEditing) {
      return renderReceiptIssueSummary(issue)
    }
    return (
      <div className="warehouse-dispatch-issue-editor">
        <span>退</span>
        <InputNumber
          size="small"
          min={0}
          max={row.expectedQty}
          precision={0}
          value={issue.returnQty ?? 0}
          onChange={(value) => updateReceiptIssueDraft(row.id, 'returnQty', Number(value || 0))}
        />
        <span>损</span>
        <InputNumber
          size="small"
          min={0}
          max={row.expectedQty}
          precision={0}
          value={issue.damagedQty ?? 0}
          onChange={(value) => updateReceiptIssueDraft(row.id, 'damagedQty', Number(value || 0))}
        />
        <span>补</span>
        <InputNumber
          size="small"
          min={0}
          max={row.expectedQty}
          precision={0}
          value={issue.reshipQty ?? 0}
          onChange={(value) => updateReceiptIssueDraft(row.id, 'reshipQty', Number(value || 0))}
        />
      </div>
    )
  }

  function renderReceiptRowActions(row: ReceiptProductRow) {
    const isEditing = receiptIssueEditingIds.includes(row.id)
    const rowSubmitting = receiptRowSubmittingId === row.id
    return (
      <Space size={6}>
        <Popconfirm
          title="确认验货通过？"
          description={`${row.psku} 将按应收数量确认收货，通过后从验货列表移除。`}
          okText="确认通过"
          cancelText="取消"
          onConfirm={() => confirmReceiptRowPassed(row)}
        >
          <Button size="small" type="primary" ghost loading={rowSubmitting}>
            验货通过
          </Button>
        </Popconfirm>
        <Button size="small" onClick={() => toggleReceiptIssueEditing(row.id)}>
          {isEditing ? '收起' : '编辑'}
        </Button>
      </Space>
    )
  }

  async function confirmReceiptRowPassed(row: ReceiptProductRow) {
    if (!selectedReceiptOrder) {
      return
    }
    const linesByFulfillment = new Map<WarehouseFulfillmentType, Array<{
      purchaseOrderItemId: string
      confirmedQuantity: number
      abnormalQuantity: number
    }>>()
    row.items.forEach((item) => {
      const remainingQuantity = Math.max(0, item.expectedQty - item.receivedQty)
      if (remainingQuantity <= 0) {
        return
      }
      const fulfillmentType = item.fulfillmentType || 'WAREHOUSE_RECEIPT'
      const lines = linesByFulfillment.get(fulfillmentType) || []
      lines.push({
        purchaseOrderItemId: item.id,
        confirmedQuantity: remainingQuantity,
        abnormalQuantity: 0
      })
      linesByFulfillment.set(fulfillmentType, lines)
    })
    if (!linesByFulfillment.size) {
      message.info('该商品已完成验货。')
      await refreshWarehouseData()
      return
    }
    setReceiptRowSubmittingId(row.id)
    try {
      await Promise.all(Array.from(linesByFulfillment.entries()).map(([confirmationType, lines]) =>
        createFulfillmentConfirmation({
          purchaseOrderId: selectedReceiptOrder.id,
          confirmationType,
          sourcePartyName: selectedReceiptOrder.storeName,
          lines
        })
      ))
      setReceiptDraft((current) => omitRecordKey(current, row.id))
      setReceiptIssueDraft((current) => omitRecordKey(current, row.id))
      setReceiptIssueEditingIds((current) => current.filter((id) => id !== row.id))
      await refreshWarehouseData()
      message.success(`${row.psku} 已验货通过。`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存验货通过失败')
    } finally {
      setReceiptRowSubmittingId(undefined)
    }
  }

  function getReadySplitDraft(item: ReadyShipmentRow): Required<TransportSplitDraft> {
    const defaultDraft = buildDefaultTransportSplit(item)
    const current = readySplitDraft[item.id]
    return {
      AIR: current?.AIR ?? defaultDraft.AIR ?? 0,
      SEA: current?.SEA ?? defaultDraft.SEA ?? 0
    }
  }

  function updateReadySplitDraft(item: ReadyShipmentRow, mode: 'AIR' | 'SEA', nextValue: number) {
    setReadySplitDraft((current) => {
      const defaultDraft = buildDefaultTransportSplit(item)
      return {
        ...current,
        [item.id]: {
          AIR: current[item.id]?.AIR ?? defaultDraft.AIR ?? 0,
          SEA: current[item.id]?.SEA ?? defaultDraft.SEA ?? 0,
          [mode]: clampQuantity(nextValue, 0, item.availableQty)
        }
      }
    })
  }

  async function confirmReceipt() {
    if (!selectedReceiptOrder || !receiptProductRows.length) {
      return
    }
    const invalidIssueRow = receiptProductRows.find((row) => {
      const receivedQty = receiptDraft[row.id] ?? row.receivedQty
      return sumReceiptIssueDraft(receiptIssueDraft[row.id]) > receivedQty
    })
    if (invalidIssueRow) {
      message.warning(`${invalidIssueRow.psku} 的退货、破损、补发数量合计不能超过实收数量。`)
      return
    }
    const receivedQuantityByItemId = buildDistributedReceiptQuantityMap(
      buildReceiptProductRows([selectedReceiptOrder], productBaselineByPsku),
      receiptDraft
    )
    const issueQuantityByItemId = buildDistributedReceiptIssueQuantityMap(
      buildReceiptProductRows([selectedReceiptOrder], productBaselineByPsku),
      receiptIssueDraft
    )
    const issueReasonByItemId = buildDistributedReceiptIssueReasonMap(
      buildReceiptProductRows([selectedReceiptOrder], productBaselineByPsku),
      receiptIssueDraft
    )
    const linesByFulfillment = new Map<WarehouseFulfillmentType, Array<{
      purchaseOrderItemId: string
      confirmedQuantity: number
      abnormalQuantity: number
      exceptionReason?: string
    }>>()
    for (const item of selectedReceiptOrder.items) {
      const nextReceivedQty = receivedQuantityByItemId.get(item.id) ?? item.receivedQty
      if (nextReceivedQty < item.receivedQty) {
        message.warning('当前只支持追加验收，不能调低已收数量。')
        return
      }
      const delta = nextReceivedQty - item.receivedQty
      const abnormalQuantity = issueQuantityByItemId.get(item.id) ?? 0
      if (delta <= 0 && abnormalQuantity <= 0) {
        continue
      }
      const fulfillmentType = item.fulfillmentType || 'WAREHOUSE_RECEIPT'
      const lines = linesByFulfillment.get(fulfillmentType) || []
      lines.push({
        purchaseOrderItemId: item.id,
        confirmedQuantity: delta,
        abnormalQuantity,
        exceptionReason: issueReasonByItemId.get(item.id)
          || (nextReceivedQty < item.expectedQty ? `少货 ${item.expectedQty - nextReceivedQty}` : undefined)
      })
      linesByFulfillment.set(fulfillmentType, lines)
    }
    if (!linesByFulfillment.size) {
      message.warning('没有新增验收数量。')
      return
    }
    setReceiptSubmitting(true)
    try {
      await Promise.all(Array.from(linesByFulfillment.entries()).map(([confirmationType, lines]) =>
        createFulfillmentConfirmation({
          purchaseOrderId: selectedReceiptOrder.id,
          confirmationType,
          sourcePartyName: selectedReceiptOrder.storeName,
          lines
        })
      ))
      await refreshWarehouseData()
      message.success('已完成收货验收，实收商品已进入可发运商品。')
      setActiveTab('ship-ready')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存收货验收失败')
    } finally {
      setReceiptSubmitting(false)
    }
  }

  async function createDispatchPlanFromSelection() {
    const drafts = selectedReadyItems.flatMap((item) => {
      const split = getReadySplitDraft(item)
      return [
        ...expandReadyRowDrafts(item, split.AIR, 'AIR'),
        ...expandReadyRowDrafts(item, split.SEA, 'SEA')
      ]
    })
    if (!drafts.length) {
      message.warning('请先选择要加入发运计划的商品。')
      return
    }
    const invalidDraft = selectedReadyItems.find((item) => {
      const split = getReadySplitDraft(item)
      return split.AIR + split.SEA > item.availableQty
    })
    if (invalidDraft) {
      message.warning(`${invalidDraft.psku} 空运和海运数量合计不能超过可发数量。`)
      return
    }
    setPlanSubmitting(true)
    try {
      const sources = drafts
        .filter((draft) => draft.item.fulfillmentBalanceId)
        .map((draft) => ({
          fulfillmentBalanceId: Number(draft.item.fulfillmentBalanceId),
          quantity: draft.quantity,
          actualTransportMode: draft.actualTransportMode
        }))
      if (!sources.length) {
        message.warning('当前可发运来源缺少余额编号，请刷新后重试。')
        return
      }
      const created = await createDispatchPlan({
        sources
      })
      const dataset = await refreshWarehouseData()
      setSelectedPlanId(created.id || dataset.dispatchPlans[0]?.id)
      setSelectedReadyItemIds([])
      setReadySplitDraft({})
      setActiveTab('dispatch-plan')
      message.success('已生成发运计划草稿。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '生成发运计划失败')
    } finally {
      setPlanSubmitting(false)
    }
  }

  async function generateLogisticsPlan() {
    if (!selectedPlan) {
      return
    }
    if (!selectedPlan.lines.length) {
      message.warning('发运计划中还没有商品。')
      return
    }
    setLogisticsSubmitting(true)
    try {
      const updated = await markDispatchPlanReadyForLogistics(selectedPlan.id)
      await refreshWarehouseData()
      setSelectedPlanId(updated.id)
      message.success('已提交给物流计划。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交物流计划失败')
    } finally {
      setLogisticsSubmitting(false)
    }
  }

  const tabItems = [
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
                placeholder="搜索采购单 / 店铺"
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
            rowKey="id"
            size="small"
            columns={receiptOrderColumns}
            dataSource={visibleReceiptOrders}
            loading={dataLoading}
            pagination={RECEIPT_ORDER_TABLE_PAGINATION}
            onRow={(order) => ({
              onDoubleClick: () => openReceiptConfirmation(order)
            })}
          />
        </div>
      )
    },
    {
      key: 'receipt-confirm',
      label: buildTabLabel('收货验收', totalSummary.receiptTodoPskuCount),
      children: (
        <div className="warehouse-dispatch-panel">
          <div className="warehouse-dispatch-toolbar warehouse-dispatch-receipt-confirm-toolbar">
            <div className="warehouse-dispatch-toolbar-left">
              <Select
                className="warehouse-dispatch-filter-select warehouse-dispatch-store-filter"
                value={receiptStoreFilter}
                options={[{ label: '全部店铺', value: 'all' }, ...receiptStoreOptions]}
                onChange={handleReceiptStoreFilterChange}
              />
              <Input
                className="warehouse-dispatch-search warehouse-dispatch-receipt-confirm-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索 PSKU / 店铺 / 标题"
                value={receiptConfirmKeyword}
                onChange={(event) => setReceiptConfirmKeyword(event.target.value)}
              />
            </div>
            <div className="warehouse-dispatch-toolbar-right">
              {productBaselineLoading ? <Tag color="processing">商品基线读取中</Tag> : null}
              {productBaselineError ? <Tag color="gold">商品基线读取失败</Tag> : null}
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={receiptSubmitting}
                onClick={confirmReceipt}
              >
                完成验收
              </Button>
            </div>
          </div>
          {selectedReceiptOrder && receiptProductRows.length ? (
            <div className="warehouse-dispatch-receipt-confirm-layout">
              {renderReceiptOrderSummary(selectedReceiptOrder, orderSummaries.get(selectedReceiptOrder.id))}
              <Table
                className="warehouse-dispatch-receipt-items-table"
                rowKey="id"
                size="small"
                columns={receiptItemColumns}
                dataSource={visibleReceiptProductRows}
                loading={dataLoading}
                pagination={RECEIPT_ITEM_TABLE_PAGINATION}
                scroll={{ x: 1168 }}
                locale={{
                  emptyText: <Empty description={receiptConfirmKeyword ? '没有匹配的验收商品' : '当前采购单已无待验货商品'} />
                }}
              />
            </div>
          ) : (
            <Empty className="warehouse-dispatch-empty" description="暂无采购单" />
          )}
        </div>
      )
    },
    {
      key: 'ship-ready',
      label: buildTabLabel('可发运商品', allReadyItems.length),
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
              <Text type="secondary">已选 {selectedReadyItemIds.length} 行</Text>
            </div>
            <div className="warehouse-dispatch-toolbar-right">
              <Button onClick={() => setSelectedReadyItemIds([])}>清空选择</Button>
              <Button
                type="primary"
                icon={<FileDoneOutlined />}
                loading={planSubmitting}
                onClick={createDispatchPlanFromSelection}
              >
                生成发运计划
              </Button>
            </div>
          </div>
          <Table
            rowKey="id"
            size="small"
            columns={readyItemColumns}
            dataSource={visibleReadyItems}
            loading={dataLoading}
            pagination={READY_ITEM_TABLE_PAGINATION}
            rowSelection={{
              selectedRowKeys: selectedReadyItemIds,
              onChange: (keys) => setSelectedReadyItemIds(keys.map(String))
            }}
            locale={{ emptyText: <Empty description="暂无已收货待发运商品" /> }}
          />
        </div>
      )
    },
    {
      key: 'dispatch-plan',
      label: buildTabLabel('发运计划', dispatchPlans.length),
      children: (
        <div className="warehouse-dispatch-panel">
          <div className="warehouse-dispatch-toolbar">
            <div className="warehouse-dispatch-toolbar-left">
              <Segmented
                size="small"
                value={selectedPlan?.id}
                options={dispatchPlans.map((plan) => ({ label: plan.planNo, value: plan.id }))}
                onChange={(value) => setSelectedPlanId(String(value))}
              />
              {selectedPlan ? renderDispatchStatus(selectedPlan.status) : null}
            </div>
            <div className="warehouse-dispatch-toolbar-right">
              <Button icon={<ReloadOutlined />} loading={dataLoading} onClick={() => { void refreshWarehouseData() }}>
                刷新
              </Button>
              <Button
                type="primary"
                icon={<TruckOutlined />}
                disabled={!selectedPlan || !['draft', 'handoff_failed'].includes(selectedPlan.status)}
                loading={logisticsSubmitting}
                onClick={generateLogisticsPlan}
              >
                生成物流计划
              </Button>
            </div>
          </div>
          {selectedPlan ? (
            <div className="warehouse-dispatch-plan-layout">
              <div>
                {renderSummaryGrid([
                  ['来源采购单', countPlanSourceOrders(selectedPlan)],
                  ['店铺', countPlanStores(selectedPlan)],
                  ['PSKU', selectedPlan.lines.length],
                  ['总数量', sumPlanQuantity(selectedPlan)],
                  ['预计物流计划', selectedPlanRouteGroups.length]
                ])}
                <Table
                  rowKey="id"
                  size="small"
                  columns={dispatchPlanLineColumns}
                  dataSource={selectedPlan.lines}
                  loading={dataLoading}
                  pagination={DISPATCH_PLAN_LINE_TABLE_PAGINATION}
                  locale={{ emptyText: <Empty description="当前发运计划还没有商品" /> }}
                />
              </div>
              <div className="warehouse-dispatch-route-list">
                {selectedPlanRouteGroups.length ? (
                  selectedPlanRouteGroups.map((group) => renderRouteGroup(group))
                ) : (
                  <Empty description="暂无物流分组" />
                )}
              </div>
            </div>
          ) : (
            <Empty className="warehouse-dispatch-empty" description="暂无发运计划，请先从可发运商品生成" />
          )}
        </div>
      )
    }
  ]

  return (
    <div className="warehouse-dispatch-page">
      <div className="warehouse-dispatch-header">
        {renderSummaryGrid(
          [
            ['待处理', totalSummary.receiptTodoOrderCount],
            ['全部采购单', totalSummary.orderCount],
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

function buildTabLabel(label: string, count: number) {
  return (
    <span>
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

function filterReceiptProductRows(rows: ReceiptProductRow[], keyword: string) {
  const normalizedKeyword = normalizeSearchText(keyword)
  if (!normalizedKeyword) {
    return rows
  }
  return rows.filter((row) =>
    [
      row.psku,
      row.title,
      row.baseline?.title,
      row.storeName,
      receiptProductRowDisplayStoreName(row),
      row.orderTitle
    ].some((value) => includesSearchText(value, normalizedKeyword))
  )
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
    item.title,
    item.siteCode,
    item.transportMode
  ].some((value) => includesSearchText(value, normalizedKeyword))
}

function receiptStoreFilterValue(order: PurchaseReceiptOrder) {
  return String(order.storeCode || order.storeName || '').trim()
}

function receiptOrderDisplayStoreName(order: PurchaseReceiptOrder) {
  return formatWarehouseStoreDisplayName(order.storeName, order.title || order.orderNo, order.storeCode)
}

function receiptProductRowDisplayStoreName(row: ReceiptProductRow) {
  return formatWarehouseStoreDisplayName(row.storeName, row.orderTitle || row.orderNo)
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
      {renderReceiptSummaryItem('采购单', order.title || order.orderNo, true)}
      {renderReceiptSummaryItem('应收总数', safeSummary.expectedQty)}
      {renderReceiptSummaryItem('当前已收', safeSummary.receivedQty)}
      {renderReceiptSummaryItem('可发运', safeSummary.readyQty)}
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

function renderReceiptIssueSummary(issue: ReceiptIssueDraft) {
  const tags = [
    issue.returnQty ? <Tag color="red" key="return">退货 {issue.returnQty}</Tag> : null,
    issue.damagedQty ? <Tag color="volcano" key="damaged">破损 {issue.damagedQty}</Tag> : null,
    issue.reshipQty ? <Tag color="gold" key="reship">补发 {issue.reshipQty}</Tag> : null
  ].filter(Boolean)
  return tags.length ? <Space size={0}>{tags}</Space> : <Text type="secondary">无异常</Text>
}

function renderReceiptProductCell(row: ReceiptProductRow) {
  return renderWarehouseProductCell({
    psku: row.psku,
    title: row.title,
    imageUrl: row.imageUrl,
    baseline: row.baseline
  })
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

function renderReceiptSourceCell(row: ReceiptProductRow) {
  return (
    <div className="warehouse-dispatch-receipt-source">
      <Text className="warehouse-dispatch-receipt-source-title" strong>
        {row.orderTitle || row.orderNo}
      </Text>
      <Text className="warehouse-dispatch-receipt-source-date" type="secondary">
        {formatReceiptSourceDate(row.orderCreatedAt)}
      </Text>
    </div>
  )
}

function renderReadySourceCell(item: ReadyShipmentRow, orderMetaById: Map<string, ReceiptOrderMeta>) {
  return (
    <div className="warehouse-dispatch-source-list">
      {groupReadySources(item.items, orderMetaById).map((source) => (
        <div className="warehouse-dispatch-ready-source-row" key={source.key}>
          <span className="warehouse-dispatch-ready-source-main">
            <Text strong>{source.orderTitle || source.orderNo}</Text>
            <span className="warehouse-dispatch-ready-source-separator">/</span>
            <Text type="secondary">{formatReceiptSourceDate(source.orderCreatedAt)}</Text>
          </span>
          <span className="warehouse-dispatch-ready-source-meta">
            <Tag color="blue">{source.siteCode}</Tag>
            <span className="warehouse-dispatch-source-qty">可发 {source.availableQty}</span>
            <span className="warehouse-dispatch-source-qty">原计划 {TRANSPORT_LABELS[source.plannedTransportMode]}</span>
          </span>
        </div>
      ))}
    </div>
  )
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

function renderReceiptItemIssue(item: ReceiptProductRow, receivedQty: number) {
  if (item.specStatus === 'missing') {
    return <Tag color="gold">规格缺失</Tag>
  }
  if (receivedQty < item.expectedQty) {
    return <Tag color="red">少货 {item.expectedQty - receivedQty}</Tag>
  }
  return <Tag color="green">正常</Tag>
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

function renderRouteGroup(group: RouteGroup) {
  return (
    <div className="warehouse-dispatch-route-card" key={group.key}>
      <div className="warehouse-dispatch-route-title">
        <span>
          {SITE_LABELS[group.siteCode]} {TRANSPORT_LABELS[group.transportMode]}
        </span>
        {group.issueCount > 0 ? <Tag color="gold">需处理</Tag> : <Tag color="green">可生成</Tag>}
      </div>
      <div className="warehouse-dispatch-route-meta">商品 {group.lineCount} 个，数量 {group.totalQuantity}</div>
      <div className="warehouse-dispatch-route-meta">
        拆分规则：站点 + 运输方式 + 发货仓库 + 货物属性
      </div>
    </div>
  )
}

function summarizeReceiptOrder(order: PurchaseReceiptOrder): ReceiptOrderSummary {
  const itemCount = order.items.length
  const pskuCount = new Set(order.items.map((item) => item.psku)).size
  const expectedQty = sum(order.items.map((item) => item.expectedQty))
  const receivedQty = sum(order.items.map((item) => item.receivedQty))
  const plannedQty = sum(order.items.map((item) => item.plannedQty))
  const readyQty = sum(order.items.map((item) => Math.max(0, item.receivedQty - item.plannedQty)))
  const missingSpecCount = order.items.filter((item) => item.specStatus === 'missing').length
  const hasShortage = order.items.some((item) => item.receivedQty > 0 && item.receivedQty < item.expectedQty)
  return {
    itemCount,
    pskuCount,
    expectedQty,
    receivedQty,
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

function isReceiptRowPending(row: ReceiptProductRow) {
  return row.receivedQty < row.expectedQty
}

function buildProductBaselineMap(items: ProductListRowPayload[]) {
  const result: Record<string, ProductBaselineSummary> = {}
  items.forEach((item) => {
    const imageUrl = normalizeNoonImageUrl(item.imageUrl || item.galleryImages?.[0])
    const summary: ProductBaselineSummary = {
      psku: item.pskuCode || item.partnerSku || item.skuParent,
      skuParent: item.skuParent,
      title: item.title,
      imageUrl,
      productFulltype: item.productFulltype,
      detailBaselineStatus: item.detailBaselineStatus
    }
    ;[item.pskuCode, item.partnerSku, item.skuParent].forEach((key) => {
      const normalizedKey = normalizeProductKey(key)
      if (normalizedKey && !result[normalizedKey]) {
        result[normalizedKey] = summary
      }
    })
  })
  return result
}

function buildReceiptProductRows(
  orders: PurchaseReceiptOrder[],
  productBaselineByPsku: Record<string, ProductBaselineSummary>
) {
  const rowMap = new Map<string, ReceiptProductRow>()
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = normalizeProductKey(item.psku) || item.psku
      const rowId = key
      const baseline = productBaselineByPsku[key]
      const currentRow = rowMap.get(rowId)
      if (currentRow) {
        currentRow.expectedQty += item.expectedQty
        currentRow.receivedQty += item.receivedQty
        currentRow.plannedQty += item.plannedQty
        currentRow.specStatus = currentRow.specStatus === 'missing' || item.specStatus === 'missing' ? 'missing' : 'complete'
        currentRow.items.push(item)
        if (!hasCjkText(currentRow.title) && hasCjkText(item.title)) {
          currentRow.title = item.title
        }
        if (!currentRow.imageUrl && item.imageUrl) {
          currentRow.imageUrl = normalizeNoonImageUrl(item.imageUrl)
        }
        return
      }
      rowMap.set(rowId, {
        id: rowId,
        orderId: order.id,
        orderNo: order.orderNo,
        orderTitle: order.title || order.orderNo,
        orderCreatedAt: order.createdAt,
        storeName: order.storeName,
        psku: item.psku,
        title: item.title || baseline?.title || item.psku,
        imageUrl: normalizeNoonImageUrl(item.imageUrl),
        expectedQty: item.expectedQty,
        receivedQty: item.receivedQty,
        plannedQty: item.plannedQty,
        specStatus: item.specStatus,
        items: [item],
        baseline
      })
    })
  })
  return Array.from(rowMap.values())
}

function formatReceiptSourceDate(value?: string) {
  const text = String(value || '').trim()
  return text.length >= 10 ? text.slice(0, 10) : text || '-'
}

function buildDistributedReceiptQuantityMap(rows: ReceiptProductRow[], receiptDraft: Record<string, number>) {
  const result = new Map<string, number>()
  rows.forEach((row) => {
    const targetQuantity = clampQuantity(receiptDraft[row.id] ?? row.receivedQty, 0, row.expectedQty)
    const distributedQuantities = distributeQuantityByExpected(row.items, targetQuantity)
    row.items.forEach((item, index) => {
      result.set(item.id, distributedQuantities[index] ?? 0)
    })
  })
  return result
}

function buildDistributedReceiptIssueQuantityMap(
  rows: ReceiptProductRow[],
  receiptIssueDraft: Record<string, ReceiptIssueDraft>
) {
  const result = new Map<string, number>()
  rows.forEach((row) => {
    const issueQuantity = clampQuantity(sumReceiptIssueDraft(receiptIssueDraft[row.id]), 0, row.expectedQty)
    const distributedQuantities = distributeQuantityByExpected(row.items, issueQuantity)
    row.items.forEach((item, index) => {
      result.set(item.id, distributedQuantities[index] ?? 0)
    })
  })
  return result
}

function buildDistributedReceiptIssueReasonMap(
  rows: ReceiptProductRow[],
  receiptIssueDraft: Record<string, ReceiptIssueDraft>
) {
  const result = new Map<string, string>()
  rows.forEach((row) => {
    const reason = formatReceiptIssueReason(receiptIssueDraft[row.id])
    if (!reason) {
      return
    }
    row.items.forEach((item) => {
      result.set(item.id, reason)
    })
  })
  return result
}

function formatReceiptIssueReason(issue?: ReceiptIssueDraft) {
  const parts = [
    issue?.returnQty ? `退货 ${issue.returnQty}` : '',
    issue?.damagedQty ? `破损 ${issue.damagedQty}` : '',
    issue?.reshipQty ? `补发 ${issue.reshipQty}` : ''
  ].filter(Boolean)
  return parts.join('，')
}

function sumReceiptIssueDraft(issue?: ReceiptIssueDraft) {
  return nonNegative(issue?.returnQty) + nonNegative(issue?.damagedQty) + nonNegative(issue?.reshipQty)
}

function mergeReadyShipmentRowsByProduct(items: ReadyShipmentRow[]) {
  const rowMap = new Map<string, ReadyShipmentRow>()
  items.forEach((item) => {
    const key = normalizeProductKey(item.psku) || item.id
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
      id: `ready-product__${key}`,
      items: [...sourceItems]
    })
  })
  return Array.from(rowMap.values())
}

function groupReadySources(items: ReadyShipmentItem[], orderMetaById: Map<string, ReceiptOrderMeta>) {
  const sourceMap = new Map<
    string,
    {
      key: string
      orderNo: string
      orderTitle: string
      orderCreatedAt: string
      siteCode: WarehouseSiteCode
      plannedTransportMode: WarehouseTransportMode
      availableQty: number
    }
  >()
  items.forEach((item) => {
    const orderMeta = orderMetaById.get(item.orderId)
    const orderTitle = item.orderTitle || orderMeta?.title || item.orderNo
    const orderCreatedAt = item.orderCreatedAt || orderMeta?.createdAt || ''
    const key = `${item.orderId}__${orderTitle}__${orderCreatedAt}__${item.siteCode}__${item.transportMode}`
    const current = sourceMap.get(key)
    if (current) {
      current.availableQty += item.availableQty
      return
    }
    sourceMap.set(key, {
      key,
      orderNo: item.orderNo,
      orderTitle,
      orderCreatedAt,
      siteCode: item.siteCode,
      plannedTransportMode: item.transportMode,
      availableQty: item.availableQty
    })
  })
  return Array.from(sourceMap.values())
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

function expandReadyRowDrafts(
  row: ReadyShipmentRow,
  quantity: number,
  actualTransportMode: WarehouseTransportMode
): AddLineDraft[] {
  const targetQuantity = clampQuantity(quantity, 0, row.availableQty)
  if (targetQuantity <= 0) {
    return []
  }
  const sourceItems = row.items.length ? row.items : [row]
  const distributedQuantities = distributeQuantityByAvailable(sourceItems, targetQuantity)
  return sourceItems
    .map((item, index) => ({
      item,
      quantity: distributedQuantities[index] ?? 0,
      actualTransportMode
    }))
    .filter((draft) => draft.quantity > 0)
}

function buildDefaultTransportSplit(row: ReadyShipmentRow): Required<TransportSplitDraft> {
  const sourceItems = row.items.length ? row.items : [row]
  return {
    AIR: sourceItems
      .filter((item) => item.transportMode !== 'SEA')
      .reduce((total, item) => total + item.availableQty, 0),
    SEA: sourceItems
      .filter((item) => item.transportMode === 'SEA')
      .reduce((total, item) => total + item.availableQty, 0)
  }
}

function distributeQuantityByExpected(items: PurchaseReceiptItem[], totalQuantity: number) {
  const expectedTotal = sum(items.map((item) => item.expectedQty))
  if (expectedTotal <= 0 || totalQuantity <= 0) {
    return items.map(() => 0)
  }
  if (totalQuantity >= expectedTotal) {
    return items.map((item) => item.expectedQty)
  }
  const rawAllocations = items.map((item, index) => {
    const raw = (item.expectedQty / expectedTotal) * totalQuantity
    const base = Math.floor(raw)
    return {
      index,
      base,
      fraction: raw - base,
      max: item.expectedQty
    }
  })
  let remaining = totalQuantity - sum(rawAllocations.map((item) => item.base))
  rawAllocations
    .slice()
    .sort((left, right) => right.fraction - left.fraction)
    .forEach((item) => {
      if (remaining <= 0 || item.base >= item.max) {
        return
      }
      item.base += 1
      remaining -= 1
    })
  return rawAllocations
    .sort((left, right) => left.index - right.index)
    .map((item) => item.base)
}

function distributeQuantityByAvailable(items: ReadyShipmentItem[], totalQuantity: number) {
  const availableTotal = sum(items.map((item) => item.availableQty))
  if (availableTotal <= 0 || totalQuantity <= 0) {
    return items.map(() => 0)
  }
  if (totalQuantity >= availableTotal) {
    return items.map((item) => item.availableQty)
  }
  const rawAllocations = items.map((item, index) => {
    const raw = (item.availableQty / availableTotal) * totalQuantity
    const base = Math.floor(raw)
    return {
      index,
      base,
      fraction: raw - base,
      max: item.availableQty
    }
  })
  let remaining = totalQuantity - sum(rawAllocations.map((item) => item.base))
  rawAllocations
    .slice()
    .sort((left, right) => right.fraction - left.fraction)
    .forEach((item) => {
      if (remaining <= 0 || item.base >= item.max) {
        return
      }
      item.base += 1
      remaining -= 1
    })
  return rawAllocations
    .sort((left, right) => left.index - right.index)
    .map((item) => item.base)
}

function normalizeProductKey(value?: string | null) {
  return String(value || '').trim().toUpperCase()
}

function buildProductBaselineStoreCodes({
  activeTab,
  currentStoreCode,
  selectedPlan,
  selectedReceiptOrder,
  visibleReadyItems
}: {
  activeTab: WarehouseDispatchTabKey
  currentStoreCode?: string
  selectedPlan?: DispatchPlan
  selectedReceiptOrder?: PurchaseReceiptOrder
  visibleReadyItems: ReadyShipmentRow[]
}) {
  if (activeTab === 'receipt-list') {
    return []
  }
  if (activeTab === 'receipt-confirm') {
    const storeCodes = [
      selectedReceiptOrder?.storeCode,
      ...((selectedReceiptOrder?.items || []).map((item) => item.storeCode))
    ]
    return uniqueStoreCodes(storeCodes.length ? storeCodes : [currentStoreCode])
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

function omitRecordKey<TValue>(record: Record<string, TValue>, key: string) {
  const { [key]: _removed, ...rest } = record
  return rest
}

function nonNegative(value?: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(Number(value))) : 0
}

function clampQuantity(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, Math.trunc(value)))
}
