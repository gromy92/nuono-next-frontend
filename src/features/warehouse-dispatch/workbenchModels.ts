import type { AuthSession } from '../auth/session'
import type {
  DispatchPlan,
  PurchaseReceiptOrder,
  ReadyShipmentItem,
  ReceiptStatus,
  ShippingSuggestionLine,
  WarehouseFulfillmentType,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './types'

export type WarehouseDispatchTabKey =
  | 'warehouse-order'
  | 'receipt-list'
  | 'ship-ready'
  | 'dispatch-plan'
  | 'packing-list'

export type WarehouseDispatchWorkbenchPageProps = {
  session?: AuthSession | null
}

export type ReceiptOrderSummary = {
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

export type ReadyFilterKey = 'all' | 'SA-AIR' | 'SA-SEA' | 'AE-AIR' | 'AE-SEA' | 'missing'
export type ReceiptSiteFilterKey = 'all' | WarehouseSiteCode
export type ReceiptScopeFilterKey = 'todo' | 'all'
export type ReceiptDetailScopeFilterKey = 'all' | 'pending' | 'completed'

export type ReceiptStoreOption = {
  label: string
  value: string
}

export type ProductBaselineSummary = {
  psku: string
  skuParent?: string
  title?: string
  imageUrl?: string
  productFulltype?: string
  detailBaselineStatus?: string
}

export type ReadyShipmentRow = ReadyShipmentItem & {
  items: ReadyShipmentItem[]
}

export type DispatchTargetTransportMode = Exclude<WarehouseTransportMode, 'UNSPECIFIED'>

export type DispatchTargetModalState = {
  source: ReadyShipmentItem
  targetSiteCode: WarehouseSiteCode
  targetTransportMode: DispatchTargetTransportMode
}

export type ReceiptOrderMeta = {
  title: string
  createdAt: string
}

export type WarehouseDataset = {
  orders: PurchaseReceiptOrder[]
  readyItems: ReadyShipmentRow[]
  dispatchPlans: DispatchPlan[]
}

export type ShippingAmountTotal = {
  currency: string
  amount: number
}

export type ShippingForwarderCostComponentSummary = {
  key: string
  componentType?: string
  componentName: string
  amounts: ShippingAmountTotal[]
}

export type ShippingForwarderCostBreakdown = {
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

export const SITE_LABELS: Record<WarehouseSiteCode, string> = {
  SA: 'SA',
  AE: 'AE'
}

export const TRANSPORT_LABELS: Record<WarehouseTransportMode, string> = {
  AIR: '空运',
  SEA: '海运',
  UNSPECIFIED: '未定'
}

export const FULFILLMENT_LABELS: Record<WarehouseFulfillmentType, string> = {
  WAREHOUSE_RECEIPT: '到仓收货',
  FACTORY_DIRECT: '厂家直发'
}

export const RECEIPT_STATUS_META: Record<ReceiptStatus, { label: string; color: string }> = {
  pending: { label: '待收货', color: 'gold' },
  partial: { label: '部分收货', color: 'blue' },
  ready: { label: '已收待发运', color: 'green' },
  planned: { label: '已进计划', color: 'purple' },
  exception: { label: '收货异常', color: 'red' }
}

export const DISPATCH_STATUS_META = {
  draft: { label: '待生成物流计划', color: 'gold' },
  ready_for_logistics: { label: '已生成物流计划', color: 'blue' },
  handoff_failed: { label: '交接失败', color: 'red' },
  logistics_requested: { label: '已下发发货单', color: 'green' },
  cancelled: { label: '已取消', color: 'default' }
} as const

export const READY_FILTER_OPTIONS: Array<{ label: string; value: ReadyFilterKey }> = [
  { label: '全部', value: 'all' },
  { label: 'SA 空', value: 'SA-AIR' },
  { label: 'SA 海', value: 'SA-SEA' },
  { label: 'AE 空', value: 'AE-AIR' },
  { label: 'AE 海', value: 'AE-SEA' },
  { label: '规格缺失', value: 'missing' }
]

export const DISPATCH_TARGET_SITE_OPTIONS = [
  { label: 'SA', value: 'SA' as const },
  { label: 'AE', value: 'AE' as const }
]

export const DISPATCH_TARGET_TRANSPORT_OPTIONS = [
  { label: '空运', value: 'AIR' as const },
  { label: '海运', value: 'SEA' as const }
]

function pagination(pageSize: number, totalLabel: string, pageSizeOptions: number[]) {
  return {
    pageSize,
    showSizeChanger: true,
    pageSizeOptions,
    showTotal: (total: number) => `共 ${total} ${totalLabel}`,
    size: 'small' as const
  }
}

export const RECEIPT_ORDER_TABLE_PAGINATION = pagination(30, '行', [20, 30, 50, 100])
export const RECEIPT_ITEM_TABLE_PAGINATION = pagination(30, '行', [20, 30, 50, 100])
export const READY_ITEM_TABLE_PAGINATION = pagination(50, '行', [30, 50, 100])
export const DISPATCH_PLAN_TABLE_PAGINATION = pagination(20, '张申请单', [20, 30, 50, 100])
export const DISPATCH_PLAN_LINE_TABLE_PAGINATION = pagination(30, '行', [20, 30, 50, 100])
