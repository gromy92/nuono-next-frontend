import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  DispatchPlan,
  DispatchPlanLine,
  DispatchPlanSource,
  DispatchPlanStatus,
  OutboundOrder,
  OutboundOrderLine,
  OutboundOrderStatus,
  PackingList,
  PackingListStatus,
  ProductSpecStatus,
  PurchaseOrderLogisticsComparison,
  PurchaseOrderLogisticsSegment,
  PurchaseReceiptItem,
  PurchaseReceiptOrder,
  ReadyShipmentItem,
  ShippingBatch,
  ShippingBatchSource,
  ShippingBatchStatus,
  ShippingEvaluationStatus,
  ShippingForwarderPlanType,
  ShippingOptionStatus,
  ShippingOptionType,
  ShippingSuggestionLine,
  ShippingSuggestionLineSource,
  ShippingSuggestionOption,
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

type CreateShippingBatchPayload = {
  remark?: string
  sources: Array<{
    fulfillmentBalanceId: number
    quantity: number
  }>
}

type CreateShippingTargetOptionPayload = {
  optionName?: string
  airForwarderCode: string
  seaForwarderCode: string
}

type ApiPurchaseReceiptOrder = Omit<PurchaseReceiptOrder, 'items'> & {
  storeCode?: string
  items?: ApiPurchaseReceiptItem[]
}

type ApiPurchaseReceiptItem = Omit<PurchaseReceiptItem, 'siteCode' | 'transportMode' | 'specStatus' | 'fulfillmentType'> & {
  storeCode?: string
  productTitleCn?: string
  titleZh?: string
  chineseTitle?: string
  newProduct?: boolean | number | string
  newProductFlag?: boolean | number | string
  isNew?: boolean | number | string
  siteCode?: string
  transportMode?: string
  specStatus?: string
  fulfillmentType?: string
}

