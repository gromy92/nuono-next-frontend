import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  DispatchPlan,
  DispatchPlanLine,
  DispatchPlanSource,
  DispatchPlanStatus,
  ProductSpecStatus,
  PurchaseReceiptItem,
  PurchaseReceiptOrder,
  ReadyShipmentItem,
  WarehouseFulfillmentType,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './types'

type ReadyShipmentRow = ReadyShipmentItem & {
  items: ReadyShipmentItem[]
}

type ConfirmationPayload = {
  purchaseOrderId: string
  confirmationType: WarehouseFulfillmentType
  sourcePartyName?: string
  remark?: string
  lines: Array<{
    purchaseOrderItemId: string
    confirmedQuantity: number
    abnormalQuantity?: number
    exceptionReason?: string
  }>
}

type CreateDispatchPlanPayload = {
  remark?: string
  sources: Array<{
    fulfillmentBalanceId: number
    quantity: number
    actualTransportMode: WarehouseTransportMode
  }>
}

type ApiPurchaseReceiptOrder = Omit<PurchaseReceiptOrder, 'items'> & {
  storeCode?: string
  items?: ApiPurchaseReceiptItem[]
}

type ApiPurchaseReceiptItem = Omit<PurchaseReceiptItem, 'siteCode' | 'transportMode' | 'specStatus' | 'fulfillmentType'> & {
  storeCode?: string
  siteCode?: string
  transportMode?: string
  specStatus?: string
  fulfillmentType?: string
}

type ApiReadyItem = {
  productVariantId?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  fulfillmentType?: string
  specStatus?: string
  availableQuantity?: number
  logisticsQuoteStatus?: string
  logisticsShippingSubmitStatus?: string
  logisticsQuoteBlocking?: boolean
  sources?: ApiReadySource[]
}

type ApiReadySource = {
  fulfillmentBalanceId?: number
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderId?: number
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  purchaseOrderItemId?: number
  purchaseOrderItemSiteId?: number
  plannedTransportMode?: string
  availableQuantity?: number
  logisticsQuoteStatus?: string
  logisticsShippingSubmitStatus?: string
  logisticsQuoteBlocking?: boolean
}

type ApiDispatchPlan = {
  id?: string
  planNo?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  handoffRequestNo?: string
  handoffErrorMessage?: string
  lines?: ApiDispatchPlanLine[]
}

type ApiDispatchPlanLine = {
  id?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  fulfillmentType?: string
  specStatus?: string
  quantity?: number
  sources?: ApiDispatchPlanSource[]
}

type ApiDispatchPlanSource = {
  id?: string
  fulfillmentBalanceId?: number
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderNo?: string
  plannedTransportMode?: string
  fulfillmentType?: string
  quantity?: number
}

export function loadWarehouseReceiptOrders(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<ApiPurchaseReceiptOrder[]>(`/api/warehouse/dispatch/receipt-orders${suffix}`, '读取采购收货失败')
    .then((orders) => orders.map(mapReceiptOrder))
}

export function loadReadyShipmentItems(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<ApiReadyItem[]>(`/api/warehouse/dispatch/ready-items${suffix}`, '读取可发运商品失败')
    .then((items) => items.map(mapReadyItem))
}

export function loadDispatchPlans() {
  return getJson<ApiDispatchPlan[]>('/api/warehouse/dispatch/dispatch-plans', '读取发运计划失败')
    .then((plans) => plans.map(mapDispatchPlan))
}

export function createFulfillmentConfirmation(payload: ConfirmationPayload) {
  return sendJson('/api/warehouse/dispatch/confirmations', 'POST', payload, '保存收货验收失败')
}

export function createDispatchPlan(payload: CreateDispatchPlanPayload) {
  return sendJson<ApiDispatchPlan>('/api/warehouse/dispatch/dispatch-plans', 'POST', payload, '生成发运计划失败')
    .then(mapDispatchPlan)
}

export function markDispatchPlanReadyForLogistics(dispatchPlanId: string) {
  return sendJson<ApiDispatchPlan>(
    `/api/warehouse/dispatch/dispatch-plans/${encodeURIComponent(dispatchPlanId)}/ready-for-logistics`,
    'POST',
    {},
    '提交物流计划失败'
  ).then(mapDispatchPlan)
}

