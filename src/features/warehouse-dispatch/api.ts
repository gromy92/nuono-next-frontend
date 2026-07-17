import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  DispatchPlan,
  DispatchPlanLine,
  DispatchPlanSource,
  DispatchPlanStatus,
  IssuedShippingBatch,
  OutboundOrder,
  OutboundOrderLine,
  OutboundOrderLineSource,
  PackingList,
  PackingBox,
  PackingBoxItem,
  ProductSpecStatus,
  PurchaseReceiptItem,
  PurchaseReceiptOrder,
  ReadyShipmentItem,
  WarehouseFulfillmentType,
  ShippingRouteOption,
  ShippingBatch,
  ShippingBatchSource,
  ShippingCostComponent,
  ShippingSuggestionLine,
  ShippingSuggestionOption,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './types'

type ReadyShipmentRow = ReadyShipmentItem & {
  items: ReadyShipmentItem[]
}

type DispatchTargetTransportMode = Exclude<WarehouseTransportMode, 'UNSPECIFIED'>

type UpdateDispatchTargetPayload = {
  targetSiteCode: WarehouseSiteCode
  targetTransportMode: DispatchTargetTransportMode
}

type CreateShippingBatchFromDispatchPlanPayload = {
  selectedForwarderCodes?: string[]
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
  targetSiteCode?: string
  targetTransportMode?: string
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
  siteCode?: string
  plannedTransportMode?: string
  targetSiteCode?: string
  targetTransportMode?: string
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
  currentShippingBatch?: ApiShippingBatch
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

type ApiShippingBatch = {
  id?: string
  dispatchPlanId?: string | number
  batchNo?: string
  status?: string
  selectedOptionId?: string
  sourceCount?: number
  skuCount?: number
  totalQuantity?: number
  optionCount?: number
  actualWeightKg?: number | string
  volumeCbm?: number | string
  remark?: string
  createdAt?: string
  updatedAt?: string
  sources?: ApiShippingBatchSource[]
  options?: ApiShippingSuggestionOption[]
}

type ApiShippingBatchSource = {
  id?: string
  fulfillmentBalanceId?: number
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderNo?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  plannedTransportMode?: string
  fulfillmentType?: string
  specStatus?: string
  reservedQuantity?: number
}

type ApiShippingSuggestionOption = {
  id?: string
  optionName?: string
  optionType?: string
  status?: string
  selectedFlag?: boolean
  autoRecommended?: boolean
  targetForwarderCodes?: string[]
  targetForwarderNames?: string[]
  routeCodes?: string[]
  totalQuantity?: number
  airQuantity?: number
  seaQuantity?: number
  specMissingCount?: number
  warningCount?: number
  actualWeightKg?: number | string
  volumeCbm?: number | string
  chargeableWeightKg?: number | string
  estimatedTotalAmount?: number | string
  avgUnitAmount?: number | string
  currency?: string
  blockedReasons?: string[]
  costComponents?: ApiShippingCostComponent[]
  lines?: ApiShippingSuggestionLine[]
}

type ApiShippingCostComponent = {
  componentType?: string
  componentName?: string
  sourceTable?: string
  sourceId?: number | string
  currency?: string
  unitPrice?: number | string
  billingUnit?: string
  billableQuantity?: number | string
  amount?: number | string
  formula?: string
  productLineCount?: number
}

type ApiShippingSuggestionLine = {
  id?: string | number
  partnerSku?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryName?: string
  actualWeightKg?: number | string
  volumeCbm?: number | string
  chargeableWeightKg?: number | string
  rawBillableQuantity?: number | string
  minimumBillableUnit?: number | string
  billableQuantity?: number | string
  billingUnit?: string
  freightAmount?: number | string
  estimatedAmount?: number | string
  currency?: string
  minimumNotMet?: boolean
  quantity?: number
  costComponents?: ApiShippingCostComponent[]
}

type ApiShippingRouteOption = {
  forwarderCode?: string
  forwarderName?: string
  routeCode?: string
  routeName?: string
  siteCode?: string
  transportMode?: string
}

type ApiOutboundOrder = {
  id?: string
  batchId?: number | string
  optionId?: number | string
  outboundNo?: string
  status?: string
  originType?: string
  originName?: string
  skuCount?: number
  totalQuantity?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  lines?: ApiOutboundOrderLine[]
}

type ApiOutboundOrderLine = {
  id?: string
  outboundOrderId?: number | string
  logicalStoreId?: number | string
  sourceStoreCode?: string
  sourceStoreName?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  fulfillmentType?: string
  specStatus?: string
  quantity?: number
  packedQuantity?: number
  sources?: ApiOutboundOrderLineSource[]
}

type ApiOutboundOrderLineSource = {
  id?: string
  outboundOrderId?: number | string
  outboundOrderLineId?: number | string
  batchSourceId?: number | string
  fulfillmentBalanceId?: number | string
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderId?: number | string
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  purchaseOrderItemId?: number | string
  purchaseOrderItemSiteId?: number | string
  plannedTransportMode?: string
  quantity?: number
}

type ApiPackingList = {
  id?: string
  outboundOrderId?: number | string
  packingNo?: string
  status?: string
  boxCount?: number
  packedQuantity?: number
  grossWeightKg?: string
  volumeCbm?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
  boxes?: ApiPackingBox[]
}

type ApiIssuedShippingBatch = {
  shippingBatch?: ApiShippingBatch
  outboundOrders?: ApiOutboundOrder[]
  packingLists?: ApiPackingList[]
}

type ApiPackingBox = {
  id?: string
  packingListId?: number | string
  outboundOrderId?: number | string
  boxNo?: string
  status?: string
  lengthCm?: string
  widthCm?: string
  heightCm?: string
  grossWeightKg?: string
  quantity?: number
  items?: ApiPackingBoxItem[]
}

type ApiPackingBoxItem = {
  id?: string
  packingListId?: number | string
  packingBoxId?: number | string
  outboundOrderId?: number | string
  outboundOrderLineId?: number | string
  productVariantId?: number | string
  partnerSku?: string
  siteCode?: string
  actualTransportMode?: string
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
  return getJson<ApiDispatchPlan[]>('/api/warehouse/dispatch/dispatch-plans', '读取发货申请单失败')
    .then((plans) => plans.map(mapDispatchPlan))
}

export function updateReadyItemDispatchTarget(fulfillmentBalanceId: number, payload: UpdateDispatchTargetPayload) {
  return sendJson<ApiReadySource>(
    `/api/warehouse/dispatch/ready-items/${encodeURIComponent(String(fulfillmentBalanceId))}/dispatch-target`,
    'PUT',
    payload,
    '保存库存计划失败'
  )
}

export function markDispatchPlanReadyForLogistics(dispatchPlanId: string) {
  return sendJson<ApiDispatchPlan>(
    `/api/warehouse/dispatch/dispatch-plans/${encodeURIComponent(dispatchPlanId)}/ready-for-logistics`,
    'POST',
    {},
    '生成物流计划失败'
  ).then(mapDispatchPlan)
}

export function loadDispatchPlanShippingRouteOptions(dispatchPlanId: string) {
  return getJson<ApiShippingRouteOption[]>(
    `/api/warehouse/dispatch/dispatch-plans/${encodeURIComponent(dispatchPlanId)}/shipping-route-options`,
    '读取物流渠道失败'
  ).then((options) => options.map(mapShippingRouteOption))
}

export function createShippingBatchFromDispatchPlan(
  dispatchPlanId: string,
  payload: CreateShippingBatchFromDispatchPlanPayload = {}
) {
  return sendJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/dispatch-plans/${encodeURIComponent(dispatchPlanId)}/shipping-batch`,
    'POST',
    payload,
    '生成物流计划失败'
  ).then(mapShippingBatch)
}

export function loadShippingBatches() {
  return getJson<ApiShippingBatch[]>('/api/warehouse/dispatch/shipping-batches', '读取发货单失败')
    .then((batches) => batches.map(mapShippingBatch))
}

export function loadShippingBatch(batchId: string) {
  return getJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}`,
    '读取发货单详情失败'
  ).then(mapShippingBatch)
}