type ApiReadyItem = {
  productVariantId?: number | string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productTitleCn?: string
  titleCn?: string
  titleZh?: string
  chineseTitle?: string
  productImageUrl?: string
  siteCode?: string
  fulfillmentType?: string
  specStatus?: string
  isNewProduct?: boolean | number | string
  newProduct?: boolean | number | string
  newProductFlag?: boolean | number | string
  manualConfirmRequired?: boolean | number | string
  requiresManualConfirm?: boolean | number | string
  logisticsManualConfirmRequired?: boolean | number | string
  availableQuantity?: number
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

type ApiShippingBatch = {
  id?: string
  batchNo?: string
  status?: string
  selectedOptionId?: string
  sourceCount?: number
  skuCount?: number
  totalQuantity?: number
  createdAt?: string
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
  sourcePartyName?: string
  specStatus?: string
  productLengthCm?: number | string
  productWidthCm?: number | string
  productHeightCm?: number | string
  productWeightG?: number | string
  logisticsProfileStatus?: string
  sensitiveFlag?: boolean | number | string
  sensitiveReasons?: string[]
  reservedQuantity?: number
}

type ApiShippingSuggestionOption = {
  id?: string
  optionType?: string
  optionName?: string
  status?: string
  selectedFlag?: boolean
  score?: number
  skuCount?: number
  totalQuantity?: number
  airQuantity?: number
  seaQuantity?: number
  specMissingCount?: number
  warningCount?: number
  forwarderPlanType?: string
  autoRecommended?: boolean
  targetForwarderCodes?: string[]
  targetForwarderNames?: string[]
  routeCodes?: string[]
  evaluationStatus?: string
  blockedReasons?: string[]
  actualWeightKg?: number | string
  volumeCbm?: number | string
  chargeableWeightKg?: number | string
  estimatedTotalAmount?: number | string
  avgUnitAmount?: number | string
  currency?: string
  lines?: ApiShippingSuggestionLine[]
}

type ApiShippingSuggestionLine = {
  id?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  fulfillmentType?: string
  sourcePartyName?: string
  specStatus?: string
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  quoteCargoCategoryCode?: string
  quoteCargoCategoryName?: string
  cargoCategoryReviewRequired?: boolean | number | string
  actualWeightKg?: number | string
  volumeCbm?: number | string
  chargeableWeightKg?: number | string
  estimatedAmount?: number | string
  currency?: string
  quantity?: number
  sources?: ApiShippingSuggestionLineSource[]
}

type ApiShippingSuggestionLineSource = {
  id?: string
  batchSourceId?: number
  fulfillmentBalanceId?: number
  plannedTransportMode?: string
  quantity?: number
}

type ApiPurchaseOrderLogisticsComparison = {
  purchaseOrderId?: string
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  sourceStoreCode?: string
  sourceStoreName?: string
  skuCount?: number
  totalQuantity?: number
  quantityBasis?: string
  quantityBasisLabel?: string
  fulfillmentReadinessNote?: string
  actualWeightKg?: number | string
  volumeCbm?: number | string
  recommendedOptionId?: string
  recommendedOptionName?: string
  recommendedEstimatedAmount?: number | string
  currency?: string
  defects?: string[]
  missingPlanSuggestions?: string[]
  segments?: ApiPurchaseOrderLogisticsSegment[]
}

type ApiPurchaseOrderLogisticsSegment = {
  segmentKey?: string
  siteCode?: string
  plannedTransportMode?: string
  skuCount?: number
  totalQuantity?: number
  quantityBasis?: string
  quantityBasisLabel?: string
  actualWeightKg?: number | string
  volumeCbm?: number | string
  recommendedOptionId?: string
  recommendedOptionName?: string
  recommendedEstimatedAmount?: number | string
  currency?: string
  defects?: string[]
  missingPlanSuggestions?: string[]
  options?: ApiShippingSuggestionOption[]
}

type ApiOutboundOrder = {
  id?: string
  outboundNo?: string
  status?: string
  originType?: string
  originName?: string
  skuCount?: number
  totalQuantity?: number
  lines?: ApiOutboundOrderLine[]
}

type ApiOutboundOrderLine = {
  id?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  siteCode?: string
  actualTransportMode?: string
  fulfillmentType?: string
  sourcePartyName?: string
  quantity?: number
  packedQuantity?: number
}

type ApiPackingList = {
  id?: string
  outboundOrderId?: number
  packingNo?: string
  status?: string
  boxCount?: number
  packedQuantity?: number
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

export function loadPurchaseOrderLogisticsComparisons(limit = 10) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  return getJson<ApiPurchaseOrderLogisticsComparison[]>(
    `/api/warehouse/dispatch/purchase-order-logistics-comparisons?${params.toString()}`,
    '读取采购单物流比价失败'
  ).then((comparisons) => comparisons.map(mapPurchaseOrderLogisticsComparison))
}

export function loadDispatchPlans() {
  return getJson<ApiDispatchPlan[]>('/api/warehouse/dispatch/dispatch-plans', '读取发运计划失败')
    .then((plans) => plans.map(mapDispatchPlan))
}

export function loadShippingBatches() {
  return getJson<ApiShippingBatch[]>('/api/warehouse/dispatch/shipping-batches', '读取货运计划失败')
    .then((batches) => batches.map(mapShippingBatch))
}

export function loadShippingBatch(batchId: string) {
  return getJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}`,
    '读取货运计划详情失败'
  ).then(mapShippingBatch)
}

export function createFulfillmentConfirmation(payload: ConfirmationPayload) {
  return sendJson('/api/warehouse/dispatch/confirmations', 'POST', payload, '保存收货验收失败')
}

export function createDispatchPlan(payload: CreateDispatchPlanPayload) {
  return sendJson<ApiDispatchPlan>('/api/warehouse/dispatch/dispatch-plans', 'POST', payload, '生成发运计划失败')
    .then(mapDispatchPlan)
}

export function createShippingBatch(payload: CreateShippingBatchPayload) {
  return sendJson<ApiShippingBatch>('/api/warehouse/dispatch/shipping-batches', 'POST', payload, '生成货运计划失败')
    .then(mapShippingBatch)
}

export function createShippingTargetOption(batchId: string, payload: CreateShippingTargetOptionPayload) {
  return sendJson<ApiShippingSuggestionOption>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/options`,
    'POST',
    payload,
    '生成目标货代方案失败'
  ).then(mapShippingSuggestionOption)
}

export function selectShippingOption(batchId: string, optionId: string) {
  return sendJson<ApiShippingBatch>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/options/${encodeURIComponent(optionId)}/select`,
    'POST',
    {},
    '选择货运计划方案失败'
  ).then(mapShippingBatch)
}

export function createOutboundOrders(batchId: string) {
  return sendJson<ApiOutboundOrder[]>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/outbound-orders`,
    'POST',
    {},
    '生成出库单失败'
  ).then((orders) => orders.map(mapOutboundOrder))
}