function mapReceiptOrder(order: ApiPurchaseReceiptOrder): PurchaseReceiptOrder {
  return {
    id: String(order.id || ''),
    orderNo: order.orderNo || '',
    title: order.title || '',
    storeCode: order.storeCode,
    storeName: order.storeName || '',
    createdAt: order.createdAt || '',
    items: (order.items || []).map(mapReceiptItem)
  }
}

function mapReceiptItem(item: ApiPurchaseReceiptItem): PurchaseReceiptItem {
  return {
    ...item,
    id: String(item.id || ''),
    orderId: String(item.orderId || ''),
    orderNo: item.orderNo || '',
    storeCode: item.storeCode,
    storeName: item.storeName || '',
    psku: item.psku || '',
    title: item.title || item.psku || '',
    siteCode: normalizeSiteCode(item.siteCode),
    transportMode: normalizeTransportMode(item.transportMode),
    fulfillmentType: normalizeFulfillmentType(item.fulfillmentType),
    expectedQty: Number(item.expectedQty || 0),
    receivedQty: Number(item.receivedQty || 0),
    plannedQty: Number(item.plannedQty || 0),
    specStatus: normalizeSpecStatus(item.specStatus)
  }
}

function mapReadyItem(item: ApiReadyItem): ReadyShipmentRow {
  const siteCode = normalizeSiteCode(item.siteCode)
  const fulfillmentType = normalizeFulfillmentType(item.fulfillmentType)
  const specStatus = normalizeSpecStatus(item.specStatus)
  const psku = item.partnerSku || item.skuParent || ''
  const title = item.productTitle || psku
  const rowId = ['ready', item.productVariantId || psku, siteCode, fulfillmentType, specStatus].join('__')
  const sourceItems = (item.sources || []).map((source) => {
    const availableQty = Number(source.availableQuantity || 0)
    return {
      id: String(source.fulfillmentBalanceId || source.purchaseOrderItemSiteId || source.purchaseOrderItemId || rowId),
      orderId: String(source.purchaseOrderId || ''),
      orderNo: source.purchaseOrderNo || '',
      orderTitle: source.purchaseOrderTitle || source.purchaseOrderNo || '',
      storeCode: source.sourceStoreCode,
      storeName: source.sourceStoreName || '',
      psku,
      title,
      imageUrl: item.productImageUrl,
      siteCode,
      transportMode: normalizeTransportMode(source.plannedTransportMode),
      fulfillmentType,
      expectedQty: 0,
      receivedQty: availableQty,
      plannedQty: 0,
      specStatus,
      availableQty,
      fulfillmentBalanceId: source.fulfillmentBalanceId,
      logisticsQuoteStatus: normalizeLogisticsQuoteStatus(source.logisticsQuoteStatus || item.logisticsQuoteStatus),
      logisticsShippingSubmitStatus: normalizeLogisticsShippingSubmitStatus(
        source.logisticsShippingSubmitStatus || item.logisticsShippingSubmitStatus
      ),
      logisticsQuoteBlocking: Boolean(source.logisticsQuoteBlocking ?? item.logisticsQuoteBlocking)
    }
  })
  const logisticsQuoteValues = sourceItems.length
    ? sourceItems.map((source) => source.logisticsQuoteStatus)
    : [item.logisticsQuoteStatus]
  const logisticsShippingValues = sourceItems.length
    ? sourceItems.map((source) => source.logisticsShippingSubmitStatus)
    : [item.logisticsShippingSubmitStatus]
  const logisticsQuoteBlocking = Boolean(item.logisticsQuoteBlocking || sourceItems.some((source) => source.logisticsQuoteBlocking))
  return {
    id: rowId,
    orderId: '',
    orderNo: '',
    storeName: '',
    psku,
    title,
    imageUrl: item.productImageUrl,
    siteCode,
    transportMode: inferDominantTransport(sourceItems),
    fulfillmentType,
    expectedQty: 0,
    receivedQty: Number(item.availableQuantity || 0),
    plannedQty: 0,
    specStatus,
    availableQty: Number(item.availableQuantity || 0),
    logisticsQuoteStatus: mergeLogisticsQuoteStatus(logisticsQuoteValues),
    logisticsShippingSubmitStatus: mergeLogisticsShippingSubmitStatus(logisticsShippingValues),
    logisticsQuoteBlocking,
    items: sourceItems
  }
}

function mapDispatchPlan(plan: ApiDispatchPlan): DispatchPlan {
  return {
    id: String(plan.id || ''),
    planNo: plan.planNo || '',
    status: normalizeDispatchStatus(plan.status),
    createdAt: plan.createdAt || plan.updatedAt || '',
    handoffRequestNo: plan.handoffRequestNo,
    handoffErrorMessage: plan.handoffErrorMessage,
    lines: (plan.lines || []).map(mapDispatchPlanLine)
  }
}