export function selectShippingOption(batchId: string, optionId: string) {
  return sendJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/options/${encodeURIComponent(optionId)}/select`,
    'POST',
    {},
    '选择物流渠道失败'
  ).then(mapShippingBatch)
}

export function createOutboundOrders(batchId: string) {
  return sendJson<ApiOutboundOrder[]>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/outbound-orders`,
    'POST',
    {},
    '生成发货单失败'
  ).then((orders) => orders.map(mapOutboundOrder))
}

export function issueShippingBatch(batchId: string, optionId: string): Promise<IssuedShippingBatch> {
  return sendJson<ApiIssuedShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/issue`,
    'POST',
    { optionId },
    '下发仓库单失败'
  ).then((issued) => ({
    shippingBatch: mapShippingBatch(issued.shippingBatch || {}),
    outboundOrders: (issued.outboundOrders || []).map(mapOutboundOrder),
    packingLists: (issued.packingLists || []).map(mapPackingList)
  }))
}

export function loadOutboundOrders(batchId: string) {
  return getJson<ApiOutboundOrder[]>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/outbound-orders`,
    '读取发货单明细失败'
  ).then((orders) => orders.map(mapOutboundOrder))
}

export function createPackingList(outboundOrderId: string) {
  return sendJson<ApiPackingList>(
    `/api/warehouse/dispatch/outbound-orders/${encodeURIComponent(outboundOrderId)}/packing-lists`,
    'POST',
    {},
    '生成装箱单失败'
  ).then(mapPackingList)
}