export function loadOutboundOrders(batchId: string) {
  return getJson<ApiOutboundOrder[]>(
    `/api/warehouse/dispatch/shipping-batches/${encodeURIComponent(batchId)}/outbound-orders`,
    '读取出库单失败'
  ).then((orders) => orders.map(mapOutboundOrder))
}

export function createPackingList(outboundOrderId: string) {
  return sendJson<ApiPackingList>(
    `/api/warehouse/dispatch/outbound-orders/${encodeURIComponent(outboundOrderId)}/packing-lists`,
    'POST',
    {},
    '创建装箱单失败'
  ).then(mapPackingList)
}

export function loadPackingLists(outboundOrderId: string) {
  return getJson<ApiPackingList[]>(
    `/api/warehouse/dispatch/outbound-orders/${encodeURIComponent(outboundOrderId)}/packing-lists`,
    '读取装箱单失败'
  ).then((lists) => lists.map(mapPackingList))
}

export function markDispatchPlanReadyForLogistics(dispatchPlanId: string) {
  return sendJson<ApiDispatchPlan>(
    `/api/warehouse/dispatch/dispatch-plans/${encodeURIComponent(dispatchPlanId)}/ready-for-logistics`,
    'POST',
    {},
    '提交物流计划失败'
  ).then(mapDispatchPlan)
}

function firstApiText(...values: unknown[]) {
  for (const value of values) {
    const text = typeof value === 'string' ? value.trim() : ''
    if (text) {
      return text
    }
  }
  return undefined
}

function normalizeApiBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value === 1
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase())
  }
  return false
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
  const titleCn = firstApiText(item.titleCn, item.productTitleCn, item.titleZh, item.chineseTitle)
  return {
    ...item,
    id: String(item.id || ''),
    orderId: String(item.orderId || ''),
    orderNo: item.orderNo || '',
    storeCode: item.storeCode,
    storeName: item.storeName || '',
    psku: item.psku || '',
    title: item.title || item.psku || '',
    titleCn,
    siteCode: normalizeSiteCode(item.siteCode),
    transportMode: normalizeTransportMode(item.transportMode),
    fulfillmentType: normalizeFulfillmentType(item.fulfillmentType),
    expectedQty: Number(item.expectedQty || 0),
    receivedQty: Number(item.receivedQty || 0),
    plannedQty: Number(item.plannedQty || 0),
    specStatus: normalizeSpecStatus(item.specStatus),
    isNewProduct: normalizeApiBoolean(item.isNewProduct ?? item.newProduct ?? item.newProductFlag ?? item.isNew)
  }
}

function mapReadyItem(item: ApiReadyItem): ReadyShipmentRow {
  const siteCode = normalizeSiteCode(item.siteCode)
  const fulfillmentType = normalizeFulfillmentType(item.fulfillmentType)
  const specStatus = normalizeSpecStatus(item.specStatus)
  const psku = item.partnerSku || item.skuParent || ''
  const productVariantId = normalizeOptionalNumber(item.productVariantId)
  const title = item.productTitle || psku
  const titleCn = firstApiText(item.titleCn, item.productTitleCn, item.titleZh, item.chineseTitle)
  const isNewProduct = normalizeApiBoolean(item.isNewProduct ?? item.newProduct ?? item.newProductFlag)
  const manualConfirmRequired = normalizeApiBoolean(
    item.manualConfirmRequired ?? item.requiresManualConfirm ?? item.logisticsManualConfirmRequired
  )
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
      productVariantId,
      skuParent: item.skuParent,
      title,
      titleCn,
      imageUrl: item.productImageUrl,
      siteCode,
      transportMode: normalizeTransportMode(source.plannedTransportMode),
      fulfillmentType,
      expectedQty: 0,
      receivedQty: availableQty,
      plannedQty: 0,
      specStatus,
      isNewProduct,
      manualConfirmRequired,
      availableQty,
      fulfillmentBalanceId: source.fulfillmentBalanceId
    }
  })
  return {
    id: rowId,
    orderId: '',
    orderNo: '',
    storeName: '',
    psku,
    productVariantId,
    skuParent: item.skuParent,
    title,
    titleCn,
    imageUrl: item.productImageUrl,
    siteCode,
    transportMode: inferDominantTransport(sourceItems),
    fulfillmentType,
    expectedQty: 0,
    receivedQty: Number(item.availableQuantity || 0),
    plannedQty: 0,
    specStatus,
    isNewProduct,
    manualConfirmRequired,
    availableQty: Number(item.availableQuantity || 0),
    items: sourceItems
  }
}