function mapDispatchPlanLine(line: ApiDispatchPlanLine): DispatchPlanLine {
  return {
    id: String(line.id || ''),
    psku: line.partnerSku || line.skuParent || '',
    title: line.productTitle || line.partnerSku || '',
    imageUrl: line.productImageUrl,
    siteCode: normalizeSiteCode(line.siteCode),
    transportMode: normalizeTransportMode(line.actualTransportMode),
    fulfillmentType: normalizeFulfillmentType(line.fulfillmentType),
    specStatus: normalizeSpecStatus(line.specStatus),
    totalQuantity: Number(line.quantity || 0),
    sources: (line.sources || []).map(mapDispatchPlanSource)
  }
}

function mapDispatchPlanSource(source: ApiDispatchPlanSource): DispatchPlanSource {
  return {
    sourceItemId: String(source.fulfillmentBalanceId || source.id || ''),
    fulfillmentBalanceId: source.fulfillmentBalanceId,
    orderNo: source.purchaseOrderNo || '',
    storeCode: source.sourceStoreCode,
    storeName: source.sourceStoreName || '',
    plannedTransportMode: normalizeTransportMode(source.plannedTransportMode),
    fulfillmentType: normalizeFulfillmentType(source.fulfillmentType),
    quantity: Number(source.quantity || 0)
  }
}

async function getJson<TResponse>(url: string, fallback: string) {
  return parseApiResponse<TResponse>(await apiFetch(url), fallback)
}

async function sendJson<TResponse>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  fallback: string
) {
  return parseApiResponse<TResponse>(
    await apiFetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
    fallback
  )
}

function normalizeSiteCode(value?: string): WarehouseSiteCode {
  return value === 'AE' ? 'AE' : 'SA'
}

function normalizeTransportMode(value?: string): WarehouseTransportMode {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'SEA') {
    return 'SEA'
  }
  if (normalized === 'UNSPECIFIED') {
    return 'UNSPECIFIED'
  }
  return 'AIR'
}

function normalizeFulfillmentType(value?: string): WarehouseFulfillmentType {
  return String(value || '').toUpperCase() === 'FACTORY_DIRECT' ? 'FACTORY_DIRECT' : 'WAREHOUSE_RECEIPT'
}

function normalizeSpecStatus(value?: string): ProductSpecStatus {
  const normalized = String(value || '').toUpperCase()
  return normalized === 'SPEC_MISSING' || normalized === 'MISSING' ? 'missing' : 'complete'
}

function normalizeLogisticsQuoteStatus(value?: string) {
  return String(value || '').toUpperCase() === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_QUOTE'
}

function normalizeLogisticsShippingSubmitStatus(value?: string) {
  return String(value || '').toUpperCase() === 'SUBMITTED' ? 'SUBMITTED' : 'NOT_SUBMITTED'
}

function mergeLogisticsQuoteStatus(values: Array<string | undefined>) {
  return values.some((value) => normalizeLogisticsQuoteStatus(value) !== 'CONFIRMED') ? 'PENDING_QUOTE' : 'CONFIRMED'
}

function mergeLogisticsShippingSubmitStatus(values: Array<string | undefined>) {
  return values.some((value) => normalizeLogisticsShippingSubmitStatus(value) !== 'SUBMITTED')
    ? 'NOT_SUBMITTED'
    : 'SUBMITTED'
}

function normalizeDispatchStatus(value?: string): DispatchPlanStatus {
  switch (String(value || '').toUpperCase()) {
    case 'READY_FOR_LOGISTICS':
      return 'ready_for_logistics'
    case 'HANDOFF_FAILED':
      return 'handoff_failed'
    case 'LOGISTICS_REQUESTED':
      return 'logistics_requested'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'draft'
  }
}

function inferDominantTransport(items: ReadyShipmentItem[]): WarehouseTransportMode {
  const seaQty = items
    .filter((item) => item.transportMode === 'SEA')
    .reduce((total, item) => total + item.availableQty, 0)
  const airQty = items
    .filter((item) => item.transportMode === 'AIR')
    .reduce((total, item) => total + item.availableQty, 0)
  if (seaQty > airQty) {
    return 'SEA'
  }
  return 'AIR'
}