export function loadPackingLists(outboundOrderId: string) {
  return getJson<ApiPackingList[]>(
    `/api/warehouse/dispatch/outbound-orders/${encodeURIComponent(outboundOrderId)}/packing-lists`,
    '读取装箱单失败'
  ).then((packingLists) => packingLists.map(mapPackingList))
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
  const siteCode = normalizeSiteCode(item.targetSiteCode || item.siteCode)
  const targetTransportMode = normalizeTransportMode(item.targetTransportMode)
  const fulfillmentType = normalizeFulfillmentType(item.fulfillmentType)
  const specStatus = normalizeSpecStatus(item.specStatus)
  const psku = item.partnerSku || ''
  const title = item.productTitle || psku || item.skuParent || ''
  const sourceStoreKey = Array.from(
    new Set((item.sources || []).map((source) => source.sourceStoreCode).filter(Boolean))
  ).sort().join('+')
  const productKey = item.partnerSku ? `psku:${item.partnerSku}` : `legacy:${item.productVariantId || item.skuParent || ''}`
  const rowId = ['ready', sourceStoreKey || 'store', productKey, siteCode, fulfillmentType, specStatus].join('__')
  const sourceItems = (item.sources || []).map((source) => {
    const availableQty = Number(source.availableQuantity || 0)
    const originalSiteCode = normalizeSiteCode(source.siteCode || item.siteCode)
    const originalTransportMode = normalizeTransportMode(source.plannedTransportMode)
    const sourceTargetSiteCode = normalizeSiteCode(source.targetSiteCode || item.targetSiteCode || source.siteCode || item.siteCode)
    const sourceTargetTransportMode = normalizeTransportMode(
      source.targetTransportMode || item.targetTransportMode || source.plannedTransportMode
    )
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
      siteCode: sourceTargetSiteCode,
      transportMode: sourceTargetTransportMode,
      fulfillmentType,
      expectedQty: 0,
      receivedQty: availableQty,
      plannedQty: 0,
      specStatus,
      availableQty,
      fulfillmentBalanceId: source.fulfillmentBalanceId,
      originalSiteCode,
      originalTransportMode,
      targetSiteCode: sourceTargetSiteCode,
      targetTransportMode: sourceTargetTransportMode,
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
    transportMode: sourceItems.length ? inferDominantTransport(sourceItems) : targetTransportMode,
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
    lines: (plan.lines || []).map(mapDispatchPlanLine),
    currentShippingBatch: plan.currentShippingBatch ? mapShippingBatch(plan.currentShippingBatch) : undefined
  }
}

function mapDispatchPlanLine(line: ApiDispatchPlanLine): DispatchPlanLine {
  return {
    id: String(line.id || ''),
    psku: line.partnerSku || '',
    title: line.productTitle || line.partnerSku || line.skuParent || '',
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

function mapShippingBatch(batch: ApiShippingBatch): ShippingBatch {
  return {
    id: String(batch.id || ''),
    dispatchPlanId: batch.dispatchPlanId === undefined || batch.dispatchPlanId === null ? undefined : String(batch.dispatchPlanId),
    batchNo: batch.batchNo || '',
    status: batch.status || '',
    selectedOptionId: batch.selectedOptionId ? String(batch.selectedOptionId) : undefined,
    sourceCount: Number(batch.sourceCount || 0),
    skuCount: Number(batch.skuCount || 0),
    totalQuantity: Number(batch.totalQuantity || 0),
    optionCount: Number(batch.optionCount ?? batch.options?.length ?? 0),
    actualWeightKg: optionalNumber(batch.actualWeightKg),
    volumeCbm: optionalNumber(batch.volumeCbm),
    remark: batch.remark,
    createdAt: batch.createdAt || '',
    updatedAt: batch.updatedAt,
    sources: (batch.sources || []).map(mapShippingBatchSource),
    options: (batch.options || []).map(mapShippingSuggestionOption)
  }
}

function mapShippingBatchSource(source: ApiShippingBatchSource): ShippingBatchSource {
  const psku = source.partnerSku || ''
  return {
    id: String(source.id || source.fulfillmentBalanceId || ''),
    fulfillmentBalanceId: source.fulfillmentBalanceId,
    storeCode: source.sourceStoreCode,
    storeName: source.sourceStoreName || '',
    orderNo: source.purchaseOrderNo || '',
    psku,
    title: source.productTitle || psku || source.skuParent || '',
    imageUrl: source.productImageUrl,
    siteCode: normalizeSiteCode(source.siteCode),
    transportMode: normalizeTransportMode(source.plannedTransportMode),
    fulfillmentType: normalizeFulfillmentType(source.fulfillmentType),
    specStatus: normalizeSpecStatus(source.specStatus),
    reservedQuantity: Number(source.reservedQuantity || 0)
  }
}

function mapShippingSuggestionOption(option: ApiShippingSuggestionOption): ShippingSuggestionOption {
  return {
    id: String(option.id || ''),
    optionName: option.optionName || option.optionType || '',
    optionType: option.optionType,
    status: option.status,
    selectedFlag: Boolean(option.selectedFlag),
    autoRecommended: Boolean(option.autoRecommended),
    targetForwarderCodes: option.targetForwarderCodes || [],
    targetForwarderNames: option.targetForwarderNames || [],
    routeCodes: option.routeCodes || [],
    totalQuantity: Number(option.totalQuantity || 0),
    airQuantity: Number(option.airQuantity || 0),
    seaQuantity: Number(option.seaQuantity || 0),
    specMissingCount: Number(option.specMissingCount || 0),
    warningCount: Number(option.warningCount || 0),
    actualWeightKg: optionalNumber(option.actualWeightKg),
    volumeCbm: optionalNumber(option.volumeCbm),
    chargeableWeightKg: optionalNumber(option.chargeableWeightKg),
    estimatedTotalAmount: optionalNumber(option.estimatedTotalAmount),
    avgUnitAmount: optionalNumber(option.avgUnitAmount),
    currency: option.currency,
    blockedReasons: option.blockedReasons || [],
    costComponents: (option.costComponents || []).map(mapShippingCostComponent),
    lines: (option.lines || []).map(mapShippingSuggestionLine)
  }
}

function mapShippingCostComponent(component: ApiShippingCostComponent): ShippingCostComponent {
  return {
    componentType: component.componentType,
    componentName: component.componentName || component.componentType || '其他费用',
    sourceTable: component.sourceTable,
    sourceId: component.sourceId === undefined || component.sourceId === null ? undefined : String(component.sourceId),
    currency: component.currency,
    unitPrice: optionalNumber(component.unitPrice),
    billingUnit: component.billingUnit,
    billableQuantity: optionalNumber(component.billableQuantity),
    amount: optionalNumber(component.amount),
    formula: component.formula,
    productLineCount: Number(component.productLineCount || 0)
  }
}

function mapShippingSuggestionLine(line: ApiShippingSuggestionLine): ShippingSuggestionLine {
  const partnerSku = line.partnerSku || ''
  return {
    id: String(line.id || ''),
    partnerSku,
    productTitle: line.productTitle || partnerSku,
    productImageUrl: line.productImageUrl,
    siteCode: normalizeSiteCode(line.siteCode),
    actualTransportMode: normalizeTransportMode(line.actualTransportMode),
    targetForwarderCode: line.targetForwarderCode,
    targetForwarderName: line.targetForwarderName,
    routeCode: line.routeCode,
    routeName: line.routeName,
    cargoCategoryName: line.cargoCategoryName,
    actualWeightKg: optionalNumber(line.actualWeightKg),
    volumeCbm: optionalNumber(line.volumeCbm),
    chargeableWeightKg: optionalNumber(line.chargeableWeightKg),
    rawBillableQuantity: optionalNumber(line.rawBillableQuantity),
    minimumBillableUnit: optionalNumber(line.minimumBillableUnit),
    billableQuantity: optionalNumber(line.billableQuantity),
    billingUnit: line.billingUnit,
    freightAmount: optionalNumber(line.freightAmount),
    estimatedAmount: optionalNumber(line.estimatedAmount),
    currency: line.currency,
    minimumNotMet: Boolean(line.minimumNotMet),
    quantity: Number(line.quantity || 0),
    costComponents: (line.costComponents || []).map(mapShippingCostComponent)
  }
}

function mapShippingRouteOption(option: ApiShippingRouteOption): ShippingRouteOption {
  return {
    forwarderCode: option.forwarderCode || '',
    forwarderName: option.forwarderName || option.forwarderCode || '',
    routeCode: option.routeCode || '',
    routeName: option.routeName || option.routeCode || '',
    siteCode: normalizeSiteCode(option.siteCode),
    transportMode: normalizeTransportMode(option.transportMode)
  }
}

function mapOutboundOrder(order: ApiOutboundOrder): OutboundOrder {
  return {
    id: String(order.id || ''),
    batchId: String(order.batchId || ''),
    optionId: order.optionId ? String(order.optionId) : undefined,
    outboundNo: order.outboundNo || '',
    status: order.status || '',
    originType: normalizeFulfillmentType(order.originType),
    originName: order.originName,
    skuCount: Number(order.skuCount || 0),
    totalQuantity: Number(order.totalQuantity || 0),
    remark: order.remark,
    createdAt: order.createdAt || '',
    updatedAt: order.updatedAt,
    lines: (order.lines || []).map(mapOutboundOrderLine)
  }
}

function mapOutboundOrderLine(line: ApiOutboundOrderLine): OutboundOrderLine {
  const psku = line.partnerSku || ''
  return {
    id: String(line.id || ''),
    outboundOrderId: String(line.outboundOrderId || ''),
    logicalStoreId: line.logicalStoreId == null ? undefined : String(line.logicalStoreId),
    storeCode: line.sourceStoreCode,
    storeName: line.sourceStoreName,
    psku,
    title: line.productTitle || psku || line.skuParent || '',
    imageUrl: line.productImageUrl,
    siteCode: normalizeSiteCode(line.siteCode),
    transportMode: normalizeTransportMode(line.actualTransportMode),
    fulfillmentType: normalizeFulfillmentType(line.fulfillmentType),
    specStatus: normalizeSpecStatus(line.specStatus),
    quantity: Number(line.quantity || 0),
    packedQuantity: Number(line.packedQuantity || 0),
    sources: (line.sources || []).map(mapOutboundOrderLineSource)
  }
}

function mapOutboundOrderLineSource(source: ApiOutboundOrderLineSource): OutboundOrderLineSource {
  return {
    id: String(source.id || ''),
    outboundOrderId: String(source.outboundOrderId || ''),
    outboundOrderLineId: String(source.outboundOrderLineId || ''),
    batchSourceId: source.batchSourceId == null ? undefined : String(source.batchSourceId),
    fulfillmentBalanceId: source.fulfillmentBalanceId == null ? undefined : String(source.fulfillmentBalanceId),
    sourceStoreCode: source.sourceStoreCode,
    sourceStoreName: source.sourceStoreName,
    purchaseOrderId: source.purchaseOrderId == null ? undefined : String(source.purchaseOrderId),
    purchaseOrderNo: source.purchaseOrderNo,
    purchaseOrderTitle: source.purchaseOrderTitle,
    purchaseOrderItemId: source.purchaseOrderItemId == null ? undefined : String(source.purchaseOrderItemId),
    purchaseOrderItemSiteId: source.purchaseOrderItemSiteId == null ? undefined : String(source.purchaseOrderItemSiteId),
    plannedTransportMode: normalizeTransportMode(source.plannedTransportMode),
    quantity: Number(source.quantity || 0)
  }
}

function mapPackingList(packingList: ApiPackingList): PackingList {
  return {
    id: String(packingList.id || ''),
    outboundOrderId: String(packingList.outboundOrderId || ''),
    packingNo: packingList.packingNo || '',
    status: packingList.status || '',
    boxCount: Number(packingList.boxCount || 0),
    packedQuantity: Number(packingList.packedQuantity || 0),
    grossWeightKg: packingList.grossWeightKg,
    volumeCbm: packingList.volumeCbm,
    remark: packingList.remark,
    createdAt: packingList.createdAt || '',
    updatedAt: packingList.updatedAt,
    boxes: (packingList.boxes || []).map(mapPackingBox)
  }
}

function mapPackingBox(box: ApiPackingBox): PackingBox {
  return {
    id: String(box.id || ''),
    packingListId: String(box.packingListId || ''),
    outboundOrderId: String(box.outboundOrderId || ''),
    boxNo: box.boxNo || '',
    status: box.status || 'DRAFT',
    lengthCm: box.lengthCm,
    widthCm: box.widthCm,
    heightCm: box.heightCm,
    grossWeightKg: box.grossWeightKg,
    quantity: Number(box.quantity || 0),
    items: (box.items || []).map(mapPackingBoxItem)
  }
}

function mapPackingBoxItem(item: ApiPackingBoxItem): PackingBoxItem {
  return {
    id: String(item.id || ''),
    packingListId: String(item.packingListId || ''),
    packingBoxId: String(item.packingBoxId || ''),
    outboundOrderId: String(item.outboundOrderId || ''),
    outboundOrderLineId: String(item.outboundOrderLineId || ''),
    productVariantId: item.productVariantId == null ? undefined : String(item.productVariantId),
    partnerSku: item.partnerSku || '',
    siteCode: normalizeSiteCode(item.siteCode),
    actualTransportMode: normalizeTransportMode(item.actualTransportMode),
    quantity: Number(item.quantity || 0)
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

function optionalNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
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