function normalizeOptionalNumber(value: number | string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
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

function mapShippingBatch(batch: ApiShippingBatch): ShippingBatch {
  return {
    id: String(batch.id || ''),
    batchNo: batch.batchNo || '',
    status: normalizeShippingBatchStatus(batch.status),
    selectedOptionId: batch.selectedOptionId,
    sourceCount: Number(batch.sourceCount || 0),
    skuCount: Number(batch.skuCount || 0),
    totalQuantity: Number(batch.totalQuantity || 0),
    createdAt: batch.createdAt,
    sources: (batch.sources || []).map(mapShippingBatchSource),
    options: (batch.options || []).map(mapShippingSuggestionOption)
  }
}

function mapShippingBatchSource(source: ApiShippingBatchSource): ShippingBatchSource {
  return {
    id: String(source.id || source.fulfillmentBalanceId || ''),
    fulfillmentBalanceId: source.fulfillmentBalanceId,
    orderNo: source.purchaseOrderNo || '',
    storeCode: source.sourceStoreCode,
    storeName: source.sourceStoreName || '',
    psku: source.partnerSku || source.skuParent || '',
    title: source.productTitle || source.partnerSku || '',
    siteCode: normalizeSiteCode(source.siteCode),
    plannedTransportMode: normalizeTransportMode(source.plannedTransportMode),
    fulfillmentType: normalizeFulfillmentType(source.fulfillmentType),
    sourcePartyName: source.sourcePartyName,
    specStatus: normalizeSpecStatus(source.specStatus),
    productLengthCm: normalizeOptionalNumber(source.productLengthCm),
    productWidthCm: normalizeOptionalNumber(source.productWidthCm),
    productHeightCm: normalizeOptionalNumber(source.productHeightCm),
    productWeightG: normalizeOptionalNumber(source.productWeightG),
    logisticsProfileStatus: source.logisticsProfileStatus,
    sensitiveFlag: normalizeApiBoolean(source.sensitiveFlag),
    sensitiveReasons: normalizeStringArray(source.sensitiveReasons),
    reservedQuantity: Number(source.reservedQuantity || 0)
  }
}

function mapShippingSuggestionOption(option: ApiShippingSuggestionOption): ShippingSuggestionOption {
  return {
    id: String(option.id || ''),
    optionType: normalizeShippingOptionType(option.optionType),
    optionName: option.optionName || option.optionType || '',
    status: normalizeShippingOptionStatus(option.status),
    selectedFlag: Boolean(option.selectedFlag),
    score: Number(option.score || 0),
    skuCount: Number(option.skuCount || 0),
    totalQuantity: Number(option.totalQuantity || 0),
    airQuantity: Number(option.airQuantity || 0),
    seaQuantity: Number(option.seaQuantity || 0),
    specMissingCount: Number(option.specMissingCount || 0),
    warningCount: Number(option.warningCount || 0),
    forwarderPlanType: normalizeShippingForwarderPlanType(option.forwarderPlanType),
    autoRecommended: normalizeApiBoolean(option.autoRecommended),
    targetForwarderCodes: normalizeStringArray(option.targetForwarderCodes),
    targetForwarderNames: normalizeStringArray(option.targetForwarderNames),
    routeCodes: normalizeStringArray(option.routeCodes),
    evaluationStatus: normalizeShippingEvaluationStatus(option.evaluationStatus),
    blockedReasons: normalizeStringArray(option.blockedReasons),
    actualWeightKg: normalizeOptionalNumber(option.actualWeightKg),
    volumeCbm: normalizeOptionalNumber(option.volumeCbm),
    chargeableWeightKg: normalizeOptionalNumber(option.chargeableWeightKg),
    estimatedTotalAmount: normalizeOptionalNumber(option.estimatedTotalAmount),
    avgUnitAmount: normalizeOptionalNumber(option.avgUnitAmount),
    currency: option.currency,
    lines: (option.lines || []).map(mapShippingSuggestionLine)
  }
}

function mapShippingSuggestionLine(line: ApiShippingSuggestionLine): ShippingSuggestionLine {
  return {
    id: String(line.id || ''),
    psku: line.partnerSku || line.skuParent || '',
    title: line.productTitle || line.partnerSku || '',
    imageUrl: line.productImageUrl,
    siteCode: normalizeSiteCode(line.siteCode),
    actualTransportMode: normalizeTransportMode(line.actualTransportMode),
    fulfillmentType: normalizeFulfillmentType(line.fulfillmentType),
    sourcePartyName: line.sourcePartyName,
    specStatus: normalizeSpecStatus(line.specStatus),
    targetForwarderCode: line.targetForwarderCode,
    targetForwarderName: line.targetForwarderName,
    routeCode: line.routeCode,
    routeName: line.routeName,
    cargoCategoryCode: line.cargoCategoryCode,
    cargoCategoryName: line.cargoCategoryName,
    quoteCargoCategoryCode: line.quoteCargoCategoryCode,
    quoteCargoCategoryName: line.quoteCargoCategoryName,
    cargoCategoryReviewRequired: normalizeOptionalBoolean(line.cargoCategoryReviewRequired),
    actualWeightKg: normalizeOptionalNumber(line.actualWeightKg),
    volumeCbm: normalizeOptionalNumber(line.volumeCbm),
    chargeableWeightKg: normalizeOptionalNumber(line.chargeableWeightKg),
    estimatedAmount: normalizeOptionalNumber(line.estimatedAmount),
    currency: line.currency,
    quantity: Number(line.quantity || 0),
    sources: (line.sources || []).map(mapShippingSuggestionLineSource)
  }
}

function normalizeOptionalBoolean(value: boolean | number | string | undefined): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return value === 'true' || value === '1'
}

