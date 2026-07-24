import type {
  OutboundOrder,
  OutboundOrderLine,
  OutboundOrderLineSource,
  PackingBox,
  PackingBoxItem,
  PackingList,
  ShippingBatch,
  ShippingBatchSource,
  ShippingCostComponent,
  ShippingSuggestionLine,
  ShippingSuggestionOption
} from './types'
import type {
  ApiOutboundOrder,
  ApiOutboundOrderLine,
  ApiOutboundOrderLineSource,
  ApiPackingBox,
  ApiPackingBoxItem,
  ApiPackingList,
  ApiShippingBatch,
  ApiShippingBatchSource,
  ApiShippingCostComponent,
  ApiShippingSuggestionLine,
  ApiShippingSuggestionOption
} from './shippingApiTypes'
import {
  normalizeFulfillmentType,
  normalizeSiteCode,
  normalizeSpecStatus,
  normalizeTransportMode,
  optionalNumber
} from './apiNormalizers'

export function mapShippingBatch(batch: ApiShippingBatch): ShippingBatch {
  return {
    id: String(batch.id || ''),
    dispatchPlanId: batch.dispatchPlanId == null ? undefined : String(batch.dispatchPlanId),
    batchNo: batch.batchNo || '',
    status: batch.status || '',
    selectedOptionId: batch.selectedOptionId ? String(batch.selectedOptionId) : undefined,
    sourceCount: Number(batch.sourceCount || 0),
    skuCount: Number(batch.skuCount || 0),
    totalQuantity: Number(batch.totalQuantity || 0),
    siteCodes: (batch.siteCodes || []).map(normalizeSiteCode),
    transportModes: (batch.transportModes || []).map(normalizeTransportMode),
    optionCount: Number(batch.optionCount ?? batch.options?.length ?? 0),
    packingListCount: Number(batch.packingListCount || 0),
    boxCount: Number(batch.boxCount || 0),
    packedQuantity: Number(batch.packedQuantity || 0),
    grossWeightKg: optionalNumber(batch.grossWeightKg),
    actualWeightKg: optionalNumber(batch.actualWeightKg),
    volumeCbm: optionalNumber(batch.volumeCbm),
    remark: batch.remark,
    createdAt: batch.createdAt || '',
    updatedAt: batch.updatedAt,
    sources: (batch.sources || []).map(mapShippingBatchSource),
    options: (batch.options || []).map(mapShippingSuggestionOption)
  }
}

export function mapOutboundOrder(order: ApiOutboundOrder): OutboundOrder {
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

export function mapPackingList(packingList: ApiPackingList): PackingList {
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
    sourceId: component.sourceId == null ? undefined : String(component.sourceId),
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

function mapOutboundOrderLine(line: ApiOutboundOrderLine): OutboundOrderLine {
  const psku = line.partnerSku || ''
  return {
    id: String(line.id || ''),
    outboundOrderId: String(line.outboundOrderId || ''),
    optionLineId: line.optionLineId == null ? undefined : String(line.optionLineId),
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
    targetForwarderCode: line.targetForwarderCode,
    targetForwarderName: line.targetForwarderName,
    routeCode: line.routeCode,
    routeName: line.routeName,
    cargoCategoryCode: line.cargoCategoryCode,
    cargoCategoryName: line.cargoCategoryName,
    packingGroupCode: line.packingGroupCode,
    packingGroupName: line.packingGroupName,
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
    purchaseOrderItemSiteId: source.purchaseOrderItemSiteId == null
      ? undefined
      : String(source.purchaseOrderItemSiteId),
    plannedTransportMode: normalizeTransportMode(source.plannedTransportMode),
    quantity: Number(source.quantity || 0)
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