function mapShippingSuggestionLineSource(source: ApiShippingSuggestionLineSource): ShippingSuggestionLineSource {
  return {
    id: String(source.id || source.batchSourceId || source.fulfillmentBalanceId || ''),
    batchSourceId: source.batchSourceId,
    fulfillmentBalanceId: source.fulfillmentBalanceId,
    plannedTransportMode: normalizeTransportMode(source.plannedTransportMode),
    quantity: Number(source.quantity || 0)
  }
}

function mapPurchaseOrderLogisticsComparison(
  comparison: ApiPurchaseOrderLogisticsComparison
): PurchaseOrderLogisticsComparison {
  return {
    purchaseOrderId: String(comparison.purchaseOrderId || ''),
    purchaseOrderNo: comparison.purchaseOrderNo,
    purchaseOrderTitle: comparison.purchaseOrderTitle,
    sourceStoreCode: comparison.sourceStoreCode,
    sourceStoreName: comparison.sourceStoreName,
    skuCount: Number(comparison.skuCount || 0),
    totalQuantity: Number(comparison.totalQuantity || 0),
    quantityBasis: comparison.quantityBasis,
    quantityBasisLabel: comparison.quantityBasisLabel,
    fulfillmentReadinessNote: comparison.fulfillmentReadinessNote,
    actualWeightKg: normalizeOptionalNumber(comparison.actualWeightKg),
    volumeCbm: normalizeOptionalNumber(comparison.volumeCbm),
    recommendedOptionId: comparison.recommendedOptionId,
    recommendedOptionName: comparison.recommendedOptionName,
    recommendedEstimatedAmount: normalizeOptionalNumber(comparison.recommendedEstimatedAmount),
    currency: comparison.currency,
    defects: comparison.defects || [],
    missingPlanSuggestions: comparison.missingPlanSuggestions || [],
    segments: (comparison.segments || []).map(mapPurchaseOrderLogisticsSegment)
  }
}

function mapPurchaseOrderLogisticsSegment(segment: ApiPurchaseOrderLogisticsSegment): PurchaseOrderLogisticsSegment {
  return {
    segmentKey: segment.segmentKey || `${normalizeSiteCode(segment.siteCode)}|${normalizeTransportMode(segment.plannedTransportMode)}`,
    siteCode: normalizeSiteCode(segment.siteCode),
    plannedTransportMode: normalizeTransportMode(segment.plannedTransportMode),
    skuCount: Number(segment.skuCount || 0),
    totalQuantity: Number(segment.totalQuantity || 0),
    quantityBasis: segment.quantityBasis,
    quantityBasisLabel: segment.quantityBasisLabel,
    actualWeightKg: normalizeOptionalNumber(segment.actualWeightKg),
    volumeCbm: normalizeOptionalNumber(segment.volumeCbm),
    recommendedOptionId: segment.recommendedOptionId,
    recommendedOptionName: segment.recommendedOptionName,
    recommendedEstimatedAmount: normalizeOptionalNumber(segment.recommendedEstimatedAmount),
    currency: segment.currency,
    defects: segment.defects || [],
    missingPlanSuggestions: segment.missingPlanSuggestions || [],
    options: (segment.options || []).map(mapShippingSuggestionOption)
  }
}

function mapOutboundOrder(order: ApiOutboundOrder): OutboundOrder {
  return {
    id: String(order.id || ''),
    outboundNo: order.outboundNo || '',
    status: normalizeOutboundOrderStatus(order.status),
    originType: normalizeFulfillmentType(order.originType),
    originName: order.originName,
    skuCount: Number(order.skuCount || 0),
    totalQuantity: Number(order.totalQuantity || 0),
    lines: (order.lines || []).map(mapOutboundOrderLine)
  }
}

function mapOutboundOrderLine(line: ApiOutboundOrderLine): OutboundOrderLine {
  return {
    id: String(line.id || ''),
    psku: line.partnerSku || line.skuParent || '',
    title: line.productTitle || line.partnerSku || '',
    siteCode: normalizeSiteCode(line.siteCode),
    actualTransportMode: normalizeTransportMode(line.actualTransportMode),
    fulfillmentType: normalizeFulfillmentType(line.fulfillmentType),
    sourcePartyName: line.sourcePartyName,
    quantity: Number(line.quantity || 0),
    packedQuantity: Number(line.packedQuantity || 0)
  }
}

function mapPackingList(list: ApiPackingList): PackingList {
  return {
    id: String(list.id || ''),
    outboundOrderId: Number(list.outboundOrderId || 0),
    packingNo: list.packingNo || '',
    status: normalizePackingListStatus(list.status),
    boxCount: Number(list.boxCount || 0),
    packedQuantity: Number(list.packedQuantity || 0)
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
  if (!normalized || normalized === 'UNSPECIFIED') {
    return 'UNSPECIFIED'
  }
  return normalized === 'AIR' ? 'AIR' : 'UNSPECIFIED'
}

function normalizeFulfillmentType(value?: string): WarehouseFulfillmentType {
  return String(value || '').toUpperCase() === 'FACTORY_DIRECT' ? 'FACTORY_DIRECT' : 'WAREHOUSE_RECEIPT'
}

function normalizeSpecStatus(value?: string): ProductSpecStatus {
  const normalized = String(value || '').toUpperCase()
  return normalized === 'SPEC_MISSING' || normalized === 'MISSING' ? 'missing' : 'complete'
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

function normalizeShippingBatchStatus(value?: string): ShippingBatchStatus {
  switch (String(value || '').toUpperCase()) {
    case 'OPTION_SELECTED':
      return 'option_selected'
    case 'OUTBOUND_CREATED':
      return 'outbound_created'
    case 'PACKING':
      return 'packing'
    case 'PACKED':
      return 'packed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'draft'
  }
}

function normalizeShippingOptionType(value?: string): ShippingOptionType {
  const normalized = String(value || '').toUpperCase()
  if (['AUTO_RECOMMEND', 'FORWARDER_ET', 'FORWARDER_ZD', 'COMBINATION_ZD_YT', 'COMBINATION_ET_ZD', 'CUSTOM'].includes(normalized)) {
    return normalized as ShippingOptionType
  }
  return 'CUSTOM'
}

function normalizeShippingForwarderPlanType(value?: string): ShippingForwarderPlanType {
  const normalized = String(value || '').toUpperCase()
  if (['AUTO', 'SINGLE', 'COMBINATION', 'CUSTOM'].includes(normalized)) {
    return normalized as ShippingForwarderPlanType
  }
  return 'SINGLE'
}

function normalizeShippingEvaluationStatus(value?: string): ShippingEvaluationStatus {
  switch (String(value || '').toUpperCase()) {
    case 'READY':
      return 'ready'
    case 'NEEDS_REVIEW':
      return 'needs_review'
    case 'BLOCKED':
      return 'blocked'
    default:
      return 'pending'
  }
}

function normalizeStringArray(value?: string[]) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []
}

function normalizeShippingOptionStatus(value?: string): ShippingOptionStatus {
  return String(value || '').toUpperCase() === 'SELECTED' ? 'selected' : 'candidate'
}

function normalizeOutboundOrderStatus(value?: string): OutboundOrderStatus {
  switch (String(value || '').toUpperCase()) {
    case 'PACKING':
      return 'packing'
    case 'PACKED':
      return 'packed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'draft'
  }
}

function normalizePackingListStatus(value?: string): PackingListStatus {
  switch (String(value || '').toUpperCase()) {
    case 'CONFIRMED':
      return 'confirmed'
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
  if (airQty > 0) {
    return 'AIR'
  }
  return 'UNSPECIFIED'
}
